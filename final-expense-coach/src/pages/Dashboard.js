import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Container,
  Paper,
  Grid,
  Avatar,
  Divider,
  Chip,
  Stack,
  CircularProgress,
  ButtonBase,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  School as TrainingIcon,
  ExitToApp as LogoutIcon,
  People as AgentsIcon,
  Assessment as PerformanceIcon,
  Event as ScheduleIcon,
} from "@mui/icons-material";
import { useCallGrading } from "../contexts/CallGradingContext";
import { getCurrentUserData, getAgents } from "../firebase/firebaseUtils";

const drawerWidth = 240;

function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { metrics, loading: metricsLoading } = useCallGrading();
  const [userData, setUserData] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [user, agentsData] = await Promise.all([
          getCurrentUserData(),
          getAgents(currentUser.uid),
        ]);
        setUserData(user);
        setAgents(agentsData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  const drawer = (
    <div>
      <Toolbar>
        <Avatar sx={{ mr: 2 }}>
          {currentUser?.email?.charAt(0).toUpperCase()}
        </Avatar>
        <Typography variant="subtitle1" noWrap>
          {currentUser?.email}
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem component={Link} to="/" selected={location.pathname === "/"}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem
          component={Link}
          to="/agents"
          selected={location.pathname === "/agents"}
        >
          <ListItemIcon>
            <AgentsIcon />
          </ListItemIcon>
          <ListItemText primary="My Agents" />
        </ListItem>
        <ListItem
          component={Link}
          to="/training"
          selected={location.pathname === "/training"}
        >
          <ListItemIcon>
            <TrainingIcon />
          </ListItemIcon>
          <ListItemText primary="Training Materials" />
        </ListItem>
        <ListItem
          component={Link}
          to="/schedule"
          selected={location.pathname === "/schedule"}
        >
          <ListItemIcon>
            <ScheduleIcon />
          </ListItemIcon>
          <ListItemText primary="Schedule" />
        </ListItem>
        <ListItem
          component={Link}
          to="/performance"
          selected={location.pathname === "/performance"}
        >
          <ListItemIcon>
            <PerformanceIcon />
          </ListItemIcon>
          <ListItemText primary="Performance Tracking" />
        </ListItem>
        <ListItem
          component={Link}
          to="/profile"
          selected={location.pathname === "/profile"}
        >
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItem>
        <ListItem
          component="button"
          onClick={handleLogout}
          sx={{
            width: "100%",
            textAlign: "left",
            border: "none",
            background: "none",
            cursor: "pointer",
            "&:hover": {
              backgroundColor: "action.hover",
            },
          }}
        >
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
  );

  if (loading || metricsLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Sales Coach Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Typography variant="h4" gutterBottom>
          Welcome, {userData?.firstName || currentUser?.email}
        </Typography>

        <Grid container spacing={3}>
          {/* Performance Overview */}
          <Grid item xs={12} md={6} lg={4}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Performance Overview
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Average Call Score
                  </Typography>
                  <Typography variant="h4">
                    {metrics?.averageScore.toFixed(1)}%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Calls Graded
                  </Typography>
                  <Typography variant="h4">
                    {metrics?.totalGrades || 0}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Active Agents
                  </Typography>
                  <Typography variant="h4">
                    {agents.filter((a) => a.status === "active").length}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* Top Strengths */}
          <Grid item xs={12} md={6} lg={4}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Top Strengths
              </Typography>
              <List>
                {metrics?.topStrengths.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={item.strength}
                      secondary={`Observed ${item.count} times`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Areas for Improvement */}
          <Grid item xs={12} md={6} lg={4}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Areas for Improvement
              </Typography>
              <List>
                {metrics?.topImprovements.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={item.improvement}
                      secondary={`Mentioned ${item.count} times`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Recent Grades */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recent Call Grades
              </Typography>
              <List>
                {metrics?.recentGrades.map((grade, index) => (
                  <React.Fragment key={grade.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                          >
                            <Box component="span">{grade.agentName}</Box>
                            <Chip
                              label={`${grade.totalScore}%`}
                              color={
                                grade.totalScore >= 90
                                  ? "success"
                                  : grade.totalScore >= 70
                                  ? "warning"
                                  : "error"
                              }
                              size="small"
                            />
                          </Stack>
                        }
                        secondary={
                          <>
                            <Box
                              component="span"
                              sx={{ display: "block", color: "text.secondary" }}
                            >
                              {new Date(grade.callDate).toLocaleDateString()}
                            </Box>
                            <Box component="span" sx={{ display: "block" }}>
                              {grade.notes}
                            </Box>
                          </>
                        }
                      />
                    </ListItem>
                    {index < metrics.recentGrades.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default Dashboard;
