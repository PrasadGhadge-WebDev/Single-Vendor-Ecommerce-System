import React, { useState, useEffect, useContext, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { FaPlus, FaSearch, FaChevronDown, FaEdit, FaTrash, FaFileCsv, FaSync, FaLayerGroup, FaTags, FaBoxOpen } from "react-icons/fa";
import API, { getImageUrl } from "../../api";
import { AuthContext } from "../../context/AuthContext";
import { downloadCsv, inDateRange } from "../../utils/adminHelpers";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";
import CategoryFormModal from "../../components/CategoryFormModal";
import ConfirmModal from "../../components/ConfirmModal";

const CATEGORIES_PER_PAGE = 8;

const ManageCategories = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const showModal = searchParams.get("modal") === "category";
  const editingId = searchParams.get("id");
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryPage, setCategoryPage] = useState(1);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, categoryId: null });

  const fetchCategories = async () => {
    try {
      const { data } = await API.get("/categories");
      const list = Array.isArray(data) ? data : data.categories || [];
      setCategories(list);
    } catch (err) {
      console.error(err);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = setInterval(() => fetchCategories(), 30000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  const deleteCategory = (id) => {
    if (!id) {
      toast.error("Invalid category ID");
      return;
    }
    if (!user?.isAdmin) return toast.warning("Admin only");
    setConfirmConfig({ isOpen: true, categoryId: id });
  };

  const handleConfirmDelete = async () => {
    const id = confirmConfig.categoryId;
    if (!id) return;

    try {
      await API.delete(`/categories/${id}`);
      fetchCategories();
      toast.success("Category removed from system");
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

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

  // Sync editingCategory if URL has ID but state doesn't
  useEffect(() => {
    if (showModal && editingId && !editingCategory && categories.length > 0) {
      const cat = categories.find(c => c._id === editingId);
      if (cat) setEditingCategory(cat);
    }
  }, [showModal, editingId, editingCategory, categories]);

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    return categories.filter((category) => {
      // Smart Date Range Filtering
      if (dateRange !== "all") {
        const entryDate = new Date(category.createdAt);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (dateRange === "today") {
          if (entryDate < startOfToday) return false;
        } else if (dateRange === "7days") {
          const sevenDaysAgo = new Date(startOfToday);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          if (entryDate < sevenDaysAgo) return false;
        } else if (dateRange === "custom") {
          if ((dateFrom || dateTo) && !inDateRange(category.createdAt, dateFrom, dateTo)) return false;
        }
      }

      if (!term) return true;
      return String(category.name || "")
        .toLowerCase()
        .includes(term);
    });
  }, [categories, search, dateRange, dateFrom, dateTo]);

  useEffect(() => {
    setCategoryPage(1);
  }, [search, dateRange, dateFrom, dateTo]);

  const totalCategoryPages = Math.max(1, Math.ceil(filteredCategories.length / CATEGORIES_PER_PAGE));
  const paginatedCategories = useMemo(() => {
    const startIndex = (categoryPage - 1) * CATEGORIES_PER_PAGE;
    return filteredCategories.slice(startIndex, startIndex + CATEGORIES_PER_PAGE);
  }, [filteredCategories, categoryPage]);

  const exportCategories = () => {
    downloadCsv(
      "category_report.csv",
      filteredCategories.map((category) => ({
        "Category Name": category.name,
        "Sub-Categories": Array.isArray(category.subCategories) ? category.subCategories.join(" | ") : "N/A",
        "Created On": category.createdAt ? new Date(category.createdAt).toLocaleDateString() : "N/A",
      }))
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* V3 Premium Module Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 relative">
        <div className="relative group">
          <div className="absolute -left-8 -top-8 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-700" />
          <div className="flex items-start gap-4 relative">
            <div className="w-1.5 h-12 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full shadow-lg shadow-indigo-500/20" />
            <div>
              <h1 className="text-4xl font-black tracking-tight flex items-center gap-3" style={{ color: 'var(--page-text)' }}>
                Categories
                <span className="text-[10px] uppercase tracking-[0.3em] font-black px-2 py-1 bg-indigo-500/10 text-indigo-600 rounded-lg ml-2">
                  Taxonomy
                </span>
              </h1>
              <p className="text-sm font-bold opacity-40 uppercase tracking-[0.1em] mt-1.5">
                Strategic Catalog Classification & Hierarchy Management
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 group"
          >
            <FaPlus size={12} className="group-hover:rotate-90 transition-transform" />
            <span>Add Category</span>
          </button>
          <button 
            onClick={exportCategories}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border rounded-2xl hover:bg-slate-50 transition-all text-sm font-bold shadow-sm" 
            style={{ borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
          >
            <FaFileCsv size={12} className="text-indigo-600" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Suite */}
      <div className="p-4 bg-white dark:bg-slate-900/60 rounded-3xl border shadow-xl shadow-indigo-500/5 flex flex-col xl:flex-row gap-4 items-center" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex-grow w-full relative">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <FaSearch className="text-indigo-500/40" size={14} />
          </div>
          <input
            type="text"
            placeholder="Search categories or sub-categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-6 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500/30 transition-all outline-none"
            style={{ paddingLeft: '52px', color: 'var(--page-text)' }}
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full xl:w-auto shrink-0">
          <div className="relative">
            <select 
              className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-xs font-bold opacity-70 hover:opacity-100 transition-all outline-none appearance-none cursor-pointer"
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="all">Creation Date</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
          </div>

          <button 
            onClick={() => {
              setSearch("");
              setDateRange("all");
              fetchCategories();
            }}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Professional High-Density Data Grid */}
      <div className="bg-white dark:bg-slate-900/60 rounded-3xl border shadow-xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <th className="w-[12%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Asset</th>
                <th className="w-[28%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Classification</th>
                <th className="w-[40%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Sub-Categories</th>
                <th className="w-[20%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800" style={{ borderColor: 'var(--border-color)' }}>
              {paginatedCategories.map((category, idx) => (
                <tr 
                  key={category._id || idx} 
                  className={`group transition-all duration-200 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/30 dark:bg-slate-800/20'} hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5`}
                >
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl border bg-slate-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center shadow-sm">
                      {category.image ? (
                        <img src={getImageUrl(category.image)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <FaLayerGroup className="text-slate-200" size={18} />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                    <div className="truncate">
                      <p className="font-bold text-base truncate" style={{ color: 'var(--page-text)' }}>{category.name}</p>
                      <p className="text-[9px] font-bold opacity-30 uppercase tracking-widest truncate mt-0.5">Primary Taxonomy</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                    <div className="flex flex-wrap gap-1.5 max-h-[60px] overflow-y-auto pr-2 custom-scrollbar">
                      {Array.isArray(category.subCategories) && category.subCategories.length > 0 ? (
                        category.subCategories.map((sub) => (
                          <span key={sub} className="inline-flex items-center px-2 py-0.5 bg-indigo-500/10 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-tighter">
                            {sub}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] font-bold opacity-20 uppercase">No Sub-categories</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => openEditModal(category)}
                        className="p-2.5 hover:bg-indigo-600 hover:text-white rounded-xl transition-all text-slate-400 shadow-sm"
                        title="Edit"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button 
                        onClick={() => deleteCategory(category._id)}
                        className="p-2.5 hover:bg-rose-600 hover:text-white rounded-xl transition-all text-slate-400 shadow-sm"
                        title="Delete"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={categoryPage} totalPages={totalCategoryPages} onPageChange={setCategoryPage} />

      <CategoryFormModal 
        isOpen={showModal}
        onClose={resetModal}
        initialData={editingCategory}
        onSuccess={fetchCategories}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, categoryId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? This will affect all linked products and cannot be undone."
        confirmText="Delete Category"
      />
    </div>
  );
};

export default ManageCategories;
