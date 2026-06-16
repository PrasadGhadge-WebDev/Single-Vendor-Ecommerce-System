const mongoose = require("mongoose");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
const Order = require("../models/Order");
const User = require("../models/User");
const { logStockHistory } = require("../utils/stockHistoryLogger");
const { checkAndCreateStockNotification } = require("./notificationController");

const parseOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "" || value === "undefined" || value === "null") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseSupplierId = (value) => {
  if (value === undefined || value === "null" || value === "") return undefined;
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  if (!mongoose.Types.ObjectId.isValid(normalized)) return "INVALID";
  return new mongoose.Types.ObjectId(normalized);
};

const buildProductQuery = (id) => {
  const normalized = String(id || "").trim();
  
  const orConditions = [
    { _id: normalized },
    { sku: { $regex: new RegExp(`^${normalized}$`, "i") } },
    { slug: { $regex: new RegExp(`^${normalized}$`, "i") } }
  ];
  
  if (mongoose.Types.ObjectId.isValid(normalized)) {
    orConditions.push({ _id: new mongoose.Types.ObjectId(normalized) });
  }
  
  return { $or: orConditions };
};

exports.buildProductQuery = buildProductQuery;

exports.addProduct = async (req, res) => {
  try {
    const { 
      name, slug, shortDescription, description, specifications, price, discountPrice, costPrice, taxClass,
      category, subCategory, brand, sku, stock, stockStatus, lowStockAlert, 
      warranty, status, featured, supplier 
    } = req.body;

    const effectiveCategory = String(category || "").trim() || "Uncategorized";
    const parsedPrice = parseOptionalNumber(price);
    const parsedStock = parseOptionalNumber(stock);
    const parsedSupplier = parseSupplierId(supplier);
    
    let parsedVariants = [];
    let parsedSeoSettings = {};
    let parsedShipping = {};
    let parsedFeatures = [];

    try { if (req.body.variants) parsedVariants = JSON.parse(req.body.variants); } catch (e) {}
    try { if (req.body.seoSettings) parsedSeoSettings = JSON.parse(req.body.seoSettings); } catch (e) {}
    try { if (req.body.shipping) parsedShipping = JSON.parse(req.body.shipping); } catch (e) {}
    
    if (req.body.features) {
      if (Array.isArray(req.body.features)) parsedFeatures = req.body.features;
      else try { parsedFeatures = JSON.parse(req.body.features); } catch(e) { parsedFeatures = [req.body.features]; }
    }

    if (!name || parsedPrice === undefined || Number.isNaN(parsedPrice)) {
      return res.status(400).json({ message: "Name and price are required" });
    }
    if (parsedPrice < 0) {
      return res.status(400).json({ message: "Price cannot be negative" });
    }

    const product = await Product.create({
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      shortDescription,
      description,
      specifications,
      price: parsedPrice,
      discountPrice: parseOptionalNumber(discountPrice),
      costPrice: parseOptionalNumber(costPrice),
      taxClass,
      category: effectiveCategory,
      subCategory,
      brand,
      sku: sku || undefined,
      stock: parsedStock !== undefined ? parsedStock : 0,
      stockStatus: stockStatus || "In Stock",
      lowStockAlert: parseOptionalNumber(lowStockAlert) || 5,
      variants: parsedVariants,
      seoSettings: parsedSeoSettings,
      shipping: parsedShipping,
      warranty,
      features: parsedFeatures,
      status: status || "Draft",
      featured: String(featured) === "true",
      supplier: parsedSupplier === undefined || parsedSupplier === "INVALID" ? undefined : parsedSupplier,
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

    // Check low stock / out of stock alerts
    await checkAndCreateStockNotification(product._id);

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
  try {
    const {
      category,
      subCategory,
      search,
      minPrice,
      maxPrice,
      stockStatus,
      status,
      supplier,
      sortBy,
      order = "desc",
      page,
      limit,
      includeMeta,
    } = req.query;

    const filter = {};

    if (category && category !== "all") filter.category = category;
    if (subCategory && subCategory !== "all") filter.subCategory = subCategory;
    if (search) filter.name = { $regex: search, $options: "i" };
    if (status && status !== "all") filter.status = status;

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    if (stockStatus) {
      if (stockStatus === "in-stock") filter.stock = { $gt: 0 };
      else if (stockStatus === "out-of-stock") filter.stock = { $lte: 0 };
      else if (stockStatus === "low-stock") filter.stock = { $gt: 0, $lte: 10 }; // Using 10 as generic threshold for filtering
    }

    if (supplier && supplier !== "all") {
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

    // Track views
    await Product.updateOne(query, { $inc: { views: 1 } });

    const product = await Product.findOne(query).lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.supplier && mongoose.Types.ObjectId.isValid(product.supplier)) {
      const supplier = await Supplier.findById(product.supplier).select("name company email phone").lean();
      product.supplier = supplier || null;
    } else {
      product.supplier = null; 
    }

    // Analytics: Total Sales & Revenue
    const orders = await Order.find({ "items.productId": product._id }).lean();
    let unitsSold = 0;
    let revenueGenerated = 0;
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.productId && item.productId.toString() === product._id.toString()) {
          unitsSold += item.quantity;
          revenueGenerated += item.price * item.quantity;
        }
      });
    });

    // Analytics: Wishlist Count
    const wishlistCount = await User.countDocuments({ wishlist: product._id });

    product.analytics = {
      unitsSold,
      revenueGenerated,
      views: product.views || 0,
      wishlistCount,
      averageRating: product.averageRating || 0
    };

    res.status(200).json(product);
  } catch (error) {
    require('fs').appendFileSync('error.log', new Date().toISOString() + ' ' + error.stack + '\n');
    if (error.name === "CastError") return res.status(404).json({ message: "Product not found" });
    res.status(500).json({ message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, slug, shortDescription, description, specifications, price, discountPrice, costPrice, taxClass,
      category, subCategory, brand, sku, stock, stockStatus, lowStockAlert, 
      warranty, status, featured, supplier 
    } = req.body;

    const parsedPrice = parseOptionalNumber(price);
    const parsedStock = parseOptionalNumber(stock);
    const parsedSupplier = parseSupplierId(supplier);

    const query = buildProductQuery(id);
    const existing = await Product.findOne(query);
    if (!existing) return res.status(404).json({ message: "Product not found" });

    const previousStock = Number(existing.stock || 0);
    const updateFields = {};

    if (name !== undefined) updateFields.name = name;
    if (slug !== undefined) updateFields.slug = slug;
    if (shortDescription !== undefined) updateFields.shortDescription = shortDescription;
    if (description !== undefined) updateFields.description = description;
    if (specifications !== undefined) updateFields.specifications = specifications;
    if (parsedPrice !== undefined) updateFields.price = parsedPrice;
    if (discountPrice !== undefined) updateFields.discountPrice = parseOptionalNumber(discountPrice);
    if (costPrice !== undefined) updateFields.costPrice = parseOptionalNumber(costPrice);
    if (taxClass !== undefined) updateFields.taxClass = taxClass;
    if (category !== undefined) updateFields.category = String(category || "").trim() || "Uncategorized";
    if (subCategory !== undefined) updateFields.subCategory = subCategory;
    if (brand !== undefined) updateFields.brand = brand;
    if (sku !== undefined) updateFields.sku = sku || undefined;
    if (parsedStock !== undefined) updateFields.stock = parsedStock;
    if (stockStatus !== undefined) updateFields.stockStatus = stockStatus;
    if (lowStockAlert !== undefined) updateFields.lowStockAlert = parseOptionalNumber(lowStockAlert);
    if (warranty !== undefined) updateFields.warranty = warranty;
    if (status !== undefined) updateFields.status = status;
    if (featured !== undefined) updateFields.featured = String(featured) === "true";
    
    if (parsedSupplier !== undefined && parsedSupplier !== "INVALID") {
      updateFields.supplier = parsedSupplier;
    }

    try { if (req.body.variants) updateFields.variants = JSON.parse(req.body.variants); } catch (e) {}
    try { if (req.body.seoSettings) updateFields.seoSettings = JSON.parse(req.body.seoSettings); } catch (e) {}
    try { if (req.body.shipping) updateFields.shipping = JSON.parse(req.body.shipping); } catch (e) {}
    
    if (req.body.features) {
      if (Array.isArray(req.body.features)) updateFields.features = req.body.features;
      else try { updateFields.features = JSON.parse(req.body.features); } catch(e) { updateFields.features = [req.body.features]; }
    }

    if (req.body.existingImages) {
      try {
        const existingArray = JSON.parse(req.body.existingImages);
        updateFields.image = existingArray[0] || "";
        updateFields.images = existingArray.slice(1);
      } catch (e) {}
    } else {
      updateFields.image = existing.image;
      updateFields.images = existing.images || [];
    }

    if (req.files?.image) {
      updateFields.image = req.files.image[0].filename;
    }
    if (req.files?.images) {
      updateFields.images = [...(updateFields.images || []), ...req.files.images.map(f => f.filename)];
    }

    const updatedProduct = await Product.findOneAndUpdate(query, { $set: updateFields }, { new: true });
    
    const nextStock = Number(updatedProduct.stock || 0);
    if (parsedStock !== undefined && nextStock !== previousStock) {
      await logStockHistory({
        productId: updatedProduct._id,
        eventType: "MANUAL_ADJUSTMENT",
        quantityChange: nextStock - previousStock,
        previousStock,
        newStock: nextStock,
        referenceType: "PRODUCT",
        referenceId: updatedProduct._id.toString(),
        note: "Manual stock update by admin",
        actorId: req.user?._id || null,
      });
    }

    // Check low stock / out of stock alerts
    await checkAndCreateStockNotification(updatedProduct._id);

    try {
      const { ensureCategoryExists } = require("./categoryController");
      await ensureCategoryExists(updatedProduct.category);
    } catch (e) {
      console.warn("Category sync warning:", e.message);
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    require('fs').appendFileSync('error.log', new Date().toISOString() + ' ' + error.stack + '\n');
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

exports.bulkActionProducts = async (req, res) => {
  try {
    const { action, productIds, category } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: "No products selected" });
    }

    let mixedIds = [];
    productIds.forEach(id => {
      const normalized = String(id).trim();
      mixedIds.push(normalized);
      if (mongoose.Types.ObjectId.isValid(normalized)) {
        mixedIds.push(new mongoose.Types.ObjectId(normalized));
      }
    });

    if (action === "activate") {
      await Product.updateMany({ _id: { $in: mixedIds } }, { $set: { status: "Active" } });
    } else if (action === "deactivate") {
      await Product.updateMany({ _id: { $in: mixedIds } }, { $set: { status: "Inactive" } });
    } else if (action === "delete") {
      await Product.deleteMany({ _id: { $in: mixedIds } });
    } else if (action === "assign_category") {
      if (!category) return res.status(400).json({ message: "Category is required" });
      await Product.updateMany({ _id: { $in: mixedIds } }, { $set: { category } });
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    res.json({ message: `Bulk action '${action}' completed on ${productIds.length} products` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.importProducts = async (req, res) => {
  try {
    const { products } = req.body;
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "No products provided for import" });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (let productData of products) {
      // Basic validation
      if (!productData.name || productData.price === undefined) {
        skippedCount++;
        continue;
      }

      // Generate a unique slug to prevent collisions (only used if inserting new)
      const baseSlug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const uniqueSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

      const productFields = {
        name: productData.name,
        price: Number(productData.price) || 0,
        category: productData.category || "Uncategorized",
        brand: productData.brand || "",
        stock: Number(productData.stock) || 0,
        status: productData.status || "Draft",
        sku: productData.sku || undefined,
      };

      try {
        if (productFields.sku && productFields.sku !== "N/A") {
          // If SKU exists, try to update the existing product or create a new one
          const existingProduct = await Product.findOne({ sku: productFields.sku });
          if (existingProduct) {
            await Product.updateOne({ sku: productFields.sku }, { $set: productFields });
            updatedCount++;
          } else {
            productFields.slug = uniqueSlug;
            await Product.create(productFields);
            importedCount++;
          }
        } else {
          // If no SKU, just create a new product
          productFields.slug = uniqueSlug;
          // remove sku from fields so it doesn't try to insert "undefined" as string or throw duplicate on null
          delete productFields.sku;
          await Product.create(productFields);
          importedCount++;
        }
      } catch (err) {
        console.error("Import error for product:", productData.name, err);
        skippedCount++;
      }
    }

    res.json({ message: `Import completed. Created ${importedCount} new products. Updated ${updatedCount} existing products. Skipped ${skippedCount} invalid rows.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
