import React from "react";
import {
  FaShippingFast,
  FaLock,
  FaHeadset,
  FaUndoAlt,
  FaClipboardCheck,
  FaChartLine,
  FaBoxes,
  FaUsers,
  FaGlobe,
} from "react-icons/fa";
import "./MarketingPages.css";

const Services = () => {
  const serviceHighlights = [
    {
      title: "Secure Checkout",
      description: "Protected checkout with trusted payment flow and safe transaction handling.",
      icon: <FaLock size={20} />,
    },
    {
      title: "Fast Delivery",
      description: "Efficient order dispatch with regular shipment updates until delivery.",
      icon: <FaShippingFast size={20} />,
    },
    {
      title: "Order Tracking",
      description: "Clear order status visibility from confirmation to final delivery.",
      icon: <FaClipboardCheck size={20} />,
    },
    {
      title: "Customer Support",
      description: "Responsive support for product assistance and issue resolution.",
      icon: <FaHeadset size={20} />,
    },
    {
      title: "Easy Returns",
      description: "Straightforward return guidance for eligible items with quick resolution.",
      icon: <FaUndoAlt size={20} />,
    },
    {
      title: "Performance Insights",
      description: "Continuous improvements based on customer feedback and platform analytics.",
      icon: <FaChartLine size={20} />,
    },
  ];

  const serviceStats = [
    { label: "Orders Managed", value: "10K+", icon: <FaBoxes /> },
    { label: "Support Cases Resolved", value: "98%", icon: <FaUsers /> },
    { label: "Service Availability", value: "24/7", icon: <FaGlobe /> },
  ];

  return (
    <div className="services-page">
      <section
        className="text-white marketing-hero"
        style={{
          background: "linear-gradient(120deg, #0f172a 0%, #1d4ed8 48%, #0369a1 100%)",
        }}
      >
        <div className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-7 marketing-fade-up">
              <p className="text-uppercase mb-2" style={{ letterSpacing: "0.08em", opacity: 0.85 }}>
                Services
              </p>
              <h1 className="fw-bold mb-3">Operations built to keep shopping smooth and reliable.</h1>
              <p className="lead mb-0" style={{ opacity: 0.9 }}>
                From secure payment to delivery tracking, every service layer is designed for speed, visibility and trust.
              </p>
            </div>
            <div className="col-lg-5 marketing-fade-up marketing-delay-1">
              <div className="p-4 rounded-4 border border-light border-opacity-25 bg-light bg-opacity-10 marketing-chip">
                <h5 className="mb-3">Service Principles</h5>
                <ul className="mb-0 ps-3">
                  <li className="mb-2">Consistent and transparent process</li>
                  <li className="mb-2">Customer-first response standards</li>
                  <li className="mb-2">Measured performance at each step</li>
                  <li>Security and quality in every transaction</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-5">
        <div className="row g-4 mb-5">
          {serviceStats.map((stat, index) => (
            <div className="col-md-4" key={stat.label}>
              <div className={`card border-0 shadow-sm h-100 p-4 text-center marketing-card marketing-fade-up marketing-delay-${Math.min(index + 1, 3)}`}>
                <div className="services-stat-icon mx-auto mb-3">{stat.icon}</div>
                <h3 className="fw-bold mb-1">{stat.value}</h3>
                <p className="text-muted mb-0">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mb-4 marketing-fade-up">
          <h3 className="fw-bold marketing-section-title">Core Service Areas</h3>
          <p className="text-muted mb-0">Structured capabilities that support your end-to-end shopping journey.</p>
        </div>

        <div className="row g-4">
          {serviceHighlights.map((service, index) => (
            <div className="col-md-6 col-lg-4" key={service.title}>
              <div className={`card border-0 shadow-sm h-100 p-3 marketing-card marketing-fade-up marketing-delay-${Math.min(index % 4, 3)}`}>
                <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3 services-icon-badge">
                  {service.icon}
                </div>
                <h5 className="mb-2">{service.title}</h5>
                <p className="text-muted mb-0">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Services;
