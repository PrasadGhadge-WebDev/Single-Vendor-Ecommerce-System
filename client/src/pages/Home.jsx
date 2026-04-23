import React, { useContext, useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { getImageUrl } from "../api";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";
import {
  FaArrowRight, FaShieldAlt, FaShippingFast, FaUndo, FaHeadset, FaLaptop, 
  FaHeadphones, FaStopwatch, FaMobileAlt, FaPlug, FaGamepad, FaCamera,
  FaChevronLeft, FaChevronRight, FaStar, FaQuoteLeft, FaCheckCircle, FaMoneyBillWave
} from "react-icons/fa";

const CATEGORIES = [
  { name: "Laptops", icon: FaLaptop },
  { name: "Audio", icon: FaHeadphones },
  { name: "Headphones", icon: FaHeadphones },
  { name: "Smartwatches", icon: FaStopwatch },
  { name: "Mobiles", icon: FaMobileAlt },
  { name: "Accessories", icon: FaPlug },
  { name: "Gaming", icon: FaGamepad },
  { name: "Cameras", icon: FaCamera }
];

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

const TESTIMONIALS = [
  { text: "Great product! Fast delivery and COD option is very convenient.", author: "Rahul S.", rating: 5, avatar: "https://i.pravatar.cc/150?u=rahul" },
  { text: "Authentic electronics at the best prices. Highly recommended!", author: "Priya M.", rating: 5, avatar: "https://i.pravatar.cc/150?u=priya" },
  { text: "Excellent customer service and easy returns process.", author: "Ankit K.", rating: 4, avatar: "https://i.pravatar.cc/150?u=ankit" }
];

const SLIDES = [
  {
    badge: "🔥 Top Spotlight",
    title: "Immerse Yourself in Pure Audio",
    subhead: "Next-gen spatial audio + ANC | 40hr battery",
    price: "₹24,999",
    originalPrice: "₹29,999",
    discount: "17% OFF",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    btnPrimary: "🎧 Shop Now",
    btnSecondary: "🔍 View Deal"
  },
  {
    badge: "✨ New Release",
    title: "Smartwatch Pro - Track Your Fitness",
    subhead: "Advanced health monitoring, GPS, and water resistant up to 50m.",
    price: "₹4,999",
    tag: "Free COD available",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    btnPrimary: "⌚ Order Now",
    btnSecondary: "Details"
  },
  {
    badge: "🎮 Gamer's Choice",
    title: "Gaming Laptop Sale",
    subhead: "Experience high-end gaming with RTX 40-series graphics and 165Hz display.",
    price: "₹49,999 onwards",
    tag: "No Cost EMI available",
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    btnPrimary: "🚀 Level Up",
    btnSecondary: "Specs"
  }
];

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({ h: 12, m: 45, s: 30 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { h, m, s } = prev;
        if (s > 0) s--;
        else {
          s = 59;
          if (m > 0) m--;
          else {
            m = 59;
            if (h > 0) h--;
          }
        }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 font-mono">
      <span className="bg-black text-white px-2.5 py-1 rounded-lg font-bold text-lg">{String(timeLeft.h).padStart(2, '0')}h</span>
      <span className="font-black text-xl">:</span>
      <span className="bg-black text-white px-2.5 py-1 rounded-lg font-bold text-lg">{String(timeLeft.m).padStart(2, '0')}m</span>
      <span className="font-black text-xl">:</span>
      <span className="bg-black text-white px-2.5 py-1 rounded-lg font-bold text-lg">{String(timeLeft.s).padStart(2, '0')}s</span>
    </div>
  );
};

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
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
        const { data } = await API.get("/products?limit=12");
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Home data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const flashSaleProducts = useMemo(() => products.slice(0, 4), [products]);
  const newArrivals = useMemo(() => [...products].reverse().slice(0, 8), [products]);

  return (
    <div className="bg-light-bg min-h-screen pb-20 md:pb-0">
      {/* Hero Slider Section */}
      <section className="relative h-[400px] md:h-[600px] overflow-hidden bg-white">
        <div className="relative w-full h-full">
          {SLIDES.map((slide, index) => (
            <div 
              key={index} 
              className={`absolute inset-0 flex items-center transition-all duration-1000 transform ${index === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12 invisible'}`}
            >
              <div className="container mx-auto px-4 grid md:grid-cols-2 items-center h-full">
                <div className="space-y-4 md:space-y-6 z-10">
                  <div className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">{slide.badge}</div>
                  <h1 className="text-4xl md:text-7xl font-black text-gray-900 leading-tight">
                    {slide.title}
                  </h1>
                  <p className="text-gray-500 text-sm md:text-lg max-w-lg">
                    {slide.subhead}
                  </p>
                  
                  <div className="flex items-baseline gap-4 mt-8">
                     <span className="text-3xl md:text-5xl font-black text-primary">{slide.price}</span>
                     {slide.originalPrice && <span className="text-gray-400 line-through text-lg">{slide.originalPrice}</span>}
                     {slide.discount && <span className="bg-danger text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">{slide.discount}</span>}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Link to="/shop" className="bg-primary hover:bg-primary-dark text-white font-black px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-200">
                      {slide.btnPrimary}
                    </Link>
                    <Link to="/shop" className="bg-white border-2 border-gray-100 hover:border-primary text-gray-800 font-bold px-8 py-4 rounded-xl transition-all">
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
        <div className="bg-white rounded-3xl shadow-2xl p-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {TRUST_BADGES.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <div className="flex items-center gap-4 group" key={idx}>
                <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center text-2xl group-hover:bg-secondary group-hover:text-white transition-all">
                  <Icon />
                </div>
                <div>
                  <h5 className="font-bold text-gray-900 leading-tight">{badge.title}</h5>
                  <p className="text-gray-400 text-xs mt-1">{badge.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Category Section */}
      <section className="container mx-auto px-4 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900">Shop by Category</h2>
          <p className="text-gray-500 mt-2">Explore our premium selection of tech gadgets</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-6">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <Link to={`/shop?search=${encodeURIComponent(cat.name)}`} key={cat.name} className="group flex flex-col items-center gap-4 no-underline">
                <div className="w-full aspect-square bg-white border border-gray-100 rounded-3xl shadow-sm flex items-center justify-center transition-all duration-300 group-hover:border-primary group-hover:shadow-xl group-hover:-translate-y-2">
                  <Icon className="text-4xl text-gray-600 group-hover:text-primary transition-colors" />
                </div>
                <span className="font-bold text-gray-800 text-sm group-hover:text-primary">{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Flash Sale */}
      <section className="container mx-auto px-4 mb-20">
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-[40px] p-8 md:p-12 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32" />
          
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <h2 className="text-3xl font-black text-gray-900 italic">Flash Sale</h2>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ending In:</span>
                <CountdownTimer />
              </div>
            </div>
            <Link to="/shop" className="group flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest no-underline">
              View All Deals <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {flashSaleProducts.map((product) => (
              <div className="relative group" key={product._id}>
                <div className="absolute top-4 right-4 bg-danger text-white text-[10px] font-black px-3 py-1 rounded-full z-10 animate-pulse-slow">HURRY UP!</div>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="container mx-auto px-4 mb-20">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">New Arrivals</h2>
            <p className="text-gray-500 mt-2">Check out the latest tech hits in our store</p>
          </div>
          <Link to="/shop" className="hidden md:flex items-center gap-2 text-primary font-bold no-underline hover:underline">
            Explore All <FaArrowRight className="text-xs" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-gray-400 animate-pulse font-bold">Fetching latest products...</div>
          ) : newArrivals.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="container mx-auto px-4 mb-20 bg-dark rounded-[40px] py-16 text-center shadow-2xl">
        <h2 className="text-white text-3xl font-black mb-12 italic">Why Choose ShopVendor?</h2>
        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {WHY_CHOOSE_US.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="space-y-4">
                <div className="w-20 h-20 bg-white/10 text-primary rounded-3xl flex items-center justify-center text-4xl mx-auto shadow-inner ring-1 ring-white/20">
                  <Icon />
                </div>
                <h4 className="text-white font-black text-xl">{item.title}</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{item.subtitle}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 mb-20">
        <h2 className="text-center text-3xl font-black text-gray-900 mb-12">What Our Customers Say</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-white p-10 rounded-[32px] border border-gray-100 shadow-sm relative group hover:shadow-xl transition-all duration-300">
              <div className="text-primary/20 absolute top-8 right-8 text-5xl group-hover:text-primary/40 transition-colors">
                <FaQuoteLeft />
              </div>
              <p className="text-gray-600 leading-relaxed mb-8 relative z-10 italic">"{t.text}"</p>
              <div className="flex items-center gap-4">
                <img src={t.avatar} className="w-14 h-14 rounded-2xl object-cover shadow-lg shadow-gray-200" alt={t.author} />
                <div>
                  <h6 className="font-black text-gray-900">{t.author}</h6>
                  <div className="flex gap-1 text-secondary mt-1">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <FaStar key={idx} className={idx < t.rating ? "" : "text-gray-200"} size={12} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="container mx-auto px-4 pb-20">
        <div className="bg-gradient-to-r from-primary to-pink-500 rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-white text-3xl md:text-5xl font-black mb-6">Join Our Community</h2>
            <p className="text-white/80 mb-10 font-bold">Subscribe to get 10% off your first order and stay updated with latest deals.</p>
            <form className="flex flex-col sm:flex-row gap-4 p-2 bg-white/10 backdrop-blur-xl rounded-[30px] border border-white/20">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="bg-transparent text-white placeholder:text-white/50 px-6 py-4 flex-grow outline-none font-bold"
              />
              <button className="bg-white text-primary hover:bg-gray-100 font-black px-10 py-4 rounded-[24px] shadow-xl transition-all active:scale-95 leading-none">
                SUBSCRIBE
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
