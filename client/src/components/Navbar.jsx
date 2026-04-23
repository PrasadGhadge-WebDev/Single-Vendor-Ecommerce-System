import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import {
  FaShoppingCart,
  FaUserCircle,
  FaSearch,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaHeart,
  FaMicrophone,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import API, { getImageUrl } from "../api";
import { useBusinessSettings } from "../context/BusinessSettingsContext";
import MegaMenu from "./MegaMenu";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const { wishlist } = useWishlist();
  const { settings } = useBusinessSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRecent, setShowRecent] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem("recent_searches");
    return saved ? JSON.parse(saved) : ["Laptop", "Headphones", "Mobile"];
  });

  const searchWrapRef = useRef(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "light" ? "dark" : "light");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get("search") || "");
  }, [location.search]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e, q) => {
    if (e) e.preventDefault();
    const query = (q || searchTerm).trim();
    if (!query) {
      navigate("/shop");
      return;
    }
    const updatedRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updatedRecent);
    localStorage.setItem("recent_searches", JSON.stringify(updatedRecent));
    setShowRecent(false);
    navigate(`/shop?search=${encodeURIComponent(query)}`);
  };

  const menuData = {
    laptops: [
      { label: "Laptop Brands", links: [{ text: "Apple" }, { text: "Dell" }, { text: "HP" }, { text: "Lenovo" }, { text: "ASUS" }] },
      { label: "Gaming Laptops", links: [{ text: "High Performance" }, { text: "RTX Series" }, { text: "AMD Ryzen" }] },
      { label: "Business Laptops", links: [{ text: "Thin & Light" }, { text: "Workstation" }, { text: "Budget-Friendly" }] }
    ],
    audio: [
      { label: "Headphones", links: [{ text: "Over-Ear" }, { text: "On-Ear" }, { text: "Wireless" }, { text: "Noise Cancelling" }] },
      { label: "Speakers", links: [{ text: "Bluetooth Speakers" }, { text: "Home Theater" }, { text: "Soundbars" }] },
      { label: "Earphones", links: [{ text: "TWS Earbuds" }, { text: "Wired Earphones" }, { text: "Neckbands" }] }
    ],
    mobiles: [
      { label: "Smartphones", links: [{ text: "iPhone" }, { text: "Samsung" }, { text: "OnePlus" }, { text: "Xiaomi" }] },
      { label: "Accessories", links: [{ text: "Chargers" }, { text: "Power Banks" }, { text: "Cables" }] },
      { label: "Protection", links: [{ text: "Cases & Covers" }, { text: "Screen Protectors" }] }
    ]
  };

  return (
    <nav className={`sticky top-0 w-full z-[1001] transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md shadow-lg py-1" : "bg-white py-3 border-b border-gray-100"}`}>
      {/* Upper Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4 h-16">
          
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-2xl text-gray-700 hover:text-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
            <Link to="/" className="flex items-center gap-2 no-underline group">
              <span className="text-3xl filter drop-shadow-sm transition-transform group-hover:scale-110">🛍️</span>
              <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent italic">
                ShopVendor
              </span>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block flex-grow max-w-2xl mx-8 relative" ref={searchWrapRef}>
            <form onSubmit={handleSearch} className="flex w-full group">
              <div className="relative flex-grow flex items-center bg-gray-100 border-2 border-transparent focus-within:border-primary focus-within:bg-white rounded-l-xl px-4 transition-all overflow-hidden">
                <FaSearch className="text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="Search gadgets, brands..."
                  className="w-full py-2.5 bg-transparent border-none outline-none text-sm font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setShowRecent(true)}
                  onBlur={() => setTimeout(() => setShowRecent(false), 200)}
                />
                <FaMicrophone className="text-primary hover:scale-110 cursor-pointer ml-2" />
              </div>
              <button 
                type="submit" 
                className="bg-primary hover:bg-primary-dark text-white font-bold px-8 rounded-r-xl transition-colors text-sm"
              >
                SEARCH
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showRecent && recentSearches.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white mt-1 rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Recent Searches</span>
                </div>
                {recentSearches.map((s, i) => (
                  <div 
                    key={i} 
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 text-sm text-gray-700 transition-colors"
                  	onClick={() => handleSearch(null, s)}
                  >
                    <FaSearch className="text-gray-300 text-xs" /> {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-6">
            <Link to="/shop" className="group flex flex-col items-center gap-0.5 text-gray-600 hover:text-primary transition-colors">
              <div className="relative">
                <FaHeart className="text-2xl" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center ring-2 ring-white">
                    {wishlist.length}
                  </span>
                )}
              </div>
              <span className="hidden xl:block text-[10px] font-bold uppercase tracking-wider">Wishlist</span>
            </Link>

            <Link to="/cart" className="group flex flex-col items-center gap-0.5 text-gray-600 hover:text-red-500 transition-colors">
              <div className="relative">
                <FaShoppingCart className="text-2xl" />
                {totalCartItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-danger text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center ring-2 ring-white">
                    {totalCartItems}
                  </span>
                )}
              </div>
              <span className="hidden xl:block text-[10px] font-bold uppercase tracking-wider">Cart</span>
            </Link>

            {/* Profile Dropdown */}
            <div className="relative group/user">
              <button className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-primary transition-colors focus:outline-none">
                <FaUserCircle className="text-2xl" />
                <span className="hidden xl:block text-[10px] font-bold uppercase tracking-wider">
                  {user ? user.name.split(' ')[0] : "Login"}
                </span>
              </button>
              
              <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all transform translate-y-2 group-hover/user:translate-y-0 z-[1100]">
                <div className="w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                  {user ? (
                    <div className="py-2">
                      <div className="px-4 py-3 bg-gray-50">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">Welcome back,</p>
                        <p className="text-sm font-bold text-gray-800">{user.name}</p>
                      </div>
                      <div className="p-2 space-y-1">
                        <Link to={user.isAdmin ? "/admin/dashboard" : "/profile"} className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg no-underline transition-colors">My Profile</Link>
                        <Link to="/orders" className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg no-underline transition-colors">My Orders</Link>
                        <Link to="/cart" className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg no-underline transition-colors">Shopping Cart</Link>
                        <div className="h-px bg-gray-100 my-2" />
                        <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-500 font-bold hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2">
                          <FaSignOutAlt /> Logout
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      <Link to="/login" className="block w-full bg-primary hover:bg-primary-dark text-white text-center py-2.5 rounded-xl font-bold text-sm no-underline shadow-lg shadow-blue-200 transition-all">Login</Link>
                      <Link to="/register" className="block w-full text-center text-gray-500 hover:text-gray-800 py-1 text-xs no-underline font-bold transition-colors">Create Account</Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button onClick={toggleTheme} className="hidden md:flex flex-col items-center gap-0.5 text-gray-600 hover:text-primary transition-all transform active:scale-90">
              {theme === "light" ? <FaMoon className="text-xl" /> : <FaSun className="text-xl text-amber-500" />}
              <span className="hidden xl:block text-[10px] font-bold uppercase tracking-wider">Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Navigation - Desktop Only */}
      <div className="hidden md:block bg-gray-50/50 border-t border-gray-100">
        <div className="container mx-auto">
          <ul className="flex items-center justify-center m-0 p-0">
            <li>
              <NavLink to="/shop" className="block py-4 px-6 text-sm font-bold text-gray-800 hover:text-primary no-underline transition-colors">
                All Products
              </NavLink>
            </li>
            <MegaMenu title="Laptops" groups={menuData.laptops} rootCategory="laptop" />
            <MegaMenu title="Audio" groups={menuData.audio} rootCategory="headphones" />
            <MegaMenu title="Mobiles" groups={menuData.mobiles} rootCategory="mobile" />
            <li>
              <NavLink to="/offers" className="relative block py-4 px-6 text-sm font-bold text-danger no-underline transition-colors hover:text-red-600 group">
                Offers
                <span className="absolute -top-1 -right-2 bg-danger text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-bounce">HOT</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </div>

      {/* Mobile Sidebar Navigation */}
      <div className={`md:hidden fixed inset-0 z-[1200] transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
        <div className={`absolute top-0 left-0 bottom-0 w-80 bg-white shadow-2xl transition-transform duration-300 ease-out transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <span className="text-2xl font-black bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">Menu</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-red-500 text-xl"><FaTimes /></button>
          </div>
          <div className="p-4 space-y-1">
             <NavLink to="/" onClick={() => setIsMobileMenuOpen(false)} className="block p-3 rounded-lg text-gray-700 font-bold hover:bg-gray-50 no-underline transition-colors">Home</NavLink>
             <NavLink to="/shop" onClick={() => setIsMobileMenuOpen(false)} className="block p-3 rounded-lg text-gray-700 font-bold hover:bg-gray-50 no-underline transition-colors">Shop All</NavLink>
             <NavLink to="/about" onClick={() => setIsMobileMenuOpen(false)} className="block p-3 rounded-lg text-gray-700 font-bold hover:bg-gray-50 no-underline transition-colors">About Us</NavLink>
             <NavLink to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="block p-3 rounded-lg text-gray-700 font-bold hover:bg-gray-50 no-underline transition-colors">Contact</NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
