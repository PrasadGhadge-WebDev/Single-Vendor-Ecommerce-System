import React, { useEffect, useState } from "react";
import API from "../api";

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const { data } = await API.get("/offers/public");
        setOffers(Array.isArray(data) ? data : []);
      } catch (error) {
        setOffers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  return (
    <div className="container py-5" style={{ maxWidth: "1000px" }}>
      <h2 className="mb-4">Offers & Discounts</h2>
      {loading ? (
        <p>Loading offers...</p>
      ) : offers.length === 0 ? (
        <p className="text-muted">No active offers right now.</p>
      ) : (
        <div className="row g-3">
          {offers.map((offer) => (
            <div className="col-md-6" key={offer._id}>
              <div className="card p-3 h-100">
                <h5 className="mb-1">{offer.title}</h5>
                <p className="text-muted mb-2">{offer.description}</p>
                <p className="mb-1"><strong>Code:</strong> {offer.code}</p>
                <p className="mb-1">
                  <strong>Discount:</strong>{" "}
                  {offer.discountType === "PERCENT"
                    ? `${offer.discountValue}%`
                    : `INR ${offer.discountValue}`}
                </p>
                <p className="mb-0"><strong>Min Order:</strong> INR {offer.minOrderAmount || 0}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Offers;
