import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Chip,
  Box,
  Button,
} from "@mui/material";
import { getAllModuleAssignments } from "../../firebase/firebaseUtils";

function TrainingAssignments() {
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    getAllModuleAssignments()
      .then((data) => {
        setAssignments(data);
      })
      .catch((error) => {
        console.error("Error getting all module assignments:", error);
      });
  }, []);

  const handleEdit = (assignment) => {
    // Implement edit functionality
  };

  const handleRemove = (id) => {
    // Implement remove functionality
  };

  const getAgentDisplay = (assignment) => {
    console.log("Rendering agent display for:", assignment); // Debug log

    if (assignment.agent) {
      const displayName =
        assignment.agent.displayName ||
        `${assignment.agent.firstName || ""} ${
          assignment.agent.lastName || ""
        }`.trim() ||
        assignment.agent.email;

      return (
        <Box>
          <Typography variant="body2">{displayName}</Typography>
          {assignment.agent.email && displayName !== assignment.agent.email && (
            <Typography variant="caption" color="textSecondary">
              {assignment.agent.email}
            </Typography>
          )}
        </Box>
      );
    }

    // If we have an agentId but no agent data, show the ID
    if (assignment.agentId) {
      return (
        <Box>
          <Typography variant="body2" color="error">
            Agent Not Found
          </Typography>
          <Typography variant="caption" color="textSecondary">
            ID: {assignment.agentId}
          </Typography>
        </Box>
      );
    }

    return "No Agent Assigned";
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ mb: 4 }}>
        Training Assignments
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Agent</TableCell>
              <TableCell>Module</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Assigned Date</TableCell>
              <TableCell>Assigned By</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>{getAgentDisplay(assignment)}</TableCell>
                <TableCell>{assignment.module?.title}</TableCell>
                <TableCell>{assignment.module?.type}</TableCell>
                <TableCell>
                  {assignment.assignedAt?.seconds
                    ? new Date(
                        assignment.assignedAt.seconds * 1000
                      ).toLocaleDateString()
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {assignment.assignedBy ? (
                    <Typography variant="body2">
                      {assignment.assignedByUser?.displayName ||
                        assignment.assignedByUser?.email ||
                        assignment.assignedBy}
                    </Typography>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={assignment.status || "assigned"}
                    color={
                      assignment.status === "completed" ? "success" : "primary"
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>{assignment.progress || 0}%</TableCell>
                <TableCell>
                  <Button
                    color="primary"
                    size="small"
                    onClick={() => handleEdit(assignment)}
                    sx={{ mr: 1 }}
                  >
                    EDIT
                  </Button>
                  <Button
                    color="error"
                    size="small"
                    onClick={() => handleRemove(assignment.id)}
                  >
                    REMOVE
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default TrainingAssignments;
