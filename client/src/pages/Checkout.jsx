import React, { useContext, useState } from "react";
import API from "../api";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
  const { cart, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleOrder = async () => {
    if (!user) {
      alert("Please login to checkout");
      navigate("/login");
      return;
    }

    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    setLoading(true);
    try {
      await API.post(
        "/orders",
        {
          products: cart.map((item) => ({
            product: item._id,
            quantity: item.quantity
          })),
          totalAmount
        }
      );

      alert("Order Placed Successfully");
      clearCart();
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
      <h2>Checkout</h2>

      <div className="card p-4">
        <h5>Order Summary</h5>
        {cart.map((item) => (
          <div key={item._id} className="d-flex justify-content-between mb-2">
            <span>
              {item.name} x {item.quantity}
            </span>
            <span>₹ {item.price * item.quantity}</span>
          </div>
        ))}

        <hr />
        <h5 className="d-flex justify-content-between">
          <span>Total:</span>
          <span>₹ {totalAmount}</span>
        </h5>

        <button 
          className="btn btn-success w-100 mt-3" 
          onClick={handleOrder}
          disabled={loading}
        >
          {loading ? "Processing..." : "Place Order"}
        </button>
      </div>
    </div>
  );
};

export default Checkout;