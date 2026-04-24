import React from "react";
import { Link } from "react-router-dom";
import { 
  FaFacebookF, 
  FaTwitter, 
  FaInstagram, 
  FaLinkedinIn, 
  FaEnvelope, 
  FaPhoneAlt, 
  FaMapMarkerAlt, 
  FaCcVisa,
  FaCcMastercard,
  FaCcPaypal,
  FaAward
} from "react-icons/fa";
import { useBusinessSettings } from "../context/BusinessSettingsContext";
import "./Footer.css";

const Footer = () => {
  const { settings } = useBusinessSettings();
  const storeTitle = settings?.storeName || settings?.businessName || "Online Store";
  const contactEmail = settings?.email || "";
  const contactPhone = settings?.phone || "";
  const contactAddress = settings?.address || "";

  return (
    <footer className="footer-premium">
      <div className="container">
        <div className="row g-5 footer-top">
          {/* Column 1: Brand */}
          <div className="col-lg-3 col-md-6">
            <h5 className="footer-brand">{storeTitle}</h5>
            <p className="footer-desc">
              Premium curated electronics for the modern professional. Elevate your workspace today.
            </p>
            <div className="footer-social">
              <a href="#" aria-label="Facebook"><FaFacebookF /></a>
              <a href="#" aria-label="Twitter"><FaTwitter /></a>
              <a href="#" aria-label="Instagram"><FaInstagram /></a>
              <a href="#" aria-label="LinkedIn"><FaLinkedinIn /></a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="col-lg-3 col-md-6">
            <h6 className="footer-heading">Quick Links</h6>
            <ul className="footer-links list-unstyled">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/shop">Shop All</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
            </ul>
          </div>

          {/* Column 3: Policies */}
          <div className="col-lg-3 col-md-6">
            <h6 className="footer-heading">Policies</h6>
            <ul className="footer-links list-unstyled">
              <li><Link to="/replacement-policy">Replacement Policy</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact & Payment */}
          <div className="col-lg-3 col-md-6">
            <h6 className="footer-heading">Contact Us</h6>
            <ul className="footer-contact list-unstyled">
              <li><FaEnvelope className="me-2" /> {contactEmail || "support@store.com"}</li>
              <li><FaPhoneAlt className="me-2" /> {contactPhone || "+1 (800) 123-4567"}</li>
              <li><FaMapMarkerAlt className="me-2" /> {contactAddress || "Global Delivery"}</li>
            </ul>
            <div className="footer-payments mt-4">
              <FaCcVisa className="payment-icon" />
              <FaCcMastercard className="payment-icon" />
              <FaCcPaypal className="payment-icon" />
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            © {new Date().getFullYear()} {storeTitle}. All rights reserved.
          </div>
          <div className="footer-badge">
            <FaAward className="me-2 text-warning" />
            1,20,000+ Happy Customers
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
