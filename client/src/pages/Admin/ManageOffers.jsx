import React, { useEffect, useState } from "react";
import API from "../../api";

const initialForm = {
  title: "",
  code: "",
  description: "",
  discountType: "PERCENT",
  discountValue: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  startsAt: "",
  expiresAt: "",
  isActive: true,
};

const ManageOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/offers");
      setOffers(Array.isArray(data) ? data : []);
    } catch (error) {
      alert("Failed to load offers");
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const buildPayload = () => ({
    title: form.title.trim(),
    code: form.code.trim().toUpperCase(),
    description: form.description.trim(),
    discountType: form.discountType,
    discountValue: Number(form.discountValue || 0),
    minOrderAmount: Number(form.minOrderAmount || 0),
    maxDiscountAmount: Number(form.maxDiscountAmount || 0),
    startsAt: form.startsAt ? new Date(form.startsAt) : new Date(),
    expiresAt: form.expiresAt ? new Date(form.expiresAt) : null,
    isActive: Boolean(form.isActive),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = buildPayload();

    if (!payload.title || !payload.code || payload.discountValue <= 0) {
      alert("Title, code and discount value are required");
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await API.put(`/offers/${editingId}`, payload);
        alert("Offer updated");
      } else {
        await API.post("/offers", payload);
        alert("Offer created");
      }
      resetForm();
      fetchOffers();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save offer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (offer) => {
    setEditingId(offer._id);
    setForm({
      title: offer.title || "",
      code: offer.code || "",
      description: offer.description || "",
      discountType: offer.discountType || "PERCENT",
      discountValue: offer.discountValue ?? "",
      minOrderAmount: offer.minOrderAmount ?? "",
      maxDiscountAmount: offer.maxDiscountAmount ?? "",
      startsAt: offer.startsAt ? new Date(offer.startsAt).toISOString().slice(0, 16) : "",
      expiresAt: offer.expiresAt ? new Date(offer.expiresAt).toISOString().slice(0, 16) : "",
      isActive: Boolean(offer.isActive),
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this offer?")) return;
    try {
      await API.delete(`/offers/${id}`);
      fetchOffers();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete offer");
    }
  };

  const toggleStatus = async (offer) => {
    try {
      await API.put(`/offers/${offer._id}`, { isActive: !offer.isActive });
      fetchOffers();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update offer status");
    }
  };

  return (
    <div className="container-fluid">
      <h3 className="mb-3">Manage Offers</h3>

      <form className="card p-3 mb-4" onSubmit={handleSubmit}>
        <div className="row g-2">
          <div className="col-md-4">
            <input
              className="form-control"
              name="title"
              placeholder="Offer title"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-2">
            <input
              className="form-control"
              name="code"
              placeholder="Code"
              value={form.code}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-3">
            <select className="form-select" name="discountType" value={form.discountType} onChange={handleChange}>
              <option value="PERCENT">Percent</option>
              <option value="FIXED">Fixed</option>
            </select>
          </div>
          <div className="col-md-3">
            <input
              type="number"
              className="form-control"
              name="discountValue"
              placeholder="Discount value"
              value={form.discountValue}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-4">
            <input
              type="number"
              className="form-control"
              name="minOrderAmount"
              placeholder="Min order amount"
              value={form.minOrderAmount}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-4">
            <input
              type="number"
              className="form-control"
              name="maxDiscountAmount"
              placeholder="Max discount (for %)"
              value={form.maxDiscountAmount}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              name="description"
              placeholder="Short description"
              value={form.description}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-4">
            <input
              type="datetime-local"
              className="form-control"
              name="startsAt"
              value={form.startsAt}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-4">
            <input
              type="datetime-local"
              className="form-control"
              name="expiresAt"
              value={form.expiresAt}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-4 d-flex align-items-center">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="isActive">
                Active
              </label>
            </div>
          </div>
        </div>

        <div className="d-flex gap-2 mt-3">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving..." : editingId ? "Update Offer" : "Create Offer"}
          </button>
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p>Loading offers...</p>
      ) : offers.length === 0 ? (
        <p className="text-muted">No offers found.</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Title</th>
              <th>Code</th>
              <th>Type</th>
              <th>Value</th>
              <th>Min Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer._id}>
                <td>{offer.title}</td>
                <td>{offer.code}</td>
                <td>{offer.discountType}</td>
                <td>{offer.discountType === "PERCENT" ? `${offer.discountValue}%` : `INR ${offer.discountValue}`}</td>
                <td>INR {offer.minOrderAmount || 0}</td>
                <td>{offer.isActive ? "Active" : "Inactive"}</td>
                <td className="d-flex gap-2">
                  <button className="btn btn-sm btn-warning" onClick={() => handleEdit(offer)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => toggleStatus(offer)}>
                    {offer.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(offer._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManageOffers;
