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


