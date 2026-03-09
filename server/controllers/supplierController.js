const Supplier = require("../models/Supplier");
const Product = require("../models/Product");
const Purchase = require("../models/Purchase");
const { logStockHistory } = require("../utils/stockHistoryLogger");

exports.createSupplier = async (req, res) => {
  try {
    const { name, email, phone, company, address, isActive } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Supplier name is required" });
    }

    const supplier = await Supplier.create({
      name: String(name).trim(),
      email: email ? String(email).trim().toLowerCase() : "",
      phone: phone ? String(phone).trim() : "",
      company: company ? String(company).trim() : "",
      address: address ? String(address).trim() : "",
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSuppliers = async (req, res) => {
  try {
    const { search = "", isActive } = req.query;
    const filter = {};

    if (String(search).trim()) {
      const searchRegex = new RegExp(String(search).trim(), "i");
      filter.$or = [{ name: searchRegex }, { company: searchRegex }, { email: searchRegex }];
    }

    if (isActive !== undefined) {
      filter.isActive = String(isActive).toLowerCase() === "true";
    }

    const suppliers = await Supplier.find(filter).sort({ createdAt: -1 });
    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.status(200).json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const updatePayload = { ...req.body };
    if (updatePayload.email !== undefined) {
      updatePayload.email = String(updatePayload.email || "")
        .trim()
        .toLowerCase();
    }
    if (updatePayload.name !== undefined) {
      updatePayload.name = String(updatePayload.name || "").trim();
      if (!updatePayload.name) {
        return res.status(400).json({ message: "Supplier name is required" });
      }
    }

    const supplier = await Supplier.findByIdAndUpdate(req.params.id, updatePayload, { new: true });
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });

    res.status(200).json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findById(id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });

    const [linkedProducts, linkedPurchases] = await Promise.all([
      Product.countDocuments({ supplier: id }),
      Purchase.countDocuments({ supplier: id }),
    ]);

    if (linkedProducts > 0 || linkedPurchases > 0) {
      return res.status(400).json({
        message: "Cannot delete supplier with linked products/purchases. Deactivate instead.",
      });
    }

    await Supplier.findByIdAndDelete(id);
    res.status(200).json({ message: "Supplier deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPurchase = async (req, res) => {
  try {
    const {
      supplierId,
      productId,
      quantity,
      unitCost,
      purchaseDate,
      invoiceNumber = "",
      paymentStatus = "PENDING",
      notes = "",
    } = req.body;

    const qty = Number(quantity);
    const cost = Number(unitCost);

    if (!supplierId || !productId || !qty || qty <= 0 || Number.isNaN(cost) || cost < 0) {
      return res.status(400).json({
        message: "supplierId, productId, quantity (>0) and unitCost (>=0) are required",
      });
    }

    const [supplier, product] = await Promise.all([
      Supplier.findById(supplierId),
      Product.findById(productId),
    ]);

    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const purchase = await Purchase.create({
      supplier: supplier._id,
      product: product._id,
      quantity: qty,
      unitCost: cost,
      totalCost: qty * cost,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      invoiceNumber: String(invoiceNumber || "").trim(),
      paymentStatus,
      notes: String(notes || "").trim(),
    });

    const previousStock = Number(product.stock || 0);
    const newStock = previousStock + qty;
    product.stock = newStock;
    product.supplier = supplier._id;
    await product.save();

    await logStockHistory({
      productId: product._id,
      eventType: "PURCHASE",
      quantityChange: qty,
      previousStock,
      newStock,
      referenceType: "PURCHASE",
      referenceId: purchase._id.toString(),
      note: `Purchase recorded from supplier ${supplier.name}`,
      actorId: req.user?._id || null,
    });

    const populatedPurchase = await Purchase.findById(purchase._id)
      .populate("supplier", "name company email phone")
      .populate("product", "name category price stock");

    res.status(201).json(populatedPurchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPurchases = async (req, res) => {
  try {
    const { supplierId, productId, dateFrom, dateTo } = req.query;
    const filter = {};

    if (supplierId) filter.supplier = supplierId;
    if (productId) filter.product = productId;

    if (dateFrom || dateTo) {
      filter.purchaseDate = {};
      if (dateFrom) filter.purchaseDate.$gte = new Date(dateFrom);
      if (dateTo) filter.purchaseDate.$lte = new Date(dateTo);
    }

    const purchases = await Purchase.find(filter)
      .sort({ purchaseDate: -1, createdAt: -1 })
      .populate("supplier", "name company email")
      .populate("product", "name category price");

    res.status(200).json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSupplierProducts = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });

    const products = await Product.find({ supplier: req.params.id }).sort({ updatedAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSupplierAnalytics = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const purchaseMatch = {};
    if (dateFrom || dateTo) {
      purchaseMatch.purchaseDate = {};
      if (dateFrom) purchaseMatch.purchaseDate.$gte = new Date(dateFrom);
      if (dateTo) purchaseMatch.purchaseDate.$lte = new Date(dateTo);
    }

    const [supplierCount, activeSupplierCount, inventory, purchaseStats, topSuppliers] = await Promise.all([
      Supplier.countDocuments(),
      Supplier.countDocuments({ isActive: true }),
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStockUnits: { $sum: "$stock" },
            inventoryValue: { $sum: { $multiply: ["$stock", "$price"] } },
          },
        },
      ]),
      Purchase.aggregate([
        { $match: purchaseMatch },
        {
          $group: {
            _id: null,
            totalPurchases: { $sum: 1 },
            totalUnitsPurchased: { $sum: "$quantity" },
            totalPurchaseAmount: { $sum: "$totalCost" },
          },
        },
      ]),
      Purchase.aggregate([
        { $match: purchaseMatch },
        {
          $group: {
            _id: "$supplier",
            purchaseCount: { $sum: 1 },
            totalUnits: { $sum: "$quantity" },
            totalAmount: { $sum: "$totalCost" },
          },
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "suppliers",
            localField: "_id",
            foreignField: "_id",
            as: "supplier",
          },
        },
        { $unwind: "$supplier" },
        {
          $project: {
            _id: 0,
            supplierId: "$supplier._id",
            supplierName: "$supplier.name",
            company: "$supplier.company",
            purchaseCount: 1,
            totalUnits: 1,
            totalAmount: 1,
          },
        },
      ]),
    ]);

    const inventorySummary = inventory[0] || {
      totalProducts: 0,
      totalStockUnits: 0,
      inventoryValue: 0,
    };
    const purchaseSummary = purchaseStats[0] || {
      totalPurchases: 0,
      totalUnitsPurchased: 0,
      totalPurchaseAmount: 0,
    };

    const lowStockProducts = await Product.find({ stock: { $lte: 10 } })
      .select("name stock supplier")
      .populate("supplier", "name")
      .sort({ stock: 1 })
      .limit(10);

    res.status(200).json({
      suppliers: {
        total: supplierCount,
        active: activeSupplierCount,
        inactive: Math.max(supplierCount - activeSupplierCount, 0),
      },
      purchases: purchaseSummary,
      inventory: inventorySummary,
      topSuppliers,
      lowStockProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
