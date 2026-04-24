
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Supplier = require('./models/Supplier');
require('dotenv').config();

async function checkProduct() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce');
        console.log('Connected to MongoDB');

        const productId = '69b7b1be08e675f88b15419e';
        console.log('Checking product:', productId);

        try {
            const product = await Product.findById(productId);
            if (!product) {
                console.log('Product not found in DB');
            } else {
                console.log('Product found:', JSON.stringify(product, null, 2));
                
                console.log('Attempting populate...');
                const populated = await Product.findById(productId).populate("supplier", "name company email phone");
                console.log('Populated product:', JSON.stringify(populated, null, 2));
            }
        } catch (err) {
            console.error('Error during findById or populate:', err);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Connection error:', error);
    }
}

checkProduct();
