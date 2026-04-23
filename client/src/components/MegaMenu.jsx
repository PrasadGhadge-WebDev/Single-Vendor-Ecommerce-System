import React from "react";
import { Link } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";

const MegaMenu = ({ title, groups, rootCategory }) => {
  return (
    <li className="relative group list-none">
      <Link 
        to={`/shop?category=${rootCategory || title.toLowerCase()}`} 
        className="flex items-center gap-1.5 py-4 px-4 text-sm font-bold text-gray-800 hover:text-primary transition-colors whitespace-nowrap"
      >
        {title} <FaChevronDown size={10} className="group-hover:rotate-180 transition-transform duration-300" />
      </Link>

      {/* Mega Menu Content */}
      <div className="absolute top-full left-0 w-[600px] bg-white shadow-2xl rounded-b-xl border-t-2 border-primary opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
        <div className="p-8 grid grid-cols-3 gap-8">
          {groups.map((group, idx) => (
            <div key={idx}>
              <h6 className="text-[11px] uppercase tracking-widest font-black text-primary mb-4 border-b border-gray-100 pb-2">
                {group.label}
              </h6>
              <ul className="space-y-2">
                {group.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link 
                      to={link.url || `/shop?search=${encodeURIComponent(link.text)}`} 
                      className="text-sm text-gray-500 hover:text-primary hover:translate-x-1 inline-block transition-all duration-200"
                    >
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </li>
  );
};

export default MegaMenu;