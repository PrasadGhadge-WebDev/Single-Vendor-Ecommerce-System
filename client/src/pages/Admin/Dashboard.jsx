import React, { useEffect, useState, useContext } from "react";
import API from "../../api";
import { AuthContext } from "../../context/AuthContext";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.token) return;
      try {
        setLoading(true);
        const { data } = await API.get("/orders/stats/dashboard");
        // Handle both response formats
        const statsData = data.stats || data;
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div>
      <h2>Admin Dashboard</h2>

      {loading || !stats ? (
        <p className="text-center mt-4">Loading stats...</p>
      ) : (
        <div className="row mt-4">
          <div className="col-md-3">
            <div className="card p-3 shadow">
              <h5>Total Orders</h5>
              <h3>{stats.totalOrders}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card p-3 shadow">
              <h5>Total Users</h5>
              <h3>{stats.totalUsers}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card p-3 shadow">
              <h5>Total Products</h5>
              <h3>{stats.totalProducts}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card p-3 shadow">
              <h5>Total Revenue</h5>
              <h3>₹ {stats.totalRevenue}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
