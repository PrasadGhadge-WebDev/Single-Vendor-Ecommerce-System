const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const Supplier = require("../models/Supplier");
const Payment = require("../models/Payment");
const Offer = require("../models/Offer");

exports.globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(200).json({});
    }

    const regex = new RegExp(q, "i");
    const results = {
      Products: [],
      Orders: [],
      Users: [],
      Suppliers: [],
      Payments: [],
      Offers: []
    };

    // Public / Shared search for Products
    const products = await Product.find({
      $or: [
        { name: regex },
        { sku: regex },
        { brand: regex },
        { category: regex }
      ]
    }).limit(5).select("name sku price image category _id");

    results.Products = products.map(p => ({
      id: p._id,
      name: p.name,
      subtitle: p.category || (p.sku ? `SKU: ${p.sku}` : ''),
      image: p.image,
      price: p.price,
      url: `/product/${p._id}` // For customer view, or /admin/products for admin. Will handle redirect logic in frontend.
    }));

    // If user is NOT admin, return only Products
    if (!req.user || !req.user.isAdmin) {
      return res.status(200).json({ Products: results.Products });
    }

    // --- Admin Only Searches below ---

    // 1. Orders
    // We can search by orderId (if it matches a valid ObjectId or our custom ID)
    let orderQuery = {
      $or: [
        { "shippingAddress.fullName": regex },
        { "shippingAddress.email": regex }
      ]
    };
    if (mongoose.Types.ObjectId.isValid(q)) {
      orderQuery.$or.push({ _id: q });
    }
    const orders = await Order.find(orderQuery).limit(5).select("_id totalAmount status createdAt shippingAddress");
    results.Orders = orders.map(o => ({
      id: o._id,
      name: `ORD-${o._id.toString().slice(-6).toUpperCase()}`,
      subtitle: o.shippingAddress?.fullName || 'Guest',
      status: o.status,
      url: `/admin/orders`
    }));

    // 2. Users / Customers
    const users = await User.find({
      $or: [{ name: regex }, { email: regex }, { mobileNumber: regex }]
    }).limit(5).select("name email mobileNumber _id");
    results.Users = users.map(u => ({
      id: u._id,
      name: u.name,
      subtitle: u.email || u.mobileNumber,
      url: `/admin/users`
    }));

    // 3. Suppliers
    const suppliers = await Supplier.find({
      $or: [{ name: regex }, { contactPerson: regex }, { mobileNumber: regex }]
    }).limit(5).select("name contactPerson mobileNumber _id");
    results.Suppliers = suppliers.map(s => ({
      id: s._id,
      name: s.name,
      subtitle: s.contactPerson || s.mobileNumber,
      url: `/admin/suppliers`
    }));

    // 4. Payments
    let paymentQuery = {};
    if (mongoose.Types.ObjectId.isValid(q)) {
      paymentQuery = { $or: [{ _id: q }, { orderId: q }] };
    } else {
      paymentQuery = { paymentMethod: regex }; // limited search for string
    }
    const payments = await Payment.find(paymentQuery).limit(5).select("_id orderId paymentStatus amount");
    results.Payments = payments.map(p => ({
      id: p._id,
      name: `PAY-${p._id.toString().slice(-6).toUpperCase()}`,
      subtitle: `Amount: ₹${p.amount}`,
      status: p.paymentStatus,
      url: `/admin/payments`
    }));

    // 5. Offers
    const offers = await Offer.find({ name: regex }).limit(5).select("name discountValue type _id");
    results.Offers = offers.map(o => ({
      id: o._id,
      name: o.name,
      subtitle: `${o.discountValue}${o.type === 'PERCENTAGE' ? '%' : ' flat'} off`,
      url: `/admin/offers`
    }));

    res.status(200).json(results);
  } catch (error) {
    console.error("Global search error:", error);
    res.status(500).json({ message: error.message });
  }
};
