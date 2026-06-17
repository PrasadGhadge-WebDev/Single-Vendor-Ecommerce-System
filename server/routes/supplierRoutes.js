const express = require("express");
const router = express.Router();
const { requireSignIn, isAdmin } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

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
  updatePurchase,
  markPurchasePaid,
  deletePurchase,
} = require("../controllers/supplierController");

router.use(requireSignIn, isAdmin);

router.get("/", getSuppliers);
router.post("/", createSupplier);
router.get("/purchases", getPurchases);
router.post("/purchases", upload.single("invoiceFile"), createPurchase);
router.put("/purchases/:id", upload.single("invoiceFile"), updatePurchase);
router.put("/purchases/:id/mark-paid", markPurchasePaid);
router.delete("/purchases/:id", deletePurchase);
router.get("/analytics/overview", getSupplierAnalytics);
router.get("/:id/products", getSupplierProducts);
router.get("/:id", getSupplierById);
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

module.exports = router;
