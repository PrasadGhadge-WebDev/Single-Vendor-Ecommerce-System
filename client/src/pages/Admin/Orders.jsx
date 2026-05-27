import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import API from "../../api";
import { AuthContext } from "../../context/AuthContext";
import { downloadCsv, inDateRange } from "../../utils/adminHelpers";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";
import { FaFileInvoice, FaSearch, FaChevronDown, FaEdit, FaTrash, FaFileCsv, FaSync, FaShoppingCart, FaUser, FaClock, FaCheckCircle, FaCreditCard } from "react-icons/fa";
import ConfirmModal from "../../components/ConfirmModal";

const ORDERS_PER_PAGE = 12;

const DEFAULT_STATUS_NOTES = {
  pending: "Order successfully placed by customer",
  confirmed: "Admin confirmed the order",
  processing: "Product is being prepared/packed",
  shipped: "Order shipped from warehouse",
  out_for_delivery: "Delivery partner is delivering order",
  delivered: "Order delivered successfully",
  cancelled: "Order cancelled",
  returned: "Customer returned the product",
};

const Orders = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [orderPage, setOrderPage] = useState(1);
  const [statusUpdates, setStatusUpdates] = useState({});
  const [statusSaving, setStatusSaving] = useState({});
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, orderId: null });

  const fetchOrders = useCallback(async (showLoader = true) => {
    if (!user?.token) return;

    try {
      if (showLoader) setLoading(true);
      const { data } = await API.get("/orders");
      const list = Array.isArray(data) ? data : [];
      setOrders(list);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [user?.token]);

  const handleStatusInputChange = (orderId, field, value) => {
    setStatusUpdates((prev) => {
      const existing = prev[orderId] || {};
      const newUpdate = { ...existing, [field]: value };
      
      // Auto-fill recommended note when status changes
      if (field === "status") {
        newUpdate.description = DEFAULT_STATUS_NOTES[value] || "";
      }
      
      return {
        ...prev,
        [orderId]: newUpdate,
      };
    });
  };

  const handleApplyStatus = async (order) => {
    const update = statusUpdates[order._id] || {};
    const nextStatus = update.status || order.status;
    const description = (update.description || "").trim();
    if (!description) {
      toast.warning("Status note is required");
      return;
    }
    try {
      setStatusSaving((prev) => ({ ...prev, [order._id]: true }));
      await API.put(`/orders/${order._id}`, {
        status: nextStatus,
        description,
      });
      toast.success("Transaction updated");
      setStatusUpdates((prev) => ({ ...prev, [order._id]: { status: nextStatus, description: "" } }));
      fetchOrders(false);
    } catch (error) {
      toast.error("Update failed: " + (error.response?.data?.message || error.message));
    } finally {
      setStatusSaving((prev) => ({ ...prev, [order._id]: false }));
    }
  };

  const handleMarkAsPaid = async (orderId) => {
    if (!orderId) return;
    try {
      setLoading(true);
      await API.put(`/orders/${orderId}/pay`);
      toast.success("Payment status updated to PAID");
      fetchOrders(false);
    } catch (error) {
      toast.error("Payment update failed: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
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
      
      // Smart Date Range Filtering
      if (dateRange !== "all") {
        const entryDate = new Date(order.createdAt);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (dateRange === "today") {
          if (entryDate < startOfToday) return false;
        } else if (dateRange === "7days") {
          const sevenDaysAgo = new Date(startOfToday);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          if (entryDate < sevenDaysAgo) return false;
        } else if (dateRange === "custom") {
          if ((dateFrom || dateTo) && !inDateRange(order.createdAt, dateFrom, dateTo)) return false;
        }
      }

      if (!term) return true;
      const haystack = `${order._id} ${order.user?.name || ""} ${order.user?.email || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [orders, statusFilter, search, dateRange, dateFrom, dateTo]);

  useEffect(() => {
    setOrderPage(1);
  }, [statusFilter, search, dateRange, dateFrom, dateTo]);

  const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const paginatedOrders = useMemo(() => {
    const startIndex = (orderPage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ORDERS_PER_PAGE);
  }, [filteredOrders, orderPage]);

  const handlePrintInvoice = async (orderId) => {
    if (!orderId) {
      toast.error("Invalid Order ID");
      return;
    }
    try {
      const { data: bill } = await API.get(`/business-settings/bills/${orderId}`);
      
      const popup = window.open("", "_blank", "width=900,height=850");
      if (!popup) {
        toast.error("Popup blocked!");
        return;
      }
      
      const rows = bill.order.items
        .map((item, index) =>
            `<tr>
              <td style="text-align: center;">${index + 1}</td>
              <td style="font-weight: 600;">${item.productName}</td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">${item.unitPrice.toLocaleString('en-IN')}</td>
              <td style="text-align: right; font-weight: 700;">${item.lineTotal.toLocaleString('en-IN')}</td>
            </tr>`
        ).join("");

      const printable = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice - ${bill.invoiceNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
              color: #1e293b; 
              line-height: 1.5; 
              background: #fff;
              padding: 50px;
            }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
            .brand-box h1 { font-size: 28px; font-weight: 800; color: #2563eb; letter-spacing: -0.02em; }
            .brand-box p { font-size: 12px; color: #64748b; font-weight: 500; margin-top: 4px; }
            
            .invoice-meta { text-align: right; }
            .invoice-meta h2 { font-size: 32px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
            .meta-item { display: flex; justify-content: flex-end; gap: 12px; font-size: 13px; margin-bottom: 4px; }
            .meta-label { color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
            .meta-value { color: #0f172a; font-weight: 700; }

            .address-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; padding: 24px; background: #f8fafc; border-radius: 16px; }
            .address-box h3 { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; }
            .address-content p { font-size: 14px; font-weight: 600; color: #1e293b; }
            .address-content .name { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
            .address-content .details { color: #475569; font-weight: 500; line-height: 1.4; }

            table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 30px; }
            th { 
              background: #0f172a; color: #fff; padding: 14px; font-size: 11px; 
              font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;
            }
            th:first-child { border-radius: 8px 0 0 0; }
            th:last-child { border-radius: 0 8px 0 0; }
            td { padding: 16px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            
            .totals-section { display: flex; justify-content: flex-end; margin-top: 20px; }
            .totals-box { width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
            .total-row span:first-child { color: #64748b; font-weight: 600; font-size: 13px; }
            .total-row span:last-child { color: #0f172a; font-weight: 700; font-size: 13px; }
            
            .grand-total-row { 
              display: flex; justify-content: space-between; padding: 16px 0; 
              margin-top: 10px; border-top: 2px solid #0f172a; 
            }
            .grand-total-row span:first-child { font-size: 16px; font-weight: 800; color: #0f172a; }
            .grand-total-row span:last-child { font-size: 20px; font-weight: 800; color: #2563eb; }

            .footer { margin-top: 60px; padding-top: 30px; border-top: 1px solid #e2e8f0; text-align: center; }
            .footer p { font-size: 12px; color: #94a3b8; font-weight: 500; }
            .footer .thank-you { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }

            @media print {
              body { padding: 0; }
              .invoice-container { width: 100%; max-width: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="brand-box">
                <h1>${bill.business.businessName || bill.business.storeName}</h1>
                <p>Premium Technology Ecosystem</p>
              </div>
              <div class="invoice-meta">
                <h2>INVOICE</h2>
                <div class="meta-item">
                  <span class="meta-label">Invoice No:</span>
                  <span class="meta-value">#${bill.invoiceNumber}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Date:</span>
                  <span class="meta-value">${new Date(bill.order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <div class="address-grid">
              <div class="address-box">
                <h3>Bill To</h3>
                <div class="address-content">
                  <p class="name">${bill.customer.name}</p>
                  <p class="details">${bill.customer.email || "No email provided"}</p>
                </div>
              </div>
              <div class="address-box" style="text-align: right;">
                <h3>From</h3>
                <div class="address-content">
                  <p class="name">${bill.business.businessName}</p>
                  <p class="details">
                    ${bill.business.address || "Main Street, Commerce City"}<br>
                    Phone: ${bill.business.phone || "Contact Support"}
                  </p>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 10%; text-align: center;">Item</th>
                  <th style="width: 50%; text-align: left;">Description</th>
                  <th style="width: 10%; text-align: center;">Qty</th>
                  <th style="width: 15%; text-align: right;">Unit Price</th>
                  <th style="width: 15%; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>

            <div class="totals-section">
              <div class="totals-box">
                <div class="total-row">
                  <span>Subtotal Amount</span>
                  <span>INR ${bill.order.subtotalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div class="total-row">
                  <span>Coupon Discount</span>
                  <span style="color: #ef4444;">- INR ${bill.order.discountAmount.toLocaleString('en-IN')}</span>
                </div>
                <div class="total-row">
                  <span>Tax GST (${bill.order.taxPercent}%)</span>
                  <span>INR ${bill.order.taxAmount.toLocaleString('en-IN')}</span>
                </div>
                <div class="grand-total-row">
                  <span>Grand Total</span>
                  <span>₹${bill.order.grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div class="footer">
              <p class="thank-you">${bill.footerNote || "Thank you for your business!"}</p>
              <p>This is a computer generated invoice and does not require a physical signature.</p>
              <p style="margin-top: 10px; font-size: 10px; opacity: 0.5;">${bill.business.businessName} &copy; ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body>
        </html>`;

      popup.document.write(printable);
      popup.document.close();
      popup.focus();
      setTimeout(() => {
        popup.print();
      }, 500);
    } catch (error) {
      toast.error("Error generating invoice: " + (error.response?.data?.message || error.message));
    }
  };

  const deleteOrder = (id) => {
    if (!id) {
      toast.error("Invalid Order ID");
      return;
    }
    setConfirmConfig({ isOpen: true, orderId: id });
  };

  const handleConfirmDeleteOrder = async () => {
    const id = confirmConfig.orderId;
    if (!id) return;
    
    try {
      await API.delete(`/orders/${id}`);
      toast.success("Order removed");
      setOrders((prev) => prev.filter((o) => o._id !== id));
    } catch (error) {
      toast.error("Delete failed: " + (error.response?.data?.message || error.message));
    }
  };

  const exportOrders = () => {
    downloadCsv(
      "order_records.csv",
      filteredOrders.map((order) => ({
        "Order ID": order._id,
        "Customer": order.user?.name || "Unknown",
        "Total Amount": order.totalAmount,
        "Status": order.status,
        "Transaction Date": order.createdAt,
      }))
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* V3 Premium Module Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 relative">
        <div className="relative group">
          <div className="absolute -left-8 -top-8 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-700" />
          <div className="flex items-start gap-4 relative">
            <div className="w-1.5 h-12 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full shadow-lg shadow-indigo-500/20" />
            <div>
              <h1 className="text-4xl font-black tracking-tight flex items-center gap-3" style={{ color: 'var(--page-text)' }}>
                Orders
                <span className="text-[10px] uppercase tracking-[0.3em] font-black px-2 py-1 bg-indigo-500/10 text-indigo-600 rounded-lg ml-2">
                  Commerce
                </span>
              </h1>
              <p className="text-sm font-bold opacity-40 uppercase tracking-[0.1em] mt-1.5">
                Transactional Intelligence & Logistics Fulfillment Console
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button 
            onClick={() => fetchOrders()}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border rounded-2xl hover:bg-slate-50 transition-all text-sm font-bold shadow-sm" 
            style={{ borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
          >
            <FaSync size={12} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={exportOrders}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <FaFileCsv size={12} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Suite */}
      <div className="p-4 bg-white dark:bg-slate-900/60 rounded-3xl border shadow-xl shadow-indigo-500/5 flex flex-col xl:flex-row gap-4 items-center" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex-grow w-full relative">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <FaSearch className="text-indigo-500/40" size={14} />
          </div>
          <input
            type="text"
            placeholder="Search by Order ID, Customer Name or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-6 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500/30 transition-all outline-none"
            style={{ paddingLeft: '52px', color: 'var(--page-text)' }}
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full xl:w-auto shrink-0">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
            >
              <option value="all">Fulfillment</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="out_for_delivery">Out For Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
            </select>
            <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
          </div>

          <div className="relative">
            <select 
              className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="all">Transaction Date</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
          </div>

          <button 
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setDateRange("all");
              fetchOrders(true);
            }}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Professional High-Density Data Grid */}
      <div className="bg-white dark:bg-slate-900/60 rounded-3xl border shadow-xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <th className="w-[12%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Order Ref</th>
                <th className="w-[18%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Customer</th>
                <th className="w-[10%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Value</th>
                <th className="w-[15%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Logistics Status</th>
                <th className="w-[20%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Status Note</th>
                <th className="w-[10%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Timeline</th>
                <th className="w-[15%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800" style={{ borderColor: 'var(--border-color)' }}>
              {paginatedOrders.map((order, idx) => {
                const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
                const lastNote = history[history.length - 1];
                const update = statusUpdates[order._id] || {};
                const selectedStatus = update.status || order.status;
                const descriptionValue = update.description || "";
                
                return (
                  <tr 
                    key={order._id || idx} 
                    className={`group transition-all duration-200 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/30 dark:bg-slate-800/20'} hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5`}
                  >
                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <FaShoppingCart className="text-indigo-500/40" size={12} />
                        <span className="font-black text-[11px] tracking-tight text-indigo-600 uppercase">#{order._id?.slice(-8).toUpperCase() || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                      <div className="truncate">
                        <p className="font-bold text-sm truncate" style={{ color: 'var(--page-text)' }}>{order.user?.name || "Unknown"}</p>
                        <p className="text-[9px] font-bold opacity-30 truncate">{order.user?.email || "No email"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                      <p className="text-sm font-black text-emerald-600">₹{(order.totalAmount || 0).toLocaleString()}</p>
                      {order.isPaid ? (
                        <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full mt-1 inline-block border border-emerald-500/20">Paid</span>
                      ) : (
                        <span className="text-[8px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full mt-1 inline-block border border-amber-500/20">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                      <div className="space-y-1.5">
                        <div className="relative">
                          <select
                            value={selectedStatus}
                            onChange={(e) => handleStatusInputChange(order._id, "status", e.target.value)}
                            className="w-full pl-2 pr-6 py-1 bg-slate-100 dark:bg-slate-800 border-0 rounded-lg text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="out_for_delivery">Out For Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="returned">Returned</option>
                          </select>
                          <FaChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={8} />
                        </div>
                        <p className="text-[9px] font-bold opacity-40 uppercase truncate">Current: {order.status}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        <textarea
                          rows={1}
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-medium outline-none focus:border-indigo-500/50 transition-all resize-none"
                          value={descriptionValue}
                          placeholder="Update note..."
                          onChange={(e) => handleStatusInputChange(order._id, "description", e.target.value)}
                        />
                        <p className="text-[8px] font-bold opacity-30 uppercase truncate">Latest: {lastNote?.description || "N/A"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 opacity-60">
                        <FaClock size={10} />
                        <p className="text-[10px] font-bold">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleApplyStatus(order)}
                          disabled={statusSaving[order._id]}
                          className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/10 active:scale-95 disabled:opacity-50"
                          title="Apply Status"
                        >
                          <FaCheckCircle size={12} />
                        </button>
                        {order.status === "delivered" && !order.isPaid && (
                          <button
                            onClick={() => handleMarkAsPaid(order._id)}
                            className="p-2 bg-amber-500/10 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white transition-all shadow-md shadow-amber-600/10 active:scale-95"
                            title="Mark As Paid"
                          >
                            <FaCreditCard size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => handlePrintInvoice(order._id)}
                          className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                          title="Invoice"
                        >
                          <FaFileInvoice size={12} />
                        </button>
                        <button
                          onClick={() => deleteOrder(order._id)}
                          className="p-2 hover:bg-rose-600 hover:text-white rounded-lg transition-all text-slate-400"
                          title="Delete"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={orderPage} totalPages={totalOrderPages} onPageChange={setOrderPage} />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, orderId: null })}
        onConfirm={handleConfirmDeleteOrder}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action will remove the record permanently."
        confirmText="Delete Order"
      />
    </div>
  );
};

export default Orders;
