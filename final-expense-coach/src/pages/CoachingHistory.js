import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { getFirestore, collection, query, where, orderBy, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function CoachingHistory() {
  const { currentUser, userRole } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterAgent, setFilterAgent] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch agents
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const db = getFirestore();
        // Query for both agents and managers
        const agentsQuery = query(
          collection(db, 'users'),
          where('role', 'in', ['agent', 'sales_manager', 'director'])
        );
        
        const snapshot = await getDocs(agentsQuery);
        const agentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          fullName: `${doc.data().firstName} ${doc.data().lastName} (${doc.data().role})`
        }));
        setAgents(agentsData);
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    };

    fetchAgents();
  }, []);

  // Fetch coaching sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!currentUser) return;

      try {
        const db = getFirestore();
        let baseQuery = query(
          collection(db, 'coachingSessions'),
          orderBy('date', 'desc')
        );

        // If user is not admin/superadmin, only show their team's sessions
        if (userRole === 'sales_manager') {
          baseQuery = query(
            collection(db, 'coachingSessions'),
            where('managerId', '==', currentUser.uid),
            orderBy('date', 'desc')
          );
        }

        // Add agent filter if selected
        if (filterAgent) {
          baseQuery = query(
            baseQuery,
            where('agentId', '==', filterAgent)
          );
        }

        const snapshot = await getDocs(baseQuery);
        const sessionsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate?.() || null,
            development: {
              ...data.development,
              nextSessionDate: data.development?.nextSessionDate?.toDate?.() || null
            }
          };
        });

        // Apply date filtering in memory
        let filteredSessions = sessionsData;
        if (dateRange.start) {
          const startDate = new Date(dateRange.start);
          startDate.setHours(0, 0, 0, 0);
          filteredSessions = filteredSessions.filter(
            session => session.date >= startDate
          );
        }
        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          filteredSessions = filteredSessions.filter(
            session => session.date <= endDate
          );
        }

        setSessions(filteredSessions);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setLoading(false);
      }
    };

    fetchSessions();
  }, [currentUser, userRole, filterAgent, dateRange]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getAgentName = (agentId) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? `${agent.firstName} ${agent.lastName}` : 'Unknown Agent';
  };

  const updateSession = async (sessionId, updatedData) => {
    try {
      const db = getFirestore();
      await updateDoc(doc(db, 'coachingSessions', sessionId), {
        ...updatedData,
        updatedAt: serverTimestamp()
      });

      setSnackbar({
        open: true,
        message: 'Session updated successfully',
        severity: 'success'
      });
      
      // Refresh sessions
      fetchSessions();
    } catch (error) {
      console.error('Error updating session:', error);
      setSnackbar({
        open: true,
        message: `Error updating session: ${error.message}`,
        severity: 'error'
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Coaching History
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Agent</InputLabel>
            <Select
              value={filterAgent}
              label="Filter by Agent"
              onChange={(e) => setFilterAgent(e.target.value)}
            >
              <MenuItem value="">All Agents</MenuItem>
              {agents.map((agent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  {agent.firstName} {agent.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Start Date"
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="End Date"
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Agent</TableCell>
              <TableCell>Focus Area</TableCell>
              <TableCell>KPIs</TableCell>
              <TableCell>Next Session</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((session) => (
                <TableRow 
                  key={session.id}
                  hover
                  onClick={() => setSelectedSession(session)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    {session.date ? session.date.toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>{getAgentName(session.agentId)}</TableCell>
                  <TableCell>{session.development?.focusArea}</TableCell>
                  <TableCell>
                    <Chip 
                      label={`Quota: ${session.kpis?.quotaProgress}%`} 
                      size="small" 
                      sx={{ mr: 1 }}
                    />
                    <Chip 
                      label={`Calls: ${session.kpis?.callVolume}`} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    {session.development?.nextSessionDate 
                      ? session.development.nextSessionDate.toLocaleDateString() 
                      : 'Not scheduled'}
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={sessions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Dialog 
        open={!!selectedSession} 
        onClose={() => setSelectedSession(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Coaching Session Details
          <IconButton
            onClick={() => setSelectedSession(null)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedSession.date 
                  ? selectedSession.date.toLocaleDateString() 
                  : 'Date not available'}
              </Typography>

              <Typography variant="subtitle1" gutterBottom>
                Agent: {getAgentName(selectedSession.agentId)}
              </Typography>
              
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Focus Area
              </Typography>
              <Typography paragraph>
                {selectedSession.development?.focusArea}
              </Typography>

              <Typography variant="subtitle1" color="primary" gutterBottom>
                Action Plan
              </Typography>
              <Typography paragraph>
                {selectedSession.development?.actionPlan}
              </Typography>

              <Typography variant="subtitle1" color="primary" gutterBottom>
                KPI Review
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Chip 
                  label={`Quota Progress: ${selectedSession.kpis?.quotaProgress}%`}
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip 
                  label={`Call Volume: ${selectedSession.kpis?.callVolume}`}
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip 
                  label={`Conversion Rate: ${selectedSession.kpis?.conversionRate}%`}
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip 
                  label={`Avg Premium: $${selectedSession.kpis?.avgPremium}`}
                  sx={{ mb: 1 }}
                />
              </Box>

              <Typography variant="subtitle1" color="primary" gutterBottom>
                Next Steps
              </Typography>
              <Typography paragraph>
                {selectedSession.development?.successMetrics}
              </Typography>

              {selectedSession.development?.nextSessionDate && (
                <>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    Next Session
                  </Typography>
                  <Typography>
                    {selectedSession.development.nextSessionDate.toLocaleString()}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default CoachingHistory; 