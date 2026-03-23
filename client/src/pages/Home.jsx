import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { getImageUrl } from "../api";
import { CartContext } from "../context/CartContext";
import {
  FaLayerGroup,
  FaTv,
  FaLaptop,
  FaMobileAlt,
  FaTshirt,
  FaCouch,
  FaCamera,
  FaGamepad,
  FaShoePrints,
} from "react-icons/fa";
import "./Home.css";

const FALLBACK_IMAGE =
  "https://via.placeholder.com/420x320/f1f5f9/64748b?text=No+Image";

const categoryIconMap = [
  { keywords: ["electronics"], icon: <FaTv className="category-icon" /> },
  { keywords: ["mobile", "phone", "mobiles"], icon: <FaMobileAlt className="category-icon" /> },
  { keywords: ["laptop", "laptops", "computers"], icon: <FaLaptop className="category-icon" /> },
  { keywords: ["fashion", "clothing", "apparel", "mens"], icon: <FaTshirt className="category-icon" /> },
  { keywords: ["home", "furniture", "decor"], icon: <FaCouch className="category-icon" /> },
  { keywords: ["photography", "camera", "audio"], icon: <FaCamera className="category-icon" /> },
  { keywords: ["gaming", "game", "consoles"], icon: <FaGamepad className="category-icon" /> },
  { keywords: ["shoe", "shoes", "footwear"], icon: <FaShoePrints className="category-icon" /> },
];

const pickCategoryIcon = (categoryName) => {
  if (!categoryName) return <FaLayerGroup className="category-icon" />;
  const normalized = categoryName.toLowerCase();
  const entry = categoryIconMap.find((item) =>
    item.keywords.some((keyword) => normalized.includes(keyword))
  );
  return entry?.icon || <FaLayerGroup className="category-icon" />;
};

const Home = () => {
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);

        const [{ data: productsData }, { data: categoriesData }] = await Promise.all([
          API.get("/products?limit=8&sortBy=createdAt&order=desc"),
          API.get("/categories"),
        ]);

        setFeaturedProducts(Array.isArray(productsData) ? productsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (error) {
        console.error("Home data fetch error:", error);
        setFeaturedProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleBuyNow = (product) => {
    navigate("/checkout", {
      state: {
        buyNowItem: {
          product,
          quantity: 1,
        },
      },
    });
  };

  return (
    <div className="home-modern">
      <section className="hero-modern position-relative overflow-hidden">
        <div className="hero-glow hero-glow-1"></div>
        <div className="hero-glow hero-glow-2"></div>

        <div className="container py-5 hero-content">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <span className="hero-badge">Premium Shopping Experience</span>
              <h1 className="hero-title mt-3">Style, Tech, Essentials. All in one place.</h1>
              <p className="hero-subtitle mt-3">
                Discover hand-picked products with fast delivery, secure checkout, and trusted quality.
              </p>

              <div className="d-flex flex-wrap gap-2 mt-4">
                <Link to="/shop" className="btn btn-warning px-4 fw-semibold">
                  Shop Now
                </Link>
                <Link to="/services" className="btn btn-outline-light px-4 fw-semibold">
                  Our Services
                </Link>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="hero-stat-grid">
                <div className="hero-stat-card">
                  <h4>{featuredProducts.length || 0}+</h4>
                  <p>Featured Items</p>
                </div>
                <div className="hero-stat-card">
                  <h4>{categories.length || 0}+</h4>
                  <p>Categories</p>
                </div>
                <div className="hero-stat-card">
                  <h4>24/7</h4>
                  <p>Support</p>
                </div>
                <div className="hero-stat-card">
                  <h4>100%</h4>
                  <p>Secure Payment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

<br></br>
      {/* <section className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold mb-0">Shop by Category</h3>
          <Link to="/shop" className="text-decoration-none fw-semibold">
            Browse all
          </Link>
        </div>

        {loading ? (
          <p className="text-muted">Loading categories...</p>
        ) : categories.length === 0 ? (
          <p className="text-muted">No categories available.</p>
        ) : (
          <div className="row g-3">
            {categories.map((cat, index) => (
              <div key={cat._id || cat.name} className="col-12 col-md-6 col-lg-4 fade-in-up" style={{ animationDelay: `${index * 80}ms` }}>
                <div className="category-modern-card h-100">
                  <Link
                    to={`/shop/category/${encodeURIComponent(cat.name)}`}
                    className="text-decoration-none"
                  >
                    <div className="category-card-header">
                      <div className="category-icon-wrapper">
                        {pickCategoryIcon(cat.name)}
                      </div>
                      <div>
                        <h5 className="category-label mb-1">{cat.name}</h5>
                        <p className="category-caption mb-0">
                          {cat.subCategories?.length
                            ? `${cat.subCategories.length} subcategories`
                            : "Browse products"}
                        </p>
                      </div>
                    </div>
                  </Link>

                  {Array.isArray(cat.subCategories) && cat.subCategories.length > 0 && (
                    <div className="sub-category-chip-list">
                      {cat.subCategories.map((subCategory) => (
                        <Link
                          key={`${cat._id || cat.name}-${subCategory}`}
                          to={`/shop/category/${encodeURIComponent(cat.name)}?sub=${encodeURIComponent(subCategory)}`}
                          className="sub-category-chip"
                        >
                          {subCategory}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section> */}

      <section className="container pb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold mb-0">Featured Products</h3>
          <Link to="/shop" className="btn btn-sm home-view-all">

            View All
          </Link>
        </div>

        {loading ? (
          <p className="text-muted">Loading featured products...</p>
        ) : featuredProducts.length === 0 ? (
          <p className="text-muted">No featured products found. Add products from admin panel.</p>
        ) : (
          <div className="row">
            {featuredProducts.map((product, index) => (
              <div className="col-sm-6 col-md-4 col-lg-3 mb-4 fade-in-up" style={{ animationDelay: `${index * 90}ms` }} key={product._id}>
                <div className="product-modern-card h-100">
                  <Link to={`/product/${product._id}`} className="text-decoration-none">
                    <div className="product-image-wrap">
                      <img
                        src={product.image ? getImageUrl(product.image) : FALLBACK_IMAGE}
                        className="card-img-top"
                        height="220"
                        alt={product.name}
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />
                    </div>
                  </Link>

                  <div className="card-body d-flex flex-column p-3">
                    <Link to={`/product/${product._id}`} className="text-decoration-none">
                      <h6 className="fw-bold mb-1">{product.name}</h6>
                    </Link>
                    <small className="text-muted mb-2">{product.category}</small>
                    <p className="text-success fw-bold mb-3">INR {product.price}</p>

                    <div className="d-grid gap-2 mt-auto">
                      <button className="btn btn-sm btn-cart-action" onClick={() => addToCart(product)}>
                        Add to Cart
                      </button>
                      <button className="btn btn-sm btn-buy-action" onClick={() => handleBuyNow(product)}>
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
