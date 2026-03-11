import React, { useState, useEffect, useContext, useMemo } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import API, { getImageUrl } from "../../api";
import { AuthContext } from "../../context/AuthContext";
import { downloadCsv, inDateRange } from "../../utils/adminHelpers";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";

const CATEGORIES_PER_PAGE = 8;

const ManageCategories = () => {
  const { user } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [categoryPage, setCategoryPage] = useState(1);

  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryImage, setEditCategoryImage] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const { data } = await API.get("/categories");
      setCategories(Array.isArray(data) ? data : data.categories || []);
    } catch (err) {
      console.error(err);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = setInterval(() => fetchCategories(), 30000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  const addCategory = async () => {
    if (!newCategory.trim()) return toast.warning("Enter category name");
    if (!user?.isAdmin) return toast.warning("Admin only");

    const formData = new FormData();
    formData.append("name", newCategory);
    if (newImage) formData.append("image", newImage);

    setLoading(true);
    try {
      await API.post("/categories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setNewCategory("");
      setNewImage(null);
      setShowAddForm(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error adding category");
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!user?.isAdmin) return toast.warning("Admin only");
    if (!window.confirm("Delete this category?")) return;

    try {
      await API.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const startEdit = (category) => {
    setEditCategoryId(category._id);
    setEditCategoryName(category.name);
    setEditCategoryImage(null);
  };

  const cancelEdit = () => {
    setEditCategoryId(null);
    setEditCategoryName("");
    setEditCategoryImage(null);
  };

  const updateCategory = async () => {
    if (!editCategoryName.trim()) return toast.warning("Enter category name");
    if (!user?.isAdmin) return toast.warning("Admin only");

    const formData = new FormData();
    formData.append("name", editCategoryName);
    if (editCategoryImage) formData.append("image", editCategoryImage);

    setEditLoading(true);
    try {
      await API.put(`/categories/${editCategoryId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      cancelEdit();
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setEditLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    return categories.filter((category) => {
      if ((dateFrom || dateTo) && !inDateRange(category.createdAt, dateFrom, dateTo)) return false;
      if (!term) return true;
      return String(category.name || "")
        .toLowerCase()
        .includes(term);
    });
  }, [categories, search, dateFrom, dateTo]);

  useEffect(() => {
    setCategoryPage(1);
  }, [search, dateFrom, dateTo]);

  const totalCategoryPages = Math.max(1, Math.ceil(filteredCategories.length / CATEGORIES_PER_PAGE));

  useEffect(() => {
    if (categoryPage > totalCategoryPages) {
      setCategoryPage(totalCategoryPages);
    }
  }, [categoryPage, totalCategoryPages]);

  const paginatedCategories = useMemo(() => {
    const startIndex = (categoryPage - 1) * CATEGORIES_PER_PAGE;
    return filteredCategories.slice(startIndex, startIndex + CATEGORIES_PER_PAGE);
  }, [filteredCategories, categoryPage]);

  const exportCategories = () => {
    downloadCsv(
      "categories.csv",
      filteredCategories.map((category) => ({
        name: category.name,
        image: category.image || "",
        createdAt: category.createdAt || "",
      }))
    );
  };

  return (
    <div className="container mt-4" style={{ maxWidth: "900px" }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Manage Categories</h3>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-success btn-sm d-inline-flex align-items-center gap-1"
            onClick={() => {
              setShowAddForm((prev) => !prev);
              if (showAddForm) {
                setNewCategory("");
                setNewImage(null);
              }
            }}
            aria-label={showAddForm ? "Close category form" : "Open category add form"}
            title={showAddForm ? "Close category form" : "Add category"}
          >
            {showAddForm ? (
              <>
                <FaTimes />
                <span>Close category form</span>
              </>
            ) : (
              <>
                <FaPlus />
                <span>Add category</span>
              </>
            )}
          </button>
          <button className="btn btn-outline-primary btn-sm" onClick={fetchCategories}>
            Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={exportCategories}>
            Export CSV
          </button>
        </div>
      </div>



      <div className="card p-3 mb-3">
        {showAddForm && (
          <div className="d-flex mb-3">
            <input
              type="text"
              className="form-control me-2"
              placeholder="New category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />

            <input type="file" className="form-control me-2" onChange={(e) => setNewImage(e.target.files[0])} />

            <button className="btn btn-primary me-2" onClick={addCategory} disabled={loading}>
              {loading ? "Adding category..." : "Add category"}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setShowAddForm(false);
                setNewCategory("");
                setNewImage(null);
              }}
            >
              Cancel
            </button>
          </div>
        )}

        <div className="row g-2">
          <div className="col-md-4">
            <input className="form-control" placeholder="Search categories" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="col-md-3">
            <input type="datetime-local" className="form-control" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="col-md-3">
            <input type="datetime-local" className="form-control" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="col-md-2 d-flex align-items-center">
            <div className="form-check">
              <input
                id="categoriesAutoRefresh"
                className="form-check-input"
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="categoriesAutoRefresh">
                Auto 30s
              </label>
            </div>
          </div>
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <p className="text-muted">No categories found</p>
      ) : (
        <ul className="list-group">
          {paginatedCategories.map((category) => (
            <li key={category._id} className="list-group-item d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                {category.image && (
                  <img src={getImageUrl(category.image)} alt={category.name} style={{ width: "40px", marginRight: "10px" }} />
                )}

                {editCategoryId === category._id ? (
                  <>
                    <input type="text" className="form-control me-2" value={editCategoryName} onChange={(e) => setEditCategoryName(e.target.value)} />
                    <input type="file" className="form-control" onChange={(e) => setEditCategoryImage(e.target.files[0])} />
                  </>
                ) : (
                  <span>{category.name}</span>
                )}
              </div>

              <div>
                {editCategoryId === category._id ? (
                  <>
                    <button className="btn btn-success btn-sm me-2" onClick={updateCategory} disabled={editLoading}>
                      {editLoading ? "Updating..." : "Update"}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-warning btn-sm me-2" onClick={() => startEdit(category)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteCategory(category._id)}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
          </ul>
      )}
      <Pagination currentPage={categoryPage} totalPages={totalCategoryPages} onPageChange={setCategoryPage} />
    </div>
  );
};

export default ManageCategories;
