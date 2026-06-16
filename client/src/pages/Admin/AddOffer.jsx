import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api";
import { toast } from "react-toastify";
import { FaTimes, FaSearch } from "react-icons/fa";

const AddOffer = ({ offerId: propId, onClose, onSuccess }) => {
  const { id: paramId } = useParams();
  const id = propId || paramId;
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [productsList, setProductsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  
  const [searchProd, setSearchProd] = useState("");
  const [searchCat, setSearchCat] = useState("");

  const [form, setForm] = useState({
    name: "",
    type: "Percentage Discount",
    discountValue: "",
    applicableOn: "All Products",
    products: [],
    categories: [],
    startDate: "",
    endDate: "",
    status: "Active"
  });

  useEffect(() => {
    fetchDependencies();
    if (isEditMode) {
      fetchOfferDetails();
    }
  }, [id]);

  const fetchDependencies = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        API.get("/products"),
        API.get("/categories")
      ]);
      setProductsList(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.products || []);
      setCategoriesList(Array.isArray(catRes.data) ? catRes.data : catRes.data?.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOfferDetails = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/offers/${id}`);
      setForm({
        ...data,
        products: data.products?.map(p => p._id || p) || [],
        categories: data.categories || [],
        discountValue: data.discountValue || "",
        startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : "",
        endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : "",
      });
    } catch (err) {
      toast.error("Failed to fetch offer details");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === "applicableOn") {
        if (value === "All Products") {
          updated.products = [];
          updated.categories = [];
        } else if (value === "Specific Products") {
          updated.categories = [];
        } else if (value === "Categories") {
          updated.products = [];
        }
      }
      return updated;
    });
  };

  const toggleProduct = (productId) => {
    setForm(prev => ({
      ...prev,
      products: prev.products.includes(productId) 
        ? prev.products.filter(id => id !== productId)
        : [...prev.products, productId]
    }));
  };

  const toggleCategory = (catName) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(catName)
        ? prev.categories.filter(name => name !== catName)
        : [...prev.categories, catName]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate || !form.discountValue) {
      toast.warning("Please fill out required fields.");
      return;
    }

    if (form.applicableOn === "Specific Products") {
      if (!form.products || form.products.length === 0) {
        toast.warning("Please select at least one product.");
        return;
      }
    }
    
    if (form.applicableOn === "Categories") {
      if (!form.categories || form.categories.length === 0) {
        toast.warning("Please select at least one category.");
        return;
      }
    }

    setLoading(true);
    
    // Clean payload
    const payload = { ...form };
    if (payload.applicableOn !== "Specific Products") payload.products = [];
    if (payload.applicableOn !== "Categories") payload.categories = [];

    try {
      if (isEditMode) {
        await API.put(`/offers/${id}`, payload);
        toast.success("Offer updated successfully");
      } else {
        await API.post("/offers", payload);
        toast.success("Offer created successfully");
      }
      if (onSuccess) onSuccess();
      else navigate("/admin/offers");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save offer");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = productsList.filter(p => p.name.toLowerCase().includes(searchProd.toLowerCase()));
  const filteredCategories = categoriesList.filter(c => c.name.toLowerCase().includes(searchCat.toLowerCase()));

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-300">
      
      {/* Modal Card */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-white">
          <h1 className="text-xl font-bold text-slate-800 m-0">
            {isEditMode ? 'Edit Offer' : 'Create Offer'}
          </h1>
          <button 
            type="button"
            onClick={() => { if (onClose) onClose(); else navigate(-1); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
          <form id="simpleOfferForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Offer Name */}
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">Offer Name *</label>
              <input 
                type="text" name="name" value={form.name} onChange={handleInputChange} required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium text-slate-800"
                placeholder="Enter offer name (e.g., Diwali Sale)"
              />
            </div>

            {/* Offer Type & Discount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">Offer Type *</label>
                <select 
                  name="type" value={form.type} onChange={handleInputChange} required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium text-slate-800 cursor-pointer"
                >
                  <option value="Percentage Discount">Percentage Discount</option>
                  <option value="Flat Discount">Flat Discount</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">
                  Discount Value * {form.type === 'Percentage Discount' ? '(%)' : '(₹)'}
                </label>
                <input 
                  type="number" name="discountValue" value={form.discountValue} onChange={handleInputChange} required min="0" step="0.01"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium text-slate-800"
                  placeholder={form.type === 'Percentage Discount' ? "e.g. 10" : "e.g. 500"}
                />
              </div>
            </div>

            {/* Apply To */}
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">Apply To *</label>
              <select 
                name="applicableOn" value={form.applicableOn} onChange={handleInputChange} required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium text-slate-800 cursor-pointer"
              >
                <option value="All Products">All Products</option>
                <option value="Specific Products">Specific Products</option>
                <option value="Categories">Categories</option>
              </select>
            </div>

            {/* Selection (Products/Categories) */}
            {form.applicableOn === "Specific Products" && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                <label className="text-xs font-bold text-slate-600 block mb-3">Select Products *</label>
                <div className="relative mb-3">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                  <input 
                    type="text" placeholder="Search products..." value={searchProd} onChange={e => setSearchProd(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="bg-white border border-slate-200 rounded-xl max-h-[160px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {filteredProducts.map(p => (
                    <label key={p._id} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                      <input 
                        type="checkbox" 
                        checked={form.products.includes(p._id)}
                        onChange={() => toggleProduct(p._id)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                      />
                      <span className="text-sm font-semibold text-slate-700 select-none truncate">{p.name}</span>
                    </label>
                  ))}
                  {filteredProducts.length === 0 && <p className="text-xs text-slate-500 p-2">No products found.</p>}
                </div>
              </div>
            )}

            {form.applicableOn === "Categories" && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                <label className="text-xs font-bold text-slate-600 block mb-3">Select Categories *</label>
                <div className="relative mb-3">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                  <input 
                    type="text" placeholder="Search categories..." value={searchCat} onChange={e => setSearchCat(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="bg-white border border-slate-200 rounded-xl max-h-[160px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {filteredCategories.map(c => (
                    <label key={c.name} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                      <input 
                        type="checkbox" 
                        checked={form.categories.includes(c.name)}
                        onChange={() => toggleCategory(c.name)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                      />
                      <span className="text-sm font-semibold text-slate-700 select-none truncate">{c.name}</span>
                    </label>
                  ))}
                  {filteredCategories.length === 0 && <p className="text-xs text-slate-500 p-2">No categories found.</p>}
                </div>
              </div>
            )}

            {/* Dates & Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">Start Date *</label>
                <input 
                  type="date" name="startDate" value={form.startDate} onChange={handleInputChange} required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">End Date *</label>
                <input 
                  type="date" name="endDate" value={form.endDate} onChange={handleInputChange} required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">Status *</label>
                <select 
                  name="status" value={form.status} onChange={handleInputChange} required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium text-slate-800 cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Offer Preview Section */}
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mt-6 animate-in fade-in">
              <h3 className="text-sm font-bold text-indigo-900 mb-3">Offer Preview</h3>
              <div className="p-4 bg-white border border-indigo-100 rounded-lg shadow-sm">
                <p className="text-lg font-bold text-indigo-700 mb-1">
                  🎉 {form.name || "Offer Name"}
                </p>
                <p className="text-sm text-slate-700 mb-2 font-medium">
                  Get {form.discountValue || "0"}{form.type === 'Percentage Discount' ? '% OFF' : '₹ OFF'} on {form.applicableOn.toLowerCase()}.
                </p>
                <p className="text-xs text-slate-500 mb-1">
                  Offer Valid From: {form.startDate ? new Date(form.startDate).toLocaleDateString('en-GB').replace(/\//g, '-') : "DD-MM-YYYY"} to {form.endDate ? new Date(form.endDate).toLocaleDateString('en-GB').replace(/\//g, '-') : "DD-MM-YYYY"}.
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  Status: <span className={form.status === 'Active' ? 'text-emerald-600' : 'text-slate-600'}>{form.status}</span>
                </p>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-3">
          <button 
            type="button" 
            onClick={() => { if (onClose) onClose(); else navigate(-1); }} 
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          
          <button 
            form="simpleOfferForm"
            type="submit"
            disabled={loading}
            className="px-8 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all disabled:opacity-70 flex items-center justify-center min-w-[140px]"
          >
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isEditMode ? 'Save Changes' : 'Create Offer')}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default AddOffer;
