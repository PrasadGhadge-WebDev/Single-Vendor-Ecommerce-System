import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Login.css";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

const submitHandler = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    if (!email || !password) {
      setError("Please enter email and password");
      setLoading(false);
      return;
    }

    const { data } = await API.post("/auth/login", { email, password }, { headers: { "Content-Type": "application/json" } });

    login(data);

    if (data.isAdmin) {
      navigate("/admin/dashboard");
    } else {
      navigate("/");
    }

  } catch (err) {
    const errorMsg = err.response?.data?.message || "Login failed";
    setError(errorMsg);
    console.error("Login error:", errorMsg);
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
        <h2>Welcome Back</h2>
        <p className="sub-text">Sign in to access your dashboard</p>

        {error && <div className="alert">{error}</div>}

        <form onSubmit={submitHandler}>
          <div className="input-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder=" "
            />
            <label>Email</label>
          </div>

          <div className="input-group password-group">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder=" "
            />
            <label>Password</label>
            <span
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button type="submit" className="btn-gradient" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="login-footer">
          <small>© {new Date().getFullYear()} Online Store</small>
        </div>
      </div>
    </div>
  );
};

export default Login;
