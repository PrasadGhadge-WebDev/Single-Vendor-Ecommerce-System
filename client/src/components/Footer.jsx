import React from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-dark text-white pt-5 pb-3 mt-5">
      <div className="container">
        <div className="row">

          {/* About Section */}
          <div className="col-md-4 mb-4">
            <h5 className="mb-3">About Us</h5>
            <p>
              Welcome to our single-vendor store! We offer the best quality products at unbeatable prices. 
              Shop with confidence and enjoy excellent customer service.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-md-2 mb-4">
            <h5 className="mb-3">Quick Links</h5>
            <ul className="list-unstyled">
              <li>
                <Link to="/" className="text-white text-decoration-none">Home</Link>
              </li>
              <li>
                <Link to="/shop" className="text-white text-decoration-none">Shop</Link>
              </li>
              <li>
                <Link to="/cart" className="text-white text-decoration-none">Cart</Link>
              </li>
              <li>
                <Link to="/checkout" className="text-white text-decoration-none">Checkout</Link>
              </li>
            </ul>
          </div>

          {/* Support / Contact */}
          <div className="col-md-3 mb-4">
            <h5 className="mb-3">Contact</h5>
            <p>Email: support@singlestore.com</p>
            <p>Phone: +91 9876543210</p>
            <p>Address: Pune, Maharashtra, India</p>
          </div>

          {/* Social Links */}
          <div className="col-md-3 mb-4">
            <h5 className="mb-3">Follow Us</h5>
            <div className="d-flex gap-3">
              <a href="#" className="text-white fs-5"><FaFacebookF /></a>
              <a href="#" className="text-white fs-5"><FaTwitter /></a>
              <a href="#" className="text-white fs-5"><FaInstagram /></a>
              <a href="#" className="text-white fs-5"><FaLinkedinIn /></a>
            </div>
          </div>

        </div>

        <hr className="border-top border-secondary" />

        <div className="text-center pt-3">
          &copy; {new Date().getFullYear()} Single Vendor Store. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;