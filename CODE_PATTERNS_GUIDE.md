# Code Patterns & Best Practices Guide

## Technosphere - Final Year Project Excellence

### Table of Contents

1. [React Patterns](#react-patterns)
2. [Backend Patterns](#backend-patterns)
3. [Database Patterns](#database-patterns)
4. [API Design Patterns](#api-design-patterns)
5. [Error Handling](#error-handling)
6. [Security Best Practices](#security-best-practices)
7. [Performance Patterns](#performance-patterns)
8. [Testing Strategies](#testing-strategies)

---

## React Patterns

### 1. Context API for Global State

**When to Use:**

- Authentication state (current user, token)
- Theme/language settings
- App-wide configurations

**Pattern:**

```javascript
// userContext.js
import { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("user")),
  );

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(currentUser));
  }, [currentUser]);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Usage in component
const MyComponent = () => {
  const { currentUser, setCurrentUser } = useContext(UserContext);

  if (!currentUser?.id) {
    return <Navigate to="/login" />;
  }
};
```

**Advantages:**

- Avoids prop drilling (passing props through many levels)
- Single source of truth for auth state
- Persists across page refreshes

---

### 2. Protected Routes Pattern

**Pattern:**

```javascript
// ProtectedRoute.jsx
const ProtectedRoute = ({ children, token }) => {
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Router setup
<Route
  path="/create"
  element={
    <ProtectedRoute token={currentUser?.token}>
      <CreatePosts />
    </ProtectedRoute>
  }
/>;
```

**Real Implementation in Current Project:**

```javascript
// Inside CreatePosts.jsx
useEffect(() => {
  if (!token) {
    navigate("/login");
  }
}, [token, navigate]);
```

---

### 3. Form State Management with Multiple Fields

**Pattern:**

```javascript
// Option 1: Multiple useState calls (simple forms)
const [title, setTitle] = useState("");
const [category, setCategory] = useState("");

// Option 2: Single state object (complex forms)
const [formData, setFormData] = useState({
  title: "",
  category: "",
  description: "",
});

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));
};

// Usage
<input name="title" value={formData.title} onChange={handleChange} />;
```

**Current Project:**

```javascript
// Multiple useState calls for CreatePosts
const [title, setTitle] = useState("");
const [category, setCategory] = useState("");
const [description, setDescription] = useState("");
const [thumbnail, setThumbnail] = useState(null);
```

**Recommendation:** For 4+ fields, switch to single state object for better maintainability.

---

### 4. Async Data Fetching Pattern

**Anti-pattern:**

```javascript
// ❌ DON'T: Infinite loop
useEffect(() => {
  fetchData();
}, []); // Missing dependency causes re-run
```

**Correct Pattern:**

```javascript
// ✅ DO: Proper dependencies
useEffect(() => {
  const fetchPost = async () => {
    try {
      const response = await axios.get(`/api/posts/${id}`);
      setPost(response.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  fetchPost();
}, [id]); // Include all dependencies
```

**Current Project - Already Fixed:**

```javascript
// PostDetail.jsx - NOW has correct dependency
useEffect(() => {
  const getPost = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/posts/${id}`,
      );
      setPost(response.data);
    } catch (error) {
      setError(error);
    }
    setIsLoading(false);
  };

  getPost();
}, [id]); // ✅ Includes id dependency
```

---

### 5. Error Boundary Pattern (Advanced)

```javascript
// ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    console.error("Error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please refresh the page.</h1>;
    }
    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <App />
</ErrorBoundary>;
```

---

## Backend Patterns

### 1. MVC Architecture

**Model-View-Controller Structure**

```
controllers/          Models handle business logic
├── userControllers.js
└── postControllers.js

models/              Data schemas and DB models
├── userModel.js
└── postModel.js

routes/              API endpoint definitions
├── userRoutes.js
└── postsRoutes.js

middleware/          Request processing middleware
├── authMiddleware.js
└── errorMiddleware.js
```

**Flow:**

```
Request → Route → Controller → Model → Database
Response ← Error Handler ← Controller ← Model
```

---

### 2. Async/Await with Try-Catch Pattern

**Current Project Pattern:**

```javascript
const registerUser = async (req, res, next) => {
  try {
    // Validation logic
    if (!name || !email || !password) {
      return next(new HttpError("Fill in all fields.", 422));
    }

    // Business logic
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await User.create({...});

    // Success response
    res.status(201).json(`NewUser ${newUser.email} registered.`);
  } catch (error) {
    // Error handling via next()
    return next(new HttpError("User registration failed.", 422));
  }
};
```

**Best Practice Rules:**

- Always use try-catch for async operations
- Validate input first (fail fast)
- Use specific error codes (422, 401, 403, 404, 500)
- Never send stack traces to client

---

### 3. Middleware Chaining Pattern

**Pattern:**

```javascript
// routes/userRoutes.js
router.post("/change-avatar", authMiddleware, changeAvatar);
//                             ╚════════════╝ Must authenticate first

router.post("/login", loginUser); // No auth needed for login
```

**Middleware Order Matters:**

```javascript
app.use(express.json()); // Parse JSON first
app.use(cors()); // CORS headers
app.use(authMiddleware); // Verify auth (after parsing)
app.use("/api", apiRoutes); // Protected routes
app.use(errorHandler); // Error handling last
```

---

### 4. Error Handling Pattern

**Custom Error Class:**

```javascript
// models/errorModel.js
class HttpError extends Error {
  constructor(message, errorCode) {
    super(message);
    this.code = errorCode;
  }
}

// Usage
throw new HttpError("Invalid input", 422);
throw new HttpError("Unauthorized", 401);
throw new HttpError("Server error", 500);
```

**Global Error Handler:**

```javascript
// middleware/errorMiddleware.js
const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error); // Already sent response
  }

  res
    .status(error.code || 500)
    .json({ message: error.message || "An unknown error occurred" });
};
```

---

## Database Patterns

### 1. Mongoose Schema with Validations

**Current Pattern:**

```javascript
// models/userModel.js
const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // ✅ Enforces uniqueness
    lowercase: true, // Store as uppercase
    trim: true, // Remove whitespace
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // TODO: Add email regex
  },
  password: {
    type: String,
    required: true,
    minlength: 6, // Password validation
  },
  posts: {
    type: Number,
    default: 0,
  },
});
```

**Enhancements for Future:**

```javascript
// Advanced schema with timestamps and virtuals
const userSchema = new Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,

    // Relations
    posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],

    // Metadata
    joinedAt: { type: Date, default: Date.now },
    lastLogin: Date,
  },
  { timestamps: true }, // Adds createdAt, updatedAt automatically
);

// Virtual for displaying follower count
userSchema.virtual("followerCount").get(function () {
  return this.followers.length;
});
```

---

### 2. Query Optimization Patterns

**With Indexing:**

```javascript
// models/userModel.js
userSchema.index({ email: 1 }); // Index on email (fast lookups)
userSchema.index({ createdAt: -1 }); // Index on date (fast sorting)

// models/postModel.js
postSchema.index({ creator: 1, createdAt: -1 }); // Compound index
postSchema.index({ category: 1 }); // Category filtering
```

**Query Patterns:**

```javascript
// ✅ Good: Only select needed fields
const user = await User.findById(id).select("name avatar email");

// ❌ Avoid: Select password or sensitive fields
const user = await User.findById(id).select("password");

// ✅ Good: Sort and limit for pagination
const posts = await Post.find().sort({ createdAt: -1 }).limit(10).skip(0);

// ✅ Good: Populate related data when needed
const post = await Post.findById(id).populate("creator", "name avatar");
```

---

## API Design Patterns

### 1. RESTful Endpoint Naming

**Current Project:**

```javascript
✅ POST   /api/users/register              // Create account
✅ POST   /api/users/login                 // Authenticate
✅ GET    /api/users                       // List all users
✅ GET    /api/users/:id                   // Get specific user
✅ POST   /api/users/change-avatar         // Action (POST for modifications)
✅ PATCH  /api/users/edit-user             // Partial update

✅ POST   /api/posts                       // Create post
✅ GET    /api/posts                       // List all
✅ GET    /api/posts/:id                   // Get single
✅ PATCH  /api/posts/:id                   // Update post
✅ DELETE /api/posts/:id                   // Delete post
✅ GET    /api/posts/users/:id             // Posts by author
✅ GET    /api/posts/categories/:category  // Posts by category
```

**Naming Conventions:**

- Resources as nouns: `/users`, `/posts`, `/comments`
- Methods as HTTP verbs: GET, POST, PUT, PATCH, DELETE
- Nested resources: `/users/:id/posts`
- Avoid verbs: ❌ `/api/getUser`, ✅ `/api/users/:id`
- Use plural: ❌ `/api/post`, ✅ `/api/posts`

---

### 2. HTTP Status Code Patterns

```javascript
// Success responses
200 OK              // GET, PUT, PATCH successful
201 Created         // POST successful, resource created
204 No Content      // DELETE successful

// Client errors
400 Bad Request     // Invalid input
401 Unauthorized    // Missing/invalid authentication
403 Forbidden       // Authenticated but not authorized
404 Not Found       // Resource doesn't exist
422 Unprocessable   // Validation failed (current project uses this)
429 Too Many        // Rate limit exceeded

// Server errors
500 Internal Server Error  // Generic server error
503 Service Unavailable    // Temporary server issue
```

**Current Project Mapping:**

```javascript
201 - Registration/creation successful
401 - Authentication required
403 - Not authorized to perform action
404 - Resource not found
422 - Validation error (input invalid)
500 - Server error
```

---

### 3. API Response Format

**Consistent Response Pattern:**

```javascript
// Success response
{
  success: true,
  data: { ...resource },
  message: "Resource created successfully"
}

// Error response
{
  success: false,
  error: "Invalid input",
  code: 422
}
```

**Current Project (Simple):**

```javascript
// Success: Returns data directly
res.status(201).json(newUser);

// Error: HttpError middleware handles
throw new HttpError("message", statusCode);
```

**Recommendation:** Keep current pattern for MVP, standardize in v2.0.

---

## Error Handling

### 1. Custom Error Class Usage

```javascript
const HttpError = require("../models/errorModel");

// ✅ Good: Use consistent error class
throw new HttpError("User not found", 404);
throw new HttpError("Invalid credentials", 401);
throw new HttpError("Unauthorized access", 403);

// ❌ Avoid: Generic Error
throw new Error("Something went wrong");
```

---

### 2. Input Validation Pattern

**Current Basic Pattern:**

```javascript
if (!email || !password) {
  return next(new HttpError("Fill in all fields", 422));
}

if (password.length < 6) {
  return next(new HttpError("Password too short", 422));
}
```

**Recommended Advanced Pattern (Using joi):**

```javascript
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().required(),
});

const { error, value } = schema.validate(req.body);
if (error) {
  return next(new HttpError(error.details[0].message, 422));
}
```

---

## Security Best Practices

### 1. Password Security

**Current Implementation:** ✅ Secure

```javascript
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);
```

**Best Practices:**

- ✅ Hash all passwords (never store plain text)
- ✅ Use bcryptjs (not MD5, SHA1, or plain hashing)
- ✅ Salt rounds = 10 (good balance of security vs speed)
- ✅ Never log passwords
- ✅ Never return passwords in API responses

---

### 2. JWT Token Security

**Current Implementation:** ✅ Good

```javascript
const token = jwt.sign({ id, name }, process.env.JWT_SECRET, {
  expiresIn: "1h",
});
```

**Enhancements:**

```javascript
// Add refresh token mechanism
const accessToken = jwt.sign({...}, process.env.JWT_SECRET, {
  expiresIn: "15m"  // Short-lived
});

const refreshToken = jwt.sign({...}, process.env.REFRESH_SECRET, {
  expiresIn: "7d"   // Long-lived, stored in httpOnly cookie
});
```

---

### 3. CORS Security

**Current Implementation:** ✅ Environment-driven

```javascript
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS.split(",");
app.use(cors({ credentials: true, origin: ALLOWED_ORIGINS }));
```

**Best Practice:**

```
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
# NOT: * (wildcard allows all origins)
```

---

### 4. Input Sanitization

**Current Implementation:** ✅ DOMPurify in frontend

```javascript
import DOMPurify from "dompurify";
<p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}></p>;
```

**Backend Sanitization (Recommended):**

```javascript
const xss = require("xss");
const cleanContent = xss(userInput);
```

---

## Performance Patterns

### 1. Image Optimization

**Current:** Files stored locally

**Better Approach:**

```javascript
// Use CDN for faster delivery
// Optimize image sizes on upload
// Use WebP format for modern browsers
const sharp = require("sharp");

const optimizedImage = await sharp(imageBuffer)
  .resize(1200, 800)
  .webp({ quality: 80 })
  .toBuffer();
```

---

### 2. Query Optimization

**N+1 Query Problem (Anti-pattern):**

```javascript
// ❌ Bad: Queries 1 user + N posts = N+1 queries
const users = await User.find();
for (const user of users) {
  user.recentPosts = await Post.find({ creator: user._id }).limit(5);
}
```

**Solution: Populate**

```javascript
// ✅ Good: Single query with join
const users = await User.find().populate({
  path: "posts",
  options: { sort: { createdAt: -1 }, limit: 5 },
});
```

---

### 3. Caching Strategy

**Recommended (Future Enhancement):**

```javascript
const redis = require("redis");
const client = redis.createClient();

// Cache post list
const getPosts = async (page = 1) => {
  const cacheKey = `posts:page:${page}`;

  // Check cache first
  const cached = await client.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // If not cached, query database
  const posts = await Post.find()
    .skip((page - 1) * 10)
    .limit(10);

  // Cache for 1 hour
  await client.setEx(cacheKey, 3600, JSON.stringify(posts));

  return posts;
};
```

---

## Testing Strategies

### 1. Unit Testing (Controller Logic)

```javascript
// tests/controllers/auth.test.js (using Jest)
describe("User Authentication", () => {
  test("should register user with valid data", async () => {
    const req = {
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        password2: "password123",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });
});
```

---

### 2. Integration Testing (Full Flow)

```javascript
// tests/integration/posts.test.js
describe("Post Creation Flow", () => {
  test("authenticated user can create post", async () => {
    // 1. Register user
    // 2. Login to get token
    // 3. Create post with token
    // 4. Verify post in database
  });
});
```

---

### 3. Manual Testing Checklist

```
Authentication:
  ☐ Register new user
  ☐ Login valid user
  ☐ Reject invalid credentials
  ☐ Token persists in localStorage
  ☐ Logout clears token

Posts:
  ☐ Create post with all fields
  ☐ Edit own post
  ☐ Cannot edit others' posts
  ☐ Delete own post
  ☐ Browse posts by category
  ☐ Search posts

Security:
  ☐ Cannot access protected routes without token
  ☐ Cannot view passwords in responses
  ☐ XSS attempt blocked (test with <script>alert</script>)
  ☐ CORS blocks unauthorized origins
```

---

## Summary Checklist for Excellence

- [ ] Consistent error handling (try-catch, HttpError)
- [ ] Input validation on both client and server
- [ ] No sensitive data in logs
- [ ] Passwords hashed and never exposed
- [ ] JWT tokens in Authorization header
- [ ] Protected routes with auth middleware
- [ ] Proper HTTP status codes
- [ ] RESTful endpoint naming
- [ ] Indexed database fields
- [ ] Comments explaining complex logic
- [ ] Environment variables for configuration
- [ ] Error messages user-friendly
- [ ] Responsive UI
- [ ] Loading states
- [ ] Error boundaries

---

**Document Version:** 1.0  
**Last Updated:** March 18, 2026
