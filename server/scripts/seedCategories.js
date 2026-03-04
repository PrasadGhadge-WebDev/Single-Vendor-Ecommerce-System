require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const connectDB = require('../config/db');

const categories = [
  'Electronics',
  'Fashion',
  'Beauty',
  'Clothing'
];

const seed = async () => {
  try {
    await connectDB();

    for (const name of categories) {
      await Category.findOneAndUpdate({ name }, { name }, { upsert: true });
    }

    const all = await Category.find().sort({ name: 1 });
    console.log('Seeded categories:', all.map((c) => c.name));
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed', err.message);
    process.exit(1);
  }
};

seed();
