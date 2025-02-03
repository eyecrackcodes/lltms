import React from "react";
import { useAuth } from "../../contexts/AuthContext";

function ManagerDashboard() {
  const { currentUser, userRole } = useAuth();

  return (
    <div>
      <h1>Sales Manager Dashboard</h1>
      <p>Welcome, {currentUser?.email}</p>
      <p>Role: {userRole}</p>
    </div>
  );
}

export default ManagerDashboard;
