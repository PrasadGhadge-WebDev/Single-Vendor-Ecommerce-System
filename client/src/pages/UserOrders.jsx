import React, { useCallback, useEffect, useState, useContext } from "react";
import API from "../api";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import { getImageUrl } from "../api";
import { FaStar } from "react-icons/fa";

const ORDER_STATUS_LABELS = {
  pending: "Order Pending",
  confirmed: "Order Confirmed",
  processing: "Processing",
  shipped: "Shipped",
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
      <div key={`${productId}-${item.price}`} className="d-flex align-items-center gap-3 border-bottom py-2 flex-column flex-lg-row">
        <img
          src={getImageUrl(product?.image)}
          alt={product?.name || "Product"}
          loading="lazy"
          decoding="async"
          style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--border-color)" }}
        />
        <div className="flex-grow-1">
          <div className="fw-semibold text-primary-text">{product?.name || "Product"}</div>
          <small className="text-muted-text d-block">Qty: {item.quantity}</small>
          <small className="text-muted-text d-block">Price: INR {item.price?.toFixed?.(2) ?? item.price}</small>
        </div>
        <div className="text-end">
          <small className="text-muted-text d-block">Subtotal</small>
          <div className="fw-bold text-primary-text">INR {subtotal}</div>
        </div>
        {reviewAllowed && (
          <div className="w-100 mt-3">
            {reviewVisible ? (
              <div className="border border-theme rounded-3 p-3 bg-surface-2 shadow-sm">
                <div className="d-flex align-items-center gap-2 mb-2">
                  {renderInteractiveStars(draft.rating, (value) =>
                    handleReviewFieldChange(order._id, productId, "rating", value)
                  )}
                  <small className="text-muted mb-0">Click stars to select rating</small>
                </div>
                <textarea
                  className="form-control mb-2 bg-surface-1 border-theme text-primary-text"
                  rows={2}
                  placeholder="Share your experience..."
                  value={draft.comment}
                  onChange={(e) =>
                    handleReviewFieldChange(order._id, productId, "comment", e.target.value)
                  }
                />
                <div className="d-flex justify-content-end gap-2">
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
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-outline-primary btn-sm mt-2"
                onClick={() => toggleReviewForm(order._id, productId)}
              >
                Write a review
              </button>
            )}
          </div>
        )}
        {!reviewAllowed && canReviewStatus(order.status) && hasReviewedItem(item) && (
          <p className="text-muted small mb-0 mt-2">Review already submitted.</p>
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
      <div className="container py-5" style={{ maxWidth: "1100px" }}>
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
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-2">
                    <div>
                      <div className="fs-6 text-muted-text font-bold">Order ID: {o._id}</div>
                      <div className="fw-black fs-5 text-primary-text">
                        Status: <span className="text-capitalize">{o.status}</span>
                      </div>
                      <small className="text-muted-text">Placed on {new Date(o.createdAt).toLocaleString()}</small>
                    </div>
                    <div className="text-md-end">
                      <div className="fw-black text-primary-text">Total: INR {o.totalAmount}</div>
                      <small className="text-muted-text">Discount: INR {o.discountAmount || 0}</small>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between flex-column flex-lg-row gap-2">
                      <div className="badge bg-surface-2 border border-theme text-primary-text text-wrap p-3 font-bold" style={{ maxWidth: "320px" }}>
                        Note: {getLatestNote(o)}
                      </div>
                      {(o.status === "pending" || o.status === "confirmed") && (
                        <button className="btn btn-outline-danger btn-sm" onClick={() => cancelOrder(o._id)}>
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                  {timelineEntries.length > 0 && (
                    <div className="order-timeline rounded-3 border border-theme bg-surface-2 px-3 py-2 mb-3">
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
