const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: {
      type: [orderItemSchema],
      default: [],
    },
    shippingAddress: {
      fullName: { type: String, default: "", trim: true },
      phone: { type: String, default: "", trim: true },
      addressLine1: { type: String, default: "", trim: true },
      addressLine2: { type: String, default: "", trim: true },
      city: { type: String, default: "", trim: true },
      state: { type: String, default: "", trim: true },
      pincode: { type: String, default: "", trim: true },
      country: { type: String, default: "", trim: true },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    offerCode: {
      type: String,
      default: "",
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    stockUpdated: {
      type: Boolean,
      default: false,
    },
    cancellationReason: {
      type: String,
      default: "",
      trim: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    statusHistory: {
      type: [
        new mongoose.Schema(
          {
            status: {
              type: String,
              enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
              required: true,
            },
            description: {
              type: String,
              required: true,
              trim: true,
              maxlength: 2000,
            },
            updatedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              default: null,
            },
            createdAt: {
              type: Date,
              default: Date.now,
            },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
