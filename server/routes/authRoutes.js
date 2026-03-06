const express = require("express");
const { registerUser, loginUser, logoutUser } = require("../controllers/authController");
const { requireSignIn } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", requireSignIn, logoutUser);

module.exports = router;
