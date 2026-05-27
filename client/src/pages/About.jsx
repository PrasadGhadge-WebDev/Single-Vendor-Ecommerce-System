import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  FaHandshake, FaLeaf, FaAward, FaUsers, FaMapMarkedAlt, 
  FaChartLine, FaStar, FaRocket, FaShieldAlt, FaHeart,
  FaShoppingBag, FaCreditCard, FaTruck, FaHeadset, FaUndo
} from "react-icons/fa";
import { useBusinessSettings } from "../context/BusinessSettingsContext";
import API from "../api";

const About = () => {
  const { settings } = useBusinessSettings();
  const [stats, setStats] = useState({
    products: "1.2K+",
    orders: "2.5K+",
    customers: "800+",
    rating: "4.9"
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await API.get("/business-settings/stats");
        if (data) {
          setStats({
            products: data.products ? `${data.products}+` : "1.2K+",
            orders: data.orders ? `${data.orders}+` : "2.5K+",
            customers: data.customers ? `${data.customers}+` : "800+",
            rating: data.rating ? `${data.rating}★` : "4.9★"
          });
        }
      } catch (err) {
        console.error("Error fetching live stats:", err);
      }
    };
    fetchStats();
  }, []);

  const trustReasons = [
    { title: "Guaranteed Quality", desc: "Every product we sell is tested by our team to make sure it works perfectly.", icon: <FaAward /> },
    { title: "Fast Delivery", desc: "We ship your items quickly so you can start using them in 3-5 days.", icon: <FaTruck /> },
    { title: "Safe Payments", desc: "Your data and payments are always protected with our secure checkout system.", icon: <FaShieldAlt /> },
    { title: "24/7 Support", desc: "Our friendly team is always ready to help you with any questions or issues.", icon: <FaHeadset /> },
    { title: "Easy Returns", desc: "Not happy with your item? Return it within 7 days for a quick resolution.", icon: <FaUndo /> },
    { title: "Verified Seller", desc: "We are a trusted name in electronics with thousands of happy customers.", icon: <FaHandshake /> },
  ];

  const workSteps = [
    { step: "01", title: "Pick Your Item", desc: "Browse our curated collection and find the gadget that fits your needs." },
    { step: "02", title: "Pay Safely", desc: "Add to your cart and complete your order using our secure payment gateway." },
    { step: "03", title: "Fast Shipping", desc: "We carefully pack and ship your order within 24 hours of purchase." },
    { step: "04", title: "Use & Enjoy", desc: "Your package arrives at your door, ready for you to unbox and enjoy." },
  ];

  return (
    <div className="bg-surface-1 min-h-screen">
      {/* 1. Hero Section */}
      <section className="bg-surface-3 text-primary-text py-20 md:py-32 relative overflow-hidden marketing-hero">
        <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="text-center lg:text-left marketing-fade-up">
                    <h1 className="text-4xl md:text-7xl font-black mb-6 italic tracking-tighter leading-[1.1] uppercase">
                        Your Home for <br/><span className="text-primary">Premium Tech.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-text font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed mb-8 opacity-80">
                        {settings?.metaDescription || "We find and sell high-quality gadgets and smart electronics so you can live a better and easier life."}
                    </p>
                    <Link to="/shop" className="btn btn-primary px-10 py-4 rounded-full font-black uppercase tracking-widest text-[11px] shadow-xl hover:scale-105 transition-transform inline-flex items-center gap-2">
                        Shop Collection <FaRocket />
                    </Link>
                </div>
                <div className="relative group hidden lg:block marketing-fade-up marketing-delay-1">
                    <div className="absolute -inset-4 bg-primary/10 rounded-[40px] blur-2xl transition-all duration-1000" />
                    <img 
                        src="https://images.unsplash.com/photo-1468495244123-6c6c332eeece?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" 
                        alt="Premium Electronics" 
                        className="relative rounded-[40px] border border-theme shadow-2xl w-full h-[450px] object-cover"
                    />
                </div>
            </div>
        </div>
      </section>

      {/* 2. Brand Story Section */}
      <section className="py-20 md:py-28 container mx-auto px-4 border-b border-theme">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative marketing-fade-up">
                <img 
                    src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" 
                    alt="Our Story" 
                    className="rounded-[40px] border border-theme shadow-xl w-full h-[400px] object-cover"
                />
            </div>
            <div className="order-1 lg:order-2 space-y-6 marketing-fade-up marketing-delay-1">
                <div className="inline-block bg-primary/10 text-primary px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em]">Brand Story</div>
                <h2 className="text-3xl md:text-5xl font-black text-primary-text leading-[1] tracking-tighter italic">Why we started {settings?.storeName || "ElectroHub"}.</h2>
                <div className="space-y-4 text-muted-text text-base md:text-lg leading-relaxed font-medium">
                    <p>
                        We started {settings?.storeName || "ElectroHub"} because we were tired of electronics that break easily and don't work as promised. We wanted a place where quality matters more than anything else.
                    </p>
                    <p>
                        What makes us different is our care. Every product in our store is chosen because it is reliable, fast, and useful. We don't just sell items; we sell tools that help you do more.
                    </p>
                    <p>
                        Today, we are proud to serve thousands of happy customers who trust us for their technology needs.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* 3. Mission & Vision Cards */}
      <section className="py-20 bg-surface-2 border-b border-theme">
        <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="bg-surface-1 p-10 rounded-[32px] border border-theme shadow-sm text-center marketing-fade-up">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                        <FaHeart />
                    </div>
                    <h3 className="text-2xl font-black text-primary-text mb-4 italic uppercase tracking-tight">Our Mission</h3>
                    <p className="text-muted-text leading-relaxed">
                        To help you reach your goals by giving you the best and most reliable tools available on the market today.
                    </p>
                </div>
                <div className="bg-surface-1 p-10 rounded-[32px] border border-theme shadow-sm text-center marketing-fade-up marketing-delay-1">
                    <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                        <FaChartLine />
                    </div>
                    <h3 className="text-2xl font-black text-primary-text mb-4 italic uppercase tracking-tight">Our Vision</h3>
                    <p className="text-muted-text leading-relaxed">
                        To become the most trusted and favorite place for people to find and buy high-quality electronics.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* 4. What We Sell (Categories) */}
      <section className="py-20 container mx-auto px-4">
        <div className="text-center mb-16 marketing-fade-up">
            <h2 className="text-3xl md:text-5xl font-black text-primary-text mb-4 italic uppercase tracking-tighter">What We Sell.</h2>
            <p className="text-muted-text max-w-xl mx-auto">From smart tools to home essentials, we have everything you need.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="group relative overflow-hidden rounded-[40px] aspect-[4/5] shadow-lg marketing-fade-up">
                <img src="https://images.unsplash.com/photo-1550009158-9ebf69173e03?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Gadgets" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8">
                    <h4 className="text-white text-2xl font-black italic uppercase">Smart Gadgets</h4>
                </div>
            </div>
            <div className="group relative overflow-hidden rounded-[40px] aspect-[4/5] shadow-lg marketing-fade-up marketing-delay-1">
                <img src="https://images.unsplash.com/photo-1558002038-103792e1972d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Home Tech" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8">
                    <h4 className="text-white text-2xl font-black italic uppercase">Home Tech</h4>
                </div>
            </div>
            <div className="group relative overflow-hidden rounded-[40px] aspect-[4/5] shadow-lg marketing-fade-up marketing-delay-2">
                <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Accessories" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8">
                    <h4 className="text-white text-2xl font-black italic uppercase">Accessories</h4>
                </div>
            </div>
        </div>
      </section>

      {/* 5. Why Choose Us (Feature Highlights) */}
      <section className="py-20 bg-surface-3">
        <div className="container mx-auto px-4">
            <div className="text-center mb-16 marketing-fade-up">
                <h2 className="text-3xl md:text-5xl font-black text-primary-text mb-4 italic uppercase tracking-tighter">Why Choose Us?</h2>
                <p className="text-muted-text">Simple reasons why we are the best choice for you.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {trustReasons.map((reason, i) => (
                    <div key={i} className={`bg-surface-1 p-8 rounded-[32px] border border-theme shadow-sm transition-all hover:-translate-y-2 marketing-fade-up marketing-delay-${Math.min(i + 1, 3)}`}>
                        <div className="text-primary text-3xl mb-4">{reason.icon}</div>
                        <h4 className="text-lg font-black text-primary-text mb-2 uppercase italic">{reason.title}</h4>
                        <p className="text-sm text-muted-text leading-relaxed">{reason.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 6. How We Work */}
      <section className="py-20 md:py-28 container mx-auto px-4">
        <div className="text-center mb-16 marketing-fade-up">
            <h2 className="text-3xl md:text-5xl font-black text-primary-text mb-4 italic uppercase tracking-tighter">How We Work.</h2>
            <p className="text-muted-text">Our process is simple, fast, and easy to follow.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-8">
            {workSteps.map((step, i) => (
                <div key={i} className={`text-center marketing-fade-up marketing-delay-${i}`}>
                    <div className="text-5xl font-black text-primary/10 mb-4">{step.step}</div>
                    <h4 className="text-xl font-black text-primary-text mb-2 uppercase italic">{step.title}</h4>
                    <p className="text-sm text-muted-text leading-relaxed">{step.desc}</p>
                </div>
            ))}
        </div>
      </section>

      {/* 7. Trust Signals Section */}
      <section className="py-16 bg-surface-2 border-y border-theme">
        <div className="container mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
                <div className="text-primary text-3xl mb-3 flex justify-center"><FaStar /></div>
                <div className="text-3xl md:text-4xl font-black italic mb-1 text-primary-text">{stats.rating}</div>
                <div className="text-muted-text font-black text-[10px] tracking-[0.1em] uppercase">Customer Rating</div>
            </div>
            <div className="text-center">
                <div className="text-primary text-3xl mb-3 flex justify-center"><FaUndo /></div>
                <div className="text-3xl md:text-4xl font-black italic mb-1 text-primary-text">7 Days</div>
                <div className="text-muted-text font-black text-[10px] tracking-[0.1em] uppercase">Return Policy</div>
            </div>
            <div className="text-center">
                <div className="text-primary text-3xl mb-3 flex justify-center"><FaShieldAlt /></div>
                <div className="text-3xl md:text-4xl font-black italic mb-1 text-primary-text">100% Safe</div>
                <div className="text-muted-text font-black text-[10px] tracking-[0.1em] uppercase">Secure Payments</div>
            </div>
            <div className="text-center">
                <div className="text-primary text-3xl mb-3 flex justify-center"><FaUsers /></div>
                <div className="text-3xl md:text-4xl font-black italic mb-1 text-primary-text">{stats.customers}</div>
                <div className="text-muted-text font-black text-[10px] tracking-[0.1em] uppercase">Happy Customers</div>
            </div>
        </div>
      </section>

      {/* 8. Call to Action */}
      <section className="py-20 md:py-32 bg-primary text-white text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="container mx-auto px-4 relative z-10">
            <h2 className="text-4xl md:text-7xl font-black mb-8 tracking-tighter italic uppercase leading-none">Ready to Upgrade?</h2>
            <p className="text-xl opacity-80 mb-12 max-w-2xl mx-auto font-medium">Your journey to a smarter home and life starts right here. Explore our collection now.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                <Link 
                    to="/shop" 
                    className="w-full sm:w-auto bg-white text-primary px-12 py-5 rounded-full font-black uppercase tracking-[0.2em] text-[12px] hover:scale-110 transition-all shadow-2xl no-underline"
                >
                    Shop Now
                </Link>
                <Link 
                    to="/contact" 
                    className="w-full sm:w-auto border-2 border-white/30 text-white px-12 py-5 rounded-full font-black uppercase tracking-[0.2em] text-[12px] hover:bg-white hover:text-primary transition-all no-underline"
                >
                    Contact Us
                </Link>
            </div>
        </div>
      </section>
    </div>
  );
};

export default About;
