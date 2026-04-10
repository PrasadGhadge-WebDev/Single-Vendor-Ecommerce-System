import React, { useContext } from "react";
import { Link } from "react-router-dom";
import {
  FaWhatsapp,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaUser,
  FaUserPlus,
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import "./Topbar.css";

const Topbar = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="site-topbar">
      <div className="container-fluid px-3 px-xl-4 d-flex align-items-center justify-content-between">
        <div className="topbar-left d-flex align-items-center gap-3 flex-wrap">
          <a href="tel:+919766875355" className="topbar-item topbar-call" title="Call us">
            <FaPhoneAlt className="topbar-icon" />
            <span className="topbar-text">Call: +91 9766875355</span>
          </a>

          <span className="topbar-divider d-none d-md-inline" />

          <a href="https://wa.me/919766875355" target="_blank" rel="noopener noreferrer" className="topbar-item topbar-whatsapp d-none d-md-flex" title="WhatsApp us">
            <FaWhatsapp className="topbar-icon" />
            <span className="topbar-text">WhatsApp Us</span>
          </a>
        </div>

        <div className="topbar-right d-flex align-items-center gap-3">
          <Link
            to="/about"
            className="topbar-item topbar-location d-none d-lg-inline-flex"
            title="About the store"
          >
            <FaMapMarkerAlt className="topbar-icon" />
            <span className="topbar-text">About the store</span>
          </Link>

          {!user && (
            <div className="topbar-auth-links">
              <Link to="/login" className="topbar-auth-link topbar-auth-link-ghost">
                <FaUser className="topbar-icon" />
                <span>Login</span>
              </Link>
              <Link to="/register" className="topbar-auth-link topbar-auth-link-solid">
                <FaUserPlus className="topbar-icon" />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;
