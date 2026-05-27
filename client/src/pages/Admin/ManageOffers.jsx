import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FaPlus, FaTimes, FaSearch, FaChevronDown, FaEdit, FaTrash, FaFileCsv, FaSync, FaPercentage, FaTicketAlt, FaClock, FaPowerOff } from "react-icons/fa";
import API from "../../api";
import { downloadCsv, inDateRange } from "../../utils/adminHelpers";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";
import OfferFormModal from "../../components/OfferFormModal";
import ConfirmModal from "../../components/ConfirmModal";

const OFFERS_PER_PAGE = 10;

const ManageOffers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [offerPage, setOfferPage] = useState(1);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, offerId: null });
  
  const showCreateForm = searchParams.get("modal") === "offer";
  const editingId = searchParams.get("id");
  const [editingOffer, setEditingOffer] = useState(null);

  const fetchOffers = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const { data } = await API.get("/offers");
      setOffers(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load offers");
      setOffers([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = setInterval(() => fetchOffers(false), 30000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  const openAddModal = () => {
    setEditingOffer(null);
    setSearchParams({ modal: "offer" });
  };

  const openEditModal = (offer) => {
    setEditingOffer(offer);
    setSearchParams({ modal: "offer", id: offer._id });
  };

  const resetModal = () => {
    setSearchParams({});
    setEditingOffer(null);
  };

  // Sync editingOffer if URL has ID but state doesn't
  useEffect(() => {
    if (showCreateForm && editingId && !editingOffer && offers.length > 0) {
      const offer = offers.find(o => o._id === editingId);
      if (offer) setEditingOffer(offer);
    }
  }, [showCreateForm, editingId, editingOffer, offers]);

  const buildPayload = (data) => ({
    title: String(data.title || "").trim(),
    code: String(data.code || "").trim().toUpperCase(),
    description: String(data.description || "").trim(),
    discountType: data.discountType,
    discountValue: Number(data.discountValue || 0),
    minOrderAmount: Number(data.minOrderAmount || 0),
    maxDiscountAmount: Number(data.maxDiscountAmount || 0),
    startsAt: data.startsAt ? new Date(data.startsAt) : new Date(),
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    isActive: Boolean(data.isActive),
    image: String(data.image || "").trim(),
  });

  const handleSubmit = async (data) => {
    const payload = buildPayload(data);

    if (!payload.title || !payload.code || payload.discountValue <= 0) {
      toast.warning("Title, code and discount value are required");
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await API.put(`/offers/${editingId}`, payload);
      } else {
        await API.post("/offers", payload);
      }
      resetModal();
      fetchOffers(false);
      toast.success(editingId ? "Offer updated successfully" : "Offer created successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save offer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmConfig({ isOpen: true, offerId: id });
  };

  const handleConfirmDeleteOffer = async () => {
    const id = confirmConfig.offerId;
    if (!id) return;
    
    try {
      await API.delete(`/offers/${id}`);
      fetchOffers(false);
      toast.success("Offer deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete offer");
    }
  };

  const toggleStatus = async (offer) => {
    try {
      await API.put(`/offers/${offer._id}`, { isActive: !offer.isActive });
      fetchOffers(false);
      toast.success(`Offer ${offer.isActive ? "deactivated" : "activated"} successfully`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update offer status");
    }
  };

  const filteredOffers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return offers.filter((offer) => {
      if (statusFilter === "active" && !offer.isActive) return false;
      if (statusFilter === "inactive" && offer.isActive) return false;
      if (typeFilter !== "all" && offer.discountType !== typeFilter) return false;
      
      // Smart Date Range Filtering
      if (dateRange !== "all") {
        const entryDate = new Date(offer.createdAt);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (dateRange === "today") {
          if (entryDate < startOfToday) return false;
        } else if (dateRange === "7days") {
          const sevenDaysAgo = new Date(startOfToday);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          if (entryDate < sevenDaysAgo) return false;
        } else if (dateRange === "custom") {
          if ((dateFrom || dateTo) && !inDateRange(offer.createdAt, dateFrom, dateTo)) return false;
        }
      }

      if (!term) return true;
      const haystack = `${offer.title} ${offer.code} ${offer.description || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [offers, search, statusFilter, typeFilter, dateRange, dateFrom, dateTo]);

  useEffect(() => {
    setOfferPage(1);
  }, [search, statusFilter, typeFilter, dateRange, dateFrom, dateTo]);

  const totalOfferPages = Math.max(1, Math.ceil(filteredOffers.length / OFFERS_PER_PAGE));
  const paginatedOffers = useMemo(() => {
    const startIndex = (offerPage - 1) * OFFERS_PER_PAGE;
    return filteredOffers.slice(startIndex, startIndex + OFFERS_PER_PAGE);
  }, [filteredOffers, offerPage]);

  const exportOffers = () => {
    downloadCsv(
      "promotion_records.csv",
      filteredOffers.map((offer) => ({
        "Offer Title": offer.title,
        "Promo Code": offer.code,
        "Type": offer.discountType,
        "Value": offer.discountValue,
        "Min Order": offer.minOrderAmount || 0,
        "Starts At": offer.startsAt || "",
        "Expires At": offer.expiresAt || "",
        "Status": offer.isActive ? "Active" : "Inactive",
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
                Offers
                <span className="text-[10px] uppercase tracking-[0.3em] font-black px-2 py-1 bg-indigo-500/10 text-indigo-600 rounded-lg ml-2">
                  Promotions
                </span>
              </h1>
              <p className="text-sm font-bold opacity-40 uppercase tracking-[0.1em] mt-1.5">
                Campaign Management & Incentive Engineering Terminal
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
            <span>Add Offer</span>
          </button>
          <button 
            onClick={exportOffers}
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
            placeholder="Search campaigns, promo codes or descriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-6 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500/30 transition-all outline-none"
            style={{ paddingLeft: '52px', color: 'var(--page-text)' }}
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full xl:w-auto shrink-0">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
            >
              <option value="all">Campaign Status</option>
              <option value="active">Active</option>
              <option value="inactive">Paused</option>
            </select>
            <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
          </div>

          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
            >
              <option value="all">Incentive Type</option>
              <option value="PERCENT">Percentage</option>
              <option value="FIXED">Flat Discount</option>
            </select>
            <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
          </div>

          <div className="relative">
            <select 
              className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="all">Launch Date</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
          </div>

          <button 
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setTypeFilter("all");
              setDateRange("all");
              fetchOffers(true);
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
                <th className="w-[20%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Campaign Title</th>
                <th className="w-[15%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Promo Code</th>
                <th className="w-[12%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Benefit</th>
                <th className="w-[12%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Minimum</th>
                <th className="w-[15%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Status</th>
                <th className="w-[12%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Timeline</th>
                <th className="w-[14%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800" style={{ borderColor: 'var(--border-color)' }}>
              {paginatedOffers.map((offer, idx) => (
                <tr 
                  key={offer._id} 
                  className={`group transition-all duration-200 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/30 dark:bg-slate-800/20'} hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5`}
                >
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                    <div className="truncate">
                      <p className="font-bold text-sm truncate" style={{ color: 'var(--page-text)' }}>{offer.title}</p>
                      <p className="text-[9px] font-bold opacity-30 truncate">{offer.description || "No description provided"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                      <FaTicketAlt className="text-indigo-500/40" size={10} />
                      <span className="font-black text-[11px] tracking-widest text-indigo-600">{offer.code}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                    <div className="flex flex-col items-center">
                      <p className="text-sm font-black text-emerald-600">
                        {offer.discountType === "PERCENT" ? `${offer.discountValue}%` : `₹${offer.discountValue.toLocaleString()}`}
                      </p>
                      <p className="text-[8px] font-black uppercase opacity-30 tracking-tighter">{offer.discountType === "PERCENT" ? "Variable" : "Fixed"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-xs font-bold opacity-60">₹{(offer.minOrderAmount || 0).toLocaleString()}</p>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${offer.isActive ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border border-rose-500/20"}`}>
                      {offer.isActive ? "Live" : "Paused"}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 opacity-60">
                      <FaClock size={10} />
                      <p className="text-[10px] font-bold">{new Date(offer.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => toggleStatus(offer)}
                        className={`p-2 rounded-lg transition-all ${offer.isActive ? "text-rose-500 hover:bg-rose-500 hover:text-white" : "text-emerald-500 hover:bg-emerald-500 hover:text-white"}`}
                        title={offer.isActive ? "Deactivate" : "Activate"}
                      >
                        <FaPowerOff size={12} />
                      </button>
                      <button 
                        onClick={() => openEditModal(offer)}
                        className="p-2 hover:bg-indigo-600 hover:text-white rounded-lg transition-all text-slate-400"
                        title="Edit"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button 
                        onClick={() => handleDelete(offer._id)}
                        className="p-2 hover:bg-rose-600 hover:text-white rounded-lg transition-all text-slate-400"
                        title="Delete"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={offerPage} totalPages={totalOfferPages} onPageChange={setOfferPage} />

      <OfferFormModal
        isOpen={showCreateForm}
        onClose={resetModal}
        onSave={handleSubmit}
        initialData={editingOffer}
        loading={submitting}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, offerId: null })}
        onConfirm={handleConfirmDeleteOffer}
        title="Delete Offer"
        message="Are you sure you want to delete this promotional offer? This action cannot be undone."
        confirmText="Delete Offer"
      />
    </div>
  );
};

export default ManageOffers;
