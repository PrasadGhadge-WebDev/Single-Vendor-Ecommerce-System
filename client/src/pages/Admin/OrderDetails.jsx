import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaBox, FaTruck, FaClock, FaPrint, FaRegEnvelope, FaUser, FaMoneyBillWave, FaDownload } from "react-icons/fa";
import { toast } from "react-toastify";
import html2pdf from "html2pdf.js";
import API from "../../api";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Ordered by Mistake");
  const [customReason, setCustomReason] = useState("");

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const { data } = await API.get(`/orders`);
      const foundOrder = data.find((o) => o._id === id);
      if (foundOrder) {
        setOrder(foundOrder);
        setNewStatus(foundOrder.status);
      } else {
        toast.error("Order not found");
        navigate("/admin/orders");
      }
    } catch (error) {
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusNote.trim()) {
      return toast.warning("Please provide a status update note.");
    }
    try {
      await API.put(`/orders/${id}`, {
        status: newStatus,
        description: statusNote
      });
      toast.success("Order status updated successfully!");
      setShowModal(false);
      setStatusNote("");
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const submitCancelOrder = async () => {
    const finalReason = cancelReason === "Other" ? customReason : cancelReason;
    if (!finalReason.trim()) {
      return toast.warning("Please provide a cancellation reason.");
    }

    try {
      await API.put(`/orders/${id}`, {
        status: "cancelled",
        description: finalReason
      });
      toast.success("Order cancelled successfully!");
      setShowCancelModal(false);
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel order");
    }
  };

  const handleReturnAction = async (actionStatus, actionNotes = "") => {
    try {
      await API.put(`/orders/${id}/return-status`, {
        returnStatus: actionStatus,
        notes: actionNotes
      });
      toast.success(`Return status updated to ${actionStatus.replace("_", " ")}`);
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update return status");
    }
  };

  const handleDownloadPDF = () => {
    const element = document.querySelector('.invoice-content');
    const opt = {
      margin:       [5, 5, 5, 5],
      filename:     `Invoice_ORD-${order._id.slice(-8).toUpperCase()}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  if (loading) return <div className="p-8 text-center">Loading Order Details...</div>;
  if (!order) return null;

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-8" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/orders")} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition">
            <FaArrowLeft className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 m-0 leading-tight">Order #{order._id.slice(-6).toUpperCase()}</h1>
            <p className="text-sm text-gray-500 m-0">Placed on {new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
              order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
            }`}>
            {order.status}
          </span>
        </div>
        <div className="flex gap-3">
          {["pending", "confirmed", "shipped"].includes(order.status) && (
            <button onClick={() => setShowCancelModal(true)} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-md transition font-semibold text-sm">
              Cancel Order
            </button>
          )}
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-[#5B3DF5] text-white rounded-lg hover:bg-[#4a2ee0] shadow-md transition font-semibold text-sm">
            Update Status
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-6 px-2 print:hidden">
        {['overview', 'products', 'timeline', 'invoice'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 text-sm font-semibold capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-[#5B3DF5] text-[#5B3DF5]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-6 print:block print:w-full">
          {activeTab === 'overview' && (
            <>
              {/* Order Info Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><FaBox className="text-[#5B3DF5]" /> Order Information</h3>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div><p className="text-gray-500 mb-1">Order ID</p><p className="font-semibold text-gray-900">{order._id}</p></div>
                  <div><p className="text-gray-500 mb-1">Payment Method</p><p className="font-semibold text-gray-900">{order.paymentMethod}</p></div>
                  <div><p className="text-gray-500 mb-1">Payment Status</p>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : order.paymentStatus === 'refunded' || order.paymentStatus === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {order.paymentStatus?.toUpperCase()}
                    </span>
                    {order.isPaid && order.paidAt && (
                      <div className="mt-2 text-xs text-gray-600">
                        <p><strong>Paid Date:</strong> {new Date(order.paidAt).toLocaleDateString()}</p>
                        <p><strong>Paid Time:</strong> {new Date(order.paidAt).toLocaleTimeString()}</p>
                        {order.collectedBy && <p><strong>Collected By:</strong> {order.collectedBy.name || order.collectedBy}</p>}
                      </div>
                    )}
                  </div>
                  <div><p className="text-gray-500 mb-1">Total Amount</p><p className="font-bold text-[#5B3DF5] text-lg">{formatCurrency(order.totalAmount)}</p></div>
                </div>
                {order.status === "cancelled" && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-red-600 mb-2">Cancellation Details</h4>
                    <div className="grid grid-cols-2 gap-y-4 text-sm bg-red-50 p-4 rounded-xl border border-red-100">
                      <div><p className="text-red-400 mb-1">Date</p><p className="font-semibold text-red-700">{order.cancelledAt ? new Date(order.cancelledAt).toLocaleString() : "N/A"}</p></div>
                      <div><p className="text-red-400 mb-1">Reason</p><p className="font-semibold text-red-700">{order.cancellationReason || "N/A"}</p></div>
                    </div>
                  </div>
                )}
                
                {order.returnStatus && order.returnStatus !== "none" && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-orange-600 mb-2">Return Information</h4>
                    <div className="grid grid-cols-1 gap-y-4 text-sm bg-orange-50 p-4 rounded-xl border border-orange-100">
                      <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-orange-500 mb-1 text-xs uppercase tracking-wider">Return Status</p><p className="font-bold text-orange-800 capitalize">{order.returnStatus.replace("_", " ")}</p></div>
                        <div><p className="text-orange-500 mb-1 text-xs uppercase tracking-wider">Requested Date</p><p className="font-semibold text-orange-800">{order.returnRequestDate ? new Date(order.returnRequestDate).toLocaleString() : "N/A"}</p></div>
                        <div><p className="text-orange-500 mb-1 text-xs uppercase tracking-wider">Pickup Status</p>
                          <p className="font-semibold text-orange-800">
                            {["pickup_scheduled", "picked_up", "received", "refunded", "completed"].includes(order.returnStatus) 
                              ? order.returnStatus === "pickup_scheduled" ? "Scheduled" : "Picked Up" 
                              : "Pending"}
                          </p>
                        </div>
                        <div><p className="text-orange-500 mb-1 text-xs uppercase tracking-wider">Refund Status</p>
                          <p className="font-semibold text-orange-800">
                            {["refunded", "completed"].includes(order.returnStatus) ? "Refund Initiated/Completed" : "Pending"}
                          </p>
                        </div>
                        <div><p className="text-orange-500 mb-1 text-xs uppercase tracking-wider">Reason</p><p className="font-semibold text-orange-800">{order.returnReason || "N/A"}</p></div>
                        {order.returnComments && (
                          <div className="col-span-2"><p className="text-orange-500 mb-1 text-xs uppercase tracking-wider">Comments</p><p className="font-semibold text-orange-800">{order.returnComments}</p></div>
                        )}
                      </div>
                      {order.returnImages && order.returnImages.length > 0 && (
                        <div className="mt-4 border-t border-orange-200 pt-3">
                          <p className="text-orange-500 mb-2 font-semibold">Uploaded Images</p>
                          <div className="flex gap-3 overflow-x-auto pb-2">
                            {order.returnImages.map((img, idx) => (
                              <a href={`http://localhost:5000${img}`} target="_blank" rel="noopener noreferrer" key={idx}>
                                <img src={`http://localhost:5000${img}`} alt={`Return Image ${idx + 1}`} className="w-24 h-24 object-cover rounded-lg border border-orange-200 shadow-sm hover:scale-105 transition-transform" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="border-t border-orange-200 pt-4 mt-2 flex flex-wrap gap-2">
                        {order.returnStatus === "requested" && (
                          <>
                            <button onClick={() => handleReturnAction("approved", "Return Approved by Admin")} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition font-semibold text-sm shadow-sm">
                              Approve Return
                            </button>
                            <button onClick={() => handleReturnAction("rejected", "Return Rejected by Admin")} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition font-semibold text-sm shadow-sm">
                              Reject Return
                            </button>
                          </>
                        )}
                        {order.returnStatus === "approved" && (
                          <button onClick={() => handleReturnAction("pickup_scheduled")} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition font-semibold text-sm shadow-sm">
                            Schedule Pickup
                          </button>
                        )}
                        {order.returnStatus === "pickup_scheduled" && (
                          <button onClick={() => handleReturnAction("picked_up")} className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition font-semibold text-sm shadow-sm">
                            Mark as Picked Up
                          </button>
                        )}
                        {order.returnStatus === "picked_up" && (
                          <button onClick={() => handleReturnAction("received")} className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition font-semibold text-sm shadow-sm">
                            Mark as Received
                          </button>
                        )}
                        {order.returnStatus === "received" && (
                          <button onClick={() => handleReturnAction("refunded", "Refund Processed")} className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition font-semibold text-sm shadow-sm">
                            Initiate Refund & Restore Stock
                          </button>
                        )}
                        {order.returnStatus === "refunded" && (
                          <button onClick={() => handleReturnAction("completed", "Return Flow Complete")} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold text-sm shadow-sm">
                            Complete Return
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Info Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><FaUser className="text-[#10B981]" /> Customer Information</h3>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div><p className="text-gray-500 mb-1">Name</p><p className="font-semibold text-gray-900">{order.user?.name || "N/A"}</p></div>
                  <div><p className="text-gray-500 mb-1">Email</p><p className="font-semibold text-gray-900">{order.user?.email || "N/A"}</p></div>
                  <div><p className="text-gray-500 mb-1">Phone</p><p className="font-semibold text-gray-900">{order.shippingAddress?.phone || order.user?.phone || "N/A"}</p></div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-gray-500 mb-1">Shipping Address</p>
                  <p className="font-medium text-gray-900 leading-relaxed">
                    {order.shippingAddress?.fullName}<br />
                    {order.shippingAddress?.addressLine1}, {order.shippingAddress?.addressLine2}<br />
                    {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}<br />
                    {order.shippingAddress?.country}
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'products' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Products ({order.products?.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="p-3 font-semibold rounded-tl-lg">Product Name</th>
                      <th className="p-3 font-semibold text-center">Qty</th>
                      <th className="p-3 font-semibold text-right">Price</th>
                      <th className="p-3 font-semibold text-right rounded-tr-lg">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {order.products?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 text-sm font-semibold text-gray-800">{item.product?.name || 'Unknown Product'}</td>
                        <td className="p-3 text-sm font-medium text-center text-gray-600 bg-gray-50/50 rounded-lg">{item.quantity}</td>
                        <td className="p-3 text-sm font-medium text-right text-gray-600">{formatCurrency(item.price)}</td>
                        <td className="p-3 text-sm font-bold text-right text-[#5B3DF5]">{formatCurrency(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span className="font-semibold text-gray-800">{formatCurrency(order.subtotalAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Discount:</span><span className="font-semibold text-red-500">-{formatCurrency(order.discountAmount)}</span></div>
                  <div className="flex justify-between pt-2 border-t border-gray-100 text-lg"><span className="font-bold text-gray-900">Total:</span><span className="font-black text-[#5B3DF5]">{formatCurrency(order.totalAmount)}</span></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2"><FaClock className="text-[#F59E0B]" /> Order Timeline</h3>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
                {order.statusHistory?.map((hist, idx) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#5B3DF5] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <FaBox className="text-white text-xs" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-gray-800 capitalize text-sm">{hist.status}</h4>
                        <time className="text-xs font-medium text-gray-400">{new Date(hist.createdAt).toLocaleString()}</time>
                      </div>
                      <p className="text-xs text-gray-500">{hist.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 print-invoice-area text-sm relative">
              {/* Action Buttons Container (Hidden in print) */}
              <div className="flex flex-wrap justify-between items-center mb-8 pb-6 border-b border-gray-100 print:hidden gap-4">
                <h3 className="text-2xl font-black text-gray-800 tracking-tight">Invoice Settings</h3>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => window.print()} className="px-4 py-2 bg-[#5B3DF5] text-white rounded-lg hover:bg-[#4a2ee0] transition font-semibold text-sm flex items-center gap-2 shadow-sm">
                    <FaPrint /> Print Invoice
                  </button>
                  <button onClick={handleDownloadPDF} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold text-sm flex items-center gap-2">
                    <FaDownload /> Download PDF
                  </button>
                  <a href={`mailto:${order.user?.email || ''}?subject=Invoice for Order ORD-${order._id.slice(-8).toUpperCase()}&body=Dear ${order.user?.name || 'Customer'},%0D%0A%0D%0AThank you for your order! Your invoice details are available.%0D%0A%0D%0AWe appreciate your business.%0D%0A%0D%0AStore Team`} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold text-sm flex items-center gap-2 no-underline">
                    <FaRegEnvelope /> Email Customer
                  </a>
                </div>
              </div>

              <div className="invoice-content text-gray-800 text-xs flex flex-col min-h-[800px] print:min-h-[280mm]">
                
                <div className="flex flex-col md:flex-row print:flex-row justify-between items-start border-b border-gray-800 pb-2 mb-2 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-[#5B3DF5] rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md">E</div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight text-gray-900 m-0">ElectroHub</h2>
                      <p className="text-gray-500 text-[9px] mt-0.5">Premium Technology Ecosystem | GSTIN: <span className="font-semibold text-gray-700">27ABCDE1234F1Z5</span></p>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-widest mb-0.5">TAX INVOICE</h1>
                    <p className="text-[10px] text-gray-600">Invoice #: <span className="font-bold">INV-{order._id.slice(-6).toUpperCase()}</span></p>
                    <p className="text-[10px] text-gray-600">Date: <span className="font-bold">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-2 bg-gray-50/80 p-2 rounded border border-gray-100">
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Order Information</p>
                    <div className="grid grid-cols-[80px_1fr] text-[10px] gap-y-0.5">
                      <span className="text-gray-500">Order ID:</span> <span className="font-semibold">ORD-{order._id.slice(-8).toUpperCase()}</span>
                      <span className="text-gray-500">Order Date:</span> <span className="font-semibold">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Payment Information</p>
                    <div className="grid grid-cols-[80px_1fr] text-[10px] gap-y-0.5">
                      <span className="text-gray-500">Method:</span> <span className="font-semibold">{order.paymentMethod || 'N/A'}</span>
                      <span className="text-gray-500">Status:</span> <span className="font-bold text-green-600">{(order.paymentStatus || 'pending').toUpperCase()}</span>
                      <span className="text-gray-500">Txn ID:</span> <span className="font-semibold">TXN-{order._id.slice(0, 8).toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 border-b border-gray-200 pb-0.5 mb-1 uppercase tracking-wider">Bill To</p>
                    <p className="font-bold text-gray-900 text-[11px] mb-0.5">{order.user?.name || "Customer Name"}</p>
                    <p className="text-gray-600 leading-snug text-[9px]">
                      {order.user?.email || "No email provided"}<br/>
                      {order.shippingAddress?.phone || order.user?.phone || "+91 00000 00000"}<br/>
                      {order.shippingAddress?.addressLine1 || "Billing Address Line 1"}{order.shippingAddress?.addressLine2 ? ', ' + order.shippingAddress.addressLine2 : ''}, 
                      {order.shippingAddress?.city || "City"}, {order.shippingAddress?.state || "State"} - {order.shippingAddress?.pincode || "Pincode"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 border-b border-gray-200 pb-0.5 mb-1 uppercase tracking-wider">Ship To</p>
                    <p className="font-bold text-gray-900 text-[11px] mb-0.5">{order.shippingAddress?.fullName || order.user?.name}</p>
                    <p className="text-gray-600 leading-snug text-[9px]">
                      {order.shippingAddress?.phone || order.user?.phone || "+91 00000 00000"}<br/>
                      {order.shippingAddress?.addressLine1 || "Billing Address Line 1"}{order.shippingAddress?.addressLine2 ? ', ' + order.shippingAddress.addressLine2 : ''}, 
                      {order.shippingAddress?.city || "City"}, {order.shippingAddress?.state || "State"} - {order.shippingAddress?.pincode || "Pincode"}
                    </p>
                  </div>
                </div>

                <div className="mb-2">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-gray-800 text-white text-[9px] uppercase tracking-wider">
                        <th className="py-1 px-1.5 font-semibold rounded-tl">Product Description</th>
                        <th className="py-1 px-1.5 font-semibold text-center">SKU</th>
                        <th className="py-1 px-1.5 font-semibold text-center">Qty</th>
                        <th className="py-1 px-1.5 font-semibold text-right">Unit Price</th>
                        <th className="py-1 px-1.5 font-semibold text-right">Tax (18%)</th>
                        <th className="py-1 px-1.5 font-semibold text-right rounded-tr">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 border-b border-gray-200">
                      {order.products?.map((item, idx) => {
                        const unitPrice = item.price;
                        const taxAmount = unitPrice * 0.18; // Mocking 18% tax
                        const basePrice = unitPrice - taxAmount;
                        const lineTotal = unitPrice * item.quantity;

                        return (
                          <tr key={idx} className="even:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
                            <td className="py-1 px-1.5 font-medium text-gray-900">
                              {item.product?.name || 'Unknown Product'}
                            </td>
                            <td className="py-1 px-1.5 text-center text-gray-500">
                              {item.product?.sku || `SKU-${idx + 1}00`}
                            </td>
                            <td className="py-1 px-1.5 text-center font-semibold text-gray-700">
                              {item.quantity}
                            </td>
                            <td className="py-1 px-1.5 text-right text-gray-600">
                              {formatCurrency(basePrice)}
                            </td>
                            <td className="py-1 px-1.5 text-right text-gray-500">
                              {formatCurrency(taxAmount)}
                            </td>
                            <td className="py-1 px-1.5 text-right font-bold text-gray-900">
                              {formatCurrency(lineTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] print:grid-cols-[1fr_220px] gap-4 mb-2">
                  
                  <div>
                    <div className="bg-gray-50/50 p-2 rounded border border-gray-100 mb-2">
                      <h3 className="text-[9px] font-bold text-gray-800 mb-1 uppercase tracking-wider">Shipping Summary</h3>
                      <p className="text-[9px] text-gray-600 leading-relaxed">
                        <span className="text-gray-400">Method:</span> <strong className="text-gray-800">Standard Delivery • Delhivery</strong><br/>
                        <span className="text-gray-400">Tracking:</span> <strong className="text-[#5B3DF5]">DLV{order._id.slice(0, 8).toUpperCase()}</strong><br/>
                        <span className="text-gray-400">Expected:</span> <strong className="text-gray-800">{new Date(new Date(order.createdAt).getTime() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                      </p>
                    </div>

                    <div className="bg-yellow-50/50 border border-yellow-100 p-1.5 rounded">
                      <h4 className="text-[9px] font-bold text-yellow-800 uppercase tracking-wider mb-0.5">Admin Notes (Internal)</h4>
                      <p className="text-[10px] text-yellow-700 italic">
                        Please ensure the package is marked as fragile. Expedited shipping process recommended.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-2 rounded border-2 border-gray-100 shadow-sm w-full">
                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Subtotal:</span>
                        <span className="font-semibold text-gray-800">{formatCurrency(order.subtotalAmount || order.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Discount:</span>
                        <span className="font-semibold text-red-500">-{formatCurrency(order.discountAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tax Included:</span>
                        <span className="font-semibold text-gray-800">{formatCurrency(((order.totalAmount || 0) * 18) / 100)}</span>
                      </div>

                      <div className="pt-1.5 mt-1 border-t-2 border-gray-800">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-black text-gray-900 text-[10px]">GRAND TOTAL</span>
                          <span className="font-black text-base text-[#5B3DF5]">{formatCurrency(order.totalAmount)}</span>
                        </div>
                      </div>
                      <div className="border-t-2 border-gray-800 mt-1 mb-1"></div>

                      <div className="space-y-0.5 pt-0.5">
                        <div className="flex justify-between text-[9px]">
                          <span className="text-gray-500 font-medium">Amount Paid:</span>
                          <span className="font-bold text-green-600">{order.paymentStatus === 'paid' ? formatCurrency(order.totalAmount) : '₹0.00'}</span>
                        </div>
                        <div className="flex justify-between text-[9px]">
                          <span className="text-gray-500 font-medium">Balance Due:</span>
                          <span className="font-bold text-red-500">{order.paymentStatus === 'paid' ? '₹0.00' : formatCurrency(order.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="mt-8 flex justify-end">
                    <div className="text-center w-32">
                      <div className="h-6 border-b border-gray-800 mb-0.5"></div>
                      <p className="text-[8px] font-bold text-gray-600 uppercase">Authorized Signatory</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-300 pt-1.5 mt-1.5 text-[8px] text-gray-500 leading-tight">
                    <div className="flex flex-col md:flex-row print:flex-row justify-between items-end gap-1">
                      <div>
                        <p className="font-black text-gray-800 text-[10px] mb-0.5">Thank You For Shopping!</p>
                        <p><strong>Support:</strong> support@electrohub.com | +91 98765 43210</p>
                      </div>
                      <div className="text-right max-w-[250px]">
                        <p>• Goods once sold cannot be returned after 7 days.</p>
                        <p>• Computer generated invoice. Signature not required.</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              {/* --- ACTUAL INVOICE CONTENT END --- */}
            </div>
          )}
        </div>

        {/* Right Column (Quick Summary) */}
        <div className="space-y-6 hidden lg:block print:hidden">
          <div className="bg-gradient-to-br from-[#5B3DF5] to-[#4a2ee0] p-6 rounded-2xl shadow-lg text-white">
            <h3 className="text-lg font-bold mb-4 opacity-90">Quick Summary</h3>
            <div className="space-y-4">
              <div>
                <p className="text-white/70 text-sm mb-1">Status</p>
                <p className="font-bold text-xl uppercase tracking-wider">{order.status}</p>
              </div>
              <div className="w-full h-px bg-white/20"></div>
              <div>
                <p className="text-white/70 text-sm mb-1">Total Items</p>
                <p className="font-bold text-lg">{order.products?.length || 0} Products</p>
              </div>
              <div className="w-full h-px bg-white/20"></div>
              <div>
                <p className="text-white/70 text-sm mb-1">Payment</p>
                <p className="font-bold text-lg flex items-center gap-2"><FaMoneyBillWave /> {order.paymentMethod} ({order.paymentStatus})</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 m-0">Update Order Status</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5B3DF5] focus:border-transparent transition outline-none font-medium text-gray-800"
                >
                  {['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'].map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Internal Note / Update Reason <span className="text-red-500">*</span></label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5B3DF5] focus:border-transparent transition outline-none font-medium text-gray-800 resize-none h-24"
                  placeholder="E.g. Package dispatched via BlueDart..."
                ></textarea>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="notify" className="w-4 h-4 text-[#5B3DF5] rounded" defaultChecked />
                <label htmlFor="notify" className="text-sm font-medium text-gray-600 cursor-pointer">Notify customer via Email/SMS</label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition">Cancel</button>
              <button onClick={handleStatusUpdate} className="px-5 py-2.5 bg-[#5B3DF5] text-white rounded-xl hover:bg-[#4a2ee0] font-bold shadow-md shadow-[#5B3DF5]/30 transition">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 bg-red-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-red-700 m-0">Cancel Order</h3>
              <button onClick={() => setShowCancelModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-medium text-red-600">Are you sure you want to cancel this order? This action cannot be undone.</p>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Cancellation Reason <span className="text-red-500">*</span></label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition outline-none font-medium text-gray-800"
                >
                  <option value="Ordered by Mistake">Ordered by Mistake</option>
                  <option value="Found Better Price">Found Better Price</option>
                  <option value="Want to Change Product">Want to Change Product</option>
                  <option value="Delivery Taking Too Long">Delivery Taking Too Long</option>
                  <option value="Other">Other (Please specify)</option>
                </select>
              </div>
              {cancelReason === "Other" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Additional Details (Optional)</label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition outline-none font-medium text-gray-800 resize-none h-24"
                    placeholder="Briefly explain your reason for cancellation..."
                  ></textarea>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowCancelModal(false)} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition">Keep Order</button>
              <button onClick={submitCancelOrder} className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold shadow-md shadow-red-600/30 transition">Confirm Cancellation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
