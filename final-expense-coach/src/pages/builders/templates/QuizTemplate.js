import React, { useState } from "react";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Grid,
  Button,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

function QuizTemplate({ onSave }) {
  const [quizData, setQuizData] = useState({
    title: "",
    description: "",
    type: "quiz",
    timeLimit: "",
    passingScore: "70",
    questions: [
      {
        question: "",
        type: "multiple_choice",
        options: ["", ""],
        correctAnswer: 0,
        points: 1,
      },
    ],
  });

  const addQuestion = () => {
    setQuizData({
      ...quizData,
      questions: [
        ...quizData.questions,
        {
          question: "",
          type: "multiple_choice",
          options: ["", ""],
          correctAnswer: 0,
          points: 1,
        },
      ],
    });
  };

  const addOption = (questionIndex) => {
    const newQuestions = [...quizData.questions];
    newQuestions[questionIndex].options.push("");
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const removeQuestion = (questionIndex) => {
    const newQuestions = quizData.questions.filter(
      (_, index) => index !== questionIndex
    );
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const removeOption = (questionIndex, optionIndex) => {
    const newQuestions = [...quizData.questions];
    newQuestions[questionIndex].options = newQuestions[
      questionIndex
    ].options.filter((_, index) => index !== optionIndex);
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(quizData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Quiz Title"
            value={quizData.title}
            onChange={(e) =>
              setQuizData({ ...quizData, title: e.target.value })
            }
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Quiz Description"
            value={quizData.description}
            onChange={(e) =>
              setQuizData({ ...quizData, description: e.target.value })
            }
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Time Limit (minutes)"
            type="number"
            value={quizData.timeLimit}
            onChange={(e) =>
              setQuizData({ ...quizData, timeLimit: e.target.value })
            }
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Passing Score (%)"
            type="number"
            value={quizData.passingScore}
            onChange={(e) =>
              setQuizData({ ...quizData, passingScore: e.target.value })
            }
            inputProps={{ min: 0, max: 100 }}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Questions
          </Typography>
          {quizData.questions.map((question, questionIndex) => (
            <Paper key={questionIndex} sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={11}>
                  <TextField
                    fullWidth
                    label={`Question ${questionIndex + 1}`}
                    value={question.question}
                    onChange={(e) => {
                      const newQuestions = [...quizData.questions];
                      newQuestions[questionIndex].question = e.target.value;
                      setQuizData({ ...quizData, questions: newQuestions });
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={1}>
                  <IconButton
                    onClick={() => removeQuestion(questionIndex)}
                    disabled={quizData.questions.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Options:
                  </Typography>
                  {question.options.map((option, optionIndex) => (
                    <Box
                      key={optionIndex}
                      sx={{ display: "flex", alignItems: "center", mb: 1 }}
                    >
                      <Radio
                        checked={question.correctAnswer === optionIndex}
                        onChange={() => {
                          const newQuestions = [...quizData.questions];
                          newQuestions[questionIndex].correctAnswer =
                            optionIndex;
                          setQuizData({ ...quizData, questions: newQuestions });
                        }}
                      />
                      <TextField
                        fullWidth
                        size="small"
                        value={option}
                        onChange={(e) => {
                          const newQuestions = [...quizData.questions];
                          newQuestions[questionIndex].options[optionIndex] =
                            e.target.value;
                          setQuizData({ ...quizData, questions: newQuestions });
                        }}
                        required
                      />
                      <IconButton
                        onClick={() => removeOption(questionIndex, optionIndex)}
                        disabled={question.options.length <= 2}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => addOption(questionIndex)}
                    size="small"
                  >
                    Add Option
                  </Button>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Points"
                    type="number"
                    value={question.points}
                    onChange={(e) => {
                      const newQuestions = [...quizData.questions];
                      newQuestions[questionIndex].points =
                        parseInt(e.target.value) || 1;
                      setQuizData({ ...quizData, questions: newQuestions });
                    }}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              </Grid>
            </Paper>
          ))}
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addQuestion}
            sx={{ mt: 2 }}
          >
            Add Question
          </Button>
        </Grid>

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
          >
            Create Quiz
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}

export default QuizTemplate;
