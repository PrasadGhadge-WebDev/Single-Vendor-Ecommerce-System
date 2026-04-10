const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const Product = require("./models/Product");

const listAll = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    const products = await Product.find({});
    console.log(JSON.stringify(products, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

listAll();
