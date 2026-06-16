import React, { useCallback, useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import { getImageUrl } from "../api";
import { FaStar, FaFileInvoice, FaExclamationCircle } from "react-icons/fa";
import BaseModal from "../components/BaseModal";

const ORDER_STATUS_LABELS = {
  pending: "Order Pending",
  confirmed: "Order Confirmed",
  shipped: "Shipped",
  out_for_delivery: "Out For Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  refunded: "Refunded",
};

const timelineStyles = {
  wrapper: { position: "relative", paddingLeft: "1.5rem", marginTop: "0.75rem" },
  line: {
    position: "absolute",
    left: "6px",
    top: "0.5rem",
    bottom: "0.3rem",
    width: "2px",
    backgroundColor: "var(--border-color)",
  },
  dot: {
    position: "absolute",
    left: "0",
    top: "0.4rem",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "var(--color-primary)",
  },
};

const formatStatusLabel = (status) => {
  if (!status) return "Order update";
  const normalized = status.toString().toLowerCase().replace(/[_-]/g, " ");
  return ORDER_STATUS_LABELS[normalized] || normalized.replace(/\b\w/g, (chr) => chr.toUpperCase());
};

const formatOrderTimestamp = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const buildTimelineEntries = (order) => {
  const history = Array.isArray(order?.statusHistory) ? [...order.statusHistory] : [];
  history.sort((a, b) => {
    const aTime = new Date(a?.createdAt || a?.updatedAt || 0).getTime();
    const bTime = new Date(b?.createdAt || b?.updatedAt || 0).getTime();
    return aTime - bTime;
  });
  const timeline = history.map((entry) => ({
    title: formatStatusLabel(entry.status),
    description: entry.description || "",
    date: entry.createdAt || entry.updatedAt || order.createdAt,
  }));

  const finalLabel = formatStatusLabel(order.status);
  const finalDate = order.updatedAt || order.createdAt;
  const alreadyHasFinal = timeline.length && timeline[timeline.length - 1].title === finalLabel;
  if (!alreadyHasFinal && (order.status || finalDate)) {
    timeline.push({
      title: finalLabel,
      description: order.statusDescription || "",
      date: finalDate,
    });
  }

  if (!timeline.length && order.createdAt) {
    timeline.push({
      title: "Order placed",
      description: "Order created",
      date: order.createdAt,
    });
  }

  return timeline;
};

const UserOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [reviewSubmitting, setReviewSubmitting] = useState({});

  const [cancelModal, setCancelModal] = useState({ isOpen: false, orderId: null });
  const [cancelReason, setCancelReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const [returnModal, setReturnModal] = useState({ isOpen: false, orderId: null });
  const [returnReason, setReturnReason] = useState("");
  const [customReturnReason, setCustomReturnReason] = useState("");
  const [returnImages, setReturnImages] = useState([]);

  const checkReturnEligibility = (o) => {
    if (o?.status !== "delivered") return false;
    if (o?.returnStatus && o.returnStatus !== "none") return false;
    
    let deliveredDate = o.updatedAt;
    const deliveredHistory = o.statusHistory?.find(h => h.status === "delivered");
    if (deliveredHistory && deliveredHistory.createdAt) {
      deliveredDate = deliveredHistory.createdAt;
    }
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return new Date(deliveredDate) >= sevenDaysAgo;
  };

  const fetchOrder = useCallback(async () => {
    if (!user?.token || !id) return;
    try {
      setLoading(true);
      const { data } = await API.get("/orders/my-orders");
      const foundOrder = data.find(o => o._id === id);
      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        toast.error("Order not found");
        navigate("/orders");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.token, id, navigate]);

  const handleCancelClick = (orderId) => {
    setCancelModal({ isOpen: true, orderId });
    setCancelReason("Ordered by Mistake"); // Default
    setCustomReason("");
  };

  const submitCancelOrder = async () => {
    const { orderId } = cancelModal;
    if (!orderId) return;

    const finalReason = cancelReason === "Other" ? customReason : cancelReason;

    try {
      await API.put(`/orders/${orderId}/cancel`, { reason: finalReason || "" });
      toast.success("Order cancelled successfully");
      fetchOrder();
    } catch (error) {
      toast.error("Cancel failed: " + (error.response?.data?.message || error.message));
    } finally {
      setCancelModal({ isOpen: false, orderId: null });
    }
  };

  const handleReturnClick = (orderId) => {
    setReturnModal({ isOpen: true, orderId });
    setReturnReason("Defective Product"); // Default
    setCustomReturnReason("");
    setReturnImages([]);
  };

  const submitReturnOrder = async () => {
    const { orderId } = returnModal;
    if (!orderId) return;

    const finalReason = returnReason === "Other" ? customReturnReason : returnReason;

    try {
      const formData = new FormData();
      formData.append("reason", finalReason || "");
      formData.append("comments", customReturnReason);
      returnImages.forEach(file => {
        formData.append("returnImages", file);
      });

      await API.post(`/orders/${orderId}/return`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Return requested successfully");
      fetchOrder();
    } catch (error) {
      toast.error("Return failed: " + (error.response?.data?.message || error.message));
    } finally {
      setReturnModal({ isOpen: false, orderId: null });
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const reviewKey = (orderId, productId) => `${orderId}-${productId}`;

  const getReviewDraft = (key) => reviewDrafts[key] || { rating: 0, comment: "", visible: false };

  const toggleReviewForm = (orderId, productId) => {
    const key = reviewKey(orderId, productId);
    setReviewDrafts((prev) => {
      const current = prev[key] || {};
      return { ...prev, [key]: { ...current, visible: !current.visible } };
    });
  };

  const handleReviewFieldChange = (orderId, productId, field, value) => {
    const key = reviewKey(orderId, productId);
    setReviewDrafts((prev) => ({
      ...prev,
      [key]: { ...getReviewDraft(key), [field]: value },
    }));
  };

const REVIEWABLE_STATUSES = new Set(["delivered"]);
  const canReviewStatus = (status) => REVIEWABLE_STATUSES.has(String(status || "").toLowerCase());
  const hasReviewedItem = (item) =>
    Boolean(item.review || item.reviewId || item.reviewed || item.isReviewed);

  const renderInteractiveStars = (value, onChange) => {
    const rating = Math.min(5, Math.max(0, Number(value) || 0));
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      return (
        <button
          key={`order-star-${starValue}`}
          type="button"
          className="btn btn-sm btn-link p-0 border-0 text-decoration-none"
          aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
          onClick={() => onChange(starValue)}
        >
          <FaStar className={`me-1 ${starValue <= rating ? "text-warning" : "text-muted"}`} />
        </button>
      );
    });
  };

  const handleReviewSubmit = async (order, item) => {
    const productId = item.product?._id;
    if (!productId) {
      toast.warning("Unable to identify the product for review");
      return;
    }
    const key = reviewKey(order._id, productId);
    const draft = getReviewDraft(key);
    const rating = draft.rating;
    const comment = (draft.comment || "").trim();
    if (!rating) {
      toast.warning("Select a rating before submitting the review");
      return;
    }
    if (!comment) {
      toast.warning("Share your experience in the comment before submitting");
      return;
    }
    try {
      setReviewSubmitting((prev) => ({ ...prev, [key]: true }));
      await API.post("/reviews", {
        productId,
        rating,
        comment,
        orderId: order._id,
      });
      toast.success("Review submitted");
      setReviewDrafts((prev) => ({
        ...prev,
        [key]: { rating: 0, comment: "", visible: false },
      }));
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setReviewSubmitting((prev) => ({ ...prev, [key]: false }));
    }
  };

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
      
      const rows = order.products
        .map((item, index) => {
          const unitPrice = item.price;
          const taxAmount = (unitPrice * (order.taxPercent || 18)) / 100;
          const basePrice = unitPrice - taxAmount;
          const lineTotal = unitPrice * item.quantity;

          return `<tr class="even:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-[10px]">
            <td class="py-1 px-1.5 font-medium text-gray-900">${item.product?.name || 'Unknown Product'}</td>
            <td class="py-1 px-1.5 text-center text-gray-500">${item.product?.sku || `SKU-${index + 1}00`}</td>
            <td class="py-1 px-1.5 text-center font-semibold text-gray-700">${item.quantity}</td>
            <td class="py-1 px-1.5 text-right text-gray-600">₹${basePrice.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td class="py-1 px-1.5 text-right text-gray-500">₹${taxAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td class="py-1 px-1.5 text-right font-bold text-gray-900">₹${lineTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          </tr>`;
        }).join("");

      const printable = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice - ${bill.invoiceNumber}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { size: A4; margin: 5mm; }
            @media print {
              body { padding: 0 !important; margin: 0 !important; background: white; }
              .invoice-content { max-width: 100% !important; }
            }
          </style>
        </head>
        <body class="bg-white p-4 sm:p-6 print:p-0">
          <div class="invoice-content text-gray-800 max-w-4xl mx-auto text-xs print:text-[10px] min-h-[280mm] flex flex-col">
            
            <div class="flex justify-between items-start border-b border-gray-800 pb-2 mb-2">
              <div class="flex items-center gap-2">
                <div class="w-10 h-10 bg-[#5B3DF5] rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md">E</div>
                <div>
                  <h2 class="text-lg font-black tracking-tight text-gray-900 m-0">${bill.business.businessName || 'ElectroHub'}</h2>
                  <p class="text-gray-500 text-[9px] mt-0.5">Premium Technology Ecosystem | GSTIN: <span class="font-semibold text-gray-700">27ABCDE1234F1Z5</span></p>
                </div>
              </div>
              <div class="text-right">
                <h1 class="text-2xl font-black text-gray-900 uppercase tracking-widest mb-0.5">TAX INVOICE</h1>
                <p class="text-[10px] text-gray-600">Invoice #: <span class="font-bold">INV-${order._id.slice(-6).toUpperCase()}</span></p>
                <p class="text-[10px] text-gray-600">Date: <span class="font-bold">${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-2 bg-gray-50/80 p-2 rounded border border-gray-100">
              <div>
                <p class="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Order Information</p>
                <div class="grid grid-cols-[80px_1fr] text-[10px] gap-y-0.5">
                  <span class="text-gray-500">Order ID:</span> <span class="font-semibold">ORD-${order._id.slice(-8).toUpperCase()}</span>
                  <span class="text-gray-500">Order Date:</span> <span class="font-semibold">${new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <div>
                <p class="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Payment Information</p>
                <div class="grid grid-cols-[80px_1fr] text-[10px] gap-y-0.5">
                  <span class="text-gray-500">Method:</span> <span class="font-semibold">${order.paymentMethod || 'N/A'}</span>
                  <span class="text-gray-500">Status:</span> <span class="font-bold text-green-600">${(order.paymentStatus || 'pending').toUpperCase()}</span>
                  <span class="text-gray-500">Txn ID:</span> <span class="font-semibold">TXN-${order._id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-2">
              <div>
                <p class="text-[9px] font-bold text-gray-400 border-b border-gray-200 pb-0.5 mb-1 uppercase tracking-wider">Bill To</p>
                <p class="font-bold text-gray-900 text-[11px] mb-0.5">${bill.customer.name}</p>
                <p class="text-gray-600 leading-snug text-[9px]">
                  ${bill.customer.email || "No email provided"}<br/>
                  ${order.shippingAddress?.phone || order.user?.phone || "+91 00000 00000"}<br/>
                  ${order.shippingAddress?.addressLine1 || "Billing Address Line 1"}${order.shippingAddress?.addressLine2 ? ', ' + order.shippingAddress.addressLine2 : ''}, 
                  ${order.shippingAddress?.city || "City"}, ${order.shippingAddress?.state || "State"} - ${order.shippingAddress?.pincode || "Pincode"}
                </p>
              </div>
              <div>
                <p class="text-[9px] font-bold text-gray-400 border-b border-gray-200 pb-0.5 mb-1 uppercase tracking-wider">Ship To</p>
                <p class="font-bold text-gray-900 text-[11px] mb-0.5">${order.shippingAddress?.fullName || bill.customer.name}</p>
                <p class="text-gray-600 leading-snug text-[9px]">
                  ${order.shippingAddress?.phone || order.user?.phone || "+91 00000 00000"}<br/>
                  ${order.shippingAddress?.addressLine1 || "Billing Address Line 1"}${order.shippingAddress?.addressLine2 ? ', ' + order.shippingAddress.addressLine2 : ''}, 
                  ${order.shippingAddress?.city || "City"}, ${order.shippingAddress?.state || "State"} - ${order.shippingAddress?.pincode || "Pincode"}
                </p>
              </div>
            </div>

            <div class="mb-2">
              <table class="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr class="bg-gray-800 text-white text-[9px] uppercase tracking-wider">
                    <th class="py-1 px-1.5 font-semibold rounded-tl">Product Description</th>
                    <th class="py-1 px-1.5 font-semibold text-center">SKU</th>
                    <th class="py-1 px-1.5 font-semibold text-center">Qty</th>
                    <th class="py-1 px-1.5 font-semibold text-right">Unit Price</th>
                    <th class="py-1 px-1.5 font-semibold text-right">Tax (${order.taxPercent || 18}%)</th>
                    <th class="py-1 px-1.5 font-semibold text-right rounded-tr">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 border-b border-gray-200">
                  ${rows}
                </tbody>
              </table>
            </div>

            <div class="grid grid-cols-[1fr_220px] gap-4 mb-2">
              
              <div>
                <div class="bg-gray-50/50 p-2 rounded border border-gray-100 mb-2">
                  <h3 class="text-[9px] font-bold text-gray-800 mb-1 uppercase tracking-wider">Shipping Summary</h3>
                  <p class="text-[9px] text-gray-600 leading-relaxed">
                    <span class="text-gray-400">Method:</span> <strong class="text-gray-800">Standard Delivery • Delhivery</strong><br/>
                    <span class="text-gray-400">Tracking:</span> <strong class="text-[#5B3DF5]">DLV${order._id.slice(0, 8).toUpperCase()}</strong><br/>
                    <span class="text-gray-400">Expected:</span> <strong class="text-gray-800">${new Date(new Date(order.createdAt).getTime() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                  </p>
                </div>
              </div>

              <div class="bg-white p-2 rounded border-2 border-gray-100 shadow-sm">
                <div class="space-y-1 text-[10px]">
                  <div class="flex justify-between">
                    <span class="text-gray-500">Subtotal:</span>
                    <span class="font-semibold text-gray-800">₹${(order.subtotalAmount || order.totalAmount).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Discount:</span>
                    <span class="font-semibold text-red-500">-₹${(order.discountAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Tax Included:</span>
                    <span class="font-semibold text-gray-800">₹${(((order.totalAmount || 0) * 18) / 100).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>

                  <div class="pt-1.5 mt-1 border-t-2 border-gray-800">
                    <div class="flex justify-between items-center mb-0.5">
                      <span class="font-black text-gray-900 text-[10px]">GRAND TOTAL</span>
                      <span class="font-black text-base text-[#5B3DF5]">₹${order.totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                  </div>
                  <div class="border-t-2 border-gray-800 mt-1 mb-1"></div>

                  <div class="space-y-0.5 pt-0.5">
                    <div class="flex justify-between text-[9px]">
                      <span class="text-gray-500 font-medium">Amount Paid:</span>
                      <span class="font-bold text-green-600">${order.paymentStatus === 'paid' ? `₹${order.totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '₹0.00'}</span>
                    </div>
                    <div class="flex justify-between text-[9px]">
                      <span class="text-gray-500 font-medium">Balance Due:</span>
                      <span class="font-bold text-red-500">${order.paymentStatus === 'paid' ? '₹0.00' : `₹${order.totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-auto">
              <div class="mt-8 flex justify-end">
                <div class="text-center w-32">
                  <div class="h-6 border-b border-gray-800 mb-0.5"></div>
                  <p class="text-[8px] font-bold text-gray-600 uppercase">Authorized Signatory</p>
                </div>
              </div>

              <div class="border-t border-gray-300 pt-1.5 mt-1.5 text-[8px] text-gray-500 leading-tight">
                <div class="flex flex-col md:flex-row print:flex-row justify-between items-end gap-1">
                  <div>
                    <p class="font-black text-gray-800 text-[10px] mb-0.5">Thank You For Shopping!</p>
                    <p><strong>Support:</strong> contact@electrohub.com | +91 98765 43210</p>
                  </div>
                  <div class="text-right max-w-[250px]">
                    <p>• Goods once sold cannot be returned after 7 days.</p>
                    <p>• Computer generated invoice. Signature not required.</p>
                  </div>
                </div>
              </div>
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

  const renderProductRow = (order, item) => {
    const product = item.product;
    const subtotal = (item.price || 0) * (item.quantity || 1);
    const productId = product?._id;
    const key = reviewKey(order._id, productId);
    const draft = getReviewDraft(key);
    const reviewAllowed =
      Boolean(productId) && canReviewStatus(order.status) && !hasReviewedItem(item);
    const reviewVisible = Boolean(draft.visible);
    return (
      <div key={`${productId}-${item.price}`} className="d-flex flex-column gap-3 border-top border-theme py-3 px-3">
        <div className="d-flex flex-column flex-lg-row align-items-center gap-3">
          <img
            src={getImageUrl(product?.image)}
            alt={product?.name || "Product"}
            loading="lazy"
            decoding="async"
            style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "10px", border: "1px solid var(--border-color)" }}
          />
          <div className="flex-grow-1">
            <div className="fw-semibold text-primary-text">{product?.name || "Product"}</div>
            <div className="d-flex flex-wrap gap-3 text-muted-text small mt-1">
              <span>Qty: {item.quantity}</span>
              <span>Price: INR {item.price?.toFixed?.(2) ?? item.price}</span>
              <span>Subtotal: INR {subtotal.toFixed(2)}</span>
            </div>
          </div>
          <div className="text-lg-end text-muted-text small">
            <div className="fw-bold text-primary-text">INR {subtotal.toFixed(2)}</div>
            <div>Product total</div>
          </div>
        </div>
        {reviewAllowed && (
          <div className="border border-theme rounded-3 p-3 bg-surface-2 shadow-sm">
            {reviewVisible ? (
              <>
                <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                  {renderInteractiveStars(draft.rating, (value) =>
                    handleReviewFieldChange(order._id, productId, "rating", value)
                  )}
                  <small className="text-muted mb-0">Click stars to select rating</small>
                </div>
                <textarea
                  className="form-control mb-3 bg-surface-1 border-theme text-primary-text"
                  rows={2}
                  placeholder="Share your experience..."
                  value={draft.comment}
                  onChange={(e) =>
                    handleReviewFieldChange(order._id, productId, "comment", e.target.value)
                  }
                />
                <div className="d-flex flex-wrap justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => toggleReviewForm(order._id, productId)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    disabled={reviewSubmitting[key]}
                    onClick={() => handleReviewSubmit(order, item)}
                  >
                    {reviewSubmitting[key] ? "Submitting..." : "Submit review"}
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => toggleReviewForm(order._id, productId)}
              >
                Write a review
              </button>
            )}
          </div>
        )}
        {!reviewAllowed && canReviewStatus(order.status) && hasReviewedItem(item) && (
          <p className="text-muted small mb-0">Review already submitted.</p>
        )}
      </div>
    );
  };

  const getLatestNote = (order) => {
    const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    const lastNote = history[history.length - 1];
    return lastNote?.description || order.cancellationReason || "No updates yet";
  };

  return (
    <div className="bg-surface-2 min-h-screen transition-colors duration-400">
      <div className="container pb-5" style={{ maxWidth: "1100px", paddingTop: "120px" }}>
        <button onClick={() => navigate("/orders")} className="btn btn-outline-secondary mb-4 d-flex align-items-center gap-2">
          &larr; Back to Orders
        </button>
        <h1 className="mb-4 text-primary-text font-black fs-1">Order Details</h1>

      {loading ? (
        <p>Loading order details...</p>
      ) : !order ? (
        <p className="text-muted-text">Order not found.</p>
      ) : (
        <div className="d-flex flex-column gap-4">
          {(() => {
            const o = order;
            const timelineEntries = buildTimelineEntries(o);
            return (
              <div className="card shadow-sm border-theme bg-surface-1 rounded-[24px] overflow-hidden">
                <div className="card-body p-4">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
                    <div className="d-flex flex-column gap-2">
                      <div className="fs-6 text-muted-text font-bold">Order ID: {o._id}</div>
                      <div className="d-flex flex-wrap gap-2 align-items-center">
                        <span className="badge bg-surface-2 border border-theme text-primary-text">
                          {formatStatusLabel(o.status)}
                        </span>
                        <small className="text-muted-text">Placed on {new Date(o.createdAt).toLocaleString()}</small>
                      </div>
                    </div>
                    <div className="text-md-end d-flex flex-column gap-1">
                      <div className="fw-black text-primary-text">Total: INR {o.totalAmount?.toFixed?.(2) ?? o.totalAmount}</div>
                      {o.discountAmount > 0 && (
                        <div className="d-flex flex-column align-items-end">
                          <small className="text-success font-bold">Total Savings: INR {o.discountAmount}</small>
                          {o.offerName && (
                             <small className="text-success badge bg-success bg-opacity-10 mt-1">
                               🔥 {o.offerName} Applied
                             </small>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mb-4 d-flex flex-column flex-lg-row justify-content-between gap-3">
                    <div className="rounded-4 border border-theme bg-surface-2 p-3 text-primary-text font-bold" style={{ minWidth: 0 }}>
                      Note: {getLatestNote(o)}
                    </div>
                    <div className="d-flex justify-content-lg-end align-items-center gap-2">
                      {o.status !== 'cancelled' && (
                        <button 
                          className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2" 
                          onClick={() => handlePrintInvoice(o._id)}
                        >
                          <FaFileInvoice size={12} /> Invoice
                        </button>
                      )}
                      {["pending", "confirmed"].includes(o.status) && (
                        <button className="btn btn-outline-danger btn-sm" onClick={() => handleCancelClick(o._id)}>
                          Cancel Order
                        </button>
                      )}
                      {checkReturnEligibility(o) ? (
                        <button className="btn btn-outline-warning btn-sm fw-bold" onClick={() => handleReturnClick(o._id)}>
                          Return Order
                        </button>
                      ) : (
                        o.status === "delivered" && (!o.returnStatus || o.returnStatus === "none") && (
                          <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary px-3 py-2 rounded-lg">
                            Return window has expired.
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {returnModal.isOpen && returnModal.orderId === o._id && (
                    <div className="mb-4 p-5 rounded-[1.5rem] shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-4">
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight m-0">Return Order</h4>
                        </div>
                        <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-start gap-3">
                          <FaExclamationCircle className="text-amber-500 mt-0.5 shrink-0" size={18} />
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200 leading-relaxed m-0">
                            Please let us know why you are returning this product. Our team will review your request.
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            Return Reason <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-warning text-slate-800 dark:text-slate-200 font-medium transition-all"
                          >
                            <option value="Defective Product">Defective Product</option>
                            <option value="Wrong Product Received">Wrong Product Received</option>
                            <option value="Damaged Product">Damaged Product</option>
                            <option value="Product Not as Expected">Product Not as Expected</option>
                            <option value="Size/Color Issue">Size/Color Issue</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            Comments (Optional)
                          </label>
                          <textarea
                            value={customReturnReason}
                            onChange={(e) => setCustomReturnReason(e.target.value)}
                            placeholder="Provide more details about the issue..."
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-warning text-slate-800 dark:text-slate-200 min-h-[100px] resize-y transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            Upload Product Images (Optional, Max 3)
                          </label>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                              const files = Array.from(e.target.files);
                              if (files.length > 3) {
                                toast.error("You can only upload a maximum of 3 images.");
                                e.target.value = null; // reset
                                setReturnImages(files.slice(0, 3));
                              } else {
                                setReturnImages(files);
                              }
                            }}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none text-slate-800 dark:text-slate-200 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-warning/10 file:text-warning hover:file:bg-warning/20 cursor-pointer"
                          />
                          {returnImages.length > 0 && (
                            <p className="text-xs text-slate-500 mt-1">{returnImages.length} file(s) selected.</p>
                          )}
                        </div>

                        <div className="flex w-full gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                          <button
                            onClick={() => setReturnModal({ isOpen: false, orderId: null })}
                            className="flex-1 py-3 rounded-xl font-bold text-sm border border-slate-200 bg-white transition-colors hover:bg-slate-50 text-slate-700 shadow-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={submitReturnOrder}
                            className="flex-[2] py-3 rounded-xl font-bold text-sm text-white shadow-md transition-all active:scale-95 bg-warning hover:bg-warning-dark"
                          >
                            Submit Return Request
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {o.returnStatus && o.returnStatus !== "none" && (
                    <div className="mb-4 p-4 rounded-3 border border-warning bg-warning bg-opacity-10">
                      <h6 className="text-warning font-bold mb-3 flex items-center gap-2">
                        <FaExclamationCircle /> Return Details
                      </h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-text">Status:</span> <span className="font-semibold text-primary-text capitalize">{o.returnStatus.replace("_", " ")}</span></div>
                        <div><span className="text-muted-text">Date Requested:</span> <span className="font-semibold text-primary-text">{formatOrderTimestamp(o.returnRequestDate)}</span></div>
                        <div><span className="text-muted-text">Reason:</span> <span className="font-semibold text-primary-text">{o.returnReason || "N/A"}</span></div>
                        {o.returnComments && <div><span className="text-muted-text">Comments:</span> <span className="font-semibold text-primary-text">{o.returnComments}</span></div>}
                      </div>
                    </div>
                  )}
                  
                  {o.status === "cancelled" && (
                    <div className="mb-4 p-4 rounded-3 border border-rose-200 bg-rose-50 dark:bg-rose-900/10 dark:border-rose-800">
                      <h6 className="text-rose-700 dark:text-rose-400 font-bold mb-3 flex items-center gap-2">
                        <FaExclamationCircle /> Cancellation Details
                      </h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div><span className="text-slate-500">Status:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">Cancelled</span></div>
                        <div><span className="text-slate-500">Date:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{formatOrderTimestamp(o.cancelledAt)}</span></div>
                        <div><span className="text-slate-500">Reason:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{o.cancellationReason || "N/A"}</span></div>
                        <div><span className="text-slate-500">Payment Status:</span> <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">{o.paymentStatus}</span></div>
                      </div>
                    </div>
                  )}
                  {timelineEntries.length > 0 && (
                    <div className="order-timeline rounded-3 border border-theme bg-surface-2 p-4 mb-4">
                      <div style={timelineStyles.wrapper}>
                        <div style={timelineStyles.line} />
                        {timelineEntries.map((entry, index) => (
                          <div
                            key={`${entry.title}-${index}`}
                            className="d-flex gap-2 position-relative mb-3"
                            style={{ paddingLeft: "1rem", marginLeft: "0.25rem" }}
                          >
                            <span style={timelineStyles.dot} aria-hidden="true" />
                            <div>
                              <div className="fw-black small text-uppercase text-primary-text">{entry.title}</div>
                              {entry.description && (
                                <div className="text-muted-text small mb-1">{entry.description}</div>
                              )}
                              <div className="text-muted-text small">{formatOrderTimestamp(entry.date)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="border border-theme rounded-3 overflow-hidden">
                    {o.products?.map((item) => renderProductRow(o, item))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
      </div>

      {/* Cancel Order Modal */}
      <BaseModal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, orderId: null })}
        title="Cancel Order"
        size="md"
        footer={
          <>
            <button
              onClick={() => setCancelModal({ isOpen: false, orderId: null })}
              className="px-5 py-2.5 rounded-xl font-bold text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              Keep Order
            </button>
            <button
              onClick={submitCancelOrder}
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all active:scale-95 bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
            >
              Confirm Cancellation
            </button>
          </>
        }
      >
        <div className="flex flex-col space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-start gap-3">
            <FaExclamationCircle className="text-amber-500 mt-0.5 shrink-0" size={18} />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 leading-relaxed">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Please tell us why you are cancelling:
            </label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500/50 text-slate-800 dark:text-slate-200 font-medium transition-all"
            >
              <option value="Ordered by Mistake">Ordered by Mistake</option>
              <option value="Found Better Price">Found Better Price</option>
              <option value="Want to Change Product">Want to Change Product</option>
              <option value="Delivery Taking Too Long">Delivery Taking Too Long</option>
              <option value="Other">Other (Please specify)</option>
            </select>
          </div>

          {cancelReason === "Other" && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Additional Details (Optional):
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Briefly explain your reason for cancellation..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500/50 text-slate-800 dark:text-slate-200 min-h-[100px] resize-y transition-all"
              />
            </div>
          )}
        </div>
      </BaseModal>

    </div>
  );
};

export default UserOrderDetails;
