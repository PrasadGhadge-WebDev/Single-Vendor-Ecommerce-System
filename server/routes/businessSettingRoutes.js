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

// Public routes
router.get("/public", getPublicBusinessSettings);
router.get("/stats", require("../controllers/businessSettingController").getStoreStats);

// Protected routes
router.get("/", requireSignIn, isAdmin, getBusinessSettings);
router.put("/", requireSignIn, isAdmin, updateBusinessSettings);
router.get("/reports", requireSignIn, isAdmin, getBusinessReports);
router.get("/bills/:orderId", requireSignIn, getBillByOrderId);

module.exports = router;
