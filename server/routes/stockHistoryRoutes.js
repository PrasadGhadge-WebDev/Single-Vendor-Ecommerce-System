const express = require("express");
const { getStockHistory } = require("../controllers/stockHistoryController");
const { requireSignIn, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", requireSignIn, isAdmin, getStockHistory);

module.exports = router;
