const express = require("express");
const {
  createOrder,
  createOrderFromCart,
  getOrders,
  updateOrderStatus,
  getDashboardStats,
  getUserOrders,
  cancelOrderByUser,
  deleteOrder,
  markOrderAsPaid,
  requestReturnByUser,
  updateReturnStatus,
} = require("../controllers/orderController");

const { requireSignIn, isAdmin } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

router.post("/", requireSignIn, createOrder);
router.post("/from-cart", requireSignIn, createOrderFromCart);
router.get("/", requireSignIn, isAdmin, getOrders);
router.get("/stats/dashboard", requireSignIn, isAdmin, getDashboardStats);
router.get("/my-orders", requireSignIn, getUserOrders);
router.put("/:id/cancel", requireSignIn, cancelOrderByUser);
router.post("/:id/return", requireSignIn, upload.fields([{ name: "returnImages", maxCount: 3 }]), requestReturnByUser);
router.put("/:id/return-status", requireSignIn, isAdmin, updateReturnStatus);
router.put("/:id", requireSignIn, isAdmin, updateOrderStatus);
router.put("/:id/pay", requireSignIn, isAdmin, markOrderAsPaid);
router.delete("/:id", requireSignIn, isAdmin, deleteOrder);

module.exports = router;
