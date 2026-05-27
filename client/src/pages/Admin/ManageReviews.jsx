import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FaEdit, FaPlus, FaStar, FaTrash, FaSearch, FaChevronDown, FaSync, FaCommentAlt, FaBoxOpen, FaUser, FaClock, FaCheckCircle } from "react-icons/fa";
import API from "../../api";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";
import { AuthContext } from "../../context/AuthContext";
import ConfirmModal from "../../components/ConfirmModal";

const REVIEWS_PER_PAGE = 12;
const starValues = [1, 2, 3, 4, 5];

const ManageReviews = () => {
  const { user } = useContext(AuthContext);
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const [filters, setFilters] = useState({ productId: "", search: "", rating: 0 });
  const [editingId, setEditingId] = useState(null);
  const [editPayload, setEditPayload] = useState({ rating: 5, title: "", comment: "" });
  const [updating, setUpdating] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, reviewId: null });

  const fetchProducts = async () => {
    try {
      const { data } = await API.get("/products?limit=500");
      const list = Array.isArray(data) ? data : data?.products || [];
      setProducts(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Failed to load products", error);
      setProducts([]);
    }
  };

  const fetchReviews = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const params = {
        page: reviewPage,
        limit: REVIEWS_PER_PAGE,
      };
      if (filters.productId) params.productId = filters.productId;
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.rating > 0) params.rating = filters.rating;

      const { data } = await API.get("/reviews", { params });
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      setTotalReviews(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setAverageRating(data.averageRating || 0);
    } catch (error) {
      console.error("Failed to load reviews", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [filters, reviewPage]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleUpdateReview = async (id) => {
    try {
      setUpdating(true);
      await API.put(`/reviews/${id}`, {
        rating: Number(editPayload.rating),
        title: editPayload.title.trim(),
        comment: editPayload.comment.trim(),
      });
      toast.success("Review updated");
      setEditingId(null);
      fetchReviews(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteReview = (id) => {
    setConfirmConfig({ isOpen: true, reviewId: id });
  };

  const handleConfirmDeleteReview = async () => {
    const id = confirmConfig.reviewId;
    if (!id) return;
    
    try {
      await API.delete(`/reviews/${id}`);
      toast.success("Review deleted");
      fetchReviews(false);
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const startEdit = (review) => {
    setEditingId(review._id);
    setEditPayload({
      rating: review.rating,
      title: review.title || "",
      comment: review.comment || "",
    });
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
                Reviews
                <span className="text-[10px] uppercase tracking-[0.3em] font-black px-2 py-1 bg-indigo-500/10 text-indigo-600 rounded-lg ml-2">
                  Feedback
                </span>
              </h1>
              <p className="text-sm font-bold opacity-40 uppercase tracking-[0.1em] mt-1.5">
                Customer Sentiment Analysis & Reputation Management Console
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 mb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <FaStar key={i} className={i < Math.round(averageRating) ? "text-amber-400" : "text-slate-200"} size={14} />
              ))}
              <span className="text-xl font-black ml-2 text-indigo-600">{averageRating.toFixed(1)}</span>
            </div>
            <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">Global Satisfaction Score</p>
          </div>
          <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 mx-2" />
          <button 
            onClick={() => fetchReviews()}
            className="p-3 bg-white dark:bg-slate-800 border rounded-2xl hover:bg-slate-50 transition-all shadow-sm" 
            style={{ borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
          >
            <FaSync size={14} className={loading ? "animate-spin" : ""} />
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
            placeholder="Search by sentiment keyword, customer name or review title..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pr-6 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500/30 transition-all outline-none"
            style={{ paddingLeft: '52px', color: 'var(--page-text)' }}
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full xl:w-auto shrink-0">
          <div className="relative">
            <select
              value={filters.productId}
              onChange={(e) => setFilters(prev => ({ ...prev, productId: e.target.value }))}
              className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
            >
              <option value="">Filter by Product</option>
              {products.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
          </div>

          <div className="relative">
            <select
              value={filters.rating}
              onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
              className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
            >
              <option value="0">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
          </div>

          <button 
            onClick={() => {
              setFilters({ productId: "", search: "", rating: 0 });
              fetchReviews(true);
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
          <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <th className="w-[15%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Customer</th>
                <th className="w-[18%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Product Identity</th>
                <th className="w-[10%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Sentiment</th>
                <th className="w-[30%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Feedback Content</th>
                <th className="w-[12%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Timestamp</th>
                <th className="w-[15%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800" style={{ borderColor: 'var(--border-color)' }}>
              {reviews.map((review, idx) => (
                <tr 
                  key={review._id} 
                  className={`group transition-all duration-200 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/30 dark:bg-slate-800/20'} hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5`}
                >
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                        <FaUser size={12} />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-xs truncate" style={{ color: 'var(--page-text)' }}>{review.user?.name || "Anonymous"}</p>
                        <p className="text-[9px] font-bold opacity-30 uppercase tracking-tighter">Verified Buyer</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 truncate">
                      <FaBoxOpen className="text-slate-300" size={14} />
                      <p className="text-xs font-bold truncate opacity-80">{review.product?.name || "Product Deleted"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex gap-0.5">
                        {starValues.map(s => (
                          <FaStar key={s} className={s <= review.rating ? "text-amber-400" : "text-slate-200"} size={10} />
                        ))}
                      </div>
                      <span className="text-[10px] font-black text-slate-400">{review.rating}.0</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                    {editingId === review._id ? (
                      <div className="space-y-2">
                        <input 
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-bold"
                          value={editPayload.title}
                          onChange={(e) => setEditPayload(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Review Title"
                        />
                        <textarea 
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border rounded-lg text-[11px] outline-none"
                          rows={2}
                          value={editPayload.comment}
                          onChange={(e) => setEditPayload(prev => ({ ...prev, comment: e.target.value }))}
                          placeholder="Feedback detail..."
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs font-black truncate" style={{ color: 'var(--page-text)' }}>{review.title || "Untitled Feedback"}</p>
                        <p className="text-[11px] font-medium opacity-60 line-clamp-2 leading-relaxed">{review.comment || "No detailed feedback provided."}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 opacity-60">
                      <FaClock size={10} />
                      <p className="text-[10px] font-bold">{new Date(review.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {editingId === review._id ? (
                        <button
                          onClick={() => handleUpdateReview(review._id)}
                          disabled={updating}
                          className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10 active:scale-95 disabled:opacity-50"
                        >
                          <FaCheckCircle size={14} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => startEdit(review)}
                          className="p-2 hover:bg-indigo-600 hover:text-white rounded-lg transition-all text-slate-400"
                          title="Edit"
                        >
                          <FaEdit size={14} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteReview(review._id)}
                        className="p-2 hover:bg-rose-600 hover:text-white rounded-lg transition-all text-slate-400"
                        title="Delete"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={reviewPage} totalPages={totalPages} onPageChange={setReviewPage} />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, reviewId: null })}
        onConfirm={handleConfirmDeleteReview}
        title="Delete Review"
        message="Are you sure you want to permanently remove this customer review? This action cannot be undone."
        confirmText="Delete Review"
      />
    </div>
  );
};

export default ManageReviews;
