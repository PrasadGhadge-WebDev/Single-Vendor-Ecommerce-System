const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  sendOtp,
  verifyOtpAndRegister,
  completeRegistration,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} = require("../controllers/authController");
const { requireSignIn } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", requireSignIn, logoutUser);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtpAndRegister);
router.post("/complete-registration", completeRegistration);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
