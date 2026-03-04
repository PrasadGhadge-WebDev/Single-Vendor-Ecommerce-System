import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { FaShoppingCart, FaUserCircle, FaBars } from "react-icons/fa";
import API from "../api"; // your axios instance

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);

  // Fetch categories dynamically from API
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

  return (
    <nav
      className="navbar navbar-expand-lg px-3"
      style={{ background: "linear-gradient(90deg, #141E30, #243B55)" }}
    >
      <Link className="navbar-brand fw-bold text-warning" to="/">
        🛍 MyShop
      </Link>

      {/* Hamburger */}
      <button
        className="navbar-toggler"
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <FaBars color="white" />
      </button>

      <div className={`collapse navbar-collapse ${menuOpen ? "show" : ""}`}>
        {/* Left Side */}
        <ul className="navbar-nav me-auto ms-3">
          <li className="nav-item">
            <Link className="nav-link text-light" to="/shop">
              Shop
            </Link>
          </li>

          {/* Categories Dropdown */}
          {categories.length > 0 && (
            <li className="nav-item dropdown">
              <button
                className="nav-link dropdown-toggle btn btn-link text-light"
                type="button"
                data-bs-toggle="dropdown"
              >
                Categories
              </button>
              <ul className="dropdown-menu">
                {categories.map((cat) => {
                    // ensure we generate a string key; categories may be objects or strings
                    const key =
                      (cat && typeof cat === "object"
                        ? cat._id || cat.name || JSON.stringify(cat)
                        : String(cat));
                    const name = cat && typeof cat === "object" ? cat.name : cat;
                    return (
                      <li key={key}>
                        <Link className="dropdown-item" to={`/shop/category/${name}`}>
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
              <Link
                className="nav-link text-warning fw-bold"
                to="/admin/dashboard"
              >
                Admin Panel
              </Link>
            </li>
          )}
        </ul>

        {/* Right Side */}
        <ul className="navbar-nav ms-auto align-items-center">
          {/* Cart */}
          <li className="nav-item me-3">
            <Link className="nav-link position-relative text-light" to="/cart">
              <FaShoppingCart size={20} />
              {totalCartItems > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {totalCartItems}
                </span>
              )}
            </Link>
          </li>

          {/* User */}
          {user ? (
            <li className="nav-item dropdown">
              <button
                className="nav-link dropdown-toggle btn btn-link text-light d-flex align-items-center"
                type="button"
                data-bs-toggle="dropdown"
              >
                <FaUserCircle size={20} className="me-1" />
                {user.name}
              </button>

              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <Link className="dropdown-item" to="/orders">
                    My Orders
                  </Link>
                </li>
                <li>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </ul>
            </li>
          ) : (
            <>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/login">
                  Login
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/register">
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;