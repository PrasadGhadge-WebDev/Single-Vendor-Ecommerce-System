import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../../api";
import { toast } from "react-toastify";
import { FaArrowLeft, FaEdit, FaBoxOpen, FaPercent, FaCalendarAlt, FaFilter, FaLock, FaChartBar } from "react-icons/fa";
import AddOffer from "./AddOffer";

const OfferDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchOffer();
  }, [id]);

  const fetchOffer = async () => {
    try {
      const { data } = await API.get(`/offers/${id}`);
      setOffer(data);
    } catch (err) {
      toast.error("Failed to fetch offer details");
      navigate("/admin/offers");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="spinner-border text-indigo-600" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!offer) return null;

  const now = new Date();
  const startsAt = new Date(offer.startDate);
  const expiresAt = new Date(offer.endDate);

  let currentStatus = offer.status;
  if (currentStatus !== "Inactive" && currentStatus !== "Draft") {
    if (startsAt && now < startsAt) {
      currentStatus = "Scheduled";
    } else if (expiresAt && now > expiresAt) {
      currentStatus = "Expired";
    } else {
      currentStatus = "Active";
    }
  }

  const startDateStr = startsAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const endDateStr = expiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="p-4 sm:p-8 w-full max-w-5xl mx-auto animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/admin/offers")}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 shadow-sm transition-colors"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 m-0">Offer Details</h1>
            <p className="text-sm text-slate-500 m-0 mt-1">Review the details and performance of this offer.</p>
          </div>
        </div>

        <button 
          onClick={() => setShowEditModal(true)}
          className="px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
        >
          <FaEdit size={14} /> EDIT OFFER
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FaChartBar size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">TOTAL USAGE</p>
            <p className="text-2xl font-black text-slate-800">{offer.usageCount || 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FaPercent size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">DISCOUNT TYPE</p>
            <p className="text-xl font-black text-slate-800">{offer.type}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FaCalendarAlt size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">TIME REMAINING</p>
            <p className="text-xl font-black text-slate-800">
              {currentStatus === 'Active' ? `${Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))} days` : currentStatus}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-10">
        
        {/* Status Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-slate-800">{offer.name}</h2>
              {offer.code && (
                <span className="px-3 py-1 bg-slate-100 text-slate-700 font-mono font-bold text-sm rounded-lg border border-slate-200">
                  {offer.code}
                </span>
              )}
            </div>
            {offer.description && <p className="text-sm font-medium text-slate-600 mt-2">{offer.description}</p>}
            <p className="text-xs font-medium text-slate-400 mt-2">Created on {new Date(offer.createdAt).toLocaleDateString()}</p>
          </div>
          <div className={`mt-4 md:mt-0 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider ${
            currentStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' :
            currentStatus === 'Scheduled' ? 'bg-amber-100 text-amber-700' :
            currentStatus === 'Expired' ? 'bg-rose-100 text-rose-700' :
            currentStatus === 'Draft' ? 'bg-slate-200 text-slate-700' :
            'bg-red-100 text-red-700'
          }`}>
            {currentStatus}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          <div className="space-y-10">
            {/* Box 1: Discount */}
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-600 uppercase tracking-widest mb-4">
                <FaPercent size={14} /> DISCOUNT DETAILS
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">OFFER VALUE</p>
                  <p className="text-2xl font-black text-emerald-600">
                    {offer.type === 'Percentage Discount' ? `${offer.discountValue}%` : offer.type === 'Free Shipping' ? 'FREE' : `₹${offer.discountValue}`} 
                    {offer.type !== 'Free Shipping' && ' OFF'}
                  </p>
                </div>
                {offer.type === 'Percentage Discount' && offer.maxDiscount && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">MAX DISCOUNT</p>
                    <p className="text-xl font-bold text-slate-800">₹{offer.maxDiscount}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Box 2: Duration */}
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-600 uppercase tracking-widest mb-4">
                <FaCalendarAlt size={14} /> DURATION
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">START DATE</p>
                  <p className="text-sm font-bold text-slate-800">{startDateStr}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">END DATE</p>
                  <p className="text-sm font-bold text-slate-800">{endDateStr}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            {/* Box 3: Applicable On */}
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-600 uppercase tracking-widest mb-4">
                <FaFilter size={14} /> APPLICABLE ON
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">TARGET GROUP</p>
                <p className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 inline-block rounded-lg border border-blue-100 mb-4">
                  {offer.applicableOn}
                </p>

                {offer.applicableOn === 'Specific Products' && offer.products && offer.products.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">SELECTED PRODUCTS ({offer.products.length})</p>
                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                      {offer.products.map(p => (
                        <div key={p._id} className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-lg truncate">
                          {p.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {offer.applicableOn === 'Specific Categories' && offer.categories && offer.categories.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">SELECTED CATEGORIES ({offer.categories.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {offer.categories.map((c, i) => (
                        <span key={i} className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Box 4: Usage Restrictions */}
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-600 uppercase tracking-widest mb-4">
                <FaLock size={14} /> RESTRICTIONS & LIMITS
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">MIN ORDER AMOUNT</p>
                  <p className="text-sm font-bold text-slate-800">{offer.minOrderAmount ? `₹${offer.minOrderAmount}` : 'None'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">PER USER LIMIT</p>
                  <p className="text-sm font-bold text-slate-800">{offer.perUserLimit ? `${offer.perUserLimit} uses` : 'Unlimited'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL USAGE LIMIT</p>
                    <p className="text-[10px] font-bold text-indigo-600">{offer.usageCount || 0} / {offer.usageLimit || '∞'}</p>
                  </div>
                  {offer.usageLimit ? (
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min(((offer.usageCount || 0) / offer.usageLimit) * 100, 100)}%` }}></div>
                    </div>
                  ) : (
                     <p className="text-sm font-bold text-slate-800">Unlimited</p>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {showEditModal && (
        <AddOffer 
          offerId={offer._id}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchOffer();
          }}
        />
      )}
    </div>
  );
};

export default OfferDetails;
