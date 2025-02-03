import React, { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { getUserRole } from "../firebase/firebaseUtils";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
} from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const initializeUserInFirestore = async (user) => {
    const db = getFirestore();
    const userRef = doc(db, "users", user.uid);

    try {
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // For anthony@luminarylife.com, set as admin
        const isAdmin = user.email === "anthony@luminarylife.com";

        const userData = {
          uid: user.uid,
          email: user.email,
          firstName: user.displayName || user.email.split("@")[0],
          lastName: "",
          role: isAdmin ? "admin" : "agent",
          createdAt: new Date().toISOString(),
        };

        await setDoc(userRef, userData);
        console.log("Created new user document");
        return userData;
      }

      return userDoc.data();
    } catch (error) {
      console.error("Error initializing user:", error);
      return null;
    }
  };

  async function signup(email, password) {
    try {
      setAuthError(null);
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User signed up:", result.user.email);
      return result;
    } catch (error) {
      console.error("Signup error:", error);
      setAuthError(error.message);
      throw error;
    }
  }

  async function login(email, password) {
    try {
      setAuthError(null);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const role = await getUserRole(userCredential.user.uid);
      console.log("Login successful, role:", role);
      setUserRole(role);
      return userCredential;
    } catch (error) {
      console.error("Login error:", error);
      setAuthError(error.message);
      throw error;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      console.log("User logged out");
    } catch (error) {
      console.error("Logout error:", error);
      setAuthError(error.message);
      throw error;
    }
  }

  useEffect(() => {
    console.log("Setting up auth state listener");

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log("Auth state changed:", user.email);

        const db = getFirestore();
        const userRef = doc(db, "users", user.uid);
        let userData;

        try {
          const userDoc = await getDoc(userRef);

          if (!userDoc.exists()) {
            console.log("No user document found, initializing...");
            userData = await initializeUserInFirestore(user);
          } else {
            userData = userDoc.data();
          }

          if (userData) {
            setCurrentUser({ ...user, ...userData });
            setUserRole(userData.role);
            console.log("Login successful, role:", userData.role);
          } else {
            console.error("Failed to get or create user data");
            setCurrentUser(null);
            setUserRole(null);
          }
        } catch (error) {
          console.error("Error in auth state change:", error);
          setCurrentUser(null);
          setUserRole(null);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => {
      console.log("Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    authError,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
