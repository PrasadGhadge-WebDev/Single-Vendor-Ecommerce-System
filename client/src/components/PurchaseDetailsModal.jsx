import React from "react";
import { FaTimes, FaFileInvoiceDollar, FaBuilding, FaBox, FaMoneyBillWave, FaDownload, FaPrint } from "react-icons/fa";
import { getImageUrl } from "../api";

const PurchaseDetailsModal = ({ purchase, onClose }) => {
  if (!purchase) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:bg-white print:p-0">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FaFileInvoiceDollar size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">Purchase Details</h2>
              <p className="text-sm text-slate-500 font-medium">{purchase.purchaseId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
              <FaPrint /> Print
            </button>
            <button onClick={onClose} className="w-10 h-10 bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 hover:text-rose-600 rounded-xl flex items-center justify-center transition-colors">
              <FaTimes size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 print:overflow-visible">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Purchase Info */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2"><FaFileInvoiceDollar /> Purchase Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Purchase ID</span><span className="font-bold">{purchase.purchaseId}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Date & Time</span><span className="font-bold">{new Date(purchase.purchaseDate).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Created By</span><span className="font-bold">Admin</span></div>
              </div>
            </div>

            {/* Supplier Info */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2"><FaBuilding /> Supplier Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Supplier Name</span><span className="font-bold text-indigo-600">{purchase.supplier?.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Contact Person</span><span className="font-bold">{purchase.supplier?.contactPerson || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Mobile Number</span><span className="font-bold">{purchase.supplier?.mobileNumber || purchase.supplier?.phone || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">GST Number</span><span className="font-bold">{purchase.supplier?.gstNumber || 'N/A'}</span></div>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="mb-8">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2"><FaBox /> Product Details</h3>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-bold text-slate-500">Product Name</th>
                    <th className="px-4 py-3 font-bold text-slate-500">Category</th>
                    <th className="px-4 py-3 font-bold text-slate-500 text-right">Quantity</th>
                    <th className="px-4 py-3 font-bold text-slate-500 text-right">Unit Cost</th>
                    <th className="px-4 py-3 font-bold text-slate-500 text-right">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="px-4 py-4 font-bold">{purchase.product?.name}</td>
                    <td className="px-4 py-4"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-bold">{purchase.product?.category}</span></td>
                    <td className="px-4 py-4 text-right font-black text-indigo-600">{purchase.quantity} Units</td>
                    <td className="px-4 py-4 text-right font-bold">₹{purchase.unitCost?.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right font-black text-lg">₹{purchase.totalCost?.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment & Invoice Info */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2"><FaMoneyBillWave /> Payment & Invoice</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Payment Status</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    purchase.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                    purchase.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {purchase.paymentStatus}
                  </span>
                </div>
                <div className="flex justify-between"><span className="text-slate-500">Payment Method</span><span className="font-bold">{purchase.paymentMethod || 'N/A'}</span></div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-3"><span className="text-slate-500">Supplier Invoice No</span><span className="font-bold">{purchase.invoiceNumber || 'N/A'}</span></div>
                {purchase.invoiceUrl && (
                  <div className="flex justify-between items-center print:hidden">
                    <span className="text-slate-500">Uploaded Invoice</span>
                    <a href={getImageUrl(purchase.invoiceUrl)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold text-xs bg-indigo-50 px-2 py-1 rounded">
                      <FaDownload /> View/Download
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-amber-50/50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/30 h-full">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-500 mb-2 flex items-center gap-2">Remarks / Notes</h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 italic whitespace-pre-wrap leading-relaxed">
                {purchase.notes || "No remarks provided for this purchase."}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PurchaseDetailsModal;
