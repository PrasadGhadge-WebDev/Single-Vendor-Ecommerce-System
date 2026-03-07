const mongoose = require("mongoose");

const businessSettingSchema = new mongoose.Schema(
  {
    businessName: { type: String, default: "Single Vendor Store", trim: true },
    ownerName: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    gstNumber: { type: String, default: "", trim: true },
    invoicePrefix: { type: String, default: "INV", trim: true, uppercase: true },
    invoiceFooter: { type: String, default: "Thank you for your purchase.", trim: true },
    currency: { type: String, default: "INR", trim: true, uppercase: true },
    taxPercent: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BusinessSetting", businessSettingSchema);
