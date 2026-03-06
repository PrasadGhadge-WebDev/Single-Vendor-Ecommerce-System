const express = require("express");
const {
  createCodPayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentsByOrder,
} = require("../controllers/paymentController");
const { requireSignIn } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/cod", requireSignIn, createCodPayment);
router.post("/razorpay/order", requireSignIn, createRazorpayOrder);
router.post("/razorpay/verify", requireSignIn, verifyRazorpayPayment);
router.get("/:orderId", requireSignIn, getPaymentsByOrder);

module.exports = router;
