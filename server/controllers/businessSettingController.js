const BusinessSetting = require("../models/BusinessSetting");
const Order = require("../models/Order");

const getOrCreateSettings = async () => {
  let settings = await BusinessSetting.findOne();
  if (!settings) {
    settings = await BusinessSetting.create({});
  }
  return settings;
};

exports.getBusinessSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBusinessSettings = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.invoicePrefix !== undefined) {
      payload.invoicePrefix = String(payload.invoicePrefix || "").trim().toUpperCase();
    }
    if (payload.currency !== undefined) {
      payload.currency = String(payload.currency || "INR").trim().toUpperCase();
    }
    if (payload.taxPercent !== undefined) {
      payload.taxPercent = Number(payload.taxPercent || 0);
    }

    const settings = await BusinessSetting.findOneAndUpdate({}, payload, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBusinessReports = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const filter = {};
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const [orders, statusSummary, totals] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).limit(100).populate("user", "name email"),
      Order.aggregate([
        { $match: filter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Order.aggregate([
        { $match: { ...filter, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$totalAmount" },
            subtotal: { $sum: "$subtotalAmount" },
            discount: { $sum: "$discountAmount" },
            orders: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.status(200).json({
      summary: totals[0] || { revenue: 0, subtotal: 0, discount: 0, orders: 0 },
      statusSummary,
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBillByOrderId = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const order = await Order.findById(req.params.orderId)
      .populate("user", "name email")
      .populate("products.product", "name");

    if (!order) return res.status(404).json({ message: "Order not found" });

    const taxPercent = Number(settings.taxPercent || 0);
    const taxableAmount = Number(order.totalAmount || 0);
    const taxAmount = (taxableAmount * taxPercent) / 100;
    const grandTotal = taxableAmount + taxAmount;

    const invoiceNumber = `${settings.invoicePrefix || "INV"}-${String(order._id).slice(-8).toUpperCase()}`;

    res.status(200).json({
      invoiceNumber,
      generatedAt: new Date(),
      business: settings,
      customer: {
        name: order.user?.name || "Customer",
        email: order.user?.email || "",
      },
      order: {
        id: order._id,
        createdAt: order.createdAt,
        status: order.status,
        paymentMethod: order.paymentMethod,
        items: order.products.map((item) => ({
          productName: item.product?.name || "Product",
          quantity: item.quantity,
          unitPrice: item.price,
          lineTotal: Number(item.quantity || 0) * Number(item.price || 0),
        })),
        subtotalAmount: Number(order.subtotalAmount || order.totalAmount || 0),
        discountAmount: Number(order.discountAmount || 0),
        taxableAmount,
        taxPercent,
        taxAmount,
        grandTotal,
      },
      footerNote: settings.invoiceFooter || "",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
