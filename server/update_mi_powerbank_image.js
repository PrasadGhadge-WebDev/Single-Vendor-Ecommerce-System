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
      { name: "Mi Power Bank 3i 20000mAh" },
      { $set: { image: "mi_power_bank_3i.png" } }
    );

    if (result.matchedCount > 0) {
      console.log("Successfully updated Mi Power Bank 3i 20000mAh image.");
    } else {
      console.log("Product 'Mi Power Bank 3i 20000mAh' not found.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error updating product image:", error);
    process.exit(1);
  }
};

updateProductImage();
