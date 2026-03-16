const Review = require("../models/Review");
const Product = require("../models/Product");

const recalculateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  const payload = stats[0]
    ? {
        averageRating: Number(stats[0].averageRating.toFixed(2)),
        numReviews: stats[0].numReviews,
      }
    : { averageRating: 0, numReviews: 0 };

  await Product.findByIdAndUpdate(productId, payload);
};

exports.addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({ message: "productId and rating are required" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const existing = await Review.findOne({ user: req.user._id, product: productId });
    if (existing) {
      return res.status(400).json({ message: "Review already exists. Use edit endpoint." });
    }

    const review = await Review.create({
      user: req.user._id,
      product: productId,
      rating,
      title: req.body.title || "",
      comment,
    });

    await recalculateProductRating(productId);

    res.status(201).json(review);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Review already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment } = req.body;

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;

    await review.save();
    await recalculateProductRating(review.product);

    res.status(200).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(id);
    await recalculateProductRating(productId);

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
  const { productId, search, rating } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(5, Number(req.query.limit) || 20));

  const match = {};
  if (productId) {
    match.product = productId;
  }
  const ratingValue = Number(rating);
  if (ratingValue && ratingValue >= 1 && ratingValue <= 5) {
    match.rating = ratingValue;
  }
  if (search) {
      match.$or = [
        { comment: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
      ];
    }

    const [total, stats] = await Promise.all([
      Review.countDocuments(match),
      Review.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
          },
        },
      ]),
    ]);

    const reviews = await Review.find(match)
      .populate("user", "name email")
      .populate("product", "name averageRating numReviews")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const averageRating = stats[0] ? Number(stats[0].averageRating.toFixed(2)) : 0;

    res.status(200).json({
      reviews,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      averageRating,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
