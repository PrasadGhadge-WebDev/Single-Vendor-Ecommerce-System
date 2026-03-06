import React from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="site-footer mt-5">
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-lg-4 col-md-6">
            <h5 className="footer-title">MyShop</h5>
            <p className="footer-text mb-0">
              Trusted single-vendor ecommerce platform with quality products, secure checkout,
              and reliable support.
            </p>
          </div>

          <div className="col-lg-2 col-md-6">
            <h6 className="footer-subtitle">Quick Links</h6>
            <ul className="footer-links list-unstyled mb-0">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/shop">Shop</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/offers">Offers</Link></li>
              <li><Link to="/replacement-policy">Replacement Policy</Link></li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6">
            <h6 className="footer-subtitle">Customer Support</h6>
            <ul className="footer-contact list-unstyled mb-0">
              <li>Email: support@myshop.com</li>
              <li>Phone: +91 98765 43210</li>
              <li>Pune, Maharashtra, India</li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6">
            <h6 className="footer-subtitle">Follow Us</h6>
            <div className="footer-social d-flex gap-2">
              <a href="#" aria-label="Facebook"><FaFacebookF /></a>
              <a href="#" aria-label="Twitter"><FaTwitter /></a>
              <a href="#" aria-label="Instagram"><FaInstagram /></a>
              <a href="#" aria-label="LinkedIn"><FaLinkedinIn /></a>
            </div>
          </div>
        </div>

        <div className="footer-bottom d-flex flex-column flex-md-row justify-content-between align-items-center mt-4 pt-3">
          <small>Copyright {new Date().getFullYear()} MyShop. All rights reserved.</small>
          <small>Built for better shopping experience.</small>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
