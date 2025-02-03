import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
  Chip,
  Box,
  CircularProgress,
} from "@mui/material";
import { getAgents } from "../../firebase/firebaseUtils";

function AssignmentDialog({ open, onClose, onAssign, moduleTitle }) {
  const [agents, setAgents] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const fetchedAgents = await getAgents();
      setAgents(fetchedAgents);
    } catch (error) {
      console.error("Error loading agents:", error);
    }
  };

  const handleSubmit = () => {
    onAssign(selectedAgents);
    setSelectedAgents([]); // Reset selection after assignment
    onClose();
  };

  const handleClose = () => {
    setSelectedAgents([]); // Reset selection on close
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Module: {moduleTitle}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Autocomplete
            multiple
            options={agents}
            value={selectedAgents}
            onChange={(event, newValue) => setSelectedAgents(newValue)}
            getOptionLabel={(option) =>
              `${option.firstName || ""} ${option.lastName || ""} (${
                option.email
              })`
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Agents"
                placeholder="Search agents..."
                variant="outlined"
              />
            )}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => (
                <Chip
                  label={`${option.firstName || ""} ${option.lastName || ""}`}
                  {...getTagProps({ index })}
                  onDelete={() => {
                    const newSelected = selectedAgents.filter(
                      (agent) => agent.id !== option.id
                    );
                    setSelectedAgents(newSelected);
                  }}
                />
              ))
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
            loading={loading}
            disabled={loading}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={selectedAgents.length === 0 || loading}
        >
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AssignmentDialog;
