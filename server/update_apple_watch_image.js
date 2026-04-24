const mongoose = require("mongoose");
const Product = require("./models/Product");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const updateProductImage = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");

    const result = await Product.updateOne(
      { name: "Apple Watch Series 9" },
      { $set: { image: "apple_watch_series_9.png" } }
    );

    if (result.matchedCount > 0) {
      console.log("Successfully updated Apple Watch Series 9 image.");
    } else {
      console.log("Product 'Apple Watch Series 9' not found.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error updating product image:", error);
    process.exit(1);
  }
};

updateProductImage();
