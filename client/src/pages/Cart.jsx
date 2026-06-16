import { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { OfferContext } from "../context/OfferContext";
import { getImageUrl } from "../api";
import { FaTags } from "react-icons/fa";
import { toast } from "react-toastify";
import { ensureLoggedIn } from "../utils/authGuards";

const FALLBACK_IMAGE =
  "https://placehold.co/120x120/f1f5f9/64748b?text=No+Image";

const Cart = () => {
  const { cart, updateQuantity, removeItem } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { getCartOfferDetails, getBestOfferForProduct } = useContext(OfferContext);
  const navigate = useNavigate();
  const location = useLocation();

  const cartOfferDetails = getCartOfferDetails(cart);

  const handleQuantityChange = (productId, value) => {
    const qty = Math.max(1, Number(value) || 1);
    updateQuantity(productId, qty);
  };

  const handleBuyNow = (item) => {
    if (!ensureLoggedIn({ user, navigate, location, message: "Please login to checkout" })) return;
    navigate("/checkout", {
      state: {
        buyNowItem: {
          product: item.productId,
          quantity: item.quantity,
        },
      },
    });
  };

  const handleBuyTotalOrder = async () => {
    if (!ensureLoggedIn({ user, navigate, location, message: "Please login to checkout" })) return;
    if (cart.length === 0) {
      toast.warning("Cart is empty");
      return;
    }
    navigate("/checkout");
  };

  return (
    <div className="bg-surface-2 min-h-screen transition-colors duration-400">
      <div className="container" style={{ maxWidth: "980px", paddingTop: "120px", paddingBottom: "60px" }}>
        <h1 className="mb-8 text-primary-text font-black italic tracking-tighter uppercase">Shopping Cart</h1>

      {cart.length === 0 ? (
        <p className="text-muted-text">Your cart is empty.</p>
      ) : (
        <>
          {cart.map((item) => {
            const product = item.productId;
            const imageSrc = product?.image ? getImageUrl(product.image) : FALLBACK_IMAGE;

            return (
              <div
                key={`${product?._id || "item"}-${item.quantity}`}
                className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-3 p-3 border border-theme rounded-4 shadow-sm bg-surface-1"
              >
                <div className="d-flex align-items-center" style={{ gap: "14px" }}>
                  <Link to={`/product/${product?._id}`}>
                    <img
                      src={imageSrc}
                      alt={product?.name || "Product"}
                      width="78"
                      height="78"
                      loading="lazy"
                      decoding="async"
                      style={{
                        objectFit: "cover",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color)",
                        background: "var(--surface-2)",
                      }}
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </Link>

                  <div>
                    <Link to={`/product/${product?._id}`} className="text-decoration-none">
                      <h6 className="mb-1 text-primary-text font-bold">{product?.name}</h6>
                    </Link>
                    
                    {/* Dynamic Price Display */}
                    {(() => {
                      const bestOffer = getBestOfferForProduct(product);
                      if (bestOffer) {
                        return (
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="text-primary-text font-bold">INR {bestOffer.finalPrice.toLocaleString("en-IN")}</span>
                            <span className="text-muted-text text-decoration-line-through small">INR {product?.price}</span>
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 ms-1">
                              {bestOffer.offer.title}
                            </span>
                          </div>
                        );
                      }
                      return <small className="text-muted-text d-block mb-1">INR {product?.price}</small>;
                    })()}
                    <small className="text-muted-text">Category: {product?.category || "-"}</small>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
                  <input
                    type="number"
                    value={item.quantity}
                    min="1"
                    className="form-control border"
                    style={{ width: "90px", minWidth: "90px" }}
                    onChange={(e) => handleQuantityChange(product?._id, e.target.value)}
                  />

                  <button className="btn btn-buy-action btn-sm" onClick={() => handleBuyNow(item)}>
                    Buy Now
                  </button>

                  <button className="btn btn-danger btn-sm" onClick={() => removeItem(product?._id)}>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}

          <div className="mt-4 p-4 border border-theme rounded-4 shadow-sm bg-surface-1">
            <h5 className="font-black mb-3">Order Summary</h5>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted-text">Subtotal</span>
              <span className="font-bold">INR {cartOfferDetails.subtotal.toLocaleString("en-IN")}</span>
            </div>
            
            {cartOfferDetails.discount > 0 && (
              <div className="d-flex justify-content-between mb-3 text-success">
                <span>
                  <FaTags className="me-2" />
                  Offer Discount
                  {cartOfferDetails.primaryOffer && ` (${cartOfferDetails.primaryOffer.title})`}
                </span>
                <span className="font-bold">- INR {cartOfferDetails.discount.toLocaleString("en-IN")}</span>
              </div>
            )}
            
            <hr className="my-3 opacity-25" />
            
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="mb-0 text-primary-text font-black">Total: INR {cartOfferDetails.finalAmount.toLocaleString("en-IN")}</h4>
              {cartOfferDetails.discount > 0 && (
                <small className="text-success fw-bold d-block mt-1">Total Savings: INR {cartOfferDetails.discount.toLocaleString("en-IN")}</small>
              )}
            </div>
            
            <div className="d-grid">
              <button className="btn btn-buy-action py-3 rounded-pill fw-bold" onClick={handleBuyTotalOrder}>
                Proceed to Checkout
              </button>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default Cart;
