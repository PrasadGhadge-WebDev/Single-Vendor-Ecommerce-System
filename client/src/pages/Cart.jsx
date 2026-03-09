import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { getImageUrl } from "../api";
import { toast } from "react-toastify";

const FALLBACK_IMAGE =
  "https://via.placeholder.com/120x120/f1f5f9/64748b?text=No+Image";

const Cart = () => {
  const { cart, updateQuantity, removeItem, buyTotalOrder } = useContext(CartContext);
  const navigate = useNavigate();
  const [buyingAll, setBuyingAll] = useState(false);

  const total = cart.reduce((sum, item) => sum + (item.productId?.price || 0) * item.quantity, 0);

  const handleQuantityChange = (productId, value) => {
    const qty = Math.max(1, Number(value) || 1);
    updateQuantity(productId, qty);
  };

  const handleBuyNow = (item) => {
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
    if (cart.length === 0) {
      toast.warning("Cart is empty");
      return;
    }

    setBuyingAll(true);
    try {
      await buyTotalOrder();
      toast.success("Total order placed successfully");
      navigate("/orders");
    } catch (error) {
      toast.error("Order failed: " + (error.response?.data?.message || error.message));
    } finally {
      setBuyingAll(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: "980px" }}>
      <h3 className="mb-4">Shopping Cart</h3>

      {cart.length === 0 ? (
        <p className="text-muted">Your cart is empty.</p>
      ) : (
        <>
          {cart.map((item) => {
            const product = item.productId;
            const imageSrc = product?.image ? getImageUrl(product.image) : FALLBACK_IMAGE;

            return (
              <div
                key={`${product?._id || "item"}-${item.quantity}`}
                className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-3"
              >
                <div className="d-flex align-items-center" style={{ gap: "14px" }}>
                  <Link to={`/product/${product?._id}`}>
                    <img
                      src={imageSrc}
                      alt={product?.name || "Product"}
                      width="78"
                      height="78"
                      style={{
                        objectFit: "cover",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        background: "#f8fafc",
                      }}
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </Link>

                  <div>
                    <Link to={`/product/${product?._id}`} className="text-decoration-none">
                      <h6 className="mb-1">{product?.name}</h6>
                    </Link>
                    <small className="text-muted d-block">INR {product?.price}</small>
                    <small className="text-muted">Category: {product?.category || "-"}</small>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
                  <input
                    type="number"
                    value={item.quantity}
                    min="1"
                    className="form-control"
                    style={{ width: "90px" }}
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

          <div className="d-flex justify-content-between align-items-center mt-4">
            <h4 className="mb-0">Total: INR {total}</h4>
            <button className="btn btn-success" onClick={handleBuyTotalOrder} disabled={buyingAll}>
              {buyingAll ? "Processing..." : "Buy Total Order"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
