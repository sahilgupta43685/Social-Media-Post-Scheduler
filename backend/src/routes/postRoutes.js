const express = require("express");
const {
  createPost,
  getAllPosts,
  updatePost,
  deletePost,
  retryPost
} = require("../controllers/postController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", createPost);
router.get("/", getAllPosts);
router.post("/:id/retry", retryPost);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);

module.exports = router;
