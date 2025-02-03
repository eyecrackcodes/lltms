import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Container,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
} from "@mui/icons-material";
import Confetti from "react-confetti";
import {
  getTrainingModules,
  updateAssignmentProgress,
} from "../../firebase/firebaseUtils";
import { LoadingState } from "../../components";
import QuizSection from "./QuizSection";
import { useParams, useNavigate } from "react-router-dom";
import { getDoc, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../firebase/firebase";

// Video component
const VideoSection = ({ videoUrl }) => {
  return (
    <Box sx={{ width: "100%", mb: 3 }}>
      <video
        controls
        width="100%"
        style={{ maxHeight: "400px", objectFit: "contain" }}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </Box>
  );
};

const CourseContent = ({ moduleId, assignment, onBack }) => {
  const { moduleId: urlModuleId } = useParams();
  const [moduleContent, setModuleContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [showConfetti, setShowConfetti] = useState(false);

  const auth = getAuth();

  useEffect(() => {
    const loadModuleContent = async () => {
      try {
        console.log("[CourseContent] rendering for module:", urlModuleId);
        const moduleRef = doc(db, "trainingModules", urlModuleId);
        const moduleDoc = await getDoc(moduleRef);

        if (!moduleDoc.exists()) {
          throw new Error("Module not found");
        }

        const moduleData = {
          id: moduleDoc.id,
          ...moduleDoc.data(),
        };

        console.log("Loaded module content:", moduleData);
        setModuleContent(moduleData);
        setError(null);
      } catch (err) {
        console.log("Error loading module content:", err);
        setError(err.message);
        setSnackbar({
          open: true,
          message: "Error loading course content",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (urlModuleId) {
      loadModuleContent();
    }
  }, [urlModuleId]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSectionComplete = async () => {
    if (!moduleContent?.sections) return;

    const updatedSections = [...moduleContent.sections];
    updatedSections[currentSection].completed = true;
    setModuleContent({ ...moduleContent, sections: updatedSections });

    const completedSections = updatedSections.filter(
      (section) => section.completed
    ).length;
    const newProgress = Math.round(
      (completedSections / moduleContent.sections.length) * 100
    );
    setProgress(newProgress);

    try {
      // If this is a retake, create a new completion record
      if (assignment.id.includes("_retake_")) {
        // You might want to store completion history in a separate collection
        await updateAssignmentProgress(assignment.id, newProgress, {
          completedAt: new Date(),
          isRetake: true,
        });
      } else {
        await updateAssignmentProgress(assignment.id, newProgress);
      }

      if (currentSection < moduleContent.sections.length - 1) {
        setCurrentSection(currentSection + 1);
      } else if (newProgress === 100) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const handleQuizComplete = (answers) => {
    // Handle quiz completion logic
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Container>
    );
  }

  if (!moduleContent) {
    return (
      <Container>
        <Typography>No content available for this module.</Typography>
      </Container>
    );
  }

  const currentSection = 0;
  const currentSectionContent = moduleContent.sections?.[currentSection];

  const renderSectionContent = (section) => {
    switch (section.type) {
      case "video":
        return <VideoSection videoUrl={section.videoUrl} />;
      case "quiz":
        return (
          <QuizSection
            questions={section.questions}
            onComplete={handleQuizComplete}
          />
        );
      default:
        return (
          <Typography
            variant="body1"
            component="div"
            sx={{ whiteSpace: "pre-line" }}
          >
            {section.content}
          </Typography>
        );
    }
  };

  return (
    <Container>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {moduleContent.title}
        </Typography>

        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          {moduleContent.description}
        </Typography>

        {moduleContent.duration && (
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Duration: {moduleContent.duration}
          </Typography>
        )}

        <Box sx={{ my: 3 }}>
          {moduleContent.type === "course" && (
            <div
              dangerouslySetInnerHTML={{
                __html: moduleContent.courseContent || "",
              }}
            />
          )}

          {moduleContent.type === "video" && moduleContent.content && (
            <Box sx={{ position: "relative", paddingTop: "56.25%", mb: 2 }}>
              <iframe
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                }}
                src={moduleContent.content}
                title={moduleContent.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </Box>
          )}

          {moduleContent.type === "quiz" && moduleContent.questions && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Quiz Questions
              </Typography>
              {moduleContent.questions.map((question, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {index + 1}. {question.text}
                  </Typography>
                  {/* Add quiz question rendering here */}
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ mt: 3 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ mb: 1 }}
          />
          <Typography variant="body2" color="textSecondary">
            Progress: {progress}%
          </Typography>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CourseContent;
