import React, { useContext, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import "./Checkout.css";

const Checkout = () => {
  const { cart, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [offerCode, setOfferCode] = useState("");
  const [offers, setOffers] = useState([]);
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [buyNowQty, setBuyNowQty] = useState(() => Math.max(1, Number(location.state?.buyNowItem?.quantity) || 1));
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const buyNowItem = location.state?.buyNowItem;

  const checkoutItems = useMemo(() => {
    if (buyNowItem?.product?._id) {
      return [
        {
          productId: buyNowItem.product,
          quantity: buyNowQty,
        },
      ];
    }
    return cart;
  }, [buyNowItem, buyNowQty, cart]);

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
      } catch {
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
      toast.error("Invalid offer code");
      setAppliedOffer(null);
      return;
    }
    if (totalAmount < (found.minOrderAmount || 0)) {
      toast.warning(`Minimum order amount for this offer is INR ${found.minOrderAmount}`);
      setAppliedOffer(null);
      return;
    }
    setAppliedOffer(found);
  };

  const handleOrder = async () => {
    if (!user) {
      toast.warning("Please login to checkout");
      navigate("/login");
      return;
    }

    if (checkoutItems.length === 0) {
      toast.warning("No items to checkout");
      return;
    }

    const trimmedAddress = {
      fullName: address.fullName.trim(),
      phone: address.phone.trim(),
      addressLine1: address.addressLine1.trim(),
      addressLine2: address.addressLine2.trim(),
      city: address.city.trim(),
      state: address.state.trim(),
      pincode: address.pincode.trim(),
      country: address.country.trim(),
    };

    if (
      !trimmedAddress.fullName ||
      !trimmedAddress.phone ||
      !trimmedAddress.addressLine1 ||
      !trimmedAddress.city ||
      !trimmedAddress.state ||
      !trimmedAddress.pincode ||
      !trimmedAddress.country
    ) {
      toast.warning("Please fill your address details");
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
        shippingAddress: trimmedAddress,
      });

      toast.success("Order placed successfully");

      if (!buyNowItem) {
        await clearCart();
      }

      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error("Order failed: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const adjustBuyNowQty = (next) => {
    const safe = Math.max(1, Number(next) || 1);
    setBuyNowQty(safe);
  };

  return (
    <div className="checkout-page">
      <div className="container py-5">
        <div className="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-4">
          <div>
            <h2 className="checkout-title fw-bold mb-1">{buyNowItem ? "Buy Now Checkout" : "Checkout"}</h2>
            <div className="text-muted">Fill delivery details and confirm your order.</div>
          </div>
        </div>

        <div className="row g-4 align-items-start">
          <div className="col-lg-7">
            <form
              className="card checkout-card shadow-sm"
              onSubmit={(e) => {
                e.preventDefault();
                handleOrder();
              }}
            >
              <div className="card-header py-3 px-4">
                <h5 className="mb-0">Delivery Address</h5>
              </div>

              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      className="form-control"
                      value={address.fullName}
                      onChange={(e) => setAddress((prev) => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter full name"
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label">
                      Phone <span className="text-danger">*</span>
                    </label>
                    <input
                      className="form-control"
                      value={address.phone}
                      onChange={(e) => setAddress((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label">
                      Pincode <span className="text-danger">*</span>
                    </label>
                    <input
                      className="form-control"
                      value={address.pincode}
                      onChange={(e) => setAddress((prev) => ({ ...prev, pincode: e.target.value }))}
                      placeholder="Pincode"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">
                      Address Line 1 <span className="text-danger">*</span>
                    </label>
                    <input
                      className="form-control"
                      value={address.addressLine1}
                      onChange={(e) => setAddress((prev) => ({ ...prev, addressLine1: e.target.value }))}
                      placeholder="House no, street, area"
                      autoComplete="address-line1"
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Address Line 2 (Optional)</label>
                    <input
                      className="form-control"
                      value={address.addressLine2}
                      onChange={(e) => setAddress((prev) => ({ ...prev, addressLine2: e.target.value }))}
                      placeholder="Landmark, apartment, etc."
                      autoComplete="address-line2"
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label">
                      City <span className="text-danger">*</span>
                    </label>
                    <input
                      className="form-control"
                      value={address.city}
                      onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="City"
                      autoComplete="address-level2"
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label">
                      State <span className="text-danger">*</span>
                    </label>
                    <input
                      className="form-control"
                      value={address.state}
                      onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))}
                      placeholder="State"
                      autoComplete="address-level1"
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label">
                      Country <span className="text-danger">*</span>
                    </label>
                    <input
                      className="form-control"
                      value={address.country}
                      onChange={(e) => setAddress((prev) => ({ ...prev, country: e.target.value }))}
                      placeholder="Country"
                      autoComplete="country-name"
                      required
                    />
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2 mt-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)} disabled={loading}>
                    Back
                  </button>
                  <button type="submit" className="btn btn-success ms-auto" disabled={loading}>
                    {loading ? "Processing..." : "Place Order"}
                  </button>
                </div>

                <div className="text-muted small mt-3">
                  <span className="text-danger">*</span> Required fields
                </div>
              </div>
            </form>
          </div>

          <div className="col-lg-5">
            <div className="card checkout-card shadow-sm checkout-sticky">
              <div className="card-header py-3 px-4 d-flex align-items-center justify-content-between">
                <h5 className="mb-0">Order Summary</h5>
                <span className="badge text-bg-light">{checkoutItems.length} item{checkoutItems.length === 1 ? "" : "s"}</span>
              </div>

              <div className="card-body p-4">
                {buyNowItem?.product?._id && (
                  <div className="mb-3">
                    <label className="form-label mb-1">Quantity</label>
                    <div className="d-flex align-items-center gap-2" style={{ maxWidth: "220px" }}>
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => adjustBuyNowQty(buyNowQty - 1)}>
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        className="form-control form-control-sm"
                        value={buyNowQty}
                        onChange={(e) => adjustBuyNowQty(e.target.value)}
                      />
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => adjustBuyNowQty(buyNowQty + 1)}>
                        +
                      </button>
                    </div>
                  </div>
                )}

                <div className="d-grid gap-2 mb-3">
                  {checkoutItems.map((item) => (
                    <div key={item.productId?._id} className="d-flex justify-content-between align-items-start gap-3">
                      <div className="text-truncate" title={item.productId?.name || ""}>
                        <div className="fw-semibold text-truncate">{item.productId?.name}</div>
                        <div className="text-muted small">Qty {item.quantity}</div>
                      </div>
                      <div className="fw-semibold">INR {((item.productId?.price || 0) * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <hr className="my-3" />

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
                  <span className="text-muted">Subtotal</span>
                  <span className="fw-semibold">INR {totalAmount.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Discount</span>
                  <span className="fw-semibold">- INR {discountAmount.toFixed(2)}</span>
                </div>

                <hr className="my-3" />

                <div className="d-flex justify-content-between align-items-baseline">
                  <span className="fw-bold">Final Total</span>
                  <span className="fw-bold fs-5">INR {finalPayable.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
