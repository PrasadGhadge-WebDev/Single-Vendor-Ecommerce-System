const mongoose = require("mongoose");

const businessSettingSchema = new mongoose.Schema(
  {
    // General Settings
    storeName: { type: String, default: "ElectroHub", trim: true },
    logoUrl: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    currency: { type: String, default: "INR", trim: true, uppercase: true },
    timezone: { type: String, default: "UTC", trim: true },

    // Store Information
    businessName: { type: String, default: "ElectroHub", trim: true },
    gstNumber: { type: String, default: "", trim: true },
    ownerName: { type: String, default: "", trim: true },

    // Payment Settings
    codEnabled: { type: Boolean, default: true },
    onlinePaymentEnabled: { type: Boolean, default: false },
    upiId: { type: String, default: "", trim: true },
    razorpayKeyId: { type: String, default: "", trim: true },
    razorpayKeySecret: { type: String, default: "", trim: true },

    // Shipping Settings
    freeShippingEnabled: { type: Boolean, default: false },
    deliveryCharges: { type: Number, default: 0, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    deliveryTime: { type: String, default: "", trim: true },

    // Tax Settings
    taxPercent: { type: Number, default: 0, min: 0 },
    isTaxInclusive: { type: Boolean, default: false },

    // Order Settings
    orderStatusFlow: { type: [String], default: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"] },
    autoConfirmOrders: { type: Boolean, default: false },
    cancelEnabled: { type: Boolean, default: true },
    returnEnabled: { type: Boolean, default: true },

    // Notification Settings
    emailNotificationsEnabled: { type: Boolean, default: true },
    orderAlertsEnabled: { type: Boolean, default: true },

    // SEO Settings
    metaTitle: { type: String, default: "", trim: true },
    metaDescription: { type: String, default: "", trim: true },

    // Policy Pages
    privacyPolicy: { type: String, default: "", trim: true },
    termsAndConditions: { type: String, default: "", trim: true },
    refundPolicy: { type: String, default: "", trim: true },

    // Legacy fields (optional support)
    invoicePrefix: { type: String, default: "INV", trim: true, uppercase: true },
    invoiceFooter: { type: String, default: "Thank you for your purchase.", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BusinessSetting", businessSettingSchema);
