import React from "react";

const About = () => {
  return (
    <div className="container py-5" style={{ maxWidth: "900px" }}>
      <h2 className="mb-3">About Us</h2>
      <p className="text-muted mb-4">
        We are a single-vendor ecommerce platform focused on trusted products, fair pricing, and fast support.
      </p>
      <div className="card border-0 shadow-sm p-4">
        <h5>Our Mission</h5>
        <p className="mb-0">Deliver quality products with a smooth shopping experience from discovery to delivery.</p>
      </div>
    </div>
  );
};

export default About;
