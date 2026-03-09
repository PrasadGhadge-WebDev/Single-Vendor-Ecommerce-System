import React, { useContext, useEffect, useMemo, useState } from "react";
import API from "../../api";
import { AuthContext } from "../../context/AuthContext";
import { downloadCsv, inDateRange } from "../../utils/adminHelpers";
import { toast } from "react-toastify";

const Orders = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchOrders = async (showLoader = true) => {
    if (!user?.token) return;

    try {
      if (showLoader) setLoading(true);
      const { data } = await API.get("/orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await API.put(`/orders/${orderId}`, { status });
      fetchOrders(false);
    } catch (error) {
      toast.error("Error updating status: " + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = setInterval(() => fetchOrders(false), 30000);
    return () => clearInterval(timer);
  }, [autoRefresh, user]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if ((dateFrom || dateTo) && !inDateRange(order.createdAt, dateFrom, dateTo)) return false;
      if (!term) return true;
      const haystack = `${order._id} ${order.user?.name || ""} ${order.user?.email || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [orders, statusFilter, search, dateFrom, dateTo]);

  const exportOrders = () => {
    downloadCsv(
      "orders.csv",
      filteredOrders.map((order) => ({
        orderId: order._id,
        user: order.user?.name || "Unknown",
        email: order.user?.email || "",
        total: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
      }))
    );
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Orders</h3>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm" onClick={() => fetchOrders()}>
            Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={exportOrders}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="card p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Search by order id / user"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="col-md-2">
            <input type="datetime-local" className="form-control" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="col-md-2">
            <input type="datetime-local" className="form-control" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="col-md-2 d-flex align-items-center">
            <div className="form-check">
              <input
                id="ordersAutoRefresh"
                className="form-check-input"
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="ordersAutoRefresh">
                Real-time (30s)
              </label>
            </div>
          </div>
          <div className="col-md-1">
            <button
              className="btn btn-outline-secondary w-100"
              onClick={() => {
                setStatusFilter("all");
                setSearch("");
                setDateFrom("");
                setDateTo("");
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading orders...</p>
      ) : filteredOrders.length === 0 ? (
        <p className="text-muted">No orders found</p>
      ) : (
        <table className="table table-striped mt-3">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>User</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order._id}>
                <td>{order._id}</td>
                <td>{order.user?.name || "Unknown"}</td>
                <td>INR {order.totalAmount}</td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                    className="form-select form-select-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td>{new Date(order.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Orders;
