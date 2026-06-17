const Supplier = require("../models/Supplier");
const Product = require("../models/Product");
const Purchase = require("../models/Purchase");
const { logStockHistory } = require("../utils/stockHistoryLogger");

exports.createSupplier = async (req, res) => {
  try {
    const { 
      name, contactPerson, mobileNumber, phone, email, gstNumber, 
      address, city, state, pincode, country, 
      company, website, notes, isActive, bankDetails 
    } = req.body;
    
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Supplier name is required" });
    }

    const supplier = await Supplier.create({
      name: String(name).trim(),
      contactPerson: contactPerson ? String(contactPerson).trim() : "",
      mobileNumber: mobileNumber ? String(mobileNumber).trim() : (phone ? String(phone).trim() : ""),
      phone: phone ? String(phone).trim() : (mobileNumber ? String(mobileNumber).trim() : ""),
      email: email ? String(email).trim().toLowerCase() : "",
      gstNumber: gstNumber ? String(gstNumber).trim() : "",
      address: address ? String(address).trim() : "",
      city: city ? String(city).trim() : "",
      state: state ? String(state).trim() : "",
      pincode: pincode ? String(pincode).trim() : "",
      country: country ? String(country).trim() : "India",
      company: company ? String(company).trim() : "",
      website: website ? String(website).trim() : "",
      notes: notes ? String(notes).trim() : "",
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      bankDetails: {
        bankName: bankDetails?.bankName ? String(bankDetails.bankName).trim() : "",
        accountName: bankDetails?.accountName ? String(bankDetails.accountName).trim() : "",
        accountNumber: bankDetails?.accountNumber ? String(bankDetails.accountNumber).trim() : "",
        ifscCode: bankDetails?.ifscCode ? String(bankDetails.ifscCode).trim() : "",
      }
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

    const suppliers = await Supplier.find(filter).sort({ createdAt: -1 }).lean();
    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id).lean();
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
      purchaseId,
      supplierId,
      productId,
      quantity,
      unitCost,
      purchaseDate,
      invoiceNumber = "",
      paymentStatus = "PENDING",
      paymentMethod = "None",
      paidAmount = 0,
      notes = "",
    } = req.body;

    const qty = Number(quantity);
    const cost = Number(unitCost);
    const paidAmt = Number(paidAmount);

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

    let invoiceUrl = "";
    if (req.file) {
      invoiceUrl = `/uploads/${req.file.filename}`;
    }

    const totalPurchaseCost = qty * cost;
    const remainingAmount = paymentStatus === "PARTIAL" ? (totalPurchaseCost - paidAmt) : (paymentStatus === "PAID" ? 0 : totalPurchaseCost);

    const purchase = await Purchase.create({
      purchaseId: purchaseId || `PUR-${Date.now()}`,
      supplier: supplier._id,
      product: product._id,
      quantity: qty,
      unitCost: cost,
      totalCost: totalPurchaseCost,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      invoiceNumber: String(invoiceNumber || "").trim(),
      invoiceUrl,
      paymentStatus,
      paymentMethod,
      paidAmount: paymentStatus === "PARTIAL" ? paidAmt : (paymentStatus === "PAID" ? totalPurchaseCost : 0),
      remainingAmount: remainingAmount > 0 ? remainingAmount : 0,
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
    const { supplierId, productId, dateFrom, dateTo, paymentStatus, paymentMethod } = req.query;
    const filter = {};

    if (supplierId && supplierId !== 'all') filter.supplier = supplierId;
    if (productId && productId !== 'all') filter.product = productId;
    if (paymentStatus && paymentStatus !== 'all') filter.paymentStatus = paymentStatus;
    if (paymentMethod && paymentMethod !== 'all') filter.paymentMethod = paymentMethod;

    if (dateFrom || dateTo) {
      filter.purchaseDate = {};
      if (dateFrom) filter.purchaseDate.$gte = new Date(dateFrom);
      if (dateTo) filter.purchaseDate.$lte = new Date(dateTo);
    }

    const purchases = await Purchase.find(filter)
      .sort({ purchaseDate: -1, createdAt: -1 })
      .populate("supplier", "name company email")
      .populate("product", "name category price")
      .lean();

    res.status(200).json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSupplierProducts = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });

    const products = await Product.find({ supplier: req.params.id }).sort({ updatedAt: -1 }).lean();
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

exports.updatePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });

    const { quantity, unitCost, paymentStatus, paymentMethod, notes, invoiceNumber, purchaseDate, paidAmount, supplierId, productId } = req.body;
    
    const newQty = Number(quantity);
    const newCost = Number(unitCost);
    
    if (isNaN(newQty) || newQty < 1) {
      console.log("updatePurchase 400: Quantity must be at least 1", quantity);
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }
    if (isNaN(newCost) || newCost <= 0) {
      console.log("updatePurchase 400: Unit cost must be greater than 0", unitCost);
      return res.status(400).json({ message: "Unit cost must be greater than 0" });
    }

    const prevStatus = purchase.paymentStatus;
    if (prevStatus === "PAID" && (paymentStatus === "PENDING" || paymentStatus === "PARTIAL")) {
      console.log("updatePurchase 400: Paid purchases cannot be downgraded to Pending or Partial status.");
      return res.status(400).json({ message: "Paid purchases cannot be downgraded to Pending or Partial status." });
    }
    if (prevStatus === "PARTIAL" && paymentStatus === "PENDING") {
      console.log("updatePurchase 400: Partial purchases cannot be downgraded to Pending.");
      return res.status(400).json({ message: "Partial purchases cannot be downgraded to Pending." });
    }

    const previousQuantity = purchase.quantity;
    const oldProductId = purchase.product.toString();
    const newProductId = productId && productId !== oldProductId ? productId : oldProductId;
    
    // Check if product is changed
    if (newProductId !== oldProductId) {
      // Find old and new products
      const oldProduct = await Product.findById(oldProductId);
      const newProduct = await Product.findById(newProductId);
      
      if (!newProduct) {
        console.log("updatePurchase 400: The new product does not exist.");
        return res.status(400).json({ message: "The new product selected no longer exists." });
      }

      // Revert old product stock
      if (oldProduct) {
        const prevOldStock = Number(oldProduct.stock || 0);
        oldProduct.stock = Math.max(0, prevOldStock - previousQuantity);
        await oldProduct.save();
        await logStockHistory({
          productId: oldProduct._id,
          eventType: "PURCHASE_UPDATE",
          quantityChange: -previousQuantity,
          previousStock: prevOldStock,
          newStock: oldProduct.stock,
          referenceType: "PURCHASE",
          referenceId: purchase._id.toString(),
          note: `Purchase record re-assigned to another product (stock reverted)`,
          actorId: req.user?._id || null,
        });
      }
      
      // Add new product stock
      const prevNewStock = Number(newProduct.stock || 0);
      newProduct.stock = Math.max(0, prevNewStock + newQty);
      await newProduct.save();
      await logStockHistory({
        productId: newProduct._id,
        eventType: "PURCHASE_UPDATE",
        quantityChange: newQty,
        previousStock: prevNewStock,
        newStock: newProduct.stock,
        referenceType: "PURCHASE",
        referenceId: purchase._id.toString(),
        note: `Purchase record re-assigned to this product (stock added)`,
        actorId: req.user?._id || null,
      });

      purchase.product = newProductId;
    } else {
      // Same product, just diff quantity
      const diffQuantity = newQty - previousQuantity;
      if (diffQuantity !== 0) {
        const product = await Product.findById(oldProductId);
        if (!product) {
          console.log("updatePurchase 400: Cannot change quantity because the associated product no longer exists.");
          return res.status(400).json({ message: "Cannot change quantity because the associated product no longer exists." });
        }
        
        const previousStock = Number(product.stock || 0);
        const newStock = Math.max(0, previousStock + diffQuantity);
        
        product.stock = newStock;
        await product.save();
        
        await logStockHistory({
          productId: product._id,
          eventType: "PURCHASE_UPDATE",
          quantityChange: diffQuantity,
          previousStock,
          newStock,
          referenceType: "PURCHASE",
          referenceId: purchase._id.toString(),
          note: `Purchase record updated (qty changed from ${previousQuantity} to ${newQty})`,
          actorId: req.user?._id || null,
        });
      }
    }

    if (supplierId && supplierId !== purchase.supplier.toString()) {
      purchase.supplier = supplierId;
    }

    if (req.file) {
      purchase.invoiceUrl = `/uploads/${req.file.filename}`;
    }

    const totalPurchaseCost = newQty * newCost;
    
    let finalPaidAmt = 0;
    if (paymentStatus === "PAID") {
      finalPaidAmt = totalPurchaseCost;
    } else if (paymentStatus === "PARTIAL") {
      finalPaidAmt = Number(paidAmount) || purchase.paidAmount || 0;
      if (finalPaidAmt > totalPurchaseCost) {
        console.log("updatePurchase 400: Paid amount cannot exceed total cost.", finalPaidAmt, totalPurchaseCost);
        return res.status(400).json({ message: "Paid amount cannot exceed total cost." });
      }
    } else {
      finalPaidAmt = 0;
    }
    
    const remainingAmount = Math.max(0, totalPurchaseCost - finalPaidAmt);

    purchase.auditTrail.push({
      updatedAt: new Date(),
      updatedBy: req.user?.name || "Admin",
      previousQuantity: previousQuantity,
      newQuantity: newQty,
      previousPaymentStatus: prevStatus,
      newPaymentStatus: paymentStatus || prevStatus
    });

    purchase.quantity = newQty;
    purchase.unitCost = newCost;
    purchase.totalCost = totalPurchaseCost;
    if (paymentStatus) purchase.paymentStatus = paymentStatus;
    if (paymentMethod) purchase.paymentMethod = paymentMethod;
    if (notes !== undefined) purchase.notes = String(notes).trim();
    if (invoiceNumber !== undefined) purchase.invoiceNumber = String(invoiceNumber).trim();
    if (purchaseDate) purchase.purchaseDate = new Date(purchaseDate);
    purchase.paidAmount = finalPaidAmt;
    purchase.remainingAmount = remainingAmount;

    await purchase.save();

    const populatedPurchase = await Purchase.findById(purchase._id)
      .populate("supplier", "name company email phone")
      .populate("product", "name category price stock");

    res.status(200).json(populatedPurchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markPurchasePaid = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });

    purchase.paymentStatus = "PAID";
    purchase.paidAmount = purchase.totalCost;
    purchase.remainingAmount = 0;
    
    await purchase.save();
    res.status(200).json({ message: "Purchase marked as paid", purchase });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });

    await Purchase.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: "Purchase deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
