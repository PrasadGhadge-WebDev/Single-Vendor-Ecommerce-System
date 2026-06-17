import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { FaPlus, FaTimes, FaSearch, FaFileCsv, FaSync, FaTruck, FaChartLine, FaHistory, FaMapMarkerAlt, FaEnvelope, FaPhoneAlt, FaBuilding, FaCheckCircle, FaExclamationCircle, FaUserTag, FaCalendarAlt, FaBriefcase, FaChevronDown, FaBoxOpen, FaEllipsisV, FaEye, FaEdit, FaPowerOff, FaTrash } from "react-icons/fa";
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
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, supplierId: null });
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const [loading, setLoading] = useState(false);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [activeModuleSection, setActiveModuleSection] = useState("suppliers");
  const [selectedSupplierForDetails, setSelectedSupplierForDetails] = useState(null);
  const [selectedSupplierForPurchases, setSelectedSupplierForPurchases] = useState(null);
  const [purchaseDetailsModal, setPurchaseDetailsModal] = useState(null);
  const [editPurchaseId, setEditPurchaseId] = useState(null);
  const [drawerActiveTab, setDrawerActiveTab] = useState("Overview");

  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierStatusFilter, setSupplierStatusFilter] = useState("all");
  const [supplierContactFilter, setSupplierContactFilter] = useState("");
  const [supplierMobileFilter, setSupplierMobileFilter] = useState("");
  const [supplierCityFilter, setSupplierCityFilter] = useState("");
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
  }, [purchaseSupplierFilter, purchasePaymentStatusFilter, purchaseDateFrom, purchaseDateTo]);

  const handleMarkPaid = async (purchaseId) => {
    try {
      await API.put(`/suppliers/purchases/${purchaseId}/mark-paid`);
      toast.success("Purchase marked as paid");
      fetchPurchases();
    } catch (err) {
      toast.error("Failed to mark purchase as paid");
    }
  };

  const handleConfirmAction = async () => {
    if (confirmConfig.action === 'delete-purchase') {
      try {
        await API.delete(`/suppliers/purchases/${confirmConfig.purchaseId}`);
        toast.success("Purchase record deleted");
        fetchPurchases();
        setConfirmConfig({ isOpen: false });
      } catch (err) {
        toast.error("Failed to delete purchase record");
      }
      return;
    }
    // existing supplier delete
    try {
      await API.delete(`/suppliers/${confirmConfig.supplierId}`);
      await fetchSuppliers();
      setConfirmConfig({ isOpen: false, supplierId: null });
      toast.success("Supplier deleted successfully");
    } catch (error) {
      toast.error("Failed to delete supplier");
    }
  };

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
      toast.success("Supplier deleted successfully");
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
      if (supplierCategoryFilter !== "all" && supplier.category !== supplierCategoryFilter) return false;
      if ((supplierDateFrom || supplierDateTo) && !inDateRange(supplier.createdAt, supplierDateFrom, supplierDateTo)) return false;
      if (!term) return true;
      const haystack = `${supplier.name} ${supplier.company || ""} ${supplier.email || ""} ${supplier.mobileNumber || supplier.phone || ""} ${supplier.gstNumber || ""} ${supplier.contactPerson || ""} ${supplier.city || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [suppliers, supplierSearch, supplierStatusFilter, supplierContactFilter, supplierMobileFilter, supplierCityFilter, supplierCategoryFilter, supplierDateFrom, supplierDateTo]);

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
      "suppliers_data.csv",
      filteredSuppliers.map((supplier) => ({
        "Supplier Name": supplier.name,
        "Company": supplier.company || "N/A",
        "Email Address": supplier.email || "N/A",
        "Contact Phone": supplier.mobileNumber || supplier.phone || "N/A",
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

  if (selectedSupplierForDetails) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 sm:p-8 space-y-6 animate-in fade-in duration-700" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
          <button onClick={() => setSelectedSupplierForDetails(null)} className="hover:text-indigo-600 transition-colors">Suppliers</button>
          <span>/</span>
          <span className="text-slate-800 font-bold">Supplier Details</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 m-0">Supplier Details</h1>
            <p className="text-sm text-gray-500 m-0 mt-1">ID: {selectedSupplierForDetails._id}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <button onClick={() => setSelectedSupplierForDetails(null)} className="px-5 py-2.5 border rounded-xl font-bold text-sm bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-all" style={{ borderColor: 'var(--border-color)' }}>Back to Suppliers</button>
             <button onClick={() => handleToggleStatus(selectedSupplierForDetails._id, !selectedSupplierForDetails.isActive)} className={`px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all ${selectedSupplierForDetails.isActive ? "bg-rose-100 text-rose-700 hover:bg-rose-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}>
               {selectedSupplierForDetails.isActive ? "Deactivate Supplier" : "Activate Supplier"}
             </button>
             <button onClick={() => { onEditSupplier(selectedSupplierForDetails); setSelectedSupplierForDetails(null); }} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all">Edit Supplier</button>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${selectedSupplierForDetails.isActive ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedSupplierForDetails.isActive ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
              {selectedSupplierForDetails.isActive ? <FaCheckCircle size={20} /> : <FaExclamationCircle size={20} />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Account Status: {selectedSupplierForDetails.isActive ? "Active" : "Inactive"}</p>
              <p className="text-xs text-slate-500">
                Created: {new Date(selectedSupplierForDetails.createdAt).toLocaleDateString()} 
                {selectedSupplierForDetails.updatedAt && ` • Last Updated: ${new Date(selectedSupplierForDetails.updatedAt).toLocaleDateString()}`}
              </p>
            </div>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>Basic Information</h3>
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supplier Name</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedSupplierForDetails.name}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Person</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedSupplierForDetails.contactPerson || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedSupplierForDetails.mobileNumber || selectedSupplierForDetails.phone || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 break-all">{selectedSupplierForDetails.email || "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">GST Number</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedSupplierForDetails.gstNumber || "—"}</p>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>Address Information</h3>
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Address</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedSupplierForDetails.address || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">City</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedSupplierForDetails.city || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">State</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedSupplierForDetails.state || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pincode</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedSupplierForDetails.pincode || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Country</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedSupplierForDetails.country || "—"}</p>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>Business Information</h3>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Company Name</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedSupplierForDetails.company || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Website</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 break-all">
                  {selectedSupplierForDetails.website ? (
                    <a href={selectedSupplierForDetails.website.startsWith('http') ? selectedSupplierForDetails.website : `https://${selectedSupplierForDetails.website}`} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                      {selectedSupplierForDetails.website}
                    </a>
                  ) : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 whitespace-pre-line">{selectedSupplierForDetails.notes || "—"}</p>
              </div>
            </div>
          </div>

          {/* Banking Information */}
          {selectedSupplierForDetails.bankDetails && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>Banking Information</h3>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bank Name</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedSupplierForDetails.bankDetails.bankName || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Name</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedSupplierForDetails.bankDetails.accountName || "—"}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Number</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {selectedSupplierForDetails.bankDetails.accountNumber ? `•••• ${selectedSupplierForDetails.bankDetails.accountNumber.slice(-4)}` : "—"}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">IFSC Code</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedSupplierForDetails.bankDetails.ifscCode || "—"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Purchase Summary */}
          <div className={`bg-white dark:bg-slate-800 p-6 rounded-2xl border shadow-sm ${!selectedSupplierForDetails.bankDetails ? 'col-span-1 md:col-span-2' : ''}`} style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>Purchase Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Products</p>
                <p className="text-2xl font-black text-indigo-600">{products.filter(p => String(p.supplier?._id || p.supplier) === String(selectedSupplierForDetails._id)).length}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Purchase Value</p>
                <p className="text-2xl font-black text-emerald-600">
                  ₹{purchases.filter(p => p.supplierId === selectedSupplierForDetails._id).reduce((sum, p) => sum + (p.totalCost || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Supply</p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  {purchases.filter(p => p.supplierId === selectedSupplierForDetails._id).length > 0 
                    ? new Date(Math.max(...purchases.filter(p => p.supplierId === selectedSupplierForDetails._id).map(p => new Date(p.purchaseDate || p.createdAt).getTime()))).toLocaleDateString()
                    : "N/A"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Supplied Products Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-sm overflow-hidden mt-6" style={{ borderColor: 'var(--border-color)' }}>
          <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Supplied Products</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Current Stock</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Purchase Price</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Supply Date</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {products.filter(p => String(p.supplier?._id || p.supplier) === String(selectedSupplierForDetails._id)).length > 0 ? (
                  products.filter(p => String(p.supplier?._id || p.supplier) === String(selectedSupplierForDetails._id)).map(product => {
                    const relatedPurchases = purchases.filter(p => p.productId === product._id && p.supplierId === selectedSupplierForDetails._id);
                    const lastSupplyDate = relatedPurchases.length > 0 
                      ? new Date(Math.max(...relatedPurchases.map(p => new Date(p.purchaseDate || p.createdAt).getTime()))).toLocaleDateString()
                      : "N/A";
                    const lastPurchasePrice = relatedPurchases.length > 0
                      ? relatedPurchases.sort((a,b) => new Date(b.purchaseDate || b.createdAt) - new Date(a.purchaseDate || a.createdAt))[0].unitCost
                      : (product.price || 0);

                    return (
                      <tr key={product._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-6 py-4 text-sm font-bold text-slate-800">{product.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{product.category || "—"}</td>
                        <td className="px-6 py-4 text-sm text-center">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${product.stock > 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">₹{lastPurchasePrice.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 text-right font-medium">{lastSupplyDate}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500 text-sm">No products supplied yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in duration-700" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0">Suppliers</h1>
          <p className="text-sm text-gray-500 m-0 mt-1">STRATEGIC SOURCING & VENDOR RELATIONSHIP INTELLIGENCE</p>
        </div>

        <div className="flex flex-nowrap items-center gap-3 relative z-10 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          <button 
            onClick={openAddSupplier}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 group"
          >
            <FaPlus size={12} className="group-hover:rotate-90 transition-transform" />
            <span>New Supplier</span>
          </button>
          
          <button 
            onClick={() => navigate("/admin/purchases")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 rounded-xl font-bold text-xs shadow-sm hover:bg-purple-200 dark:hover:bg-purple-500/30 transition-all active:scale-95"
          >
            <FaHistory size={12} />
            <span>Purchase List</span>
          </button>
          
          <button 
            onClick={() => { setActiveModuleSection("record-purchase"); setSearchParams({ modal: "purchase" }); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xl shadow-slate-800/20 hover:bg-slate-900 transition-all active:scale-95"
          >
            <FaHistory size={12} />
            <span>Record Purchase</span>
          </button>

          <button 
            onClick={activeModuleSection === "suppliers" ? exportSuppliers : exportPurchases}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border rounded-xl hover:bg-slate-50 transition-all text-xs font-bold shadow-sm" 
            style={{ borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
          >
            <FaFileCsv size={12} className="text-indigo-600" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* High-Performance KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: "Total Suppliers", 
            value: suppliers.length, 
            icon: FaBuilding, 
            color: "indigo"
          },
          { 
            label: "Active Suppliers", 
            value: suppliers.filter(s => s.isActive).length, 
            icon: FaCheckCircle, 
            color: "emerald"
          },
          { 
            label: "Inactive Suppliers", 
            value: suppliers.filter(s => !s.isActive).length, 
            icon: FaTimes, 
            color: "rose"
          },
          { 
            label: "Total Products Supplied", 
            value: products.filter(p => p.supplier).length, 
            icon: FaBoxOpen, 
            color: "blue"
          }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1" style={{ borderColor: 'var(--border-color)' }}>
            <div className={`w-12 h-12 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-500/10 text-${stat.color}-600 flex items-center justify-center shrink-0`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic Content Display */}
      <div className="min-h-[500px]">
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Advanced Supplier Filters */}
            <div id="intelligent-filters" className="bg-white dark:bg-slate-900 rounded-xl border shadow-sm p-3 flex flex-wrap overflow-visible gap-3 items-center mb-6" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex-[4] min-w-[250px] relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={14} />
                <input
                  type="text"
                  placeholder="Search by Name, Contact, Mobile, City..."
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  className="w-full pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 ring-indigo-500/20 transition-all outline-none"
                  style={{ color: 'var(--page-text)', paddingLeft: '2.5rem' }}
                />
              </div>

              <div className="relative min-w-[160px]">
                <select
                  value={supplierStatusFilter}
                  onChange={(e) => setSupplierStatusFilter(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 ring-indigo-500/20 transition-all cursor-pointer outline-none appearance-none font-semibold text-slate-700 dark:text-slate-300"
                >
                  <option value="all">Status: All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
              </div>

              {(supplierSearch !== "" || supplierStatusFilter !== "all" || supplierCategoryFilter !== "all") && (
                <button 
                  onClick={() => {
                    setSupplierSearch("");
                    setSupplierStatusFilter("all");
                    setSupplierCategoryFilter("all");
                    fetchSuppliers();
                  }}
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 shrink-0 ml-auto"
                >
                  Reset
                </button>
              )}
            </div>
            {/* Professional High-Density Supplier Grid */}
            <div className="bg-white dark:bg-slate-900/60 rounded-3xl border shadow-sm overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse table-auto min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <th className="w-[10%] px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Supplier ID</th>
                      <th className="w-[18%] px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Supplier Name</th>
                      <th className="w-[15%] px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Contact & City</th>
                      <th className="w-[18%] px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Contact Info</th>
                      <th className="w-[10%] px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Products</th>
                      <th className="w-[12%] px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Status</th>
                      <th className="w-[12%] px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Created Date</th>
                      <th className="w-[8%] px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-60 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800" style={{ borderColor: 'var(--border-color)' }}>
                    {paginatedSuppliers.map((supplier, idx) => {
                      const supplierProductsCount = products.filter(p => String(p.supplier?._id || p.supplier) === String(supplier._id)).length;
                      
                      return (
                        <tr 
                          key={supplier._id} 
                          className={`group transition-all duration-200 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/30 dark:bg-slate-800/20'} hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5`}
                        >
                          <td className="px-3 py-2 border-r border-slate-100 dark:border-slate-800 font-mono text-xs opacity-70">
                            {supplier._id?.slice(-8).toUpperCase()}
                          </td>
                          <td className="px-3 py-2 border-r border-slate-100 dark:border-slate-800">
                            <div className="font-bold text-xs whitespace-normal break-words leading-tight" style={{ color: 'var(--page-text)' }}>{supplier.name}</div>
                          </td>
                          <td className="px-3 py-2 border-r border-slate-100 dark:border-slate-800">
                            <div className="font-semibold text-xs whitespace-normal break-words opacity-90 leading-tight">{supplier.contactPerson || supplier.company || "—"}</div>
                            <div className="text-[10px] font-medium opacity-60 whitespace-normal break-words mt-0.5 flex items-start gap-1"><FaMapMarkerAlt size={8} className="mt-0.5 shrink-0" /> <span>{supplier.city || "No City"}</span></div>
                          </td>
                          <td className="px-3 py-2 border-r border-slate-100 dark:border-slate-800">
                            <div className="text-xs font-medium opacity-80 flex items-center gap-1.5 whitespace-nowrap leading-tight"><FaPhoneAlt size={8} className="opacity-50 shrink-0" /> {supplier.mobileNumber || supplier.phone || "—"}</div>
                            <div className="text-[10px] font-medium opacity-60 whitespace-normal break-all mt-0.5 flex items-start gap-1.5"><FaEnvelope size={8} className="opacity-50 mt-0.5 shrink-0" /> <span>{supplier.email || "—"}</span></div>
                          </td>
                          <td className="px-3 py-2 border-r border-slate-100 dark:border-slate-800 text-center">
                            <span className="inline-flex items-center justify-center min-w-[24px] h-6 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-black">
                              {supplierProductsCount}
                            </span>
                          </td>
                          <td className="px-3 py-2 border-r border-slate-100 dark:border-slate-800 text-center">
                            <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest leading-none ${
                              supplier.isActive 
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" 
                                : "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400"
                            }`}>
                              {supplier.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-3 py-2 border-r border-slate-100 dark:border-slate-800 text-center font-mono text-[10px] opacity-70">
                            {new Date(supplier.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-')}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-center gap-2 relative dropdown-container">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(openDropdownId === supplier._id ? null : supplier._id);
                                }}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-500 inline-flex items-center justify-center"
                              >
                                <FaEllipsisV size={14} />
                              </button>
                            
                            {/* Dropdown Menu */}
                            {openDropdownId === supplier._id && (
                              <div className="absolute right-8 top-10 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      setSelectedSupplierForDetails(supplier);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 transition-colors"
                                  >
                                    <FaEye className="text-indigo-500" /> View Details
                                  </button>
                                  <button
                                    onClick={() => {
                                      onEditSupplier(supplier);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 transition-colors"
                                  >
                                    <FaEdit className="text-blue-500" /> Edit Supplier
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedSupplierForDetails(supplier);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 transition-colors"
                                  >
                                    <FaBoxOpen className="text-emerald-500" /> View Supplied Products
                                  </button>

                                  {supplier.isActive ? (
                                    <button
                                      onClick={async () => {
                                        try {
                                          await API.put(`/suppliers/${supplier._id}`, { isActive: false });
                                          await fetchSuppliers();
                                          toast.success("Supplier deactivated");
                                        } catch (e) {
                                          toast.error("Failed to update status");
                                        }
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-amber-600 transition-colors"
                                    >
                                      <FaPowerOff /> Deactivate Supplier
                                    </button>
                                  ) : (
                                    <button
                                      onClick={async () => {
                                        try {
                                          await API.put(`/suppliers/${supplier._id}`, { isActive: true });
                                          await fetchSuppliers();
                                          toast.success("Supplier activated");
                                        } catch (e) {
                                          toast.error("Failed to update status");
                                        }
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-emerald-600 transition-colors"
                                    >
                                      <FaCheckCircle /> Activate Supplier
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      setConfirmConfig({ isOpen: true, supplierId: supplier._id, action: 'delete-supplier' });
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-rose-600 transition-colors"
                                  >
                                    <FaTrash /> Delete Supplier
                                  </button>
                                </div>
                              </div>
                            )}
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
        {activeModuleSection === "recent-purchases" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Dynamic History Filters */}
            <div id="purchase-filters" className="card p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row flex-wrap gap-4 items-center hide-scrollbar w-full" style={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--border-color)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="flex-1 w-full md:w-auto min-w-[250px] relative">
                <input
                  type="text"
                  placeholder="Search by all columns..."
                  value={purchaseSupplierFilterSearch}
                  onChange={(e) => setPurchaseSupplierFilterSearch(e.target.value)}
                  onFocus={handleFilterSupplierInputFocus}
                  onBlur={handleFilterSupplierInputBlur}
                  className="w-full pl-5 pr-12 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500/30 transition-all outline-none"
                  style={{ color: 'var(--page-text)' }}
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                  <FaSearch className="text-indigo-500/40" size={14} />
                </div>
                
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
              
              <div className="relative flex-1 w-full md:w-auto min-w-[150px]">
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

              <div className="relative flex-1 w-full md:w-auto min-w-[150px]">
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

              {(purchaseSupplierFilterSearch !== "" || purchasePaymentStatusFilter !== "all" || purchaseSupplierFilter !== "all") && (
                <button 
                  onClick={() => {
                    setPurchaseSupplierFilter("all");
                    setPurchaseSupplierFilterSearch("");
                    setPurchasePaymentStatusFilter("all");
                  }}
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 shrink-0 ml-auto"
                >
                  Reset
                </button>
              )}

              <button 
                onClick={exportPurchases}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/10 border rounded-xl font-black text-[9px] uppercase tracking-widest transition-all hover:bg-indigo-100 dark:hover:bg-indigo-900/20 shadow-sm whitespace-nowrap shrink-0"
                style={{ color: 'var(--page-text)', borderColor: 'var(--border-color)' }}
              >
                <FaFileCsv size={13} className="text-indigo-600" />
                <span className="hidden md:inline">Export</span>
              </button>
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

        {activeModuleSection === "supplier-purchases" && selectedSupplierForPurchases && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black" style={{ color: 'var(--page-text)' }}>Supplier Purchases</h2>
                <p className="text-sm font-bold opacity-60 mt-1">Showing purchases for: <span className="text-indigo-600">{selectedSupplierForPurchases.name}</span></p>
              </div>
              <button 
                onClick={() => {
                  setActiveModuleSection("suppliers");
                  setSelectedSupplierForPurchases(null);
                }}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm text-sm"
              >
                Back to Suppliers
              </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(() => {
                const sp = purchases.filter(p => p.supplier && p.supplier._id === selectedSupplierForPurchases._id);
                const totalPurchases = sp.length;
                const totalAmount = sp.reduce((sum, p) => sum + (p.totalCost || 0), 0);
                const pendingPayments = sp.reduce((sum, p) => sum + (p.remainingAmount || 0), 0);
                const paidPurchases = sp.filter(p => p.paymentStatus === "PAID").length;
                
                return (
                  <>
                    <div className="card p-6 rounded-[2rem] border shadow-sm flex flex-col justify-between" style={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--border-color)' }}>
                      <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-2">Total Purchases</p>
                      <h3 className="text-3xl font-black" style={{ color: 'var(--page-text)' }}>{totalPurchases}</h3>
                    </div>
                    <div className="card p-6 rounded-[2rem] border shadow-sm flex flex-col justify-between" style={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--border-color)' }}>
                      <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-2">Total Purchase Amount</p>
                      <h3 className="text-3xl font-black" style={{ color: 'var(--page-text)' }}>₹{totalAmount.toLocaleString()}</h3>
                    </div>
                    <div className="card p-6 rounded-[2rem] border shadow-sm flex flex-col justify-between" style={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--border-color)' }}>
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Pending Payments</p>
                      <h3 className="text-3xl font-black text-rose-600">₹{pendingPayments.toLocaleString()}</h3>
                    </div>
                    <div className="card p-6 rounded-[2rem] border shadow-sm flex flex-col justify-between" style={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--border-color)' }}>
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Paid Purchases</p>
                      <h3 className="text-3xl font-black text-emerald-600">{paidPurchases}</h3>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Filters */}
            <div className="card p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row flex-wrap gap-4 items-center hide-scrollbar w-full" style={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--border-color)' }}>
              <div className="flex-1 w-full md:w-auto min-w-[200px] relative">
                <input
                  type="text"
                  placeholder="Search by Purchase ID..."
                  value={purchaseSupplierFilterSearch}
                  onChange={(e) => setPurchaseSupplierFilterSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 outline-none transition-all font-bold"
                  style={{ color: 'var(--page-text)' }}
                />
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={14} />
              </div>
              <div className="relative flex-1 w-full md:w-auto min-w-[150px]">
                <select value={purchasePaymentStatusFilter} onChange={(e) => setPurchasePaymentStatusFilter(e.target.value)} className="w-full pl-4 pr-10 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none bg-slate-50 dark:bg-slate-800/50 appearance-none text-sm font-bold opacity-80 cursor-pointer">
                  <option value="all">All Payment Status</option>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="PARTIAL">Partial</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <FaChevronDown size={10} />
                </div>
              </div>
              <div className="relative flex-1 w-full md:w-auto min-w-[150px]">
                <input type="date" value={purchaseDateFrom} onChange={(e) => setPurchaseDateFrom(e.target.value)} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none bg-slate-50 dark:bg-slate-800/50 text-sm font-bold opacity-80" />
              </div>
              <span className="text-slate-400 font-bold opacity-50">to</span>
              <div className="relative flex-1 w-full md:w-auto min-w-[150px]">
                <input type="date" value={purchaseDateTo} onChange={(e) => setPurchaseDateTo(e.target.value)} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none bg-slate-50 dark:bg-slate-800/50 text-sm font-bold opacity-80" />
              </div>
              {(purchaseSupplierFilterSearch || purchasePaymentStatusFilter !== "all" || purchaseDateFrom || purchaseDateTo) && (
                <button onClick={() => { setPurchaseSupplierFilterSearch(""); setPurchasePaymentStatusFilter("all"); setPurchaseDateFrom(""); setPurchaseDateTo(""); }} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold text-sm shrink-0 ml-auto hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Reset</button>
              )}
            </div>

            {/* Table */}
            <div className="card border rounded-[2rem] overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--border-color)' }}>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left table-auto">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest opacity-60">Purchase ID</th>
                      <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest opacity-60">Date</th>
                      <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest opacity-60">Product</th>
                      <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest opacity-60">Category</th>
                      <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 text-center">Qty</th>
                      <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 text-right">Unit Cost</th>
                      <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 text-right">Total Cost</th>
                      <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 text-center">Status</th>
                      <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest opacity-60">Invoice</th>
                      <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800" style={{ borderColor: 'var(--border-color)' }}>
                    {purchases.filter(p => {
                      if (p.supplier?._id !== selectedSupplierForPurchases._id) return false;
                      if (purchaseSupplierFilterSearch && !p.purchaseId?.toLowerCase().includes(purchaseSupplierFilterSearch.toLowerCase())) return false;
                      return true;
                    }).map((purchase, idx) => (
                      <tr key={purchase._id} className={`group transition-all duration-200 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/30 dark:bg-slate-800/20'} hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5`}>
                        <td className="px-5 py-4 whitespace-nowrap font-mono text-xs opacity-80">{purchase.purchaseId}</td>
                        <td className="px-5 py-4 text-xs font-bold opacity-80">{new Date(purchase.purchaseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-5 py-4 text-sm font-black" style={{ color: 'var(--page-text)' }}>{purchase.product?.name || "—"}</td>
                        <td className="px-5 py-4 text-xs"><span className="px-2 py-1 bg-indigo-500/10 text-indigo-600 rounded-lg font-bold">{purchase.product?.category || "—"}</span></td>
                        <td className="px-5 py-4 text-center font-black opacity-80">{purchase.quantity}</td>
                        <td className="px-5 py-4 text-right font-black text-indigo-600">₹{(purchase.unitCost || 0).toLocaleString()}</td>
                        <td className="px-5 py-4 text-right font-black" style={{ color: 'var(--page-text)' }}>₹{(purchase.totalCost || 0).toLocaleString()}</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg ${purchase.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : purchase.paymentStatus === 'PENDING' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                            {purchase.paymentStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-mono opacity-60">{purchase.invoiceNumber || "—"}</td>
                        <td className="px-5 py-4 text-center relative dropdown-container">
                             <button onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(openDropdownId === `pur-${purchase._id}` ? null : `pur-${purchase._id}`);
                             }} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-all">
                               <FaEllipsisV size={14} />
                             </button>
                             {openDropdownId === `pur-${purchase._id}` && (
                                <div className="absolute right-10 top-10 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden text-left py-1 animate-in fade-in zoom-in-95 duration-200">
                                  <button onClick={() => { setPurchaseDetailsModal(purchase); setOpenDropdownId(null); }} className="w-full px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 font-bold text-slate-700 dark:text-slate-200"><FaEye className="text-indigo-500"/> View Details</button>
                                  <button onClick={() => { setEditPurchaseId(purchase._id); setSearchParams({modal: "purchase"}); setOpenDropdownId(null); }} className="w-full px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 font-bold text-slate-700 dark:text-slate-200"><FaEdit className="text-blue-500"/> Edit Record</button>
                                  {purchase.invoiceUrl && <a href={purchase.invoiceUrl} target="_blank" rel="noreferrer" className="w-full px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 font-bold text-slate-700 dark:text-slate-200"><FaFileCsv className="text-purple-500"/> Download Invoice</a>}
                                  {purchase.paymentStatus !== 'PAID' && (
                                    <button onClick={() => { handleMarkPaid(purchase._id); setOpenDropdownId(null); }} className="w-full px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 font-bold text-emerald-600"><FaCheckCircle className="text-emerald-500"/> Mark as Paid</button>
                                  )}
                                  <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                  <button onClick={() => { setConfirmConfig({ isOpen: true, action: 'delete-purchase', purchaseId: purchase._id }); setOpenDropdownId(null); }} className="w-full px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 font-bold text-rose-600"><FaTrash /> Delete Record</button>
                                </div>
                             )}
                        </td>
                      </tr>
                    ))}
                    {purchases.filter(p => p.supplier?._id === selectedSupplierForPurchases._id).length === 0 && (
                      <tr>
                        <td colSpan="10" className="px-5 py-16 text-center opacity-50">
                          <FaHistory className="mx-auto text-4xl mb-4 opacity-50" />
                          <p className="text-lg font-black uppercase tracking-widest">No Purchases Found</p>
                          <p className="text-xs font-bold mt-2">There are no purchase records associated with this supplier.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
        onClose={() => { setSearchParams({}); setEditPurchaseId(null); if(activeModuleSection !== "supplier-purchases") setActiveModuleSection("suppliers"); }}
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
            await Promise.all([fetchPurchases(), fetchProducts(), fetchAnalytics()]);
            setSearchParams({});
            setEditPurchaseId(null);
            if (!editPurchaseId) setActiveModuleSection("recent-purchases");
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Purchase Details</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">ID: {purchaseDetailsModal.purchaseId}</p>
              </div>
              <button 
                onClick={() => setPurchaseDetailsModal(null)}
                className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all text-slate-400"
              >
                <FaTimes />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              {/* Purchase & Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 border-b pb-2">Purchase Information</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Date & Time</span>
                      <span className="text-sm font-bold">{new Date(purchaseDetailsModal.purchaseDate).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Created By</span>
                      <span className="text-sm font-bold">{purchaseDetailsModal.createdBy?.name || "System/Admin"}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 border-b pb-2">Payment Information</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Status</span>
                      <span className={`inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg mt-1 ${purchaseDetailsModal.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : purchaseDetailsModal.paymentStatus === 'PENDING' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {purchaseDetailsModal.paymentStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Method</span>
                      <span className="text-sm font-bold uppercase tracking-wide">{purchaseDetailsModal.paymentMethod || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supplier Info */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 border-b pb-2">Supplier Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

              {/* Product Info */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 border-b pb-2">Product Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2">
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
                <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <div>
                    <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Purchased Qty</span>
                    <span className="text-lg font-black">{purchaseDetailsModal.quantity}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Unit Cost</span>
                    <span className="text-lg font-black text-indigo-600">₹{purchaseDetailsModal.unitCost?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Total Cost</span>
                    <span className="text-lg font-black text-emerald-600">₹{purchaseDetailsModal.totalCost?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Invoice & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 border-b pb-2">Invoice Information</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide">Supplier Invoice Number</span>
                      <span className="text-sm font-mono opacity-80">{purchaseDetailsModal.invoiceNumber || "None"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold opacity-50 block uppercase tracking-wide mb-2">Uploaded Invoice</span>
                      {purchaseDetailsModal.invoiceUrl ? (
                        <a href={purchaseDetailsModal.invoiceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors">
                          <FaFileCsv size={12} /> View Document
                        </a>
                      ) : (
                        <span className="text-xs font-bold opacity-50 italic">No document uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 border-b pb-2">Notes</h4>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl min-h-[100px] border border-amber-100 dark:border-amber-800">
                    {purchaseDetailsModal.notes ? (
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap">{purchaseDetailsModal.notes}</p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No remarks added for this purchase.</p>
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
        onClose={() => setConfirmConfig({ isOpen: false, supplierId: null, purchaseId: null, action: null })}
        onConfirm={handleConfirmAction}
        title={confirmConfig.action === 'delete-purchase' ? "Delete Purchase Record" : "Delete Supplier"}
        message={confirmConfig.action === 'delete-purchase' ? "Are you sure you want to delete this purchase record? This action cannot be undone." : "Are you sure you want to delete this supplier? This will remove them from the network and may affect linked products/purchases."}
        confirmText={confirmConfig.action === 'delete-purchase' ? "Delete Record" : "Delete Supplier"}
      />
    </div>
  );
};

export default ManageSuppliers;
