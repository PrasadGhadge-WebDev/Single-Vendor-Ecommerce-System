import React, { useState, useContext, useEffect } from "react";
import API from "../../api";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { FaPlus, FaBox, FaTag, FaLayerGroup, FaWarehouse, FaUserTie, FaFileUpload, FaArrowLeft, FaCheckCircle, FaExclamationCircle, FaRupeeSign } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AddProduct = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    subCategory: "",
    newCategory: "",
    stock: "",
    supplier: "",
  });

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showSupplierList, setShowSupplierList] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await API.get("/categories");
        const cats = data.categories || data;
        if (Array.isArray(cats)) {
          const apiCategories = cats
            .map((c) => ({
              name: c.name || c.title || c.category || c,
              subCategories: Array.isArray(c.subCategories) ? c.subCategories : [],
            }))
            .filter((c) => c.name);
          setCategories(apiCategories);
        }
      } catch (err) {
        console.error("Unable to fetch categories", err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const { data } = await API.get("/suppliers");
        setSuppliers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Unable to fetch suppliers", err);
      }
    };
    loadSuppliers();
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !user.token) {
      toast.warning("Authorization required");
      return;
    }

    const formData = new FormData();
    const finalCategory = form.newCategory.trim() || form.category;
    
    Object.keys(form).forEach((key) => {
      if (key === "newCategory") return;
      if (key === "category") {
        formData.append("category", finalCategory);
        return;
      }
      if (key === "subCategory") {
        formData.append("subCategory", form.newCategory.trim() ? "" : form.subCategory);
        return;
      }
      formData.append(key, form[key]);
    });
    
    if (images.length > 0) {
      formData.append("image", images[0]); // Primary thumbnail
      images.forEach((img) => formData.append("images", img));
    }

    setLoading(true);
    try {
      await API.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("Product indexed in catalog");
      window.dispatchEvent(new Event('products-updated'));
      navigate("/admin/products");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to index product");
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find((cat) => cat.name === form.category);
  const availableSubCategories = form.newCategory.trim()
    ? []
    : selectedCategory?.subCategories || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* V3 Premium Module Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 relative">
        <div className="relative group">
          <div className="absolute -left-8 -top-8 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="flex items-start gap-4 relative">
            <button 
              onClick={() => navigate(-1)}
              className="mt-1 w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all hover:border-indigo-500/30"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <FaArrowLeft size={14} />
            </button>
            <div>
              <h1 className="text-4xl font-black tracking-tight flex items-center gap-3" style={{ color: 'var(--page-text)' }}>
                New Product
                <span className="text-[10px] uppercase tracking-[0.3em] font-black px-2 py-1 bg-indigo-500/10 text-indigo-600 rounded-lg ml-2">
                  Inventory
                </span>
              </h1>
              <p className="text-sm font-bold opacity-40 uppercase tracking-[0.1em] mt-1.5">
                Registering strategic assets into the global enterprise catalog
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/60 rounded-[2.5rem] border shadow-2xl overflow-hidden relative" style={{ borderColor: 'var(--border-color)' }}>
        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left Column: Visual Assets */}
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Product Media Showcase</label>
                <div 
                  className="relative group border-2 border-dashed border-indigo-500/20 rounded-3xl p-10 flex flex-col items-center justify-center bg-indigo-50/30 dark:bg-indigo-500/5 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-all cursor-pointer shadow-inner"
                  onClick={() => document.getElementById('imageInput').click()}
                >
                  <input 
                    id="imageInput"
                    type="file" 
                    multiple
                    onChange={handleImageChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <FaFileUpload className="text-indigo-500/40 mb-4 animate-bounce" size={40} />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Click to upload multiple detailed views</p>
                  <p className="text-[10px] uppercase tracking-widest opacity-40 mt-1">High resolution JPG/PNG preferred</p>
                </div>

                {/* Multi-Image Preview Grid */}
                {previews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {previews.map((src, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden shadow-xl group border-4 border-white dark:border-slate-800">
                        <img src={src} className="w-full h-full object-cover" alt="Preview" />
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110 active:scale-90"
                        >
                          <FaTimes size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 space-y-4">
                <div className="flex items-center gap-3 text-indigo-600">
                  <FaExclamationCircle size={14} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Metadata Requirements</p>
                </div>
                <ul className="space-y-2 text-[10px] font-bold opacity-60 list-disc list-inside">
                  <li>Minimum description of 20 characters</li>
                  <li>Positive integer required for stock count</li>
                  <li>Category classification is mandatory</li>
                </ul>
              </div>
            </div>

            {/* Right Column: Attribute Ingress */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Product Designation</label>
                <div className="relative">
                  <FaTag className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500/30" size={12} />
                  <input 
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none"
                    placeholder="Global Identifier Name..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Economic Valuation (INR)</label>
                <div className="relative">
                  <FaRupeeSign className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500/30" size={12} />
                  <input 
                    type="number"
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none"
                    placeholder="0.00"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Classification</label>
                  <div className="relative">
                    <FaLayerGroup className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500/30" size={12} />
                    <select 
                      className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-xs font-bold outline-none appearance-none cursor-pointer"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value, subCategory: "", newCategory: "" })}
                    >
                      <option value="">Legacy Class</option>
                      {categories.map((cat) => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Stock Reserve</label>
                  <div className="relative">
                    <FaWarehouse className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500/30" size={12} />
                    <input 
                      type="number"
                      className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-xs font-bold outline-none"
                      placeholder="Units"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 relative">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Strategic Sourcing Partner</label>
                <div className="relative group">
                  <FaUserTie className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500/30 group-focus-within:text-indigo-600 transition-colors" size={12} />
                  <input 
                    type="text"
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-xs font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none"
                    placeholder="Search supplier..."
                    value={supplierSearch}
                    onChange={(e) => {
                      setSupplierSearch(e.target.value);
                      setShowSupplierList(true);
                      if (!e.target.value) {
                        setForm({ ...form, supplier: "" });
                      }
                    }}
                    onFocus={() => setShowSupplierList(true)}
                  />

                  {showSupplierList && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowSupplierList(false)} />
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl shadow-2xl z-50 max-h-[250px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-2 space-y-1">
                          {suppliers.filter(s => 
                            s.name?.toLowerCase().includes(supplierSearch.toLowerCase()) || 
                            s.company?.toLowerCase().includes(supplierSearch.toLowerCase())
                          ).length > 0 ? (
                            suppliers.filter(s => 
                              s.name?.toLowerCase().includes(supplierSearch.toLowerCase()) || 
                              s.company?.toLowerCase().includes(supplierSearch.toLowerCase())
                            ).map((s) => (
                              <button
                                key={s._id}
                                type="button"
                                onClick={() => {
                                  setForm({ ...form, supplier: s._id });
                                  setSupplierSearch(s.name || "");
                                  setShowSupplierList(false);
                                }}
                                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 text-left transition-all group"
                              >
                                <div>
                                  <p className="text-[11px] font-black group-hover:text-indigo-600 transition-colors" style={{ color: 'var(--page-text)' }}>{s.name}</p>
                                  <p className="text-[9px] font-bold opacity-30 uppercase tracking-widest">{s.company || 'Direct Partner'}</p>
                                </div>
                                {form.supplier === s._id && (
                                  <FaCheckCircle className="text-indigo-600" size={10} />
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="p-8 text-center">
                              <FaUserTie className="mx-auto text-slate-200 mb-2" size={24} />
                              <p className="text-[10px] font-black opacity-20 uppercase tracking-widest">No matching partners</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Technical Description</label>
                <textarea 
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none min-h-[120px]"
                  placeholder="Detailed product specifications and market proposition..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
            <button 
              type="button" 
              onClick={() => navigate(-1)}
              className="px-10 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-sm font-black uppercase tracking-widest active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-12 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3"
            >
              {loading ? "PROCESSING..." : (
                <>
                  <FaCheckCircle size={14} />
                  <span>COMMENCE INDEXING</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddProduct;
