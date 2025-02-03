import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Chip,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

const ROLES = {
  DIRECTOR: "Director",
  MANAGER: "Manager",
  AGENT: "Agent",
};

// Add role hierarchy and permissions
const ROLE_HIERARCHY = {
  [ROLES.DIRECTOR]: {
    canManage: [ROLES.DIRECTOR, ROLES.MANAGER, ROLES.AGENT],
    level: 4,
  },
  [ROLES.MANAGER]: {
    canManage: [ROLES.AGENT],
    level: 2,
  },
  [ROLES.AGENT]: {
    canManage: [],
    level: 1,
  },
};

const LOCATIONS = ["Austin", "Charlotte", "Remote"];

// Initial organization data
const INITIAL_ORG_DATA = {
  Austin: {
    director: {
      name: "Chad Steadham",
      role: ROLES.DIRECTOR,
      location: "Austin",
    },
    managers: [
      {
        name: "Anthony Patton",
        agents: [
          "Alisha O'Bryant",
          "Billy Slater",
          "Drew Lombard",
          "Iesha Alexander",
          "Jremekyo Anderson",
          "Kierra Smith",
          "Tim Dominguez",
        ],
      },
      // ... other Austin managers
    ],
  },
  Charlotte: {
    director: {
      name: "Trent Terrell",
      role: ROLES.DIRECTOR,
      location: "Charlotte",
    },
    managers: [
      {
        name: "Vincent Blanchett",
        agents: [
          "Angel Harris",
          "Camryn Anderson",
          "Damond Outing",
          "Arlethe Guevara",
          "Alvin Fulmore",
          "Wenny Gooding",
          "Beau Carson",
        ],
      },
      // ... other Charlotte managers
    ],
  },
};

function Users() {
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    location: "",
    managerId: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const { currentUser } = useAuth();

  // Initialize the organization on first load
  useEffect(() => {
    if (!currentUser) return;

    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users");
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [currentUser]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name) errors.name = "Name is required";
    if (!formData.email) errors.email = "Email is required";
    if (!formData.role) errors.role = "Role is required";
    if (!formData.location) errors.location = "Location is required";
    if (formData.role === ROLES.AGENT && !formData.managerId) {
      errors.managerId = "Manager is required for agents";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const userData = {
        ...formData,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid,
      };

      if (!selectedUser) {
        userData.createdAt = new Date().toISOString();
        userData.createdBy = currentUser.uid;
        await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });
      } else {
        await fetch(`/api/users/${selectedUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });
      }

      handleClose();
    } catch (error) {
      console.error("Error saving user:", error);
      setFormErrors({
        general: "Failed to save user. Please try again later.",
      });
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      setFormErrors({
        general: "Failed to delete user. Please try again later.",
      });
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData(user);
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setFormData({
      name: "",
      email: "",
      role: "",
      location: "",
      managerId: "",
    });
  };

  const getManagerName = (managerId) => {
    const manager = users.find((user) => user.id === managerId);
    return manager ? manager.name : "No Manager";
  };

  const getAvailableManagers = () => {
    return users.filter((user) => user.role === ROLES.MANAGER);
  };

  const getAgentsByManager = (managerId) => {
    return users.filter((user) => user.managerId === managerId);
  };

  const getUserHierarchy = (userId) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return null;

    if (user.role === ROLES.AGENT) {
      const manager = users.find((u) => u.id === user.managerId);
      return manager ? `${manager.name} > ${user.name}` : user.name;
    }

    if (user.role === ROLES.MANAGER) {
      const agents = getAgentsByManager(user.id);
      return {
        manager: user,
        agents: agents,
      };
    }

    return user;
  };

  // Get the complete hierarchy for display
  const getLocationHierarchy = (location) => {
    const locationUsers = users.filter((user) => user.location === location);
    const director = locationUsers.find((user) => user.role === ROLES.DIRECTOR);

    if (!director) return null;

    const managers = locationUsers.filter(
      (user) => user.role === ROLES.MANAGER
    );
    const hierarchy = {
      director,
      managers: managers.map((manager) => ({
        ...manager,
        agents: locationUsers.filter(
          (user) => user.role === ROLES.AGENT && user.managerId === manager.id
        ),
      })),
    };

    return hierarchy;
  };

  if (!currentUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Please log in to access user management.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add User
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Manager</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    color={
                      user.role === ROLES.DIRECTOR
                        ? "error"
                        : user.role === ROLES.MANAGER
                        ? "warning"
                        : "primary"
                    }
                  />
                </TableCell>
                <TableCell>{user.location}</TableCell>
                <TableCell>{getManagerName(user.managerId)}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(user)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(user.id)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedUser ? "Edit User" : "Add New User"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              error={!!formErrors.name}
              helperText={formErrors.name}
            />
            <TextField
              label="Email"
              fullWidth
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              error={!!formErrors.email}
              helperText={formErrors.email}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, role: e.target.value }))
                }
                error={!!formErrors.role}
              >
                {Object.values(ROLES).map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={formData.location}
                label="Location"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                error={!!formErrors.location}
              >
                {LOCATIONS.map((location) => (
                  <MenuItem key={location} value={location}>
                    {location}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.role === ROLES.AGENT && (
              <FormControl fullWidth>
                <InputLabel>Manager</InputLabel>
                <Select
                  value={formData.managerId}
                  label="Manager"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      managerId: e.target.value,
                    }))
                  }
                  error={!!formErrors.managerId}
                >
                  {getAvailableManagers().map((manager) => (
                    <MenuItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {selectedUser ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Sales Force Hierarchy
        </Typography>
        {LOCATIONS.filter((loc) => loc !== "Remote").map((location) => {
          const hierarchy = getLocationHierarchy(location);
          if (!hierarchy) return null;

          return (
            <Paper key={location} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                {location} Office
              </Typography>
              <Box sx={{ ml: 2 }}>
                <Typography variant="subtitle1">
                  Director: {hierarchy.director.name}
                </Typography>
                <Box sx={{ ml: 2, mt: 1 }}>
                  {hierarchy.managers.map((manager) => (
                    <Box key={manager.id} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="primary">
                        Manager: {manager.name}
                      </Typography>
                      <Box sx={{ ml: 3 }}>
                        {manager.agents.map((agent) => (
                          <Typography key={agent.id} variant="body2">
                            • {agent.name}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}

export default Users;
