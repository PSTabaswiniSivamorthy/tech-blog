const Post = require("../models/postModel");
const User = require("../models/userModel");
const { get } = require("mongoose");
const bcrypt = require("bcryptjs");
const HttpError = require("../models/errorModel");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const PostVersion = require("../models/postVersionModel");
const {
  cacheSet,
  cacheGet,
  cacheDeleteByPrefix,
} = require("../utils/cacheClient");

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const SUMMARY_CACHE_TTL_MS =
  (Number(process.env.SUMMARY_CACHE_TTL_SECONDS) || 3600) * 1000;
const AI_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 30000;
const summaryCache = new Map();

const normalizeCategory = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

// =================== MULTI-PROVIDER AI HELPERS ===================
// Provider order: Gemini (free tier) → OpenAI (optional backup) → Local fallback

const tryGeminiDraft = async ({ topic, category, tone }) => {
  if (!gemini)
    return { draft: null, error: "gemini_not_configured" };

  try {
    console.log("🟡 Attempting Gemini draft generation with model:", GEMINI_MODEL);
    
    // List of model names to try (most likely first)
    const modelNames = [
      GEMINI_MODEL,
      "models/gemini-2.5-pro",
      "models/gemini-2.0-flash",
      "models/gemini-pro-latest"
    ];

    for (const modelName of modelNames) {
      try {
        const model = gemini.getGenerativeModel({ model: modelName });
        const prompt = `Generate a complete technical blog draft in JSON format with "title" and "description" (HTML) fields. 
Topic: ${topic}
Category: ${category}
Tone: ${tone}`;

        const response = await Promise.race([
          model.generateContent(prompt),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), AI_TIMEOUT_MS)
          ),
        ]);

        const content = response.response.text();
        if (!content) {
          console.log(`⚠️ Model ${modelName} returned empty`);
          continue;
        }

        const parsed = JSON.parse(content);
        console.log(`✅ Gemini draft generation successful with model: ${modelName}`);
        return { draft: parsed, provider: "gemini" };
      } catch (modelError) {
        console.log(`⚠️ Model ${modelName} failed:`, modelError.message);
        if (modelName === modelNames[modelNames.length - 1]) {
          throw modelError;
        }
        continue;
      }
    }
  } catch (error) {
    const errorCode = error.message?.includes("429") ? "gemini_rate_limit" : "gemini_failed";
    return { draft: null, error: errorCode };
  }
};



const tryGeminiSummarize = async (content) => {
  if (!gemini) {
    console.error("🔴 Gemini not configured (GEMINI_API_KEY missing)");
    return { summary: null, error: "gemini_not_configured" };
  }

  try {
    console.log("🟡 Attempting Gemini summarize with model:", GEMINI_MODEL);
    
    // List of model names to try (most likely first)
    const modelNames = [
      GEMINI_MODEL,
      "models/gemini-2.5-pro",
      "models/gemini-2.0-flash",
      "models/gemini-pro-latest"
    ];

    for (const modelName of modelNames) {
      try {
        const model = gemini.getGenerativeModel({ model: modelName });
        const prompt = `Summarize this blog content into a concise 3-4 line TL;DR:\n\n${content}`;

        const response = await Promise.race([
          model.generateContent(prompt),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), AI_TIMEOUT_MS)
          ),
        ]);

        const summary = response.response.text().trim();
        if (!summary) {
          console.error("🔴 Gemini returned empty response");
          continue;
        }

        console.log(`✅ Gemini summarization successful with model: ${modelName}`);
        return { summary, provider: "gemini" };
      } catch (modelError) {
        console.log(`⚠️ Model ${modelName} failed:`, modelError.message);
        if (modelName === modelNames[modelNames.length - 1]) {
          throw modelError; // Re-throw on last attempt
        }
        continue; // Try next model
      }
    }
  } catch (error) {
    console.error("🔴 Gemini error (all models tried):", error.message);
    const errorCode = 
      error.message?.includes("429") ? "gemini_rate_limit" : 
      error.message?.includes("401") ? "gemini_invalid_key" : 
      error.message?.includes("404") ? "gemini_model_not_found" :
      "gemini_failed";
    return { summary: null, error: errorCode };
  }
};

// =================== END MULTI-PROVIDER HELPERS ===================

// =================== LOCAL SUMMARIZATION HELPER ===================
const generateLocalSummary = (content) => {
  try {
    // Extract text from HTML
    const text = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    
    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length === 0) return text.slice(0, 220);
    
    // Extract key sentences (first 2-3 sentences or until 180 chars)
    let summary = "";
    for (const sentence of sentences) {
      if (summary.length < 180) {
        summary += sentence.trim() + " ";
      } else {
        break;
      }
    }
    
    return "TL;DR: " + summary.trim().slice(0, 220) + "...";
  } catch (error) {
    console.error("🔴 Local summarization error:", error.message);
    return content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 220) + "...";
  }
};

const generateLocalDraft = ({ topic, category, tone = "professional" }) => {
  const safeTopic = (topic || "Untitled Topic").trim();
  const safeCategory = (category || "General").trim();

  const title =
    safeTopic.length > 7
      ? `${safeTopic}: Practical Guide for ${safeCategory}`
      : `${safeCategory} Guide: ${safeTopic || "Getting Started"}`;

  const body = `
<h2>Why This Topic Matters</h2>
<p>${safeTopic} is a high-impact area in ${safeCategory}. This article explains the core ideas, common mistakes, and practical ways to apply them in projects.</p>

<h2>Core Concepts</h2>
<ul>
  <li>Define the problem clearly and break it into smaller steps.</li>
  <li>Choose tools and patterns that match the use case.</li>
  <li>Measure outcomes with simple metrics and iterate fast.</li>
</ul>

<h2>Implementation Plan</h2>
<ol>
  <li>Set up a minimal working baseline.</li>
  <li>Build one feature end-to-end before scaling.</li>
  <li>Refactor for readability, reliability, and performance.</li>
</ol>

<h2>Best Practices</h2>
<p>Keep your code modular, document key decisions, and test edge cases early. For a ${tone} writing tone, use concise explanations and practical examples.</p>

<h2>Conclusion</h2>
<p>${safeTopic} becomes easier when you focus on fundamentals and continuous improvement. Start small, validate quickly, and keep refining your approach.</p>
`.trim();

  return { title, description: body };
};

const getCachedSummary = (cacheKey) => {
  const hit = summaryCache.get(cacheKey);
  if (!hit) return null;

  if (Date.now() > hit.expiresAt) {
    summaryCache.delete(cacheKey);
    return null;
  }

  return hit.payload;
};

const setCachedSummary = (cacheKey, payload) => {
  summaryCache.set(cacheKey, {
    payload,
    expiresAt: Date.now() + SUMMARY_CACHE_TTL_MS,
  });
};

const normalizeAIErrorCode = (error) => {
  if (!error) return undefined;
  if (typeof error.code === "string" && error.code.trim()) return error.code.trim();
  if (typeof error.status === "number") return `http_${error.status}`;
  return "unknown_error";
};

const buildTextEmbedding = (text = "") => {
  const vecLength = 64;
  const vec = Array(vecLength).fill(0);
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  words.forEach((word) => {
    let hash = 0;
    for (let i = 0; i < word.length; i += 1) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % vecLength;
    vec[idx] += 1;
  });

  const norm = Math.sqrt(vec.reduce((sum, x) => sum + x * x, 0)) || 1;
  return vec.map((x) => x / norm);
};

const cosineSimilarity = (a = [], b = []) => {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const generateOpenAIDraft = async ({ topic, category, tone = "professional" }) => {
  // Try providers in order: Gemini (free) → Local fallback
  
  // 1. Try Gemini
  const geminiResult = await tryGeminiDraft({ topic, category, tone });
  if (geminiResult.draft) {
    return { draft: geminiResult.draft, provider: "gemini" };
  }

  // 2. Fall back to local generation
  console.log("⚠️ Gemini failed, using local draft generation");
  const localDraft = generateLocalDraft({ topic, category, tone });
  return {
    draft: localDraft,
    error: geminiResult.error || "gemini_failed",
  };
};

const summarizeWithOpenAI = async (content) => {
  // Try providers in order: Gemini (free) → Local intelligent fallback

  // 1. Try Gemini
  console.log("📋 Starting summarization attempt...");
  const geminiResult = await tryGeminiSummarize(content);
  if (geminiResult.summary) {
    console.log("✅ Using Gemini summary");
    return { summary: geminiResult.summary, provider: "gemini" };
  }

  // 2. Fall back to intelligent local summarization
  console.log("⚠️ Gemini failed, using intelligent local summarization");
  const localSummary = generateLocalSummary(content);
  return {
    summary: localSummary,
    error: geminiResult.error || "gemini_failed",
  };
};

//===================CREATE POST
// POST : api/posts
//PROTECTED
const createPost = async (req, res, next) => {
  try {
    let { title, category, description } = req.body;
    if (!title || !category || !description || !req.files) {
      return next(
        new HttpError("Fill in all fields and choose thumbnail.", 422)
      );
    }
    const { thumbnail } = req.files;
    if (thumbnail.size > 2000000) {
      return next(
        new HttpError("Thumbnail too big. File should be less than 2MB", 422)
      );
    }
    let fileName = thumbnail.name;
    let splittedFilename = fileName.split(".");
    let newFilename =
      splittedFilename[0] +
      uuid() +
      "." +
      splittedFilename[splittedFilename.length - 1];
    thumbnail.mv(
      path.join(__dirname, "..", "/uploads", newFilename),
      async (err) => {
        if (err) {
          return next(new HttpError(err.message, 500)); // Include a message and status code
        } else {
          const newPost = await Post.create({
            title,
            category,
            description,
            thumbnail: newFilename, // Fixed typo here
            creator: req.user.id,
          });

          const embeddingText = `${title} ${category} ${description}`;
          newPost.embedding = buildTextEmbedding(embeddingText);
          await newPost.save();

          if (!newPost) {
            return next(new HttpError("Post couldn't be created.", 422));
          }
          const currentUser = await User.findById(req.user.id);
          const userPostCount = currentUser.posts + 1;
          await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });
          await cacheDeleteByPrefix("posts:");
          res.status(201).json(newPost);
        }
      }
    );
  } catch (error) {
    return next(new HttpError(error.message, 500)); // Include a message and status code
  }
};

//===================GET POSTS
// GET : api/posts
//PROTECTED
const getPosts = async (req, res, next) => {
  try {
    const cacheKey = "posts:all";
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const posts = await Post.find().sort({ updatedAt: -1 });
    await cacheSet(cacheKey, posts, 300);
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//===================GET SINGLE POST
// GET : api/posts/:ID
//PROTECTED
const getPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const cacheKey = `posts:${postId}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const post = await Post.findById(postId);
    if (!post) {
      return next(new HttpError("Post not found.", 404));
    }

    await cacheSet(cacheKey, post, 300);
    res.status(201).json(post);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//===================ADVANCED SEARCH
// GET : api/posts/search?q=&category=&author=&from=&to=
const searchPosts = async (req, res, next) => {
  try {
    const { q = "", category, author, from, to } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (author) filters.creator = author;
    if (from || to) {
      filters.createdAt = {};
      if (from) filters.createdAt.$gte = new Date(from);
      if (to) filters.createdAt.$lte = new Date(to);
    }

    if (q.trim()) {
      const textMatches = await Post.find(
        { ...filters, $text: { $search: q.trim() } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" }, createdAt: -1 })
        .limit(50);

      if (textMatches.length) {
        return res.status(200).json(textMatches);
      }

      const regex = new RegExp(q.trim(), "i");
      const fallback = await Post.find({
        ...filters,
        $or: [{ title: regex }, { description: regex }, { category: regex }],
      })
        .sort({ createdAt: -1 })
        .limit(50);
      return res.status(200).json(fallback);
    }

    const posts = await Post.find(filters).sort({ createdAt: -1 }).limit(50);
    return res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError("Failed to search posts.", 500));
  }
};

//================== GET POSTS BY CATEGORY
// GET : api/posts/categories/:category
//PROTECTED
const getPostbyCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const decodedCategory = decodeURIComponent(category || "");

    // Fast path: exact case-insensitive match for direct category names.
    let catPosts = await Post.find({
      category: { $regex: new RegExp(`^${decodedCategory}$`, "i") },
    }).sort({ createdAt: -1 });

    // Fallback: support slug-style params like "mobileappdevelopment".
    if (!catPosts.length) {
      const allPosts = await Post.find().sort({ createdAt: -1 });
      const normalizedRequested = normalizeCategory(decodedCategory);
      catPosts = allPosts.filter(
        (post) => normalizeCategory(post.category) === normalizedRequested
      );
    }

    res.status(200).json(catPosts);
  } catch (err) {
    return next(new HttpError("Error fetching category posts", 500));
  }
};

//===================RECOMMENDATIONS
// GET : api/posts/:id/recommendations
const getRecommendedPosts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const target = await Post.findById(id);
    if (!target) return next(new HttpError("Post not found.", 404));

    const targetEmbedding =
      target.embedding?.length > 0
        ? target.embedding
        : buildTextEmbedding(`${target.title} ${target.category} ${target.description}`);

    if (!target.embedding?.length) {
      target.embedding = targetEmbedding;
      await target.save();
    }

    const candidates = await Post.find({ _id: { $ne: id } }).limit(200);

    const ranked = candidates
      .map((post) => {
        const emb =
          post.embedding?.length > 0
            ? post.embedding
            : buildTextEmbedding(`${post.title} ${post.category} ${post.description}`);
        return {
          post,
          score: cosineSimilarity(targetEmbedding, emb),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((entry) => ({ ...entry.post.toObject(), similarity: Number(entry.score.toFixed(4)) }));

    res.status(200).json(ranked);
  } catch (error) {
    return next(new HttpError("Failed to generate recommendations.", 500));
  }
};


//================= GET USER/ AUTHOR POST
// GET: api/posts/users/:id
// UNPROTECTED
const getUserPosts = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find posts where creator = id
    const userPosts = await Post.find({ creator: id }).sort({ createdAt: -1 });

    res.status(200).json(userPosts);
  } catch (err) {
    console.error("Error in getUserPosts:", err.message);
    return next(new HttpError("Fetching user posts failed", 500));
  }
};

//===================GENERATE AI DRAFT
// POST : api/posts/ai/draft
//PROTECTED
const generateAIDraft = async (req, res, next) => {
  try {
    const { topic, category, tone } = req.body;

    if (!topic || !topic.trim()) {
      return next(new HttpError("Topic is required to generate AI draft.", 422));
    }

    const { draft: aiDraft, provider, error } = await generateOpenAIDraft({
      topic,
      category,
      tone,
    });

    if (aiDraft) {
      return res.status(200).json({
        ...aiDraft,
        aiSource: provider,
      });
    }

    const fallbackDraft = generateLocalDraft({ topic, category, tone });
    return res.status(200).json({
      ...fallbackDraft,
      aiSource: "fallback",
      ...(error ? { aiErrorCode: error } : {}),
    });
  } catch (error) {
    return next(new HttpError("Failed to generate AI draft.", 500));
  }
};

//===================SUMMARIZE CONTENT
// POST : api/posts/ai/summarize
//UNPROTECTED
const summarizePostContent = async (req, res, next) => {
  try {
    const maxChars = Number(process.env.SUMMARY_MAX_INPUT_CHARS) || 8000;
    const { content } = req.body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return next(new HttpError("Content is required for summarization.", 422));
    }

    if (content.length > maxChars) {
      return next(
        new HttpError(`Content too long. Max allowed length is ${maxChars} chars.`, 422)
      );
    }

    const cacheKey = content.trim().toLowerCase();
    const cachedSummary = getCachedSummary(cacheKey);

    if (cachedSummary) {
      return res.status(200).json({
        summary: cachedSummary.summary,
        aiSource: cachedSummary.aiSource,
        cached: true,
      });
    }

    const { summary: aiSummary, provider, error } = await summarizeWithOpenAI(content);

    const payload = {
      summary: aiSummary,
      aiSource: provider || "local",
      ...(error && { aiErrorCode: error }),
    };

    setCachedSummary(cacheKey, payload);

    return res.status(200).json({
      ...payload,
      cached: false,
    });
  } catch (error) {
    return next(new HttpError("Failed to summarize content.", 500));
  }
};


//===================DELETE POST
// POST : api/posts/:id
//UNPROTECTED
const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id; // Extract postId from request parameters

    if (!postId) {
      return next(new HttpError("Post unavailable.", 400));
    }

    const post = await Post.findById(postId);
    if (!post) {
      return next(new HttpError("Post not found.", 404));
    }

    const filename = post.thumbnail;
    if(req.user.id === post.creator){
    fs.unlink(path.join(__dirname, "..", "uploads", filename), async (err) => {
      if (err) {
        return next(new HttpError("Failed to delete thumbnail.", 500));
      } else {
        await Post.findByIdAndDelete(postId); // Corrected to findByIdAndDelete

        const currentUser = await User.findById(req.user.id);
        if (currentUser) {
          const userPostCount = currentUser.posts - 1;
          await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });
        }
      
        await cacheDeleteByPrefix("posts:");
        res.json({ message: `Post ${postId} deleted successfully` });
      }
    
    });
    }else{
      return next(new HttpError("Post couldnt't be deleted.",403))
    }
  } catch (error) {
    return next(new HttpError("Something went wrong.", 500));
  }
};

//===================EDIT POST
// PATCH : api/posts/:id
//UNPROTECTED
const editPost = async (req, res, next) => {
  try {
    let filename;
    let newFilename;
    let updatedPost;
    const postId = req.params.id;
    let { title, category, description } = req.body;
    if (!title || !category || description.length < 12) {
      return next(new HttpError("Invalid input data.", 400));
    }
    if (!req.files) {
      const currentPost = await Post.findById(postId);
      if (currentPost && req.user.id === String(currentPost.creator)) {
        const versionCount = await PostVersion.countDocuments({ postId });
        await PostVersion.create({
          postId,
          editedBy: req.user.id,
          version: versionCount + 1,
          snapshot: {
            title: currentPost.title,
            category: currentPost.category,
            description: currentPost.description,
            thumbnail: currentPost.thumbnail,
          },
        });
      }

      updatedPost = await Post.findByIdAndUpdate(
        postId,
        {
          title: title.trim(),
          category: category.trim(),
          description: description.trim(),
          embedding: buildTextEmbedding(
            `${title.trim()} ${category.trim()} ${description.trim()}`
          ),
        }, // Trim to remove extra quotes
        { new: true }
      );
    } else {
      // Get old post from database
      const oldPost = await Post.findById(postId);
      if(req.user.id === oldPost.creator){
      if (!oldPost) {
        return next(new HttpError("Post not found.", 404));
      }

      const versionCount = await PostVersion.countDocuments({ postId });
      await PostVersion.create({
        postId,
        editedBy: req.user.id,
        version: versionCount + 1,
        snapshot: {
          title: oldPost.title,
          category: oldPost.category,
          description: oldPost.description,
          thumbnail: oldPost.thumbnail,
        },
      });

      fs.unlink(
        path.join(__dirname, "..", "uploads", oldPost.thumbnail),
        (err) => {
          if (err) {
            console.error("Failed to delete old thumbnail:", err);
          }
        }
      );
      // Upload new thumbnail
      const { thumbnail } = req.files;
      if (thumbnail.size > 2000000) {
        return next(
          new HttpError("Thumbnail too big. Should be less than 2MB", 400)
        );
      }
      fileName = thumbnail.name;
      let splittedFilename = fileName.split(".");
      newFilename =
        splittedFilename[0] +
        uuid() +
        "." +
        splittedFilename[splittedFilename.length - 1];
      thumbnail.mv(
        path.join(__dirname, "..", "uploads", newFilename),
        async (err) => {
          if (err) {
            return next(new HttpError("Failed to upload new thumbnail.", 500));
          }
        }
      );
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        {
          title: title.trim(),
          category: category.trim(),
          description: description.trim(),
          thumbnail: newFilename,
          embedding: buildTextEmbedding(
            `${title.trim()} ${category.trim()} ${description.trim()}`
          ),
        }, // Trim to remove extra quotes
        { new: true }
      );
    }
  }
    if (!updatedPost) {
      return next(new HttpError("Couldn't update post.", 400));
    }
    await cacheDeleteByPrefix("posts:");
    res.status(200).json(updatedPost);
  } catch (error) {
    return next(new HttpError("Something went wrong.", 500));
  }
};

module.exports = {
  createPost,
  getPost,
  searchPosts,
  getRecommendedPosts,
  getPostbyCategory,
  getPosts,
  editPost,
  deletePost,
  getUserPosts,
  generateAIDraft,
  summarizePostContent,
};
