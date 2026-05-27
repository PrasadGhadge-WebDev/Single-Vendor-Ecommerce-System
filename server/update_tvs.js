const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const Product = require("./models/Product");

async function updateTvImages() {
  try {
    const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/singlevendor";
    await mongoose.connect(mongoUrl);
    console.log("Connected to MongoDB");

    const updates = [
        { name: "Sony Bravia 55 4K", image: "sonybravia.png" },
        { name: "LG OLED 65", image: "lgoled.png" },
        { name: "Samsung QLED 55", image: "samsungqled.png" },
        { name: "Mi TV 5X", image: "mitv5x.png" },
        { name: "OnePlus TV U1S", image: "oneplustv.png" },
        { name: "TCL 50 4K", image: "tcl4k.png" },
        { name: "Hisense 55 Smart", image: "samsungqled.png" },
        { name: "Vu Premium TV", image: "mitv5x.png" },
        { name: "Panasonic 4K TV", image: "oneplustv.png" },
        { name: "Philips Smart TV", image: "tcl4k.png" }
    ];

    for (const update of updates) {
        const result = await Product.updateOne(
            { name: update.name },
            { $set: { image: update.image } }
        );
        if (result.modifiedCount > 0) {
            console.log(`Updated image for ${update.name}`);
        }
    }

    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (err) {
    console.error(err);
  }
}

updateTvImages();
