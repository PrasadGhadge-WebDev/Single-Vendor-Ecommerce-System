const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const Product = require("./models/Product");

async function updateAllProducts() {
  try {
    const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/singlevendor";
    await mongoose.connect(mongoUrl);
    console.log("Connected to MongoDB");

    const mappings = [
        // Smartphones
        { name: "Vivo V30 Pro", image: "iphone15.png" }, // Using high quality generic smartphone
        { name: "Oppo Reno 11", image: "s24ultra.png" },
        { name: "Google Pixel 8", image: "pixel8.png" },
        { name: "Nothing Phone 2", image: "nothing2.png" },
        { name: "Motorola Edge 40", image: "oneplus12.png" },
        { name: "Samsung Galaxy A54", image: "s24ultra.png" },
        { name: "Poco X6 Pro", image: "realmgt6.png" },
        { name: "Asus ROG Phone 7", image: "iqooneo9.png" },
        { name: "Sony Xperia 1 V", image: "iphone15.png" },
        { name: "Nokia X30", image: "smartphone_white.png" }, // Keep if no better
        { name: "Infinix Zero Ultra", image: "realmgt6.png" },

        // Laptops
        { name: "MacBook Air M2", image: "macbookair.png" },
        { name: "Dell XPS 13", image: "dellxps.png" },
        { name: "HP Pavilion 15", image: "macbookair.png" },
        { name: "Lenovo IdeaPad Slim 5", image: "dellxps.png" },
        { name: "Asus ROG Strix", image: "macbookair.png" },
        { name: "Acer Aspire 7", image: "dellxps.png" },
        { name: "MSI GF63", image: "macbookair.png" },
        { name: "HP Victus", image: "dellxps.png" },
        { name: "Lenovo Legion 5", image: "macbookair.png" },
        { name: "Asus VivoBook 15", image: "dellxps.png" },
        { name: "MacBook Pro M3", image: "macbookair.png" },
        { name: "Dell Inspiron 15", image: "dellxps.png" },
        { name: "HP Envy x360", image: "macbookair.png" },
        { name: "Lenovo Yoga Slim", image: "dellxps.png" },
        { name: "Asus ZenBook 14", image: "macbookair.png" },
        { name: "Acer Swift 3", image: "dellxps.png" },
        { name: "HP Chromebook", image: "macbookair.png" },
        { name: "Lenovo ThinkPad E14", image: "dellxps.png" },

        // TVs
        { name: "Sony Bravia 55 4K", image: "sonybravia.png" },
        { name: "LG OLED 65", image: "lgoled.png" },
        { name: "Samsung QLED 55", image: "sonybravia.png" },
        { name: "Mi TV 5X", image: "lgoled.png" },
        { name: "OnePlus TV U1S", image: "sonybravia.png" },
        { name: "TCL 50 4K", image: "lgoled.png" },
        { name: "Hisense 55 Smart", image: "sonybravia.png" },
        { name: "Vu Premium TV", image: "lgoled.png" },
        { name: "Panasonic 4K TV", image: "sonybravia.png" },
        { name: "Philips Smart TV", image: "lgoled.png" }
    ];

    for (const mapping of mappings) {
        const result = await Product.updateOne(
            { name: mapping.name },
            { $set: { image: mapping.image } }
        );
        if (result.modifiedCount > 0) {
            console.log(`Updated image for ${mapping.name}`);
        }
    }

    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (err) {
    console.error(err);
  }
}

updateAllProducts();
