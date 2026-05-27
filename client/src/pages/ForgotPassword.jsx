import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import { toast } from "react-toastify";
import { FaTimes } from "react-icons/fa";
import "./Login.css";
import { isValidEmail, isValidPhone, normalizeDigits, isValidPassword } from "../utils/validation";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Identifier, 2: OTP, 3: New Password
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    identifier: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const identifier = String(formData.identifier || "").trim();
    if (!identifier) return toast.error("Please enter email or mobile");

    const isEmail = identifier.includes("@");
    if (isEmail) {
      if (!isValidEmail(identifier)) {
        return toast.error("Please enter a valid email address");
      }
    } else {
      const normalized = normalizeDigits(identifier);
      if (!isValidPhone(normalized)) {
        return toast.error("Please enter a valid mobile number");
      }
    }

    const normalizedIdentifier = isEmail ? identifier : normalizeDigits(identifier);

    setLoading(true);
    try {
      const { data } = await API.post("/auth/forgot-password", {
        identifier: normalizedIdentifier,
      });
      if (data.success) {
        toast.info("OTP sent to your Email/Mobile (123456)");
        setFormData((prev) => ({ ...prev, identifier: normalizedIdentifier }));
        setStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!formData.otp) return toast.error("Please enter OTP");

    setLoading(true);
    try {
      const { data } = await API.post("/auth/verify-reset-otp", { 
        identifier: isValidEmail(formData.identifier) ? formData.identifier : normalizeDigits(formData.identifier), 
        otp: formData.otp 
      });
      if (data.success) {
        toast.success("OTP Verified");
        setStep(3);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (!isValidPassword(formData.newPassword)) {
      return toast.error("Password must be at least 6 characters");
    }

    setLoading(true);
    try {
      const identifierForReset = isValidEmail(formData.identifier) ? formData.identifier : normalizeDigits(formData.identifier);
      const { data } = await API.post("/auth/reset-password", {
        identifier: identifierForReset,
        otp: formData.otp,
        newPassword: formData.newPassword,
      });
      if (data.success) {
        toast.success("Password reset successful! Please login.");
        navigate("/login");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <button className="close-btn" onClick={() => navigate("/login")}>
          <FaTimes />
        </button>

        <div className="logo-section">
          <div className="step-indicator">Step {step} of 3</div>
          <h2>{step === 1 ? "Reset Password" : step === 2 ? "Verify OTP" : "New Password"}</h2>
          <p className="sub-text" style={{ textAlign: 'center', marginBottom: '24px', fontSize: '0.9rem', color: '#64748b' }}>
            {step === 1 && "Enter your Email or Mobile"}
            {step === 2 && "Enter the 6-digit code"}
            {step === 3 && "Set your new password"}
          </p>
        </div>

        <form onSubmit={step === 1 ? handleSendOtp : step === 2 ? handleVerifyOtp : handleResetPassword} className="login-form" autoComplete="off">
          {step === 1 && (
            <div className="input-row">
              <label>Email or Mobile Number</label>
              <input
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
                required
                placeholder="Enter email or phone"
                autoComplete="off"
              />
            </div>
          )}

          {step === 2 && (
            <div className="input-row">
              <label>Verification Code</label>
              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleInputChange}
                required
                placeholder="Enter 6-digit OTP"
                autoComplete="off"
                maxLength="6"
              />
            </div>
          )}

          {step === 3 && (
            <>
              <div className="input-row">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />
              </div>
              <div className="input-row">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>
            </>
          )}

          <button type="submit" className="btn-gradient" disabled={loading}>
            {loading ? "Processing..." : step === 1 ? "Send OTP" : step === 2 ? "Verify OTP" : "Reset Password"}
          </button>
          
          <div className="auth-switch">
            Remembered your password? <Link to="/login">Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
