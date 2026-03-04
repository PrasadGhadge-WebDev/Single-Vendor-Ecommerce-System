const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    price: Number,
    category: String,
    stock: Number,
    image: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);