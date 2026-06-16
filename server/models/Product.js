const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.Mixed,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
    shortDescription: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    specifications: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
    },
    costPrice: {
      type: Number,
      min: 0,
    },
    taxClass: {
      type: String,
      default: "GST 18%",
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    subCategory: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    images: [
      {
        type: String,
      },
    ],
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    stockStatus: {
      type: String,
      enum: ["In Stock", "Out of Stock", "Pre-Order"],
      default: "In Stock",
    },
    lowStockAlert: {
      type: Number,
      default: 10,
      min: 0,
    },
    lowStockNotified: {
      type: Boolean,
      default: false,
    },
    outOfStockNotified: {
      type: Boolean,
      default: false,
    },
    variants: [
      {
        size: String,
        color: String,
        storage: String,
        ram: String,
        price: Number,
        sku: String,
        stock: Number,
        image: String,
      }
    ],
    seoSettings: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: String,
    },
    shipping: {
      weight: Number,
      length: Number,
      width: Number,
      height: Number,
    },
    warranty: {
      type: String,
      trim: true,
    },
    features: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["Draft", "Active", "Inactive", "Archived"],
      default: "Active",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
