import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB1QQaodz6bf7G8KT1VEISx5gvzCebOCeQ",
  authDomain: "llcoaching.firebaseapp.com",
  projectId: "llcoaching",
  storageBucket: "llcoaching.firebasestorage.app",
  messagingSenderId: "814789333404",
  appId: "1:814789333404:web:d6305c8d1554c0cedd7859",
  measurementId: "G-CXFSSZS0CH",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Set authentication persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    // Set up auth state observer
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is signed in:", user.email);
      } else {
        console.log("No user is signed in");
      }
    });
  })
  .catch((error) => {
    console.error("Auth persistence error:", error);
  });

// Helper function to check if user is authenticated
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });
};

export default app;
