const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead
} = require("../controllers/notificationController");
const { protect, admin } = require("../middlewares/authMiddleware");

router.get("/", protect, admin, getNotifications);
router.put("/mark-all-read", protect, admin, markAllAsRead);
router.put("/:id/read", protect, admin, markAsRead);

module.exports = router;
