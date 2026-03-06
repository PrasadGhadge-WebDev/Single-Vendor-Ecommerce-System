import React, { useContext, useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { FaShoppingCart, FaUserCircle, FaBars, FaSearch, FaMoon, FaSun } from "react-icons/fa";
import API from "../api";
import "./Navbar.css";

const getInitialTheme = () => {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [theme, setTheme] = useState(getInitialTheme);

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
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (!query) {
      navigate("/shop");
      return;
    }
    navigate(`/shop?search=${encodeURIComponent(query)}`);
    setMenuOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `nav-link fw-semibold px-2 ${isActive ? "active nav-active" : ""}`;

  return (
    <nav className="navbar navbar-expand-lg ecommerce-navbar shadow-sm sticky-top py-2">
      <div className="container">
        <Link className="navbar-brand fw-bold fs-4 brand-text" to="/">
          MyShop
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <FaBars />
        </button>

        <div className={`collapse navbar-collapse ${menuOpen ? "show" : ""}`}>
          <ul className="navbar-nav me-auto ms-4 align-items-lg-center gap-lg-2">
            <li className="nav-item">
              <NavLink className={navLinkClass} to="/">
                Home
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className={navLinkClass} to="/shop">
                Products
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className={navLinkClass} to="/about">
                About
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className={navLinkClass} to="/services">
                Services
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className={navLinkClass} to="/contact">
                Contact
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className={navLinkClass} to="/offers">
                Offers
              </NavLink>
            </li>

            {categories.length > 0 && (
              <li className="nav-item dropdown">
                <button
                  className="nav-link dropdown-toggle btn btn-link text-decoration-none fw-semibold"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  Categories
                </button>

                <ul className="dropdown-menu shadow border-0 rounded-3">
                  {categories.map((cat) => {
                    const key = typeof cat === "object" ? cat._id || cat.name : cat;
                    const name = typeof cat === "object" ? cat.name : cat;

                    return (
                      <li key={key}>
                        <Link className="dropdown-item py-2" to={`/shop/category/${encodeURIComponent(name)}`}>
                          {name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            )}

            {user?.isAdmin && (
              <li className="nav-item">
                <Link className="btn btn-warning btn-sm fw-bold ms-lg-2" to="/admin/dashboard">
                  Admin Panel
                </Link>
              </li>
            )}
          </ul>

          <form className="d-flex navbar-search me-lg-3 my-2 my-lg-0" onSubmit={handleSearch}>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn btn-sm search-btn ms-2" aria-label="Search products">
              <FaSearch />
            </button>
          </form>

          <ul className="navbar-nav ms-auto align-items-center gap-lg-3">
            <li className="nav-item">
              <button type="button" className="btn btn-sm theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === "light" ? <FaMoon /> : <FaSun />}
              </button>
            </li>

            <li className="nav-item">
              <Link className="nav-link position-relative" to="/cart">
                <FaShoppingCart size={20} />
                {totalCartItems > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge bg-danger rounded-pill">
                    {totalCartItems}
                  </span>
                )}
              </Link>
            </li>

            {user ? (
              <li className="nav-item dropdown">
                <button
                  className="nav-link dropdown-toggle btn btn-link d-flex align-items-center text-decoration-none"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  <FaUserCircle size={22} className="me-2" />
                  {user.name}
                </button>

                <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3">
                  <li>
                    <Link className="dropdown-item py-2" to="/orders">
                      My Orders
                    </Link>
                  </li>

                  <li>
                    <hr className="dropdown-divider" />
                  </li>

                  <li>
                    <button className="dropdown-item text-danger fw-semibold" onClick={handleLogout}>
                      Logout
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link fw-semibold" to="/login">
                    Login
                  </Link>
                </li>

                <li className="nav-item">
                  <Link className="btn btn-outline-light btn-sm register-btn" to="/register">
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
