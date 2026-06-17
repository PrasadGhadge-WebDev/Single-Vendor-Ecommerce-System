const fs = require('fs');
let code = fs.readFileSync('client/src/pages/Admin/ProductDetails.jsx', 'utf8');

const imports = `import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API, { getImageUrl } from "../../api";
import { toast } from "react-toastify";
import { 
  FaArrowLeft, FaEdit, FaBox, FaChartLine, FaStar, 
  FaTags, FaWarehouse, FaCubes, FaCommentDots, FaLayerGroup, FaHistory, FaArrowUp, FaArrowDown, FaExchangeAlt
} from "react-icons/fa";`;

code = code.replace(/import React.*?from "react-icons\/fa";/s, imports);

// Add the history tab
code = code.replace(
  /{ id: "variants", label: "Options", icon: FaCubes },/,
  '{ id: "variants", label: "Options", icon: FaCubes },\n    { id: "history", label: "Stock History", icon: FaHistory },'
);

// Add the fetchHistory logic and state
const historyState = `  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchStockHistory();
    }
  }, [activeTab]);

  const fetchStockHistory = async () => {
    try {
      setHistoryLoading(true);
      const { data } = await API.get('/stock-history', { params: { productId: id } });
      setHistoryItems(data.items || []);
    } catch (err) {
      toast.error('Failed to load stock history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const getEventBadge = (type) => {
    switch (type) {
      case 'PURCHASE':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700"><FaArrowDown size={8}/> Purchase</span>;
      case 'SALE':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-700"><FaArrowUp size={8}/> Order</span>;
      case 'CANCELLATION_RESTOCK':
      case 'RETURN':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700"><FaExchangeAlt size={8}/> Return</span>;
      case 'MANUAL_ADJUSTMENT':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-700"><FaHistory size={8}/> Adjustment</span>;
      case 'PURCHASE_UPDATE':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-teal-100 text-teal-700"><FaBox size={8}/> Purchase Edit</span>;
      case 'INITIAL_STOCK':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-700"><FaCubes size={8}/> Initial Stock</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">{type}</span>;
    }
  };`;

code = code.replace(/const fetchProduct = async \(\) => \{/, historyState + '\n\n  const fetchProduct = async () => {');

// Add the History Tab content
const historyTabContent = `
          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FaHistory className="text-indigo-500" /> Stock Audit Ledger
                </h2>
              </div>
              
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-r border-slate-200">Date & Time</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-r border-slate-200">Transaction</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-r border-slate-200">Ref / ID</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-r border-slate-200 text-right">Change</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-r border-slate-200 text-right">Balance</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Actor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyLoading ? (
                      <tr><td colSpan="6" className="text-center py-8 text-slate-400">Loading ledger...</td></tr>
                    ) : historyItems.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-8 text-slate-400 font-medium">No stock movements recorded yet.</td></tr>
                    ) : (
                      historyItems.map((entry, idx) => {
                        const isPositive = Number(entry.quantityChange) >= 0;
                        const isZero = Number(entry.quantityChange) === 0;
                        return (
                          <tr key={entry._id} className={\`hover:bg-indigo-50/50 transition-colors \${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}\`}>
                            <td className="px-4 py-3 border-r border-slate-100">
                              <p className="text-xs font-bold text-slate-700">{new Date(entry.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                              <p className="text-[10px] font-medium text-slate-400">{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </td>
                            <td className="px-4 py-3 border-r border-slate-100">{getEventBadge(entry.eventType)}</td>
                            <td className="px-4 py-3 border-r border-slate-100">
                              {entry.referenceId ? <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">{entry.referenceId}</span> : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-4 py-3 border-r border-slate-100 text-right">
                              <span className={\`font-black text-xs \${isZero ? 'text-slate-400' : isPositive ? 'text-emerald-600' : 'text-rose-600'}\`}>
                                {isPositive && !isZero ? '+' : ''}{entry.quantityChange}
                              </span>
                            </td>
                            <td className="px-4 py-3 border-r border-slate-100 text-right font-black text-xs text-slate-800">{entry.newStock}</td>
                            <td className="px-4 py-3 text-xs font-bold text-slate-600">{entry.actor?.name || 'System'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
`;

code = code.replace(/\{\/\* REVIEWS TAB \*\/\}/, historyTabContent + '\n\n          {/* REVIEWS TAB */}');

fs.writeFileSync('client/src/pages/Admin/ProductDetails.jsx', code);
console.log('ProductDetails.jsx updated successfully');
