import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import {
  Visibility as ViewIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { getTrainingAssignments } from "../../firebase/firebaseUtils";
import { PageHeader, LoadingState } from "../../components";

function TrainingAssignments() {
  console.log("[TrainingAssignments] rendering at:", window.location.pathname);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const fetchedAssignments = await getTrainingAssignments();
      setAssignments(fetchedAssignments);
    } catch (error) {
      console.error("Error loading assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "warning";
      case "assigned":
        return "info";
      case "overdue":
        return "error";
      default:
        return "default";
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Box>
      <PageHeader
        title="Training Assignments"
        breadcrumbs={[
          { label: "Training Management", path: "/training-management" },
          { label: "Assignments", path: "/training-management/assignments" },
        ]}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Agent</TableCell>
              <TableCell>Module</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Assigned Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>
                  <Typography variant="body2">
                    {`${assignment.agentName || "Unknown Agent"}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {assignment.agentEmail}
                  </Typography>
                </TableCell>
                <TableCell>{assignment.moduleTitle}</TableCell>
                <TableCell>
                  <Chip
                    label={assignment.moduleType.toUpperCase()}
                    size="small"
                    color={
                      assignment.moduleType === "course"
                        ? "primary"
                        : "secondary"
                    }
                  />
                </TableCell>
                <TableCell>
                  {format(assignment.assignedAt.toDate(), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>
                  {format(assignment.dueDate.toDate(), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={assignment.progress || 0}
                      sx={{ flexGrow: 1 }}
                    />
                    <Typography variant="caption">
                      {assignment.progress || 0}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={assignment.status.replace("_", " ").toUpperCase()}
                    size="small"
                    color={getStatusColor(assignment.status)}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton size="small">
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Assignment">
                    <IconButton size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default TrainingAssignments;
