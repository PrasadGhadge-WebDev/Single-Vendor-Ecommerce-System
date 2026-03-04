import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";

const Home = () => {
  const [, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await API.get("/products?limit=8");
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };

    const fetchCategories = async () => {
      try {
        const { data } = await API.get("/categories");
        const cats = data.categories || data;
        setCategories(cats);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchProducts();
    fetchCategories();

    // refetch when products change elsewhere in app
    const handler = () => {
      fetchProducts();
    };
    window.addEventListener('products-updated', handler);
    return () => window.removeEventListener('products-updated', handler);
  }, []);

  return (
    <div>
      {/* Hero / Banner */}
      <div className="container-fluid p-0 position-relative">
        <img
          src="https://cdn.vectorstock.com/i/500p/57/56/shopping-cart-banner-online-store-vector-42935756.jpg"
          className="d-block w-100"
          alt="Shopping Banner"
          style={{ maxHeight: "450px", objectFit: "cover" }}
        />
        <div className="text-center text-white position-absolute top-50 start-50 translate-middle">
          <h1 className="display-4 fw-bold">Welcome to Our Store</h1>
          <p className="lead">Best products at unbeatable prices</p>
          <Link to="/shop" className="btn btn-lg btn-warning">
            🛍 Shop Now
          </Link>
        </div>
      </div>

      {/* Featured Categories */}
      <div className="container mt-5">
        <h2 className="mb-4 text-center">Featured Categories</h2>
        <div className="row g-4">
          {categories.length > 0 ? (
            categories.map((cat) => {
              const name = cat.name || cat; // handle fallback
              const key = cat._id || name;
              return (
                <div key={key} className="col-md-4">
                  <Link to={`/shop/category/${encodeURIComponent(name)}`} className="text-decoration-none text-dark">
                    <div className="card shadow-sm text-center p-3">
                      {/* placeholder icon */}
                      <div
                        className="mb-2 d-block mx-auto bg-secondary text-white rounded-circle"
                        style={{ width: "80px", height: "80px", lineHeight: "80px" }}
                      >
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <h5>{name}</h5>
                    </div>
                  </Link>
                </div>
              );
            })
          ) : (
            <p className="text-center">Loading categories...</p>
          )}
        </div>
      </div>

      {/* Our Services */}
      <div className="container mt-5">
        <h2 className="mb-4 text-center">Our Services</h2>
        <div className="row g-4">
          <div className="col-md-4">
            <div className="p-3 shadow-sm rounded text-center">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2jmaPJBxN-tMJyfi8T-zhuebCqG_RLGZkgQ&s"
                alt="24/7 Support"
                className="mb-2 d-block mx-auto"
                style={{ width: "80px", height: "80px", objectFit: "cover" }}
              />
              <h5>24/7 Support</h5>
              <p>Our customer support team is here for you anytime.</p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="p-3 shadow-sm rounded text-center">
              <img
                src="https://png.pngtree.com/png-clipart/20230509/original/pngtree-fast-delivery-label-design-png-image_9153915.png"
                alt="Fast Delivery"
                className="mb-2 d-block mx-auto"
                style={{ width: "80px", height: "80px", objectFit: "cover" }}
              />
              <h5>Fast Delivery</h5>
              <p>Get your orders delivered quickly and safely.</p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="p-3 shadow-sm rounded text-center">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqfmmJ9Ucii35cZtXCA-n5yID1zEB-KrLEwA&s"
                alt="Best Quality"
                className="mb-2 d-block mx-auto"
                style={{ width: "80px", height: "80px", objectFit: "cover" }}
              />
              <h5>Best Quality</h5>
              <p>We only provide products of top-notch quality.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;