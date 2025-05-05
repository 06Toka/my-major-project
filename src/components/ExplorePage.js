import React, { useState, useEffect, useRef } from "react";
import { 
  collection, onSnapshot, addDoc, query, where, orderBy, deleteDoc, doc, updateDoc, getDoc 
} from "firebase/firestore";
import { db, auth } from "../FirebaseConfig";
import { useNavigate } from "react-router-dom";
import logo from "./download.png";
import "./ExplorePage.css";
import OSMapComponent from './OSMapComponent';
import { onAuthStateChanged } from "firebase/auth";
import { motion } from 'framer-motion';
import { FaCheck, FaComment } from 'react-icons/fa';
import { 
  FaSearch, FaHeart, FaRegHeart, 
  FaPlus, FaMinus, FaShoppingCart,
  FaMapMarkerAlt, FaArrowLeft, FaTruck,
  FaMotorcycle, FaStore, FaShippingFast
} from "react-icons/fa";

const ExplorePage = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeStep, setWelcomeStep] = useState(0);
  const welcomeMessages = [
    "🌟 Welcome to FarmHub!",
    "🚜 Discover fresh farm products",
    "📍 Find products near you",
    "🛒 Start exploring now!"
  ];
  const [products, setProducts] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [cart, setCart] = useState([]);
  const [showMiniCart, setShowMiniCart] = useState(false);
  const [proceedToCheckout, setProceedToCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingNeeds, setLoadingNeeds] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "", description: "", price: "", location: "", coordinates: null,
    category: "", mobileMoneyNumber: "", mobileMoneyProvider: "Mpesa"
  });
  const [newNeed, setNewNeed] = useState({
    productName: "", description: "", budget: "", location: "", coordinates: null, quantity: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [expandedNeed, setExpandedNeed] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);
  const [showAuthLinks, setShowAuthLinks] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showNeedForm, setShowNeedForm] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapLocation, setMapLocation] = useState(null);
  const [viewingLocation, setViewingLocation] = useState(null);
  const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDetails, setDeliveryDetails] = useState({
    address: '', contactNumber: '', instructions: ''
  });
  const [showChatModal, setShowChatModal] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  // New notification state and functions
  const [notifications, setNotifications] = useState([]);
  
  const addNotification = (notification) => {
    setNotifications((prev) => [
      ...prev,
      { ...notification, id: Date.now() }, // Unique ID for React key
    ]);
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== Date.now()));
    }, 5000);
  };
  
  const NotificationToast = ({ notification, onClose }) => (
    <div className="notification-toast">
      {notification.type === "product_upload" && notification.filename && (
        <img src={`http://localhost:5000/uploads/${notification.filename}`} alt={notification.message} />
      )}
      <div className="content">
        <strong>{notification.message}</strong>
        <p>
          {notification.type === "product_upload"
            ? `Located in ${notification.location || "Unknown"}. Price: M${notification.price || "N/A"}`
            : `Located in ${notification.location || "Unknown"}. Budget: M${notification.budget || "N/A"}`}
        </p>
      </div>
      <button className="close-btn" onClick={onClose}>
        ✕
      </button>
    </div>
  );

  const navigate = useNavigate();

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5000");
  
    ws.onopen = () => {
      console.log("Connected to WebSocket server");
    };
  
    ws.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        console.log("Received notification:", notification);
        if (notification.type === "product_upload" || notification.type === "need_added") {
          addNotification(notification);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
  
    ws.onclose = () => {
      console.log("Disconnected from WebSocket server");
    };
  
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  
    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    const savedCart = localStorage.getItem('farmhubCart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  useEffect(() => {
    if (cart.length > 0) localStorage.setItem('farmhubCart', JSON.stringify(cart));
    else localStorage.removeItem('farmhubCart');
  }, [cart]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => console.error("Geolocation error:", error)
      );
    }
  }, []);

  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => setShowWelcome(false), 5000);
      const interval = setInterval(() => setWelcomeStep(prev => (prev < 3 ? prev + 1 : prev)), 1000);
      return () => { clearTimeout(timer); clearInterval(interval); };
    }
  }, [showWelcome]);

  useEffect(() => {
    const productsUnsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const validProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        price: parseFloat(doc.data().price) || 0,
      }));
      console.log("Fetched products:", validProducts); // Debug log to inspect filename
      setProducts(validProducts);
      setLoadingProducts(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      setLoadingProducts(false);
    });
  
    const needsUnsubscribe = onSnapshot(collection(db, "needs"), (snapshot) => {
      const validNeeds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), budget: parseFloat(doc.data().budget) || 0 }));
      setNeeds(validNeeds);
      setLoadingNeeds(false);
    }, (error) => { console.error("Error fetching needs:", error); setLoadingNeeds(false); });
  
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
  
    if (user) {
      const chatsQuery = query(
        collection(db, "chats"), 
        where("participants", "array-contains", user.uid)
      );
      const chatsUnsubscribe = onSnapshot(chatsQuery, (snapshot) => {
        const chatData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(chat => chat.participants.length === 2);
        setChats(chatData);
      }, (error) => console.error("Error fetching chats:", error));
      return () => chatsUnsubscribe();
    }
  
    return () => { productsUnsubscribe(); needsUnsubscribe(); unsubscribe(); };
  }, [user]);

  useEffect(() => {
    if (activeChat) {
      const messagesQuery = query(collection(db, "chats", activeChat.id, "messages"), orderBy("timestamp"));
      const messagesUnsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messageData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(messageData);
      }, (error) => console.error("Error fetching messages:", error));
      return () => messagesUnsubscribe();
    }
  }, [activeChat]);

  const deliveryOptions = [
    { id: 'pickup', title: 'Pick Up', icon: <FaStore />, description: 'Collect your order from the seller', price: 0, estimatedTime: 'Flexible', features: ['No delivery fee', 'Coordinate pickup time'] },
    { id: 'local', title: 'Local Delivery', icon: <FaMotorcycle />, description: 'Same town/city delivery', price: 20, estimatedTime: '1-3 hours', features: ['Fast delivery', 'Track your order'] },
    { id: 'long-distance', title: 'Long Distance', icon: <FaTruck />, description: 'Delivery to another town/city', price: 50, estimatedTime: '1-3 days', features: ['Secure packaging', 'Nationwide coverage'] },
    { id: 'express', title: 'Express Delivery', icon: <FaShippingFast />, description: 'Priority next-day delivery', price: 80, estimatedTime: '24 hours', features: ['Guaranteed delivery', 'Priority handling'] }
  ];

  const handleDeliverySelect = (optionId) => {
    setDeliveryOption(optionId);
  };

  const handleDeliveryConfirm = (delivery) => {
    setDeliveryOption(delivery.option);
    setDeliveryFee(delivery.fee);
    setShowDeliveryOptions(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeliveryDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (location) => {
    if (showProductForm) {
      setNewProduct({ ...newProduct, location: location.address, coordinates: { lat: location.lat, lng: location.lng } });
    } else if (showNeedForm) {
      setNewNeed({ ...newNeed, location: location.address, coordinates: { lat: location.lat, lng: location.lng } });
    }
    setShowMapModal(false);
  };

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prevCart, { 
        ...product, 
        quantity: 1, 
        addedAt: new Date().toISOString() 
      }];
    });
    setShowMiniCart(true);
    alert(`${product.name} added to cart!`);
  };
  
  const removeFromCart = (productId, removeAll = false) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === productId);
      if (!existingItem) return prevCart;
      
      if (removeAll) {
        alert(`${existingItem.name} removed from cart`);
        return prevCart.filter(item => item.id !== productId);
      }
      
      if (existingItem.quantity > 1) {
        return prevCart.map(item => 
          item.id === productId 
            ? { ...item, quantity: item.quantity - 1 } 
            : item
        );
      }
      
      alert(`${existingItem.name} removed from cart`);
      return prevCart.filter(item => item.id !== productId);
    });
  };
  
  const startChat = async (otherUserId, context = {}) => {
    if (!user) {
      setShowAuthLinks(true);
      return;
    }
  
    try {
      const participants = [user.uid, otherUserId].sort();
      const existingChat = chats.find(chat => 
        chat.participants.length === 2 && 
        chat.participants[0] === participants[0] && 
        chat.participants[1] === participants[1]
      );
  
      if (existingChat) {
        setActiveChat(existingChat);
      } else {
        const newChat = {
          participants: participants,
          createdAt: new Date(),
          context: context
        };
        const chatRef = await addDoc(collection(db, "chats"), newChat);
        setActiveChat({ id: chatRef.id, ...newChat });
      }
      setShowChatModal(true);
    } catch (error) {
      console.error("Error starting chat:", error);
      alert("Failed to start chat. Please try again.");
    }
  };
  
  const handleOrderConfirmation = async () => {
    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }
    
    if (!deliveryOption) {
      alert('Please select a delivery method');
      return;
    }
    
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }
  
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalWithDelivery = total + deliveryFee;
    
    try {
      if (paymentMethod === 'mobile') {
        const confirmMessage = `Confirm payment of M${totalWithDelivery.toFixed(2)} via ${cart[0].mobileMoneyProvider} to ${cart[0].mobileMoneyNumber}?`;
        if (window.confirm(confirmMessage)) {
          alert(`Payment instruction sent!\n\nSend M${totalWithDelivery.toFixed(2)} to ${cart[0].mobileMoneyNumber} via ${cart[0].mobileMoneyProvider}\nYou can now chat with the seller!`);
          await startChat(cart[0].userId, { 
            orderItems: cart, 
            total: totalWithDelivery, 
            deliveryOption 
          });
          resetCartAndCheckout();
        }
      } else {
        const confirmCheckout = window.confirm(`Confirm order for M${totalWithDelivery.toFixed(2)} (Cash on Delivery)?`);
        if (confirmCheckout) {
          alert(`Order confirmed!\n\nYou will pay M${totalWithDelivery.toFixed(2)} on delivery\nYou can now chat with the seller!`);
          await startChat(cart[0].userId, { 
            orderItems: cart, 
            total: totalWithDelivery, 
            deliveryOption 
          });
          resetCartAndCheckout();
        }
      }
    } catch (error) {
      console.error("Order confirmation error:", error);
      alert("There was an error processing your order. Please try again.");
    }
  };
  
  const resetCartAndCheckout = () => {
    setCart([]);
    setShowMiniCart(false);
    setProceedToCheckout(false);
    setPaymentMethod('');
    setDeliveryOption('');
    setDeliveryFee(0);
  };
  
  const formatCurrency = (amount) => {
    return `M${amount.toFixed(2)}`;
  };
  
  const toggleProductExpand = (productId) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };
  
  const toggleNeedExpand = (needId) => {
    setExpandedNeed(expandedNeed === needId ? null : needId);
  };
  
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * 
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024;
  
    if (!validImageTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF)');
      return;
    }
  
    if (file.size > maxSize) {
      alert('Image size should be less than 5MB');
      return;
    }
  
    setMediaFile(file);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!user) return setShowAuthLinks(true);
    if (!newProduct.coordinates) return alert("Please select a location from the map");
    if (!newProduct.mobileMoneyNumber || !newProduct.mobileMoneyProvider) return alert("Please provide mobile money payment details");
    if (!mediaFile) return alert("Please select an image file");
  
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('mediaFile', mediaFile);
      formData.append('name', newProduct.name);
      formData.append('description', newProduct.description);
      formData.append('price', newProduct.price);
      formData.append('location', newProduct.location);
      formData.append('category', newProduct.category);
      formData.append('whatsapp', newProduct.mobileMoneyNumber); // Map to backend field
      formData.append('userId', user.uid);
  
      console.log('Sending request to /api/upload-product with file:', mediaFile);
  
      const response = await fetch('http://localhost:5000/api/upload-product', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to upload product (Status: ${response.status})`);
      }
  
      const result = await response.json();
      console.log('Upload successful:', result);
  
      setNewProduct({
        name: "",
        description: "",
        price: "",
        location: "",
        coordinates: null,
        category: "",
        mobileMoneyNumber: "",
        mobileMoneyProvider: "Mpesa",
      });
      setMediaFile(null);
      setShowProductForm(false);
    } catch (error) {
      console.error("Error adding product:", error);
      alert(`Failed to add product: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleNeedSubmit = async (e) => {
    e.preventDefault();
    if (!user) return setShowAuthLinks(true);
    if (!newNeed.coordinates) return alert("Please select a location from the map");

    try {
      await addDoc(collection(db, "needs"), {
        ...newNeed,
        budget: parseFloat(newNeed.budget) || 0,
        quantity: parseInt(newNeed.quantity) || 0,
        createdAt: new Date(),
        userId: user?.uid,
      });
      setNewNeed({ productName: "", description: "", budget: "", location: "", coordinates: null, quantity: "" });
      setShowNeedForm(false);
    } catch (error) {
      console.error("Error adding need:", error);
      alert("Failed to add need. Please try again.");
    }
  };

  const showLocationOnMap = (coordinates) => {
    setViewingLocation(coordinates);
    setShowMapModal(true);
  };

  const filteredProducts = products
    .filter(product => product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || product?.description?.toLowerCase().includes(searchTerm.toLowerCase()) || product?.category?.toLowerCase().includes(searchTerm.toLowerCase()))
    .map(product => {
      let distance = null;
      if (userLocation && product.coordinates) distance = calculateDistance(userLocation.lat, userLocation.lng, product.coordinates.lat, product.coordinates.lng);
      return { ...product, distance };
    })
    .sort((a, b) => (a.distance !== null && b.distance !== null) ? a.distance - b.distance : new Date(b.createdAt) - new Date(a.createdAt));

  const filteredNeeds = needs
    .filter(need => need?.productName?.toLowerCase().includes(searchTerm.toLowerCase()) || need?.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    .map(need => {
      let distance = null;
      if (userLocation && need.coordinates) distance = calculateDistance(userLocation.lat, userLocation.lng, need.coordinates.lat, need.coordinates.lng);
      return { ...need, distance };
    })
    .sort((a, b) => (a.distance !== null && b.distance !== null) ? a.distance - b.distance : new Date(b.createdAt) - new Date(a.createdAt));

    const MiniCart = () => {
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
      return (
        <div className={`mini-cart-container ${showMiniCart ? 'expanded' : ''}`}>
          <div className="mini-cart-header" onClick={() => setShowMiniCart(!showMiniCart)}>
            <FaShoppingCart className="cart-icon" />
            <span className="item-count">{totalItems} items</span>
            <span className="total-price">M{totalPrice.toFixed(2)}</span>
            <span className="toggle-icon">{showMiniCart ? '▲' : '▼'}</span>
          </div>
          {showMiniCart && (
            <div className="mini-cart-content">
              {cart.length === 0 ? (
                <p className="empty-cart-message">Your cart is empty</p>
              ) : (
                <>
                  <div className="cart-items-list">
                    {cart.map(item => (
                      <div key={`${item.id}-${item.addedAt}`} className="cart-item">
                        <div className="item-image">
                          {item.filename ? (
                            <img
                              src={`http://localhost:5000/uploads/${item.filename}`}
                              alt={item.name}
                              onError={(e) => {
                                console.warn(`Failed to load cart image for item ${item.id}: ${item.filename}`);
                                e.target.src = "/fallback-image.png";
                              }}
                            />
                          ) : (
                            <div className="no-image">No Image</div>
                          )}
                        </div>
                        <div className="item-details">
                          <h4>{item.name}</h4>
                          <div className="price-quantity">
                            <span>M{item.price.toFixed(2)} × {item.quantity}</span>
                            <span>M{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                          <div className="item-actions">
                            <button onClick={() => removeFromCart(item.id)}>
                              <FaMinus size={12} />
                            </button>
                            <button onClick={() => addToCart(item)}>
                              <FaPlus size={12} />
                            </button>
                            <button className="remove-btn" onClick={() => removeFromCart(item.id, true)}>
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="cart-summary">
                    <div className="summary-row">
                      <span>Subtotal:</span>
                      <span>M{totalPrice.toFixed(2)}</span>
                    </div>
                    <button
                      className="checkout-btn"
                      onClick={() => setProceedToCheckout(true)}
                      disabled={cart.length === 0}
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      );
    };
  const DeliveryOptionsModal = () => {
    const selectedOptionData = deliveryOptions.find(opt => opt.id === deliveryOption);

    return (
      <motion.div className="delivery-options-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="modal-header">
          <motion.button className="back-button" onClick={() => setShowDeliveryOptions(false)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><FaArrowLeft /> Back to Checkout</motion.button>
          <h2>Choose Your Delivery</h2>
          <p className="subtitle">Select the best delivery option for your order</p>
        </div>
        <div className="delivery-methods-container">
          {deliveryOptions.map(option => (
            <motion.div key={option.id} className={`delivery-method-card ${deliveryOption === option.id ? 'selected' : ''}`} onClick={() => handleDeliverySelect(option.id)}
              whileHover={{ y: -5 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ borderLeft: `5px solid ${option.color || '#4CAF50'}` }}>
              <div className="method-icon" style={{ color: option.color || '#4CAF50' }}>{option.icon}</div>
              <div className="method-info"><h4>{option.title}</h4><p className="description">{option.description}</p>
                <div className="method-features">{option.features.map((feature, i) => <span key={i} className="feature-tag" style={{ backgroundColor: `${option.color || '#4CAF50'}20` }}>{feature}</span>)}</div>
              </div>
              <div className="method-price" style={{ color: option.color || '#4CAF50' }}>{option.price > 0 ? `M${option.price.toFixed(2)}` : 'FREE'}</div>
              {deliveryOption === option.id && <div className="selected-check" style={{ backgroundColor: option.color || '#4CAF50' }}><FaCheck color="white" size={14} /></div>}
            </motion.div>
          ))}
        </div>
        {deliveryOption && (
          <motion.div className="delivery-details-section" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3 }}>
            <div className="selected-method-summary" style={{ borderColor: selectedOptionData.color || '#4CAF50' }}>
              <h3 style={{ color: selectedOptionData.color || '#4CAF50' }}>{selectedOptionData.title} Details</h3>
              <div className="summary-row"><span>Delivery Fee:</span><span className="price">{selectedOptionData.price > 0 ? `M${selectedOptionData.price.toFixed(2)}` : 'Free'}</span></div>
              <div className="summary-row"><span>Estimated Delivery:</span><span>{selectedOptionData.estimatedTime}</span></div>
            </div>
            {deliveryOption !== 'pickup' && (
              <motion.div className="delivery-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <div className="form-group"><label>Delivery Address</label><textarea name="address" value={deliveryDetails.address} onChange={handleInputChange} placeholder="Enter full delivery address" required /></div>
                <div className="form-group"><label>Contact Number</label><input type="tel" name="contactNumber" value={deliveryDetails.contactNumber} onChange={handleInputChange} placeholder="Your phone number" required /></div>
                <div className="form-group"><label>Special Instructions (Optional)</label><textarea name="instructions" value={deliveryDetails.instructions} onChange={handleInputChange} placeholder="Any special delivery instructions?" /></div>
              </motion.div>
            )}
            <motion.button className="confirm-delivery-btn" onClick={() => handleDeliveryConfirm({ option: deliveryOption, fee: selectedOptionData.price })}
              disabled={deliveryOption !== 'pickup' && !deliveryDetails.address} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ backgroundColor: selectedOptionData.color || '#4CAF50' }}>
              Confirm Delivery Method
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    );
  };

  const ChatModal = () => {
    const otherUserId = activeChat ? activeChat.participants.find(id => id !== user?.uid) : null;
    const inputRef = useRef(null);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [userNames, setUserNames] = useState({});
    const [error, setError] = useState(null);

    useEffect(() => {
      if (!user || !user.uid) return;

      const fetchUserNames = async () => {
        try {
          const newUserNames = {};
          for (const chat of chats) {
            const otherId = chat.participants.find(id => id !== user.uid);
            if (otherId && !newUserNames[otherId]) {
              const userDoc = await getDoc(doc(db, "users", otherId));
              newUserNames[otherId] = userDoc.exists() 
                ? userDoc.data().displayName || `User ${otherId}`
                : `User ${otherId}`;
            }
          }
          setUserNames(newUserNames);
          setError(null);
        } catch (err) {
          console.error("Error fetching user names:", err);
          setError("Failed to load user names");
        }
      };

      fetchUserNames();
    }, [chats, user]);

    useEffect(() => {
      if (showChatModal && inputRef.current) {
        inputRef.current.focus();
      }
    }, [showChatModal, activeChat]);

    useEffect(() => {
      const unsubscribeListeners = chats.map(chat => {
        const messagesQuery = query(collection(db, "chats", chat.id, "messages"), orderBy("timestamp"));
        return onSnapshot(messagesQuery, (snapshot) => {
          const messageData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const unread = messageData.filter(msg => msg.senderId !== user?.uid && !msg.read && (!activeChat || activeChat.id !== chat.id)).length;
          setUnreadCounts(prev => ({ ...prev, [chat.id]: unread }));
        }, (error) => console.error("Error fetching messages:", error));
      });
      return () => unsubscribeListeners.forEach(unsub => unsub());
    }, [chats, activeChat, user]);

    const handleInputChange = (e) => {
      setChatMessage(e.target.value);
    };

    const sendMessage = async (e) => {
      e.preventDefault();
      if (!chatMessage.trim() || !activeChat || !user?.uid) return;

      try {
        await addDoc(collection(db, "chats", activeChat.id, "messages"), {
          text: chatMessage,
          senderId: user.uid,
          timestamp: new Date(),
          read: false,
        });
        setChatMessage("");
        if (inputRef.current) {
          inputRef.current.focus();
        }
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message.");
      }
    };

    const deleteMessage = async (messageId) => {
      if (!window.confirm("Are you sure you want to delete this message?")) return;
      try {
        await deleteDoc(doc(db, "chats", activeChat.id, "messages", messageId));
        setMessages(messages.filter(msg => msg.id !== messageId));
      } catch (error) {
        console.error("Error deleting message:", error);
        alert("Failed to delete message.");
      }
    };

    const markMessagesAsRead = async () => {
      if (!activeChat || !user?.uid) return;
      const unreadMessages = messages.filter(msg => msg.senderId !== user.uid && !msg.read);
      for (const msg of unreadMessages) {
        await updateDoc(doc(db, "chats", activeChat.id, "messages", msg.id), { read: true });
      }
    };

    useEffect(() => {
      if (activeChat) markMessagesAsRead();
    }, [activeChat, messages]);

    return (
      <div className="chat-modal-overlay">
        <div className="chat-modal">
          <div className="chat-sidebar">
            <h3>Private Chats</h3>
            {error && <p className="error-message">{error}</p>}
            {chats.length > 0 ? (
              <div className="chat-list">
                {chats.map(chat => {
                  const chatOtherUserId = chat.participants.find(id => id !== user?.uid);
                  const unreadCount = unreadCounts[chat.id] || 0;
                  return (
                    <div
                      key={chat.id}
                      className={`chat-item ${activeChat?.id === chat.id ? 'active' : ''}`}
                      onClick={() => setActiveChat(chat)}
                    >
                      <span>Chat with {userNames[chatOtherUserId] || 'Loading...'}</span>
                      {chat.context?.orderItems && <small>Order Chat</small>}
                      {chat.context?.needId && <small>Need Chat</small>}
                      {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No active private chats</p>
            )}
          </div>
          <div className="chat-content">
            {activeChat ? (
              <>
                <div className="chat-header">
                  <h4>Chat with {userNames[otherUserId] || 'Loading...'}</h4>
                  <button onClick={() => setShowChatModal(false)}>×</button>
                </div>
                <div className="messages-container">
                  {messages.length > 0 ? (
                    messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`message ${msg.senderId === user?.uid ? 'sent' : 'received'}`}
                      >
                        <p>{msg.text}</p>
                        <small>{msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString() : 'Sending...'}</small>
                        {msg.senderId === user?.uid && (
                          <button
                            className="delete-message-btn"
                            onClick={() => deleteMessage(msg.id)}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p>No messages yet. Start the conversation!</p>
                  )}
                </div>
                <form onSubmit={sendMessage} className="message-form">
                  <input
                    ref={inputRef}
                    type="text"
                    value={chatMessage}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    autoComplete="off"
                    autoFocus
                  />
                  <button type="submit" disabled={!user}>Send</button>
                </form>
              </>
            ) : (
              <div className="no-chat-selected">
                <p>Select a chat to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const CheckoutModal = () => {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const selectedOptionData = deliveryOptions.find(opt => opt.id === deliveryOption);

    if (showDeliveryOptions) return (
      <div className="checkout-modal-overlay"><div className="checkout-modal"><DeliveryOptionsModal /></div></div>
    );

    return (
      <div className="checkout-modal-overlay">
        <div className="checkout-modal">
          <div className="checkout-header">
            <button className="back-button" onClick={() => setProceedToCheckout(false)}><FaArrowLeft /></button>
            <h3>Checkout</h3>
            <button className="chat-btn" onClick={() => startChat(cart[0]?.userId, { orderItems: cart })}><FaComment /> Chat with Seller</button>
          </div>
          <div className="checkout-items">
            {cart.map(item => (
              <div key={`${item.id}-${item.addedAt}`} className="checkout-item">
                <div className="item-info"><h4>{item.name}</h4><p>{item.quantity} × M{item.price.toFixed(2)}</p></div>
                <p className="item-total">M{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="payment-methods">
            <h4>Payment Method</h4>
            <div className="payment-options">
              <label className={`payment-option ${paymentMethod === 'mobile' ? 'selected' : ''}`}>
                <input type="radio" name="payment" value="mobile" checked={paymentMethod === 'mobile'} onChange={() => setPaymentMethod('mobile')} />
                <div className="payment-details"><span>Mobile Money ({cart[0]?.mobileMoneyProvider || 'Mpesa'})</span><small>Pay to: {cart[0]?.mobileMoneyNumber || 'Not specified'}</small></div>
              </label>
              <label className={`payment-option ${paymentMethod === 'cash' ? 'selected' : ''}`}>
                <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} />
                <div className="payment-details"><span>Cash on Delivery</span><small>Pay when you receive</small></div>
              </label>
            </div>
          </div>
          <div className="delivery-section">
            <h4>Delivery Method</h4>
            {deliveryOption ? (
              <div className="selected-delivery">
                <div className="delivery-info"><h5>{selectedOptionData?.title}</h5><p>{selectedOptionData?.description}</p>
                  <div className="delivery-meta"><span>Fee: {selectedOptionData?.price > 0 ? `M${selectedOptionData.price.toFixed(2)}` : 'Free'}</span><span>Est: {selectedOptionData?.estimatedTime}</span></div>
                </div>
                <button className="change-delivery-btn" onClick={() => setShowDeliveryOptions(true)}>Change</button>
              </div>
            ) : (
              <button className="select-delivery-btn" onClick={() => setShowDeliveryOptions(true)}>Select Delivery Method</button>
            )}
          </div>
          <div className="checkout-total">
            <div className="total-row"><span>Subtotal:</span><span>M{total.toFixed(2)}</span></div>
            <div className="total-row"><span>Delivery:</span><span>{deliveryFee > 0 ? `M${deliveryFee.toFixed(2)}` : 'Free'}</span></div>
            <div className="total-row grand-total"><span>Total:</span><span>M{(total + deliveryFee).toFixed(2)}</span></div>
          </div>
          <button className="confirm-order-btn" onClick={handleOrderConfirmation} disabled={!paymentMethod || !deliveryOption}>Confirm Order (M{(total + deliveryFee).toFixed(2)})</button>
        </div>
      </div>
    );
  };

  return (
    <div className="explore-container">
      {/* New notification rendering */}
      <div className="notifications-container">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={() => setNotifications((prev) => prev.filter((n) => n.id !== notification.id))}
          />
        ))}
      </div>
      {showWelcome && (
        <div className="welcome-overlay">
          <div className="welcome-content">
            <div className="welcome-logo"><img src={logo} alt="FarmHub Logo" /><h1>{welcomeMessages[welcomeStep]}</h1></div>
            <div className="welcome-progress">{[0, 1, 2, 3].map(step => <div key={step} className={`progress-dot ${welcomeStep >= step ? 'active' : ''}`} />)}</div>
          </div>
        </div>
      )}
      <nav className="nav-bar">
        <div className="logo" onClick={() => navigate("/")}><img src={logo} alt="FarmHub Logo" />FarmHub</div>
        <div className="search-container"><FaSearch className="search-icon" />
          <input type="text" placeholder="Search products or needs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-bar" />
        </div>
        <div className="nav-actions">
          <div className="cart-icon-container" onClick={() => setShowMiniCart(!showMiniCart)}><FaShoppingCart />
            {cart.length > 0 && <span className="cart-badge">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>}
          </div>
          <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>☰</div>
        </div>
      </nav>

      <div className="split-sections-container">
        <section className="left-section">
          <div className="section-header"><h2>Available Products</h2>
            <button className="toggle-form-btn" onClick={() => setShowProductForm(!showProductForm)} disabled={uploading}>
              {showProductForm ? <FaMinus /> : <FaPlus />} {showProductForm ? "Hide Form" : "Add Product"}
            </button>
          </div>
          {showProductForm && (
            <div className="form-container">
              <form onSubmit={handleProductSubmit}>
                <div className="form-group"><input type="text" placeholder="Product Name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} required /></div>
                <div className="form-group"><textarea placeholder="Description" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} required /></div>
                <div className="form-group"><input type="number" placeholder="Price (M)" value={newProduct.price} step="0.01" min="0" onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} required /></div>
                <div className="form-group"><input type="text" placeholder="Location" value={newProduct.location} onChange={(e) => setNewProduct({ ...newProduct, location: e.target.value })} required onClick={() => setShowMapModal(true)} readOnly /></div>
                <div className="form-group"><input type="text" placeholder="Category" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} /></div>
                <div className="form-group"><input type="tel" placeholder="Mobile Money Number (e.g. 0712345678)" value={newProduct.mobileMoneyNumber} onChange={(e) => setNewProduct({ ...newProduct, mobileMoneyNumber: e.target.value })} required /></div>
                <div className="form-group">
                  <select value={newProduct.mobileMoneyProvider} onChange={(e) => setNewProduct({ ...newProduct, mobileMoneyProvider: e.target.value })} required>
                    <option value="Mpesa">Mpesa</option><option value="Ecocash">Ecocash</option>
                  </select>
                </div>
                <div className="form-group"><input type="file" accept="image/jpeg,image/png,image/gif" onChange={handleFileChange} /></div>
                {uploading && <div className="upload-progress"><progress value={uploadProgress} max="100" /><span>{Math.round(uploadProgress)}%</span></div>}
                <button type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Upload Product"}</button>
              </form>
            </div>
          )}
         <div className="products-scroll-container">
  {loadingProducts ? (
    <div className="loading-spinner">Loading products...</div>
  ) : filteredProducts.length > 0 ? (
    <div className="three-column-grid">
      {filteredProducts.map(product => (
        <div key={product.id} className={`product-card ${expandedProduct === product.id ? 'expanded' : ''}`}>
          <div className="product-media-container" onClick={() => toggleProductExpand(product.id)}>
            {product.filename ? (
              <img
                src={`http://localhost:5000/uploads/${product.filename}`}
                alt={product.name}
                className="product-media"
                loading="lazy"
                onError={(e) => {
                  console.warn(`Failed to load image for product ${product.id}: ${product.filename}`);
                  e.target.src = "/fallback-image.png";
                }}
              />
            ) : (
              <div className="no-media-placeholder">No Image</div>
            )}
          </div>
          <div className="product-info">
            <h3>{product.name}</h3>
            <div className="price-location">
              <p>M{product.price.toFixed(2)}</p>
              <div
                className="location-info"
                onClick={(e) => {
                  e.stopPropagation();
                  if (product.coordinates) showLocationOnMap(product.coordinates);
                }}
                style={{ cursor: product.coordinates ? 'pointer' : 'default' }}
              >
                <FaMapMarkerAlt />
                <span>{product.location}</span>
                {product.distance !== null && <span className="distance">{product.distance.toFixed(1)} km</span>}
              </div>
            </div>
            {expandedProduct === product.id && (
              <div className="product-description">
                <p>{product.description}</p>
                {product.category && <p>Category: {product.category}</p>}
                {product.mobileMoneyNumber && (
                  <p>Payment: {product.mobileMoneyProvider} - {product.mobileMoneyNumber}</p>
                )}
                {product.coordinates && (
                  <button className="view-map-btn" onClick={() => showLocationOnMap(product.coordinates)}>
                    View on Map
                  </button>
                )}
              </div>
            )}
            <div className="product-actions">
              <button
                onClick={() =>
                  setFavorites(
                    favorites.includes(product.id)
                      ? favorites.filter(id => id !== product.id)
                      : [...favorites, product.id]
                  )
                }
                aria-label={favorites.includes(product.id) ? "Remove from favorites" : "Add to favorites"}
              >
                {favorites.includes(product.id) ? <FaHeart color="red" /> : <FaRegHeart />}
              </button>
              <button onClick={() => addToCart(product)} aria-label="Add to cart">
                <FaShoppingCart />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="no-products">No products found matching your search</div>
  )}
</div>
          <MiniCart />
        </section>
        <section className="right-section">
          <div className="section-header"><h2>Product Needs</h2>
            <button className="toggle-form-btn" onClick={() => setShowNeedForm(!showNeedForm)}>{showNeedForm ? <FaMinus /> : <FaPlus />} {showNeedForm ? "Hide Form" : "List Need"}</button>
          </div>
          {showNeedForm && (
            <div className="form-container">
              <form onSubmit={handleNeedSubmit}>
                <input type="text" placeholder="Product Name" value={newNeed.productName} onChange={(e) => setNewNeed({ ...newNeed, productName: e.target.value })} required />
                <textarea placeholder="Description" value={newNeed.description} onChange={(e) => setNewNeed({ ...newNeed, description: e.target.value })} required />
                <input type="number" placeholder="Budget (M)" value={newNeed.budget} step="0.01" min="0" onChange={(e) => setNewNeed({ ...newNeed, budget: e.target.value })} />
                <input type="number" placeholder="Quantity" value={newNeed.quantity} min="1" onChange={(e) => setNewNeed({ ...newNeed, quantity: e.target.value })} />
                <input type="text" placeholder="Location" value={newNeed.location} onChange={(e) => setNewNeed({ ...newNeed, location: e.target.value })} onClick={() => setShowMapModal(true)} readOnly />
                <button type="submit">Submit Need</button>
              </form>
            </div>
          )}
          <div className="needs--container">
            {loadingNeeds ? (
              <div className="loading-spinner">Loading needs...</div>
            ) : filteredNeeds.length > 0 ? (
              <div className="three-column-grid">
                {filteredNeeds.map(need => (
                  <div key={need.id} className={`need-card ${expandedNeed === need.id ? 'expanded' : ''}`}>
                    <div className="need-info">
                      <h3>{need.productName}</h3>
                      <div className="need-meta">{need.budget > 0 && <p>Budget: M{need.budget.toFixed(2)}</p>}{need.quantity > 0 && <p>Quantity: {need.quantity}</p>}
                        <div className="location-info" onClick={(e) => { e.stopPropagation(); if (need.coordinates) showLocationOnMap(need.coordinates); }} style={{ cursor: need.coordinates ? 'pointer' : 'default' }}>
                          <FaMapMarkerAlt /><span>{need.location}</span>{need.distance !== null && <span className="distance">{need.distance.toFixed(1)} km</span>}
                        </div>
                      </div>
                      <div className="need-description">
                        {expandedNeed === need.id ? (
                          <>{need.description}{need.coordinates && <button className="view-map-btn" onClick={() => showLocationOnMap(need.coordinates)}>View on Map</button>}</>
                        ) : (
                          <p>{need.description.length > 100 ? `${need.description.substring(0, 100)}...` : need.description}</p>
                        )}
                        {need.description.length > 100 && <button className="expand-btn" onClick={() => toggleNeedExpand(need.id)}>{expandedNeed === need.id ? "Show less" : "Show more"}</button>}
                      </div>
                      <div className="need-actions">
                        <button onClick={() => setFavorites(favorites.includes(need.id) ? favorites.filter(id => id !== need.id) : [...favorites, need.id])}
                          aria-label={favorites.includes(need.id) ? "Remove from favorites" : "Add to favorites"}>
                          {favorites.includes(need.id) ? <FaHeart color="red" /> : <FaRegHeart />}
                        </button>
                        <button onClick={() => startChat(need.userId, { needId: need.id })} aria-label="Chat with buyer">
                          <FaComment />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-needs">No needs listed matching your search</div>
            )}
          </div>
        </section>
      </div>
      {menuOpen && (
        <div className="menu-dropdown">
          {[{ path: "/", label: "🏠 Home" }, { path: "/marketUpdate", label: "📊 Market Updates" }, { path: "/forum", label: "💬 Forum" }, { path: "/settings", label: "⚙️ Settings" }, { path: "/logout", label: "🚪 Logout" }]
            .map(item => <div key={item.path} onClick={() => { navigate(item.path); setMenuOpen(false); }} className="menu-item">{item.label}</div>)}
          <div className="menu-item" onClick={() => setShowChatModal(true)}>💬 Private Chats</div>
        </div>
      )}
      {proceedToCheckout && <CheckoutModal />}
      {showMapModal && (
        <div className="map-modal">
          <div className="map-content">
            <div className="map-header"><h3>{viewingLocation ? 'Product Location' : mapLocation ? 'Selected Location' : 'Select Location'}</h3>
              <button onClick={() => { setShowMapModal(false); setViewingLocation(null); setMapLocation(null); }}>×</button>
            </div>
            <div className="map-container">
              <OSMapComponent
                center={viewingLocation || mapLocation || (userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null)}
                zoom={viewingLocation ? 14 : (mapLocation ? 14 : 10)}
                onLocationSelect={viewingLocation || mapLocation ? null : handleLocationSelect}
                isSelectable={!viewingLocation && !mapLocation}
                markers={viewingLocation || mapLocation ? [] : [
                  ...filteredProducts.map(p => ({ id: p.id, name: p.name, description: p.description, location: p.coordinates })),
                  ...filteredNeeds.map(n => ({ id: n.id, name: n.productName, description: n.description, location: n.coordinates }))
                ]}
              />
              {(viewingLocation || mapLocation) && <div className="map-actions"><button onClick={() => { setViewingLocation(null); setMapLocation(null); }}>Back to All Locations</button></div>}
            </div>
          </div>
        </div>
      )}
      {showAuthLinks && (
        <div className="auth-modal">
          <div className="auth-content">
            <h3>Authentication Required</h3><p>Please login or register to perform this action.</p>
            <div className="auth-buttons">
              <button className="login-btn" onClick={() => navigate("/login")}>Login</button>
              <button className="register-btn" onClick={() => navigate("/register")}>Register</button>
              <button className="cancel-btn" onClick={() => setShowAuthLinks(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showChatModal && <ChatModal />}
    </div>
  );
};

export default ExplorePage;