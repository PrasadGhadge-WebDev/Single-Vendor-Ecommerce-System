import React, { useState, useContext } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBoxOpen,
  FaList,
  FaUsers,
  FaPlus,
  FaShoppingCart,
  FaBars,
  FaHome,
  FaSignOutAlt,
  FaUserCircle,
  FaMoon,
  FaSun,
  FaTags,
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import "./AdminLayout.css";

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="admin-wrapper">
      {/* Sidebar */}
      <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">{collapsed ? "AP" : "Admin Panel"}</div>
        <ul>
          {/* Home */}
          <li>
            <button
              className="sidebar-btn"
              onClick={() => navigate("/")}
              title="Home"
            >
              <FaHome />
              {!collapsed && <span>Home</span>}
            </button>
          </li>

          {/* Dashboard */}
          <li>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => (isActive ? "active-link" : "")}
              title="Dashboard"
            >
              <FaTachometerAlt />
              {!collapsed && <span>Dashboard</span>}
            </NavLink>
          </li>

          {/* Categories */}
          <li>
            <NavLink
              to="/admin/categories"
              className={({ isActive }) => (isActive ? "active-link" : "")}
              title="Categories"
            >
              <FaList />
              {!collapsed && <span>Categories</span>}
            </NavLink>
          </li>

          {/* Users */}
          <li>
            <NavLink
              to="/admin/users"
              className={({ isActive }) => (isActive ? "active-link" : "")}
              title="Users"
            >
              <FaUsers />
              {!collapsed && <span>Users</span>}
            </NavLink>
          </li>

          {/* Products */}
          <li>
            <NavLink
              to="/admin/products"
              className={({ isActive }) => (isActive ? "active-link" : "")}
              title="Products"
            >
              <FaBoxOpen />
              {!collapsed && <span>Products</span>}
            </NavLink>
          </li>

          {/* Add Product */}
          <li>
            <NavLink
              to="/admin/add-product"
              className={({ isActive }) => (isActive ? "active-link" : "")}
              title="Add Product"
            >
              <FaPlus />
              {!collapsed && <span>Add Product</span>}
            </NavLink>
          </li>

          {/* Offers */}
          <li>
            <NavLink
              to="/admin/offers"
              className={({ isActive }) => (isActive ? "active-link" : "")}
              title="Offers"
            >
              <FaTags />
              {!collapsed && <span>Offers</span>}
            </NavLink>
          </li>

          {/* Orders */}
          <li>
            <NavLink
              to="/admin/orders"
              className={({ isActive }) => (isActive ? "active-link" : "")}
              title="Orders"
            >
              <FaShoppingCart />
              {!collapsed && <span>Orders</span>}
            </NavLink>
          </li>

          {/* Logout */}
          <li>
            <button className="sidebar-btn logout-btn" onClick={handleLogout}>
  <FaSignOutAlt />
  <span>Logout</span>
</button>
          </li>
        </ul>
      </div>

      {/* Main Section */}
      <div className={`main-section ${collapsed ? "sidebar-collapsed" : ""}`}>
        <div className="admin-header">
          <button className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
            <FaBars />
          </button>

          <div className="admin-header-right">
            <button
              type="button"
              className="admin-theme-btn"
              onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
              aria-label="Toggle admin theme"
              title="Toggle theme"
            >
              {theme === "light" ? <FaMoon /> : <FaSun />}
            </button>

            <div className="profile-area">
              <FaUserCircle size={22} />
              <span>{user?.name}</span>
            </div>
          </div>
        </div>

        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
