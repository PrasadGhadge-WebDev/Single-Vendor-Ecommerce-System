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
      title: "Safe Payments",
      description: "Your payments are safe and your data is always protected.",
      icon: <FaLock size={20} />,
    },
    {
      title: "Quick Delivery",
      description: "We ship your items fast and send you updates along the way.",
      icon: <FaShippingFast size={20} />,
    },
    {
      title: "Track Your Order",
      description: "See exactly where your order is at any time.",
      icon: <FaClipboardCheck size={20} />,
    },
    {
      title: "Friendly Support",
      description: "We are here to help you with any questions or problems.",
      icon: <FaHeadset size={20} />,
    },
    {
      title: "Simple Returns",
      description: "If you're not happy, returning items is easy and fast.",
      icon: <FaUndoAlt size={20} />,
    },
    {
      title: "Constant Improvement",
      description: "We listen to you and keep making our store better.",
      icon: <FaChartLine size={20} />,
    },
  ];

  const serviceStats = [
    { label: "Active Store", value: "Running 24/7", icon: <FaBoxes /> },
    { label: "Our Support Team", value: "Always Ready", icon: <FaUsers /> },
    { label: "Store Status", value: "Ready for You", icon: <FaGlobe /> },
  ];

  return (
    <div className="services-page">
      <section
        className="text-white marketing-hero"
        style={{
          background: "linear-gradient(135deg, #020617 0%, #0052FF 100%)",
          paddingTop: "120px",
          paddingBottom: "80px"
        }}
      >
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-7 marketing-fade-up">
              <p className="text-uppercase mb-2" style={{ letterSpacing: "0.08em", opacity: 0.85 }}>
                Services
              </p>
              <h1 className="fw-bold mb-3">We make shopping easy, fast, and safe for you.</h1>
              <p className="lead mb-0" style={{ opacity: 0.9 }}>
                From paying to tracking your order, we make sure everything works perfectly.
              </p>
            </div>
            <div className="col-lg-5 marketing-fade-up marketing-delay-1 mt-8 md:mt-24">
              <div className="p-4 rounded-4 border border-light border-opacity-25 bg-light bg-opacity-10 marketing-chip">
                <h5 className="mb-3">Service Principles</h5>
                <ul className="mb-0 ps-3">
                  <li className="mb-2">Simple and clear steps</li>
                  <li className="mb-2">We put our customers first</li>
                  <li className="mb-2">We always try to be better</li>
                  <li>Safe and high quality every time</li>
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
          <h3 className="fw-bold marketing-section-title">What We Offer</h3>
          <p className="text-muted mb-0">Everything we do to make your shopping experience great.</p>
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
