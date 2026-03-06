const express = require("express");
const {
  createOrder,
  createOrderFromCart,
  getOrders,
  updateOrderStatus,
  getDashboardStats,
  getUserOrders,
  cancelOrderByUser,
} = require("../controllers/orderController");

const { requireSignIn, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", requireSignIn, createOrder);
router.post("/from-cart", requireSignIn, createOrderFromCart);
router.get("/", requireSignIn, isAdmin, getOrders);
router.get("/stats/dashboard", requireSignIn, isAdmin, getDashboardStats);
router.get("/my-orders", requireSignIn, getUserOrders);
router.put("/:id/cancel", requireSignIn, cancelOrderByUser);
router.put("/:id", requireSignIn, isAdmin, updateOrderStatus);

module.exports = router;
