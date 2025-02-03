import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  addAgent,
  getAgents,
  updateAgent,
  deleteAgent,
  getUserRole,
} from "../firebase/firebaseUtils";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Box,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
} from "@mui/icons-material";

function Agents() {
  const { currentUser } = useAuth();
  const [agents, setAgents] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    hireDate: "",
    role: "agent",
    status: "active",
    demographics: {
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    reporting: {
      department: "",
      team: "",
    },
    permissions: {
      canGradeOthers: false,
      canViewTeamMetrics: false,
      canEditTraining: false,
    },
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        const role = await getUserRole(currentUser.uid);
        setUserRole(role);
        loadAgents();
      } catch (err) {
        setError("Failed to initialize");
        console.error(err);
      }
    };
    initialize();
  }, [currentUser]);

  const loadAgents = async () => {
    try {
      const agentsList = await getAgents(currentUser.uid);
      console.log("Loaded agents:", agentsList); // Debug log
      setAgents(agentsList || []);
      setLoading(false);
    } catch (err) {
      console.error("Error loading agents:", err);
      setError("Failed to load agents");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedAgent) {
        await updateAgent(selectedAgent.id, formData);
        setSuccess("Agent updated successfully");
      } else {
        const newAgentData = {
          ...formData,
          reporting: {
            ...formData.reporting,
            directManagerId: currentUser.uid,
            directManagerName: currentUser.displayName || currentUser.email,
          },
          // Add default training settings
          training: {
            assignedCourses: [],
            completedCourses: [],
            progress: {},
          },
        };
        await addAgent(currentUser.uid, newAgentData);
        setSuccess("Agent added successfully");
      }
      handleClose();
      loadAgents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (agentId) => {
    try {
      await deleteAgent(agentId);
      setSuccess("Agent deleted successfully");
      loadAgents();
    } catch (err) {
      setError("Failed to delete agent");
    }
  };

  const handleEdit = (agent) => {
    setSelectedAgent(agent);
    setFormData({
      ...agent,
      dateOfBirth: agent.dateOfBirth?.split("T")[0] || "",
      hireDate: agent.hireDate?.split("T")[0] || "",
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedAgent(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      hireDate: "",
      role: "agent",
      status: "active",
      demographics: {
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
      reporting: {
        department: "",
        team: "",
      },
      permissions: {
        canGradeOthers: false,
        canViewTeamMetrics: false,
        canEditTraining: false,
      },
    });
  };

  const testFirestore = async () => {
    try {
      // Test Adding an Agent
      const newAgentId = await addAgent(currentUser.uid, {
        firstName: "Test",
        lastName: "Agent",
        email: "test@example.com",
        phone: "123-456-7890",
        dateOfBirth: "1990-01-01",
        hireDate: "2024-01-01",
        role: "agent",
        status: "active",
        demographics: {
          address: "123 Test St",
          city: "Test City",
          state: "TS",
          zipCode: "12345",
          country: "USA",
        },
        reporting: {
          department: "Sales",
          team: "Alpha",
        },
        permissions: {
          canGradeOthers: false,
          canViewTeamMetrics: false,
          canEditTraining: false,
        },
      });
      console.log("Added agent with ID:", newAgentId);

      // Test Getting Agents
      const agents = await getAgents(currentUser.uid);
      console.log("Retrieved agents:", agents);

      // Test Adding a Call Grade
      const gradeId = await addCallGrade(currentUser.uid, {
        agentId: newAgentId,
        date: new Date().toISOString(),
        totalScore: 85,
        sections: {
          opening: 90,
          discovery: 85,
          presentation: 80,
          closing: 85,
        },
        strengths: ["Great opening", "Good rapport"],
        improvements: ["Work on objection handling"],
      });
      console.log("Added call grade with ID:", gradeId);

      // Test Getting Call Grades
      const grades = await getCallGrades(currentUser.uid);
      console.log("Retrieved grades:", grades);

      setSuccess("Test completed successfully!");
    } catch (error) {
      console.error("Test failed:", error);
      setError("Test failed: " + error.message);
    }
  };

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        <Grid
          item
          xs={12}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h4">Manage Agents</Typography>
          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedAgent(null);
                setFormData({
                  firstName: "",
                  lastName: "",
                  email: "",
                  phone: "",
                  dateOfBirth: "",
                  hireDate: "",
                  role: "agent",
                  status: "active",
                  demographics: {
                    address: "",
                    city: "",
                    state: "",
                    zipCode: "",
                    country: "",
                  },
                  reporting: {
                    department: "",
                    team: "",
                  },
                  permissions: {
                    canGradeOthers: false,
                    canViewTeamMetrics: false,
                    canEditTraining: false,
                  },
                });
                setOpen(true);
              }}
              sx={{ mb: 2 }}
            >
              Add New Agent
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      {agent.firstName} {agent.lastName}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={agent.role}
                        color={
                          agent.role === "team_lead" ? "primary" : "default"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{agent.reporting.team}</TableCell>
                    <TableCell>
                      <Chip
                        label={agent.status}
                        color={agent.status === "active" ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {agent.demographics.city}, {agent.demographics.state}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(agent)}
                        disabled={userRole === "agent"}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(agent.id)}
                        disabled={userRole === "agent"}
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
        </Grid>
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedAgent ? "Edit Agent" : "Add New Agent"}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              {/* Personal Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Hire Date"
                  value={formData.hireDate}
                  onChange={(e) =>
                    setFormData({ ...formData, hireDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              {/* Role and Status */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Role & Status
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    label="Role"
                  >
                    <MenuItem value="director">Director</MenuItem>
                    <MenuItem value="sales_manager">Sales Manager</MenuItem>
                    <MenuItem value="team_lead">Team Lead</MenuItem>
                    <MenuItem value="agent">Agent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    label="Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Location Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Location
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={formData.demographics?.address || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      demographics: {
                        ...formData.demographics,
                        address: e.target.value,
                      },
                    })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={formData.demographics?.city || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      demographics: {
                        ...formData.demographics,
                        city: e.target.value,
                      },
                    })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State"
                  value={formData.demographics?.state || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      demographics: {
                        ...formData.demographics,
                        state: e.target.value,
                      },
                    })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ZIP Code"
                  value={formData.demographics?.zipCode || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      demographics: {
                        ...formData.demographics,
                        zipCode: e.target.value,
                      },
                    })
                  }
                  required
                />
              </Grid>

              {/* Team Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Team Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Department"
                  value={formData.reporting?.department || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reporting: {
                        ...formData.reporting,
                        department: e.target.value,
                      },
                    })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Team"
                  value={formData.reporting?.team || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reporting: {
                        ...formData.reporting,
                        team: e.target.value,
                      },
                    })
                  }
                  required
                />
              </Grid>
              {/* Add remaining form fields... */}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedAgent ? "Update" : "Add"} Agent
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={() => {
          setError("");
          setSuccess("");
        }}
      >
        <Alert severity={error ? "error" : "success"}>{error || success}</Alert>
      </Snackbar>
    </Container>
  );
}

export default Agents;
