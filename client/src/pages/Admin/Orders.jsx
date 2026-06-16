import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEdit, FaTrash, FaFileInvoice, FaDownload, FaBell, FaTimes, FaSearch, FaFilter, FaSync, FaBox, FaCheckCircle, FaSpinner, FaTimesCircle, FaEllipsisV, FaClock, FaChevronDown, FaUndo } from "react-icons/fa";
import { toast } from "react-toastify";
import API from "../../api";

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status Update Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // Mark as Paid Modal State
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [orderToMarkPaid, setOrderToMarkPaid] = useState(null);

  // Filters State
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    paymentStatus: "",
    paymentMethod: "",
    returnStatus: "",
    dateRange: "all",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/orders", { params: filters });
      setOrders(data);
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusNote.trim()) {
      return toast.warning("Please provide a status update note.");
    }
    try {
      await API.put(`/orders/${selectedOrder._id}`, {
        status: newStatus,
        description: statusNote
      });
      toast.success("Order status updated successfully!");
      setShowModal(false);
      setSelectedOrder(null);
      setStatusNote("");
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const confirmDelete = (orderId) => {
    setOrderToDelete(orderId);
    setShowDeleteModal(true);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      await API.delete(`/orders/${orderToDelete}`);
      toast.success("Order deleted successfully");
      setShowDeleteModal(false);
      setOrderToDelete(null);
      fetchOrders();
    } catch (error) {
      toast.error("Failed to delete order");
    }
  };

  const handleMarkAsPaid = async () => {
    if (!orderToMarkPaid) return;
    try {
      await API.put(`/orders/${orderToMarkPaid}/pay`);
      toast.success("Payment marked as Paid successfully.");
      setShowMarkPaidModal(false);
      setOrderToMarkPaid(null);
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mark order as paid");
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    let updates = { [name]: value };

    if (name === "dateRange") {
      const now = new Date();
      if (value === "today") {
        updates.dateFrom = now.toISOString().split("T")[0];
        updates.dateTo = now.toISOString().split("T")[0];
      } else if (value === "7days") {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        updates.dateFrom = start.toISOString().split("T")[0];
        updates.dateTo = now.toISOString().split("T")[0];
      } else if (value === "all") {
        updates.dateFrom = "";
        updates.dateTo = "";
      }
    }
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      paymentStatus: "",
      paymentMethod: "",
      returnStatus: "",
      dateRange: "all",
      dateFrom: "",
      dateTo: "",
    });
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Order ID,Customer,Total Amount,Status,Payment Method,Payment Status,Date\n"
      + orders.map(o => `${o._id},${o.user?.name || 'N/A'},${o.totalAmount},${o.status},${o.paymentMethod},${o.paymentStatus},${new Date(o.createdAt).toLocaleDateString()}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "orders_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      returns: orders.filter(o => o.returnStatus && o.returnStatus !== 'none').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  }, [orders]);

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  const getReturnStatusColor = (status) => {
    switch (status) {
      case "requested": return "bg-warning bg-opacity-10 text-warning border-warning";
      case "approved": return "bg-primary bg-opacity-10 text-primary border-primary";
      case "rejected": return "bg-red-100 text-red-700 border-red-500";
      case "pickup_scheduled": return "bg-info bg-opacity-10 text-info border-info";
      case "picked_up": return "bg-primary bg-opacity-10 text-primary border-primary";
      case "received": return "bg-secondary bg-opacity-10 text-secondary border-secondary";
      case "refunded": return "bg-success bg-opacity-10 text-success border-success";
      case "completed": return "bg-success bg-opacity-10 text-success border-success";
      default: return "bg-gray-100 text-gray-500 border-gray-300";
    }
  };

  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-8" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0">Orders</h1>
          <p className="text-sm text-gray-500 m-0 mt-1">Manage and track customer orders from placement to delivery.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExport} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition font-semibold text-sm flex items-center gap-2">
            <FaDownload /> Export
          </button>
          <button onClick={fetchOrders} className="px-4 py-2 bg-[#5B3DF5] text-white rounded-lg hover:bg-[#4a2ee0] shadow-md transition font-semibold text-sm flex items-center gap-2">
            <FaSync className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 text-xl"><FaBox /></div>
          <p className="text-2xl font-black text-gray-900 leading-none mb-1">{kpis.total}</p>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Orders</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-3 text-xl"><FaClock /></div>
          <p className="text-2xl font-black text-gray-900 leading-none mb-1">{kpis.pending}</p>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-3 text-xl"><FaUndo /></div>
          <p className="text-2xl font-black text-gray-900 leading-none mb-1">{kpis.returns}</p>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Returns</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3 text-xl"><FaCheckCircle /></div>
          <p className="text-2xl font-black text-gray-900 leading-none mb-1">{kpis.delivered}</p>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Delivered</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3 text-xl"><FaTimesCircle /></div>
          <p className="text-2xl font-black text-gray-900 leading-none mb-1">{kpis.cancelled}</p>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cancelled</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white py-2 px-3 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-nowrap overflow-x-auto gap-2 items-center w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex-[2] min-w-[150px] relative">
          <input 
            type="text" 
            name="search" 
            value={filters.search} 
            onChange={handleFilterChange} 
            placeholder="Search by all columns..." 
            className="w-full pl-3 pr-8 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5B3DF5] outline-none text-xs font-medium"
          />
          <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
        </div>
        <select name="status" value={filters.status} onChange={handleFilterChange} className="py-1.5 px-2 border border-gray-200 rounded-lg outline-none text-xs font-medium text-gray-700 bg-white flex-1 min-w-[110px]">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="packed">Packed</option>
          <option value="shipped">Shipped</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select name="paymentStatus" value={filters.paymentStatus} onChange={handleFilterChange} className="py-1.5 px-2 border border-gray-200 rounded-lg outline-none text-xs font-medium text-gray-700 bg-white flex-1 min-w-[110px]">
          <option value="">All Payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Unpaid/Pending</option>
          <option value="refunded">Refunded</option>
        </select>
        <select name="paymentMethod" value={filters.paymentMethod} onChange={handleFilterChange} className="py-1.5 px-2 border border-gray-200 rounded-lg outline-none text-xs font-medium text-gray-700 bg-white flex-1 min-w-[110px]">
          <option value="">All Methods</option>
          <option value="COD">COD</option>
          <option value="ONLINE">Online/Card</option>
        </select>
        <select name="returnStatus" value={filters.returnStatus} onChange={handleFilterChange} className="py-1.5 px-2 border border-gray-200 rounded-lg outline-none text-xs font-medium text-gray-700 bg-white flex-1 min-w-[110px]">
          <option value="">All Returns</option>
          <option value="none">No Return</option>
          <option value="requested">Requested</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="pickup_scheduled">Pickup Scheduled</option>
          <option value="picked_up">Picked Up</option>
          <option value="received">Product Received</option>
          <option value="refunded">Refunded / Completed</option>
        </select>
        <select 
          name="dateRange"
          value={filters.dateRange} 
          onChange={handleFilterChange}
          className="py-1.5 px-2 border border-gray-200 rounded-lg outline-none text-xs font-medium text-gray-700 bg-white flex-1 min-w-[110px]"
        >
          <option value="all">Creation Date</option>
          <option value="today">Today</option>
          <option value="7days">Last 7 Days</option>
          <option value="custom">Custom Range</option>
        </select>
        
        {filters.dateRange === 'custom' && (
          <div className="flex items-center gap-1 flex-[1.5] min-w-[200px] animate-in fade-in slide-in-from-left-2 duration-300">
            <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="py-1.5 px-2 border border-gray-200 rounded-lg outline-none text-xs font-medium text-gray-700 bg-white w-full" />
            <span className="text-gray-400 text-xs">-</span>
            <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="py-1.5 px-2 border border-gray-200 rounded-lg outline-none text-xs font-medium text-gray-700 bg-white w-full" />
          </div>
        )}
        {(filters.search || filters.status || filters.paymentStatus || filters.paymentMethod || filters.returnStatus || filters.dateRange !== 'all') && (
          <button 
            onClick={clearFilters} 
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0"
          >
            Reset
          </button>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="py-4 px-6 font-semibold">Order ID</th>
                <th className="py-4 px-6 font-semibold">Customer</th>
                <th className="py-4 px-6 font-semibold">Date</th>
                <th className="py-4 px-6 font-semibold">Total Amount</th>
                <th className="py-4 px-6 font-semibold">Payment</th>
                <th className="py-4 px-6 font-semibold text-center">Order Status</th>
                <th className="py-4 px-6 font-semibold text-center">Return Status</th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-12 text-gray-400 font-medium">Loading orders...</td></tr>
              ) : orders.length > 0 ? orders.map((order) => (
                <tr key={order._id} onClick={() => navigate(`/admin/orders/${order._id}`)} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                  <td className="py-4 px-6 text-sm font-bold text-gray-900">#{order._id.slice(-6).toUpperCase()}</td>
                  <td className="py-4 px-6 text-sm font-semibold text-gray-700">{order.user?.name || "N/A"}</td>
                  <td className="py-4 px-6 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="py-4 px-6 text-sm font-black text-[#5B3DF5]">{formatCurrency(order.totalAmount)}</td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-gray-600">{order.paymentMethod}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm inline-block w-max ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {order.paymentStatus.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {!order.returnStatus || order.returnStatus === "none" ? (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-500 border border-gray-200">
                        No Return
                      </span>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize border ${getReturnStatusColor(order.returnStatus)}`}>
                        {order.returnStatus.replace("_", " ")}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(openDropdownId === order._id ? null : order._id);
                      }}
                      className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition"
                    >
                      <FaEllipsisV />
                    </button>
                    
                    {openDropdownId === order._id && (
                      <div className="absolute right-8 top-10 bg-white border border-gray-100 shadow-xl rounded-xl z-50 w-56 overflow-hidden animate-in fade-in zoom-in-95 duration-100" onClick={(e) => e.stopPropagation()}>
                        <div className="p-1">
                          <button 
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition font-medium"
                            onClick={() => { setOpenDropdownId(null); navigate(`/admin/orders/${order._id}`); }}
                          >
                            <FaEye className="text-gray-400" /> View Order Details
                          </button>
                          
                          {/* We keep Update Order Status */}
                          <button 
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition font-medium"
                            onClick={() => {
                              setOpenDropdownId(null);
                              setSelectedOrder(order);
                              setNewStatus(order.status);
                              setStatusNote("");
                              setShowModal(true);
                            }}
                          >
                            <FaEdit className="text-[#5B3DF5]" /> Update Order Status
                          </button>

                          <button 
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition font-medium"
                            onClick={() => { setOpenDropdownId(null); navigate(`/admin/orders/${order._id}?tab=invoice`); }}
                          >
                            <FaFileInvoice className="text-blue-400" /> Print Invoice
                          </button>

                          {order.returnStatus && order.returnStatus !== "none" && (
                            <>
                              <div className="my-1 border-t border-gray-100"></div>
                              <div className="px-4 py-1 text-[10px] font-bold text-orange-500 uppercase tracking-wider">Return Management</div>
                              <button 
                                className="w-full text-left px-4 py-2.5 text-sm text-orange-700 hover:bg-orange-50 rounded-lg flex items-center gap-2 transition font-semibold"
                                onClick={() => { setOpenDropdownId(null); navigate(`/admin/orders/${order._id}?tab=overview`); }}
                              >
                                <FaBox className="text-orange-500" /> Manage Return Request
                              </button>
                            </>
                          )}

                          {order.paymentMethod === "COD" && order.paymentStatus === "pending" && order.status === "delivered" && (
                            <>
                              <div className="my-1 border-t border-gray-100"></div>
                              <button 
                                className="w-full text-left px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-2 transition font-medium"
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  setOrderToMarkPaid(order._id);
                                  setShowMarkPaidModal(true);
                                }}
                              >
                                <FaCheckCircle className="text-green-500" /> Mark as Paid
                              </button>
                            </>
                          )}
                          
                          <div className="my-1 border-t border-gray-100"></div>
                          
                          <button 
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition font-medium"
                            onClick={() => {
                              setOpenDropdownId(null);
                              confirmDelete(order._id);
                            }}
                          >
                            <FaTrash className="text-red-400" /> Delete Order
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="text-center py-12 text-gray-400 font-medium">No orders found matching your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Update Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Update Status: #{selectedOrder._id.slice(-6).toUpperCase()}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <FaTimes />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Status</label>
                <select 
                  value={newStatus} 
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5B3DF5] outline-none text-sm font-medium transition-all"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="packed">Packed</option>
                  <option value="shipped">Shipped</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Internal Note <span className="text-red-500">*</span></label>
                <select
                  className="w-full px-4 py-2.5 mb-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5B3DF5] outline-none text-sm font-medium transition-all text-gray-600"
                  onChange={(e) => {
                    if (e.target.value) {
                      setStatusNote(e.target.value);
                    }
                  }}
                >
                  <option value="">Select a preset note (optional)...</option>
                  <option value="Order has been successfully confirmed.">Order confirmed.</option>
                  <option value="Item packed and ready for dispatch.">Packed and ready for dispatch.</option>
                  <option value="Handed over to logistics partner.">Handed over to logistics partner.</option>
                  <option value="Out for delivery today.">Out for delivery today.</option>
                  <option value="Successfully delivered to customer.">Successfully delivered.</option>
                  <option value="Customer requested cancellation.">Customer requested cancellation.</option>
                </select>
                <textarea 
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5B3DF5] outline-none text-sm resize-none transition-all placeholder:text-gray-400"
                  rows="3"
                  placeholder="Or type a custom note here..."
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition text-sm">
                  Cancel
                </button>
                <button onClick={handleUpdateStatus} className="px-5 py-2.5 bg-[#5B3DF5] hover:bg-[#4a2ee0] text-white font-semibold rounded-xl shadow-md shadow-[#5B3DF5]/20 transition text-sm flex items-center gap-2">
                  <FaCheckCircle /> Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <FaTrash size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Order?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this order? This action cannot be undone and will permanently remove it from the system.
              </p>
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteModal(false); setOrderToDelete(null); }} className="flex-1 py-2.5 text-gray-700 font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition text-sm">
                  Cancel
                </button>
                <button onClick={handleDeleteOrder} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl shadow-md shadow-red-500/20 transition text-sm">
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Paid Modal */}
      {showMarkPaidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Payment Collection</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to mark this COD order as Paid? This action confirms that cash has been received from the customer.
              </p>
              <div className="flex gap-3">
                <button onClick={() => { setShowMarkPaidModal(false); setOrderToMarkPaid(null); }} className="flex-1 py-2.5 text-gray-700 font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition text-sm">
                  Cancel
                </button>
                <button onClick={handleMarkAsPaid} className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl shadow-md shadow-green-500/20 transition text-sm">
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
