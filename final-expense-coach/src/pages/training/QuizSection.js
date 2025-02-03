import React, { useState } from "react";
import {
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Button,
  Paper,
  Alert,
} from "@mui/material";

const QuizSection = ({ questions, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState(null);

  const handleAnswer = async (value) => {
    const newAnswers = { ...answers, [currentQuestion]: value };
    setAnswers(newAnswers);

    // Get AI feedback on the answer
    try {
      const response = await fetch("/api/quiz-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questions[currentQuestion],
          answer: value,
          context: questions[currentQuestion].context,
        }),
      });

      const feedbackData = await response.json();
      setFeedback(feedbackData.feedback);
    } catch (error) {
      console.error("Error getting AI feedback:", error);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((curr) => curr + 1);
      setFeedback(null);
    } else {
      onComplete(answers);
    }
  };

  const question = questions[currentQuestion];

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Question {currentQuestion + 1} of {questions.length}
      </Typography>

      <Typography variant="body1" sx={{ mb: 3 }}>
        {question.text}
      </Typography>

      <FormControl component="fieldset">
        <RadioGroup
          value={answers[currentQuestion] || ""}
          onChange={(e) => handleAnswer(e.target.value)}
        >
          {question.options.map((option, index) => (
            <FormControlLabel
              key={index}
              value={option}
              control={<Radio />}
              label={option}
            />
          ))}
        </RadioGroup>
      </FormControl>

      {feedback && (
        <Alert severity={feedback.correct ? "success" : "info"} sx={{ mt: 2 }}>
          {feedback.message}
        </Alert>
      )}

      <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
        <Button
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion((curr) => curr - 1)}
        >
          Previous
        </Button>
        <Button
          variant="contained"
          disabled={!answers[currentQuestion]}
          onClick={handleNext}
        >
          {currentQuestion === questions.length - 1
            ? "Complete Quiz"
            : "Next Question"}
        </Button>
      </Box>
    </Paper>
  );
};

export default QuizSection;
