import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoImg from "./download.png"; // Assuming this is in the same directory

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState("+266"); // Default to Lesotho
  const [isLoading, setIsLoading] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

    const toggleMenu = () => setMenuOpen(!menuOpen);

    const handleNavigation = (path) => {
        navigate(path);
        setMenuOpen(false);
    };

  const validateForm = () => {
    if (!username || !email || !phone || !password) {
      alert("All fields are required!");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Please enter a valid email address.");
      return false;
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return false;
    }
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const fullPhone = countryCode + phone;

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, phone: fullPhone, password }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Registration Successful!");
        navigate("/login") //redirect to login
      } else {
        alert(`Registration failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Error during registration:", error);
      alert("An error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: 'column', // Stack items vertically
        alignItems: "center",
        background: "linear-gradient(145deg, #1e3c72, #2a5298)",
        padding: "20px",
        overflow: "hidden",
      }}
    >
      <nav className="nav-bar" style={{position: 'static', marginBottom: '20px'}}>
                <div className="logo" onClick={() => navigate("/")}>
                    <img src={logoImg} alt="FarmHub Logo" />
                    FarmHub
                </div>
                <div className="menu-icon" onClick={toggleMenu}>☰</div>
            </nav>

            {menuOpen && (
                <div className="menu-dropdown">
                    <ul>
                        <li onClick={() => handleNavigation("/")}>🏠 Home</li>
                        <li onClick={() => handleNavigation("/marketUpdate")}>📊 Market Updates</li>
                        <li onClick={() => handleNavigation("/announcements")}>🔔 Notifications</li>
                        <li onClick={() => handleNavigation("/settings")}>⚙️ Settings</li>
                        <li onClick={() => handleNavigation("/logout")}>🚪 Logout</li>
                    </ul>
                </div>
            )}
      <div
        style={{
          background: "linear-gradient(135deg, #e0e7ff, #c3dafe)",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
          width: "100%",
          maxWidth: "420px",
          transform: "translateY(0)",
          transition: "transform 0.4s ease, box-shadow 0.3s ease",
          ":hover": {
            transform: "translateY(-5px)",
            boxShadow: "0 15px 40px rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "30px",
            fontFamily: "'Poppins', sans-serif",
            fontSize: "28px",
            fontWeight: "600",
            color: "#1e3c72",
            letterSpacing: "0.5px",
          }}
        >
          Sign Up
        </h2>
        <form
          onSubmit={handleRegister}
          style={{ display: "flex", flexDirection: "column", gap: "22px" }}
        >
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            style={{
              padding: "14px 16px",
              borderRadius: "10px",
              border: "1px solid #e0e6ed",
              background: "#f8fafc",
              fontSize: "16px",
              fontFamily: "'Roboto', sans-serif",
              color: "#2a5298",
              outline: "none",
              transition: "border-color 0.3s ease, box-shadow 0.3s ease",
              ":focus": {
                borderColor: "#2a5298",
                boxShadow: "0 0 8px rgba(42, 82, 152, 0.3)",
              },
            }}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{
              padding: "14px 16px",
              borderRadius: "10px",
              border: "1px solid #e0e6ed",
              background: "#f8fafc",
              fontSize: "16px",
              fontFamily: "'Roboto', sans-serif",
              color: "#2a5298",
              outline: "none",
              transition: "border-color 0.3s ease, box-shadow 0.3s ease",
              ":focus": {
                borderColor: "#2a5298",
                boxShadow: "0 0 8px rgba(42, 82, 152, 0.3)",
              },
            }}
          />
          <div style={{ display: "flex", gap: "12px" }}>
            <select
              onChange={(e) => setCountryCode(e.target.value)}
              value={countryCode}
              style={{
                padding: "14px 12px",
                borderRadius: "10px",
                border: "1px solid #e0e6ed",
                background: "#f8fafc",
                fontSize: "16px",
                fontFamily: "'Roboto', sans-serif",
                color: "#2a5298",
                flex: "1",
                outline: "none",
                cursor: "pointer",
                transition: "border-color 0.3s ease",
                ":focus": { borderColor: "#2a5298" },
              }}
            >
              <option value="+266">Lesotho (+266)</option>
              <option value="+1">USA (+1)</option>
              <option value="+44">UK (+44)</option>
            </select>
            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
              style={{
                padding: "14px 16px",
                borderRadius: "10px",
                border: "1px solid #e0e6ed",
                background: "#f8fafc",
                fontSize: "16px",
                fontFamily: "'Roboto', sans-serif",
                color: "#2a5298",
                flex: "2",
                outline: "none",
                transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                ":focus": {
                  borderColor: "#2a5298",
                  boxShadow: "0 0 8px rgba(42, 82, 152, 0.3)",
                },
              }}
            />
          </div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            style={{
              padding: "14px 16px",
              borderRadius: "10px",
              border: "1px solid #e0e6ed",
              background: "#f8fafc",
              fontSize: "16px",
              fontFamily: "'Roboto', sans-serif",
              color: "#2a5298",
              outline: "none",
              transition: "border-color 0.3s ease, box-shadow 0.3s ease",
              ":focus": {
                borderColor: "#2a5298",
                boxShadow: "0 0 8px rgba(42, 82, 152, 0.3)",
              },
            }}
          />
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: "14px",
              borderRadius: "10px",
              border: "none",
              background: isLoading
                ? "#a3bffa"
                : "linear-gradient(90deg, #2a5298, #1e3c72)",
              color: "white",
              fontSize: "16px",
              fontFamily: "'Poppins', sans-serif",
              fontWeight: "500",
              textTransform: "uppercase",
              letterSpacing: "1px",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease",
              ":hover": !isLoading && {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 20px rgba(30, 60, 114, 0.4)",
              },
            }}
          >
            {isLoading ? (
              <span>
                Registering{" "}
                <span style={{ display: "inline-block", animation: "spin 1s infinite linear" }}>
                  ⏳
                </span>
              </span>
            ) : (
              "Sign Up Now"
            )}
          </button>
        </form>
        <style>
          {`
            @keyframes spin {
              100% { transform: rotate(360deg); }
            }
                        .nav-bar {
                background-color: #1e3c72;
                color: white;
                padding: 10px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                width: 100%;
                position: relative;
            }

            .nav-bar .logo {
                display: flex;
                align-items: center;
                gap: 10px;
                cursor: pointer;
            }

            .nav-bar .logo img {
                height: 40px;
            }

            .nav-bar .menu-icon {
                font-size: 24px;
                cursor: pointer;
                display: none;
            }


            .menu-dropdown {
                background-color: #1e3c72;
                color: white;
                position: absolute;
                top: 60px;
                right: 10px;
                width: 150px;
                border: 1px solid #2a5298;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                z-index: 10;
            }

            .menu-dropdown ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .menu-dropdown li {
                padding: 10px;
                cursor: pointer;
                border-bottom: 1px solid #2a5298;
            }

            .menu-dropdown li:last-child {
                border-bottom: none;
            }

            .menu-dropdown li:hover {
                background-color: #2a5298;
            }

            @media (max-width: 768px) {
                .nav-bar .menu-icon {
                    display: block;
                }

                .nav-bar .logo h1 {
                    font-size: 20px;
                }

                .menu-dropdown {
                    top: 50px;
                    right: 10px;
                    width: 100%;
                }
            }

            @media (max-width: 480px) {
                .nav-bar {
                    flex-direction: column;
                    text-align: center;
                }

                .nav-bar .logo {
                    margin-bottom: 10px;
                }
           }
          `}
        </style>
      </div>
    </div>
  );
};

export default Register;
