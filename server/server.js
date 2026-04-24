require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const cartRoutes = require("./routes/cartRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const offerRoutes = require("./routes/offerRoutes");
const policyRoutes = require("./routes/policyRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const businessSettingRoutes = require("./routes/businessSettingRoutes");
const stockHistoryRoutes = require("./routes/stockHistoryRoutes");
const contactRoutes = require("./routes/contactRoutes");

connectDB();

const app = express();

// Fix for duplicate email: null error
const User = require("./models/User");
const fixIndexes = async () => {
  try {
    await User.collection.dropIndex("email_1");
    console.log("Re-syncing User indexes...");
    await User.syncIndexes();
  } catch (err) {
    // If index doesn't exist, it's fine
  }
};
fixIndexes();

app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/business-settings", businessSettingRoutes);
app.use("/api/stock-history", stockHistoryRoutes);
app.use("/api/contacts", contactRoutes);

app.get("/", (req, res) => {
  res.status(200).send("Single Vendor Backend Running Successfully");
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API Route Not Found",
  });
});

app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
