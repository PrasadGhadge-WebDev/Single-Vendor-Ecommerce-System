import React, { useState, useContext, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLocation, useNavigate, Link } from "react-router-dom";
import API from "../api";
import "./Login.css";
import { toast } from "react-toastify";
import { LuMail, LuLock, LuEye, LuEyeOff } from "react-icons/lu";
import { FaTimes } from "react-icons/fa";
import { isValidEmail, isValidPhone, normalizeDigits } from "../utils/validation";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError("");
  }, [error]);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    const identifier = String(formData.identifier || "").trim();

    if (!identifier || !formData.password) {
      return setError("Please enter both email/mobile and password");
    }

    const isEmail = identifier.includes("@");
    if (isEmail) {
      if (!isValidEmail(identifier)) {
        return setError("Please enter a valid email address");
      }
    } else {
      if (!isValidPhone(identifier)) {
        return setError("Please enter a valid mobile number");
      }
    }

    setLoading(true);
    setError("");
    try {
      const payload = {
        identifier: isEmail ? identifier : normalizeDigits(identifier),
        password: formData.password,
      };
      const { data } = await API.post("/auth/login", payload);
      if (data.success) {
        toast.success("Welcome back!");
        login(data);
        
        if (data.isAdmin) {
          navigate("/admin/dashboard");
        } else {
          const redirectTo = location.state?.from || "/";
          navigate(redirectTo);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }, [formData, error, login, navigate, location]);

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <button className="close-btn" onClick={() => navigate("/")}>
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
            Welcome Back! Sign in to continue.
          </h2>
        </div>

        {error && <div className="alert-box">{error}</div>}

        <form onSubmit={handleLogin} className="login-form" autoComplete="off">
          <div className="input-row">
            <label>Email Address or Mobile Number</label>
            <div className="input-with-icon">
              <LuMail className="input-icon" />
              <input
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
                required
                placeholder="Enter email or phone"
                autoComplete="off"
                autoFocus
              />
            </div>
          </div>

          <div className="input-row mb-3">
            <label>Password</label>
            <div className="input-with-icon password-input-wrapper">
              <LuLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Enter your password"
                autoComplete="new-password"
              />
              <div className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <LuEyeOff /> : <LuEye />}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 cursor-pointer m-0">
              <input 
                type="checkbox" 
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                className="w-4 h-4 rounded border-gray-300 text-[#5B3DF5] focus:ring-[#5B3DF5]" 
              />
              Remember Me
            </label>
            <div className="forgot-link-box m-0">
               <Link to="/forgot-password">Forgot Password?</Link>
            </div>
          </div>

          <button type="submit" className="btn-gradient" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          
          <div className="auth-switch">
            Don't have an account? <Link to="/register">Register</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default React.memo(Login);
