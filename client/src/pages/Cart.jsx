import React, { useContext } from "react";
import { CartContext } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const { cart, removeFromCart } = useContext(CartContext);
  const navigate = useNavigate();

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="container mt-4">
      <h2>Your Cart</h2>

      {cart.map((item) => (
        <div key={item._id} className="border p-3 mb-2">
          <h5>{item.name}</h5>
          <p>₹ {item.price}</p>
          <p>Qty: {item.quantity}</p>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => removeFromCart(item._id)}
          >
            Remove
          </button>
        </div>
      ))}

      <h4>Total: ₹ {total}</h4>

      <button
        className="btn btn-success"
        onClick={() => navigate("/checkout")}
      >
        Checkout
      </button>
    </div>
  );
};

export default Cart;