import React, { useState, useEffect, useContext, useMemo } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import API, { getImageUrl } from "../../api";
import { AuthContext } from "../../context/AuthContext";
import { downloadCsv, inDateRange } from "../../utils/adminHelpers";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";
import "./Dashboard.css";
import "./ManageCategories.css";

const CATEGORIES_PER_PAGE = 8;

const ManageCategories = () => {
  const { user } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [newSubCategories, setNewSubCategories] = useState([]);
  const [newSubCategoryInput, setNewSubCategoryInput] = useState("");
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
  const [editSubCategories, setEditSubCategories] = useState([]);
  const [editSubCategoryInput, setEditSubCategoryInput] = useState("");
  const [editCategoryImage, setEditCategoryImage] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const normalizeSubCategory = (value) => value.trim();

  const addSubCategoryItem = (value, setter) => {
    const item = normalizeSubCategory(value);
    if (!item) return false;

    let added = false;
    setter((prev) => {
      if (prev.some((subCategory) => subCategory.toLowerCase() === item.toLowerCase())) {
        return prev;
      }
      added = true;
      return [...prev, item];
    });
    return added;
  };

  const removeSubCategoryItem = (value, setter) => {
    setter((prev) => prev.filter((subCategory) => subCategory !== value));
  };

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
    formData.append("subCategories", JSON.stringify(newSubCategories));
    if (newImage) formData.append("image", newImage);

    setLoading(true);
    try {
      await API.post("/categories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setNewCategory("");
      setNewSubCategories([]);
      setNewSubCategoryInput("");
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
    setEditSubCategories(Array.isArray(category.subCategories) ? category.subCategories : []);
    setEditSubCategoryInput("");
    setEditCategoryImage(null);
  };

  const cancelEdit = () => {
    setEditCategoryId(null);
    setEditCategoryName("");
    setEditSubCategories([]);
    setEditSubCategoryInput("");
    setEditCategoryImage(null);
  };

  const updateCategory = async () => {
    if (!editCategoryName.trim()) return toast.warning("Enter category name");
    if (!user?.isAdmin) return toast.warning("Admin only");

    const formData = new FormData();
    formData.append("name", editCategoryName);
    formData.append("subCategories", JSON.stringify(editSubCategories));
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
        subCategories: Array.isArray(category.subCategories) ? category.subCategories.join(", ") : "",
        image: category.image || "",
        createdAt: category.createdAt || "",
      }))
    );
  };

  const handleNewSubCategoryAdd = () => {
    const added = addSubCategoryItem(newSubCategoryInput, setNewSubCategories);
    if (added) setNewSubCategoryInput("");
  };

  const handleEditSubCategoryAdd = () => {
    const added = addSubCategoryItem(editSubCategoryInput, setEditSubCategories);
    if (added) setEditSubCategoryInput("");
  };

  const renderSubCategoryEditor = ({
    items,
    inputValue,
    setInputValue,
    onAdd,
    onRemove,
    placeholder,
  }) => (
    <div className="category-subcategory-editor">
      <div className="input-group category-subcategory-input-group">
        <input
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
        />
        <button type="button" className="btn btn-outline-primary category-chip-add-btn" onClick={onAdd}>
          Add
        </button>
      </div>
      {items.length > 0 && (
        <div className="category-chip-list">
          {items.map((subCategory) => (
            <span key={subCategory} className="category-chip">
              {subCategory}
              <button
                type="button"
                className="category-chip-remove"
                onClick={() => onRemove(subCategory)}
                aria-label={`Remove ${subCategory}`}
              >
                <FaTimes />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="dashboard-wrap manage-categories-page">
      <div>
        <div className="dashboard-hero-copy">
          {/* <p className="dashboard-kicker mb-1">Catalog Control</p> */}
          {/* <h2 className="mb-1">Manage Categories</h2> */}
          {/* <p className="mb-0">Organize category groups, update images, and maintain clean subcategory lists.</p> */}
        </div>
        {/* <div className="dashboard-hero-chip">
          <span>{filteredCategories.length} categories</span>
        </div> */}
      </div>

      <div className="dashboard-export-actions">
          <button
            type="button"
            className="btn btn-success btn-sm d-inline-flex align-items-center gap-1"
            onClick={() => {
              setShowAddForm((prev) => !prev);
              if (showAddForm) {
                setNewCategory("");
                setNewSubCategories([]);
                setNewSubCategoryInput("");
                setNewImage(null);
              }
            }}
            aria-label={showAddForm ? "Close category form" : "Open category add form"}
            title={showAddForm ? "Close category form" : "Add category"}
          >
            {showAddForm ? (
              <>
                <FaTimes />
                <span>Close form</span>
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

      <div className="dashboard-toolbar card border-0 p-3">
        {showAddForm && (
          <div className="dashboard-panel card border-0 manage-categories-create-panel mb-3">
            <div className="dashboard-panel-head">
              <h5 className="dashboard-panel-title mb-0">Add Category</h5>
            </div>
            <div className="row g-3">
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="New category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
              </div>
              <div className="col-md-5">
                {renderSubCategoryEditor({
                  items: newSubCategories,
                  inputValue: newSubCategoryInput,
                  setInputValue: setNewSubCategoryInput,
                  onAdd: handleNewSubCategoryAdd,
                  onRemove: (value) => removeSubCategoryItem(value, setNewSubCategories),
                  placeholder: "Type subcategory and click Add",
                })}
              </div>
              <div className="col-md-3">
                <div className="manage-categories-file-block">
                  <input type="file" className="form-control" onChange={(e) => setNewImage(e.target.files[0])} />
                  <div className="d-flex gap-2 mt-3">
                    <button className="btn btn-primary flex-fill" onClick={addCategory} disabled={loading}>
                      {loading ? "Adding..." : "Add"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewCategory("");
                        setNewSubCategories([]);
                        setNewSubCategoryInput("");
                        setNewImage(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label mb-1">Search</label>
            <input className="form-control" placeholder="Search categories" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="col-md-3">
            <label className="form-label mb-1">From</label>
            <input type="datetime-local" className="form-control" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="col-md-3">
            <label className="form-label mb-1">To</label>
            <input type="datetime-local" className="form-control" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="col-md-2">
            <div className="form-check form-switch dashboard-refresh-toggle">
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
        <div className="dashboard-panel card border-0">
          <div className="dashboard-panel-head">
            <h5 className="dashboard-panel-title mb-0">Category List</h5>
          </div>
          <ul className="list-group manage-categories-list">
            {paginatedCategories.map((category) => (
              <li key={category._id} className="list-group-item manage-category-item">
                <div className="manage-category-main">
                  {category.image && (
                    <img src={getImageUrl(category.image)} alt={category.name} className="manage-category-thumb" loading="lazy" decoding="async" />
                  )}

                  {editCategoryId === category._id ? (
                    <div className="manage-category-edit-grid">
                      <input
                        type="text"
                        className="form-control"
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                      />
                      <div>
                        {renderSubCategoryEditor({
                          items: editSubCategories,
                          inputValue: editSubCategoryInput,
                          setInputValue: setEditSubCategoryInput,
                          onAdd: handleEditSubCategoryAdd,
                          onRemove: (value) => removeSubCategoryItem(value, setEditSubCategories),
                          placeholder: "Type subcategory and click Add",
                        })}
                      </div>
                      <input
                        type="file"
                        className="form-control"
                        onChange={(e) => setEditCategoryImage(e.target.files[0])}
                      />
                    </div>
                  ) : (
                    <div className="manage-category-copy">
                      <div className="manage-category-title">{category.name}</div>
                      {Array.isArray(category.subCategories) && category.subCategories.length > 0 && (
                        <div className="manage-category-chip-preview">
                          {category.subCategories.map((subCategory) => (
                            <span key={subCategory} className="manage-category-preview-chip">
                              {subCategory}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="manage-category-actions">
                  {editCategoryId === category._id ? (
                    <>
                      <button className="btn btn-success btn-sm" onClick={updateCategory} disabled={editLoading}>
                        {editLoading ? "Updating..." : "Update"}
                      </button>
                      <button className="btn btn-outline-secondary btn-sm" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-warning btn-sm" onClick={() => startEdit(category)}>
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
        </div>
      )}
      <Pagination currentPage={categoryPage} totalPages={totalCategoryPages} onPageChange={setCategoryPage} />
    </div>
  );
};

export default ManageCategories;
