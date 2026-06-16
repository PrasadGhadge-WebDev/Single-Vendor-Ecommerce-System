import React, { useState, useContext, useCallback } from "react";
import API from "../api";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./Register.css";
import { toast } from "react-toastify";
import { FaTimes } from "react-icons/fa";
import { LuUser, LuMail, LuPhone, LuLock, LuShieldCheck, LuEye, LuEyeOff } from "react-icons/lu";
import { isValidEmail, isValidName, isValidPassword, isValidPhone, normalizeDigits } from "../utils/validation";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
  }, [error]);

  const handleSendOtp = useCallback(async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword, phone, termsAccepted } = formData;
    const trimmedName = String(name || "").trim();
    const trimmedEmail = String(email || "").trim();
    const trimmedPhone = normalizeDigits(phone);

    if (!isValidName(trimmedName)) {
      return setError("Enter a valid name with at least 3 letters and no numbers");
    }
    if (!isValidEmail(trimmedEmail)) {
      return setError("Please enter a valid email address");
    }
    if (!isValidPassword(password)) {
      return setError("Password must be at least 6 characters");
    }
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    if (!isValidPhone(trimmedPhone)) {
      return setError("Please enter a valid 10-digit mobile number");
    }
    if (!termsAccepted) {
      return setError("Please accept Terms & Conditions");
    }

    setLoading(true);
    setError("");
    try {
      await API.post("/auth/send-otp", { phone: trimmedPhone, email: trimmedEmail });
      toast.info("OTP sent to your mobile (use 123456)");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }, [formData, error]);

  const handleFinalSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!/^[0-9]{6}$/.test(otp)) {
      return setError("Please enter a valid 6-digit OTP");
    }

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
  }, [otp, formData, login, navigate, error]);

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <button className="close-btn" onClick={() => navigate("/login")}>
          <FaTimes />
        </button>

        <div className="text-center mb-6">
          <div className="flex justify-center items-center gap-2 mb-3">
            <div className="w-12 h-12 bg-[#5B3DF5] rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-md">
              E
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight m-0">ElectroHub</h1>
          </div>
          <h2 className="text-lg font-bold text-gray-600 m-0" style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem', color: '#475569', marginBottom: '0' }}>
            {step === 1 ? "Create your account and start shopping." : "Verify your mobile number."}
          </h2>
        </div>

        {error && <div className="alert-box">{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="registration-form" autoComplete="off">
            <div className="input-row">
              <label>Full Name</label>
              <div className="input-with-icon">
                <LuUser className="input-icon" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value.replace(/[0-9]/g, "") }))}
                  required
                  placeholder="Enter your full name"
                  autoComplete="off"
                  autoFocus
                />
              </div>
            </div>

            <div className="input-row">
              <label>Email Address</label>
              <div className="input-with-icon">
                <LuMail className="input-icon" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your email"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="input-row split">
              <div>
                <label>Password</label>
                <div className="input-with-icon password-input-wrapper">
                  <LuLock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="Password"
                    autoComplete="new-password"
                  />
                  <div className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <LuEyeOff /> : <LuEye />}
                  </div>
                </div>
              </div>
              <div>
                <label>Confirm</label>
                <div className="input-with-icon password-input-wrapper">
                  <LuShieldCheck className="input-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    placeholder="Confirm"
                    autoComplete="new-password"
                  />
                  <div className="password-toggle-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <LuEyeOff /> : <LuEye />}
                  </div>
                </div>
              </div>
            </div>

            <div className="input-row">
              <label>Mobile Number</label>
              <div className="input-with-icon">
                <LuPhone className="input-icon" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: normalizeDigits(e.target.value).slice(0, 10) }))}
                  required
                  placeholder="10-digit number"
                  maxLength="10"
                  autoComplete="off"
                />
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
          <form onSubmit={handleFinalSubmit} className="registration-form">
            <div className="otp-info">
              OTP sent to <strong>+91 {formData.phone}</strong>
            </div>
            <div className="input-row">
              <label>Enter 6-digit OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="6-digit code"
                maxLength="6"
                autoComplete="off"
              />
              <div className="resend-link" onClick={() => setStep(1)}>
                Change Details?
              </div>
            </div>
            <button type="submit" className="btn-gradient" disabled={loading}>
              {loading ? "Verifying..." : "Verify & Register"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default React.memo(Register);
