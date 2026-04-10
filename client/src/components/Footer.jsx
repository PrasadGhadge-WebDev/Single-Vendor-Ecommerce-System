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
  FaPaperPlane,
  FaHome,
  FaStore,
  FaInfoCircle,
  FaTags,
  FaFileAlt,
  FaShoppingBag,
} from "react-icons/fa";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-4 col-md-6">
              <h5 className="footer-title d-flex align-items-center gap-2">
                <FaShoppingBag className="footer-title-icon" />
                Online Store
              </h5>
              <p className="footer-text mb-4">
                A simple storefront for browsing products, managing orders, and keeping the shopping flow clear.
              </p>
              <div className="footer-social d-flex gap-3">
                <a href="#" aria-label="Facebook"><FaFacebookF /></a>
                <a href="#" aria-label="Twitter"><FaTwitter /></a>
                <a href="#" aria-label="Instagram"><FaInstagram /></a>
                <a href="#" aria-label="LinkedIn"><FaLinkedinIn /></a>
              </div>
            </div>

            <div className="col-lg-2 col-md-6 ms-auto">
              <h6 className="footer-subtitle">Explore</h6>
              <ul className="footer-links list-unstyled mb-0">
                <li>
                  <Link to="/" className="footer-link">
                    <FaHome className="footer-link-icon icon-home" /> Home
                  </Link>
                </li>
                <li>
                  <Link to="/shop" className="footer-link">
                    <FaStore className="footer-link-icon icon-store" /> Store
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="footer-link">
                    <FaInfoCircle className="footer-link-icon icon-about" /> Contact
                  </Link>
                </li>
                <li>
                  <Link to="/offers" className="footer-link">
                    <FaTags className="footer-link-icon icon-offers" /> Offers
                  </Link>
                </li>
                <li>
                  <Link to="/replacement-policy" className="footer-link">
                    <FaFileAlt className="footer-link-icon icon-policy" /> Policies
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-lg-3 col-md-6">
              <h6 className="footer-subtitle">Reach Us</h6>
              <ul className="footer-contact list-unstyled mb-0">
                <li><FaEnvelope className="footer-contact-icon icon-mail" /> Use the contact page for support</li>
                <li><FaPhoneAlt className="footer-contact-icon icon-phone" /> Phone details are set in store settings</li>
                <li><FaMapMarkerAlt className="footer-contact-icon icon-location" /> Location details are set in store settings</li>
              </ul>
            </div>

            <div className="col-lg-3 col-md-6">
              <h6 className="footer-subtitle">Newsletter</h6>
              <p className="footer-text small mb-3">Stay updated with our latest releases and exclusive events.</p>
              <div className="input-group newsletter-footer">
                <input type="email" className="form-control form-control-sm" placeholder="Your email" />
                <button className="btn btn-primary btn-sm" type="button">
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </div>

          <div className="footer-bottom d-flex flex-column flex-md-row justify-content-between align-items-center">
            <small>© {new Date().getFullYear()} Online Store. All rights reserved.</small>
            <div className="d-flex gap-3 mt-3 mt-md-0 opacity-75">
              <Link to="/privacy" className="text-reset text-decoration-none small">Privacy</Link>
              <Link to="/terms" className="text-reset text-decoration-none small">Terms</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
