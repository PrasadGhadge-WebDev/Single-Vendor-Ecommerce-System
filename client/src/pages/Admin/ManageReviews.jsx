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
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.product-dropdown-container')) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
    <div className="max-w-[1600px] mx-auto p-4 sm:p-8 space-y-6 animate-in fade-in duration-700" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0">Reviews</h1>
          <p className="text-sm text-gray-500 m-0 mt-1">CUSTOMER SENTIMENT ANALYSIS & REPUTATION MANAGEMENT CONSOLE</p>
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
      <div className="p-4 bg-white dark:bg-slate-900/60 rounded-3xl border shadow-xl shadow-indigo-500/5 flex flex-wrap overflow-visible gap-4 items-center" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex-[2] min-w-[250px] relative">
          <input
            type="text"
            placeholder="Search by all columns..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-5 pr-12 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500/30 transition-all outline-none"
            style={{ color: 'var(--page-text)' }}
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <FaSearch className="text-indigo-500/40" size={14} />
          </div>
        </div>
        
        <div className="relative min-w-[200px] product-dropdown-container">
          <div
            onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
            className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none font-bold opacity-70 hover:opacity-100 flex items-center justify-between"
          >
            <span className="truncate">
              {filters.productId ? products.find(p => p._id === filters.productId)?.name || "Filter by Product" : "Filter by Product"}
            </span>
            <FaChevronDown className={`text-slate-400 transition-transform ${isProductDropdownOpen ? 'rotate-180' : ''}`} size={10} />
          </div>
          
          {isProductDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-full max-h-[300px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 flex flex-col overflow-hidden">
              <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 ring-indigo-500/20"
                  placeholder="Search product..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="overflow-y-auto flex-1 p-1">
                <div 
                  className={`px-3 py-2.5 text-sm cursor-pointer rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 ${!filters.productId ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 font-bold' : 'text-slate-700 dark:text-slate-300'}`}
                  onClick={() => {
                    setFilters(prev => ({ ...prev, productId: "" }));
                    setIsProductDropdownOpen(false);
                    setProductSearchTerm("");
                  }}
                >
                  All Products
                </div>
                {products.filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase())).map(p => (
                  <div 
                    key={p._id}
                    className={`px-3 py-2.5 text-sm cursor-pointer rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 truncate ${filters.productId === p._id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 font-bold' : 'text-slate-700 dark:text-slate-300'}`}
                    onClick={() => {
                      setFilters(prev => ({ ...prev, productId: p._id }));
                      setIsProductDropdownOpen(false);
                      setProductSearchTerm("");
                    }}
                  >
                    {p.name}
                  </div>
                ))}
                {products.filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase())).length === 0 && (
                  <div className="px-3 py-4 text-sm text-center text-slate-500">
                    No products found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative min-w-[150px]">
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

        {(filters.search !== "" || filters.productId !== "" || filters.rating !== 0 && filters.rating !== "0") && (
          <button 
            onClick={() => {
              setFilters({ productId: "", search: "", rating: 0 });
              fetchReviews(true);
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
          <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <th className="w-[30%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Customer & Product</th>
                <th className="w-[40%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Rating & Feedback</th>
                <th className="w-[15%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Timestamp</th>
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
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
                        <FaUser size={12} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs truncate" style={{ color: 'var(--page-text)' }}>{review.user?.name || "Anonymous"}</p>
                        <p className="text-[9px] font-bold opacity-30 uppercase tracking-tighter mb-1">Verified Buyer</p>
                        <div className="flex items-center gap-1.5 truncate text-slate-500">
                          <FaBoxOpen size={10} className="shrink-0" />
                          <span className="text-[10px] font-medium truncate">{review.product?.name || "Product Deleted"}</span>
                        </div>
                      </div>
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
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex gap-0.5">
                            {starValues.map(s => (
                              <FaStar key={s} className={s <= review.rating ? "text-amber-400" : "text-slate-200"} size={10} />
                            ))}
                          </div>
                          <span className="text-[10px] font-black text-slate-400">{review.rating}.0</span>
                        </div>
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
