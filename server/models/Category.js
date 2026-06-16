const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, unique: true, sparse: true },
    description: { type: String },
    image: { type: String },
    parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    subCategories: [String], // Keeping for backward compatibility or simple tags
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    featured: { type: Boolean, default: false },
    seo: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);