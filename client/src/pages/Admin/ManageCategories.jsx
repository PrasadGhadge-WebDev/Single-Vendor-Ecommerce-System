import React, { useState, useEffect, useContext } from "react";
import API, { uploadURL } from "../../api";
import { AuthContext } from "../../context/AuthContext";

const ManageCategories = () => {
  const { user } = useContext(AuthContext);

  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryImage, setEditCategoryImage] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // 🔥 Fetch Categories
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

  // 🔥 Add Category (Fixed Image Upload)
  const addCategory = async () => {
    if (!newCategory.trim()) return alert("Enter category name");

    if (!user?.isAdmin) return alert("Admin only");

    const formData = new FormData();
    formData.append("name", newCategory);
    if (newImage) formData.append("image", newImage);

    setLoading(true);
    try {
      await API.post("/categories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Category added successfully");
      setNewCategory("");
      setNewImage(null);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Error adding category");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Delete Category
  const deleteCategory = async (id) => {
    if (!user?.isAdmin) return alert("Admin only");

    if (!window.confirm("Delete this category?")) return;

    try {
      await API.delete(`/categories/${id}`);
      alert("Category deleted");
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  // 🔥 Start Edit
  const startEdit = (cat) => {
    setEditCategoryId(cat._id);
    setEditCategoryName(cat.name);
    setEditCategoryImage(null);
  };

  // 🔥 Cancel Edit
  const cancelEdit = () => {
    setEditCategoryId(null);
    setEditCategoryName("");
    setEditCategoryImage(null);
  };

  // 🔥 Update Category (Fixed Image Upload)
  const updateCategory = async () => {
    if (!editCategoryName.trim()) return alert("Enter category name");

    if (!user?.isAdmin) return alert("Admin only");

    const formData = new FormData();
    formData.append("name", editCategoryName);
    if (editCategoryImage) formData.append("image", editCategoryImage);

    setEditLoading(true);
    try {
      await API.put(`/categories/${editCategoryId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Category updated");
      cancelEdit();
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="container mt-4" style={{ maxWidth: "700px" }}>
      <h3>Manage Categories</h3>

      {/* Add Category */}
      <div className="d-flex mb-3">
        <input
          type="text"
          className="form-control me-2"
          placeholder="New category"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />

        <input
          type="file"
          className="form-control me-2"
          onChange={(e) => setNewImage(e.target.files[0])}
        />

        <button className="btn btn-primary" onClick={addCategory} disabled={loading}>
          {loading ? "Adding..." : "Add"}
        </button>
      </div>

      {/* Category List */}
      {categories.length === 0 ? (
        <p className="text-muted">No categories found</p>
      ) : (
        <ul className="list-group">
          {categories.map((cat) => (
            <li
              key={cat._id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div className="d-flex align-items-center">
                {cat.image && (
                  <img
                    src={`${uploadURL}/${cat.image}`}
                    alt={cat.name}
                    style={{ width: "40px", marginRight: "10px" }}
                  />
                )}

                {editCategoryId === cat._id ? (
                  <>
                    <input
                      type="text"
                      className="form-control me-2"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                    />
                    <input
                      type="file"
                      className="form-control"
                      onChange={(e) => setEditCategoryImage(e.target.files[0])}
                    />
                  </>
                ) : (
                  <span>{cat.name}</span>
                )}
              </div>

              <div>
                {editCategoryId === cat._id ? (
                  <>
                    <button
                      className="btn btn-success btn-sm me-2"
                      onClick={updateCategory}
                      disabled={editLoading}
                    >
                      {editLoading ? "Updating..." : "Update"}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-warning btn-sm me-2"
                      onClick={() => startEdit(cat)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteCategory(cat._id)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ManageCategories;