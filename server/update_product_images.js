const mongoose = require("mongoose");
const Product = require("./models/Product");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/singlevendor";

const updateImages = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const products = await Product.find();
    console.log(`Found ${products.length} products`);

    const medicalImages = [
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1631549916768-4119b2e55916?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1471864190281-ad5f9f8162e6?q=80&w=1000&auto=format&fit=crop"
    ];

    const techImages = [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop"
    ];

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      let pool = techImages;
      
      if (p.category?.toLowerCase().includes("med") || p.category?.toLowerCase().includes("health") || p.name?.toLowerCase().includes("med")) {
        pool = medicalImages;
      }

      // Shuffle and take 3
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);

      await Product.findByIdAndUpdate(p._id, {
        image: selected[0],
        images: selected
      });
      console.log(`Updated images for: ${p.name}`);
    }

    console.log("All products updated successfully");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
};

updateImages();
