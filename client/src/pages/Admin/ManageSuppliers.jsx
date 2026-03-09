import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import API from "../../api";
import { downloadCsv, inDateRange } from "../../utils/adminHelpers";
import { toast } from "react-toastify";

const supplierInitialForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  isActive: true,
};

const purchaseInitialForm = {
  supplierId: "",
  productId: "",
  quantity: "",
  unitCost: "",
  purchaseDate: "",
  invoiceNumber: "",
  paymentStatus: "PENDING",
  notes: "",
};

const ManageSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");

  const [loading, setLoading] = useState(false);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [activeModuleSection, setActiveModuleSection] = useState("");

  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierStatusFilter, setSupplierStatusFilter] = useState("all");
  const [supplierDateFrom, setSupplierDateFrom] = useState("");
  const [supplierDateTo, setSupplierDateTo] = useState("");
  const [purchaseSupplierFilter, setPurchaseSupplierFilter] = useState("all");
  const [purchaseDateFrom, setPurchaseDateFrom] = useState("");
  const [purchaseDateTo, setPurchaseDateTo] = useState("");

  const [supplierForm, setSupplierForm] = useState(supplierInitialForm);
  const [purchaseForm, setPurchaseForm] = useState(purchaseInitialForm);

  const selectedSupplier = useMemo(
    () => suppliers.find((supplier) => supplier._id === selectedSupplierId) || null,
    [suppliers, selectedSupplierId]
  );

  const fetchSuppliers = async () => {
    const { data } = await API.get("/suppliers");
    setSuppliers(Array.isArray(data) ? data : []);
  };

  const fetchProducts = async () => {
    const { data } = await API.get("/products?limit=500&sortBy=createdAt&order=desc");
    const list = Array.isArray(data) ? data : data?.products || [];
    setProducts(Array.isArray(list) ? list : []);
  };

  const fetchPurchases = async () => {
    const params = {};
    if (purchaseDateFrom) params.dateFrom = new Date(purchaseDateFrom).toISOString();
    if (purchaseDateTo) params.dateTo = new Date(purchaseDateTo).toISOString();
    if (purchaseSupplierFilter !== "all") params.supplierId = purchaseSupplierFilter;
    const { data } = await API.get("/suppliers/purchases", { params });
    setPurchases(Array.isArray(data) ? data : []);
  };

  const fetchAnalytics = async () => {
    const params = {};
    if (purchaseDateFrom) params.dateFrom = new Date(purchaseDateFrom).toISOString();
    if (purchaseDateTo) params.dateTo = new Date(purchaseDateTo).toISOString();
    const { data } = await API.get("/suppliers/analytics/overview", { params });
    setAnalytics(data || null);
  };

  const fetchSupplierProducts = async (supplierId) => {
    if (!supplierId) {
      setSupplierProducts([]);
      return;
    }
    const { data } = await API.get(`/suppliers/${supplierId}/products`);
    setSupplierProducts(Array.isArray(data) ? data : []);
  };

  const fetchAll = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      await Promise.all([fetchSuppliers(), fetchProducts(), fetchPurchases(), fetchAnalytics()]);
    } catch (error) {
      console.error("Supplier data load error:", error);
      toast.error(error.response?.data?.message || "Failed to load  data");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    fetchPurchases();
    fetchAnalytics();
  }, [purchaseDateFrom, purchaseDateTo, purchaseSupplierFilter]);

  useEffect(() => {
    fetchSupplierProducts(selectedSupplierId).catch((error) => {
      console.error(error);
      setSupplierProducts([]);
    });
  }, [selectedSupplierId]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = setInterval(() => fetchAll(false), 30000);
    return () => clearInterval(timer);
  }, [autoRefresh, purchaseDateFrom, purchaseDateTo, purchaseSupplierFilter]);

  const handleSupplierChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSupplierForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePurchaseChange = (e) => {
    const { name, value } = e.target;
    setPurchaseForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetSupplierForm = () => {
    setSupplierForm(supplierInitialForm);
    setEditingSupplierId(null);
    setShowSupplierForm(false);
  };

  const toggleSupplierForm = () => {
    if (activeModuleSection !== "suppliers") {
      setActiveModuleSection("suppliers");
      setShowSupplierForm(true);
      setEditingSupplierId(null);
      setSupplierForm(supplierInitialForm);
      return;
    }

    setShowSupplierForm((prev) => {
      const next = !prev;
      if (!next) {
        setSupplierForm(supplierInitialForm);
        setEditingSupplierId(null);
      }
      return next;
    });
  };

  const onSaveSupplier = async (e) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) {
      toast.warning("Supplier name is required");
      return;
    }

    try {
      setSavingSupplier(true);
      if (editingSupplierId) {
        await API.put(`/suppliers/${editingSupplierId}`, supplierForm);
      } else {
        await API.post("/suppliers", supplierForm);
      }
      await fetchSuppliers();
      await fetchAnalytics();
      toast.success(editingSupplierId ? "Supplier updated" : "Supplier created");
      resetSupplierForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save supplier");
    } finally {
      setSavingSupplier(false);
    }
  };

  const onEditSupplier = (supplier) => {
    setEditingSupplierId(supplier._id);
    setShowSupplierForm(true);
    setSupplierForm({
      name: supplier.name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      company: supplier.company || "",
      address: supplier.address || "",
      isActive: Boolean(supplier.isActive),
    });
  };

  const onDeleteSupplier = async (supplierId) => {
    if (!window.confirm("Delete this supplier?")) return;
    try {
      await API.delete(`/suppliers/${supplierId}`);
      await fetchSuppliers();
      await fetchAnalytics();
      if (selectedSupplierId === supplierId) {
        setSelectedSupplierId("");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete supplier");
    }
  };

  const onCreatePurchase = async (e) => {
    e.preventDefault();

    const qty = Number(purchaseForm.quantity);
    const cost = Number(purchaseForm.unitCost);
    if (!purchaseForm.supplierId || !purchaseForm.productId || qty <= 0 || Number.isNaN(cost) || cost < 0) {
      toast.warning("Supplier, product, quantity and unit cost are required");
      return;
    }

    try {
      setSavingPurchase(true);
      await API.post("/suppliers/purchases", {
        ...purchaseForm,
        quantity: qty,
        unitCost: cost,
      });
      setPurchaseForm(purchaseInitialForm);
      await Promise.all([fetchPurchases(), fetchProducts(), fetchAnalytics()]);
      if (selectedSupplierId) {
        await fetchSupplierProducts(selectedSupplierId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create purchase");
    } finally {
      setSavingPurchase(false);
    }
  };

  const filteredSuppliers = useMemo(() => {
    const term = supplierSearch.trim().toLowerCase();
    return suppliers.filter((supplier) => {
      if (supplierStatusFilter === "active" && !supplier.isActive) return false;
      if (supplierStatusFilter === "inactive" && supplier.isActive) return false;
      if ((supplierDateFrom || supplierDateTo) && !inDateRange(supplier.createdAt, supplierDateFrom, supplierDateTo)) return false;
      if (!term) return true;
      const haystack = `${supplier.name} ${supplier.company || ""} ${supplier.email || ""} ${supplier.phone || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [suppliers, supplierSearch, supplierStatusFilter, supplierDateFrom, supplierDateTo]);

  const exportSuppliers = () => {
    downloadCsv(
      "suppliers.csv",
      filteredSuppliers.map((supplier) => ({
        name: supplier.name,
        company: supplier.company || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        isActive: supplier.isActive ? "Yes" : "No",
        createdAt: supplier.createdAt || "",
      }))
    );
  };

  const exportPurchases = () => {
    downloadCsv(
      "supplier-purchases.csv",
      purchases.map((purchase) => ({
        supplier: purchase.supplier?.name || "",
        product: purchase.product?.name || "",
        quantity: purchase.quantity,
        unitCost: purchase.unitCost,
        totalCost: purchase.totalCost,
        purchaseDate: purchase.purchaseDate || purchase.createdAt || "",
      }))
    );
  };

  const exportSupplierProducts = () => {
    downloadCsv(
      "supplier-products.csv",
      supplierProducts.map((product) => ({
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
      }))
    );
  };

  return (
    
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
        <div>
          <h3 className="mb-1">Supplier Module</h3>
          <div className="d-flex flex-wrap gap-2">
            {[
              { value: "record-purchase", label: "Record Purchase" },
              { value: "suppliers", label: "Suppliers" },
              { value: "recent-purchases", label: "Recent Purchases" },
              { value: "product-source", label: "Product Source Tracking" },
            ].map((section) => (
              <button
                key={section.value}
                type="button"
                className={`btn btn-sm ${activeModuleSection === section.value ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setActiveModuleSection(section.value)}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-success btn-sm d-inline-flex align-items-center gap-1"
            onClick={toggleSupplierForm}
            aria-label={showSupplierForm ? "Close supplier form" : "Open supplier form"}
            title={showSupplierForm ? "Close supplier form" : "Add supplier"}
          >
            {showSupplierForm ? <FaTimes /> : <FaPlus />}
          </button>
          <button className="btn btn-outline-primary btn-sm" onClick={() => fetchAll()}>
            Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={exportSuppliers}>
            Export Suppliers
          </button>
          <button className="btn btn-outline-primary btn-sm" onClick={exportPurchases}>
            Export Purchases
          </button>
        </div>
      </div>
         <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card p-3 h-100">
                <small className="text-muted">Suppliers</small>
                <h5 className="mb-0">{analytics?.suppliers?.total || suppliers.length}</h5>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card p-3 h-100">
                <small className="text-muted">Active Suppliers</small>
                <h5 className="mb-0">{analytics?.suppliers?.active || 0}</h5>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card p-3 h-100">
                <small className="text-muted">Total Purchases</small>
                <h5 className="mb-0">{analytics?.purchases?.totalPurchases || purchases.length}</h5>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card p-3 h-100">
                <small className="text-muted">Purchase Amount</small>
                <h5 className="mb-0">INR {(analytics?.purchases?.totalPurchaseAmount || 0).toFixed(2)}</h5>
              </div>
            </div>
          </div>

      {loading ? (
        <p>Loading supplier module...</p>
      ) : (
        <>
          {!activeModuleSection ? (
            <div className="card p-3 mb-3">
              <p className="mb-0 text-muted">Choose a module option above to view its filters and data.</p>
            </div>
          ) : activeModuleSection === "suppliers" ? (
            <div className="card p-3 mb-3">
              <h5 className="mb-3">Supplier Filters</h5>
              <div className="row g-2">
                <div className="col-12">
                  <input
                    className="form-control"
                    placeholder="Search supplier"
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <select className="form-select" value={supplierStatusFilter} onChange={(e) => setSupplierStatusFilter(e.target.value)}>
                    <option value="all">All Supplier Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <div className="row g-2">
                    <div className="col-md-6">
                      <input type="datetime-local" className="form-control" value={supplierDateFrom} onChange={(e) => setSupplierDateFrom(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <input type="datetime-local" className="form-control" value={supplierDateTo} onChange={(e) => setSupplierDateTo(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="col-12 text-end">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => {
                      setSupplierSearch("");
                      setSupplierStatusFilter("all");
                      setSupplierDateFrom("");
                      setSupplierDateTo("");
                    }}
                  >
                    Reset Supplier Filters
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-3 mb-3">
              <h5 className="mb-3">Purchase Filters</h5>
              <div className="row g-2 align-items-center">
                <div className="col-md-12">
                  <select className="form-select" value={purchaseSupplierFilter} onChange={(e) => setPurchaseSupplierFilter(e.target.value)}>
                    <option value="all">All Purchase Suppliers</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <input type="datetime-local" className="form-control" value={purchaseDateFrom} onChange={(e) => setPurchaseDateFrom(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <input type="datetime-local" className="form-control" value={purchaseDateTo} onChange={(e) => setPurchaseDateTo(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <div className="form-check">
                    <input
                      id="suppliersAutoRefresh"
                      className="form-check-input"
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="suppliersAutoRefresh">
                      Auto refresh
                    </label>
                  </div>
                </div>
                <div className="col-md-6 text-end">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => {
                      setPurchaseSupplierFilter("all");
                      setPurchaseDateFrom("");
                      setPurchaseDateTo("");
                    }}
                  >
                    Reset Purchase Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeModuleSection === "record-purchase" && (
            <div className="card p-3 mt-4">
              <h5>Record Purchase (Inventory Tracking)</h5>
              <form onSubmit={onCreatePurchase}>
                <div className="row g-2">
                  <div className="col-md-6">
                    <select className="form-select" name="supplierId" value={purchaseForm.supplierId} onChange={handlePurchaseChange} required>
                      <option value="">Select supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.name} {supplier.company ? `(${supplier.company})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <select className="form-select" name="productId" value={purchaseForm.productId} onChange={handlePurchaseChange} required>
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name} (stock: {product.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <input type="number" min="1" className="form-control" name="quantity" placeholder="Quantity" value={purchaseForm.quantity} onChange={handlePurchaseChange} required />
                  </div>
                  <div className="col-md-4">
                    <input type="number" min="0" step="0.01" className="form-control" name="unitCost" placeholder="Unit cost" value={purchaseForm.unitCost} onChange={handlePurchaseChange} required />
                  </div>
                  <div className="col-md-4">
                    <input type="datetime-local" className="form-control" name="purchaseDate" value={purchaseForm.purchaseDate} onChange={handlePurchaseChange} />
                  </div>
                  <div className="col-md-6">
                    <input className="form-control" name="invoiceNumber" placeholder="Invoice number" value={purchaseForm.invoiceNumber} onChange={handlePurchaseChange} />
                  </div>
                  <div className="col-md-6">
                    <select className="form-select" name="paymentStatus" value={purchaseForm.paymentStatus} onChange={handlePurchaseChange}>
                      <option value="PENDING">Pending</option>
                      <option value="PARTIAL">Partial</option>
                      <option value="PAID">Paid</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <textarea className="form-control" rows="2" name="notes" placeholder="Notes" value={purchaseForm.notes} onChange={handlePurchaseChange} />
                  </div>
                </div>
                <div className="mt-3">
                  <button className="btn btn-success" type="submit" disabled={savingPurchase}>
                    {savingPurchase ? "Saving..." : "Record Purchase"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeModuleSection === "suppliers" && (
            <>
              {showSupplierForm && (
                <form className="card p-3 mt-4" onSubmit={onSaveSupplier}>
                  <h5>{editingSupplierId ? "Edit Supplier" : "Add Supplier"}</h5>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <input className="form-control" name="name" placeholder="Name" value={supplierForm.name} onChange={handleSupplierChange} required />
                    </div>
                    <div className="col-md-6">
                      <input className="form-control" name="company" placeholder="Company" value={supplierForm.company} onChange={handleSupplierChange} />
                    </div>
                    <div className="col-md-6">
                      <input type="email" className="form-control" name="email" placeholder="Email" value={supplierForm.email} onChange={handleSupplierChange} />
                    </div>
                    <div className="col-md-6">
                      <input className="form-control" name="phone" placeholder="Phone" value={supplierForm.phone} onChange={handleSupplierChange} />
                    </div>
                    <div className="col-12">
                      <textarea className="form-control" name="address" placeholder="Address" rows="2" value={supplierForm.address} onChange={handleSupplierChange} />
                    </div>
                    <div className="col-12">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="supplierActive"
                          name="isActive"
                          checked={supplierForm.isActive}
                          onChange={handleSupplierChange}
                        />
                        <label className="form-check-label" htmlFor="supplierActive">
                          Active
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 d-flex gap-2">
                    <button className="btn btn-primary" type="submit" disabled={savingSupplier}>
                      {savingSupplier ? "Saving..." : editingSupplierId ? "Update Supplier" : "Create Supplier"}
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={resetSupplierForm}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="card p-3 mt-4">
                <h5 className="mb-3">Suppliers</h5>
                {filteredSuppliers.length === 0 ? (
                  <p className="text-muted mb-0">No suppliers found.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped align-middle">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Company</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSuppliers.map((supplier) => (
                          <tr key={supplier._id}>
                            <td>{supplier.name}</td>
                            <td>{supplier.company || "-"}</td>
                            <td>{supplier.email || "-"}</td>
                            <td>{supplier.phone || "-"}</td>
                            <td>{supplier.isActive ? "Active" : "Inactive"}</td>
                            <td className="d-flex gap-2">
                              <button type="button" className="btn btn-sm btn-warning" onClick={() => onEditSupplier(supplier)}>
                                Edit
                              </button>
                              <button type="button" className="btn btn-sm btn-danger" onClick={() => onDeleteSupplier(supplier._id)}>
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {activeModuleSection === "recent-purchases" && (
            <div className="card p-3 mt-4">
              <h5>Recent Purchases</h5>
              {purchases.length === 0 ? (
                <p className="text-muted mb-0">No purchases yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th>Supplier</th>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.slice(0, 8).map((purchase) => (
                        <tr key={purchase._id}>
                          <td>{purchase.supplier?.name || "-"}</td>
                          <td>{purchase.product?.name || "-"}</td>
                          <td>{purchase.quantity}</td>
                          <td>INR {Number(purchase.totalCost || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeModuleSection === "product-source" && (
              <div className="card p-3 mt-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="mb-0">Product Source Tracking</h5>
                  <button className="btn btn-outline-primary btn-sm" onClick={exportSupplierProducts}>
                    Export Sources
                  </button>
                </div>
                <div className="dropdown mb-3">
                  <button
                    className="btn btn-outline-secondary dropdown-toggle w-100 text-start"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {selectedSupplier ? selectedSupplier.name : "Select supplier"}
                  </button>
                  <ul className="dropdown-menu w-100">
                    <li>
                      <button className="dropdown-item" type="button" onClick={() => setSelectedSupplierId("")}>
                        Select supplier
                      </button>
                    </li>
                    {suppliers.map((supplier) => (
                      <li key={supplier._id}>
                        <button className="dropdown-item" type="button" onClick={() => setSelectedSupplierId(supplier._id)}>
                          {supplier.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {!selectedSupplier ? (
                  <p className="text-muted mb-0">Select a supplier to view sourced products.</p>
                ) : supplierProducts.length === 0 ? (
                <p className="text-muted mb-0">No products linked with this supplier.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierProducts.map((product) => (
                        <tr key={product._id}>
                          <td>{product.name}</td>
                          <td>{product.category}</td>
                          <td>INR {product.price}</td>
                          <td>{product.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManageSuppliers;
