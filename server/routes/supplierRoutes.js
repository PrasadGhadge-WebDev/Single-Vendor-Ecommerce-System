const express = require("express");
const router = express.Router();
const { requireSignIn, isAdmin } = require("../middlewares/authMiddleware");

const {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  createPurchase,
  getPurchases,
  getSupplierProducts,
  getSupplierAnalytics,
} = require("../controllers/supplierController");

router.use(requireSignIn, isAdmin);

router.get("/", getSuppliers);
router.post("/", createSupplier);
router.get("/purchases", getPurchases);
router.post("/purchases", createPurchase);
router.get("/analytics/overview", getSupplierAnalytics);
router.get("/:id/products", getSupplierProducts);
router.get("/:id", getSupplierById);
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

module.exports = router;
