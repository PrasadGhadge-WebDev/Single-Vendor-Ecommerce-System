import React from "react";
import { Link } from "react-router-dom";

const MegaMenu = () => {
  return (
    <li className="nav-item dropdown">
      <button
        className="nav-link dropdown-toggle btn btn-link text-white fw-semibold text-decoration-none"
        data-bs-toggle="dropdown"
      >
        Categories
      </button>

      <div className="dropdown-menu p-4 shadow border-0" style={{ width: "700px" }}>
        <div className="row">

          <div className="col-md-3">
            <h6 className="fw-bold">Electronics</h6>
            <Link className="dropdown-item" to="/shop/category/mobile">Mobiles</Link>
            <Link className="dropdown-item" to="/shop/category/laptop">Laptops</Link>
            <Link className="dropdown-item" to="/shop/category/headphones">Headphones</Link>
            <Link className="dropdown-item" to="/shop/category/camera">Camera</Link>
          </div>

          <div className="col-md-3">
            <h6 className="fw-bold">Fashion</h6>
            <Link className="dropdown-item" to="/shop/category/men">Men</Link>
            <Link className="dropdown-item" to="/shop/category/women">Women</Link>
            <Link className="dropdown-item" to="/shop/category/shoes">Shoes</Link>
            <Link className="dropdown-item" to="/shop/category/accessories">Accessories</Link>
          </div>

          <div className="col-md-3">
            <h6 className="fw-bold">Beauty</h6>
            <Link className="dropdown-item" to="/shop/category/skincare">Skincare</Link>
            <Link className="dropdown-item" to="/shop/category/makeup">Makeup</Link>
            <Link className="dropdown-item" to="/shop/category/haircare">Hair Care</Link>
          </div>

          <div className="col-md-3">
            <h6 className="fw-bold">Footwear</h6>
            <Link className="dropdown-item" to="/shop/category/sneakers">Sneakers</Link>
            <Link className="dropdown-item" to="/shop/category/sandals">Sandals</Link>
            <Link className="dropdown-item" to="/shop/category/boots">Boots</Link>
          </div>

        </div>
      </div>
    </li>
  );
};

export default MegaMenu;