const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "controllers", "orderController.js");
let content = fs.readFileSync(filePath, "utf8");

const requestReturnByUserStr = `
exports.requestReturnByUser = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to return this order" });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({ message: "Only delivered orders can be returned" });
    }

    if (order.returnStatus && order.returnStatus !== "none") {
      return res.status(400).json({ message: "Return already requested or processed" });
    }

    order.returnStatus = "requested";
    order.returnReason = req.body.reason || "No reason provided";
    order.returnComments = req.body.comments || "";
    order.returnRequestDate = new Date();

    if (req.files && req.files.returnImages) {
      order.returnImages = req.files.returnImages.map((file) => \`/uploads/\${file.filename}\`);
    }

    order.statusHistory.push({
      status: order.status,
      description: \`Return requested. Reason: \${order.returnReason}\`,
      updatedBy: req.user._id,
    });

    await order.save();
    res.status(200).json({ message: "Return request submitted successfully", order });
  } catch (error) {
    console.error("Return request error:", error);
    res.status(500).json({ message: error.message });
  }
};
`;

const updateReturnStatusStr = `
exports.updateReturnStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const { status, comments } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Return status is required" });
    }

    order.returnStatus = status;
    if (comments) {
      order.returnComments = comments;
    }

    // Logic for restoring stock if return is received/completed
    if ((status === "received" || status === "completed") && !order.stockUpdated) {
      const Product = require("../models/Product");
      const { logStockHistory } = require("../utils/stockLogger");
      const { checkAndCreateStockNotification } = require("./notificationController");
      
      for (const item of order.products) {
        if (item.product) {
          const updatedProduct = await Product.findByIdAndUpdate(
            item.product,
            { 
              $inc: { 
                stock: Number(item.quantity || 0),
                soldCount: -Number(item.quantity || 0)
              } 
            },
            { new: true }
          );
          if (updatedProduct) {
            await logStockHistory({
              productId: updatedProduct._id,
              eventType: "RESTORE_RETURN",
              quantityChange: Number(item.quantity || 0),
              previousStock: Number(updatedProduct.stock || 0) - Number(item.quantity || 0),
              newStock: Number(updatedProduct.stock || 0),
              referenceType: "ORDER",
              referenceId: order._id.toString(),
              note: \`Stock restored due to order return (\${status})\`,
              actorId: req.user?._id || null,
            });
            await checkAndCreateStockNotification(updatedProduct._id);
          }
        }
      }
      order.stockUpdated = true; // prevent double restore
    }

    order.statusHistory.push({
      status: order.status,
      description: \`Return status updated to \${status}\${comments ? ': ' + comments : ''}\`,
      updatedBy: req.user._id,
    });

    await order.save();
    res.status(200).json(order);
  } catch (error) {
    console.error("Return status update error:", error);
    res.status(500).json({ message: error.message });
  }
};
`;

if (!content.includes("exports.requestReturnByUser")) {
  fs.appendFileSync(filePath, requestReturnByUserStr, "utf8");
}
if (!content.includes("exports.updateReturnStatus")) {
  fs.appendFileSync(filePath, updateReturnStatusStr, "utf8");
}
console.log("Appended missing functions to orderController.js");
