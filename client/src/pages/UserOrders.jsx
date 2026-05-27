import React, { useCallback, useEffect, useState, useContext } from "react";
import API from "../api";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import { getImageUrl } from "../api";
import { FaStar, FaFileInvoice } from "react-icons/fa";

const ORDER_STATUS_LABELS = {
  pending: "Order Pending",
  confirmed: "Order Confirmed",
  processing: "Processing",
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

const UserOrders = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [reviewSubmitting, setReviewSubmitting] = useState({});

  const fetchOrders = useCallback(async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const { data } = await API.get("/orders/my-orders");
      setOrders(data);
    } catch (error) {
      console.error("Error fetching user orders:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  const cancelOrder = async (orderId) => {
    const reason = window.prompt("Cancellation reason (optional):", "");
    try {
      await API.put(`/orders/${orderId}/cancel`, { reason: reason || "" });
      toast.success("Order cancelled successfully");
      fetchOrders();
    } catch (error) {
      toast.error("Cancel failed: " + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
      fetchOrders();
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
      <div className="container py-5" style={{ maxWidth: "1100px", paddingTop: "120px" }}>
        <h3 className="mb-4 text-primary-text font-black">My Orders</h3>

      {loading ? (
        <p>Loading your orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-muted-text">You have not placed any orders.</p>
      ) : (
        <div className="d-flex flex-column gap-4">
          {orders.map((o) => {
            const timelineEntries = buildTimelineEntries(o);
            return (
              <div key={o._id} className="card shadow-sm border-theme bg-surface-1 rounded-[24px] overflow-hidden">
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
                      <small className="text-muted-text">Discount: INR {o.discountAmount || 0}</small>
                    </div>
                  </div>
                  <div className="mb-4 d-flex flex-column flex-lg-row justify-content-between gap-3">
                    <div className="rounded-4 border border-theme bg-surface-2 p-3 text-primary-text font-bold" style={{ minWidth: 0 }}>
                      Note: {getLatestNote(o)}
                    </div>
                    {(o.status === "pending" || o.status === "confirmed") && (
                      <div className="d-flex justify-content-lg-end align-items-center gap-2">
                        <button 
                          className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2" 
                          onClick={() => handlePrintInvoice(o._id)}
                        >
                          <FaFileInvoice size={12} /> Invoice
                        </button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => cancelOrder(o._id)}>
                          Cancel Order
                        </button>
                      </div>
                    )}
                    {!(o.status === "pending" || o.status === "confirmed") && (
                       <div className="d-flex justify-content-lg-end align-items-center">
                        <button 
                          className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2" 
                          onClick={() => handlePrintInvoice(o._id)}
                        >
                          <FaFileInvoice size={12} /> Download Invoice
                        </button>
                       </div>
                    )}
                  </div>
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
          })}
        </div>
      )}
      </div>
    </div>
  );
};

export default UserOrders;
