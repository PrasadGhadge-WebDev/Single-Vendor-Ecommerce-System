const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Product = require("./models/Product");

async function debugProducts() {
  try {
    const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/singlevendor";
    await mongoose.connect(mongoUrl);
    console.log("Connected to MongoDB");

    const products = await Product.find({}).lean();
    console.log(JSON.stringify(products.slice(0, 2), null, 2));

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

debugProducts();
