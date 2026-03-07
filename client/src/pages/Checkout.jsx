import React, { useContext, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";

const Checkout = () => {
  const { cart, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [offerCode, setOfferCode] = useState("");
  const [offers, setOffers] = useState([]);
  const [appliedOffer, setAppliedOffer] = useState(null);

  const buyNowItem = location.state?.buyNowItem;

  const checkoutItems = useMemo(() => {
    if (buyNowItem?.product?._id) {
      return [
        {
          productId: buyNowItem.product,
          quantity: Number(buyNowItem.quantity) || 1,
        },
      ];
    }
    return cart;
  }, [buyNowItem, cart]);

  const totalAmount = checkoutItems.reduce(
    (sum, item) => sum + (item.productId?.price || 0) * item.quantity,
    0
  );

  React.useEffect(() => {
    const fetchOffers = async () => {
      try {
        const { data } = await API.get("/offers/public");
        const allOffers = Array.isArray(data) ? data : [];
        setOffers(allOffers.filter((offer) => offer?.isCurrentlyValid !== false));
      } catch (error) {
        setOffers([]);
      }
    };
    fetchOffers();
  }, []);

  const discountAmount = useMemo(() => {
    if (!appliedOffer) return 0;
    if (totalAmount < (appliedOffer.minOrderAmount || 0)) return 0;
    if (appliedOffer.discountType === "PERCENT") {
      let amount = (totalAmount * appliedOffer.discountValue) / 100;
      if (appliedOffer.maxDiscountAmount > 0) {
        amount = Math.min(amount, appliedOffer.maxDiscountAmount);
      }
      return Math.min(amount, totalAmount);
    }
    return Math.min(appliedOffer.discountValue || 0, totalAmount);
  }, [appliedOffer, totalAmount]);

  const finalPayable = totalAmount - discountAmount;

  const applyOffer = () => {
    const code = offerCode.trim().toUpperCase();
    if (!code) {
      setAppliedOffer(null);
      return;
    }
    const found = offers.find((offer) => offer.code === code);
    if (!found) {
      alert("Invalid offer code");
      setAppliedOffer(null);
      return;
    }
    if (totalAmount < (found.minOrderAmount || 0)) {
      alert(`Minimum order amount for this offer is INR ${found.minOrderAmount}`);
      setAppliedOffer(null);
      return;
    }
    setAppliedOffer(found);
  };

  const handleOrder = async () => {
    if (!user) {
      alert("Please login to checkout");
      navigate("/login");
      return;
    }

    if (checkoutItems.length === 0) {
      alert("No items to checkout");
      return;
    }

    setLoading(true);
    try {
      await API.post("/orders", {
        products: checkoutItems.map((item) => ({
          product: item.productId?._id,
          quantity: item.quantity,
        })),
        offerCode: appliedOffer?.code || "",
      });

      alert("Order Placed Successfully");

      if (!buyNowItem) {
        await clearCart();
      }

      navigate("/");
    } catch (error) {
      console.error(error);
      alert("Order failed: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "500px" }}>
      <h2>{buyNowItem ? "Buy Now Checkout" : "Checkout"}</h2>

      <div className="card p-4">
        <h5>Order Summary</h5>
        {checkoutItems.map((item) => (
          <div key={item.productId?._id} className="d-flex justify-content-between mb-2">
            <span>
              {item.productId?.name} x {item.quantity}
            </span>
            <span>INR {(item.productId?.price || 0) * item.quantity}</span>
          </div>
        ))}

        <hr />
        <div className="mb-3">
          <label className="form-label">Offer Code</label>
          <div className="d-flex gap-2">
            <input
              type="text"
              className="form-control"
              value={offerCode}
              onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
            />
            <button type="button" className="btn btn-outline-primary" onClick={applyOffer}>
              Apply
            </button>
          </div>
          {appliedOffer && (
            <small className="text-success d-block mt-2">
              Offer applied: {appliedOffer.code} (Discount INR {discountAmount.toFixed(2)})
            </small>
          )}
        </div>

        <div className="d-flex justify-content-between">
          <span>Subtotal:</span>
          <span>INR {totalAmount.toFixed(2)}</span>
        </div>
        <div className="d-flex justify-content-between">
          <span>Discount:</span>
          <span>- INR {discountAmount.toFixed(2)}</span>
        </div>
        <h5 className="d-flex justify-content-between">
          <span>Final Total:</span>
          <span>INR {finalPayable.toFixed(2)}</span>
        </h5>

        <button className="btn btn-success w-100 mt-3" onClick={handleOrder} disabled={loading}>
          {loading ? "Processing..." : "Place Order"}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
