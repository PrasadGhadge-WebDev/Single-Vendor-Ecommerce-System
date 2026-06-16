import React, { useState, useEffect, useContext } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import API, { getImageUrl } from "../../api";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { 
  FaSave, FaImage, FaBox, FaTags, 
  FaTrash, FaPlus, FaCheckCircle, FaTimes, FaCubes,
  FaArrowLeft, FaArrowRight
} from "react-icons/fa";

const CATEGORY_SPECS = {
  "Mobile Phones": ["Brand *", "Model", "Display", "Processor", "RAM", "Storage", "Rear Camera", "Front Camera", "Battery", "Operating System", "Connectivity (5G/4G)", "SIM Type", "Color"],
  "Laptops": ["Brand *", "Model", "Processor", "RAM", "Storage", "Display Size", "Display Type", "Graphics Card", "Operating System", "Battery Life", "Weight", "Color"],
  "Televisions": ["Brand *", "Model", "Screen Size", "Display Type", "Resolution", "Refresh Rate", "Smart TV (Yes/No)", "Operating System", "Audio Output", "HDMI Ports", "USB Ports", "Wi-Fi Support"]
};

const AddProduct = ({ productId: propId, onClose, onSuccess }) => {
  const { id: paramId } = useParams();
  const id = propId || paramId;
  const navigate = useNavigate();
  const isEditMode = !!id;
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // For edit mode

  const [form, setForm] = useState({
    name: "", slug: "", shortDescription: "", description: "", specifications: {},
    price: "", discountPrice: "", costPrice: "", taxClass: "GST 18%",
    category: "", subCategory: "", brand: "", supplier: "",
    sku: "", stock: "", stockStatus: "In Stock", lowStockAlert: 5,
    status: "Active", featured: false,
    variants: []
  });

  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
    if (isEditMode) {
      fetchProductDetails();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const { data } = await API.get("/categories");
      const list = Array.isArray(data) ? data : data?.categories || [];
      setCategories(list);
    } catch (err) { console.error(err); }
  };

  const fetchSuppliers = async () => {
    try {
      const { data } = await API.get("/suppliers");
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/products/${id}`);
      
      let parsedSpecs = {};
      if (data.specifications) {
        try {
          parsedSpecs = data.specifications.startsWith('{') ? JSON.parse(data.specifications) : { CustomFallback: data.specifications };
        } catch (e) {
          parsedSpecs = { CustomFallback: data.specifications };
        }
      }

      setForm({
        ...data,
        specifications: parsedSpecs,
        variants: data.variants || [],
        supplier: data.supplier?._id || data.supplier || ""
      });
      if (data.image) setExistingImages([data.image, ...(data.images || [])]);
    } catch (err) {
      toast.error("Failed to fetch product details");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSpecChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      specifications: {
        ...(typeof prev.specifications === 'object' ? prev.specifications : {}),
        [field]: value
      }
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index, isExisting = false) => {
    if (isExisting) {
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setImages(prev => prev.filter((_, i) => i !== index));
      setPreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  const moveImage = (index, direction, isExisting = false) => {
    if (isExisting) {
      if (direction === 'left' && index > 0) {
        setExistingImages(prev => {
          const arr = [...prev];
          [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
          return arr;
        });
      } else if (direction === 'right' && index < existingImages.length - 1) {
        setExistingImages(prev => {
          const arr = [...prev];
          [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
          return arr;
        });
      }
    } else {
      if (direction === 'left' && index > 0) {
        setImages(prev => {
          const arr = [...prev];
          [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
          return arr;
        });
        setPreviews(prev => {
          const arr = [...prev];
          [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
          return arr;
        });
      } else if (direction === 'right' && index < images.length - 1) {
        setImages(prev => {
          const arr = [...prev];
          [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
          return arr;
        });
        setPreviews(prev => {
          const arr = [...prev];
          [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
          return arr;
        });
      }
    }
  };

  const addVariant = () => {
    setForm(prev => ({
      ...prev,
      variants: [...prev.variants, { size: "", color: "", storage: "", ram: "", price: "", sku: "", stock: "" }]
    }));
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...form.variants];
    newVariants[index][field] = value;
    setForm(prev => ({ ...prev, variants: newVariants }));
  };

  const removeVariant = (index) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) {
      toast.warning("Please fill out required fields (Name, Price, Category)");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    
    // Append standard fields
    ['name', 'slug', 'shortDescription', 'price', 'discountPrice', 'costPrice', 
     'taxClass', 'category', 'subCategory', 'brand', 'supplier', 'stock', 
     'stockStatus', 'lowStockAlert', 'status'].forEach(key => {
      formData.append(key, form[key]);
    });

    formData.append('specifications', JSON.stringify(form.specifications));

    // Append JSON strings for nested objects
    formData.append('variants', JSON.stringify(form.variants));

    formData.append('existingImages', JSON.stringify(existingImages));

    // Append files
    if (images.length > 0) {
      if (existingImages.length === 0) {
        formData.append("image", images[0]); // First image as main
        images.slice(1).forEach(img => formData.append("images", img));
      } else {
        images.forEach(img => formData.append("images", img));
      }
    }

    try {
      if (isEditMode) {
        await API.put(`/products/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Product updated successfully");
      } else {
        await API.post("/products", formData, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Product created successfully");
      }
      if (onSuccess) onSuccess();
      else navigate("/admin/products");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = () => {
    const generated = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setForm(prev => ({ ...prev, slug: generated }));
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-300">
      
      {/* Modal Card */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100">
          <h1 className="text-xl font-black text-slate-900 m-0">
            {isEditMode ? 'Edit Product Details' : 'Onboard New Product'}
          </h1>
          <button 
            onClick={() => { if (onClose) onClose(); else navigate(-1); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-white custom-scrollbar">
          <form id="productForm" onSubmit={handleSubmit} className="space-y-8">
            
            {/* --- BASIC INFORMATION --- */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Basic Information</h2>
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Product Name *</label>
                  <input 
                    type="text" name="name" value={form.name} onChange={handleInputChange} required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium text-slate-700"
                    placeholder="Enter product name (e.g. iPhone 16 Pro)"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Category *</label>
                  <select 
                    name="category" value={form.category} onChange={handleInputChange} required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium text-slate-700 cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

              </div>
            </div>

            {/* --- PRICING --- */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Price (₹) *</label>
                  <input 
                    type="number" name="price" value={form.price} onChange={handleInputChange} required min="0" step="0.01"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium text-slate-700"
                    placeholder="Enter selling price (e.g. 99999)"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Stock Quantity *</label>
                  <input 
                    type="number" name="stock" value={form.stock} onChange={handleInputChange} required min="0"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium text-slate-700"
                    placeholder="Enter available stock (e.g. 50)"
                  />
                </div>
              </div>
            </div>

            {/* --- SPECIFICATIONS --- */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Specifications</h2>
              {CATEGORY_SPECS[form.category] ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {CATEGORY_SPECS[form.category].map(spec => {
                    const isRequired = spec.includes('*');
                    const labelName = spec.replace('*', '').trim();
                    const stateKey = labelName;
                    const val = typeof form.specifications === 'object' && form.specifications !== null ? (form.specifications[stateKey] || "") : "";
                    
                    const SPEC_DROPDOWNS = {
                      "RAM": ["4GB", "6GB", "8GB", "12GB", "16GB", "24GB", "32GB", "64GB"],
                      "Storage": ["64GB", "128GB", "256GB", "512GB", "1TB", "2TB"],
                      "Connectivity (5G/4G)": ["4G", "5G", "Wi-Fi Only"],
                      "SIM Type": ["Single SIM", "Dual SIM (Nano + Nano)", "Dual SIM (Nano + eSIM)", "eSIM Only"],
                      // Television Specs
                      "Brand": ["Samsung", "LG", "Sony", "TCL", "Panasonic", "Hisense", "Vu", "Xiaomi"],
                      "Screen Size": ["32 inch", "40 inch", "43 inch", "50 inch", "55 inch", "65 inch", "75 inch", "85 inch"],
                      "Display Type": ["LED", "OLED", "QLED", "Mini-LED", "Micro-LED"],
                      "Resolution": ["720p HD", "1080p Full HD", "4K UHD", "8K UHD"],
                      "Refresh Rate": ["60Hz", "120Hz", "144Hz", "240Hz"],
                      "Smart TV (Yes/No)": ["Yes", "No"],
                      "Operating System": ["Android TV", "Google TV", "WebOS", "Tizen", "Roku TV", "Fire TV"],
                      "Audio Output": ["10W", "20W", "30W", "40W", "60W", "Dolby Atmos Supported"],
                      "HDMI Ports": ["1", "2", "3", "4"],
                      "USB Ports": ["1", "2", "3"],
                      "Wi-Fi Support": ["Yes", "No", "Wi-Fi 5", "Wi-Fi 6", "Wi-Fi 6E"]
                    };

                    const options = SPEC_DROPDOWNS[stateKey];

                    return (
                      <div key={stateKey}>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">{labelName} {isRequired && '*'}</label>
                        <input 
                          type="text" 
                          list={options ? `datalist-${stateKey}` : undefined}
                          value={val} 
                          onChange={(e) => handleSpecChange(stateKey, e.target.value)} 
                          required={isRequired}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium text-slate-700"
                          placeholder={`Enter or select ${labelName.toLowerCase()}`}
                        />
                        {options && (
                          <datalist id={`datalist-${stateKey}`}>
                            {options.map(opt => <option key={opt} value={opt} />)}
                          </datalist>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Technical Specifications</label>
                  <textarea 
                    value={typeof form.specifications === 'object' && form.specifications !== null ? (form.specifications.CustomFallback || "") : ""} 
                    onChange={(e) => handleSpecChange("CustomFallback", e.target.value)} 
                    rows="6"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium text-slate-700 font-mono"
                    placeholder="Display: 6.3-inch OLED&#10;Processor: A18 Pro&#10;RAM: 8GB&#10;Storage: 256GB&#10;Battery: 3582mAh&#10;OS: iOS 26"
                  />
                </div>
              )}
            </div>

            {/* --- MEDIA --- */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Product Images *</h2>
              <div 
                className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center bg-white hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => document.getElementById('imageUpload').click()}
              >
                <input id="imageUpload" type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center shadow-sm mb-3 text-indigo-500">
                  <FaImage />
                </div>
                <h3 className="text-sm font-bold text-slate-700">Click to upload images</h3>
                <p className="text-xs text-slate-400 mt-1">Accepted Formats: JPG, PNG, WEBP</p>
              </div>

              {/* Previews Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 mt-6">
                {existingImages.map((src, idx) => (
                  <div key={`exist-${src}`} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                    <img src={getImageUrl(src)} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    
                    {/* Always visible remove button */}
                    <button 
                      type="button" 
                      onClick={() => removeImage(idx, true)} 
                      className="absolute top-1 right-1 p-1.5 bg-rose-500 text-white rounded-full shadow-md hover:bg-rose-600 transition-all z-10"
                      title="Remove image"
                    >
                      <FaTimes size={10} />
                    </button>
                    
                    {/* Always visible move buttons */}
                    <div className="absolute bottom-1 left-1 right-1 flex justify-between z-10">
                      <button 
                        type="button" 
                        onClick={() => moveImage(idx, 'left', true)}
                        disabled={idx === 0}
                        className={`p-1.5 rounded-full shadow-md transition-all ${idx === 0 ? 'bg-white/50 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-slate-100 hover:scale-110'}`}
                        title="Move left"
                      >
                        <FaArrowLeft size={10} />
                      </button>
                      <div className="bg-slate-900/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm">
                        {idx + 1}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => moveImage(idx, 'right', true)} 
                        disabled={idx === existingImages.length - 1}
                        className={`p-1.5 rounded-full shadow-md transition-all ${idx === existingImages.length - 1 ? 'bg-white/50 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-slate-100 hover:scale-110'}`}
                        title="Move right"
                      >
                        <FaArrowRight size={10} />
                      </button>
                    </div>
                  </div>
                ))}
                {previews.map((src, idx) => (
                  <div key={`new-${src}`} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                    <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    
                    {/* Always visible remove button */}
                    <button 
                      type="button" 
                      onClick={() => removeImage(idx, false)} 
                      className="absolute top-1 right-1 p-1.5 bg-rose-500 text-white rounded-full shadow-md hover:bg-rose-600 transition-all z-10"
                      title="Remove image"
                    >
                      <FaTimes size={10} />
                    </button>
                    
                    {/* Always visible move buttons */}
                    <div className="absolute bottom-1 left-1 right-1 flex justify-between z-10">
                      <button 
                        type="button" 
                        onClick={() => moveImage(idx, 'left', false)}
                        disabled={idx === 0}
                        className={`p-1.5 rounded-full shadow-md transition-all ${idx === 0 ? 'bg-white/50 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-slate-100 hover:scale-110'}`}
                        title="Move left"
                      >
                        <FaArrowLeft size={10} />
                      </button>
                      <div className="bg-slate-900/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm">
                        {idx + 1}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => moveImage(idx, 'right', false)} 
                        disabled={idx === previews.length - 1}
                        className={`p-1.5 rounded-full shadow-md transition-all ${idx === previews.length - 1 ? 'bg-white/50 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-slate-100 hover:scale-110'}`}
                        title="Move right"
                      >
                        <FaArrowRight size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* --- STATUS --- */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Status</h2>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Product Status *</label>
                <select 
                  name="status" value={form.status} onChange={handleInputChange} required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium text-slate-700 cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-8 py-5 border-t border-slate-100 bg-slate-50/50">
          <button 
            type="button" 
            onClick={() => { if (onClose) onClose(); else navigate(-1); }} 
            className="px-8 py-3 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 uppercase tracking-wider hover:bg-slate-50 transition-all"
          >
            CANCEL
          </button>
          
          <button 
            form="productForm"
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl text-xs font-bold bg-blue-600 text-white uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all disabled:opacity-70"
          >
            {loading ? <span className="spinner-border spinner-border-sm" /> : <FaCheckCircle size={14} />}
            SAVE PRODUCT
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default AddProduct;
