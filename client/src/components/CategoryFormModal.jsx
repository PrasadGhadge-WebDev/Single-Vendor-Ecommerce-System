import React, { useState, useEffect, useRef } from "react";
import { FaCloudUploadAlt, FaPlus, FaTimes, FaSpinner, FaCheckCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import BaseModal from "./BaseModal";
import API from "../api";

const CategoryFormModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialData = null 
}) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [subCategoryInput, setSubCategoryInput] = useState("");
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    image: null
  });

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          image: null
        });
        setSubCategories(initialData.subCategories || []);
        setPreview(null);
      } else {
        resetForm();
      }
    }
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      image: null
    });
    setSubCategories([]);
    setPreview(null);
    setSubCategoryInput("");
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
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const addSubCategory = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      const value = subCategoryInput.trim();
      if (value) {
        if (!subCategories.includes(value)) {
          setSubCategories([...subCategories, value]);
        }
        setSubCategoryInput("");
      }
    }
  };

  const removeSubCategory = (index) => {
    setSubCategories(subCategories.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error("Please fill required fields");
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("subCategories", JSON.stringify(subCategories));
      if (formData.image) payload.append("image", formData.image);

      if (initialData) {
        await API.put(`/categories/${initialData._id}`, payload);
        toast.success("Category updated successfully!");
      } else {
        await API.post("/categories", payload);
        toast.success("Category created successfully!");
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
      title={initialData ? "Edit Category" : "Add New Category"} 
      size="md"
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
            {initialData ? "Update Category" : "Save Category"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-black mb-1.5 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
            Category Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g. Electronics"
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

        <div>
          <label className="block text-[10px] font-black mb-1.5 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
            Subcategories
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {subCategories.map((sub, idx) => (
              <span 
                key={idx} 
                className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-white text-[10px] font-black border shadow-sm"
                style={{ 
                  backgroundColor: 'var(--accent-color)', 
                  borderColor: 'var(--border-color)' 
                }}
              >
                {sub}
                <button type="button" onClick={() => removeSubCategory(idx)} className="hover:text-red-200">
                  <FaTimes size={10} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={subCategoryInput}
              onChange={(e) => setSubCategoryInput(e.target.value)}
              onKeyDown={addSubCategory}
              placeholder="Add subcategory..."
              className="flex-grow px-4 py-2.5 rounded-lg border outline-none font-medium shadow-sm"
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: 'var(--border-color)',
                color: 'var(--page-text)'
              }}
            />
            <button
              type="button"
              onClick={addSubCategory}
              className="px-4 py-2.5 text-white rounded-lg transition-all shadow active:scale-95 flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--accent-color)' }}
            >
              <FaPlus size={14} />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black mb-1.5 uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>
            Category Image
          </label>
          <div 
            onClick={() => fileInputRef.current.click()}
            className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group shadow-inner relative"
            style={{ 
              backgroundColor: 'var(--surface-2)', 
              borderColor: 'var(--border-color)' 
            }}
          >
            {preview ? (
              <div className="relative w-28 h-28 rounded-lg overflow-hidden shadow-lg border-2" style={{ borderColor: 'var(--surface-1)' }}>
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreview(null);
                    setFormData(prev => ({ ...prev, image: null }));
                  }}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-lg"
                >
                  <FaTimes size={10} />
                </button>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--surface-3)' }}>
                  <FaCloudUploadAlt size={20} style={{ color: 'var(--accent-color)' }} />
                </div>
                <p className="font-bold uppercase tracking-widest text-[10px]" style={{ color: 'var(--page-text)' }}>
                  {initialData && !formData.image ? "Replace Image" : "Upload Image"}
                </p>
                <p className="text-[9px] mt-1 font-bold" style={{ color: 'var(--page-text-muted)' }}>JPG, PNG, WEBP (MAX 5MB)</p>
              </>
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              onChange={handleImageChange}
              accept="image/*"
            />
          </div>
        </div>
      </form>
    </BaseModal>
  );
};

export default CategoryFormModal;
