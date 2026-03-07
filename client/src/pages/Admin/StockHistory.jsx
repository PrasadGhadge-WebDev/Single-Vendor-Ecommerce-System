import React, { useEffect, useState } from "react";
import API from "../../api";

const StockHistory = () => {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState("");
  const [productId, setProductId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  const fetchProducts = async () => {
    try {
      const { data } = await API.get("/products");
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (eventType) params.eventType = eventType;
      if (productId) params.productId = productId;
      if (search.trim()) params.search = search.trim();
      if (dateFrom) params.dateFrom = new Date(dateFrom).toISOString();
      if (dateTo) params.dateTo = new Date(dateTo).toISOString();

      const { data } = await API.get("/stock-history", { params });
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load stock history");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchHistory();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [eventType, productId, dateFrom, dateTo]);

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Stock History</h3>
        <button className="btn btn-outline-primary btn-sm" onClick={fetchHistory}>
          Refresh
        </button>
      </div>

      <div className="card p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-3">
            <select className="form-select" value={eventType} onChange={(e) => setEventType(e.target.value)}>
              <option value="">All Events</option>
              <option value="PURCHASE">Purchase</option>
              <option value="SALE">Sale</option>
              <option value="CANCELLATION_RESTOCK">Cancellation Restock</option>
              <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
              <option value="INITIAL_STOCK">Initial Stock</option>
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <input type="datetime-local" className="form-control" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="col-md-2">
            <input type="datetime-local" className="form-control" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="col-md-2">
            <input
              className="form-control"
              placeholder="Search note/ref"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchHistory();
              }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading stock history...</p>
      ) : items.length === 0 ? (
        <p className="text-muted">No stock history found.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Event</th>
                <th>Change</th>
                <th>Previous</th>
                <th>New</th>
                <th>Reference</th>
                <th>By</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {items.map((entry) => (
                <tr key={entry._id}>
                  <td>{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "-"}</td>
                  <td>{entry.product?.name || "-"}</td>
                  <td>{entry.eventType}</td>
                  <td className={Number(entry.quantityChange) >= 0 ? "text-success" : "text-danger"}>
                    {Number(entry.quantityChange) >= 0 ? "+" : ""}
                    {entry.quantityChange}
                  </td>
                  <td>{entry.previousStock}</td>
                  <td>{entry.newStock}</td>
                  <td>
                    {entry.referenceType || "-"}
                    {entry.referenceId ? ` (${entry.referenceId.slice(-8)})` : ""}
                  </td>
                  <td>{entry.actor?.name || "System"}</td>
                  <td>{entry.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StockHistory;
