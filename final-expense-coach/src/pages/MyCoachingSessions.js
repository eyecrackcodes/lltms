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
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function MyCoachingSessions() {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!currentUser) return;

      try {
        const db = getFirestore();
        const sessionsQuery = query(
          collection(db, 'coachingSessions'),
          where('agentId', '==', currentUser.uid),
          orderBy('date', 'desc')
        );

        const snapshot = await getDocs(sessionsQuery);
        const sessionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate(),
          nextSessionDate: doc.data().development?.nextSessionDate?.toDate()
        }));

        setSessions(sessionsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setLoading(false);
      }
    };

    fetchSessions();
  }, [currentUser]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Coaching Sessions
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Focus Area</TableCell>
              <TableCell>KPIs Reviewed</TableCell>
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
                    {session.date?.toLocaleDateString()}
                  </TableCell>
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
                    {session.development?.nextSessionDate?.toLocaleDateString() || 'Not scheduled'}
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
                {selectedSession.date?.toLocaleDateString()}
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
                    {new Date(selectedSession.development.nextSessionDate).toLocaleString()}
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

export default MyCoachingSessions; 