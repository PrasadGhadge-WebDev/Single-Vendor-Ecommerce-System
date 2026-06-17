import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API, { getImageUrl } from "../api";
import { CartContext } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { 
  FaShoppingCart, FaHeart, FaRegHeart, FaArrowLeft, FaPercentage, FaCheckCircle, FaTag 
} from "react-icons/fa";

const PublicOfferDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { addToCart } = useContext(CartContext);
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/offers/public/${id}`);
        setOffer(data);
      } catch (err) {
        console.error("Error fetching offer details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffer();
  }, [id]);

  const calculateDiscount = (price) => {
    if (!offer) return { newPrice: price, savings: 0 };
    let newPrice = price;
    
    if (offer.type === "Percentage Discount") {
      const discAmount = (price * offer.discountValue) / 100;
      const actualDisc = offer.maxDiscount ? Math.min(discAmount, offer.maxDiscount) : discAmount;
      newPrice = price - actualDisc;
    } else if (offer.type === "Flat Discount") {
      newPrice = Math.max(0, price - offer.discountValue);
    }
    
    return {
      newPrice: Math.round(newPrice),
      savings: Math.round(price - newPrice)
    };
  };

  const formatMoney = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light text-center p-4">
        <FaPercentage size={64} className="text-muted mb-4 opacity-25" />
        <h2 className="fw-black text-dark mb-3">Offer Not Found</h2>
        <p className="text-muted mb-4">The offer you're looking for might have expired or doesn't exist.</p>
        <button onClick={() => navigate('/offers')} className="btn btn-primary rounded-pill px-5 py-3 fw-bold tracking-widest text-uppercase">
          Back to Offers
        </button>
      </div>
    );
  }

  return (
    <div className="offer-details-page bg-light min-vh-100 pb-5">
      {/* 8. Offer Details Section Header */}
      <section className="bg-primary text-white py-5 position-relative overflow-hidden mb-5">
        <div className="position-absolute top-0 end-0 bg-white rounded-circle opacity-10" style={{ width: '300px', height: '300px', transform: 'translate(30%, -30%) filter(blur(40px))' }}></div>
        <div className="container py-4 position-relative z-10">
          <button 
            onClick={() => navigate('/offers')}
            className="btn btn-link text-white text-decoration-none p-0 mb-4 d-flex align-items-center gap-2 opacity-75 hover:opacity-100 transition-opacity fw-bold tracking-wider text-sm text-uppercase"
          >
            <FaArrowLeft /> Back to All Offers
          </button>
          
          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <div className="d-inline-flex align-items-center gap-2 bg-white text-primary rounded-pill px-4 py-2 mb-3 fw-bold tracking-widest text-uppercase shadow-sm text-xs">
                {offer.type === "Percentage Discount" ? "PERCENTAGE DISCOUNT" : "FLAT DISCOUNT"}
              </div>
              <h1 className="display-4 fw-black text-white mb-3" style={{ letterSpacing: '-1px' }}>{offer.name}</h1>
              <p className="lead fw-medium opacity-75 mb-4">{offer.description}</p>
              
              <div className="d-flex flex-wrap gap-3">
                <span className="badge bg-white bg-opacity-10 text-white rounded-pill px-3 py-2 fw-medium border border-white border-opacity-25 d-flex align-items-center gap-2">
                  <FaTag /> Valid on: {offer.applicableOn}
                </span>
                <span className="badge bg-white bg-opacity-10 text-white rounded-pill px-3 py-2 fw-medium border border-white border-opacity-25 d-flex align-items-center gap-2">
                  <FaCheckCircle className="text-success" /> Code: {offer.code || 'AUTO-APPLIED'}
                </span>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end">
              <div className="bg-white bg-opacity-10 p-4 rounded-3xl border border-white border-opacity-25 backdrop-blur-sm d-inline-block text-center">
                <p className="text-uppercase tracking-widest text-xs fw-bold mb-1 opacity-75">You Get</p>
                <div className="display-3 fw-black text-white lh-1">
                  {offer.type === "Percentage Discount" ? `${offer.discountValue}%` : `₹${offer.discountValue}`}
                </div>
                <p className="text-uppercase tracking-widest text-xs fw-bold mt-1 opacity-75">OFF</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Offer Product Listing */}
      <section className="container mb-5">
        <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
          <h2 className="fw-black h3 text-dark mb-0">Eligible Products</h2>
          <span className="badge bg-primary rounded-pill px-3 py-2">{offer.eligibleProducts?.length || 0} Items</span>
        </div>

        {offer.eligibleProducts?.length === 0 ? (
           <div className="text-center py-5 bg-white rounded-4 shadow-sm border border-light">
             <FaShoppingCart size={48} className="text-muted mb-3 opacity-25" />
             <h4 className="fw-bold text-dark">No products available.</h4>
             <p className="text-muted">There are currently no active products applicable for this offer.</p>
           </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
            {offer.eligibleProducts?.map((product) => {
              const { newPrice, savings } = calculateDiscount(product.price);
              const hasDiscount = savings > 0;
              const isWishlisted = isInWishlist(product._id);
              
              return (
                <div key={product._id} className="col">
                  <div className="card h-100 border-0 shadow-sm rounded-[24px] overflow-hidden transition-all hover:-translate-y-2 hover:shadow-xl d-flex flex-column bg-white">
                    <div className="position-relative p-4 pb-0 text-center" style={{ height: '200px' }}>
                      {hasDiscount && (
                        <div className="position-absolute top-0 start-0 m-3 z-10">
                          <span className="badge bg-danger rounded-pill px-3 py-2 fw-black shadow-sm">
                            {offer.type === "Percentage Discount" ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                          </span>
                        </div>
                      )}
                      <button 
                        onClick={() => toggleWishlist(product)}
                        className="btn btn-light rounded-circle p-2 position-absolute top-0 end-0 m-3 z-10 shadow-sm text-danger hover:scale-110 transition-transform"
                      >
                        {isWishlisted ? <FaHeart size={16} /> : <FaRegHeart size={16} />}
                      </button>
                      <img 
                        src={getImageUrl(product.image)} 
                        alt={product.name} 
                        className="img-fluid h-100 object-contain hover:scale-105 transition-transform duration-500"
                        style={{ mixBlendMode: 'multiply' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    
                    <div className="card-body d-flex flex-column p-4">
                      <div className="mb-2">
                        <span className="badge bg-light text-muted fw-bold text-[10px] text-uppercase tracking-wider">
                          {product.category}
                        </span>
                      </div>
                      
                      <h5 
                        className="fw-bold text-dark mb-3 line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate(`/product/${product._id}`)}
                      >
                        {product.name}
                      </h5>
                      
                      <div className="mt-auto">
                        {hasDiscount ? (
                          <div className="mb-3">
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <span className="fs-4 fw-black text-dark">{formatMoney(newPrice)}</span>
                              <span className="text-muted text-decoration-line-through text-sm fw-medium">{formatMoney(product.price)}</span>
                            </div>
                            <div className="text-success text-xs fw-black tracking-widest text-uppercase d-flex align-items-center gap-1">
                              <FaTag size={10} /> You Save {formatMoney(savings)}!
                            </div>
                          </div>
                        ) : (
                          <div className="mb-3">
                            <span className="fs-4 fw-black text-dark">{formatMoney(product.price)}</span>
                          </div>
                        )}
                        
                        <button 
                          onClick={() => addToCart(product)}
                          className="btn w-100 rounded-pill py-3 fw-bold tracking-widest text-uppercase text-[12px] bg-dark text-white hover:bg-primary transition-colors d-flex justify-content-center align-items-center gap-2"
                        >
                          <FaShoppingCart size={14} /> Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default PublicOfferDetails;
