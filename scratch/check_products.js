const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../server/.env") });

const User = require("../server/models/User");
const Product = require("../server/models/Product");

async function checkProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const products = await Product.find({}, "name image");
    console.log("Current Products and Images:");
    products.forEach(p => {
      console.log(`- ${p.name}: ${p.image}`);
    });

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

checkProducts();
