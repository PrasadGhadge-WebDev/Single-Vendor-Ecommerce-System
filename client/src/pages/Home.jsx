import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API, { getImageUrl } from "../api";
import { CartContext } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import { buildSmartRecommendations, loadRecentlyViewedProducts } from "../utils/productInsights";
import AOS from "aos";
import "aos/dist/aos.css";
import {
  FaArrowRight,
  FaAward,
  FaBoxOpen,
  FaBolt,
  FaFireAlt,
  FaGift,
  FaPercent,
  FaSearch,
  FaShieldAlt,
  FaShippingFast,
  FaShoppingCart,
  FaTags,
  FaThLarge,
  FaHistory,
  FaStar,
} from "react-icons/fa";
import "./Home.css";

const HERO_PILLS = [
  { label: "Secure checkout", icon: FaShieldAlt },
  { label: "Fast delivery", icon: FaShippingFast },
  { label: "Curated picks", icon: FaTags },
];

const QUICK_CATEGORIES = [
  {
    label: "Phones",
    emoji: "📱",
    query: "phone",
    accent: "home-category-phone",
  },
  {
    label: "Laptops",
    emoji: "💻",
    query: "laptop",
    accent: "home-category-laptop",
  },
  {
    label: "Audio",
    emoji: "🎧",
    query: "headphone",
    accent: "home-category-audio",
  },
];

const WHY_CHOOSE_US = [
  {
    title: "Fast Shipping",
    description: "Get your orders delivered to your doorstep in 2-3 business days.",
    icon: FaShippingFast,
    color: "var(--accent-color)"
  },
  {
    title: "Secure Payment",
    description: "Multi-layered security protocols to keep your transactions safe.",
    icon: FaShieldAlt,
    color: "#22c55e"
  },
  {
    title: "24/7 Support",
    description: "Our dedicated team is here to help you around the clock.",
    icon: FaBolt,
    color: "#f59e0b"
  },
  {
    title: "Best Offers",
    description: "Curated deals and flat discounts on top electronics every week.",
    icon: FaPercent,
    color: "#ef4444"
  }
];

const OFFERS_BANNER = {
  badge: "Limited Time Deal",
  title: "Flat 20% OFF",
  description: "Get a bold discount banner on the homepage so the page feels active and sales-driven.",
  code: "FLAT20",
};

const STATIC_TESTIMONIALS = [
  {
    product: { _id: "testimonial-1", name: "Dell XPS 13" },
    review: {
      _id: "testimonial-review-1",
      title: "Super smooth buying experience",
      comment:
        "The layout feels premium and easy to browse. The spotlight cards make products stand out instantly.",
      rating: 5,
      user: { name: "Ananya" },
    },
  },
  {
    product: { _id: "testimonial-2", name: "Sony WH-1000XM5" },
    review: {
      _id: "testimonial-review-2",
      title: "Great design, easy shopping",
      comment: "The homepage looks polished and the quick category cards help a lot on mobile.",
      rating: 5,
      user: { name: "Rohit" },
    },
  },
  {
    product: { _id: "testimonial-3", name: "MacBook Air" },
    review: {
      _id: "testimonial-review-3",
      title: "Feels like a real brand store",
      comment: "The hero, banner, and product sections make it feel complete and professional.",
      rating: 4,
      user: { name: "Meera" },
    },
  },
];

const SECTION_CONFIGS = [
  {
    key: "featuredProducts",
    eyebrow: "Featured Products",
    title: "Handpicked favorites",
    description: "Best products from the current catalog, surfaced first for stronger discovery.",
    icon: FaBoxOpen,
    accentClass: "home-section-featured",
    actionLabel: "View all",
    actionTo: "/shop",
  },
  {
    key: "newArrivals",
    eyebrow: "New Arrivals",
    title: "Fresh in store",
    description: "Newest additions to the catalog, shown as a quick browsing lane.",
    icon: FaGift,
    accentClass: "home-section-new",
    actionLabel: "See newest",
    actionTo: "/shop",
  },
  {
    key: "bestDeals",
    eyebrow: "Best Deals",
    title: "Best value picks",
    description: "Products with the strongest savings and most attractive discounts.",
    icon: FaPercent,
    accentClass: "home-section-deals",
    actionLabel: "Shop deals",
    actionTo: "/shop",
  },
  {
    key: "topSelling",
    eyebrow: "Top Selling",
    title: "Customer favorites",
    description: "Most reviewed and most engaging products, brought up for quick selection.",
    icon: FaAward,
    accentClass: "home-section-top",
    actionLabel: "Browse top sellers",
    actionTo: "/shop",
  },
  {
    key: "aiRecommendations",
    eyebrow: "AI Recommendations",
    title: "Smarter picks for you",
    description: "Uses browsing patterns, ratings, and catalog signals to surface the most relevant products.",
    icon: FaBolt,
    accentClass: "home-section-ai",
    actionLabel: "Explore more",
    actionTo: "/shop",
  },
  {
    key: "recentlyViewed",
    eyebrow: "Recently Viewed",
    title: "Pick up where you left off",
    description: "Your last explored products, saved locally for a smooth return to shopping.",
    icon: FaHistory,
    accentClass: "home-section-recent",
    actionLabel: "Continue browsing",
    actionTo: "/shop",
  },
];

const getPricingMeta = (product) => {
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

const sortByNewest = (items) =>
  [...items].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));

const sortByBiggestDiscount = (items) =>
  [...items]
    .map((product) => ({
      product,
      pricingMeta: getPricingMeta(product),
    }))
    .sort((a, b) => {
      const aScore = a.pricingMeta.hasDiscount ? a.pricingMeta.discountPercent : 0;
      const bScore = b.pricingMeta.hasDiscount ? b.pricingMeta.discountPercent : 0;
      return bScore - aScore;
    })
    .map(({ product }) => product);

const sortByPopularity = (items) =>
  [...items].sort((a, b) => {
    const aScore = Number(a?.numReviews || 0) * 10 + Number(a?.averageRating || 0);
    const bScore = Number(b?.numReviews || 0) * 10 + Number(b?.averageRating || 0);
    return bScore - aScore;
  });

const Home = () => {
  const { addToCart } = useContext(CartContext);
  const [allProducts, setAllProducts] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AOS.init({
      duration: 900,
      once: true,
      easing: "ease-out-cubic",
    });

    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const { data: productsData } = await API.get("/products?limit=24&sortBy=createdAt&order=desc");
        setAllProducts(Array.isArray(productsData) ? productsData : []);
      } catch (error) {
        console.error("Home data fetch error:", error);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

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

  const heroStats = useMemo(() => {
    const productsCount = allProducts.length;
    const dealsCount = allProducts.filter((product) => getPricingMeta(product).hasDiscount).length;
    const topRated = allProducts.filter((product) => Number(product?.averageRating || 0) >= 4).length;

    return [
      { value: `${productsCount}+`, label: "Products to explore" },
      { value: `${dealsCount}+`, label: "Discounted items" },
      { value: `${topRated}+`, label: "High-rated picks" },
    ];
  }, [allProducts]);

  const heroPreview = useMemo(() => {
    const sorted = sortByPopularity(allProducts);
    return sorted[0] || null;
  }, [allProducts]);

  const heroPricing = useMemo(() => getPricingMeta(heroPreview), [heroPreview]);

  const sections = useMemo(() => {
    const newest = sortByNewest(allProducts);
    return {
      featuredProducts: newest.slice(0, 8),
      newArrivals: newest.slice(0, 8),
      bestDeals: sortByBiggestDiscount(allProducts).slice(0, 8),
      topSelling: sortByPopularity(allProducts).slice(0, 8),
      aiRecommendations: buildSmartRecommendations(allProducts, heroPreview, recentlyViewed).slice(0, 8),
      recentlyViewed: recentlyViewed.slice(0, 8),
    };
  }, [allProducts, heroPreview, recentlyViewed]);

  const renderProductSection = (config, products, sectionIndex) => {
    const SectionIcon = config.icon;

    return (
      <section
        className={`home-product-section ${config.accentClass}`}
        data-aos="fade-up"
        data-aos-delay={sectionIndex * 80}
      >
        <div className="home-section-head">
          <div>
            <span className="home-section-eyebrow">
              <SectionIcon className="me-2" />
              {config.eyebrow}
            </span>
            <h3>{config.title}</h3>
            <p>{config.description}</p>
          </div>
          <Link to={config.actionTo} className="home-section-link">
            {config.actionLabel}
            <FaArrowRight size={12} />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="home-section-empty">
            <FaTags size={28} />
            <p>No products available in this section yet.</p>
          </div>
        ) : (
          <div className="row g-4">
            {products.slice(0, 4).map((product, index) => (
              <div className="col-sm-6 col-lg-3" key={product._id} data-aos="fade-up" data-aos-delay={index * 90}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="home-modern">
      <section className="home-hero">
        <div className="home-hero-glow home-hero-glow-left"></div>
        <div className="home-hero-glow home-hero-glow-right"></div>

        <div className="container position-relative">
          <div className="row align-items-center g-4">
            <div className="col-lg-6" data-aos="fade-up">
              <span className="home-hero-kicker">
                <FaBolt className="me-2" />
                Premium electronics storefront
              </span>
              <h1>
                Shop Smarter
                <span className="d-block">With a Curated</span>
                <span className="d-block home-hero-heading-accent">Premium Experience</span>
              </h1>
              <p className="home-hero-copy">
                We reorganized the landing page around discovery. A striking hero, quick categories, and purpose-built product sections make browsing feel effortless and fast.
              </p>

              <div className="home-hero-actions">
                <Link to="/shop" className="home-primary-btn">
                  <FaSearch />
                  Start Shopping
                </Link>
                <Link to="/offers" className="home-secondary-btn">
                  <FaFireAlt />
                  View Offers
                </Link>
              </div>

              <div className="home-hero-pills">
                {HERO_PILLS.map((pill) => {
                  const Icon = pill.icon;
                  return (
                    <span key={pill.label} className="home-hero-pill">
                      <Icon />
                      {pill.label}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="col-lg-6" data-aos="fade-left">
              <div className="home-hero-panel">
                <div className="home-hero-panel-copy">
                  <span className="home-hero-panel-label">Top spotlight</span>
                  <h2>{heroPreview?.name || "Most loved product"}</h2>
                  <p>
                    {heroPreview?.description || "Featured product insight appears here, giving the homepage a stronger visual anchor."}
                  </p>
                  <div className="home-hero-panel-meta">
                    <span className="hero-rating-badge">
                      {Number(heroPreview?.numReviews || 0) > 0 ? (
                        <>
                          <FaStar className="me-1" />
                          {Number(heroPreview?.averageRating || 0).toFixed(1)} ({Number(heroPreview?.numReviews || 0)} reviews)
                        </>
                      ) : (
                        "No reviews yet"
                      )}
                    </span>
                    <span className="hero-discount-badge">
                      <FaFireAlt className="me-1" />
                      {heroPricing.hasDiscount ? `${heroPricing.discountPercent}% OFF` : "Top pick"}
                    </span>
                  </div>
                </div>

                <div className="home-hero-panel-visual">
                  <div className="home-hero-image-frame home-hero-image-frame-premium">
                    <div className="home-hero-image-shadow" />
                    {heroPreview?.image ? (
                      <img
                        src={getImageUrl(heroPreview.image)}
                        alt={heroPreview.name}
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/640x520/f8fafc/64748b?text=Featured+Product";
                        }}
                      />
                    ) : (
                      <div className="home-hero-image-placeholder">
                        <FaThLarge />
                      </div>
                    )}
                    <div className="home-hero-image-floating">
                      <span className="home-hero-floating-chip">
                        <FaFireAlt />
                        {heroPricing.hasDiscount ? `${heroPricing.discountPercent}% OFF` : "Limited Drop"}
                      </span>
                      <span className="home-hero-floating-chip">
                        <FaAward />
                        {Number(heroPreview?.numReviews || 0) > 0 
                          ? `${Number(heroPreview?.averageRating || 0).toFixed(1)} rating`
                          : "New Product"
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="home-hero-panel-footer">
                  <div className="home-hero-price-stack">
                    <strong>₹{Number(heroPreview?.price || 0).toLocaleString("en-IN")}</strong>
                    {heroPricing.hasDiscount && heroPricing.compareAtPrice > heroPricing.salePrice && (
                      <span>₹{Number(heroPricing.compareAtPrice).toLocaleString("en-IN")}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="home-hero-cart-btn"
                    onClick={() => heroPreview && addToCart(heroPreview)}
                    disabled={!heroPreview}
                  >
                    <FaShoppingCart className="me-2" />
                    Add to cart
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="home-hero-stats" data-aos="fade-up" data-aos-delay="150">
            {heroStats.map((stat) => (
              <div className="home-stat-card" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container home-category-strip" data-aos="fade-up">
        <div className="home-category-strip-head">
          <div>
            <span className="home-category-strip-label">Quick browse</span>
            <h2>Jump into <span className="text-gradient-premium">top categories</span></h2>
          </div>
          <p>Built to help shoppers move quickly from the homepage to the product they actually want.</p>
        </div>

        <div className="row g-3">
          {QUICK_CATEGORIES.map((category, index) => (
            <div className="col-md-4" key={category.label} data-aos="fade-up" data-aos-delay={index * 100}>
              <Link to={`/shop?search=${encodeURIComponent(category.query)}`} className={`home-category-card ${category.accent}`}>
                <span className="home-category-emoji">{category.emoji}</span>
                <div>
                  <h3>{category.label}</h3>
                  <p>Browse popular {category.label.toLowerCase()} and accessories.</p>
                </div>
                <FaArrowRight className="home-category-arrow" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-5 my-5" data-aos="fade-up">
        <div className="home-benefits-head text-center mb-5">
          <span className="home-section-eyebrow justify-content-center">
            <FaAward className="me-2" />
            The MyShop Edge
          </span>
          <h2 className="fw-bold mt-2">Why experience our <span className="text-gradient-premium">premium service?</span></h2>
        </div>
        <div className="row g-4 justify-content-center">
          {WHY_CHOOSE_US.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div className="col-md-6 col-lg-3" key={benefit.title} data-aos="zoom-in" data-aos-delay={index * 100}>
                <div className="home-benefit-card h-100 p-4 text-center">
                  <div className="benefit-icon-wrap mb-4" style={{ backgroundColor: benefit.color }}>
                    <Icon color="#fff" size={24} />
                  </div>
                  <h4 className="fw-bold h5 mb-3">{benefit.title}</h4>
                  <p className="text-muted small mb-0">{benefit.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container py-5 my-4 home-showcase-wrap">
        <div className="home-showcase-intro" data-aos="fade-up">
          <span className="home-showcase-kicker">
            <FaFireAlt className="me-1" />
            Powerful Homepage
          </span>
          <h3 className="mb-2 mt-3">Curated collections for <span className="text-gradient-premium">stronger discovery</span></h3>
          <p className="mb-0">
            Four focused sections help users discover your strongest products faster, with cards doing the heavy lifting instead of plain text.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="home-sections-stack">
            {SECTION_CONFIGS.map((config, index) =>
              renderProductSection(config, sections[config.key], index)
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
