const express = require("express");
const {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
  bulkActionCategories
} = require("../controllers/categoryController");

const { requireSignIn, isAdmin } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

router.get("/", getCategories);
router.get("/:id", getCategoryById);

// 🔥 Add multer here
router.post("/", requireSignIn, isAdmin, upload.single("image"), addCategory);

router.put("/:id", requireSignIn, isAdmin, upload.single("image"), updateCategory);

router.post("/bulk-action", requireSignIn, isAdmin, bulkActionCategories);

router.delete("/:id", requireSignIn, isAdmin, deleteCategory);

module.exports = router;