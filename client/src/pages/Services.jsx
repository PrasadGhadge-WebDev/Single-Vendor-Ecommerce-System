import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTruck,
  FaShippingFast,
  FaShieldAlt,
  FaUndoAlt,
  FaHeadset,
  FaFileContract,
  FaCheckCircle,
  FaBoxOpen,
  FaCreditCard,
  FaMoneyBillWave,
  FaMobileAlt,
  FaUniversity,
  FaWallet,
  FaEnvelope,
  FaPhone,
  FaComments,
  FaQuestionCircle,
  FaArrowRight
} from "react-icons/fa";
import "./MarketingPages.css";

const Services = () => {
  const navigate = useNavigate();

  const services = [
    {
      title: "Free Delivery",
      description: "Enjoy free shipping on eligible orders.",
      icon: <FaTruck size={24} className="text-primary" />,
      bg: "bg-primary"
    },
    {
      title: "Fast Shipping",
      description: "Quick and secure delivery to your doorstep.",
      icon: <FaShippingFast size={24} className="text-success" />,
      bg: "bg-success"
    },
    {
      title: "Secure Payments",
      description: "100% safe and trusted payment methods.",
      icon: <FaShieldAlt size={24} className="text-warning" />,
      bg: "bg-warning"
    },
    {
      title: "Easy Returns",
      description: "Simple and hassle-free return process.",
      icon: <FaUndoAlt size={24} className="text-info" />,
      bg: "bg-info"
    },
    {
      title: "24/7 Customer Support",
      description: "Our team is here whenever you need help.",
      icon: <FaHeadset size={24} className="text-danger" />,
      bg: "bg-danger"
    },
    {
      title: "Warranty Assistance",
      description: "Support for eligible warranty claims.",
      icon: <FaFileContract size={24} className="text-purple-500" />,
      bg: "bg-secondary"
    }
  ];

  const benefits = [
    "Genuine Products",
    "Trusted Suppliers",
    "Secure Checkout",
    "Quality Assurance",
    "Fast Delivery",
    "Transparent Policies"
  ];

  const returnSteps = [
    "Return Request",
    "Review",
    "Approval",
    "Pickup",
    "Refund / Replacement"
  ];

  const paymentMethods = [
    { name: "Cash on Delivery (COD)", icon: <FaMoneyBillWave /> },
    { name: "UPI", icon: <FaMobileAlt /> },
    { name: "Debit Cards", icon: <FaCreditCard /> },
    { name: "Credit Cards", icon: <FaCreditCard /> },
    { name: "Net Banking", icon: <FaUniversity /> },
    { name: "Wallet Payments", icon: <FaWallet /> }
  ];

  const supportChannels = [
    { name: "Email Support", icon: <FaEnvelope />, detail: "support@store.com" },
    { name: "Phone Support", icon: <FaPhone />, detail: "+91 1800 123 4567" },
    { name: "Live Chat", icon: <FaComments />, detail: "Available on Website" },
    { name: "Help Center", icon: <FaQuestionCircle />, detail: "Read our Guides" }
  ];

  return (
    <div className="services-page bg-light min-vh-100 pb-0">
      
      {/* 1. Hero Section */}
      <section className="bg-dark text-white position-relative py-5 pt-lg-5 pb-lg-5 mb-5 overflow-hidden">
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #3b82f6 100%)', zIndex: 0, opacity: 0.9 }}></div>
        <div className="position-absolute top-50 start-50 translate-middle w-100 h-100 bg-primary opacity-10 blur-3xl rounded-circle" style={{ filter: 'blur(100px)', zIndex: 0 }}></div>
        
        <div className="container py-5 position-relative z-10 text-center">
          <div className="d-inline-flex align-items-center gap-2 bg-white bg-opacity-10 border border-white border-opacity-25 text-white rounded-pill px-4 py-2 mb-4 fw-bold tracking-widest text-uppercase text-xs shadow-sm backdrop-blur-sm">
            <FaShieldAlt className="text-warning" /> Customer First
          </div>
          <h1 className="display-3 fw-black mb-4 text-white" style={{ letterSpacing: '-1.5px' }}>
            Our Services
          </h1>
          <p className="lead mb-5 opacity-80 fw-medium max-w-2xl mx-auto">
            We're committed to providing the best shopping experience with reliable support and customer-first services every step of the way.
          </p>
          <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
            <button onClick={() => window.scrollTo({ top: document.getElementById('support').offsetTop - 100, behavior: 'smooth' })} className="btn btn-outline-light btn-lg rounded-pill px-5 py-3 fw-bold shadow-sm transition-all text-uppercase tracking-wider text-sm border-2 hover:bg-white hover:text-primary">
              Contact Support
            </button>
            <button onClick={() => navigate('/shop')} className="btn btn-primary btn-lg rounded-pill px-5 py-3 fw-black shadow-lg hover:shadow-xl transition-all text-uppercase tracking-wider text-sm">
              Start Shopping
            </button>
          </div>
        </div>
      </section>

      {/* 2. Services Overview */}
      <section className="container mb-5">
        <div className="text-center mb-5">
          <h2 className="fw-black h2 text-dark mb-2">How We Serve You</h2>
          <p className="text-muted">Everything designed to make your journey seamless.</p>
        </div>
        <div className="row g-4">
          {services.map((service, index) => (
            <div className="col-md-6 col-lg-4" key={index}>
              <div className="card h-100 border-0 shadow-sm rounded-4 p-4 hover:-translate-y-1 transition-transform group">
                <div className={`d-inline-flex align-items-center justify-content-center rounded-3 mb-4 p-3 ${service.bg} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                  {service.icon}
                </div>
                <h5 className="fw-bold mb-2 text-dark">{service.title}</h5>
                <p className="text-muted mb-0">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Why Choose Us */}
      <section className="bg-white py-5 mb-5 border-top border-bottom border-light">
        <div className="container py-4">
          <div className="text-center mb-5">
            <h2 className="fw-black h2 text-dark mb-2">Why Choose Us</h2>
            <p className="text-muted">The core benefits of shopping with our platform.</p>
          </div>
          <div className="row g-4 justify-content-center">
            {benefits.map((benefit, idx) => (
              <div className="col-6 col-md-4 col-lg-2 text-center" key={idx}>
                <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3 text-success shadow-sm" style={{ width: '60px', height: '60px' }}>
                  <FaCheckCircle size={24} />
                </div>
                <h6 className="fw-bold text-dark">{benefit}</h6>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Delivery Services */}
      <section className="container mb-5">
        <div className="card border-0 shadow-sm rounded-[24px] overflow-hidden bg-white">
          <div className="row g-0">
            <div className="col-lg-5 bg-primary bg-opacity-10 p-5 d-flex flex-column justify-content-center relative overflow-hidden">
              <FaTruck className="position-absolute bottom-0 end-0 text-primary opacity-10 mb-n4 me-n4" size={200} />
              <h3 className="fw-black text-dark mb-3 relative z-10">Delivery Services</h3>
              <p className="text-muted relative z-10">We ensure your packages arrive safely and on time. Track your order every step of the way.</p>
            </div>
            <div className="col-lg-7 p-5">
              <div className="row g-4">
                <div className="col-sm-6">
                  <div className="p-4 bg-light rounded-4 h-100">
                    <h6 className="fw-bold text-primary mb-2">Standard Delivery</h6>
                    <p className="text-muted mb-0">3–7 Business Days</p>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-4 bg-light rounded-4 h-100">
                    <h6 className="fw-bold text-success mb-2">Express Delivery</h6>
                    <p className="text-muted mb-0">1–2 Business Days</p>
                  </div>
                </div>
                <div className="col-12">
                  <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                    <li className="d-flex align-items-center gap-3"><FaCheckCircle className="text-success" /> <span className="fw-medium text-dark">Real-time Delivery Tracking</span></li>
                    <li className="d-flex align-items-center gap-3"><FaCheckCircle className="text-success" /> <span className="fw-medium text-dark">Accurate Estimated Delivery Time</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Return & Refund Services */}
      <section className="container mb-5">
        <div className="card border-0 shadow-sm rounded-[24px] p-5 bg-white">
          <div className="text-center mb-5">
            <h3 className="fw-black text-dark mb-2">Return & Refund Services</h3>
            <p className="text-muted">A transparent and hassle-free process.</p>
          </div>
          
          <div className="row g-4 mb-5">
            <div className="col-md-3">
              <div className="d-flex align-items-start gap-3">
                <div className="bg-info bg-opacity-10 p-3 rounded-circle text-info"><FaUndoAlt /></div>
                <div><h6 className="fw-bold mb-1">7-Day Policy</h6><p className="text-muted text-sm mb-0">Return within 7 days.</p></div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex align-items-start gap-3">
                <div className="bg-info bg-opacity-10 p-3 rounded-circle text-info"><FaMoneyBillWave /></div>
                <div><h6 className="fw-bold mb-1">Fast Processing</h6><p className="text-muted text-sm mb-0">Quick refund timelines.</p></div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex align-items-start gap-3">
                <div className="bg-info bg-opacity-10 p-3 rounded-circle text-info"><FaCheckCircle /></div>
                <div><h6 className="fw-bold mb-1">Eligibility</h6><p className="text-muted text-sm mb-0">Clear return criteria.</p></div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex align-items-start gap-3">
                <div className="bg-info bg-opacity-10 p-3 rounded-circle text-info"><FaBoxOpen /></div>
                <div><h6 className="fw-bold mb-1">Replacements</h6><p className="text-muted text-sm mb-0">Available for damaged goods.</p></div>
              </div>
            </div>
          </div>

          <div className="bg-light rounded-4 p-4 text-center overflow-x-auto">
            <h6 className="fw-bold text-uppercase tracking-widest text-muted text-xs mb-4">Return Flow</h6>
            <div className="d-flex align-items-center justify-content-between min-w-[600px] px-3">
              {returnSteps.map((step, idx) => (
                <React.Fragment key={idx}>
                  <div className="d-flex flex-column align-items-center gap-2">
                    <div className="bg-white border border-primary text-primary fw-bold rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '40px', height: '40px' }}>
                      {idx + 1}
                    </div>
                    <span className="fw-bold text-dark text-sm">{step}</span>
                  </div>
                  {idx < returnSteps.length - 1 && (
                    <div className="flex-grow-1 border-top border-2 border-primary border-dashed mx-3 opacity-50"></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Payment Services */}
      <section className="bg-dark text-white py-5 mb-5 position-relative overflow-hidden">
        <div className="position-absolute top-0 end-0 opacity-10" style={{ transform: 'translate(20%, -20%) scale(2)' }}>
          <FaShieldAlt size={300} className="text-warning" />
        </div>
        <div className="container py-4 position-relative z-10">
          <div className="row align-items-center g-5">
            <div className="col-lg-5">
              <h2 className="fw-black mb-3">Secure Payment Services</h2>
              <p className="opacity-75 mb-4">We offer a variety of payment options protected by industry-leading security to ensure your data is always safe.</p>
              <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                <li className="d-flex align-items-center gap-3"><FaCheckCircle className="text-warning" /> <span className="fw-medium">Encrypted Transactions</span></li>
                <li className="d-flex align-items-center gap-3"><FaCheckCircle className="text-warning" /> <span className="fw-medium">Secure Payment Gateway</span></li>
                <li className="d-flex align-items-center gap-3"><FaCheckCircle className="text-warning" /> <span className="fw-medium">Advanced Fraud Protection</span></li>
              </ul>
            </div>
            <div className="col-lg-7">
              <div className="row g-3">
                {paymentMethods.map((pm, idx) => (
                  <div className="col-sm-6 col-md-4" key={idx}>
                    <div className="bg-white bg-opacity-10 border border-white border-opacity-25 rounded-3 p-3 text-center hover:bg-white hover:text-dark transition-colors cursor-pointer group">
                      <div className="mb-2 text-warning group-hover:text-primary transition-colors fs-4">{pm.icon}</div>
                      <span className="fw-bold text-sm">{pm.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Customer Support & 8. Warranty Support */}
      <section id="support" className="container mb-5">
        <div className="row g-4">
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-[24px] p-5 h-100 bg-white">
              <h3 className="fw-black text-dark mb-4">Customer Support</h3>
              <div className="row g-4 mb-4">
                {supportChannels.map((channel, idx) => (
                  <div className="col-sm-6" key={idx}>
                    <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-4 border border-gray-100 hover:border-primary transition-colors">
                      <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary">{channel.icon}</div>
                      <div>
                        <h6 className="fw-bold mb-1 text-dark">{channel.name}</h6>
                        <p className="text-muted text-sm mb-0">{channel.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-4 p-4 d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="fw-bold text-danger mb-1">Support Hours</h6>
                  <p className="text-danger opacity-75 mb-0 text-sm">We are available 7 days a week.</p>
                </div>
                <div className="text-end">
                  <h6 className="fw-bold text-danger mb-1">Monday – Sunday</h6>
                  <p className="text-danger opacity-75 mb-0 text-sm">9:00 AM – 9:00 PM</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-[24px] p-5 h-100 bg-secondary bg-opacity-10 border border-secondary border-opacity-25">
              <div className="mb-4 text-purple-600"><FaFileContract size={40} /></div>
              <h3 className="fw-black text-dark mb-3">Warranty Support</h3>
              <p className="text-muted mb-4">We help you process warranty claims for eligible products smoothly.</p>
              <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                <li className="d-flex align-items-start gap-3">
                  <div className="text-purple-600 mt-1"><FaCheckCircle /></div>
                  <span className="fw-medium text-dark">Manufacturer Warranty</span>
                </li>
                <li className="d-flex align-items-start gap-3">
                  <div className="text-purple-600 mt-1"><FaCheckCircle /></div>
                  <span className="fw-medium text-dark">Claim Assistance</span>
                </li>
                <li className="d-flex align-items-start gap-3">
                  <div className="text-purple-600 mt-1"><FaCheckCircle /></div>
                  <span className="fw-medium text-dark">Documentation Support</span>
                </li>
                <li className="d-flex align-items-start gap-3">
                  <div className="text-purple-600 mt-1"><FaCheckCircle /></div>
                  <span className="fw-medium text-dark">Clear Warranty Eligibility</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQs */}
      <section className="bg-white py-5 mb-0 border-top border-light">
        <div className="container py-4">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="text-center mb-5">
                <h2 className="fw-black h2 text-dark mb-2">Frequently Asked Questions</h2>
                <p className="text-muted">Quick answers to your most common service-related queries.</p>
              </div>
              <div className="accordion accordion-flush" id="servicesFaqAccordion">
                {[
                  { q: "How can I track my order?", a: "Once your order is shipped, you will receive an email and SMS with the tracking link. You can also track it directly from the 'My Orders' section in your account." },
                  { q: "What is your return policy?", a: "We offer a 7-day hassle-free return policy for most items. The product must be unused, in its original packaging, and with all tags intact." },
                  { q: "How long does delivery take?", a: "Standard delivery typically takes 3-7 business days. We also offer Express Delivery for select locations which takes 1-2 business days." },
                  { q: "How do refunds work?", a: "Once your return is picked up and verified, the refund is initiated to your original payment method. It usually reflects within 5-7 business days depending on your bank." },
                  { q: "How do I contact support?", a: "You can reach out to us via Email, Phone, or Live Chat during our support hours (9:00 AM - 9:00 PM, Mon-Sun). Check the Customer Support section for details." }
                ].map((faq, idx) => (
                  <div className="accordion-item bg-transparent border-0 mb-3 bg-light rounded-3xl overflow-hidden border border-gray-100" key={idx}>
                    <h2 className="accordion-header">
                      <button className="accordion-button collapsed fw-bold text-dark bg-transparent py-4 px-4 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target={`#faq${idx}`}>
                        {faq.q}
                      </button>
                    </h2>
                    <div id={`faq${idx}`} className="accordion-collapse collapse" data-bs-parent="#servicesFaqAccordion">
                      <div className="accordion-body pt-0 px-4 pb-4 text-muted text-sm">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Call To Action */}
      <section className="bg-primary text-white py-5 position-relative overflow-hidden text-center">
        <div className="position-absolute top-0 start-0 w-100 h-100 opacity-20" style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)', zIndex: 0 }}></div>
        <div className="container py-5 position-relative z-10">
          <h2 className="display-5 fw-black text-white mb-3">Need Assistance?</h2>
          <p className="lead text-white opacity-90 mb-5 max-w-2xl mx-auto fw-medium">
            Our team is ready to help you. Whether you have a question about a product or need help with an order, we're just a click away.
          </p>
          <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
            <button onClick={() => window.scrollTo({ top: document.getElementById('support').offsetTop - 100, behavior: 'smooth' })} className="btn btn-light btn-lg rounded-pill px-5 py-3 fw-bold shadow-lg hover:shadow-xl transition-all text-primary text-uppercase tracking-wider text-sm d-flex align-items-center justify-content-center gap-2">
              <FaHeadset /> Contact Us
            </button>
            <button onClick={() => navigate('/shop')} className="btn btn-outline-light btn-lg rounded-pill px-5 py-3 fw-bold transition-all text-uppercase tracking-wider text-sm border-2">
              Continue Shopping <FaArrowRight size={12} className="ms-1" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Services;
