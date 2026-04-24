const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Product = require('./models/Product');

async function checkProducts() {
  try {
    const mongoUri = process.env.MONGO_URL || 'mongodb://localhost:27017/singlevendor';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const products = await Product.find({}, { name: 1, category: 1, subCategory: 1 }).limit(10);
    console.log('Sample Products:');
    console.table(products.map(p => ({
      name: p.name,
      category: p.category,
      subCategory: p.subCategory
    })));

    const categories = await Product.distinct('category');
    console.log('Distinct Categories:', categories);

    const subCategories = await Product.distinct('subCategory');
    console.log('Distinct Subcategories:', subCategories);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkProducts();
