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

router.get("/public", getPublicBusinessSettings);
router.use(requireSignIn, isAdmin);
router.get("/", getBusinessSettings);
router.put("/", updateBusinessSettings);
router.get("/reports", getBusinessReports);
router.get("/bills/:orderId", getBillByOrderId);

module.exports = router;
