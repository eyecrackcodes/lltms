import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Button,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";

function ModuleCard({ module, onAssign, onStart, isAdmin }) {
  if (!module) return null;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {module.title}
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          {module.description}
        </Typography>
        {module.progress !== undefined && (
          <Box mt={2} mb={1}>
            <LinearProgress
              variant="determinate"
              value={module.progress}
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="textSecondary">
              Progress: {module.progress}%
            </Typography>
          </Box>
        )}
      </CardContent>
      <CardActions>
        {onStart && (
          <Button
            size="small"
            startIcon={<PlayIcon />}
            onClick={() => onStart(module)}
          >
            {module.progress > 0 ? "Continue" : "Start"}
          </Button>
        )}
        {isAdmin && onAssign && (
          <Button
            size="small"
            startIcon={<AssignmentIcon />}
            onClick={() => onAssign(module)}
          >
            Assign
          </Button>
        )}
      </CardActions>
    </Card>
  );
}

export default ModuleCard;
