import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FaBoxOpen, FaClipboardList, FaRupeeSign, FaUsers, FaWarehouse, FaSync, FaChevronDown, FaFileCsv, FaChartLine, FaArrowUp, FaArrowDown, FaCube } from "react-icons/fa";
import API from "../../api";
import { AuthContext } from "../../context/AuthContext";
import { downloadCsv } from "../../utils/adminHelpers";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4"];

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const formatCompactCurrency = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  });

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [supplierStats, setSupplierStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lowStockCondition, setLowStockCondition] = useState("all");

  const fetchStats = useCallback(async (showLoader = true) => {
    if (!user?.token) return;
    try {
      if (showLoader) setLoading(true);
      const params = {};
      if (dateFrom) params.dateFrom = new Date(dateFrom).toISOString();
      if (dateTo) params.dateTo = new Date(dateTo).toISOString();

      const [{ data: orderData }, { data: supplierData }] = await Promise.all([
        API.get("/orders/stats/dashboard", { params }),
        API.get("/suppliers/analytics/overview", { params }),
      ]);

      setStats(orderData.stats || orderData);
      setSupplierStats(supplierData || null);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [dateFrom, dateTo, user?.token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = setInterval(() => {
      fetchStats(false);
    }, 30000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchStats]);

  const orderStatusData = useMemo(
    () =>
      (stats?.orderStatusSummary || []).map((item) => ({
        name: item._id || "unknown",
        value: item.count || 0,
      })),
    [stats]
  );

  const topSuppliersData = useMemo(
    () =>
      (supplierStats?.topSuppliers || []).map((item) => ({
        name: item.supplierName || "Unknown",
        amount: Number(item.totalAmount || 0),
        units: Number(item.totalUnits || 0),
      })),
    [supplierStats]
  );

  const lowStockData = useMemo(
    () =>
      (supplierStats?.lowStockProducts || stats?.lowStockProducts || []).map((item) => ({
        name: item.name,
        stock: Number(item.stock || 0),
      })),
    [stats, supplierStats]
  );

  const lowStockConditionedData = useMemo(() => {
    if (lowStockCondition === "out") return lowStockData.filter((item) => item.stock === 0);
    if (lowStockCondition === "critical") return lowStockData.filter((item) => item.stock > 0 && item.stock <= 3);
    if (lowStockCondition === "reorder") return lowStockData.filter((item) => item.stock >= 4 && item.stock <= 10);
    return lowStockData;
  }, [lowStockData, lowStockCondition]);

  const lowStockChartData = useMemo(
    () =>
      [...lowStockConditionedData]
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 10)
        .map((item) => ({
          ...item,
          shortName: item.name.length > 16 ? `${item.name.slice(0, 16)}...` : item.name,
          severity: item.stock === 0 ? "out" : item.stock <= 3 ? "critical" : "reorder",
        })),
    [lowStockConditionedData]
  );

  const inventorySnapshot = useMemo(
    () => [
      { label: "Products", value: Number(supplierStats?.inventory?.totalProducts || stats?.totalProducts || 0) },
      { label: "Stock Units", value: Number(supplierStats?.inventory?.totalStockUnits || 0) },
      { label: "Purchases", value: Number(supplierStats?.purchases?.totalPurchases || 0) },
      { label: "Purchase Units", value: Number(supplierStats?.purchases?.totalUnitsPurchased || 0) },
    ],
    [stats, supplierStats]
  );

  const metricCards = [
    {
      label: "Gross Revenue",
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: <FaRupeeSign />,
      color: "from-indigo-600 to-blue-600",
      shadow: "shadow-indigo-500/20",
      trend: "up"
    },
    {
      label: "Order Volume",
      value: Number(stats?.totalOrders || 0).toLocaleString("en-IN"),
      icon: <FaClipboardList />,
      color: "from-emerald-600 to-teal-600",
      shadow: "shadow-emerald-500/20",
      trend: "up"
    },
    {
      label: "Customer Base",
      value: Number(stats?.totalUsers || 0).toLocaleString("en-IN"),
      icon: <FaUsers />,
      color: "from-amber-500 to-orange-500",
      shadow: "shadow-amber-500/20",
      trend: "up"
    },
    {
      label: "Catalog Assets",
      value: Number(stats?.totalProducts || 0).toLocaleString("en-IN"),
      icon: <FaBoxOpen />,
      color: "from-purple-600 to-pink-600",
      shadow: "shadow-purple-500/20",
      trend: "up"
    },
  ];

  const exportSummary = () => {
    downloadCsv("enterprise_overview.csv", [
      {
        totalOrders: stats?.totalOrders || 0,
        totalUsers: stats?.totalUsers || 0,
        totalProducts: stats?.totalProducts || 0,
        totalRevenue: stats?.totalRevenue || 0,
        inventoryValue: supplierStats?.inventory?.inventoryValue || 0,
        totalPurchases: supplierStats?.purchases?.totalPurchases || 0,
      },
    ]);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-700 pb-10">
      {/* V3 Premium Module Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
        <div className="relative group">
          <div className="absolute -left-8 -top-8 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-700" />
          <div className="flex items-start gap-4 relative">
            <div className="w-1.5 h-12 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full shadow-lg shadow-indigo-500/20" />
            <div>
              <h1 className="text-4xl font-black tracking-tight flex items-center gap-3" style={{ color: 'var(--page-text)' }}>
                Command Center
                <span className="text-[10px] uppercase tracking-[0.3em] font-black px-2 py-1 bg-indigo-500/10 text-indigo-600 rounded-lg ml-2">
                  Analytics
                </span>
              </h1>
              <p className="text-sm font-bold opacity-40 uppercase tracking-[0.1em] mt-1.5">
                Real-time Enterprise Intelligence & Market Performance Metrics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex flex-col items-end px-6 py-2 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
            <p className="text-xl font-black text-indigo-600">{formatCurrency(supplierStats?.inventory?.inventoryValue || 0)}</p>
            <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">Global Asset Valuation</p>
          </div>
          <button 
            onClick={exportSummary}
            className="flex items-center gap-2 px-6 py-4 bg-white dark:bg-slate-800 border rounded-2xl hover:bg-slate-50 transition-all text-xs font-black shadow-sm" 
            style={{ borderColor: 'var(--border-color)', color: 'var(--page-text)' }}
          >
            <FaFileCsv className="text-indigo-600" />
            <span>EXPORT REPORTS</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Suite */}
      <div className="p-4 bg-white dark:bg-slate-900/60 rounded-3xl border shadow-xl shadow-indigo-500/5" style={{ borderColor: 'var(--border-color)' }}>
        <div className="grid grid-cols-1 xl:grid-cols-[1.75fr_auto] gap-4 items-center">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full items-end">
            <div className="relative">
              <label className="absolute -top-2 left-4 px-2 bg-white dark:bg-slate-900 text-[9px] font-black uppercase tracking-widest text-indigo-600 z-10">Period Origin</label>
              <input 
                type="datetime-local" 
                value={dateFrom} 
                onChange={(e) => setDateFrom(e.target.value)} 
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:bg-white dark:focus:bg-slate-800 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500/30 transition-all outline-none" 
              />
            </div>
            <div className="relative">
              <label className="absolute -top-2 left-4 px-2 bg-white dark:bg-slate-900 text-[9px] font-black uppercase tracking-widest text-indigo-600 z-10">Period Terminal</label>
              <input 
                type="datetime-local" 
                value={dateTo} 
                onChange={(e) => setDateTo(e.target.value)} 
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:bg-white dark:focus:bg-slate-800 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500/30 transition-all outline-none" 
              />
            </div>
            <div className="flex gap-2 col-span-1 md:col-span-2">
              <button onClick={() => fetchStats()} className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
                <FaSync size={12} className={loading ? "animate-spin" : ""} />
                <span>Hydrate Metrics</span>
              </button>
              <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="px-4 py-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-black uppercase active:scale-95 transition-all">
                Reset
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-2">
            <div className="relative inline-flex items-center cursor-pointer group">
              <input type="checkbox" id="dashboardAutoRefresh" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              <label htmlFor="dashboardAutoRefresh" className="ml-3 text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Live Sync 30s</label>
            </div>
          </div>
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex flex-col items-center justify-center h-64 opacity-30">
          <FaSync className="animate-spin text-indigo-600 mb-4" size={30} />
          <p className="text-sm font-black uppercase tracking-widest">Aggregating Enterprise Data...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Metric Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {metricCards.map((item) => (
              <div key={item.label} className="relative group">
                <div className={`p-6 bg-white dark:bg-slate-900 border rounded-[2rem] shadow-xl ${item.shadow} hover:-translate-y-2 transition-all duration-300 overflow-hidden`} style={{ borderColor: 'var(--border-color)' }}>
                  <div className={`absolute -right-6 -bottom-6 w-32 h-32 bg-gradient-to-br ${item.color} opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500 rounded-full`} />
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                      {React.cloneElement(item.icon, { size: 18 })}
                    </div>
                    <div className="flex items-center gap-1 text-emerald-500">
                      <FaArrowUp size={10} />
                      <span className="text-[10px] font-black">12.5%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-1">{item.label}</p>
                    <h3 className="text-2xl font-black tracking-tight" style={{ color: 'var(--page-text)' }}>{item.value}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900/60 rounded-[2.5rem] border shadow-xl p-8" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-lg font-black" style={{ color: 'var(--page-text)' }}>Operational Status</h4>
                  <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-1">Transaction Lifecycle distribution</p>
                </div>
                <div className="w-10 h-10 bg-indigo-500/5 rounded-xl flex items-center justify-center text-indigo-600">
                  <FaChartLine size={16} />
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                  <PieChart>
                    <Pie data={orderStatusData} dataKey="value" nameKey="name" outerRadius={100} innerRadius={60} paddingAngle={5} label>
                      {orderStatusData.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '16px', padding: '12px', color: '#fff' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/60 rounded-[2.5rem] border shadow-xl p-8" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-lg font-black" style={{ color: 'var(--page-text)' }}>Top Strategic Partners</h4>
                  <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-1">Highest value procurement sources</p>
                </div>
                <div className="w-10 h-10 bg-emerald-500/5 rounded-xl flex items-center justify-center text-emerald-600">
                  <FaUsers size={16} />
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                  <BarChart data={topSuppliersData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                    <XAxis type="number" tickFormatter={formatCompactCurrency} hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontWeight: 'bold', fill: 'currentColor' }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="amount" name="Procurement Value" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900/60 rounded-[2.5rem] border shadow-xl p-8" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-lg font-black" style={{ color: 'var(--page-text)' }}>Critical Stock Variance</h4>
                  <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-1">Inventory depletion forensic analysis</p>
                </div>
                <div className="relative">
                  <select
                    className="pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer"
                    value={lowStockCondition}
                    onChange={(e) => setLowStockCondition(e.target.value)}
                  >
                    <option value="all">Comprehensive</option>
                    <option value="out">Void Stock</option>
                    <option value="critical">Critical</option>
                    <option value="reorder">Low Reserve</option>
                  </select>
                  <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={8} />
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                  <BarChart data={lowStockChartData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="shortName" type="category" width={120} tick={{ fontSize: 10, fontWeight: 'bold', fill: 'currentColor' }} />
                    <Tooltip />
                    <Bar dataKey="stock" name="SKU Reserve" radius={[0, 10, 10, 0]} barSize={20}>
                      {lowStockChartData.map((item) => (
                        <Cell
                          key={`${item.name}`}
                          fill={item.severity === "out" ? "#ef4444" : item.severity === "critical" ? "#f97316" : "#f59e0b"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/60 rounded-[2.5rem] border shadow-xl p-8" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-lg font-black" style={{ color: 'var(--page-text)' }}>Catalog Distribution</h4>
                  <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-1">Operational asset snapshot</p>
                </div>
                <div className="w-10 h-10 bg-purple-500/5 rounded-xl flex items-center justify-center text-purple-600">
                  <FaCube size={16} />
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                  <BarChart data={inventorySnapshot}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 'bold', fill: 'currentColor' }} />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="value" fill="#a855f7" radius={[10, 10, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
