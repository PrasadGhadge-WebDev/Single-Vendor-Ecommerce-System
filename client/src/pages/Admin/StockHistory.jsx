import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import API from "../../api";
import { toast } from "react-toastify";
import { downloadCsv } from "../../utils/adminHelpers";
import Pagination from "../../components/Pagination";
import { useNavigate } from "react-router-dom";
import { 
  FaHistory, FaSearch, FaChevronDown, FaSync, FaFileCsv, 
  FaBox, FaUser, FaEllipsisV, FaEye, FaTimes, 
  FaArrowUp, FaArrowDown, FaExchangeAlt, FaPrint, FaCubes, FaClipboardList
} from "react-icons/fa";

const HISTORY_PER_PAGE = 12;

const getEventBadge = (type) => {
  switch (type) {
    case 'PURCHASE':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider"><FaArrowDown size={8}/> Purchase</span>;
    case 'SALE':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider"><FaArrowUp size={8}/> Order</span>;
    case 'CANCELLATION_RESTOCK':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider"><FaExchangeAlt size={8}/> Order Cancelled</span>;
    case 'RETURN':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-wider"><FaExchangeAlt size={8}/> Return</span>;
    case 'MANUAL_ADJUSTMENT':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-wider"><FaHistory size={8}/> Manual Adjustment</span>;
    case 'PURCHASE_UPDATE':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-100 text-teal-700 text-[10px] font-black uppercase tracking-wider"><FaBox size={8}/> Purchase Edit</span>;
    case 'PRODUCT_UPDATE':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-100 text-cyan-700 text-[10px] font-black uppercase tracking-wider"><FaBox size={8}/> Product Update</span>;
    case 'INITIAL_STOCK':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider"><FaCubes size={8}/> Initial Stock</span>;
    default:
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider">{type}</span>;
  }
};

const StockHistory = () => {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState("");
  const [productId, setProductId] = useState("");
  const [movementType, setMovementType] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const navigate = useNavigate();


  const [selectedEntry, setSelectedEntry] = useState(null);
  const [printEntry, setPrintEntry] = useState(null);

  useEffect(() => {
    if (printEntry) {
      setTimeout(() => {
        window.print();
        setPrintEntry(null);
      }, 100);
    }
  }, [printEntry]);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const kpis = useMemo(() => {
    let added = 0;
    let reduced = 0;
    let returns = 0;
    let adjustments = 0;

    items.forEach(item => {
      const change = Number(item.quantityChange);
      if (change > 0) added += change;
      if (change < 0) reduced += Math.abs(change);
      
      if (item.eventType === 'CANCELLATION_RESTOCK' || item.eventType === 'RETURN') returns += Math.abs(change);
      if (item.eventType === 'MANUAL_ADJUSTMENT') adjustments += 1;
    });

    return { total: items.length, added, reduced, returns, adjustments };
  }, [items]);

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await API.get("/products");
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    }
  }, []);

  const fetchHistory = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const params = {};
      if (eventType) params.eventType = eventType;
      if (productId) params.productId = productId;
      if (movementType) params.movementType = movementType;
      if (search.trim()) params.search = search.trim();
            if (dateRange && dateRange !== 'CUSTOM') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);
        
        if (dateRange === 'TODAY') {
          params.dateFrom = today.toISOString();
          params.dateTo = end.toISOString();
        } else if (dateRange === 'LAST_7_DAYS') {
          const start = new Date(today);
          start.setDate(today.getDate() - 7);
          params.dateFrom = start.toISOString();
          params.dateTo = end.toISOString();
        } else if (dateRange === 'LAST_30_DAYS') {
          const start = new Date(today);
          start.setDate(today.getDate() - 30);
          params.dateFrom = start.toISOString();
          params.dateTo = end.toISOString();
        } else if (dateRange === 'THIS_MONTH') {
          const start = new Date(today.getFullYear(), today.getMonth(), 1);
          params.dateFrom = start.toISOString();
          params.dateTo = end.toISOString();
        }
      } else {
        if (dateFrom) params.dateFrom = new Date(dateFrom).toISOString();
        if (dateTo) params.dateTo = new Date(dateTo).toISOString();
      }

      const { data } = await API.get("/stock-history", { params });
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load stock history");
      setItems([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [dateRange, dateFrom, dateTo, eventType, productId, movementType, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const exportHistory = () => {
    if (!items.length) {
      toast.info("No records to export");
      return;
    }
    downloadCsv(
      "inventory_audit_log.csv",
      items.map((entry) => ({
        Date: entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "",
        Product: entry.product?.name || "N/A",
        Event: entry.eventType,
        "Qty Change": entry.quantityChange,
        "Stock Before": entry.previousStock,
        "Stock After": entry.newStock,
        Reference: entry.referenceId || entry.referenceType || "MANUAL",
        "Actor": entry.actor?.name || "System",
      }))
    );
  };

  const totalHistoryPages = Math.max(1, Math.ceil(items.length / HISTORY_PER_PAGE));
  const paginatedHistory = useMemo(() => {
    const startIndex = (historyPage - 1) * HISTORY_PER_PAGE;
    return items.slice(startIndex, startIndex + HISTORY_PER_PAGE);
  }, [items, historyPage]);

  if (selectedEntry) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 sm:p-8 space-y-6 animate-in fade-in duration-700" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
          <button onClick={() => setSelectedEntry(null)} className="hover:text-indigo-600 transition-colors">Stock History</button>
          <span>/</span>
          <span className="text-slate-800 font-bold">Transaction Details</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 m-0">Transaction Details</h1>
            <p className="text-sm text-gray-500 m-0 mt-1">ID: {selectedEntry._id}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <button onClick={() => setSelectedEntry(null)} className="px-5 py-2.5 border rounded-xl font-bold text-sm bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-all" style={{ borderColor: 'var(--border-color)' }}>Back to History</button>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Information */}
          <div className="bg-white p-6 rounded-2xl border shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-3 flex items-center gap-2" style={{ borderColor: 'var(--border-color)' }}>
              <FaBox className="text-indigo-500" /> Product Information
            </h3>
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Product Name</p>
                <p className="text-sm font-semibold text-slate-800">{selectedEntry.product?.name || "Unknown Product"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</p>
                <p className="text-sm font-semibold text-slate-800">{selectedEntry.product?.category || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current DB Stock</p>
                <p className="text-sm font-semibold text-slate-800">{selectedEntry.product?.stock ?? "N/A"} Units</p>
              </div>
            </div>
          </div>

          {/* Stock Movement */}
          <div className="bg-white p-6 rounded-2xl border shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-3 flex items-center gap-2" style={{ borderColor: 'var(--border-color)' }}>
              <FaExchangeAlt className="text-emerald-500" /> Stock Movement
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-center flex flex-col justify-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Previous</p>
                <p className="text-2xl font-black text-slate-700">{selectedEntry.previousStock}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-center flex items-center justify-center">
                <span className={`text-3xl font-black ${Number(selectedEntry.quantityChange) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {Number(selectedEntry.quantityChange) > 0 ? "+" : ""}{selectedEntry.quantityChange}
                </span>
              </div>
              <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100 text-center flex flex-col justify-center">
                <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Updated</p>
                <p className="text-2xl font-black text-indigo-700">{selectedEntry.newStock}</p>
              </div>
            </div>
          </div>

          {/* Transaction Info */}
          <div className="bg-white p-6 rounded-2xl border shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-3 flex items-center gap-2" style={{ borderColor: 'var(--border-color)' }}>
              <FaClipboardList className="text-amber-500" /> Transaction details
            </h3>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Transaction Type</p>
                <div className="mt-1">{getEventBadge(selectedEntry.eventType)}</div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reference Number / Type</p>
                {selectedEntry.referenceId ? (
                  <p className="text-xs font-mono font-bold text-slate-700 bg-slate-50 border border-slate-200 inline-block px-2 py-1 rounded mt-1">{selectedEntry.referenceId}</p>
                ) : (
                  <p className="text-sm font-semibold text-slate-800 mt-1">{selectedEntry.referenceType || "N/A"}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Remarks</p>
                <p className="text-sm font-semibold text-slate-800 whitespace-pre-line">{selectedEntry.note || "No remarks provided for this transaction."}</p>
              </div>
            </div>
          </div>

          {/* Audit Info */}
          <div className="bg-white p-6 rounded-2xl border shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-3 flex items-center gap-2" style={{ borderColor: 'var(--border-color)' }}>
              <FaUser className="text-blue-500" /> Audit Information
            </h3>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Updated By</p>
                <p className="text-sm font-semibold text-slate-800">{selectedEntry.actor?.name || "System"}</p>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
                  <p className="text-sm font-semibold text-slate-800">{new Date(selectedEntry.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Time</p>
                  <p className="text-sm font-semibold text-slate-800">{new Date(selectedEntry.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-8 space-y-6 animate-in fade-in duration-700" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 m-0 tracking-tight">Inventory Ledger</h1>
          <p className="text-xs font-medium text-slate-500 m-0 mt-1">Track and audit all stock movements across your catalog.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => fetchHistory()} className="flex items-center gap-2 px-5 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all text-xs font-bold text-slate-700 shadow-sm">
            <FaSync size={12} className={loading ? "animate-spin" : ""} /> Sync
          </button>
          <button onClick={exportHistory} className="flex items-center gap-2 px-5 py-2 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-all text-xs font-bold text-indigo-700 shadow-sm">
            <FaFileCsv size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Transactions</p>
          <p className="text-2xl font-black text-slate-800">{kpis.total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Added</p>
          <p className="text-2xl font-black text-emerald-600">+{kpis.added} <span className="text-xs font-bold opacity-50">Units</span></p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Returns Received</p>
          <p className="text-2xl font-black text-amber-600">+{kpis.returns} <span className="text-xs font-bold opacity-50">Units</span></p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Manual Adjustments</p>
          <p className="text-2xl font-black text-purple-600">{kpis.adjustments}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Reduced</p>
          <p className="text-2xl font-black text-rose-600">-{kpis.reduced} <span className="text-xs font-bold opacity-50">Units</span></p>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex overflow-x-auto custom-scrollbar gap-4 items-center pb-4">
        <div className="flex-grow min-w-[220px] relative shrink-0">
          <input
            type="text"
            placeholder="Search Product, SKU, or Reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-ellipsis"
          />
          <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        </div>
        
        <div className="relative min-w-[140px] shrink-0">
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 ring-indigo-500/20 transition-all cursor-pointer outline-none appearance-none"
          >
            <option value="">All Products</option>
            {products.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
        </div>

        <div className="relative min-w-[140px] shrink-0">
          <select
            value={movementType}
            onChange={(e) => setMovementType(e.target.value)}
            className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 ring-indigo-500/20 transition-all cursor-pointer outline-none appearance-none"
          >
            <option value="">All Movements</option>
            <option value="INCREASED">Stock Increased (+)</option>
            <option value="REDUCED">Stock Reduced (-)</option>
          </select>
          <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
        </div>

        <div className="relative min-w-[140px] shrink-0">
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 ring-indigo-500/20 transition-all cursor-pointer outline-none appearance-none"
          >
            <option value="">All Transactions</option>
            <option value="PURCHASE">Purchase</option>
            <option value="PURCHASE_UPDATE">Purchase Edit</option>
            <option value="SALE">Order</option>
            <option value="CANCELLATION_RESTOCK">Order Cancelled</option>
            <option value="RETURN">Return</option>
            <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
            <option value="PRODUCT_UPDATE">Product Update</option>
            <option value="INITIAL_STOCK">Initial Stock</option>
          </select>
          <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
        </div>

        <div className="relative min-w-[130px] shrink-0">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 ring-indigo-500/20 transition-all cursor-pointer outline-none appearance-none"
          >
            <option value="">All Time</option>
            <option value="TODAY">Today</option>
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="LAST_30_DAYS">Last 30 Days</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="CUSTOM">Custom Range</option>
          </select>
          <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
        </div>

        {dateRange === 'CUSTOM' && (
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
              title="From Date"
            />
            <span className="text-slate-400 font-bold">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
              title="To Date"
            />
          </div>
        )}

        {(search || eventType || productId || movementType || dateRange || dateFrom || dateTo) && (
          <button 
            onClick={() => {
              setSearch(""); setEventType(""); setProductId(""); setMovementType(""); setDateRange(""); setDateFrom(""); setDateTo("");
              fetchHistory(true);
            }}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors shrink-0"
          >
            Reset
          </button>
        )}
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-r border-slate-200">Date & Time</th>
                <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-r border-slate-200 w-1/4">Product & Reference</th>
                <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-r border-slate-200 text-center">Transaction Type</th>
                <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-r border-slate-200 text-center">Previous Stock</th>
                <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-r border-slate-200 text-center">Stock Change</th>
                <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-r border-slate-200 text-center">Updated Stock</th>
                <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-r border-slate-200 text-center">Updated By</th>
                <th className="w-[60px] px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedHistory.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <FaHistory className="text-slate-300 text-2xl" />
                      </div>
                      <p className="text-xs font-bold text-slate-500">No inventory records found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedHistory.map((entry, idx) => {
                  const isPositive = Number(entry.quantityChange) >= 0;
                  const isZero = Number(entry.quantityChange) === 0;
                  return (
                    <tr 
                      key={entry._id} 
                      className={`group transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-indigo-50/30`}
                    >
                      <td className="px-3 py-3 border-r border-slate-100 whitespace-nowrap">
                        <p className="text-xs font-bold text-slate-700">{new Date(entry.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        <p className="text-[10px] font-medium text-slate-400">{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-3 py-3 border-r border-slate-100">
                        <p className="text-xs font-bold text-slate-800 line-clamp-2">{entry.product?.name || <span className="text-rose-500 italic">Unknown Product</span>}</p>
                        {entry.referenceId && (
                          <div className="mt-1">
                            <span className="font-mono text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                              Ref: {entry.referenceId}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 border-r border-slate-100 whitespace-nowrap text-center">
                        {getEventBadge(entry.eventType)}
                      </td>
                      <td className="px-3 py-3 border-r border-slate-100 text-center whitespace-nowrap">
                        <span className="font-bold text-xs text-slate-500">{entry.previousStock}</span>
                      </td>
                      <td className="px-3 py-3 border-r border-slate-100 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center font-black text-xs ${isZero ? 'text-slate-400' : isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isPositive && !isZero ? "+" : ""}{entry.quantityChange}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-r border-slate-100 text-center whitespace-nowrap">
                        <span className="font-black text-xs text-slate-800">{entry.newStock}</span>
                      </td>
                      <td className="px-3 py-3 border-r border-slate-100 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                            <FaUser size={8} className="text-indigo-600" />
                          </div>
                          <span className="text-xs font-bold text-slate-600">{entry.actor?.name || "System"}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="relative inline-block dropdown-container">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === entry._id ? null : entry._id); }}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <FaEllipsisV size={12} />
                          </button>
                          {openDropdownId === entry._id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-50 animate-in zoom-in-95 duration-200">
                              <button 
                                onClick={() => { setSelectedEntry(entry); setOpenDropdownId(null); }} 
                                className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                              >
                                <FaEye size={12} /> View Details
                              </button>

                              {entry.referenceType === 'PURCHASE' && (
                                <button 
                                  onClick={() => { navigate('/admin/purchases'); setOpenDropdownId(null); }} 
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100 mt-1"
                                >
                                  <FaBox size={12} className="text-slate-400" /> View Related Purchase
                                </button>
                              )}
                              {entry.referenceType === 'SALE' && (
                                <button 
                                  onClick={() => { navigate('/admin/orders'); setOpenDropdownId(null); }} 
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100 mt-1"
                                >
                                  <FaBox size={12} className="text-slate-400" /> View Related Order
                                </button>
                              )}
                              {entry.referenceType === 'PRODUCT' && (
                                <button 
                                  onClick={() => { navigate('/admin/products'); setOpenDropdownId(null); }} 
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100 mt-1"
                                >
                                  <FaBox size={12} className="text-slate-400" /> View Related Product
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination currentPage={historyPage} totalPages={totalHistoryPages} onPageChange={setHistoryPage} />


    </div>
  );
};

export default StockHistory;
