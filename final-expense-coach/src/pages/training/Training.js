import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Tabs,
  Tab,
  Badge,
  Snackbar,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Check as CheckIcon,
  Assignment as AssignmentIcon,
  Launch as LaunchIcon,
  Chat as ChatIcon,
  Article as ArticleIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { useAuth } from "../../contexts/AuthContext";
import {
  getTrainingModules,
  updateTrainingStatus,
  addTrainingModule,
  assignTrainingModule,
  getAgentAssignments,
  getModuleAssignments,
  updateAssignmentProgress,
  getTrainingAnalytics,
  getAgentsByCoach,
  isSuperAdmin,
  MODULE_TYPES,
  getAgents,
} from "../../firebase/firebaseUtils";
import { getPracticeFeedback } from "../../utils/aiUtils";
import { LoadingState } from "../../components";
import CourseContent from "./CourseContent";
import { getAuth } from "firebase/auth";

const Training = () => {
  console.log("[Training] rendering at:", window.location.pathname);
  const { currentUser } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newModule, setNewModule] = useState({
    title: "",
    description: "",
    type: "",
    content: "",
    duration: "",
    assignedTo: [],
  });
  const [practiceDialogOpen, setPracticeDialogOpen] = useState(false);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [practiceResponse, setPracticeResponse] = useState("");
  const [aiFeedback, setAiFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [assignmentDetails, setAssignmentDetails] = useState({
    agents: [],
    startDate: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [agents, setAgents] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const auth = getAuth();

  const isAdmin = currentUser?.email && isSuperAdmin(currentUser.email);

  useEffect(() => {
    loadModules();
    if (currentUser) {
      loadAssignments();
      if (isAdmin) {
        loadAvailableAgents();
      }
    }
    const fetchAgents = async () => {
      const agentList = await getAgents();
      setAgents(agentList);
    };
    fetchAgents();
  }, [currentUser]);

  const loadModules = async () => {
    try {
      setLoading(true);
      const data = await getTrainingModules(currentUser.uid, currentUser.email);
      setModules(data);
    } catch (err) {
      setError("Failed to load training modules");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableAgents = async () => {
    try {
      const agents = await getAgentsByCoach(currentUser.uid);
      setAvailableAgents(agents);
    } catch (error) {
      console.error("Error loading agents:", error);
      setError("Failed to load available agents");
    }
  };

  const loadAssignments = async () => {
    try {
      if (!currentUser?.uid) {
        console.log("No user ID available");
        return;
      }

      console.log("Fetching assignments for user ID:", currentUser.uid);
      const userAssignments = await getAgentAssignments(currentUser.uid);
      console.log("Raw assignments:", userAssignments);
      setAssignments(userAssignments || []);
    } catch (error) {
      console.error("Error loading assignments:", error);
      setError("Failed to load your training assignments");
      setSnackbar({
        open: true,
        message: "Error loading your training assignments",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (assignmentId, status) => {
    try {
      await updateTrainingStatus(assignmentId, status);
      await loadModules(); // Refresh the list
    } catch (err) {
      setError("Failed to update status");
    }
  };

  const handleAddModule = async () => {
    try {
      await addTrainingModule(newModule);
      setOpenDialog(false);
      setNewModule({
        title: "",
        description: "",
        type: "",
        content: "",
        duration: "",
        assignedTo: [],
      });
      await loadModules();
    } catch (err) {
      setError("Failed to add module");
    }
  };

  const handlePracticeSession = (lesson) => {
    setCurrentScenario(lesson);
    setPracticeResponse("");
    setAiFeedback("");
    setPracticeDialogOpen(true);
  };

  const handleSubmitPractice = async () => {
    try {
      setIsSubmitting(true);
      const feedback = await getPracticeFeedback(
        currentScenario.title,
        practiceResponse
      );
      setAiFeedback(feedback);
    } catch (error) {
      setError("Failed to get AI feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignModule = async () => {
    try {
      setIsSubmitting(true);
      await assignTrainingModule({
        moduleId: selectedModule.id,
        agents: assignmentDetails.agents,
        startDate: assignmentDetails.startDate,
        dueDate: assignmentDetails.dueDate,
        assignedBy: currentUser.email,
      });

      setAssignDialogOpen(false);
      setAssignmentDetails({
        agents: [],
        startDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      await loadModules();
    } catch (error) {
      setError("Failed to assign module");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModuleIcon = (type) => {
    switch (type) {
      case MODULE_TYPES.VIDEO:
        return <PlayIcon />;
      case MODULE_TYPES.SLIDES:
        return <LaunchIcon />;
      case MODULE_TYPES.QUIZ:
        return <AssignmentIcon />;
      case MODULE_TYPES.PRACTICE:
        return <ChatIcon />;
      default:
        return <ArticleIcon />;
    }
  };

  const renderModuleCard = (module) => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {module.title}
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Chip
            label={module.type.toUpperCase()}
            color="primary"
            size="small"
            sx={{ mr: 1 }}
          />
          {module.duration && (
            <Chip
              label={module.duration}
              color="secondary"
              size="small"
              sx={{ mr: 1 }}
            />
          )}
        </Box>

        {module.description && (
          <Typography color="text.secondary" paragraph>
            {module.description}
          </Typography>
        )}

        {/* Assignment Progress */}
        {module.assignment && (
          <Box sx={{ mt: 2 }}>
            <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
              <ScheduleIcon sx={{ mr: 1, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                Due: {new Date(module.assignment.dueDate).toLocaleDateString()}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={module.assignment.progress || 0}
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              Progress: {module.assignment.progress || 0}%
            </Typography>
          </Box>
        )}

        {/* Module Analytics for Admins */}
        {isAdmin && module.analytics && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Assignment Analytics
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">
                  Assigned: {module.analytics.totalAssigned}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">
                  Completed: {module.analytics.completed}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">
                  Overdue: {module.analytics.overdue}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>

      <CardActions>
        {isAdmin && (
          <Button
            size="small"
            startIcon={<AssignmentIcon />}
            onClick={() => {
              setSelectedModule(module);
              setAssignDialogOpen(true);
            }}
          >
            Assign
          </Button>
        )}
        {module.assignment && (
          <Button
            size="small"
            startIcon={<PlayIcon />}
            onClick={() => handleStartAssignment(module.assignment)}
          >
            {module.assignment.progress > 0 ? "Continue" : "Start"}
          </Button>
        )}
      </CardActions>
    </Card>
  );

  const renderAssignmentDialog = () => (
    <Dialog
      open={assignDialogOpen}
      onClose={() => setAssignDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Assign Training Module</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Agents</InputLabel>
            <Select
              multiple
              value={assignmentDetails.agents}
              onChange={(e) =>
                setAssignmentDetails({
                  ...assignmentDetails,
                  agents: e.target.value,
                })
              }
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip
                      key={value}
                      label={
                        availableAgents.find((agent) => agent.id === value)
                          ?.firstName
                      }
                    />
                  ))}
                </Box>
              )}
            >
              {availableAgents.map((agent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  {agent.firstName} {agent.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Start Date"
              value={assignmentDetails.startDate}
              onChange={(newValue) =>
                setAssignmentDetails({
                  ...assignmentDetails,
                  startDate: newValue,
                })
              }
              renderInput={(params) => (
                <TextField {...params} fullWidth sx={{ mb: 2 }} />
              )}
            />
            <DateTimePicker
              label="Due Date"
              value={assignmentDetails.dueDate}
              onChange={(newValue) =>
                setAssignmentDetails({
                  ...assignmentDetails,
                  dueDate: newValue,
                })
              }
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
        <Button
          onClick={handleAssignModule}
          disabled={!assignmentDetails.agents.length || isSubmitting}
          variant="contained"
        >
          Assign Module
        </Button>
      </DialogActions>
    </Dialog>
  );

  const formatDueDate = (date) => {
    if (!date) return "No due date";
    try {
      // Handle both Firestore Timestamp and regular Date objects
      const dueDate = date.toDate ? date.toDate() : new Date(date);
      return dueDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const handleStartAssignment = (assignment) => {
    // Reset progress if the course is completed and being retaken
    if (assignment.progress === 100) {
      const shouldRetake = window.confirm(
        "You have already completed this course. Would you like to take it again?"
      );

      if (shouldRetake) {
        // Create a new assignment for the retake
        const retakeAssignment = {
          ...assignment,
          progress: 0,
          startedAt: new Date(),
          id: `${assignment.id}_retake_${Date.now()}`, // Unique ID for the retake
        };
        setSelectedCourse(retakeAssignment);
      } else {
        // Just review the completed course
        setSelectedCourse(assignment);
      }
    } else {
      setSelectedCourse(assignment);
    }
  };

  // Filter assignments based on completion
  const activeAssignments = assignments.filter((a) => a.progress < 100);
  const completedAssignments = assignments.filter((a) => a.progress === 100);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (selectedCourse) {
    return (
      <CourseContent
        moduleId={selectedCourse.moduleId}
        assignment={selectedCourse}
        onBack={() => setSelectedCourse(null)}
      />
    );
  }

  const renderAssignmentCard = (assignment) => (
    <Grid item xs={12} md={6} lg={4} key={assignment.id}>
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {assignment.progress === 100 && (
          <CheckIcon
            color="success"
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              fontSize: 24,
            }}
          />
        )}
        <CardContent sx={{ flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            {assignment.moduleTitle}
          </Typography>
          {assignment.description && (
            <Typography color="textSecondary" paragraph>
              {assignment.description}
            </Typography>
          )}
          <Box sx={{ mt: 2 }}>
            <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Due: {formatDueDate(assignment.dueDate)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={assignment.progress || 0}
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="textSecondary">
              Progress: {assignment.progress || 0}%
            </Typography>
            {assignment.completedAt && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Completed: {formatDueDate(assignment.completedAt)}
              </Typography>
            )}
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayIcon />}
            onClick={() => handleStartAssignment(assignment)}
            sx={{ mt: 2 }}
          >
            {assignment.progress === 100
              ? "Review Course"
              : assignment.progress > 0
              ? "Continue"
              : "Start"}
          </Button>
        </CardContent>
      </Card>
    </Grid>
  );

  return (
    <Container sx={{ mt: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          Training Materials
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AssignmentIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Add Training Module
          </Button>
        )}
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab
          label={
            <Badge
              badgeContent={activeAssignments.length}
              color="primary"
              showZero
            >
              Active Courses
            </Badge>
          }
        />
        <Tab
          label={
            <Badge
              badgeContent={completedAssignments.length}
              color="success"
              showZero
            >
              Completed Courses
            </Badge>
          }
        />
      </Tabs>

      {activeTab === 0 ? (
        activeAssignments.length > 0 ? (
          <Grid container spacing={3}>
            {activeAssignments.map(renderAssignmentCard)}
          </Grid>
        ) : (
          <Typography variant="body1" color="textSecondary">
            No active courses. All courses completed!
          </Typography>
        )
      ) : completedAssignments.length > 0 ? (
        <Grid container spacing={3}>
          {completedAssignments.map(renderAssignmentCard)}
        </Grid>
      ) : (
        <Typography variant="body1" color="textSecondary">
          No completed courses yet. Keep learning!
        </Typography>
      )}

      {renderAssignmentDialog()}

      {/* Practice Dialog */}
      <Dialog
        open={practiceDialogOpen}
        onClose={() => setPracticeDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Practice Session</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            {currentScenario?.description ||
              "Practice your sales skills with AI feedback."}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your Response"
            value={practiceResponse}
            onChange={(e) => setPracticeResponse(e.target.value)}
            sx={{ mb: 2 }}
          />
          {aiFeedback && (
            <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
              <Typography variant="h6" gutterBottom>
                AI Feedback
              </Typography>
              <Typography>{aiFeedback}</Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPracticeDialogOpen(false)}>Close</Button>
          <Button
            onClick={handleSubmitPractice}
            variant="contained"
            disabled={!practiceResponse || isSubmitting}
          >
            Get Feedback
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Module Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add Training Module</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Title"
            value={newModule.title}
            onChange={(e) =>
              setNewModule({ ...newModule, title: e.target.value })
            }
          />

          <TextField
            fullWidth
            multiline
            rows={4}
            margin="normal"
            label="Description"
            value={newModule.description}
            onChange={(e) =>
              setNewModule({ ...newModule, description: e.target.value })
            }
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Module Type</InputLabel>
            <Select
              value={newModule.type}
              onChange={(e) =>
                setNewModule({ ...newModule, type: e.target.value })
              }
              label="Module Type"
            >
              <MenuItem value={MODULE_TYPES.COURSE}>Course</MenuItem>
              <MenuItem value={MODULE_TYPES.QUIZ}>Quiz</MenuItem>
              <MenuItem value={MODULE_TYPES.VIDEO}>Video</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            label="Content URL"
            value={newModule.content}
            onChange={(e) =>
              setNewModule({ ...newModule, content: e.target.value })
            }
            helperText="Enter Google Slides URL or other content link"
          />

          <TextField
            fullWidth
            margin="normal"
            label="Duration"
            value={newModule.duration}
            onChange={(e) =>
              setNewModule({ ...newModule, duration: e.target.value })
            }
            helperText="e.g., '15 minutes'"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Assign To</InputLabel>
            <Select
              multiple
              value={newModule.assignedTo}
              onChange={(e) =>
                setNewModule({ ...newModule, assignedTo: e.target.value })
              }
              label="Assign To"
            >
              {agents.map((agent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  {agent.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddModule} variant="contained" color="primary">
            Add Module
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
};

export default Training;
