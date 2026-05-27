import React, { useState, useEffect, useRef } from "react";
import { FaCloudUploadAlt, FaPlus, FaTimes, FaSpinner, FaCheckCircle, FaUserTie } from "react-icons/fa";
import { toast } from "react-toastify";
import BaseModal from "./BaseModal";
import API from "../api";

const ProductFormModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialData = null, 
  categories = [], 
  suppliers = [] 
}) => {
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [features, setFeatures] = useState([]);
  const [featureInput, setFeatureInput] = useState("");
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    newCategory: "",
    price: "",
    discountPrice: "",
    stock: "",
    brand: "",
    sku: "",
    supplier: "",
    warranty: "",
    status: "In Stock",
    images: []
  });

  const [errors, setErrors] = useState({});
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showSupplierList, setShowSupplierList] = useState(false);

  // Sync with initialData (for Edit mode)
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (initialData) {
        // Ensure all fields are defined to prevent controlled/uncontrolled warnings
        const normalizedData = {
          name: initialData.name || "",
          description: initialData.description || "",
          brand: initialData.brand || "",
          sku: initialData.sku || "",
          warranty: initialData.warranty || "",
          price: initialData.price !== undefined && initialData.price !== null ? initialData.price : "",
          discountPrice: initialData.discountPrice !== undefined && initialData.discountPrice !== null ? initialData.discountPrice : "",
          stock: initialData.stock !== undefined && initialData.stock !== null ? initialData.stock : "",
          category: initialData.category?._id || initialData.category || "",
          supplier: initialData.supplier?._id || initialData.supplier || "",
          status: initialData.stock > 0 ? "In Stock" : "Out of Stock",
          images: []
        };
        
        setFormData(prev => ({
          ...prev,
          ...normalizedData
        }));
        setFeatures(initialData.features || []);
        // Reset search field to current supplier name
        if (initialData.supplier) {
          const s = suppliers.find(sup => sup._id === (initialData.supplier?._id || initialData.supplier));
          setSupplierSearch(s?.name || "");
        } else {
          setSupplierSearch("");
        }
      } else {
        resetForm();
        setSupplierSearch("");
      }
    }
  }, [initialData, isOpen, suppliers]);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Product name is required";
    
    if (!formData.price || formData.price <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    if (formData.discountPrice && Number(formData.discountPrice) >= Number(formData.price)) {
      newErrors.discountPrice = "Discount price must be less than original price";
    }

    if (formData.stock === "" || formData.stock < 0) {
      newErrors.stock = "Stock cannot be negative";
    }

    if (!formData.category && !formData.newCategory) {
      newErrors.category = "Please select or create a category";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      newCategory: "",
      price: "",
      discountPrice: "",
      stock: "",
      brand: "",
      sku: "",
      supplier: "",
      warranty: "",
      status: "In Stock",
      images: []
    });
    setFeatures([]);
    setPreviews([]);
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addFeature = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      if (featureInput.trim()) {
        if (!features.includes(featureInput.trim())) {
          setFeatures([...features, featureInput.trim()]);
        }
        setFeatureInput("");
      }
    }
  };

  const removeFeature = (index) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);
    try {
      const finalCategory = formData.newCategory.trim() || formData.category;
      
      const payload = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'images') {
          if (formData.images.length > 0) {
            // First file as main thumbnail if it's a new upload
            const firstFile = formData.images.find(f => f instanceof File);
            if (firstFile) {
              payload.append("image", firstFile);
            }
            formData.images.forEach(img => {
              if (img instanceof File) {
                payload.append("images", img);
              }
            });
          }
        } else if (key === 'features') {
          // handled separately
        } else if (key === 'category') {
          payload.append("category", finalCategory);
        } else if (key === 'status') {
           payload.append("status", formData.stock > 0 ? "In Stock" : "Out of Stock");
        } else {
          payload.append(key, formData[key]);
        }
      });

      // Add features
      features.forEach(f => payload.append("features", f));

      if (initialData) {
        if (!initialData._id) {
          toast.error("Critical Error: Missing Product ID for update.");
          return;
        }
        await API.put(`/products/${initialData._id}`, payload);
        toast.success("Product updated successfully!");
      } else {
        await API.post("/products", payload);
        toast.success("Product added successfully!");
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={initialData ? "Edit Product" : "Add New Product"} 
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
            {initialData ? "Update Product" : "Save Product"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black mb-1.5 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g. iPhone 15 Pro Max"
              className={`w-full px-4 py-2.5 rounded-lg border outline-none font-medium shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20 ${
                errors.name ? "border-red-500" : ""
              }`}
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: errors.name ? '#ef4444' : 'var(--border-color)',
                color: 'var(--page-text)'
              }}
              required
            />
            {errors.name && <p className="text-[9px] text-red-500 mt-1 font-bold italic">{errors.name}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-black mb-1.5 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="2"
              placeholder="Tell customers about the product..."
              className="w-full px-4 py-2.5 rounded-lg border outline-none resize-none font-medium shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20"
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: 'var(--border-color)',
                color: 'var(--page-text)'
              }}
            />
          </div>
        </div>

        {/* Categories Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black mb-1.5 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className={`w-full px-4 py-2.5 rounded-lg border outline-none font-medium shadow-sm cursor-pointer transition-all focus:ring-2 focus:ring-blue-500/20 ${
                errors.category ? "border-red-500" : ""
              }`}
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: errors.category ? '#ef4444' : 'var(--border-color)',
                color: 'var(--page-text)'
              }}
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            {errors.category && <p className="text-[9px] text-red-500 mt-1 font-bold italic">{errors.category}</p>}
          </div>
          <div>
            <label className="block text-[10px] font-black mb-1.5 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
              New Category (Optional)
            </label>
            <input
              type="text"
              name="newCategory"
              value={formData.newCategory}
              onChange={handleInputChange}
              placeholder="Or type a new one"
              className="w-full px-4 py-2.5 rounded-lg border outline-none font-medium shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20"
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: 'var(--border-color)',
                color: 'var(--page-text)'
              }}
            />
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border shadow-inner" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border-color)' }}>
          <div>
            <label className="block text-[9px] font-black mb-1 uppercase tracking-widest" style={{ color: 'var(--page-text-muted)' }}>
              Price (INR) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 rounded-lg border outline-none font-bold text-sm ${
                errors.price ? "border-red-500" : ""
              }`}
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: errors.price ? '#ef4444' : 'var(--border-color)',
                color: 'var(--page-text)'
              }}
              required
            />
            {errors.price && <p className="text-[9px] text-red-500 mt-1 font-bold italic">{errors.price}</p>}
          </div>
          <div>
            <label className="block text-[9px] font-black mb-1 uppercase tracking-widest" style={{ color: 'var(--page-text-muted)' }}>
              Discount Price
            </label>
            <input
              type="number"
              name="discountPrice"
              value={formData.discountPrice}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 rounded-lg border outline-none font-bold text-sm ${
                errors.discountPrice ? "border-red-500" : ""
              }`}
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: errors.discountPrice ? '#ef4444' : 'var(--border-color)',
                color: 'var(--page-text)'
              }}
            />
            {errors.discountPrice && <p className="text-[9px] text-red-500 mt-1 font-bold italic">{errors.discountPrice}</p>}
          </div>
          <div>
            <label className="block text-[9px] font-black mb-1 uppercase tracking-widest" style={{ color: 'var(--page-text-muted)' }}>
              Stock Quantity *
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 rounded-lg border outline-none font-bold text-sm ${
                errors.stock ? "border-red-500" : ""
              }`}
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: errors.stock ? '#ef4444' : 'var(--border-color)',
                color: 'var(--page-text)'
              }}
              required
            />
            {errors.stock && <p className="text-[9px] text-red-500 mt-1 font-bold italic">{errors.stock}</p>}
          </div>
        </div>

        {/* Brand & Supplier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black mb-1.5 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
              Brand
            </label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              placeholder="e.g. Apple"
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
              SKU Code
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleInputChange}
              placeholder="e.g. APP-IPH-15P"
              className="w-full px-4 py-2.5 rounded-lg border outline-none font-medium shadow-sm"
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: 'var(--border-color)',
                color: 'var(--page-text)'
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <label className="block text-[10px] font-black mb-1.5 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
              Strategic Sourcing Partner
            </label>
            <div className="relative group">
              <FaUserTie className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
              <input
                type="text"
                placeholder="Search supplier by name or company..."
                value={supplierSearch}
                onChange={(e) => {
                  setSupplierSearch(e.target.value);
                  setShowSupplierList(true);
                  if (!e.target.value) {
                    setFormData({ ...formData, supplier: "" });
                  }
                }}
                onFocus={() => setShowSupplierList(true)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border outline-none font-medium shadow-sm transition-all focus:ring-4 focus:ring-blue-500/10 text-sm"
                style={{ 
                  backgroundColor: 'var(--surface-1)', 
                  borderColor: 'var(--border-color)',
                  color: 'var(--page-text)'
                }}
              />
              
              {showSupplierList && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowSupplierList(false)}
                  />
                  <div 
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-2xl z-50 max-h-[280px] overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="p-2 space-y-1">
                      {suppliers.filter(s => 
                        s.name?.toLowerCase().includes(supplierSearch.toLowerCase()) || 
                        s.company?.toLowerCase().includes(supplierSearch.toLowerCase())
                      ).length > 0 ? (
                        suppliers.filter(s => 
                          s.name?.toLowerCase().includes(supplierSearch.toLowerCase()) || 
                          s.company?.toLowerCase().includes(supplierSearch.toLowerCase())
                        ).map(s => (
                          <button
                            key={s._id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, supplier: s._id });
                              setSupplierSearch(s.name || "");
                              setShowSupplierList(false);
                            }}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-blue-500/5 dark:hover:bg-blue-500/10 text-left transition-all group"
                          >
                            <div>
                              <p className="text-sm font-bold group-hover:text-blue-600 transition-colors" style={{ color: 'var(--page-text)' }}>{s.name}</p>
                              <p className="text-[10px] font-medium opacity-40 uppercase tracking-tighter">{s.company || 'Direct Vendor'}</p>
                            </div>
                            {formData.supplier === s._id && (
                              <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                                <FaCheckCircle size={10} />
                              </div>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <FaUserTie className="mx-auto text-slate-200 mb-2" size={24} />
                          <p className="text-xs font-bold opacity-30 uppercase tracking-widest">No sourcing partners found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black mb-1.5 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
              Warranty
            </label>
            <input
              type="text"
              name="warranty"
              value={formData.warranty}
              onChange={handleInputChange}
              placeholder="e.g. 1 Year"
              className="w-full px-4 py-2.5 rounded-lg border outline-none font-medium shadow-sm"
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: 'var(--border-color)',
                color: 'var(--page-text)'
              }}
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[10px] font-black mb-2 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
            Product Status
          </label>
          <div className="flex gap-3">
            {["In Stock", "Out of Stock"].map(status => (
              <label key={status} className="flex items-center group cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={status}
                  checked={(formData.stock > 0 && status === "In Stock") || (formData.stock <= 0 && status === "Out of Stock")}
                  readOnly
                  className="hidden"
                />
                <div className={`flex items-center px-4 py-2 rounded-xl border transition-all ${
                  (formData.stock > 0 && status === "In Stock") || (formData.stock <= 0 && status === "Out of Stock")
                  ? "shadow-sm" 
                  : ""
                }`}
                style={{ 
                  backgroundColor: ((formData.stock > 0 && status === "In Stock") || (formData.stock <= 0 && status === "Out of Stock")) ? 'var(--surface-3)' : 'var(--surface-1)', 
                  borderColor: ((formData.stock > 0 && status === "In Stock") || (formData.stock <= 0 && status === "Out of Stock")) ? 'var(--accent-color)' : 'var(--border-color)',
                  color: ((formData.stock > 0 && status === "In Stock") || (formData.stock <= 0 && status === "Out of Stock")) ? 'var(--page-text)' : 'var(--page-text-muted)'
                }}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    status === "In Stock" ? "bg-green-500" : "bg-red-500"
                  }`}></span>
                  <span className="text-[10px] font-black tracking-wide uppercase">{status}</span>
                </div>
              </label>
            ))}
          </div>
          <small className="text-[9px] font-bold opacity-60 mt-1 block uppercase tracking-widest">Status is automatically set based on stock</small>
        </div>

        {/* Features Dynamic Tags */}
        <div>
          <label className="block text-[10px] font-black mb-2 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
            Features / Highlights
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {features.map((feature, idx) => (
              <span 
                key={idx} 
                className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-white text-[10px] font-black border shadow-sm"
                style={{ 
                  backgroundColor: 'var(--accent-color)', 
                  borderColor: 'var(--border-color)' 
                }}
              >
                {feature}
                <button type="button" onClick={() => removeFeature(idx)} className="hover:text-red-200">
                  <FaTimes size={10} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onKeyDown={addFeature}
              placeholder="Add feature..."
              className="flex-grow px-4 py-2.5 rounded-lg border outline-none shadow-sm"
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: 'var(--border-color)',
                color: 'var(--page-text)'
              }}
            />
            <button
              type="button"
              onClick={addFeature}
              className="px-4 py-2.5 text-white rounded-lg transition-all shadow active:scale-95 flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-color)' }}
            >
              <FaPlus size={14} />
            </button>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-[10px] font-black mb-2 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
            Product Images
          </label>
          <div 
            onClick={() => fileInputRef.current.click()}
            className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group shadow-inner relative"
            style={{ 
              backgroundColor: 'var(--surface-2)', 
              borderColor: 'var(--border-color)' 
            }}
          >
            <FaCloudUploadAlt size={32} style={{ color: 'var(--accent-color)' }} className="mb-2" />
            <p className="font-bold uppercase tracking-widest text-[10px]" style={{ color: 'var(--page-text)' }}>Drop images here or click to upload</p>
            <p className="text-[9px] mt-1 font-bold" style={{ color: 'var(--page-text-muted)' }}>JPG, PNG, WEBP (Max 5MB)</p>
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              className="hidden" 
              onChange={handleImageChange}
              accept="image/*"
            />
          </div>

          {/* Image Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 mt-3">
              {previews.map((preview, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group shadow-md border" style={{ borderColor: 'var(--border-color)' }}>
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-0.5 right-0.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <FaTimes size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </BaseModal>
  );
};

export default ProductFormModal;
