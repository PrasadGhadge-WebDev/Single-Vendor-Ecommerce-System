import React from "react";

const Services = () => {
  const services = [
    "Fast and secure checkout",
    "Reliable shipping updates",
    "Easy order tracking",
    "Customer support assistance",
  ];

  return (
    <div className="container py-5" style={{ maxWidth: "900px" }}>
      <h2 className="mb-4">Our Services</h2>
      <div className="row g-3">
        {services.map((service) => (
          <div className="col-md-6" key={service}>
            <div className="card border-0 shadow-sm p-3 h-100">
              <h6 className="mb-0">{service}</h6>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Services;
