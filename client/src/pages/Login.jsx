import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLocation, useNavigate, Link } from "react-router-dom";
import API from "../api";
import "./Login.css";
import { toast } from "react-toastify";
import { FaRegEye, FaRegEyeSlash, FaTimes } from "react-icons/fa";
import { isValidEmail, isValidPhone, normalizeDigits } from "../utils/validation";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("expired")) {
      setError("Your session has expired. Please log in again.");
    }
  }, [location.search]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleLogin = async (e) => {
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
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <button className="close-btn" onClick={() => navigate("/")}>
          <FaTimes />
        </button>

        <div className="logo-section">
          <h2>Welcome Back</h2>
        </div>

        {error && <div className="alert-box">{error}</div>}

        <form onSubmit={handleLogin} className="login-form" autoComplete="off">
          <div className="input-row">
            <label>Email or Mobile</label>
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

          <div className="input-row">
            <label>Password</label>
            <div className="password-input-wrapper">
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
                {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
              </div>
            </div>
            <div className="forgot-link-box">
               <Link to="/forgot-password">Forgot Password?</Link>
            </div>
          </div>

          <button type="submit" className="btn-gradient" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          
          <div className="auth-switch">
            Don't have an account? <Link to="/register">Sign up</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
