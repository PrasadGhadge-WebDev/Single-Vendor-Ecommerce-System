import React, { useState, useContext } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBoxOpen,
  FaList,
  FaUsers,
  FaShoppingCart,
  FaBars,
  FaHome,
  FaSignOutAlt,
  FaUserCircle,
  FaMoon,
  FaSun,
  FaTags,
  FaTruck,
  FaCog,
  FaHistory,
  FaIdBadge,
  FaChevronDown,
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
        <div className="sidebar-header">
          {collapsed ? (
            "AP"
          ) : (
            <div className="sidebar-header-profile">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user?.name || "Admin"}
                  className="sidebar-header-avatar"
                />
              ) : (
                <FaUserCircle className="sidebar-header-avatar-icon" />
              )}
              <div className="sidebar-header-meta">
                <span className="sidebar-header-name">{user?.name || "Admin"}</span>
                <small>{user?.isSuperAdmin ? "Super Admin" : "Admin"}</small>
              </div>
            </div>
          )}
        </div>
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

          {/* Suppliers */}
          <li>
            <NavLink
              to="/admin/suppliers"
              className={({ isActive }) => (isActive ? "active-link" : "")}
              title="Suppliers"
            >
              <FaTruck />
              {!collapsed && <span>Suppliers</span>}
            </NavLink>
          </li>

          {/* Business Settings */}
          <li>
            <NavLink
              to="/admin/business-settings"
              className={({ isActive }) => (isActive ? "active-link" : "")}
              title="Business Settings"
            >
              <FaCog />
              {!collapsed && <span>Business Settings</span>}
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/admin/stock-history"
              className={({ isActive }) => (isActive ? "active-link" : "")}
              title="Stock History"
            >
              <FaHistory />
              {!collapsed && <span>Stock History</span>}
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

            <div className="dropdown">
              <button
                className="profile-area profile-dropdown-toggle border-0"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                title="Admin menu"
              >
                <FaIdBadge size={18} />
                <span>{user?.name}</span>
                <FaChevronDown size={12} />
              </button>

              <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3">
                <li>
                  <button className="dropdown-item py-2" onClick={() => navigate("/admin/profile")}>
                    Profile
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button className="dropdown-item py-2 text-danger" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </ul>
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
