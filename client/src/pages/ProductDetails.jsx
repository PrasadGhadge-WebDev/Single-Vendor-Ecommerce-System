import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API, { getImageUrl } from "../api";
import { CartContext } from "../context/CartContext";
import { FaChevronDown, FaChevronUp, FaStar } from "react-icons/fa";
import "./ProductDetails.css";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [buyQty, setBuyQty] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/products/${id}`);
      setProduct(data);
    } catch (err) {
      console.error("Product details error:", err);
      setError(err.response?.data?.message || "Product not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    try {
      setReviewLoading(true);
      const { data } = await API.get(`/reviews/product/${id}`);
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load reviews", err);
    } finally {
      setReviewLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const updateBuyQty = (next) => {
    const maxStock = Math.max(1, Number(product?.stock || 1));
    const safeQty = Math.min(maxStock, Math.max(1, Number(next) || 1));
    setBuyQty(safeQty);
  };

  const renderStars = (value) => {
    const rounded = Math.min(5, Math.max(0, Math.round(value || 0)));
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const filled = starValue <= rounded;
      return (
        <FaStar
          key={`star-${starValue}`}
          className={`me-1 ${filled ? "text-warning" : "text-muted"}`}
        />
      );
    });
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error || "Product not found"}</div>
        <Link to="/shop" className="btn btn-outline-primary">
          Back to Shop
        </Link>
      </div>
    );
  }

  const averageRating = Number(product.averageRating || 0);
  const reviewCount = Number(product.numReviews || 0);
  const maxStock = Math.max(1, Number(product.stock || 1));

  return (
    <div className="container py-5 product-details-page">
      <button type="button" className="btn btn-sm btn-outline-secondary mb-4" onClick={() => navigate(-1)}>
        Back
      </button>

      <div className="row g-4 align-items-start">
        <div className="col-md-5">
          <div className="card border-0 shadow-sm">
            {product.image ? (
              <img
                src={getImageUrl(product.image)}
                alt={product.name}
                className="card-img-top"
                style={{ maxHeight: "460px", objectFit: "cover" }}
              />
            ) : (
              <div className="p-5 text-center text-muted">No image available</div>
            )}
          </div>
        </div>

        <div className="col-md-7">
          <h2 className="fw-bold mb-2">{product.name}</h2>
          <p className="text-muted mb-2">Category: {product.category || "-"}</p>
          <h4 className="text-success fw-bold mb-3">INR {product.price}</h4>

          <p className="mb-4" style={{ whiteSpace: "pre-line" }}>
            {product.description || "No description available."}
          </p>

          <div className="buy-qty-wrap mb-3">
            <label className="form-label mb-1">Quantity</label>
            <div className="buy-qty-controls">
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => updateBuyQty(buyQty - 1)}>
                -
              </button>
              <input
                type="number"
                min="1"
                max={maxStock}
                className="form-control form-control-sm"
                value={buyQty}
                onChange={(e) => updateBuyQty(e.target.value)}
              />
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => updateBuyQty(buyQty + 1)}>
                +
              </button>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-cart-action" onClick={() => addToCart(product)}>
              Add to Cart
            </button>
            <button className="btn btn-outline-primary" onClick={() => navigate("/shop")}>
              Continue Shopping
            </button>
            <button
              className="btn btn-buy-action"
              disabled={Number(product.stock || 0) <= 0}
              onClick={() =>
                navigate("/checkout", {
                  state: {
                    buyNowItem: {
                      product,
                      quantity: buyQty,
                    },
                  },
                })
              }
            >
              Buy Now
            </button>
          </div>

          <hr className="my-4" />

          <div className="row g-2">
            <div className="col-sm-6">
              <div className="p-3 border rounded product-stat-card">
                <small className="d-block product-stat-label">Stock</small>
                <strong className={product.stock > 0 ? "product-stock-in" : "product-stock-out"}>
                  {product.stock > 0 ? `${product.stock} available` : "Out of stock"}
                </strong>
              </div>
            </div>
            <div className="col-sm-6">
            
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mt-5">
        <div className="col-lg-7">
          <div className="card shadow-sm">
            <div className="card-header d-flex flex-column align-items-start gap-2">
              <div className="d-flex align-items-center gap-3 w-100 flex-wrap">
                <h5 className="mb-0">Customer Reviews</h5>
                <div className="text-muted small">{reviews.length} review{reviews.length === 1 ? "" : "s"}</div>
              </div>
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <span className="fw-semibold">Rating {averageRating.toFixed(1)} / 5</span>
                <span className="text-muted small">({reviewCount} review{reviewCount === 1 ? "" : "s"})</span>
                <div className="d-flex align-items-center">
                  {renderStars(averageRating)}
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  onClick={() => setReviewsExpanded((prev) => !prev)}
                >
                  {reviewsExpanded ? (
                    <>
                      <FaChevronUp />
                      Hide reviews
                    </>
                  ) : (
                    <>
                      <FaChevronDown />
                      Show reviews
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="card-body">
              {!reviewsExpanded ? (
                <p className="text-muted mb-0">Click "Show reviews" to read customer feedback.</p>
              ) : reviewLoading ? (
                <p className="text-muted mb-0">Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <p className="text-muted mb-0">No reviews yet.</p>
              ) : (
                reviews.map((review) => (
                  <div key={review._id} className="border-bottom pb-3 mb-3 last-child-border-0">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <strong>{review.user?.name || "Anonymous"}</strong>
                        <div className="d-flex align-items-center mt-1">
                          {renderStars(review.rating)}
                          <span className="ms-2 text-muted">{review.rating}</span>
                        </div>
                      </div>
                      <small className="text-muted">{new Date(review.createdAt).toLocaleDateString()}</small>
                    </div>
                    <p className="mb-0 mt-2 text-wrap">
                      {review.comment || <span className="text-muted">No comment provided.</span>}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
