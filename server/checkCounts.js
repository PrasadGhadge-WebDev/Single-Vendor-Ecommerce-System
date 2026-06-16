const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Order = require('./models/Order');
const Payment = require('./models/Payment');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/single-vendor-ecommerce').then(async () => {
  const orderCount = await Order.countDocuments();
  const paymentCount = await Payment.countDocuments();
  console.log("Total Orders:", orderCount);
  console.log("Total Payments:", paymentCount);
  process.exit(0);
});
