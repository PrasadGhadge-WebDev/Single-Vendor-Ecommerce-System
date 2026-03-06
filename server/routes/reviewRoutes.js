const express = require("express");
const {
  addReview,
  updateReview,
  deleteReview,
  getProductReviews,
} = require("../controllers/reviewController");
const { requireSignIn } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/product/:productId", getProductReviews);
router.post("/", requireSignIn, addReview);
router.put("/:id", requireSignIn, updateReview);
router.delete("/:id", requireSignIn, deleteReview);

module.exports = router;
