const https = require("https");
const crypto = require("crypto");
const Order = require("../models/Order");
const Payment = require("../models/Payment");

const createRazorpayOrderRequest = ({ amount, receipt, currency = "INR" }) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const payload = JSON.stringify({ amount, currency, receipt });

    const req = https.request(
      {
        hostname: "api.razorpay.com",
        path: "/v1/orders",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          Authorization: `Basic ${auth}`,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          try {
            const parsed = JSON.parse(body || "{}");
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(parsed.error?.description || "Razorpay order creation failed"));
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
};

exports.createCodPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: "orderId is required" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const payment = await Payment.create({
      user: req.user._id,
      order: order._id,
      method: "COD",
      provider: "COD",
      amount: order.totalAmount,
      status: "cod_pending",
    });

    order.paymentMethod = "COD";
    order.paymentStatus = "pending";
    await order.save();

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: "orderId is required" });

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: "Razorpay keys are not configured" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const amountInPaise = Math.round(Number(order.totalAmount) * 100);
    const receipt = `order_${order._id.toString().slice(-10)}_${Date.now()}`;

    const razorpayOrder = await createRazorpayOrderRequest({
      amount: amountInPaise,
      currency: "INR",
      receipt,
    });

    const payment = await Payment.create({
      user: req.user._id,
      order: order._id,
      method: "ONLINE",
      provider: "RAZORPAY",
      amount: order.totalAmount,
      status: "created",
      razorpayOrderId: razorpayOrder.id,
      metadata: { receipt },
    });

    order.paymentMethod = "ONLINE";
    await order.save();

    res.status(201).json({
      payment,
      razorpay: {
        key: process.env.RAZORPAY_KEY_ID,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: "Missing payment verification fields" });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return res.status(500).json({ message: "Razorpay secret not configured" });

    const generated = crypto
      .createHmac("sha256", secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) return res.status(404).json({ message: "Payment record not found" });

    if (payment.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const order = await Order.findById(payment.order);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (generated !== razorpaySignature) {
      payment.status = "failed";
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = razorpaySignature;
      await payment.save();

      order.paymentStatus = "failed";
      await order.save();

      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    payment.status = "verified";
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    await payment.save();

    order.paymentStatus = "paid";
    order.isPaid = true;
    order.paidAt = new Date();
    await order.save();

    res.status(200).json({ success: true, message: "Payment verified", payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const payments = await Payment.find({ order: orderId }).sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
