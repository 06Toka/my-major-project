import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, getDoc } from "firebase/firestore"; // Add getDoc
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

// Firebase configuration
const firebase = {
  apiKey: "AIzaSyAPzgioiBzTy3Xp4rCywtVXmzFi84g-CA8",
  authDomain: "farmhub-da4d6.firebaseapp.com",
  projectId: "farmhub-da4d6",
  storageBucket: "farmhub-da4d6.appspot.com",
  messagingSenderId: "60467132380",
  appId: "1:60467132380:web:59bb5ec9c51e14fb6ec119",
};

// Initialize Firebase
const app = initializeApp(firebase);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const messaging = getMessaging(app);

// Export authentication functions and messaging
export { auth, db, storage, messaging, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, getDoc }; // Add getDoc to exports