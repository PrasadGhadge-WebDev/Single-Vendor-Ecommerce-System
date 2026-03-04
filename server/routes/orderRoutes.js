const express = require("express");
const {
  createOrder,
  getOrders,
  updateOrderStatus,
  getDashboardStats,
  getUserOrders
} = require("../controllers/orderController");

const { requireSignIn, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", requireSignIn, createOrder);
// admin only: list all orders
router.get("/", requireSignIn, isAdmin, getOrders);
// admin dashboard stats - must come BEFORE /:id route
router.get("/stats/dashboard", requireSignIn, isAdmin, getDashboardStats);
// user-specific order listing
router.get("/my-orders", requireSignIn, getUserOrders);
// update order status
router.put("/:id", requireSignIn, isAdmin, updateOrderStatus);

module.exports = router;