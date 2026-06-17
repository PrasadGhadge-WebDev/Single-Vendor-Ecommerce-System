import React, { useState, useEffect, useContext, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FaPlus, FaSearch, FaChevronDown, FaEdit, FaTrash, FaFileCsv, FaSync, FaLayerGroup, FaTags, FaBoxOpen, FaCheckCircle, FaTimesCircle, FaCheckSquare, FaSquare, FaTimes } from "react-icons/fa";
import API, { getImageUrl } from "../../api";
import { AuthContext } from "../../context/AuthContext";
import { downloadCsv } from "../../utils/adminHelpers";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";
import CategoryFormModal from "../../components/CategoryFormModal";
import ConfirmModal from "../../components/ConfirmModal";

const CATEGORIES_PER_PAGE = 10;

const ManageCategories = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modals
  const showModal = searchParams.get("modal") === "category";
  const editingId = searchParams.get("id");
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryPage, setCategoryPage] = useState(1);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, categoryId: null });

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("");

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/categories");
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load categories.");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setSearchParams({ modal: "category" });
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setSearchParams({ modal: "category", id: cat._id });
  };

  const resetModal = () => {
    setSearchParams({});
    setEditingCategory(null);
  };

  useEffect(() => {
    if (showModal && editingId && !editingCategory && categories.length > 0) {
      const cat = categories.find(c => c._id === editingId);
      if (cat) setEditingCategory(cat);
    }
  }, [showModal, editingId, editingCategory, categories]);

  const deleteCategory = (id) => {
    if (!user?.isAdmin) return toast.warning("Admin only");
    setConfirmConfig({ isOpen: true, categoryId: id });
  };

  const handleConfirmDelete = async () => {
    const id = confirmConfig.categoryId;
    if (!id) return;
    try {
      await API.delete(`/categories/${id}`);
      fetchCategories();
      toast.success("Category deleted");
      setSelectedIds(selectedIds.filter(selId => selId !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setConfirmConfig({ isOpen: false, categoryId: null });
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return;
    try {
      await API.post('/categories/bulk-action', { action: bulkAction, categoryIds: selectedIds });
      toast.success(`Bulk ${bulkAction} successful`);
      setSelectedIds([]);
      setBulkAction("");
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Bulk action failed");
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedCategories.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedCategories.map(c => c._id));
    }
  };

  // KPIs
  const kpis = useMemo(() => {
    let total = categories.length;
    let active = categories.filter(c => c.status === 'active').length;
    let inactive = total - active;
    let totalProducts = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);
    return { total, active, inactive, totalProducts };
  }, [categories]);

  // Filtering
  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    return categories.filter((category) => {
      if (statusFilter !== "all" && category.status !== statusFilter) return false;
      if (!term) return true;
      return String(category.name || "").toLowerCase().includes(term) || String(category.slug || "").toLowerCase().includes(term);
    });
  }, [categories, search, statusFilter]);

  useEffect(() => {
    setCategoryPage(1);
    setSelectedIds([]); // reset selection on filter change
  }, [search, statusFilter]);

  const totalCategoryPages = Math.max(1, Math.ceil(filteredCategories.length / CATEGORIES_PER_PAGE));
  const paginatedCategories = useMemo(() => {
    const startIndex = (categoryPage - 1) * CATEGORIES_PER_PAGE;
    return filteredCategories.slice(startIndex, startIndex + CATEGORIES_PER_PAGE);
  }, [filteredCategories, categoryPage]);

  const exportCategories = () => {
    downloadCsv(
      "categories_export.csv",
      filteredCategories.map((c) => ({
        "Name": c.name,
        "Slug": c.slug,
        "Products": c.productCount || 0,
        "Status": c.status,
        "Created On": c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "N/A",
      }))
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-8" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0">Categories</h1>
          <p className="text-sm text-gray-500 m-0 mt-1">CREATE, ORGANIZE, AND MANAGE PRODUCT CATEGORIES FOR YOUR ONLINE STORE</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportCategories} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition font-semibold text-sm flex items-center gap-2">
            <FaFileCsv /> Export
          </button>
          <button onClick={fetchCategories} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition font-semibold text-sm flex items-center gap-2">
            <FaSync className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={openAddModal} className="px-4 py-2 bg-[#5B3DF5] text-white rounded-lg hover:bg-[#4a2ee0] shadow-md transition font-semibold text-sm flex items-center gap-2">
            <FaPlus /> Add Category
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 text-xl"><FaLayerGroup /></div>
          <p className="text-2xl font-black text-gray-900 leading-none mb-1">{kpis.total}</p>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Categories</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3 text-xl"><FaCheckCircle /></div>
          <p className="text-2xl font-black text-gray-900 leading-none mb-1">{kpis.active}</p>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3 text-xl"><FaTimesCircle /></div>
          <p className="text-2xl font-black text-gray-900 leading-none mb-1">{kpis.inactive}</p>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Inactive</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-3 text-xl"><FaBoxOpen /></div>
          <p className="text-2xl font-black text-gray-900 leading-none mb-1">{kpis.totalProducts}</p>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Products Assigned</p>
        </div>
      </div>

      {/* Bulk Actions & Filters */}
      <div className="bg-white py-2 px-3 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap lg:flex-nowrap gap-3 items-center w-full">
        {selectedIds.length > 0 ? (
          <div className="flex items-center gap-4 w-full bg-indigo-50 px-4 py-1.5 rounded-lg border border-indigo-100">
            <span className="text-sm font-bold text-indigo-700">{selectedIds.length} selected</span>
            <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className="py-1 px-2 border border-indigo-200 rounded outline-none text-xs font-medium bg-white text-indigo-700">
              <option value="">Choose action...</option>
              <option value="activate">Activate</option>
              <option value="deactivate">Deactivate</option>
              <option value="delete">Delete</option>
            </select>
            <button onClick={handleBulkAction} className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700">Apply</button>
            <button onClick={() => setSelectedIds([])} className="ml-auto text-xs font-bold text-indigo-400 hover:text-indigo-600">Cancel</button>
          </div>
        ) : (
          <>
            <div className="flex-[2] min-w-[200px] relative">
              <input 
                type="text" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Search by all columns..." 
                className="w-full pl-3 pr-8 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5B3DF5] outline-none text-xs font-medium"
              />
              <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="py-1.5 px-2 border border-gray-200 rounded-lg outline-none text-xs font-medium text-gray-700 bg-white flex-1 min-w-[110px]">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {(search || statusFilter !== 'all') && (
              <button 
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ml-auto"
              >
                Reset
              </button>
            )}
          </>
        )}
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="py-4 px-4 w-10">
                  <button onClick={toggleSelectAll} className="text-gray-400 hover:text-indigo-600 text-lg">
                    {paginatedCategories.length > 0 && selectedIds.length === paginatedCategories.length ? <FaCheckSquare className="text-indigo-600" /> : <FaSquare />}
                  </button>
                </th>
                <th className="py-4 px-4 font-semibold">Image</th>
                <th className="py-4 px-4 font-semibold">Category Info</th>
                <th className="py-4 px-4 font-semibold text-center">Products</th>
                <th className="py-4 px-4 font-semibold text-center">Status</th>
                <th className="py-4 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-12 text-gray-400 font-medium">Loading categories...</td></tr>
              ) : paginatedCategories.length > 0 ? paginatedCategories.map((category) => (
                <tr key={category._id} className={`transition-colors ${selectedIds.includes(category._id) ? 'bg-indigo-50/30' : 'hover:bg-gray-50/50'}`}>
                  <td className="py-3 px-4">
                     <button onClick={() => toggleSelection(category._id)} className="text-gray-400 hover:text-indigo-600 text-lg">
                      {selectedIds.includes(category._id) ? <FaCheckSquare className="text-indigo-600" /> : <FaSquare />}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                      {category.image ? <img src={getImageUrl(category.image)} alt="" className="w-full h-full object-cover" /> : <FaLayerGroup className="text-gray-300" />}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm font-bold text-gray-900">{category.name}</p>
                    <p className="text-xs text-gray-500">/{category.slug || category.name}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-sm font-black text-gray-700">{category.productCount || 0}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${category.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {category.status || 'active'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">

                      <button onClick={() => openEditModal(category)} className="p-2 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-lg transition" title="Edit">
                        <FaEdit size={12} />
                      </button>
                      <button onClick={() => deleteCategory(category._id)} className="p-2 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition" title="Delete">
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <FaLayerGroup className="mx-auto text-5xl text-gray-200 mb-4" />
                    <p className="text-lg font-bold text-gray-900 mb-1">No Categories Found</p>
                    <p className="text-sm text-gray-500 mb-4">Start organizing your store by creating your first category.</p>
                    <button onClick={openAddModal} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 inline-flex items-center gap-2">
                      <FaPlus /> Add Category
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6">
        <Pagination currentPage={categoryPage} totalPages={totalCategoryPages} onPageChange={setCategoryPage} />
      </div>

      <CategoryFormModal 
        isOpen={showModal}
        onClose={resetModal}
        initialData={editingCategory}
        onSuccess={fetchCategories}
        categories={categories}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, categoryId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Category?"
        message="This action cannot be undone. Products assigned to this category will become uncategorized. Subcategories will be detached."
        confirmText="Delete Category"
      />
    </div>
  );
};

export default ManageCategories;
