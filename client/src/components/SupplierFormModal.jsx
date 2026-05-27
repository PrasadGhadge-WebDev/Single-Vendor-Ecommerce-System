import React, { useState, useEffect } from "react";
import { FaSpinner, FaCheckCircle, FaUser, FaMapMarkerAlt, FaBriefcase, FaToggleOn } from "react-icons/fa";
import BaseModal from "./BaseModal";

const SupplierFormModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData = null,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India"
    },
    gstNumber: "",
    paymentTerms: "30 Days",
    category: "General",
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          email: initialData.email || "",
          phone: initialData.phone || "",
          company: initialData.company || "",
          address: {
            street: initialData.address?.street || initialData.address || "",
            city: initialData.address?.city || "",
            state: initialData.address?.state || "",
            zipCode: initialData.address?.zipCode || "",
            country: initialData.address?.country || "India"
          },
          gstNumber: initialData.gstNumber || "",
          paymentTerms: initialData.paymentTerms || "30 Days",
          category: initialData.category || "General",
          isActive: initialData.isActive ?? true,
        });
      }
    }
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Supplier name is required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    
    if (name.includes("address.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: val }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: val }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 pb-2 mb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
      <Icon className="text-indigo-600 opacity-60" size={14} />
      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{title}</span>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Refine Supplier Profile" : "Onboard New Supplier"}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border hover:bg-slate-50 dark:hover:bg-slate-800"
            style={{ borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-10 py-3 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent-color)' }}
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
            {initialData ? "Update Supplier" : "Save Supplier"}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-8 p-1">
        {/* Basic Info */}
        <div className="space-y-4">
          <SectionHeader icon={FaUser} title="Basic Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[9px] font-black mb-1.5 uppercase tracking-widest opacity-40">Supplier Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full legal name"
                className="w-full px-4 py-3 rounded-xl border-2 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs shadow-inner"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
                required
              />
            </div>
            <div>
              <label className="block text-[9px] font-black mb-1.5 uppercase tracking-widest opacity-40">Company Name</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="e.g. Acme Industries"
                className="w-full px-4 py-3 rounded-xl border-2 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs shadow-inner"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
              />
            </div>
            <div>
              <label className="block text-[9px] font-black mb-1.5 uppercase tracking-widest opacity-40">Business Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="orders@supplier.com"
                className="w-full px-4 py-3 rounded-xl border-2 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs shadow-inner"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
              />
            </div>
            <div>
              <label className="block text-[9px] font-black mb-1.5 uppercase tracking-widest opacity-40">Primary Contact</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 00000 00000"
                className="w-full px-4 py-3 rounded-xl border-2 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs shadow-inner"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
              />
            </div>
          </div>
        </div>

        {/* Address Details */}
        <div className="space-y-4">
          <SectionHeader icon={FaMapMarkerAlt} title="Address Details" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[9px] font-black mb-1.5 uppercase tracking-widest opacity-40">Street Address</label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                placeholder="Office, Building, Area"
                className="w-full px-4 py-3 rounded-xl border-2 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs shadow-inner"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
              />
            </div>
            <div>
              <label className="block text-[9px] font-black mb-1.5 uppercase tracking-widest opacity-40">City</label>
              <input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                placeholder="e.g. Mumbai"
                className="w-full px-4 py-3 rounded-xl border-2 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs shadow-inner"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
              />
            </div>
            <div>
              <label className="block text-[9px] font-black mb-1.5 uppercase tracking-widest opacity-40">State / Region</label>
              <input
                type="text"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                placeholder="e.g. Maharashtra"
                className="w-full px-4 py-3 rounded-xl border-2 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs shadow-inner"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
              />
            </div>
            <div>
              <label className="block text-[9px] font-black mb-1.5 uppercase tracking-widest opacity-40">Pincode</label>
              <input
                type="text"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleChange}
                placeholder="400001"
                className="w-full px-4 py-3 rounded-xl border-2 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs shadow-inner"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
              />
            </div>
          </div>
        </div>

        {/* Business Terms */}
        <div className="space-y-4">
          <SectionHeader icon={FaBriefcase} title="Business Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-black mb-1.5 uppercase tracking-widest opacity-40">GST Identification (GSTIN)</label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                placeholder="27AAAAA0000A1Z5"
                className="w-full px-4 py-3 rounded-xl border-2 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs shadow-inner"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
              />
            </div>
            <div>
              <label className="block text-[9px] font-black mb-1.5 uppercase tracking-widest opacity-40">Payment Terms</label>
              <select
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs shadow-inner appearance-none cursor-pointer"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
              >
                <option value="Immediate">Immediate</option>
                <option value="15 Days">15 Days Net</option>
                <option value="30 Days">30 Days Net</option>
                <option value="60 Days">60 Days Net</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[9px] font-black mb-1.5 uppercase tracking-widest opacity-40">Supplier Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. Raw Material, Logistics, Services"
                className="w-full px-4 py-3 rounded-xl border-2 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs shadow-inner"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
              />
            </div>
          </div>
        </div>

        {/* Lifecycle Status */}
        <div className="space-y-4">
          <SectionHeader icon={FaToggleOn} title="Account Status" />
          <div className="flex items-center justify-between p-6 rounded-2xl border-2 bg-slate-50 dark:bg-slate-900/40" style={{ borderColor: 'var(--border-color)' }}>
            <div className="space-y-0.5">
              <p className="text-xs font-black" style={{ color: 'var(--page-text)' }}>Active Network Status</p>
              <p className="text-[10px] font-bold opacity-40 uppercase tracking-wider">Enable to allow purchase transactions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </form>
    </BaseModal>
  );
};

export default SupplierFormModal;
