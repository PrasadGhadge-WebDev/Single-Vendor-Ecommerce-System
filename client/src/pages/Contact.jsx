import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaClock, 
  FaPaperPlane, FaComments, FaFacebookF, FaInstagram, 
  FaTwitter, FaYoutube, FaLinkedinIn, FaQuestionCircle, FaArrowRight, FaHeadset
} from "react-icons/fa";
import { toast } from "react-toastify";
import API from "../api";
import { useBusinessSettings } from "../context/BusinessSettingsContext";
import { isValidEmail, isValidName, normalizeDigits, isValidPhone } from "../utils/validation";
import "./MarketingPages.css";

const Contact = () => {
  const { settings } = useBusinessSettings();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    orderId: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const storeName = settings?.storeName || settings?.businessName || "ElectroHub";
  const contactEmail = settings?.email || "support@electrohub.com";
  const contactPhone = settings?.phone || "+91 98765 43210";
  const contactAddress = settings?.address || "ElectroHub Pvt. Ltd., Sangli, Maharashtra, India";

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      setFormData({ ...formData, name: value.replace(/[0-9]/g, "") });
    } else if (name === "phone") {
      setFormData({ ...formData, phone: normalizeDigits(value).slice(0, 10) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "General Inquiry",
      orderId: "",
      message: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = String(formData.name || "").trim();
    const trimmedEmail = String(formData.email || "").trim();
    const normalizedPhone = normalizeDigits(formData.phone);

    if (trimmedName.length < 3) {
      return toast.error("Name must be at least 3 characters long");
    }
    if (!isValidEmail(trimmedEmail)) {
      return toast.error("Please enter a valid email address");
    }
    if (!normalizedPhone || normalizedPhone.length !== 10) {
      return toast.error("Please enter exactly 10 digits for your mobile number");
    }
    if (!formData.message || formData.message.length < 10) {
      return toast.error("Message must be at least 10 characters long");
    }
    if (formData.message.length > 1000) {
      return toast.error("Message cannot exceed 1000 characters");
    }

    setLoading(true);
    try {
      const { data } = await API.post("/contacts/submit", {
        ...formData,
        name: trimmedName,
        email: trimmedEmail,
        phone: normalizedPhone,
      });
      if (data.success) {
        toast.success("Your inquiry has been submitted successfully. Our team will contact you soon.");
        handleReset();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    { q: "How can I track my order?", a: "You can track your order status directly from the 'My Orders' section in your account, or use the Order Tracking page with your Order ID." },
    { q: "How long does support take to respond?", a: "Our support team aims to respond to all inquiries within 24 business hours." },
    { q: "Can I request a return through contact support?", a: "Yes, you can select 'Return & Refund' as the subject in the contact form, and our support team will assist you with the return process." },
    { q: "How can I update my order information?", a: "If your order has not been shipped yet, you can contact support immediately with your Order ID to request an update to your shipping information." }
  ];

  return (
    <div className="contact-page bg-light min-vh-100 pb-0">
      
      {/* 1. Hero Section */}
      <section className="bg-dark text-white position-relative py-5 pt-lg-5 pb-lg-5 mb-5 overflow-hidden">
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #10b981 100%)', zIndex: 0, opacity: 0.9 }}></div>
        <div className="position-absolute bottom-0 end-0 bg-success opacity-20 blur-3xl rounded-circle" style={{ width: '400px', height: '400px', filter: 'blur(100px)', zIndex: 0 }}></div>
        
        <div className="container py-5 position-relative z-10 text-center">
          <div className="d-inline-flex align-items-center gap-2 bg-white bg-opacity-10 border border-white border-opacity-25 text-white rounded-pill px-4 py-2 mb-4 fw-bold tracking-widest text-uppercase text-xs shadow-sm backdrop-blur-sm">
            <FaHeadset className="text-warning" /> 24/7 Support Available
          </div>
          <h1 className="display-3 fw-black mb-4 text-white" style={{ letterSpacing: '-1.5px' }}>
            Contact Us
          </h1>
          <p className="lead mb-5 opacity-90 fw-medium max-w-2xl mx-auto">
            We're here to help. Reach out to us for any questions, support, or feedback, and our team will get back to you as soon as possible.
          </p>
          <div className="d-flex justify-content-center">
            <button onClick={() => window.scrollTo({ top: document.getElementById('contact-form').offsetTop - 100, behavior: 'smooth' })} className="btn btn-success btn-lg rounded-pill px-5 py-3 fw-black shadow-lg hover:shadow-xl transition-all text-uppercase tracking-wider text-sm border-2 border-success">
              Get In Touch
            </button>
          </div>
        </div>
      </section>

      {/* 2. Contact Information Cards */}
      <section className="container mb-5">
        <div className="row g-4 justify-content-center">
          <div className="col-md-6 col-lg-3">
            <div className="card h-100 border-0 shadow-sm rounded-4 p-4 text-center hover:-translate-y-1 transition-transform group">
              <div className="bg-primary bg-opacity-10 text-primary w-16 h-16 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <FaPhoneAlt size={24} />
              </div>
              <h5 className="fw-black text-dark mb-2">Call Us</h5>
              <p className="text-primary fw-bold mb-3">{contactPhone}</p>
              <div className="text-muted text-sm border-top pt-3 border-light">
                <p className="mb-0 fw-bold">Support Hours:</p>
                <p className="mb-0">Mon – Sun</p>
                <p className="mb-0">9:00 AM – 9:00 PM</p>
              </div>
            </div>
          </div>
          
          <div className="col-md-6 col-lg-3">
            <div className="card h-100 border-0 shadow-sm rounded-4 p-4 text-center hover:-translate-y-1 transition-transform group">
              <div className="bg-success bg-opacity-10 text-success w-16 h-16 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <FaEnvelope size={24} />
              </div>
              <h5 className="fw-black text-dark mb-2">Email Us</h5>
              <a href={`mailto:${contactEmail}`} className="text-success fw-bold text-decoration-none mb-3 d-block">{contactEmail}</a>
              <div className="text-muted text-sm border-top pt-3 border-light">
                <p className="mb-0 fw-bold">Response Time:</p>
                <p className="mb-0">Within 24 Hours</p>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-lg-3">
            <div className="card h-100 border-0 shadow-sm rounded-4 p-4 text-center hover:-translate-y-1 transition-transform group">
              <div className="bg-warning bg-opacity-10 text-warning w-16 h-16 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <FaMapMarkerAlt size={24} />
              </div>
              <h5 className="fw-black text-dark mb-2">Visit Us</h5>
              <p className="text-dark fw-medium mb-3 min-h-[48px]">{contactAddress}</p>
              <div className="text-muted text-sm border-top pt-3 border-light">
                <a href="#map-section" className="text-warning fw-bold text-decoration-none">Get Directions</a>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-lg-3">
            <div className="card h-100 border-0 shadow-sm rounded-4 p-4 text-center hover:-translate-y-1 transition-transform group">
              <div className="bg-info bg-opacity-10 text-info w-16 h-16 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <FaComments size={24} />
              </div>
              <h5 className="fw-black text-dark mb-2">Live Chat</h5>
              <p className="text-muted mb-3 min-h-[48px]">Available During Support Hours</p>
              <div className="text-muted text-sm border-top pt-3 border-light">
                <button className="btn btn-sm btn-outline-info rounded-pill fw-bold px-4">Start Chat</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Contact Form & 6. Business Hours */}
      <section id="contact-form" className="container mb-5 py-4">
        <div className="row g-5">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-[32px] p-4 p-md-5 bg-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary bg-opacity-5 rounded-circle blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
              
              <h3 className="fw-black text-dark mb-2 relative z-10">Send an Inquiry</h3>
              <p className="text-muted mb-4 relative z-10">Fill out the form below and our support team will get back to you shortly.</p>
              
              <form onSubmit={handleSubmit} className="relative z-10">
                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-xs text-uppercase tracking-widest text-muted">Full Name *</label>
                    <input 
                      type="text" 
                      className="form-control form-control-lg bg-light border-light rounded-3 text-sm fw-medium" 
                      placeholder="Enter your full name" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      minLength="3"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-xs text-uppercase tracking-widest text-muted">Email Address *</label>
                    <input 
                      type="email" 
                      className="form-control form-control-lg bg-light border-light rounded-3 text-sm fw-medium" 
                      placeholder="Enter your email address" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-xs text-uppercase tracking-widest text-muted">Mobile Number *</label>
                    <input 
                      type="tel" 
                      className="form-control form-control-lg bg-light border-light rounded-3 text-sm fw-medium" 
                      placeholder="Enter your mobile number" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      maxLength="10"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-xs text-uppercase tracking-widest text-muted">Subject *</label>
                    <select 
                      className="form-select form-select-lg bg-light border-light rounded-3 text-sm fw-medium"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Order Support">Order Support</option>
                      <option value="Payment Issue">Payment Issue</option>
                      <option value="Return & Refund">Return & Refund</option>
                      <option value="Product Information">Product Information</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Feedback">Feedback</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold text-xs text-uppercase tracking-widest text-muted">Order ID (Optional)</label>
                    <input 
                      type="text" 
                      className="form-control form-control-lg bg-light border-light rounded-3 text-sm fw-medium" 
                      placeholder="e.g. ORD-20260616-001" 
                      name="orderId"
                      value={formData.orderId}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold text-xs text-uppercase tracking-widest text-muted">Message *</label>
                    <textarea 
                      className="form-control form-control-lg bg-light border-light rounded-3 text-sm fw-medium min-h-[150px]" 
                      placeholder="Describe your issue or inquiry" 
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      minLength="10"
                      maxLength="1000"
                    ></textarea>
                    <div className="text-end mt-1 text-xs text-muted fw-bold">
                      {formData.message.length}/1000
                    </div>
                  </div>
                </div>
                
                {/* 4. Contact Form Actions */}
                <div className="d-flex flex-wrap gap-3 mt-2">
                  <button type="submit" disabled={loading} className="btn btn-primary bg-primary text-white rounded-pill fw-bold text-sm shadow-sm d-flex align-items-center justify-content-center gap-2" style={{ height: '44px', minWidth: '140px' }}>
                    {loading ? "Sending..." : <><FaPaperPlane /> Submit Inquiry</>}
                  </button>
                  <button type="button" onClick={handleReset} disabled={loading} className="btn btn-outline-secondary rounded-pill fw-bold text-sm" style={{ height: '44px', minWidth: '140px' }}>
                    Reset Form
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="col-lg-4">
            <div className="card h-100 border-0 shadow-sm rounded-[32px] p-4 p-md-5 bg-dark text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-success bg-opacity-20 rounded-circle blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
              
              <h4 className="fw-black mb-4 relative z-10 d-flex align-items-center gap-2">
                <FaClock className="text-success" /> Business Hours
              </h4>
              <p className="text-white opacity-75 mb-4 relative z-10">Our support team is available during the following hours to assist you.</p>
              
              <div className="d-flex justify-content-between align-items-center border-bottom border-light border-opacity-25 pb-3 mb-3 relative z-10">
                <span className="fw-bold">Mon – Fri</span>
                <span className="text-success fw-bold">9:00 AM – 9:00 PM</span>
              </div>
              <div className="d-flex justify-content-between align-items-center border-bottom border-light border-opacity-25 pb-3 mb-3 relative z-10">
                <span className="fw-bold">Saturday</span>
                <span className="text-success fw-bold">10:00 AM – 6:00 PM</span>
              </div>
              <div className="d-flex justify-content-between align-items-center relative z-10">
                <span className="fw-bold">Sunday</span>
                <span className="text-warning fw-bold text-sm">Emergency Only</span>
              </div>

              {/* 9. Social Media Section */}
              <div className="mt-auto pt-5 relative z-10">
                <h6 className="fw-bold text-xs text-uppercase tracking-widest opacity-75 mb-3">Follow Us On</h6>
                <div className="d-flex gap-2">
                  <a href="#" className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}><FaFacebookF className="text-dark" /></a>
                  <a href="#" className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}><FaInstagram className="text-dark" /></a>
                  <a href="#" className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}><FaTwitter className="text-dark" /></a>
                  <a href="#" className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}><FaYoutube className="text-dark" /></a>
                  <a href="#" className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}><FaLinkedinIn className="text-dark" /></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Location Map */}
      <section id="map-section" className="container mb-5">
        <div className="card border-0 shadow-sm rounded-[32px] overflow-hidden bg-white p-2">
          <div className="row g-0 align-items-center">
            <div className="col-lg-4 p-4 p-md-5">
              <div className="bg-primary bg-opacity-10 w-16 h-16 rounded-circle d-flex align-items-center justify-content-center text-primary mb-4">
                <FaMapMarkerAlt size={24} />
              </div>
              <h3 className="fw-black text-dark mb-3">Find Us</h3>
              <p className="fw-bold text-dark mb-1">{storeName}</p>
              <p className="text-muted mb-4">{contactAddress}</p>
              <div className="d-flex flex-column gap-3">
                <a href="https://www.google.com/maps/dir/?api=1&destination=18.178518824256553,74.61417927953906" target="_blank" rel="noreferrer" className="btn btn-primary rounded-pill fw-bold w-100 shadow-sm text-sm py-3">
                  Get Directions
                </a>
                <a href="https://www.google.com/maps/search/?api=1&query=18.178518824256553,74.61417927953906" target="_blank" rel="noreferrer" className="btn btn-outline-dark rounded-pill fw-bold w-100 text-sm py-3">
                  Open in Google Maps
                </a>
              </div>
            </div>
            <div className="col-lg-8">
              <div className="rounded-[24px] overflow-hidden h-[400px] w-100 bg-light">
                <iframe 
                  title="Store Location"
                  src="https://maps.google.com/maps?q=18.178518824256553,74.61417927953906&hl=en&z=14&output=embed" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen="" 
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Frequently Asked Questions */}
      <section className="bg-white py-5 mb-0 border-top border-light">
        <div className="container py-4">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="text-center mb-5">
                <h2 className="fw-black h2 text-dark mb-2">Frequently Asked Questions</h2>
                <p className="text-muted">Quick answers to common support queries.</p>
              </div>
              <div className="accordion accordion-flush" id="contactFaqAccordion">
                {faqs.map((faq, idx) => (
                  <div className="accordion-item bg-transparent border-0 mb-3 bg-light rounded-3xl overflow-hidden border border-gray-100" key={idx}>
                    <h2 className="accordion-header">
                      <button className="accordion-button collapsed fw-bold text-dark bg-transparent py-4 px-4 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target={`#contactFaq${idx}`}>
                        <FaQuestionCircle className="text-primary me-3" /> {faq.q}
                      </button>
                    </h2>
                    <div id={`contactFaq${idx}`} className="accordion-collapse collapse" data-bs-parent="#contactFaqAccordion">
                      <div className="accordion-body pt-0 px-4 pb-4 ms-5 text-muted text-sm">
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
          <h2 className="display-5 fw-black text-white mb-3">Need Immediate Assistance?</h2>
          <p className="lead text-white opacity-90 mb-5 max-w-2xl mx-auto fw-medium">
            Our support team is ready to help you resolve any issues as fast as possible.
          </p>
          <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
            <a href={`tel:${contactPhone.replace(/\D/g, '')}`} className="btn btn-light btn-lg rounded-pill px-5 py-3 fw-bold shadow-lg hover:shadow-xl transition-all text-primary text-uppercase tracking-wider text-sm d-flex align-items-center justify-content-center gap-2 text-decoration-none">
              <FaPhoneAlt /> Call Now
            </a>
            <button onClick={() => navigate('/shop')} className="btn btn-outline-light btn-lg rounded-pill px-5 py-3 fw-bold transition-all text-uppercase tracking-wider text-sm border-2">
              Continue Shopping <FaArrowRight size={12} className="ms-1" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Contact;
