import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Assignment as AssignIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import { getTrainingModules } from "../../firebase/firebaseUtils";
import { PageHeader, LoadingState, AssignModuleDialog } from "../../components";

function ModuleLibrary() {
  console.log("[ModuleLibrary] rendering at:", window.location.pathname);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      const fetchedModules = await getTrainingModules();
      setModules(fetchedModules);
    } catch (error) {
      console.error("Error loading modules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (module) => {
    setSelectedModule(module);
    setOpenViewDialog(true);
  };

  const handleAssign = (module) => {
    setSelectedModule(module);
    setOpenAssignDialog(true);
  };

  const handleAssignComplete = (success) => {
    setOpenAssignDialog(false);
    if (success) {
      setFeedback({
        open: true,
        message: "Module assigned successfully!",
        severity: "success",
      });
    }
  };

  const handleCloseFeedback = () => {
    setFeedback({ ...feedback, open: false });
  };

  const renderModuleContent = (module) => {
    if (module.type === "course") {
      return (
        <Box>
          {module.sections.map((section, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">{section.title}</Typography>
                <Chip label={section.duration} size="small" sx={{ ml: 2 }} />
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                  {section.content}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      );
    } else if (module.type === "quiz") {
      return (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Time Limit: {module.timeLimit} minutes
          </Typography>
          <Typography variant="subtitle2" gutterBottom>
            Passing Score: {module.passingScore}%
          </Typography>
          {module.questions.map((question, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {index + 1}. {question.question}
              </Typography>
              {question.options.map((option, optIndex) => (
                <Typography
                  key={optIndex}
                  variant="body2"
                  sx={{
                    ml: 2,
                    color:
                      optIndex === question.correctAnswer
                        ? "success.main"
                        : "inherit",
                  }}
                >
                  • {option}
                </Typography>
              ))}
            </Paper>
          ))}
        </Box>
      );
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Box>
      <PageHeader
        title="Training Module Library"
        breadcrumbs={[
          { label: "Training Management", path: "/training-management" },
          { label: "Module Library", path: "/training-management/modules" },
        ]}
      />

      <Grid container spacing={3}>
        {modules.map((module) => (
          <Grid item xs={12} md={6} lg={4} key={module.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {module.title}
                </Typography>
                <Typography color="text.secondary" paragraph>
                  {module.description}
                </Typography>
                <Chip
                  label={module.type.toUpperCase()}
                  color={module.type === "course" ? "primary" : "secondary"}
                  size="small"
                />
                {module.skillLevel && (
                  <Chip
                    label={module.skillLevel}
                    variant="outlined"
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={() => handleView(module)}
                >
                  View
                </Button>
                <Button
                  size="small"
                  startIcon={<AssignIcon />}
                  onClick={() => handleAssign(module)}
                >
                  Assign
                </Button>
                <IconButton size="small">
                  <EditIcon />
                </IconButton>
                <IconButton size="small">
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* View Module Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedModule?.title}
          <Chip
            label={selectedModule?.type.toUpperCase()}
            color={selectedModule?.type === "course" ? "primary" : "secondary"}
            size="small"
            sx={{ ml: 2 }}
          />
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" paragraph>
            {selectedModule?.description}
          </Typography>
          {selectedModule && renderModuleContent(selectedModule)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              setOpenViewDialog(false);
              handleAssign(selectedModule);
            }}
          >
            Assign Module
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assignment Dialog */}
      <AssignModuleDialog
        open={openAssignDialog}
        onClose={handleAssignComplete}
        module={selectedModule}
      />

      {/* Feedback Snackbar */}
      <Snackbar
        open={feedback.open}
        autoHideDuration={6000}
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseFeedback}
          severity={feedback.severity}
          sx={{ width: "100%" }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ModuleLibrary;
