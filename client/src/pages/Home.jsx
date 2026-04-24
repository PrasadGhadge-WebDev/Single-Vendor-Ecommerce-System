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
  { title: "Secure Checkout", subtitle: "SSL encrypted", icon: FaShieldAlt },
  { title: "Fast Delivery", subtitle: "within 3-5 days", icon: FaShippingFast },
  { title: "24/7 Support", subtitle: "Call/WhatsApp", icon: FaHeadset }
];

const SLIDES = [
  {
    badge: "🔥 Top Spotlight",
    title: "Immerse Yourself in Pure Audio",
    subhead: "Premium spatial audio + ANC | 40hr battery",
    price: "₹12,499",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    btnPrimary: "🎧 Shop Now",
    btnSecondary: "🔍 View Deal",
    linkPrimary: "/shop?sub=Audio",
    linkSecondary: "/shop?search=JBL"
  },
  {
    badge: "✨ New Release",
    title: "Smartwatch Pro - Track Your Fitness",
    subhead: "Advanced health monitoring, GPS, and water resistant up to 50m.",
    price: "₹4,999",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    btnPrimary: "⌚ Order Now",
    btnSecondary: "Details",
    linkPrimary: "/shop?search=Apple%20Watch",
    linkSecondary: "/shop?search=Apple%20Watch"
  },
  {
    badge: "🎮 Gamer's Choice",
    title: "Gaming Laptop Sale",
    subhead: "Experience high-end gaming with RTX 40-series graphics and 165Hz display.",
    price: "₹49,999 onwards",
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    btnPrimary: "🚀 Level Up",
    btnSecondary: "Specs",
    linkPrimary: "/shop?sub=Laptops",
    linkSecondary: "/shop?sub=Laptops"
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

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
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
    <div className="bg-surface-2 min-h-screen pb-20 md:pb-0 transition-colors duration-400">
      {/* Hero Slider Section */}
      <section className="relative h-[400px] md:h-[600px] overflow-hidden bg-surface-1">
        <div className="relative w-full h-full">
          {SLIDES.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 flex items-center transition-all duration-1000 transform ${index === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12 invisible'}`}
            >
              <div className="container mx-auto px-4 grid md:grid-cols-2 items-center h-full">
                <div className="space-y-4 md:space-y-6 z-10">
                  <div className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">{slide.badge}</div>
                  <h1 className="text-4xl md:text-7xl font-black text-primary-text leading-tight">
                    {slide.title}
                  </h1>
                  <p className="text-muted-text text-sm md:text-lg max-w-lg">
                    {slide.subhead}
                  </p>

                  <div className="flex items-baseline gap-4 mt-8">
                    <span className="text-3xl md:text-5xl font-black text-primary">{slide.price}</span>
                    {slide.originalPrice && <span className="text-gray-400 line-through text-lg">{slide.originalPrice}</span>}
                    {slide.discount && <span className="bg-danger text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">{slide.discount}</span>}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Link to={slide.linkPrimary} className="bg-primary hover:bg-primary-dark text-white font-black px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-200">
                      {slide.btnPrimary}
                    </Link>
                    <Link to={slide.linkSecondary} className="bg-white border-2 border-gray-100 hover:border-primary text-gray-800 font-bold px-8 py-4 rounded-xl transition-all">
                      {slide.btnSecondary}
                    </Link>
                  </div>
                </div>
                <div className="hidden md:flex justify-center items-center h-full relative">
                  <div className="absolute w-[400px] h-[400px] bg-primary/5 rounded-full animate-pulse" />
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="relative max-h-[450px] object-contain drop-shadow-2xl animate-bounce-slow"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white/50 backdrop-blur-md rounded-full text-gray-800 hover:bg-primary hover:text-white transition-all shadow-lg z-20">
          <FaChevronLeft />
        </button>
        <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white/50 backdrop-blur-md rounded-full text-gray-800 hover:bg-primary hover:text-white transition-all shadow-lg z-20">
          <FaChevronRight />
        </button>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-20">
          {SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-10 bg-primary' : 'w-2 bg-gray-200'}`}
            />
          ))}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="container mx-auto px-4 -mt-10 relative z-30 mb-20">
        <div className="bg-surface-1 rounded-3xl shadow-2xl p-8 grid grid-cols-2 lg:grid-cols-4 gap-8 border border-theme">
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[400px] bg-gray-100 animate-pulse rounded-3xl" />
            ))}
          </div>
        </section>
      ) : (
        <>

          {/* New Arrivals Section */}
          {newArrivals.length > 0 && (
            <section className="container mx-auto px-4 mb-20">
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <h2 className="text-3xl md:text-4xl font-black text-primary-text tracking-tight uppercase">New Arrivals</h2>
                  <div className="h-1.5 w-20 bg-primary rounded-full" />
                </div>
                <Link to="/shop" className="group flex items-center gap-3 text-primary font-black uppercase text-sm tracking-widest hover:gap-5 transition-all">
                  Shop All <FaArrowRight className="text-xs" />
                </Link>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                {newArrivals.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </section>
          )}

        </>
      )}

      {/* Why Choose Us */}
      <section className="w-full px-4 mb-16">
        <div className="bg-dark rounded-[32px] py-10 md:py-14 text-center shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-white text-2xl md:text-4xl font-black mb-10 italic">Why Choose ElectroHub?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 w-full max-w-7xl mx-auto px-6">
              {WHY_CHOOSE_US.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex flex-col items-center space-y-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 text-primary rounded-xl flex items-center justify-center text-xl md:text-2xl shadow-inner ring-1 ring-white/20 transition-transform hover:scale-110">
                      <Icon />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-white font-black text-lg md:text-xl uppercase tracking-tight">{item.title}</h4>
                      <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[200px] mx-auto opacity-80">{item.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
