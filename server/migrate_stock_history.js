const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/singlevendor');

mongoose.connection.on('open', async () => {
  const collection = mongoose.connection.db.collection('stockhistories');
  const docs = await collection.find({}).toArray();
  for (let doc of docs) {
    if (doc.product instanceof mongoose.Types.ObjectId) {
      await collection.updateOne({ _id: doc._id }, { $set: { product: doc.product.toString() } });
    }
  }
  console.log('Migration complete');
  mongoose.disconnect();
});
