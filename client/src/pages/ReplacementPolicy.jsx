import React, { useEffect, useState } from "react";
import API from "../api";

const ReplacementPolicy = () => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoading(true);
        const { data } = await API.get("/policies/replacement");
        setPolicy(data);
      } catch {
        setPolicy(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  if (loading) {
    return (
      <div className="container py-5">
        <p>Loading policy...</p>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ maxWidth: "900px" }}>
      <h2 className="mb-3">{policy?.title || "Replacement Policy"}</h2>
      <p className="text-muted">
        Replacement Window: {policy?.replacementWindowDays || 7} days
      </p>
      <p className="text-muted">
        Cancellation Window: {policy?.orderCancellationWindowHours || 24} hours
      </p>
      <div className="card p-3 mt-3">
        <ul className="mb-0">
          {(policy?.policyPoints || []).map((point, idx) => (
            <li key={idx} className="mb-2">{point}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ReplacementPolicy;
