const express = require("express");
const {
  createCodPayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentsByOrder,
  getAllPayments,
} = require("../controllers/paymentController");
const { requireSignIn, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", requireSignIn, isAdmin, getAllPayments);
router.post("/cod", requireSignIn, createCodPayment);
router.post("/razorpay/order", requireSignIn, createRazorpayOrder);
router.post("/razorpay/verify", requireSignIn, verifyRazorpayPayment);
router.get("/:orderId", requireSignIn, getPaymentsByOrder);

module.exports = router;
