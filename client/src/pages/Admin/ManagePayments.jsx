import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../../api";
import { toast } from "react-toastify";
import { FaFilter, FaSearch, FaCreditCard, FaMoneyBillWave, FaSync, FaChevronDown, FaTrash, FaUser, FaBox, FaClock, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import Pagination from "../../components/Pagination";
import ConfirmModal from "../../components/ConfirmModal";

const ManagePayments = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [payments, setPayments] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const showModal = searchParams.get("modal") === "payment";
    const editingId = searchParams.get("id");
    const [editingPayment, setEditingPayment] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [methodFilter, setMethodFilter] = useState("");
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, paymentId: null });

    useEffect(() => {
        if (editingId) {
            const payment = payments.find(p => p._id === editingId);
            setEditingPayment(payment || null);
        } else {
            setEditingPayment(null);
        }
    }, [editingId, payments]);

    const fetchPayments = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true);
        try {
            const params = {
                page,
                status: statusFilter,
                method: methodFilter
            };
            const { data } = await API.get("/payments", { params });
            const list = Array.isArray(data.payments) ? data.payments : [];
            setPayments(list.filter(p => p._id));
            setTotal(data.total || 0);
            setPages(data.pages || 1);
        } catch (error) {
            toast.error("Failed to load payments");
            console.error(error);
        } finally {
            if (showLoader) setLoading(false);
        }
    }, [page, statusFilter, methodFilter]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const deletePayment = (id) => {
        setConfirmConfig({ isOpen: true, paymentId: id });
    };

    const handleConfirmDeletePayment = async () => {
        const id = confirmConfig.paymentId;
        if (!id) return;
        
        try {
            await API.delete(`/payments/${id}`);
            toast.success("Transaction record purged");
            setPayments((prev) => prev.filter((p) => p._id !== id));
        } catch (error) {
            toast.error("Purge failed");
        }
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
                                Payments
                                <span className="text-[10px] uppercase tracking-[0.3em] font-black px-2 py-1 bg-indigo-500/10 text-indigo-600 rounded-lg ml-2">
                                    Fintech
                                </span>
                            </h1>
                            <p className="text-sm font-bold opacity-40 uppercase tracking-[0.1em] mt-1.5">
                                Financial Ledger & Settlement Auditing Console
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <div className="flex flex-col items-end">
                        <p className="text-2xl font-black text-indigo-600">{total}</p>
                        <p className="text-[10px] font-black opacity-30 uppercase tracking-widest text-right">Settled Transactions</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 mx-2" />
                    <button 
                        onClick={() => fetchPayments()}
                        className="p-3 bg-white dark:bg-slate-800 border rounded-2xl hover:bg-slate-50 transition-all shadow-sm" 
                        style={{ borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
                    >
                        <FaSync size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Advanced Filter Suite */}
            <div className="p-4 bg-white dark:bg-slate-900/60 rounded-3xl border shadow-xl shadow-indigo-500/5 flex flex-col xl:flex-row gap-4 items-center" style={{ borderColor: 'var(--border-color)' }}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full xl:w-auto">
                    <div className="relative">
                        <select 
                            className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
                            value={methodFilter} 
                            onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
                        >
                            <option value="">Channel: All</option>
                            <option value="ONLINE">Digital (Online)</option>
                            <option value="COD">Cash on Delivery</option>
                        </select>
                        <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
                    </div>

                    <div className="relative">
                        <select 
                            className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer outline-none appearance-none font-bold opacity-70 hover:opacity-100"
                            value={statusFilter} 
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        >
                            <option value="">Status: All</option>
                            <option value="verified">Verified</option>
                            <option value="cod_pending">COD Pending</option>
                            <option value="created">Created</option>
                            <option value="failed">Failed</option>
                        </select>
                        <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
                    </div>

                    <button 
                        onClick={() => {
                            setStatusFilter("");
                            setMethodFilter("");
                            setPage(1);
                        }}
                        className="px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                    >
                        Reset Filters
                    </button>
                </div>
            </div>

            {/* Professional High-Density Data Grid */}
            <div className="bg-white dark:bg-slate-900/60 rounded-3xl border shadow-xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed min-w-[1100px]">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b" style={{ borderColor: 'var(--border-color)' }}>
                                <th className="w-[15%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Order ID</th>
                                <th className="w-[20%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700">Customer</th>
                                <th className="w-[12%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Amount</th>
                                <th className="w-[12%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Method</th>
                                <th className="w-[15%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Paid Date</th>
                                <th className="w-[12%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 border-r border-slate-200 dark:border-slate-700 text-center">Status</th>
                                <th className="w-[14%] px-4 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-800" style={{ borderColor: 'var(--border-color)' }}>
                            {payments.length > 0 ? payments.map((p, idx) => (
                                <tr 
                                    key={p._id || idx} 
                                    className={`group transition-all duration-200 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/30 dark:bg-slate-800/20'} hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5`}
                                >
                                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <FaBox className="text-indigo-500/40" size={12} />
                                            <span className="font-black text-[11px] tracking-tight text-indigo-600 uppercase">#{p.order?._id?.slice(-8).toUpperCase() || "N/A"}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                                        <div className="truncate">
                                            <p className="font-bold text-xs truncate" style={{ color: 'var(--page-text)' }}>{p.user?.name || "Anonymous"}</p>
                                            <p className="text-[9px] font-bold opacity-30 truncate">{p.user?.email || "No email"}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                                        <p className="text-sm font-black text-emerald-600">₹{p.amount?.toLocaleString('en-IN')}</p>
                                    </td>
                                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${p.method === "ONLINE" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"}`}>
                                            {p.method}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                                        <div className="flex flex-col items-center">
                                            <p className="text-[10px] font-bold opacity-70">{new Date(p.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                                            <p className="text-[8px] font-bold opacity-30 uppercase">{new Date(p.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-center">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                            p.status === 'verified' ? 'bg-emerald-500/10 text-emerald-600' :
                                            p.status === 'cod_pending' ? 'bg-amber-500/10 text-amber-600' :
                                            p.status === 'failed' ? 'bg-rose-500/10 text-rose-600' :
                                            'bg-slate-100 text-slate-500'
                                        }`}>
                                            {p.status === 'verified' ? 'Paid' : p.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold opacity-60">{new Date(p.createdAt).toLocaleDateString()}</p>
                                                <p className="text-[8px] font-bold opacity-30 uppercase tracking-tighter">{new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                            <button 
                                                onClick={() => deletePayment(p._id)}
                                                className="p-2 hover:bg-rose-600 hover:text-white rounded-lg transition-all text-slate-400"
                                                title="Purge Record"
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                            <FaExclamationCircle size={40} />
                                            <p className="font-black text-sm uppercase tracking-[0.2em]">Void Transaction Ledger</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination currentPage={page} totalPages={pages} onPageChange={setPage} />

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig({ isOpen: false, paymentId: null })}
                onConfirm={handleConfirmDeletePayment}
                title="Purge Transaction"
                message="Are you sure you want to permanently delete this payment record? This action will remove it from the financial ledger."
                confirmText="Purge Record"
            />
        </div>
    );
};

export default ManagePayments;
