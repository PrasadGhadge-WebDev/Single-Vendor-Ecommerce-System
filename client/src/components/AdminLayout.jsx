import React, { useState, useContext, useEffect, useCallback } from "react";
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
  FaStar,
  FaIdBadge,
  FaChevronDown,
  FaCreditCard,
  FaSearch,
  FaRegBell,
  FaUndo,
} from "react-icons/fa";
import { FiZap } from "react-icons/fi";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import API from "../api";
import "./AdminLayout.css";

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [businessProfile, setBusinessProfile] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  const [navbarStats, setNavbarStats] = useState({
    pendingOrders: 0,
    lowStockProducts: 0,
    pendingMessages: 0,
  });
  const [searchResults, setSearchResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await API.get("/notifications");
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to load notifications", error);
    }
  }, []);

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.read) {
        await API.put(`/notifications/${notif._id}/read`);
        fetchNotifications();
      }
      if (notif.link) {
        navigate(notif.link);
      }
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const markAllNotificationsRead = async (e) => {
    e.stopPropagation();
    try {
      await API.put("/notifications/mark-all-read");
      fetchNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch Navbar Stats
  const fetchNavbarStats = useCallback(async () => {
    try {
      const { data } = await API.get("/admin/navbar-stats");
      setNavbarStats(data || { pendingOrders: 0, lowStockProducts: 0, pendingMessages: 0 });
    } catch (error) {
      console.error("Failed to load navbar stats", error);
    }
  }, []);

  // Global Search logic
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const { data } = await API.get(`/admin/global-search?q=${searchQuery}`);
        setSearchResults(data || []);
      } catch (error) {
        console.error("Failed to search", error);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    document.body.setAttribute("data-bs-theme", "light");
    document.documentElement.classList.remove("dark");
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const fetchBusinessProfile = useCallback(async () => {
    try {
      const { data } = await API.get("/business-settings");
      setBusinessProfile(data || {});
    } catch (error) {
      console.error("Failed to load business profile", error);
    }
  }, []);

  useEffect(() => {
    fetchBusinessProfile();
    fetchNavbarStats();
    fetchNotifications();
    const handler = (event) => {
      if (event?.detail) {
        setBusinessProfile(event.detail);
      }
      fetchBusinessProfile();
    };
    window.addEventListener("business-settings-updated", handler);
    return () => window.removeEventListener("business-settings-updated", handler);
  }, [fetchBusinessProfile, fetchNavbarStats, fetchNotifications]);

  return (
    <div className="admin-wrapper">
      {/* Sidebar */}
      <div className={`sidebar ${collapsed ? "collapsed" : ""} print:hidden`}>
        <div className="sidebar-header" style={{ padding: collapsed ? '20px 0' : '20px 24px', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          {collapsed ? (
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0072ff 0%, #00c6ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0, 114, 255, 0.4)',
              color: 'white',
              flexShrink: 0
            }}>
              <FiZap size={22} strokeWidth={2.5} fill="none" />
            </div>
          ) : (
            <div className="sidebar-header-profile" style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0072ff 0%, #00c6ff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0, 114, 255, 0.4)',
                color: 'white',
                flexShrink: 0
              }}>
                <FiZap size={22} strokeWidth={2.5} fill="none" />
              </div>
              <div className="sidebar-header-meta">
                <span className="sidebar-header-name" style={{fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-0.5px', margin: 0, lineHeight: 1, fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                  <span style={{ color: '#0f172a' }}>Electro</span>
                  <span style={{ color: '#0066ff' }}>Hub</span>
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="sidebar-scroll">
          <ul className="sidebar-nav">
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

            {/* Payments */}
            <li>
              <NavLink
                to="/admin/payments"
                className={({ isActive }) => (isActive ? "active-link" : "")}
                title="Payments"
              >
                <FaCreditCard />
                {!collapsed && <span>Payments</span>}
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

            {/* Reviews */}
            <li>
              <NavLink
                to="/admin/reviews"
                className={({ isActive }) => (isActive ? "active-link" : "")}
                title="Reviews"
              >
                <FaStar />
                {!collapsed && <span>Reviews</span>}
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

            {/* Purchases */}
            <li>
              <NavLink
                to="/admin/purchases"
                className={({ isActive }) => (isActive ? "active-link" : "")}
                title="Purchase Records"
              >
                <FaHistory />
                {!collapsed && <span>Purchases</span>}
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

          </ul>
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-btn logout-btn" onClick={handleLogout} title="Logout">
            <FaSignOutAlt />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Section */}
      <div className={`main-section ${collapsed ? "sidebar-collapsed" : ""} print:m-0 print:w-full print:p-0`}>
        <div className="admin-header print:hidden">
          <div className="admin-header-left" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <button className="toggle-btn" onClick={() => setCollapsed(!collapsed)} title="Toggle Sidebar">
              <FaBars />
            </button>
            <div className="admin-logo-area ms-3 d-none d-md-flex align-items-center gap-3">
              <div style={{ display: 'flex', alignItems: 'center', borderRight: '2px solid #e5e7eb', paddingRight: '12px' }}>
                {businessProfile?.logo ? (
                  <img src={businessProfile.logo} alt="Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
                ) : (
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#5a46ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <FaBoxOpen size={18} />
                  </div>
                )}
              </div>
              <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#111827', margin: 0, textTransform: 'capitalize' }}>
                {pathnames.length > 1 ? pathnames[1].replace("-", " ") : "Dashboard"}
              </span>
            </div>
          </div>

          <div className="admin-header-middle" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div className="header-search d-none d-lg-flex position-relative mx-auto" style={{ width: '100%', maxWidth: '350px' }}>
              <FaSearch className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                style={{ width: '100%' }}
              />

              {showSuggestions && searchQuery && (
                <div className="position-absolute bg-white shadow rounded-3 w-100 mt-2 start-0 border" style={{ top: '100%', zIndex: 1050, maxHeight: '300px', overflowY: 'auto' }}>
                  {searchResults.length > 0 ? searchResults.map((item, idx) => (
                    <div key={idx} className="px-3 py-2 border-bottom hover-bg-light cursor-pointer d-flex justify-content-between align-items-center" onClick={() => { setSearchQuery(""); setShowSuggestions(false); navigate(item.url); }}>
                      <span className="fw-bold text-dark fs-6 text-truncate pe-2">{item.name}</span>
                      <span className="badge bg-light text-secondary border flex-shrink-0">{item.type}</span>
                    </div>
                  )) : (
                    <div className="px-3 py-3 text-muted text-center fs-6">
                      {searchQuery.length < 2 ? "Type at least 2 characters..." : "No results found"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="admin-header-right" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>


            <div className="dropdown">
              <button
                className="profile-area profile-dropdown-toggle border-0"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                title="Admin menu"
              >
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="User" />
                ) : (
                  <FaUserCircle size={32} color="#9ca3af" />
                )}
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2}}>
                  <span style={{fontWeight: 600}}>Welcome Admin</span>
                  <span style={{fontSize: '0.7rem', color: '#6b7280'}}>{user?.name || "Admin"}</span>
                </div>
                <FaChevronDown size={10} color="#9ca3af" style={{marginLeft: '4px'}} />
              </button>

              <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 mt-2">
                <li>
                  <button className="dropdown-item py-2" onClick={() => navigate("/admin/profile")}>
                    My Profile
                  </button>
                </li>
                <li>
                  <button className="dropdown-item py-2" onClick={() => navigate("/admin/settings/password")}>
                    Change Password
                  </button>
                </li>
                <li>
                  <button className="dropdown-item py-2" onClick={() => navigate("/admin/settings")}>
                    Account Settings
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
