const mongoose = require("mongoose");
const Category = require("./models/Category");
const Product = require("./models/Product");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✓ Connected to MongoDB");

    // Define 4 categories
    const categories = [
      {
        name: "Mobiles",
        image: "mobiles_category.png",
        subCategories: ["Smartphones", "Budget Phones", "Flagship"]
      },
      {
        name: "Laptops",
        image: "laptops_category.png",
        subCategories: ["Gaming Laptops", "Ultrabooks", "Business Laptops"]
      },
      {
        name: "Smart TVs",
        image: "smarttvs_category.png",
        subCategories: ["4K TVs", "OLED TVs", "Budget TVs"]
      },
      {
        name: "Headphones",
        image: "headphones_category.png",
        subCategories: ["Wireless", "Wired", "Noise Cancelling"]
      }
    ];

    // Products data for each category
    const categoryProducts = {
      Mobiles: [
        {
          name: "iPhone 15 Pro Max",
          brand: "Apple",
          subCategory: "Flagship",
          price: 179999,
          discountPrice: 169999,
          stock: 20,
          averageRating: 4.9,
          description: "Premium flagship with advanced titanium design and A17 Pro chip",
          image: "iphone15_pro_max.png",
          images: ["iphone15_pro_max_1.png", "iphone15_pro_max_2.png"],
          sku: "APPLE-IPH15PM-128",
          warranty: "1 Year International Warranty",
          features: ["Titanium Design", "A17 Pro Chip", "Action Button", "USB-C Support", "Always-On Display"],
          status: "In Stock"
        },
        {
          name: "Samsung Galaxy S24 Ultra",
          brand: "Samsung",
          subCategory: "Flagship",
          price: 129999,
          discountPrice: 124999,
          stock: 25,
          averageRating: 4.8,
          description: "Ultimate flagship with AI capabilities and built-in S Pen",
          image: "s24ultra.png",
          images: ["s24ultra_1.png", "s24ultra_2.png"],
          sku: "SAMS-S24U-256",
          warranty: "1 Year Brand Warranty",
          features: ["Galaxy AI", "Titanium Frame", "Built-in S Pen", "200MP Camera", "120Hz Display"],
          status: "In Stock"
        },
        {
          name: "Google Pixel 8 Pro",
          brand: "Google",
          subCategory: "Flagship",
          price: 106990,
          discountPrice: 99999,
          stock: 18,
          averageRating: 4.7,
          description: "AI-powered camera flagship with Tensor G3 chip",
          image: "pixel8_pro.png",
          images: ["pixel8_pro_1.png", "pixel8_pro_2.png"],
          sku: "GOOG-P8P-256",
          warranty: "1 Year Brand Warranty",
          features: ["Google Tensor G3", "Advanced AI Camera", "Magic Eraser", "7 Years Updates"],
          status: "In Stock"
        },
        {
          name: "OnePlus 12",
          brand: "OnePlus",
          subCategory: "Flagship",
          price: 64999,
          discountPrice: 59999,
          stock: 30,
          averageRating: 4.6,
          description: "Fast and smooth performance with Snapdragon 8 Gen 3",
          image: "oneplus12.png",
          images: ["oneplus12_1.png", "oneplus12_2.png"],
          sku: "ONEP-12-256",
          warranty: "1 Year Brand Warranty",
          features: ["Snapdragon 8 Gen 3", "120Hz ProXDR", "5400mAh Battery", "50W Wireless Charging"],
          status: "In Stock"
        },
        {
          name: "Xiaomi 14 Ultra",
          brand: "Xiaomi",
          subCategory: "Flagship",
          price: 89999,
          discountPrice: 84999,
          stock: 22,
          averageRating: 4.5,
          description: "Professional camera system in a compact flagship",
          image: "xiaomi14_ultra.png",
          images: ["xiaomi14_ultra_1.png", "xiaomi14_ultra_2.png"],
          sku: "XIAO-14U-512",
          warranty: "1 Year Brand Warranty",
          features: ["Leica Camera", "Snapdragon 8 Gen 3", "2K AMOLED Display", "50MP Main Camera"],
          status: "In Stock"
        },
        {
          name: "Vivo X100 Pro",
          brand: "Vivo",
          subCategory: "Flagship",
          price: 84999,
          discountPrice: 79999,
          stock: 20,
          averageRating: 4.5,
          description: "Ultra-clear flagship with Zeiss optics",
          image: "vivo_x100_pro.png",
          images: ["vivo_x100_pro_1.png", "vivo_x100_pro_2.png"],
          sku: "VIVO-X100P-512",
          warranty: "1 Year Brand Warranty",
          features: ["Zeiss Optics", "Snapdragon 8 Gen 3", "200MP Camera", "120Hz AMOLED"],
          status: "In Stock"
        },
        {
          name: "Realme 13 Pro Max",
          brand: "Realme",
          subCategory: "Flagship",
          price: 49999,
          discountPrice: 44999,
          stock: 35,
          averageRating: 4.4,
          description: "Powerful flagship at affordable price with advanced camera",
          image: "realme13_pro_max.png",
          images: ["realme13_pro_max_1.png", "realme13_pro_max_2.png"],
          sku: "REAL-13PM-512",
          warranty: "1 Year Brand Warranty",
          features: ["Snapdragon 8s Gen 1", "50MP Camera", "120Hz AMOLED", "67W Charging"],
          status: "In Stock"
        },
        {
          name: "OPPO Find X7 Ultra",
          brand: "OPPO",
          subCategory: "Flagship",
          price: 99999,
          discountPrice: 94999,
          stock: 18,
          averageRating: 4.6,
          description: "Ultra-slim design with advanced imaging technology",
          image: "oppo_find_x7.png",
          images: ["oppo_find_x7_1.png", "oppo_find_x7_2.png"],
          sku: "OPPO-X7U-512",
          warranty: "1 Year Brand Warranty",
          features: ["Ultra-slim Design", "Hasselblad Camera", "Snapdragon 8 Gen 3", "120Hz Display"],
          status: "In Stock"
        },
        {
          name: "Nothing Phone (2a)",
          brand: "Nothing",
          subCategory: "Budget Phones",
          price: 34999,
          discountPrice: 29999,
          stock: 40,
          averageRating: 4.3,
          description: "Unique design with Glyph Interface and Nothing OS",
          image: "nothing_phone_2a.png",
          images: ["nothing_phone_2a_1.png", "nothing_phone_2a_2.png"],
          sku: "NOTH-2A-256",
          warranty: "1 Year Brand Warranty",
          features: ["Glyph Interface", "Snapdragon 7 Gen 1", "50MP Camera", "Sustainable Design"],
          status: "In Stock"
        },
        {
          name: "Motorola Edge 50 Pro",
          brand: "Motorola",
          subCategory: "Flagship",
          price: 54999,
          discountPrice: 49999,
          stock: 25,
          averageRating: 4.4,
          description: "Clean Android experience with powerful performance",
          image: "moto_edge_50_pro.png",
          images: ["moto_edge_50_pro_1.png", "moto_edge_50_pro_2.png"],
          sku: "MOTO-E50P-512",
          warranty: "1 Year Brand Warranty",
          features: ["Snapdragon 8 Gen 3", "50MP OIS Camera", "144Hz Display", "Clean Android"],
          status: "In Stock"
        }
      ],
      Laptops: [
        {
          name: "MacBook Air M3",
          brand: "Apple",
          subCategory: "Ultrabooks",
          price: 114900,
          discountPrice: 109900,
          stock: 15,
          averageRating: 4.9,
          description: "Superportable laptop with M3 chip and 18-hour battery life",
          image: "macbook_air_m3.png",
          images: ["macbook_air_m3_1.png", "macbook_air_m3_2.png"],
          sku: "APPLE-MBA-M3",
          warranty: "1 Year Limited Warranty",
          features: ["Apple M3 Chip", "18-hour Battery", "13.6 Retina Display", "Silent Design"],
          status: "In Stock"
        },
        {
          name: "MacBook Pro 16 M3 Max",
          brand: "Apple",
          subCategory: "Business Laptops",
          price: 249900,
          discountPrice: 239900,
          stock: 10,
          averageRating: 4.9,
          description: "Professional powerhouse with M3 Max chip for creative work",
          image: "macbook_pro_16_m3.png",
          images: ["macbook_pro_16_m3_1.png", "macbook_pro_16_m3_2.png"],
          sku: "APPLE-MBP16-M3MAX",
          warranty: "1 Year Limited Warranty",
          features: ["M3 Max Chip", "20-hour Battery", "16-inch Liquid Retina XDR", "Pro Display Support"],
          status: "In Stock"
        },
        {
          name: "Dell XPS 13",
          brand: "Dell",
          subCategory: "Ultrabooks",
          price: 135000,
          discountPrice: 128000,
          stock: 12,
          averageRating: 4.7,
          description: "Ultra-portable with InfinityEdge display and premium design",
          image: "dell_xps_13.png",
          images: ["dell_xps_13_1.png", "dell_xps_13_2.png"],
          sku: "DELL-XPS13-I7",
          warranty: "1 Year Onsite Warranty",
          features: ["Intel Core i7", "InfinityEdge Display", "FHD Camera", "Backlit Keyboard"],
          status: "In Stock"
        },
        {
          name: "Dell XPS 15",
          brand: "Dell",
          subCategory: "Business Laptops",
          price: 189999,
          discountPrice: 179999,
          stock: 8,
          averageRating: 4.8,
          description: "Powerful 15-inch creator laptop with RTX GPU",
          image: "dell_xps_15.png",
          images: ["dell_xps_15_1.png", "dell_xps_15_2.png"],
          sku: "DELL-XPS15-RTX",
          warranty: "1 Year Onsite Warranty",
          features: ["Intel Core i9", "RTX 4080", "4K OLED Display", "Thunderbolt 4"],
          status: "In Stock"
        },
        {
          name: "HP Pavilion 15",
          brand: "HP",
          subCategory: "Business Laptops",
          price: 65999,
          discountPrice: 59999,
          stock: 20,
          averageRating: 4.5,
          description: "Reliable everyday laptop for work and entertainment",
          image: "hp_pavilion_15.png",
          images: ["hp_pavilion_15_1.png", "hp_pavilion_15_2.png"],
          sku: "HP-PAV15-I5",
          warranty: "1 Year Onsite Warranty",
          features: ["Intel Core i5", "15.6 FHD Display", "8GB RAM", "512GB SSD"],
          status: "In Stock"
        },
        {
          name: "ASUS VivoBook 14",
          brand: "ASUS",
          subCategory: "Ultrabooks",
          price: 49999,
          discountPrice: 44999,
          stock: 25,
          averageRating: 4.4,
          description: "Ultra-lightweight with all-day battery performance",
          image: "asus_vivobook_14.png",
          images: ["asus_vivobook_14_1.png", "asus_vivobook_14_2.png"],
          sku: "ASUS-VB14-R7",
          warranty: "1 Year Onsite Warranty",
          features: ["AMD Ryzen 7", "14 FHD Display", "70 Wh Battery", "Lightweight Design"],
          status: "In Stock"
        },
        {
          name: "Lenovo ThinkPad X1 Carbon",
          brand: "Lenovo",
          subCategory: "Business Laptops",
          price: 169999,
          discountPrice: 159999,
          stock: 14,
          averageRating: 4.7,
          description: "Premium business laptop with legendary ThinkPad keyboard",
          image: "lenovo_thinkpad_x1.png",
          images: ["lenovo_thinkpad_x1_1.png", "lenovo_thinkpad_x1_2.png"],
          sku: "LENO-X1C-I7",
          warranty: "3 Year Onsite Warranty",
          features: ["Intel Core i7", "14 OLED Display", "Legendary Keyboard", "All-day Battery"],
          status: "In Stock"
        },
        {
          name: "ASUS ROG Strix G16",
          brand: "ASUS",
          subCategory: "Gaming Laptops",
          price: 219999,
          discountPrice: 209999,
          stock: 10,
          averageRating: 4.8,
          description: "Extreme gaming performance with RTX 4090 GPU",
          image: "asus_rog_g16.png",
          images: ["asus_rog_g16_1.png", "asus_rog_g16_2.png"],
          sku: "ASUS-ROG-G16",
          warranty: "2 Year Onsite Warranty",
          features: ["Intel Core i9 HX", "RTX 4090", "165Hz Display", "Liquid Cooling"],
          status: "In Stock"
        },
        {
          name: "MSI GE63 Raider RGB",
          brand: "MSI",
          subCategory: "Gaming Laptops",
          price: 159999,
          discountPrice: 149999,
          stock: 12,
          averageRating: 4.6,
          description: "High-performance gaming with RGB lighting",
          image: "msi_ge63_raider.png",
          images: ["msi_ge63_raider_1.png", "msi_ge63_raider_2.png"],
          sku: "MSI-GE63-RGB",
          warranty: "2 Year Onsite Warranty",
          features: ["Intel Core i9", "RTX 4080", "165Hz IPS Display", "RGB Keyboard"],
          status: "In Stock"
        },
        {
          name: "Microsoft Surface Laptop 5",
          brand: "Microsoft",
          subCategory: "Ultrabooks",
          price: 129999,
          discountPrice: 119999,
          stock: 16,
          averageRating: 4.6,
          description: "Sleek and premium with touchscreen and Alcantara finish",
          image: "surface_laptop_5.png",
          images: ["surface_laptop_5_1.png", "surface_laptop_5_2.png"],
          sku: "MS-SL5-I7",
          warranty: "1 Year Limited Warranty",
          features: ["Intel Core i7", "13.5 PixelSense Touch", "Touchscreen", "Premium Design"],
          status: "In Stock"
        }
      ],
      "Smart TVs": [
        {
          name: "Sony Bravia XR K-95XR",
          brand: "Sony",
          subCategory: "4K TVs",
          price: 749999,
          discountPrice: 699999,
          stock: 5,
          averageRating: 4.9,
          description: "85-inch 8K Super Premium TV with Mini LED and cognitive processing",
          image: "sony_bravia_k95.png",
          images: ["sony_bravia_k95_1.png", "sony_bravia_k95_2.png"],
          sku: "SONY-XRK95",
          warranty: "3 Year Comprehensive Warranty",
          features: ["85-inch 8K Display", "Mini LED Backlight", "Cognitive Processor XR", "Dolby Vision & Atmos"],
          status: "In Stock"
        },
        {
          name: "Sony Bravia XR A80L OLED",
          brand: "Sony",
          subCategory: "OLED TVs",
          price: 249900,
          discountPrice: 229900,
          stock: 8,
          averageRating: 4.9,
          description: "55-inch stunning OLED TV with pure blacks and cognitive processor",
          image: "sony_bravia_a80l.png",
          images: ["sony_bravia_a80l_1.png", "sony_bravia_a80l_2.png"],
          sku: "SONY-XRA80L",
          warranty: "1 Year Comprehensive Warranty",
          features: ["OLED Display", "Cognitive Processor XR", "Google TV", "Dolby Vision & Atmos"],
          status: "In Stock"
        },
        {
          name: "Samsung QN95C OLED",
          brand: "Samsung",
          subCategory: "OLED TVs",
          price: 199999,
          discountPrice: 189999,
          stock: 10,
          averageRating: 4.8,
          description: "55-inch premium OLED with Quantum Dot technology",
          image: "samsung_qn95c.png",
          images: ["samsung_qn95c_1.png", "samsung_qn95c_2.png"],
          sku: "SAMS-QN95C",
          warranty: "2 Year Comprehensive Warranty",
          features: ["OLED Display", "Quantum Dot", "120Hz Refresh Rate", "Gaming Features"],
          status: "In Stock"
        },
        {
          name: "LG OLED83G3PUA",
          brand: "LG",
          subCategory: "OLED TVs",
          price: 379999,
          discountPrice: 349999,
          stock: 6,
          averageRating: 4.9,
          description: "83-inch OLED gallery experience with AI upscaling",
          image: "lg_oled_g3.png",
          images: ["lg_oled_g3_1.png", "lg_oled_g3_2.png"],
          sku: "LG-OLEDG3",
          warranty: "2 Year Comprehensive Warranty",
          features: ["83-inch OLED", "AI Upscaling", "Gaming Hub", "Quantum Dot"],
          status: "In Stock"
        },
        {
          name: "TCL 65 C745",
          brand: "TCL",
          subCategory: "4K TVs",
          price: 89999,
          discountPrice: 79999,
          stock: 15,
          averageRating: 4.5,
          description: "65-inch 4K Mini LED TV with great picture quality",
          image: "tcl_65_c745.png",
          images: ["tcl_65_c745_1.png", "tcl_65_c745_2.png"],
          sku: "TCL-65C745",
          warranty: "1 Year Warranty",
          features: ["4K Mini LED", "144Hz VRR", "Gaming Master", "Dolby Vision"],
          status: "In Stock"
        },
        {
          name: "Hisense 55 ULED",
          brand: "Hisense",
          subCategory: "Budget TVs",
          price: 39999,
          discountPrice: 34999,
          stock: 25,
          averageRating: 4.3,
          description: "55-inch 4K Ultra HD with vivid color performance",
          image: "hisense_55_uled.png",
          images: ["hisense_55_uled_1.png", "hisense_55_uled_2.png"],
          sku: "HISEN-55U",
          warranty: "1 Year Warranty",
          features: ["4K Ultra HD", "HDR Support", "Smart OS", "Vivid Color"],
          status: "In Stock"
        },
        {
          name: "OnePlus TV 85 QN85",
          brand: "OnePlus",
          subCategory: "4K TVs",
          price: 119999,
          discountPrice: 109999,
          stock: 10,
          averageRating: 4.6,
          description: "85-inch flagship TV with OxygenOS and gaming focus",
          image: "oneplus_tv_85.png",
          images: ["oneplus_tv_85_1.png", "oneplus_tv_85_2.png"],
          sku: "ONEP-TV85",
          warranty: "2 Year Warranty",
          features: ["85-inch 4K", "OxygenOS", "Gaming Master", "120Hz Panel"],
          status: "In Stock"
        },
        {
          name: "Philips 55 Oled+907",
          brand: "Philips",
          subCategory: "OLED TVs",
          price: 169999,
          discountPrice: 159999,
          stock: 8,
          averageRating: 4.7,
          description: "55-inch OLED with Ambilight technology",
          image: "philips_55_oled.png",
          images: ["philips_55_oled_1.png", "philips_55_oled_2.png"],
          sku: "PHIL-55OLED",
          warranty: "2 Year Warranty",
          features: ["OLED Display", "Ambilight 3-sided", "100Hz Refresh", "Premium Build"],
          status: "In Stock"
        },
        {
          name: "Mi 55 Inches 4K Smart TV",
          brand: "Xiaomi",
          subCategory: "Budget TVs",
          price: 35999,
          discountPrice: 29999,
          stock: 30,
          averageRating: 4.2,
          description: "55-inch smart TV with MI OS and good value",
          image: "mi_55_smart_tv.png",
          images: ["mi_55_smart_tv_1.png", "mi_55_smart_tv_2.png"],
          sku: "XIAO-MI55",
          warranty: "1 Year Warranty",
          features: ["4K Resolution", "MI OS", "Smart Features", "Affordable"],
          status: "In Stock"
        },
        {
          name: "Panasonic 55 LX700",
          brand: "Panasonic",
          subCategory: "4K TVs",
          price: 64999,
          discountPrice: 59999,
          stock: 12,
          averageRating: 4.4,
          description: "55-inch 4K with Panasonic picture quality",
          image: "panasonic_55_lx700.png",
          images: ["panasonic_55_lx700_1.png", "panasonic_55_lx700_2.png"],
          sku: "PANA-LX700",
          warranty: "2 Year Warranty",
          features: ["4K Display", "HDR Pro", "Smart TV", "Bright Picture"],
          status: "In Stock"
        }
      ],
      Headphones: [
        {
          name: "Sony WH-1000XM5",
          brand: "Sony",
          subCategory: "Noise Cancelling",
          price: 34990,
          discountPrice: 29990,
          stock: 30,
          averageRating: 4.9,
          description: "Industry-leading noise cancellation with 30-hour battery",
          image: "sony_wh1000xm5.png",
          images: ["sony_wh1000xm5_1.png", "sony_wh1000xm5_2.png"],
          sku: "SONY-WH1000XM5",
          warranty: "1 Year Warranty",
          features: ["Industry-leading ANC", "30-hour Battery", "Premium Sound", "Comfortable Design"],
          status: "In Stock"
        },
        {
          name: "Bose QuietComfort 45",
          brand: "Bose",
          subCategory: "Noise Cancelling",
          price: 38900,
          discountPrice: 34900,
          stock: 25,
          averageRating: 4.8,
          description: "Legendary comfort with exceptional noise cancellation",
          image: "bose_qc45.png",
          images: ["bose_qc45_1.png", "bose_qc45_2.png"],
          sku: "BOSE-QC45",
          warranty: "2 Year Warranty",
          features: ["Legendary Comfort", "Exceptional ANC", "24-hour Battery", "Premium Build"],
          status: "In Stock"
        },
        {
          name: "Apple AirPods Max",
          brand: "Apple",
          subCategory: "Noise Cancelling",
          price: 54900,
          discountPrice: 49900,
          stock: 20,
          averageRating: 4.7,
          description: "Spatial audio with dynamic head tracking and Adaptive Audio",
          image: "airpods_max.png",
          images: ["airpods_max_1.png", "airpods_max_2.png"],
          sku: "APPLE-APM",
          warranty: "1 Year Warranty",
          features: ["Spatial Audio", "Dynamic Head Tracking", "Adaptive Audio", "20-hour Battery"],
          status: "In Stock"
        },
        {
          name: "Sennheiser Momentum 4",
          brand: "Sennheiser",
          subCategory: "Wireless",
          price: 39990,
          discountPrice: 34990,
          stock: 22,
          averageRating: 4.6,
          description: "Premium sound with 60-hour battery life",
          image: "sennheiser_momentum_4.png",
          images: ["sennheiser_momentum_4_1.png", "sennheiser_momentum_4_2.png"],
          sku: "SENN-MOM4",
          warranty: "2 Year Warranty",
          features: ["Premium Sound", "60-hour Battery", "ANC", "Premium Build Quality"],
          status: "In Stock"
        },
        {
          name: "JBL Live Pro 2",
          brand: "JBL",
          subCategory: "Wireless",
          price: 24999,
          discountPrice: 19999,
          stock: 40,
          averageRating: 4.4,
          description: "True wireless earbuds with strong bass and ANC",
          image: "jbl_live_pro_2.png",
          images: ["jbl_live_pro_2_1.png", "jbl_live_pro_2_2.png"],
          sku: "JBL-LP2",
          warranty: "1 Year Warranty",
          features: ["True Wireless", "ANC", "Strong Bass", "Affordable"],
          status: "In Stock"
        },
        {
          name: "Beats Studio Pro",
          brand: "Beats",
          subCategory: "Noise Cancelling",
          price: 38990,
          discountPrice: 33990,
          stock: 28,
          averageRating: 4.5,
          description: "Professional grade with personalized spatial audio",
          image: "beats_studio_pro.png",
          images: ["beats_studio_pro_1.png", "beats_studio_pro_2.png"],
          sku: "BEATS-SP",
          warranty: "1 Year Warranty",
          features: ["Professional Grade", "Spatial Audio", "ANC", "Apple Ecosystem"],
          status: "In Stock"
        },
        {
          name: "Shure SRH840A",
          brand: "Shure",
          subCategory: "Wired",
          price: 29990,
          discountPrice: 24990,
          stock: 35,
          averageRating: 4.7,
          description: "Professional studio headphones with exceptional clarity",
          image: "shure_srh840a.png",
          images: ["shure_srh840a_1.png", "shure_srh840a_2.png"],
          sku: "SHUR-840A",
          warranty: "2 Year Warranty",
          features: ["Studio Quality", "Wired Connection", "Exceptional Clarity", "Professional Build"],
          status: "In Stock"
        },
        {
          name: "Beyerdynamic DT 900 Pro X",
          brand: "Beyerdynamic",
          subCategory: "Wired",
          price: 35990,
          discountPrice: 31990,
          stock: 24,
          averageRating: 4.8,
          description: "Open-back studio headphones for professional mixing",
          image: "beyerdynamic_dt900.png",
          images: ["beyerdynamic_dt900_1.png", "beyerdynamic_dt900_2.png"],
          sku: "BEYER-DT900",
          warranty: "2 Year Warranty",
          features: ["Open-back Design", "Studio Quality", "Professional Grade", "Excellent Sound Stage"],
          status: "In Stock"
        },
        {
          name: "Bang & Olufsen Beoplay H95",
          brand: "Bang & Olufsen",
          subCategory: "Noise Cancelling",
          price: 59990,
          discountPrice: 54990,
          stock: 12,
          averageRating: 4.9,
          description: "Luxury headphones with premium craftsmanship",
          image: "bo_beoplay_h95.png",
          images: ["bo_beoplay_h95_1.png", "bo_beoplay_h95_2.png"],
          sku: "BO-H95",
          warranty: "3 Year Warranty",
          features: ["Luxury Design", "Premium ANC", "Exceptional Sound", "Handcrafted"],
          status: "In Stock"
        },
        {
          name: "Audioquest Nighthawk",
          brand: "Audioquest",
          subCategory: "Wired",
          price: 49990,
          discountPrice: 44990,
          stock: 18,
          averageRating: 4.6,
          description: "Hi-Fi wired headphones with natural sound signature",
          image: "audioquest_nighthawk.png",
          images: ["audioquest_nighthawk_1.png", "audioquest_nighthawk_2.png"],
          sku: "AQT-NH",
          warranty: "2 Year Warranty",
          features: ["Hi-Fi Quality", "Natural Sound", "Wired", "Comfort Design"],
          status: "In Stock"
        }
      ]
    };

    // Seed categories first
    console.log("\n📦 Seeding Categories...");
    const createdCategories = {};

    for (const catData of categories) {
      let category = await Category.findOne({ name: catData.name });
      if (!category) {
        category = new Category(catData);
        await category.save();
        console.log(`✓ Created category: ${catData.name}`);
      } else {
        console.log(`✓ Category exists: ${catData.name}`);
      }
      createdCategories[catData.name] = category;
    }

    // Seed products for each category
    console.log("\n🛍️  Seeding Products (10 per category)...");
    let totalProductsAdded = 0;

    for (const [categoryName, products] of Object.entries(categoryProducts)) {
      console.log(`\n  Adding products to "${categoryName}"...`);
      
      for (let i = 0; i < products.length; i++) {
        const productData = {
          ...products[i],
          category: categoryName
        };

        // Check if product already exists
        let product = await Product.findOne({ sku: productData.sku });
        if (!product) {
          product = new Product(productData);
          await product.save();
          totalProductsAdded++;
          console.log(`    ✓ Added: ${productData.name}`);
        } else {
          console.log(`    ~ Already exists: ${productData.name}`);
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   • Categories Created: 4`);
    console.log(`   • Products Added: ${totalProductsAdded}`);
    console.log(`   • Products per Category: 10`);
    console.log(`   • Total Database Records: 4 categories + 40 products`);
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

seedData();
