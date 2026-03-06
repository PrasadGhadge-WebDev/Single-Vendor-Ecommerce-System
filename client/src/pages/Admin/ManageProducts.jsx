import React, { useEffect, useState } from "react";
import API, { getImageUrl } from "../../api";
import { AuthContext } from "../../context/AuthContext";

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    image: null,
  });

  const fetchProducts = async () => {
    try {
      const { data } = await API.get("/products");
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await API.delete(`/products/${id}`);
      alert("Product deleted successfully");
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

  const updateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const updateData = new FormData();
      updateData.append("name", formData.name);
      updateData.append("price", formData.price);
      updateData.append("stock", formData.stock);
      if (formData.image) updateData.append("image", formData.image);

      await API.put(`/products/${editingProduct._id}`, updateData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Product updated successfully");
      setEditingProduct(null);
      fetchProducts();
      window.dispatchEvent(new Event("products-updated"));
    } catch (error) {
      alert("Error updating product: " + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div>
      <h3>Manage Products</h3>

      {products.length === 0 ? (
        <p className="text-muted">No products found</p>
      ) : (
        <table className="table table-bordered mt-3">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td>{p.image ? <img src={getImageUrl(p.image)} width="60" alt={p.name} /> : "-"}</td>
                <td>{p.name}</td>
                <td>INR {p.price}</td>
                <td>{p.stock}</td>
                <td>
                  <button className="btn btn-primary btn-sm me-2" onClick={() => startEdit(p)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteProduct(p._id)}>
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
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label>Price</label>
                    <input
                      type="number"
                      name="price"
                      className="form-control"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label>Stock</label>
                    <input
                      type="number"
                      name="stock"
                      className="form-control"
                      value={formData.stock}
                      onChange={handleInputChange}
                      required
                    />
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
    </div>
  );
};

export default ManageProducts;
