import React, { useState, useEffect } from "react";
import { FaSpinner, FaCheckCircle, FaPercentage } from "react-icons/fa";
import BaseModal from "./BaseModal";

const OfferFormModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData = null,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    title: "",
    code: "",
    description: "",
    discountType: "PERCENT",
    discountValue: "",
    minOrderAmount: "",
    maxDiscountAmount: "",
    startsAt: "",
    expiresAt: "",
    isActive: true,
    image: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (initialData) {
        setFormData({
          title: initialData.title || "",
          code: initialData.code || "",
          description: initialData.description || "",
          discountType: initialData.discountType || "PERCENT",
          discountValue: initialData.discountValue ?? "",
          minOrderAmount: initialData.minOrderAmount ?? "",
          maxDiscountAmount: initialData.maxDiscountAmount ?? "",
          startsAt: initialData.startsAt ? new Date(initialData.startsAt).toISOString().slice(0, 16) : "",
          expiresAt: initialData.expiresAt ? new Date(initialData.expiresAt).toISOString().slice(0, 16) : "",
          isActive: initialData.isActive ?? true,
          image: initialData.image || "",
        });
      } else {
        setFormData({
          title: "",
          code: "",
          description: "",
          discountType: "PERCENT",
          discountValue: "",
          minOrderAmount: "",
          maxDiscountAmount: "",
          startsAt: "",
          expiresAt: "",
          isActive: true,
          image: "",
        });
      }
    }
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.code.trim()) newErrors.code = "Promo code is required";
    
    if (!formData.discountValue || formData.discountValue <= 0) {
      newErrors.discountValue = "Value must be greater than 0";
    }

    if (formData.startsAt && formData.expiresAt) {
      if (new Date(formData.expiresAt) <= new Date(formData.startsAt)) {
        newErrors.expiresAt = "Expiry must be after start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Offer" : "Create New Offer"}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl font-bold transition-all border hover:opacity-80"
            style={{ 
              borderColor: 'var(--border-color)', 
              color: 'var(--page-text-muted)' 
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-2 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent-color)' }}
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
            {initialData ? "Update Offer" : "Save Offer"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black mb-1.5 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
              Offer Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Summer Mega Sale"
              className={`w-full px-4 py-2.5 rounded-lg border outline-none font-medium shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20 ${
                errors.title ? "border-red-500" : ""
              }`}
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: errors.title ? '#ef4444' : 'var(--border-color)',
                color: 'var(--page-text)'
              }}
              required
            />
            {errors.title && <p className="text-[9px] text-red-500 mt-1 font-bold italic">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-black mb-1.5 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
              Promo Code *
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="e.g. SUMMER50"
              className={`w-full px-4 py-2.5 rounded-lg border outline-none font-bold shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20 ${
                errors.code ? "border-red-500" : ""
              }`}
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: errors.code ? '#ef4444' : 'var(--border-color)',
                color: 'var(--page-text)'
              }}
              required
            />
            {errors.code && <p className="text-[9px] text-red-500 mt-1 font-bold italic">{errors.code}</p>}
          </div>

          <div className="md:col-span-3">
            <label className="block text-[10px] font-black mb-1.5 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
              Short Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              placeholder="Briefly describe this offer for customers..."
              className="w-full px-4 py-2.5 rounded-lg border outline-none resize-none font-medium shadow-sm"
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: 'var(--border-color)',
                color: 'var(--page-text)'
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl border shadow-inner" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border-color)' }}>
          <div>
            <label className="block text-[9px] font-black mb-1 uppercase tracking-widest" style={{ color: 'var(--page-text-muted)' }}>
              Type
            </label>
            <select
              name="discountType"
              value={formData.discountType}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border outline-none font-bold text-sm"
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: 'var(--border-color)',
                color: 'var(--page-text)'
              }}
            >
              <option value="PERCENT">Percent (%)</option>
              <option value="FIXED">Fixed (INR)</option>
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black mb-1 uppercase tracking-widest" style={{ color: 'var(--page-text-muted)' }}>
              Value *
            </label>
            <input
              type="number"
              name="discountValue"
              value={formData.discountValue}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-lg border outline-none font-bold text-sm ${
                errors.discountValue ? "border-red-500" : ""
              }`}
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: errors.discountValue ? '#ef4444' : 'var(--border-color)',
                color: 'var(--page-text)'
              }}
              required
            />
            {errors.discountValue && <p className="text-[9px] text-red-500 mt-1 font-bold italic">{errors.discountValue}</p>}
          </div>
          <div>
            <label className="block text-[9px] font-black mb-1 uppercase tracking-widest" style={{ color: 'var(--page-text-muted)' }}>
              Min Order
            </label>
            <input
              type="number"
              name="minOrderAmount"
              value={formData.minOrderAmount}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border outline-none font-bold text-sm"
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: 'var(--border-color)',
                color: 'var(--page-text)'
              }}
            />
          </div>
          <div>
            <label className="block text-[9px] font-black mb-1 uppercase tracking-widest" style={{ color: 'var(--page-text-muted)' }}>
              Max Discnt
            </label>
            <input
              type="number"
              name="maxDiscountAmount"
              value={formData.maxDiscountAmount}
              onChange={handleChange}
              placeholder="For %"
              className="w-full px-3 py-2 rounded-lg border outline-none font-bold text-sm"
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: 'var(--border-color)',
                color: 'var(--page-text)'
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black mb-1.5 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
              Starts At
            </label>
            <input
              type="datetime-local"
              name="startsAt"
              value={formData.startsAt}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border outline-none font-medium shadow-sm"
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: 'var(--border-color)',
                color: 'var(--page-text)'
              }}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black mb-1.5 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
              Expires At
            </label>
            <input
              type="datetime-local"
              name="expiresAt"
              value={formData.expiresAt}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 rounded-lg border outline-none font-medium shadow-sm ${
                errors.expiresAt ? "border-red-500" : ""
              }`}
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: errors.expiresAt ? '#ef4444' : 'var(--border-color)',
                color: 'var(--page-text)'
              }}
            />
            {errors.expiresAt && <p className="text-[9px] text-red-500 mt-1 font-bold italic">{errors.expiresAt}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-black mb-1.5 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
              Offer Image URL (Optional)
            </label>
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="e.g. https://example.com/banner.jpg"
              className="w-full px-4 py-2.5 rounded-lg border outline-none font-medium shadow-sm"
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: 'var(--border-color)',
                color: 'var(--page-text)'
              }}
            />
            {formData.image && (
              <div className="mt-3 relative aspect-[21/9] rounded-xl overflow-hidden border shadow-inner" style={{ borderColor: 'var(--border-color)' }}>
                <img src={formData.image} alt="Offer Preview" className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-[8px] font-black uppercase rounded-md backdrop-blur-sm">
                  Image Preview
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
              Active Offer
            </span>
          </label>
        </div>
      </form>
    </BaseModal>
  );
};

export default OfferFormModal;
