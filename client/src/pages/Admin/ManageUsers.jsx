import React, { useContext, useEffect, useMemo, useState } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import API from "../../api";
import { AuthContext } from "../../context/AuthContext";
import { downloadCsv, inDateRange } from "../../utils/adminHelpers";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";

const USERS_PER_PAGE = 12;

const ManageUsers = () => {
  const { user } = useContext(AuthContext);
  const canCreateSubAdmin = Boolean(user?.isSuperAdmin);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "" });
  const [userPage, setUserPage] = useState(1);

  const fetchUsers = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const { data } = await API.get("/users");
      setUsers(Array.isArray(data) ? data : []);
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

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = setInterval(() => fetchUsers(false), 30000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await API.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((current) => current._id !== id));
    } catch (err) {
      toast.error("Error deleting user: " + (err.response?.data?.message || err.message));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post("/users", { ...newUser });
      setNewUser({ name: "", email: "", password: "" });
      setShowCreateForm(false);
      fetchUsers(false);
    } catch (err) {
      toast.error("Error creating user: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((entry) => {
      if (roleFilter === "admin" && !entry.isAdmin) return false;
      if (roleFilter === "super-admin" && !entry.isSuperAdmin) return false;
      if (roleFilter === "customer" && entry.isAdmin) return false;
      if ((dateFrom || dateTo) && !inDateRange(entry.createdAt, dateFrom, dateTo)) return false;
      if (!term) return true;
      const haystack = `${entry.name} ${entry.email}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [users, search, roleFilter, dateFrom, dateTo]);

  useEffect(() => {
    setUserPage(1);
  }, [search, roleFilter, dateFrom, dateTo]);

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));

  useEffect(() => {
    if (userPage > totalUserPages) {
      setUserPage(totalUserPages);
    }
  }, [userPage, totalUserPages]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (userPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredUsers, userPage]);

  const exportUsers = () => {
    downloadCsv(
      "users.csv",
      filteredUsers.map((entry) => ({
        name: entry.name,
        email: entry.email,
        role: entry.isSuperAdmin ? "Super Admin" : entry.isAdmin ? "Admin" : "Customer",
        createdAt: entry.createdAt || "",
      }))
    );
  };

  if (loading) return <p>Loading users...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Users</h3>
        <div className="d-flex gap-2">
          <button
            className="btn btn-success btn-sm d-inline-flex align-items-center gap-1"
            onClick={() => setShowCreateForm((prev) => !prev)}
            aria-label={showCreateForm ? "Close add user form" : "Open add user form"}
            title={showCreateForm ? "Close add sub-admin form" : "Add sub-admin"}
            disabled={!canCreateSubAdmin}
          >
            {showCreateForm ? (
              <>
                <FaTimes />
                <span>Close user form</span>
              </>
            ) : (
              <>
                <FaPlus />
                <span>Add Admin</span>
              </>
            )}
          </button>
          <button className="btn btn-outline-primary btn-sm" onClick={() => fetchUsers()}>
            Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={exportUsers}>
            Export CSV
          </button>
        </div>
      </div>

      {!canCreateSubAdmin && (
        <div className="alert alert-info py-2">
          Only Super Admin can create sub-admin accounts.
        </div>
      )}

      {showCreateForm && canCreateSubAdmin && (
        <form className="mb-4 card p-3" onSubmit={handleCreate} style={{ maxWidth: "560px" }}>
          <div className="mb-2">
            <input
              type="text"
              className="form-control"
              placeholder="Name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              required
            />
          </div>
          <div className="mb-2">
            <input
              type="email"
              className="form-control"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              required
            />
          </div>
          <div className="mb-2">
            <input
              type="password"
              className="form-control"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              required
            />
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-primary" type="submit">
              Create Sub Admin
            </button>
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-4">
            <input
              className="form-control"
              placeholder="Search name/email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <select className="form-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="super-admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="customer">Customer</option>
            </select>
          </div>
          <div className="col-md-2">
            <input type="datetime-local" className="form-control" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="col-md-2">
            <input type="datetime-local" className="form-control" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="col-md-2 d-flex align-items-center justify-content-between">
            <div className="form-check">
              <input
                id="usersAutoRefresh"
                className="form-check-input"
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="usersAutoRefresh">
                Auto 30s
              </label>
            </div>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                setSearch("");
                setRoleFilter("all");
                setDateFrom("");
                setDateTo("");
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <p>No users found</p>
      ) : (
        <table className="table table-striped mt-3">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((entry) => (
              <tr key={entry._id}>
                <td>{entry.name}</td>
                <td>{entry.email}</td>
                <td>{entry.isSuperAdmin ? "Super Admin" : entry.isAdmin ? "Admin" : "Customer"}</td>
                <td>{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "-"}</td>
                <td>
                  {entry._id !== user?._id && !entry.isSuperAdmin && (
                    <button className="btn btn-danger btn-sm" onClick={() => deleteUser(entry._id)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Pagination currentPage={userPage} totalPages={totalUserPages} onPageChange={setUserPage} />
    </div>
  );
};

export default ManageUsers;
