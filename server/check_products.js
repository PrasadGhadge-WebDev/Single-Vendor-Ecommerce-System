const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const Product = require("./models/Product");

async function checkProducts() {
  try {
    const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/singlevendor";
    await mongoose.connect(mongoUrl);
    console.log("Connected to MongoDB");

    const products = await Product.find({}, "name image category");
    console.log("All Products and Images:");
    products.forEach(p => {
      console.log(`- ${p.name} [${p.category}]: ${p.image}`);
    });

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

checkProducts();
