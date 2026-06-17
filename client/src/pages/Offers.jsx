import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { 
  FaTag, FaRegClock, FaInfoCircle, FaCheckCircle, 
  FaShoppingCart, FaGift, FaBolt, FaArrowRight, 
  FaStar, FaFire, FaPercentage
} from "react-icons/fa";
import offerHeroImage from "../assets/hero_banner_1.png";

// Simple Countdown Hook
const useCountdown = (targetDate) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!targetDate) return;
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft("Expired");
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
};

// Reusable Offer Card
const OfferCard = ({ offer, featured = false, navigate }) => {
  const timeLeft = useCountdown(offer.expiresAt);
  const isEndingSoon = timeLeft && !timeLeft.includes("Expired") && parseInt(timeLeft.split("d")[0]) <= 3;

  return (
    <div 
      className={`card h-100 border-0 shadow-sm rounded-[24px] overflow-hidden transition-all hover:-translate-y-2 hover:shadow-xl d-flex flex-column bg-white group ${featured ? 'border border-primary border-opacity-25' : ''}`}
    >
      <div className={`p-4 flex-grow-1 position-relative ${featured ? 'bg-primary bg-opacity-10' : ''}`}>
        <div className="position-absolute top-0 end-0 bg-primary bg-opacity-10 rounded-circle w-24 h-24 translate-middle-y translate-middle-x group-hover:scale-150 transition-transform duration-500 z-0"></div>
        
        <div className="position-relative z-10">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              {isEndingSoon ? (
                <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-2 text-[10px] tracking-wider border border-danger border-opacity-25 mb-2">
                  <FaBolt className="text-danger" /> ENDING SOON
                </span>
              ) : (
                <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-2 text-[10px] tracking-wider border border-success border-opacity-25 mb-2">
                  <span className="spinner-grow spinner-grow-sm text-success" style={{ width: '0.4rem', height: '0.4rem' }}></span> LIVE
                </span>
              )}
            </div>
            {featured && (
              <div className="text-warning bg-white rounded-circle p-2 shadow-sm">
                <FaStar size={14} />
              </div>
            )}
          </div>
          
          <h4 className="fw-black text-dark mb-2 line-clamp-1" title={offer.title}>{offer.title}</h4>
          
          <div className="display-6 fw-black text-primary mb-3 text-gradient">
            {offer.discountType === "PERCENT" ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
          </div>
          
          <p className="text-muted text-sm line-clamp-2 mb-4" style={{ minHeight: '40px' }}>
            {offer.description || "Special promotional offer. Apply automatically at checkout for eligible items."}
          </p>
          
          <ul className="list-unstyled mb-0 text-sm d-flex flex-column gap-3 bg-white rounded-4 p-3 shadow-sm border border-gray-100">
            <li className="d-flex align-items-start gap-3 text-dark">
              <FaTag className="text-primary mt-1" />
              <div>
                <span className="d-block text-[10px] text-muted text-uppercase fw-bold tracking-wider mb-1">Applicable On</span>
                <span className="fw-bold">{offer.applicableOn}</span>
              </div>
            </li>
            <li className="d-flex align-items-start gap-3 text-danger">
              <FaRegClock className="mt-1" />
              <div>
                <span className="d-block text-[10px] text-muted text-uppercase fw-bold tracking-wider mb-1">Time Left</span>
                <span className="fw-black text-danger">{timeLeft || "No Expiry"}</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <div className="p-4 pt-0 mt-auto bg-white position-relative z-10 border-top border-light">
        <button 
          onClick={() => navigate(`/offer/${offer._id}`)}
          className={`btn w-100 rounded-pill py-3 fw-black tracking-widest text-uppercase text-[12px] ${featured ? 'bg-primary text-white hover:bg-dark' : 'bg-dark text-white hover:bg-primary'} transition-colors d-flex justify-content-center align-items-center gap-2 shadow-sm`}
        >
          View Offer <FaArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};

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

  // Stats
  const maxDiscount = offers.reduce((max, offer) => {
    if (offer.discountType === "PERCENT") return Math.max(max, offer.discountValue);
    return max; // Only percent is easily comparable
  }, 0);

  const endingSoonOffers = offers.filter(offer => {
    if (!offer.expiresAt) return false;
    const distance = new Date(offer.expiresAt).getTime() - new Date().getTime();
    return distance > 0 && distance <= 3 * 24 * 60 * 60 * 1000;
  });

  const categoriesWithOffers = [...new Set(offers.filter(o => o.applicableOn === "Specific Categories").flatMap(o => o.categories))];

  return (
    <div className="offers-page bg-light min-vh-100 pb-0">
      
      {/* 1. Hero Banner Section */}
      <section className="bg-dark text-white position-relative overflow-hidden py-5 pt-lg-5 pb-lg-0 mb-5 shadow-lg">
        {/* Abstract Gradient Background */}
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', zIndex: 0 }}></div>
        <div className="position-absolute top-0 end-0 bg-primary rounded-circle blur-3xl opacity-20" style={{ width: '40vw', height: '40vw', transform: 'translate(20%, -20%)', filter: 'blur(100px)' }}></div>
        <div className="position-absolute bottom-0 start-0 bg-info rounded-circle blur-3xl opacity-20" style={{ width: '30vw', height: '30vw', transform: 'translate(-20%, 20%)', filter: 'blur(100px)' }}></div>
        
        <div className="container py-5 position-relative z-10">
          <div className="row align-items-center g-5">
            <div className="col-lg-6 text-center text-lg-start">
              <div className="d-inline-flex align-items-center gap-2 bg-white bg-opacity-10 border border-white border-opacity-25 text-white rounded-pill px-4 py-2 mb-4 fw-black tracking-widest text-uppercase shadow-sm backdrop-blur-sm">
                <FaFire size={16} className="text-warning" /> Mega Sale Event
              </div>
              <h1 className="display-3 fw-black mb-4 text-white" style={{ letterSpacing: '-1.5px', lineHeight: '1.1' }}>
                Unbeatable Deals.<br/>
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Massive Savings.
                </span>
              </h1>
              <p className="lead mb-5 opacity-75 fw-medium pe-lg-5">
                Up to 40% OFF on selected premium products. Upgrade your lifestyle without breaking the bank. Valid for a limited time!
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center justify-content-lg-start">
                <button 
                  onClick={() => window.scrollTo({ top: document.getElementById('all-offers').offsetTop - 100, behavior: 'smooth' })} 
                  className="btn btn-primary btn-lg rounded-pill px-5 py-3 fw-black shadow hover:shadow-lg transition-all text-uppercase tracking-wider text-sm d-flex align-items-center justify-content-center gap-2"
                >
                  <FaTag /> Explore Offers
                </button>
              </div>
            </div>
            <div className="col-lg-6 d-none d-lg-block text-center position-relative">
               <img 
                 src={offerHeroImage} 
                 alt="Offers Banner" 
                 className="img-fluid rounded-[32px] shadow-2xl border border-white border-opacity-10 backdrop-blur-sm" 
                 style={{ maxHeight: '450px', objectFit: 'cover', transform: 'rotate(2deg) translateY(-20px)' }} 
                 onError={(e) => e.target.style.display = 'none'} 
               />
               <div className="position-absolute top-50 start-0 translate-middle-y translate-middle-x bg-warning text-dark fw-black rounded-circle d-flex flex-column align-items-center justify-content-center shadow-lg border border-4 border-white" style={{ width: '120px', height: '120px', transform: 'rotate(-10deg) translateX(20px)' }}>
                  <span className="fs-3 lh-1">40%</span>
                  <span className="text-xs uppercase tracking-widest">OFF</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Offer Statistics Section */}
      <section className="container mb-5 position-relative" style={{ marginTop: '-40px', zIndex: 20 }}>
        <div className="row g-4">
          <div className="col-6 col-lg-3">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-light d-flex flex-column align-items-center justify-content-center text-center h-100 hover:-translate-y-1 transition-transform">
              <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary mb-3">
                <FaGift size={24} />
              </div>
              <h3 className="display-6 fw-black text-dark mb-1">{offers.length}</h3>
              <p className="text-muted fw-bold text-[10px] text-uppercase tracking-widest mb-0">Active Offers</p>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-light d-flex flex-column align-items-center justify-content-center text-center h-100 hover:-translate-y-1 transition-transform">
              <div className="bg-success bg-opacity-10 p-3 rounded-circle text-success mb-3">
                <FaPercentage size={24} />
              </div>
              <h3 className="display-6 fw-black text-dark mb-1">{maxDiscount}%</h3>
              <p className="text-muted fw-bold text-[10px] text-uppercase tracking-widest mb-0">Max Discount</p>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-light d-flex flex-column align-items-center justify-content-center text-center h-100 hover:-translate-y-1 transition-transform">
              <div className="bg-danger bg-opacity-10 p-3 rounded-circle text-danger mb-3">
                <FaBolt size={24} />
              </div>
              <h3 className="display-6 fw-black text-dark mb-1">{endingSoonOffers.length}</h3>
              <p className="text-muted fw-bold text-[10px] text-uppercase tracking-widest mb-0">Ending Soon</p>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-light d-flex flex-column align-items-center justify-content-center text-center h-100 hover:-translate-y-1 transition-transform">
              <div className="bg-info bg-opacity-10 p-3 rounded-circle text-info mb-3">
                <FaTag size={24} />
              </div>
              <h3 className="display-6 fw-black text-dark mb-1">{categoriesWithOffers.length}</h3>
              <p className="text-muted fw-bold text-[10px] text-uppercase tracking-widest mb-0">Categories on Sale</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Offers Section */}
      {offers.length > 0 && (
        <section className="container mb-5 pb-3">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="bg-warning text-dark p-2 rounded-lg"><FaStar size={20} /></div>
            <h2 className="fw-black h2 text-dark mb-0">Featured Offers</h2>
          </div>
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {offers.slice(0, 3).map((offer) => (
              <div key={offer._id} className="col">
                <OfferCard offer={offer} featured={true} navigate={navigate} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Ending Soon Section */}
      {endingSoonOffers.length > 0 && (
        <section className="container mb-5 pb-3">
          <div className="bg-danger bg-opacity-10 rounded-[32px] p-4 p-md-5 border border-danger border-opacity-25 relative overflow-hidden">
             <div className="position-absolute top-0 end-0 opacity-10" style={{ transform: 'translate(20%, -20%) scale(3)' }}>
               <FaRegClock size={200} className="text-danger" />
             </div>
             <div className="position-relative z-10">
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 pb-3 border-bottom border-danger border-opacity-25 gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-danger text-white p-2 rounded-lg animate-pulse"><FaBolt size={20} /></div>
                  <h2 className="fw-black h2 text-danger mb-0">Ending Soon!</h2>
                </div>
                <div className="badge bg-danger text-white rounded-pill px-4 py-2 fs-6 fw-bold tracking-widest shadow-sm">
                  Hurry up!
                </div>
              </div>
              <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-4">
                {endingSoonOffers.map((offer) => (
                  <div key={offer._id} className="col">
                    <OfferCard offer={offer} navigate={navigate} />
                  </div>
                ))}
              </div>
             </div>
          </div>
        </section>
      )}

      {/* 6. Category-Based Offers */}
      {categoriesWithOffers.length > 0 && (
        <section className="container mb-5 pb-3">
          <h2 className="fw-black h3 text-dark mb-4 text-center">Offers by Category</h2>
          <div className="d-flex flex-wrap justify-content-center gap-3">
            {categoriesWithOffers.map((cat, idx) => (
              <button key={idx} onClick={() => navigate(`/shop/category/${encodeURIComponent(cat)}`)} className="btn btn-outline-primary bg-white rounded-pill px-4 py-2 fw-bold tracking-widest text-uppercase text-sm shadow-sm hover:-translate-y-1 transition-transform">
                {cat} Offers <FaArrowRight className="ms-2" size={10} />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 4. All Offers Section */}
      <section id="all-offers" className="container mb-5 pb-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 pb-3 border-bottom border-light gap-3">
          <div>
            <h2 className="fw-black h2 text-dark mb-1">All Active Offers</h2>
            <p className="text-muted mb-0">Browse through all available discounts and promotions.</p>
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
            <button onClick={() => navigate('/shop')} className="btn btn-primary rounded-pill px-5 py-3 fw-bold tracking-widest text-uppercase shadow-sm">
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
            {offers.map((offer) => (
              <div key={offer._id} className="col">
                <OfferCard offer={offer} navigate={navigate} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 9. Terms & Conditions & 10. FAQ Section */}
      <section className="bg-white py-5 mb-0 border-top border-light">
        <div className="container py-4">
          <div className="row g-5">
            {/* T&C */}
            <div className="col-lg-6">
               <div className="d-flex align-items-center gap-3 mb-4">
                 <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary">
                    <FaInfoCircle size={24} />
                 </div>
                 <h3 className="fw-black h3 mb-0 text-dark">Terms & Conditions</h3>
               </div>
               <ul className="list-unstyled d-flex flex-column gap-4 text-muted-text m-0">
                 <li className="d-flex align-items-start gap-3 bg-light p-4 rounded-3xl border border-gray-100">
                   <div className="text-primary mt-1"><FaCheckCircle size={16} /></div>
                   <span className="fw-medium text-dark text-sm">Offer valid for a limited period only and while stocks last.</span>
                 </li>
                 <li className="d-flex align-items-start gap-3 bg-light p-4 rounded-3xl border border-gray-100">
                   <div className="text-primary mt-1"><FaCheckCircle size={16} /></div>
                   <span className="fw-medium text-dark text-sm">Cannot be combined with other ongoing promotions unless explicitly specified.</span>
                 </li>
                 <li className="d-flex align-items-start gap-3 bg-light p-4 rounded-3xl border border-gray-100">
                   <div className="text-primary mt-1"><FaCheckCircle size={16} /></div>
                   <span className="fw-medium text-dark text-sm">Discount automatically applies at checkout for eligible products.</span>
                 </li>
               </ul>
            </div>
            
            {/* FAQs */}
            <div className="col-lg-6">
               <div className="d-flex align-items-center gap-3 mb-4">
                 <div className="bg-info bg-opacity-10 p-3 rounded-circle text-info">
                    <FaInfoCircle size={24} />
                 </div>
                 <h3 className="fw-black h3 mb-0 text-dark">Frequently Asked Questions</h3>
               </div>
               
               <div className="accordion accordion-flush" id="faqAccordion">
                  <div className="accordion-item bg-transparent border-0 mb-3 bg-light rounded-3xl overflow-hidden border border-gray-100">
                    <h2 className="accordion-header">
                      <button className="accordion-button collapsed fw-bold text-dark bg-transparent py-4 px-4 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                        Can I use multiple offers together?
                      </button>
                    </h2>
                    <div id="faq1" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                      <div className="accordion-body pt-0 px-4 pb-4 text-muted text-sm">
                        Generally, no. Most of our offers are mutually exclusive to ensure fair pricing. Only the highest applicable discount will be applied at checkout.
                      </div>
                    </div>
                  </div>
                  <div className="accordion-item bg-transparent border-0 mb-3 bg-light rounded-3xl overflow-hidden border border-gray-100">
                    <h2 className="accordion-header">
                      <button className="accordion-button collapsed fw-bold text-dark bg-transparent py-4 px-4 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                        How is the discount applied?
                      </button>
                    </h2>
                    <div id="faq2" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                      <div className="accordion-body pt-0 px-4 pb-4 text-muted text-sm">
                        Once you add an eligible product to your cart, the discount is automatically calculated and shown in your order summary before you proceed to payment.
                      </div>
                    </div>
                  </div>
                  <div className="accordion-item bg-transparent border-0 bg-light rounded-3xl overflow-hidden border border-gray-100">
                    <h2 className="accordion-header">
                      <button className="accordion-button collapsed fw-bold text-dark bg-transparent py-4 px-4 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                        What happens if the offer expires?
                      </button>
                    </h2>
                    <div id="faq3" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                      <div className="accordion-body pt-0 px-4 pb-4 text-muted text-sm">
                        If an offer expires while an item is in your cart but before you checkout, the price will revert to the original non-discounted price.
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>



    </div>
  );
};

export default Offers;
