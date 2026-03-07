import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FaBoxOpen, FaClipboardList, FaRupeeSign, FaUsers, FaWarehouse } from "react-icons/fa";
import API from "../../api";
import { AuthContext } from "../../context/AuthContext";
import { downloadCsv } from "../../utils/adminHelpers";
import "./Dashboard.css";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#9333ea", "#0891b2"];

const formatCurrency = (value) =>
  `INR ${Number(value || 0).toLocaleString("en-IN", {
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

  const fetchStats = async (showLoader = true) => {
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
  };

  useEffect(() => {
    fetchStats();
  }, [user, dateFrom, dateTo]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = setInterval(() => {
      fetchStats(false);
    }, 30000);
    return () => clearInterval(timer);
  }, [autoRefresh, dateFrom, dateTo, user]);

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
    if (lowStockCondition === "critical") return lowStockData.filter((item) => item.stock > 0 && item.stock <= 2);
    if (lowStockCondition === "reorder") return lowStockData.filter((item) => item.stock >= 3 && item.stock <= 5);
    return lowStockData;
  }, [lowStockData, lowStockCondition]);

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
      label: "Total Orders",
      value: Number(stats?.totalOrders || 0).toLocaleString("en-IN"),
      icon: <FaClipboardList />,
      tone: "blue",
    },
    {
      label: "Total Users",
      value: Number(stats?.totalUsers || 0).toLocaleString("en-IN"),
      icon: <FaUsers />,
      tone: "green",
    },
    {
      label: "Total Products",
      value: Number(stats?.totalProducts || 0).toLocaleString("en-IN"),
      icon: <FaBoxOpen />,
      tone: "amber",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: <FaRupeeSign />,
      tone: "purple",
    },
  ];

  const exportSummary = () => {
    downloadCsv("dashboard-summary.csv", [
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

  const exportOrderStatus = () => {
    downloadCsv(
      "dashboard-order-status.csv",
      orderStatusData.map((item) => ({ status: item.name, orders: item.value }))
    );
  };

  const exportTopSuppliers = () => {
    downloadCsv(
      "dashboard-top-suppliers.csv",
      topSuppliersData.map((item) => ({
        supplier: item.name,
        amount: item.amount,
        units: item.units,
      }))
    );
  };

  return (
    <div className="dashboard-wrap">
      <div className="dashboard-hero card border-0">
        <div className="dashboard-hero-copy">
          <p className="dashboard-kicker mb-1">Admin Insights</p>
          <h2 className="mb-1">Business Performance Dashboard</h2>
          <p className="mb-0">
            Orders, inventory, supplier and purchase data in one place for faster decisions.
          </p>
        </div>
        <div className="dashboard-hero-chip">
          <FaWarehouse />
          <span>Inventory Value: {formatCurrency(supplierStats?.inventory?.inventoryValue || 0)}</span>
        </div>
      </div>

      <div className="dashboard-toolbar card border-0 p-3">
        <div className="row g-3 align-items-end">
          <div className="col-md-6 col-xl-3">
            <label className="form-label mb-1">From</label>
            <input type="datetime-local" className="form-control" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="col-md-6 col-xl-3">
            <label className="form-label mb-1">To</label>
            <input type="datetime-local" className="form-control" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="col-xl-4">
            <div className="dashboard-filter-actions">
              <button className="btn btn-outline-primary" onClick={() => fetchStats()}>
                Refresh
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                Reset
              </button>
            </div>
          </div>
          <div className="col-xl-2">
            <div className="form-check form-switch dashboard-refresh-toggle">
              <input
                className="form-check-input"
                type="checkbox"
                id="dashboardAutoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="dashboardAutoRefresh">
                Live 30s
              </label>
            </div>
          </div>
        </div>
        <div className="dashboard-export-actions mt-3">
          <button className="btn btn-sm btn-primary" onClick={exportSummary}>
            Export Summary
          </button>
          <button className="btn btn-sm btn-outline-primary" onClick={exportOrderStatus}>
            Export Order Status
          </button>
          <button className="btn btn-sm btn-outline-primary" onClick={exportTopSuppliers}>
            Export Top Suppliers
          </button>
        </div>
      </div>

      {loading || !stats ? (
        <p className="text-center mt-4">Loading stats...</p>
      ) : (
        <>
          <div className="row g-3 mt-1">
            {metricCards.map((item) => (
              <div className="col-md-6 col-xl-3" key={item.label}>
                <div className={`dashboard-metric-card tone-${item.tone}`}>
                  <div className="dashboard-metric-icon">{item.icon}</div>
                  <div>
                    <p className="dashboard-metric-label mb-1">{item.label}</p>
                    <h4 className="dashboard-metric-value mb-0">{item.value}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="row g-3 mt-1">
            <div className="col-lg-6">
              <div className="dashboard-panel card border-0 h-100">
                <h5 className="dashboard-panel-title">Order Status Distribution</h5>
                {orderStatusData.length === 0 ? (
                  <p className="text-muted mb-0">No order status data available.</p>
                ) : (
                  <div className="dashboard-chart">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={orderStatusData} dataKey="value" nameKey="name" outerRadius={94} label>
                          {orderStatusData.map((entry, index) => (
                            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            <div className="col-lg-6">
              <div className="dashboard-panel card border-0 h-100">
                <h5 className="dashboard-panel-title">Top Supplier Purchase Amount</h5>
                {topSuppliersData.length === 0 ? (
                  <p className="text-muted mb-0">No supplier purchase data available.</p>
                ) : (
                  <div className="dashboard-chart">
                    <ResponsiveContainer>
                      <BarChart
                        data={topSuppliersData}
                        layout="vertical"
                        margin={{ top: 8, right: 18, left: 10, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tickFormatter={formatCompactCurrency} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={120}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Bar
                          dataKey="amount"
                          name="Amount"
                          fill="#16a34a"
                          radius={[0, 8, 8, 0]}
                          barSize={28}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-lg-6">
              <div className="dashboard-panel card border-0 h-100">
                <div className="dashboard-panel-head">
                  <h5 className="dashboard-panel-title mb-0">Low Stock Trend</h5>
                  <select
                    className="form-select form-select-sm dashboard-select"
                    value={lowStockCondition}
                    onChange={(e) => setLowStockCondition(e.target.value)}
                  >
                    <option value="all">All Low Stock</option>
                    <option value="out">Out of Stock</option>
                    <option value="critical">Critical (1-2)</option>
                    <option value="reorder">Reorder (3-5)</option>
                  </select>
                </div>
                {lowStockConditionedData.length === 0 ? (
                  <p className="text-muted mb-0">No low stock products.</p>
                ) : (
                  <div className="dashboard-chart">
                    <ResponsiveContainer>
                      <LineChart data={lowStockConditionedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="stock" name="Stock" stroke="#dc2626" strokeWidth={2.5} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            <div className="col-lg-6">
              <div className="dashboard-panel card border-0 h-100">
                <h5 className="dashboard-panel-title">Inventory Snapshot</h5>
                <div className="dashboard-chart">
                  <ResponsiveContainer>
                    <BarChart data={inventorySnapshot}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
