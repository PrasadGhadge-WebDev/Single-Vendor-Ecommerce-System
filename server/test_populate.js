
const mongoose = require('mongoose');
const Product = require('./models/Product');
// NOT requiring Supplier here to see if it causes an error
require('dotenv').config();

async function testPopulate() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce');
        console.log('Connected to MongoDB');

        const productId = '69b7b1be08e675f88b15419e';
        
        try {
            const product = await Product.findById(productId).populate("supplier");
            console.log('Populate successful (even if Supplier not required)');
        } catch (err) {
            console.error('Populate failed:', err.message);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Connection error:', error);
    }
}

testPopulate();
