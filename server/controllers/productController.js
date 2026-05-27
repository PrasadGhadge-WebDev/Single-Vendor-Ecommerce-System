const mongoose = require("mongoose");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
const { logStockHistory } = require("../utils/stockHistoryLogger");

const parseOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const parseSupplierId = (value) => {
  if (value === undefined) return undefined;
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  if (!mongoose.Types.ObjectId.isValid(normalized)) return "INVALID";
  return new mongoose.Types.ObjectId(normalized);
};

const buildProductQuery = (id) => {
  const normalized = String(id || "").trim();
  if (mongoose.Types.ObjectId.isValid(normalized)) {
    return { _id: new mongoose.Types.ObjectId(normalized) };
  }
  // Now that the schema supports string _ids, we can query both SKU and _id safely.
  return { 
    $or: [
      { _id: normalized }, 
      { sku: { $regex: new RegExp(`^${normalized}$`, "i") } }
    ] 
  };
};

exports.buildProductQuery = buildProductQuery;

exports.addProduct = async (req, res) => {
  try {
    const { name, description, price, category, subCategory, stock, supplier } = req.body;
    const effectiveCategory = String(category || "").trim() || "Uncategorized";
    const parsedPrice = parseOptionalNumber(price);
    const parsedStock = parseOptionalNumber(stock);
    const parsedSupplier = parseSupplierId(supplier);

    if (!name || parsedPrice === undefined || Number.isNaN(parsedPrice)) {
      return res.status(400).json({ message: "Name and price are required" });
    }
    if (parsedPrice < 0) {
      return res.status(400).json({ message: "Price cannot be negative" });
    }
    if (parsedStock !== undefined && (Number.isNaN(parsedStock) || parsedStock < 0)) {
      return res.status(400).json({ message: "Stock must be a valid non-negative number" });
    }
    if (parsedSupplier === "INVALID") {
      return res.status(400).json({ message: "Invalid supplier ID format" });
    }

    const product = await Product.create({
      name,
      description,
      price: parsedPrice,
      category: effectiveCategory,
      subCategory: subCategory || "",
      stock: parsedStock !== undefined ? parsedStock : 0,
      supplier: parsedSupplier === undefined ? undefined : parsedSupplier,
      image: req.files?.image ? req.files.image[0].filename : "",
      images: req.files?.images ? req.files.images.map(f => f.filename) : [],
    });

    if (Number(product.stock || 0) > 0) {
      await logStockHistory({
        productId: product._id,
        eventType: "INITIAL_STOCK",
        quantityChange: Number(product.stock || 0),
        previousStock: 0,
        newStock: Number(product.stock || 0),
        referenceType: "PRODUCT",
        referenceId: product._id.toString(),
        note: "Initial stock set during product creation",
        actorId: req.user?._id || null,
      });
    }

    try {
      const { ensureCategoryExists } = require("./categoryController");
      await ensureCategoryExists(effectiveCategory);
    } catch (e) {
      console.warn("Category sync warning:", e.message);
    }

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProducts = async (req, res) => {
  console.log(`[DEBUG] getProducts called. Filter: ${JSON.stringify(req.query)}`);
  try {
    const {
      category,
      subCategory,
      search,
      minPrice,
      maxPrice,
      inStock,
      supplier,
      sortBy,
      order = "desc",
      page,
      limit,
      includeMeta,
    } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;
    if (search) filter.name = { $regex: search, $options: "i" };

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    if (String(inStock).toLowerCase() === "true") {
      filter.stock = { $gt: 0 };
    }

    if (supplier) {
      filter.supplier = supplier;
    }

    const sortField = sortBy || "createdAt";
    const sortOrder = String(order).toLowerCase() === "asc" ? 1 : -1;

    let query = Product.find(filter).populate("supplier", "name company").sort({ [sortField]: sortOrder }).lean();

    if (page !== undefined || limit !== undefined) {
      const pageNum = Math.max(1, Number(page || 1));
      const limitNum = Math.max(1, Number(limit || 20));
      const skip = (pageNum - 1) * limitNum;
      query = query.skip(skip).limit(limitNum);
    }

    const products = await query;
    console.log(`[DEBUG] Found ${products.length} products.`);

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
    const { id } = req.params;
    const query = buildProductQuery(id);

    // Find product using the robust query (supports ObjectId, string ID, and SKU)
    const product = await Product.findOne(query).lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Manually handle supplier population to be robust against bad data
    if (product.supplier) {
      if (mongoose.Types.ObjectId.isValid(product.supplier)) {
        const supplier = await Supplier.findById(product.supplier)
          .select("name company email phone")
          .lean();
        product.supplier = supplier || null;
      } else {
        console.warn(`Product ${id} has invalid supplier ID: ${product.supplier}`);
        product.supplier = null; 
      }
    }

    res.status(200).json(product);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Product not found" });
    }
    console.error("Error in getProductById:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, subCategory, stock, supplier } = req.body;
    const parsedPrice = parseOptionalNumber(price);
    const parsedStock = parseOptionalNumber(stock);
    const parsedSupplier = parseSupplierId(supplier);

    if (price !== undefined && Number.isNaN(parsedPrice)) {
      return res.status(400).json({ message: "Price must be a valid number" });
    }
    if (parsedPrice !== undefined && parsedPrice < 0) {
      return res.status(400).json({ message: "Price cannot be negative" });
    }
    if (stock !== undefined && Number.isNaN(parsedStock)) {
      return res.status(400).json({ message: "Stock must be a valid number" });
    }
    if (parsedStock !== undefined && parsedStock < 0) {
      return res.status(400).json({ message: "Stock cannot be negative" });
    }
    if (parsedSupplier === "INVALID") {
      return res.status(400).json({ message: "Invalid supplier ID format" });
    }

    const query = buildProductQuery(id);
    const existing = await Product.collection.findOne(query);
    if (!existing) return res.status(404).json({ message: "Product not found" });

    const previousStock = Number(existing.stock || 0);
    const updateFields = {};

    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (parsedPrice !== undefined) updateFields.price = parsedPrice;

    if (category !== undefined) {
      updateFields.category = String(category || "").trim() || "Uncategorized";
    } else if (!existing.category) {
      // Backfill missing legacy data so updates do not fail on required category.
      updateFields.category = "Uncategorized";
    }

    if (subCategory !== undefined) {
      updateFields.subCategory = subCategory;
    }

    if (parsedStock !== undefined) {
      updateFields.stock = parsedStock;
    }

    if (parsedSupplier !== undefined) {
      updateFields.supplier = parsedSupplier;
    }

    if (req.files?.image) updateFields.image = req.files.image[0].filename;
    if (req.files?.images) updateFields.images = req.files.images.map(f => f.filename);
    updateFields.updatedAt = new Date();

    await Product.collection.updateOne(query, { $set: updateFields });
    const product = await Product.collection.findOne(query);
    const nextStock = Number(product?.stock || 0);

    if (stock !== undefined && nextStock !== previousStock) {
      await logStockHistory({
        productId: product._id,
        eventType: "MANUAL_ADJUSTMENT",
        quantityChange: nextStock - previousStock,
        previousStock,
        newStock: nextStock,
        referenceType: "PRODUCT",
        referenceId: product._id.toString(),
        note: "Manual stock update by admin",
        actorId: req.user?._id || null,
      });
    }

    try {
      const { ensureCategoryExists } = require("./categoryController");
      await ensureCategoryExists(String(product?.category || "Uncategorized"));
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
    const query = buildProductQuery(id);
    const deleted = await Product.findOneAndDelete(query);
    if (!deleted) return res.status(404).json({ message: "Product not found" });

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
