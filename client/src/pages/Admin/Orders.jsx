import React, { useEffect, useState, useContext } from "react";
import API from "../../api";
import { AuthContext } from "../../context/AuthContext";

const Orders = () => {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchOrders = async () => {
        if (!user?.token) return;

        try {
            setLoading(true);
            const { data } = await API.get("/orders");
            setOrders(data);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId, status) => {
        try {
            await API.put(`/orders/${orderId}`, { status });
            alert("Order status updated");
            fetchOrders();
        } catch (error) {
            alert("Error updating status: " + (error.response?.data?.message || error.message));
        }
    };

    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    return (
        <div>
            <h3>Orders</h3>

            {loading ? (
                <p>Loading orders...</p>
            ) : orders.length === 0 ? (
                <p className="text-muted">No orders found</p>
            ) : (
                <table className="table table-striped mt-3">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>User</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((o) => (
                            <tr key={o._id}>
                                <td>{o._id}</td>
                                <td>{o.user?.name || "Unknown"}</td>
                                <td>₹ {o.totalAmount}</td>
                                <td>
                                    <select
                                        value={o.status}
                                        onChange={(e) => updateStatus(o._id, e.target.value)}
                                        className="form-select form-select-sm"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </td>
                                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Orders;
