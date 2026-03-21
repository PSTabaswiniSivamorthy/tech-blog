# Technosphere - Architecture & Code Documentation

## 📐 Project Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (React)                           │
│  - React Router: Client-side routing                        │
│  - Context API: User authentication state                   │
│  - Axios: HTTP client for API calls                         │
│  - React Quill: Rich text editor for posts                  │
│  - React Icons: Icon library for UI                         │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/AXIOS
                     │ Base URL: process.env.REACT_APP_BASE_URL
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   SERVER (Express)                          │
│  - REST API: /api/users, /api/posts routes                 │
│  - JWT Auth: authMiddleware for protected routes            │
│  - MongoDB: Data persistence                                │
│  - File Upload: expressFileupload for avatars/thumbnails   │
│  - Error Handling: Centralized error middleware             │
└────────────────────┬────────────────────────────────────────┘
                     │ MongoDB Driver
                     │
┌────────────────────▼────────────────────────────────────────┐
│                MONGODB DATABASE                             │
│  - Users Collection: User accounts, profiles                │
│  - Posts Collection: Blog posts, content                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure & File Organization

### Backend Structure

```
server/
├── index.js                    # Entry point, Express app setup, middleware
├── package.json               # Dependencies: express, mongoose, bcrypt, jwt
├── .env.example              # Environment variables template
│
├── controllers/
│   ├── userControllers.js    # User auth, profile management, avatar upload
│   └── postControllers.js    # Post CRUD operations
│
├── middleware/
│   ├── authMiddleware.js     # JWT verification for protected routes
│   └── errorMiddleware.js    # Centralized error handling
│
├── models/
│   ├── userModel.js          # User schema (name, email, password, avatar, posts)
│   ├── postModel.js          # Post schema (title, category, description, creator)
│   └── errorModel.js         # Custom HttpError class
│
├── routes/
│   ├── userRoutes.js         # User endpoints: register, login, profile, avatar
│   └── postsRoutes.js        # Post endpoints: CRUD, search, by-category
│
└── uploads/
    ├── avatars/              # User profile pictures (stored as files)
    └── thumbnails/           # Post thumbnail images (stored as files)
```

### Frontend Structure

```
client/
├── src/
│   ├── index.js              # React entry point, Router setup
│   ├── App.js                # Root component (not used in current routing)
│   ├── index.css             # Global styles
│   │
│   ├── components/           # Reusable components (no route rendering)
│   │   ├── Layout.jsx        # Main layout wrapper (Header, Outlet, Footer)
│   │   ├── Header.jsx        # Navigation bar with user menu
│   │   ├── Footer.jsx        # Site footer
│   │   ├── Posts.jsx         # Posts list component
│   │   ├── PostItem.jsx      # Single post card component
│   │   ├── PostAuthor.jsx    # Author info display
│   │   └── Loader.jsx        # Loading spinner
│   │
│   ├── pages/                # Page components (routable)
│   │   ├── Home.jsx          # Landing page (shows Posts)
│   │   ├── Login.jsx         # Login form
│   │   ├── Register.jsx      # Registration form
│   │   ├── UserProfile.jsx   # User profile & settings
│   │   ├── CreatePosts.jsx   # New post creation
│   │   ├── EditPost.jsx      # Post editing
│   │   ├── DeletePosts.jsx   # Post deletion
│   │   ├── Dashboard.jsx     # User's posts dashboard
│   │   ├── PostDetail.jsx    # Single post detail view
│   │   ├── Authors.jsx       # Browse all authors
│   │   ├── AuthorPosts.jsx   # Author's posts
│   │   ├── CategoryPosts.jsx # Posts by category
│   │   ├── Logout.jsx        # Logout handler
│   │   ├── ErrorPage.jsx     # 404/Error page
│   │   └── Loader.jsx        # Loading page
│   │
│   ├── context/
│   │   └── userContext.js    # Global user state (currentUser, token)
│   │
│   ├── images/               # Static images (logo, etc)
│   │
│   ├── data.js               # Static data (categories, constants)
│   ├── reportWebVitals.js    # Performance metrics
│   └── setupTests.js         # Test setup
│
├── package.json              # Dependencies, scripts, build settings
├── .env.example             # Environment variables template
└── public/
    ├── index.html           # HTML entry point
    ├── manifest.json        # PWA manifest (future enhancement)
    └── robots.txt           # SEO robots instructions
```

---

## 🔄 Request-Response Flow

### User Registration Flow

```
1. User fills registration form (Register.jsx)
   ↓
2. Form submitted to POST /api/users/register
   ↓
3. Backend validation (registerUser controller)
   - Check fields filled
   - Check email not duplicate
   - Check password strength
   - Check password match
   ↓
4. Hash password (bcrypt)
   ↓
5. Create user in MongoDB
   ↓
6. Return 201 success message
   ↓
7. User redirected to login page
```

### User Login Flow

```
1. User enters email/password (Login.jsx)
   ↓
2. Axios POST to /api/users/login
   ↓
3. Backend loginUser controller
   - Find user by email
   - Compare password hash with bcrypt.compare()
   - Generate JWT token
   ↓
4. Return { token, id, name }
   ↓
5. Client receives response
   ↓
6. setCurrentUser in UserContext (stores in localStorage)
   ↓
7. Include token in Authorization header for future requests
   ↓
8. Redirect to home page
```

### Create Post Flow

```
1. User fills form (CreatePosts.jsx)
   - Title, Category, Rich text description, Thumbnail image
   ↓
2. Form submitted with multipart/form-data to POST /api/posts
   ↓
3. authMiddleware verifies JWT token
   ↓
4. createPost controller
   - Validate fields
   - Check thumbnail size < 2MB
   - Save thumbnail to uploads/ folder
   - Create post in MongoDB
   ↓
5. Update user posts count
   ↓
6. Return created post
   ↓
7. Redirect to home page
```

---

## 🔐 Authentication Architecture

### JWT Token Flow

```
CLIENT SIDE                          SERVER SIDE
─────────────────                    ──────────────

Login Request ──────────────────────→ Generate JWT
                                     Token = {id, name}
                                     Signed with SECRET
                                     Expires: 1 hour

            ←──────────────────────── Return Token

Store in:
- localStorage (persists across browser refresh)
- UserContext state (React state)

Protected Request ──────────────────→ authMiddleware
+ Authorization Header              Check Bearer token
+ Authorization: Bearer {token}     Verify signature
                                    Extract user id, name
                                    Set req.user = { id, name }

            ←──────────────────────── Continue to route
                                    Handle request
                                    Return data
```

### Protected Routes (Require Authentication)

```
✅ Protected Routes (require valid JWT):
   - POST /api/posts              (create post)
   - PATCH /api/posts/:id         (edit post - owner only)
   - DELETE /api/posts/:id        (delete post - owner only)
   - POST /api/users/change-avatar (upload avatar)
   - PATCH /api/users/edit-user   (edit profile)

❌ Public Routes (no authentication needed):
   - POST /api/users/register     (anyone can register)
   - POST /api/users/login        (anyone can login)
   - GET  /api/users              (browse all users)
   - GET  /api/users/:id          (view user profile)
   - GET  /api/posts              (browse all posts)
   - GET  /api/posts/:id          (view single post)
   - GET  /api/posts/categories/:category (browse by category)
```

---

## 💾 Database Schema

### User Model

```javascript
{
  _id: ObjectId,           // MongoDB unique identifier
  name: String,            // Full name (required)
  email: String,           // Email (required, unique, lowercase)
  password: String,        // Hashed password (bcrypt)
  avatar: String,          // Filename of profile picture
  posts: Number,           // Count of posts created (default: 0)
  // Future enhancements:
  // followers: [ObjectId], // Array of user IDs following this user
  // following: [ObjectId], // Array of user IDs this user follows
  // bio: String,           // User bio/description
  // joinedAt: Date         // Account creation timestamp
}
```

### Post Model

```javascript
{
  _id: ObjectId,           // MongoDB unique identifier
  title: String,           // Post title (required)
  category: String,        // Post category (required)
                          // Enum: Programming, DSA, Web Dev, ML, etc
  description: String,     // Post content (HTML from React Quill)
  creator: ObjectId,       // Reference to User who created post
  thumbnail: String,       // Filename of post cover image
  timestamps: {
    createdAt: Date,       // Auto: creation timestamp
    updatedAt: Date        // Auto: last update timestamp
  }
  // Future enhancements:
  // tags: [String],        // Array of tags for filtering
  // views: Number,         // View count
  // likes: [ObjectId],     // Array of user IDs who liked
  // comments: [ObjectId]   // Array of comment IDs
}
```

---

## 🌐 API Endpoints Reference

### User Endpoints

| Method | Endpoint                   | Auth | Description             |
| ------ | -------------------------- | ---- | ----------------------- |
| POST   | `/api/users/register`      | ❌   | Create new account      |
| POST   | `/api/users/login`         | ❌   | Login & get JWT token   |
| GET    | `/api/users`               | ❌   | Get all users (authors) |
| GET    | `/api/users/:id`           | ❌   | Get user profile info   |
| POST   | `/api/users/change-avatar` | ✅   | Upload profile picture  |
| PATCH  | `/api/users/edit-user`     | ✅   | Update profile info     |

### Post Endpoints

| Method | Endpoint                          | Auth | Description               |
| ------ | --------------------------------- | ---- | ------------------------- |
| POST   | `/api/posts`                      | ✅   | Create new post           |
| GET    | `/api/posts`                      | ❌   | Get all posts (paginated) |
| GET    | `/api/posts/:id`                  | ❌   | Get single post details   |
| PATCH  | `/api/posts/:id`                  | ✅   | Edit post (owner only)    |
| DELETE | `/api/posts/:id`                  | ✅   | Delete post (owner only)  |
| GET    | `/api/posts/users/:id`            | ❌   | Get posts by author       |
| GET    | `/api/posts/categories/:category` | ❌   | Get posts by category     |

---

## 🔄 Component State Management

### Global State (Context API)

```javascript
// UserContext.js
const [currentUser, setCurrentUser] = useState({
  id: string, // MongoDB user ID
  name: string, // User's name
  token: string, // JWT authentication token
  avatar: string, // User's profile picture URL
});

// Persisted in localStorage:
localStorage.setItem("user", JSON.stringify(currentUser));

// Used in components to:
// - Check if user is logged in: currentUser?.id
// - Make authenticated requests with token
// - Display user name/avatar in header
// - Redirect to login if not authenticated
```

### Local Component State (useState)

```
Login Component:
- userData (email, password form fields)
- error (error message display)

CreatePosts Component:
- title (post title)
- category (selected category)
- description (rich text content)
- thumbnail (image file)
- error (form errors)

UserProfile Component:
- avatar (profile picture)
- name, email (user info)
- currentPassword, newPassword (for password change)
- error (validation errors)
```

---

## 📱 Frontend Routing Structure

```
/ (root)
├── / (Home) - Show all posts
├── /posts/:id (PostDetail) - View single post
├── /register (Register) - New account creation
├── /login (Login) - User authentication
├── /profile/:id (UserProfile) - User profile & settings
├── /authors (Authors) - Browse all users
├── /create (CreatePosts) - Write new post (protected)
├── /posts/:id/edit (EditPost) - Edit post (protected)
├── /posts/:id/delete (DeletePosts) - Delete post (protected)
├── /myposts/:id (Dashboard) - User's posts (protected)
├── /posts/users/:id (AuthorPosts) - Author's posts
├── /posts/categories/:category (CategoryPosts) - Posts by category
├── /logout (Logout) - Clear user session (protected)
└── * (ErrorPage) - 404 Not Found
```

---

## 🔐 Security Features

### Implemented (v1.0)

- ✅ Password hashing with bcryptjs (salt rounds: 10)
- ✅ JWT authentication (1-hour expiration)
- ✅ CORS configuration with environment whitelist
- ✅ Input validation (email format, password strength)
- ✅ Authorization checks (ownership verification)
- ✅ Secure password comparison (bcrypt)
- ✅ Sensitive data excluded from API responses
- ✅ HTML sanitization (DOMPurify) to prevent XSS

### Recommended (Future)

- ⚠️ Rate limiting per IP (prevent brute force)
- ⚠️ Two-factor authentication (2FA)
- ⚠️ Helmet.js security headers
- ⚠️ HTTPS/SSL encryption
- ⚠️ Input sanitization (joi/yup schemas)
- ⚠️ CSRF protection
- ⚠️ Refresh tokens for better security

---

## 📊 Data Flow Example: Creating a Blog Post

```
User Interface              Component              API Server            Database
─────────────              ──────────              ──────────            ────────

User types post     →   CreatePosts.jsx
content, selects         - State updates
category,               - Form validation
uploads image

                         FormData:
Submit Form         →    - title
                        - category
                        - description
                        - thumbnail (file)
                        - Authorization header

                     ────────────────→ POST /api/posts
                                     ↓
                                  authMiddleware
                                  (verify JWT)
                                     ↓
                                 createPost()
                                 controller
                                     ↓
                                  Validate:
                                  - Fields filled
                                  - Image < 2MB
                                     ↓
                                  Save image
                                  to disk
                                     ↓
                        ────────────────→ posts.create()
                                        {
                                          title,
                                          category,
                                          description,
                                          thumbnail,
                                          creator: req.user.id
                                        }
                                                    ↓
                                            Insert into
                                            MongoDB posts
                                            collection
                                                    ↓
                      ←───────────────── Return { _id, ... }

Display success  ←  Update context
message,             Navigate home
redirect
```

---

## 🛠️ Development Workflow

### Adding a New Feature

1. **Backend First**
   - Create/update model schema
   - Create controller function with business logic
   - Create route endpoint
   - Test with Postman/curl

2. **Frontend Second**
   - Create component/page
   - Add state management (useState, useContext)
   - Create API call (axios)
   - Wire up form/UI
   - Test end-to-end

3. **Testing**
   - Manual browser testing
   - API testing with tools
   - Check error handling
   - Verify security (auth, validation)

### Code Quality Checklist

- [ ] Comments explain WHY, not just WHAT
- [ ] Error messages are user-friendly
- [ ] Input validation on both client and server
- [ ] Sensitive data never exposed in logs
- [ ] Protected routes have auth middleware
- [ ] Consistent naming conventions (camelCase)
- [ ] No hardcoded values (use .env)
- [ ] Error handling with try-catch
- [ ] Test on different browsers

---

## 🚀 Deployment Checklist

- [ ] All environment variables set in .env
- [ ] Database connection string configured
- [ ] JWT_SECRET is strong and random
- [ ] ALLOWED_ORIGINS set to production domain
- [ ] NODE_ENV=production
- [ ] Build client: `npm run build`
- [ ] Serve build folder as static files
- [ ] Backend running on production server
- [ ] SSL/HTTPS enabled
- [ ] Database backups scheduled
- [ ] Error monitoring setup (Sentry)
- [ ] Uptime monitoring configured

---

## 📚 Key Technologies Explained

### MongoDB

- NoSQL database, stores data as JSON-like documents
- Collections = Tables, Documents = Rows
- Schema validation using Mongoose schemas

### Express.js

- Web framework for Node.js
- Routes incoming requests to controllers
- Middleware for authentication, logging, error handling

### React

- UI library for building interactive applications
- Component-based architecture
- State management with hooks (useState, useContext)
- React Router for client-side routing

### JWT (JSON Web Tokens)

- Stateless authentication mechanism
- Token contains user info (id, name)
- Verified with secret key
- Sent in Authorization header

### bcryptjs

- Password hashing library
- One-way encryption (cannot be decrypted)
- Salt prevents rainbow table attacks
- Industry standard for password storage

---

## 📖 Resources for Learning

- React Docs: https://react.dev/
- Express Docs: https://expressjs.com/
- MongoDB Docs: https://docs.mongodb.com/
- OWASP Security: https://owasp.org/Top10/
- JavaScript Best Practices: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide

---

**Document Version:** 1.0  
**Last Updated:** March 18, 2026  
**Audience:** Developers, Evaluators, Final Year Project Reviewers
