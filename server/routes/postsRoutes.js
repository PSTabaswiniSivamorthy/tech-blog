const { Router } = require("express");
const {
  createPost,
  getPost,
  getPosts,
  editPost,
  getUserPosts,
  getPostbyCategory,
  deletePost,
  removeEventListener,
} = require("../controllers/postControllers");
const authMiddleware = require("../middleware/authMiddleware");
const router = Router();

router.post("/", authMiddleware, createPost);
router.get("/", getPosts);
router.get("/users/:id", getUserPosts);
router.get("/:categories/:category", getPostbyCategory);
router.get("/:id", getPost);
router.patch("/:id", authMiddleware, editPost);
router.delete("/:id", authMiddleware, deletePost);

module.exports = router;
