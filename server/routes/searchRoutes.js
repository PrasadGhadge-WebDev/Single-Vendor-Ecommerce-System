const express = require("express");
const { globalSearch } = require("../controllers/searchController");
const { verifyTokenOptional } = require("../middlewares/authMiddleware");

const router = express.Router();

// Route is public, but verifyTokenOptional parses the user token if it exists.
// This allows us to conditionally check req.user.isAdmin in the controller.
router.get("/", verifyTokenOptional, globalSearch);

module.exports = router;
