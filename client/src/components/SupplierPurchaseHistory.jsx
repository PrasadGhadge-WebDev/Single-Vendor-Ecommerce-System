import React, { useEffect, useState, useMemo } from "react";
import { 
  FaSearch, FaEllipsisV, FaEye, FaEdit, FaDownload, 
  FaPrint, FaCheckCircle, FaTrash, FaFileInvoiceDollar, 
  FaMoneyBillWave, FaClock, FaBoxOpen
} from "react-icons/fa";
import API, { getImageUrl } from "../api";
import { toast } from "react-toastify";
import Pagination from "./Pagination";
import ConfirmModal from "./ConfirmModal";
import PurchaseDetailsModal from "./PurchaseDetailsModal";

const ITEMS_PER_PAGE = 10;

const SupplierPurchaseHistory = ({ supplierId = null }) => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Actions State
  const [viewingPurchase, setViewingPurchase] = useState(null);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
  const [paidConfirm, setPaidConfirm] = useState({ isOpen: false, id: null });
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Edit Form State
  const [editForm, setEditForm] = useState({ invoiceNumber: "", notes: "" });

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/suppliers/purchases");
      setPurchases(data || []);
    } catch (error) {
      toast.error("Failed to fetch purchase records");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  // Filtering Logic
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      // If a specific supplier is provided, ONLY show their purchases
      if (supplierId && p.supplier?._id !== supplierId && p.supplierId !== supplierId) {
        return false;
      }

      const term = search.toLowerCase();
      const matchesSearch = 
        p.purchaseId?.toLowerCase().includes(term) ||
        p.supplier?.name?.toLowerCase().includes(term) ||
        p.product?.name?.toLowerCase().includes(term) ||
        p.invoiceNumber?.toLowerCase().includes(term);

      const matchesStatus = statusFilter === "all" || p.paymentStatus === statusFilter;
      const matchesMethod = methodFilter === "all" || p.paymentMethod === methodFilter;

      let matchesDate = true;
      if (dateFrom || dateTo) {
        const pDate = new Date(p.purchaseDate);
        pDate.setHours(0, 0, 0, 0);
        if (dateFrom && pDate < new Date(dateFrom)) matchesDate = false;
        if (dateTo && pDate > new Date(dateTo)) matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesMethod && matchesDate;
    });
  }, [purchases, supplierId, search, statusFilter, methodFilter, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredPurchases.length / ITEMS_PER_PAGE));
  const paginatedPurchases = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPurchases.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPurchases, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, methodFilter, dateFrom, dateTo, supplierId]);

  // KPIs
  const totalPurchases = filteredPurchases.length;
  const totalAmount = filteredPurchases.reduce((sum, p) => sum + (p.totalCost || 0), 0);
  const pendingAmount = filteredPurchases.filter(p => p.paymentStatus !== 'PAID').reduce((sum, p) => sum + (p.remainingAmount || p.totalCost), 0);
  const paidCount = filteredPurchases.filter(p => p.paymentStatus === 'PAID').length;
  const pendingCount = filteredPurchases.filter(p => p.paymentStatus !== 'PAID').length;

  // Actions
  const handleMarkAsPaid = async () => {
    try {
      await API.put(`/suppliers/purchases/${paidConfirm.id}/mark-paid`);
      toast.success("Purchase marked as paid");
      fetchPurchases();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mark as paid");
    } finally {
      setPaidConfirm({ isOpen: false, id: null });
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/suppliers/purchases/${deleteConfirm.id}`);
      toast.success("Purchase record deleted and stock reverted");
      fetchPurchases();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete purchase");
    } finally {
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/suppliers/purchases/${editingPurchase._id}`, editForm);
      toast.success("Purchase record updated successfully");
      setEditingPurchase(null);
      fetchPurchases();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update purchase");
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><FaBoxOpen size={18} /></div>
            <p className="text-sm font-bold text-slate-500">Total Purchases</p>
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white">{totalPurchases}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><FaFileInvoiceDollar size={18} /></div>
            <p className="text-sm font-bold text-slate-500">Total Amount</p>
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white">₹{totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><FaClock size={18} /></div>
            <p className="text-sm font-bold text-slate-500">Pending Payments</p>
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white">₹{pendingAmount.toLocaleString()}</p>
          <p className="text-xs font-bold text-amber-600 mt-2">{pendingCount} Records</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><FaMoneyBillWave size={18} /></div>
            <p className="text-sm font-bold text-slate-500">Paid Purchases</p>
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white">{paidCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-4 flex flex-col lg:flex-row gap-4 items-center" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex-1 w-full relative">
          <input
            type="text"
            placeholder="Search by ID, Supplier, Product, Invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full lg:w-40 py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-medium cursor-pointer">
          <option value="all">All Status</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="PARTIAL">Partial</option>
        </select>

        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="w-full lg:w-48 py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-medium cursor-pointer">
          <option value="all">All Payment Methods</option>
          <option value="Cash">Cash</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="UPI">UPI</option>
          <option value="Cheque">Cheque</option>
          <option value="None">None</option>
        </select>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none w-full lg:w-36" title="From Date" />
          <span className="text-slate-400 font-bold">-</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none w-full lg:w-36" title="To Date" />
        </div>

        {(search || statusFilter !== 'all' || methodFilter !== 'all' || dateFrom || dateTo) && (
          <button 
            onClick={() => { setSearch(""); setStatusFilter("all"); setMethodFilter("all"); setDateFrom(""); setDateTo(""); }}
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/50">
                <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-slate-500">Purchase ID</th>
                <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-slate-500">Date</th>
                {!supplierId && <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-slate-500">Supplier</th>}
                <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-slate-500">Product</th>
                <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-slate-500 text-right">Quantity</th>
                <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-slate-500 text-right">Unit Cost</th>
                <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-slate-500 text-right">Total Cost</th>
                <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-slate-500 text-center">Status</th>
                <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-slate-500">Method</th>
                <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-slate-500">Invoice No</th>
                <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-slate-500 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={supplierId ? "10" : "11"} className="px-5 py-10 text-center text-slate-500">Loading purchase records...</td>
                </tr>
              ) : paginatedPurchases.length > 0 ? (
                paginatedPurchases.map((purchase) => (
                  <tr key={purchase._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4 font-bold text-indigo-600 dark:text-indigo-400">{purchase.purchaseId}</td>
                    <td className="px-5 py-4 text-slate-500 font-medium">{new Date(purchase.purchaseDate).toLocaleDateString()}</td>
                    {!supplierId && <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-200">{purchase.supplier?.name || "Unknown"}</td>}
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-700 dark:text-slate-200">{purchase.product?.name || "Unknown"}</div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-0.5">{purchase.product?.category}</div>
                    </td>
                    <td className="px-5 py-4 text-right font-black text-indigo-600">{purchase.quantity}</td>
                    <td className="px-5 py-4 text-right font-bold text-slate-600">₹{purchase.unitCost?.toLocaleString()}</td>
                    <td className="px-5 py-4 text-right font-black text-slate-800 dark:text-white">₹{purchase.totalCost?.toLocaleString()}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        purchase.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                        purchase.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {purchase.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 font-bold text-xs">{purchase.paymentMethod}</td>
                    <td className="px-5 py-4 text-slate-500 font-bold text-xs">{purchase.invoiceNumber || "-"}</td>
                    <td className="px-5 py-4 text-center">
                      <div className="relative inline-block text-left action-dropdown-container">
                        <button 
                          onClick={() => setActiveDropdown(activeDropdown === purchase._id ? null : purchase._id)}
                          className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <FaEllipsisV size={14} />
                        </button>
                        {activeDropdown === purchase._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1 origin-top-right animate-in zoom-in-95 duration-100">
                            <button onClick={() => { setViewingPurchase(purchase); setActiveDropdown(null); }} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                              <FaEye className="text-slate-400" /> View Details
                            </button>
                            <button onClick={() => { setEditingPurchase(purchase); setEditForm({ invoiceNumber: purchase.invoiceNumber || "", notes: purchase.notes || "" }); setActiveDropdown(null); }} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                              <FaEdit className="text-slate-400" /> Edit Record
                            </button>
                            {purchase.invoiceUrl && (
                              <a href={getImageUrl(purchase.invoiceUrl)} target="_blank" rel="noreferrer" className="w-full px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                <FaDownload className="text-slate-400" /> Download Invoice
                              </a>
                            )}
                            <button onClick={() => { setViewingPurchase(purchase); setActiveDropdown(null); setTimeout(() => window.print(), 300); }} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                              <FaPrint className="text-slate-400" /> Print Record
                            </button>
                            {purchase.paymentStatus !== "PAID" && (
                              <button onClick={() => { setPaidConfirm({ isOpen: true, id: purchase._id }); setActiveDropdown(null); }} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-2 text-emerald-600">
                                <FaCheckCircle /> Mark as Paid
                              </button>
                            )}
                            <div className="my-1 border-t border-slate-100 dark:border-slate-700"></div>
                            <button onClick={() => { setDeleteConfirm({ isOpen: true, id: purchase._id }); setActiveDropdown(null); }} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 text-rose-600">
                              <FaTrash /> Delete Record
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={supplierId ? "10" : "11"} className="px-5 py-12 text-center text-slate-500">
                    <FaFileInvoiceDollar className="mx-auto text-4xl text-slate-300 mb-3" />
                    <p className="text-base font-bold text-slate-600">No purchase records found</p>
                    <p className="text-xs mt-1">Adjust filters or record a new inventory purchase.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {paginatedPurchases.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-700/50">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewingPurchase && (
        <PurchaseDetailsModal purchase={viewingPurchase} onClose={() => setViewingPurchase(null)} />
      )}

      {/* Edit Modal (Inline for non-financial fields) */}
      {editingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-50 border-b flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg">Edit Purchase Record</h3>
                <p className="text-xs text-slate-500 font-bold">{editingPurchase.purchaseId}</p>
              </div>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Note</p>
                <p className="text-xs text-amber-800 font-medium mt-1">To ensure inventory ledger accuracy, financial and quantity fields cannot be edited. Delete and recreate if needed.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Invoice Number</label>
                <input type="text" value={editForm.invoiceNumber} onChange={(e) => setEditForm({ ...editForm, invoiceNumber: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Remarks / Notes</label>
                <textarea rows="4" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingPurchase(null)} className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-indigo-600/30">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmations */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Purchase Record"
        message="Are you sure you want to delete this purchase? This will permanently remove the record and DEDUCT the purchased quantity from the current product stock. This action cannot be undone."
        confirmText="Yes, Delete & Revert Stock"
        type="danger"
      />
      <ConfirmModal
        isOpen={paidConfirm.isOpen}
        onClose={() => setPaidConfirm({ isOpen: false, id: null })}
        onConfirm={handleMarkAsPaid}
        title="Mark as Paid"
        message="Are you sure you want to mark this purchase as fully paid? This will update the payment status to PAID and set the remaining balance to zero."
        confirmText="Mark Paid"
        type="primary"
      />

    </div>
  );
};

export default SupplierPurchaseHistory;
