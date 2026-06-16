const Order = require("../models/Order");
const Product = require("../models/Product");
const ContactMessage = require("../models/ContactMessage");
const User = require("../models/User");
const mongoose = require("mongoose");

exports.getNavbarStats = async (req, res) => {
  try {
    const [pendingOrders, lowStockProducts, pendingMessages] = await Promise.all([
      Order.countDocuments({ status: "pending" }),
      Product.countDocuments({ stock: { $lte: 10 } }),
      ContactMessage.countDocuments({ status: "pending" }),
    ]);

    res.status(200).json({
      pendingOrders,
      lowStockProducts,
      pendingMessages,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(200).json([]);
    }

    const regex = new RegExp(q, "i");
    const results = [];

    // Search Products
    const products = await Product.find({ name: regex }).limit(5).select("name _id price");
    products.forEach((p) => {
      results.push({ type: "Product", name: p.name, id: p._id, url: "/admin/products" });
    });

    // Search Users
    const users = await User.find({
      $or: [{ name: regex }, { email: regex }],
    }).limit(5).select("name email _id");
    users.forEach((u) => {
      results.push({ type: "Customer", name: u.name, id: u._id, url: "/admin/users" });
    });

    // Search Orders (if q is a valid ObjectId, search by ID. Alternatively, we can skip string-regex on ObjectId)
    if (mongoose.Types.ObjectId.isValid(q)) {
      const order = await Order.findById(q).select("_id totalAmount status").lean();
      if (order) {
        results.push({ type: "Order", name: `#ORD-${order._id.toString().slice(-6).toUpperCase()}`, id: order._id, url: "/admin/orders" });
      }
    }

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
