import React from "react";
import { FaPhoneAlt, FaEnvelope, FaTruck, FaQuestionCircle, FaGift, FaGlobe } from "react-icons/fa";

const Topbar = () => {
  return (
    <div className="hidden md:block bg-dark text-white py-2">
      <div className="container mx-auto px-4 flex justify-between items-center text-xs font-medium">
        {/* Left Side: Contact Info */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 hover:text-secondary transition-colors cursor-default">
            <FaPhoneAlt className="text-[10px]" />
            <span>24/7 Support: +91 98658 57545</span>
          </div>
          <div className="flex items-center gap-2 hover:text-secondary transition-colors cursor-default">
            <FaEnvelope className="text-[10px]" />
            <span>support@shop.com</span>
          </div>
        </div>

        {/* Right Side: Navigation Links */}
        <div className="flex items-center gap-6">
          <a href="/track" className="flex items-center gap-1.5 hover:text-secondary transition-all transform hover:scale-105">
            <FaTruck /> Track Order
          </a>
          <a href="/help" className="flex items-center gap-1.5 hover:text-secondary transition-all transform hover:scale-105">
            <FaQuestionCircle /> Help
          </a>
          <a href="/offers" className="flex items-center gap-1.5 hover:text-secondary transition-all transform hover:scale-105">
            <FaGift /> Offers
          </a>
          <div className="flex items-center gap-1.5 cursor-pointer hover:text-secondary transition-all transform hover:scale-105 group">
            <FaGlobe />
            <span>Language (EN)</span>
            <div className="hidden group-hover:block absolute top-full right-0 bg-white text-dark shadow-xl rounded-md p-2 min-w-[100px] z-50">
               <div className="hover:bg-gray-100 p-1 px-2 rounded">English</div>
               <div className="hover:bg-gray-100 p-1 px-2 rounded">Hindi</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
