import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  Alert,
} from "@mui/material";
import { getAgents, assignTrainingModule } from "../firebase/firebaseUtils";

function AssignModuleDialog({ open, onClose, module }) {
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [assignment, setAssignment] = useState({
    selectedAgents: [],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16), // 1 week from now
    notes: "",
    reminderFrequency: "daily",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const fetchedAgents = await getAgents();
        setAgents(fetchedAgents);
      } catch (error) {
        console.error("Error loading agents:", error);
        setError("Failed to load agents");
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchAgents();
    }
  }, [open]);

  const handleAssign = async () => {
    try {
      if (assignment.selectedAgents.length === 0) {
        setError("Please select at least one agent");
        return;
      }

      // Create assignments for each selected agent
      await Promise.all(
        assignment.selectedAgents.map((agentId) =>
          assignTrainingModule({
            moduleId: module.id,
            moduleTitle: module.title,
            moduleType: module.type,
            agentId,
            dueDate: new Date(assignment.dueDate),
            notes: assignment.notes,
            reminderFrequency: assignment.reminderFrequency,
            status: "assigned",
            progress: 0,
            assignedAt: new Date(),
          })
        )
      );

      onClose(true); // true indicates successful assignment
    } catch (error) {
      console.error("Error assigning module:", error);
      setError("Failed to assign module");
    }
  };

  const handleClose = () => {
    setAssignment({
      selectedAgents: [],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16),
      notes: "",
      reminderFrequency: "daily",
    });
    setError("");
    onClose(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box>
          {module?.title}
          <Typography 
            component="div"
            variant="subtitle2" 
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            {module?.type === "course" ? "Course" : "Quiz"}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Select Agents</InputLabel>
              <Select
                multiple
                value={assignment.selectedAgents}
                onChange={(e) =>
                  setAssignment({
                    ...assignment,
                    selectedAgents: e.target.value,
                  })
                }
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => {
                      const agent = agents.find((a) => a.id === value);
                      return (
                        <Chip
                          key={value}
                          label={agent ? `${agent.firstName} ${agent.lastName}` : 'Unknown Agent'}
                          onDelete={() => {
                            setAssignment({
                              ...assignment,
                              selectedAgents: assignment.selectedAgents.filter(id => id !== value)
                            });
                          }}
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {agents.map((agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    <Box>
                      <Typography variant="body1">
                        {`${agent.firstName} ${agent.lastName}`}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        component="div"
                      >
                        {agent.email}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Due Date"
              type="datetime-local"
              value={assignment.dueDate}
              onChange={(e) =>
                setAssignment({
                  ...assignment,
                  dueDate: e.target.value,
                })
              }
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Reminder Frequency</InputLabel>
              <Select
                value={assignment.reminderFrequency}
                onChange={(e) =>
                  setAssignment({
                    ...assignment,
                    reminderFrequency: e.target.value,
                  })
                }
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="none">No Reminders</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes for Agents"
              value={assignment.notes}
              onChange={(e) =>
                setAssignment({
                  ...assignment,
                  notes: e.target.value,
                })
              }
              placeholder="Add any additional instructions or notes for the assigned agents..."
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleAssign}
          disabled={loading || assignment.selectedAgents.length === 0}
        >
          Assign Module
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AssignModuleDialog;
