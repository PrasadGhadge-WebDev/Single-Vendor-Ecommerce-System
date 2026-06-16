import React, { createContext, useState, useEffect, useMemo } from 'react';
import API from '../api';

export const OfferContext = createContext();

export const OfferProvider = ({ children }) => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/offers/public");
      
      const formattedOffers = Array.isArray(data) ? data.map(o => ({
        ...o,
        title: o.name || o.title,
        offerStatus: o.displayStatus === "Active" ? "LIVE" : (o.displayStatus === "Scheduled" ? "UPCOMING" : o.displayStatus || "INACTIVE"),
        discountType: o.type === "Percentage Discount" ? "PERCENT" : (o.type === "Flat Discount" ? "FLAT" : "FREE_SHIPPING"),
        startsAt: o.startDate || o.startsAt,
        expiresAt: o.endDate || o.expiresAt,
        maxDiscountAmount: o.maxDiscount || o.maxDiscountAmount
      })).filter(o => o.offerStatus === "LIVE") : [];
      
      setOffers(formattedOffers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const calculateDiscountValue = (offer, price) => {
    if (offer.discountType === 'PERCENT') {
      let d = (price * offer.discountValue) / 100;
      if (offer.maxDiscountAmount) d = Math.min(d, offer.maxDiscountAmount);
      return d;
    } else if (offer.discountType === 'FLAT') {
      return Math.min(price, offer.discountValue);
    }
    return 0;
  };

  const getBestOfferForProduct = (product) => {
    if (!product || !product.price) return null;
    let bestOffer = null;
    let maxDiscount = 0;

    for (const offer of offers) {
      // Check minimum order amount requirement (applicable per item for simplicity, or we skip if we want it cart-level only)
      if (offer.minOrderAmount && product.price < offer.minOrderAmount) continue;

      let isApplicable = false;
      if (offer.applicableOn === "All Products") {
        isApplicable = true;
      } else if (offer.applicableOn === "Categories" && offer.categories?.includes(product.category)) {
        isApplicable = true;
      } else if (offer.applicableOn === "Specific Products" && offer.products?.some(p => p._id === product._id || p === product._id)) {
        isApplicable = true;
      }

      if (isApplicable) {
        const d = calculateDiscountValue(offer, product.price);
        if (d > maxDiscount) {
          maxDiscount = d;
          bestOffer = offer;
        }
      }
    }
    
    return bestOffer ? { 
      offer: bestOffer, 
      discountAmount: maxDiscount, 
      finalPrice: Math.max(0, product.price - maxDiscount) 
    } : null;
  };

  const getCartOfferDetails = (cartItems) => {
    if (!cartItems || !Array.isArray(cartItems)) return { subtotal: 0, discount: 0, finalAmount: 0, appliedOffers: [], primaryOffer: null };
    
    let totalOriginal = 0;
    let totalDiscount = 0;
    let appliedOffersMap = new Map();

    cartItems.forEach(item => {
      const product = item.productId;
      if (product) {
        const qty = item.quantity || 1;
        const lineTotal = product.price * qty;
        totalOriginal += lineTotal;
        
        const best = getBestOfferForProduct(product);
        if (best) {
          totalDiscount += best.discountAmount * qty;
          if (!appliedOffersMap.has(best.offer._id)) {
            appliedOffersMap.set(best.offer._id, best.offer);
          }
        }
      }
    });

    const appliedOffers = Array.from(appliedOffersMap.values());

    return {
      subtotal: totalOriginal,
      discount: totalDiscount,
      finalAmount: Math.max(0, totalOriginal - totalDiscount),
      appliedOffers,
      primaryOffer: appliedOffers.length > 0 ? appliedOffers[0] : null
    };
  };

  const heroOffer = useMemo(() => {
    return offers.find(o => o.applicableOn === "All Products") || offers[0] || null;
  }, [offers]);

  return (
    <OfferContext.Provider value={{ offers, loading, fetchOffers, getBestOfferForProduct, getCartOfferDetails, heroOffer }}>
      {children}
    </OfferContext.Provider>
  );
};
