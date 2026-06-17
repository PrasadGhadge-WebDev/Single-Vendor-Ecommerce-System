import React, { useContext, useState, useEffect, useRef } from "react";
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
  FiShoppingBag,
  FiChevronDown,
  FiSun,
  FiMoon,
  FiZap,
  FiHeart,
  FiBox,
  FiList,
  FiUsers,
  FiTruck,
  FiCreditCard,
  FiTag,
  FiArrowRight
} from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";
import API, { getImageUrl } from "../api";
import "./Navbar.css";

const toCurrency = (value) => `INR ${Number(value || 0).toLocaleString("en-IN")}`;

const getCategoryIcon = (category) => {
  switch (category) {
    case "Products": return <FiBox />;
    case "Orders": return <FiList />;
    case "Users": return <FiUsers />;
    case "Suppliers": return <FiTruck />;
    case "Payments": return <FiCreditCard />;
    case "Offers": return <FiTag />;
    default: return <FiSearch />;
  }
};

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const { wishlist } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  
  // Global Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const searchWrapRef = useRef(null);
  const searchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Global Search Debounce & Fetch
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const { data } = await API.get(`/search?q=${encodeURIComponent(searchTerm)}`);
        setSearchResults(data);
        setActiveIndex(-1);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const flattenResults = () => {
    if (!searchResults) return [];
    let flattened = [];
    Object.keys(searchResults).forEach(category => {
      if (searchResults[category] && searchResults[category].length > 0) {
        searchResults[category].forEach(item => {
          flattened.push({ ...item, category });
        });
      }
    });
    return flattened;
  };

  const handleKeyDown = (e) => {
    const flatItems = flattenResults();
    if (!flatItems.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < flatItems.length) {
        handleSuggestionSelect(flatItems[activeIndex]);
      } else {
        // Fallback to product search page if they press enter without selecting
        setShowSuggestions(false);
        setIsMobileSearchOpen(false);
        navigate(`/shop?search=${encodeURIComponent(searchTerm)}`);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setIsMobileSearchOpen(false);
    }
  };

  const handleSuggestionSelect = (item) => {
    setShowSuggestions(false);
    setIsMobileSearchOpen(false);
    setSearchTerm("");
    navigate(item.url);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderSearchResults = () => {
    if (isSearching) {
      return <div className="p-4 text-center text-sm font-medium text-slate-500">Searching across modules...</div>;
    }

    if (searchTerm.trim().length > 0 && searchTerm.trim().length < 2) {
      return <div className="p-4 text-center text-sm font-medium text-slate-500">Type at least 2 characters to search</div>;
    }

    if (searchResults) {
      const hasResults = Object.values(searchResults).some(arr => arr && arr.length > 0);
      
      if (!hasResults) {
        return (
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <FiSearch size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">No matching results found.</h4>
            <p className="text-xs text-slate-500">Check spelling or try different keywords.</p>
          </div>
        );
      }

      let globalIndex = 0;

      return (
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
          {Object.keys(searchResults).map((category) => {
            const items = searchResults[category];
            if (!items || items.length === 0) return null;

            return (
              <div key={category} className="mb-4 last:mb-0">
                <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 bg-slate-50 rounded-lg mb-2">
                  {getCategoryIcon(category)} {category}
                </div>
                <div className="space-y-1">
                  {items.map((item) => {
                    const currentIndex = globalIndex++;
                    const isActive = currentIndex === activeIndex;

                    return (
                      <div 
                        key={item.id} 
                        className={`px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${isActive ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'}`}
                        onMouseEnter={() => setActiveIndex(currentIndex)}
                        onClick={() => handleSuggestionSelect(item)}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          {item.image ? (
                            <img src={getImageUrl(item.image)} alt="" className="w-10 h-10 object-cover rounded-lg shrink-0 border border-slate-100" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                              {getCategoryIcon(category)}
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <div className="text-sm font-bold text-slate-800 truncate">{item.name}</div>
                            {item.subtitle && <div className="text-xs text-slate-500 truncate mt-0.5">{item.subtitle}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          {item.price && <div className="text-xs font-black text-indigo-600">{toCurrency(item.price)}</div>}
                          {item.status && <div className="text-[10px] font-bold px-2 py-1 bg-slate-100 rounded-md text-slate-600">{item.status}</div>}
                          <FiArrowRight className={`text-slate-300 transition-transform ${isActive ? 'translate-x-1 text-indigo-500' : ''}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <nav className={`navbar-custom sticky-top ${scrolled ? "scrolled" : ""}`}>
        <div className="navbar-upper">
          <div className="container mx-auto px-4 flex items-center justify-between relative">
            
            {/* Logo */}
            <div className="navbar-logo-container shrink-0">
              <Link to="/" className="logo-text-brand">
                <div className="logo-icon-box">
                  <FiZap className="logo-icon-main" />
                </div>
                <div className="logo-text-box hidden sm:block">
                  <span className="logo-part-1">Electro<span className="logo-part-2">Hub</span></span>
                </div>
              </Link>
            </div>

            {/* Desktop / Tablet Global Search */}
            <div className="global-search-container hidden md:block" ref={searchWrapRef}>
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FiSearch size={16} />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products, orders, customers..."
                  className="global-search-input"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handleKeyDown}
                />
                
                {/* Search Dropdown */}
                {showSuggestions && searchTerm.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    {renderSearchResults()}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="navbar-actions shrink-0">
              {/* Mobile Search Toggle */}
              <button 
                className="md:hidden nav-icon-btn mr-2" 
                onClick={() => {
                  setIsMobileSearchOpen(true);
                  setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
                }}
              >
                <FiSearch size={20} />
              </button>

              {user && (
                <>
                  {/* Utility Group */}
                  <div className="nav-action-group utility-group hidden sm:flex">
                    <Link to="/wishlist" className="nav-icon-btn wishlist-btn" title="Wishlist">
                      <FiHeart size={20} />
                      {wishlist.length > 0 && <span className="action-badge">{wishlist.length}</span>}
                    </Link>
                  </div>

                  <div className="nav-separator hidden sm:block"></div>

                  {/* Cart Section */}
                  <Link to="/cart" className="premium-cart-btn">
                    <div className="cart-icon-wrap">
                      <FiShoppingCart size={20} />
                      {totalCartItems > 0 && <span className="cart-count-badge">{totalCartItems}</span>}
                    </div>
                    <span className="cart-label hidden lg:block">My Cart</span>
                  </Link>

                  <div className="nav-separator"></div>
                </>
              )}

              {/* User Group */}
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
                      <span className="user-name-text hidden sm:block">{user.isAdmin ? "Admin" : user.name.split(' ')[0]}</span>
                      <FiChevronDown size={12} className={`ml-1 transition-transform hidden sm:block ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isUserDropdownOpen && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-surface-1 shadow-2xl rounded-xl py-2 z-[110] border border-theme animate-in fade-in slide-in-from-top-2 duration-200">
                        <Link to={user.isAdmin ? "/admin/dashboard" : "/profile"} className="dropdown-item-new" onClick={() => setIsUserDropdownOpen(false)}>
                          <FiUser size={16} /> <span>{user.isAdmin ? "Dashboard" : "My Profile"}</span>
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
                    <Link to="/login" className="btn-pill-login hidden sm:flex">Login</Link>
                    <Link to="/register" className="btn-pill-register">Register</Link>
                  </div>
                )}
              </div>

              <button className="md:hidden mobile-menu-trigger ml-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <FiX /> : <FiMenu />}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Links Row */}
        <div className="navbar-nav-row hidden md:block border-t border-slate-100/10">
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
              <li><NavLink to="/offers" className="nav-link-item">Offers</NavLink></li>
              <li><NavLink to="/services" className="nav-link-item">Services</NavLink></li>
              <li><NavLink to="/about" className="nav-link-item">About Us</NavLink></li>
              <li><NavLink to="/contact" className="nav-link-item">Contact</NavLink></li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-[2000] bg-white flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3 shadow-sm shrink-0">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                ref={mobileSearchInputRef}
                type="text"
                placeholder="Search everywhere..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <button 
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 shrink-0"
              onClick={() => {
                setIsMobileSearchOpen(false);
                setSearchTerm("");
              }}
            >
              <FiX size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden bg-white">
            {renderSearchResults()}
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
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
             <NavLink to="/offers" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-lg text-primary-text font-medium hover:bg-surface-2 no-underline">Offers</NavLink>
             <NavLink to="/services" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-lg text-primary-text font-medium hover:bg-surface-2 no-underline">Services</NavLink>
             <NavLink to="/about" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-lg text-primary-text font-medium hover:bg-surface-2 no-underline">About Us</NavLink>
             <NavLink to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-lg text-primary-text font-medium hover:bg-surface-2 no-underline">Contact</NavLink>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
