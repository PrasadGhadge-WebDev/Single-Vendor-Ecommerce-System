const mongoose = require("mongoose");
const Category = require("./models/Category");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");

    const categories = [
      {
        name: "Electronics",
        subCategories: [
          "Mobiles",
          "Laptops",
          "Audio",
          "Wearables",
          "Tablets",
          "Accessories",
          "Peripherals"
        ]
      }
    ];

    for (const catData of categories) {
      let category = await Category.findOne({ name: catData.name });
      if (!category) {
        category = new Category(catData);
        await category.save();
        console.log(`Created category: ${catData.name}`);
      } else {
        // Update subcategories if they are missing
        const existingSubs = category.subCategories || [];
        const newSubs = catData.subCategories.filter(s => !existingSubs.includes(s));
        if (newSubs.length > 0) {
          category.subCategories = [...existingSubs, ...newSubs];
          await category.save();
          console.log(`Updated subcategories for ${catData.name}: added ${newSubs.join(", ")}`);
        } else {
          console.log(`Category ${catData.name} is already up to date.`);
        }
      }
    }

    console.log("Category seeding completed.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding categories:", error);
    process.exit(1);
  }
};

seedCategories();
