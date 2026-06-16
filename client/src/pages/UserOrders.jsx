import React, { useCallback, useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API, { getImageUrl } from "../api";
import { AuthContext } from "../context/AuthContext";
import { FaEye, FaShoppingBag } from "react-icons/fa";

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

const UserOrders = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="bg-surface-2 min-h-screen transition-colors duration-400">
      <div className="container pb-5" style={{ maxWidth: "1100px", paddingTop: "120px" }}>
        <h1 className="mb-4 text-primary-text font-black fs-1">My Orders</h1>

      {loading ? (
        <p>Loading your orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-muted-text">You have not placed any orders.</p>
      ) : (
        <div className="d-flex flex-column gap-4">
          {orders.map((o) => {
            return (
              <div key={o._id} className="card shadow-sm border-theme bg-surface-1 rounded-[24px] overflow-hidden transition-all hover:shadow-md cursor-pointer" onClick={() => navigate(`/orders/${o._id}`)}>
                <div className="card-body p-4">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                    <div className="d-flex flex-column gap-2 flex-grow-1">
                      <div className="d-flex align-items-center gap-2">
                        <FaShoppingBag className="text-primary" />
                        <div className="fs-6 text-muted-text font-bold">Order ID: {o._id}</div>
                      </div>
                      
                      {/* Product Preview Section */}
                      <div className="d-flex flex-wrap gap-3 mt-2 mb-2">
                        {o.products?.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="d-flex align-items-center gap-2 bg-surface-2 p-2 rounded-3 border border-theme" style={{ maxWidth: '250px' }}>
                            <img 
                              src={getImageUrl(item.product?.image)} 
                              alt={item.product?.name || 'Product'} 
                              className="rounded"
                              style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                            />
                            <div className="text-truncate text-primary-text small fw-semibold" title={item.product?.name}>
                              {item.product?.name || 'Unknown Product'}
                              <div className="text-muted-text" style={{ fontSize: '0.75rem' }}>Qty: {item.quantity}</div>
                            </div>
                          </div>
                        ))}
                        {o.products?.length > 3 && (
                          <div className="d-flex align-items-center justify-content-center bg-surface-2 rounded-3 border border-theme px-3 py-2 text-muted-text small fw-bold">
                            +{o.products.length - 3} more
                          </div>
                        )}
                      </div>

                      <div className="d-flex flex-wrap gap-2 align-items-center">
                        <span className="badge bg-surface-2 border border-theme text-primary-text">
                          {formatStatusLabel(o.status)}
                        </span>
                        <small className="text-muted-text">Placed on {new Date(o.createdAt).toLocaleString()}</small>
                      </div>
                    </div>
                    <div className="text-md-end d-flex flex-column gap-2 align-items-md-end shrink-0">
                      <div className="fw-black text-primary-text text-lg">Total: INR {o.totalAmount?.toFixed?.(2) ?? o.totalAmount}</div>
                      <div className="d-flex gap-2">
                        {checkReturnEligibility(o) && (
                          <button 
                            className="btn btn-outline-warning btn-sm d-flex align-items-center gap-2 rounded-pill px-3 fw-bold" 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/orders/${o._id}`);
                            }}
                          >
                            Return Order
                          </button>
                        )}
                        <button 
                          className="btn btn-primary btn-sm d-flex align-items-center gap-2 rounded-pill px-4" 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/orders/${o._id}`);
                          }}
                        >
                          <FaEye size={14} /> View Details
                        </button>
                      </div>
                    </div>
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
