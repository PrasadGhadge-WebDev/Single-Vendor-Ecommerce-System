import React from 'react';
import './AuthBackground.css';
import { FaLaptop, FaTv, FaMobileAlt, FaShoppingBag, FaShoppingCart } from 'react-icons/fa';

const AuthBackground = () => {
  return (
    <div className="auth-background">
      {/* Animated Gradient Blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      {/* Floating Tech Icons */}
      <div className="floating-icons-container">
        <div className="floating-icon icon-1"><FaLaptop /></div>
        <div className="floating-icon icon-2"><FaTv /></div>
        <div className="floating-icon icon-3"><FaMobileAlt /></div>
        <div className="floating-icon icon-4"><FaShoppingBag /></div>
        <div className="floating-icon icon-5"><FaShoppingCart /></div>
        <div className="floating-icon icon-6"><FaLaptop /></div>
        <div className="floating-icon icon-7"><FaShoppingCart /></div>
      </div>

      {/* Glass Overlay Pattern */}
      <div className="glass-pattern-overlay"></div>
    </div>
  );
};

export default AuthBackground;
