import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PrivateRoute({ roles }) {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Check if route requires specific roles
  if (roles && !roles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    if (userRole === "agent") {
      return <Navigate to="/dashboard" replace />;
    } else if (userRole === "sales_manager") {
      return <Navigate to="/manager-dashboard" replace />;
    } else if (userRole === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    }
  }

  return currentUser ? <Outlet /> : <Navigate to="/login" replace />;
}
