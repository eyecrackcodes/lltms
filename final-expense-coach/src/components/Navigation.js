import React from "react";
import { Link } from "react-router-dom";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Event as EventIcon,
  Assessment as AssessmentIcon,
  Star as StarIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { isSuperAdmin } from "../firebase/firebaseUtils";

function Navigation() {
  const { currentUser, logout } = useAuth();
  const isAdmin = React.useMemo(() => {
    console.log("Current user email:", currentUser?.email);
    console.log("Is super admin?", isSuperAdmin(currentUser?.email));
    return currentUser?.email && isSuperAdmin(currentUser.email);
  }, [currentUser?.email]);

  console.log("isAdmin value:", isAdmin);

  return (
    <List>
      <ListItem disablePadding>
        <ListItemButton component={Link} to="/">
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
      </ListItem>

      <ListItem disablePadding>
        <ListItemButton component={Link} to="/agents">
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText primary="My Agents" />
        </ListItemButton>
      </ListItem>

      <ListItem disablePadding>
        <ListItemButton component={Link} to="/training">
          <ListItemIcon>
            <SchoolIcon />
          </ListItemIcon>
          <ListItemText primary="Training Materials" />
        </ListItemButton>
      </ListItem>

      <ListItem disablePadding>
        <ListItemButton component={Link} to="/schedule">
          <ListItemIcon>
            <EventIcon />
          </ListItemIcon>
          <ListItemText primary="Schedule" />
        </ListItemButton>
      </ListItem>

      <ListItem disablePadding>
        <ListItemButton component={Link} to="/performance">
          <ListItemIcon>
            <AssessmentIcon />
          </ListItemIcon>
          <ListItemText primary="Performance" />
        </ListItemButton>
      </ListItem>

      <ListItem disablePadding>
        <ListItemButton component={Link} to="/call-grading">
          <ListItemIcon>
            <StarIcon />
          </ListItemIcon>
          <ListItemText primary="Call Grading" />
        </ListItemButton>
      </ListItem>

      <ListItem disablePadding>
        <ListItemButton component={Link} to="/profile">
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItemButton>
      </ListItem>

      {isAdmin && (
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/admin">
            <ListItemIcon>
              <AdminPanelSettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Admin" />
          </ListItemButton>
        </ListItem>
      )}

      <ListItem disablePadding>
        <ListItemButton onClick={logout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </ListItem>
    </List>
  );
}

export default React.memo(Navigation); 