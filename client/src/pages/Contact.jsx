import React from "react";

const Contact = () => {
  return (
    <div className="container py-5" style={{ maxWidth: "900px" }}>
      <h2 className="mb-3">Contact</h2>
      <p className="text-muted mb-4">Need help? Reach out and we will respond quickly.</p>

      <div className="card border-0 shadow-sm p-4">
        <p className="mb-2"><strong>Email:</strong> support@myshop.com</p>
        <p className="mb-2"><strong>Phone:</strong> +91 90000 00000</p>
        <p className="mb-0"><strong>Address:</strong> Pune, Maharashtra, India</p>
      </div>
    </div>
  );
};

export default Contact;
