import React, { useEffect, useMemo, useState } from "react";
import API from "../../api";
import { downloadCsv } from "../../utils/adminHelpers";
import "./BusinessSettings.css";
import { toast } from "react-toastify";

const defaultSettings = {
  businessName: "",
  ownerName: "",
  email: "",
  phone: "",
  address: "",
  gstNumber: "",
  invoicePrefix: "INV",
  invoiceFooter: "",
  currency: "INR",
  taxPercent: 0,
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
  const [openSection, setOpenSection] = useState("profile");

  const fetchSettings = async () => {
    const { data } = await API.get("/business-settings");
    setSettings({ ...defaultSettings, ...data });
  };

  const fetchReports = async () => {
    const params = {};
    if (dateFrom) params.dateFrom = new Date(dateFrom).toISOString();
    if (dateTo) params.dateTo = new Date(dateTo).toISOString();
    const { data } = await API.get("/business-settings/reports", { params });
    setReports({
      summary: data.summary || null,
      statusSummary: Array.isArray(data.statusSummary) ? data.statusSummary : [],
      orders: Array.isArray(data.orders) ? data.orders : [],
    });
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchSettings(), fetchReports()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load business settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [dateFrom, dateTo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...settings,
        taxPercent: Number(settings.taxPercent || 0),
      };
      const { data } = await API.put("/business-settings", payload);
      setSettings({ ...defaultSettings, ...data });
      toast.success("Business settings updated");
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

  const printableBill = useMemo(() => {
    if (!bill) return "";
    const rows = bill.order.items
      .map(
        (item, index) =>
          `<tr><td>${index + 1}</td><td>${item.productName}</td><td>${item.quantity}</td><td>${item.unitPrice}</td><td>${item.lineTotal}</td></tr>`
      )
      .join("");

    return `
      <html><head><title>${bill.invoiceNumber}</title>
      <style>body{font-family:Arial;padding:24px;color:#111}table{width:100%;border-collapse:collapse;margin-top:12px}td,th{border:1px solid #ccc;padding:8px}</style>
      </head><body>
      <h2>${bill.business.businessName}</h2>
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
  }, [bill]);

  const printBill = () => {
    if (!bill) return;
    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) return;
    popup.document.write(printableBill);
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

  const exportBillCsv = () => {
    if (!bill) return;
    downloadCsv(
      `${bill.invoiceNumber}.csv`,
      bill.order.items.map((item) => ({
        invoiceNumber: bill.invoiceNumber,
        product: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      }))
    );
  };

  return (
    <div className="container-fluid bs-page">
      <div className="bs-hero mb-3">
        <div>
          <h3 className="mb-1">Business Settings</h3>
          <p className="mb-0 text-muted">
            Manage business profile, reporting window and invoice generation from one place.
          </p>
        </div>
        <div className="bs-hero-metrics">
          <div className="bs-chip">
            <small>Orders</small>
            <strong>{reports.summary?.orders || 0}</strong>
          </div>
          <div className="bs-chip">
            <small>Revenue</small>
            <strong>{formatCurrency(reports.summary?.revenue || 0, settings.currency || "INR")}</strong>
          </div>
        </div>
      </div>
      {loading ? (
        <p>Loading business settings...</p>
      ) : (
        <>
          <div className="accordion bs-accordion" id="businessSettingsAccordion">
            <div className="accordion-item mb-3 border rounded bs-accordion-item">
              <h2 className="accordion-header">
                <button
                  className={`accordion-button ${openSection === "profile" ? "" : "collapsed"}`}
                  type="button"
                  onClick={() => setOpenSection(openSection === "profile" ? "" : "profile")}
                >
                  Business Profile
                </button>
              </h2>
              <div className={`accordion-collapse collapse ${openSection === "profile" ? "show" : ""}`}>
                <div className="accordion-body">
                  <form className="card p-3 border-0 bs-form-card" onSubmit={saveSettings}>
                    <div className="bs-subheading">Business Identity</div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Business Name</label>
                        <input className="form-control" name="businessName" placeholder="Business name" value={settings.businessName} onChange={handleChange} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Owner Name</label>
                        <input className="form-control" name="ownerName" placeholder="Owner name" value={settings.ownerName} onChange={handleChange} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Email</label>
                        <input className="form-control" name="email" placeholder="Email" value={settings.email} onChange={handleChange} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Phone</label>
                        <input className="form-control" name="phone" placeholder="Phone" value={settings.phone} onChange={handleChange} />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Address</label>
                        <textarea className="form-control" rows="2" name="address" placeholder="Address" value={settings.address} onChange={handleChange} />
                      </div>
                    </div>

                    <div className="bs-subheading mt-4">Billing & Tax</div>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">GST Number</label>
                        <input className="form-control" name="gstNumber" placeholder="GST Number" value={settings.gstNumber} onChange={handleChange} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Invoice Prefix</label>
                        <input className="form-control" name="invoicePrefix" placeholder="Invoice Prefix" value={settings.invoicePrefix} onChange={handleChange} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Tax %</label>
                        <input type="number" min="0" className="form-control" name="taxPercent" placeholder="Tax %" value={settings.taxPercent} onChange={handleChange} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Currency</label>
                        <input className="form-control" name="currency" placeholder="Currency" value={settings.currency} onChange={handleChange} />
                      </div>
                      <div className="col-md-8">
                        <label className="form-label">Invoice Footer</label>
                        <input className="form-control" name="invoiceFooter" placeholder="Invoice Footer" value={settings.invoiceFooter} onChange={handleChange} />
                      </div>
                    </div>
                    <div className="mt-4 bs-action-row">
                      <button className="btn btn-primary" type="submit" disabled={saving}>
                        {saving ? "Updating..." : "Update Settings"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div className="accordion-item mb-3 border rounded bs-accordion-item">
              <h2 className="accordion-header">
                <button
                  className={`accordion-button ${openSection === "reports" ? "" : "collapsed"}`}
                  type="button"
                  onClick={() => setOpenSection(openSection === "reports" ? "" : "reports")}
                >
                  Reports
                </button>
              </h2>
              <div className={`accordion-collapse collapse ${openSection === "reports" ? "show" : ""}`}>
                <div className="accordion-body">
                  <div className="card p-3 h-100 border-0 bs-form-card">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="mb-0">Reports</h5>
                      <button className="btn btn-sm btn-outline-primary" onClick={exportReportCsv}>
                        Export Report
                      </button>
                    </div>
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label">From</label>
                        <input type="datetime-local" className="form-control" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">To</label>
                        <input type="datetime-local" className="form-control" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                      </div>
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-md-3">
                        <div className="border rounded p-2 bs-metric">
                          <small className="text-muted d-block">Orders</small>
                          <strong>{reports.summary?.orders || 0}</strong>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="border rounded p-2 bs-metric">
                          <small className="text-muted d-block">Revenue</small>
                          <strong>{formatCurrency(reports.summary?.revenue || 0, settings.currency || "INR")}</strong>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="border rounded p-2 bs-metric">
                          <small className="text-muted d-block">Discount</small>
                          <strong>{formatCurrency(reports.summary?.discount || 0, settings.currency || "INR")}</strong>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="border rounded p-2 bs-metric">
                          <small className="text-muted d-block">Net Revenue</small>
                          <strong>
                            {formatCurrency(
                              Number(reports.summary?.revenue || 0) - Number(reports.summary?.discount || 0),
                              settings.currency || "INR"
                            )}
                          </strong>
                        </div>
                      </div>
                    </div>
                    <div className="table-responsive" style={{ maxHeight: 280 }}>
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Order</th>
                            <th>Customer</th>
                            <th>Total</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reports.orders.slice(0, 20).map((order) => (
                            <tr key={order._id}>
                              <td>{order._id}</td>
                              <td>{order.user?.name || "Unknown"}</td>
                              <td>{order.totalAmount}</td>
                              <td>{order.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="accordion-item border rounded bs-accordion-item">
              <h2 className="accordion-header">
                <button
                  className={`accordion-button ${openSection === "bill" ? "" : "collapsed"}`}
                  type="button"
                  onClick={() => setOpenSection(openSection === "bill" ? "" : "bill")}
                >
                  Bill / Invoice
                </button>
              </h2>
              <div className={`accordion-collapse collapse ${openSection === "bill" ? "show" : ""}`}>
                <div className="accordion-body">
                  <div className="card p-3 border-0 bs-form-card">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="mb-0">Bill / Invoice</h5>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-primary" onClick={exportBillCsv}>
                          Export Bill
                        </button>
                        <button className="btn btn-sm btn-primary" onClick={printBill}>
                          Print Bill
                        </button>
                      </div>
                    </div>
                    <div className="row g-3 mb-3">
                      <div className="col-md-8">
                        <label className="form-label">Order ID</label>
                        <input className="form-control" placeholder="Enter order ID for bill" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
                      </div>
                      <div className="col-md-4 d-flex align-items-end">
                        <button className="btn btn-success w-100" onClick={loadBill}>
                          Generate Bill
                        </button>
                      </div>
                    </div>

                    {!bill ? (
                      <p className="text-muted mb-0">Enter order ID and click Generate Bill.</p>
                    ) : (
                      <div className="border rounded p-3 bs-bill-card">
                        <p className="mb-1">
                          <strong>Invoice:</strong> {bill.invoiceNumber}
                        </p>
                        <p className="mb-1">
                          <strong>Customer:</strong> {bill.customer.name} {bill.customer.email ? `(${bill.customer.email})` : ""}
                        </p>
                        <p className="mb-2">
                          <strong>Order:</strong> {bill.order.id}
                        </p>
                        <div className="table-responsive">
                          <table className="table table-sm">
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Unit</th>
                                <th>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bill.order.items.map((item, index) => (
                                <tr key={`${item.productName}-${index}`}>
                                  <td>{item.productName}</td>
                                  <td>{item.quantity}</td>
                                  <td>{item.unitPrice}</td>
                                  <td>{item.lineTotal}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="mb-1">Subtotal: {formatCurrency(bill.order.subtotalAmount, settings.currency || "INR")}</p>
                        <p className="mb-1">Discount: {formatCurrency(bill.order.discountAmount, settings.currency || "INR")}</p>
                        <p className="mb-1">
                          Tax ({bill.order.taxPercent}%): {formatCurrency(bill.order.taxAmount, settings.currency || "INR")}
                        </p>
                        <h6 className="mb-0">Grand Total: {formatCurrency(bill.order.grandTotal, settings.currency || "INR")}</h6>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BusinessSettings;
