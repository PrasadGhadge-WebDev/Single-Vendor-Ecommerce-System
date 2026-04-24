
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Supplier = require('./models/Supplier');
require('dotenv').config();

async function fixData() {
    try {
        await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/singlevendor');
        console.log('Connected to MongoDB');

        const supplier = await Supplier.findOne({ company: 'Display World' });
        if (supplier) {
            const result = await Product.collection.updateOne(
                { _id: new mongoose.Types.ObjectId('69b7b1be08e675f88b15419e') },
                { $set: { supplier: supplier._id } }
            );
            console.log('Fixed product supplier:', result.modifiedCount);
        } else {
            console.log('Supplier "Display World" not found');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Fix failed:', error);
    }
}

fixData();
