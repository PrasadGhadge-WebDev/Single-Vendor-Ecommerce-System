import React, { useContext, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import AuthProvider, { AuthContext } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { OfferContext } from "../context/OfferContext";
import { getImageUrl } from "../api";
import { FaHeart, FaRegHeart, FaStar, FaRegStar, FaShoppingCart, FaBolt } from "react-icons/fa";
import "./ProductCard.css";
import { ensureLoggedIn } from "../utils/authGuards";
import fallbackOne from "../assets/hero_banner_1.png";
import fallbackTwo from "../assets/hero_banner_2.png";
import fallbackThree from "../assets/hero_banner_3.png";
import fallbackFour from "../assets/no-item.png";

const FALLBACK_IMAGES = [fallbackOne, fallbackTwo, fallbackThree, fallbackFour];

const hashString = (value) => {
  const input = String(value || "");
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const getProductImageCandidate = (product) => {
  if (!product) return "";
  const direct =
    product.image ||
    product.thumbnail ||
    product.coverImage ||
    product.bannerImage ||
    product.photo ||
    product.imageUrl;

  if (direct) return direct;

  if (Array.isArray(product.images) && product.images.length > 0) return product.images[0];
  if (Array.isArray(product.photos) && product.photos.length > 0) return product.photos[0];

  return "";
};

const getSecondaryImageCandidate = (product) => {
  if (Array.isArray(product.images) && product.images.length > 1) return product.images[1];
  if (Array.isArray(product.photos) && product.photos.length > 1) return product.photos[1];
  return "";
};

const ProductCard = ({ product, showBuyNow = true, onBuyNow }) => {
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { getBestOfferForProduct } = useContext(OfferContext);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isWishlisted = isInWishlist(product?._id);

  const rating = Number(product?.averageRating || 0);
  const reviewCount = Number(product?.numReviews || 0);
  const stockCount = Number(product?.stock || 0);
  const categoryLabel = product?.category || "General";
  const stockLabel = stockCount > 0 ? `${stockCount} in stock` : "Out of stock";
  const descriptionText = String(product?.description || "");
  const fallbackImage =
    FALLBACK_IMAGES[hashString(product?._id || product?.name) % FALLBACK_IMAGES.length];
  const imageCandidate = getProductImageCandidate(product);
  const secondaryCandidate = getSecondaryImageCandidate(product);
  const imageSrc = imageCandidate ? getImageUrl(imageCandidate) : fallbackImage;
  const secondarySrc = secondaryCandidate ? getImageUrl(secondaryCandidate) : null;

  const pricingMeta = useMemo(() => {
    let salePrice = Number(product?.price || 0);
    const originalPrice = salePrice;
    let compareAtPrice = Number(
      product?.compareAtPrice ||
        product?.originalPrice ||
        product?.mrp ||
        product?.listPrice ||
        0
    );

    let hasDiscount = false;
    let discountPercent = 0;
    let discountLabel = "";
    
    // Evaluate dynamic offer
    const bestOfferData = getBestOfferForProduct(product);
    if (bestOfferData) {
      salePrice = bestOfferData.finalPrice;
      compareAtPrice = originalPrice;
      hasDiscount = true;
      if (bestOfferData.offer.discountType === 'PERCENT') {
        discountPercent = bestOfferData.offer.discountValue;
        discountLabel = `${discountPercent}% OFF`;
      } else {
        discountLabel = `₹${bestOfferData.offer.discountValue} OFF`;
      }
    } else {
      // Fallback to static pricing if no dynamic offer
      const fallbackCompare = compareAtPrice > salePrice ? compareAtPrice : 0;
      discountPercent = fallbackCompare > salePrice
        ? Math.round(((fallbackCompare - salePrice) / fallbackCompare) * 100)
        : Number(product?.discountPercentage || 0);
      
      hasDiscount = discountPercent > 0 && fallbackCompare > salePrice;
      if (hasDiscount) discountLabel = `${discountPercent}% OFF`;
      compareAtPrice = fallbackCompare;
    }

    return {
      salePrice,
      compareAtPrice,
      discountPercent,
      hasDiscount,
      discountLabel
    };
  }, [product, getBestOfferForProduct]);

  const renderStars = () =>
    Array.from({ length: 5 }, (_, index) => {
      const filled = index + 1 <= Math.round(rating);
      return filled ? (
        <FaStar key={`star-${index}`} className="product-card-star filled" />
      ) : (
        <FaRegStar key={`star-${index}`} className="product-card-star" />
      );
    });

  const handleWishlist = (e) => {
    e.preventDefault();
    toggleWishlist(product);
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    if (!ensureLoggedIn({ user, navigate, location, message: "Please login to buy now" })) return;
    if (typeof onBuyNow === "function") {
      onBuyNow(product);
      return;
    }
    navigate("/checkout", {
      state: {
        buyNowItem: {
          product,
          quantity: 1,
        },
      },
    });
  };

  return (
    <div className="w-full md:w-[220px] lg:w-[260px] h-auto md:h-[380px] lg:h-[420px] mx-auto">
      <Link
        to={`/product/${product._id}`}
        className="block h-full w-full outline-none"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <div className="h-full w-full bg-white rounded-[24px] p-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] hover:-translate-y-2 transition-all duration-300 flex flex-col relative group border border-gray-100/50">
          
          <button
            type="button"
            className={`absolute top-[20px] right-[20px] w-[42px] h-[42px] bg-white shadow-md rounded-full flex items-center justify-center z-20 hover:scale-110 transition-transform ${isWishlisted ? "text-red-500" : "text-gray-400"}`}
            onClick={handleWishlist}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            {isWishlisted ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
          </button>

          <div className="w-full h-[160px] flex items-center justify-center overflow-hidden mb-5 relative z-10 shrink-0">
            <img
              src={imageSrc}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
              alt={product?.name || "Product image"}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = fallbackImage;
              }}
            />
            {pricingMeta.hasDiscount && (
              <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10 shadow-sm flex items-center gap-1">
                <FaBolt size={10} /> {pricingMeta.discountLabel}
              </span>
            )}
          </div>

          <div className="flex-grow flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="bg-blue-600 text-white px-3 py-[3px] rounded-full text-[9px] font-bold tracking-wider whitespace-nowrap">NEW ARRIVAL</span>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest whitespace-nowrap">PREMIUM QUALITY</span>
              </div>
              <h3 className="text-[18px] font-bold text-gray-900 leading-[1.3] line-clamp-2 h-[48px]" title={product.name}>
                {product.name}
              </h3>
              
              <div className="mt-1 mb-2 hidden md:block">
                {reviewCount > 0 ? (
                  <div className="flex items-center gap-1">
                    <div className="flex text-yellow-400 text-[10px]">
                      {renderStars()}
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold">({reviewCount})</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col mt-auto shrink-0">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-[22px] font-black text-gray-900">₹{pricingMeta.salePrice.toLocaleString("en-IN")}</span>
                {pricingMeta.hasDiscount && (
                  <span className="text-[12px] text-gray-400 line-through font-medium">₹{pricingMeta.compareAtPrice.toLocaleString("en-IN")}</span>
                )}
              </div>
              
              <button
                className="w-full h-[52px] rounded-[14px] bg-[#0a192f] text-white font-bold text-[13px] tracking-wide flex items-center justify-center gap-2 hover:bg-black hover:shadow-lg active:scale-95 transition-all duration-300"
                onClick={(e) => {
                  e.preventDefault();
                  if (!ensureLoggedIn({ user, navigate, location, message: "Please login to add to cart" })) return;
                  addToCart(product);
                }}
              >
                <FaShoppingCart size={16} /> ADD TO CART
              </button>
            </div>
          </div>

        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
