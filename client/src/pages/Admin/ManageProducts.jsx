import React, { useEffect, useMemo, useState } from "react";
import API, { getImageUrl } from "../../api";
import { downloadCsv, inDateRange } from "../../utils/adminHelpers";
import { FaPlus } from "react-icons/fa";

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    supplier: "",
    image: null,
  });
  const [addForm, setAddForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    newCategory: "",
    stock: "",
    supplier: "",
    image: null,
  });

  const fetchProducts = async (showLoader = false) => {
    try {
      const { data } = await API.get("/products");
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching products:", error);
      if (showLoader) alert("Failed to load products");
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data } = await API.get("/suppliers");
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await API.get("/categories");
      const list = Array.isArray(data) ? data : data?.categories || [];
      setCategories(Array.isArray(list) ? list.map((c) => c.name || c.title || c).filter(Boolean) : []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await API.delete(`/products/${id}`);
      fetchProducts();
      window.dispatchEvent(new Event("products-updated"));
    } catch (error) {
      alert("Error deleting product: " + (error.response?.data?.message || error.message));
    }
  };

  const startEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      stock: product.stock,
      supplier: product.supplier?._id || product.supplier || "",
      image: null,
    });
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setFormData((prev) => ({ ...prev, image: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setAddForm((prev) => ({ ...prev, image: files[0] || null }));
    } else {
      setAddForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const resetAddForm = () => {
    setAddForm({
      name: "",
      description: "",
      price: "",
      category: "",
      newCategory: "",
      stock: "",
      supplier: "",
      image: null,
    });
  };

  const createProduct = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.price || addForm.stock === "") {
      alert("Name, price and stock are required");
      return;
    }

    try {
      setAddingProduct(true);
      const finalCategory = addForm.newCategory.trim() || addForm.category;
      const payload = new FormData();
      payload.append("name", addForm.name);
      payload.append("description", addForm.description);
      payload.append("price", addForm.price);
      payload.append("category", finalCategory);
      payload.append("stock", addForm.stock);
      payload.append("supplier", addForm.supplier);
      if (addForm.image) payload.append("image", addForm.image);

      await API.post("/products", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setShowAddModal(false);
      resetAddForm();
      fetchProducts();
      window.dispatchEvent(new Event("products-updated"));
    } catch (error) {
      alert("Error adding product: " + (error.response?.data?.message || error.message));
    } finally {
      setAddingProduct(false);
    }
  };

  const updateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const updateData = new FormData();
      updateData.append("name", formData.name);
      updateData.append("price", formData.price);
      updateData.append("stock", formData.stock);
      updateData.append("supplier", formData.supplier);
      if (formData.image) updateData.append("image", formData.image);

      await API.put(`/products/${editingProduct._id}`, updateData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setEditingProduct(null);
      fetchProducts();
      window.dispatchEvent(new Event("products-updated"));
    } catch (error) {
      alert("Error updating product: " + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    fetchProducts(true);
    fetchSuppliers();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = setInterval(() => fetchProducts(), 30000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  const categoryOptions = useMemo(
    () => Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort(),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      if (categoryFilter !== "all" && product.category !== categoryFilter) return false;
      if (stockFilter === "in-stock" && Number(product.stock || 0) <= 0) return false;
      if (stockFilter === "out-of-stock" && Number(product.stock || 0) > 0) return false;
      if (supplierFilter !== "all") {
        const currentSupplierId = product.supplier?._id || String(product.supplier || "");
        if (currentSupplierId !== supplierFilter) return false;
      }
      if ((dateFrom || dateTo) && !inDateRange(product.createdAt, dateFrom, dateTo)) return false;
      if (!term) return true;
      const haystack = `${product.name} ${product.category} ${product.supplier?.name || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [products, search, categoryFilter, stockFilter, supplierFilter, dateFrom, dateTo]);

  const exportProducts = () => {
    downloadCsv(
      "products.csv",
      filteredProducts.map((product) => ({
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        supplier: product.supplier?.name || "",
        createdAt: product.createdAt || "",
      }))
    );
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Manage Products</h3>
        <div className="d-flex gap-2">
          <button className="btn btn-success btn-sm" title="Add Product" onClick={() => setShowAddModal(true)}>
            <FaPlus /> Add
          </button>
          <button className="btn btn-outline-primary btn-sm" onClick={() => fetchProducts(true)}>
            Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={exportProducts}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="card p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-3">
            <input className="form-control" placeholder="Search product/category/supplier" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="col-md-2">
            <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
              <option value="all">All Stock</option>
              <option value="in-stock">In Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select" value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
              <option value="all">All Suppliers</option>
              {suppliers.map((supplier) => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-1">
            <input type="datetime-local" className="form-control" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="col-md-1">
            <input type="datetime-local" className="form-control" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="col-md-1 d-flex align-items-center">
            <div className="form-check">
              <input
                id="productsAutoRefresh"
                className="form-check-input"
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="productsAutoRefresh">
                Auto
              </label>
            </div>
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <p className="text-muted">No products found</p>
      ) : (
        <table className="table table-bordered mt-3">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Supplier</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product._id}>
                <td>{product.image ? <img src={getImageUrl(product.image)} width="60" alt={product.name} /> : "-"}</td>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>INR {product.price}</td>
                <td>{product.stock}</td>
                <td>{product.supplier?.name || "-"}</td>
                <td>
                  <button className="btn btn-primary btn-sm me-2" onClick={() => startEdit(product)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteProduct(product._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editingProduct && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={updateProduct}>
                <div className="modal-header">
                  <h5 className="modal-title">Edit Product</h5>
                  <button type="button" className="btn-close" onClick={() => setEditingProduct(null)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label>Name</label>
                    <input type="text" name="name" className="form-control" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div className="mb-3">
                    <label>Price</label>
                    <input type="number" name="price" className="form-control" value={formData.price} onChange={handleInputChange} required />
                  </div>
                  <div className="mb-3">
                    <label>Stock</label>
                    <input type="number" name="stock" className="form-control" value={formData.stock} onChange={handleInputChange} required />
                  </div>
                  <div className="mb-3">
                    <label>Supplier</label>
                    <select name="supplier" className="form-select" value={formData.supplier} onChange={handleInputChange}>
                      <option value="">Select supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.name} {supplier.company ? `(${supplier.company})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label>Image (optional)</label>
                    <input type="file" name="image" className="form-control" onChange={handleInputChange} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingProduct(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={createProduct}>
                <div className="modal-header">
                  <h5 className="modal-title">Add Product</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label>Name</label>
                    <input type="text" name="name" className="form-control" value={addForm.name} onChange={handleAddInputChange} required />
                  </div>
                  <div className="mb-3">
                    <label>Description</label>
                    <textarea name="description" className="form-control" value={addForm.description} onChange={handleAddInputChange} rows={3} />
                  </div>
                  <div className="mb-3">
                    <label>Category</label>
                    <select name="category" className="form-select" value={addForm.category} onChange={handleAddInputChange}>
                      <option value="">Select category (optional)</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label>New Category (optional)</label>
                    <input
                      type="text"
                      name="newCategory"
                      className="form-control"
                      value={addForm.newCategory}
                      onChange={handleAddInputChange}
                      placeholder="Type new category name"
                    />
                  </div>
                  <div className="mb-3">
                    <label>Price</label>
                    <input type="number" name="price" className="form-control" value={addForm.price} onChange={handleAddInputChange} required />
                  </div>
                  <div className="mb-3">
                    <label>Stock</label>
                    <input type="number" name="stock" className="form-control" value={addForm.stock} onChange={handleAddInputChange} required />
                  </div>
                  <div className="mb-3">
                    <label>Supplier</label>
                    <select name="supplier" className="form-select" value={addForm.supplier} onChange={handleAddInputChange}>
                      <option value="">Select supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.name} {supplier.company ? `(${supplier.company})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label>Image</label>
                    <input type="file" name="image" className="form-control" onChange={handleAddInputChange} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success" disabled={addingProduct}>
                    {addingProduct ? "Adding..." : "Add Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProducts;
