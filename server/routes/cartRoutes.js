const express = require("express");
const router = express.Router();

const {
  addToCart,
  getCart,
  updateCart,
  removeItem,
} = require("../controllers/cartController");

const { requireSignIn } = require("../middlewares/authMiddleware");

router.post("/add", requireSignIn, addToCart);
router.get("/", requireSignIn, getCart);
router.put("/update", requireSignIn, updateCart);
router.delete("/remove/:productId", requireSignIn, removeItem);

module.exports = router;
