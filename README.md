📝 MERN Stack Tech Blog- Technosphere

A full-stack web application built using the MERN (MongoDB, Express, React, Node.js) stack that allows developers to write, edit, and manage technical blog posts.

--
🚀 Features

- 🖋️ Create, edit, delete blog posts with Markdown support
- 🧠 Authenticated routes with JWT
- 🔍 Search blogs by title or tags
- 🏷️ Tag-based filtering system
- 💬 Comment section (coming soon!)
- 📈 Admin dashboard to manage content
- 🌐 Responsive UI for all devices

---

🛠️ Tech Stack

Frontend

- React.js (with Hooks & Context API)
- Axios for API calls
- React Router for navigation
- React Markdown for blog content rendering

### Backend

- Node.js
- Express.js
- MongoDB Atlas + Mongoose
- bcrypt for password encryption
- JSON Web Token (JWT) for secure authentication

---

⚙️ Setup Instructions

**Step 1: Clone the repository**

```bash
git clone https://github.com/TabaswiniPS/mern-tech-blog.git
cd mern-tech-blog
```

**Step 2: Backend setup**

```bash
cd server
npm install
```

**Step 3: Configure backend environment**

- Copy `.env.example` to `.env` in the server folder
- Update `MONGO_URI` with your MongoDB connection string
- Set `JWT_SECRET` to a strong random string
- Set `ALLOWED_ORIGINS` to your frontend URL(s)

**Step 4: Start backend**

```bash
npm run dev    # Development (with nodemon)
# OR
npm start      # Production
```

**Step 5: Frontend setup**

```bash
cd ../client
npm install
```

**Step 6: Configure frontend environment**

- Copy `.env.example` to `.env` in the client folder
- Set `REACT_APP_BASE_URL` to your backend API URL
- Set `REACT_APP_ASSETS_URL` to your assets server URL

**Step 7: Start frontend**

```bash
npm start
```

**URLs**

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Base: http://localhost:5000/api

---

## 🔒 Security & Production Updates

✅ **Recently Completed:**

- Removed password hash exposure from user profile endpoint
- Eliminated credential logging from auth operations
- Added HTML sanitization (DOMPurify) to prevent XSS attacks
- Implemented environment-driven CORS allowlist
- Fixed authorization checks (strict equality)
- Fixed frontend navigation and routing bugs
- Added `.env.example` configuration templates

⚠️ **Recommended Before Going Live:**

1. **Backend Tests**: Add Jest test suite for auth, CRUD, authorization
2. **HTTPS**: Enable SSL/TLS certificates in production
3. **Rate Limiting**: Add express-rate-limit for brute-force protection
4. **Input Validation**: Implement joi/yup request validation
5. **Helmet**: Add security headers with Helmet.js
6. **Proper Logging**: Use Morgan/Winston without exposing sensitive data
7. **Error Handling**: Hide stack traces in production
8. **Database Indexing**: Add indexes to email and creator fields
9. **Monitoring**: Set up error tracking (Sentry) and uptime monitoring
10. **Docker**: Containerize for consistent deployments
