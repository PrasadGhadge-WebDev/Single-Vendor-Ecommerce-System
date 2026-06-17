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
import { FaSync, FaPlus, FaListAlt, FaFileDownload, FaTicketAlt, FaChartLine, FaClipboardList, FaBoxOpen } from "react-icons/fa";
import API from "../../api";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const COLORS = ["#F59E0B", "#5B3DF5", "#10B981", "#EF4444", "#a855f7", "#06b6d4"];

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
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async (showLoader = true) => {
    if (!user?.token) return;
    try {
      if (showLoader) setLoading(true);
      const { data: orderData } = await API.get("/orders/stats/dashboard");
      setStats(orderData.stats || orderData);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const orderStatusData = useMemo(
    () => {
      if (stats?.orderStatusSummary?.length) {
        return stats.orderStatusSummary.map((item) => ({
          name: item._id || "unknown",
          value: item.count || 0,
        }));
      }
      return [
        { name: "Pending", value: 45 },
        { name: "Packed", value: 30 },
        { name: "Delivered", value: 120 }
      ];
    },
    [stats]
  );

  const metricCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue ?? 0),
      icon: "💰",
      growth: (stats?.growth?.revenue > 0 ? "↑ " : "↓ ") + Math.abs(stats?.growth?.revenue || 0) + "%",
      growthColor: (stats?.growth?.revenue >= 0 || stats?.growth?.orders >= 0 || stats?.growth?.users >= 0) ? "text-[#10B981]" : "text-rose-500"
    },
    {
      label: "Total Orders",
      value: Number(stats?.totalOrders ?? 0).toLocaleString("en-IN"),
      icon: "📦",
      growth: (stats?.growth?.orders > 0 ? "↑ " : "↓ ") + Math.abs(stats?.growth?.orders || 0) + "%",
      growthColor: (stats?.growth?.revenue >= 0 || stats?.growth?.orders >= 0 || stats?.growth?.users >= 0) ? "text-[#10B981]" : "text-rose-500"
    },
    {
      label: "Total Customers",
      value: Number(stats?.totalUsers ?? 0).toLocaleString("en-IN"),
      icon: "👥",
      growth: (stats?.growth?.users > 0 ? "↑ " : "↓ ") + Math.abs(stats?.growth?.users || 0) + "%",
      growthColor: (stats?.growth?.revenue >= 0 || stats?.growth?.orders >= 0 || stats?.growth?.users >= 0) ? "text-[#10B981]" : "text-rose-500"
    },
    {
      label: "Total Products",
      value: Number(stats?.totalProducts ?? 0).toLocaleString("en-IN"),
      icon: "🛍️",
      growth: "Dynamic",
      growthColor: (stats?.growth?.revenue >= 0 || stats?.growth?.orders >= 0 || stats?.growth?.users >= 0) ? "text-[#10B981]" : "text-rose-500"
    },
    {
      label: "Low Stock Items",
      value: Number(stats?.lowStockProducts?.length ?? 0),
      icon: "⚠️",
      growth: "Action Needed",
      growthColor: "text-[#EF4444]"
    }
  ];

  const dynamicMonthlySales = useMemo(() => {
    return stats?.monthlySales || [];
  }, [stats]);

  const dynamicRecentOrders = useMemo(() => {
    return (stats?.recentOrders || []).map((order) => ({
      id: order._id.slice(-6).toUpperCase(),
      customer: order.user?.name || "Unknown",
      date: new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric"
      }),
      amount: order.totalAmount,
      status: order.status.charAt(0).toUpperCase() + order.status.slice(1)
    }));
  }, [stats]);

  const dynamicTopProducts = useMemo(() => {
    return stats?.topProducts || [];
  }, [stats]);

  const dynamicLowStockProducts = useMemo(() => {
    return stats?.lowStockProducts || [];
  }, [stats]);

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in duration-700" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0">Welcome Back Admin 👋</h1>
          <p className="text-sm text-gray-500 m-0 mt-1">HERE IS WHAT'S HAPPENING WITH YOUR STORE TODAY</p>
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex flex-col items-center justify-center h-64 opacity-30">
          <FaSync className="animate-spin text-[#5B3DF5] mb-4" size={30} />
          <p className="text-sm font-black uppercase tracking-widest">Loading Dashboard...</p>
        </div>
      ) : (
        <div className="space-y-8 mt-8">
          
          {/* ROW 1: KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {metricCards.map((item) => (
              <div key={item.label} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl">{item.icon}</div>
                  <span className={`text-sm font-bold ${item.growthColor}`}>{item.growth}</span>
                </div>
                <div className="w-full min-w-0">
                  <h3 className="text-3xl lg:text-2xl 2xl:text-3xl font-black text-slate-800 tracking-tight mb-1 truncate w-full" title={item.value}>{item.value}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ROW 2: Sales Chart & Order Status */}
          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
            {/* Sales Chart */}
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-lg font-black text-slate-800">Sales Analytics</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Monthly Revenue Performance</p>
                </div>
                <div className="w-10 h-10 bg-[#5B3DF5]/10 rounded-xl flex items-center justify-center text-[#5B3DF5]">
                  <FaChartLine size={16} />
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dynamicMonthlySales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 'bold', fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatCompactCurrency} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ fontWeight: 'bold' }}
                      cursor={{ fill: '#f1f5f9' }}
                    />
                    <Bar dataKey="sales" fill="#5B3DF5" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Order Status */}
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-lg font-black text-slate-800">Order Status</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Current Order Distribution</p>
                </div>
              </div>
              <div className="h-[300px] w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={orderStatusData} 
                      dataKey="value" 
                      nameKey="name" 
                      outerRadius={100} 
                      innerRadius={60} 
                      paddingAngle={5}
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ROW 3: Recent Orders */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-lg font-black text-slate-800">Recent Orders</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Latest transactions</p>
              </div>
              <div className="w-10 h-10 bg-[#10B981]/10 rounded-xl flex items-center justify-center text-[#10B981]">
                <FaClipboardList size={16} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Order ID</th>
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dynamicRecentOrders.length > 0 ? dynamicRecentOrders.map((order, idx) => (
                    <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 text-sm font-bold text-slate-800">#{order.id}</td>
                      <td className="py-4 text-sm font-bold text-slate-700">{order.customer}</td>
                      <td className="py-4 text-sm font-medium text-slate-500">{order.date}</td>
                      <td className="py-4 text-sm font-black text-[#5B3DF5]">{formatCurrency(order.amount)}</td>
                      <td className="py-4 text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          order.status === 'Delivered' ? 'bg-[#10B981]/10 text-[#10B981]' :
                          order.status === 'Pending' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                          order.status === 'Packed' ? 'bg-[#5B3DF5]/10 text-[#5B3DF5]' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-sm font-bold text-slate-400">No recent orders found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ROW 4 & 5 Container (2 Columns) */}
          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
            
            {/* ROW 4: Top Products */}
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-lg font-black text-slate-800">Top Selling Products</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Highest performing items</p>
                </div>
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600">
                  <FaBoxOpen size={16} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Product</th>
                      <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Sales</th>
                      <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dynamicTopProducts.length > 0 ? dynamicTopProducts.map((product, idx) => (
                      <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 text-sm font-bold text-slate-700">{product.name}</td>
                        <td className="py-4 text-sm font-bold text-slate-600 text-center bg-slate-50/50 rounded-lg">{product.sales}</td>
                        <td className="py-4 text-sm font-black text-[#10B981] text-right">{formatCurrency(product.revenue)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="3" className="py-8 text-center text-sm font-bold text-slate-400">No top products found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ROW 5: Quick Actions */}
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-8">
              <div className="mb-8">
                <h4 className="text-lg font-black text-slate-800">Quick Actions</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Frequently used tools</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => navigate('/admin/products/new')}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-[#5B3DF5]/5 hover:bg-[#5B3DF5]/10 border border-[#5B3DF5]/10 transition-colors group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#5B3DF5] flex items-center justify-center text-white shadow-lg shadow-[#5B3DF5]/30 group-hover:scale-105 transition-transform">
                    <FaPlus size={16} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-800">Add Product</h5>
                    <p className="text-xs text-slate-500">Create new inventory</p>
                  </div>
                </button>

                <button 
                  onClick={() => navigate('/admin/orders')}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-[#10B981]/5 hover:bg-[#10B981]/10 border border-[#10B981]/10 transition-colors group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#10B981] flex items-center justify-center text-white shadow-lg shadow-[#10B981]/30 group-hover:scale-105 transition-transform">
                    <FaListAlt size={16} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-800">Manage Orders</h5>
                    <p className="text-xs text-slate-500">View and update</p>
                  </div>
                </button>



                <button 
                  onClick={() => navigate('/admin/offers')}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-[#EF4444]/5 hover:bg-[#EF4444]/10 border border-[#EF4444]/10 transition-colors group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#EF4444] flex items-center justify-center text-white shadow-lg shadow-[#EF4444]/30 group-hover:scale-105 transition-transform">
                    <FaTicketAlt size={16} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-800">Create Coupon</h5>
                    <p className="text-xs text-slate-500">Add new discounts</p>
                  </div>
                </button>
              </div>
            </div>

          </div>

          {/* ROW 6: Low Stock Products */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-lg font-black text-slate-800">Low Stock Alert</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Products requiring immediate restock</p>
              </div>
              <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-600">
                <FaBoxOpen size={16} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Product</th>
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Remaining Stock</th>
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dynamicLowStockProducts.length > 0 ? dynamicLowStockProducts.map((product, idx) => (
                    <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 text-sm font-bold text-slate-700">{product.name}</td>
                      <td className="py-4 text-sm font-bold text-slate-600 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-black ${product.stock <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {product.stock} Units
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {product.stock <= 0 ? (
                          <span className="text-xs font-bold text-rose-600 uppercase tracking-wide">Out of Stock</span>
                        ) : (
                          <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">Low Stock</span>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="3" className="py-8 text-center text-sm font-bold text-slate-400">Inventory levels are healthy.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
