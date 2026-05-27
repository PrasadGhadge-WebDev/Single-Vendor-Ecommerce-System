import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API, { getImageUrl } from "../../api";
import { downloadCsv, inDateRange } from "../../utils/adminHelpers";
import { FaPlus, FaSearch, FaChevronDown, FaEdit, FaTrash, FaFileCsv, FaSync, FaBoxOpen, FaTags, FaExclamationTriangle, FaBox } from "react-icons/fa";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";
import ProductFormModal from "../../components/ProductFormModal";
import ConfirmModal from "../../components/ConfirmModal";

const LOW_STOCK_THRESHOLD = 10;
const PRODUCTS_PER_PAGE = 12;

const ManageProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const showModal = searchParams.get("modal") === "product";
  const editingId = searchParams.get("id");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, productId: null });

  const fetchProducts = async (showLoader = false) => {
    try {
      const { data } = await API.get("/products");
      const list = Array.isArray(data) ? data : data.products || [];
      setProducts(list);
    } catch (error) {
      console.error("Error fetching products:", error);
      if (showLoader) toast.error("Failed to load products");
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data } = await API.get("/suppliers");
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await API.get("/categories");
      const list = Array.isArray(data) ? data : data?.categories || [];
      setCategories(
        Array.isArray(list)
          ? list
              .map((c) => ({
                name: c.name || c.title || c,
                subCategories: Array.isArray(c.subCategories) ? c.subCategories : [],
              }))
              .filter((c) => c.name)
          : []
      );
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const deleteProduct = (id) => {
    if (!id) {
      toast.error("Invalid product ID. Cannot perform deletion.");
      return;
    }
    setConfirmConfig({ isOpen: true, productId: id });
  };

  const handleConfirmDelete = async () => {
    const id = confirmConfig.productId;
    if (!id) return;
    
    try {
      await API.delete(`/products/${id}`);
      fetchProducts();
      window.dispatchEvent(new Event("products-updated"));
      toast.success("Product removed from inventory");
    } catch (error) {
      toast.error("Error deleting product: " + (error.response?.data?.message || error.message));
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setSearchParams({ modal: "product" });
  };

  const openEditModal = (product) => {
    if (!product._id) {
      toast.error("Invalid product reference. Cannot edit.");
      return;
    }
    setEditingProduct(product);
    setSearchParams({ modal: "product", id: product._id });
  };

  const resetModal = () => {
    setSearchParams({});
    setEditingProduct(null);
  };

  // Sync editingProduct if URL has ID but state doesn't (e.g. on refresh)
  useEffect(() => {
    if (showModal && editingId && !editingProduct && products.length > 0) {
      const product = products.find(p => p._id === editingId);
      if (product) setEditingProduct(product);
    }
  }, [showModal, editingId, editingProduct, products]);

  useEffect(() => {
    fetchProducts(true);
    fetchSuppliers();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = setInterval(() => fetchProducts(), 30000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  const categoryOptions = useMemo(
    () => Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort(),
    [products]
  );

  const lowStockCount = useMemo(
    () => products.filter((product) => Number(product.stock || 0) <= LOW_STOCK_THRESHOLD).length,
    [products]
  );

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const stockValue = Number(product.stock || 0);
      if (categoryFilter !== "all" && product.category !== categoryFilter) return false;
      if (stockFilter === "in-stock" && stockValue <= 0) return false;
      if (stockFilter === "out-of-stock" && stockValue > 0) return false;
      if (stockFilter === "low-stock" && stockValue > LOW_STOCK_THRESHOLD) return false;
      if (supplierFilter !== "all") {
        const currentSupplierId = product.supplier?._id || String(product.supplier || "");
        if (currentSupplierId !== supplierFilter) return false;
      }
      
      // Smart Date Range Filtering
      if (dateRange !== "all") {
        const entryDate = new Date(product.createdAt);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (dateRange === "today") {
          if (entryDate < startOfToday) return false;
        } else if (dateRange === "7days") {
          const sevenDaysAgo = new Date(startOfToday);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          if (entryDate < sevenDaysAgo) return false;
        } else if (dateRange === "custom") {
          if ((dateFrom || dateTo) && !inDateRange(product.createdAt, dateFrom, dateTo)) return false;
        }
      }

      if (!term) return true;
      const haystack = `${product.name} ${product.category} ${product.supplier?.name || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [products, search, categoryFilter, stockFilter, supplierFilter, dateRange, dateFrom, dateTo]);

  useEffect(() => {
    setProductPage(1);
  }, [search, categoryFilter, stockFilter, supplierFilter, dateRange, dateFrom, dateTo]);

  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const startIndex = (productPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [filteredProducts, productPage]);

  const exportProducts = () => {
    downloadCsv(
      "inventory_report.csv",
      filteredProducts.map((product) => ({
        "Product Name": product.name,
        "Category": product.category,
        "Unit Price": product.price,
        "Available Stock": product.stock,
        "Vendor": product.supplier?.name || "N/A",
        "Listed On": product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "N/A",
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
                Products
                <span className="text-[10px] uppercase tracking-[0.3em] font-black px-2 py-1 bg-indigo-500/10 text-indigo-600 rounded-lg ml-2">
                  Inventory
                </span>
              </h1>
              <p className="text-sm font-bold opacity-40 uppercase tracking-[0.1em] mt-1.5">
                Comprehensive SKU Catalog & Real-time Stock Monitoring
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
            <span>Add Product</span>
          </button>
          <button 
            onClick={exportProducts}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border rounded-2xl hover:bg-slate-50 transition-all text-sm font-bold shadow-sm" 
            style={{ borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
          >
            <FaFileCsv size={12} className="text-indigo-600" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl animate-in slide-in-from-top-4 duration-500">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
            <FaExclamationTriangle size={18} />
          </div>
          <div>
            <p className="text-xs font-black text-rose-600 uppercase tracking-widest">Inventory Alert</p>
            <p className="text-sm font-bold opacity-70">Critical Stock: {lowStockCount} items require immediate procurement.</p>
          </div>
        </div>
      )}

      {/* Advanced Filter Suite */}
      <div className="p-4 bg-white dark:bg-slate-900/60 rounded-3xl border shadow-xl shadow-indigo-500/5 flex flex-col xl:flex-row gap-4 items-center" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex-grow w-full relative">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <FaSearch className="text-indigo-500/40" size={14} />
          </div>
          <input
            type="text"
            placeholder="Search catalog, category or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-6 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500/30 transition-all outline-none"
            style={{ paddingLeft: '52px', color: 'var(--page-text)' }}
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full xl:w-auto shrink-0">
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
            >
              <option value="all">Category</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
          </div>

          <div className="relative">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
            >
              <option value="all">Stock Level</option>
              <option value="in-stock">Available</option>
              <option value="out-of-stock">Depleted</option>
              <option value="low-stock">Low Stock</option>
            </select>
            <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
          </div>

          <div className="relative">
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
            >
              <option value="all">Vendor</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
          </div>

          <div className="relative">
            <select 
              className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="all">Listed Date</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
          </div>

          <button 
            onClick={() => {
              setSearch("");
              setCategoryFilter("all");
              setStockFilter("all");
              setSupplierFilter("all");
              setDateRange("all");
              fetchProducts(true);
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
          <table className="w-full text-left border-collapse table-fixed min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <th className="w-[10%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Preview</th>
                <th className="w-[22%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Product Identity</th>
                <th className="w-[15%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Category</th>
                <th className="w-[12%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Unit Price</th>
                <th className="w-[12%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Stock Level</th>
                <th className="w-[15%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Vendor</th>
                <th className="w-[14%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800" style={{ borderColor: 'var(--border-color)' }}>
              {paginatedProducts.map((product, idx) => {
                const stockValue = Number(product.stock || 0);
                const isOutOfStock = stockValue <= 0;
                const isLowStock = !isOutOfStock && stockValue <= LOW_STOCK_THRESHOLD;
                
                return (
                  <tr 
                    key={product._id || idx} 
                    className={`group transition-all duration-200 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/30 dark:bg-slate-800/20'} hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5`}
                  >
                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                      <div className="w-12 h-12 rounded-xl border bg-slate-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                        {product.image ? (
                          <img src={getImageUrl(product.image)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <FaBox className="text-slate-200" size={16} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                      <div className="truncate">
                        <p className="font-bold text-sm truncate" style={{ color: 'var(--page-text)' }}>{product.name}</p>
                        <p className="text-[9px] font-bold opacity-30 uppercase tracking-tighter truncate mt-0.5">SKU: {product._id?.slice(-8).toUpperCase() || "N/A"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold">
                        <FaTags className="text-indigo-500/40" size={9} />
                        {product.category}
                      </div>
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                      <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">₹{(product.price || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-xs font-black ${isOutOfStock ? "text-rose-600" : isLowStock ? "text-amber-600" : "text-emerald-600"}`}>
                          {product.stock} Units
                        </span>
                        {isOutOfStock ? (
                          <span className="text-[8px] font-black uppercase text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/10">Depleted</span>
                        ) : isLowStock ? (
                          <span className="text-[8px] font-black uppercase text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/10">Refill</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                      <div className="truncate">
                        <p className="text-xs font-semibold opacity-80 truncate">{product.supplier?.name || "Independent"}</p>
                        <p className="text-[9px] font-bold opacity-30 truncate">Verified Partner</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => openEditModal(product)}
                          className="p-2 hover:bg-indigo-600 hover:text-white rounded-lg transition-all text-slate-400"
                          title="Edit"
                        >
                          <FaEdit size={12} />
                        </button>
                        <button 
                          onClick={() => deleteProduct(product._id)}
                          className="p-2 hover:bg-rose-600 hover:text-white rounded-lg transition-all text-slate-400"
                          title="Delete"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={productPage} totalPages={totalProductPages} onPageChange={setProductPage} />

      <ProductFormModal 
        isOpen={showModal}
        onClose={resetModal}
        initialData={editingProduct}
        categories={categories}
        suppliers={suppliers}
        onSuccess={() => {
          fetchProducts();
          window.dispatchEvent(new Event("products-updated"));
        }}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, productId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone and will remove it from all categories."
        confirmText="Delete Product"
      />
    </div>
  );
};


export default ManageProducts;
