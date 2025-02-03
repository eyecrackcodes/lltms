import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from "@mui/material";
import { assignTrainingModule } from "../../firebase/firebaseUtils";
import AgentSelector from "../../components/AgentSelector";

function TrainingManagement() {
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [agents, setAgents] = useState([]);
  const [modules, setModules] = useState([]);
  const [openAssign, setOpenAssign] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAssignModule = async (moduleId) => {
    try {
      setLoading(true);
      setError(null);
      await assignTrainingModule(moduleId, selectedAgents);
      setOpenAssign(false);
      setSelectedAgents([]);
      // Show success message or update UI as needed
    } catch (error) {
      console.error("Error assigning module:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={openAssign}
      onClose={() => setOpenAssign(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Assign Module to Agents</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <Autocomplete
            multiple
            disableCloseOnSelect
            options={agents}
            getOptionLabel={(option) =>
              `${option.firstName} ${option.lastName}`
            }
            value={agents.filter((agent) => selectedAgents.includes(agent.id))}
            onChange={(event, newValue) => {
              setSelectedAgents(newValue.map((agent) => agent.id));
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Select Agents"
                placeholder="Search agents..."
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  key={option.id}
                  label={`${option.firstName} ${option.lastName}`}
                  {...getTagProps({ index })}
                />
              ))
            }
          />
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenAssign(false)}>Cancel</Button>
        <Button
          onClick={() => handleAssignModule(selectedModule.id)}
          variant="contained"
          color="primary"
          disabled={selectedAgents.length === 0}
        >
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TrainingManagement;
