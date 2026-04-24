import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FaHeart, FaList, FaRegHeart, FaRegStar, FaSearch, FaShoppingCart, FaSortAmountDown, FaStar, FaThLarge } from "react-icons/fa";
import API, { getImageUrl } from "../api";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { buildSearchSuggestions } from "../utils/productInsights";
import "./Shop.css";
import { ensureLoggedIn } from "../utils/authGuards";

const FALLBACK_IMAGE = "https://placehold.co/420x320/f1f5f9/64748b?text=No+Image";

const CATEGORY_STYLE_MAP = {
  "Mobiles": { emoji: "📱", accent: "category-card-phones", description: "Phones & Accessories" },
  "Laptops": { emoji: "💻", accent: "category-card-laptops", description: "Work & Gaming Laptops" },
  "Audio": { emoji: "🎧", accent: "category-card-audio", description: "Speakers & Headphones" },
  "Wearables": { emoji: "⌚", accent: "category-card-wearables", description: "Smart Watches" },
  "Tablets": { emoji: "📱", accent: "category-card-tablets", description: "iPad & Tablets" },
  "Accessories": { emoji: "🔌", accent: "category-card-accessories", description: "Tech Essentials" },
  "Peripherals": { emoji: "⌨️", accent: "category-card-peripherals", description: "Keyboards & Mice" },
};

const SORT_TABS = [
  { key: "recommended", label: "Recommended" },
  { key: "best-rated", label: "Best rated" },
  { key: "latest", label: "Latest" },
];

const VIEW_MODES = [
  { key: "list", label: "List view", icon: FaList },
  { key: "grid", label: "Grid view", icon: FaThLarge },
];

const RATING_OPTIONS = [4.5, 4, 3.5, 3];

const toCurrency = (value) => `INR ${Number(value || 0).toLocaleString("en-IN")}`;

const getPriceMeta = (product) => {
  const salePrice = Number(product?.price || 0);
  const compareAtPrice = Number(
    product?.compareAtPrice ||
    product?.originalPrice ||
    product?.mrp ||
    product?.listPrice ||
    0
  );

  const fallbackCompare = compareAtPrice > salePrice ? compareAtPrice : 0;
  const discountPercent =
    fallbackCompare > salePrice
      ? Math.round(((fallbackCompare - salePrice) / fallbackCompare) * 100)
      : Number(product?.discountPercentage || 0);

  return {
    salePrice,
    compareAtPrice: fallbackCompare,
    discountPercent,
    hasDiscount: discountPercent > 0 && fallbackCompare > salePrice,
  };
};

const getProductImage = (product) => {
  if (!product?.image) return FALLBACK_IMAGE;
  return getImageUrl(product.image);
};

const getRatingValue = (product) => Number(product?.averageRating || 0);

const matchesKeyword = (product, keywords) => {
  const haystack = `${product?.name || ""} ${product?.category || ""} ${product?.description || ""} ${product?.brand || ""}`.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
};

const StarRow = ({ value }) => {
  const rounded = Math.max(0, Math.min(5, value));
  return Array.from({ length: 5 }, (_, index) => {
    const filled = index + 1 <= rounded;
    return filled ? (
      <FaStar key={`star-${index}`} className="shop-star shop-star-filled" />
    ) : (
      <FaRegStar key={`star-${index}`} className="shop-star" />
    );
  });
};

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [allProductsForStats, setAllProductsForStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recommended");
  const [viewMode, setViewMode] = useState("list");
  const [wishlist, setWishlist] = useState([]);
  const [brandFilter, setBrandFilter] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchBlurTimeout = useRef(null);

  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryName } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const subCategory = searchParams.get("sub") || "";

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const { data } = await API.get("/products");
        setAllProductsForStats(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching all products for stats:", err);
      }
    };
    fetchAllProducts();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        if (categoryName) params.set("category", categoryName);
        if (subCategory) params.set("subCategory", subCategory);

        const url = params.toString() ? `/products?${params.toString()}` : "/products";
        const { data } = await API.get(url);
        setProducts(Array.isArray(data) ? data : []);

        // Reset price and brand filters when category changes to ensure products are visible
        setBrandFilter("all");
        setPriceMin("");
        setPriceMax("");
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryName, subCategory]);

  const productStats = useMemo(() => {
    const allPrices = products
      .map((product) => Number(product?.price || 0))
      .filter((price) => Number.isFinite(price));

    const min = allPrices.length ? Math.min(...allPrices) : 0;
    const max = allPrices.length ? Math.max(...allPrices) : 0;

    return { min, max };
  }, [products]);

  useEffect(() => {
    if (priceMin === "") setPriceMin(productStats.min ? String(productStats.min) : "");
    if (priceMax === "") setPriceMax(productStats.max ? String(productStats.max) : "");
  }, [priceMax, priceMin, productStats.max, productStats.min]);

  const categoryCards = useMemo(() => {
    // 1. Get all unique subcategories from products
    const subCats = {};
    allProductsForStats.forEach(p => {
      if (p.subCategory) {
        subCats[p.subCategory] = (subCats[p.subCategory] || 0) + 1;
      }
    });

    // 2. Map them to card objects
    return Object.keys(subCats).map(name => {
      const style = CATEGORY_STYLE_MAP[name] || { 
        emoji: "📦", 
        accent: "category-card-default", 
        description: `Explore our range of ${name}` 
      };
      return {
        label: name,
        sub: name,
        count: subCats[name],
        ...style
      };
    });
  }, [allProductsForStats]);

  const sidebarCategories = useMemo(() => {
    const names = Array.from(
      new Set(
        products
          .map((product) => product?.category?.trim())
          .filter(Boolean)
      )
    );

    return names.slice(0, 8);
  }, [products]);

  const brands = useMemo(() => {
    const names = products
      .map((product) => product?.brand || product?.supplier?.name || product?.manufacturer)
      .filter(Boolean);

    return Array.from(new Set(names)).slice(0, 8);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const min = Number(priceMin || 0);
    const max = Number(priceMax || Number.MAX_SAFE_INTEGER);
    const term = searchInput.trim().toLowerCase();

    return products.filter((product) => {
      const price = Number(product?.price || 0);
      const rating = getRatingValue(product);
      const brand = product?.brand || product?.supplier?.name || product?.manufacturer || "";
      const searchable = `${product?.name || ""} ${product?.category || ""} ${product?.description || ""} ${brand}`.toLowerCase();

      if (brandFilter !== "all" && brand !== brandFilter) return false;
      if (minRating > 0 && rating < minRating) return false;
      if (price < min || price > max) return false;
      if (term && !searchable.includes(term)) return false;
      return true;
    });
  }, [brandFilter, minRating, priceMax, priceMin, products, searchInput]);

  const visibleProducts = useMemo(() => {
    const list = [...filteredProducts];

    const score = (product) => {
      const rating = getRatingValue(product);
      const reviews = Number(product?.numReviews || 0);
      const price = Number(product?.price || 0);

      if (activeTab === "best-rated") return rating * 1000 + reviews;
      if (activeTab === "latest") return new Date(product?.createdAt || 0).getTime() || 0;
      return rating * 100 + reviews + Math.max(0, 100000 - price);
    };

    list.sort((a, b) => score(b) - score(a));
    return list;
  }, [activeTab, filteredProducts]);

  const statsLabel = useMemo(() => {
    if (categoryName) return `Category: ${categoryName}`;
    if (searchInput) return `Search results for "${searchInput}"`;
    if (subCategory) return `Subcategory: ${subCategory}`;
    return "Shop";
  }, [categoryName, searchInput, subCategory]);

  const searchSuggestions = useMemo(() => buildSearchSuggestions(products, searchInput, 6), [products, searchInput]);

  const updateSearch = (value) => {
    setSearchInput(value);

    const next = new URLSearchParams(searchParams);
    if (value.trim()) {
      next.set("search", value.trim());
    } else {
      next.delete("search");
    }
    setSearchParams(next, { replace: true });
  };

  const handleSearchFocus = () => {
    if (searchBlurTimeout.current) {
      clearTimeout(searchBlurTimeout.current);
      searchBlurTimeout.current = null;
    }
    setShowSearchSuggestions(true);
  };

  const handleSearchBlur = () => {
    searchBlurTimeout.current = window.setTimeout(() => {
      setShowSearchSuggestions(false);
      searchBlurTimeout.current = null;
    }, 120);
  };

  const handleSuggestionSelect = (suggestion) => {
    if (suggestion.query) {
      updateSearch(suggestion.query);
    }

    setShowSearchSuggestions(false);

    if (suggestion.productId) {
      navigate(`/product/${suggestion.productId}`);
    }
  };

  useEffect(() => {
    return () => {
      if (searchBlurTimeout.current) {
        clearTimeout(searchBlurTimeout.current);
      }
    };
  }, []);

  const toggleWishlist = (productId) => {
    setWishlist((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  };

  if (loading) {
    return (
      <div className="shop-page">
        <div className="container py-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 mb-0">Loading products...</p>
        </div>
      </div>
    );
  }

  const effectiveProducts = visibleProducts;

  return (
    <div className="shop-page">
      <section className="shop-hero">
        <div className="shop-hero-glow shop-hero-glow-left" />
        <div className="shop-hero-glow shop-hero-glow-right" />

        <div className="container position-relative">


          <div className="shop-hero-copy">
            <h1 className="text-white font-bold text-4xl md:text-6xl mb-4">
              {searchInput || subCategory || categoryName || "All Products"}
            </h1>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl">
              Explore our premium selection of electronics and gadgets.
            </p>
          </div>
        </div>
      </section>

      <section className="container shop-featured-categories">
        <div className="row g-3">
          {categoryCards.map((item) => (
            <div className="col-md-4" key={item.label}>
              <Link to={`/shop?sub=${encodeURIComponent(item.sub)}`} 
                className={`shop-category-card relative overflow-hidden rounded-[24px] p-6 min-h-[160px] group transition-all duration-500 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between ${
                  item.accent === 'category-card-phones' ? 'bg-gradient-to-br from-orange-600 to-red-800 text-white' :
                  item.accent === 'category-card-laptops' ? 'bg-gradient-to-br from-blue-700 to-indigo-950 text-white' :
                  item.accent === 'category-card-wearables' ? 'bg-gradient-to-br from-purple-600 to-indigo-900 text-white' :
                  item.accent === 'category-card-tablets' ? 'bg-gradient-to-br from-pink-600 to-rose-900 text-white' :
                  item.accent === 'category-card-audio' ? 'bg-gradient-to-br from-teal-600 to-emerald-950 text-white' :
                  'bg-gradient-to-br from-slate-700 to-slate-900 text-white'
                }`}
              >
                <div className="relative z-10 flex justify-between items-start">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-2xl shadow-inner border border-white/20">
                    {item.emoji}
                  </div>
                  <span className="text-xs font-bold bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
                    {item.count} items
                  </span>
                </div>

                <div className="relative z-10 mt-3">
                  <h3 className="text-xl font-black mb-1">{item.label}</h3>
                  <p className="text-[10px] opacity-80 font-medium line-clamp-1">{item.description}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="container shop-main">
        <div className="row g-4">
          <aside className="col-lg-3">
            <div className="shop-sidebar">
              <div className="shop-sidebar-card">
                <div className="shop-sidebar-title">
                  <span>Other category</span>
                </div>
                <div className="shop-category-list">
                  {sidebarCategories.length > 0 ? (
                    sidebarCategories.map((name) => (
                      <Link key={name} to={`/shop/category/${encodeURIComponent(name)}`} className="shop-category-link">
                        {name}
                      </Link>
                    ))
                  ) : (
                    <div className="shop-empty-note">No categories available yet.</div>
                  )}
                </div>
              </div>

              {brands.length > 0 && (
                <div className="shop-sidebar-card">
                  <div className="shop-sidebar-title">
                    <span>Brands</span>
                  </div>
                  <div className="shop-chip-list">
                    <button type="button" className={`shop-chip ${brandFilter === "all" ? "active" : ""}`} onClick={() => setBrandFilter("all")}>
                      All
                    </button>
                    {brands.map((brand) => (
                      <button
                        type="button"
                        key={brand}
                        className={`shop-chip ${brandFilter === brand ? "active" : ""}`}
                        onClick={() => setBrandFilter(brand)}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="shop-sidebar-card">
                <div className="shop-sidebar-title">
                  <span>Prices</span>
                </div>
                <div className="shop-price-grid">
                  <label>
                    <span>Min</span>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      placeholder={productStats.min ? String(productStats.min) : "0"}
                    />
                  </label>
                  <label>
                    <span>Max</span>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      placeholder={productStats.max ? String(productStats.max) : "0"}
                    />
                  </label>
                </div>
                <div className="shop-price-summary">
                  {productStats.min || productStats.max ? (
                    <span>
                      Range {toCurrency(productStats.min)} - {toCurrency(productStats.max)}
                    </span>
                  ) : (
                    <span>No price data yet</span>
                  )}
                </div>
              </div>

              <div className="shop-sidebar-card">
                <div className="shop-sidebar-title">
                  <span>Rating</span>
                </div>
                <div className="shop-rating-list">
                  <button type="button" className={`shop-rating-row ${minRating === 0 ? "active" : ""}`} onClick={() => setMinRating(0)}>
                    All ratings
                  </button>
                  {RATING_OPTIONS.map((rating) => (
                    <button
                      type="button"
                      key={rating}
                      className={`shop-rating-row ${minRating === rating ? "active" : ""}`}
                      onClick={() => setMinRating(rating)}
                    >
                      <span className="shop-rating-stars">
                        {Array.from({ length: 5 }, (_, index) => (
                          <FaStar key={`${rating}-${index}`} className={index < Math.floor(rating) ? "shop-star shop-star-filled" : "shop-star"} />
                        ))}
                      </span>
                      <span>{rating.toFixed(1)} &amp; up</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="col-lg-9">
            <div className="shop-toolbar">
              <div className="shop-tabs" role="tablist" aria-label="Product sorting tabs">
                {SORT_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`shop-tab ${activeTab === tab.key ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="shop-toolbar-controls">
                <label className="shop-sort-select">
                  <FaSortAmountDown />
                  <select
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value)}
                    aria-label="Sort products"
                  >
                    {SORT_TABS.map((tab) => (
                      <option key={tab.key} value={tab.key}>
                        {tab.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="shop-view-toggle" role="group" aria-label="View mode">
                  {VIEW_MODES.map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.key}
                        type="button"
                        className={`shop-view-btn ${viewMode === mode.key ? "active" : ""}`}
                        onClick={() => setViewMode(mode.key)}
                        aria-label={mode.label}
                      >
                        <Icon />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="shop-results-meta">
              <div>
                <span className="shop-results-label">{statsLabel}</span>
                <h2 className="shop-results-title">Browse products in cards, not plain text</h2>
              </div>
              <div className="shop-results-count">
                {effectiveProducts.length} product{effectiveProducts.length === 1 ? "" : "s"}
              </div>
            </div>

            {effectiveProducts.length === 0 ? (
              <div className="shop-empty-state">
                <FaSearch size={28} />
                <h4>No products found</h4>
                <p>Try clearing a filter or using a different category card.</p>
                <button
                  type="button"
                  className="shop-reset-btn"
                  onClick={() => {
                    setBrandFilter("all");
                    setMinRating(0);
                    setPriceMin(productStats.min ? String(productStats.min) : "");
                    setPriceMax(productStats.max ? String(productStats.max) : "");
                    setActiveTab("recommended");
                    setViewMode("list");
                  }}
                >
                  Reset filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="row g-4">
                {effectiveProducts.map((product) => (
                  <div className="col-md-6 col-xxl-4" key={product._id}>
                    <div className="shop-grid-product-card">
                      <Link to={`/product/${product._id}`} className="shop-grid-media">
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_IMAGE;
                          }}
                        />
                      </Link>
                      <div className="shop-grid-body">
                        <div className="shop-grid-topline">
                          <span>{product.category || "General"}</span>
                          <button
                            type="button"
                            className={`shop-wishlist-btn ${wishlist.includes(product._id) ? "active" : ""}`}
                            onClick={() => toggleWishlist(product._id)}
                            aria-label="Wishlist"
                          >
                            {wishlist.includes(product._id) ? <FaHeart /> : <FaRegHeart />}
                          </button>
                        </div>
                        <Link to={`/product/${product._id}`} className="shop-grid-title-link">
                          <h5>{product.name}</h5>
                        </Link>
                        {Number(product?.numReviews || 0) > 0 && (
                          <div className="shop-grid-rating">
                            <StarRow value={Math.round(getRatingValue(product))} />
                            <span>{getRatingValue(product).toFixed(1)}</span>
                          </div>
                        )}
                        <div className="shop-grid-price">
                          <strong>{toCurrency(getPriceMeta(product).salePrice)}</strong>
                          {getPriceMeta(product).hasDiscount && <del>{toCurrency(getPriceMeta(product).compareAtPrice)}</del>}
                        </div>
                        <div className="shop-grid-actions">
                          <button
                            className="btn btn-cart-action"
                            onClick={() => {
                              if (!ensureLoggedIn({ user, navigate, location, message: "Please login to add to cart" })) return;
                              addToCart(product);
                            }}
                          >
                            <FaShoppingCart className="me-2" />
                            Add to Cart
                          </button>
                          <button className="btn btn-outline-primary" onClick={() => navigate(`/product/${product._id}`)}>
                            View details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="shop-list">
                {effectiveProducts.map((product) => {
                  const priceMeta = getPriceMeta(product);
                  const rating = getRatingValue(product);
                  const stockLabel = Number(product?.stock || 0) > 0 ? `${product.stock} in stock` : "Out of stock";

                  return (
                    <article className="shop-list-card" key={product._id}>
                      <Link to={`/product/${product._id}`} className="shop-list-media">
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_IMAGE;
                          }}
                        />
                      </Link>

                      <div className="shop-list-copy">
                        <div className="shop-list-head">
                          <div>
                            <span className="shop-list-category">{product.category || "General"}</span>
                            <Link to={`/product/${product._id}`} className="shop-list-title-link">
                              <h3>{product.name}</h3>
                            </Link>
                          </div>
                          <button
                            type="button"
                            className={`shop-wishlist-btn ${wishlist.includes(product._id) ? "active" : ""}`}
                            onClick={() => toggleWishlist(product._id)}
                            aria-label="Wishlist"
                          >
                            {wishlist.includes(product._id) ? <FaHeart /> : <FaRegHeart />}
                          </button>
                        </div>

                        {Number(product?.numReviews || 0) > 0 ? (
                          <div className="shop-list-rating">
                            <StarRow value={Math.round(rating)} />
                            <span className="shop-list-rating-value">{rating.toFixed(1)}</span>
                            <span className="shop-list-rating-count">({Number(product?.numReviews || 0)} orders)</span>
                            <span className="shop-list-shipping">Free shipping</span>
                          </div>
                        ) : (
                          <div className="shop-list-rating">
                            <span className="shop-list-shipping ms-0">Free shipping</span>
                            <span className="badge bg-light text-dark ms-2">New</span>
                          </div>
                        )}

                        <p className="shop-list-description">
                          {product.description || "Short description about the product goes here, with features and buying details."}
                        </p>

                        <div className="shop-list-tags">
                          <span>{stockLabel}</span>
                          <span>{product.brand || product.supplier?.name || "Trusted seller"}</span>
                        </div>
                      </div>

                      <div className="shop-list-aside">
                        <div className="shop-list-price">
                          <strong>{toCurrency(priceMeta.salePrice)}</strong>
                          {priceMeta.hasDiscount && <del>{toCurrency(priceMeta.compareAtPrice)}</del>}
                        </div>
                        <button
                          className="btn btn-cart-action shop-list-cart-btn"
                          onClick={() => {
                            if (!ensureLoggedIn({ user, navigate, location, message: "Please login to add to cart" })) return;
                            addToCart(product);
                          }}
                        >
                          <FaShoppingCart className="me-2" />
                          Add to Cart
                        </button>
                        <button className="btn btn-buy-action shop-list-buy-btn" onClick={() => navigate(`/product/${product._id}`)}>
                          View details
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Shop;
