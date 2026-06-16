import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaSpinner, FaCheckCircle, FaSearch, FaTimes, FaCloudUploadAlt, FaFilePdf, FaFileImage } from "react-icons/fa";

const PurchaseFormModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  suppliers = [],
  products = [],
  loading = false 
}) => {
  const generatePurchaseId = () => {
    return `PUR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`;
  };

  const [formData, setFormData] = useState({
    purchaseId: generatePurchaseId(),
    supplierId: "",
    productId: "",
    quantity: "",
    unitCost: "",
    purchaseDate: new Date().toISOString().slice(0, 16),
    invoiceNumber: "",
    paymentStatus: "PENDING",
    paymentMethod: "Cash",
    paidAmount: "",
    notes: "",
    invoiceFile: null
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
        purchaseId: generatePurchaseId(),
        supplierId: "",
        productId: "",
        quantity: "",
        unitCost: "",
        purchaseDate: new Date().toISOString().slice(0, 16),
        invoiceNumber: "",
        paymentStatus: "PENDING",
        paymentMethod: "Cash",
        paidAmount: "",
        notes: "",
        invoiceFile: null
      });
      setSupplierSearch("");
      setProductSearch("");
    }
  }, [isOpen]);

  const selectedSupplier = suppliers.find(s => s._id === formData.supplierId);
  const selectedProduct = products.find(p => p._id === formData.productId);

  const totalPurchaseCost = (Number(formData.quantity) || 0) * (Number(formData.unitCost) || 0);
  const remainingAmount = formData.paymentStatus === "PARTIAL" 
    ? Math.max(0, totalPurchaseCost - (Number(formData.paidAmount) || 0)) 
    : (formData.paymentStatus === "PAID" ? 0 : totalPurchaseCost);

  const validate = () => {
    const newErrors = {};

    if (!formData.supplierId) newErrors.supplier = "Please select a supplier";
    if (!formData.productId) newErrors.product = "Please select a product";
    
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      newErrors.quantity = "Quantity must be > 0";
    }

    if (!formData.unitCost || Number(formData.unitCost) <= 0) {
      newErrors.unitCost = "Unit cost must be > 0";
    }

    if (formData.paymentStatus === "PARTIAL") {
      if (!formData.paidAmount || Number(formData.paidAmount) < 0) {
        newErrors.paidAmount = "Invalid paid amount";
      } else if (Number(formData.paidAmount) > totalPurchaseCost) {
        newErrors.paidAmount = "Cannot exceed total cost";
      }
    }

    if (formData.invoiceFile) {
      const file = formData.invoiceFile;
      const validTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        newErrors.invoiceFile = "Only PDF, JPG, and PNG are allowed.";
      }
      if (file.size > 5 * 1024 * 1024) {
        newErrors.invoiceFile = "Maximum file size is 5 MB.";
      }
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, invoiceFile: file }));
      if (errors.invoiceFile) {
        setErrors(prev => ({ ...prev, invoiceFile: "" }));
      }
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

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-300">
      
      {/* Modal Container */}
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl flex flex-col h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 sm:px-8 sm:py-5 border-b border-slate-100 shrink-0">
          <div>
            <h1 className="text-xl font-black text-slate-900 m-0">Record Inventory Purchase</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">ID: <span className="text-indigo-600">{formData.purchaseId}</span></p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content Body - 2 Columns on Desktop */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50">
          
          {/* Main Form - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
            <form id="purchaseForm" onSubmit={handleSubmit} className="space-y-6">
              
              {/* --- BASIC INFORMATION --- */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Basic Information
                </h2>
                
                <div className="space-y-6">
                  {/* Supplier Search */}
                  <div className="relative">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Supplier *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={supplierSearch}
                        onChange={(e) => {
                          setSupplierSearch(e.target.value);
                          setShowSupplierSuggestions(true);
                        }}
                        onFocus={() => setShowSupplierSuggestions(true)}
                        placeholder="Search and select supplier..."
                        className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium text-slate-700 ${
                          errors.supplier ? "border-rose-500" : "border-slate-200"
                        }`}
                      />
                      <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    </div>
                    {errors.supplier && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.supplier}</p>}
                    
                    {/* Supplier Suggestions Dropdown */}
                    {showSupplierSuggestions && (
                      <div className="absolute z-50 w-full mt-1 rounded-xl shadow-xl border border-slate-200 bg-white max-h-48 overflow-y-auto">
                        {filteredSuppliers.length > 0 ? filteredSuppliers.map(s => (
                          <div
                            key={s._id}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, supplierId: s._id }));
                              setSupplierSearch(s.name);
                              setShowSupplierSuggestions(false);
                              setErrors(prev => ({ ...prev, supplier: "" }));
                            }}
                            className="px-4 py-3 hover:bg-indigo-50 cursor-pointer text-sm font-medium text-slate-700 transition-colors border-b border-slate-50 last:border-0"
                          >
                            <div className="font-bold">{s.name}</div>
                            <div className="text-xs text-slate-500">{s.company || 'No Company'}</div>
                          </div>
                        )) : (
                          <div className="px-4 py-3 text-sm text-slate-500">No suppliers found</div>
                        )}
                      </div>
                    )}

                    {/* Auto-filled Supplier Info */}
                    {selectedSupplier && (
                      <div className="mt-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex gap-4 text-xs">
                        <div><span className="text-slate-500">Contact:</span> <span className="font-bold text-slate-800">{selectedSupplier.contactPerson || "N/A"}</span></div>
                        <div><span className="text-slate-500">Mobile:</span> <span className="font-bold text-slate-800">{selectedSupplier.mobileNumber || "N/A"}</span></div>
                      </div>
                    )}
                  </div>

                  {/* Product Search */}
                  <div className="relative">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Product *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setShowProductSuggestions(true);
                        }}
                        onFocus={() => setShowProductSuggestions(true)}
                        placeholder="Search and select product..."
                        className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium text-slate-700 ${
                          errors.product ? "border-rose-500" : "border-slate-200"
                        }`}
                      />
                      <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    </div>
                    {errors.product && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.product}</p>}
                    
                    {/* Product Suggestions Dropdown */}
                    {showProductSuggestions && (
                      <div className="absolute z-50 w-full mt-1 rounded-xl shadow-xl border border-slate-200 bg-white max-h-48 overflow-y-auto">
                        {filteredProducts.length > 0 ? filteredProducts.map(p => (
                          <div
                            key={p._id}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, productId: p._id }));
                              setProductSearch(p.name);
                              setShowProductSuggestions(false);
                              setErrors(prev => ({ ...prev, product: "" }));
                            }}
                            className="px-4 py-3 hover:bg-indigo-50 cursor-pointer text-sm font-medium text-slate-700 transition-colors border-b border-slate-50 last:border-0 flex justify-between items-center"
                          >
                            <span className="font-bold">{p.name}</span>
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs">Stock: {p.stock}</span>
                          </div>
                        )) : (
                          <div className="px-4 py-3 text-sm text-slate-500">No products found</div>
                        )}
                      </div>
                    )}

                    {/* Auto-filled Product Info */}
                    {selectedProduct && (
                      <div className="mt-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-wrap gap-4 text-xs">
                        <div><span className="text-slate-500">Category:</span> <span className="font-bold text-slate-800">{selectedProduct.category?.name || "N/A"}</span></div>
                        <div><span className="text-slate-500">Current Stock:</span> <span className="font-bold text-slate-800">{selectedProduct.stock} Units</span></div>
                        <div><span className="text-slate-500">Selling Price:</span> <span className="font-bold text-slate-800">₹{selectedProduct.price}</span></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* --- PURCHASE DETAILS --- */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Purchase Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Quantity *</label>
                    <input
                      type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="1"
                      className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium text-slate-700 ${errors.quantity ? "border-rose-500" : "border-slate-200"}`}
                      placeholder="Units to purchase"
                    />
                    {errors.quantity && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.quantity}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Unit Cost (₹) *</label>
                    <input
                      type="number" name="unitCost" value={formData.unitCost} onChange={handleChange} min="1"
                      className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium text-slate-700 ${errors.unitCost ? "border-rose-500" : "border-slate-200"}`}
                      placeholder="Cost per unit"
                    />
                    {errors.unitCost && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.unitCost}</p>}
                  </div>
                </div>
                
                {/* Stock Preview */}
                {selectedProduct && formData.quantity && (
                  <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center text-sm font-medium">
                    <div className="text-slate-500">Current Stock: <span className="text-slate-800 font-bold">{selectedProduct.stock}</span></div>
                    <div className="text-indigo-600">+ {formData.quantity}</div>
                    <div className="text-slate-500">Updated Stock: <span className="text-emerald-600 font-bold">{Number(selectedProduct.stock) + Number(formData.quantity)}</span></div>
                  </div>
                )}
              </div>

              {/* --- PAYMENT INFORMATION --- */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Payment Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Payment Status *</label>
                    <select
                      name="paymentStatus" value={formData.paymentStatus} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium text-slate-700 cursor-pointer"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PARTIAL">Partial</option>
                      <option value="PAID">Paid</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Payment Method</label>
                    <select
                      name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium text-slate-700 cursor-pointer"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="UPI">UPI</option>
                      <option value="Cheque">Cheque</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                </div>

                {formData.paymentStatus === "PARTIAL" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
                    <div>
                      <label className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-2">Paid Amount (₹) *</label>
                      <input
                        type="number" name="paidAmount" value={formData.paidAmount} onChange={handleChange} min="0" max={totalPurchaseCost}
                        className={`w-full px-4 py-3 rounded-xl border bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-sm font-medium text-slate-700 ${errors.paidAmount ? "border-rose-500" : "border-amber-200"}`}
                        placeholder="Enter paid amount"
                      />
                      {errors.paidAmount && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.paidAmount}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-2">Remaining Amount</label>
                      <div className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-amber-100/50 text-sm font-bold text-amber-900">
                        ₹{remainingAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* --- INVOICE & ADDITIONAL INFO --- */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Invoice & Additional Info
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Supplier Invoice Number</label>
                    <input
                      type="text" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium text-slate-700"
                      placeholder="e.g. INV-2026-001"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Purchase Date & Time</label>
                    <input
                      type="datetime-local" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium text-slate-700"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Upload Invoice</label>
                  <label className="flex justify-center w-full h-32 px-4 transition bg-slate-50 border-2 border-slate-300 border-dashed rounded-xl appearance-none cursor-pointer hover:border-indigo-400 focus:outline-none">
                    <span className="flex items-center space-x-2">
                      <FaCloudUploadAlt className="w-6 h-6 text-slate-400" />
                      <span className="font-medium text-slate-600">
                        {formData.invoiceFile ? formData.invoiceFile.name : "Drop files to attach, or browse"}
                      </span>
                    </span>
                    <input type="file" name="file_upload" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
                  </label>
                  <div className="text-[10px] text-slate-400 mt-2 flex gap-4">
                    <span className="flex items-center gap-1"><FaFilePdf/> PDF</span>
                    <span className="flex items-center gap-1"><FaFileImage/> JPG, PNG</span>
                    <span>Max Size: 5 MB</span>
                  </div>
                  {errors.invoiceFile && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.invoiceFile}</p>}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between mb-2">
                    <span>Notes / Remarks</span>
                    <span className={formData.notes.length > 500 ? "text-rose-500" : ""}>{formData.notes.length}/500</span>
                  </label>
                  <textarea
                    name="notes" value={formData.notes} onChange={handleChange} rows="3" maxLength="500"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium text-slate-700 resize-none"
                    placeholder="Any additional details regarding this purchase..."
                  />
                </div>
              </div>

            </form>
          </div>

          {/* Sticky Summary Panel (Right Side) */}
          <div className="w-full lg:w-96 bg-white border-l border-slate-100 flex flex-col shrink-0 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] z-10 hidden lg:flex">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-black text-slate-800">Purchase Summary</h3>
              <p className="text-xs text-slate-500 mt-1">Review details before saving</p>
            </div>
            
            <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
              
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                  <span className="text-xs text-slate-500 font-medium">Purchase ID</span>
                  <span className="text-sm font-bold text-slate-800 text-right">{formData.purchaseId}</span>
                </div>
                
                <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                  <span className="text-xs text-slate-500 font-medium">Supplier</span>
                  <span className="text-sm font-bold text-slate-800 text-right max-w-[180px] truncate">{selectedSupplier ? selectedSupplier.name : "-"}</span>
                </div>

                <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                  <span className="text-xs text-slate-500 font-medium">Product</span>
                  <span className="text-sm font-bold text-slate-800 text-right max-w-[180px] truncate">{selectedProduct ? selectedProduct.name : "-"}</span>
                </div>

                <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                  <span className="text-xs text-slate-500 font-medium">Quantity</span>
                  <span className="text-sm font-bold text-slate-800 text-right">{formData.quantity || "-"}</span>
                </div>

                <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                  <span className="text-xs text-slate-500 font-medium">Unit Cost</span>
                  <span className="text-sm font-bold text-slate-800 text-right">{formData.unitCost ? `₹${Number(formData.unitCost).toLocaleString()}` : "-"}</span>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-indigo-800 font-bold">Total Cost</span>
                  <span className="text-xl font-black text-indigo-900">₹{totalPurchaseCost.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Payment Status</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                    formData.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                    formData.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-700' : 
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {formData.paymentStatus}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Payment Method</span>
                  <span className="text-sm font-bold text-slate-800">{formData.paymentMethod}</span>
                </div>

                {formData.paymentStatus === "PARTIAL" && (
                   <div className="flex justify-between items-center p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <span className="text-xs text-amber-700 font-medium">Remaining</span>
                    <span className="text-sm font-bold text-amber-900">₹{remainingAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between lg:justify-end items-center gap-4 px-6 py-4 sm:px-8 sm:py-5 border-t border-slate-200 bg-white shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            className="h-[44px] min-w-[120px] px-6 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          
          <button 
            form="purchaseForm"
            type="submit"
            disabled={loading}
            className="h-[44px] min-w-[120px] px-6 rounded-xl text-sm font-bold bg-indigo-600 text-white flex justify-center items-center gap-2 shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all disabled:opacity-70"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaCheckCircle size={16} />}
            Record Purchase
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default PurchaseFormModal;
