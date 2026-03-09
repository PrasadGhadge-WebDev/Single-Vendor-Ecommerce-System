import React, { useEffect, useState } from "react";
import "./MarketingPages.css";

const Counter = ({ target }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = target;
    const duration = 1800;
    const increment = end / (duration / 20);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 20);

    return () => clearInterval(timer);
  }, [target]);

  return <h3 className="fw-bold mb-1">{count}+</h3>;
};

const About = () => {
  return (
    <div className="about-page">
      <section
        className="text-white marketing-hero"
        style={{
          background: "linear-gradient(120deg, #0b1220 0%, #1e293b 45%, #334155 100%)",
        }}
      >
        <div className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-7 marketing-fade-up">
              <p className="text-uppercase mb-2" style={{ letterSpacing: "0.08em", opacity: 0.85 }}>
                About Us
              </p>
              <h1 className="fw-bold mb-3">Built for reliable, fast and secure shopping.</h1>
              <p className="lead mb-0" style={{ opacity: 0.9 }}>
                We focus on product quality, transparent pricing and smooth order fulfillment so customers can shop with confidence.
              </p>
            </div>
            <div className="col-lg-5 marketing-fade-up marketing-delay-1">
              <div className="p-4 rounded-4 border border-light border-opacity-25 bg-light bg-opacity-10 marketing-chip">
                <h5 className="mb-3">Why customers choose us</h5>
                <ul className="mb-0 ps-3">
                  <li className="mb-2">Verified products with clear details</li>
                  <li className="mb-2">Secure checkout and payment flow</li>
                  <li className="mb-2">Consistent support and updates</li>
                  <li>Reliable dispatch and delivery process</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-5">
        <div className="row g-3 text-center mb-5">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100 p-3 marketing-card marketing-fade-up">
              <Counter target={500} />
              <p className="mb-0 text-muted">Happy Customers</p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100 p-3 marketing-card marketing-fade-up marketing-delay-1">
              <Counter target={200} />
              <p className="mb-0 text-muted">Products Available</p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100 p-3 marketing-card marketing-fade-up marketing-delay-2">
              <Counter target={150} />
              <p className="mb-0 text-muted">Orders Delivered</p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100 p-3 marketing-card marketing-fade-up marketing-delay-3">
              <Counter target={24} />
              <p className="mb-0 text-muted">Support Availability</p>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm p-4 p-md-5 marketing-card marketing-fade-up">
          <h3 className="fw-bold mb-3 marketing-section-title">Our Commitment</h3>
          <p className="text-muted mb-3">
            This platform is designed to maintain high operational standards across inventory, order management and customer communication.
          </p>
          <p className="text-muted mb-0">
            Our goal is long-term trust through consistent quality, faster response time and continuous service improvements.
          </p>
        </div>
      </section>
    </div>
  );
};

export default About;
