import React, { useState } from "react";
import { 
  FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaClock, 
  FaWhatsapp, FaChevronDown, FaPaperclip, FaHeadset,
  FaArrowRight, FaPaperPlane
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
    <div className="bg-surface-1 min-h-screen">
      {/* 1. Hero Section */}
      <section 
        className="text-white marketing-hero"
        style={{
            background: "linear-gradient(135deg, #020617 0%, #0052FF 100%)",
            paddingTop: "160px",
            paddingBottom: "100px"
        }}
      >
        <div className="container mx-auto px-4 relative z-10 text-center marketing-fade-up">
            <h1 className="text-4xl md:text-8xl font-black mb-4 italic uppercase tracking-tighter leading-none">Contact Us</h1>
            <p className="text-white/80 font-bold max-w-xl mx-auto text-lg md:text-xl mb-8">
                Have a question? Message us on WhatsApp or visit our store. We're here to help you anytime!
            </p>
            {settings?.phone && (
              <a 
                href={`https://wa.me/${settings.phone.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-black px-10 py-4 rounded-full shadow-2xl transition-all hover:scale-105 no-underline"
              >
                <FaWhatsapp className="text-2xl" /> CHAT ON WHATSAPP
              </a>
            )}
        </div>
      </section>

      {/* 2. Support Info Cards */}
      <section className="container mx-auto px-4 -mt-12 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface-1 p-8 rounded-[32px] border border-theme shadow-xl marketing-fade-up">
                <div className="text-primary text-2xl mb-4"><FaPhoneAlt /></div>
                <h4 className="font-black text-primary-text mb-1 uppercase text-sm">Call Us</h4>
                <p className="text-muted-text text-sm font-bold">{settings?.phone || "+91 0000000000"}</p>
            </div>
            <div className="bg-surface-1 p-8 rounded-[32px] border border-theme shadow-xl marketing-fade-up marketing-delay-1">
                <div className="text-primary text-2xl mb-4"><FaEnvelope /></div>
                <h4 className="font-black text-primary-text mb-1 uppercase text-sm">Email Us</h4>
                <p className="text-muted-text text-sm font-bold">{settings?.email || "help@electrohub.com"}</p>
            </div>
            <div className="bg-surface-1 p-8 rounded-[32px] border border-theme shadow-xl marketing-fade-up marketing-delay-2">
                <div className="text-primary text-2xl mb-4"><FaClock /></div>
                <h4 className="font-black text-primary-text mb-1 uppercase text-sm">Support Hours</h4>
                <p className="text-muted-text text-sm font-bold">Mon-Sat: 10AM - 7PM</p>
            </div>
            <div className="bg-surface-1 p-8 rounded-[32px] border border-theme shadow-xl marketing-fade-up marketing-delay-3">
                <div className="text-primary text-2xl mb-4"><FaHeadset /></div>
                <h4 className="font-black text-primary-text mb-1 uppercase text-sm">Response Time</h4>
                <p className="text-muted-text text-sm font-bold">Within 2 Hours</p>
            </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* 3. Contact Form (Left) */}
          <div className="marketing-fade-up">
            <div className="bg-surface-1 p-8 md:p-12 rounded-[40px] shadow-2xl border border-theme">
                <h3 className="text-2xl font-black text-primary-text mb-8 flex items-center gap-3">
                    <span className="w-2 h-8 bg-primary rounded-full" />
                    Send a Message
                </h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-text">Full Name *</label>
                        <input 
                            className="w-full bg-surface-2 border-2 border-transparent focus:border-primary focus:bg-surface-1 text-primary-text rounded-2xl px-5 py-4 outline-none transition-all font-bold text-sm" 
                            placeholder="Your Name" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            required
                        />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-text">Email Address *</label>
                            <input 
                                type="email" 
                                className="w-full bg-surface-2 border-2 border-transparent focus:border-primary focus:bg-surface-1 text-primary-text rounded-2xl px-5 py-4 outline-none transition-all font-bold text-sm" 
                                placeholder="your@email.com" 
                                name="email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-text">Phone Number</label>
                            <input 
                                type="tel"
                                className="w-full bg-surface-2 border-2 border-transparent focus:border-primary focus:bg-surface-1 text-primary-text rounded-2xl px-5 py-4 outline-none transition-all font-bold text-sm" 
                                placeholder="10 Digit Number" 
                                name="phone" 
                                value={formData.phone} 
                                onChange={handleChange} 
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-text">Subject</label>
                        <select 
                            className="w-full bg-surface-2 border-2 border-transparent focus:border-primary focus:bg-surface-1 text-primary-text rounded-2xl px-5 py-4 outline-none transition-all font-bold text-sm appearance-none"
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
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-text">Your Message *</label>
                        <textarea 
                            className="w-full bg-surface-2 border-2 border-transparent focus:border-primary focus:bg-surface-1 text-primary-text rounded-2xl px-5 py-4 outline-none transition-all font-bold text-sm min-h-[150px]" 
                            placeholder="How can we help you?" 
                            name="message" 
                            value={formData.message} 
                            onChange={handleChange} 
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white font-black px-12 py-5 rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3" disabled={loading}>
                        {loading ? "SENDING..." : <><FaPaperPlane /> SEND MESSAGE</>}
                    </button>
                </form>
            </div>
          </div>

          {/* 4. Location Section (Right) */}
          <div className="space-y-8 marketing-fade-up marketing-delay-1">
            <div className="bg-surface-1 p-8 rounded-[40px] border border-theme shadow-lg">
                <h3 className="text-2xl font-black text-primary-text mb-6 flex items-center gap-3">
                    <span className="w-2 h-8 bg-secondary rounded-full" />
                    Our Location
                </h3>
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="text-secondary mt-1 text-xl"><FaMapMarkerAlt /></div>
                        <div>
                            <p className="font-black text-primary-text uppercase text-xs tracking-widest mb-1">Store Address</p>
                            <p className="text-muted-text font-medium">{settings?.address || "Mumbai, Maharashtra, India"}</p>
                        </div>
                    </div>
                    {/* Map Embed Preview */}
                    <div className="rounded-[32px] overflow-hidden shadow-2xl border-4 border-surface-2 h-[350px]">
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
        </div>
      </section>

      {/* 5. Footer CTA (WhatsApp Chat) */}
      <section className="container mx-auto px-4 pb-20 pt-10">
          <div className="bg-surface-3 rounded-[40px] p-12 text-center text-primary-text relative overflow-hidden border border-theme">
                <div className="absolute top-0 left-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -ml-16 -mt-16" />
                <h3 className="text-2xl md:text-4xl font-black mb-4 flex items-center justify-center gap-3 italic uppercase tracking-tighter">
                    Need Help Fast?
                </h3>
                <p className="text-muted-text font-bold mb-10 max-w-xl mx-auto opacity-80">
                    Order status, technical issues, or product queries - Chat with our experts on WhatsApp for an immediate answer.
                </p>
                {settings?.phone && (
                <a 
                    href={`https://wa.me/${settings.phone.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-4 bg-[#25D366] text-white font-black px-12 py-5 rounded-full shadow-2xl hover:bg-[#128C7E] transition-all no-underline hover:scale-110 active:scale-95"
                >
                    <FaWhatsapp className="text-2xl" /> START CHAT NOW
                </a>
                )}
          </div>
      </section>
    </div>
  );
};

export default Contact;
