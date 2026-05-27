const express = require("express");
const { getStockHistory, deleteStockHistory } = require("../controllers/stockHistoryController");
const { requireSignIn, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", requireSignIn, isAdmin, getStockHistory);
router.delete("/:id", requireSignIn, isAdmin, deleteStockHistory);

module.exports = router;
