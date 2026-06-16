const express = require("express");
const {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkActionProducts,
  importProducts,
} = require("../controllers/productController");
const { requireSignIn, isAdmin } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProductById);

router.post("/import", requireSignIn, isAdmin, importProducts);
router.post("/bulk-action", requireSignIn, isAdmin, bulkActionProducts);
router.post("/", requireSignIn, isAdmin, upload.fields([{ name: "image", maxCount: 1 }, { name: "images", maxCount: 5 }]), addProduct);
router.put("/:id", requireSignIn, isAdmin, upload.fields([{ name: "image", maxCount: 1 }, { name: "images", maxCount: 5 }]), updateProduct);
router.delete("/:id", requireSignIn, isAdmin, deleteProduct);

module.exports = router;
