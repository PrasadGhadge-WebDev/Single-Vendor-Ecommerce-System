import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  FaCheckCircle, FaAward, FaTruck, FaShieldAlt, FaUndo, FaHeadset, 
  FaUsers, FaBoxOpen, FaHandshake, FaGem, FaLightbulb, FaHeart, 
  FaStar, FaArrowRight, FaQuestionCircle, FaAngleDown, FaRocket
} from "react-icons/fa";
import { useBusinessSettings } from "../context/BusinessSettingsContext";
import "./MarketingPages.css";

const About = () => {
  const { settings } = useBusinessSettings();
  const navigate = useNavigate();
  const storeName = settings?.storeName || settings?.businessName || "ElectroHub";

  const features = [
    { title: "100% Genuine Products", icon: <FaAward size={24} />, bg: "bg-primary" },
    { title: "Trusted Suppliers", icon: <FaHandshake size={24} />, bg: "bg-success" },
    { title: "Secure Payments", icon: <FaShieldAlt size={24} />, bg: "bg-warning" },
    { title: "Fast Delivery", icon: <FaTruck size={24} />, bg: "bg-info" },
    { title: "Easy Returns", icon: <FaUndo size={24} />, bg: "bg-danger" },
    { title: "Dedicated Support", icon: <FaHeadset size={24} />, bg: "bg-secondary" }
  ];

  const values = [
    { title: "Customer First", desc: "Every decision starts with the customer in mind.", icon: <FaHeart /> },
    { title: "Integrity", desc: "Honest pricing and completely transparent policies.", icon: <FaShieldAlt /> },
    { title: "Quality", desc: "Only authentic and high-quality premium products.", icon: <FaGem /> },
    { title: "Innovation", desc: "Continuously improving your shopping experience.", icon: <FaLightbulb /> }
  ];

  const brands = [
    "Apple", "Samsung", "HP", "Dell", "Lenovo", "Sony", "LG", "ASUS"
  ];

  const faqs = [
    { q: `Why should I trust ${storeName}?`, a: `We are committed to full transparency, offering only 100% genuine products sourced directly from trusted suppliers and verified manufacturers.` },
    { q: "Are all products genuine?", a: "Yes, every single product goes through a strict quality check and verification process before it is listed on our platform." },
    { q: "How can I contact support?", a: "You can reach our dedicated 24/7 support team via email, phone, or live chat through our Contact or Services page." },
    { q: "Do you provide warranty support?", a: "Absolutely! We assist with all manufacturer warranty claims to ensure you get the support you deserve." },
    { q: "What is your return policy?", a: "We offer an easy, hassle-free 7-day return policy for eligible items. Just initiate a return from your account dashboard." }
  ];

  return (
    <div className="about-page bg-light min-vh-100 pb-0">
      
      {/* 1. Hero Section */}
      <section className="bg-dark text-white position-relative py-5 pt-lg-5 pb-lg-5 mb-5 overflow-hidden">
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'linear-gradient(135deg, #020617 0%, #4f46e5 100%)', zIndex: 0, opacity: 0.9 }}></div>
        <div className="position-absolute bottom-0 end-0 bg-primary opacity-20 blur-3xl rounded-circle" style={{ width: '400px', height: '400px', filter: 'blur(100px)', zIndex: 0 }}></div>
        
        <div className="container py-5 position-relative z-10 text-center">
          <div className="d-inline-flex align-items-center gap-2 bg-white bg-opacity-10 border border-white border-opacity-25 text-white rounded-pill px-4 py-2 mb-4 fw-bold tracking-widest text-uppercase text-xs shadow-sm backdrop-blur-sm">
            <FaStar className="text-warning" /> Welcome to {storeName}
          </div>
          <h1 className="display-3 fw-black mb-4 text-white" style={{ letterSpacing: '-1.5px' }}>
            About {storeName}
          </h1>
          <p className="lead mb-5 opacity-80 fw-medium max-w-2xl mx-auto">
            Your trusted destination for premium electronics, delivering quality products, exceptional service, and a seamless shopping experience.
          </p>
          <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
            <button onClick={() => navigate('/shop')} className="btn btn-primary btn-lg rounded-pill px-5 py-3 fw-black shadow-lg hover:shadow-xl transition-all text-uppercase tracking-wider text-sm border-2 border-primary">
              Shop Now
            </button>
            <button onClick={() => navigate('/contact')} className="btn btn-outline-light btn-lg rounded-pill px-5 py-3 fw-bold shadow-sm transition-all text-uppercase tracking-wider text-sm border-2 hover:bg-white hover:text-primary">
              Contact Us
            </button>
          </div>
        </div>
      </section>

      {/* 2. Our Story */}
      <section className="container mb-5 py-4">
        <div className="row align-items-center g-5">
          <div className="col-lg-6">
            <div className="position-relative">
              <img 
                src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" 
                alt="Our Story" 
                className="img-fluid rounded-[32px] shadow-lg border border-light"
              />
              <div className="position-absolute bottom-0 start-0 translate-middle-x translate-middle-y bg-white p-4 rounded-3xl shadow-lg border border-light d-none d-md-block">
                <h3 className="fw-black text-primary mb-0">10+</h3>
                <p className="text-muted fw-bold text-[10px] text-uppercase tracking-widest mb-0">Years of Trust</p>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <h6 className="text-primary fw-bold text-uppercase tracking-widest mb-2">Who We Are</h6>
            <h2 className="display-5 fw-black text-dark mb-4">Our Story</h2>
            <p className="lead text-muted mb-4">
              {storeName} was founded with a vision to make the latest technology accessible to everyone. 
            </p>
            <p className="text-muted mb-4">
              We specialize in offering genuine electronic products from trusted brands while ensuring excellent customer service and competitive pricing. Our journey began with a simple idea: shopping for electronics should be straightforward, safe, and enjoyable.
            </p>
            <div className="d-flex align-items-center gap-3 bg-primary bg-opacity-10 p-3 rounded-3xl border border-primary border-opacity-25 w-max">
              <FaCheckCircle className="text-primary fs-4" />
              <span className="fw-bold text-dark">Verified & Trusted by Thousands</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Mission & Vision */}
      <section className="bg-white py-5 mb-5 border-top border-bottom border-light">
        <div className="container py-4">
          <div className="row g-4 justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="card h-100 border-0 shadow-sm rounded-[32px] p-5 text-center hover:-translate-y-2 transition-transform bg-light border border-gray-100">
                <div className="bg-primary bg-opacity-10 text-primary w-20 h-20 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4">
                  <FaRocket size={32} />
                </div>
                <h3 className="fw-black text-dark mb-3">Our Mission</h3>
                <p className="text-muted mb-0">
                  To provide customers with authentic products, transparent pricing, and a completely reliable shopping experience from click to delivery.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-5">
              <div className="card h-100 border-0 shadow-sm rounded-[32px] p-5 text-center hover:-translate-y-2 transition-transform bg-light border border-gray-100">
                <div className="bg-success bg-opacity-10 text-success w-20 h-20 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4">
                  <FaStar size={32} />
                </div>
                <h3 className="fw-black text-dark mb-3">Our Vision</h3>
                <p className="text-muted mb-0">
                  To become the most trusted, customer-focused electronics destination in the region, constantly setting new standards for service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Why Choose Us */}
      <section className="container mb-5 py-4">
        <div className="text-center mb-5">
          <h2 className="fw-black h2 text-dark mb-2">Why Choose Us</h2>
          <p className="text-muted">The pillars that define our service and quality.</p>
        </div>
        <div className="row g-4">
          {features.map((feature, idx) => (
            <div className="col-6 col-md-4 col-lg-2 text-center group" key={idx}>
              <div className={`d-inline-flex align-items-center justify-content-center rounded-circle mb-3 ${feature.bg} bg-opacity-10 text-${feature.bg.replace('bg-', '')} transition-transform group-hover:scale-110`} style={{ width: '80px', height: '80px' }}>
                {feature.icon}
              </div>
              <h6 className="fw-bold text-dark">{feature.title}</h6>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Our Achievements */}
      <section className="bg-primary text-white py-5 mb-5 position-relative overflow-hidden">
        <div className="position-absolute top-50 start-50 translate-middle w-100 h-100 bg-black opacity-10" style={{ background: 'radial-gradient(circle, transparent 20%, #000 120%)', zIndex: 0 }}></div>
        <div className="container py-4 position-relative z-10">
          <div className="row g-4 text-center">
            <div className="col-6 col-md-3">
              <h2 className="display-4 fw-black mb-1">5,000+</h2>
              <p className="fw-bold text-uppercase tracking-widest text-xs opacity-75 mb-0">Happy Customers</p>
            </div>
            <div className="col-6 col-md-3">
              <h2 className="display-4 fw-black mb-1">1,000+</h2>
              <p className="fw-bold text-uppercase tracking-widest text-xs opacity-75 mb-0">Products Sold</p>
            </div>
            <div className="col-6 col-md-3">
              <h2 className="display-4 fw-black mb-1">50+</h2>
              <p className="fw-bold text-uppercase tracking-widest text-xs opacity-75 mb-0">Trusted Suppliers</p>
            </div>
            <div className="col-6 col-md-3">
              <h2 className="display-4 fw-black mb-1">98%</h2>
              <p className="fw-bold text-uppercase tracking-widest text-xs opacity-75 mb-0">Customer Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Our Values */}
      <section className="container mb-5 py-4">
        <div className="text-center mb-5">
          <h2 className="fw-black h2 text-dark mb-2">Our Core Values</h2>
          <p className="text-muted">The principles that guide everything we do.</p>
        </div>
        <div className="row g-4">
          {values.map((value, idx) => (
            <div className="col-md-6 col-lg-3" key={idx}>
              <div className="card h-100 border-0 shadow-sm rounded-4 p-4 bg-white hover:-translate-y-2 transition-transform">
                <div className="text-primary fs-3 mb-3">{value.icon}</div>
                <h5 className="fw-bold text-dark mb-2">{value.title}</h5>
                <p className="text-muted mb-0">{value.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Brands We Offer */}
      <section className="bg-white py-5 mb-5 border-top border-bottom border-light">
        <div className="container py-4">
          <div className="text-center mb-5">
            <h2 className="fw-black h2 text-dark mb-2">Brands We Offer</h2>
            <p className="text-muted">Partnering with the best in the industry.</p>
          </div>
          <div className="d-flex flex-wrap justify-content-center gap-4 gap-md-5 opacity-50">
            {brands.map((brand, idx) => (
              <h3 key={idx} className="fw-black text-dark text-uppercase tracking-widest mb-0">{brand}</h3>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Customer Promise */}
      <section className="container mb-5 py-2">
        <div className="bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded-[32px] p-5 text-center relative overflow-hidden">
          <FaShieldAlt className="position-absolute top-50 start-50 translate-middle text-warning opacity-10" size={200} />
          <div className="position-relative z-10 max-w-3xl mx-auto">
            <div className="bg-warning text-dark w-16 h-16 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4">
              <FaHandshake size={32} />
            </div>
            <h2 className="fw-black h2 text-dark mb-4">Our Promise To You</h2>
            <p className="lead text-dark fw-medium opacity-80 mb-0">
              We promise to provide authentic products, completely secure transactions, timely deliveries, and highly responsive support to every single customer.
            </p>
          </div>
        </div>
      </section>

      {/* 10. Frequently Asked Questions */}
      <section className="bg-white py-5 mb-0 border-top border-light">
        <div className="container py-4">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="text-center mb-5">
                <h2 className="fw-black h2 text-dark mb-2">Frequently Asked Questions</h2>
                <p className="text-muted">Answers to common questions about {storeName}.</p>
              </div>
              <div className="accordion accordion-flush" id="aboutFaqAccordion">
                {faqs.map((faq, idx) => (
                  <div className="accordion-item bg-transparent border-0 mb-3 bg-light rounded-3xl overflow-hidden border border-gray-100" key={idx}>
                    <h2 className="accordion-header">
                      <button className="accordion-button collapsed fw-bold text-dark bg-transparent py-4 px-4 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target={`#aboutFaq${idx}`}>
                        <FaQuestionCircle className="text-primary me-3" /> {faq.q}
                      </button>
                    </h2>
                    <div id={`aboutFaq${idx}`} className="accordion-collapse collapse" data-bs-parent="#aboutFaqAccordion">
                      <div className="accordion-body pt-0 px-4 pb-4 ms-5 text-muted text-sm">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Call To Action */}
      <section className="bg-dark text-white py-5 position-relative overflow-hidden text-center">
        <div className="position-absolute top-0 start-0 w-100 h-100 opacity-20" style={{ background: 'linear-gradient(135deg, transparent 0%, #3b82f6 100%)', zIndex: 0 }}></div>
        <div className="container py-5 position-relative z-10">
          <h2 className="display-5 fw-black text-white mb-3">Ready to Explore the Latest Technology?</h2>
          <p className="lead text-white opacity-90 mb-5 max-w-2xl mx-auto fw-medium">
            Find the perfect products for your needs today and experience the {storeName} difference.
          </p>
          <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
            <button onClick={() => navigate('/shop')} className="btn btn-primary btn-lg rounded-pill px-5 py-3 fw-black shadow-lg hover:shadow-xl transition-all text-uppercase tracking-wider text-sm d-flex align-items-center justify-content-center gap-2">
               Start Shopping <FaArrowRight />
            </button>
            <button onClick={() => navigate('/contact')} className="btn btn-outline-light btn-lg rounded-pill px-5 py-3 fw-bold transition-all text-uppercase tracking-wider text-sm border-2 hover:bg-white hover:text-dark">
              Contact Support
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;
