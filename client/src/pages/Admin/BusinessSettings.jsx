import React, { useCallback, useEffect, useState } from "react";
import API, { getImageUrl } from "../../api";
import { downloadCsv } from "../../utils/adminHelpers";
import { toast } from "react-toastify";
import { 
  FaStore, FaInfoCircle, FaCreditCard, FaTruck, FaFileInvoiceDollar, 
  FaCog, FaBell, FaSearch, FaShieldAlt, FaChartLine, FaReceipt, 
  FaSync, FaSave, FaFileUpload, FaHistory, FaCheckCircle, FaExclamationTriangle,
  FaFileCsv, FaPrint, FaArrowRight
} from "react-icons/fa";

const defaultSettings = {
  storeName: "",
  logoUrl: "",
  email: "",
  phone: "",
  address: "",
  currency: "INR",
  timezone: "UTC",
  businessName: "",
  gstNumber: "",
  ownerName: "",
  codEnabled: true,
  onlinePaymentEnabled: false,
  upiId: "",
  razorpayKeyId: "",
  razorpayKeySecret: "",
  freeShippingEnabled: false,
  deliveryCharges: 0,
  minOrderAmount: 0,
  deliveryTime: "",
  taxPercent: 0,
  isTaxInclusive: false,
  orderStatusFlow: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
  autoConfirmOrders: false,
  cancelEnabled: true,
  returnEnabled: true,
  emailNotificationsEnabled: true,
  orderAlertsEnabled: true,
  privacyPolicy: "",
  termsAndConditions: "",
  refundPolicy: "",
  invoicePrefix: "INV",
  invoiceFooter: "Thank you for your purchase.",
  aboutStory: "",
  aboutMission: "",
};

const formatCurrency = (value, currency = "INR") =>
  `${currency === 'INR' ? '₹' : currency} ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

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
      const payload = {
        ...settings,
        codEnabled: true, // System enforced
        onlinePaymentEnabled: false,
      };

      const { data } = await API.put("/business-settings", payload);
      setSettings((prev) => ({ ...prev, ...data }));
      toast.success("Operational parameters synchronized");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const loadBill = async () => {
    if (!orderId.trim()) {
      toast.warning("Enter valid Order Reference");
      return;
    }
    try {
      const { data } = await API.get(`/business-settings/bills/${orderId.trim()}`);
      setBill(data);
      toast.success("Document retrieved");
    } catch (error) {
      toast.error("Document not found");
      setBill(null);
    }
  };

  const printBill = () => {
    if (!bill) return;
    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) {
      toast.error("Popup blocked");
      return;
    }
    
    const rows = bill.order.items
      .map((item, index) =>
          `<tr><td>${index + 1}</td><td>${item.productName}</td><td>${item.quantity}</td><td>${item.unitPrice}</td><td>${item.lineTotal}</td></tr>`
      ).join("");

    const printable = `
      <html><head><title>Invoice ${bill.invoiceNumber}</title>
      <style>
        body{font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;padding:40px;color:#333;line-height:1.6}
        .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;border-bottom:2px solid #eee;padding-bottom:20px}
        .logo{font-size:24px;font-weight:bold;color:#1a73e8}
        table{width:100%;border-collapse:collapse;margin:25px 0}
        th{background:#f8f9fa;color:#666;text-transform:uppercase;font-size:12px;padding:12px;border:1px solid #eee}
        td{border:1px solid #eee;padding:12px;text-align:left}
        .grand-total{font-size:18px;font-weight:bold;color:#000;border-top:2px solid #333;margin-top:10px;text-align:right}
      </style>
      </head><body>
      <div class="header">
        <div class="logo">${bill.business.businessName || bill.business.storeName}</div>
        <div style="text-align:right">
          <h2>INVOICE</h2>
          <p>#${bill.invoiceNumber}</p>
          <p>Date: ${new Date(bill.order.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="grand-total">Grand Total: ₹${bill.order.grandTotal.toLocaleString()}</div>
      </body></html>`;

    popup.document.write(printable);
    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 500);
  };

  const exportReportCsv = () => {
    downloadCsv(
      "performance_audit_orders.csv",
      reports.orders.map((order) => ({
        "Order ID": order._id,
        "Customer": order.user?.name || "Unknown",
        "Amount": order.totalAmount || 0,
        "Status": order.status,
        "Date": order.createdAt,
      }))
    );
  };

  const tabs = [
    { id: "general", label: "Core Configuration", icon: <FaStore /> },
    { id: "store", label: "Corporate Identity", icon: <FaInfoCircle /> },
    { id: "shipping", label: "Logistics Policy", icon: <FaTruck /> },
    { id: "tax", label: "Fiscal Settings", icon: <FaFileInvoiceDollar /> },
    { id: "order", label: "Workflow Logic", icon: <FaCog /> },
    { id: "notification", label: "Alert Systems", icon: <FaBell /> },
    { id: "policies", label: "Legal Framework", icon: <FaShieldAlt /> },
    { id: "reports", label: "Analytics Engine", icon: <FaChartLine /> },
    { id: "invoices", label: "Document Forge", icon: <FaReceipt /> },
    { id: "about", label: "Brand Narrative", icon: <FaInfoCircle /> },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 opacity-30">
      <FaSync className="animate-spin text-indigo-600 mb-4" size={30} />
      <p className="text-sm font-black uppercase tracking-widest">Hydrating Environment...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* V3 Premium Module Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 relative">
        <div className="relative group">
          <div className="absolute -left-8 -top-8 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-700" />
          <div className="flex items-start gap-4 relative">
            <div className="w-1.5 h-12 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full shadow-lg shadow-indigo-500/20" />
            <div>
              <h1 className="text-4xl font-black tracking-tight flex items-center gap-3" style={{ color: 'var(--page-text)' }}>
                System Settings
                <span className="text-[10px] uppercase tracking-[0.3em] font-black px-2 py-1 bg-indigo-500/10 text-indigo-600 rounded-lg ml-2">
                  Enterprise
                </span>
              </h1>
              <p className="text-sm font-bold opacity-40 uppercase tracking-[0.1em] mt-1.5">
                Centralized Governance & Operational Parameter Optimization Terminal
              </p>
            </div>
          </div>
        </div>

        {activeTab !== "reports" && activeTab !== "invoices" && (
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 group"
          >
            <FaSave size={14} className={saving ? "animate-spin" : "group-hover:scale-110 transition-transform"} />
            <span>{saving ? "SYNCHRONIZING..." : "SAVE ALL CONFIGURATIONS"}</span>
          </button>
        )}
      </div>

      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* Modern Sidebar */}
        <div className="w-full xl:w-72 shrink-0 bg-white dark:bg-slate-900/60 rounded-3xl border shadow-xl p-4" style={{ borderColor: 'var(--border-color)' }}>
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                    : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span className={activeTab === tab.id ? "text-white" : "text-indigo-500/40"}>
                  {React.cloneElement(tab.icon, { size: 14 })}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Configuration Content */}
        <div className="flex-grow w-full min-h-[600px] bg-white dark:bg-slate-900/60 rounded-3xl border shadow-xl p-8 relative overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none rotate-12">
            {React.cloneElement(tabs.find(t => t.id === activeTab)?.icon, { size: 200 })}
          </div>

          <form onSubmit={handleSave} className="relative z-10">
            {activeTab === "general" && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-xl font-black mb-2" style={{ color: 'var(--page-text)' }}>Core Configuration</h3>
                  <p className="text-xs font-bold opacity-30 uppercase tracking-widest">Base operational parameters and store identity</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Store Identity Name</label>
                    <input 
                      name="storeName" 
                      value={settings.storeName} 
                      onChange={handleChange} 
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none"
                      placeholder="e.g. Nexus Digital Solutions"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Support Channel Email</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={settings.email} 
                      onChange={handleChange} 
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Corporate Asset Logo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
                        {settings.logoUrl ? (
                          <img src={getImageUrl(settings.logoUrl)} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <FaStore className="opacity-20" size={24} />
                        )}
                      </div>
                      <label className="flex-grow cursor-pointer group">
                        <div className="flex items-center gap-3 px-6 py-3.5 bg-indigo-500/5 hover:bg-indigo-500/10 border border-dashed border-indigo-500/30 rounded-2xl transition-all">
                          <FaFileUpload className="text-indigo-600" />
                          <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Update Logo Asset</span>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Operational Timezone</label>
                    <select 
                      name="timezone" 
                      value={settings.timezone} 
                      onChange={handleChange}
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none appearance-none cursor-pointer"
                    >
                      <option value="UTC">Universal Coordinated (UTC)</option>
                      <option value="Asia/Kolkata">India Standard (IST)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Physical Headquarters Address</label>
                    <textarea 
                      name="address" 
                      value={settings.address} 
                      onChange={handleChange} 
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none min-h-[100px]"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "store" && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-xl font-black mb-2" style={{ color: 'var(--page-text)' }}>Corporate Identity</h3>
                  <p className="text-xs font-bold opacity-30 uppercase tracking-widest">Legal business information and tax registrations</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Legal Business Name</label>
                    <input name="businessName" value={settings.businessName} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">GST / Tax Identification</label>
                    <input name="gstNumber" value={settings.gstNumber} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Proprietor / Owner Authority</label>
                    <input name="ownerName" value={settings.ownerName} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-xl font-black mb-2" style={{ color: 'var(--page-text)' }}>Logistics Policy</h3>
                  <p className="text-xs font-bold opacity-30 uppercase tracking-widest">Shipping fee structures and delivery estimates</p>
                </div>
                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-6 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600">Free Shipping Protocol</h4>
                    <p className="text-[10px] font-bold opacity-40 mt-1">Enable globally applied zero-cost shipping for all transactions</p>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="freeShippingEnabled" checked={settings.freeShippingEnabled} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Base Delivery Charge (INR)</label>
                    <input 
                      type="number" 
                      name="deliveryCharges" 
                      value={settings.deliveryCharges} 
                      onChange={handleChange} 
                      disabled={settings.freeShippingEnabled}
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none disabled:opacity-30" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Free Shipping Threshold (INR)</label>
                    <input type="number" name="minOrderAmount" value={settings.minOrderAmount} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Estimated Logistics Timeline</label>
                    <input name="deliveryTime" value={settings.deliveryTime} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none" placeholder="e.g. 3-5 Business Days" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "tax" && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-xl font-black mb-2" style={{ color: 'var(--page-text)' }}>Fiscal Settings</h3>
                  <p className="text-xs font-bold opacity-30 uppercase tracking-widest">Tax calculation engines and price display logic</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Default Tax / GST (%)</label>
                    <input type="number" name="taxPercent" value={settings.taxPercent} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none" />
                  </div>
                  <div className="flex items-center pt-8">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" name="isTaxInclusive" checked={settings.isTaxInclusive} onChange={handleChange} className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all" />
                      <span className="text-xs font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">Prices are Inclusive of Tax</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "order" && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-xl font-black mb-2" style={{ color: 'var(--page-text)' }}>Workflow Logic</h3>
                  <p className="text-xs font-bold opacity-30 uppercase tracking-widest">Order processing automation and customer self-service</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { name: "autoConfirmOrders", label: "Auto-confirm new orders", desc: "Instantly transition orders to Processing status upon placement" },
                    { name: "cancelEnabled", label: "Allow Customer Cancellations", desc: "Enable self-service order termination for customers" },
                    { name: "returnEnabled", label: "Enable Return Policy Flow", desc: "Activate post-fulfillment return request system" }
                  ].map((item) => (
                    <div key={item.name} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-indigo-500/20 transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
                          <FaCheckCircle size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>{item.label}</p>
                          <p className="text-[10px] font-bold opacity-40">{item.desc}</p>
                        </div>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name={item.name} checked={settings[item.name]} onChange={handleChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "reports" && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="text-xl font-black mb-2" style={{ color: 'var(--page-text)' }}>Analytics Engine</h3>
                    <p className="text-xs font-bold opacity-30 uppercase tracking-widest">Enterprise performance tracking and fiscal reporting</p>
                  </div>
                  <button type="button" onClick={exportReportCsv} className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border rounded-2xl hover:bg-slate-50 transition-all text-xs font-black shadow-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--page-text)' }}>
                    <FaFileCsv className="text-emerald-600" />
                    <span>EXPORT AUDIT</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><FaBox size={100} /></div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Volume</p>
                    <p className="text-3xl font-black mt-1">{reports.summary?.orders || 0}</p>
                    <p className="text-[10px] font-bold opacity-40 mt-1 uppercase tracking-tighter">Total Transactions</p>
                  </div>
                  <div className="p-6 bg-white dark:bg-slate-800 border rounded-3xl shadow-xl shadow-slate-500/5 relative overflow-hidden group" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="absolute -right-4 -bottom-4 opacity-5 text-indigo-600 group-hover:scale-110 transition-transform"><FaChartLine size={100} /></div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Gross Liquidity</p>
                    <p className="text-3xl font-black mt-1" style={{ color: 'var(--page-text)' }}>{formatCurrency(reports.summary?.revenue || 0, settings.currency)}</p>
                    <p className="text-[10px] font-bold opacity-20 mt-1 uppercase tracking-tighter">Pre-adjustment Revenue</p>
                  </div>
                  <div className="p-6 bg-emerald-600 rounded-3xl text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><FaCheckCircle size={100} /></div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Net Settlement</p>
                    <p className="text-3xl font-black mt-1">
                      {formatCurrency(Number(reports.summary?.revenue || 0) - Number(reports.summary?.discount || 0), settings.currency)}
                    </p>
                    <p className="text-[10px] font-bold opacity-40 mt-1 uppercase tracking-tighter">After Incentives applied</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-transparent flex flex-wrap gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-2">Period Origin</label>
                    <input type="datetime-local" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-2">Period Terminal</label>
                    <input type="datetime-local" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none" />
                  </div>
                  <button type="button" onClick={fetchReports} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">Generate Sync</button>
                </div>

                <div className="bg-white dark:bg-slate-900 border rounded-3xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b" style={{ borderColor: 'var(--border-color)' }}>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest opacity-40">Ref</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest opacity-40">Subject</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest opacity-40 text-center">Value</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest opacity-40 text-right">Node</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                      {reports.orders.slice(0, 8).map((order) => (
                        <tr key={order._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 text-[10px] font-black text-indigo-600 uppercase">#{order._id?.slice(-8) || "N/A"}</td>
                          <td className="px-4 py-3 text-[11px] font-bold truncate opacity-80">{order.user?.name || "Anonymous"}</td>
                          <td className="px-4 py-3 text-[11px] font-black text-center">₹{order.totalAmount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="inline-flex px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">{order.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "invoices" && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-xl font-black mb-2" style={{ color: 'var(--page-text)' }}>Document Forge</h3>
                  <p className="text-xs font-bold opacity-30 uppercase tracking-widest">Generate and verify official fiscal documents</p>
                </div>
                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-transparent flex flex-col md:flex-row gap-4 items-center">
                  <div className="flex-grow w-full relative">
                    <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500/40" size={14} />
                    <input 
                      placeholder="Input Order Reference ID (e.g. 642f...)" 
                      value={orderId} 
                      onChange={(e) => setOrderId(e.target.value)} 
                      className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none"
                    />
                  </div>
                  <button type="button" onClick={loadBill} className="w-full md:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2">
                    <FaSync size={14} />
                    <span>LOAD RECORD</span>
                  </button>
                </div>

                {bill ? (
                  <div className="animate-in fade-in zoom-in-95 duration-500">
                    <div className="p-6 bg-white dark:bg-slate-900 border rounded-3xl shadow-2xl relative" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-1">Authenticated Ledger</p>
                          <h4 className="text-2xl font-black" style={{ color: 'var(--page-text)' }}>#{bill.invoiceNumber}</h4>
                        </div>
                        <button type="button" onClick={printBill} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95">
                          <FaPrint size={14} />
                          <span>PRINT DOCUMENT</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-12 mb-8">
                        <div className="space-y-4">
                          <div className="opacity-40">
                            <p className="text-[9px] font-black uppercase tracking-widest">Origin Authority</p>
                            <div className="h-px bg-slate-200 dark:bg-slate-700 my-1 w-8" />
                          </div>
                          <div>
                            <p className="text-sm font-black" style={{ color: 'var(--page-text)' }}>{bill.business.storeName}</p>
                            <p className="text-[11px] font-medium opacity-60 mt-1 leading-relaxed">{bill.business.address}</p>
                          </div>
                        </div>
                        <div className="space-y-4 text-right">
                          <div className="opacity-40 flex flex-col items-end">
                            <p className="text-[9px] font-black uppercase tracking-widest">Consignee Node</p>
                            <div className="h-px bg-slate-200 dark:bg-slate-700 my-1 w-8" />
                          </div>
                          <div>
                            <p className="text-sm font-black" style={{ color: 'var(--page-text)' }}>{bill.customer.name}</p>
                            <p className="text-[11px] font-medium opacity-60 mt-1 leading-relaxed">{bill.customer.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-6">
                        <div className="space-y-3">
                          {bill.order.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-indigo-500/40">0{i+1}</span>
                                <span className="text-xs font-bold" style={{ color: 'var(--page-text)' }}>{item.productName}</span>
                                <span className="text-[10px] font-black px-2 py-0.5 bg-white dark:bg-slate-900 border rounded-md opacity-40">x{item.quantity}</span>
                              </div>
                              <span className="text-xs font-black">₹{item.lineTotal.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        <div className="h-px bg-slate-200 dark:bg-slate-700 my-6" />
                        <div className="space-y-2 text-right">
                          <div className="flex justify-end gap-12 text-[10px] font-bold opacity-40 uppercase tracking-widest">
                            <span>Filing Subtotal</span>
                            <span className="w-24">₹{bill.order.subtotalAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-end gap-12 text-[10px] font-bold opacity-40 uppercase tracking-widest">
                            <span>Regulatory Tax ({bill.order.taxPercent}%)</span>
                            <span className="w-24">₹{bill.order.taxAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-end gap-12 text-lg font-black pt-2" style={{ color: 'var(--page-text)' }}>
                            <span className="uppercase tracking-widest text-[10px] mt-1.5 opacity-40">Total Settlement</span>
                            <span className="w-24">₹{bill.order.grandTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl opacity-20">
                    <FaReceipt size={40} className="mb-4" />
                    <p className="text-sm font-black uppercase tracking-[0.2em]">Void Buffer: Input Reference</p>
                  </div>
                )}
              </div>
            )}

            {/* Privacy/Refund/Terms policies tab could be here too, simplified for brevity */}
            {activeTab === "policies" && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-xl font-black mb-2" style={{ color: 'var(--page-text)' }}>Legal Framework</h3>
                  <p className="text-xs font-bold opacity-30 uppercase tracking-widest">Global compliance and customer protection policies</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Privacy Policy Corpus</label>
                    <textarea name="privacyPolicy" value={settings.privacyPolicy} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none min-h-[150px]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Terms & Conditions Corpus</label>
                    <textarea name="termsAndConditions" value={settings.termsAndConditions} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none min-h-[150px]" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notification" && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-xl font-black mb-2" style={{ color: 'var(--page-text)' }}>Alert Systems</h3>
                  <p className="text-xs font-bold opacity-30 uppercase tracking-widest">Communication protocols for transactional updates</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { name: "emailNotificationsEnabled", label: "Email Transmission Protocol", desc: "Send automated transactional emails for order state transitions" },
                    { name: "orderAlertsEnabled", label: "Real-time Admin Oversight", desc: "Enable desktop and push alerts for new inbound transactions" }
                  ].map((item) => (
                    <div key={item.name} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-indigo-500/20 transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
                          <FaBell size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>{item.label}</p>
                          <p className="text-[10px] font-bold opacity-40">{item.desc}</p>
                        </div>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name={item.name} checked={settings[item.name]} onChange={handleChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "about" && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-xl font-black mb-2" style={{ color: 'var(--page-text)' }}>Brand Narrative</h3>
                  <p className="text-xs font-bold opacity-30 uppercase tracking-widest">Manage the dynamic story and mission of your store</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Our Story (Storefront About Page)</label>
                    <textarea 
                        name="aboutStory" 
                        value={settings.aboutStory} 
                        onChange={handleChange} 
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none min-h-[200px]" 
                        placeholder="Tell your brand's journey..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Core Mission Statement</label>
                    <textarea 
                        name="aboutMission" 
                        value={settings.aboutMission} 
                        onChange={handleChange} 
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none min-h-[100px]" 
                        placeholder="Define your mission..."
                    />
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default BusinessSettings;
