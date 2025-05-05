import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

// Define styles locally
const styles = {
  replyText: {
    marginTop: "10px",
    padding: "10px",
    backgroundColor: "#f9f9f9",
    borderRadius: "5px",
    border: "1px solid #ddd",
  },
};

const RepliesList = ({ topicId }) => {
  const [replies, setReplies] = useState([]);

  // Fetch replies for the given topicId
  useEffect(() => {
    const unsubscribeReplies = onSnapshot(collection(db, `topics/${topicId}/replies`), (snapshot) => {
      const repliesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setReplies(repliesData);
    });

    return () => {
      unsubscribeReplies();
    };
  }, [topicId]);

  return (
    <div>
      {replies.map((reply) => (
        <div key={reply.id} style={styles.replyText}>
          <p>{reply.text}</p>
        </div>
      ))}
    </div>
  );
};

export default RepliesList;