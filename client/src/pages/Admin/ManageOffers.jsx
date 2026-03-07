import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import API from "../../api";
import { downloadCsv, inDateRange } from "../../utils/adminHelpers";

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchOffers = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const { data } = await API.get("/offers");
      setOffers(Array.isArray(data) ? data : []);
    } catch {
      alert("Failed to load offers");
      setOffers([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = setInterval(() => fetchOffers(false), 30000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowCreateForm(false);
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
      } else {
        await API.post("/offers", payload);
      }
      resetForm();
      fetchOffers(false);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save offer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (offer) => {
    setEditingId(offer._id);
    setShowCreateForm(true);
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
      fetchOffers(false);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete offer");
    }
  };

  const toggleStatus = async (offer) => {
    try {
      await API.put(`/offers/${offer._id}`, { isActive: !offer.isActive });
      fetchOffers(false);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update offer status");
    }
  };

  const filteredOffers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return offers.filter((offer) => {
      if (statusFilter === "active" && !offer.isActive) return false;
      if (statusFilter === "inactive" && offer.isActive) return false;
      if (typeFilter !== "all" && offer.discountType !== typeFilter) return false;
      if ((dateFrom || dateTo) && !inDateRange(offer.createdAt, dateFrom, dateTo)) return false;
      if (!term) return true;
      const haystack = `${offer.title} ${offer.code} ${offer.description || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [offers, search, statusFilter, typeFilter, dateFrom, dateTo]);

  const exportOffers = () => {
    downloadCsv(
      "offers.csv",
      filteredOffers.map((offer) => ({
        title: offer.title,
        code: offer.code,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        minOrderAmount: offer.minOrderAmount || 0,
        startsAt: offer.startsAt || "",
        expiresAt: offer.expiresAt || "",
        isActive: offer.isActive ? "Yes" : "No",
      }))
    );
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Manage Offers</h3>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-success btn-sm d-inline-flex align-items-center gap-1"
            onClick={() => {
              setShowCreateForm((prev) => !prev);
              if (showCreateForm) {
                setForm(initialForm);
                setEditingId(null);
              }
            }}
            aria-label={showCreateForm ? "Close offer form" : "Open offer form"}
            title={showCreateForm ? "Close offer form" : "Add offer"}
          >
            {showCreateForm ? <FaTimes /> : <FaPlus />}
          </button>
          <button className="btn btn-outline-primary btn-sm" onClick={() => fetchOffers()}>
            Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={exportOffers}>
            Export CSV
          </button>
        </div>
      </div>

      {showCreateForm && (
      <form className="card p-3 mb-4" onSubmit={handleSubmit}>
        <div className="row g-2">
          <div className="col-md-4">
            <input className="form-control" name="title" placeholder="Offer title" value={form.title} onChange={handleChange} required />
          </div>
          <div className="col-md-2">
            <input className="form-control" name="code" placeholder="Code" value={form.code} onChange={handleChange} required />
          </div>
          <div className="col-md-3">
            <select className="form-select" name="discountType" value={form.discountType} onChange={handleChange}>
              <option value="PERCENT">Percent</option>
              <option value="FIXED">Fixed</option>
            </select>
          </div>
          <div className="col-md-3">
            <input type="number" className="form-control" name="discountValue" placeholder="Discount value" value={form.discountValue} onChange={handleChange} required />
          </div>
          <div className="col-md-4">
            <input type="number" className="form-control" name="minOrderAmount" placeholder="Min order amount" value={form.minOrderAmount} onChange={handleChange} />
          </div>
          <div className="col-md-4">
            <input type="number" className="form-control" name="maxDiscountAmount" placeholder="Max discount (for %)" value={form.maxDiscountAmount} onChange={handleChange} />
          </div>
          <div className="col-md-4">
            <input type="text" className="form-control" name="description" placeholder="Short description" value={form.description} onChange={handleChange} />
          </div>
          <div className="col-md-4">
            <input type="datetime-local" className="form-control" name="startsAt" value={form.startsAt} onChange={handleChange} />
          </div>
          <div className="col-md-4">
            <input type="datetime-local" className="form-control" name="expiresAt" value={form.expiresAt} onChange={handleChange} />
          </div>
          <div className="col-md-4 d-flex align-items-center">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="isActive" name="isActive" checked={form.isActive} onChange={handleChange} />
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
          <button type="button" className="btn btn-secondary" onClick={resetForm}>
            {editingId ? "Cancel Edit" : "Cancel"}
          </button>
        </div>
      </form>
      )}

      <div className="card p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-3">
            <input className="form-control" placeholder="Search title/code/description" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="col-md-2">
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="PERCENT">Percent</option>
              <option value="FIXED">Fixed</option>
            </select>
          </div>
          <div className="col-md-2">
            <input type="datetime-local" className="form-control" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="col-md-2">
            <input type="datetime-local" className="form-control" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="col-md-1 d-flex align-items-center">
            <div className="form-check">
              <input
                id="offersAutoRefresh"
                className="form-check-input"
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="offersAutoRefresh">
                Auto
              </label>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading offers...</p>
      ) : filteredOffers.length === 0 ? (
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
            {filteredOffers.map((offer) => (
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
