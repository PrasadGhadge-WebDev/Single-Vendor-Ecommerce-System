import React, { useEffect, useState, useContext } from "react";
import API from "../api";
import { AuthContext } from "../context/AuthContext";

const UserOrders = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
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
  };

  const cancelOrder = async (orderId) => {
    const reason = window.prompt("Cancellation reason (optional):", "");
    try {
      await API.put(`/orders/${orderId}/cancel`, { reason: reason || "" });
      alert("Order cancelled successfully");
      fetchOrders();
    } catch (error) {
      alert("Cancel failed: " + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  return (
    <div className="container mt-4" style={{ maxWidth: "950px" }}>
      <h3>My Orders</h3>

      {loading ? (
        <p>Loading your orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-muted">You have not placed any orders.</p>
      ) : (
        <table className="table mt-3">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Total</th>
              <th>Discount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td>{o._id}</td>
                <td>INR {o.totalAmount}</td>
                <td>INR {o.discountAmount || 0}</td>
                <td>{o.status}</td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                <td>
                  {(o.status === "pending" || o.status === "confirmed") && (
                    <button className="btn btn-sm btn-outline-danger" onClick={() => cancelOrder(o._id)}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserOrders;
