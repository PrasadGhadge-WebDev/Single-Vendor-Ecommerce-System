// ===============================
// 1️⃣ Load Environment Variables
// ===============================
require("dotenv").config();

// ===============================
// 2️⃣ Import Core Packages
// ===============================
const express = require("express");
const cors = require("cors");
const path = require("path");

// ===============================
// 3️⃣ Import Custom Files
// ===============================
const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

// ===============================
// 4️⃣ Connect Database
// ===============================
connectDB();

// ===============================
// 5️⃣ Initialize Express App
// ===============================
const app = express();

// ===============================
// 6️⃣ Middlewares
// ===============================

// Enable CORS - Allow all origins and ports
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body Parser - Increase limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static Upload Folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===============================
// 7️⃣ API Routes
// ===============================
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);

// ===============================
// 8️⃣ Root Route
// ===============================
app.get("/", (req, res) => {
  res.status(200).send("🚀 Single Vendor Backend Running Successfully");
});

// ===============================
// 9️⃣ 404 Route Handler
// ===============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API Route Not Found",
  });
});

// ===============================
// 🔟 Global Error Handler
// ===============================
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

// ===============================
// 1️⃣1️⃣ Start Server
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});