import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { getCallGrades, getCallGradeMetrics } from "../firebase/firebaseUtils";

const CallGradingContext = createContext();

export function useCallGrading() {
  return useContext(CallGradingContext);
}

export function CallGradingProvider({ children }) {
  const { currentUser } = useAuth();
  const [grades, setGrades] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshGrades = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentUser) {
        console.log("No user logged in");
        return;
      }

      const [gradesData, metricsData] = await Promise.all([
        getCallGrades(filters),
        getCallGradeMetrics(filters)
      ]);
      
      setGrades(gradesData);
      setMetrics(metricsData);
    } catch (error) {
      console.error("Error fetching grades:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      if (currentUser) {
        await refreshGrades();
      } else {
        setLoading(false);
      }
    };
    
    initializeData();
  }, [currentUser]);

  const value = {
    grades,
    metrics,
    loading,
    error,
    refreshGrades
  };

  return (
    <CallGradingContext.Provider value={value}>
      {children}
    </CallGradingContext.Provider>
  );
} 