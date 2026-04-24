import React, { useState } from "react";
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaClock, FaCheckCircle, FaWhatsapp, FaChevronDown, FaPaperclip } from "react-icons/fa";
import { toast } from "react-toastify";
import API from "../api";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Order Issue",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    { q: "How to track my order?", a: "Once your order is shipped, you will receive a tracking ID via SMS and Email. You can use it in our 'Track Order' section." },
    { q: "Is COD available?", a: "Yes! Cash on Delivery is available for orders up to ₹20,000 across most pin codes in India." },
    { q: "What is the return policy?", a: "We offer a 7-day easy return policy for defective or damaged products. Please ensure the tags and packaging are intact." },
    { q: "What is the average delivery time?", a: "Standard delivery takes 3-5 business days depending on your location." },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      return toast.error("Please fill in required fields");
    }

    setLoading(true);
    try {
      const { data } = await API.post("/contacts/submit", formData);
      if (data.success) {
        toast.success("Message sent successfully!");
        setFormData({ name: "", email: "", phone: "", subject: "Order Issue", message: "" });
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-2 min-h-screen transition-colors duration-400">
      {/* Hero Section */}
      <section className="bg-primary text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="container mx-auto px-4 relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl font-black mb-4 italic uppercase tracking-tighter">Get in Touch</h1>
            <p className="text-white/80 font-bold max-w-xl mx-auto">
                Have a question or feedback? We'd love to hear from you. Our team is here to help!
            </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left Side: Contact Form */}
          <div className="space-y-8">
            <div className="bg-surface-1 p-8 md:p-12 rounded-[40px] shadow-2xl border border-theme">
                <h3 className="text-2xl font-black text-primary-text mb-8 flex items-center gap-3">
                    <span className="w-2 h-8 bg-primary rounded-full" />
                    Send a Message
                </h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-text">Full Name *</label>
                            <input 
                                className="w-full bg-surface-2 border-2 border-transparent focus:border-primary focus:bg-surface-1 text-primary-text rounded-2xl px-5 py-4 outline-none transition-all font-bold text-sm" 
                                placeholder="Prasad Ghadge" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-text">Email Address *</label>
                            <input 
                                type="email" 
                                className="w-full bg-surface-2 border-2 border-transparent focus:border-primary focus:bg-surface-1 text-primary-text rounded-2xl px-5 py-4 outline-none transition-all font-bold text-sm" 
                                placeholder="prasad@example.com" 
                                name="email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                required
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-text">Phone Number</label>
                            <input 
                                type="tel"
                                className="w-full bg-surface-2 border-2 border-transparent focus:border-primary focus:bg-surface-1 text-primary-text rounded-2xl px-5 py-4 outline-none transition-all font-bold text-sm" 
                                placeholder="+91 9123456789" 
                                name="phone" 
                                value={formData.phone} 
                                onChange={handleChange} 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-text">Subject</label>
                            <select 
                                className="w-full bg-surface-2 border-2 border-transparent focus:border-primary focus:bg-surface-1 text-primary-text rounded-2xl px-5 py-4 outline-none transition-all font-bold text-sm appearance-none"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                            >
                                <option>Order Issue</option>
                                <option>Product Query</option>
                                <option>Return Request</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-text">Your Message *</label>
                        <textarea 
                            className="w-full bg-surface-2 border-2 border-transparent focus:border-primary focus:bg-surface-1 text-primary-text rounded-2xl px-5 py-4 outline-none transition-all font-bold text-sm min-h-[150px]" 
                            placeholder="Write your message here..." 
                            name="message" 
                            value={formData.message} 
                            onChange={handleChange} 
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-4">
                        <div className="hidden sm:flex items-center gap-2 text-primary cursor-pointer hover:opacity-70 transition-opacity">
                            <FaPaperclip />
                            <span className="text-xs font-bold uppercase tracking-widest">Attach Image</span>
                        </div>
                        <button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-black px-12 py-4 rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50" disabled={loading}>
                            {loading ? "SENDING..." : "SEND MESSAGE"}
                        </button>
                    </div>
                </form>
            </div>
          </div>

          {/* Right Side: Info & Map */}
          <div className="space-y-12">
            <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-text">Contact Details</h4>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="text-primary mt-1"><FaMapMarkerAlt /></div>
                            <div>
                                <p className="font-bold text-primary-text">Address</p>
                                <p className="text-sm text-muted-text">Shop No. 123, ABC Mall, Mumbai - 400001</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="text-primary mt-1"><FaPhoneAlt /></div>
                            <div>
                                <p className="font-bold text-primary-text">Phone</p>
                                <p className="text-sm text-muted-text">+91 98658 57545<br/><span className="text-success font-bold">(Call/WhatsApp Available)</span></p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="text-primary mt-1"><FaEnvelope /></div>
                            <div>
                                <p className="font-bold text-primary-text">Email</p>
                                <p className="text-sm text-muted-text">support@electrohub.com</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-text">Support Hours</h4>
                    <div className="bg-surface-1 p-6 rounded-[30px] border border-theme">
                        <div className="flex items-center gap-3 mb-4">
                            <FaClock className="text-primary text-xl" />
                            <span className="font-black text-primary-text">Mon - Sat</span>
                        </div>
                        <p className="text-2xl font-black italic text-primary-text">10:00 AM - 07:00 PM</p>
                        <p className="text-xs text-muted-text mt-2 font-bold uppercase tracking-widest italic">Closed on Sundays & Public Holidays</p>
                    </div>
                </div>
            </div>

            {/* Map Embed */}
            <div className="rounded-[40px] overflow-hidden shadow-2xl border-4 border-gray-50 h-[300px]">
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
      </section>

      {/* FAQ Accordion Section */}
      <section className="bg-surface-2 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-16">
                <div className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">FAQs</div>
                <h2 className="text-3xl md:text-5xl font-black text-primary-text">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-4">
                {faqs.map((faq, idx) => (
                    <div key={idx} className="bg-surface-1 rounded-3xl border border-theme overflow-hidden shadow-sm">
                        <button 
                            className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-surface-2 transition-colors focus:outline-none group"
                            onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        >
                            <span className="font-bold text-primary-text group-hover:text-primary transition-colors">{faq.q}</span>
                            <FaChevronDown className={`transition-transform duration-300 ${openFaq === idx ? 'rotate-180 text-primary' : 'text-muted-text'}`} />
                        </button>
                        <div className={`transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                            <div className="px-8 pb-6 text-muted-text text-sm leading-relaxed border-t border-theme pt-4">
                                {faq.a}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Help Banner */}
      <section className="container mx-auto px-4 pb-20 pt-10">
          <div className="bg-surface-3 rounded-[40px] p-12 text-center text-primary-text relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -ml-16 -mt-16" />
                <h3 className="text-2xl font-black mb-4 flex items-center justify-center gap-3">
                    <FaWhatsapp className="text-success text-3xl animate-bounce" />
                    Need Immediate Help?
                </h3>
                <p className="text-muted-text font-bold mb-8">Order status, refunds, or technical issues - Chat with us on WhatsApp for faster resolution.</p>
                <a href="https://wa.me/919865857545" className="inline-block bg-primary text-white font-black px-12 py-4 rounded-2xl shadow-xl hover:bg-primary-dark transition-all transition-duration-300 no-underline">
                    START WHATSAPP CHAT
                </a>
          </div>
      </section>
    </div>
  );
};

export default Contact;
