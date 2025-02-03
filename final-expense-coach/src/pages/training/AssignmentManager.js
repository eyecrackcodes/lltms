import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
  Stack,
  IconButton,
} from "@mui/material";
import {
  getAgents,
  getTrainingModules,
  getAllModuleAssignments,
  updateAssignmentStatus,
  removeModuleAssignment,
} from "../../firebase/firebaseUtils";
import CloseIcon from "@mui/icons-material/Close";

function AssignmentManager() {
  const [assignments, setAssignments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [selectedAgents, setSelectedAgents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agentsList, modulesList, assignmentsList] = await Promise.all([
          getAgents(),
          getTrainingModules(),
          getAllModuleAssignments(),
        ]);

        // Create a lookup map for agents and modules
        const agentsMap = new Map(agentsList.map((agent) => [agent.id, agent]));
        const modulesMap = new Map(
          modulesList.map((module) => [module.id, module])
        );

        // Enrich assignments with agent and module data
        const enrichedAssignments = assignmentsList.map((assignment) => ({
          ...assignment,
          agent: agentsMap.get(assignment.agentId),
          module: modulesMap.get(assignment.moduleId),
        }));

        setAgents(agentsList);
        setModules(modulesList);
        setAssignments(enrichedAssignments);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    console.log("Selected agents updated:", selectedAgents);
  }, [selectedAgents]);

  const handleStatusUpdate = async () => {
    try {
      await updateAssignmentStatus(selectedAssignment.id, editStatus);

      // Update local state
      setAssignments(
        assignments.map((assignment) =>
          assignment.id === selectedAssignment.id
            ? { ...assignment, status: editStatus }
            : assignment
        )
      );

      setOpenEdit(false);
    } catch (error) {
      console.error("Error updating assignment status:", error);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (window.confirm("Are you sure you want to remove this assignment?")) {
      try {
        await removeModuleAssignment(assignmentId);
        setAssignments(assignments.filter((a) => a.id !== assignmentId));
      } catch (error) {
        console.error("Error removing assignment:", error);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      assigned: "primary",
      "in-progress": "warning",
      completed: "success",
      overdue: "error",
    };
    return colors[status] || "default";
  };

  const handleClose = () => {
    console.log("Dialog closing, clearing selected agents");
    setSelectedAgents([]);
    setOpenEdit(false);
  };

  const handleSubmit = () => {
    console.log("Submitting with selected agents:", selectedAgents);
    handleClose();
  };

  const handleAgentRemove = (agentToRemove) => {
    console.log("Attempting to remove agent:", agentToRemove);
    console.log("Current selected agents:", selectedAgents);
    const newSelected = selectedAgents.filter(
      (agent) => agent.id !== agentToRemove.id
    );
    console.log("New selected agents after removal:", newSelected);
    setSelectedAgents(newSelected);
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Training Assignments
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Agent</TableCell>
              <TableCell>Module</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Assigned Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>
                  {assignment.agent
                    ? `${assignment.agent.firstName} ${assignment.agent.lastName}`
                    : "Unknown Agent"}
                </TableCell>
                <TableCell>
                  {assignment.module?.title || "Unknown Module"}
                </TableCell>
                <TableCell>{assignment.module?.type}</TableCell>
                <TableCell>
                  {assignment.assignedAt?.toDate().toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip
                    label={assignment.status}
                    color={getStatusColor(assignment.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{`${assignment.progress || 0}%`}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setEditStatus(assignment.status);
                      setOpenEdit(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleRemoveAssignment(assignment.id)}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Status Dialog */}
      <Dialog open={openEdit} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Update Assignment Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="assigned">Assigned</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            color="primary"
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Module Dialog */}
      <Dialog open={false} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Module to Agents</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}
            >
              {selectedAgents.map((agent) => (
                <Box
                  key={agent.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    bgcolor: "#e0e0e0",
                    borderRadius: "16px",
                    px: 1,
                    py: 0.5,
                  }}
                >
                  <Typography variant="body2">
                    {agent.firstName} {agent.lastName}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleAgentRemove(agent)}
                    sx={{ ml: 0.5, p: 0.5 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Stack>

            <Autocomplete
              multiple
              options={agents}
              value={selectedAgents}
              onChange={(event, newValue) => {
                console.log("Selected value:", newValue);
                setSelectedAgents(newValue);
              }}
              getOptionLabel={(option) =>
                `${option.firstName || ""} ${option.lastName || ""} (${
                  option.email
                })`
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Select Agents"
                  placeholder="Search agents..."
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={selectedAgents.length === 0}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AssignmentManager;
