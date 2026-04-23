import React, { useContext, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import AuthProvider, { AuthContext } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
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
    const salePrice = Number(product?.price || 0);
    const compareAtPrice = Number(
      product?.compareAtPrice ||
        product?.originalPrice ||
        product?.mrp ||
        product?.listPrice ||
        0
    );

    const fallbackCompare = compareAtPrice > salePrice ? compareAtPrice : 0;
    const discountPercent = fallbackCompare > salePrice
      ? Math.round(((fallbackCompare - salePrice) / fallbackCompare) * 100)
      : Number(product?.discountPercentage || 0);

    return {
      salePrice,
      compareAtPrice: fallbackCompare,
      discountPercent,
      hasDiscount: discountPercent > 0 && fallbackCompare > salePrice,
    };
  }, [product]);

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
    <div className="product-card-shell h-100">
      <Link to={`/product/${product._id}`} className="text-decoration-none">
        <div className="product-card-modern h-100 d-flex flex-column">
          <div className="product-card-media">
            <img
              src={imageSrc}
              className="product-card-image primary-img"
              alt={product?.name || "Product image"}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.src = fallbackImage;
              }}
            />
            {secondarySrc && (
              <img
                src={secondarySrc}
                className="product-card-image secondary-img"
                alt={product?.name || "Product secondary image"}
                loading="lazy"
                decoding="async"
              />
            )}

            <button
              type="button"
              className={`product-card-wishlist ${isWishlisted ? "active" : ""}`}
              onClick={handleWishlist}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              {isWishlisted ? <FaHeart /> : <FaRegHeart />}
            </button>

            {pricingMeta.hasDiscount ? (
              <span className="product-card-badge product-card-badge-discount">
                -{pricingMeta.discountPercent}% OFF
              </span>
            ) : null}
          </div>

          <div className="product-card-body pb-5">
            <h6 className="product-card-title">{product.name}</h6>

            <div className="product-card-rating">
              {reviewCount > 0 ? (
                <>
                  <div className="product-card-stars" aria-label={`Rating ${rating.toFixed(1)} out of 5`}>
                    {renderStars()}
                  </div>
                </>
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <span className="product-card-badge-new">New</span>
                  <span className="product-card-cod-badge">COD Available</span>
                </div>
              )}
            </div>

            <div className="product-card-price-row mt-2">
              <span className="product-card-price" style={{ fontSize: "20px", fontWeight: "bold", color: "var(--page-text)" }}>${pricingMeta.salePrice.toLocaleString("en-US")}</span>
              {pricingMeta.hasDiscount && (
                <span className="product-card-compare text-muted text-decoration-line-through">${pricingMeta.compareAtPrice.toLocaleString("en-US")}</span>
              )}
            </div>
            
            <div className="product-card-actions-hover">
              <button
                className="btn btn-cart-action product-card-btn"
                onClick={(e) => {
                  e.preventDefault();
                  if (!ensureLoggedIn({ user, navigate, location, message: "Please login to add to cart" })) return;
                  addToCart(product);
                }}
              >
                <FaShoppingCart className="me-2" /> Add to Cart
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
