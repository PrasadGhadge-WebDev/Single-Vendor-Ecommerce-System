import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  FaTimes, FaSearch, FaFileCsv, FaHistory, FaCheckCircle, FaEdit, 
  FaTrash, FaEye, FaPlus, FaEllipsisV, FaDownload, FaPrint, 
  FaWallet, FaRegClock, FaRegCheckCircle, FaChartLine
} from "react-icons/fa";
import API from "../../api";
import { downloadCsv } from "../../utils/adminHelpers";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";
import PurchaseFormModal from "../../components/PurchaseFormModal";
import ConfirmModal from "../../components/ConfirmModal";

const PURCHASES_PER_PAGE = 10;

const ManagePurchases = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingPurchase, setSavingPurchase] = useState(false);
  
  const [purchaseDetailsModal, setPurchaseDetailsModal] = useState(null);
  const [editPurchaseId, setEditPurchaseId] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, purchaseId: null, action: null });
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Filters
  const [purchaseDateFilter, setPurchaseDateFilter] = useState("all");
  const [purchaseSupplierFilter, setPurchaseSupplierFilter] = useState("all");
  const [purchasePaymentStatusFilter, setPurchasePaymentStatusFilter] = useState("all");
  const [purchasePaymentMethodFilter, setPurchasePaymentMethodFilter] = useState("all");
  const [purchaseCategoryFilter, setPurchaseCategoryFilter] = useState("all");
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [purchasePage, setPurchasePage] = useState(1);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const { data } = await API.get("/suppliers");
      setSuppliers(Array.isArray(data) ? data : []);
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
    setLoading(true);
    try {
      const params = {};
      
      if (purchaseDateFilter !== "all") {
        let fromDate = new Date();
        let toDate = new Date();

        if (purchaseDateFilter === "today") {
          fromDate.setHours(0, 0, 0, 0);
          toDate.setHours(23, 59, 59, 999);
        } else if (purchaseDateFilter === "yesterday") {
          fromDate.setDate(fromDate.getDate() - 1);
          fromDate.setHours(0, 0, 0, 0);
          toDate = new Date(fromDate);
          toDate.setHours(23, 59, 59, 999);
        } else if (purchaseDateFilter === "this_month") {
          fromDate.setDate(1);
          fromDate.setHours(0, 0, 0, 0);
          toDate.setHours(23, 59, 59, 999);
        }
        
        params.dateFrom = fromDate.toISOString();
        params.dateTo = toDate.toISOString();
      }

      if (purchaseSupplierFilter !== "all") params.supplierId = purchaseSupplierFilter;
      if (purchasePaymentStatusFilter !== "all") params.paymentStatus = purchasePaymentStatusFilter;
      const { data } = await API.get("/suppliers/purchases", { params });
      setPurchases(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      toast.error("Failed to load purchase records");
    } finally {
      setLoading(false);
    }
  }, [purchaseDateFilter, purchaseSupplierFilter, purchasePaymentStatusFilter]);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSuppliers(), fetchProducts(), fetchPurchases()]);
    setLoading(false);
  }, [fetchSuppliers, fetchProducts, fetchPurchases]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const exportPurchases = () => {
    const csvData = purchases.map(p => ({
      ID: p.purchaseId,
      Supplier: p.supplier?.name || "N/A",
      Product: p.product?.name || "N/A",
      Quantity: p.quantity,
      UnitCost: p.unitCost,
      TotalCost: p.totalCost,
      Date: new Date(p.purchaseDate).toLocaleDateString(),
      PaymentStatus: p.paymentStatus,
      PaymentMethod: p.paymentMethod || "N/A",
      PaidAmount: p.paidAmount || 0,
      InvoiceNumber: p.invoiceNumber || "N/A"
    }));
    downloadCsv(csvData, `purchase-records-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleConfirmAction = async () => {
    if (confirmConfig.action === 'delete-purchase' && confirmConfig.purchaseId) {
      try {
        await API.delete(`/suppliers/purchases/${confirmConfig.purchaseId}`);
        await fetchPurchases();
        toast.success("Purchase record deleted permanently");
      } catch (error) {
        toast.error("Failed to delete purchase record");
      }
    }
    setConfirmConfig({ isOpen: false, purchaseId: null, action: null });
  };

  const markPurchaseAsPaid = async (purchaseId) => {
    try {
      await API.put(`/suppliers/purchases/${purchaseId}/mark-paid`);
      await fetchPurchases();
      toast.success("Purchase marked as PAID successfully");
      setOpenDropdownId(null);
    } catch (error) {
      toast.error("Failed to update payment status");
    }
  };

  const handlePrint = (purchase) => {
    setPurchaseDetailsModal(purchase);
    setOpenDropdownId(null);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const filteredPurchases = purchases.filter(p => {
    const term = purchaseSearch.toLowerCase();
    const matchesSearch = (
      (p.purchaseId && p.purchaseId.toLowerCase().includes(term)) ||
      (p.supplier?.name && p.supplier.name.toLowerCase().includes(term)) ||
      (p.product?.name && p.product.name.toLowerCase().includes(term)) ||
      (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(term))
    );

    const matchesMethod = purchasePaymentMethodFilter === "all" || p.paymentMethod === purchasePaymentMethodFilter;
    const matchesCategory = purchaseCategoryFilter === "all" || p.product?.category === purchaseCategoryFilter;

    return matchesSearch && matchesMethod && matchesCategory;
  });

  const paginatedPurchases = filteredPurchases.slice(
    (purchasePage - 1) * PURCHASES_PER_PAGE,
    purchasePage * PURCHASES_PER_PAGE
  );

  // Derive unique categories for filter
  const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];

  // KPIs
  const totalPurchasesCount = purchases.length;
  const totalPurchaseAmount = purchases.reduce((acc, p) => acc + (p.totalCost || 0), 0);
  const pendingPurchases = purchases.filter(p => p.paymentStatus === "PENDING");
  const pendingAmount = pendingPurchases.reduce((acc, p) => acc + (p.totalCost || 0), 0);
  const paidPurchases = purchases.filter(p => p.paymentStatus === "PAID");
  const paidAmount = paidPurchases.reduce((acc, p) => acc + (p.totalCost || 0), 0);
  const partialPurchases = purchases.filter(p => p.paymentStatus === "PARTIAL");
  const partialAmount = partialPurchases.reduce((acc, p) => acc + (p.totalCost || 0), 0);

  const isFilterActive = 
    purchaseSearch !== "" ||
    purchaseDateFilter !== "all" ||
    purchaseSupplierFilter !== "all" ||
    purchasePaymentStatusFilter !== "all" ||
    purchasePaymentMethodFilter !== "all" ||
    purchaseCategoryFilter !== "all";

  const resetFilters = () => {
    setPurchaseSearch("");
    setPurchaseDateFilter("all");
    setPurchaseSupplierFilter("all");
    setPurchasePaymentStatusFilter("all");
    setPurchasePaymentMethodFilter("all");
    setPurchaseCategoryFilter("all");
    setPurchasePage(1);
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in duration-700" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .fixed.inset-0.z-\\[100\\] * { visibility: visible; }
          .fixed.inset-0.z-\\[100\\] { 
            position: absolute; left: 0; top: 0; width: 100%; height: 100%;
            background: white !important; backdrop-filter: none;
            overflow: visible !important;
          }
          .fixed.inset-0.z-\\[100\\] > div { box-shadow: none !important; border: none !important; max-height: none !important; }
          .fixed.inset-0.z-\\[100\\] button { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0">Purchase Records</h1>
          <p className="text-sm text-gray-500 m-0 mt-1">TRACK AND MANAGE INVENTORY PROCUREMENTS</p>
        </div>

        <div className="flex flex-nowrap items-center gap-3 relative z-10 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          <button 
            onClick={() => setSearchParams({ modal: "purchase" })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 group"
          >
            <FaPlus size={12} className="group-hover:rotate-90 transition-transform" />
            <span>Record Purchase</span>
          </button>
          
          <button 
            onClick={exportPurchases}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border rounded-xl hover:bg-slate-50 transition-all text-xs font-bold shadow-sm" 
            style={{ borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
          >
            <FaFileCsv size={12} className="text-indigo-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Purchases</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalPurchasesCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
              <FaHistory size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Amount</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">₹{totalPurchaseAmount.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
              <FaChartLine size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 dark:bg-rose-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Pending Payments</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">₹{pendingAmount.toLocaleString()}</h3>
              <p className="text-[10px] font-bold text-rose-500 mt-1">{pendingPurchases.length} Records</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
              <FaRegClock size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Paid Purchases</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">₹{paidAmount.toLocaleString()}</h3>
              <p className="text-[10px] font-bold text-emerald-500 mt-1">{paidPurchases.length} Records</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <FaRegCheckCircle size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 dark:bg-amber-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Partial Payments</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">₹{partialAmount.toLocaleString()}</h3>
              <p className="text-[10px] font-bold text-amber-500 mt-1">{partialPurchases.length} Records</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
              <FaWallet size={16} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col min-h-[60vh] overflow-hidden">
        
        {/* Advanced Filter Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex flex-nowrap items-center gap-3 overflow-x-auto hide-scrollbar pb-2">
            <div className="relative w-[220px] shrink-0">
              <input
                type="text"
                placeholder="Search ID, Supplier..."
                value={purchaseSearch}
                onChange={(e) => { setPurchaseSearch(e.target.value); setPurchasePage(1); }}
                className="w-full pl-3 pr-9 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
              />
              <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            </div>

            <select 
              value={purchasePaymentStatusFilter} 
              onChange={(e) => { setPurchasePaymentStatusFilter(e.target.value); setPurchasePage(1); }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium outline-none text-slate-700 dark:text-slate-300 cursor-pointer shrink-0 w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
            </select>

            <select 
              value={purchasePaymentMethodFilter} 
              onChange={(e) => { setPurchasePaymentMethodFilter(e.target.value); setPurchasePage(1); }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium outline-none text-slate-700 dark:text-slate-300 cursor-pointer shrink-0 w-auto"
            >
              <option value="all">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
            </select>

            <select 
              value={purchaseSupplierFilter} 
              onChange={(e) => { setPurchaseSupplierFilter(e.target.value); setPurchasePage(1); }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium outline-none text-slate-700 dark:text-slate-300 cursor-pointer shrink-0 w-auto max-w-[150px]"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>

            <select 
              value={purchaseCategoryFilter} 
              onChange={(e) => { setPurchaseCategoryFilter(e.target.value); setPurchasePage(1); }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium outline-none text-slate-700 dark:text-slate-300 cursor-pointer shrink-0 w-auto max-w-[150px]"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select 
              value={purchaseDateFilter} 
              onChange={(e) => { setPurchaseDateFilter(e.target.value); setPurchasePage(1); }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium outline-none text-slate-700 dark:text-slate-300 cursor-pointer shrink-0 w-auto"
            >
              <option value="all">Creation Date</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_month">This Month</option>
            </select>

            {isFilterActive && (
              <button 
                onClick={resetFilters}
                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5"
              >
                <FaTimes size={10} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Purchase Table */}
        <div className="flex-1 overflow-auto custom-scrollbar relative min-h-[400px]">
          <div className="min-w-full inline-block align-middle w-full">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="w-[12%] px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-60 border-b border-r border-slate-200 dark:border-slate-700">Purchase ID</th>
                  <th className="w-[12%] px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-60 border-b border-r border-slate-200 dark:border-slate-700">Purchase Date</th>
                  <th className="w-[18%] px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-60 border-b border-r border-slate-200 dark:border-slate-700">Supplier Name</th>
                  <th className="w-[20%] px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-60 border-b border-r border-slate-200 dark:border-slate-700">Product Name</th>
                  <th className="w-[8%] px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-60 border-b border-r border-slate-200 dark:border-slate-700 text-center">Quantity</th>
                  <th className="w-[10%] px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-60 border-b border-r border-slate-200 dark:border-slate-700 text-right">Total Cost</th>
                  <th className="w-[10%] px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-60 border-b border-r border-slate-200 dark:border-slate-700 text-center">Payment Status</th>
                  <th className="w-[10%] px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-60 border-b text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedPurchases.length > 0 ? (
                  paginatedPurchases.map((purchase, idx) => (
                    <tr key={purchase._id} className={`group transition-all duration-200 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/30 dark:bg-slate-800/20'} hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5`}>
                      <td className="px-3 py-3 border-r border-slate-100 dark:border-slate-800">
                        <span className="whitespace-nowrap font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded">{purchase.purchaseId || "—"}</span>
                      </td>
                      <td className="px-3 py-3 border-r border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-600">
                        {new Date(purchase.purchaseDate).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-3 py-3 border-r border-slate-100 dark:border-slate-800">
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200">{purchase.supplier?.name || "Unknown"}</div>
                      </td>
                      <td className="px-3 py-3 border-r border-slate-100 dark:border-slate-800">
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200">{purchase.product?.name || "Unknown"}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{purchase.product?.category || "N/A"}</div>
                      </td>
                      <td className="px-3 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                        <div className="text-xs font-black">{purchase.quantity}</div>
                      </td>
                      <td className="px-3 py-3 border-r border-slate-100 dark:border-slate-800 text-right">
                        <div className="font-black text-xs text-slate-800 dark:text-slate-200">₹{purchase.totalCost?.toLocaleString()}</div>
                      </td>
                      <td className="px-3 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-lg ${purchase.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : purchase.paymentStatus === 'PENDING' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {purchase.paymentStatus}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="relative inline-block dropdown-container">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === purchase._id ? null : purchase._id); }}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors"
                          >
                            <FaEllipsisV size={14} />
                          </button>

                          {openDropdownId === purchase._id && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 py-2 z-50 animate-in zoom-in-95 duration-200">
                              <button onClick={() => { setPurchaseDetailsModal(purchase); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-3">
                                <FaEye size={14} className="opacity-50" /> View Details
                              </button>
                              <button onClick={() => { setEditPurchaseId(purchase._id); setSearchParams({ modal: "purchase" }); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-3">
                                <FaEdit size={14} className="opacity-50" /> Edit Record
                              </button>
                              
                              {purchase.invoiceUrl && (
                                <a href={purchase.invoiceUrl} target="_blank" rel="noreferrer" onClick={() => setOpenDropdownId(null)} className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-3">
                                  <FaDownload size={14} className="opacity-50" /> Download Invoice
                                </a>
                              )}
                              
                              <button onClick={() => handlePrint(purchase)} className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-3">
                                <FaPrint size={14} className="opacity-50" /> Print Record
                              </button>

                              {purchase.paymentStatus !== "PAID" && (
                                <>
                                  <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                  <button onClick={() => markPurchaseAsPaid(purchase._id)} className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 flex items-center gap-3">
                                    <FaCheckCircle size={14} className="opacity-50" /> Mark as Paid
                                  </button>
                                </>
                              )}

                              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                              <button onClick={() => { setConfirmConfig({ isOpen: true, purchaseId: purchase._id, action: 'delete-purchase' }); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-3">
                                <FaTrash size={14} className="opacity-50" /> Delete Record
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <FaHistory size={40} className="opacity-20 mb-4" />
                        <h4 className="text-sm font-bold text-slate-600">No Purchase Records Found</h4>
                        <p className="text-xs mt-1">Adjust filters or record a new procurement transaction.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <Pagination
            currentPage={purchasePage}
            totalItems={filteredPurchases.length}
            itemsPerPage={PURCHASES_PER_PAGE}
            onPageChange={setPurchasePage}
          />
        </div>
      </div>

      <PurchaseFormModal
        isOpen={searchParams.get("modal") === "purchase"}
        onClose={() => { setSearchParams({}); setEditPurchaseId(null); }}
        onSave={async (data) => {
          try {
            setSavingPurchase(true);
            const formData = new FormData();
            Object.keys(data).forEach(key => {
              if (key === 'invoiceFile' && data[key]) {
                formData.append('invoiceFile', data[key]);
              } else if (key !== 'invoiceFile' && data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
              }
            });
            
            if (editPurchaseId) {
               await API.put(`/suppliers/purchases/${editPurchaseId}`, formData);
               toast.success("Purchase record updated successfully");
            } else {
               await API.post("/suppliers/purchases", formData);
               toast.success("Procurement transaction successfully recorded");
            }
            await fetchPurchases();
            setSearchParams({});
            setEditPurchaseId(null);
          } catch (error) {
            toast.error(error.response?.data?.message || "Procurement logging failed");
          } finally {
            setSavingPurchase(false);
          }
        }}
        suppliers={suppliers}
        products={products}
        initialData={editPurchaseId ? purchases.find(p => p._id === editPurchaseId) : null}
      />

      {purchaseDetailsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <FaEye className="text-indigo-600" /> Purchase Details
                </h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">ID: {purchaseDetailsModal.purchaseId}</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-2 hover:bg-slate-200 transition-colors text-sm font-bold"
                >
                  <FaPrint /> Print
                </button>
                <button 
                  onClick={() => setPurchaseDetailsModal(null)}
                  className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all text-slate-400"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8 bg-white dark:bg-slate-900">
              
              {/* Top Row: Purchase & Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-800 dark:text-indigo-400 mb-4 border-b border-indigo-200 dark:border-indigo-800/50 pb-2 flex items-center gap-2"><FaHistory /> Purchase Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Purchase ID</span>
                      <span className="text-sm font-bold font-mono">{purchaseDetailsModal.purchaseId}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Date & Time</span>
                      <span className="text-sm font-bold">{new Date(purchaseDetailsModal.purchaseDate).toLocaleString()}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Created By</span>
                      <span className="text-sm font-bold">{purchaseDetailsModal.createdBy?.name || "System/Admin"}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-400 mb-4 border-b border-emerald-200 dark:border-emerald-800/50 pb-2 flex items-center gap-2"><FaWallet /> Payment Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Status</span>
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md mt-0.5 ${purchaseDetailsModal.paymentStatus === 'PAID' ? 'bg-emerald-200 text-emerald-800' : purchaseDetailsModal.paymentStatus === 'PENDING' ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'}`}>
                        {purchaseDetailsModal.paymentStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Method</span>
                      <span className="text-sm font-bold uppercase tracking-wide mt-0.5 inline-block">{purchaseDetailsModal.paymentMethod || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Paid Amount</span>
                      <span className="text-sm font-black text-emerald-600 mt-0.5 inline-block">₹{(purchaseDetailsModal.paidAmount || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Remaining Amount</span>
                      <span className="text-sm font-black text-rose-600 mt-0.5 inline-block">₹{(purchaseDetailsModal.remainingAmount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supplier Info */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 border-b pb-2">Supplier Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Supplier Name</span>
                    <span className="text-sm font-bold">{purchaseDetailsModal.supplier?.name || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Contact Person</span>
                    <span className="text-sm font-bold">{purchaseDetailsModal.supplier?.contactPerson || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Mobile Number</span>
                    <span className="text-sm font-bold">{purchaseDetailsModal.supplier?.mobileNumber || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">GST Number</span>
                    <span className="text-sm font-bold">{purchaseDetailsModal.supplier?.gstNumber || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Product & Cost Info */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 border-b pb-2">Product & Cost Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 mb-4">
                  <div className="col-span-2 md:col-span-1">
                    <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Product Name</span>
                    <span className="text-sm font-bold">{purchaseDetailsModal.product?.name || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Category</span>
                    <span className="text-sm font-bold">{purchaseDetailsModal.product?.category || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">SKU</span>
                    <span className="text-sm font-mono opacity-80">{purchaseDetailsModal.product?.sku || "N/A"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 p-6 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Purchased Qty</span>
                    <span className="text-xl font-black">{purchaseDetailsModal.quantity}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Unit Cost</span>
                    <span className="text-xl font-black text-indigo-600">₹{purchaseDetailsModal.unitCost?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Total Cost</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">₹{purchaseDetailsModal.totalCost?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Invoice & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 border-b pb-2">Invoice Information</h4>
                  <div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 h-full">
                    <div>
                      <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Supplier Invoice Number</span>
                      <span className="text-sm font-mono opacity-80 font-bold mt-1 inline-block">{purchaseDetailsModal.invoiceNumber || "None Provided"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide mb-2">Uploaded Invoice</span>
                      {purchaseDetailsModal.invoiceUrl ? (
                        <a href={purchaseDetailsModal.invoiceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-100 dark:border-indigo-800">
                          <FaDownload size={12} /> Download Document
                        </a>
                      ) : (
                        <span className="text-xs font-bold opacity-50 italic inline-block py-2">No document uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 border-b pb-2">Additional Notes / Remarks</h4>
                  <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-2xl min-h-[120px] border border-amber-100 dark:border-amber-800 h-full">
                    {purchaseDetailsModal.notes ? (
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap leading-relaxed">{purchaseDetailsModal.notes}</p>
                    ) : (
                      <p className="text-xs text-slate-400 italic mt-2">No remarks added for this purchase.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, purchaseId: null, action: null })}
        onConfirm={handleConfirmAction}
        title="Delete Purchase Record"
        message="Are you sure you want to delete this purchase record? This action cannot be undone."
        confirmText="Delete Record"
      />
    </div>
  );
};

export default ManagePurchases;
