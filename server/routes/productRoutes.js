const express = require("express");
const {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { requireSignIn, isAdmin } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProductById);

router.post("/", requireSignIn, isAdmin, upload.single("image"), addProduct);
router.put("/:id", requireSignIn, isAdmin, upload.single("image"), updateProduct);
router.delete("/:id", requireSignIn, isAdmin, deleteProduct);

module.exports = router;
