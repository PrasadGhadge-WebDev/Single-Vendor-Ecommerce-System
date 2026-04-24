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
  FaBars,
  FaTimes,
  FaSignInAlt,
  FaUserPlus,
  FaShoppingBasket,
  FaSun,
  FaMoon,
} from "react-icons/fa";
import { useBusinessSettings } from "../context/BusinessSettingsContext";
import { useTheme } from "../context/ThemeContext";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const { settings } = useBusinessSettings();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRecent, setShowRecent] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem("recent_searches");
    return saved ? JSON.parse(saved) : [];
  });

  const searchWrapRef = useRef(null);
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);

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

  return (
    <nav className={`navbar-custom sticky-top ${scrolled ? "scrolled" : ""}`}>
      {/* Upper Row: Logo, Search, Auth, Cart */}
      <div className="navbar-upper">
        <div className="container mx-auto px-4 flex items-center justify-between">
          
          {/* Logo */}
          <div className="navbar-logo-container">
            <Link to="/" className="logo-text-brand">
              <div className="flex flex-col">
                <span className="leading-tight">Electro</span>
                <span className="leading-tight">Hub</span>
              </div>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="navbar-search-wrapper hidden md:block" ref={searchWrapRef}>
            <form onSubmit={handleSearch} className="search-form-pill">
              <FaSearch className="text-muted-text ml-3 mr-1" size={14} />
              <input
                type="text"
                placeholder="Search for electronics, brands, and more..."
                className="search-input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowRecent(true)}
                onBlur={() => setTimeout(() => setShowRecent(false), 200)}
              />
              <button type="submit" className="search-btn-circle">
                Go
              </button>

              {/* Suggestions */}
              {showRecent && recentSearches.length > 0 && (
                <div className="search-suggestions-new">
                  <div className="px-4 py-2 bg-surface-2 text-[10px] font-bold text-muted-text uppercase tracking-wider">
                    Recent Searches
                  </div>
                  {recentSearches.map((s, i) => (
                    <div 
                      key={i} 
                      className="suggestion-item"
                      onClick={() => handleSearch(null, s)}
                    >
                      <FaSearch className="text-muted-text text-xs" /> {s}
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>

          {/* Right Actions */}
          <div className="navbar-actions">
            {user ? (
              <div className="flex items-center gap-4">
                 <Link to={user.isAdmin ? "/admin/dashboard" : "/profile"} className="btn-pill-login">
                   <FaUserCircle /> <span>{user.name.split(' ')[0]}</span>
                 </Link>
                 <button onClick={handleLogout} className="text-muted-text hover:text-red-500 transition-colors">
                   <FaSignOutAlt size={20} title="Logout" />
                 </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-pill-login">
                  <FaSignInAlt size={14} /> <span>Login</span>
                </Link>
                <Link to="/register" className="btn-pill-register">
                  <FaUserPlus size={14} /> <span>Register</span>
                </Link>
              </div>
            )}

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? <FaMoon size={18} /> : <FaSun size={18} />}
            </button>

            <Link to="/cart" className="cart-icon-circle">
              <FaShoppingBasket size={20} />
              {totalCartItems > 0 && (
                <span className="cart-badge-new">{totalCartItems}</span>
              )}
            </Link>

            {/* Mobile Toggle */}
            <button 
              className="md:hidden text-2xl text-primary-text ml-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </div>

      {/* Lower Row: Navigation Links (Dark Navy) */}
      <div className="navbar-nav-row hidden md:block">
        <div className="container mx-auto">
          <ul className="nav-links-list">
            <li>
              <NavLink to="/" className="nav-link-item">Home</NavLink>
            </li>
            <li className="relative group">
              <NavLink to="/shop" className="nav-link-item">
                Products
              </NavLink>
              {/* Simple dropdown example */}
              <div className="absolute top-full left-0 bg-surface-1 shadow-xl rounded-lg py-2 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-theme">
                <Link to="/shop?category=cleaning" className="block px-4 py-2 text-sm text-primary-text hover:bg-surface-2 no-underline">Cleaning Supplies</Link>
                <Link to="/shop?category=disposable" className="block px-4 py-2 text-sm text-primary-text hover:bg-surface-2 no-underline">Disposables</Link>
                <Link to="/shop?category=equipment" className="block px-4 py-2 text-sm text-primary-text hover:bg-surface-2 no-underline">Equipment</Link>
              </div>
            </li>
            <li>
              <NavLink to="/services" className="nav-link-item">Services</NavLink>
            </li>
            <li>
              <NavLink to="/about" className="nav-link-item">About Us</NavLink>
            </li>
            <li>
              <NavLink to="/faq" className="nav-link-item">FAQ</NavLink>
            </li>
            <li>
              <NavLink to="/contact" className="nav-link-item">Contact</NavLink>
            </li>
          </ul>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden fixed inset-0 z-[1200] transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}>
        <div className="absolute inset-0 bg-black/60" onClick={() => setIsMobileMenuOpen(false)} />
        <div className={`absolute top-0 left-0 bottom-0 w-72 bg-surface-1 shadow-2xl transition-transform duration-300 transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="p-6 border-b border-theme flex justify-between items-center">
            <span className="text-xl font-bold text-primary-text">Menu</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-muted-text text-xl"><FaTimes /></button>
          </div>
          <div className="p-4 flex flex-col gap-2">
             <NavLink to="/" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-lg text-primary-text font-medium hover:bg-surface-2 no-underline">Home</NavLink>
             <NavLink to="/shop" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-lg text-primary-text font-medium hover:bg-surface-2 no-underline">Products</NavLink>
             <NavLink to="/services" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-lg text-primary-text font-medium hover:bg-surface-2 no-underline">Services</NavLink>
             <NavLink to="/about" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-lg text-primary-text font-medium hover:bg-surface-2 no-underline">About Us</NavLink>
             <NavLink to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-lg text-primary-text font-medium hover:bg-surface-2 no-underline">Contact</NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

