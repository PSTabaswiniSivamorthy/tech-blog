import React, { useState, useContext, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { UserContext } from "../context/userContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const CreatePosts = () => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [error, setError] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const navigate = useNavigate();
  const { currentUser, showToast } = useContext(UserContext);
  const token = currentUser?.token;

  // Redirect to login if user is not logged in
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) return;

    const restoreDraft = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/drafts/new`,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          },
        );
        const draft = response.data;
        if (!draft) return;
        if (draft.title) setTitle(draft.title);
        if (draft.category) setCategory(draft.category);
        if (draft.description) setDescription(draft.description);
      } catch (error) {
        // Silent restore fail
      }
    };

    restoreDraft();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const timer = setInterval(() => {
      axios
        .post(
          `${process.env.REACT_APP_BASE_URL}/drafts/autosave`,
          { title, category, description, postId: null },
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          },
        )
        .catch(() => undefined);
    }, 5000);

    return () => clearInterval(timer);
  }, [token, title, category, description]);

  const POST_CATEGORIES = [
    "Programming",
    "DSA",
    "Competetive Programming",
    "Web Development",
    "Mobile App Development",
    "Data Science",
    "Machine Learning",
    "Devops",
    "Cloud Computing",
    "Cybersecurity",
    "Interview Preparation",
    "Tech Trends",
    "Opportunities in Tech",
  ];

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [
        { list: "ordered" },
        { list: "bullet" },
        { indent: "-1" },
        { indent: "+1" },
      ],
      ["link", "image"],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    "image",
  ];

  const createPost = async (e) => {
    e.preventDefault();

    // Validate category
    if (!POST_CATEGORIES.includes(category)) {
      const message = "Please select a valid category from the list.";
      setError(message);
      showToast(message, "error");
      return;
    }

    const postData = new FormData();
    postData.set("title", title);
    postData.set("category", category);
    postData.set("description", description);
    if (thumbnail) postData.set("thumbnail", thumbnail);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/posts`,
        postData,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200 || response.status === 201) {
        showToast("Post created successfully.", "success");
        navigate("/");
      } else {
        const message = "Post not created. Try again!";
        setError(message);
        showToast(message, "error");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Something went wrong";
      setError(message);
      showToast(message, "error");
    }
  };

  const generateWithAi = async () => {
    const topic = aiTopic.trim() || title.trim();

    if (!topic) {
      const message = "Enter a topic or title before generating AI content.";
      setError(message);
      showToast(message, "error");
      return;
    }

    setIsGeneratingAi(true);
    setError("");

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/posts/ai/draft`,
        {
          topic,
          category,
          tone: "professional",
        },
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const generatedTitle = response.data?.title;
      const generatedDescription = response.data?.description;

      if (generatedTitle) setTitle(generatedTitle);
      if (generatedDescription) setDescription(generatedDescription);

      showToast(
        "AI draft generated. Review and edit before publishing.",
        "success",
      );
    } catch (err) {
      const message =
        err.response?.data?.message || "AI draft generation failed.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <section className="create-post">
      <div className="container">
        <h2>Create Post</h2>
        {error && <p className="form__error-message">{error}</p>}
        <form className="form create-post__form" onSubmit={createPost}>
          <div className="ai-tools">
            <div className="ai-tools__row">
              <input
                type="text"
                placeholder="AI topic (example: React performance optimization)"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
              />
              <button
                type="button"
                className="btn"
                onClick={generateWithAi}
                disabled={isGeneratingAi}
              >
                {isGeneratingAi ? "Generating..." : "Write Using AI"}
              </button>
            </div>
            <p className="ai-tools__hint">
              AI generates a draft title and article body. You can fully edit it
              before publishing.
            </p>
          </div>

          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="" disabled>
              -- Select a category --
            </option>
            {POST_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <ReactQuill
            modules={modules}
            formats={formats}
            value={description}
            onChange={setDescription}
            className="ql-editor"
          />

          <input
            type="file"
            onChange={(e) => setThumbnail(e.target.files[0])}
            accept="image/png, image/jpg, image/jpeg"
          />

          <button type="submit" className="btn primary">
            Create
          </button>
        </form>
      </div>
    </section>
  );
};

export default CreatePosts;
