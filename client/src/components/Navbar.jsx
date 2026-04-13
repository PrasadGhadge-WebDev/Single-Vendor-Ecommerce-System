import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import {
  FaShoppingCart,
  FaUserCircle,
  FaBars,
  FaSearch,
  FaFilter,
  FaClock,
  FaChevronDown,
  FaHistory,
  FaSignOutAlt,
  FaHome,
  FaStore,
  FaInfoCircle,
  FaConciergeBell,
  FaPhoneAlt,
  FaLayerGroup,
  FaUserShield,
  FaUser,
  FaUserPlus,
  FaFireAlt,
} from "react-icons/fa";
import API, { getImageUrl } from "../api";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [cartPreviewOpen, setCartPreviewOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileAvatar, setProfileAvatar] = useState(user?.profileImage || "");
  const searchWrapRef = useRef(null);
  const cartRef = useRef(null);

  const RECENT_SEARCHES_KEY = "myshop_recent_searches";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await API.get("/categories");
        setCategories(data.categories || data);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get("search") || "");
  }, [location.search]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
      setRecentSearches(Array.isArray(saved) ? saved.slice(0, 5) : []);
    } catch {
      setRecentSearches([]);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(event.target)) {
        setSuggestionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const query = searchTerm.trim();
    if (!searchFocused || query.length < 2) {
      setSuggestions([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        const { data } = await API.get(`/products?search=${encodeURIComponent(query)}&limit=6`);
        const products = Array.isArray(data) ? data : [];
        setSuggestions(products.slice(0, 5));
        setSuggestionsOpen(true);
      } catch (err) {
        console.error("Failed to load search suggestions", err);
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchFocused, searchTerm]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setProfileName(user?.name || "");
    setProfileAvatar(user?.profileImage || "");
  }, [user?.name, user?.profileImage]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleProfileUpdate = (event) => {
      const detail = event?.detail;
      if (!detail) return;
      if (typeof detail.name === "string") {
        setProfileName(detail.name);
      }
      if (detail.profileImage !== undefined) {
        setProfileAvatar(detail.profileImage || "");
      }
    };

    window.addEventListener("user-profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("user-profile-updated", handleProfileUpdate);
  }, []);

  const saveRecentSearch = (query) => {
    const normalized = query.trim();
    if (!normalized) return;

    setRecentSearches((prev) => {
      const next = [normalized, ...prev.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 5);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (!query) {
      navigate("/shop");
      return;
    }
    saveRecentSearch(query);
    navigate(`/shop?search=${encodeURIComponent(query)}`);
    setMenuOpen(false);
    setSuggestionsOpen(false);
  };

  const handleSuggestionClick = (value) => {
    saveRecentSearch(value);
    setSearchTerm(value);
    navigate(`/shop?search=${encodeURIComponent(value)}`);
    setMenuOpen(false);
    setSuggestionsOpen(false);
    setSearchFocused(false);
  };

  const handleRecentClick = (value) => {
    handleSuggestionClick(value);
  };

  const navLinkClass = ({ isActive }) =>
    `nav-link fw-semibold px-2 ${isActive ? "active nav-active" : ""}`;

  const navIconClass = "nav-link-icon me-2";
  const cartBadgeLabel = `${totalCartItems} item${totalCartItems === 1 ? "" : "s"} in cart`;

  return (
    <nav className={`navbar navbar-expand-xl ecommerce-navbar shadow-sm sticky-top py-0 ${scrolled ? "navbar-scrolled" : ""}`}>
      <div className="container-fluid px-3 px-xl-4">
        <Link className="navbar-brand d-flex align-items-center" to="/" aria-label="Home">
          <img
            src="/logo-removebg-preview.png"
            alt="Store logo"
            className="navbar-brand-logo"
            loading="eager"
            decoding="async"
          />
        </Link>

        <button
          className={`navbar-toggler border-0 hamburger-btn ms-auto ${menuOpen ? "is-open" : ""}`}
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen ? "true" : "false"}
        >
          <span className="hamburger-lines" aria-hidden="true">
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </span>
        </button>

        {/* Mobile quick actions: keep Cart + Login visible even when menu is collapsed */}
        <div className="navbar-mobile-actions d-xl-none d-flex align-items-center gap-2 ms-2">
          {!user && (
            <Link
              to="/login"
              className="nav-link d-inline-flex align-items-center justify-content-center mobile-action-btn"
              aria-label="Login"
              onClick={() => setMenuOpen(false)}
            >
              <FaUserCircle />
            </Link>
          )}

          <Link
            className="nav-link position-relative cart-icon-wrapper d-inline-flex align-items-center justify-content-center mobile-action-btn"
            to="/cart"
            aria-label={cartBadgeLabel}
            onClick={() => setMenuOpen(false)}
          >
            <FaShoppingCart />
            <span className="cart-badge" aria-hidden="true">
              {totalCartItems}
            </span>
          </Link>
        </div>

        <div className={`collapse navbar-collapse ${menuOpen ? "show" : ""}`}>
          <ul className="navbar-nav me-auto ms-4 ms-xl-5 align-items-lg-center gap-lg-3 navbar-nav-primary">
            <li className="nav-item">
              <NavLink className={navLinkClass} to="/">
                <FaHome className={navIconClass} />
                Home
              </NavLink>
            </li>

            {/* Shop dropdown: Product + Category */}
            <li className="nav-item dropdown">
              <button
                className="nav-link dropdown-toggle btn btn-link text-decoration-none fw-semibold"
                type="button"
                data-bs-toggle="dropdown"
              >
                <FaStore className={navIconClass} />
                Shop
              </button>

              <ul className="dropdown-menu shadow border-0 rounded-3">
                <li>
                  <NavLink
                    className="dropdown-item py-2 d-flex align-items-center gap-2"
                    to="/shop"
                    onClick={() => setMenuOpen(false)}
                  >
                    <FaStore className="dropdown-item-icon" />
                    Product
                  </NavLink>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li className="dropdown-item py-2 text-muted fw-semibold">Category</li>
                {categories.length > 0 ? (
                  categories.map((cat) => {
                    const key = typeof cat === "object" ? cat._id || cat.name : cat;
                    const name = typeof cat === "object" ? cat.name : cat;

                    return (
                      <li key={key}>
                        <Link
                          className="dropdown-item py-2 d-flex align-items-center gap-2"
                          to={`/shop/category/${encodeURIComponent(name)}`}
                          onClick={() => setMenuOpen(false)}
                        >
                          <FaLayerGroup className="dropdown-item-icon" />
                          {name}
                        </Link>
                      </li>
                    );
                  })
                ) : (
                  <li className="dropdown-item py-2 text-muted">No categories</li>
                )}
              </ul>
            </li>

            <li className="nav-item">
              <NavLink
                className={({ isActive }) =>
                  `nav-link fw-semibold px-2 nav-offers-link ${isActive ? "active nav-active" : ""}`
                }
                to="/offers"
              >
                <FaFireAlt className={navIconClass} />
                Offers
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className={navLinkClass} to="/about">
                <FaInfoCircle className={navIconClass} />
                About
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className={navLinkClass} to="/contact">
                <FaPhoneAlt className={navIconClass} />
                Contact
              </NavLink>
            </li>

            {/* More dropdown: Services + Replacement Policy */}
            <li className="nav-item dropdown">
              <button
                className="nav-link dropdown-toggle btn btn-link text-decoration-none fw-semibold"
                type="button"
                data-bs-toggle="dropdown"
              >
                <FaBars className={navIconClass} />
                More
              </button>
              <ul className="dropdown-menu shadow border-0 rounded-3">
                <li>
                  <NavLink className="dropdown-item py-2 d-flex align-items-center gap-2" to="/services" onClick={() => setMenuOpen(false)}>
                    <FaConciergeBell className="dropdown-item-icon" />
                    Services
                  </NavLink>
                </li>
                <li>
                  <Link className="dropdown-item py-2 d-flex align-items-center gap-2" to="/replacement-policy" onClick={() => setMenuOpen(false)}>
                    <FaHistory className="dropdown-item-icon" />
                    Replacement Policy
                  </Link>
                </li>
              </ul>
            </li>

            {user?.isAdmin && (
              <li className="nav-item">
                <Link className="btn btn-warning btn-sm fw-bold ms-lg-2" to="/admin/dashboard">
                  <FaUserShield className="me-2" />
                  Admin Panel
                </Link>
              </li>
            )}
          </ul>

            <div className="navbar-search-shell me-xl-3 my-2 my-xl-0 w-100 w-xl-auto" ref={searchWrapRef}>
              <form className="d-flex navbar-search" onSubmit={handleSearch}>
              <button
                type="button"
                className="search-filter-btn"
                aria-label="Filter products"
                title="Filters (coming soon)"
                onMouseDown={(e) => e.preventDefault()}
              >
                <FaFilter aria-hidden="true" />
                <span className="search-filter-label">Filter</span>
                <FaChevronDown className="search-filter-caret" aria-hidden="true" />
              </button>

              <span className="navbar-search-divider" aria-hidden="true" />
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSuggestionsOpen(true);
                }}
                onFocus={() => {
                  setSearchFocused(true);
                  setSuggestionsOpen(true);
                }}
                onBlur={() => {
                  setSearchFocused(false);
                }}
              />
              <button type="submit" className="btn btn-sm search-btn" aria-label="Search products">
                <FaSearch />
              </button>
            </form>

            {suggestionsOpen && (searchTerm.trim().length >= 2 || recentSearches.length > 0) && (
              <div className="search-suggestions-panel shadow-lg">
                {searchTerm.trim().length >= 2 && suggestions.length > 0 && (
                  <div className="search-suggestions-group">
                    <div className="search-suggestions-header">Suggestions</div>
                    <ul className="list-unstyled mb-0">
                      {suggestions.map((item) => (
                        <li key={item._id}>
                          <button
                            type="button"
                            className="search-suggestion-item"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              navigate(`/product/${item._id}`);
                              setSuggestionsOpen(false);
                            }}
                          >
                            <img 
                              src={getImageUrl(item.image)} 
                              alt="" 
                              className="search-suggestion-thumb" 
                            />
                            <div className="flex-grow-1 min-w-0">
                              <div className="text-truncate fw-bold">{item.name}</div>
                              <small className="text-muted d-block">{item.category}</small>
                            </div>
                            <div className="text-success fw-bold small ms-2">₹{item.price}</div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {recentSearches.length > 0 && (
                  <div className="search-suggestions-group">
                    <div className="search-suggestions-header">Recent</div>
                    <ul className="list-unstyled mb-0">
                      {recentSearches.map((item) => (
                        <li key={item}>
                          <button
                            type="button"
                            className="search-suggestion-item"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleRecentClick(item)}
                          >
                            <FaClock className="me-2 search-suggestion-icon recent" />
                            <span className="text-truncate">{item}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <ul className="navbar-nav ms-auto align-items-center gap-lg-4 navbar-actions">
            {!user && (
              <li className="nav-item d-flex align-items-center gap-2 me-lg-2">
                <Link to="/login" className="nav-link nav-cta-link nav-cta-login">
                  <FaUser className="me-1" />
                  Login
                </Link>
                <Link to="/register" className="nav-link nav-cta-link nav-cta-register">
                  <FaUserPlus className="me-1" />
                  Register
                </Link>
              </li>
            )}
            <li 
              className="nav-item position-relative"
              onMouseEnter={() => setCartPreviewOpen(true)}
              onMouseLeave={() => setCartPreviewOpen(false)}
              ref={cartRef}
            >
              <Link className="nav-link position-relative cart-icon-wrapper d-inline-flex align-items-center gap-2" to="/cart" aria-label={cartBadgeLabel}>
                <FaShoppingCart size={20} />
                <span className="cart-link-text d-none d-lg-inline">Cart</span>
                <span className="cart-badge" aria-hidden="true">
                  {totalCartItems}
                </span>
              </Link>

              {cartPreviewOpen && cart.length > 0 && (
                <div className="cart-preview-dropdown shadow-lg animate-slide-up">
                  <div className="cart-preview-header">
                    <span className="fw-bold">Cart Preview</span>
                    <span className="text-muted small">{totalCartItems} items</span>
                  </div>
                  <div className="cart-preview-body">
                    {cart.slice(0, 3).map((item) => (
                      <div className="cart-preview-item" key={item._id}>
                        <img src={getImageUrl(item.image)} alt="" className="cart-preview-thumb" />
                        <div className="flex-grow-1 min-w-0">
                          <p className="mb-0 text-truncate fw-medium">{item.name}</p>
                          <small className="text-muted">{item.quantity} x ₹{item.price}</small>
                        </div>
                      </div>
                    ))}
                    {cart.length > 3 && (
                      <div className="text-center py-1">
                        <small className="text-muted">+{cart.length - 3} more items</small>
                      </div>
                    )}
                  </div>
                  <div className="cart-preview-footer">
                    <Link to="/cart" className="btn btn-primary btn-sm w-100 fw-bold">View Full Cart</Link>
                  </div>
                </div>
              )}
            </li>

            {user && (
              <li className="nav-item dropdown">
                <button
                  className="nav-link dropdown-toggle btn btn-link d-flex align-items-center text-decoration-none profile-dropdown-btn"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  {profileAvatar ? (
                    <img
                      src={profileAvatar}
                      alt={profileName || user?.name || "User profile"}
                      className="navbar-profile-avatar me-2 shadow-sm"
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <FaUserCircle size={20} className="me-2" />
                  )}
                  <span className="navbar-profile-copy">
                    <span className="navbar-profile-label">Profile</span>
                    <span className="navbar-profile-name fw-medium">{profileName || user?.name}</span>
                  </span>
                  <FaChevronDown className="ms-2 navbar-profile-caret" />
                </button>

                <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-4 py-3">
                  <li className="px-3 pb-2 mb-2 border-bottom">
                    <div className="d-flex align-items-center gap-3">
                      {profileAvatar ? (
                        <img
                          src={profileAvatar}
                          alt={profileName || user?.name || "User profile"}
                          className="navbar-profile-avatar navbar-profile-avatar-lg shadow-sm"
                          loading="eager"
                          decoding="async"
                        />
                      ) : (
                        <div className="navbar-profile-avatar navbar-profile-avatar-lg navbar-profile-fallback">
                          <FaUserCircle size={20} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="small text-muted mb-0">Signed in as</p>
                        <p className="fw-bold mb-0 text-truncate">{profileName || user?.name}</p>
                      </div>
                    </div>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2 px-3 rounded-2" to="/cart">
                      <FaShoppingCart className="me-2" /> Cart
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2 px-3 rounded-2" to="/orders">
                      <FaHistory className="me-2" /> My Orders
                    </Link>
                  </li>

                  <li>
                    <hr className="dropdown-divider mx-3" />
                  </li>

                  <li>
                    <button className="dropdown-item text-danger fw-semibold py-2 px-3 rounded-2" onClick={handleLogout}>
                      <FaSignOutAlt className="me-2" /> Logout
                    </button>
                  </li>
                </ul>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
