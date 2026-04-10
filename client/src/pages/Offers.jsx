import React, { useEffect, useState } from "react";
import API, { getImageUrl } from "../api";
import { FaTags, FaBolt, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import "./MarketingPages.css";
import offerHeroImage from "../assets/hero_banner_1.png";
import offerCardImageOne from "../assets/hero_banner_2.png";
import offerCardImageTwo from "../assets/hero_banner_3.png";

const fallbackOfferImages = [offerCardImageOne, offerCardImageTwo, offerHeroImage];

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const { data } = await API.get("/offers/public");
        setOffers(Array.isArray(data) ? data : []);
      } catch {
        setOffers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const formatDiscount = (offer) =>
    offer.discountType === "PERCENT" ? `${offer.discountValue}% OFF` : `INR ${offer.discountValue} OFF`;

  const getOfferImage = (offer, index) => {
    const rawImage = offer?.image || offer?.bannerImage || offer?.coverImage || offer?.thumbnail;
    return getImageUrl(rawImage) || fallbackOfferImages[index % fallbackOfferImages.length];
  };

  return (
    <div className="offers-page">
      <section
        className="text-white marketing-hero"
        style={{ background: "linear-gradient(120deg, #0f172a 0%, #7c2d12 48%, #c2410c 100%)" }}
      >
        <div className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-7 marketing-fade-up">
              <p className="text-uppercase mb-2" style={{ letterSpacing: "0.08em", opacity: 0.85 }}>
                Offers & Discounts
              </p>
              <h1 className="fw-bold mb-3">Smart savings on your favorite products.</h1>
              <p className="lead mb-0" style={{ opacity: 0.92 }}>
                Check current promotional offers and apply valid coupon codes during checkout for instant discounts.
              </p>
            </div>
            <div className="col-lg-5 marketing-fade-up marketing-delay-1">
              <div className="offers-hero-media">
                <img src={offerHeroImage} alt="Special offers showcase" className="offers-hero-image" loading="eager" decoding="async" />
                <div className="offers-hero-chip offers-hero-chip-one">
                  <span className="offers-hero-chip-value">Up to 60% off</span>
                  <span className="offers-hero-chip-label">Trending now</span>
                </div>
                <div className="offers-hero-chip offers-hero-chip-two">
                  <span className="offers-hero-chip-value">Coupon ready</span>
                  <span className="offers-hero-chip-label">At checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-5" style={{ maxWidth: "1100px" }}>
        <div className="text-center mb-4 marketing-fade-up">
          <h3 className="fw-bold marketing-section-title">Available Promotions</h3>
          <p className="text-muted mb-0">Explore the best available deals and coupon benefits.</p>
        </div>

        {loading ? (
          <div className="card border-0 shadow-sm p-4 text-center marketing-card marketing-fade-up">
            <p className="mb-0 text-muted">Loading offers...</p>
          </div>
        ) : offers.length === 0 ? (
          <div className="card border-0 shadow-sm p-4 text-center marketing-card marketing-fade-up">
            <div className="offer-icon-badge mx-auto mb-3">
              <FaTags />
            </div>
            <h5 className="mb-2">No active offers right now</h5>
            <p className="text-muted mb-0">Please check again later for new promotions.</p>
          </div>
        ) : (
          <div className="row g-4">
            {offers.map((offer, index) => (
              <div className="col-md-6" key={offer._id}>
                <div className={`card border-0 shadow-sm h-100 p-3 marketing-card marketing-fade-up marketing-delay-${Math.min(index % 4, 3)}`}>
                  <div className="offer-card-image-wrap mb-3">
                    <img
                      src={getOfferImage(offer, index)}
                      alt={offer.title}
                      className="offer-card-image"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.src = fallbackOfferImages[index % fallbackOfferImages.length];
                      }}
                    />
                  </div>
                  <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                    <h5 className="mb-0">{offer.title}</h5>
                    <span className={`badge ${offer.isCurrentlyValid ? "text-bg-success" : "text-bg-warning"}`}>
                      {offer.isCurrentlyValid ? "Live" : "Inactive"}
                    </span>
                  </div>

                  <p className="text-muted mb-3">{offer.description || "Special discount offer available for a limited time."}</p>

                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <span className="offer-chip">
                      <FaBolt size={12} /> {formatDiscount(offer)}
                    </span>
                    <span className="offer-chip">Min Order: INR {offer.minOrderAmount || 0}</span>
                  </div>

                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-auto">
                    <div>
                      <div className="small text-muted mb-1">Coupon Code</div>
                      <span className="offer-code">{offer.code}</span>
                    </div>
                    <div className={`small d-flex align-items-center gap-1 ${offer.isCurrentlyValid ? "text-success" : "text-warning"}`}>
                      {offer.isCurrentlyValid ? <FaCheckCircle /> : <FaExclamationTriangle />}
                      {offer.isCurrentlyValid ? "Ready to apply" : "Currently unavailable"}
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

export default Offers;
