const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Order = require('./models/Order');
const Payment = require('./models/Payment');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/single-vendor-ecommerce').then(async () => {
  const latestOrder = await Order.findOne().sort({ createdAt: -1 });
  console.log("Latest Order:", latestOrder);

  if (latestOrder) {
     const payment = await Payment.findOne({ order: latestOrder._id });
     console.log("Corresponding Payment:", payment);
  }
  process.exit(0);
});
