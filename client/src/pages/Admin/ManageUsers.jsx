import React, { useEffect, useState, useContext } from "react";
import API from "../../api";
import { AuthContext } from "../../context/AuthContext";

const ManageUsers = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", isAdmin: false });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/users");
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await API.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      alert("Error deleting user: " + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <p>Loading users...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newUser };
      await API.post("/users", payload);
      alert("User created");
      setNewUser({ name: "", email: "", password: "", isAdmin: false });
      fetchUsers();
    } catch (err) {
      alert("Error creating user: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div>
      <h3>Users</h3>

      {/* create user form */}
      <form className="mb-4" onSubmit={handleCreate} style={{ maxWidth: '500px' }}>
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
        <div className="form-check mb-2">
          <input
            type="checkbox"
            className="form-check-input"
            id="isAdmin"
            checked={newUser.isAdmin}
            onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })}
          />
          <label className="form-check-label" htmlFor="isAdmin">
            Admin
          </label>
        </div>
        <button className="btn btn-primary" type="submit">
          Create
        </button>
      </form>

      {users.length === 0 ? (
        <p>No users found</p>
      ) : (
        <table className="table table-striped mt-3">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Admin</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.isAdmin ? "Yes" : "No"}</td>
                <td>
                  {u._id !== user?._id && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteUser(u._id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManageUsers;
