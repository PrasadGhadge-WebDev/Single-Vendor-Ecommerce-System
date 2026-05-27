import React, { useContext, useEffect, useMemo, useState } from "react";
import { FaPlus, FaTimes, FaSearch, FaEllipsisV, FaEdit, FaTrash, FaUserLock, FaUnlock, FaKey, FaEnvelope, FaSignInAlt, FaShoppingCart, FaUserCheck, FaUserSlash, FaFileCsv, FaChevronDown } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../../api";
import { AuthContext } from "../../context/AuthContext";
import { downloadCsv, inDateRange } from "../../utils/adminHelpers";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";
import UserFormModal from "../../components/UserFormModal";
import ConfirmModal from "../../components/ConfirmModal";

const USERS_PER_PAGE = 12;

const ManageUsers = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const canCreateSubAdmin = Boolean(user?.isSuperAdmin);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const showCreateForm = searchParams.get("modal") === "user";
  const editingId = searchParams.get("id");
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "" });
  const [userPage, setUserPage] = useState(1);
  const [confirmConfig, setConfirmConfig] = useState({ 
    isOpen: false, 
    type: "danger", 
    title: "", 
    message: "", 
    onConfirm: () => {} 
  });

  const fetchUsers = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const { data } = await API.get("/users");
      const list = Array.isArray(data) ? data : [];
      setUsers(list);
      setError("");
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Sync editingUser if URL has ID but state doesn't
  useEffect(() => {
    if (showCreateForm && editingId && !editingUser && users.length > 0) {
      const user = users.find(u => u._id === editingId);
      if (user) setEditingUser(user);
    }
  }, [showCreateForm, editingId, editingUser, users]);

  const openAddModal = () => {
    setEditingUser(null);
    setSearchParams({ modal: "user" });
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setSearchParams({ modal: "user", id: user._id });
  };

  const resetModal = () => {
    setSearchParams({});
    setEditingUser(null);
  };

  const deleteUser = (id) => {
    if (!id) {
      toast.error("Invalid user ID");
      return;
    }
    setConfirmConfig({
      isOpen: true,
      type: "danger",
      title: "Delete User",
      message: "Are you sure you want to permanently delete this user? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await API.delete(`/users/${id}`);
          setUsers((prev) => prev.filter((current) => current._id !== id));
          toast.success("User deleted successfully");
        } catch (err) {
          toast.error("Error deleting user: " + (err.response?.data?.message || err.message));
        }
      }
    });
  };

  const toggleBlockUser = (targetUser) => {
    if (!targetUser?._id) {
      toast.error("Invalid user reference");
      return;
    }
    const action = targetUser.isBlocked ? "unblock" : "block";
    setConfirmConfig({
      isOpen: true,
      type: targetUser.isBlocked ? "info" : "warning",
      title: `${targetUser.isBlocked ? 'Unblock' : 'Block'} User`,
      message: `Are you sure you want to ${action} ${targetUser.name}? ${targetUser.isBlocked ? '' : 'They will no longer be able to log in.'}`,
      onConfirm: async () => {
        try {
          await API.patch(`/users/${targetUser._id}/block`, { isBlocked: !targetUser.isBlocked });
          toast.success(`User ${action}ed successfully`);
          fetchUsers(false);
        } catch (err) {
          toast.error(`Error ${action}ing user`);
        }
      }
    });
  };

  const resetPassword = (targetUser) => {
    setConfirmConfig({
      isOpen: true,
      type: "warning",
      title: "Reset Password",
      message: `Are you sure you want to reset the password for ${targetUser.name}? A temporary password will be generated and shown.`,
      onConfirm: async () => {
        try {
          await API.post(`/users/${targetUser._id}/reset-password`);
          toast.success("Password reset request sent");
        } catch (err) {
          toast.error("Failed to reset password");
        }
      }
    });
  };

  const loginAsUser = (targetUser) => {
    setConfirmConfig({
      isOpen: true,
      type: "info",
      title: "Impersonate User",
      message: `Are you sure you want to log in as ${targetUser.name}? You will be signed out from your current admin session.`,
      onConfirm: async () => {
        try {
          const { data } = await API.post(`/users/${targetUser._id}/impersonate`);
          sessionStorage.setItem("token", data.token);
          sessionStorage.setItem("userInfo", JSON.stringify(data.user || data));
          window.location.href = "/";
        } catch (err) {
          toast.error("Failed to impersonate user");
        }
      }
    });
  };

  const handleSaveUser = async (userData) => {
    try {
      if (editingUser) {
        await API.patch(`/users/${editingUser._id}`, userData);
        toast.success("User updated successfully");
      } else {
        await API.post("/users", userData);
        toast.success("User created successfully");
      }
      resetModal();
      fetchUsers(false);
    } catch (err) {
      toast.error("Error saving user: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((entry) => {
      if (roleFilter === "admin" && !entry.isAdmin) return false;
      if (roleFilter === "super-admin" && !entry.isSuperAdmin) return false;
      if (roleFilter === "customer" && entry.isAdmin) return false;
      if (statusFilter === "active" && entry.isBlocked) return false;
      if (statusFilter === "blocked" && !entry.isBlocked) return false;
      
      // Smart Date Range Filtering
      if (dateRange !== "all") {
        const entryDate = new Date(entry.createdAt);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (dateRange === "today") {
          if (entryDate < startOfToday) return false;
        } else if (dateRange === "yesterday") {
          const startOfYesterday = new Date(startOfToday);
          startOfYesterday.setDate(startOfYesterday.getDate() - 1);
          if (entryDate < startOfYesterday || entryDate >= startOfToday) return false;
        } else if (dateRange === "7days") {
          const sevenDaysAgo = new Date(startOfToday);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          if (entryDate < sevenDaysAgo) return false;
        } else if (dateRange === "30days") {
          const thirtyDaysAgo = new Date(startOfToday);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          if (entryDate < thirtyDaysAgo) return false;
        } else if (dateRange === "thisMonth") {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          if (entryDate < startOfMonth) return false;
        } else if (dateRange === "lastMonth") {
          const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
          if (entryDate < startOfLastMonth || entryDate > endOfLastMonth) return false;
        } else if (dateRange === "thisYear") {
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          if (entryDate < startOfYear) return false;
        } else if (dateRange === "custom") {
          if ((dateFrom || dateTo) && !inDateRange(entry.createdAt, dateFrom, dateTo)) return false;
        }
      }

      if (!term) return true;
      const haystack = `${entry.name} ${entry.email} ${entry.phone || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [users, search, roleFilter, statusFilter, dateRange, dateFrom, dateTo]);

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const paginatedUsers = useMemo(() => {
    const startIndex = (userPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredUsers, userPage]);

  const exportUsers = () => {
    downloadCsv("users_report.csv", filteredUsers.map(u => ({
      Name: u.name, Email: u.email, Phone: u.phone || "-", 
      Role: u.isSuperAdmin ? "Super" : u.isAdmin ? "Admin" : "Customer",
      Orders: u.ordersCount || 0, Spent: u.totalSpent || 0, 
      Status: u.isBlocked ? "Blocked" : "Active",
      Joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"
    })));
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <ConfirmModal config={confirmConfig} setConfig={setConfirmConfig} />
      {/* V3 Premium Module Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 relative">
        <div className="relative group">
          {/* Decorative Background Glow */}
          <div className="absolute -left-8 -top-8 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-700" />
          
          <div className="flex items-start gap-4 relative">
            {/* Geometric Accent Bar */}
            <div className="w-1.5 h-12 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full shadow-lg shadow-indigo-500/20" />
            
            <div>
              <h1 className="text-4xl font-black tracking-tight flex items-center gap-3" style={{ color: 'var(--page-text)' }}>
                Users
                <span className="text-[10px] uppercase tracking-[0.3em] font-black px-2 py-1 bg-indigo-500/10 text-indigo-600 rounded-lg ml-2">
                  System
                </span>
              </h1>
              <p className="text-sm font-bold opacity-40 uppercase tracking-[0.1em] mt-1.5">
                Centralized Customer & Staff Management Console
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
            onClick={openAddModal}
            disabled={!canCreateSubAdmin}
          >
            <FaPlus /> Add User
          </button>
          <button 
            onClick={exportUsers} 
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border rounded-2xl hover:bg-slate-50 transition-all text-sm font-bold" 
            style={{ borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
          >
            <FaFileCsv className="text-indigo-600" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <UserFormModal 
        isOpen={showCreateForm}
        onClose={resetModal}
        onSave={handleSaveUser}
        loading={loading}
        editData={editingUser}
      />

      {/* Refined Advanced Filters */}
      <div className="bg-white dark:bg-slate-900/50 p-4 rounded-3xl border shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="flex-grow min-w-[300px] relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <FaSearch className="text-indigo-500/40" size={14} />
            </div>
            <input
              className="w-full pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500/30 transition-all outline-none"
              style={{ paddingLeft: '52px' }}
              placeholder="Search user, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Dropdown */}
          <div className="w-full sm:w-auto min-w-[140px] relative">
            <select 
              className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
            <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
          </div>

          {/* Role Dropdown */}
          <div className="w-full sm:w-auto min-w-[140px] relative">
            <select 
              className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="super-admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="customer">Customer</option>
            </select>
            <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
          </div>

          {/* Date Range Dropdown */}
          <div className="w-full sm:w-auto min-w-[160px] relative">
            <select 
              className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="all">Joined Date</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisYear">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
            <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
          </div>

          {/* Custom Date Inputs (Only visible if 'custom' is selected) */}
          {dateRange === "custom" && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
              <input 
                type="date" 
                className="px-3 py-3 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-xs font-bold opacity-70 focus:opacity-100 outline-none transition-all" 
                value={dateFrom} 
                onChange={(e) => setDateFrom(e.target.value)} 
              />
              <span className="text-slate-300 font-bold">to</span>
              <input 
                type="date" 
                className="px-3 py-3 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-xs font-bold opacity-70 focus:opacity-100 outline-none transition-all" 
                value={dateTo} 
                onChange={(e) => setDateTo(e.target.value)} 
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button 
              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setRoleFilter("all");
                setDateRange("all");
                setDateFrom("");
                setDateTo("");
                fetchUsers(true);
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      {/* Professional High-Density Data Grid */}
      <div className="bg-white dark:bg-slate-900/60 rounded-3xl border shadow-xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                <th className="w-[25%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">User Identity</th>
                <th className="w-[20%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Contact Gateway</th>
                <th className="w-[10%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Orders</th>
                <th className="w-[12%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Investment</th>
                <th className="w-[12%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Status</th>
                <th className="w-[12%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Joined Date</th>
                <th className="w-[9%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800" style={{ borderColor: 'var(--border-color)' }}>
              {paginatedUsers.map((u, idx) => (
                <tr 
                  key={u._id || idx} 
                  className={`group transition-all duration-200 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/30 dark:bg-slate-800/20'} hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5`}
                >
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-indigo-500/20 group-hover:rotate-3 transition-transform">
                        {u.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-sm truncate" style={{ color: 'var(--page-text)' }}>{u.name}</p>
                        <p className="text-[9px] font-bold opacity-40 uppercase tracking-tighter truncate">
                          {u.isSuperAdmin ? "Super Admin" : u.isAdmin ? "Manager" : "Customer"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                    <div className="truncate">
                      <p className="text-xs font-semibold opacity-80 truncate">{u.email}</p>
                      <p className="text-[10px] font-medium opacity-40 truncate">{u.phone || "No phone linked"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold">
                      <FaShoppingCart className="text-indigo-500/50" size={10} />
                      {u.ordersCount || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                    <div>
                      <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">₹{(u.totalSpent || 0).toLocaleString()}</p>
                      <p className="text-[8px] font-bold opacity-30 uppercase">Gross</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                    <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                      u.isBlocked 
                      ? "bg-rose-500/10 text-rose-600 border border-rose-500/10" 
                      : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/10"
                    }`}>
                      {u.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-bold opacity-60">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => setEditingUser(u)}
                        className="p-2 hover:bg-indigo-600 hover:text-white rounded-lg transition-all text-slate-400"
                        title="Edit"
                      >
                        <FaEdit size={12} />
                      </button>
                      
                      <div className="dropdown">
                        <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all text-slate-400" data-bs-toggle="dropdown">
                          <FaEllipsisV size={12} />
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end border-0 shadow-2xl rounded-2xl p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl ring-1 ring-black/5">
                          <li>
                            <button className="dropdown-item flex items-center gap-3 py-2 px-3 rounded-xl text-[11px] font-bold" onClick={() => toggleBlockUser(u)}>
                              {u.isBlocked ? <><FaUnlock className="text-emerald-500" /> Unblock</> : <><FaUserLock className="text-rose-500" /> Block</>}
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item flex items-center gap-3 py-2 px-3 rounded-xl text-[11px] font-bold text-indigo-600" onClick={() => navigate(`/admin/orders?user=${u._id}`)}>
                              <FaShoppingCart /> History
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item flex items-center gap-3 py-2 px-3 rounded-xl text-[11px] font-bold" onClick={() => resetPassword(u)}>
                              <FaKey className="text-amber-500" /> Reset
                            </button>
                          </li>
                          <li><hr className="dropdown-divider opacity-5 my-1" /></li>
                          <li>
                            <button className="dropdown-item flex items-center gap-3 py-2 px-3 rounded-xl text-[11px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" onClick={() => loginAsUser(u)}>
                              <FaSignInAlt /> Impersonate
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item flex items-center gap-3 py-2 px-3 rounded-xl text-[11px] font-bold text-rose-600 hover:bg-rose-50" onClick={() => deleteUser(u._id)}>
                              <FaTrash /> Delete
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination currentPage={userPage} totalPages={totalUserPages} onPageChange={setUserPage} />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
      />
    </div>
  );
};

export default ManageUsers;
