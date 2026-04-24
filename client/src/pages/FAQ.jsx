import React, { useState } from "react";
import { FaChevronDown, FaHeadset, FaEnvelope, FaWhatsapp } from "react-icons/fa";
import "./FAQ.css";

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`faq-item ${isOpen ? "active" : ""}`} onClick={() => setIsOpen(!isOpen)}>
      <div className="faq-question">
        <span>{question}</span>
        <FaChevronDown className="faq-toggle-icon" />
      </div>
      <div className="faq-answer">
        {answer}
      </div>
    </div>
  );
};

const FAQ = () => {
  const faqs = [
    {
      category: "Orders & Payments",
      items: [
        {
          question: "How do I place an order on ElectroHub?",
          answer: "Simply select your desired product, click 'Add to Cart', and then proceed to the checkout page. Fill in your delivery details and click 'Place Order' to confirm."
        },
        {
          question: "What payment methods are available?",
          answer: "We support various payment options including Cash on Delivery (COD), UPI, Credit/Debit Cards, and Net Banking. All transactions are 100% secure."
        },
        {
          question: "Can I cancel my order?",
          answer: "Yes, you can cancel your order from the 'My Orders' section as long as it hasn't been shipped yet."
        }
      ]
    },
    {
      category: "Shipping & Delivery",
      items: [
        {
          question: "How long does delivery take?",
          answer: "Standard orders are typically delivered within 3-5 working days. Deliveries to metro cities may arrive sooner."
        },
        {
          question: "What are the shipping charges?",
          answer: "Shipping is free for all orders above ₹500. For orders below this amount, a nominal delivery charge of ₹50 will apply."
        },
        {
          question: "How can I track my order?",
          answer: "Once your order is shipped, you will receive a tracking link via SMS and Email. You can also track your status directly from the 'My Orders' section in your profile."
        }
      ]
    },
    {
      category: "Returns & Refunds",
      items: [
        {
          question: "What is your return policy?",
          answer: "We offer a hassle-free 7-day return policy. The product must be unused and in its original packaging to be eligible for a return."
        },
        {
          question: "When will I receive my refund?",
          answer: "Refunds are processed within 2-3 business days after the product reaches our warehouse. It may take 5-7 working days to reflect in your account depending on your bank."
        }
      ]
    },
    {
      category: "Account & Security",
      items: [
        {
          question: "Why do I need an OTP to create an account?",
          answer: "We use OTP (One-Time Password) verification for enhanced security. This ensures your mobile number is valid and eliminates the need to remember complex passwords."
        },
        {
          question: "I am not receiving the OTP, what should I do?",
          answer: "Please check your network connection and click 'Resend OTP'. If you still don't receive it, please contact our customer support team for assistance."
        }
      ]
    },
    {
      category: "Warranty & Support",
      items: [
        {
          question: "Do products come with a warranty?",
          answer: "Yes, all electronic products come with a standard brand warranty. The warranty card and details are included inside the product packaging."
        },
        {
          question: "How can I contact customer support?",
          answer: "You can reach us via email at support@electrohub.com or click the WhatsApp button below to chat with our support representatives."
        }
      ]
    }
  ];

  return (
    <div className="faq-page">
      <div className="faq-hero">
        <div className="container">
          <h1>Help Center</h1>
          <p>Find answers to all your questions about shopping at ElectroHub.</p>
        </div>
      </div>

      <div className="faq-container container">
        {faqs.map((section, idx) => (
          <div key={idx}>
            <h2 className="faq-section-title">{section.category}</h2>
            {section.items.map((faq, fidx) => (
              <FAQItem key={fidx} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        ))}

        <div className="faq-support-card">
          <FaHeadset size={48} className="text-primary mb-3" />
          <h3>Still have questions?</h3>
          <p>If you can't find the answer you're looking for, please contact us directly.</p>
          <div className="faq-support-btns">
            <a href="mailto:support@electrohub.com" className="btn btn-outline-primary d-flex align-items-center gap-2">
              <FaEnvelope /> Email Us
            </a>
            <a href="https://wa.me/910000000000" className="btn btn-success d-flex align-items-center gap-2">
              <FaWhatsapp /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
