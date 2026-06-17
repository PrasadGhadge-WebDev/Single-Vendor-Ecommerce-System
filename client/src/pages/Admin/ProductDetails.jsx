import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API, { getImageUrl } from "../../api";
import { toast } from "react-toastify";
import { 
  FaArrowLeft, FaEdit, FaBox, FaChartLine, FaStar, 
  FaTags, FaWarehouse, FaCubes, FaCommentDots, FaLayerGroup, FaHistory, FaArrowUp, FaArrowDown, FaExchangeAlt
} from "react-icons/fa";

const AdminProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchProduct();
  }, [id]);

    const [historyItems, setHistoryItems] = useState([]);
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
  };

  const fetchProduct = async () => {
    try {
      const { data } = await API.get(`/products/${id}`);
      setProduct(data);
    } catch (err) {
      toast.error("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="spinner-border text-indigo-600" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-20 text-slate-500">Product not found</div>;
  }

  const tabs = [
    { id: "overview", label: "Details", icon: FaBox },
    { id: "inventory", label: "Inventory", icon: FaWarehouse },
    { id: "variants", label: "Options", icon: FaCubes },
    { id: "history", label: "Stock History", icon: FaHistory },
    { id: "reviews", label: "Reviews", icon: FaCommentDots },
    { id: "analytics", label: "Stats", icon: FaChartLine },
  ];

  return (
    <div className="max-w-[1200px] mx-auto p-4 sm:p-8 space-y-6 animate-in fade-in duration-700" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border shadow-sm text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <FaArrowLeft />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              {product.image ? (
                <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <FaBox className="w-full h-full text-slate-200 p-4" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 m-0 flex items-center gap-3">
                {product.name}
                <span className={`text-[10px] px-2 py-1 rounded-md uppercase tracking-widest font-black ${
                  product.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                  product.status === 'Draft' ? 'bg-slate-200 text-slate-700' :
                  product.status === 'Inactive' ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'
                }`}>
                  {product.status}
                </span>
              </h1>
              <p className="text-sm text-slate-500 m-0 mt-1">SKU: {product.sku || 'N/A'} • {product.category}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(`/admin/products/edit/${product._id}`)}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors"
          >
            <FaEdit size={12} />
            Edit Product
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Sidebar Tabs */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-3xl p-3 border shadow-sm sticky top-28 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow bg-white rounded-3xl p-6 md:p-8 border shadow-sm">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FaBox className="text-indigo-500" /> Basic Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Product Name</p>
                    <p className="text-sm font-medium text-slate-800">{product.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Web Link (Slug)</p>
                    <p className="text-sm font-medium text-slate-800">{product.slug || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category & Brand</p>
                    <p className="text-sm font-medium text-slate-800">{product.category} {product.subCategory && `> ${product.subCategory}`} {product.brand && `• ${product.brand}`}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Price</p>
                    <p className="text-sm font-black text-indigo-600">₹{(product.price || 0).toLocaleString()} {product.discountPrice ? <span className="text-xs text-slate-400 line-through ml-2">₹{(product.discountPrice).toLocaleString()}</span> : null}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tax Rate & Buying Price</p>
                    <p className="text-sm font-medium text-slate-800">{product.taxClass || 'N/A'} • Buying Price: ₹{product.costPrice || '0'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Supplier</p>
                    <p className="text-sm font-medium text-slate-800">{product.supplier ? `${product.supplier.name} (${product.supplier.company})` : 'Direct'}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Summary</p>
                <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">{product.shortDescription || 'No short description provided.'}</p>
              </div>



            </div>
          )}

          {/* INVENTORY TAB */}
          {activeTab === 'inventory' && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FaWarehouse className="text-indigo-500" /> Inventory & Shipping
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Stock</p>
                  <p className={`text-2xl font-black ${product.stock <= 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{product.stock}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Stock Level</p>
                  <p className="text-sm font-black text-slate-700 mt-2">{product.stockStatus || 'In Stock'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Low Stock Alert</p>
                  <p className="text-sm font-black text-amber-600 mt-2">{product.lowStockAlert || 5} Units</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Stock ID (SKU)</p>
                  <p className="text-sm font-mono font-medium text-slate-700 mt-2">{product.sku || 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Shipping Size (L x W x H - Weight)</p>
                <div className="flex gap-4">
                  <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-500 mr-2">Length:</span>
                    <span className="text-sm font-bold">{product.shipping?.length || '-'} cm</span>
                  </div>
                  <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-500 mr-2">Width:</span>
                    <span className="text-sm font-bold">{product.shipping?.width || '-'} cm</span>
                  </div>
                  <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-500 mr-2">Height:</span>
                    <span className="text-sm font-bold">{product.shipping?.height || '-'} cm</span>
                  </div>
                  <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-500 mr-2">Weight:</span>
                    <span className="text-sm font-bold">{product.shipping?.weight || '-'} kg</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VARIANTS TAB */}
          {activeTab === 'variants' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                <FaCubes className="text-indigo-500" /> Product Options (Like Size or Color)
              </h2>
              
              {!product.variants || product.variants.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-500 font-medium">No options added to this product.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {product.variants.map((v, i) => (
                    <div key={i} className="flex flex-wrap md:flex-nowrap items-center gap-4 p-4 border rounded-2xl hover:bg-slate-50 transition-colors">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                        {v.image ? <img src={getImageUrl(v.image)} alt="variant" className="w-full h-full object-cover rounded-lg" /> : <FaBox className="text-slate-300" />}
                      </div>
                      <div className="flex-grow grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div><p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Size / Color</p><p className="text-sm font-medium">{v.size || '-'} / {v.color || '-'}</p></div>
                        <div><p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Storage / RAM</p><p className="text-sm font-medium">{v.storage || '-'} / {v.ram || '-'}</p></div>
                        <div><p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Price</p><p className="text-sm font-bold text-indigo-600">{v.price ? `₹${v.price}` : 'Default'}</p></div>
                        <div><p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Stock</p><p className="text-sm font-bold">{v.stock || 0}</p></div>
                        <div><p className="text-[10px] uppercase text-slate-400 font-bold mb-1">SKU</p><p className="text-sm font-mono text-slate-600">{v.sku || '-'}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          
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
                          <tr key={entry._id} className={`hover:bg-indigo-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                            <td className="px-4 py-3 border-r border-slate-100">
                              <p className="text-xs font-bold text-slate-700">{new Date(entry.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                              <p className="text-[10px] font-medium text-slate-400">{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </td>
                            <td className="px-4 py-3 border-r border-slate-100">{getEventBadge(entry.eventType)}</td>
                            <td className="px-4 py-3 border-r border-slate-100">
                              {entry.referenceId ? <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">{entry.referenceId}</span> : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-4 py-3 border-r border-slate-100 text-right">
                              <span className={`font-black text-xs ${isZero ? 'text-slate-400' : isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
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


          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                <FaCommentDots className="text-indigo-500" /> Customer Reviews
              </h2>
              <div className="flex items-center gap-6 p-6 bg-amber-50 border border-amber-100 rounded-2xl mb-6">
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-black text-amber-500">{product.averageRating || 0}</span>
                  <div className="flex text-amber-400 mt-1">
                    {[...Array(5)].map((_, i) => <FaStar key={i} className={i < Math.round(product.averageRating || 0) ? '' : 'text-slate-300'} />)}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Total Reviews: {product.numReviews || 0}</p>
                  <p className="text-xs text-slate-500">Based on verified customer purchases.</p>
                </div>
              </div>

              <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-slate-500 font-medium">Detailed review listing will appear here.</p>
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                <FaChartLine className="text-indigo-500" /> Store Stats
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
                  <p className="text-xs font-bold text-indigo-100 uppercase tracking-wider mb-2">Total Units Sold</p>
                  <p className="text-3xl font-black">{product.analytics?.unitsSold || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-600/20">
                  <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-2">Revenue Generated</p>
                  <p className="text-3xl font-black">₹{(product.analytics?.revenueGenerated || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Page Views</p>
                  <p className="text-3xl font-black text-slate-800">{product.analytics?.views || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Wishlisted By</p>
                  <p className="text-3xl font-black text-slate-800">{product.analytics?.wishlistCount || 0}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminProductDetails;
