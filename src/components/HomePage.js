import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, orderBy, setDoc, doc } from "firebase/firestore";
import { db } from "../FirebaseConfig";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import "./HomePage.css";
import logoImg from "./download.png";

const HomePage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [weather, setWeather] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [newNotification, setNewNotification] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [marketInsights, setMarketInsights] = useState({
    mostSupplied: [],
    demandByArea: [],
    mostDemanded: [],
  });
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(localStorage.getItem("selectedUser") || "");
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  const carouselImages = ["/images/t3.jpg", "/images/g2.jpg", "/images/p1.jpg"];

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleNotifications = () => setShowNotifications(!showNotifications);

  const handleNavigation = (path) => {
    navigate(path);
    setMenuOpen(false);
    setShowNotifications(false);
  };

  // Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersQuery = query(collection(db, "users"));
        const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
          const usersData = snapshot.docs.map(doc => doc.data().username || doc.data().displayName);
          setUsers(usersData.filter(Boolean));
        });
        return unsubscribe;
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  // Fetch notifications for the current user
  useEffect(() => {
    if (!selectedUser) {
      setNotifications([]);
      setNewNotification(false);
      return;
    }
    const q = query(
      collection(db, `users/${selectedUser}/notifications`),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notificationsData);
      if (snapshot.docChanges().some(change => change.type === "added" && !change.doc.data().read)) {
        setNewNotification(true);
        setTimeout(() => setNewNotification(false), 3000);
      }
      console.log("Notifications updated for", selectedUser, ":", notificationsData);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      setError(`Failed to fetch notifications: ${error.message}`);
    });

    return () => unsubscribe();
  }, [selectedUser]);

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      await setDoc(doc(db, `users/${selectedUser}/notifications`, notificationId), {
        read: true
      }, { merge: true });
      console.log(`Notification ${notificationId} marked as read for ${selectedUser}`);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString();
  };

  // Fetch products from Firestore and derive Market Insights
  useEffect(() => {
    console.log("Setting up Firestore listener...");
    const unsubscribe = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const fetchedProducts = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((product) => product && typeof product === "object" && product.name);
        console.log("Fetched Products:", fetchedProducts);
        setProducts(fetchedProducts);

        // Most Supplied Products
        const mostSuppliedCounts = fetchedProducts.reduce((acc, product) => {
          acc[product.name] = (acc[product.name] || 0) + 1;
          return acc;
        }, {});
        const mostSupplied = Object.entries(mostSuppliedCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        console.log("Most Supplied Products:", mostSupplied);

        // Demand by Area
        const demandByAreaCounts = fetchedProducts.reduce((acc, product) => {
          if (product.location) {
            acc[product.location] = (acc[product.location] || 0) + 1;
          }
          return acc;
        }, {});
        const demandByArea = Object.entries(demandByAreaCounts)
          .map(([location, count]) => ({ location, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        console.log("Demand by Area:", demandByArea);

        // Most Demanded Products (Simulating demand with weighted logic)
        // For demonstration, we'll simulate demand by assuming some products are more "demanded"
        // In a real app, this could be based on views, purchases, or user interactions
        const mostDemandedCounts = fetchedProducts.reduce((acc, product) => {
          // Simulate demand: give some products a higher "demand" factor
          const demandFactor = product.name.toLowerCase().includes("maize") ? 3 : product.name.toLowerCase().includes("potatoes") ? 2 : 1;
          acc[product.name] = (acc[product.name] || 0) + demandFactor;
          return acc;
        }, {});
        const mostDemanded = Object.entries(mostDemandedCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        console.log("Most Demanded Products:", mostDemanded);

        setMarketInsights({
          mostSupplied: mostSupplied.length > 0 ? mostSupplied : [{ name: "No data", count: 0 }],
          demandByArea: demandByArea.length > 0 ? demandByArea : [{ location: "No data", count: 0 }],
          mostDemanded: mostDemanded.length > 0 ? mostDemanded : [{ name: "No data", count: 0 }],
        });
      },
      (error) => {
        console.error("Firestore Error:", error.message);
        setError(`Failed to fetch products: ${error.message}`);
      }
    );
    return () => {
      console.log("Cleaning up Firestore listener...");
      unsubscribe();
    };
  }, []);

  // Fetch weather data
  useEffect(() => {
    const API_KEY = "b47e41d230faa192a7747dbed4858ef8";
    const CITY = "Maseru";
    const URL = `https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&units=metric&appid=${API_KEY}`;

    fetch(URL)
      .then((response) => response.json())
      .then((data) => {
        if (data && data.list) {
          setWeather({
            forecast: data.list.slice(0, 7).map((item) => ({
              temp: item.main.temp,
              condition: item.weather[0]?.description || "No condition",
              date: item.dt_txt,
            })),
          });
        }
      })
      .catch((error) => console.error("Error fetching weather data:", error));
  }, []);

  // Product carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) =>
          prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
        );
        setFade(true);
      }, 1000);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Filter products with robust validation
  const filteredProducts = (products || []).filter((product) => {
    if (!product || typeof product !== "object" || !product.name) {
      return false;
    }
    return product.name.toLowerCase().includes((searchQuery || "").toLowerCase());
  });

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleExploreClick = () => {
    const userToken = localStorage.getItem("userToken");
    if (userToken) {
      navigate("/explore");
    } else {
      alert("Please log in to explore products.");
      navigate("/login");
    }
  };

  return (
    <div className="homepage-container">
      <nav className="nav-bar">
        <div className="logo">
          <img src={logoImg} alt="FarmHub Logo" />
          FarmHub
        </div>
        <input
          type="text"
          className="search-bar"
          placeholder="Search products..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <div className="nav-icons">
          <div className={`notification-icon ${newNotification ? 'highlight' : ''}`} onClick={toggleNotifications}>
            🔔
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="notification-badge">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </div>
          <div className="menu-icon" onClick={toggleMenu}>☰</div>
        </div>
      </nav>

      {showNotifications && (
        <motion.div
          className="notification-dropdown"
          initial={{ opacity: 0, transform: "translateY(-10px)" }}
          animate={{ opacity: 1, transform: "translateY(0)" }}
          transition={{ duration: 0.5 }}
        >
          <h4>Notifications</h4>
          {!selectedUser ? (
            <p>
              Please select a user in the <a href="/forum" onClick={() => handleNavigation("/forum")}>Forum</a> to view notifications
            </p>
          ) : notifications.length === 0 ? (
            <p>No notifications</p>
          ) : (
            <ul className="notification-list">
              {notifications.map(notification => (
                <li
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => {
                    if (notification.type === "topic") {
                      navigate(`/forum#topic-${notification.topicId}`);
                    }
                    if (!notification.read) {
                      markNotificationAsRead(notification.id);
                    }
                  }}
                >
                  <span>{notification.text}</span>
                  <span className="timestamp">
                    {formatTimestamp(notification.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      )}

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

      {searchQuery && (
        <div className="search-results">
          {filteredProducts.length > 0 ? (
            <ul>
              {filteredProducts.map((product) => (
                <li key={product.id} onClick={() => handleNavigation(`/product/${product.id}`)}>
                  {product.name} - M{product.price || "N/A"}
                </li>
              ))}
            </ul>
          ) : (
            <p>No products found</p>
          )}
        </div>
      )}

      <div className="product-carousel">
        <img
          src={carouselImages[currentImageIndex]}
          alt={`Product ${currentImageIndex + 1}`}
          className={`product-image ${fade ? "show" : ""}`}
          onLoad={() => setFade(true)}
        />
      </div>

      <div className="market-insights-container">
        <h2>Market Insights</h2>
        {error ? (
          <p className="error-message">{error}</p>
        ) : (
          <div className="insights-grid">
            <div className="insight-section">
              <h3>Most Supplied Products</h3>
              {marketInsights.mostSupplied[0]?.name !== "No data" ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={marketInsights.mostSupplied}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        domain={[0, 'auto']} 
                        allowDecimals={false} 
                        tickCount={Math.max(...marketInsights.mostSupplied.map(item => item.count)) + 1}
                      />
                      <Tooltip />
                      <Bar dataKey="count" fill="#4CAF50" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="no-data">No supply data available</p>
              )}
            </div>
            <div className="insight-section">
              <h3>Hot Locations</h3>
              {marketInsights.demandByArea[0]?.location !== "No data" ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={marketInsights.demandByArea}>
                      <XAxis dataKey="location" tick={{ fontSize: 12 }} />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        domain={[0, 'auto']} 
                        allowDecimals={false} 
                        tickCount={Math.max(...marketInsights.demandByArea.map(item => item.count)) + 1}
                      />
                      <Tooltip />
                      <Bar dataKey="count" fill="#4CAF50" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="no-data">No location data available</p>
              )}
            </div>
            <div className="insight-section">
              <h3>Most Demanded Products</h3>
              {marketInsights.mostDemanded[0]?.name !== "No data" ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={marketInsights.mostDemanded}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        domain={[0, 'auto']} 
                        allowDecimals={false} 
                        tickCount={Math.max(...marketInsights.mostDemanded.map(item => item.count)) + 1}
                      />
                      <Tooltip />
                      <Bar dataKey="count" fill="#4CAF50" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="no-data">No demand data available</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="weather-container">
        <h2>Weather Forecast for the Next Week</h2>
        {weather ? (
          <div>
            {weather.forecast.map((forecast, index) => (
              <div key={index} className="weather-day">
                <p><strong>{forecast.date}</strong></p>
                <p className="temp">{`${forecast.temp}°C`}</p>
                <p className="condition">{forecast.condition}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>Loading weather forecast...</p>
        )}
      </div>

      <button className="cta-button" onClick={handleExploreClick}>
        Explore Products
      </button>

      <div className="auth-section">
        <button className="sign-up-btn" onClick={() => handleNavigation("/register")}>
          Sign Up
        </button>
        <button className="login-btn" onClick={() => handleNavigation("/login")}>
          Login
        </button>
      </div>

      <div className="forum-link" onClick={() => handleNavigation("/forum")}>💬</div>

      <div className="footer">
        <p>© 2025 FarmHub. All Rights Reserved.</p>
        <p>
          <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a>
        </p>
      </div>
    </div>
  );
};

export default HomePage;