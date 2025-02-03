import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
  Snackbar,
} from "@mui/material";
import { addTrainingModule } from "../../firebase/firebaseUtils";
import CourseTemplate from "./templates/CourseTemplate";
import QuizTemplate from "./templates/QuizTemplate";
import { PageHeader } from "../../components";

function TrainingModuleManager() {
  const [moduleType, setModuleType] = useState("course");
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleTypeChange = (event, newValue) => {
    setModuleType(newValue);
  };

  const handleSave = async (moduleData) => {
    try {
      await addTrainingModule({
        ...moduleData,
        createdAt: new Date(),
        status: "active",
      });

      setFeedback({
        open: true,
        message: `${
          moduleType === "course" ? "Course" : "Quiz"
        } created successfully!`,
        severity: "success",
      });

      // Optional: Reset form or redirect
    } catch (error) {
      console.error("Error creating module:", error);
      setFeedback({
        open: true,
        message: "Error creating module. Please try again.",
        severity: "error",
      });
    }
  };

  const handleCloseFeedback = () => {
    setFeedback({ ...feedback, open: false });
  };

  return (
    <Box>
      <PageHeader
        title="Create Training Module"
        breadcrumbs={[
          { label: "Training Management", path: "/training-management" },
          { label: "Create Module", path: "/training-management/create" },
        ]}
      />

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={moduleType}
          onChange={handleTypeChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab value="course" label="Course" />
          <Tab value="quiz" label="Quiz" />
        </Tabs>
      </Paper>

      <Paper sx={{ p: 3 }}>
        {moduleType === "course" ? (
          <CourseTemplate onSave={handleSave} />
        ) : (
          <QuizTemplate onSave={handleSave} />
        )}
      </Paper>

      <Snackbar
        open={feedback.open}
        autoHideDuration={6000}
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseFeedback}
          severity={feedback.severity}
          sx={{ width: "100%" }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default TrainingModuleManager;
