import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Box,
  Alert,
  Snackbar,
  Autocomplete,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  getTrainingModules,
  addTrainingModule,
  deleteModule,
  getAgents,
  assignTrainingModule,
} from "../../firebase/firebaseUtils";
import RichTextEditor from "../../components/RichTextEditor";

function ModuleManagement() {
  const [modules, setModules] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentModule, setCurrentModule] = useState(null);
  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    content: "",
    type: "course", // Default type
    duration: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [agents, setAgents] = useState([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  useEffect(() => {
    loadModules();
    loadAgents();
  }, []);

  const loadModules = async () => {
    try {
      const fetchedModules = await getTrainingModules();
      setModules(fetchedModules);
    } catch (error) {
      console.error("Error loading modules:", error);
      showSnackbar("Error loading modules", "error");
    }
  };

  const loadAgents = async () => {
    try {
      const fetchedAgents = await getAgents();
      setAgents(fetchedAgents);
    } catch (error) {
      console.error("Error loading agents:", error);
    }
  };

  const handleOpenDialog = (module = null) => {
    if (module) {
      setCurrentModule(module);
      setModuleForm({
        title: module.title,
        description: module.description,
        content: module.content || "",
        type: module.type || "course",
        duration: module.duration || "",
      });
    } else {
      setCurrentModule(null);
      setModuleForm({
        title: "",
        description: "",
        content: "",
        type: "course",
        duration: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentModule(null);
    setModuleForm({
      title: "",
      description: "",
      content: "",
      type: "course",
      duration: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addTrainingModule(moduleForm);
      showSnackbar(
        `Module ${currentModule ? "updated" : "created"} successfully!`,
        "success"
      );
      handleCloseDialog();
      loadModules();
    } catch (error) {
      console.error("Error saving module:", error);
      showSnackbar("Error saving module", "error");
    }
  };

  const handleDelete = async (moduleId) => {
    if (window.confirm("Are you sure you want to delete this module?")) {
      try {
        await deleteModule(moduleId);
        showSnackbar("Module deleted successfully", "success");
        loadModules();
      } catch (error) {
        console.error("Error deleting module:", error);
        showSnackbar("Error deleting module", "error");
      }
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleAssignClick = (module) => {
    setCurrentModule(module);
    setAssignDialogOpen(true);
  };

  const handleAssignClose = () => {
    setAssignDialogOpen(false);
    setSelectedAgents([]);
    setCurrentModule(null);
  };

  const handleAssign = async () => {
    try {
      await assignTrainingModule(
        currentModule.id,
        selectedAgents.map((agent) => agent.id)
      );
      handleAssignClose();
      // Optional: Show success message
    } catch (error) {
      console.error("Error assigning module:", error);
      // Optional: Show error message
    }
  };

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          mt: 4,
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4">Training Management</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenDialog()}
        >
          Create New Module
        </Button>
      </Box>

      <Grid container spacing={3}>
        {modules.map((module) => (
          <Grid item xs={12} md={6} key={module.id}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" component="h2">
                    {module.title}
                  </Typography>
                  <Box>
                    <IconButton
                      onClick={() => handleOpenDialog(module)}
                      size="small"
                      color="primary"
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(module.id)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Typography color="textSecondary" gutterBottom>
                  Type: {module.type}
                </Typography>

                <Typography variant="body2" sx={{ mb: 2 }}>
                  {module.description}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 2,
                  }}
                >
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => handleAssignClick(module)}
                  >
                    Assign to Agents
                  </Button>
                  {module.duration && (
                    <Typography variant="body2" color="textSecondary">
                      Duration: {module.duration}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currentModule ? "Edit Module" : "Create New Module"}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={moduleForm.title}
              onChange={(e) =>
                setModuleForm({ ...moduleForm, title: e.target.value })
              }
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={moduleForm.description}
              onChange={(e) =>
                setModuleForm({ ...moduleForm, description: e.target.value })
              }
              margin="normal"
              multiline
              rows={3}
              required
            />
            <TextField
              fullWidth
              label="Duration (e.g., '30 minutes', '2 hours')"
              value={moduleForm.duration}
              onChange={(e) =>
                setModuleForm({ ...moduleForm, duration: e.target.value })
              }
              margin="normal"
            />
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Content
              </Typography>
              <RichTextEditor
                value={moduleForm.content}
                onChange={(content) =>
                  setModuleForm({ ...moduleForm, content })
                }
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {currentModule ? "Update" : "Create"} Module
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={assignDialogOpen}
        onClose={handleAssignClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Module: {currentModule?.title}</DialogTitle>
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
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAssignClose}>Cancel</Button>
          <Button
            onClick={handleAssign}
            variant="contained"
            color="primary"
            disabled={selectedAgents.length === 0}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default ModuleManagement;
