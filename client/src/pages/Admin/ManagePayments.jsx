import React, { useEffect, useState, useCallback } from "react";
import API from "../../api";
import "./ManagePayments.css";
import { toast } from "react-toastify";
import { FaFilter, FaSearch, FaCreditCard, FaMoneyBillWave } from "react-icons/fa";

const ManagePayments = () => {
    const [payments, setPayments] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState("");
    const [methodFilter, setMethodFilter] = useState("");

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page,
                status: statusFilter,
                method: methodFilter
            };
            const { data } = await API.get("/payments", { params });
            setPayments(data.payments);
            setTotal(data.total);
            setPages(data.pages);
        } catch (error) {
            toast.error("Failed to load payments");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, methodFilter]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const getStatusColor = (status) => {
        switch (status) {
            case "verified": return "text-success bg-success-subtle";
            case "cod_pending": return "text-warning bg-warning-subtle";
            case "failed": return "text-danger bg-danger-subtle";
            case "created": return "text-primary bg-primary-subtle";
            default: return "text-secondary bg-secondary-subtle";
        }
    };

    return (
        <div className="manage-payments-container">
            <div className="mp-header">
                <div className="mp-title">
                    <h2>Payment Transactions</h2>
                    <p>Total Transactions: <strong>{total}</strong></p>
                </div>
                <div className="mp-actions">
                    <div className="filter-group">
                        <select 
                            className="form-select" 
                            value={methodFilter} 
                            onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
                        >
                            <option value="">All Methods</option>
                            <option value="ONLINE">Online</option>
                            <option value="COD">COD</option>
                        </select>
                        <select 
                            className="form-select" 
                            value={statusFilter} 
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        >
                            <option value="">All Statuses</option>
                            <option value="verified">Verified</option>
                            <option value="cod_pending">COD Pending</option>
                            <option value="created">Created</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="mp-loading">Loading transactions...</div>
            ) : (
                <div className="mp-table-wrapper card shadow-sm mt-4">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Reference</th>
                                    <th>Customer</th>
                                    <th>Order</th>
                                    <th>Method</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length > 0 ? payments.map((p) => (
                                    <tr key={p._id}>
                                        <td>
                                            <div className="mp-ref">
                                                {p.method === "ONLINE" ? <FaCreditCard className="text-primary" /> : <FaMoneyBillWave className="text-success" />}
                                                <small className="text-muted">{p.razorpayOrderId || p._id.slice(-8)}</small>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="mp-user">
                                                <strong>{p.user?.name || "N/A"}</strong>
                                                <small className="d-block text-muted">{p.user?.email}</small>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge border text-dark">#{p.order?._id?.slice(-8)}</span>
                                        </td>
                                        <td>
                                            <span className={`method-badge ${p.method.toLowerCase()}`}>
                                                {p.method}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="fw-bold">₹{p.amount?.toLocaleString()}</span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${getStatusColor(p.status)} p-2 px-3 rounded-pill fw-medium`}>
                                                {p.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            <small>{new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-5 text-muted">No transactions found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {pages > 1 && (
                        <div className="mp-pagination p-3 d-flex justify-content-between align-items-center">
                            <button 
                                className="btn btn-sm btn-outline-primary" 
                                disabled={page === 1}
                                onClick={() => setPage(prev => prev - 1)}
                            >
                                Previous
                            </button>
                            <span>Page {page} of {pages}</span>
                            <button 
                                className="btn btn-sm btn-outline-primary" 
                                disabled={page === pages}
                                onClick={() => setPage(prev => prev + 1)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ManagePayments;
