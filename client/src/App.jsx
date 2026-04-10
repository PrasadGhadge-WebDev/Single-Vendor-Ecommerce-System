import React, { useContext, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import CartProvider from "./context/CartContext";
import AuthProvider, { AuthContext } from "./context/AuthContext";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserOrders from "./pages/UserOrders";
import About from "./pages/About";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import ProductDetails from "./pages/ProductDetails";
import Offers from "./pages/Offers";
import ReplacementPolicy from "./pages/ReplacementPolicy";

import Dashboard from "./pages/Admin/Dashboard";
import AddProduct from "./pages/Admin/AddProduct";
import ManageProducts from "./pages/Admin/ManageProducts";
import Orders from "./pages/Admin/Orders";
import ManageCategories from "./pages/Admin/ManageCategories";
import ManageUsers from "./pages/Admin/ManageUsers";
import ManageOffers from "./pages/Admin/ManageOffers";
import ManageSuppliers from "./pages/Admin/ManageSuppliers";
import BusinessSettings from "./pages/Admin/BusinessSettings";
import AdminProfile from "./pages/Admin/AdminProfile";
import StockHistory from "./pages/Admin/StockHistory";
import ManageReviews from "./pages/Admin/ManageReviews";
import ManagePayments from "./pages/Admin/ManagePayments";

import Topbar from "./components/Topbar";
import Navbar from "./components/Navbar";

import Footer from "./components/Footer";
import AdminLayout from "./components/AdminLayout";

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/" replace />;

  return children;
};

const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="d-flex flex-column min-vh-100">
      {!isAdminRoute && <Topbar />}
      {!isAdminRoute && <Navbar />}

      <div className="flex-grow-1">{children}</div>
      {!isAdminRoute && <Footer />}
    </div>
  );
};

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.body.setAttribute("data-bs-theme", savedTheme);
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <LayoutWrapper>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/category/:categoryName" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/replacement-policy" element={<ReplacementPolicy />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="products" element={<ManageProducts />} />
                <Route path="categories" element={<ManageCategories />} />
                <Route path="users" element={<ManageUsers />} />
                <Route path="offers" element={<ManageOffers />} />
                <Route path="suppliers" element={<ManageSuppliers />} />
                <Route path="reviews" element={<ManageReviews />} />
                <Route path="business-settings" element={<BusinessSettings />} />
                <Route path="stock-history" element={<StockHistory />} />
                <Route path="profile" element={<AdminProfile />} />
                <Route path="add-product" element={<AddProduct />} />
                <Route path="orders" element={<Orders />} />
                <Route path="payments" element={<ManagePayments />} />
              </Route>

              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <UserOrders />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </LayoutWrapper>
          <ToastContainer
            position="top-right"
            autoClose={1800}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            theme="colored"
          />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
