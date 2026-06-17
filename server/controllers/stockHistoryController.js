const StockHistory = require("../models/StockHistory");

exports.getStockHistory = async (req, res) => {
  try {
    const {
      productId,
      eventType,
      dateFrom,
      dateTo,
      search = "",
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};
    if (productId) filter.product = productId;
    if (eventType) filter.eventType = eventType;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    if (String(search).trim()) {
      const regex = new RegExp(String(search).trim(), "i");
      filter.$or = [{ note: regex }, { referenceType: regex }, { referenceId: regex }];
    }

    if (req.query.movementType === 'INCREASED') {
      filter.quantityChange = { $gt: 0 };
    } else if (req.query.movementType === 'REDUCED') {
      filter.quantityChange = { $lt: 0 };
    }

    const pageNum = Math.max(1, Number(page || 1));
    const limitNum = Math.max(1, Math.min(200, Number(limit || 50)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      StockHistory.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("product", "name category")
        .populate("actor", "name email"),
      StockHistory.countDocuments(filter),
    ]);

    res.status(200).json({
      items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteStockHistory = async (req, res) => {
  try {
    const entry = await StockHistory.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: "Stock history entry not found" });

    await entry.deleteOne();
    res.status(200).json({ message: "Entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
