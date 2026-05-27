const mongoose = require("mongoose");
const Product = require("./models/Product");
require("dotenv").config();

const categoryImages = {
  Mobiles: [
    "1512941937669-68a488e701c3", // iPhone style
    "1598327622308-2c74159d5bb8", // Generic white phone
    "1567581935884-3349723552ca", // Smartphone
    "1511707171634-5f897ff02aa9", // White Phone
    "1610945265064-0e34e5519bbf", // S21 style
    "1533228894184-407c07bdfa1b"  // Pixel style
  ],
  Laptops: [
    "1496181133206-80ce9b88a853", // MacBook style
    "1517336714731-489689fd1ca8", // MacBook Pro
    "1588872657578-7efd1f1555ed", // Gaming laptop
    "1593642632823-8f785ba67e45", // Dell style
    "1498050108023-c5249f4df085", // Laptop on desk
    "1603302576837-37561b2e2302"  // Professional laptop
  ],
  "Smart TVs": [
    "1593359677879-a4bb92f829d1", // OLED TV
    "1593784991095-a205039475fe", // TV on stand
    "1493934558514-023c9404f18a", // TV screen
    "1552533231-1552533231bd", // TV minimalist
    "1593784991095-a205039475fe"  // TV realistic
  ],
  Headphones: [
    "1505740420928-5e560c06d30e", // Professional headphones
    "1546435770-eb0b43f0f2d2", // Headphones
    "1583394838336-acd977736f90", // Sennheiser style
    "1618366712010-f4ae9c647dcb", // Sony style
    "1505740420928-5e560c06d30e"  // Studio headphones
  ],
  "Smart Watches": [
    "1523275335684-37898b6baf30", // Watch
    "1508685096489-775b0af397cb", // Smartwatch
    "1551816230-01efdf550c83", // Minimalist watch
    "1543512215-3783ed6a0223", // Galaxy watch style
    "1579586337278-3bbe3509f1c8"  // Tech watch
  ],
  "Gaming Accessories": [
    "1542751371-adc38448a05e", // Gaming setup
    "1612287230334-77189b98b363", // Gaming mouse
    "1511467687858-23d96c32e4ae", // Gaming keyboard
    "1605833556022-d31d37251ae9", // Controller
    "1527443224154-c4a3942d3acf"  // RGB mouse
  ],
  Cameras: [
    "1516035069371-29a1b244cc32", // DSLR
    "1510127034890-ba27508e9f1c", // Mirrorless
    "1500643752441-4dc90c18023a", // Vintage
    "1502920917128-1aa3edb30359", // Lens
    "1616764409377-f832347a06d9"  // Professional camera
  ],
  Speakers: [
    "1608155646451-356363081eac", // Speaker
    "1589003077984-894e133dabab", // Marshall style
    "1545454675414-274f1f501a17", // Minimalist speaker
    "1608155646451-356363081eac", // Bluetooth speaker
    "1558421808-16e6f53e346f"  // Modern speaker
  ]
};

const products = [
  // Mobiles
  {
    name: "iPhone 15 Pro",
    brand: "Apple",
    category: "Electronics",
    subCategory: "Mobiles",
    price: 134900,
    discountPrice: 129900,
    stock: 15,
    averageRating: 4.8,
    description: "The iPhone 15 Pro features a strong and light aerospace-grade titanium design with a textured matte-glass back.",
    image: "iphone15_clean.png",
    sku: "APPLE-IPH15P-128",
    warranty: "1 Year International Warranty",
    features: ["Titanium Design", "A17 Pro Chip", "Action Button", "USB-C Support"],
    status: "In Stock"
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    category: "Electronics",
    subCategory: "Mobiles",
    price: 129999,
    discountPrice: 124999,
    stock: 20,
    averageRating: 4.7,
    description: "Meet Galaxy S24 Ultra, the ultimate form of Galaxy Ultra with a new titanium exterior and a 17.25cm (6.8\") flat display.",
    image: "s24ultra_clean.png",
    sku: "SAMS-S24U-256",
    warranty: "1 Year Brand Warranty",
    features: ["Galaxy AI", "Titanium Frame", "Built-in S Pen", "200MP Camera"],
    status: "In Stock"
  },
  {
    name: "OnePlus 12",
    brand: "OnePlus",
    category: "Electronics",
    subCategory: "Mobiles",
    price: 64999,
    discountPrice: 61999,
    stock: 25,
    averageRating: 4.6,
    description: "The OnePlus 12 is a masterpiece of design and performance with the Snapdragon 8 Gen 3.",
    image: "oneplus12.png",
    sku: "1PLS-12-256",
    warranty: "1 Year Brand Warranty",
    features: ["Snapdragon 8 Gen 3", "2K 120Hz ProXDR Display", "5400mAh Battery", "50W Wireless Charging"],
    status: "In Stock"
  },
  {
    name: "Google Pixel 8 Pro",
    brand: "Google",
    category: "Electronics",
    subCategory: "Mobiles",
    price: 106990,
    discountPrice: 99999,
    stock: 12,
    averageRating: 4.5,
    description: "The all-pro phone engineered by Google. It's sleek, sophisticated, and has the most advanced Pixel Camera yet.",
    image: "pixel8.png",
    sku: "GOOG-P8P-128",
    warranty: "1 Year Brand Warranty",
    features: ["Google Tensor G3", "Advanced AI Camera", "Super Actua Display", "7 Years Updates"],
    status: "In Stock"
  },
  {
    name: "Nothing Phone (2)",
    brand: "Nothing",
    category: "Electronics",
    subCategory: "Mobiles",
    price: 44999,
    discountPrice: 39999,
    stock: 30,
    averageRating: 4.4,
    description: "A new way to interact. The Glyph Interface, Nothing OS 2.0, and a premium camera system.",
    image: "nothing2.png",
    sku: "NOTH-P2-256",
    warranty: "1 Year Brand Warranty",
    features: ["Unique Glyph Interface", "Snapdragon 8+ Gen 1", "50MP Dual Camera", "Sustainable Design"],
    status: "In Stock"
  },

  // Laptops
  {
    name: "MacBook Air M3",
    brand: "Apple",
    category: "Electronics",
    subCategory: "Laptops",
    price: 114900,
    discountPrice: 109900,
    stock: 18,
    averageRating: 4.9,
    description: "The M3 chip brings even greater capabilities to the superportable 13-inch MacBook Air.",
    image: "macbookair_clean.png",
    sku: "APPLE-MBA-M3",
    warranty: "1 Year Limited Warranty",
    features: ["Apple M3 Chip", "18-hour Battery Life", "Liquid Retina Display", "Silent Design"],
    status: "In Stock"
  },
  {
    name: "Dell XPS 13",
    brand: "Dell",
    category: "Electronics",
    subCategory: "Laptops",
    price: 135000,
    discountPrice: 128000,
    stock: 10,
    averageRating: 4.6,
    description: "Our smallest 13-inch laptop features a 3-sided InfinityEdge display and 12th Gen Intel Core processors.",
    image: "dellxps.png",
    sku: "DELL-XPS13-I7",
    warranty: "1 Year Onsite Warranty",
    features: ["Intel Core i7", "InfinityEdge Display", "Backlit Keyboard", "Premium Build"],
    status: "In Stock"
  },

  // Smart TVs
  {
    name: "Sony Bravia XR A80L",
    brand: "Sony",
    category: "Electronics",
    subCategory: "Smart TVs",
    price: 249900,
    discountPrice: 229900,
    stock: 6,
    averageRating: 4.9,
    description: "Experience pure blacks and immersive sound on this stunning OLED TV with Cognitive Processor XR.",
    image: "sony_tv_clean.png",
    sku: "SONY-TV-A80L",
    warranty: "1 Year Comprehensive Warranty",
    features: ["OLED Display", "Cognitive Processor XR", "Google TV", "Dolby Vision & Atmos"],
    status: "In Stock"
  },
  {
    name: "LG C3 OLED TV",
    brand: "LG",
    category: "Electronics",
    subCategory: "Smart TVs",
    price: 189990,
    discountPrice: 174990,
    stock: 8,
    averageRating: 4.8,
    description: "The ultimate gaming and cinema TV with self-lit pixels and Alpha 9 Gen 6 AI processor.",
    image: "lgoled.png",
    sku: "LG-TV-C3",
    warranty: "1 Year Comprehensive + 2 Years on Panel",
    features: ["α9 Gen6 AI Processor", "OLED Evo", "G-Sync Compatible", "WebOS 23"],
    status: "In Stock"
  },

  // Headphones
  {
    name: "Sony WH-1000XM5",
    brand: "Sony",
    category: "Electronics",
    subCategory: "Headphones",
    price: 29990,
    discountPrice: 26990,
    stock: 40,
    averageRating: 4.8,
    description: "The best noise cancelling headphones just got better. Industry-leading noise cancellation and sound quality.",
    image: "sony_headphones_clean.png",
    sku: "SONY-XM5-BLK",
    warranty: "1 Year Brand Warranty",
    features: ["Industry-leading Noise Cancelling", "30-hour Battery", "Precise Voice Pickup", "Multipoint Connection"],
    status: "In Stock"
  },

  // Smart Watches
  {
    name: "Apple Watch Ultra 2",
    brand: "Apple",
    category: "Electronics",
    subCategory: "Smart Watches",
    price: 89900,
    discountPrice: 84900,
    stock: 20,
    averageRating: 4.9,
    description: "The most rugged and capable Apple Watch ever. Designed for endurance, exploration, and adventure.",
    image: "apple_watch_ultra_clean.png",
    sku: "APPLE-WAT-ULT2",
    warranty: "1 Year Brand Warranty",
    features: ["Titanium Case", "Precision Dual-frequency GPS", "Up to 36 Hours Battery", "Siren & Depth Gauge"],
    status: "In Stock"
  }
];

const brands = ["Apple", "Samsung", "Sony", "Bose", "Dell", "HP", "ASUS", "Lenovo", "LG", "OnePlus", "Google", "Logitech", "Razer", "Canon", "JBL", "Marshall"];
const subCats = ["Mobiles", "Laptops", "Smart TVs", "Headphones", "Smart Watches", "Gaming Accessories", "Cameras", "Speakers"];

while (products.length < 50) {
  const subCat = subCats[Math.floor(Math.random() * subCats.length)];
  const brand = brands[Math.floor(Math.random() * brands.length)];
  const id = products.length + 1;
  const imageList = categoryImages[subCat] || categoryImages["Mobiles"];
  const imageId = imageList[Math.floor(Math.random() * imageList.length)];
  
  const basePrice = Math.floor(Math.random() * 100000) + 5000;
  const discount = Math.floor(Math.random() * 5000) + 500;
  
  products.push({
    name: `${brand} ${subCat} Model ${id}`,
    brand: brand,
    category: "Electronics",
    subCategory: subCat,
    price: basePrice,
    discountPrice: basePrice - discount,
    stock: Math.floor(Math.random() * 100),
    averageRating: parseFloat((Math.random() * (5 - 3.5) + 3.5).toFixed(1)),
    description: `Professional ${subCat} by ${brand}. Features cutting edge technology and premium design for modern users.`,
    image: `https://images.unsplash.com/photo-${imageId}?q=80&w=800`,
    sku: `${brand.slice(0,3).toUpperCase()}-${subCat.slice(0,3).toUpperCase()}-${id}`,
    warranty: "1 Year Brand Warranty",
    features: ["High Performance", "Modern Design", "Durable Build", "Advanced Features"],
    status: "In Stock"
  });
}

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");

    console.log("Clearing existing products...");
    await Product.deleteMany({});
    
    await Product.insertMany(products);
    console.log("50 Products seeded successfully with high-quality realistic images!");

    await mongoose.disconnect();
    process.exit();
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seed();
