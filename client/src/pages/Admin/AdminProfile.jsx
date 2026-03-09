import React, { useContext, useEffect, useState } from "react";
import API from "../../api";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";

const AdminProfile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [capturedImage, setCapturedImage] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/users/me");
      setForm((prev) => ({
        ...prev,
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
      }));
      setCapturedImage(data.profileImage || "");
      setCreatedAt(data.createdAt || "");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleProfileImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.warning("Please select a valid image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setCapturedImage(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.warning("Name and email are required");
      return;
    }
    if (form.password && form.password !== form.confirmPassword) {
      toast.warning("Password and confirm password do not match");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        profileImage: capturedImage || "",
      };
      if (form.password) {
        payload.password = form.password;
      }

      const { data } = await API.put("/users/me", payload);
      updateUser(data);
      setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Admin Profile</h3>
        <span className="badge bg-primary-subtle text-primary-emphasis">
          {user?.isSuperAdmin ? "Super Admin" : "Admin"}
        </span>
      </div>

      <form className="card p-3" onSubmit={handleSubmit} style={{ maxWidth: "720px" }}>
        <div className="d-flex align-items-center gap-3 mb-3">
          <img
            src={capturedImage || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt="Admin profile"
            style={{ width: "84px", height: "84px", borderRadius: "50%", objectFit: "cover", border: "1px solid #d1d5db" }}
          />
          <div>
            <div className="fw-semibold">{form.name || "Admin User"}</div>
            <small className="text-muted d-block">{form.email}</small>
            <small className="text-muted">
              Joined: {createdAt ? new Date(createdAt).toLocaleDateString() : "-"}
            </small>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label mb-1">Name</label>
            <input
              className="form-control"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label mb-1">Email</label>
            <input
              type="email"
              className="form-control"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label mb-1">Phone</label>
            <input
              className="form-control"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
          </div>
          <div className="col-12">
            <label className="form-label mb-1">Address</label>
            <textarea
              className="form-control"
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={2}
              placeholder="Enter address"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label mb-1">New Password</label>
            <input
              type="password"
              className="form-control"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Leave blank to keep current password"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label mb-1">Confirm Password</label>
            <input
              type="password"
              className="form-control"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter new password"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label mb-1">Role</label>
            <input
              className="form-control"
              value={user?.isSuperAdmin ? "Super Admin" : "Admin"}
              readOnly
            />
          </div>
        </div>
        <div className="mt-3">
          <div className="mb-3">
            <label className="form-label mb-2 d-block">Upload Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              className="form-control"
              onChange={handleProfileImageUpload}
            />
          </div>

          {capturedImage && (
            <div className="mb-3">
              <p className="mb-1">Profile Picture Preview</p>
              <img
                src={capturedImage}
                alt="Profile preview"
                style={{ width: "100%", maxWidth: "220px", borderRadius: "10px", border: "1px solid #d1d5db" }}
              />
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Updating..." : "Update Profile"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProfile;
