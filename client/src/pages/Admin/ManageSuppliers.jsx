import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FaPlus, FaTimes, FaSearch, FaFileCsv, FaSync, FaTruck, FaChartLine, FaHistory, FaMapMarkerAlt, FaEnvelope, FaPhoneAlt, FaBuilding, FaCheckCircle, FaExclamationCircle, FaUserTag, FaCalendarAlt, FaBriefcase, FaChevronDown } from "react-icons/fa";
import API from "../../api";
import { downloadCsv, inDateRange } from "../../utils/adminHelpers";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";
import SupplierFormModal from "../../components/SupplierFormModal";
import PurchaseFormModal from "../../components/PurchaseFormModal";
import ConfirmModal from "../../components/ConfirmModal";

const SUPPLIERS_PER_PAGE = 12;
const PURCHASES_PER_PAGE = 10;

const ManageSuppliers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, supplierId: null });

  const [loading, setLoading] = useState(false);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [activeModuleSection, setActiveModuleSection] = useState("suppliers");
  const [selectedSupplierForDetails, setSelectedSupplierForDetails] = useState(null);
  const [drawerActiveTab, setDrawerActiveTab] = useState("Overview");

  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierStatusFilter, setSupplierStatusFilter] = useState("all");
  const [supplierCityFilter, setSupplierCityFilter] = useState("all");
  const [supplierCategoryFilter, setSupplierCategoryFilter] = useState("all");
  const [supplierDateFrom, setSupplierDateFrom] = useState("");
  const [supplierDateTo, setSupplierDateTo] = useState("");
  const [supplierPage, setSupplierPage] = useState(1);
  
  const [purchaseSupplierFilter, setPurchaseSupplierFilter] = useState("all");
  const [purchasePaymentStatusFilter, setPurchasePaymentStatusFilter] = useState("all");
  const [purchaseDateFrom, setPurchaseDateFrom] = useState("");
  const [purchaseDateTo, setPurchaseDateTo] = useState("");
  const [purchasePage, setPurchasePage] = useState(1);
  const [purchaseSupplierFilterSearch, setPurchaseSupplierFilterSearch] = useState("");

  const [productSourceProductSearch, setProductSourceProductSearch] = useState("");
  const [productSourceSupplierSearch, setProductSourceSupplierSearch] = useState("");
  const [showFilterSupplierSuggestions, setShowFilterSupplierSuggestions] = useState(false);

  const filterSupplierSuggestionTimeout = useRef(null);

  const fetchSuppliers = useCallback(async () => {
    try {
      const { data } = await API.get("/suppliers");
      const list = Array.isArray(data) ? data : [];
      setSuppliers(list);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await API.get("/products?limit=500&sortBy=createdAt&order=desc");
      const list = Array.isArray(data) ? data : data?.products || [];
      setProducts(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }, []);

  const fetchPurchases = useCallback(async () => {
    try {
      const params = {};
      if (purchaseDateFrom) params.dateFrom = new Date(purchaseDateFrom).toISOString();
      if (purchaseDateTo) params.dateTo = new Date(purchaseDateTo).toISOString();
      if (purchaseSupplierFilter !== "all") params.supplierId = purchaseSupplierFilter;
      if (purchasePaymentStatusFilter !== "all") params.paymentStatus = purchasePaymentStatusFilter;
      const { data } = await API.get("/suppliers/purchases", { params });
      setPurchases(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching purchases:", error);
    }
  }, [purchaseDateFrom, purchaseDateTo, purchaseSupplierFilter, purchasePaymentStatusFilter]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const params = {};
      if (purchaseDateFrom) params.dateFrom = new Date(purchaseDateFrom).toISOString();
      if (purchaseDateTo) params.dateTo = new Date(purchaseDateTo).toISOString();
      const { data } = await API.get("/suppliers/analytics/overview", { params });
      setAnalytics(data || null);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  }, [purchaseDateFrom, purchaseDateTo]);

  const fetchSupplierProducts = useCallback(async (supplierId) => {
    if (!supplierId) {
      setSupplierProducts([]);
      return;
    }
    try {
      const { data } = await API.get(`/suppliers/${supplierId}/products`);
      setSupplierProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching supplier products:", error);
      setSupplierProducts([]);
    }
  }, []);

  const fetchAll = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      await Promise.all([fetchSuppliers(), fetchProducts(), fetchPurchases(), fetchAnalytics()]);
    } catch (error) {
      console.error("Supplier data load error:", error);
      toast.error(error.response?.data?.message || "Failed to load data");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [fetchAnalytics, fetchProducts, fetchPurchases, fetchSuppliers]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    fetchPurchases();
    fetchAnalytics();
  }, [fetchAnalytics, fetchPurchases]);

  useEffect(() => {
    fetchSupplierProducts(selectedSupplierId);
  }, [fetchSupplierProducts, selectedSupplierId]);

  useEffect(() => {
    const selectedSupplier = suppliers.find((supplier) => supplier._id === selectedSupplierId);
    setProductSourceSupplierSearch(selectedSupplier?.name || "");
  }, [selectedSupplierId, suppliers]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = setInterval(() => fetchAll(false), 30000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchAll]);

  const resetSupplierForm = () => {
    setSearchParams({});
    setActiveModuleSection("suppliers");
  };

  const openAddSupplier = () => {
    setSearchParams({ modal: "supplier" });
    setActiveModuleSection("suppliers");
  };

  const onEditSupplier = (supplier) => {
    if (!supplier?._id) {
      toast.error("Invalid supplier data");
      return;
    }
    setSearchParams({ modal: "supplier", id: supplier._id });
    setActiveModuleSection("suppliers");
  };

  const onDeleteSupplier = (supplierId) => {
    if (!supplierId) {
      toast.error("Invalid supplier reference");
      return;
    }
    setConfirmConfig({ isOpen: true, supplierId });
  };

  const handleConfirmDeleteSupplier = async () => {
    const supplierId = confirmConfig.supplierId;
    if (!supplierId) return;
    
    try {
      await API.delete(`/suppliers/${supplierId}`);
      await fetchSuppliers();
      await fetchAnalytics();
      toast.success("Supplier removed from network");
      if (selectedSupplierId === supplierId) {
        setSelectedSupplierId("");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete supplier");
    }
  };

  const filteredSuppliers = useMemo(() => {
    const term = supplierSearch.trim().toLowerCase();
    return suppliers.filter((supplier) => {
      if (supplierStatusFilter === "active" && !supplier.isActive) return false;
      if (supplierStatusFilter === "inactive" && supplier.isActive) return false;
      if (supplierCityFilter !== "all" && supplier.address?.city !== supplierCityFilter) return false;
      if (supplierCategoryFilter !== "all" && supplier.category !== supplierCategoryFilter) return false;
      if ((supplierDateFrom || supplierDateTo) && !inDateRange(supplier.createdAt, supplierDateFrom, supplierDateTo)) return false;
      if (!term) return true;
      const haystack = `${supplier.name} ${supplier.company || ""} ${supplier.email || ""} ${supplier.phone || ""} ${supplier.gstNumber || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [suppliers, supplierSearch, supplierStatusFilter, supplierCityFilter, supplierCategoryFilter, supplierDateFrom, supplierDateTo]);

  const totalSupplierPages = Math.max(1, Math.ceil(filteredSuppliers.length / SUPPLIERS_PER_PAGE));
  const paginatedSuppliers = useMemo(() => {
    const startIndex = (supplierPage - 1) * SUPPLIERS_PER_PAGE;
    return filteredSuppliers.slice(startIndex, startIndex + SUPPLIERS_PER_PAGE);
  }, [filteredSuppliers, supplierPage]);

  const totalPurchasePages = Math.max(1, Math.ceil(purchases.length / PURCHASES_PER_PAGE));
  const paginatedPurchases = useMemo(() => {
    const startIndex = (purchasePage - 1) * PURCHASES_PER_PAGE;
    return purchases.slice(startIndex, startIndex + PURCHASES_PER_PAGE);
  }, [purchases, purchasePage]);

  const filterSupplierOptions = useMemo(() => {
    const term = purchaseSupplierFilterSearch.trim().toLowerCase();
    return suppliers.filter((supplier) => supplier.name?.toLowerCase().includes(term));
  }, [suppliers, purchaseSupplierFilterSearch]);

  const handleFilterSupplierInputFocus = () => {
    if (filterSupplierSuggestionTimeout.current) {
      clearTimeout(filterSupplierSuggestionTimeout.current);
      filterSupplierSuggestionTimeout.current = null;
    }
    setShowFilterSupplierSuggestions(true);
  };

  const handleFilterSupplierInputBlur = () => {
    filterSupplierSuggestionTimeout.current = setTimeout(() => {
      setShowFilterSupplierSuggestions(false);
      filterSupplierSuggestionTimeout.current = null;
    }, 100);
  };

  const handleProductSourceSupplierSearchChange = (value) => {
    setProductSourceSupplierSearch(value);
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      setSelectedSupplierId("");
      return;
    }
    const matched = suppliers.find((supplier) => (supplier.name || "").trim().toLowerCase() === normalized);
    if (matched) {
      setSelectedSupplierId(matched._id);
    }
  };

  const filteredSupplierProducts = useMemo(() => {
    if (!supplierProducts.length) return [];
    const term = productSourceProductSearch.trim().toLowerCase();
    if (!term) return supplierProducts;
    return supplierProducts.filter((product) => {
      const searchable = `${product.name || ""} ${product.category || ""}`.toLowerCase();
      return searchable.includes(term);
    });
  }, [supplierProducts, productSourceProductSearch]);

  const exportSuppliers = () => {
    downloadCsv(
      "suppliers_network.csv",
      filteredSuppliers.map((supplier) => ({
        "Supplier Name": supplier.name,
        "Company": supplier.company || "N/A",
        "Email Address": supplier.email || "N/A",
        "Contact Phone": supplier.phone || "N/A",
        "Status": supplier.isActive ? "Active" : "Inactive",
        "Registered On": supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString() : "N/A",
      }))
    );
  };

  const exportPurchases = () => {
    downloadCsv(
      "inventory_purchases.csv",
      purchases.map((purchase) => ({
        "Date": new Date(purchase.purchaseDate || purchase.createdAt).toLocaleDateString(),
        "Supplier": purchase.supplier?.name || "Deleted Supplier",
        "Product": purchase.product?.name || "Deleted Product",
        "Qty": purchase.quantity,
        "Unit Cost": purchase.unitCost,
        "Total Investment": purchase.totalCost,
        "Payment Status": purchase.paymentStatus,
      }))
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* V3 Premium Module Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 relative">
        <div className="relative group">
          {/* Decorative Background Glow */}
          <div className="absolute -left-8 -top-8 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-700" />
          
          <div className="flex items-start gap-4 relative">
            {/* Geometric Accent Bar */}
            <div className="w-1.5 h-12 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full shadow-lg shadow-indigo-500/20" />
            
            <div>
              <h1 className="text-4xl font-black tracking-tight flex items-center gap-3" style={{ color: 'var(--page-text)' }}>
                Suppliers
                <span className="text-[10px] uppercase tracking-[0.3em] font-black px-2 py-1 bg-indigo-500/10 text-indigo-600 rounded-lg ml-2">
                  Network
                </span>
              </h1>
              <p className="text-sm font-bold opacity-40 uppercase tracking-[0.1em] mt-1.5">
                Strategic Sourcing & Vendor Relationship Intelligence
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button 
            onClick={openAddSupplier}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 group"
          >
            <FaPlus size={12} className="group-hover:rotate-90 transition-transform" />
            <span>New Supplier</span>
          </button>
          
          <button 
            onClick={() => { setActiveModuleSection("record-purchase"); setSearchParams({ modal: "purchase" }); }}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-800/20 hover:bg-slate-900 transition-all active:scale-95"
          >
            <FaHistory size={12} />
            <span>Record Purchase</span>
          </button>

          <button 
            onClick={activeModuleSection === "suppliers" ? exportSuppliers : exportPurchases}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border rounded-2xl hover:bg-slate-50 transition-all text-sm font-bold shadow-sm" 
            style={{ borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
          >
            <FaFileCsv size={12} className="text-indigo-600" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* High-Performance KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {[
          { 
            label: "Total Suppliers", 
            value: suppliers.length, 
            icon: FaBuilding, 
            color: "indigo",
            trend: "+3 this month"
          },
          { 
            label: "Active Suppliers", 
            value: suppliers.filter(s => s.isActive).length, 
            icon: FaCheckCircle, 
            color: "emerald",
            trend: "98% uptime"
          },
          { 
            label: "Total Purchases", 
            value: purchases.length, 
            icon: FaHistory, 
            color: "amber",
            trend: "+12% vs last month"
          },
          { 
            label: "Pending Payments", 
            value: `₹${purchases.filter(p => p.paymentStatus !== "PAID").reduce((sum, p) => sum + (p.totalCost || 0), 0).toLocaleString()}`, 
            icon: FaExclamationCircle, 
            color: "rose",
            trend: "4 invoices"
          },
          { 
            label: "This Month", 
            value: purchases.filter(p => {
              const d = new Date(p.purchaseDate || p.createdAt);
              const now = new Date();
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length, 
            icon: FaCalendarAlt, 
            color: "blue",
            trend: "Active cycle"
          },
          { 
            label: "Low Stock", 
            value: products.filter(p => p.stock <= 10).length, 
            icon: FaChartLine, 
            color: "orange",
            trend: "Immediate action"
          },
          { 
            label: "Avg. Lead Time", 
            value: "3.4 Days", 
            icon: FaTruck, 
            color: "purple",
            trend: "-0.5 days"
          },
        ].map((stat, idx) => (
          <div key={idx} className="card border shadow-sm p-3.5 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all" style={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--border-color)' }}>
            <div className="relative z-10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-600 dark:text-${stat.color}-400`}>
                  <stat.icon size={15} />
                </div>
                {/* Decorative Sparkline */}
                <svg className="w-10 h-5 opacity-30" viewBox="0 0 100 40">
                  <path 
                    d="M0 35 Q 25 15, 50 25 T 100 5" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    className={`text-${stat.color}-500`}
                  />
                </svg>
              </div>
              
              <div className="space-y-0">
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--page-text-muted)' }}>{stat.label}</p>
                <h3 className="text-base font-black tracking-tighter" style={{ color: 'var(--page-text)' }}>{stat.value}</h3>
              </div>

              <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">{stat.trend}</span>
              </div>
            </div>
            <div className={`absolute -bottom-4 -right-4 w-12 h-12 bg-${stat.color}-500/5 rounded-full group-hover:scale-150 transition-transform duration-500`} />
          </div>
        ))}
      </div>

      {/* Styled Navigation Tabs */}
      <div className="flex flex-wrap gap-1 p-1 rounded-2xl border w-fit mx-auto md:mx-0" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border-color)' }}>
        {[
          { id: "suppliers", label: "Suppliers", icon: FaBuilding },
          { id: "recent-purchases", label: "History", icon: FaHistory },
          { id: "product-source", label: "Analytics", icon: FaMapMarkerAlt },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveModuleSection(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
              activeModuleSection === tab.id 
                ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm scale-[1.01]" 
                : "text-slate-500 hover:text-indigo-600"
            }`}
            style={{ color: activeModuleSection === tab.id ? 'var(--accent-color)' : '' }}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Content Display */}
      <div className="min-h-[500px]">
        {activeModuleSection === "suppliers" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Advanced Supplier Filters */}
            <div id="intelligent-filters" className="p-4 bg-white dark:bg-slate-900/60 rounded-3xl border shadow-xl shadow-indigo-500/5 flex flex-col xl:flex-row gap-4 items-center mb-6" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex-grow w-full relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                  <FaSearch className="text-indigo-500/40" size={14} />
                </div>
                <input
                  type="text"
                  placeholder="Search supplier, company, phone..."
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  className="w-full pr-6 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500/30 transition-all outline-none"
                  style={{ paddingLeft: '52px', color: 'var(--page-text)' }}
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full xl:w-auto shrink-0">
                <div className="relative">
                  <select
                    value={supplierStatusFilter}
                    onChange={(e) => setSupplierStatusFilter(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
                  >
                    <option value="all">Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Archived</option>
                  </select>
                  <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
                </div>

                <div className="relative">
                  <select
                    value={supplierCityFilter}
                    onChange={(e) => setSupplierCityFilter(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
                  >
                    <option value="all">All Cities</option>
                    {[...new Set(suppliers.map(s => s.address?.city).filter(Boolean))].map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
                </div>

                <div className="relative">
                  <select
                    value={supplierCategoryFilter}
                    onChange={(e) => setSupplierCategoryFilter(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
                  >
                    <option value="all">Category</option>
                    {[...new Set(suppliers.map(s => s.category).filter(Boolean))].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
                </div>

                <button 
                  onClick={() => {
                    setSupplierSearch("");
                    setSupplierStatusFilter("all");
                    setSupplierCityFilter("all");
                    setSupplierCategoryFilter("all");
                    fetchSuppliers();
                  }}
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                  Reset
                </button>
              </div>
            </div>
            {/* Professional High-Density Supplier Grid */}
            <div className="bg-white dark:bg-slate-900/60 rounded-3xl border shadow-xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed min-w-[1100px]">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <th className="w-[22%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Supplier Authority</th>
                      <th className="w-[18%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Contact Gateway</th>
                      <th className="w-[10%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">SKU Catalog</th>
                      <th className="w-[10%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Orders</th>
                      <th className="w-[12%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Liabilities</th>
                      <th className="w-[12%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Status</th>
                      <th className="w-[16%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800" style={{ borderColor: 'var(--border-color)' }}>
                    {paginatedSuppliers.map((supplier, idx) => {
                      const supplierOrders = purchases.filter(p => p.supplierId === supplier._id);
                      const pendingAmount = supplierOrders.filter(p => p.paymentStatus !== "PAID").reduce((sum, p) => sum + (p.totalCost || 0), 0);
                      const supplierProductsCount = products.filter(p => p.supplier === supplier._id).length;
 
                      return (
                        <tr 
                          key={supplier._id} 
                          className={`group transition-all duration-200 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/30 dark:bg-slate-800/20'} hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 cursor-pointer`}
                          onClick={() => setSelectedSupplierForDetails(supplier)}
                        >
                          <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-xs text-white shadow-md shadow-indigo-500/20 group-hover:rotate-3 transition-transform">
                                {supplier.name?.charAt(0).toUpperCase()}
                              </div>
                              <div className="truncate">
                                <div className="font-bold text-sm truncate" style={{ color: 'var(--page-text)' }}>{supplier.name}</div>
                                <div className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter truncate mt-0.5">
                                  {supplier.company || "Independent Vendor"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                            <div className="truncate">
                              <p className="text-xs font-semibold opacity-80 truncate">{supplier.email || "—"}</p>
                              <p className="text-[10px] font-medium opacity-40 truncate">{supplier.phone || "—"}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black">
                              {supplierProductsCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black">
                              {supplierOrders.length}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                            <span className={`text-[11px] font-black ${pendingAmount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                              ₹{pendingAmount.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                            <span className={`inline-block px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                              supplier.isActive 
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/10" 
                                : pendingAmount > 0 
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/10"
                                : "bg-slate-500/10 text-slate-500 border-slate-500/10"
                            }`}>
                              {supplier.isActive ? "Active" : pendingAmount > 0 ? "Pending" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              <button 
                                onClick={() => onEditSupplier(supplier)}
                                className="p-2 hover:bg-indigo-600 hover:text-white rounded-lg transition-all text-slate-400"
                                title="Edit"
                              >
                                <FaUserTag size={12} />
                              </button>
                              <button 
                                onClick={() => {
                                  setPurchaseSupplierFilter(supplier._id);
                                  setPurchaseSupplierFilterSearch(supplier.name);
                                  setActiveModuleSection("recent-purchases");
                                }}
                                className="p-2 hover:bg-emerald-600 hover:text-white rounded-lg transition-all text-slate-400"
                                title="History"
                              >
                                <FaHistory size={12} />
                              </button>
                              <button 
                                onClick={() => onDeleteSupplier(supplier._id)}
                                className="p-2 hover:bg-rose-600 hover:text-white rounded-lg transition-all text-slate-400"
                                title="Delete"
                              >
                                <FaTimes size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>  </div>
              {filteredSuppliers.length === 0 && (
                <div className="py-32 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-500/5 flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-indigo-500/10 rounded-[2.5rem] animate-ping opacity-20" />
                    <FaBuilding className="text-4xl text-indigo-600/30" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter mb-2" style={{ color: 'var(--page-text)' }}>
                    No suppliers added yet
                  </h3>
                  <p className="text-sm font-bold opacity-40 uppercase tracking-widest mb-8">
                    Start by creating your first supplier to manage your network
                  </p>
                  <button
                    onClick={openAddSupplier}
                    className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:scale-105 transition-all active:scale-95"
                  >
                    <FaPlus size={12} />
                    <span>Add First Supplier</span>
                  </button>
                </div>
              )}
            <Pagination currentPage={supplierPage} totalPages={totalSupplierPages} onPageChange={setSupplierPage} />
          </div>
        )}

        {activeModuleSection === "recent-purchases" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Dynamic History Filters */}
            <div id="purchase-filters" className="card p-4 rounded-2xl border shadow-sm flex flex-col xl:flex-row gap-4 items-center" style={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--border-color)' }}>
              <div className="flex-grow w-full relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                  <FaSearch className="text-indigo-500/40" size={14} />
                </div>
                <input
                  type="text"
                  placeholder="Search supplier, product or invoice..."
                  value={purchaseSupplierFilterSearch}
                  onChange={(e) => setPurchaseSupplierFilterSearch(e.target.value)}
                  onFocus={handleFilterSupplierInputFocus}
                  onBlur={handleFilterSupplierInputBlur}
                  className="w-full pr-6 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500/30 transition-all outline-none"
                  style={{ paddingLeft: '52px', color: 'var(--page-text)' }}
                />
                
                {/* Supplier Suggestions UI */}
                {showFilterSupplierSuggestions && filterSupplierOptions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 card border shadow-xl z-50 max-h-48 overflow-y-auto p-2" style={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--border-color)' }}>
                    {filterSupplierOptions.map(s => (
                      <div 
                        key={s._id} 
                        className="p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg cursor-pointer flex items-center gap-3 transition-colors"
                        onMouseDown={() => {
                          setPurchaseSupplierFilter(s._id);
                          setPurchaseSupplierFilterSearch(s.name);
                        }}
                      >
                        <div className="w-8 h-8 rounded bg-indigo-500 flex items-center justify-center text-white font-black text-xs">{s.name.charAt(0)}</div>
                        <div className="text-xs font-bold" style={{ color: 'var(--page-text)' }}>{s.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full xl:w-auto shrink-0">
                <div className="relative">
                  <select
                    value={purchasePaymentStatusFilter}
                    onChange={(e) => setPurchasePaymentStatusFilter(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
                  >
                    <option value="all">Payment</option>
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending</option>
                    <option value="PARTIAL">Partial</option>
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>

                <div className="relative">
                  <select
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
                  >
                    <option value="all">Status</option>
                    <option value="COMPLETED">Delivered</option>
                    <option value="TRANSIT">In Transit</option>
                    <option value="ORDERED">Ordered</option>
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setPurchaseSupplierFilter("all");
                    setPurchaseSupplierFilterSearch("");
                    setPurchasePaymentStatusFilter("all");
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl font-black text-[9px] uppercase tracking-widest transition-all hover:bg-slate-200 dark:hover:bg-slate-700 shadow-sm"
                  style={{ color: 'var(--page-text)', borderColor: 'var(--border-color)' }}
                >
                  <FaSync size={11} className="text-indigo-600" />
                  <span>Reset</span>
                </button>

                <button 
                  onClick={exportPurchases}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/10 border rounded-xl font-black text-[9px] uppercase tracking-widest transition-all hover:bg-indigo-100 dark:hover:bg-indigo-900/20 shadow-sm whitespace-nowrap"
                  style={{ color: 'var(--page-text)', borderColor: 'var(--border-color)' }}
                >
                  <FaFileCsv size={13} className="text-indigo-600" />
                  <span className="hidden md:inline">Export</span>
                </button>
              </div>
            </div>

            {/* Premium Ledger Table */}
            <div className="card border rounded-[2rem] overflow-hidden shadow-lg" style={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--border-color)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border-color)' }}>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Transaction Timeline</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Procured Assets</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-center">Volume</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Capital Deployed</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                    {paginatedPurchases.map((purchase) => (
                      <tr key={purchase._id} className="hover:bg-amber-50/20 dark:hover:bg-amber-900/5 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="text-sm font-black tracking-tight" style={{ color: 'var(--page-text)' }}>
                            {new Date(purchase.purchaseDate || purchase.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-[10px] font-black opacity-30 uppercase tracking-widest mt-0.5">
                            ID: {purchase._id?.slice(-6).toUpperCase() || "N/A"}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="font-black text-sm tracking-tight" style={{ color: 'var(--page-text)' }}>{purchase.product?.name || "Inventory Item"}</div>
                          <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-2 uppercase tracking-widest mt-1">
                            <FaTruck size={10} />
                            {purchase.supplier?.name || "Independent Sourcing"}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="text-base font-black tracking-tighter" style={{ color: 'var(--page-text)' }}>{purchase.quantity}</div>
                          <div className="text-[9px] font-black uppercase tracking-widest opacity-30">Total Units</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-base font-black tracking-tighter" style={{ color: 'var(--page-text)' }}>₹{purchase.totalCost?.toLocaleString()}</div>
                          <div className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-0.5">₹{purchase.unitCost}/unit avg.</div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                            purchase.paymentStatus === "PAID" 
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                              : purchase.paymentStatus === "PARTIAL"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                          }`}>
                            {purchase.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {purchases.length === 0 && (
                <div className="py-24 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center mb-6">
                    <FaHistory className="text-4xl opacity-10" />
                  </div>
                  <p className="text-xl font-black tracking-tight opacity-40">No Transactions Found</p>
                </div>
              )}
            </div>
            <Pagination currentPage={purchasePage} totalPages={totalPurchasePages} onPageChange={setPurchasePage} />
          </div>
        )}

        {activeModuleSection === "product-source" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Sourcing Intelligence Engine */}
            <div className="card p-8 rounded-[2.5rem] border shadow-lg space-y-6 relative overflow-hidden" style={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-xl shadow-indigo-500/20">
                  <FaMapMarkerAlt size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-black tracking-tight" style={{ color: 'var(--page-text)' }}>Sourcing Engine</h4>
                  <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mt-1">Cross-reference product origin and vendor consistency</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Vendor Node</label>
                  <div className="relative group">
                    <FaTruck className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="text"
                      placeholder="Identify vendor for tracing..."
                      value={productSourceSupplierSearch}
                      onChange={(e) => handleProductSourceSupplierSearchChange(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 outline-none bg-slate-50 dark:bg-slate-900/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-sm"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Asset Filter</label>
                  <div className="relative group">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="text"
                      placeholder="Filter sourced inventory assets..."
                      value={productSourceProductSearch}
                      onChange={(e) => setProductSourceProductSearch(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 outline-none bg-slate-50 dark:bg-slate-900/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-sm"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
                    />
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-bl-[10rem] pointer-events-none" />
            </div>

            {/* Premium Sourcing Asset Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSupplierProducts.map((product) => (
                <div key={product._id} className="card border rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group" style={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--border-color)' }}>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-xl border border-indigo-500/20">
                        {product.category || "General Asset"}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                        <FaTruck size={14} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-black text-base tracking-tight truncate" style={{ color: 'var(--page-text)' }}>{product.name}</h5>
                      <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">{product.brand || "Industrial Standard"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                      <div>
                        <div className="text-[8px] font-black opacity-30 uppercase tracking-[0.2em] mb-1">Stock Level</div>
                        <div className={`text-sm font-black tracking-tighter ${product.stock <= 10 ? "text-rose-500 animate-pulse" : "text-emerald-500"}`}>{product.stock} Units</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[8px] font-black opacity-30 uppercase tracking-[0.2em] mb-1">Market Val.</div>
                        <div className="text-sm font-black tracking-tighter" style={{ color: 'var(--page-text)' }}>₹{product.price?.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredSupplierProducts.length === 0 && (
              <div className="py-32 card border rounded-[3rem] flex flex-col items-center justify-center text-center opacity-40 space-y-4" style={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--border-color)' }}>
                <div className="w-24 h-24 rounded-[2rem] bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center">
                   <FaMapMarkerAlt className="text-5xl" />
                </div>
                <div>
                  <p className="text-xl font-black uppercase tracking-widest">Awaiting Trace Request</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Identify a vendor node to begin origin tracing</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modernized Form Modals */}
      <SupplierFormModal
        isOpen={searchParams.get("modal") === "supplier"}
        onClose={resetSupplierForm}
        onSave={async (data) => {
          try {
            setSavingSupplier(true);
            const editingId = searchParams.get("id");
            if (editingId) {
              await API.put(`/suppliers/${editingId}`, data);
            } else {
              await API.post("/suppliers", data);
            }
            await fetchSuppliers();
            await fetchAnalytics();
            toast.success(editingId ? "Channel settings updated" : "New vendor successfully onboarded");
            resetSupplierForm();
          } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save supplier node");
          } finally {
            setSavingSupplier(false);
          }
        }}
        initialData={searchParams.get("id") ? suppliers.find(s => s._id === searchParams.get("id")) : null}
        loading={savingSupplier}
      />

      <PurchaseFormModal
        isOpen={searchParams.get("modal") === "purchase"}
        onClose={() => { setSearchParams({}); setActiveModuleSection("suppliers"); }}
        onSave={async (data) => {
          try {
            setSavingPurchase(true);
            await API.post("/suppliers/purchases", data);
            await Promise.all([fetchPurchases(), fetchProducts(), fetchAnalytics()]);
            toast.success("Procurement transaction successfully recorded");
            setSearchParams({});
            setActiveModuleSection("recent-purchases");
          } catch (error) {
            toast.error(error.response?.data?.message || "Procurement logging failed");
          } finally {
            setSavingPurchase(false);
          }
        }}
        suppliers={suppliers}
        products={products}
        loading={savingPurchase}
      />

      {/* 360° Supplier Detail Drawer */}
      <div className={`fixed inset-0 z-[100] transition-all duration-500 ease-in-out ${selectedSupplierForDetails ? "opacity-100 visible" : "opacity-0 invisible"}`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
          onClick={() => setSelectedSupplierForDetails(null)}
        />
        
        {/* Drawer Content */}
        <div className={`absolute top-0 right-0 h-full w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-500 ease-in-out transform flex flex-col border-l ${selectedSupplierForDetails ? "translate-x-0" : "translate-x-full"}`} style={{ borderColor: 'var(--border-color)' }}>
          {selectedSupplierForDetails && (
            <>
              {/* Drawer Header */}
              <div className="p-8 border-b relative shrink-0" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--surface-2)' }}>
                <button 
                  onClick={() => setSelectedSupplierForDetails(null)}
                  className="absolute top-8 right-8 p-2 rounded-full hover:bg-white/50 dark:hover:bg-slate-800 transition-colors z-10"
                >
                  <FaTimes size={16} className="opacity-40" />
                </button>

                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl text-white font-black shadow-2xl shadow-indigo-500/40">
                    {selectedSupplierForDetails.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tighter" style={{ color: 'var(--page-text)' }}>{selectedSupplierForDetails.name}</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 mt-1">
                      {selectedSupplierForDetails.company || "Independent Vendor"}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${selectedSupplierForDetails.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                        {selectedSupplierForDetails.isActive ? "Verified Profile" : "Restricted"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Drawer Tabs */}
                <div className="flex gap-6 mt-8 overflow-x-auto no-scrollbar">
                  {["Overview", "Purchase History", "Ledger", "Documents"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setDrawerActiveTab(tab)}
                      className={`text-[10px] font-black uppercase tracking-widest pb-3 border-b-2 transition-all whitespace-nowrap ${
                        drawerActiveTab === tab ? "border-indigo-600 text-indigo-600" : "border-transparent opacity-40 hover:opacity-100"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-grow overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {drawerActiveTab === "Overview" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Contact Email</p>
                        <p className="text-sm font-bold" style={{ color: 'var(--page-text)' }}>{selectedSupplierForDetails.email || "—"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Primary Phone</p>
                        <p className="text-sm font-bold" style={{ color: 'var(--page-text)' }}>{selectedSupplierForDetails.phone || "—"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40">GST Identification</p>
                        <p className="text-sm font-black text-indigo-600 uppercase">{selectedSupplierForDetails.gstNumber || "Unregistered"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Payment Terms</p>
                        <p className="text-sm font-bold" style={{ color: 'var(--page-text)' }}>{selectedSupplierForDetails.paymentTerms || "30 Days Net"}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Registered Business Address</p>
                      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed text-xs font-bold leading-relaxed shadow-inner" style={{ borderColor: 'var(--border-color)', color: 'var(--page-text)' }}>
                        {selectedSupplierForDetails.address ? (
                          <>
                            <div className="flex items-start gap-3">
                              <FaMapMarkerAlt className="mt-1 opacity-40 text-indigo-500" />
                              <div>
                                {selectedSupplierForDetails.address.street}<br/>
                                {selectedSupplierForDetails.address.city}, {selectedSupplierForDetails.address.state} - {selectedSupplierForDetails.address.zipCode}<br/>
                                <span className="opacity-40 uppercase tracking-widest text-[10px]">{selectedSupplierForDetails.address.country}</span>
                              </div>
                            </div>
                          </>
                        ) : "No address registered."}
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20">
                      <div className="flex items-center justify-between mb-4">
                        <FaBriefcase className="opacity-60" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Procurement Summary</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Total Orders</p>
                          <p className="text-2xl font-black">{purchases.filter(p => p.supplierId === selectedSupplierForDetails._id).length}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Active Products</p>
                          <p className="text-2xl font-black">{products.filter(p => p.supplier === selectedSupplierForDetails._id).length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {drawerActiveTab === "Purchase History" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                    {purchases.filter(p => p.supplierId === selectedSupplierForDetails._id).length > 0 ? (
                      purchases.filter(p => p.supplierId === selectedSupplierForDetails._id).map((p) => (
                        <div key={p._id} className="p-5 rounded-2xl border hover:shadow-md transition-all group" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--surface-1)' }}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <FaHistory className="text-indigo-600 opacity-60" size={12} />
                              </div>
                              <div>
                                <p className="text-[11px] font-black" style={{ color: 'var(--page-text)' }}>ORD-{p._id?.slice(-6).toUpperCase() || "N/A"}</p>
                                <p className="text-[9px] font-bold opacity-40">{new Date(p.purchaseDate).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${p.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                              {p.paymentStatus}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-dashed" style={{ borderColor: 'var(--border-color)' }}>
                            <p className="text-[10px] font-bold opacity-40">Purchase Value</p>
                            <p className="text-sm font-black text-indigo-600">₹{p.totalCost?.toLocaleString()}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                        <FaHistory size={40} className="mb-4" />
                        <p className="text-sm font-black uppercase tracking-widest">No order history found</p>
                      </div>
                    )}
                  </div>
                )}

                {drawerActiveTab === "Ledger" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border shadow-inner" style={{ borderColor: 'var(--border-color)' }}>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Total Outbound</p>
                        <p className="text-xl font-black text-indigo-600">
                          ₹{purchases.filter(p => p.supplierId === selectedSupplierForDetails._id).reduce((sum, p) => sum + (p.totalCost || 0), 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 shadow-inner">
                        <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-1">Current Liability</p>
                        <p className="text-xl font-black text-rose-600">
                          ₹{purchases.filter(p => p.supplierId === selectedSupplierForDetails._id && p.paymentStatus !== 'PAID').reduce((sum, p) => sum + (p.totalCost || 0), 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Financial Health</p>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 transition-all duration-1000" 
                          style={{ 
                            width: `${(purchases.filter(p => p.supplierId === selectedSupplierForDetails._id && p.paymentStatus === 'PAID').length / (purchases.filter(p => p.supplierId === selectedSupplierForDetails._id).length || 1)) * 100}%` 
                          }}
                        />
                      </div>
                      <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest text-right">
                        {Math.round((purchases.filter(p => p.supplierId === selectedSupplierForDetails._id && p.paymentStatus === 'PAID').length / (purchases.filter(p => p.supplierId === selectedSupplierForDetails._id).length || 1)) * 100)}% Payment Completion
                      </p>
                    </div>
                  </div>
                )}

                {drawerActiveTab === "Documents" && (
                  <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                    <FaFileCsv size={40} className="mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest">No documents uploaded</p>
                    <button className="mt-4 px-6 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Upload Agreement</button>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-8 border-t flex gap-4 shrink-0" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--surface-2)' }}>
                <button 
                  onClick={() => { onEditSupplier(selectedSupplierForDetails); setSelectedSupplierForDetails(null); }}
                  className="flex-grow py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Edit Profile
                </button>
                <button 
                  onClick={() => setSelectedSupplierForDetails(null)}
                  className="px-8 py-4 border rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
                >
                  Exit
                </button>
              </div>
            </>
          )}
        </div>
    </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, supplierId: null })}
        onConfirm={handleConfirmDeleteSupplier}
        title="Delete Supplier"
        message="Are you sure you want to delete this supplier? This will remove them from the network and may affect linked products/purchases."
        confirmText="Delete Supplier"
      />
    </div>
  );
};

export default ManageSuppliers;
