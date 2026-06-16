const express = require("express");
const {
  createCodPayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentsByOrder,
  getAllPayments,
  getPaymentStats,
  deletePayment,
} = require("../controllers/paymentController");
const { requireSignIn, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", requireSignIn, isAdmin, getAllPayments);
router.get("/stats", requireSignIn, isAdmin, getPaymentStats);
router.post("/cod", requireSignIn, createCodPayment);
router.post("/razorpay/order", requireSignIn, createRazorpayOrder);
router.post("/razorpay/verify", requireSignIn, verifyRazorpayPayment);
router.get("/:orderId", requireSignIn, getPaymentsByOrder);
router.delete("/:id", requireSignIn, isAdmin, deletePayment);

module.exports = router;
