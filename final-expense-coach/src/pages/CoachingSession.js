import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Avatar,
  LinearProgress,
  Divider,
  Snackbar,
  Alert,
  FormHelperText,
  CircularProgress
} from '@mui/material';
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const TIER_DEFINITIONS = {
  1: { sessions: 1, color: '#4caf50' },
  2: { sessions: 2, color: '#ff9800' },
  3: { sessions: 3, color: '#f44336' }
};

const SESSION_SECTIONS = {
  overview: {
    title: 'Session Overview',
    fields: [
      { 
        id: 'generalNotes', 
        label: 'How\'s everything going?', 
        type: 'textarea',
        required: true 
      },
      { 
        id: 'challenges', 
        label: 'Current Challenges', 
        type: 'textarea',
        required: true 
      },
    ]
  },
  kpis: {
    title: 'KPI Review',
    fields: [
      { 
        id: 'quotaProgress', 
        label: 'Monthly Quota Progress (%)', 
        type: 'number',
        min: 0,
        max: 100,
        required: true 
      },
      { 
        id: 'callVolume', 
        label: 'Weekly Call Volume', 
        type: 'number',
        min: 0,
        required: true 
      },
      { 
        id: 'conversionRate', 
        label: 'Conversion Rate (%)', 
        type: 'number',
        min: 0,
        max: 100,
        required: true 
      },
      { 
        id: 'avgPremium', 
        label: 'Average Premium ($)', 
        type: 'number',
        min: 0,
        required: true 
      },
      { 
        id: 'lastWeekFocus', 
        label: 'Progress on Last Week\'s Focus Area', 
        type: 'textarea',
        required: true 
      },
    ]
  },
  development: {
    title: 'Development Plan',
    fields: [
      { 
        id: 'focusArea', 
        label: 'Primary Focus Area for Next Week', 
        type: 'text',
        required: true 
      },
      { 
        id: 'actionPlan', 
        label: 'Specific Action Plan', 
        type: 'textarea',
        required: true,
        helperText: 'Detail the specific steps the agent will take to improve in the focus area'
      },
      { 
        id: 'successMetrics', 
        label: 'Success Metrics', 
        type: 'textarea',
        required: true,
        helperText: 'Define measurable outcomes that will indicate success'
      },
      {
        id: 'nextSessionDate',
        label: 'Next Coaching Session (Optional)',
        type: 'date',
        required: false
      }
    ]
  }
};

// Add new calendar collection helper function
const createCalendarEvent = async (db, sessionData, agentDetails) => {
  const calendarEvent = {
    title: `1:1 Coaching - ${agentDetails.firstName} ${agentDetails.lastName}`,
    startTime: sessionData.development.nextSessionDate,
    // Default to 1 hour coaching sessions
    endTime: new Date(new Date(sessionData.development.nextSessionDate).getTime() + 60 * 60 * 1000),
    type: 'coaching',
    attendees: [
      {
        id: sessionData.managerId,
        role: 'manager'
      },
      {
        id: sessionData.agentId,
        role: 'agent'
      }
    ],
    description: `
      Focus Area: ${sessionData.development.focusArea}
      
      Action Plan: ${sessionData.development.actionPlan}
      
      Success Metrics: ${sessionData.development.successMetrics}
    `.trim(),
    status: 'scheduled',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  // Add to calendar events collection
  return await addDoc(collection(db, 'calendarEvents'), calendarEvent);
};

// Add validation function
const validateSession = (sessionData) => {
  const errors = {};
  
  // Validate required fields
  if (!sessionData.agentId) errors.agent = 'Agent is required';
  
  // Validate KPIs
  if (!sessionData.kpis.quotaProgress) errors.quotaProgress = 'Quota progress is required';
  if (!sessionData.kpis.callVolume) errors.callVolume = 'Call volume is required';
  if (!sessionData.kpis.conversionRate) errors.conversionRate = 'Conversion rate is required';
  if (!sessionData.kpis.avgPremium) errors.avgPremium = 'Average premium is required';
  
  // Validate development plan
  if (!sessionData.development.focusArea) errors.focusArea = 'Focus area is required';
  if (!sessionData.development.actionPlan) errors.actionPlan = 'Action plan is required';
  if (!sessionData.development.successMetrics) errors.successMetrics = 'Success metrics are required';
  
  return errors;
};

function CoachingSession() {
  const { currentUser, userRole, isSuperAdmin } = useAuth();
  const [selectedAgent, setSelectedAgent] = useState('');
  const [agents, setAgents] = useState([]);
  const [sessionData, setSessionData] = useState({
    overview: {
      generalNotes: '',
      challenges: ''
    },
    kpis: {
      quotaProgress: '',
      callVolume: '',
      conversionRate: '',
      avgPremium: '',
      lastWeekFocus: ''
    },
    development: {
      focusArea: '',
      actionPlan: '',
      successMetrics: '',
      nextSessionDate: ''
    }
  });
  const [agentTier, setAgentTier] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchAgents = async () => {
      if (!currentUser) return;
      
      try {
        const db = getFirestore();
        let queryConstraints = [];

        // Build query based on user role
        if (userRole === 'director' || isSuperAdmin) {
          // Directors and super admins can coach everyone
          queryConstraints = [where('role', 'in', ['agent', 'sales_manager'])];
        } else if (userRole === 'sales_manager') {
          // Managers can only coach their agents
          queryConstraints = [
            where('role', '==', 'agent'),
            where('managerId', '==', currentUser.uid)
          ];
        }

        const agentsQuery = query(
          collection(db, 'users'),
          ...queryConstraints,
          orderBy('firstName')
        );

        const snapshot = await getDocs(agentsQuery);
        const agentsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            fullName: `${data.firstName} ${data.lastName} (${data.role})`
          };
        });

        console.log('Fetched agents:', agentsData); // Debug log
        setAgents(agentsData);
      } catch (error) {
        console.error('Error fetching agents:', error);
        setError('Failed to load agents');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have a user and a role
    if (currentUser && userRole) {
      fetchAgents();
    }
  }, [currentUser, userRole, isSuperAdmin]);

  const resetForm = () => {
    setSelectedAgent('');
    setSessionData({
      overview: {
        generalNotes: '',
        challenges: ''
      },
      kpis: {
        quotaProgress: '',
        callVolume: '',
        conversionRate: '',
        avgPremium: '',
        lastWeekFocus: ''
      },
      development: {
        focusArea: '',
        actionPlan: '',
        successMetrics: '',
        nextSessionDate: ''
      }
    });
    setSelectedTime('');
    setAgentTier(1);
  };

  const handleInputChange = (section, field) => (event) => {
    setSessionData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: event.target.value
      }
    }));
  };

  const validateForm = () => {
    if (!selectedAgent) {
      console.log('No agent selected');
      return false;
    }
    
    // Check required fields in each section
    for (const [sectionId, section] of Object.entries(SESSION_SECTIONS)) {
      for (const field of section.fields) {
        const value = sessionData[sectionId]?.[field.id];
        if (field.required && (value === undefined || value === '')) {
          console.log(`Missing required field: ${sectionId}.${field.id}, value:`, value);
          return false;
        }
      }
    }
    return true;
  };

  // Update handleSubmit with better error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form
      const errors = validateSession(sessionData);
      if (Object.keys(errors).length > 0) {
        console.log('Validation errors:', errors); // Debug log
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const db = getFirestore();
      
      // Format the session data
      const formattedData = {
        agentId: selectedAgent,
        managerId: currentUser.uid,
        date: serverTimestamp(),
        overview: {
          generalNotes: sessionData.overview.generalNotes.trim(),
          challenges: sessionData.overview.challenges.trim()
        },
        kpis: {
          quotaProgress: Number(sessionData.kpis.quotaProgress),
          callVolume: Number(sessionData.kpis.callVolume),
          conversionRate: Number(sessionData.kpis.conversionRate),
          avgPremium: Number(sessionData.kpis.avgPremium),
          lastWeekFocus: sessionData.kpis.lastWeekFocus.trim()
        },
        development: {
          focusArea: sessionData.development.focusArea.trim(),
          actionPlan: sessionData.development.actionPlan.trim(),
          successMetrics: sessionData.development.successMetrics.trim(),
          nextSessionDate: sessionData.development.nextSessionDate ? 
            new Date(sessionData.development.nextSessionDate) : null
        },
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('Saving session data:', formattedData); // Debug log

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'coachingSessions'), formattedData);
      console.log('Session saved with ID:', docRef.id); // Debug log

      setSnackbar({
        open: true,
        message: 'Coaching session saved successfully!',
        severity: 'success'
      });

      resetForm();
    } catch (error) {
      console.error('Error saving coaching session:', error);
      setError(`Failed to save coaching session: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add delete functionality
  const deleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this coaching session?')) {
      return;
    }

    try {
      const db = getFirestore();
      await deleteDoc(doc(db, 'coachingSessions', sessionId));
      
      setSnackbar({
        open: true,
        message: 'Coaching session deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      setSnackbar({
        open: true,
        message: `Error deleting session: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Update the development section fields to include time selection
  const developmentFields = SESSION_SECTIONS.development.fields.map(field => {
    if (field.id === 'nextSessionDate') {
      return [
        {
          ...field,
          label: 'Next Session Date',
          required: true
        },
        {
          id: 'nextSessionTime',
          label: 'Session Time',
          type: 'time',
          required: true,
          InputLabelProps: {
            shrink: true,
          },
          inputProps: {
            step: 900, // 15 min intervals
          }
        }
      ];
    }
    return field;
  }).flat();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        1:1 Coaching Session
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!error}>
              <InputLabel>Select Agent</InputLabel>
              <Select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                disabled={loading || !agents.length}
              >
                {loading ? (
                  <MenuItem disabled>Loading agents...</MenuItem>
                ) : agents.length === 0 ? (
                  <MenuItem disabled>No agents found</MenuItem>
                ) : (
                  agents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 24, height: 24 }}>
                          {agent.firstName?.charAt(0)}
                        </Avatar>
                        <Typography>
                          {agent.firstName} {agent.lastName}
                        </Typography>
                        <Chip
                          size="small"
                          label={agent.role}
                          color={agent.role === 'agent' ? 'primary' : 'secondary'}
                        />
                      </Stack>
                    </MenuItem>
                  ))
                )}
              </Select>
              {error && <FormHelperText>{error}</FormHelperText>}
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {selectedAgent && (
        <form onSubmit={handleSubmit}>
          {Object.entries(SESSION_SECTIONS).map(([sectionId, section]) => (
            <Paper key={sectionId} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {section.title}
              </Typography>
              <Grid container spacing={3}>
                {section.fields.map((field) => (
                  <Grid item xs={12} key={field.id}>
                    {field.type === 'date' && (
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            type="date"
                            label={field.label}
                            value={sessionData.development?.nextSessionDate || ''}
                            onChange={handleInputChange('development', 'nextSessionDate')}
                            InputLabelProps={{ shrink: true }}
                            required={field.required}
                            helperText="Optional: Schedule next coaching session"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            type="time"
                            label="Session Time"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                              step: 900 // 15 min intervals
                            }}
                            required={!!sessionData.development?.nextSessionDate}
                            helperText="Required if date is selected"
                          />
                        </Grid>
                      </Grid>
                    )}
                    {field.type === 'textarea' && (
                      <TextField
                        fullWidth
                        label={field.label}
                        multiline
                        rows={4}
                        value={sessionData[sectionId]?.[field.id] || ''}
                        onChange={handleInputChange(sectionId, field.id)}
                        required={field.required}
                        helperText={field.helperText}
                      />
                    )}
                    {field.type === 'number' && (
                      <TextField
                        fullWidth
                        label={field.label}
                        type="number"
                        value={sessionData[sectionId]?.[field.id] || ''}
                        onChange={handleInputChange(sectionId, field.id)}
                        required={field.required}
                        error={field.required && !sessionData[sectionId]?.[field.id]}
                        helperText={
                          field.required && !sessionData[sectionId]?.[field.id] 
                            ? 'This field is required' 
                            : field.helperText
                        }
                        InputProps={{
                          inputProps: { 
                            min: field.min,
                            max: field.max
                          }
                        }}
                      />
                    )}
                    {field.type === 'text' && (
                      <TextField
                        fullWidth
                        label={field.label}
                        value={sessionData[sectionId]?.[field.id] || ''}
                        onChange={handleInputChange(sectionId, field.id)}
                        required={field.required}
                        helperText={field.helperText}
                      />
                    )}
                  </Grid>
                ))}
              </Grid>
            </Paper>
          ))}
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? 'Saving...' : 'Save Coaching Session'}
          </Button>
        </form>
      )}

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default CoachingSession; 