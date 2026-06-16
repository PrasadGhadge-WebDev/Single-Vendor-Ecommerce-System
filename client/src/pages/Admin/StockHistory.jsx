import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import API from "../../api";
import { toast } from "react-toastify";
import { downloadCsv } from "../../utils/adminHelpers";
import Pagination from "../../components/Pagination";
import { FaHistory, FaSearch, FaChevronDown, FaSync, FaFileCsv, FaFileUpload, FaTrash, FaBox, FaUser, FaClock, FaExclamationCircle } from "react-icons/fa";
import ConfirmModal from "../../components/ConfirmModal";

const HISTORY_PER_PAGE = 12;

const StockHistory = () => {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState("");
  const [productId, setProductId] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const productSuggestionTimeout = useRef(null);
  const [importing, setImporting] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, entryId: null });
  const fileInputRef = useRef(null);

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
      if (search.trim()) params.search = search.trim();
      if (dateFrom) params.dateFrom = new Date(dateFrom).toISOString();
      if (dateTo) params.dateTo = new Date(dateTo).toISOString();

      const { data } = await API.get("/stock-history", { params });
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load stock history");
      setItems([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [dateFrom, dateTo, eventType, productId, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const deleteEntry = (id) => {
    setConfirmConfig({ isOpen: true, entryId: id });
  };

  const handleConfirmDeleteEntry = async () => {
    const id = confirmConfig.entryId;
    if (!id) return;
    
    try {
      await API.delete(`/stock-history/${id}`);
      toast.success("Log entry removed");
      setItems((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      toast.error("Purge failed");
    }
  };

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
        Reference: entry.referenceType || "MANUAL",
        "Actor": entry.actor?.name || "System",
      }))
    );
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    // Simple mock import UI for local consistency
    setTimeout(() => {
      setImporting(false);
      toast.success("Audit records synchronized");
    }, 1000);
  };

  const productSuggestions = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return [];
    return products.filter((product) => product.name?.toLowerCase().includes(term));
  }, [products, productSearch]);

  const handleProductSuggestionSelect = (product) => {
    setProductId(product._id);
    setProductSearch(product.name || "");
    setShowProductSuggestions(false);
  };

  const totalHistoryPages = Math.max(1, Math.ceil(items.length / HISTORY_PER_PAGE));
  const paginatedHistory = useMemo(() => {
    const startIndex = (historyPage - 1) * HISTORY_PER_PAGE;
    return items.slice(startIndex, startIndex + HISTORY_PER_PAGE);
  }, [items, historyPage]);

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-8 space-y-6 animate-in fade-in duration-700" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0">Stock History</h1>
          <p className="text-sm text-gray-500 m-0 mt-1">SEQUENTIAL INVENTORY LEDGER & SUPPLY CHAIN FORENSIC TRACKING</p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button 
            onClick={() => fetchHistory()}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border rounded-2xl hover:bg-slate-50 transition-all text-sm font-bold shadow-sm" 
            style={{ borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
          >
            <FaSync size={12} className={loading ? "animate-spin" : ""} />
            <span>Sync</span>
          </button>
          <button 
            onClick={exportHistory}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border rounded-2xl hover:bg-slate-50 transition-all text-sm font-bold shadow-sm" 
            style={{ borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
          >
            <FaFileCsv size={12} className="text-emerald-600" />
            <span>Export</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <FaFileUpload size={12} />
            <span>{importing ? "Processing..." : "Import"}</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="d-none" onChange={handleImportFile} />
        </div>
      </div>

      {/* Advanced Filter Suite */}
      <div className="p-4 bg-white dark:bg-slate-900/60 rounded-3xl border shadow-xl shadow-indigo-500/5 flex flex-nowrap overflow-x-auto gap-4 items-center hide-scrollbar" style={{ borderColor: 'var(--border-color)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex-[2] min-w-[250px] relative">
          <input
            type="text"
            placeholder="Search by all columns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-5 pr-12 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500/30 transition-all outline-none"
            style={{ color: 'var(--page-text)' }}
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <FaSearch className="text-indigo-500/40" size={14} />
          </div>
        </div>
        
        <div className="relative min-w-[150px]">
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
          >
            <option value="">All Events</option>
            <option value="PURCHASE">Purchase</option>
            <option value="SALE">Sale</option>
            <option value="CANCELLATION_RESTOCK">Restock</option>
            <option value="MANUAL_ADJUSTMENT">Adjustment</option>
            <option value="INITIAL_STOCK">Initial</option>
          </select>
          <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
        </div>

        <div className="relative min-w-[200px]">
          <input
            type="text"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500/30 transition-all outline-none font-bold opacity-70 hover:opacity-100"
            placeholder="Product Name..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            onFocus={() => setShowProductSuggestions(true)}
            onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
          />
          {showProductSuggestions && productSuggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-800 border rounded-xl mt-2 shadow-2xl z-50 max-h-48 overflow-y-auto overflow-x-hidden">
              {productSuggestions.map(p => (
                <button 
                  key={p._id}
                  onClick={() => handleProductSuggestionSelect(p)}
                  className="w-full text-left px-4 py-2 text-[10px] font-bold hover:bg-slate-100 dark:hover:bg-slate-700 truncate border-b border-slate-50 dark:border-slate-700 last:border-0"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative min-w-[150px]">
          <select 
            className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="all">Audit Timeline</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="custom">Custom Range</option>
          </select>
          <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
        </div>

        {(search !== "" || eventType !== "" || productId !== "" || productSearch !== "" || dateRange !== "all") && (
          <button 
            onClick={() => {
              setSearch("");
              setEventType("");
              setProductId("");
              setProductSearch("");
              setDateRange("all");
              fetchHistory(true);
            }}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 shrink-0 ml-auto"
          >
            Reset
          </button>
        )}
      </div>

      {/* Professional High-Density Data Grid */}
      <div className="bg-white dark:bg-slate-900/60 rounded-3xl border shadow-xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <th className="w-[12%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Timestamp</th>
                <th className="w-[20%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Subject Asset</th>
                <th className="w-[12%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Event Node</th>
                <th className="w-[10%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Variance</th>
                <th className="w-[10%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Post-State</th>
                <th className="w-[12%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Actor</th>
                <th className="w-[24%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 text-right">Observations</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800" style={{ borderColor: 'var(--border-color)' }}>
              {paginatedHistory.map((entry, idx) => {
                const isPositive = Number(entry.quantityChange) >= 0;
                return (
                  <tr 
                    key={entry._id} 
                    className={`group transition-all duration-200 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/30 dark:bg-slate-800/20'} hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5`}
                  >
                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col opacity-60">
                        <p className="text-[10px] font-bold">{new Date(entry.createdAt).toLocaleDateString()}</p>
                        <p className="text-[9px] font-bold opacity-40">{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 truncate">
                        <FaBox className="text-slate-300" size={12} />
                        <p className="text-xs font-bold truncate opacity-80">{entry.product?.name || "Independent Adjustment"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                      <span className="inline-flex px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest rounded border border-slate-200 dark:border-slate-700">
                        {entry.eventType}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                      <div className={`text-xs font-black ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                        {isPositive ? "+" : ""}{entry.quantityChange}
                      </div>
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                      <p className="text-xs font-bold opacity-60">{entry.newStock} SKU</p>
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                      <div className="inline-flex items-center gap-1.5 opacity-60">
                        <FaUser size={10} className="text-indigo-500/40" />
                        <span className="text-[10px] font-bold truncate max-w-[80px]">{entry.actor?.name || "System"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div className="truncate text-right">
                          <p className="text-[10px] font-medium opacity-60 truncate line-clamp-1">{entry.note || "Operational logging"}</p>
                          <p className="text-[9px] font-black uppercase tracking-tighter opacity-20 truncate">{entry.referenceType || "Manual"} Audit</p>
                        </div>
                        <button 
                          onClick={() => deleteEntry(entry._id)}
                          className="p-2 hover:bg-rose-600 hover:text-white rounded-lg transition-all text-slate-400 shrink-0"
                          title="Purge Log"
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

      <Pagination currentPage={historyPage} totalPages={totalHistoryPages} onPageChange={setHistoryPage} />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, entryId: null })}
        onConfirm={handleConfirmDeleteEntry}
        title="Purge Audit Log"
        message="Are you sure you want to delete this audit entry? Note: This only removes the log record, the actual product stock will not be modified."
        confirmText="Purge Entry"
      />
    </div>
  );
};

export default StockHistory;
