import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import API, { uploadURL } from "../api";
import { CartContext } from "../context/CartContext";

const Shop = () => {
  const { addToCart } = useContext(CartContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch products from API
  const { categoryName } = useParams();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let url = "/products";
        if (categoryName) {
          url += `?category=${encodeURIComponent(categoryName)}`;
        }
        const { data } = await API.get(url);
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryName]);

  // Group products by category
  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {});

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
    return <p className="text-center mt-4">No products available at the moment.</p>;
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">
        {categoryName ? `Category: ${categoryName}` : "Shop"}
      </h2>
      {Object.keys(groupedProducts).map((category) => (
        <div key={category} className="mb-5">
          <h4 className="mb-3">{category}</h4>
          <div className="row">
            {groupedProducts[category].map((product) => (
              <div className="col-sm-6 col-md-4 col-lg-3 mb-4" key={product._id}>
                <div className="card h-100 shadow-sm">
                  {product.image && (
                    <img
                      src={`${uploadURL}/${product.image}`}
                      className="card-img-top"
                      height="200"
                      alt={product.name}
                    />
                  )}
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{product.name}</h5>
                    <p className="card-text mb-3">₹ {product.price}</p>
                    <button
                      className="btn btn-primary mt-auto"
                      onClick={() => addToCart(product)}
                    >
                      Add to Cart
                    </button>
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