import React, { useState } from "react";
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaClock, FaComments, FaHeadset, FaCheckCircle, FaWhatsapp } from "react-icons/fa";
import { toast } from "react-toastify";
import API from "../api";
import "./MarketingPages.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      return toast.error("Please fill in all fields");
    }

    setLoading(true);
    try {
      const { data } = await API.post("/contacts/submit", formData);
      if (data.success) {
        toast.success("Message sent successfully!");
        setFormData({ name: "", email: "", subject: "", message: "" });
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const supportCards = [
    {
      title: "Support Channel",
      value: "Use the contact form below",
      note: "Best for order and account help",
      icon: <FaEnvelope />,
    },
    {
      title: "Call Us",
      value: "+91 9766875355",
      note: "Click to open dialer",
      icon: <FaPhoneAlt />,
      link: "tel:+919766875355"
    },
    {
      title: "WhatsApp",
      value: "+91 9766875355",
      note: "Click to open WhatsApp",
      icon: <FaWhatsapp />,
      link: "https://wa.me/919766875355"
    },
  ];

  return (
    <div className="contact-page">
      <section
        className="text-white marketing-hero"
        style={{
          background: "linear-gradient(120deg, #0f172a 0%, #0f766e 52%, #0ea5a4 100%)",
        }}
      >
        <div className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-7 marketing-fade-up">
              <p className="text-uppercase mb-2" style={{ letterSpacing: "0.08em", opacity: 0.85 }}>
                Contact Us
              </p>
              <h1 className="fw-bold mb-3">Talk to our team for quick and clear support.</h1>
              <p className="lead mb-0" style={{ opacity: 0.92 }}>
                Share your query and our support team will assist you with orders, products, returns and account help.
              </p>
            </div>
            <div className="col-lg-5 marketing-fade-up marketing-delay-1">
              <div className="p-4 rounded-4 border border-light border-opacity-25 bg-light bg-opacity-10 marketing-chip">
                <h5 className="mb-3">Support Commitments</h5>
                <ul className="mb-0 ps-3">
                  <li className="mb-2">Response within business hours</li>
                  <li className="mb-2">Transparent issue tracking</li>
                  <li className="mb-2">Practical and clear resolution steps</li>
                  <li>Consistent follow-up until closure</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-5" style={{ maxWidth: "1150px" }}>
        <div className="row g-4 mb-4">
          {supportCards.map((card, index) => (
            <div className="col-md-4" key={card.title}>
              <div className={`card border-0 shadow-sm h-100 p-3 marketing-card marketing-fade-up marketing-delay-${Math.min(index + 1, 3)}`}>
                <div className="contact-mini-icon mb-3">{card.icon}</div>
                <h6 className="mb-1">{card.title}</h6>
                <p className="mb-1 fw-semibold">{card.value}</p>
                <p className="text-muted mb-0 small">{card.note}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm p-4 h-100 marketing-card marketing-fade-up">
              <h5 className="mb-3">Direct Support</h5>

              <div className="d-flex gap-3 mb-3">
                <FaComments className="mt-1 text-primary" />
                <div>
                  <div className="fw-semibold">Live Assistance</div>
                  <div className="text-muted">Chat and email support for active order queries.</div>
                </div>
              </div>

              <div className="d-flex gap-3 mb-3">
                <FaHeadset className="mt-1 text-primary" />
                <div>
                  <div className="fw-semibold">Priority Handling</div>
                  <div className="text-muted">Urgent delivery and payment issues are escalated quickly.</div>
                </div>
              </div>

              <div className="d-flex gap-3">
                <FaClock className="mt-1 text-primary" />
                <div>
                  <div className="fw-semibold">Support Hours</div>
                  <div className="text-muted">Support hours are configured in admin settings.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card border-0 shadow-sm p-4 h-100 marketing-card marketing-fade-up marketing-delay-1">
              <h5 className="mb-3">Send a Message</h5>
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Name</label>
                    <input 
                      className="form-control" 
                      placeholder="Your full name" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      placeholder="Enter your email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Subject</label>
                    <input 
                      className="form-control" 
                      placeholder="Order, payment, product or return" 
                      name="subject" 
                      value={formData.subject} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Message</label>
                    <textarea 
                      className="form-control" 
                      rows={5} 
                      placeholder="Write your message in detail..." 
                      name="message" 
                      value={formData.message} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="col-12 d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div className="text-muted small d-flex align-items-center gap-2">
                      <FaCheckCircle className="text-success" />
                      Response timing is managed from store settings.
                    </div>
                    <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                      {loading ? "Sending..." : "Submit Request"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;

