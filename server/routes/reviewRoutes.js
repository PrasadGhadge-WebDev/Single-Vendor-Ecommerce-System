const express = require("express");
const {
  addReview,
  updateReview,
  deleteReview,
  getProductReviews,
  getAllReviews,
} = require("../controllers/reviewController");
const { requireSignIn, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", requireSignIn, isAdmin, getAllReviews);
router.get("/product/:productId", getProductReviews);
router.post("/", requireSignIn, addReview);
router.put("/:id", requireSignIn, updateReview);
router.delete("/:id", requireSignIn, deleteReview);

module.exports = router;
