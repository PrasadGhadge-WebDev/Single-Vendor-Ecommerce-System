import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";
import { toast } from "react-toastify";
import { 
  FaPlus, FaSyncAlt, FaSearch, FaEye, FaEdit, FaTrash, FaTags, FaCalendarCheck, FaCalendarTimes, FaCheckCircle, FaChevronDown, FaToggleOn, FaToggleOff
} from "react-icons/fa";
import AddOffer from "./AddOffer";

const ManageOffers = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [applyToFilter, setApplyToFilter] = useState("all");
  const [dateRangeType, setDateRangeType] = useState("all");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const [showAddOffer, setShowAddOffer] = useState(false);
  const [editOfferId, setEditOfferId] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.action-dropdown-container')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/offers");
      setOffers(data);
    } catch (err) {
      toast.error("Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const confirmDelete = async (id) => {
    try {
      await API.delete(`/offers/${id}`);
      toast.success("Offer deleted successfully");
      fetchOffers();
    } catch (err) {
      toast.error("Failed to delete offer");
    }
  };

  const handleDelete = (id) => {
    toast(
      ({ closeToast }) => (
        <div>
          <p className="font-bold text-slate-800 text-sm mb-3">Are you sure you want to delete this offer?</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                confirmDelete(id);
                closeToast();
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Yes, Delete
            </button>
            <button
              onClick={closeToast}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
      }
    );
  };

  const handleToggleStatus = async (offer) => {
    try {
      const newStatus = offer.status === "Active" ? "Inactive" : "Active";
      await API.put(`/offers/${offer._id}`, { status: newStatus });
      toast.success(`Offer marked as ${newStatus}`);
      fetchOffers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const getDisplayStatus = (offer) => {
    const now = new Date();
    
    if (offer.status === "Inactive" || offer.status === "Draft") return offer.status;
    
    if (offer.startDate) {
      const startsAt = new Date(offer.startDate);
      if (now < startsAt) return "Scheduled";
    }
    if (offer.endDate) {
      const expiresAt = new Date(offer.endDate);
      if (now > expiresAt) return "Expired";
    }
    
    return "Active";
  };

  // KPIs
  const totalOffers = offers.length;
  const activeOffers = offers.filter(o => getDisplayStatus(o) === "Active").length;
  const expiredOffers = offers.filter(o => getDisplayStatus(o) === "Expired").length;
  const scheduledOffers = offers.filter(o => getDisplayStatus(o) === "Scheduled").length;

  // Filters
  const filteredOffers = offers.filter((offer) => {
    const status = getDisplayStatus(offer);
    
    const searchLower = search.toLowerCase();
    const matchesSearch = !search || 
      (offer.name && offer.name.toLowerCase().includes(searchLower)) ||
      (offer.code && offer.code.toLowerCase().includes(searchLower)) ||
      (offer.applicableOn && offer.applicableOn.toLowerCase().includes(searchLower));
    
    const matchesType = typeFilter === "all" || offer.type === typeFilter;
    const matchesStatus = statusFilter === "all" || status.toLowerCase() === statusFilter;
    const matchesApplyTo = applyToFilter === "all" || offer.applicableOn === applyToFilter;
    
    let matchesDate = true;
    if (dateRangeType !== "all") {
      const offerDate = offer.createdAt ? new Date(offer.createdAt) : new Date(0);
      if (dateRangeType === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (offerDate < today) matchesDate = false;
      } else if (dateRangeType === "last7days") {
        const last7 = new Date();
        last7.setDate(last7.getDate() - 7);
        last7.setHours(0, 0, 0, 0);
        if (offerDate < last7) matchesDate = false;
      } else if (dateRangeType === "custom") {
        const filterStart = startDateFilter ? new Date(startDateFilter) : null;
        const filterEnd = endDateFilter ? new Date(endDateFilter) : null;
        if (filterEnd) filterEnd.setHours(23, 59, 59, 999);
        
        if (filterStart && offerDate < filterStart) matchesDate = false;
        if (filterEnd && offerDate > filterEnd) matchesDate = false;
      }
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesApplyTo && matchesDate;
  });

  const hasActiveFilters = search !== "" || statusFilter !== "all" || typeFilter !== "all" || applyToFilter !== "all" || dateRangeType !== "all" || startDateFilter !== "" || endDateFilter !== "";

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-8 space-y-6 animate-in fade-in duration-500" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 m-0">Offers</h1>
          <p className="text-sm text-slate-500 m-0 mt-1">Manage promotional offers and discounts.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchOffers} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
            <FaSyncAlt size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={() => { setEditOfferId(null); setShowAddOffer(true); }} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all">
            <FaPlus size={12} /> Create Offer
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><FaTags size={20} /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Offers</p>
            <p className="text-2xl font-black text-slate-800">{totalOffers}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><FaCheckCircle size={20} /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Offers</p>
            <p className="text-2xl font-black text-slate-800">{activeOffers}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><FaCalendarCheck size={20} /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Scheduled Offers</p>
            <p className="text-2xl font-black text-slate-800">{scheduledOffers}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><FaCalendarTimes size={20} /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Expired Offers</p>
            <p className="text-2xl font-black text-slate-800">{expiredOffers}</p>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 flex flex-nowrap overflow-x-auto items-center gap-2 w-full hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex-[2] min-w-[150px] relative">
          <input
            type="text"
            placeholder="Search by all columns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-8 py-1.5 bg-transparent border border-slate-200 rounded-lg text-xs font-medium outline-none focus:ring-2 ring-indigo-500/20"
          />
          <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex-1 min-w-[110px] px-2 py-1.5 bg-transparent border border-slate-200 rounded-lg text-xs font-medium outline-none cursor-pointer text-slate-700">
          <option value="all">Status: All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="flex-1 min-w-[110px] px-2 py-1.5 bg-transparent border border-slate-200 rounded-lg text-xs font-medium outline-none cursor-pointer text-slate-700">
          <option value="all">Type: All</option>
          <option value="Percentage Discount">Percentage Discount</option>
          <option value="Flat Discount">Flat Discount</option>
        </select>

        <select value={applyToFilter} onChange={(e) => setApplyToFilter(e.target.value)} className="flex-1 min-w-[110px] px-2 py-1.5 bg-transparent border border-slate-200 rounded-lg text-xs font-medium outline-none cursor-pointer text-slate-700">
          <option value="all">Apply To: All</option>
          <option value="All Products">All Products</option>
          <option value="Specific Products">Specific Products</option>
          <option value="Categories">Categories</option>
        </select>

        <select value={dateRangeType} onChange={(e) => setDateRangeType(e.target.value)} className="flex-1 min-w-[110px] px-2 py-1.5 bg-transparent border border-slate-200 rounded-lg text-xs font-medium outline-none cursor-pointer text-slate-700">
          <option value="all">Creation Date</option>
          <option value="today">Today</option>
          <option value="last7days">Last 7 Days</option>
          <option value="custom">Custom Range</option>
        </select>
        
        {dateRangeType === "custom" && (
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              title="From Date"
              className="w-auto px-2 py-1.5 bg-transparent border border-slate-200 rounded-lg text-xs font-medium outline-none text-slate-700"
            />
            <span className="text-slate-400 text-sm">-</span>
            <input 
              type="date" 
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              title="To Date"
              className="w-auto px-2 py-1.5 bg-transparent border border-slate-200 rounded-lg text-xs font-medium outline-none text-slate-700"
            />
          </div>
        )}

        {hasActiveFilters && (
          <button 
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setTypeFilter("all");
              setApplyToFilter("all");
              setDateRangeType("all");
              setStartDateFilter("");
              setEndDateFilter("");
            }}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ml-auto"
          >
            Reset
          </button>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Offer Name</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Discount Details</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Applicable On</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Validity & Usage</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <p className="font-medium text-sm">No offers found.</p>
                  </td>
                </tr>
              ) : (
                filteredOffers.map((offer, index) => {
                  const status = getDisplayStatus(offer);
                  const startDate = offer.startDate ? new Date(offer.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'N/A';
                  const endDate = offer.endDate ? new Date(offer.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'N/A';
                  const isLastRows = index >= filteredOffers.length - 2 && filteredOffers.length >= 3;

                  return (
                    <tr key={offer._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800 text-sm">{offer.name}</p>
                        {offer.code && <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{offer.code}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-indigo-600 text-sm">
                          {offer.type === 'Percentage Discount' ? `${offer.discountValue}%` : offer.type === 'Free Shipping' ? 'FREE' : `₹${offer.discountValue}`} 
                          {offer.type !== 'Free Shipping' && ' OFF'}
                        </div>
                        <div className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[8px] font-bold uppercase tracking-wider">
                          {offer.type}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-slate-600">{offer.applicableOn}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[11px] text-slate-600 font-semibold">{startDate} - {endDate}</div>
                        <div className="text-[9px] text-slate-400 font-medium mt-1">Usage: <span className="font-bold text-slate-600">{offer.usageCount || 0}</span>{offer.usageLimit ? ` / ${offer.usageLimit}` : ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                          status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                          status === 'Scheduled' ? 'bg-amber-100 text-amber-700' :
                          status === 'Expired' ? 'bg-rose-100 text-rose-700' :
                          status === 'Draft' ? 'bg-slate-200 text-slate-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block text-left action-dropdown-container">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenDropdownId(openDropdownId === offer._id ? null : offer._id);
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs inline-flex items-center gap-1.5 transition-colors"
                          >
                            More <FaChevronDown className={`text-[10px] transition-transform ${openDropdownId === offer._id ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {openDropdownId === offer._id && (
                            <div className={`absolute right-0 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden text-left ${isLastRows ? 'bottom-full mb-2' : 'mt-2'}`} onClick={e => e.stopPropagation()}>
                              <button 
                                onClick={() => { navigate(`/admin/offers/${offer._id}`); setOpenDropdownId(null); }}
                                className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <FaEye className="text-blue-500" /> View Details
                              </button>
                              <button 
                                onClick={() => { setEditOfferId(offer._id); setShowAddOffer(true); setOpenDropdownId(null); }}
                                className="w-full text-left px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-3 transition-colors"
                              >
                                <FaEdit size={14} className="text-slate-400" /> Edit Offer
                              </button>
                              
                              <button 
                                onClick={() => { handleToggleStatus(offer); setOpenDropdownId(null); }}
                                className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                {offer.status === 'Active' ? <FaToggleOff className="text-amber-500" /> : <FaToggleOn className="text-emerald-500" />}
                                {offer.status === 'Active' ? 'Deactivate' : 'Activate'}
                              </button>

                              <div className="border-t border-slate-100 my-1"></div>
                              <button 
                                onClick={() => { handleDelete(offer._id); setOpenDropdownId(null); }}
                                className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <FaTrash /> Delete
                              </button>
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
      
      {showAddOffer && (
        <AddOffer 
          offerId={editOfferId}
          onClose={() => {
            setShowAddOffer(false);
            setEditOfferId(null);
          }}
          onSuccess={() => {
            setShowAddOffer(false);
            setEditOfferId(null);
            fetchOffers();
          }}
        />
      )}
    </div>
  );
};

export default ManageOffers;
