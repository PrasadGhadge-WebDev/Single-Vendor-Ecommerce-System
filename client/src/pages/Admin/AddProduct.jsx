import React, { useState, useContext, useEffect } from "react";
import API from "../../api";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";

const AddProduct = () => {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    newCategory: "",
    stock: "",
    supplier: "",
  });

  const [categories, setCategories] = useState([
    "Electronics",
    "Clothing",
    "Books",
    "Beauty",
    "Sports"
  ]); // Default categories
  const [suppliers, setSuppliers] = useState([]);

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load categories from API if available
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await API.get("/categories");
        const cats = data.categories || data;
        console.log("Categories from API:", cats); // Debug
        if (Array.isArray(cats) && cats.length > 0) {
          // Use correct field, fallback to 'name' or 'title'
          const apiCategories = cats.map((c) => c.name || c.title || c.category || c);
          setCategories(apiCategories);
        }
      } catch (err) {
        console.error("Unable to fetch categories, using default", err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const { data } = await API.get("/suppliers");
        setSuppliers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Unable to fetch suppliers", err);
      }
    };
    loadSuppliers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !user.token) {
      toast.warning("Please login as admin");
      return;
    }

    const formData = new FormData();
    const finalCategory = form.newCategory.trim() || form.category;
    Object.keys(form).forEach((key) => {
      if (key === "newCategory") return;
      if (key === "category") {
        formData.append("category", finalCategory);
        return;
      }
      formData.append(key, form[key]);
    });
    if (image) formData.append("image", image);

    setLoading(true);
    try {
      await API.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("Product added successfully");
      setForm({ name: "", description: "", price: "", category: "", newCategory: "", stock: "", supplier: "" });
      setImage(null);
      window.dispatchEvent(new Event('products-updated'));
    } catch (error) {
      toast.error("Error adding product: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4" style={{ maxWidth: "500px" }}>
      <h3>Add Product</h3>

      <form onSubmit={handleSubmit}>
        <input
          className="form-control mb-2"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <textarea
          className="form-control mb-2"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />

        <input
          type="number"
          className="form-control mb-2"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />

        <select
          className="form-select mb-2"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option value="">
            Select category (optional)
          </option>
          {categories.map((cat, index) => (
            <option key={index} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <input
          type="text"
          className="form-control mb-2"
          placeholder="New category (optional)"
          value={form.newCategory}
          onChange={(e) => setForm({ ...form, newCategory: e.target.value })}
        />

        <input
          type="number"
          className="form-control mb-2"
          placeholder="Stock"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
          required
        />

        <select
          className="form-select mb-2"
          value={form.supplier}
          onChange={(e) => setForm({ ...form, supplier: e.target.value })}
        >
          <option value="">Select supplier (optional)</option>
          {suppliers.map((supplier) => (
            <option key={supplier._id} value={supplier._id}>
              {supplier.name} {supplier.company ? `(${supplier.company})` : ""}
            </option>
          ))}
        </select>

        <input
          type="file"
          className="form-control mb-3"
          onChange={(e) => setImage(e.target.files[0])}
          required
        />

        <button className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Adding..." : "Add Product"}
        </button>
      </form>
    </div>
  );
};

export default AddProduct;
