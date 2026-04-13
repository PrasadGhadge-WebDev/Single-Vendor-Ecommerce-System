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
    .filter((offer) => (showInactive ? true : Boolean(offer?.isCurrentlyValid)))
    .filter((offer) => {
      if (!normalizedQuery) return true;
      const haystack = `${offer?.title || ""} ${offer?.code || ""} ${offer?.description || ""}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });

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
        <div className="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-3 mb-4 marketing-fade-up">
          <div>
            <h3 className="fw-bold marketing-section-title mb-2">Available Promotions</h3>
            <p className="text-muted mb-0">Search offers and copy coupon codes for checkout.</p>
          </div>

          <div className="d-flex flex-column flex-sm-row gap-2" style={{ minWidth: "min(520px, 100%)" }}>
            <div className="input-group">
              <span className="input-group-text bg-transparent">
                <FaSearch />
              </span>
              <input
                className="form-control"
                placeholder="Search by code or title..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <button
              type="button"
              className={`btn ${showInactive ? "btn-outline-secondary" : "btn-outline-primary"}`}
              onClick={() => setShowInactive((prev) => !prev)}
            >
              {showInactive ? "Hide inactive" : "Show inactive"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="row g-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="col-md-6" key={`skeleton-${index}`}>
                <div className="card border-0 shadow-sm h-100 p-3 marketing-card">
                  <div className="offer-card-image-wrap mb-3" style={{ height: "190px" }} />
                  <div className="placeholder-glow">
                    <div className="d-flex justify-content-between gap-2 mb-2">
                      <span className="placeholder col-6" />
                      <span className="placeholder col-3" />
                    </div>
                    <span className="placeholder col-10" />
                    <span className="placeholder col-8" />
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
                <div className={`card border-0 shadow-sm h-100 p-3 marketing-card marketing-fade-up marketing-delay-${Math.min(index % 4, 3)}`}>
                  <div className="offer-card-image-wrap mb-3">
                    <img
                      src={getOfferImage(offer, index)}
                      alt={offer.title || "Offer banner"}
                      className="offer-card-image"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.src = fallbackOfferImages[index % fallbackOfferImages.length];
                      }}
                    />
                  </div>
                  <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                    <h5 className="mb-0">{offer.title || "Special Offer"}</h5>
                    <span className={`badge ${offer.isCurrentlyValid ? "text-bg-success" : "text-bg-warning"}`}>
                      {offer.isCurrentlyValid ? "Live" : "Inactive"}
                    </span>
                  </div>

                  <p className="text-muted mb-3">{offer.description || "Special discount offer available for a limited time."}</p>

                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <span className="offer-chip">
                      <FaBolt size={12} /> {formatDiscount(offer)}
                    </span>
                    <span className="offer-chip">Min Order: {formatMoney(offer.minOrderAmount || 0)}</span>
                    {Number(offer.maxDiscountAmount || 0) > 0 && offer.discountType === "PERCENT" && (
                      <span className="offer-chip">Max: {formatMoney(offer.maxDiscountAmount)}</span>
                    )}
                    <span className="offer-chip">{getValidityLabel(offer)}</span>
                  </div>

                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-auto">
                    <div>
                      <div className="small text-muted mb-1">Coupon Code</div>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="offer-code">{offer.code || "N/A"}</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => copyCode(offer.code)}
                          disabled={!offer.code}
                        >
                          <FaCopy className="me-1" />
                          Copy
                        </button>
                      </div>
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
