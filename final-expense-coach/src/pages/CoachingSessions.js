import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  IconButton,
  Chip,
  Stack,
  TablePagination,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { getFirestore, collection, query, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

// Mock data
const mockAgents = [
  { id: 1, name: "John Smith" },
  { id: 2, name: "Sarah Johnson" },
  { id: 3, name: "Mike Wilson" },
];

const sessionTypes = [
  { id: "performance", label: "Performance Review" },
  { id: "training", label: "Training" },
  { id: "call_review", label: "Call Review" },
  { id: "development", label: "Development Plan" },
];

function CoachingSessions() {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    managerId: "",
    agentId: "",
    notes: "",
    actionItems: "",
    followUpDate: "",
  });
  const [selectedAgent, setSelectedAgent] = useState("");
  const [sessionType, setSessionType] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [actionItems, setActionItems] = useState("");
  const [editingSession, setEditingSession] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterAgent, setFilterAgent] = useState('');
  const [agents, setAgents] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    // Load users and sessions from localStorage
    const savedUsers = localStorage.getItem("users");
    const savedSessions = localStorage.getItem("coachingSessions");

    if (savedUsers) setUsers(JSON.parse(savedUsers));
    if (savedSessions) setSessions(JSON.parse(savedSessions));
  }, []);

  useEffect(() => {
    const fetchAgents = async () => {
      const db = getFirestore();
      const agentsSnapshot = await getDocs(collection(db, 'users'));
      const agentsData = agentsSnapshot.docs
        .filter(doc => doc.data().role === 'agent')
        .map(doc => ({
          id: doc.id,
          name: `${doc.data().firstName} ${doc.data().lastName}`
        }));
      setAgents(agentsData);
    };

    fetchAgents();
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const db = getFirestore();
        let sessionsQuery = query(
          collection(db, 'coachingSessions'),
          orderBy('date', 'desc'),
          limit(rowsPerPage)
        );

        if (filterAgent) {
          sessionsQuery = query(
            sessionsQuery,
            where('agentId', '==', filterAgent)
          );
        }

        const snapshot = await getDocs(sessionsQuery);
        const sessionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate()
        }));

        setSessions(sessionsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setLoading(false);
      }
    };

    fetchSessions();
  }, [filterAgent, rowsPerPage, page]);

  const getManagerAgents = (managerId) => {
    return users.filter((user) => user.managerId === managerId);
  };

  const handleSave = () => {
    const newSession = {
      id: Date.now(),
      ...formData,
      managerName: users.find((u) => u.id === formData.managerId)?.name,
      agentName: users.find((u) => u.id === formData.agentId)?.name,
    };

    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    localStorage.setItem("coachingSessions", JSON.stringify(updatedSessions));
    setOpenDialog(false);
  };

  const getManagers = () => users.filter((user) => user.role === "Manager");

  const validateForm = () => {
    const errors = {};
    if (!selectedAgent) errors.agent = "Please select an agent";
    if (!sessionType) errors.type = "Please select a session type";
    if (!sessionDate) errors.date = "Please select a date";
    if (!sessionNotes.trim()) errors.notes = "Please provide session notes";
    return errors;
  };

  const handleSubmit = () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const sessionData = {
      id: editingSession ? editingSession.id : Date.now(),
      agentId: selectedAgent,
      agentName: mockAgents.find((a) => a.id === selectedAgent)?.name,
      type: sessionType,
      date: sessionDate,
      notes: sessionNotes,
      actionItems: actionItems,
      status: new Date(sessionDate) > new Date() ? "Scheduled" : "Completed",
    };

    const updatedSessions = editingSession
      ? sessions.map((s) => (s.id === editingSession.id ? sessionData : s))
      : [...sessions, sessionData];

    setSessions(updatedSessions);
    localStorage.setItem("coachingSessions", JSON.stringify(updatedSessions));

    setSubmitSuccess(true);
    resetForm();
    setTimeout(() => setSubmitSuccess(false), 3000);
  };

  const handleEdit = (session) => {
    setEditingSession(session);
    setSelectedAgent(session.agentId);
    setSessionType(session.type);
    setSessionDate(session.date);
    setSessionNotes(session.notes);
    setActionItems(session.actionItems || "");
    setOpenDialog(true);
  };

  const handleDelete = (sessionId) => {
    if (window.confirm("Are you sure you want to delete this session?")) {
      const updatedSessions = sessions.filter((s) => s.id !== sessionId);
      setSessions(updatedSessions);
      localStorage.setItem("coachingSessions", JSON.stringify(updatedSessions));
    }
  };

  const resetForm = () => {
    setSelectedAgent("");
    setSessionType("");
    setSessionDate("");
    setSessionNotes("");
    setActionItems("");
    setFormErrors({});
    setEditingSession(null);
    setOpenDialog(false);
  };

  const getStatusColor = (status) => {
    return status === "Completed" ? "success" : "warning";
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewSession = (session) => {
    setSelectedSession(session);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">Coaching Sessions</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Schedule Session
        </Button>
      </Box>

      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Session {editingSession ? "updated" : "scheduled"} successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Agent</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{session.agentName}</TableCell>
                    <TableCell>
                      {new Date(session.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{session.type}</TableCell>
                    <TableCell>
                      <Chip
                        label={session.status}
                        color={getStatusColor(session.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{session.notes}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(session)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(session.id)}
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

      <Dialog open={openDialog} onClose={resetForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSession
            ? "Edit Coaching Session"
            : "Schedule Coaching Session"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              type="date"
              label="Session Date"
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel>Manager</InputLabel>
              <Select
                value={formData.managerId}
                label="Manager"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    managerId: e.target.value,
                    agentId: "", // Reset agent when manager changes
                  }))
                }
              >
                {getManagers().map((manager) => (
                  <MenuItem key={manager.id} value={manager.id}>
                    {manager.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {formData.managerId && (
              <FormControl fullWidth>
                <InputLabel>Agent</InputLabel>
                <Select
                  value={formData.agentId}
                  label="Agent"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      agentId: e.target.value,
                    }))
                  }
                >
                  {getManagerAgents(formData.managerId).map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              multiline
              rows={4}
              label="Session Notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
            />

            <TextField
              multiline
              rows={3}
              label="Action Items"
              value={formData.actionItems}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  actionItems: e.target.value,
                }))
              }
            />

            <TextField
              type="date"
              label="Follow-up Date"
              value={formData.followUpDate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  followUpDate: e.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetForm}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingSession ? "Update" : "Schedule"}
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 3, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Coaching Sessions
        </Typography>

        <Box sx={{ mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Agent</InputLabel>
            <Select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              label="Filter by Agent"
            >
              <MenuItem value="">All Agents</MenuItem>
              {agents.map((agent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  {agent.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Agent</TableCell>
                <TableCell>Focus Area</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{session.date?.toLocaleDateString()}</TableCell>
                  <TableCell>
                    {agents.find(a => a.id === session.agentId)?.name}
                  </TableCell>
                  <TableCell>{session.development?.focusArea}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewSession(session)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={-1}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </Box>

      <Dialog
        open={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Coaching Session Details - {selectedSession?.date?.toLocaleDateString()}
        </DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Box sx={{ p: 2 }}>
              {/* Session details */}
              <Typography variant="h6" gutterBottom>
                Focus Area
              </Typography>
              <Typography paragraph>
                {selectedSession.development?.focusArea}
              </Typography>

              <Typography variant="h6" gutterBottom>
                Action Plan
              </Typography>
              <Typography paragraph>
                {selectedSession.development?.actionPlan}
              </Typography>

              <Typography variant="h6" gutterBottom>
                Success Metrics
              </Typography>
              <Typography paragraph>
                {selectedSession.development?.successMetrics}
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default CoachingSessions;
