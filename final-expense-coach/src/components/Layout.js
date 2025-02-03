import React, { useState, useEffect } from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Collapse,
  ListItemButton,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Grade as GradeIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  ExitToApp as LogoutIcon,
  LibraryBooks as LibraryIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { isSuperAdmin, getUserRole } from "../firebase/firebaseUtils";
import PeopleIcon from "@mui/icons-material/People";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import StarIcon from "@mui/icons-material/Star";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

const drawerWidth = 240;

function Layout() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [openTraining, setOpenTraining] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (currentUser?.email) {
        const superAdminStatus = await isSuperAdmin(currentUser.email);
        const role = await getUserRole(currentUser.uid);
        console.log("User role:", role); // Debug log
        console.log("Super admin status:", superAdminStatus); // Debug log
        setIsAdmin(
          superAdminStatus || role === "director" || role === "manager"
        );
        setUserRole(role);
      }
    };
    checkAdminStatus();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const handleTrainingClick = () => {
    setOpenTraining(!openTraining);
  };

  const baseMenuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Training Materials", icon: <SchoolIcon />, path: "/training" },
    { text: "Schedule", icon: <ScheduleIcon />, path: "/schedule" },
    { text: "Performance", icon: <AssessmentIcon />, path: "/performance" },
    { text: "Call Grading", icon: <GradeIcon />, path: "/call-grading" },
    { text: "Profile", icon: <PersonIcon />, path: "/profile" },
  ];

  const adminMenuItems = [
    { text: "User Management", icon: <GroupIcon />, path: "/user-management" },
    { text: "All Agents", icon: <GroupIcon />, path: "/all-agents" },
  ];

  const trainingManagementItems = [
    {
      text: "Module Library",
      path: "/training-management/modules",
      icon: <LibraryIcon />,
    },
    {
      text: "Training Assignments",
      path: "/training-management/assignments",
      icon: <AssignmentIcon />,
    },
  ];

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <Box sx={{ overflow: "auto" }}>
          <Typography
            variant="h6"
            component="div"
            sx={{ p: 2, bgcolor: "primary.main", color: "white" }}
          >
            Final Expense Coach
          </Typography>
          <List>
            {/* Base Menu Items */}
            {baseMenuItems.map((item) => (
              <ListItem
                key={item.text}
                component={Link}
                to={item.path}
                sx={{
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}

            {/* Admin Section */}
            {isAdmin && (
              <>
                <Divider />
                {/* Training Management Section */}
                <ListItem>
                  <ListItemIcon>
                    <LibraryIcon />
                  </ListItemIcon>
                  <ListItemText primary="Training Management" />
                </ListItem>
                {trainingManagementItems.map((item) => (
                  <ListItemButton
                    key={item.text}
                    component={Link}
                    to={item.path}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                ))}

                <Divider />
                {/* Other Admin Items */}
                {adminMenuItems.map((item) => (
                  <ListItem
                    key={item.text}
                    component={Link}
                    to={item.path}
                    sx={{
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItem>
                ))}
              </>
            )}

            <Divider />
            <ListItem
              onClick={handleLogout}
              sx={{
                cursor: "pointer",
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          marginLeft: { sm: `${drawerWidth}px` },
          overflowX: "hidden",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;
