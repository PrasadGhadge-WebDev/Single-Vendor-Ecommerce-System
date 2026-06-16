const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Order = require('./models/Order');
const Payment = require('./models/Payment');

mongoose.connect(process.env.MONGO_URL).then(async () => {
  console.log("Connected to MongoDB.");
  const orders = await Order.find({ paymentMethod: "COD" });
  let count = 0;
  for (const order of orders) {
    const existing = await Payment.findOne({ order: order._id });
    if (!existing) {
      await Payment.create({
        user: order.user,
        order: order._id,
        method: "COD",
        provider: "COD",
        amount: order.totalAmount,
        status: order.paymentStatus === 'paid' ? 'verified' : 'cod_pending',
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      });
      count++;
      console.log(`Created missing payment for order ${order._id}`);
    }
  }
  console.log(`Successfully migrated ${count} missing payment records.`);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
