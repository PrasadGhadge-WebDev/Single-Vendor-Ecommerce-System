const fs = require('fs');

// --- 1. Update Backend (orderController.js) ---
const controllerPath = 'server/controllers/orderController.js';
let controllerContent = fs.readFileSync(controllerPath, 'utf8');

const newStatsFunction = `exports.getDashboardStats = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const timeFilter = {};
    if (dateFrom || dateTo) {
      timeFilter.createdAt = {};
      if (dateFrom) timeFilter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) timeFilter.createdAt.$lte = new Date(dateTo);
    }

    const [totalOrders, usersCount, totalProducts, revenueAggregate] = await Promise.all([
      Order.countDocuments(timeFilter),
      User.countDocuments(),
      Product.countDocuments(),
      Order.aggregate([
        { $match: { ...timeFilter, status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    const orderStatusSummary = await Order.aggregate([
      { $match: timeFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const lowStockProducts = await Product.find({ stock: { $lte: 10 } })
      .select("name stock")
      .sort({ stock: 1 })
      .limit(20);

    // Get recent orders
    const recentOrders = await Order.find(timeFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name")
      .lean();

    // Monthly Sales
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlySalesAggregate = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          sales: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlySales = monthlySalesAggregate.map(item => ({
      name: monthNames[item._id.month - 1],
      sales: item.sales
    }));

    // Top Products
    const topProductsAggregate = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          sales: { $sum: "$products.quantity" },
          revenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } }
        }
      },
      { $sort: { sales: -1 } },
      { $limit: 5 }
    ]);

    const topProductsPopulated = await Product.populate(topProductsAggregate, { path: "_id", select: "name" });
    const formattedTopProducts = topProductsPopulated.map(p => ({
      name: p._id ? p._id.name : "Unknown",
      sales: p.sales,
      revenue: p.revenue
    }));

    // Basic Growth calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Orders growth
    const currentOrders = await Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const prevOrders = await Order.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } });
    let ordersGrowth = 0;
    if (prevOrders > 0) ordersGrowth = ((currentOrders - prevOrders) / prevOrders) * 100;
    else if (currentOrders > 0) ordersGrowth = 100;

    // Users growth
    const currentUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const prevUsers = await User.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } });
    let usersGrowth = 0;
    if (prevUsers > 0) usersGrowth = ((currentUsers - prevUsers) / prevUsers) * 100;
    else if (currentUsers > 0) usersGrowth = 100;
    
    // Revenue growth
    const revCurrent = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const revPrev = await Order.aggregate([
      { $match: { createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }, status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const currRev = revCurrent[0]?.total || 0;
    const prevRev = revPrev[0]?.total || 0;
    let revGrowth = 0;
    if (prevRev > 0) revGrowth = ((currRev - prevRev) / prevRev) * 100;
    else if (currRev > 0) revGrowth = 100;

    res.status(200).json({
      totalUsers: usersCount,
      totalOrders,
      totalProducts,
      totalRevenue: revenueAggregate[0]?.total || 0,
      orderStatusSummary,
      lowStockProducts,
      recentOrders,
      monthlySales,
      topProducts: formattedTopProducts,
      growth: {
        revenue: revGrowth.toFixed(1),
        orders: ordersGrowth.toFixed(1),
        users: usersGrowth.toFixed(1)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};`;

controllerContent = controllerContent.replace(
  /exports\.getDashboardStats = async \(req, res\) => \{[\s\S]*?(?=exports\.deleteOrder =)/,
  newStatsFunction + '\n\n'
);
fs.writeFileSync(controllerPath, controllerContent);

// --- 2. Update Frontend (Dashboard.jsx) ---
const dashboardPath = 'client/src/pages/Admin/Dashboard.jsx';
let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

// Replace hardcoded growth values and fix alignment
dashboardContent = dashboardContent.replace(
  /growth: "↑ 12\.5%"/g,
  'growth: (stats?.growth?.revenue > 0 ? "↑ " : "↓ ") + Math.abs(stats?.growth?.revenue || 0) + "%"'
);
dashboardContent = dashboardContent.replace(
  /growth: "↑ 8\.2%"/g,
  'growth: (stats?.growth?.orders > 0 ? "↑ " : "↓ ") + Math.abs(stats?.growth?.orders || 0) + "%"'
);
dashboardContent = dashboardContent.replace(
  /growth: "↑ 5\.1%"/g,
  'growth: (stats?.growth?.users > 0 ? "↑ " : "↓ ") + Math.abs(stats?.growth?.users || 0) + "%"'
);
dashboardContent = dashboardContent.replace(
  /growth: "↑ 2\.4%"/g,
  'growth: "Dynamic"'
);

// Add dynamic growth color based on value
dashboardContent = dashboardContent.replace(
  /growthColor: "text-\[#10B981\]"/g,
  'growthColor: (stats?.growth?.revenue >= 0 || stats?.growth?.orders >= 0 || stats?.growth?.users >= 0) ? "text-[#10B981]" : "text-rose-500"'
);

// Fix the text alignment and overlapping by adding 'truncate w-full'
dashboardContent = dashboardContent.replace(
  /className="text-3xl font-black text-slate-800 tracking-tight mb-1"/g,
  'className="text-3xl lg:text-2xl 2xl:text-3xl font-black text-slate-800 tracking-tight mb-1 truncate w-full" title={item.value}'
);

// Fix container layout to ensure truncate works properly
dashboardContent = dashboardContent.replace(
  /<div>\s*<h3 className="text-3xl lg:text-2xl 2xl:text-3xl font-black text-slate-800 tracking-tight mb-1 truncate w-full"/g,
  '<div className="w-full min-w-0">\n                  <h3 className="text-3xl lg:text-2xl 2xl:text-3xl font-black text-slate-800 tracking-tight mb-1 truncate w-full"'
);

fs.writeFileSync(dashboardPath, dashboardContent);

console.log("Dashboard made dynamic and alignment fixed.");
