import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api";
import "./Login.css";
import { toast } from "react-toastify";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone) return toast.error("Please enter mobile number");
    if (phone.length !== 10) return toast.error("Mobile number must be exactly 10 digits");
    
    setLoading(true);
    setError("");
    try {
      await API.post("/auth/send-otp", { phone });
      toast.info("OTP sent to your mobile (use 123456)");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error("Please enter OTP");

    setLoading(true);
    setError("");
    try {
      const { data } = await API.post("/auth/verify-otp", { phone, otp });
      if (data.success) {
        toast.success("Login successful");
        login(data);
        
        if (data.isAdmin) {
          navigate("/admin/dashboard");
        } else {
          const redirectTo = location.state?.from || "/";
          navigate(redirectTo);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="background-bubbles">
        {[...Array(10)].map((_, i) => (
          <span key={i} className={`bubble bubble-${i}`}></span>
        ))}
      </div>

      <div className="login-card">
        <div className="logo-section">
          <h2>ElectroHub</h2>
          <p className="sub-text">
            {step === 1 ? "Step 1: Mobile Number" : "Step 2: OTP Verification"}
          </p>
        </div>

        {error && <div className="alert">{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <div className="input-group">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                required
                placeholder=" "
                maxLength="10"
                pattern="[0-9]{10}"
              />
              <label>Mobile Number</label>
            </div>
            <button type="submit" className="btn-gradient" disabled={loading}>
              {loading ? "Sending..." : "Continue"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="input-group">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder=" "
                maxLength="6"
              />
              <label>Enter OTP</label>
              <div className="resend-link" onClick={() => setStep(1)}>
                Change Number?
              </div>
            </div>
            <button type="submit" className="btn-gradient" disabled={loading}>
              {loading ? "Verifying..." : "Verify"}
            </button>
          </form>
        )}

        <div className="login-footer">
          <small>© {new Date().getFullYear()} ElectroHub Store</small>
        </div>
      </div>
    </div>
  );
};

export default Login;
