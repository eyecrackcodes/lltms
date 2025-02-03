import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MyAgents from "./pages/MyAgents";
import Training from "./pages/training/Training";
import Schedule from "./pages/Schedule";
import Performance from "./pages/Performance";
import CallGrading from "./pages/CallGrading";
import Profile from "./pages/Profile";
import AdminPage from "./pages/admin/AdminPage";
import { CallGradingProvider } from "./contexts/CallGradingContext";
import PrivateRoute from "./components/PrivateRoute";
import { auth } from "./firebase/config";
import AgentDashboard from "./pages/agent/AgentDashboard";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import MyTeam from "./pages/MyTeam";
import TrainingModuleManager from "./pages/builders/TrainingModuleManager";
import ModuleLibrary from "./pages/training/ModuleLibrary";
import TrainingAssignments from "./pages/training/TrainingAssignments";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import TrainingManagement from "./pages/training/TrainingManagement";
import AssignmentManager from "./pages/training/AssignmentManager";
import ModuleManagement from "./pages/admin/ModuleManagement";
import ProtectedRoute from "./components/ProtectedRoute";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});

function App() {
  const [loading, setLoading] = useState(true);
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setLoading(false);
      setInitialAuthChecked(true);
      console.log("Auth state changed:", user?.email || "No user");
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }

  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <CallGradingProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Protected routes */}
              <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                  {/* Base routes for all users */}
                  <Route path="/dashboard" element={<AgentDashboard />} />

                  {/* Training routes */}
                  <Route path="/training">
                    <Route index element={<Training />} />
                    <Route path="modules" element={<ModuleLibrary />} />
                    <Route
                      path="assignments"
                      element={<TrainingAssignments />}
                    />
                  </Route>

                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/performance" element={<Performance />} />
                  <Route path="/call-grading" element={<CallGrading />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/my-team" element={<MyTeam />} />

                  {/* Training Management Routes - Consolidated */}
                  <Route path="/training-management">
                    <Route
                      index
                      element={
                        <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                          <TrainingManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="modules"
                      element={
                        <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                          <TrainingManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="assignments"
                      element={
                        <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                          <AssignmentManager />
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  {/* Admin only routes */}
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/user-management" element={<AdminDashboard />} />

                  {/* Redirect /agents to /my-team for agents */}
                  <Route
                    path="/agents"
                    element={<Navigate to="/my-team" replace />}
                  />

                  {/* Catch all route */}
                  <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Route>
              </Route>

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route
                path="/training-management/modules"
                element={
                  <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                    <ModuleManagement />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </CallGradingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
