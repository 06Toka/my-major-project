import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/explore");
    } catch (error) {
      alert(`Login failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="contain">
      <div className="insert"></div>
      <div className="container">
        <form onSubmit={handleLogin} className="login-form">
          <h2 className="text1">Welcome Back</h2>
          {/* Email Input */}
          <div className="input-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
            />
            <span className="input-icon">✉️</span>
            <label className="input-label">Email</label>
          </div>

          {/* Password Input */}
          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
            />
            <span className="input-icon">🔒</span>
            <label className="input-label">Password</label>
          </div>

          {/* Links */}
          <div className="links">
            <a href="/forgot-password" className="link">
              Forgot Password?
            </a>
            <a href="/register" className="link">
              Create Account
            </a>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={isLoading} className="login-btn">
            <span>{isLoading ? "Logging in..." : "Login"}</span>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="spinner"></div>
              </div>
            )}
          </button>
        </form>

        {/* Decorative Elements */}
        <div className="decorative-circle-top"></div>
        <div className="decorative-circle-bottom"></div>
      </div>
    </div>
  );
};

export default Login;

