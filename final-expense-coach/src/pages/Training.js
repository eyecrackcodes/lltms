import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getAgentAssignments } from "../firebase/firebaseUtils";
import {
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Box,
} from "@mui/material";

const Training = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        if (!currentUser?.uid) {
          console.log("No user ID available");
          return;
        }

        console.log("Fetching assignments for user ID:", currentUser.uid);
        const userAssignments = await getAgentAssignments(currentUser.uid);
        console.log("Raw assignments:", userAssignments); // Debug log
        setAssignments(userAssignments);
      } catch (error) {
        console.error("Error loading assignments:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, [currentUser]);

  const handleStartAssignment = (assignmentId) => {
    // TODO: Implement navigation to the course content
    console.log("Starting assignment:", assignmentId);
  };

  if (loading) {
    return <Box p={3}>Loading assignments...</Box>;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Training Materials
      </Typography>

      {/* New Agent Onboarding Section */}
      <Box mb={4}>
        <Typography variant="h5" gutterBottom>
          New Agent Onboarding
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Essential training for new agents
        </Typography>
        <Box mt={2}>
          {assignments
            .filter((a) => a.moduleType === "course")
            .map((assignment) => (
              <Card key={assignment.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6">{assignment.moduleTitle}</Typography>
                  <Typography color="textSecondary" gutterBottom>
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </Typography>
                  <Box mt={2} mb={1}>
                    <LinearProgress
                      variant="determinate"
                      value={assignment.progress || 0}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="textSecondary">
                      Progress: {assignment.progress || 0}%
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleStartAssignment(assignment.moduleId)}
                    sx={{ mt: 1 }}
                  >
                    {assignment.progress > 0
                      ? "Continue Course"
                      : "Start Course"}
                  </Button>
                </CardContent>
              </Card>
            ))}
        </Box>
      </Box>

      {/* Sales Training Section */}
      <Box mb={4}>
        <Typography variant="h5" gutterBottom>
          Sales Training
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Advanced sales techniques
        </Typography>
        {/* Add sales training specific assignments here */}
      </Box>

      {/* Compliance & Regulations Section */}
      <Box mb={4}>
        <Typography variant="h5" gutterBottom>
          Compliance & Regulations
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Required compliance training
        </Typography>
        {/* Add compliance training specific assignments here */}
      </Box>

      {assignments.length === 0 && (
        <Typography variant="body1" color="textSecondary">
          No assignments found. Check back later for new training materials.
        </Typography>
      )}
    </Box>
  );
};

export default Training;
