const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");

const { requireSignIn, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

// Multer Config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Routes
router.post("/", requireSignIn, isAdmin, upload.single("image"), addProduct);
router.get("/", getProducts);
router.put("/:id", requireSignIn, isAdmin, upload.single("image"), updateProduct);
router.delete("/:id", requireSignIn, isAdmin, deleteProduct);

module.exports = router;