const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/single-vendor-ecommerce').then(async () => {
  const Order = require('./server/models/Order');
  const Product = require('./server/models/Product');
  const topProductsAggregate = await Order.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $unwind: '$products' },
    {
      $group: {
        _id: '$products.product',
        sales: { $sum: '$products.quantity' },
        revenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } }
      }
    },
    { $sort: { sales: -1 } },
    { $limit: 5 }
  ]);
  const topProductsPopulated = await Product.populate(topProductsAggregate, { path: '_id', select: 'name' });
  console.log(JSON.stringify(topProductsPopulated, null, 2));
  process.exit(0);
});
