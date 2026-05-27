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

router.post("/", requireSignIn, isAdmin, upload.fields([{ name: "image", maxCount: 1 }, { name: "images", maxCount: 5 }]), addProduct);
router.put("/:id", requireSignIn, isAdmin, upload.fields([{ name: "image", maxCount: 1 }, { name: "images", maxCount: 5 }]), updateProduct);
router.delete("/:id", requireSignIn, isAdmin, deleteProduct);

module.exports = router;
