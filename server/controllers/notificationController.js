const Notification = require("../models/Notification");
const Product = require("../models/Product");

// Fetch unread or all notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ read: false });
    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper: Check stock and generate notification
exports.checkAndCreateStockNotification = async (productId) => {
  try {
    const product = await Product.findById(productId);
    if (!product) return;

    const threshold = product.lowStockAlert || 10;
    
    // Check out of stock
    if (product.stock === 0) {
      if (!product.outOfStockNotified) {
        // Create out of stock notification
        await Notification.create({
          type: "out_of_stock",
          title: "Out of Stock Alert",
          message: `${product.name} is currently out of stock.`,
          productId: product._id,
          link: `/admin/products?search=${product._id}`,
        });
        
        // Update flags
        product.outOfStockNotified = true;
        product.lowStockNotified = false; // It's out of stock now
        await product.save({ validateBeforeSave: false }); // Bypass complex validation
      }
    } 
    // Check low stock
    else if (product.stock <= threshold) {
      if (!product.lowStockNotified) {
        // Create low stock notification
        await Notification.create({
          type: "low_stock",
          title: "Low Stock Alert",
          message: `${product.name} has only ${product.stock} units remaining.`,
          productId: product._id,
          link: `/admin/products?search=${product._id}`,
        });

        // Update flags
        product.lowStockNotified = true;
        product.outOfStockNotified = false; // No longer out of stock
        await product.save({ validateBeforeSave: false });
      }
    } 
    // Normal stock
    else {
      if (product.lowStockNotified || product.outOfStockNotified) {
        // Stock replenished above threshold, reset flags
        product.lowStockNotified = false;
        product.outOfStockNotified = false;
        await product.save({ validateBeforeSave: false });
      }
    }
  } catch (error) {
    console.error("Error in checkAndCreateStockNotification:", error);
  }
};
