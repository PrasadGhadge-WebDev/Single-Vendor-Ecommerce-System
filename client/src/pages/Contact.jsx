import React, { useState } from "react";
import { 
  FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaClock, 
  FaWhatsapp, FaHeadset, FaPaperPlane
} from "react-icons/fa";
import { toast } from "react-toastify";
import API from "../api";
import { useBusinessSettings } from "../context/BusinessSettingsContext";
import { isValidEmail, isValidName, normalizeDigits, isValidPhone } from "../utils/validation";

const Contact = () => {
  const { settings } = useBusinessSettings();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  });
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = String(formData.name || "").trim();
    const trimmedEmail = String(formData.email || "").trim();
    const normalizedPhone = normalizeDigits(formData.phone);

    if (!isValidName(trimmedName) || !isValidEmail(trimmedEmail) || !formData.message) {
      return toast.error("Please fill in valid name, email and message");
    }
    if (formData.phone && !isValidPhone(normalizedPhone)) {
      return toast.error("Please enter a valid phone number");
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
        toast.success("Message sent successfully!");
        setFormData({ name: "", email: "", phone: "", subject: "General Inquiry", message: "" });
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-page-bg min-h-screen font-inter">
      {/* 1. Hero Section - Modern Clean Look */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-surface-2 -z-10" />
        {/* Subtle background decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl -z-10" />
        
        <div className="container mx-auto px-4 text-center marketing-fade-up">
            <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-wider mb-4 border border-primary/20">
                Get In Touch
            </span>
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-primary-text">
                How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">help you?</span>
            </h1>
            <p className="text-muted-text max-w-2xl mx-auto text-lg md:text-xl mb-10 leading-relaxed">
                Whether you have a question about products, order tracking, or anything else, our team is ready to answer all your questions.
            </p>
            {settings?.phone && (
              <a 
                href={`https://wa.me/${settings.phone.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold px-8 py-4 rounded-full shadow-lg transition-all hover:-translate-y-1 no-underline"
              >
                <FaWhatsapp className="text-xl" /> Chat on WhatsApp
              </a>
            )}
        </div>
      </section>

      {/* 2. Support Info Cards */}
      <section className="container mx-auto px-4 -mt-10 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <InfoCard icon={<FaPhoneAlt />} title="Call Us" desc={settings?.phone || "+91 0000000000"} delay="0" />
            <InfoCard icon={<FaEnvelope />} title="Email Us" desc={settings?.email || "help@electrohub.com"} delay="1" />
            <InfoCard icon={<FaClock />} title="Support Hours" desc="Mon-Sat: 10AM - 7PM" delay="2" />
            <InfoCard icon={<FaHeadset />} title="Response Time" desc="Within 2 Hours" delay="3" />
        </div>
      </section>

      {/* 3. Main Content: Form & Map */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-5 gap-12 items-start">
          
          {/* Contact Form */}
          <div className="lg:col-span-3 bg-surface-1 p-8 md:p-10 rounded-[32px] shadow-sm border border-theme relative overflow-hidden marketing-fade-up">
             {/* Decorative blob */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
             
             <h3 className="text-3xl font-bold text-primary-text mb-2">Send a Message</h3>
             <p className="text-muted-text mb-8">Fill out the form below and we'll get back to you shortly.</p>
             
             <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="grid md:grid-cols-2 gap-6">
                    <InputField label="Full Name *" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required />
                    <InputField label="Email Address *" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" required />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <InputField label="Phone Number" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="10 Digit Number" />
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-text">Subject</label>
                        <select 
                            className="w-full bg-surface-2 border border-theme focus:border-primary focus:ring-2 focus:ring-primary/20 text-primary-text rounded-xl px-4 py-3.5 outline-none transition-all font-medium text-sm appearance-none cursor-pointer"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                        >
                            <option>General Inquiry</option>
                            <option>Order Issue</option>
                            <option>Product Query</option>
                            <option>Return Request</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-text">Your Message *</label>
                    <textarea 
                        className="w-full bg-surface-2 border border-theme focus:border-primary focus:ring-2 focus:ring-primary/20 text-primary-text rounded-xl px-4 py-3.5 outline-none transition-all font-medium text-sm min-h-[160px] resize-y" 
                        placeholder="How can we help you today?" 
                        name="message" 
                        value={formData.message} 
                        onChange={handleChange} 
                        required
                    />
                </div>
                <button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white font-bold px-10 py-4 rounded-xl shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2" disabled={loading}>
                    {loading ? "SENDING..." : <><FaPaperPlane /> Send Message</>}
                </button>
             </form>
          </div>

          {/* Location details */}
          <div className="lg:col-span-2 space-y-6 marketing-fade-up marketing-delay-2">
            <div className="bg-surface-1 p-8 rounded-[32px] border border-theme shadow-sm">
                <h3 className="text-2xl font-bold text-primary-text mb-6">Our Store</h3>
                <div className="flex items-start gap-4 mb-8">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xl">
                        <FaMapMarkerAlt />
                    </div>
                    <div>
                        <p className="font-bold text-primary-text text-lg mb-1">Headquarters</p>
                        <p className="text-muted-text leading-relaxed">{settings?.address || "Mumbai, Maharashtra, India"}</p>
                    </div>
                </div>
                
                <div className="rounded-2xl overflow-hidden shadow-inner border border-theme h-[320px]">
                    <iframe 
                        title="Store Location"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d120663.45330356024!2d72.846875!3d19.076090!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c6306644edc1%3A0x5da4ed8f8d648c69!2sMumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1622549210000!5m2!1sen!2sin" 
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
    </div>
  );
};

// Helper Components for cleaner code
const InfoCard = ({ icon, title, desc, delay }) => (
    <div className={`bg-surface-1 p-8 rounded-[24px] border border-theme shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group marketing-fade-up marketing-delay-${delay}`}>
        <div className="w-14 h-14 rounded-2xl bg-surface-2 group-hover:bg-primary/10 text-primary flex items-center justify-center text-2xl mb-5 transition-colors">
            {icon}
        </div>
        <h4 className="font-bold text-primary-text mb-2">{title}</h4>
        <p className="text-muted-text font-medium text-sm">{desc}</p>
    </div>
);

const InputField = ({ label, type = "text", ...props }) => (
    <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-text">{label}</label>
        <input 
            type={type}
            className="w-full bg-surface-2 border border-theme focus:border-primary focus:ring-2 focus:ring-primary/20 text-primary-text rounded-xl px-4 py-3.5 outline-none transition-all font-medium text-sm" 
            {...props}
        />
    </div>
);

export default Contact;
