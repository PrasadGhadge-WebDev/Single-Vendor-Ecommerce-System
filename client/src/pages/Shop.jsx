import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import API, { getImageUrl } from "../api";
import { CartContext } from "../context/CartContext";
import "./Shop.css";

const FALLBACK_IMAGE =
  "https://via.placeholder.com/320x220/f1f5f9/64748b?text=No+Image";

const Shop = () => {
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { categoryName } = useParams();
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        if (categoryName) params.set("category", categoryName);
        if (search.trim()) params.set("search", search.trim());

        const url = params.toString() ? `/products?${params.toString()}` : "/products";
        const { data } = await API.get(url);
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryName, search]);

  const handleBuyNow = (product) => {
    navigate("/checkout", {
      state: {
        buyNowItem: {
          product,
          quantity: 1,
        },
      },
    });
  };

  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {});

  const heading = categoryName
    ? `Category: ${categoryName}`
    : search
      ? `Search Results for "${search}"`
      : "Shop";

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-danger text-center mt-4">{error}</p>;
  }

  if (products.length === 0) {
    return <p className="text-center mt-4">No products found.</p>;
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">{heading}</h2>
      {Object.keys(groupedProducts).map((category) => (
        <div key={category} className="mb-5">
          <h4 className="mb-3">{category}</h4>
          <div className="row">
            {groupedProducts[category].map((product) => (
              <div className="col-sm-6 col-md-4 col-lg-3 mb-4" key={product._id}>
                <div className="card h-100 shadow-sm shop-product-card">
                  <Link to={`/product/${product._id}`} className="shop-image-link">
                    <img
                      src={product.image ? getImageUrl(product.image) : FALLBACK_IMAGE}
                      className="card-img-top shop-product-image"
                      alt={product.name}
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </Link>
                  <div className="card-body d-flex flex-column">
                    <Link to={`/product/${product._id}`} className="text-decoration-none">
                      <h5 className="card-title">{product.name}</h5>
                    </Link>
                    <p className="card-text mb-3">INR {product.price}</p>

                    <div className="d-grid gap-2 mt-auto">
                      <button className="btn btn-primary" onClick={() => addToCart(product)}>
                        Add to Cart
                      </button>
                      <button className="btn btn-warning" onClick={() => handleBuyNow(product)}>
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Shop;
