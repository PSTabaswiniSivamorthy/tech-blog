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

Step 1: Clone the repository
git clone https://github.com/TabaswiniPS/mern-tech-blog.git
cd mern-tech-blog

Step 2: Backend setup 
cd backend
npm install

Step 3:
Create a .env file in /backend and add:
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000

Step 4:
npm run dev

Step 5:Frontend Setup
cd ../frontend
npm install
npm start

Frontend runs on: http://localhost:3000
Backend runs on: http://localhost:5000
