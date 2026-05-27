const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const Product = require("./models/Product");

async function updateProductImages() {
  try {
    const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/singlevendor";
    await mongoose.connect(mongoUrl);
    console.log("Connected to MongoDB");

    const updates = [
        { name: "iPhone 15 Pro Max", image: "iphone15.png" },
        { name: "Samsung Galaxy S24 Ultra", image: "s24ultra.png" },
        { name: "OnePlus 12", image: "oneplus12.png" },
        { name: "Realme GT 6", image: "realmgt6.png" },
        { name: "Redmi Note 13 Pro", image: "redminote13.png" },
        { name: "iQOO Neo 9", image: "iqooneo9.png" }
    ];

    for (const update of updates) {
        const result = await Product.updateOne(
            { name: update.name },
            { $set: { image: update.image } }
        );
        if (result.modifiedCount > 0) {
            console.log(`Updated image for ${update.name}`);
        } else {
            console.log(`No change or product not found for ${update.name}`);
        }
    }

    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (err) {
    console.error(err);
  }
}

updateProductImages();
