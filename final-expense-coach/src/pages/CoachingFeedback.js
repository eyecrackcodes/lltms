import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function CoachingFeedback() {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

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
          date: doc.data().date?.toDate()
        }));

        setSessions(sessionsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching coaching sessions:', error);
        setLoading(false);
      }
    };

    fetchSessions();
  }, [currentUser]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Coaching Journey
      </Typography>

      {sessions.length > 0 ? (
        <Stepper orientation="vertical">
          {sessions.map((session, index) => (
            <Step key={session.id} active={true}>
              <StepLabel>
                {session.date?.toLocaleDateString()}
              </StepLabel>
              <StepContent>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label="Focus Area"
                        color="primary"
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="body1">
                        {session.development?.focusArea}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Action Plan
                      </Typography>
                      <Typography variant="body2">
                        {session.development?.actionPlan}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Success Metrics
                      </Typography>
                      <Typography variant="body2">
                        {session.development?.successMetrics}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>No coaching sessions recorded yet.</Typography>
        </Paper>
      )}
    </Box>
  );
}

export default CoachingFeedback; 