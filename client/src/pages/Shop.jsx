import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { 
  FaChevronDown, 
  FaList, 
  FaThLarge, 
  FaCheckCircle, 
  FaTag, 
  FaFilter, 
  FaTimes, 
  FaSearch, 
  FaChevronRight,
  FaRedo
} from "react-icons/fa";
import API, { getImageUrl } from "../api";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";
import "./Shop.css";
import { ensureLoggedIn } from "../utils/authGuards";

const FALLBACK_IMAGE = "https://placehold.co/420x320/f1f5f9/64748b?text=No+Image";

const SORT_TABS = [
  { key: "recommended", label: "Recommended" },
  { key: "best-rated", label: "Best Rated" },
  { key: "latest", label: "Latest" },
];

const VIEW_MODES = [
  { key: "grid", icon: FaThLarge },
  { key: "list", icon: FaList },
];

const toCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getPriceMeta = (product) => {
  const salePrice = Number(product?.price || 0);
  const compareAtPrice = Number(
    product?.compareAtPrice ||
    product?.originalPrice ||
    product?.mrp ||
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

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [adminCategories, setAdminCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recommended");
  const [viewMode, setViewMode] = useState("grid");
  const [brandFilter, setBrandFilter] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyOnSale, setOnlyOnSale] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryName } = useParams();
  const [searchParams] = useSearchParams();
  const subCategory = searchParams.get("sub") || "";
  const searchTerm = searchParams.get("search") || "";

  useEffect(() => {
    const fetchAdminCategories = async () => {
      try {
        const { data } = await API.get("/categories");
        setAdminCategories(Array.isArray(data) ? data : data?.categories || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchAdminCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (categoryName) params.set("category", categoryName);
        if (subCategory) params.set("subCategory", subCategory);
        if (searchTerm) params.set("search", searchTerm);

        const url = params.toString() ? `/products?${params.toString()}` : "/products";
        const { data } = await API.get(url);
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryName, subCategory, searchTerm]);

  const productStats = useMemo(() => {
    const prices = products.map(p => Number(p.price || 0)).filter(p => p > 0);
    return {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0
    };
  }, [products]);

  const brands = useMemo(() => {
    const names = products
      .map((p) => p?.brand || p?.supplier?.name || p?.manufacturer)
      .filter(Boolean);
    return Array.from(new Set(names));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const price = Number(p.price || 0);
      const brand = p.brand || p.supplier?.name || p.manufacturer || "";
      
      if (brandFilter !== "all" && brand !== brandFilter) return false;
      if (onlyInStock && Number(p.stock || 0) <= 0) return false;
      if (onlyOnSale && !getPriceMeta(p).hasDiscount) return false;
      if (priceMin && price < Number(priceMin)) return false;
      if (priceMax && price > Number(priceMax)) return false;
      
      return true;
    });
  }, [products, brandFilter, onlyInStock, onlyOnSale, priceMin, priceMax]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (activeTab === "best-rated") {
      list.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (activeTab === "latest") {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  }, [filteredProducts, activeTab]);

  const clearFilters = () => {
    setBrandFilter("all");
    setPriceMin("");
    setPriceMax("");
    setOnlyInStock(false);
    setOnlyOnSale(false);
    setActiveTab("recommended");
  };

  if (loading) {
    return (
      <div className="shop-page d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-page">
      <div className="shop-main-layout">
        {/* Overlay for mobile */}
        <div 
          className={`sidebar-overlay ${isMobileSidebarOpen ? "show" : ""}`} 
          onClick={() => setIsMobileSidebarOpen(false)}
        />

        <aside className={`shop-sidebar-wrapper ${isMobileSidebarOpen ? "show" : ""}`}>
          {/* Categories Section */}
          <div className="shop-sidebar-card">
            <div className="shop-sidebar-title">
              <span>Categories</span>
              <FaFilter size={10} />
            </div>
            <div className="shop-category-list">
              <Link 
                to="/shop" 
                className={`shop-category-link ${!categoryName && !subCategory ? 'active' : ''}`}
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <span>All Products</span>
                <FaChevronRight size={10} />
              </Link>
              {adminCategories.map((cat) => (
                <div key={cat._id} className="shop-category-group">
                  <Link
                    to={`/shop/category/${encodeURIComponent(cat.name)}`}
                    className={`shop-category-link ${categoryName === cat.name ? 'active' : ''}`}
                    onClick={() => setIsMobileSidebarOpen(false)}
                  >
                    <span>{cat.name}</span>
                    <FaChevronRight size={10} />
                  </Link>
                  {categoryName === cat.name && Array.isArray(cat.subCategories) && cat.subCategories.length > 0 && (
                    <div className="ms-4 my-2 d-grid gap-1 border-start ps-3">
                      {cat.subCategories.map((sub) => (
                        <Link
                          key={sub}
                          to={`/shop/category/${encodeURIComponent(cat.name)}?sub=${encodeURIComponent(sub)}`}
                          className={`text-xs py-1 transition-colors ${subCategory === sub ? "text-primary font-black" : "text-muted hover:text-primary"}`}
                          onClick={() => setIsMobileSidebarOpen(false)}
                        >
                          {sub}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preferences Section */}
          <div className="shop-sidebar-card">
            <div className="shop-sidebar-title">
              <span>Preferences</span>
            </div>
            <div className="filter-chip-group">
              <button 
                className={`filter-chip ${onlyInStock ? 'active' : ''}`}
                onClick={() => setOnlyInStock(!onlyInStock)}
              >
                In Stock Only
              </button>
              <button 
                className={`filter-chip ${onlyOnSale ? 'active' : ''}`}
                onClick={() => setOnlyOnSale(!onlyOnSale)}
              >
                On Sale
              </button>
            </div>
          </div>

          {/* Brands Section */}
          {brands.length > 0 && (
            <div className="shop-sidebar-card">
              <div className="shop-sidebar-title">
                <span>Brands</span>
              </div>
              <div className="filter-chip-group">
                <button 
                  className={`filter-chip ${brandFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setBrandFilter('all')}
                >
                  All
                </button>
                {brands.map((brand) => (
                  <button
                    key={brand}
                    className={`filter-chip ${brandFilter === brand ? 'active' : ''}`}
                    onClick={() => setBrandFilter(brand)}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price Range Section */}
          <div className="shop-sidebar-card">
            <div className="shop-sidebar-title">
              <span>Price Range</span>
            </div>
            <div className="d-flex gap-2 mb-3">
              <input
                type="number"
                placeholder="Min"
                className="form-control form-control-sm border-0 bg-light rounded-pill px-3"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
              />
              <input
                type="number"
                placeholder="Max"
                className="form-control form-control-sm border-0 bg-light rounded-pill px-3"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
              />
            </div>
            <div className="text-[10px] font-bold text-muted text-uppercase tracking-wider">
              {toCurrency(productStats.min)} - {toCurrency(productStats.max)}
            </div>
          </div>

          {/* Reset Filters */}
          <button 
            className="btn btn-link text-danger text-decoration-none p-0 mt-4 font-bold text-xs d-flex align-items-center gap-2"
            onClick={clearFilters}
          >
            <FaRedo size={10} /> CLEAR ALL FILTERS
          </button>
        </aside>

        <main className="shop-content-area">
          <div className="shop-toolbar">
            <div className="shop-tabs">
              {SORT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={`shop-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="shop-view-controls">
              <div className="shop-results-count">
                {sortedProducts.length} Items Found
              </div>
              <div className="shop-view-toggle">
                {VIEW_MODES.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.key}
                      className={`view-toggle-btn ${viewMode === mode.key ? 'active' : ''}`}
                      onClick={() => setViewMode(mode.key)}
                    >
                      <Icon size={14} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {sortedProducts.length === 0 ? (
            <div className="shop-empty-state">
              <FaSearch size={48} className="text-light mb-4" />
              <h3 className="font-black">No products found</h3>
              <p className="text-muted">Try adjusting your filters or search terms.</p>
              <button className="btn btn-dark mt-4 rounded-pill px-4" onClick={clearFilters}>
                Reset Filters
              </button>
            </div>
          ) : (
            <div className={`shop-products-grid ${viewMode === 'grid' ? 'grid-view' : 'list-view'}`}>
              {sortedProducts.map((product) => (
                <div key={product._id} className="shop-product-item">
                  {viewMode === "grid" ? (
                    <ProductCard product={product} />
                  ) : (
                    <div className="bg-white p-4 rounded-[24px] shadow-sm border border-light transition-all hover:shadow-xl group">
                      <div className="row g-4 align-items-center">
                        <div className="col-md-3">
                          <Link to={`/product/${product._id}`} className="overflow-hidden rounded-[20px] d-block aspect-square bg-light p-3">
                            <img
                              src={getProductImage(product)}
                              alt={product.name}
                              className="w-100 h-100 object-contain transition-transform duration-500 group-hover:scale-110"
                            />
                          </Link>
                        </div>
                        <div className="col-md-6">
                          <div className="text-primary font-bold text-[10px] uppercase tracking-widest mb-2">
                            {product.category || "General"}
                          </div>
                          <Link to={`/product/${product._id}`} className="text-decoration-none text-dark hover:text-primary transition-colors">
                            <h3 className="font-black text-xl mb-2">{product.name}</h3>
                          </Link>
                          <p className="text-muted text-sm line-clamp-2 mb-3">
                            {product.description || "Premium quality product with exceptional design and performance."}
                          </p>
                          <div className="d-flex align-items-center gap-3">
                            <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${Number(product?.stock || 0) > 0 ? "bg-success bg-opacity-10 text-success" : "bg-danger bg-opacity-10 text-danger"}`}>
                              {Number(product?.stock || 0) > 0 ? "In Stock" : "Out of Stock"}
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3 text-md-end d-flex flex-column gap-3">
                          <div>
                            <div className="font-black text-2xl text-dark mb-1">
                              {toCurrency(getPriceMeta(product).salePrice)}
                            </div>
                            {getPriceMeta(product).hasDiscount && (
                              <del className="text-muted text-sm">
                                {toCurrency(getPriceMeta(product).compareAtPrice)}
                              </del>
                            )}
                          </div>
                          <button
                            className="btn btn-dark w-100 py-3 rounded-[16px] font-black uppercase tracking-widest text-[10px] hover:bg-black"
                            onClick={() => {
                              if (!ensureLoggedIn({ user, navigate, location, message: "Please login to add to cart" })) return;
                              addToCart(product);
                            }}
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <button 
        className="mobile-filter-btn"
        onClick={() => setIsMobileSidebarOpen(true)}
      >
        <FaFilter size={20} />
      </button>
    </div>
  );
};

export default Shop;
