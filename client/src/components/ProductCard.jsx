import React from "react";
import { useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { getImageUrl } from "../api";

const FALLBACK_IMAGE =
  "https://via.placeholder.com/320x220/f1f5f9/64748b?text=No+Image";

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);

  return (
    <div className="col-md-3 mb-4">
      <div className="card shadow-sm h-100">
        <Link to={`/product/${product._id}`}>
          <img
            src={product.image ? getImageUrl(product.image) : FALLBACK_IMAGE}
            className="card-img-top"
            alt={product.name}
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
        </Link>

        <div className="card-body text-center">
          <Link to={`/product/${product._id}`} className="text-decoration-none">
            <h6 className="fw-bold mb-2">{product.name}</h6>
          </Link>

          <p className="text-success fw-bold">INR {product.price}</p>

          <button className="btn btn-sm btn-cart-action" onClick={() => addToCart(product._id)}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
