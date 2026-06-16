import React, { useContext, useEffect, useMemo, useState } from "react";
import { FaPlus, FaSearch, FaEllipsisV, FaEdit, FaTrash, FaUserLock, FaUnlock, FaKey, FaEnvelope, FaSignInAlt, FaShoppingCart, FaUserCheck, FaFileCsv, FaChevronDown, FaUsers, FaUserShield, FaUserTimes, FaStar, FaTimes } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../../api";
import { AuthContext } from "../../context/AuthContext";
import { downloadCsv, inDateRange } from "../../utils/adminHelpers";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";
import ConfirmModal from "../../components/ConfirmModal";

const USERS_PER_PAGE = 12;

const ManageUsers = () => {
  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Modal State
  const showCreateForm = searchParams.get("modal") === "user";
  const editingId = searchParams.get("id");
  const [editingUser, setEditingUser] = useState(null);
  const [userPage, setUserPage] = useState(1);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    type: "danger",
    title: "",
    message: "",
    onConfirm: () => { }
  });

  // Bulk Actions
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState("");

  const fetchUsers = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const { data } = await API.get("/users");
      const list = Array.isArray(data) ? data : [];
      setUsers(list);
      setError("");
    } catch (err) {
      setError("Failed to load users");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (showCreateForm && editingId && !editingUser && users.length > 0) {
      const u = users.find(u => u._id === editingId);
      if (u) setEditingUser(u);
    }
  }, [showCreateForm, editingId, editingUser, users]);

  const openAddModal = () => {
    setEditingUser(null);
    setSearchParams({ modal: "user" });
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setSearchParams({ modal: "user", id: u._id });
  };

  const resetModal = () => {
    setSearchParams({});
    setEditingUser(null);
  };

  const deleteUser = (id) => {
    setConfirmConfig({
      isOpen: true,
      type: "danger",
      title: "Delete User?",
      message: "This action cannot be undone. All customer-related information may be permanently removed.",
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
    const isBlocked = targetUser.status === "Blocked" || targetUser.isBlocked;
    setConfirmConfig({
      isOpen: true,
      type: isBlocked ? "info" : "warning",
      title: `${isBlocked ? 'Unblock' : 'Block'} User?`,
      message: `Are you sure you want to ${isBlocked ? 'unblock' : 'block'} ${targetUser.name}?`,
      onConfirm: async () => {
        try {
          await API.patch(`/users/${targetUser._id}`, { status: isBlocked ? 'Active' : 'Blocked' });
          toast.success(`User ${isBlocked ? 'unblocked' : 'blocked'} successfully`);
          fetchUsers(false);
        } catch (err) {
          toast.error(`Error updating user status`);
        }
      }
    });
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;

    setConfirmConfig({
      isOpen: true,
      type: bulkAction === 'delete' ? 'danger' : 'warning',
      title: `Confirm Bulk Action`,
      message: `Are you sure you want to ${bulkAction} ${selectedUsers.length} selected users?`,
      onConfirm: async () => {
        try {
          await API.post(`/users/bulk-action`, { action: bulkAction, userIds: selectedUsers });
          toast.success(`Successfully applied '${bulkAction}' to users`);
          setSelectedUsers([]);
          setBulkAction("");
          fetchUsers(false);
        } catch (err) {
          toast.error("Error performing bulk action");
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

      const isBlocked = entry.status === "Blocked" || entry.isBlocked;
      if (statusFilter === "active" && isBlocked) return false;
      if (statusFilter === "blocked" && !isBlocked) return false;

      if (customerTypeFilter !== "all" && entry.customerType?.toLowerCase() !== customerTypeFilter.toLowerCase()) return false;

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
        } else if (dateRange === "thisMonth") {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          if (entryDate < startOfMonth) return false;
        }
      }

      if (!term) return true;
      const haystack = `${entry.name} ${entry.email} ${entry.phone || ""} ${entry._id}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [users, search, roleFilter, statusFilter, dateRange, customerTypeFilter]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (userPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredUsers, userPage]);

  // KPIs
  const totalUsers = users.length;
  const activeUsersCount = users.filter(u => u.status === "Active" || !u.isBlocked).length;
  const blockedUsersCount = users.filter(u => u.status === "Blocked" || u.isBlocked).length;
  const newUsersThisMonth = users.filter(u => {
    const entryDate = new Date(u.createdAt);
    const now = new Date();
    return entryDate >= new Date(now.getFullYear(), now.getMonth(), 1);
  }).length;

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-8 space-y-6" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <ConfirmModal config={confirmConfig} setConfig={setConfirmConfig} />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0">Users</h1>
          <p className="text-sm text-gray-500 m-0 mt-1">VIEW, MANAGE, AND MONITOR ALL REGISTERED CUSTOMERS</p>
        </div>

        <div className="flex items-center gap-3 relative z-10">

          <button
            onClick={() => downloadCsv("users.csv", users)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border rounded-xl hover:bg-slate-50 transition-all text-xs font-bold shadow-sm"
            style={{ borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
          >
            <FaFileCsv className="text-indigo-600" /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-sm relative overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <FaUsers size={14} />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Total Users</p>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalUsers.toLocaleString()} Users</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-sm relative overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <FaUserCheck size={14} />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Active Users</p>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{activeUsersCount.toLocaleString()} Active</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-sm relative overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <FaUserTimes size={14} />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Blocked Users</p>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{blockedUsersCount.toLocaleString()} Blocked</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-sm relative overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <FaStar size={14} />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">New Users (This Month)</p>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{newUsersThisMonth.toLocaleString()} New</h3>
        </div>
      </div>
      {/* Advanced Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border shadow-sm p-2 mb-6 flex flex-nowrap overflow-x-auto items-center gap-2 w-full hide-scrollbar" style={{ borderColor: 'var(--border-color)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

        <div className="flex-[2] min-w-[150px] relative">
          <input
            type="text"
            placeholder="Search by all columns..."
            className="w-full pl-3 pr-8 py-1.5 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none focus:ring-2 ring-indigo-500/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
        </div>

        <select className="flex-1 min-w-[110px] px-2 py-1.5 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
        <select className="flex-1 min-w-[110px] px-2 py-1.5 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none" value={customerTypeFilter} onChange={(e) => setCustomerTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="regular">Regular</option>
          <option value="premium">Premium</option>
          <option value="vip">VIP</option>
        </select>
        <select className="flex-1 min-w-[110px] px-2 py-1.5 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </select>
        <select className="flex-1 min-w-[110px] px-2 py-1.5 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
          <option value="all">Creation Date</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="thisMonth">This Month</option>
        </select>

        {(search || statusFilter !== 'all' || customerTypeFilter !== 'all' || roleFilter !== 'all' || dateRange !== 'all') && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setCustomerTypeFilter("all");
              setRoleFilter("all");
              setDateRange("all");
            }}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ml-auto"
          >
            Reset
          </button>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.length > 0 && (
        <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-black text-indigo-700 dark:text-indigo-300">
            {selectedUsers.length} user(s) selected
          </span>
          <div className="flex items-center gap-2">
            <select
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none"
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
            >
              <option value="">Bulk Actions</option>
              <option value="activate">Activate Selected</option>
              <option value="block">Block Selected</option>
              <option value="delete">Delete Selected</option>
            </select>
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border shadow-sm overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed min-w-[900px]">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="w-[5%] p-3 text-center">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300"
                    checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(paginatedUsers.map(u => u._id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                  />
                </th>
                <th className="w-[15%] p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">User ID</th>
                <th className="w-[30%] p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Profile</th>
                <th className="w-[10%] p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Orders</th>
                <th className="w-[10%] p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Spent</th>
                <th className="w-[10%] p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                <th className="w-[10%] p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Verified</th>
                <th className="w-[10%] p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FaUsers className="text-6xl text-slate-200 dark:text-slate-700 mb-4" />
                      <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-2">No Users Found</h3>
                      <p className="text-sm font-medium text-slate-400 mb-6">Registered customers will appear here once they create an account.</p>
                      <button onClick={openAddModal} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors">
                        + Add User
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const isBlocked = u.status === "Blocked" || u.isBlocked;
                  return (
                    <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300"
                          checked={selectedUsers.includes(u._id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedUsers([...selectedUsers, u._id]);
                            else setSelectedUsers(selectedUsers.filter(id => id !== u._id));
                          }}
                        />
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] font-bold font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">#{u._id.slice(-8).toUpperCase()}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/admin/users/${u._id}`)}>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm relative">
                            {u.profileImage ? (
                              <img src={u.profileImage} alt={u.name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              u.name.charAt(0)
                            )}
                            {u.isAdmin && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border border-white dark:border-slate-900 flex items-center justify-center text-[6px] text-white"><FaUserShield /></div>}
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 transition-colors">{u.name}</p>
                            <p className="text-[10px] font-medium text-slate-500 truncate leading-tight">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold">
                          <FaShoppingCart className="text-slate-400" size={8} /> {u.ordersCount || 0}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">₹{(u.totalSpent || 0).toLocaleString()}</p>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${isBlocked
                            ? "bg-rose-500/10 text-rose-600"
                            : "bg-emerald-500/10 text-emerald-600"
                          }`}>
                          {isBlocked ? "Blocked" : u.status || "Active"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${u.isVerified
                            ? "bg-blue-500/10 text-blue-600"
                            : "bg-slate-500/10 text-slate-500"
                          }`}>
                          {u.isVerified ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="p-3 text-right relative">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => deleteUser(u._id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all" title="Delete User">
                            <FaTrash size={14} />
                          </button>
                          <div className="dropdown">
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400" data-bs-toggle="dropdown">
                              <FaEllipsisV size={14} />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end border border-slate-100 dark:border-slate-800 shadow-xl rounded-2xl p-2 bg-white dark:bg-slate-900 min-w-[180px] z-50">
                              <li>
                                <button className="dropdown-item flex items-center gap-3 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => navigate(`/admin/users/${u._id}`)}>
                                  <FaUserCheck className="text-indigo-500" /> View Profile
                                </button>
                              </li>

                              <li><hr className="dropdown-divider opacity-5 my-1" /></li>
                              <li>
                                <button className="dropdown-item flex items-center gap-3 py-2.5 px-3 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => toggleBlockUser(u)}>
                                  {isBlocked ? <><FaUnlock className="text-emerald-500" /> <span className="text-slate-700 dark:text-slate-200">Unblock User</span></> : <><FaUserLock className="text-rose-500" /> <span className="text-slate-700 dark:text-slate-200">Block User</span></>}
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination currentPage={userPage} totalPages={Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE))} onPageChange={setUserPage} />

    </div>
  );
};

export default ManageUsers;
