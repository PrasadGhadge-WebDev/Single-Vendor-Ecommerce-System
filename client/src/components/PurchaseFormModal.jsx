import React, { useState, useEffect } from "react";
import { FaSpinner, FaCheckCircle, FaSearch } from "react-icons/fa";
import BaseModal from "./BaseModal";

const PurchaseFormModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  suppliers = [],
  products = [],
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    supplierId: "",
    productId: "",
    quantity: "",
    unitCost: "",
    purchaseDate: new Date().toISOString().slice(0, 16),
    invoiceNumber: "",
    paymentStatus: "PENDING",
    notes: "",
  });

  const [supplierSearch, setSupplierSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setFormData({
        supplierId: "",
        productId: "",
        quantity: "",
        unitCost: "",
        purchaseDate: new Date().toISOString().slice(0, 16),
        invoiceNumber: "",
        paymentStatus: "PENDING",
        notes: "",
      });
      setSupplierSearch("");
      setProductSearch("");
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors = {};

    if (!formData.supplierId) newErrors.supplier = "Please select a supplier";
    if (!formData.productId) newErrors.product = "Please select a product";
    
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    if (!formData.unitCost || formData.unitCost <= 0) {
      newErrors.unitCost = "Unit cost must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const filteredSuppliers = suppliers.filter(s => 
    (s.name || "").toLowerCase().includes((supplierSearch || "").toLowerCase()) ||
    (s.company || "").toLowerCase().includes((supplierSearch || "").toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    (p.name || "").toLowerCase().includes((productSearch || "").toLowerCase())
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Inventory Purchase"
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
            Record Purchase
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supplier Search */}
          <div className="relative">
            <label className="block text-[10px] font-black mb-1.5 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
              Supplier *
            </label>
            <div className="relative">
              <input
                type="text"
                value={supplierSearch}
                onChange={(e) => {
                  setSupplierSearch(e.target.value);
                  setShowSupplierSuggestions(true);
                }}
                onFocus={() => setShowSupplierSuggestions(true)}
                placeholder="Search supplier..."
                className={`w-full px-4 py-2.5 rounded-lg border outline-none font-medium shadow-sm ${
                  errors.supplier ? "border-red-500" : ""
                }`}
                style={{ 
                  backgroundColor: 'var(--surface-1)', 
                  borderColor: errors.supplier ? '#ef4444' : 'var(--border-color)',
                  color: 'var(--page-text)'
                }}
                required
              />
              <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30" size={14} />
            </div>
            {errors.supplier && <p className="text-[9px] text-red-500 mt-1 font-bold italic">{errors.supplier}</p>}
            {showSupplierSuggestions && supplierSearch && (
              <div className="absolute z-50 w-full mt-1 rounded-xl shadow-xl border max-h-48 overflow-y-auto" style={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--border-color)' }}>
                {filteredSuppliers.map(s => (
                  <div
                    key={s._id}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, supplierId: s._id }));
                      setSupplierSearch(s.name);
                      setShowSupplierSuggestions(false);
                      setErrors(prev => ({ ...prev, supplier: "" }));
                    }}
                    className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm font-medium"
                  >
                    {s.name} <span className="opacity-50 text-xs">({s.company || 'No Company'})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Search */}
          <div className="relative">
            <label className="block text-[10px] font-black mb-1.5 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
              Product *
            </label>
            <div className="relative">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowProductSuggestions(true);
                }}
                onFocus={() => setShowProductSuggestions(true)}
                placeholder="Search product..."
                className={`w-full px-4 py-2.5 rounded-lg border outline-none font-medium shadow-sm ${
                  errors.product ? "border-red-500" : ""
                }`}
                style={{ 
                  backgroundColor: 'var(--surface-1)', 
                  borderColor: errors.product ? '#ef4444' : 'var(--border-color)',
                  color: 'var(--page-text)'
                }}
                required
              />
              <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30" size={14} />
            </div>
            {errors.product && <p className="text-[9px] text-red-500 mt-1 font-bold italic">{errors.product}</p>}
            {showProductSuggestions && productSearch && (
              <div className="absolute z-50 w-full mt-1 rounded-xl shadow-xl border max-h-48 overflow-y-auto" style={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--border-color)' }}>
                {filteredProducts.map(p => (
                  <div
                    key={p._id}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, productId: p._id }));
                      setProductSearch(p.name);
                      setShowProductSuggestions(false);
                      setErrors(prev => ({ ...prev, product: "" }));
                    }}
                    className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm font-medium"
                  >
                    {p.name} <span className="opacity-50 text-xs">(Stock: {p.stock})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border shadow-inner" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border-color)' }}>
          <div>
            <label className="block text-[9px] font-black mb-1 uppercase tracking-widest" style={{ color: 'var(--page-text-muted)' }}>
              Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-lg border outline-none font-bold text-sm ${
                errors.quantity ? "border-red-500" : ""
              }`}
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: errors.quantity ? '#ef4444' : 'var(--border-color)',
                color: 'var(--page-text)'
              }}
              required
            />
            {errors.quantity && <p className="text-[9px] text-red-500 mt-1 font-bold italic">{errors.quantity}</p>}
          </div>
          <div>
            <label className="block text-[9px] font-black mb-1 uppercase tracking-widest" style={{ color: 'var(--page-text-muted)' }}>
              Unit Cost *
            </label>
            <input
              type="number"
              name="unitCost"
              value={formData.unitCost}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-lg border outline-none font-bold text-sm ${
                errors.unitCost ? "border-red-500" : ""
              }`}
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: errors.unitCost ? '#ef4444' : 'var(--border-color)',
                color: 'var(--page-text)'
              }}
              required
            />
            {errors.unitCost && <p className="text-[9px] text-red-500 mt-1 font-bold italic">{errors.unitCost}</p>}
          </div>
          <div>
            <label className="block text-[9px] font-black mb-1 uppercase tracking-widest" style={{ color: 'var(--page-text-muted)' }}>
              Payment Status
            </label>
            <select
              name="paymentStatus"
              value={formData.paymentStatus}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border outline-none font-bold text-xs"
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: 'var(--border-color)',
                color: 'var(--page-text)'
              }}
            >
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black mb-1.5 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
              Invoice Number
            </label>
            <input
              type="text"
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleChange}
              placeholder="e.g. INV-2024-001"
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
              Purchase Date
            </label>
            <input
              type="datetime-local"
              name="purchaseDate"
              value={formData.purchaseDate}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border outline-none font-medium shadow-sm"
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: 'var(--border-color)',
                color: 'var(--page-text)'
              }}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black mb-1.5 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
            Notes / Remarks
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="2"
            placeholder="Any additional details..."
            className="w-full px-4 py-2.5 rounded-lg border outline-none resize-none font-medium shadow-sm"
            style={{ 
              backgroundColor: 'var(--surface-1)', 
              borderColor: 'var(--border-color)',
              color: 'var(--page-text)'
            }}
          />
        </div>
      </form>
    </BaseModal>
  );
};

export default PurchaseFormModal;
