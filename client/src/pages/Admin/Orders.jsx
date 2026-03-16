import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import API from "../../api";
import { AuthContext } from "../../context/AuthContext";
import { downloadCsv, inDateRange } from "../../utils/adminHelpers";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";

const ORDERS_PER_PAGE = 12;

const Orders = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [orderPage, setOrderPage] = useState(1);
  const [statusUpdates, setStatusUpdates] = useState({});
  const [statusSaving, setStatusSaving] = useState({});

  const fetchOrders = useCallback(async (showLoader = true) => {
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
  }, [user?.token]);

  const handleStatusInputChange = (orderId, field, value) => {
    setStatusUpdates((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value,
      },
    }));
  };

  const handleApplyStatus = async (order) => {
    const update = statusUpdates[order._id] || {};
    const nextStatus = update.status || order.status;
    const description = (update.description || "").trim();
    if (!description) {
      toast.warning("Description is required before updating the status");
      return;
    }
    try {
      setStatusSaving((prev) => ({ ...prev, [order._id]: true }));
      await API.put(`/orders/${order._id}`, {
        status: nextStatus,
        description,
      });
      toast.success("Order status updated");
      setStatusUpdates((prev) => ({ ...prev, [order._id]: { status: nextStatus, description: "" } }));
      fetchOrders(false);
    } catch (error) {
      toast.error("Error updating status: " + (error.response?.data?.message || error.message));
    } finally {
      setStatusSaving((prev) => ({ ...prev, [order._id]: false }));
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = setInterval(() => fetchOrders(false), 30000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchOrders]);

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

  useEffect(() => {
    setOrderPage(1);
  }, [statusFilter, search, dateFrom, dateTo]);

  const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));

  useEffect(() => {
    if (orderPage > totalOrderPages) {
      setOrderPage(totalOrderPages);
    }
  }, [orderPage, totalOrderPages]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (orderPage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ORDERS_PER_PAGE);
  }, [filteredOrders, orderPage]);

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
              <th>Note</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map((order) => {
              const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
              const lastNote = history[history.length - 1];
              const update = statusUpdates[order._id] || {};
              const selectedStatus = update.status || order.status;
              const descriptionValue = update.description || "";
              return (
                <tr key={order._id}>
                  <td>{order._id}</td>
                  <td>{order.user?.name || "Unknown"}</td>
                  <td>INR {order.totalAmount}</td>
                  <td>
                    <select
                      value={selectedStatus}
                      onChange={(e) => handleStatusInputChange(order._id, "status", e.target.value)}
                      className="form-select form-select-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <small className="text-muted d-block mt-1">
                      Latest note: {lastNote?.description || "No description yet"}
                    </small>
                  </td>
                  <td>
                    <textarea
                      rows={2}
                      className="form-control form-control-sm"
                      value={descriptionValue}
                      placeholder="Describe the status update"
                      onChange={(e) => handleStatusInputChange(order._id, "description", e.target.value)}
                    />
                  </td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      disabled={statusSaving[order._id]}
                      onClick={() => handleApplyStatus(order)}
                    >
                      {statusSaving[order._id] ? "Updating..." : "Update"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <Pagination currentPage={orderPage} totalPages={totalOrderPages} onPageChange={setOrderPage} />
    </div>
  );
};

export default Orders;
