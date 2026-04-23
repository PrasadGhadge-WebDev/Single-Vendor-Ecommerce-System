import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaSearch, FaShoppingCart, FaUser } from "react-icons/fa";

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { name: "Home", path: "/", icon: <FaHome /> },
    { name: "Search", path: "/shop", icon: <FaSearch /> },
    { name: "Cart", path: "/cart", icon: <FaShoppingCart /> },
    { name: "Profile", path: "/login", icon: <FaUser /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[1000] px-4 py-2 shadow-lg">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive ? "text-primary" : "text-gray-500 hover:text-primary"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
