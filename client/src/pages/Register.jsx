import React, { useState, useContext } from "react";
import API from "../api";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./Register.css";
import { toast } from "react-toastify";

const Register = () => {
  const [step, setStep] = useState(1); // 1: Full Form, 2: OTP
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    termsAccepted: false,
  });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword, phone, termsAccepted } = formData;

    if (!name || !email || !password || !phone) {
      return toast.error("Please fill all required fields");
    }
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (phone.length !== 10) {
      return toast.error("Mobile number must be 10 digits");
    }
    if (!termsAccepted) {
      return toast.error("Please accept Terms & Conditions");
    }

    setLoading(true);
    setError("");
    try {
      await API.post("/auth/send-otp", { phone, email });
      toast.info("OTP sent to your mobile (use 123456)");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error("Please enter OTP");

    setLoading(true);
    setError("");
    try {
      // First verify OTP
      const verifyRes = await API.post("/auth/verify-otp", { phone: formData.phone, otp });
      
      if (verifyRes.data.success) {
        // Then complete registration with all fields
        const { data } = await API.post("/auth/complete-registration", {
          userId: verifyRes.data._id,
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });

        if (data.success) {
          toast.success("Registration successful!");
          login(data);
          navigate("/");
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="background-bubbles">
        {[...Array(10)].map((_, i) => (
          <span key={i} className={`bubble bubble-${i}`}></span>
        ))}
      </div>

      <div className="register-card">
        <div className="logo-section">
          <h2>ElectroHub</h2>
          <p className="sub-text">
            {step === 1 ? "Create your account" : "Verify Mobile Number"}
          </p>
        </div>

        {error && <div className="alert">{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="registration-form">
            <div className="input-row">
              <div className="input-group">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder=" "
                />
                <label>Full Name</label>
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder=" "
                />
                <label>Email Address</label>
              </div>
            </div>

            <div className="input-row split">
              <div className="input-group">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder=" "
                />
                <label>Password</label>
              </div>
              <div className="input-group">
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder=" "
                />
                <label>Confirm</label>
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, "")})}
                  required
                  placeholder=" "
                  maxLength="10"
                />
                <label>Mobile Number</label>
              </div>
            </div>

            <div className="terms-checkbox">
              <label>
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleInputChange}
                  required
                />
                <span>I accept the <Link to="/terms">Terms & Conditions</Link></span>
              </label>
            </div>

            <button type="submit" className="btn-gradient" disabled={loading}>
              {loading ? "Processing..." : "Create Account"}
            </button>
            
            <div className="auth-switch">
              Already have an account? <Link to="/login">Login</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleFinalSubmit}>
            <div className="otp-info">
              OTP sent to <strong>+91 {formData.phone}</strong>
            </div>
            <div className="input-group">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder=" "
                maxLength="6"
              />
              <label>Enter 6-digit OTP</label>
              <div className="resend-link" onClick={() => setStep(1)}>
                Change Details?
              </div>
            </div>
            <button type="submit" className="btn-gradient" disabled={loading}>
              {loading ? "Verifying..." : "Verify & Register"}
            </button>
          </form>
        )}

        <div className="register-footer">
          <small>© {new Date().getFullYear()} ElectroHub Store</small>
        </div>
      </div>
    </div>
  );
};

export default Register;
