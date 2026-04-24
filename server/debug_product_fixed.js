
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Supplier = require('./models/Supplier');
require('dotenv').config();

async function checkProduct() {
    try {
        const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/singlevendor';
        await mongoose.connect(mongoUrl);
        console.log('Connected to MongoDB:', mongoUrl);

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
