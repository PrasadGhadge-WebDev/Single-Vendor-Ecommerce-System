import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API, { getImageUrl } from "../api";
import "./ProductDetails.css";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/products/${id}`);
        setProduct(data);
      } catch (err) {
        console.error("Product details error:", err);
        setError(err.response?.data?.message || "Product not found");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error || "Product not found"}</div>
        <Link to="/shop" className="btn btn-outline-primary">Back to Shop</Link>
      </div>
    );
  }

  const averageRating = Number(product.averageRating || 0);
  const roundedRating = Math.round(averageRating);
  const starRating = `${"★".repeat(roundedRating)}${"☆".repeat(5 - roundedRating)}`;

  return (
    <div className="container py-5 product-details-page">
      <button type="button" className="btn btn-sm btn-outline-secondary mb-4" onClick={() => navigate(-1)}>
        Back
      </button>

      <div className="row g-4 align-items-start">
        <div className="col-md-5">
          <div className="card border-0 shadow-sm">
            {product.image ? (
              <img
                src={getImageUrl(product.image)}
                alt={product.name}
                className="card-img-top"
                style={{ maxHeight: "460px", objectFit: "cover" }}
              />
            ) : (
              <div className="p-5 text-center text-muted">No image available</div>
            )}
          </div>
        </div>

        <div className="col-md-7">
          <h2 className="fw-bold mb-2">{product.name}</h2>
          <p className="text-muted mb-2">Category: {product.category || "-"}</p>
          <h4 className="text-success fw-bold mb-3">INR {product.price}</h4>

          <p className="mb-4" style={{ whiteSpace: "pre-line" }}>
            {product.description || "No description available."}
          </p>

          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={() => navigate("/shop")}>Continue Shopping</button>
            <button
              className="btn btn-warning"
              onClick={() =>
                navigate("/checkout", {
                  state: {
                    buyNowItem: {
                      product,
                      quantity: 1,
                    },
                  },
                })
              }
            >
              Buy Now
            </button>
          </div>

          <hr className="my-4" />

          <div className="row g-2">
            <div className="col-sm-6">
              <div className="p-3 border rounded product-stat-card">
                <small className="d-block product-stat-label">Stock</small>
                <strong className={product.stock > 0 ? "product-stock-in" : "product-stock-out"}>
                  {product.stock > 0 ? `${product.stock} available` : "Out of stock"}
                </strong>
              </div>
            </div>
            <div className="col-sm-6">
              <div className="p-3 border rounded product-stat-card">
                <small className="d-block product-stat-label">Rating</small>
                <strong className="d-block">
                  {averageRating.toFixed(1)} / 5 ({product.numReviews || 0} reviews)
                </strong>
                <span className="product-rating-stars" aria-label={`Rating ${averageRating.toFixed(1)} out of 5`}>
                  {starRating}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
