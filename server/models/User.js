const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple nulls
    },
    password: {
      type: String,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    profileImage: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer Not to Say"],
      default: "Prefer Not to Say",
    },
    dateOfBirth: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Blocked", "Suspended"],
      default: "Active",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    customerType: {
      type: String,
      enum: ["Regular", "Premium", "VIP"],
      default: "Regular",
    },
    billingAddress: {
      type: String,
      default: "",
      trim: true,
    },
    adminNotes: {
      type: String,
      default: "",
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
    },
    preferences: {
      newsletter: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: false }
    },
    shippingDetails: {
      fullAddress: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      pincode: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    billingDetails: {
      sameAsShipping: { type: Boolean, default: true },
      fullAddress: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      pincode: { type: String, default: "" },
      phone: { type: String, default: "" },
    },

    employeeId: { type: String, default: "" },
    joiningDate: { type: Date, default: Date.now },
    altMobile: { type: String, default: "" },
    lastLoginIp: { type: String, default: "" },
    lastLoginDate: { type: Date },
    twoFactorAuth: {
      enabled: { type: Boolean, default: false },
      secret: { type: String, default: "" },
    },
    notificationPreferences: {
      orderNotifications: { type: Boolean, default: true },
      paymentNotifications: { type: Boolean, default: true },
      returnRequests: { type: Boolean, default: true },
      lowStockAlerts: { type: Boolean, default: true },
      supplierNotifications: { type: Boolean, default: true },
      systemAnnouncements: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: true },
    },

    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    pincode: { type: String, default: "" },
    wishlist: [{
      type: String,
      ref: "Product",
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
