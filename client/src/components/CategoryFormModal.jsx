import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaCloudUploadAlt, FaLayerGroup, FaGlobe, FaCogs, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import API, { getImageUrl } from "../api";
import { toast } from "react-toastify";

const CategoryFormModal = ({ isOpen, onClose, initialData, onSuccess, categories }) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parentCategory: "",
    status: "active",
    featured: false,
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    image: null,
    imagePreview: null,
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          slug: initialData.slug || "",
          description: initialData.description || "",
          parentCategory: initialData.parentCategory?._id || initialData.parentCategory || "",
          status: initialData.status || "active",
          featured: initialData.featured || false,
          metaTitle: initialData.seo?.metaTitle || "",
          metaDescription: initialData.seo?.metaDescription || "",
          metaKeywords: initialData.seo?.metaKeywords || "",
          image: null,
          imagePreview: initialData.image ? getImageUrl(initialData.image) : null,
        });
      } else {
        // Reset
        const searchParams = new URLSearchParams(window.location.search);
        const parentId = searchParams.get('parent');
        
        setFormData({
          name: "",
          slug: "",
          description: "",
          parentCategory: parentId || "",
          status: "active",
          featured: false,
          metaTitle: "",
          metaDescription: "",
          metaKeywords: "",
          image: null,
          imagePreview: null,
        });
      }
    }
  }, [isOpen, initialData]);

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug === "" || !initialData ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : prev.slug
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = new FormData();
      data.append("name", formData.name);
      data.append("slug", formData.slug);
      data.append("description", formData.description);
      data.append("parentCategory", formData.parentCategory);
      data.append("status", formData.status);
      data.append("featured", formData.featured);
      
      const seo = {
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        metaKeywords: formData.metaKeywords
      };
      data.append("seo", JSON.stringify(seo));

      if (formData.image) {
        data.append("image", formData.image);
      }

      if (initialData) {
        await API.put(`/categories/${initialData._id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Category updated successfully");
      } else {
        await API.post("/categories", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Category created successfully");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {initialData ? <FaCogs className="text-indigo-600" /> : <FaLayerGroup className="text-indigo-600" />}
            {initialData ? "Edit Category" : "Add New Category"}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <FaTimes />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            <form id="categoryForm" onSubmit={handleSubmit} className="space-y-8">
              
              {/* BASIC INFO SECTION */}
              <div>
                <h3 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Category Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleNameChange}
                      required
                      placeholder="e.g., Electronics"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Enter category description..."
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium text-sm"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* MEDIA SECTION */}
              <div>
                <h3 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">Category Image</h3>
                <div 
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 hover:border-indigo-300 transition-colors cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.imagePreview ? (
                    <div className="relative w-40 h-40">
                      <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl shadow-sm" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                        <span className="text-white text-xs font-bold">Replace Image</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FaCloudUploadAlt size={32} />
                      </div>
                      <p className="text-sm font-bold text-gray-700 mb-1">Click to upload image</p>
                      <p className="text-xs text-gray-400">SVG, PNG, JPG or GIF (Recommended 600x600px)</p>
                    </>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* DISPLAY SECTION */}
              <div>
                <h3 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">Status</h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="font-bold text-sm text-gray-900">Category Status</p>
                    <p className="text-xs text-gray-500">Determine if this category is visible to customers.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="status"
                      checked={formData.status === 'active'}
                      onChange={(e) => setFormData(prev => ({...prev, status: e.target.checked ? 'active' : 'inactive'}))}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    <span className="ml-3 text-xs font-bold uppercase text-gray-500 w-16">{formData.status}</span>
                  </label>
                </div>
              </div>

            </form>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="categoryForm"
            disabled={loading}
            className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors shadow-md flex items-center gap-2"
          >
            {loading ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : <FaCheckCircle />}
            Save Category
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default CategoryFormModal;
