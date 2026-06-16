const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      uppercase: true,
      trim: true,
      sparse: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    type: {
      type: String,
      enum: ["Percentage Discount", "Flat Discount", "Free Shipping"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: null, // Only for Percentage
    },
    applicableOn: {
      type: String,
      enum: ["All Products", "Specific Products", "Specific Categories"],
      required: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      }
    ],
    categories: [
      {
        type: String,
        trim: true,
      }
    ],
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
    },
    perUserLimit: {
      type: Number,
      default: null, // null means unlimited
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Draft", "Active", "Expired", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offer", offerSchema);
