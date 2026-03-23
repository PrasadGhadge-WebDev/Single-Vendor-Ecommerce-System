const express = require("express");
const {
  submitMessage,
  getAllMessages,
  updateMessageStatus,
} = require("../controllers/contactController");
const { requireSignIn, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/submit", submitMessage);
router.get("/", requireSignIn, isAdmin, getAllMessages);
router.put("/:id/status", requireSignIn, isAdmin, updateMessageStatus);

module.exports = router;
