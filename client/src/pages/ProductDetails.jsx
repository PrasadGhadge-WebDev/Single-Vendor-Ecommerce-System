import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import API, { getImageUrl } from "../api";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { FaChevronDown, FaChevronUp, FaStar, FaShoppingCart, FaBolt, FaShieldAlt, FaTruck, FaArrowLeft, FaMinus, FaPlus } from "react-icons/fa";
import ProductCard from "../components/ProductCard";
import {
  buildSmartRecommendations,
  loadRecentlyViewedProducts,
  recordRecentlyViewedProduct,
} from "../utils/productInsights";
import "./ProductDetails.css";
import { ensureLoggedIn } from "../utils/authGuards";

const FALLBACK_IMAGE = "https://placehold.co/800x800/f1f5f9/64748b?text=No+Image";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(null);
  const [buyQty, setBuyQty] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(false); // Default to collapsed to save space
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/products/${id}`);
      setProduct(data);
      setActiveImage(data.image || (data.images && data.images[0]) || null);
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

  const fetchCatalogProducts = useCallback(async () => {
    try {
      const { data } = await API.get("/products");
      setCatalogProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load catalog products", err);
      setCatalogProducts([]);
    }
  }, []);

  useEffect(() => {
    loadProduct();
    window.scrollTo(0, 0);
  }, [loadProduct]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    fetchCatalogProducts();
  }, [fetchCatalogProducts]);

  useEffect(() => {
    const syncRecentlyViewed = () => {
      setRecentlyViewed(loadRecentlyViewedProducts());
    };

    syncRecentlyViewed();
    window.addEventListener("recently-viewed-updated", syncRecentlyViewed);
    window.addEventListener("storage", syncRecentlyViewed);

    return () => {
      window.removeEventListener("recently-viewed-updated", syncRecentlyViewed);
      window.removeEventListener("storage", syncRecentlyViewed);
    };
  }, []);

  useEffect(() => {
    if (!product) return;
    setRecentlyViewed(recordRecentlyViewedProduct(product));
  }, [product]);

  const recommendationProducts = useMemo(
    () => buildSmartRecommendations(catalogProducts, product, recentlyViewed).slice(0, 8),
    [catalogProducts, product, recentlyViewed]
  );
  
  const recentlyViewedProducts = useMemo(
    () => recentlyViewed.filter((item) => item?._id !== product?._id).slice(0, 8),
    [recentlyViewed, product]
  );

  const updateBuyQty = (next) => {
    const maxStock = Math.max(1, Number(product?.stock || 1));
    const safeQty = Math.min(maxStock, Math.max(1, Number(next) || 1));
    setBuyQty(safeQty);
  };

  const renderStars = (value, size = "1rem") => {
    const rounded = Math.min(5, Math.max(0, Math.round(value || 0)));
    return (
      <div className="d-flex align-items-center gap-1">
        {Array.from({ length: 5 }, (_, index) => {
          const starValue = index + 1;
          const filled = starValue <= rounded;
          return (
            <FaStar
              key={`star-${starValue}`}
              style={{ fontSize: size }}
              className={filled ? "text-warning" : "text-muted opacity-30"}
            />
          );
        })}
      </div>
    );
  };

  const [zoomStyle, setZoomStyle] = useState({ display: "none" });

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomStyle({
      display: "block",
      backgroundPosition: `${x}% ${y}%`,
      backgroundImage: `url(${activeImage ? getImageUrl(activeImage) : FALLBACK_IMAGE})`,
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: "none" });
  };

  if (loading) {
    return (
      <div className="product-details-page d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-grow text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted font-bold tracking-widest uppercase text-[12px]">Preparing Experience...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-details-page d-flex align-items-center justify-content-center">
        <div className="text-center p-5 reviews-glass-card">
          <h2 className="font-black mb-4">{error || "Product Not Found"}</h2>
          <Link to="/shop" className="btn btn-primary px-4 rounded-pill">
            Explore Collection
          </Link>
        </div>
      </div>
    );
  }

  const averageRating = Number(product.averageRating || 0);
  const reviewCount = Number(product.numReviews || 0);
  const maxStock = Math.max(1, Number(product.stock || 0));

  return (
    <div className="product-details-page bg-white">
      <div className="container py-4">
        {/* Breadcrumb / Back button */}
        <nav className="mb-4">
          <button 
            className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-medium text-sm"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft size={12} />
            <span>Back to Products</span>
          </button>
        </nav>

        <div className="row g-5">
          {/* Left: Gallery Column (Thumbnails + Main Image) */}
          <div className="col-lg-7">
            <div className="row g-3">
              {/* Vertical Thumbnails (Desktop) */}
              <div className="col-2 d-none d-md-block">
                <div className="flex flex-col gap-2 custom-scrollbar overflow-y-auto max-h-[500px] pr-2">
                  {[product.image, ...(product.images || [])].filter(Boolean).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300 bg-gray-50 p-1 ${
                        activeImage === img ? 'border-blue-600 shadow-sm scale-105' : 'border-transparent hover:border-gray-100'
                      }`}
                    >
                      <img 
                        src={getImageUrl(img)} 
                        alt={`Thumbnail ${idx}`} 
                        className="w-full h-full object-contain"
                        onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Image View */}
              <div className="col-12 col-md-10">
                <div 
                  className="product-main-image-container relative bg-white border border-gray-100 rounded-[24px] overflow-hidden cursor-zoom-in group shadow-sm max-h-[500px]"
                  style={{ aspectRatio: "1/1" }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <img
                    src={activeImage ? getImageUrl(activeImage) : FALLBACK_IMAGE}
                    alt={product.name}
                    className="w-full h-full object-contain mix-blend-mode-multiply transition-opacity duration-500 p-6"
                    key={activeImage}
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                  />
                  
                  {/* Zoom Overlay */}
                  <div 
                    className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                    style={{
                      ...zoomStyle,
                      backgroundSize: '250%',
                      backgroundRepeat: 'no-repeat',
                      backgroundColor: '#fff'
                    }}
                  />

                  {/* Discount Badge */}
                  {product.compareAtPrice > product.price && (
                    <div className="absolute top-6 left-6 bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg z-10 uppercase tracking-widest">
                      {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF
                    </div>
                  )}
                </div>

                {/* Mobile Thumbnails (Visible only on small screens) */}
                <div className="d-md-none mt-4 flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                  {[product.image, ...(product.images || [])].filter(Boolean).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                        activeImage === img ? 'border-blue-600' : 'border-gray-100'
                      }`}
                    >
                      <img src={getImageUrl(img)} alt="thumb" className="w-full h-full object-contain bg-gray-50" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="col-lg-5">
            <div className="product-info-sticky top-24">
              <div className="mb-2">
                <span className="text-blue-600 font-bold text-xs uppercase tracking-widest">{product.category}</span>
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-3 leading-tight">{product.name}</h1>
              
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1">
                  {renderStars(averageRating, "0.9rem")}
                </div>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                  {averageRating.toFixed(1)} • {reviewCount} Reviews
                </span>
                <div className="h-4 w-px bg-gray-200"></div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-green-600 text-xs font-black uppercase tracking-widest">In Stock</span>
                </div>
              </div>

              <div className="mb-6 p-3 bg-gray-50 rounded-2xl border border-gray-100 inline-block min-w-[180px]">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-gray-900">₹{Number(product.price).toLocaleString("en-IN")}</span>
                  {product.compareAtPrice > product.price && (
                    <span className="text-lg text-gray-400 line-through font-medium">₹{Number(product.compareAtPrice).toLocaleString("en-IN")}</span>
                  )}
                </div>
                <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mt-0.5">Inclusive of all taxes & shipping</p>
              </div>

              <div className="mb-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed text-xs lg:text-sm">
                  {product.description || "No description available for this product."}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="qty-selector-modern flex items-center border-2 border-gray-100 rounded-xl overflow-hidden bg-gray-50">
                    <button 
                      className="p-2 hover:bg-white transition-colors disabled:opacity-30" 
                      onClick={() => updateBuyQty(buyQty - 1)} 
                      disabled={buyQty <= 1}
                    >
                      <FaMinus size={10} />
                    </button>
                    <input 
                      type="number" 
                      className="w-10 text-center bg-transparent font-bold text-gray-900 border-none focus:ring-0 text-sm" 
                      value={buyQty} 
                      onChange={(e) => updateBuyQty(e.target.value)}
                    />
                    <button 
                      className="p-2 hover:bg-white transition-colors disabled:opacity-30" 
                      onClick={() => updateBuyQty(buyQty + 1)} 
                      disabled={buyQty >= maxStock}
                    >
                      <FaPlus size={10} />
                    </button>
                  </div>
                  
                  <button
                    className="flex-grow py-3 bg-gray-900 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2 text-xs shadow-lg shadow-gray-200"
                    onClick={() => {
                      if (!ensureLoggedIn({ user, navigate, location, message: "Please login to add to cart" })) return;
                      addToCart({ ...product, quantity: buyQty });
                    }}
                    disabled={maxStock <= 0}
                  >
                    <FaShoppingCart size={14} /> Add to Cart
                  </button>
                </div>

                <button
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs shadow-lg shadow-blue-50"
                  disabled={maxStock <= 0}
                  onClick={() => {
                    if (!ensureLoggedIn({ user, navigate, location, message: "Please login to buy now" })) return;
                    navigate("/checkout", {
                      state: {
                        buyNowItem: { product, quantity: buyQty },
                      },
                    });
                  }}
                >
                  <FaBolt size={12} /> Buy It Now
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><FaShieldAlt /></div>
                  <span className="text-[11px] font-bold uppercase text-gray-500">Secure Payment</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><FaTruck /></div>
                  <span className="text-[11px] font-bold uppercase text-gray-500">Free Shipping</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="reviews-section animate-fade-in-up delay-2">
          <div className="reviews-glass-card">
            <div className="row align-items-center mb-5">
              <div className="col-md-6">
                <h2 className="shelf-title mb-0">Experience Hub</h2>
                <p className="text-muted mt-2">Discover what our community has to say about this excellence.</p>
              </div>
              <div className="col-md-6 text-md-end">
                <button 
                  className="btn btn-outline-primary rounded-pill px-4 py-2 font-bold"
                  onClick={() => setReviewsExpanded(!reviewsExpanded)}
                >
                  {reviewsExpanded ? "Condense Reviews" : `Read ${reviews.length} Stories`}
                </button>
              </div>
            </div>

            {reviewsExpanded && (
              <div className="reviews-list">
                {reviewLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" />
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-muted italic">Be the first to share your journey with this product.</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review._id} className="review-item">
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <div className="review-avatar">
                          {(review.user?.name || "A")[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-black text-lg">{review.user?.name || "Anonymous User"}</div>
                          <div className="d-flex align-items-center gap-2">
                            {renderStars(review.rating, "0.8rem")}
                            <span className="text-muted text-xs font-bold">{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <p className="mb-0 text-muted-text leading-relaxed">
                        {review.comment || "An exceptional choice with outstanding performance."}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>

        {/* AI Recommendations Shelf */}
        <section className="modern-shelf animate-fade-in-up delay-3">
          <div className="text-center mb-5">
            <span className="shelf-kicker">Curated for you</span>
            <h2 className="shelf-title">You might also desire</h2>
          </div>
          
          <div className="row g-4">
            {recommendationProducts.length === 0 ? (
              <div className="col-12 text-center text-muted">Analyzing your preferences...</div>
            ) : (
              recommendationProducts.slice(0, 4).map((item) => (
                <div className="col-sm-6 col-lg-3" key={`ai-${item._id}`}>
                  <ProductCard product={item} />
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recently Viewed Shelf */}
        {recentlyViewedProducts.length > 0 && (
          <section className="modern-shelf">
            <div className="text-center mb-5">
              <span className="shelf-kicker">Continue Discovery</span>
              <h2 className="shelf-title">Your Browsing Sanctuary</h2>
            </div>
            
            <div className="row g-4">
              {recentlyViewedProducts.slice(0, 4).map((item) => (
                <div className="col-sm-6 col-lg-3" key={`recent-${item._id}`}>
                  <ProductCard product={item} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
