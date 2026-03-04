const Product = require("../models/Product");

exports.addProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      image: req.file ? req.file.filename : ""
    });

    // if we have a categories collection, make sure the new category exists
    try {
      const { ensureCategoryExists } = require("./categoryController");
      await ensureCategoryExists(category);
    } catch (e) {
      // log but don't block product creation
      console.warn("could not sync category", e.message);
    }

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    // allow optional category filter and limit query parameters
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    let query = Product.find(filter);
    if (req.query.limit) {
      const lim = parseInt(req.query.limit, 10);
      if (!isNaN(lim) && lim > 0) query = query.limit(lim);
    }
    const products = await query;
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, stock } = req.body;

    const updateFields = { name, description, price, category, stock };
    if (req.file) {
      updateFields.image = req.file.filename;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    try {
      const { ensureCategoryExists } = require("./categoryController");
      await ensureCategoryExists(category);
    } catch (e) {
      console.warn("could not sync category", e.message);
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await Product.findByIdAndDelete(id);

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};