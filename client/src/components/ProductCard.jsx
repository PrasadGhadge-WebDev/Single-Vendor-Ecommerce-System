import React, { useContext, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { getImageUrl } from "../api";
import { FaHeart, FaRegHeart, FaEye, FaStar, FaRegStar, FaShoppingCart, FaBolt } from "react-icons/fa";
import "./ProductCard.css";
import { ensureLoggedIn } from "../utils/authGuards";

const FALLBACK_IMAGE =
  "https://via.placeholder.com/320x220/f1f5f9/64748b?text=No+Image";

const ProductCard = ({ product, showBuyNow = true, onBuyNow }) => {
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const rating = Number(product?.averageRating || 0);
  const reviewCount = Number(product?.numReviews || 0);
  const stockCount = Number(product?.stock || 0);
  const categoryLabel = product?.category || "General";
  const stockLabel = stockCount > 0 ? `${stockCount} in stock` : "Out of stock";
  const descriptionText = String(product?.description || "");

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

  const handleQuickView = () => {
    navigate(`/product/${product._id}`);
  };

  const handleWishlist = () => {
    setIsWishlisted((prev) => !prev);
  };

  const handleBuyNow = () => {
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
      <div className="product-card-modern h-100">
        <div className="product-card-media">
          <div className="product-card-topline">
            <span className="product-card-chip">{categoryLabel}</span>
            <span className={`product-card-chip ${stockCount > 0 ? "is-live" : "is-muted"}`}>{stockLabel}</span>
          </div>

          <Link to={`/product/${product._id}`} className="product-card-image-link" aria-label={`View ${product.name}`}>
            <img
              src={product.image ? getImageUrl(product.image) : FALLBACK_IMAGE}
              className="product-card-image"
              alt={product.name}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          </Link>

          <button
            type="button"
            className={`product-card-wishlist ${isWishlisted ? "active" : ""}`}
            onClick={handleWishlist}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            {isWishlisted ? <FaHeart /> : <FaRegHeart />}
          </button>

          <button
            type="button"
            className="product-card-quickview"
            onClick={handleQuickView}
            aria-label="Quick view"
          >
            <FaEye className="me-2" />
            Quick View
          </button>

          {pricingMeta.hasDiscount ? (
            <span className="product-card-badge product-card-badge-discount">
              -{pricingMeta.discountPercent}% OFF
            </span>
          ) : (
            <span className="product-card-badge product-card-badge-new">
              New
            </span>
          )}
        </div>

        <div className="product-card-body">
          <div className="product-card-highlights">
            <span className="product-card-highlight">
              <FaBolt />
              Smart pick
            </span>
            <span className="product-card-highlight">
              {reviewCount > 0 ? (
                <>
                  <FaStar className="me-1" />
                  {rating.toFixed(1)} rating
                </>
              ) : (
                <>
                  <FaStar className="me-1" />
                  New arrival
                </>
              )}
            </span>
          </div>

          <Link to={`/product/${product._id}`} className="text-decoration-none product-card-title-link">
            <h6 className="product-card-title">{product.name}</h6>
          </Link>

          <div className="product-card-rating">
            {reviewCount > 0 ? (
              <>
                <div className="product-card-stars" aria-label={`Rating ${rating.toFixed(1)} out of 5`}>
                  {renderStars()}
                </div>
                <span className="product-card-rating-value">{rating.toFixed(1)}</span>
                <span className="product-card-rating-count">({reviewCount})</span>
              </>
            ) : (
              <span className="product-card-no-reviews">No reviews yet</span>
            )}
          </div>

          <div className="product-card-price-row">
            <span className="product-card-price">INR {pricingMeta.salePrice.toLocaleString("en-IN")}</span>
            {pricingMeta.hasDiscount && (
              <span className="product-card-compare">INR {pricingMeta.compareAtPrice.toLocaleString("en-IN")}</span>
            )}
          </div>

          <p className="product-card-summary">
            {descriptionText
              ? descriptionText.slice(0, 118).trim() + (descriptionText.length > 118 ? "..." : "")
              : "A premium pick with quick add-to-cart, wishlist, and view details actions."}
          </p>

          <div className="product-card-actions">
            <button
              className="btn btn-cart-action product-card-cart-btn"
              onClick={() => {
                if (!ensureLoggedIn({ user, navigate, location, message: "Please login to add to cart" })) return;
                addToCart(product);
              }}
            >
              <FaShoppingCart className="me-2" />
              Add to Cart
            </button>

            {showBuyNow && (
              <button className="btn btn-buy-action product-card-buy-btn" onClick={handleBuyNow}>
                <FaBolt className="me-2" />
                Buy Now
              </button>
            )}
          </div>

          <div className="product-card-footnote">
            <span>Quick view ready</span>
            <span>Wishlist synced locally</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
