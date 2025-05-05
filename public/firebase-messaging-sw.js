// Import Firebase App and Messaging from the Firebase modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getMessaging, onBackgroundMessage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

// Firebase configuration (replace with your own Firebase config)
const firebaseConfig = {
  apiKey: "AIzaSyAPzgioiBzTy3Xp4rCywtVXmzFi84g-CA8",
  authDomain: "farmhub-da4d6.firebaseapp.com",
  projectId: "farmhub-da4d6",
  storageBucket: "farmhub-da4d6.appspot.com",
  messagingSenderId: "60467132380",
  appId: "1:60467132380:web:59bb5ec9c51e14fb6ec119",
};

const app = initializeApp(firebaseConfig);  // Initialize Firebase App

// Get an instance of Firebase Messaging
const messaging = getMessaging(app);

// Handle background messages
onBackgroundMessage(messaging, (payload) => {
  console.log("Received background message:", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || "/logo192.png", // Use your app's icon
  };

  // Display the notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});
