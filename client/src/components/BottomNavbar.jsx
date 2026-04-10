import React from "react";
import { NavLink } from "react-router-dom";
import { FaHome, FaStore, FaShoppingCart, FaUser, FaHeart } from "react-icons/fa";
import "./BottomNavbar.css";

const BottomNavbar = () => {
  return (
    <div className="bottom-nav d-md-none">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <FaHome className="nav-icon" />
        <span>Home</span>
      </NavLink>
      <NavLink to="/shop" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <FaStore className="nav-icon" />
        <span>Shop</span>
      </NavLink>
      <NavLink to="/cart" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <FaShoppingCart className="nav-icon" />
        <span>Cart</span>
      </NavLink>
      <NavLink to="/orders" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <FaHeart className="nav-icon" />
        <span>Orders</span>
      </NavLink>
      <NavLink to="/login" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <FaUser className="nav-icon" />
        <span>Profile</span>
      </NavLink>
    </div>
  );
};

export default BottomNavbar;
