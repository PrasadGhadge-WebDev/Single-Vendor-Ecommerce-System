import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FaEdit, FaPlus, FaStar, FaTrash } from "react-icons/fa";
import API from "../../api";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";
import "./ManageReviews.css";
import { AuthContext } from "../../context/AuthContext";

const REVIEWS_PER_PAGE = 12;

const starValues = [1, 2, 3, 4, 5];
const initialForm = {
  productId: "",
  rating: 5,
  title: "",
  comment: "",
};

const ManageReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const [filters, setFilters] = useState({ productId: "", search: "", rating: 0 });
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [editPayload, setEditPayload] = useState({ rating: 5, title: "", comment: "" });
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [filterProductSearchTerm, setFilterProductSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const { user } = useContext(AuthContext);
  const canAddReview = Boolean(user?.isAdmin || user?.isSuperAdmin);

  const fetchProducts = async () => {
    try {
      const { data } = await API.get("/products?limit=500&sortBy=createdAt&order=desc");
      const list = Array.isArray(data) ? data : data?.products || [];
      setProducts(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Failed to load products", error);
      setProducts([]);
    }
  };

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
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
      toast.error(error.response?.data?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [filters.productId, filters.search, filters.rating, reviewPage]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    setReviewPage(1);
  }, [filters.productId, filters.search, filters.rating]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    const selected = products.find((product) => product._id === form.productId);
    setProductSearchTerm(selected?.name || "");
  }, [form.productId, products]);

  useEffect(() => {
    if (!filters.productId) {
      setFilterProductSearchTerm("");
      return;
    }
    const selected = products.find((product) => product._id === filters.productId);
    setFilterProductSearchTerm(selected?.name || "");
  }, [filters.productId, products]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const ratingButtonStyle = {
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
    lineHeight: 1,
  };

  const renderRatingPicker = (value, onChange) => (
    <div className="d-flex gap-1" role="radiogroup" aria-label="Rating">
      {starValues.map((star) => (
        <button
          key={`star-${star}-${value}`}
          type="button"
          className="p-0"
          style={ratingButtonStyle}
          aria-pressed={star === value}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          onClick={() => onChange(star)}
        >
          <FaStar className={`fs-5 ${star <= value ? "text-warning" : "text-muted"}`} />
        </button>
      ))}
    </div>
  );

  const renderStars = (value, options = {}) => {
    const { interactive = false, onClick } = options;
    const rounded = Math.min(5, Math.max(0, Math.round(value || 0)));
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const filled = starValue <= rounded;

      if (interactive) {
        return (
          <button
            key={`interactive-star-${starValue}`}
            type="button"
            className="btn btn-sm btn-link p-0 text-decoration-none text-reset"
            aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
            onClick={() => onClick?.(starValue)}
          >
            <FaStar className={`me-1 ${filled ? "text-warning" : "text-muted"}`} />
          </button>
        );
      }

      return (
        <FaStar key={`star-${starValue}`} className={`me-1 ${filled ? "text-warning" : "text-muted"}`} />
      );
    });
  };

  const findProductByName = (label) => {
    const normalized = String(label || "").trim().toLowerCase();
    if (!normalized) return null;
    return products.find((product) => String(product.name || "").trim().toLowerCase() === normalized) || null;
  };

  const handleProductSearchInput = (value) => {
    setProductSearchTerm(value);
    const matched = findProductByName(value);
    setForm((prev) => ({ ...prev, productId: matched?._id || "" }));
  };

  const handleFilterProductSearchInput = (value) => {
    setFilterProductSearchTerm(value);
    const matched = findProductByName(value);
    handleFilterChange("productId", matched?._id || "");
  };

  const productSuggestions = useMemo(() => {
    const term = filterProductSearchTerm.trim().toLowerCase();
    if (!term) {
      return [];
    }
    return products.filter((product) => String(product.name || "").toLowerCase().includes(term)).slice(0, 5);
  }, [filterProductSearchTerm, products]);

  const handleFilterProductDropdownSelect = (product) => {
    if (!product) return;
    handleFilterChange("productId", product._id);
    setFilterProductSearchTerm(product.name || "");
  };

  const handleRatingFilterChange = (value) => {
    setFilters((prev) => {
      const nextValue = prev.rating === value ? 0 : value;
      return nextValue === prev.rating ? prev : { ...prev, rating: nextValue };
    });
  };

  const clearRatingFilter = () => {
    setFilters((prev) => ({ ...prev, rating: 0 }));
  };

  const handleAddReview = async (event) => {
    event.preventDefault();
    if (!form.productId || !form.rating) {
      toast.warning("Product and rating are required");
      return;
    }

    try {
      setSaving(true);
      await API.post("/reviews", {
        productId: form.productId,
        rating: Number(form.rating),
        title: form.title.trim(),
        comment: form.comment.trim(),
      });
      toast.success("Review created");
      setForm(initialForm);
      setReviewPage(1);
      fetchReviews();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add review");
    } finally {
      setSaving(false);
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

  const handleEditChange = (field, value) => {
    setEditPayload((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateReview = async (id) => {
    if (!editPayload.rating) {
      toast.warning("Rating is required");
      return;
    }
    try {
      setUpdating(true);
      await API.put(`/reviews/${id}`, {
        rating: Number(editPayload.rating),
        title: editPayload.title.trim(),
        comment: editPayload.comment.trim(),
      });
      toast.success("Review updated");
      setEditingId(null);
      fetchReviews();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update review");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await API.delete(`/reviews/${id}`);
      toast.success("Review deleted");
      if (reviews.length === 1 && reviewPage > 1) {
        setReviewPage((prev) => Math.max(1, prev - 1));
      } else {
        fetchReviews();
      }
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete review");
    }
  };

  const selectedProduct = useMemo(() => {
    return products.find((product) => product._id === filters.productId) || null;
  }, [filters.productId, products]);

  const globalAverage = useMemo(() => {
    return averageRating ? averageRating.toFixed(2) : "0.00";
  }, [averageRating]);

  const ratingDistribution = useMemo(() => {
    const base = starValues.reduce((acc, value) => {
      acc[value] = 0;
      return acc;
    }, {});
    reviews.forEach((review) => {
      const rating = Math.min(5, Math.max(1, Math.round(review.rating || 0)));
      base[rating] = (base[rating] || 0) + 1;
    });
    return base;
  }, [reviews]);

  const distributionPercent = (star) => {
    if (!reviews.length) return 0;
    return Math.round((ratingDistribution[star] / reviews.length) * 100);
  };

  const formatReviewDate = (value) => (value ? new Date(value).toLocaleString() : "-");

  const filterSummary = `${selectedProduct?.name || "All products"} - ${
    filters.rating ? `${filters.rating}-star` : "All ratings"
  } - ${filters.search || "Any keyword"}`;

  useEffect(() => {
    if (!canAddReview) {
      setShowAddForm(false);
    }
  }, [canAddReview]);

  return (
    <div className="container-fluid py-3 reviews-page">

      <section className="stats-grid mb-4">
        <div className="stats-card">
          <div className="label">Overall rating</div>
          <div className="value">{globalAverage}</div>
          <div className="text-muted small">{totalReviews} reviews · {selectedProduct?.name || "All products"}</div>
        </div>
        <div className="stats-card">
          <div className="label">Active filters</div>
          <div className="value">{filters.rating ? `${filters.rating}★` : "All ★"}</div>
          <div className="text-muted small">{filters.search ? `Keyword: ${filters.search}` : "Keyword filter disabled"}</div>
        </div>
        <div className="stats-card">
          <div className="label">Page snapshot</div>
          <div className="value">
            {reviewPage} / {totalPages}
          </div>
          <div className="text-muted small">Updated whenever reviews change</div>
        </div>
      </section>

      <section className="card-panel card p-3 mb-3">
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2">
          <div>
            <h5 className="mb-1">Review filters</h5>
            <p className="text-muted mb-0">Slice the data like a modern marketplace dashboard.</p>
          </div>
          <div className="badge review-filter-badge px-3 py-2">{filterSummary}</div>
        </div>
        <div className="row g-3 align-items-end mt-2">
          <div className="col-md-4">
            <label className="form-label mb-1">Product</label>
            <input
              className="form-control"
              placeholder="Search product"
              value={filterProductSearchTerm}
              onChange={(e) => handleFilterProductSearchInput(e.target.value)}
              autoComplete="off"
            />
            <div className="suggestion-list mt-2">
              {filterProductSearchTerm.trim() ? (
                productSuggestions.map((product) => (
                  <button
                    key={`suggestion-${product._id}`}
                    type="button"
                    className={`suggestion-pill ${filters.productId === product._id ? "active" : ""}`}
                    onClick={() => handleFilterProductDropdownSelect(product)}
                  >
                    {product.name}
                  </button>
                ))
              ) : (
                <span className="suggestion-pill empty">Type to see suggestions</span>
              )}
              {filterProductSearchTerm.trim() && !productSuggestions.length && (
                <span className="suggestion-pill empty">No suggestions</span>
              )}
            </div>
          </div>
          <div className="col-md-4">
            <label className="form-label mb-1">Keyword</label>
            <input
              className="form-control"
              placeholder="Keyword in comment or title"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
            <small className="text-muted">Search comment/title text.</small>
          </div>
          <div className="col-md-4">
            <label className="form-label mb-1">Star rating</label>
            <div>{renderRatingPicker(filters.rating, handleRatingFilterChange)}</div>
            <button className="btn btn-sm btn-link p-0" type="button" onClick={clearRatingFilter}>
              Clear star filter
            </button>
          </div>
        </div>
        <div className="rating-distribution">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <small className="text-muted">Rating distribution (current page)</small>
            <small className="text-muted">{reviews.length} reviews</small>
          </div>
          {starValues
            .slice()
            .reverse()
            .map((star) => (
              <div key={`dist-${star}`} className="distribution-row">
                <div className="text-nowrap small">
                  {star} <FaStar className="text-warning" />
                </div>
                <div className="progress flex-grow-1">
                  <div className="progress-bar" role="progressbar" style={{ width: `${distributionPercent(star)}%` }} />
                </div>
                <span className="text-muted small">{ratingDistribution[star] || 0}</span>
              </div>
            ))}
        </div>
      </section>

      <section className="card-panel card p-3 mb-3">
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2 mb-3">
         
          {canAddReview ? (
            <button
              className={`btn btn-sm ${showAddForm ? "btn-outline-secondary" : "btn-primary"}`}
              type="button"
              onClick={() => setShowAddForm((prev) => !prev)}
            >
              {showAddForm ? "Hide form" : "Add review"}
            </button>
          ) : (
            <span className="text-muted small">Admin privilege required</span>
          )}
        </div>

        {canAddReview && showAddForm ? (
          <form className="row g-3" onSubmit={handleAddReview}>
            <div className="col-md-4">
              <label className="form-label mb-1">Product</label>
              <input
                className="form-control"
                placeholder="Enter product name"
                list="review-product-list"
                value={productSearchTerm}
                onChange={(e) => handleProductSearchInput(e.target.value)}
                required
              />
              <datalist id="review-product-list">
                {products.map((product) => (
                  <option key={product._id} value={product.name || ""} />
                ))}
              </datalist>
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1">Rating</label>
              {renderRatingPicker(form.rating, (value) => handleFormChange("rating", value))}
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1">Headline</label>
              <input
                className="form-control"
                placeholder="Short title"
                value={form.title}
                onChange={(e) => handleFormChange("title", e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label mb-1">Comment</label>
              <textarea
                className="form-control"
                rows={1}
                value={form.comment}
                placeholder="Optional feedback"
                onChange={(e) => handleFormChange("comment", e.target.value)}
              />
            </div>
            <div className="col-12 text-end">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Saving..." : <><FaPlus className="me-1" /> Add Review</>}
              </button>
            </div>
          </form>
        ) : canAddReview ? (
          <p className="text-muted small mb-0">Click “Add review” to open the form.</p>
        ) : (
          <p className="text-muted small mb-0">Only admins can submit reviews.</p>
        )}
      </section>

      <section className="card-panel card p-3">
        {loading ? (
          <p className="mb-0 text-center">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="mb-0 text-muted text-center">No reviews yet.</p>
        ) : (
          <>
            <div className="row g-3">
              {reviews.map((review) => (
                <div className="col-md-6" key={`card-${review._id}`}>
                  <article className="review-card h-100">
                    <div className="card-body">
                      {editingId === review._id ? (
                        <div className="review-card-edit">
                          <div className="row g-2">
                            <div className="col-12">
                              <label className="form-label mb-1">Rating</label>
                              {renderRatingPicker(editPayload.rating, (value) => handleEditChange("rating", value))}
                            </div>
                            <div className="col-12">
                              <label className="form-label mb-1">Headline</label>
                              <input
                                className="form-control"
                                value={editPayload.title}
                                onChange={(event) => handleEditChange("title", event.target.value)}
                              />
                            </div>
                            <div className="col-12">
                              <label className="form-label mb-1">Comment</label>
                              <textarea
                                className="form-control"
                                rows={2}
                                value={editPayload.comment}
                                onChange={(event) => handleEditChange("comment", event.target.value)}
                              />
                            </div>
                            <div className="col-12 d-flex gap-2">
                              <button
                                className="btn btn-success"
                                type="button"
                                onClick={() => handleUpdateReview(review._id)}
                                disabled={updating}
                              >
                                {updating ? "Saving..." : "Save changes"}
                              </button>
                              <button className="btn btn-outline-secondary" type="button" onClick={() => setEditingId(null)}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="d-flex align-items-start justify-content-between">
                            <div>
                              <h6 className="mb-1">{review.title || "Untitled"}</h6>
                              <p className="review-meta mb-0">{review.user?.name || "Anonymous"}</p>
                              <p className="review-meta mb-0">{review.product?.name || "Unknown product"}</p>
                            </div>
                            <div className="review-rating-group text-end">
                              {renderStars(review.rating)}
                              <span className="text-muted small">
                                {typeof review.rating === "number" ? review.rating.toFixed(1) : review.rating || "-"}
                              </span>
                            </div>
                          </div>
                          <p className="review-comment mt-3">{review.comment || "No comment provided."}</p>
                          <div className="d-flex align-items-center justify-content-between review-actions mt-3">
                            <small className="review-meta">Posted {formatReviewDate(review.createdAt)}</small>
                            <div className="d-flex gap-2">
                              <button className="btn btn-sm btn-outline-primary" onClick={() => startEdit(review)}>
                                <FaEdit />
                              </button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteReview(review._id)}>
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <Pagination currentPage={reviewPage} totalPages={totalPages} onPageChange={setReviewPage} />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default ManageReviews;
