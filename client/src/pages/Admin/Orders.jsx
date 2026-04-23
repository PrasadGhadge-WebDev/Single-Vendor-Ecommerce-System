import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import API from "../../api";
import { AuthContext } from "../../context/AuthContext";
import { downloadCsv, inDateRange } from "../../utils/adminHelpers";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";
import { FaFileInvoice } from "react-icons/fa";
import "./Orders.css";

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

  const handlePrintInvoice = async (orderId) => {
    try {
      const { data: bill } = await API.get(`/business-settings/bills/${orderId}`);
      
      const popup = window.open("", "_blank", "width=900,height=700");
      if (!popup) {
        toast.error("Popup blocked! Please allow popups to print invoices.");
        return;
      }
      
      const rows = bill.order.items
        .map((item, index) =>
            `<tr><td>${index + 1}</td><td>${item.productName}</td><td>${item.quantity}</td><td>${item.unitPrice}</td><td>${item.lineTotal}</td></tr>`
        ).join("");

      const printable = `
        <html><head><title>Invoice ${bill.invoiceNumber}</title>
        <style>
          body{font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;padding:40px;color:#333;line-height:1.6}
          .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;border-bottom:2px solid #eee;padding-bottom:20px}
          .logo{font-size:24px;font-weight:bold;color:#1a73e8}
          .invoice-info{text-align:right}
          table{width:100%;border-collapse:collapse;margin:25px 0}
          th{background:#f8f9fa;color:#666;text-transform:uppercase;font-size:12px;letter-spacing:1px}
          td,th{border:1px solid #eee;padding:12px;text-align:left}
          .totals{margin-left:auto;width:300px}
          .total-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}
          .grand-total{font-size:18px;font-weight:bold;color:#000;border-bottom:2px solid #333;margin-top:10px}
          .footer{margin-top:50px;font-size:12px;color:#999;text-align:center}
          @media print { .no-print { display: none; } }
        </style>
        </head><body>
        <div class="header">
          <div class="logo">${bill.business.businessName || bill.business.storeName}</div>
          <div class="invoice-info">
            <h2>INVOICE</h2>
            <p>#${bill.invoiceNumber}</p>
            <p>Date: ${new Date(bill.order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:30px">
          <div>
            <strong>Billing To:</strong>
            <p>${bill.customer.name}<br>${bill.customer.email || ""}</p>
          </div>
          <div style="text-align:right">
            <strong>From:</strong>
            <p>${bill.business.businessName}<br>${bill.business.address || ""}<br>${bill.business.phone || ""}</p>
          </div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totals">
          <div class="total-row"><span>Subtotal</span><span>INR ${bill.order.subtotalAmount}</span></div>
          <div class="total-row"><span>Discount</span><span>- INR ${bill.order.discountAmount}</span></div>
          <div class="total-row"><span>Tax (${bill.order.taxPercent}%)</span><span>INR ${bill.order.taxAmount}</span></div>
          <div class="total-row grand-total"><span>Grand Total</span><span>INR ${bill.order.grandTotal}</span></div>
        </div>
        <div class="footer">${bill.footerNote || "Thank you for your business!"}</div>
        </body></html>`;

      popup.document.write(printable);
      popup.document.close();
      popup.focus();
      setTimeout(() => {
        popup.print();
        // popup.close(); // Optional: close automatically after printing
      }, 500);
    } catch (error) {
      toast.error("Error generating invoice: " + (error.response?.data?.message || error.message));
    }
  };

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
    <div className="orders-page">
      <div className="orders-toolbar d-flex justify-content-between align-items-center mb-3">
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

      <div className="card orders-filters p-3 mb-3">
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
        <p className="orders-state">Loading orders...</p>
      ) : filteredOrders.length === 0 ? (
        <p className="orders-state text-muted">No orders found</p>
      ) : (
        <div className="orders-table-wrap">
          <table className="table table-striped mt-3 orders-table">
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
                    <td className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={statusSaving[order._id]}
                        onClick={() => handleApplyStatus(order)}
                        title="Update Status"
                      >
                        {statusSaving[order._id] ? "Updating..." : "Update"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success"
                        onClick={() => handlePrintInvoice(order._id)}
                        title="Print Invoice"
                      >
                        <FaFileInvoice />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination currentPage={orderPage} totalPages={totalOrderPages} onPageChange={setOrderPage} />
    </div>
  );
};

export default Orders;
