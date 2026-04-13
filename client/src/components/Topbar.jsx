import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaWhatsapp,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaUser,
  FaUserPlus,
  FaMoon,
  FaSun,
} from "react-icons/fa";
import "./Topbar.css";

const getInitialTheme = () => {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return "light";
};

const Topbar = () => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div className="site-topbar">
      <div className="container-fluid px-3 px-xl-4 d-flex align-items-center justify-content-between">
        <div className="topbar-left d-flex align-items-center gap-3 flex-wrap">
          <a href="tel:+919766875355" className="topbar-item topbar-call" title="Call us">
            <FaPhoneAlt className="topbar-icon" />
            <span className="topbar-text">Call Us</span>
          </a>

          <span className="topbar-divider d-none d-md-inline" />

          <a href="https://wa.me/919766875355" target="_blank" rel="noopener noreferrer" className="topbar-item topbar-whatsapp d-none d-md-flex" title="WhatsApp us">
            <FaWhatsapp className="topbar-icon" />
            <span className="topbar-text">WhatsApp Us</span>
          </a>
        </div>

        <div className="topbar-right d-flex align-items-center gap-3">
          <label className="theme-switch topbar-theme-switch d-none d-md-inline-flex" title="Toggle theme">
            <input
              type="checkbox"
              className="theme-switch-input"
              checked={theme === "dark"}
              onChange={toggleTheme}
              aria-label="Toggle dark mode"
            />
            <span className="theme-switch-track" aria-hidden="true">
              <span className="theme-switch-icon theme-switch-icon-moon">
                <FaMoon />
              </span>
              <span className="theme-switch-icon theme-switch-icon-sun">
                <FaSun />
              </span>
              <span className="theme-switch-thumb" />
            </span>
          </label>

          <Link
            to="/about"
            className="topbar-item topbar-location d-none d-lg-inline-flex"
            title="Store Location"
          >
            <FaMapMarkerAlt className="topbar-icon" />
            <span className="topbar-text">Store Location</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
