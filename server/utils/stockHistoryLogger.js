const StockHistory = require("../models/StockHistory");

exports.logStockHistory = async ({
  productId,
  eventType,
  quantityChange,
  previousStock,
  newStock,
  referenceType = "",
  referenceId = "",
  note = "",
  actorId = null,
}) => {
  try {
    if (!productId) return;
    await StockHistory.create({
      product: productId,
      eventType,
      quantityChange: Number(quantityChange || 0),
      previousStock: Number(previousStock || 0),
      newStock: Number(newStock || 0),
      referenceType,
      referenceId,
      note,
      actor: actorId || null,
    });
  } catch (error) {
    // Keep stock operations successful even if logging fails.
    console.warn("Stock history log warning:", error.message);
  }
};
