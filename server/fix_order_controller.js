const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'controllers', 'orderController.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes('checkAndCreateStockNotification')) {
  content = content.replace(
    'const Payment = require("../models/Payment");',
    'const Payment = require("../models/Payment");\nconst { checkAndCreateStockNotification } = require("./notificationController");'
  );

  // 2. Add inside logs
  content = content.replace(/note: `Stock deducted due to order status: \${status}`,\n\s*actorId: req.user\?\._id \|\| null,\n\s*}\);\n\s*}/g, 'note: `Stock deducted due to order status: ${status}`,\n            actorId: req.user?._id || null,\n          });\n          await checkAndCreateStockNotification(updatedProduct._id);\n        }');
  
  content = content.replace(/note: "Stock restored due to order cancellation",\n\s*actorId: req.user\?\._id \|\| null,\n\s*}\);\n\s*}/g, 'note: "Stock restored due to order cancellation",\n            actorId: req.user?._id || null,\n          });\n          await checkAndCreateStockNotification(updatedProduct._id);\n        }');
  
  content = content.replace(/note: "Stock restored due to customer cancellation",\n\s*actorId: req.user\?\._id \|\| null,\n\s*}\);\n\s*}/g, 'note: "Stock restored due to customer cancellation",\n            actorId: req.user?._id || null,\n          });\n          await checkAndCreateStockNotification(updatedProduct._id);\n        }');

  content = content.replace(/note: "Stock restored due to order deletion",\n\s*actorId: req.user\?\._id \|\| null,\n\s*}\);\n\s*}/g, 'note: "Stock restored due to order deletion",\n            actorId: req.user?._id || null,\n          });\n          await checkAndCreateStockNotification(updatedProduct._id);\n        }');

  content = content.replace(/note: "Stock deducted due to adding item",\n\s*actorId: req.user\?\._id \|\| null,\n\s*}\);\n\s*}/g, 'note: "Stock deducted due to adding item",\n            actorId: req.user?._id || null,\n          });\n          await checkAndCreateStockNotification(updatedProduct._id);\n        }');
  
  content = content.replace(/note: `Stock restored due to order return \(\${returnStatus}\)`,\n\s*actorId: req.user\?\._id \|\| null,\n\s*}\);\n\s*}/g, 'note: `Stock restored due to order return (${returnStatus})`,\n              actorId: req.user?._id || null,\n            });\n            await checkAndCreateStockNotification(updatedProduct._id);\n          }');

}

// Add markOrderAsPaid at the end
if (!content.includes('exports.markOrderAsPaid')) {
  content += `\n\nexports.markOrderAsPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.paymentMethod !== "COD") {
      return res.status(400).json({ message: "Only COD orders can be marked as paid manually" });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({ message: "Order must be delivered before marking as paid" });
    }

    if (order.paymentStatus === "paid" || order.isPaid) {
      return res.status(400).json({ message: "Order is already paid" });
    }

    order.paymentStatus = "paid";
    order.isPaid = true;
    order.paidAt = new Date();
    order.collectedBy = req.user._id;

    order.statusHistory.push({
      status: order.status,
      description: "Payment collected for COD order",
      updatedBy: req.user._id,
    });

    await order.save();

    const payment = await Payment.findOne({ order: order._id, method: "COD" });
    if (payment) {
      payment.status = "verified";
      await payment.save();
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};\n`;
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Success");
