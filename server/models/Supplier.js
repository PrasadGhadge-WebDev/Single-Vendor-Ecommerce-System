const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    gstNumber: { type: String, default: "", trim: true },
    
    // Address Information
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, default: "India", trim: true },
    
    // Business Information
    company: { type: String, default: "", trim: true },
    website: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    
    // Banking Information
    bankDetails: {
      bankName: { type: String, default: "", trim: true },
      accountName: { type: String, default: "", trim: true },
      accountNumber: { type: String, default: "", trim: true },
      ifscCode: { type: String, default: "", trim: true },
    },
    
    // Account Status
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

supplierSchema.index({ name: 1 });
supplierSchema.index({ company: 1 });
supplierSchema.index({ email: 1 });

module.exports = mongoose.model("Supplier", supplierSchema);
