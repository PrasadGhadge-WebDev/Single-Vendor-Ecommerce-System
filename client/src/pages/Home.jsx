import React, { useContext, useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { getImageUrl } from "../api";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";
import {
  FaArrowRight, FaShieldAlt, FaShippingFast, FaUndo, FaHeadset, FaLaptop,
  FaHeadphones, FaStopwatch, FaMobileAlt, FaPlug, FaGamepad, FaCamera,
  FaChevronLeft, FaChevronRight, FaCheckCircle, FaMoneyBillWave
} from "react-icons/fa";


const TRUST_BADGES = [
  { title: "Free Delivery", subtitle: "on orders ₹999+", icon: FaShippingFast },
  { title: "Cash on Delivery", subtitle: "Available pan India", icon: FaMoneyBillWave },
  { title: "7 Days Easy Returns", subtitle: "No questions asked", icon: FaUndo },
  { title: "100% Authentic", subtitle: "Verified products", icon: FaCheckCircle }
];

const WHY_CHOOSE_US = [
  { title: "Safe Shopping", subtitle: "256-bit secure payment protection", icon: FaShieldAlt },
  { title: "Quick Shipping", subtitle: "Fast delivery within 3–5 business days", icon: FaShippingFast },
  { title: "Help Anytime", subtitle: "24/7 live customer support", icon: FaHeadset }
];

const SLIDES = [
  {
    badge: "🔥 Top Spotlight",
    title: "Discover Premium Electronics",
    subhead: "The latest gadgets and tech accessories at your fingertips.",
    price: "Great Deals",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    btnPrimary: "🎧 Shop Now",
    btnSecondary: "🔍 Explore"
  },
  {
    badge: "✨ New Release",
    title: "Upgrade Your Lifestyle",
    subhead: "Find the perfect balance of performance and style.",
    price: "Limited Time",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    btnPrimary: "🛒 Order Now",
    btnSecondary: "Details"
  }
];

const CATEGORY_STYLE_MAP = {
  "Mobiles": { emoji: "📱", accent: "category-card-phones", description: "Smartphones & Accessories" },
  "Laptops": { emoji: "💻", accent: "category-card-laptops", description: "Powerhouses for work & play" },
  "Audio": { emoji: "🎧", accent: "category-card-audio", description: "Immersive sound experiences" },
  "Wearables": { emoji: "⌚", accent: "category-card-wearables", description: "Smart watches & fitness trackers" },
  "Tablets": { emoji: "平板", accent: "category-card-tablets", description: "Versatile digital canvases" },
  "Accessories": { emoji: "🔌", accent: "category-card-accessories", description: "Essential tech complements" },
  "Peripherals": { emoji: "⌨️", accent: "category-card-peripherals", description: "Input & output devices" },
};

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = useMemo(() => {
    if (products.length === 0) return SLIDES;

    return products.slice(0, 5).map((p, index) => ({
      badge: index === 0 ? "🔥 Top spotlight" : index === 1 ? "✨ New Arrival" : "⚡ Featured Deal",
      title: p.name,
      subhead: p.description || "Premium electronics at unbeatable prices. Experience the next generation of tech today.",
      price: `₹${p.price.toLocaleString()}`,
      image: getImageUrl(p.image),
      btnPrimary: "🛒 Buy Now",
      btnSecondary: "🔍 Explore",
      id: p._id
    }));
  }, [products]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  }, [heroSlides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          API.get("/products?limit=100"),
          API.get("/categories")
        ]);
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
        setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      } catch (error) {
        console.error("Home data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);


  const newArrivals = useMemo(() => [...products].reverse().slice(0, 8), [products]);

  const dynamicCategoryCards = useMemo(() => {
    // 1. Get all unique subcategories from products
    const subCats = {};
    products.forEach(p => {
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
  }, [products]);

  return (
    <div className="home-modern bg-surface-2 min-h-screen pb-20 md:pb-0 transition-colors duration-400 border-t-2 border-x-2 border-theme max-w-[1600px] mx-auto">
      {/* Hero Slider Section - Expanded for cinematic fit */}
      <section className="relative min-h-[500px] h-[calc(100vh-80px)] lg:h-[calc(100vh-100px)] overflow-hidden bg-surface-1 flex items-center mt-[60px] md:mt-[80px] lg:mt-[100px]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

        <div className="relative w-full h-full">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 flex items-center transition-all duration-1000 transform ${index === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20 invisible'}`}
            >
              <div className="w-full max-w-[95%] 2xl:max-w-[1600px] mx-auto px-4 md:px-8 xl:px-12 grid md:grid-cols-2 items-center gap-12 py-20">
                <div className="space-y-6 md:space-y-10 z-10 animate-fade-in-up">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-primary px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                    <span className="w-2 h-2 bg-primary rounded-full animate-ping" />
                    {slide.badge}
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black text-primary-text leading-[0.9] tracking-tighter">
                    {slide.title}
                  </h1>
                  <p className="text-muted-text text-base md:text-xl max-w-lg line-clamp-2 opacity-80">
                    {slide.subhead}
                  </p>

                  <div className="flex items-center gap-6 mt-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-muted-text uppercase tracking-widest opacity-60">Price from</span>
                      <span className="text-4xl md:text-6xl font-black text-primary drop-shadow-sm">{slide.price}</span>
                    </div>
                    {slide.discount && (
                      <div className="bg-danger/10 text-danger border border-danger/20 px-3 py-1 rounded-lg font-black text-xs">
                        {slide.discount}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 pt-6">
                    <Link
                      to={slide.id ? `/product/${slide.id}` : "/shop"}
                      className="bg-primary hover:bg-primary-dark text-white font-black px-8 py-4 rounded-2xl transition-all shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:-translate-y-1 flex items-center gap-3 border-2 border-black/20"
                    >
                      {slide.btnPrimary} <FaArrowRight />
                    </Link>
                    <Link
                      to={slide.id ? `/product/${slide.id}` : "/shop"}
                      className="bg-surface-1/90 backdrop-blur-xl border-2 border-primary/40 hover:border-primary text-primary font-black px-8 py-4 rounded-2xl transition-all hover:-translate-y-1 shadow-sm hover:shadow-md"
                    >
                      {slide.btnSecondary}
                    </Link>
                  </div>
                </div>

                <div className="hidden md:flex justify-center items-center h-full relative group">
                  <div className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-primary/10 to-accent/10 rounded-full blur-3xl animate-pulse group-hover:scale-110 transition-transform duration-1000" />
                  <div className="relative p-8 bg-white/5 backdrop-blur-md rounded-[60px] border border-white/10 shadow-2xl transition-transform duration-700 group-hover:rotate-2">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="relative max-h-[380px] object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.4)] animate-float"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls removed as requested, keeping indicators and auto-motion */}


        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-4 z-20">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-500 ${index === currentSlide ? 'w-12 bg-primary' : 'w-4 bg-primary/20 hover:bg-primary/40'}`}
            />
          ))}
        </div>
      </section>

      {/* Trust Badges - Repositioned for breathing room */}
      <section className="w-[98%] max-w-[1700px] mx-auto relative z-30 mb-20 mt-8 md:mt-12 lg:mt-16">
        <div className="bg-surface-1 rounded-[32px] shadow-[0_12px_40px_rgb(0,0,0,0.08)] p-8 lg:p-10 grid grid-cols-2 lg:grid-cols-4 gap-8 border border-white">
          {TRUST_BADGES.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <div className="flex items-center gap-4 group" key={idx}>
                <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center text-2xl group-hover:bg-secondary group-hover:text-white transition-all">
                  <Icon />
                </div>
                <div>
                  <h5 className="font-bold text-primary-text leading-tight">{badge.title}</h5>
                  <p className="text-muted-text text-xs mt-1">{badge.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Products Sections */}
      {loading ? (
        <section className="container mx-auto px-4 mb-20">
          <div className="h-10 w-48 bg-gray-200 animate-pulse rounded mb-10" />
          <div className="flex flex-wrap justify-center gap-[25px]">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-[260px] h-[420px] bg-gray-100 animate-pulse rounded-[24px]" />
            ))}
          </div>
        </section>
      ) : (
        <>

          {/* New Arrivals Section */}
          {newArrivals.length > 0 && (
            <section className="w-full max-w-[95%] 2xl:max-w-[1600px] mx-auto px-2 sm:px-4 mb-20">
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <h2 className="text-3xl md:text-4xl font-black text-primary-text tracking-tight uppercase">New Arrivals</h2>
                  <div className="h-1.5 w-20 bg-primary rounded-full" />
                </div>
                <Link to="/shop" className="group flex items-center gap-3 text-primary font-black uppercase text-sm tracking-widest hover:gap-5 transition-all">
                  Shop All <FaArrowRight className="text-xs" />
                </Link>
              </div>
              <div className="flex flex-wrap justify-center gap-[25px]">
                {newArrivals.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Why Choose Us - Modern Premium Redesign */}
      <section className="relative w-full h-[320px] overflow-hidden flex flex-col justify-center" style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}>
        {/* Subtle blue blurred circles in background */}
        <div className="absolute top-0 left-1/4 w-24 h-24 bg-blue-500/20 rounded-full blur-[50px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-36 h-36 bg-blue-600/10 rounded-full blur-[70px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 w-full">
          <h2 className="text-white text-[32px] font-bold mb-6 text-center uppercase tracking-widest leading-none">
            WHY CHOOSE ELECTROHUB?
          </h2>

          <div className="flex flex-col md:flex-row flex-wrap md:flex-nowrap justify-center items-center gap-[16px] w-full max-w-4xl mx-auto mb-6">
            {WHY_CHOOSE_US.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 p-[16px] rounded-[16px] shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center group w-full md:w-[220px] h-[130px]"
                >
                  <div className="w-[45px] h-[45px] bg-blue-600 rounded-full flex items-center justify-center text-white text-lg mb-2 shadow-[0_0_8px_rgba(37,99,235,0.5)] group-hover:scale-110 transition-transform duration-300 shrink-0">
                    <Icon />
                  </div>
                  <h4 className="text-white font-bold text-sm mb-1">{item.title}</h4>
                  <p className="text-gray-400 text-[10px] leading-snug">{item.subtitle}</p>
                </div>
              );
            })}
          </div>

          {/* Trust statistics below cards */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 border-t border-white/10 pt-4 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-white text-xl md:text-2xl font-black mb-0.5">10K+</div>
              <div className="text-gray-400 text-[9px] md:text-[10px] font-semibold uppercase tracking-wider">Happy Customers</div>
            </div>
            <div className="hidden md:block w-px h-6 md:h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-white text-xl md:text-2xl font-black mb-0.5">500+</div>
              <div className="text-gray-400 text-[9px] md:text-[10px] font-semibold uppercase tracking-wider">Products</div>
            </div>
            <div className="hidden md:block w-px h-6 md:h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-white text-xl md:text-2xl font-black mb-0.5">99.8%</div>
              <div className="text-gray-400 text-[9px] md:text-[10px] font-semibold uppercase tracking-wider">Secure Payments</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
