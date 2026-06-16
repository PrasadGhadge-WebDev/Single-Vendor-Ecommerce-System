import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../../api";
import { toast } from "react-toastify";
import { FaSearch, FaEye, FaPrint, FaWallet, FaDownload, FaExternalLinkAlt, FaCheck, FaArrowLeft, FaChevronDown } from "react-icons/fa";
import Pagination from "../../components/Pagination";
import html2pdf from "html2pdf.js";

const ManagePayments = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [payments, setPayments] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(false);
    
    const [stats, setStats] = useState({
        totalPayments: 0,
        totalReceived: 0,
        pendingAmount: 0,
        codPendingCount: 0
    });

    const [statusFilter, setStatusFilter] = useState("");
    const [orderStatusFilter, setOrderStatusFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [datePreset, setDatePreset] = useState("");

    const [viewPayment, setViewPayment] = useState(null); 
    const [paymentToMark, setPaymentToMark] = useState(null);
    
    // COD Fields
    const [codNotes, setCodNotes] = useState("");
    const [codRefNo, setCodRefNo] = useState("");
    const [markingPaid, setMarkingPaid] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState(null);

    const handleDatePresetChange = (e) => {
        const val = e.target.value;
        setDatePreset(val);
        
        const formatDate = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        if (val === "today") {
            const today = formatDate(new Date());
            setDateFrom(today);
            setDateTo(today);
        } else if (val === "last7days") {
            const today = new Date();
            const last7 = new Date();
            last7.setDate(today.getDate() - 7);
            setDateFrom(formatDate(last7));
            setDateTo(formatDate(today));
        } else if (val === "") {
            setDateFrom("");
            setDateTo("");
        }
        setPage(1);
    };

    const fetchStats = useCallback(async () => {
        try {
            const { data } = await API.get("/payments/stats");
            setStats(data);
        } catch (error) {
            console.error("Failed to load payment stats");
        }
    }, []);

    const fetchPayments = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true);
        try {
            const params = {
                page,
                status: statusFilter,
                orderStatus: orderStatusFilter,
                search: searchQuery,
                dateFrom,
                dateTo
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
    }, [page, statusFilter, orderStatusFilter, searchQuery, dateFrom, dateTo]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchPayments();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [fetchPayments]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.action-dropdown-container')) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleMarkAsPaid = async (orderId) => {
        if (!orderId) return;
        setMarkingPaid(true);
        try {
            await API.put(`/orders/${orderId}/pay`, {
                notes: codNotes,
                referenceNo: codRefNo,
                receivedBy: "Admin"
            });
            toast.success("Payment marked as paid successfully");
            fetchPayments(false);
            fetchStats();
            setPaymentToMark(null);
            if (viewPayment) fetchPayments(false); // We don't auto close view modal if open, but list updates
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to mark as paid");
        } finally {
            setMarkingPaid(false);
        }
    };

    const generateReceiptHtml = (payment) => {
        return `
            <html>
                <head>
                    <title>Payment Receipt</title>
                    <style>
                        body { font-family: 'Courier New', Courier, monospace; padding: 20px; line-height: 1.5; color: #000; }
                        h2 { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 20px;}
                        .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                        .footer { margin-top: 30px; text-align: center; border-top: 1px dashed #000; padding-top: 10px; }
                    </style>
                </head>
                <body>
                    <div style="width: 100%; max-width: 600px; margin: 0 auto;">
                        <h2>PAYMENT RECEIPT</h2>
                        <div class="row"><span>Payment ID:</span> <span>${payment._id}</span></div>
                        <div class="row"><span>Order ID:</span> <span>${payment.order?._id || "N/A"}</span></div>
                        <div class="row"><span>Customer:</span> <span>${payment.user?.name || "N/A"}</span></div>
                        <br/>
                        <div class="row"><span>Method:</span> <span>${payment.method}</span></div>
                        <div class="row"><span>Status:</span> <span>Paid</span></div>
                        <div class="row"><span>Amount:</span> <span>Rs. ${payment.amount?.toLocaleString('en-IN')}</span></div>
                        <br/>
                        <div class="row"><span>Paid Date:</span> <span>${new Date(payment.updatedAt || Date.now()).toLocaleDateString('en-IN')}</span></div>
                        <div class="row"><span>Received By:</span> <span>${payment.metadata?.receivedBy || "Admin"}</span></div>
                        ${payment.metadata?.referenceNo ? `<div class="row"><span>Ref No:</span> <span>${payment.metadata.referenceNo}</span></div>` : ""}
                        <div class="footer">Thank You</div>
                    </div>
                </body>
            </html>
        `;
    };

    const handlePrintReceipt = (payment) => {
        const receiptContent = generateReceiptHtml(payment);
        const printWindow = window.open("", "_blank");
        printWindow.document.write(receiptContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    const handleDownloadReceipt = (payment) => {
        const receiptContent = document.createElement("div");
        receiptContent.innerHTML = generateReceiptHtml(payment);
        const opt = {
            margin:       0.5,
            filename:     `Receipt_${payment._id}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(receiptContent).save();
    };

    const getStatusColor = (status) => {
        const s = String(status).toLowerCase();
        if (s === 'verified' || s === 'paid' || s === 'delivered') return 'bg-green-100 text-green-700 border-green-200';
        if (s === 'cod_pending' || s === 'created' || s === 'pending') return 'bg-orange-100 text-orange-700 border-orange-200';
        if (s === 'failed' || s === 'cancelled' || s === 'returned') return 'bg-red-100 text-red-700 border-red-200';
        if (s === 'refunded') return 'bg-blue-100 text-blue-700 border-blue-200';
        return 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const formatCurrency = (amount) => `₹ ${amount?.toLocaleString('en-IN')}`;

    const getDeliveryDate = (order) => {
        if (!order || !order.statusHistory) return "-";
        const deliveryEntry = order.statusHistory.find(h => h.status === 'delivered');
        return deliveryEntry ? new Date(deliveryEntry.createdAt).toLocaleString('en-IN') : "-";
    };

    const openMarkAsPaidModal = (payment) => {
        setPaymentToMark(payment);
        setCodNotes("");
        setCodRefNo(`COD-ORD-${payment.order?._id?.slice(-6).toUpperCase() || ""}`);
    };

    return (
        <div className="max-w-[1600px] mx-auto p-4 sm:p-8 space-y-6" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
            {viewPayment ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Header for Payment Details Page */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-200 pb-4">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/admin')}>Dashboard</span>
                                <span>/</span>
                                <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => setViewPayment(null)}>Payments</span>
                                <span>/</span>
                                <span className="text-gray-900 font-semibold">Payment Details</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setViewPayment(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors" title="Back to Payments">
                                    <FaArrowLeft className="text-gray-600" />
                                </button>
                                <h1 className="text-2xl font-bold text-gray-900 m-0">Payment Details</h1>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            {viewPayment.order?._id && (
                                <button onClick={() => navigate(`/admin/orders/${viewPayment.order._id}`)} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors text-sm font-bold inline-flex items-center gap-2 shadow-sm border border-indigo-100">
                                    <FaExternalLinkAlt /> View Order
                                </button>
                            )}
                            
                            {viewPayment.status !== 'verified' && viewPayment.order?.status?.toLowerCase() === 'delivered' && (
                                <button onClick={() => openMarkAsPaidModal(viewPayment)} className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors text-sm font-bold inline-flex items-center gap-2 shadow-sm">
                                    <FaCheck /> Mark as Paid
                                </button>
                            )}

                            {viewPayment.status === 'verified' && (
                                <>
                                    <button onClick={() => handlePrintReceipt(viewPayment)} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors text-sm font-bold inline-flex items-center gap-2 shadow-sm border border-emerald-100">
                                        <FaPrint /> Print Receipt
                                    </button>
                                    <button onClick={() => handleDownloadReceipt(viewPayment)} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors text-sm font-bold inline-flex items-center gap-2 shadow-sm border border-blue-100">
                                        <FaDownload /> Download PDF
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Cards Container */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Customer Information */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Customer Information</h3>
                            <div className="space-y-4">
                                <div><p className="text-xs text-gray-500 mb-1">Customer Name</p><p className="font-semibold text-base text-gray-900">{viewPayment.user?.name || "N/A"}</p></div>
                                <div><p className="text-xs text-gray-500 mb-1">Customer Email</p><p className="font-semibold text-base text-gray-900">{viewPayment.user?.email || "N/A"}</p></div>
                                <div><p className="text-xs text-gray-500 mb-1">Mobile Number</p><p className="font-semibold text-base text-gray-900">{viewPayment.order?.shippingAddress?.phone || viewPayment.user?.phone || "N/A"}</p></div>
                            </div>
                        </div>

                        {/* Order Information */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Order Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1"><p className="text-xs text-gray-500 mb-1">Order ID</p><p className="font-semibold text-base text-indigo-600">#{viewPayment.order?._id?.slice(-8).toUpperCase()}</p></div>
                                <div className="col-span-2 sm:col-span-1"><p className="text-xs text-gray-500 mb-1.5">Order Status</p>
                                    <span className={`inline-flex px-3 py-1 rounded-md text-xs font-black uppercase border ${getStatusColor(viewPayment.order?.status)}`}>
                                        {viewPayment.order?.status || "-"}
                                    </span>
                                </div>
                                <div className="col-span-2"><p className="text-xs text-gray-500 mb-1">Order Amount</p><p className="font-black text-2xl text-emerald-600">{formatCurrency(viewPayment.amount)}</p></div>
                                <div className="col-span-2 sm:col-span-1"><p className="text-xs text-gray-500 mb-1">Order Date</p><p className="font-semibold text-base text-gray-900">{viewPayment.order?.createdAt ? new Date(viewPayment.order.createdAt).toLocaleString('en-IN') : "-"}</p></div>
                                <div className="col-span-2 sm:col-span-1"><p className="text-xs text-gray-500 mb-1">Delivery Date</p><p className="font-semibold text-base text-gray-900">{getDeliveryDate(viewPayment.order)}</p></div>
                            </div>
                        </div>

                        {/* Payment Information */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Payment Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div><p className="text-xs text-gray-500 mb-1">Payment ID</p><p className="font-semibold text-base text-gray-900">{viewPayment._id.slice(-8).toUpperCase()}</p></div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1.5">Payment Status</p>
                                    <span className={`inline-flex px-3 py-1 rounded-md text-xs font-black uppercase border ${getStatusColor(viewPayment.status)}`}>
                                        {viewPayment.status === 'verified' ? 'Paid' : viewPayment.status.replace('cod_', '')}
                                    </span>
                                </div>
                                <div><p className="text-xs text-gray-500 mb-1">Payment Method</p><p className="font-bold text-base text-gray-900">Cash on Delivery (COD)</p></div>
                                {viewPayment.status === 'verified' && (
                                    <>
                                        <div><p className="text-xs text-gray-500 mb-1">Received By</p><p className="font-bold text-base text-emerald-700">{viewPayment.metadata?.receivedBy || "Admin"}</p></div>
                                        <div><p className="text-xs text-gray-500 mb-1">Paid Date</p><p className="font-bold text-base text-emerald-700">{viewPayment.updatedAt ? new Date(viewPayment.updatedAt).toLocaleString('en-IN') : "-"}</p></div>
                                        <div><p className="text-xs text-gray-500 mb-1">Reference No</p><p className="font-bold text-base text-emerald-700">{viewPayment.metadata?.referenceNo || "-"}</p></div>
                                        <div className="lg:col-span-2"><p className="text-xs text-gray-500 mb-1">Notes</p><p className="font-bold text-base text-emerald-700">{viewPayment.metadata?.notes || "No notes provided."}</p></div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 m-0">COD Payments</h1>
                            <p className="text-sm text-gray-500 m-0 mt-1">Manage Cash on Delivery collections and settlements</p>
                        </div>
                    </div>

            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total COD Payments</p>
                    <p className="text-2xl font-black text-indigo-600 mt-2">{formatCurrency(stats.totalPayments)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total COD Received</p>
                    <p className="text-2xl font-black text-green-600 mt-2">{formatCurrency(stats.totalReceived)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total COD Pending</p>
                    <p className="text-2xl font-black text-orange-500 mt-2">{stats.codPendingCount} Orders <span className="text-sm font-semibold text-gray-400 ml-1">({formatCurrency(stats.pendingAmount)})</span></p>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-nowrap overflow-x-auto gap-4 items-center hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex-[2] min-w-[200px] relative">
                    <input 
                        type="text" 
                        placeholder="Search by all columns..." 
                        value={searchQuery}
                        onChange={(e) => {setSearchQuery(e.target.value); setPage(1);}}
                        className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none truncate"
                    />
                    <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <select 
                    className="flex-1 min-w-[120px] px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none"
                    value={statusFilter} 
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                >
                    <option value="">Payment Status: All</option>
                    <option value="cod_pending">Pending</option>
                    <option value="verified">Paid</option>
                </select>

                <select 
                    className="flex-1 min-w-[120px] px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none"
                    value={orderStatusFilter} 
                    onChange={(e) => { setOrderStatusFilter(e.target.value); setPage(1); }}
                >
                    <option value="">Order Status: All</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="packed">Packed</option>
                    <option value="shipped">Shipped</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                </select>

                <select 
                    className="flex-1 min-w-[120px] px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none"
                    value={datePreset} 
                    onChange={handleDatePresetChange}
                >
                    <option value="">Creation Date</option>
                    <option value="today">Today</option>
                    <option value="last7days">Last 7 Days</option>
                    <option value="custom">Custom Range</option>
                </select>

                {datePreset === "custom" && (
                    <div className="flex items-center gap-2">
                        <input 
                            type="date"
                            value={dateFrom}
                            onChange={(e) => {setDateFrom(e.target.value); setPage(1);}}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none text-gray-500"
                        />
                        <span className="text-gray-400 text-xs">-</span>
                        <input 
                            type="date"
                            value={dateTo}
                            onChange={(e) => {setDateTo(e.target.value); setPage(1);}}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none text-gray-500"
                        />
                    </div>
                )}

                {(statusFilter !== "" || orderStatusFilter !== "" || searchQuery !== "" || datePreset !== "" || dateFrom !== "" || dateTo !== "") && (
                    <button 
                        onClick={() => {
                            setStatusFilter("");
                            setOrderStatusFilter("");
                            setSearchQuery("");
                            setDatePreset("");
                            setDateFrom("");
                            setDateTo("");
                            setPage(1);
                        }}
                        className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-bold transition-colors whitespace-nowrap shrink-0 ml-auto"
                    >
                        Reset
                    </button>
                )}
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto min-h-[280px]">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Payment ID</th>
                                <th className="px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Order Status</th>
                                <th className="px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Pay Status</th>
                                <th className="px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {payments.length > 0 ? payments.map((p, index) => {
                                const isPaid = p.status === 'verified';
                                const displayStatus = isPaid ? "Paid" : "Pending";
                                const orderStatus = p.order?.status || "N/A";
                                const isDelivered = orderStatus.toLowerCase() === 'delivered';
                                const isLastRows = index >= payments.length - 2 && payments.length >= 3;
                                
                                return (
                                <tr key={p._id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setViewPayment(p)}>
                                    <td className="px-3 py-3 text-xs font-semibold text-gray-600 truncate" title={p._id}>{p._id.slice(-8).toUpperCase()}</td>
                                    <td className="px-3 py-3 text-xs font-bold text-indigo-600 truncate">#{p.order?._id?.slice(-8).toUpperCase() || "N/A"}</td>
                                    <td className="px-3 py-3 text-sm truncate max-w-[150px]">
                                        <p className="font-semibold text-gray-800 truncate">{p.user?.name || "N/A"}</p>
                                    </td>
                                    <td className="px-3 py-3 text-sm font-bold text-gray-900">{formatCurrency(p.amount)}</td>
                                    <td className="px-3 py-3">
                                        <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${getStatusColor(orderStatus)}`}>
                                            {orderStatus}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${getStatusColor(p.status)}`}>
                                            {displayStatus}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-[11px] font-semibold text-gray-500">
                                        {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="relative inline-block text-left action-dropdown-container w-full text-center">
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setOpenDropdownId(openDropdownId === p._id ? null : p._id);
                                                }}
                                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs inline-flex items-center gap-1.5 transition-colors"
                                            >
                                                More <FaChevronDown className={`text-[10px] transition-transform ${openDropdownId === p._id ? 'rotate-180' : ''}`} />
                                            </button>
                                            
                                            {openDropdownId === p._id && (
                                                <div className={`absolute right-0 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden text-left ${isLastRows ? 'bottom-full mb-2' : 'mt-2'}`} onClick={e => e.stopPropagation()}>
                                                    <button 
                                                        onClick={() => { setViewPayment(p); setOpenDropdownId(null); }}
                                                        className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 flex items-center gap-2"
                                                    >
                                                        <FaEye className="text-blue-500" /> View Details
                                                    </button>
                                                    
                                                    {!isPaid && isDelivered && (
                                                        <button 
                                                            onClick={() => { openMarkAsPaidModal(p); setOpenDropdownId(null); }}
                                                            className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 flex items-center gap-2"
                                                        >
                                                            <FaCheck className="text-green-500" /> Mark as Paid
                                                        </button>
                                                    )}
                                                    
                                                    {p.order?._id && (
                                                        <button 
                                                            onClick={() => { navigate(`/admin/orders/${p.order._id}`); setOpenDropdownId(null); }}
                                                            className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 flex items-center gap-2"
                                                        >
                                                            <FaExternalLinkAlt className="text-purple-500" /> View Order
                                                        </button>
                                                    )}
                                                    
                                                    {isPaid && (
                                                        <>
                                                            <div className="border-t border-slate-100 my-1"></div>
                                                            <button 
                                                                onClick={() => { handlePrintReceipt(p); setOpenDropdownId(null); }}
                                                                className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 flex items-center gap-2"
                                                            >
                                                                <FaPrint className="text-emerald-500" /> Print Receipt
                                                            </button>
                                                            <button 
                                                                onClick={() => { handleDownloadReceipt(p); setOpenDropdownId(null); }}
                                                                className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 flex items-center gap-2"
                                                            >
                                                                <FaDownload className="text-rose-500" /> Download PDF
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}) : (
                                <tr>
                                    <td colSpan="8" className="px-4 py-12 text-center text-gray-400 font-semibold">
                                        No COD payments found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination currentPage={page} totalPages={pages} onPageChange={setPage} />
            </>
            )}

            {/* Mark as Paid Modal */}
            {paymentToMark && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-amber-50">
                            <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                                <FaWallet className="text-amber-600" /> Confirm COD Collection
                            </h2>
                            <button onClick={() => setPaymentToMark(null)} className="text-amber-700 hover:text-amber-900 p-1 text-xl leading-none">&times;</button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="text-center mb-6">
                                <p className="text-sm font-semibold text-gray-500 mb-1">Amount to Receive</p>
                                <p className="font-black text-3xl text-gray-900">{formatCurrency(paymentToMark.amount)}</p>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Reference Number <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    value={codRefNo}
                                    onChange={e => setCodRefNo(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Notes (Optional)</label>
                                <textarea 
                                    value={codNotes}
                                    onChange={e => setCodNotes(e.target.value)}
                                    rows="2"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                                    placeholder="E.g., Cash received directly from customer"
                                />
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button 
                                    onClick={() => setPaymentToMark(null)}
                                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => handleMarkAsPaid(paymentToMark.order?._id)}
                                    disabled={markingPaid}
                                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    {markingPaid ? "Processing..." : "Mark as Paid"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default ManagePayments;
