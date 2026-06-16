const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const { buildProductQuery } = require("./productController");
const Cart = require("../models/Cart");
const Offer = require("../models/Offer");
const { logStockHistory } = require("../utils/stockHistoryLogger");
const Payment = require("../models/Payment");
const { checkAndCreateStockNotification } = require("./notificationController");

const STATUS_MAP = {
  pending: "pending",
  confirmed: "confirmed",
  processing: "processing",
  shipped: "shipped",
  out_for_delivery: "out_for_delivery",
  delivered: "delivered",
  cancelled: "cancelled",
  returned: "returned",
};

const DEFAULT_STATUS_NOTES = {
  pending: "Order successfully placed by customer",
  confirmed: "Admin confirmed the order",
  processing: "Product is being prepared/packed",
  shipped: "Order shipped from warehouse",
  out_for_delivery: "Delivery partner is delivering order",
  delivered: "Order delivered successfully",
  cancelled: "Order cancelled",
  returned: "Customer returned the product",
};

const STOCK_DEDUCT_STATUSES = new Set(["confirmed", "processing", "shipped", "out_for_delivery", "delivered"]);

const normalizeStatus = (value) => {
  if (!value) return null;
  const key = String(value).toLowerCase();
  return STATUS_MAP[key] || null;
};

const ensureOrderItemsHavePrice = async (order) => {
  if (!order?.products?.length) return;

  for (const item of order.products) {
    if (item.price !== undefined && item.price !== null) continue;

    let fallbackPrice = 0;
    if (item.product && item.product.price !== undefined) {
      fallbackPrice = item.product.price;
    } else if (item.product?._id) {
      const dbProduct = await Product.findOne(buildProductQuery(item.product._id)).select("price").lean();
      fallbackPrice = dbProduct?.price || 0;
    } else if (item.product) {
      const dbProduct = await Product.findOne(buildProductQuery(item.product)).select("price").lean();
      fallbackPrice = dbProduct?.price || 0;
    }

    item.price = fallbackPrice;
  }
};

const isOfferCurrentlyValid = (offer) => {
  const now = new Date();
  if (!offer || !offer.isActive) return false;
  if (offer.startsAt && now < offer.startsAt) return false;
  if (offer.expiresAt && now > offer.expiresAt) return false;
  return true;
};

const calculateDiscount = (offer, amount) => {
  if (!offer || amount <= 0) return 0;
  if (amount < (offer.minOrderAmount || 0)) return 0;
  let discount = 0;
  if (offer.discountType === "PERCENT") {
    discount = (amount * offer.discountValue) / 100;
    if (offer.maxDiscountAmount > 0) {
      discount = Math.min(discount, offer.maxDiscountAmount);
    }
  } else if (offer.discountType === "FIXED") {
    discount = offer.discountValue;
  }
  return Math.min(Math.max(discount, 0), amount);
};

exports.createOrder = async (req, res) => {
  try {
    const { products = [], offerCode = "", shippingAddress = null } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "products are required" });
    }

    const normalizedItems = [];
    let totalAmount = 0;

    for (const item of products) {
      const dbProduct = await Product.findOne(buildProductQuery(item.product)).lean();
      if (!dbProduct) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }

      const qty = Number(item.quantity || 1);
      if (qty <= 0) {
        return res.status(400).json({ message: "Quantity must be greater than 0" });
      }

      normalizedItems.push({
        product: dbProduct._id,
        quantity: qty,
        price: dbProduct.price,
      });

      totalAmount += dbProduct.price * qty;
    }

    let offer = null;
    if (offerCode) {
      offer = await Offer.findOne({ code: String(offerCode).toUpperCase() });
      if (!isOfferCurrentlyValid(offer)) {
        return res.status(400).json({ message: "Invalid or expired offer code" });
      }
    }

    const subtotalAmount = totalAmount;
    const discountAmount = calculateDiscount(offer, subtotalAmount);
    totalAmount = subtotalAmount - discountAmount;

    const order = await Order.create({
      user: req.user._id,
      products: normalizedItems,
      shippingAddress: shippingAddress || undefined,
      totalAmount,
      subtotalAmount,
      discountAmount,
      offerCode: offer ? offer.code : "",
      paymentMethod: "COD",
      statusHistory: [
        {
          status: "pending",
          description: DEFAULT_STATUS_NOTES.pending,
        },
      ],
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createOrderFromCart = async (req, res) => {
  try {
    const { offerCode = "", shippingAddress = null } = req.body;

    const cart = await Cart.findOne({ userId: req.user._id }).populate("items.productId");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const normalizedItems = [];
    let totalAmount = 0;

    for (const cartItem of cart.items) {
      const dbProduct = cartItem.productId;
      if (!dbProduct) {
        return res.status(404).json({ message: "One or more products are unavailable" });
      }

      const qty = Number(cartItem.quantity || 1);
      if (qty <= 0) {
        return res.status(400).json({ message: "Invalid quantity found in cart" });
      }

      normalizedItems.push({
        product: dbProduct._id,
        quantity: qty,
        price: dbProduct.price,
      });

      totalAmount += dbProduct.price * qty;
    }

    let offer = null;
    if (offerCode) {
      offer = await Offer.findOne({ code: String(offerCode).toUpperCase() });
      if (!isOfferCurrentlyValid(offer)) {
        return res.status(400).json({ message: "Invalid or expired offer code" });
      }
    }

    const subtotalAmount = totalAmount;
    const discountAmount = calculateDiscount(offer, subtotalAmount);
    totalAmount = subtotalAmount - discountAmount;

    const order = await Order.create({
      user: req.user._id,
      products: normalizedItems,
      shippingAddress: shippingAddress || undefined,
      totalAmount,
      subtotalAmount,
      discountAmount,
      offerCode: offer ? offer.code : "",
      paymentMethod: "COD",
      statusHistory: [
        {
          status: "pending",
          description: DEFAULT_STATUS_NOTES.pending,
        },
      ],
    });

    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { status, userId, dateFrom, dateTo } = req.query;
    const filter = {};

    if (status) {
      const normalized = normalizeStatus(status);
      if (!normalized) return res.status(400).json({ message: "Invalid order status filter" });
      filter.status = normalized;
    }
    if (userId) filter.user = userId;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("collectedBy", "name email")
      .populate("products.product")
      .lean();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate("products.product").lean();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const status = normalizeStatus(req.body.status);
    const description = String(req.body.description || DEFAULT_STATUS_NOTES[status] || "").trim();
    if (!status) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    if (!description) {
      return res.status(400).json({ message: "Status description is required" });
    }

    const order = await Order.findById(req.params.id).populate("products.product");
    if (!order) return res.status(404).json({ message: "Order not found" });

    await ensureOrderItemsHavePrice(order);

    order.status = status;

    if (STOCK_DEDUCT_STATUSES.has(status) && !order.stockUpdated) {
      for (const item of order.products) {
        const productRef = item.product?._id || item.product;
        const product = await Product.findOne(buildProductQuery(productRef));
        if (!product) {
          return res.status(404).json({ message: `Product not found: ${productRef}` });
        }
      }

      for (const item of order.products) {
        const productRef = item.product?._id || item.product;
        const updatedProduct = await Product.findOneAndUpdate(
          buildProductQuery(productRef),
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
        if (updatedProduct) {
          await logStockHistory({
            productId: updatedProduct._id,
            eventType: "SALE",
            quantityChange: -Number(item.quantity || 0),
            previousStock: Number(updatedProduct.stock || 0) + Number(item.quantity || 0),
            newStock: Number(updatedProduct.stock || 0),
            referenceType: "ORDER",
            referenceId: order._id.toString(),
            note: `Stock deducted due to order status: ${status}`,
            actorId: req.user?._id || null,
          });
        }
      }

      order.stockUpdated = true;
    }

    if (status === "cancelled" && order.stockUpdated) {
      for (const item of order.products) {
        const productRef = item.product?._id || item.product;
        const updatedProduct = await Product.findOneAndUpdate(
          buildProductQuery(productRef),
          { $inc: { stock: item.quantity } },
          { new: true }
        );
        if (updatedProduct) {
          await logStockHistory({
            productId: updatedProduct._id,
            eventType: "CANCELLATION_RESTOCK",
            quantityChange: Number(item.quantity || 0),
            previousStock: Number(updatedProduct.stock || 0) - Number(item.quantity || 0),
            newStock: Number(updatedProduct.stock || 0),
            referenceType: "ORDER",
            referenceId: order._id.toString(),
            note: "Stock restored due to order cancellation",
            actorId: req.user?._id || null,
          });
        }
      }
      order.stockUpdated = false;
      order.cancelledAt = new Date();
      order.cancellationReason = description;
    }

    order.statusHistory.push({
      status,
      description,
      updatedBy: req.user?._id || null,
    });

    if (status === "cancelled") {
      order.cancelledAt = order.cancelledAt || new Date();
      order.cancellationReason = description;
    }

    await order.save();
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancelOrderByUser = async (req, res) => {
  try {
    const { reason = "" } = req.body;
    const order = await Order.findById(req.params.id).populate("products.product");
    if (!order) return res.status(404).json({ message: "Order not found" });

    await ensureOrderItemsHavePrice(order);

    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to cancel this order" });
    }

    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({ message: "This order cannot be cancelled now" });
    }

    if (order.status === "confirmed" && order.stockUpdated) {
      for (const item of order.products) {
        const productRef = item.product?._id || item.product;
        const updatedProduct = await Product.findOneAndUpdate(
          buildProductQuery(productRef),
          { $inc: { stock: item.quantity } },
          { new: true }
        );
        if (updatedProduct) {
          await logStockHistory({
            productId: updatedProduct._id,
            eventType: "CANCELLATION_RESTOCK",
            quantityChange: Number(item.quantity || 0),
            previousStock: Number(updatedProduct.stock || 0) - Number(item.quantity || 0),
            newStock: Number(updatedProduct.stock || 0),
            referenceType: "ORDER",
            referenceId: order._id.toString(),
            note: "Stock restored due to customer cancellation",
            actorId: req.user?._id || null,
          });
        }
      }
      order.stockUpdated = false;
    }

    order.status = "cancelled";
    const cancelNote = reason || "Order cancelled by customer";
    order.cancellationReason = cancelNote;
    order.cancelledAt = new Date();
    order.statusHistory.push({
      status: "cancelled",
      description: cancelNote,
    });
    await order.save();

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const timeFilter = {};
    if (dateFrom || dateTo) {
      timeFilter.createdAt = {};
      if (dateFrom) timeFilter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) timeFilter.createdAt.$lte = new Date(dateTo);
    }

    const [totalOrders, usersCount, totalProducts, revenueAggregate] = await Promise.all([
      Order.countDocuments(timeFilter),
      User.countDocuments(),
      Product.countDocuments(),
      Order.aggregate([
        { $match: { ...timeFilter, status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    const orderStatusSummary = await Order.aggregate([
      { $match: timeFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const lowStockProducts = await Product.find({ stock: { $lte: 10 } })
      .select("name stock")
      .sort({ stock: 1 })
      .limit(20);

    res.status(200).json({
      totalUsers: usersCount,
      totalOrders,
      totalProducts,
      totalRevenue: revenueAggregate[0]?.total || 0,
      orderStatusSummary,
      lowStockProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Restock if order was not cancelled but was already deducted
    if (order.stockUpdated && order.status !== "cancelled") {
      for (const item of order.products) {
        const updatedProduct = await Product.findOneAndUpdate(
          buildProductQuery(item.product),
          { $inc: { stock: item.quantity } },
          { new: true }
        );
        if (updatedProduct) {
          await logStockHistory({
            productId: updatedProduct._id,
            eventType: "CANCELLATION_RESTOCK",
            quantityChange: Number(item.quantity || 0),
            previousStock: Number(updatedProduct.stock || 0) - Number(item.quantity || 0),
            newStock: Number(updatedProduct.stock || 0),
            referenceType: "ORDER",
            referenceId: order._id.toString(),
            note: "Stock restored due to order deletion",
            actorId: req.user?._id || null,
          });
        }
      }
    }

    await order.deleteOne();
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markOrderAsPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentStatus = "paid";

    order.statusHistory.push({
      status: order.status,
      description: "COD cash received successfully",
      updatedBy: req.user?._id || null,
    });

    await order.save();

    // Create a new Payment entry for the ledger
    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        user: order.user,
        order: order._id,
        method: "COD",
        provider: "COD",
        amount: order.totalAmount,
        status: "verified",
        currency: "INR",
        metadata: { manualMarkAsPaid: true, admin: req.user?._id },
      },
      { upsert: true, new: true }
    );

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.requestReturnByUser = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to return this order" });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({ message: "Only delivered orders can be returned" });
    }

    if (order.returnStatus && order.returnStatus !== "none") {
      return res.status(400).json({ message: "Return already requested or processed" });
    }

    order.returnStatus = "requested";
    order.returnReason = req.body.reason || "No reason provided";
    order.returnComments = req.body.comments || "";
    order.returnRequestDate = new Date();

    if (req.files && req.files.returnImages) {
      order.returnImages = req.files.returnImages.map((file) => `/uploads/${file.filename}`);
    }

    order.statusHistory.push({
      status: order.status,
      description: `Return requested. Reason: ${order.returnReason}`,
      updatedBy: req.user._id,
    });

    await order.save();
    res.status(200).json({ message: "Return request submitted successfully", order });
  } catch (error) {
    console.error("Return request error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateReturnStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const { status, comments } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Return status is required" });
    }

    order.returnStatus = status;
    if (comments) {
      order.returnComments = comments;
    }

    // Logic for restoring stock if return is received/completed
    if ((status === "received" || status === "completed") && !order.stockUpdated) {
      const Product = require("../models/Product");
      const { logStockHistory } = require("../utils/stockLogger");
      const { checkAndCreateStockNotification } = require("./notificationController");
      
      for (const item of order.products) {
        if (item.product) {
          const updatedProduct = await Product.findByIdAndUpdate(
            item.product,
            { 
              $inc: { 
                stock: Number(item.quantity || 0),
                soldCount: -Number(item.quantity || 0)
              } 
            },
            { new: true }
          );
          if (updatedProduct) {
            await logStockHistory({
              productId: updatedProduct._id,
              eventType: "RESTORE_RETURN",
              quantityChange: Number(item.quantity || 0),
              previousStock: Number(updatedProduct.stock || 0) - Number(item.quantity || 0),
              newStock: Number(updatedProduct.stock || 0),
              referenceType: "ORDER",
              referenceId: order._id.toString(),
              note: `Stock restored due to order return (${status})`,
              actorId: req.user?._id || null,
            });
            await checkAndCreateStockNotification(updatedProduct._id);
          }
        }
      }
      order.stockUpdated = true; // prevent double restore
    }

    order.statusHistory.push({
      status: order.status,
      description: `Return status updated to ${status}${comments ? ': ' + comments : ''}`,
      updatedBy: req.user._id,
    });

    await order.save();
    res.status(200).json(order);
  } catch (error) {
    console.error("Return status update error:", error);
    res.status(500).json({ message: error.message });
  }
};
