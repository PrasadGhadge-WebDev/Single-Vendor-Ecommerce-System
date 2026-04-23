import React, { useCallback, useEffect, useState } from "react";
import API, { getImageUrl } from "../../api";
import { downloadCsv } from "../../utils/adminHelpers";
import "./BusinessSettings.css";
import { toast } from "react-toastify";
import { 
  FaStore, FaInfoCircle, FaCreditCard, FaTruck, FaFileInvoiceDollar, 
  FaCog, FaBell, FaSearch, FaShieldAlt, FaChartLine, FaReceipt 
} from "react-icons/fa";

const defaultSettings = {
  // General Settings
  storeName: "",
  logoUrl: "",
  email: "",
  phone: "",
  address: "",
  currency: "INR",
  timezone: "UTC",

  // Store Information
  businessName: "",
  gstNumber: "",
  ownerName: "",

  // Payment Settings
  codEnabled: true,
  onlinePaymentEnabled: false,
  upiId: "",
  razorpayKeyId: "",
  razorpayKeySecret: "",

  // Shipping Settings
  freeShippingEnabled: false,
  deliveryCharges: 0,
  minOrderAmount: 0,
  deliveryTime: "",

  // Tax Settings
  taxPercent: 0,
  isTaxInclusive: false,

  // Order Settings
  orderStatusFlow: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
  autoConfirmOrders: false,
  cancelEnabled: true,
  returnEnabled: true,

  // Notification Settings
  emailNotificationsEnabled: true,
  orderAlertsEnabled: true,

  // Policy Pages
  privacyPolicy: "",
  termsAndConditions: "",
  refundPolicy: "",

  // Legacy
  invoicePrefix: "INV",
  invoiceFooter: "Thank you for your purchase.",
};

const formatCurrency = (value, currency = "INR") =>
  `${currency} ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const BusinessSettings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [reports, setReports] = useState({ summary: null, statusSummary: [], orders: [] });
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [orderId, setOrderId] = useState("");
  const [activeTab, setActiveTab] = useState("general");

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await API.get("/business-settings");
      setSettings((prev) => ({ ...prev, ...data }));
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      const params = {};
      if (dateFrom) params.dateFrom = new Date(dateFrom).toISOString();
      if (dateTo) params.dateTo = new Date(dateTo).toISOString();
      const { data } = await API.get("/business-settings/reports", { params });
      setReports({
        summary: data.summary || null,
        statusSummary: Array.isArray(data.statusSummary) ? data.statusSummary : [],
        orders: Array.isArray(data.orders) ? data.orders : [],
      });
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSettings(), fetchReports()]);
      setLoading(false);
    };
    loadData();
  }, [fetchSettings, fetchReports]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.warning("Please select a valid image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.warning("File size should be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings((prev) => ({
        ...prev,
        logoUrl: String(reader.result || ""),
      }));
      toast.info("Logo captured. Save settings to apply.");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const codOnlyPayload = {
        ...settings,
        codEnabled: true,
        onlinePaymentEnabled: false,
        upiId: "",
        razorpayKeyId: "",
        razorpayKeySecret: "",
      };

      const { data } = await API.put("/business-settings", codOnlyPayload);
      setSettings((prev) => ({ ...prev, ...data }));
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const loadBill = async () => {
    if (!orderId.trim()) {
      toast.warning("Enter order ID");
      return;
    }
    try {
      const { data } = await API.get(`/business-settings/bills/${orderId.trim()}`);
      setBill(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load bill");
      setBill(null);
    }
  };

  const printBill = () => {
    if (!bill) return;
    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) return;
    
    const rows = bill.order.items
      .map((item, index) =>
          `<tr><td>${index + 1}</td><td>${item.productName}</td><td>${item.quantity}</td><td>${item.unitPrice}</td><td>${item.lineTotal}</td></tr>`
      ).join("");

    const printable = `
      <html><head><title>${bill.invoiceNumber}</title>
      <style>body{font-family:Arial;padding:24px;color:#111}table{width:100%;border-collapse:collapse;margin-top:12px}td,th{border:1px solid #ccc;padding:8px}</style>
      </head><body>
      <h2>${bill.business.businessName || bill.business.storeName}</h2>
      <p>${bill.business.address || ""}</p>
      <p>Invoice: <strong>${bill.invoiceNumber}</strong></p>
      <p>Customer: ${bill.customer.name} (${bill.customer.email || ""})</p>
      <table>
        <thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p>Subtotal: ${bill.order.subtotalAmount}</p>
      <p>Discount: ${bill.order.discountAmount}</p>
      <p>Tax (${bill.order.taxPercent}%): ${bill.order.taxAmount}</p>
      <h3>Grand Total: ${bill.order.grandTotal}</h3>
      <p>${bill.footerNote || ""}</p>
      </body></html>`;

    popup.document.write(printable);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const exportReportCsv = () => {
    downloadCsv(
      "business-report-orders.csv",
      reports.orders.map((order) => ({
        orderId: order._id,
        customer: order.user?.name || "Unknown",
        email: order.user?.email || "",
        totalAmount: order.totalAmount || 0,
        status: order.status,
        createdAt: order.createdAt,
      }))
    );
  };

  const tabs = [
    { id: "general", label: "General", icon: <FaStore /> },
    { id: "store", label: "Store Info", icon: <FaInfoCircle /> },
    { id: "payment", label: "Payment", icon: <FaCreditCard /> },
    { id: "shipping", label: "Shipping", icon: <FaTruck /> },
    { id: "tax", label: "Tax", icon: <FaFileInvoiceDollar /> },
    { id: "order", label: "Orders", icon: <FaCog /> },
    { id: "notification", label: "Notifications", icon: <FaBell /> },
    { id: "policies", label: "Policies", icon: <FaShieldAlt /> },
    { id: "reports", label: "Reports", icon: <FaChartLine /> },
    { id: "invoices", label: "Invoices", icon: <FaReceipt /> },
  ];

  if (loading) return <div className="bs-loading">Loading configuration...</div>;

  return (
    <div className="bs-container">
      <div className="bs-header">
        <h1>Business Settings</h1>
        <p>Configure and manage your store's global parameters</p>
      </div>

      <div className="bs-layout">
        <aside className="bs-sidebar">
          <nav>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={activeTab === tab.id ? "active" : ""}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="bs-content">
          <form onSubmit={handleSave}>
            {activeTab === "general" && (
              <section className="bs-section">
                <h3>General Settings</h3>
                <div className="bs-grid">
                  <div className="bs-field">
                    <label>Store Name</label>
                    <input name="storeName" value={settings.storeName} onChange={handleChange} placeholder="Enter store name" required />
                  </div>
                  <div className="bs-field full-width bs-logo-section">
                    <label>Store Logo</label>
                    <div className="bs-logo-wrapper">
                      <div className="bs-logo-preview">
                        {settings.logoUrl ? (
                          <img src={getImageUrl(settings.logoUrl)} alt="Store Logo Preview" />
                        ) : (
                          <div className="bs-logo-placeholder">No Logo</div>
                        )}
                      </div>
                      <div className="bs-logo-inputs">
                        <div className="mb-2">
                          <small className="text-muted d-block mb-1">Upload Logo</small>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="form-control form-control-sm" 
                            onChange={handleLogoUpload} 
                          />
                        </div>

                      </div>
                    </div>
                  </div>
                  <div className="bs-field">
                    <label>Email Address</label>
                    <input type="email" name="email" value={settings.email} onChange={handleChange} placeholder="Enter business email" />
                  </div>
                  <div className="bs-field">
                    <label>Phone Number</label>
                    <input name="phone" value={settings.phone} onChange={handleChange} placeholder="Enter business phone" />
                  </div>
                  <div className="bs-field full-width">
                    <label>Store Address</label>
                    <textarea name="address" value={settings.address} onChange={handleChange} placeholder="Enter store address" rows="3" />
                  </div>
                  <div className="bs-field">
                    <label>Currency</label>
                    <select name="currency" value={settings.currency} onChange={handleChange}>
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                  <div className="bs-field">
                    <label>Timezone</label>
                    <select name="timezone" value={settings.timezone} onChange={handleChange}>
                      <option value="UTC">UTC</option>
                      <option value="Asia/Kolkata">IST (Asia/Kolkata)</option>
                    </select>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "store" && (
              <section className="bs-section">
                <h3>Store Information</h3>
                <div className="bs-grid">
                  <div className="bs-field">
                    <label>Legal Business Name</label>
                    <input name="businessName" value={settings.businessName} onChange={handleChange} placeholder="Enter legal business name" />
                  </div>
                  <div className="bs-field">
                    <label>GST Number</label>
                    <input name="gstNumber" value={settings.gstNumber} onChange={handleChange} placeholder="Enter GST number" />
                  </div>
                  <div className="bs-field">
                    <label>Owner/Proprietor Name</label>
                    <input name="ownerName" value={settings.ownerName} onChange={handleChange} placeholder="Enter owner name" />
                  </div>
                </div>
              </section>
            )}

            {activeTab === "payment" && (
              <section className="bs-section">
                <h3>Payment Settings</h3>
                <p className="text-muted mb-3">
                  Payment system is set to <strong>Cash on Delivery (COD) only</strong>.
                </p>
                <div className="bs-field toggle">
                  <label>
                    <input type="checkbox" name="codEnabled" checked={settings.codEnabled} onChange={handleChange} disabled />
                    Enable Cash on Delivery (COD)
                  </label>
                </div>
              </section>
            )}

            {activeTab === "shipping" && (
              <section className="bs-section">
                <h3>Shipping Settings</h3>
                <div className="bs-field toggle">
                  <label>
                    <input type="checkbox" name="freeShippingEnabled" checked={settings.freeShippingEnabled} onChange={handleChange} />
                    Enable Global Free Shipping
                  </label>
                </div>
                <div className="bs-grid mt-4">
                  <div className="bs-field">
                    <label>Delivery Charges ({settings.currency})</label>
                    <input type="number" name="deliveryCharges" value={settings.deliveryCharges} onChange={handleChange} disabled={settings.freeShippingEnabled} />
                  </div>
                  <div className="bs-field">
                    <label>Minimum Order for Free Shipping ({settings.currency})</label>
                    <input type="number" name="minOrderAmount" value={settings.minOrderAmount} onChange={handleChange} />
                  </div>
                  <div className="bs-field">
                    <label>Estimated Delivery Time</label>
                    <input name="deliveryTime" value={settings.deliveryTime} onChange={handleChange} placeholder="Enter delivery time" />
                  </div>
                </div>
              </section>
            )}

            {activeTab === "tax" && (
              <section className="bs-section">
                <h3>Tax Settings</h3>
                <div className="bs-grid">
                  <div className="bs-field">
                    <label>Tax / GST (%)</label>
                    <input type="number" name="taxPercent" value={settings.taxPercent} onChange={handleChange} min="0" max="100" />
                  </div>
                  <div className="bs-field toggle self-end">
                    <label>
                      <input type="checkbox" name="isTaxInclusive" checked={settings.isTaxInclusive} onChange={handleChange} />
                      Prices are Inclusive of Tax
                    </label>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "order" && (
              <section className="bs-section">
                <h3>Order Settings</h3>
                <div className="bs-field toggle">
                  <label>
                    <input type="checkbox" name="autoConfirmOrders" checked={settings.autoConfirmOrders} onChange={handleChange} />
                    Auto-confirm new orders
                  </label>
                </div>
                <div className="bs-field toggle">
                  <label>
                    <input type="checkbox" name="cancelEnabled" checked={settings.cancelEnabled} onChange={handleChange} />
                    Allow customers to cancel orders
                  </label>
                </div>
                <div className="bs-field toggle">
                  <label>
                    <input type="checkbox" name="returnEnabled" checked={settings.returnEnabled} onChange={handleChange} />
                    Allow customers to return items
                  </label>
                </div>
              </section>
            )}

            {activeTab === "notification" && (
              <section className="bs-section">
                <h3>Notification Settings</h3>
                <div className="bs-field toggle">
                  <label>
                    <input type="checkbox" name="emailNotificationsEnabled" checked={settings.emailNotificationsEnabled} onChange={handleChange} />
                    Send Email Notifications (Order placed, Shipped)
                  </label>
                </div>
                <div className="bs-field toggle">
                  <label>
                    <input type="checkbox" name="orderAlertsEnabled" checked={settings.orderAlertsEnabled} onChange={handleChange} />
                    Enable Admin Order Alerts
                  </label>
                </div>
              </section>
            )}



            {activeTab === "policies" && (
              <section className="bs-section">
                <h3>Policy Pages</h3>
                <div className="bs-field full-width">
                  <label>Privacy Policy</label>
                  <textarea name="privacyPolicy" value={settings.privacyPolicy} onChange={handleChange} placeholder="Enter privacy policy text" rows="5" />
                </div>
                <div className="bs-field full-width mt-3">
                  <label>Terms & Conditions</label>
                  <textarea name="termsAndConditions" value={settings.termsAndConditions} onChange={handleChange} placeholder="Enter terms and conditions text" rows="5" />
                </div>
                <div className="bs-field full-width mt-3">
                  <label>Refund Policy</label>
                  <textarea name="refundPolicy" value={settings.refundPolicy} onChange={handleChange} placeholder="Enter refund policy text" rows="5" />
                </div>
              </section>
            )}

            {activeTab === "reports" && (
              <section className="bs-section">
                <div className="bs-flex-header">
                  <h3>Business Reports</h3>
                  <button type="button" className="btn-secondary" onClick={exportReportCsv}>Export CSV</button>
                </div>
                <div className="bs-date-filters mt-3">
                  <div className="bs-field">
                    <label>From</label>
                    <input type="datetime-local" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>
                  <div className="bs-field">
                    <label>To</label>
                    <input type="datetime-local" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                  <button type="button" className="btn-primary" onClick={fetchReports}>Apply Filter</button>
                </div>
                <div className="bs-metrics-grid mt-4">
                  <div className="bs-metric-card">
                    <span className="label">Total Orders</span>
                    <span className="value">{reports.summary?.orders || 0}</span>
                  </div>
                  <div className="bs-metric-card">
                    <span className="label">Gross Revenue</span>
                    <span className="value">{formatCurrency(reports.summary?.revenue || 0, settings.currency)}</span>
                  </div>
                  <div className="bs-metric-card success">
                    <span className="label">Net Revenue</span>
                    <span className="value">
                      {formatCurrency(Number(reports.summary?.revenue || 0) - Number(reports.summary?.discount || 0), settings.currency)}
                    </span>
                  </div>
                </div>
                <div className="bs-table-container mt-4">
                  <table className="bs-display-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.orders.slice(0, 10).map((order) => (
                        <tr key={order._id}>
                          <td>{order._id.slice(-8)}</td>
                          <td>{order.user?.name || "N/A"}</td>
                          <td>{order.totalAmount}</td>
                          <td><span className={`status-badge ${order.status}`}>{order.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === "invoices" && (
                <section className="bs-section">
                  <h3>Generate Invoice</h3>
                  <div className="bs-invoice-search">
                    <input placeholder="Enter Order ID" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
                    <button type="button" className="btn-primary" onClick={loadBill}>Load Bill</button>
                  </div>

                  {bill && (
                    <div className="bs-bill-preview mt-4">
                      <div className="bs-bill-actions">
                        <button type="button" className="btn-secondary" onClick={printBill}>Print PDF</button>
                      </div>
                      <div className="bs-bill-content">
                        <div className="bill-header">
                            <h4>Invoice: {bill.invoiceNumber}</h4>
                            <p>Date: {new Date(bill.generatedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="bill-parties">
                            <div>
                                <strong>From:</strong>
                                <p>{bill.business.storeName}<br/>{bill.business.address}</p>
                            </div>
                            <div>
                                <strong>To:</strong>
                                <p>{bill.customer.name}<br/>{bill.customer.email}</p>
                            </div>
                        </div>
                        <table className="bill-items">
                            <thead>
                                <tr><th>Product</th><th>Qty</th><th>Total</th></tr>
                            </thead>
                            <tbody>
                                {bill.order.items.map((item, i) => (
                                    <tr key={i}><td>{item.productName}</td><td>{item.quantity}</td><td>{item.lineTotal}</td></tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="bill-summary">
                            <p>Subtotal: {formatCurrency(bill.order.subtotalAmount, settings.currency)}</p>
                            <p>Tax ({bill.order.taxPercent}%): {formatCurrency(bill.order.taxAmount, settings.currency)}</p>
                            <h5>Total: {formatCurrency(bill.order.grandTotal, settings.currency)}</h5>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
            )}

            {activeTab !== "reports" && activeTab !== "invoices" && (
              <div className="bs-footer-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving Changes..." : "Save All Settings"}
                </button>
              </div>
            )}
          </form>
        </main>
      </div>
    </div>
  );
};

export default BusinessSettings;
