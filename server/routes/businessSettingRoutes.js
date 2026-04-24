const express = require("express");
const { requireSignIn, isAdmin } = require("../middlewares/authMiddleware");
const {
  getBusinessSettings,
  getPublicBusinessSettings,
  updateBusinessSettings,
  getBusinessReports,
  getBillByOrderId,
} = require("../controllers/businessSettingController");

const router = express.Router();

// Public route
router.get("/public", getPublicBusinessSettings);

// Protected routes
router.get("/", requireSignIn, isAdmin, getBusinessSettings);
router.put("/", requireSignIn, isAdmin, updateBusinessSettings);
router.get("/reports", requireSignIn, isAdmin, getBusinessReports);
router.get("/bills/:orderId", requireSignIn, isAdmin, getBillByOrderId);

module.exports = router;
