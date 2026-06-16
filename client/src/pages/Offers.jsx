import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { getImageUrl } from "../api";
import { FaTag, FaRegClock, FaInfoCircle, FaCheckCircle, FaShoppingCart, FaGift } from "react-icons/fa";
import offerHeroImage from "../assets/hero_banner_1.png";

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const { data } = await API.get("/offers/public");
        
        const formattedOffers = Array.isArray(data) ? data.map(offer => ({
          ...offer,
          title: offer.name || offer.title,
          offerStatus: offer.displayStatus === "Active" ? "LIVE" : (offer.displayStatus === "Scheduled" ? "UPCOMING" : offer.displayStatus || "INACTIVE"),
          discountType: offer.type === "Percentage Discount" ? "PERCENT" : "FLAT",
          startsAt: offer.startDate || offer.startsAt,
          expiresAt: offer.endDate || offer.expiresAt,
        })).filter(offer => offer.offerStatus === "LIVE") : [];
        
        setOffers(formattedOffers);
      } catch (err) {
        console.error("Error fetching offers", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const formatMoney = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const formatDiscount = (offer) => {
    if (offer?.discountType === "PERCENT") return `${offer.discountValue}% OFF`;
    return `${formatMoney(offer?.discountValue)} OFF`;
  };

  const formatDate = (value) => {
    if (!value) return "No Expiry";
    const date = new Date(value);
    return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  };

  const handleShopNow = (offer) => {
    if (offer.applicableOn === "Categories" && offer.categories?.length > 0) {
      navigate(`/shop/category/${encodeURIComponent(offer.categories[0])}`);
    } else {
      navigate("/shop");
    }
  };

  return (
    <div className="offers-page bg-light min-vh-100 pb-5">
      {/* 1. Hero Banner Section */}
      <section className="bg-primary text-white position-relative overflow-hidden py-5 mb-5 shadow-sm">
        <div className="container py-lg-5 position-relative z-10">
          <div className="row align-items-center g-5">
            <div className="col-lg-7 text-center text-lg-start">
              <div className="d-inline-flex align-items-center gap-2 bg-white text-primary rounded-pill px-4 py-2 mb-4 fw-bold tracking-widest text-uppercase shadow-sm">
                <FaGift size={16} /> Exclusive Offers & Deals
              </div>
              <h1 className="display-4 fw-black mb-3 text-white" style={{ letterSpacing: '-1px' }}>
                Save More on Your Favorite Products
              </h1>
              <p className="lead mb-4 opacity-75 fw-medium">
                Explore the latest discounts and limited-time offers. Upgrade your shopping experience today.
              </p>
              <button 
                onClick={() => navigate("/shop")} 
                className="btn btn-light btn-lg rounded-pill px-5 py-3 fw-black text-primary shadow hover:shadow-lg transition-all text-uppercase tracking-wider text-sm"
              >
                Shop Now
              </button>
            </div>
            <div className="col-lg-5 d-none d-lg-block text-center position-relative">
               <img 
                 src={offerHeroImage} 
                 alt="Offers Banner" 
                 className="img-fluid rounded-[32px] shadow-lg border border-4 border-white border-opacity-25" 
                 style={{ maxHeight: '400px', objectFit: 'cover', transform: 'rotate(2deg)' }} 
                 onError={(e) => e.target.style.display = 'none'} 
               />
               <div className="position-absolute top-0 start-0 translate-middle bg-warning text-dark fw-black rounded-circle d-flex align-items-center justify-content-center shadow-lg" style={{ width: '100px', height: '100px', transform: 'rotate(-15deg)' }}>
                  Big<br/>Savings
               </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="position-absolute top-50 start-100 translate-middle opacity-10" style={{ transform: 'scale(3)' }}>
          <FaTag size={400} />
        </div>
      </section>

      {/* 2. Active Offers Section */}
      <section className="container mb-5 pb-4">
        <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
          <div>
            <h2 className="fw-black h2 text-dark mb-1">Active Offers</h2>
            <p className="text-muted mb-0">Grab them before they are gone!</p>
          </div>
          <div className="badge bg-primary rounded-pill px-3 py-2 fs-6">
            {offers.length} {offers.length === 1 ? 'Offer' : 'Offers'} Available
          </div>
        </div>

        {loading ? (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="col">
                <div className="card h-100 border-0 shadow-sm rounded-4 p-4 placeholder-glow">
                  <div className="placeholder col-8 mb-3 rounded" style={{ height: '24px' }}></div>
                  <div className="placeholder col-5 mb-4 rounded" style={{ height: '32px' }}></div>
                  <div className="placeholder col-12 mb-2"></div>
                  <div className="placeholder col-10 mb-4"></div>
                  <div className="placeholder col-12 rounded mt-auto" style={{ height: '40px' }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-5 bg-white rounded-4 shadow-sm border border-light">
            <FaTag size={64} className="text-muted mb-3 opacity-25" />
            <h3 className="fw-bold text-dark">No active offers right now.</h3>
            <p className="text-muted mb-4">Please check back later for new promotions and discounts!</p>
            <button onClick={() => navigate('/shop')} className="btn btn-outline-primary rounded-pill px-4 fw-bold">
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
            {offers.map((offer) => (
              <div key={offer._id} className="col">
                <div className="card h-100 border-0 shadow-sm rounded-[24px] overflow-hidden transition-all hover:-translate-y-2 hover:shadow-xl d-flex flex-column bg-white group">
                  <div className="p-4 flex-grow-1 position-relative">
                    {/* Decorative Background Blob */}
                    <div className="position-absolute top-0 end-0 bg-primary bg-opacity-10 rounded-circle w-24 h-24 translate-middle-y translate-middle-x group-hover:scale-150 transition-transform duration-500 z-0"></div>
                    
                    <div className="position-relative z-10">
                      <div className="d-flex justify-content-between align-items-start mb-4">
                        <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-2 text-[10px] tracking-wider border border-success border-opacity-25">
                          <span className="spinner-grow spinner-grow-sm text-success" style={{ width: '0.4rem', height: '0.4rem' }}></span> ACTIVE
                        </span>
                        <div className="text-primary bg-primary bg-opacity-10 rounded-circle p-2 shadow-sm">
                          <FaTag size={14} />
                        </div>
                      </div>
                      
                      <h4 className="fw-bold text-dark mb-2 line-clamp-1" title={offer.title}>{offer.title}</h4>
                      
                      <div className="display-6 fw-black text-primary mb-3 text-gradient">
                        {formatDiscount(offer)}
                      </div>
                      
                      <p className="text-muted text-sm line-clamp-2 mb-4" style={{ minHeight: '40px' }}>
                        {offer.description || "Special promotional offer. Apply automatically at checkout for eligible items."}
                      </p>
                      
                      <ul className="list-unstyled mb-0 text-sm d-flex flex-column gap-3 bg-light rounded-4 p-3 border border-gray-100">
                        <li className="d-flex align-items-start gap-3 text-dark">
                          <FaCheckCircle className="text-success mt-1" />
                          <div>
                            <span className="d-block text-[10px] text-muted text-uppercase fw-bold tracking-wider mb-1">Applicable On</span>
                            <span className="fw-medium">{offer.applicableOn || "All Products"}</span>
                          </div>
                        </li>
                        <li className="d-flex align-items-start gap-3 text-danger">
                          <FaRegClock className="mt-1" />
                          <div>
                            <span className="d-block text-[10px] text-muted text-uppercase fw-bold tracking-wider mb-1">Valid Until</span>
                            <span className="fw-medium">{formatDate(offer.expiresAt)}</span>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="p-4 pt-0 mt-auto border-top border-light bg-white position-relative z-10">
                    <button 
                      onClick={() => handleShopNow(offer)}
                      className="btn w-100 rounded-pill py-3 fw-bold tracking-widest text-uppercase text-[12px] bg-dark text-white hover:bg-primary transition-colors d-flex justify-content-center align-items-center gap-2 shadow-sm"
                    >
                      <FaShoppingCart size={14} /> Shop Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. How to Avail Offers Section */}
      <section className="bg-white py-5 mb-5 border-top border-bottom">
        <div className="container py-4">
          <div className="text-center mb-5">
            <h2 className="fw-black h2 text-dark mb-2">How to Avail Offers</h2>
            <p className="text-muted">Follow these simple steps to claim your discount effortlessly.</p>
          </div>
          <div className="row g-4 justify-content-center position-relative">
            {/* Connecting Line (Desktop only) */}
            <div className="d-none d-lg-block position-absolute top-50 start-50 translate-middle w-75 border-top border-2 border-primary border-dashed opacity-25" style={{ zIndex: 0 }}></div>
            
            {[
              { step: 1, title: "Browse Products", desc: "Explore our wide range of eligible products by clicking Shop Now." },
              { step: 2, title: "Add to Cart", desc: "Select your favorites and add them to your shopping cart." },
              { step: 3, title: "Auto Discount", desc: "Applicable discounts are calculated and applied automatically." },
              { step: 4, title: "Checkout & Save", desc: "Complete your secure purchase and enjoy the savings!" }
            ].map((item) => (
              <div key={item.step} className="col-sm-6 col-lg-3 text-center position-relative z-10">
                <div className="d-inline-flex align-items-center justify-content-center bg-white text-primary rounded-circle mb-4 shadow-lg border border-4 border-primary" style={{ width: '80px', height: '80px', fontSize: '28px', fontWeight: '900' }}>
                  {item.step}
                </div>
                <h5 className="fw-black text-dark mb-2">{item.title}</h5>
                <p className="text-muted small px-3 mb-0">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Terms & Conditions Section */}
      <section className="container mb-4">
        <div className="card border-0 bg-surface-1 shadow-sm rounded-[24px] p-4 p-md-5 border border-light">
          <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom border-light">
            <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary">
               <FaInfoCircle size={24} />
            </div>
            <h3 className="fw-black h3 mb-0 text-dark">Terms & Conditions</h3>
          </div>
          <div className="row g-4">
            <div className="col-md-6">
              <ul className="list-unstyled d-flex flex-column gap-3 text-muted-text m-0">
                <li className="d-flex align-items-start gap-3">
                  <div className="text-primary mt-1"><FaCheckCircle size={14} /></div>
                  <span className="fw-medium">Offers are valid for a limited period and subject to change without notice.</span>
                </li>
                <li className="d-flex align-items-start gap-3">
                  <div className="text-primary mt-1"><FaCheckCircle size={14} /></div>
                  <span className="fw-medium">Discounts apply only to eligible products as mentioned in the offer details.</span>
                </li>
                <li className="d-flex align-items-start gap-3">
                  <div className="text-primary mt-1"><FaCheckCircle size={14} /></div>
                  <span className="fw-medium">Expired or inactive offers cannot be redeemed under any circumstances.</span>
                </li>
              </ul>
            </div>
            <div className="col-md-6">
              <ul className="list-unstyled d-flex flex-column gap-3 text-muted-text m-0">
                <li className="d-flex align-items-start gap-3">
                  <div className="text-primary mt-1"><FaCheckCircle size={14} /></div>
                  <span className="fw-medium">Offers cannot be combined with other ongoing promotions unless explicitly specified.</span>
                </li>
                <li className="d-flex align-items-start gap-3">
                  <div className="text-primary mt-1"><FaCheckCircle size={14} /></div>
                  <span className="fw-medium">The seller reserves the right to modify or withdraw offers at any time at their sole discretion.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Offers;
