const mongoose = require("mongoose");
const Category = require("./models/Category");
const Product = require("./models/Product");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const seedWatchCategory = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✓ Connected to MongoDB");

    // Create Watch Category
    console.log("\n📦 Seeding Watch Category...");
    
    let category = await Category.findOne({ name: "Watches" });
    if (!category) {
      category = new Category({
        name: "Watches",
        image: "watches_category.png",
        subCategories: ["Smartwatches", "Luxury Watches", "Sports Watches", "Casual Watches"]
      });
      await category.save();
      console.log("✓ Created category: Watches");
    } else {
      console.log("✓ Category Watches already exists");
    }

    // 10 Popular Watches
    const watches = [
      {
        name: "Apple Watch Series 9",
        brand: "Apple",
        category: "Watches",
        subCategory: "Smartwatches",
        price: 42900,
        discountPrice: 38900,
        stock: 35,
        averageRating: 4.9,
        description: "Advanced health and fitness tracker with always-on Retina display",
        image: "apple_watch_series_9.png",
        images: ["apple_watch_series_9_1.png", "apple_watch_series_9_2.png"],
        sku: "APPLE-WATCH-S9",
        warranty: "1 Year Limited Warranty",
        features: ["Always-On Display", "ECG App", "Blood Oxygen", "Fitness Tracking", "Water Resistant"],
        status: "In Stock"
      },
      {
        name: "Samsung Galaxy Watch 6 Classic",
        brand: "Samsung",
        category: "Watches",
        subCategory: "Smartwatches",
        price: 35999,
        discountPrice: 31999,
        stock: 40,
        averageRating: 4.8,
        description: "Rotating bezel smartwatch with Wear OS 3 and vibrant AMOLED display",
        image: "samsung_galaxy_watch_6.png",
        images: ["samsung_galaxy_watch_6_1.png", "samsung_galaxy_watch_6_2.png"],
        sku: "SAMS-GW6-CLASSIC",
        warranty: "1 Year Brand Warranty",
        features: ["Rotating Bezel", "AMOLED Display", "Wear OS 3", "Blood Oxygen", "Heart Rate Monitor"],
        status: "In Stock"
      },
      {
        name: "Garmin Epix Gen 2",
        brand: "Garmin",
        category: "Watches",
        subCategory: "Sports Watches",
        price: 49999,
        discountPrice: 44999,
        stock: 25,
        averageRating: 4.8,
        description: "Premium multisport smartwatch with AMOLED display and advanced training features",
        image: "garmin_epix_gen2.png",
        images: ["garmin_epix_gen2_1.png", "garmin_epix_gen2_2.png"],
        sku: "GARM-EPIX-G2",
        warranty: "2 Year Warranty",
        features: ["AMOLED Display", "Multisport", "GPS", "Training Metrics", "11-day Battery"],
        status: "In Stock"
      },
      {
        name: "Rolex Submariner",
        brand: "Rolex",
        category: "Watches",
        subCategory: "Luxury Watches",
        price: 899999,
        discountPrice: 849999,
        stock: 5,
        averageRating: 5.0,
        description: "Iconic luxury dive watch with Swiss precision and timeless design",
        image: "rolex_submariner.png",
        images: ["rolex_submariner_1.png", "rolex_submariner_2.png"],
        sku: "ROLEX-SUB-STEEL",
        warranty: "5 Year International Warranty",
        features: ["Swiss Movement", "Water Resistant", "Luxury Build", "Iconic Design", "Prestige"],
        status: "In Stock"
      },
      {
        name: "Omega Seamaster Aqua Terra",
        brand: "Omega",
        category: "Watches",
        subCategory: "Luxury Watches",
        price: 649999,
        discountPrice: 599999,
        stock: 6,
        averageRating: 4.9,
        description: "Swiss luxury watch with elegant design and exceptional craftsmanship",
        image: "omega_seamaster.png",
        images: ["omega_seamaster_1.png", "omega_seamaster_2.png"],
        sku: "OMEGA-SEAMASTER",
        warranty: "5 Year International Warranty",
        features: ["Swiss Chronometer", "Water Resistant", "Premium Materials", "Elegant Design", "Master Craftsmanship"],
        status: "In Stock"
      },
      {
        name: "Fitbit Sense 2",
        brand: "Fitbit",
        category: "Watches",
        subCategory: "Smartwatches",
        price: 21999,
        discountPrice: 17999,
        stock: 50,
        averageRating: 4.5,
        description: "Health-focused smartwatch with stress management and advanced fitness tracking",
        image: "fitbit_sense_2.png",
        images: ["fitbit_sense_2_1.png", "fitbit_sense_2_2.png"],
        sku: "FITBIT-SENSE2",
        warranty: "1 Year Warranty",
        features: ["Stress Management", "EDA Sensor", "6-day Battery", "GPS", "Sleep Tracking"],
        status: "In Stock"
      },
      {
        name: "Fossil Gen 6 Smartwatch",
        brand: "Fossil",
        category: "Watches",
        subCategory: "Casual Watches",
        price: 24999,
        discountPrice: 19999,
        stock: 45,
        averageRating: 4.4,
        description: "Stylish Wear OS smartwatch with classic design and modern features",
        image: "fossil_gen6.png",
        images: ["fossil_gen6_1.png", "fossil_gen6_2.png"],
        sku: "FOSSIL-GEN6",
        warranty: "1 Year Warranty",
        features: ["Wear OS 3", "AMOLED Display", "4-day Battery", "Quick Charging", "Stylish Design"],
        status: "In Stock"
      },
      {
        name: "Tag Heuer Carrera",
        brand: "Tag Heuer",
        category: "Watches",
        subCategory: "Luxury Watches",
        price: 799999,
        discountPrice: 749999,
        stock: 4,
        averageRating: 4.9,
        description: "Swiss luxury sports watch with precision engineering and sporty elegance",
        image: "tag_heuer_carrera.png",
        images: ["tag_heuer_carrera_1.png", "tag_heuer_carrera_2.png"],
        sku: "TAGHEUER-CARRERA",
        warranty: "5 Year International Warranty",
        features: ["Swiss Precision", "Sports Design", "Chronograph", "Premium Materials", "Elegance"],
        status: "In Stock"
      },
      {
        name: "Huawei Watch GT 4",
        brand: "Huawei",
        category: "Watches",
        subCategory: "Smartwatches",
        price: 19999,
        discountPrice: 16999,
        stock: 55,
        averageRating: 4.6,
        description: "Long battery life smartwatch with comprehensive health tracking",
        image: "huawei_watch_gt4.png",
        images: ["huawei_watch_gt4_1.png", "huawei_watch_gt4_2.png"],
        sku: "HUAWEI-GT4",
        warranty: "1 Year Warranty",
        features: ["14-day Battery", "AMOLED Display", "100+ Workouts", "Health Tracking", "Stylish Design"],
        status: "In Stock"
      },
      {
        name: "Citizen Eco-Drive",
        brand: "Citizen",
        category: "Watches",
        subCategory: "Casual Watches",
        price: 29999,
        discountPrice: 24999,
        stock: 38,
        averageRating: 4.7,
        description: "Eco-friendly watch powered by light with elegant and durable design",
        image: "citizen_eco_drive.png",
        images: ["citizen_eco_drive_1.png", "citizen_eco_drive_2.png"],
        sku: "CITIZEN-ECODRIVE",
        warranty: "5 Year Warranty",
        features: ["Light Powered", "Eco-Friendly", "Date Display", "Water Resistant", "Durable Build"],
        status: "In Stock"
      }
    ];

    // Seed watches products
    console.log("\n🛍️  Seeding Watch Products (10 total)...");
    let totalAdded = 0;

    for (const watchData of watches) {
      let product = await Product.findOne({ sku: watchData.sku });
      if (!product) {
        product = new Product(watchData);
        await product.save();
        totalAdded++;
        console.log(`✓ Added: ${watchData.name}`);
      } else {
        console.log(`~ Already exists: ${watchData.name}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ WATCH CATEGORY SEEDING COMPLETED!");
    console.log("=".repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   • Category: Watches`);
    console.log(`   • Products Added: ${totalAdded}`);
    console.log(`   • Sub-Categories: 4`);
    console.log(`     - Smartwatches (5 products)`);
    console.log(`     - Luxury Watches (3 products)`);
    console.log(`     - Sports Watches (1 product)`);
    console.log(`     - Casual Watches (1 product)`);
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

seedWatchCategory();
