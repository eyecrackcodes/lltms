import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  IconButton,
  List,
  ListItem,
  Radio,
  RadioGroup,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";

function QuizBuilder() {
  const [quiz, setQuiz] = useState({
    title: "",
    description: "",
    questions: [
      {
        question: "",
        type: "multiple_choice",
        options: [""],
        correctAnswer: 0,
      },
    ],
  });

  const addQuestion = () => {
    setQuiz({
      ...quiz,
      questions: [
        ...quiz.questions,
        {
          question: "",
          type: "multiple_choice",
          options: [""],
          correctAnswer: 0,
        },
      ],
    });
  };

  const addOption = (questionIndex) => {
    const newQuestions = [...quiz.questions];
    newQuestions[questionIndex].options.push("");
    setQuiz({ ...quiz, questions: newQuestions });
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...quiz.questions];
    newQuestions[index][field] = value;
    setQuiz({ ...quiz, questions: newQuestions });
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const newQuestions = [...quiz.questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuiz({ ...quiz, questions: newQuestions });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Create Quiz
      </Typography>

      <TextField
        fullWidth
        label="Quiz Title"
        value={quiz.title}
        onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        multiline
        rows={2}
        label="Quiz Description"
        value={quiz.description}
        onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
        sx={{ mb: 4 }}
      />

      {quiz.questions.map((question, questionIndex) => (
        <Paper key={questionIndex} sx={{ p: 2, mb: 2 }}>
          <TextField
            fullWidth
            label={`Question ${questionIndex + 1}`}
            value={question.question}
            onChange={(e) =>
              updateQuestion(questionIndex, "question", e.target.value)
            }
            sx={{ mb: 2 }}
          />

          <List>
            {question.options.map((option, optionIndex) => (
              <ListItem key={optionIndex} sx={{ px: 0 }}>
                <Radio
                  checked={question.correctAnswer === optionIndex}
                  onChange={() =>
                    updateQuestion(questionIndex, "correctAnswer", optionIndex)
                  }
                />
                <TextField
                  fullWidth
                  label={`Option ${optionIndex + 1}`}
                  value={option}
                  onChange={(e) =>
                    updateOption(questionIndex, optionIndex, e.target.value)
                  }
                />
                <IconButton
                  onClick={() => {
                    const newQuestions = [...quiz.questions];
                    newQuestions[questionIndex].options =
                      question.options.filter(
                        (_, index) => index !== optionIndex
                      );
                    setQuiz({ ...quiz, questions: newQuestions });
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>

          <Button
            startIcon={<AddIcon />}
            onClick={() => addOption(questionIndex)}
            sx={{ mt: 1 }}
          >
            Add Option
          </Button>
        </Paper>
      ))}

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={addQuestion}
        sx={{ mb: 2 }}
      >
        Add Question
      </Button>

      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={() => {
          console.log("Quiz data:", quiz);
          // Add save logic here
        }}
      >
        Save Quiz
      </Button>
    </Box>
  );
}

export default QuizBuilder;
