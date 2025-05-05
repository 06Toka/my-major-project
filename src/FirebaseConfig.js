import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPzgioiBzTy3Xp4rCywtVXmzFi84g-CA8",
  authDomain: "farmhub-da4d6.firebaseapp.com",
  projectId: "farmhub-da4d6",
  storageBucket: "farmhub-da4d6.appspot.com",
  messagingSenderId: "60467132380",
  appId: "1:60467132380:web:59bb5ec9c51e14fb6ec119",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export authentication functions
export { auth, db, storage, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut };
