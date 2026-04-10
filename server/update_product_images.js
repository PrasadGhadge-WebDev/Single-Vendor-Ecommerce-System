const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const Product = require("./models/Product");

const updates = [
  { name: /iPhone 15 Pro Max/i, image: "iphone_premium.png" },
  { name: /Dell XPS 13/i, image: "dell_premium.png" },
  { name: /Casual Hoodie/i, image: "hoodie_premium.png" },
  { name: /MacBook Pro M3/i, image: "macbook_premium.png" },
  { name: /Samsung Galaxy S24 Ultra/i, image: "s24_premium.png" },
  { name: /Denim Jacket/i, image: "jacket_premium.png" },
  { name: /Gaming T-Shirt/i, image: "tshirt_premium.png" },
  { name: /Summer Dress/i, image: "dress_premium.png" },
  // Generic fallbacks for other electronics/clothing
  { category: /Electronics/i, image: "iphone_premium.png", condition: (p) => !p.image || p.image.includes("s10") },
  { category: /Clothing/i, image: "hoodie_premium.png", condition: (p) => !p.image || p.image.includes("Clothing") },
];

const updateProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    const products = await Product.find({});
    
    for (const p of products) {
      for (const update of updates) {
        if (update.name && update.name.test(p.name)) {
          p.image = update.image;
          break;
        }
        if (update.category && update.category.test(p.category)) {
          if (update.condition && update.condition(p)) {
            p.image = update.image;
            break;
          }
        }
      }
      await p.save();
    }
    
    console.log("✅ Successfully updated product images.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

updateProducts();
