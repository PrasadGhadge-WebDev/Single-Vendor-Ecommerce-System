import React, { useContext, useState, useEffect, useRef, useMemo } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import {
  FiShoppingCart,
  FiUser,
  FiSearch,
  FiLogOut,
  FiMenu,
  FiX,
  FiLogIn,
  FiUserPlus,
  FiShoppingBag,
  FiChevronDown,
  FiSun,
  FiMoon,
  FiZap,
  FiHeart,
} from "react-icons/fi";
import { useBusinessSettings } from "../context/BusinessSettingsContext";
import { useTheme } from "../context/ThemeContext";
import API, { getImageUrl } from "../api";
import { buildSearchSuggestions, loadRecentlyViewedProducts } from "../utils/productInsights";
import "./Navbar.css";

const toCurrency = (value) => `INR ${Number(value || 0).toLocaleString("en-IN")}`;

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const { wishlist } = useWishlist();
  const { settings } = useBusinessSettings();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRecent, setShowRecent] = useState(false);
  const [productsForSearch, setProductsForSearch] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem("recent_searches");
    return saved ? JSON.parse(saved) : [];
  });

  const searchWrapRef = useRef(null);

  useEffect(() => {
    setRecentlyViewed(loadRecentlyViewedProducts());
    const handleUpdate = () => setRecentlyViewed(loadRecentlyViewedProducts());
    window.addEventListener("recently-viewed-updated", handleUpdate);
    return () => window.removeEventListener("recently-viewed-updated", handleUpdate);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await API.get("/products");
        setProductsForSearch(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching products for search:", err);
      }
    };
    fetchProducts();
  }, []);

  const searchSuggestions = useMemo(() => 
    buildSearchSuggestions(productsForSearch, searchTerm, 6), 
    [productsForSearch, searchTerm]
  );
  
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

  const handleSuggestionSelect = (item) => {
    if (item.productId) {
      navigate(`/product/${item.productId}`);
    } else {
      handleSearch(null, item.query);
    }
    setShowRecent(false);
  };

  const removeHistoryItem = (e, term) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== term);
    setRecentSearches(updated);
    localStorage.setItem("recent_searches", JSON.stringify(updated));
  };

  const clearAllHistory = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem("recent_searches");
    localStorage.removeItem("recentlyViewedProducts");
    setRecentlyViewed([]);
  };

  const removeRecentlyViewed = (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = recentlyViewed.filter(p => p._id !== productId);
    setRecentlyViewed(updated);
    localStorage.setItem("recentlyViewedProducts", JSON.stringify(updated));
  };

  return (
    <nav className={`navbar-custom sticky-top ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-upper">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="navbar-logo-container">
            <Link to="/" className="logo-text-brand">
              <div className="logo-icon-box">
                <FiZap className="logo-icon-main" />
              </div>
              <div className="logo-text-box">
                <span className="logo-part-1">Electro<span className="logo-part-2">Hub</span></span>
              </div>
            </Link>
          </div>

          <div className="navbar-search-wrapper hidden md:block" ref={searchWrapRef}>
            <form onSubmit={handleSearch} className="search-form-pill position-relative">
              <FiSearch className="text-primary ml-3 mr-1" size={18} />
              <input
                type="text"
                placeholder="Explore Universe..."
                className="search-input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowRecent(true)}
                onBlur={() => setTimeout(() => setShowRecent(false), 300)}
              />
              <button type="submit" className="search-btn-circle">Go</button>

              {showRecent && (
                <div className="search-suggestions-new shadow-2xl border-theme animate-fade-in">
                  {searchTerm === "" && (recentSearches.length > 0 || recentlyViewed.length > 0) ? (
                    <>
                      {recentSearches.length > 0 && (
                        <>
                          <div className="px-4 py-2 bg-surface-2 text-[10px] font-black uppercase tracking-widest text-muted-text d-flex align-items-center justify-content-between">
                            <span>Recent Explorations</span>
                            <button type="button" className="text-danger font-black hover:underline border-none bg-transparent" onMouseDown={clearAllHistory}>Clear All</button>
                          </div>
                          {recentSearches.map((s, i) => (
                            <div key={i} className="suggestion-item px-4 py-2 hover:bg-surface-3 cursor-pointer d-flex align-items-center justify-content-between group" onMouseDown={() => handleSearch(null, s)}>
                              <div className="d-flex align-items-center gap-3">
                                <div className="suggestion-icon-wrap-small"><FiSearch size={10} /></div>
                                <span className="text-sm font-medium">{s}</span>
                              </div>
                              <button type="button" className="text-muted-text opacity-0 group-hover:opacity-100 hover:text-danger border-none bg-transparent transition-all" onMouseDown={(e) => removeHistoryItem(e, s)}>
                                <FiX size={12} />
                              </button>
                            </div>
                          ))}
                        </>
                      )}
                      {recentlyViewed.length > 0 && (
                        <>
                          <div className="px-4 py-2 bg-surface-2 text-[10px] font-black uppercase tracking-widest text-muted-text">Recently Viewed Products</div>
                          {recentlyViewed.slice(0, 4).map((item, idx) => (
                            <div key={idx} className="suggestion-row-nav d-flex align-items-center gap-3 px-4 py-3 transition-all hover:bg-surface-3 cursor-pointer group" onMouseDown={() => navigate(`/product/${item._id}`)}>
                              <img src={getImageUrl(item.image)} alt="" className="suggestion-thumb-nav rounded-md" />
                              <div className="suggestion-info">
                                <div className="suggestion-name-nav font-bold text-sm text-primary-text">{item.name}</div>
                                <div className="suggestion-meta-nav text-[9px] uppercase font-black opacity-50">{item.category}</div>
                              </div>
                              <div className="ms-auto d-flex align-items-center gap-3">
                                <div className="font-black text-primary text-xs">{toCurrency(item.price)}</div>
                                <button type="button" className="text-muted-text opacity-0 group-hover:opacity-100 hover:text-danger border-none bg-transparent transition-all" onMouseDown={(e) => removeRecentlyViewed(e, item._id)}>
                                  <FiX size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  ) : searchTerm !== "" && searchSuggestions.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-surface-2 text-[10px] font-black uppercase tracking-widest text-muted-text">Instant Matches</div>
                      {searchSuggestions.map((item, idx) => (
                        <div key={idx} className="suggestion-row-nav d-flex align-items-center gap-3 px-4 py-3 transition-all hover:bg-surface-3 cursor-pointer" onMouseDown={() => handleSuggestionSelect(item)}>
                          {item.image ? <img src={getImageUrl(item.image)} alt="" className="suggestion-thumb-nav rounded-md" /> : <div className="suggestion-icon-wrap-nav"><FiSearch size={12} /></div>}
                          <div className="suggestion-info">
                            <div className="suggestion-name-nav font-bold text-sm text-primary-text">{item.name || item.query}</div>
                            {item.category && <div className="suggestion-meta-nav text-[9px] uppercase font-black opacity-50">{item.category}</div>}
                          </div>
                          {item.price && <div className="ms-auto font-black text-primary text-xs">{toCurrency(item.price)}</div>}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </form>
          </div>

          <div className="navbar-actions">
            {/* Utility Group */}
            <div className="nav-action-group utility-group">
              <button onClick={toggleTheme} className="nav-icon-btn theme-toggle" title="Toggle Theme">
                {theme === "light" ? <FiMoon size={20} /> : <FiSun size={20} />}
              </button>
              <Link to="/wishlist" className="nav-icon-btn wishlist-btn" title="Wishlist">
                <FiHeart size={20} />
                {wishlist.length > 0 && <span className="action-badge">{wishlist.length}</span>}
              </Link>
            </div>

            <div className="nav-separator"></div>

            {/* Cart Section */}
            <Link to="/cart" className="premium-cart-btn">
              <div className="cart-icon-wrap">
                <FiShoppingCart size={20} />
                {totalCartItems > 0 && <span className="cart-count-badge">{totalCartItems}</span>}
              </div>
              <span className="cart-label hidden lg:block">My Cart</span>
            </Link>

            <div className="nav-separator"></div>

            {/* User Group - Last */}
            <div className="nav-action-group user-group relative">
              {user ? (
                <div className="relative group">
                  <button 
                    className="user-profile-btn border-none" 
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  >
                    <div className="user-avatar-small">
                      <FiUser size={14} />
                    </div>
                    <span className="user-name-text">{user.isAdmin ? "Admin" : user.name.split(' ')[0]}</span>
                    <FiChevronDown size={12} className={`ml-1 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isUserDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-surface-1 shadow-2xl rounded-xl py-2 z-50 border border-theme animate-in fade-in slide-in-from-top-2 duration-200">
                      <Link to={user.isAdmin ? "/admin/dashboard" : "/profile"} className="dropdown-item-new" onClick={() => setIsUserDropdownOpen(false)}>
                        <FiUser size={16} /> <span>My Profile</span>
                      </Link>
                      <Link to="/orders" className="dropdown-item-new" onClick={() => setIsUserDropdownOpen(false)}>
                        <FiShoppingBag size={16} /> <span>My Orders</span>
                      </Link>
                      <div className="h-px bg-theme my-2 opacity-50"></div>
                      <button onClick={handleLogout} className="dropdown-item-new text-danger w-full text-left bg-transparent border-none">
                        <FiLogOut size={16} /> <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn-pill-login">Login</Link>
                  <Link to="/register" className="btn-pill-register">Register</Link>
                </div>
              )}
            </div>

            <button className="md:hidden mobile-menu-trigger" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>
      </div>

      <div className="navbar-nav-row hidden md:block">
        <div className="container mx-auto">
          <ul className="nav-links-list">
            <li><NavLink to="/" className="nav-link-item">Home</NavLink></li>
            <li className="relative group">
              <NavLink to="/shop" className="nav-link-item">Products <FiChevronDown size={12} className="ml-1" /></NavLink>
              <div className="absolute top-full left-0 bg-surface-1 shadow-xl rounded-lg py-2 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-theme">
                <Link to="/shop?category=cleaning" className="block px-4 py-2 text-sm text-primary-text hover:bg-surface-2 no-underline">Cleaning Supplies</Link>
                <Link to="/shop?category=disposable" className="block px-4 py-2 text-sm text-primary-text hover:bg-surface-2 no-underline">Disposables</Link>
                <Link to="/shop?category=equipment" className="block px-4 py-2 text-sm text-primary-text hover:bg-surface-2 no-underline">Equipment</Link>
              </div>
            </li>
            <li><NavLink to="/services" className="nav-link-item">Services</NavLink></li>
            <li><NavLink to="/about" className="nav-link-item">About Us</NavLink></li>

            <li><NavLink to="/offers" className="nav-link-item">Offers</NavLink></li>
            <li><NavLink to="/contact" className="nav-link-item">Contact</NavLink></li>
          </ul>
        </div>
      </div>

      <div className={`md:hidden fixed inset-0 z-[1200] transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}>
        <div className="absolute inset-0 bg-black/60" onClick={() => setIsMobileMenuOpen(false)} />
        <div className={`absolute top-0 left-0 bottom-0 w-72 bg-surface-1 shadow-2xl transition-transform duration-300 transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="p-6 border-b border-theme flex justify-between items-center">
            <span className="text-xl font-bold text-primary-text">Menu</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-muted-text text-xl bg-transparent border-none"><FiX /></button>
          </div>
          <div className="p-4 flex flex-col gap-2">
             <NavLink to="/" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-lg text-primary-text font-medium hover:bg-surface-2 no-underline">Home</NavLink>
             <NavLink to="/shop" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-lg text-primary-text font-medium hover:bg-surface-2 no-underline">Products</NavLink>
             <NavLink to="/services" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-lg text-primary-text font-medium hover:bg-surface-2 no-underline">Services</NavLink>
             <NavLink to="/about" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-lg text-primary-text font-medium hover:bg-surface-2 no-underline">About Us</NavLink>
             <NavLink to="/offers" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-lg text-primary-text font-medium hover:bg-surface-2 no-underline">Offers</NavLink>
             <NavLink to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-lg text-primary-text font-medium hover:bg-surface-2 no-underline">Contact</NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
