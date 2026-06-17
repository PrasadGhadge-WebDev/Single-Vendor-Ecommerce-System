import React, { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API, { getImageUrl } from "../../api";
import { downloadCsv, inDateRange } from "../../utils/adminHelpers";
import { 
  FaPlus, FaSearch, FaChevronDown, FaEdit, FaTrash, FaFileCsv, 
  FaBoxOpen, FaTags, FaExclamationTriangle, FaBox, FaStar, 
  FaEye, FaCheckCircle, FaBan, FaChartLine, FaTimes, FaUpload
} from "react-icons/fa";
import { toast } from "react-toastify";
import Papa from "papaparse";
import Pagination from "../../components/Pagination";
import ConfirmModal from "../../components/ConfirmModal";
import AddProduct from "./AddProduct";

const PRODUCTS_PER_PAGE = 10;

const ManageProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  // Bulk actions
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkCategory, setBulkCategory] = useState("");

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editProductId, setEditProductId] = useState(null);

  const [productPage, setProductPage] = useState(1);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, productId: null, action: null });
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const fetchProducts = async () => {
    try {
      const { data } = await API.get(`/products?_t=${new Date().getTime()}`);
      const list = Array.isArray(data) ? data : data.products || [];
      setProducts(list);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
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

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const deleteProduct = (id) => {
    setConfirmConfig({ isOpen: true, productId: id, action: 'delete' });
  };

  const handleConfirmDelete = async () => {
    if (confirmConfig.action === 'delete') {
      const id = confirmConfig.productId;
      try {
        await API.delete(`/products/${id}`);
        fetchProducts();
        toast.success("Product deleted successfully");
      } catch (error) {
        toast.error("Error deleting product");
      }
    } else if (confirmConfig.action === 'bulk_delete') {
      executeBulkAction('delete');
    }
  };

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      if (categoryFilter !== "all" && product.category !== categoryFilter) return false;
      if (statusFilter !== "all" && product.status !== statusFilter) return false;

      if (stockStatusFilter !== "all") {
        if (stockStatusFilter === "in-stock" && product.stock <= 0) return false;
        if (stockStatusFilter === "out-of-stock" && product.stock > 0) return false;
        if (stockStatusFilter === "low-stock" && (product.stock <= 0 || product.stock > 10)) return false;
      }
      
      // Date Range Filtering
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
        } else if (dateRange === "30days") {
          const thirtyDaysAgo = new Date(startOfToday);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          if (entryDate < thirtyDaysAgo) return false;
        } else if (dateRange === "custom") {
          if ((dateFrom || dateTo) && !inDateRange(product.createdAt, dateFrom, dateTo)) return false;
        }
      }

      if (!term) return true;
      const haystack = `${product.name} ${product.sku} ${product.category} ${product.price} ${product.stock} ${product.status} ${new Date(product.createdAt).toLocaleDateString()}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [products, search, categoryFilter, statusFilter, stockStatusFilter, dateRange, dateFrom, dateTo]);

  useEffect(() => {
    setProductPage(1);
  }, [search, categoryFilter, statusFilter, stockStatusFilter, dateRange, dateFrom, dateTo]);

  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const startIndex = (productPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [filteredProducts, productPage]);

  // KPIs
  const totalProducts = filteredProducts.length;
  const activeProducts = filteredProducts.filter(p => p.status === 'Active').length;
  const outOfStockProducts = filteredProducts.filter(p => p.stock <= 0).length;
  const lowStockProducts = filteredProducts.filter(p => p.stock > 0 && p.stock <= 10).length;
  const draftProducts = filteredProducts.filter(p => p.status === 'Draft').length;
  const featuredProductsCount = filteredProducts.filter(p => p.featured).length;

  const exportProducts = () => {
    downloadCsv(
      "products_export.csv",
      filteredProducts.map((p) => ({
        "Product Name": p.name,
        "SKU": p.sku || "N/A",
        "Category": p.category,
        "Brand": p.brand || "N/A",
        "Price": p.price,
        "Stock": p.stock,
        "Status": p.status,
        "Featured": p.featured ? "Yes" : "No",
        "Created Date": new Date(p.createdAt).toLocaleDateString(),
      }))
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProductIds(paginatedProducts.map(p => p._id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectProduct = (id) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(pid => pid !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const handleBulkActionSubmit = async () => {
    if (!bulkAction || selectedProductIds.length === 0) return;

    if (bulkAction === 'delete') {
      setConfirmConfig({ isOpen: true, action: 'bulk_delete' });
      return;
    }

    executeBulkAction(bulkAction);
  };

  const executeBulkAction = async (action) => {
    try {
      const payload = { action, productIds: selectedProductIds };
      if (action === 'assign_category') {
        if (!bulkCategory) {
          toast.warning("Please select a category to assign");
          return;
        }
        payload.category = bulkCategory;
      }

      await API.post('/products/bulk-action', payload);
      toast.success(`Bulk action completed successfully`);
      setSelectedProductIds([]);
      setBulkAction("");
      fetchProducts();
    } catch (error) {
      toast.error("Bulk action failed");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const products = results.data.map((row) => ({
            name: row["Product Name"] || row["name"],
            sku: row["SKU"] || row["sku"],
            category: row["Category"] || row["category"],
            brand: row["Brand"] || row["brand"],
            price: row["Price"] || row["price"],
            stock: row["Stock"] || row["stock"],
            status: row["Status"] || row["status"] || "Draft",
          }));

          if (products.length === 0) {
            toast.error("No valid data found in CSV");
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
          }

          const { data } = await API.post("/products/import", { products });
          toast.success(data.message || "Products imported successfully");
          fetchProducts();
        } catch (error) {
          console.error("Import error:", error);
          toast.error(error.response?.data?.message || "Failed to import products");
        } finally {
          setImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
      error: (error) => {
        toast.error("Failed to parse CSV file: " + error.message);
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-8 space-y-6 animate-in fade-in duration-700" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0">Products</h1>
          <p className="text-sm text-gray-500 m-0 mt-1">View and edit all products in your store.</p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button 
            onClick={() => { setEditProductId(null); setShowAddProduct(true); }}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
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
            <span>Download Products</span>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".csv" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border rounded-2xl hover:bg-slate-50 transition-all text-sm font-bold shadow-sm disabled:opacity-50" 
            style={{ borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
          >
            {importing ? (
              <span className="spinner-border spinner-border-sm text-green-600" role="status" aria-hidden="true"></span>
            ) : (
              <FaUpload size={12} className="text-green-600" />
            )}
            <span>{importing ? "Importing..." : "Import CSV"}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border shadow-sm flex flex-col justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Products</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white">{totalProducts}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Active</p>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{activeProducts}</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 p-5 rounded-2xl border border-rose-100 dark:border-rose-800 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">Out of Stock</p>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-400">{outOfStockProducts}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-2xl border border-amber-100 dark:border-amber-800 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Low Stock</p>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-400">{lowStockProducts}</p>
        </div>
      </div>

      {/* Advanced Filter Suite */}
      <div className="bg-white py-3 px-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-3 w-full dark:bg-slate-900/60 dark:border-slate-800">
        <div className="flex flex-nowrap overflow-x-auto gap-3 items-center w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex-[2] min-w-[200px] relative">
            <input
              type="text"
              placeholder="Search by all columns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-9 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:bg-white dark:focus:bg-slate-800 focus:ring-2 ring-indigo-500/20 outline-none"
              style={{ color: 'var(--page-text)' }}
            />
            <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
          </div>
          
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="py-1.5 px-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none cursor-pointer flex-1 min-w-[110px]">
            <option value="all">All Categories</option>
            {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="py-1.5 px-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none cursor-pointer flex-1 min-w-[110px]">
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select value={stockStatusFilter} onChange={(e) => setStockStatusFilter(e.target.value)} className="py-1.5 px-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none cursor-pointer flex-1 min-w-[110px]">
            <option value="all">All Products</option>
            <option value="in-stock">In Stock</option>
            <option value="out-of-stock">Out of Stock</option>
            <option value="low-stock">Low Stock</option>
          </select>

          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="py-1.5 px-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none cursor-pointer flex-1 min-w-[110px]">
            <option value="all">Date Added</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          {(search || categoryFilter !== 'all' || statusFilter !== 'all' || stockStatusFilter !== 'all' || dateRange !== 'all') && (
            <button 
              onClick={() => {
                setSearch("");
                setCategoryFilter("all");
                setStatusFilter("all");
                setStockStatusFilter("all");
                setDateRange("all");
                setDateFrom("");
                setDateTo("");
              }}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ml-auto"
            >
              Reset
            </button>
          )}
        </div>
        
        {dateRange === 'custom' && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-slate-700 mt-1">
            <span className="text-xs font-semibold text-slate-500">Custom Date Range:</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="py-1 px-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded text-xs outline-none" />
            <span className="text-slate-400 text-xs">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="py-1 px-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded text-xs outline-none" />
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedProductIds.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl dark:bg-indigo-900/20 dark:border-indigo-800">
          <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{selectedProductIds.length} items selected</span>
          <select 
            value={bulkAction} 
            onChange={(e) => setBulkAction(e.target.value)}
            className="px-3 py-2 text-sm border rounded-lg outline-none cursor-pointer"
          >
            <option value="">Choose action for selected...</option>
            <option value="activate">Activate Products</option>
            <option value="deactivate">Deactivate Products</option>
            <option value="delete">Delete Products</option>
            <option value="assign_category">Assign Category</option>
          </select>
          
          {bulkAction === 'assign_category' && (
            <select 
              value={bulkCategory} 
              onChange={(e) => setBulkCategory(e.target.value)}
              className="px-3 py-2 text-sm border rounded-lg outline-none cursor-pointer"
            >
              <option value="">Select Category...</option>
              {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          )}

          <button 
            onClick={handleBulkActionSubmit}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700"
          >
            Apply
          </button>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900/60 rounded-3xl border shadow-sm overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <th className="px-4 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll} 
                    checked={paginatedProducts.length > 0 && selectedProductIds.length === paginatedProducts.length}
                    className="cursor-pointer"
                  />
                </th>
                <th className="px-4 py-4 text-xs font-black uppercase tracking-wider text-slate-500">Image</th>
                <th className="px-4 py-4 text-xs font-black uppercase tracking-wider text-slate-500">Product Name</th>
                <th className="px-4 py-4 text-xs font-black uppercase tracking-wider text-slate-500">Category</th>
                <th className="px-4 py-4 text-xs font-black uppercase tracking-wider text-slate-500">Price</th>
                <th className="px-4 py-4 text-xs font-black uppercase tracking-wider text-slate-500">Stock</th>
                <th className="px-4 py-4 text-xs font-black uppercase tracking-wider text-slate-500 text-center">Status</th>
                <th className="px-4 py-4 text-xs font-black uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-4 py-4 text-xs font-black uppercase tracking-wider text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800" style={{ borderColor: 'var(--border-color)' }}>
              {paginatedProducts.length > 0 ? paginatedProducts.map((product) => {
                const stockValue = Number(product.stock || 0);
                const isOutOfStock = stockValue <= 0;
                const isLowStock = !isOutOfStock && stockValue <= 10;
                
                return (
                  <tr key={product._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedProductIds.includes(product._id)}
                        onChange={() => handleSelectProduct(product._id)}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-lg border bg-slate-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                        {product.image ? (
                          <img src={getImageUrl(product.image)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <FaBox className="text-slate-200" size={14} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate max-w-[200px]" title={product.name}>
                        {product.name}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">₹{(product.price || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        {isOutOfStock ? (
                          <>
                            <span className="text-xs font-black text-rose-600">Out of Stock</span>
                          </>
                        ) : isLowStock ? (
                          <>
                            <span className="text-xs font-black text-amber-600">{product.stock} Units</span>
                          </>
                        ) : (
                          <span className="text-xs font-black text-emerald-600">{product.stock} Units</span>
                        )}
                        {product.stockStatus === 'Pre-Order' && <span className="text-[9px] uppercase tracking-wider text-purple-600 font-bold mt-1">Pre-Order</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${
                        product.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                        product.status === 'Draft' ? 'bg-slate-200 text-slate-700' :
                        product.status === 'Inactive' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {product.status || 'Draft'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500 font-medium">{new Date(product.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditProductId(product._id); setShowAddProduct(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors" title="Edit">
                          <FaEdit size={14} />
                        </button>
                        <button onClick={() => deleteProduct(product._id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors" title="Delete">
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="9" className="px-4 py-16 text-center text-slate-500">
                    <FaBoxOpen className="mx-auto text-4xl text-slate-300 mb-3" />
                    <p className="text-lg font-bold text-slate-600">No Products Found</p>
                    <p className="text-sm">Start by adding your first product to the catalog.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {paginatedProducts.length > 0 && (
        <Pagination currentPage={productPage} totalPages={totalProductPages} onPageChange={setProductPage} />
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, productId: null, action: null })}
        onConfirm={handleConfirmDelete}
        title={confirmConfig.action === 'bulk_delete' ? "Delete Multiple Products" : "Delete Product"}
        message={confirmConfig.action === 'bulk_delete' 
          ? `Are you sure you want to delete ${selectedProductIds.length} products? This cannot be undone.`
          : "Are you sure you want to delete this product? This action cannot be undone."}
        confirmText="Delete"
        type="danger"
      />
      {showAddProduct && (
        <AddProduct 
          productId={editProductId}
          onClose={() => {
            setShowAddProduct(false);
            setEditProductId(null);
          }}
          onSuccess={() => {
            setShowAddProduct(false);
            setEditProductId(null);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
};

export default ManageProducts;
