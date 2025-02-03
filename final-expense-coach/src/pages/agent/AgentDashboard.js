import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import { Timeline, Assessment, School, Star } from "@mui/icons-material";

function AgentDashboard() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [agentData, setAgentData] = useState({
    callGrades: [],
    upcomingTraining: [],
    performance: {
      callScore: 0,
      completedCalls: 0,
      salesMetrics: {
        weeklyApps: 0,
        monthlyApps: 0,
        weeklyIssued: 0,
        monthlyIssued: 0,
      },
    },
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAgentData = async () => {
      if (!currentUser?.uid) return;

      try {
        const db = getFirestore();

        // Get agent's basic info
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          throw new Error("Agent document not found");
        }

        // Get agent's call grades
        const callGradesRef = collection(db, "callGrades");
        const q = query(
          callGradesRef,
          where("agentId", "==", currentUser.uid),
          limit(5)
        );

        const callGradesSnapshot = await getDocs(q);
        const callGrades = [];
        callGradesSnapshot.forEach((doc) => {
          callGrades.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setAgentData({
          ...agentData,
          callGrades,
          performance: userDoc.data()?.performance || {
            callScore: 0,
            completedCalls: 0,
            salesMetrics: {
              weeklyApps: 0,
              monthlyApps: 0,
              weeklyIssued: 0,
              monthlyIssued: 0,
            },
          },
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching agent data:", error);
        setError("Failed to fetch agent data");
        setLoading(false);
      }
    };

    fetchAgentData();
  }, [currentUser?.uid]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome, {currentUser?.firstName || currentUser?.email}
      </Typography>

      <Grid container spacing={3}>
        {/* Performance Summary Card */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Assessment sx={{ mr: 1 }} color="primary" />
              <Typography variant="h6">Performance Summary</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Weekly Applications
                    </Typography>
                    <Typography variant="h4">
                      {agentData.performance.salesMetrics.weeklyApps}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Monthly Applications
                    </Typography>
                    <Typography variant="h4">
                      {agentData.performance.salesMetrics.monthlyApps}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Recent Call Grades */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Star sx={{ mr: 1 }} color="primary" />
              <Typography variant="h6">My Recent Call Grades</Typography>
            </Box>
            {agentData.callGrades.length > 0 ? (
              <List>
                {agentData.callGrades.map((grade, index) => (
                  <React.Fragment key={grade.id}>
                    <ListItem>
                      <ListItemText
                        primary={`Score: ${grade.score}%`}
                        secondary={`${new Date(
                          grade.date
                        ).toLocaleDateString()} - ${grade.feedback}`}
                      />
                    </ListItem>
                    {index < agentData.callGrades.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No call grades available yet
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Upcoming Training */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <School sx={{ mr: 1 }} color="primary" />
              <Typography variant="h6">Upcoming Training</Typography>
            </Box>
            {agentData.upcomingTraining.length > 0 ? (
              <List>
                {agentData.upcomingTraining.map((training, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={training.title}
                        secondary={`Scheduled for: ${new Date(
                          training.date
                        ).toLocaleDateString()}`}
                      />
                    </ListItem>
                    {index < agentData.upcomingTraining.length - 1 && (
                      <Divider />
                    )}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No upcoming training sessions scheduled
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default AgentDashboard;
