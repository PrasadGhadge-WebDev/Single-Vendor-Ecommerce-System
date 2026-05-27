import React, { useEffect, useState } from "react";
import API, { getImageUrl } from "../api";
import { FaTags, FaBolt, FaCheckCircle, FaCopy, FaExclamationTriangle, FaSearch } from "react-icons/fa";
import "./MarketingPages.css";
import offerHeroImage from "../assets/hero_banner_1.png";
import offerCardImageOne from "../assets/hero_banner_2.png";
import offerCardImageTwo from "../assets/hero_banner_3.png";
import { toast } from "react-toastify";

const fallbackOfferImages = [offerCardImageOne, offerCardImageTwo, offerHeroImage];

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);

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

  const formatMoney = (value) => `INR ${Number(value || 0).toLocaleString("en-IN")}`;

  const formatDiscount = (offer) => {
    if (offer?.discountType === "PERCENT") return `${offer.discountValue}% OFF`;
    return `${formatMoney(offer?.discountValue)} OFF`;
  };

  const getOfferImage = (offer, index) => {
    const rawImage = offer?.image || offer?.bannerImage || offer?.coverImage || offer?.thumbnail;
    return getImageUrl(rawImage) || fallbackOfferImages[index % fallbackOfferImages.length];
  };

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  };

  const getValidityLabel = (offer) => {
    const start = formatDate(offer?.startsAt);
    const end = formatDate(offer?.expiresAt);
    if (start && end) return `${start} - ${end}`;
    if (end) return `Valid till ${end}`;
    if (start) return `Starts ${start}`;
    return "Limited time";
  };

  const copyCode = async (code) => {
    const safeCode = String(code || "").trim();
    if (!safeCode) return;

    try {
      await navigator.clipboard.writeText(safeCode);
      toast.success("Coupon code copied");
    } catch {
      toast.info(`Copy this code: ${safeCode}`);
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const visibleOffers = offers
    .filter((offer) => {
      if (showInactive) return true;
      return offer?.offerStatus === "LIVE" || offer?.offerStatus === "UPCOMING";
    })
    .filter((offer) => {
      if (!normalizedQuery) return true;
      const haystack = `${offer?.title || ""} ${offer?.code || ""} ${offer?.description || ""}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });

  return (
    <div className="offers-page">
      <section className="marketing-hero-premium marketing-hero">
        <div className="container py-4">
          <div className="row align-items-center g-5">
            <div className="col-lg-7 marketing-fade-up">
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-primary bg-opacity-10 text-primary mb-3 small fw-bold text-uppercase tracking-wider">
                <FaTags /> Exclusive Deals
              </div>
              <h1 className="display-4 fw-black mb-3 brand-font">Smart savings on your favorite products.</h1>
              <p className="lead mb-4 opacity-75">
                Check current promotional offers and apply valid coupon codes during checkout for instant discounts.
              </p>
              <div className="d-flex align-items-center gap-4">
                <div className="text-center">
                  <div className="h3 fw-bold mb-0">60%</div>
                  <div className="small opacity-50 uppercase">Max Off</div>
                </div>
                <div className="vr opacity-25"></div>
                <div className="text-center">
                  <div className="h3 fw-bold mb-0">15+</div>
                  <div className="small opacity-50 uppercase">Active Offers</div>
                </div>
              </div>
            </div>
            <div className="col-lg-5 marketing-fade-up marketing-delay-1">
              <div className="offers-hero-media">
                <img src={offerHeroImage} alt="Special offers showcase" className="offers-hero-image" loading="eager" />
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

      <section className="container py-5">
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4 mb-5 marketing-fade-up">
          <div className="max-w-md">
            <h2 className="fw-bold brand-font mb-1">Available Promotions</h2>
            <p className="text-muted-text mb-0">Search through our exclusive deals and copy coupon codes.</p>
          </div>

          <div className="d-flex flex-column flex-sm-row gap-3 align-items-center">
            <div className="input-group search-glass-wrapper" style={{ minWidth: "300px" }}>
              <span className="input-group-text bg-transparent border-0 ps-3">
                <FaSearch className="text-muted" />
              </span>
              <input
                className="form-control border-0 bg-transparent shadow-none"
                placeholder="Search by code or title..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <button
              type="button"
              className={`btn rounded-pill px-4 fw-bold ${showInactive ? "btn-outline-secondary" : "btn-primary"}`}
              onClick={() => setShowInactive((prev) => !prev)}
              style={{ whiteSpace: 'nowrap' }}
            >
              {showInactive ? "Show Valid Only" : "Show All Offers"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="row g-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="col-md-6" key={`skeleton-${index}`}>
                <div className="card border-0 shadow-sm h-100 p-4 marketing-card" style={{ borderRadius: '24px' }}>
                  <div className="offer-card-image-wrap mb-4 placeholder-glow" style={{ height: "220px" }}>
                    <div className="placeholder w-100 h-100" />
                  </div>
                  <div className="placeholder-glow">
                    <div className="d-flex justify-content-between gap-2 mb-3">
                      <span className="placeholder col-7 rounded-pill" style={{ height: '24px' }} />
                      <span className="placeholder col-3 rounded-pill" />
                    </div>
                    <span className="placeholder col-10 mb-2" />
                    <span className="placeholder col-8 mb-4" />
                    <div className="d-flex gap-2 mb-4">
                      <span className="placeholder col-3 rounded-pill" style={{ height: '32px' }} />
                      <span className="placeholder col-3 rounded-pill" style={{ height: '32px' }} />
                    </div>
                    <div className="pt-3 border-top border-theme">
                      <span className="placeholder col-4 mb-2" />
                      <div className="d-flex gap-2">
                        <span className="placeholder col-5" style={{ height: '38px', borderRadius: '12px' }} />
                        <span className="placeholder col-3" style={{ height: '38px', borderRadius: '12px' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : visibleOffers.length === 0 ? (
          <div className="card border-0 shadow-sm p-4 text-center marketing-card marketing-fade-up">
            <div className="offer-icon-badge mx-auto mb-3">
              <FaTags />
            </div>
            <h5 className="mb-2">No offers found</h5>
            <p className="text-muted mb-0">
              Try a different search, or enable <strong>Show inactive</strong>.
            </p>
          </div>
        ) : (
          <div className="row g-4">
            {visibleOffers.map((offer, index) => (
              <div className="col-md-6" key={offer._id}>
                <div className={`card border-0 shadow-sm h-100 p-4 marketing-card marketing-fade-up marketing-delay-${Math.min(index % 4, 3)}`} style={{ borderRadius: '24px' }}>
                  <div className="offer-card-image-wrap mb-4">
                    <img
                      src={getOfferImage(offer, index)}
                      alt={offer.title || "Offer banner"}
                      className="offer-card-image"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = fallbackOfferImages[index % fallbackOfferImages.length];
                      }}
                    />
                  </div>
                  <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                    <h4 className="mb-0 fw-bold brand-font">{offer.title || "Special Offer"}</h4>
                    <span className={`badge rounded-pill px-3 py-2 ${
                      offer.offerStatus === "LIVE" ? "bg-success bg-opacity-10 text-success" : 
                      offer.offerStatus === "UPCOMING" ? "bg-primary bg-opacity-10 text-primary" :
                      "bg-warning bg-opacity-10 text-warning"
                    }`}>
                      • {offer.offerStatus || (offer.isCurrentlyValid ? "LIVE" : "INACTIVE")}
                    </span>
                  </div>

                  <p className="text-muted-text mb-4" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{offer.description || "Special discount offer available for a limited time."}</p>

                  <div className="d-flex flex-wrap gap-2 mb-4">
                    <span className="offer-chip">
                      <FaBolt size={12} className="text-primary" /> {formatDiscount(offer)}
                    </span>
                    <span className="offer-chip">Min: {formatMoney(offer.minOrderAmount || 0)}</span>
                    {Number(offer.maxDiscountAmount || 0) > 0 && offer.discountType === "PERCENT" && (
                      <span className="offer-chip">Max: {formatMoney(offer.maxDiscountAmount)}</span>
                    )}
                    <span className="offer-chip small fw-normal opacity-75">{getValidityLabel(offer)}</span>
                  </div>

                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mt-auto pt-3 border-top border-theme">
                    <div>
                      <div className="small text-muted-text mb-2 fw-semibold">COUPON CODE</div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="offer-code">{offer.code || "N/A"}</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary rounded-pill px-3"
                          onClick={() => copyCode(offer.code)}
                          disabled={!offer.code}
                        >
                          <FaCopy className="me-1" />
                          Copy
                        </button>
                      </div>
                    </div>
                    <div className={`small d-flex align-items-center gap-2 fw-bold ${offer.offerStatus === "LIVE" ? "text-success" : "text-warning"}`}>
                      {offer.offerStatus === "LIVE" ? <FaCheckCircle /> : <FaExclamationTriangle />}
                      {offer.offerStatus === "LIVE" ? "READY TO USE" : offer.offerStatus}
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
