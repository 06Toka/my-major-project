import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, orderBy, query, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import logoImg from "./download.png";

// Simplified Reply component with dynamic user selection
const Reply = ({ reply, topicId, currentUser, markNotificationAsRead }) => {
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(true);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [users, setUsers] = useState([]);

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

  // Fetch comments for this reply
  useEffect(() => {
    const q = query(collection(db, `topics/${topicId}/replies/${reply.id}/comments`), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComments(commentsData);
    });
    
    return () => unsubscribe();
  }, [reply.id, topicId]);
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString();
  };
  
  const toggleComments = () => {
    setShowComments(!showComments);
  };
  
  // Add a comment to this reply
  const addComment = async () => {
    if (!replyText.trim()) return;
    if (!selectedUser) {
      alert("Please select a username before commenting");
      return;
    }
    
    const commentRef = await addDoc(collection(db, `topics/${topicId}/replies/${reply.id}/comments`), {
      text: replyText,
      timestamp: new Date(),
      author: selectedUser,
    });
    
    // Create notification for all users except the commenter
    const usersSnapshot = await getDocs(collection(db, "users"));
    const notificationPromises = usersSnapshot.docs
      .filter(userDoc => {
        const username = userDoc.data().username || userDoc.data().displayName;
        return username !== selectedUser && username;
      })
      .map(userDoc => {
        const username = userDoc.data().username || doc.data().displayName;
        return addDoc(collection(db, `users/${username}/notifications`), {
          type: "comment",
          topicId,
          replyId: reply.id,
          commentId: commentRef.id,
          text: `New comment on reply: ${reply.text.substring(0, 50)}...`,
          timestamp: new Date(),
          read: false,
        });
      });

    await Promise.all(notificationPromises);
    console.log("Comment notifications created for users:", usersSnapshot.docs.map(doc => doc.data().username));

    setReplyText("");
    setShowReplyInput(false);
    setSelectedUser("");
  };
  
  return (
    <div style={styles.replyContainer}>
      <div style={styles.replyContent}>
        <p>{reply.text}</p>
        <div style={styles.replyMeta}>
          <span style={styles.replyAuthor}>{reply.author || "Anonymous"}</span>
          <span style={styles.timestamp}>{formatTimestamp(reply.timestamp)}</span>
        </div>
        <div style={styles.replyActions}>
          <button 
            style={styles.commentButton} 
            onClick={() => setShowReplyInput(!showReplyInput)}
          >
            Reply
          </button>
          {comments.length > 0 && (
            <button 
              style={styles.commentButton} 
              onClick={toggleComments}
            >
              {showComments ? "Hide comments" : `Show comments (${comments.length})`}
            </button>
          )}
        </div>
      </div>
      
      {showReplyInput && (
        <div style={styles.replyInputContainer}>
          <select
            style={{ ...styles.replyInput, marginRight: "10px", width: "150px" }}
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">Select User</option>
            {users.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
          <input
            style={styles.replyInput}
            placeholder="Write a comment..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <motion.button
            style={styles.replyButton}
            whileHover={{ scale: 1.05 }}
            onClick={addComment}
          >
            Post
          </motion.button>
        </div>
      )}
      
      {showComments && comments.length > 0 && (
        <div style={styles.commentsContainer}>
          {comments.map(comment => (
            <div key={comment.id} style={styles.commentItem}>
              <p>{comment.text}</p>
              <div style={styles.commentMeta}>
                <span style={styles.commentAuthor}>{comment.author || "Anonymous"}</span>
                <span style={styles.timestamp}>{formatTimestamp(comment.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Updated RepliesList component
const RepliesList = ({ topicId, currentUser, markNotificationAsRead }) => {
  const [replies, setReplies] = useState([]);
  
  useEffect(() => {
    const q = query(collection(db, `topics/${topicId}/replies`), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const repliesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReplies(repliesData);
    });
    
    return () => unsubscribe();
  }, [topicId]);
  
  if (replies.length === 0) {
    return <p style={styles.noReplies}>No replies yet. Be the first to respond!</p>;
  }
  
  return (
    <div style={styles.repliesContainer}>
      <h4 style={styles.repliesTitle}>Replies</h4>
      {replies.map(reply => (
        <Reply 
          key={reply.id} 
          reply={reply} 
          topicId={topicId} 
          currentUser={currentUser}
          markNotificationAsRead={markNotificationAsRead}
        />
      ))}
    </div>
  );
};

const Forum = () => {
  const [topic, setTopic] = useState("");
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedTopics, setExpandedTopics] = useState({});
  const [selectedUser, setSelectedUser] = useState(localStorage.getItem("selectedUser") || "");
  const [users, setUsers] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

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
      return;
    }
    const q = query(
      collection(db, `users/${selectedUser}/notifications`),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notificationsData);
      console.log(`Notifications updated for ${selectedUser}:`, notificationsData);
    }, (error) => {
      console.error("Error fetching notifications:", error);
    });

    return () => unsubscribe();

    // Hypothetical WebSocket implementation (uncomment if you set up a WebSocket server)
    /*
    const ws = new WebSocket('ws://your-websocket-server.com');
    ws.onopen = () => {
      console.log('WebSocket connected');
      ws.send(JSON.stringify({ type: 'subscribe', user: selectedUser }));
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'notification') {
        setNotifications(prev => [
          { id: data.id, ...data.payload, timestamp: new Date(data.payload.timestamp) },
          ...prev
        ]);
        console.log('WebSocket notification received:', data);
      }
    };
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    return () => ws.close();
    */
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

  // Create a new topic
  const createTopic = async () => {
    setIsLoading(true);
    setError("");

    try {
      if (!topic.trim()) {
        throw new Error("Please enter a topic.");
      }
      if (!selectedUser) {
        throw new Error("Please select a username.");
      }

      const topicRef = await addDoc(collection(db, "topics"), {
        title: topic,
        timestamp: new Date(),
        author: selectedUser,
      });

      // Create notification for all users except the topic creator
      const usersSnapshot = await getDocs(collection(db, "users"));
      const notificationPromises = usersSnapshot.docs
        .filter(userDoc => {
          const username = userDoc.data().username || userDoc.data().displayName;
          return username !== selectedUser && username;
        })
        .map(userDoc => {
          const username = userDoc.data().username || userDoc.data().displayName;
          return addDoc(collection(db, `users/${username}/notifications`), {
            type: "topic",
            topicId: topicRef.id,
            text: `New topic: ${topic.substring(0, 50)}...`,
            timestamp: new Date(),
            read: false,
          });
        });

      await Promise.all(notificationPromises);
      console.log("Topic created with ID:", topicRef.id, "Notifications sent to users:", 
        usersSnapshot.docs.map(doc => doc.data().username).filter(u => u !== selectedUser));

      setTopic("");
      // Keep selectedUser to maintain notification listener
    } catch (err) {
      setError(err.message);
      console.error("Error creating topic:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle topic expansion
  const toggleTopic = (topicId) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
    // Mark topic notification as read when expanded
    const topicNotification = notifications.find(
      n => n.type === "topic" && n.topicId === topicId && !n.read
    );
    if (topicNotification) {
      markNotificationAsRead(topicNotification.id);
    }
  };

  // Delete topics older than 7 days
  const deleteOldTopics = (topicsData) => {
    const currentTime = new Date();
    topicsData.forEach((topic) => {
      if (!topic.timestamp) return;
      const topicTime = new Date(topic.timestamp.seconds * 1000);
      const diffTime = currentTime - topicTime;
      const diffDays = diffTime / (1000 * 3600 * 24);
      if (diffDays > 7) {
        deleteDoc(doc(db, "topics", topic.id));
      }
    });
  };

  // Fetch topics in real-time
  useEffect(() => {
    const q = query(collection(db, "topics"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const topicsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTopics(topicsData);
      deleteOldTopics(topicsData);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={styles.forumPage}>
      {/* Navigation Bar */}
      <nav style={styles.navBar}>
        <div style={styles.logo}>
          <img src={logoImg} alt="FarmHub Logo" style={styles.logoImg} />
          FarmHub
        </div>
        <input
          type="text"
          style={styles.searchBar}
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div style={styles.navIcons}>
          <div style={styles.notificationIcon} onClick={toggleNotifications}>
            🔔
            {notifications.filter(n => !n.read).length > 0 && (
              <span style={styles.notificationBadge}>
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </div>
          <div style={styles.menuIcon} onClick={toggleMenu}>☰</div>
        </div>
      </nav>

      {showNotifications && (
        <motion.div
          style={styles.notificationDropdown}
          initial={{ opacity: 0, transform: "translateY(-10px)" }}
          animate={{ opacity: 1, transform: "translateY(0)" }}
          transition={{ duration: 0.5 }}
        >
          <h4 style={{ margin: "10px 0", color: "#4CAF50" }}>Notifications</h4>
          {!selectedUser ? (
            <p style={{ padding: "10px", color: "#888" }}>
              Please select a user in the Forum to view notifications
            </p>
          ) : notifications.length === 0 ? (
            <p style={{ padding: "10px", color: "#888" }}>No notifications</p>
          ) : (
            <ul style={styles.notificationList}>
              {notifications.map(notification => (
                <li
                  key={notification.id}
                  style={{
                    ...styles.notificationItem,
                    backgroundColor: notification.read ? "#f5f5f5" : "#e8f5e9",
                  }}
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
                  <span style={styles.timestamp}>
                    {formatTimestamp(notification.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      )}

      {menuOpen && (
        <motion.div
          style={styles.menuDropdown}
          initial={{ opacity: 0, transform: "translateY(-10px)" }}
          animate={{ opacity: 1, transform: "translateY(0)" }}
          transition={{ duration: 0.5 }}
        >
          <ul style={styles.menuList}>
            <li style={styles.menuItem} onClick={() => handleNavigation("/")}>🏠 Home</li>
            <li style={styles.menuItem} onClick={() => handleNavigation("/marketUpdate")}>📊 Market Updates</li>
            <li style={styles.menuItem} onClick={() => handleNavigation("/announcements")}>🔔 Notifications</li>
            <li style={styles.menuItem} onClick={() => handleNavigation("/settings")}>⚙️ Settings</li>
            <li style={styles.menuItem} onClick={() => handleNavigation("/logout")}>🚪 Logout</li>
          </ul>
        </motion.div>
      )}

      <motion.h1
        style={{ textAlign: "center", color: "#4CAF50", marginBottom: "30px" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        Community Forum
      </motion.h1>

      <motion.div 
        style={styles.chatSection} 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 style={{ color: "#4CAF50", marginBottom: "15px" }}>Create a New Topic</h2>
        <select
          style={{ ...styles.chatInput, marginBottom: "10px" }}
          value={selectedUser}
          onChange={(e) => {
            setSelectedUser(e.target.value);
            localStorage.setItem("selectedUser", e.target.value);
          }}
        >
          <option value="">Select User</option>
          {users.map(user => (
            <option key={user} value={user}>{user}</option>
          ))}
        </select>
        <input
          style={styles.chatInput}
          placeholder="What would you like to discuss?"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <motion.button
          style={styles.replyButton}
          whileHover={{ scale: 1.05 }}
          onClick={createTopic}
          disabled={isLoading}
        >
          {isLoading ? "Creating..." : "Create Topic"}
        </motion.button>
        {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
      </motion.div>

      <motion.div 
        style={{ ...styles.chatSection, marginTop: "20px" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 style={{ color: "#4CAF50", marginBottom: "15px" }}>Discussion Topics</h2>
        <div style={{ backgroundColor: "#f5fff5", padding: "10px", borderRadius: "5px", marginBottom: "15px" }}>
          <p style={{ margin: 0, fontSize: "14px" }}>
            <span style={{ fontWeight: "bold" }}>Note:</span> Comments are limited to one level of replies.
          </p>
        </div>
        {topics.length === 0 ? (
          <p style={{ textAlign: "center", padding: "20px" }}>No topics yet. Be the first to start a discussion!</p>
        ) : (
          <div style={styles.chatMessages}>
            {topics.map((topic) => (
              <motion.div
                key={topic.id}
                id={`topic-${topic.id}`}
                style={styles.chatMessage}
                whileHover={{ boxShadow: "0px 4px 8px rgba(0,0,0,0.2)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 
                  style={styles.topicTitle}
                  onClick={() => toggleTopic(topic.id)}
                >
                  {topic.title}
                </h3>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "5px" }}>
                  <span style={{ fontSize: "14px", color: "#4CAF50" }}>
                    Posted by: {topic.author || "Anonymous"}
                  </span>
                  <p style={styles.timestamp}>Created: {formatTimestamp(topic.timestamp)}</p>
                </div>
                
                {expandedTopics[topic.id] && (
                  <div style={styles.replySection}>
                    <div style={{ display: "flex", marginBottom: "15px" }}>
                      <select
                        style={{ ...styles.replyInput, marginRight: "10px", width: "150px" }}
                        value={selectedUser}
                        onChange={(e) => {
                          setSelectedUser(e.target.value);
                          localStorage.setItem("selectedUser", e.target.value);
                        }}
                      >
                        <option value="">Select User</option>
                        {users.map(user => (
                          <option key={user} value={user}>{user}</option>
                        ))}
                      </select>
                      <input
                        style={styles.replyInput}
                        placeholder="Add your reply to this topic..."
                        value={topic.replyText || ""}
                        onChange={(e) => {
                          const updatedTopics = topics.map(t => 
                            t.id === topic.id ? { ...t, replyText: e.target.value } : t
                          );
                          setTopics(updatedTopics);
                        }}
                      />
                      <motion.button
                        style={styles.replyButton}
                        whileHover={{ scale: 1.05 }}
                        onClick={async () => {
                          if (!topic.replyText?.trim()) return;
                          if (!selectedUser) {
                            alert("Please select a username before replying");
                            return;
                          }
                          
                          await addDoc(collection(db, `topics/${topic.id}/replies`), {
                            text: topic.replyText,
                            timestamp: new Date(),
                            author: selectedUser,
                          });
                          
                          const updatedTopics = topics.map(t => 
                            t.id === topic.id ? { ...t, replyText: "" } : t
                          );
                          setTopics(updatedTopics);
                        }}
                      >
                        Post Reply
                      </motion.button>
                    </div>
                    <RepliesList 
                      topicId={topic.id} 
                      currentUser={selectedUser}
                      markNotificationAsRead={markNotificationAsRead}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div 
        style={styles.recentTopics}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 style={{ color: "#4CAF50", marginBottom: "15px" }}>Recent Topics</h2>
        <ul style={styles.recentTopicList}>
          {topics.slice(0, 5).map((topic) => (
            <li key={topic.id} style={styles.recentTopicList}>
              <span onClick={() => toggleTopic(topic.id)} style={{ cursor: "pointer", color: "#4CAF50" }}>
                {topic.title}
              </span>
              <span style={styles.timestamp}>({formatTimestamp(topic.timestamp)})</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
};

const styles = {
  forumPage: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    fontFamily: "'Poppins', sans-serif",
    backgroundColor: "#f9f9f9",
    minHeight: "100vh",
  },
  navBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "linear-gradient(45deg, #4CAF50, #2e7d32)",
    padding: "15px 30px",
    color: "white",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    width: "100%",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },
  logo: {
    fontSize: "24px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
  },
  logoImg: {
    width: "40px",
    height: "40px",
    marginRight: "10px",
  },
  searchBar: {
    padding: "10px",
    width: "500px",
    borderRadius: "8px",
    border: "none",
    outline: "none",
    transition: "0.3s",
  },
  navIcons: {
    display: "flex",
    alignItems: "center",
  },
  notificationIcon: {
    fontSize: "24px",
    cursor: "pointer",
    marginRight: "20px",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: "-8px",
    right: "-8px",
    backgroundColor: "red",
    color: "white",
    borderRadius: "50%",
    padding: "2px 6px",
    fontSize: "12px",
  },
  notificationDropdown: {
    position: "absolute",
    top: "80px",
    right: "30px",
    background: "white",
    padding: "15px",
    borderRadius: "8px",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    width: "300px",
    maxHeight: "400px",
    overflowY: "auto",
    zIndex: 1000,
  },
  notificationList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  notificationItem: {
    padding: "10px",
    cursor: "pointer",
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "background 0.3s",
  },
  menuIcon: {
    fontSize: "30px",
    cursor: "pointer",
  },
  menuDropdown: {
    position: "absolute",
    top: "80px",
    right: "30px",
    background: "white",
    padding: "15px",
    borderRadius: "8px",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
  },
  menuList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  menuItem: {
    padding: "10px",
    cursor: "pointer",
    transition: "background 0.3s",
  },
  chatSection: {
    width: "70%",
    padding: "20px",
    borderRadius: "10px",
    backgroundColor: "white",
    boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
    transition: "0.3s ease-in-out",
    color: "#333",
    marginBottom: "30px",
  },
  chatInput: {
    width: "100%",
    padding: "12px",
    marginBottom: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px",
    outline: "none",
  },
  replyButton: {
    backgroundColor: "#4CAF50",
    color: "white",
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "0.3s",
  },
  commentButton: {
    backgroundColor: "transparent",
    color: "#4CAF50",
    padding: "5px 10px",
    border: "1px solid #4CAF50",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    marginRight: "10px",
    transition: "0.3s",
  },
  chatMessages: {
    marginTop: "20px",
    width: "100%",
  },
  chatMessage: {
    padding: "15px",
    backgroundColor: "white",
    borderRadius: "8px",
    marginBottom: "15px",
    boxShadow: "0px 2px 5px rgba(0,0,0,0.1)",
    transition: "0.3s",
  },
  replySection: {
    marginTop: "15px",
    borderTop: "1px solid #eee",
    paddingTop: "15px",
  },
  replyInput: {
    width: "80%",
    padding: "8px",
    marginRight: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "14px",
    outline: "none",
  },
  recentTopics: {
    marginTop: "30px",
    padding: "20px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
    width: "80%",
    textAlign: "center",
    color: "#333",
  },
  timestamp: {
    fontSize: "12px",
    color: "#888",
    marginLeft: "10px",
  },
  topicTitle: {
    fontWeight: "bold",
    fontSize: "20px",
    color: "#333",
    cursor: "pointer",
  },
  recentTopicList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    textAlign: "left",
  },
  replyInputContainer: {
    display: "flex",
    alignItems: "center",
    marginTop: "10px",
  },
  commentsContainer: {
    marginTop: "10px",
    marginLeft: "20px",
    borderLeft: "2px solid #e0e0e0",
    paddingLeft: "10px",
  },
  commentItem: {
    padding: "8px",
    backgroundColor: "#f0f0f0",
    borderRadius: "6px",
    marginBottom: "8px",
  },
  repliesContainer: {
    marginTop: "15px",
  },
  repliesTitle: {
    fontSize: "16px",
    marginBottom: "10px",
    color: "#4CAF50",
  },
  noReplies: {
    fontStyle: "italic",
    color: "#888",
  },
  replyContainer: {
    marginBottom: "15px",
    padding: "10px",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
  },
  replyContent: {
    fontSize: "14px",
  },
  replyMeta: {
    display: "flex",
    alignItems: "center",
    marginTop: "5px",
    fontSize: "12px",
  },
  replyAuthor: {
    fontWeight: "bold",
    color: "#4CAF50",
  },
  replyActions: {
    marginTop: "5px",
    display: "flex",
    alignItems: "center",
  },
  commentMeta: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: "5px",
    fontSize: "12px",
  },
  commentAuthor: {
    fontWeight: "bold",
    color: "#4CAF50",
  },
};

export default Forum;