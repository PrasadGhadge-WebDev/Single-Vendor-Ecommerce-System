const Product = require("../models/Product");

exports.addProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({ message: "Name, price and category are required" });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      image: req.file ? req.file.filename : "",
    });

    try {
      const { ensureCategoryExists } = require("./categoryController");
      await ensureCategoryExists(category);
    } catch (e) {
      console.warn("Category sync warning:", e.message);
    }

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      inStock,
      sortBy,
      order = "desc",
      page,
      limit,
      includeMeta,
    } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    if (String(inStock).toLowerCase() === "true") {
      filter.stock = { $gt: 0 };
    }

    const sortField = sortBy || "createdAt";
    const sortOrder = String(order).toLowerCase() === "asc" ? 1 : -1;

    let query = Product.find(filter).sort({ [sortField]: sortOrder });

    if (page !== undefined || limit !== undefined) {
      const pageNum = Math.max(1, Number(page || 1));
      const limitNum = Math.max(1, Number(limit || 20));
      const skip = (pageNum - 1) * limitNum;
      query = query.skip(skip).limit(limitNum);
    }

    const products = await query;

    if (String(includeMeta).toLowerCase() === "true") {
      const total = await Product.countDocuments(filter);
      return res.status(200).json({
        products,
        pagination: {
          total,
          page: Math.max(1, Number(page || 1)),
          limit: Math.max(1, Number(limit || 20)),
          pages: Math.ceil(total / Math.max(1, Number(limit || 20))),
        },
      });
    }

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, stock } = req.body;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (category !== undefined) product.category = category;
    if (stock !== undefined) product.stock = stock;
    if (req.file) product.image = req.file.filename;

    await product.save();

    try {
      const { ensureCategoryExists } = require("./categoryController");
      await ensureCategoryExists(product.category);
    } catch (e) {
      console.warn("Category sync warning:", e.message);
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
