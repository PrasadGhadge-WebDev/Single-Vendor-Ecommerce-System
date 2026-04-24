const Category = require("../models/Category");
const Product = require("../models/Product");

exports.addCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await Category.create({
      name,
      image: req.file ? req.file.filename : null,
      subCategories: req.body.subCategories ? (typeof req.body.subCategories === 'string' ? JSON.parse(req.body.subCategories) : req.body.subCategories) : [],
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Fetching category by ID:", id);
    const category = await Category.findById(id);
    if (!category) {
      console.log("Category not found for ID:", id);
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(category);
  } catch (error) {
    console.error("Error in getCategoryById:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const oldName = category.name;
    if (name) category.name = name;
    if (req.file) category.image = req.file.filename;
    if (req.body.subCategories) {
      category.subCategories = typeof req.body.subCategories === 'string' ? JSON.parse(req.body.subCategories) : req.body.subCategories;
    }

    await category.save();

    if (name && oldName !== name) {
      await Product.updateMany({ category: oldName }, { $set: { category: name } });
    }

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const inUse = await Product.exists({ category: category.name });
    if (inUse) {
      return res.status(400).json({ message: "Category is in use by products and cannot be deleted" });
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.ensureCategoryExists = async (categoryName) => {
  if (!categoryName) return null;

  let category = await Category.findOne({ name: categoryName });
  if (!category) {
    category = await Category.create({ name: categoryName });
  }
  return category;
};
