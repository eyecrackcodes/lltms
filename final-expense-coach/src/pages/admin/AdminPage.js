import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Alert,
  Snackbar,
  Container,
  CircularProgress,
} from "@mui/material";
import { createUserWithRole, getManagers } from "../../firebase/firebaseUtils";
import { auth } from "../../firebase/config";

const USER_ROLES = {
  AGENT: 'agent',
  SALES_MANAGER: 'sales_manager',
  DIRECTOR: 'director',
  ADMIN: 'admin'
};

const LOCATIONS = ["Austin", "Charlotte"];

function AdminPage() {
  const [newUser, setNewUser] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "",
    location: "",
    managerId: "",
  });
  const [managers, setManagers] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadManagers = async () => {
      try {
        const managersList = await getManagers();
        setManagers(managersList);
      } catch (err) {
        console.error('Error loading managers:', err);
        setError('Failed to load managers');
      }
    };
    loadManagers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);

      if (
        !newUser.email ||
        !newUser.firstName ||
        !newUser.lastName ||
        !newUser.role ||
        !newUser.location
      ) {
        throw new Error("Please fill in all required fields");
      }

      if (newUser.role === USER_ROLES.AGENT && !newUser.managerId) {
        throw new Error("Please select a sales manager for the agent");
      }

      const userData = {
        email: newUser.email.trim(),
        firstName: newUser.firstName.trim(),
        lastName: newUser.lastName.trim(),
        role: newUser.role,
        location: newUser.location,
        password: "Welcome123!",
        managerId: newUser.role === USER_ROLES.AGENT ? newUser.managerId : null,
      };

      console.log("Creating user with data:", userData);

      await createUserWithRole(userData);

      setSuccess(true);
      setNewUser({
        email: "",
        firstName: "",
        lastName: "",
        role: "",
        location: "",
        managerId: "",
      });
    } catch (err) {
      console.error("Error creating user:", err);
      setError(err.message);
    }
  };

  return (
    <Container>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Add New User
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={newUser.firstName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, firstName: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={newUser.lastName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, lastName: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value, managerId: '' })}
                  >
                    <MenuItem value={USER_ROLES.AGENT}>Agent</MenuItem>
                    <MenuItem value={USER_ROLES.SALES_MANAGER}>Sales Manager</MenuItem>
                    <MenuItem value={USER_ROLES.DIRECTOR}>Director</MenuItem>
                    <MenuItem value={USER_ROLES.ADMIN}>Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Location</InputLabel>
                  <Select
                    value={newUser.location}

                    onChange={(e) =>
                      setNewUser({ ...newUser, location: e.target.value })
                    }
                  >
                    {LOCATIONS.map((location) => (
                      <MenuItem key={location} value={location}>
                        {location}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {newUser.role === USER_ROLES.AGENT && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>Sales Manager</InputLabel>
                    <Select
                      value={newUser.managerId}
                      onChange={(e) => setNewUser({ ...newUser, managerId: e.target.value })}
                    >
                      {managers.map((manager) => (
                        <MenuItem key={manager.id} value={manager.id}>
                          {`${manager.firstName} ${manager.lastName}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                >
                  Add User
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>

        <Snackbar
          open={success}
          autoHideDuration={10000}
          onClose={() => setSuccess(false)}
        >
          <Alert severity="success" onClose={() => setSuccess(false)}>
            <div>
              <Typography variant="body1">User created successfully!</Typography>
              <Typography variant="body2">
                Email: {newUser.email}<br/>
                Password: Welcome123!<br/>
                Please save these credentials
              </Typography>
            </div>
          </Alert>
        </Snackbar>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    </Container>
  );
}

export default React.memo(AdminPage);
