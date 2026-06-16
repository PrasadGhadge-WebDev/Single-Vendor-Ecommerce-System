const express = require("express");
const { getNavbarStats, globalSearch } = require("../controllers/adminController");
const { requireSignIn, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/navbar-stats", requireSignIn, isAdmin, getNavbarStats);
router.get("/global-search", requireSignIn, isAdmin, globalSearch);

module.exports = router;
