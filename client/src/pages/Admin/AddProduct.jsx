import React, { useState, useContext, useEffect } from "react";
import API from "../../api";
import { AuthContext } from "../../context/AuthContext";

const AddProduct = () => {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: ""
  });

  const [categories, setCategories] = useState([
    "Electronics",
    "Clothing",
    "Books",
    "Beauty",
    "Sports"
  ]); // Default categories

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !user.token) {
      alert("Please login as admin");
      return;
    }

    const formData = new FormData();
    Object.keys(form).forEach((key) => formData.append(key, form[key]));
    if (image) formData.append("image", image);

    setLoading(true);
    try {
      await API.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert("Product Added Successfully");
      setForm({ name: "", description: "", price: "", category: "", stock: "" });
      setImage(null);
      window.dispatchEvent(new Event('products-updated'));
    } catch (error) {
      alert("Error adding product: " + (error.response?.data?.message || error.message));
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
          required
        >
          <option value="" disabled>
            Select category...
          </option>
          {categories.map((cat, index) => (
            <option key={index} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <input
          type="number"
          className="form-control mb-2"
          placeholder="Stock"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
          required
        />

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