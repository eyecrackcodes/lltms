import React, { useState, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormLabel,
  Snackbar,
  Alert,
  Autocomplete,
} from "@mui/material";
import {
  getTrainingModules,
  getAgents,
  assignTrainingModule,
  addTrainingModule,
} from "../../firebase/firebaseUtils";

function TrainingManagement() {
  const [modules, setModules] = useState([]);
  const [agents, setAgents] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [newModule, setNewModule] = useState({
    title: "",
    description: "",
    type: "",
    content: "",
    duration: "",
    contentType: "internal", // 'internal' or 'external'
    questions: [], // for quiz type
    courseContent: "", // for internal course content
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success", // 'success' | 'error' | 'info' | 'warning'
  });
  const [loading, setLoading] = useState(true);

  // Fetch modules and agents
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modulesList, agentsList] = await Promise.all([
          getTrainingModules(),
          getAgents(),
        ]);
        console.log("Fetched agents:", agentsList); // Debug log
        setModules(modulesList);
        setAgents(agentsList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCreateModule = async () => {
    try {
      if (!newModule.title || !newModule.type) {
        setSnackbar({
          open: true,
          message: "Please fill in all required fields",
          severity: "error",
        });
        return;
      }

      const moduleData = {
        ...newModule,
        createdAt: new Date(),
      };

      await addTrainingModule(moduleData);
      setOpenCreate(false);
      // Refresh modules list
      const updatedModules = await getTrainingModules();
      setModules(updatedModules);
      setNewModule({
        title: "",
        description: "",
        type: "",
        content: "",
        duration: "",
        contentType: "internal",
        questions: [],
        courseContent: "",
      });
      setSnackbar({
        open: true,
        message: "Training module created successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error creating module:", error);
      setSnackbar({
        open: true,
        message: error.message || "Error creating training module",
        severity: "error",
      });
    }
  };

  const handleAssignModule = async () => {
    try {
      await assignTrainingModule(selectedModule.id, selectedAgents);
      setOpenAssign(false);
      setSelectedAgents([]);
    } catch (error) {
      console.error("Error assigning module:", error);
    }
  };

  const handleEditorChange = (content, editor) => {
    setNewModule({ ...newModule, courseContent: content });
    console.log("Content was updated:", content);
  };

  const renderContentFields = () => {
    switch (newModule.type) {
      case "course":
        return (
          <>
            <FormControl component="fieldset" fullWidth margin="normal">
              <FormLabel component="legend">Content Type</FormLabel>
              <RadioGroup
                value={newModule.contentType}
                onChange={(e) =>
                  setNewModule({ ...newModule, contentType: e.target.value })
                }
                row
              >
                <FormControlLabel
                  value="internal"
                  control={<Radio />}
                  label="Create Content"
                />
                <FormControlLabel
                  value="external"
                  control={<Radio />}
                  label="External Link"
                />
              </RadioGroup>
            </FormControl>

            {newModule.contentType === "internal" ? (
              <Box sx={{ mt: 2, minHeight: "400px" }}>
                <Typography variant="subtitle1" gutterBottom>
                  Course Content
                </Typography>
                <Editor
                  apiKey={process.env.REACT_APP_TINYMCE_API_KEY}
                  value={newModule.courseContent}
                  onEditorChange={handleEditorChange}
                  init={{
                    height: 500,
                    menubar: true,
                    plugins: [
                      "advlist",
                      "autolink",
                      "lists",
                      "link",
                      "image",
                      "charmap",
                      "preview",
                      "anchor",
                      "searchreplace",
                      "visualblocks",
                      "fullscreen",
                      "insertdatetime",
                      "media",
                      "table",
                      "code",
                      "help",
                      "wordcount",
                      "save",
                    ],
                    toolbar:
                      "undo redo | formatselect | " +
                      "bold italic backcolor | alignleft aligncenter " +
                      "alignright alignjustify | bullist numlist outdent indent | " +
                      "removeformat | help",
                    content_style:
                      "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                    branding: false,
                    promotion: false,
                  }}
                />
              </Box>
            ) : (
              <TextField
                fullWidth
                label="External Course URL"
                value={newModule.content}
                onChange={(e) =>
                  setNewModule({ ...newModule, content: e.target.value })
                }
                margin="normal"
                helperText="Enter the URL for the external course content"
              />
            )}
          </>
        );

      case "quiz":
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Quiz Questions
            </Typography>
            {newModule.questions.map((question, index) => (
              <Box
                key={index}
                sx={{ mb: 2, p: 2, border: "1px solid #ddd", borderRadius: 1 }}
              >
                <TextField
                  fullWidth
                  label="Question"
                  value={question.text}
                  onChange={(e) => {
                    const updatedQuestions = [...newModule.questions];
                    updatedQuestions[index].text = e.target.value;
                    setNewModule({ ...newModule, questions: updatedQuestions });
                  }}
                  margin="normal"
                />
                {question.options.map((option, optionIndex) => (
                  <TextField
                    key={optionIndex}
                    fullWidth
                    label={`Option ${optionIndex + 1}`}
                    value={option}
                    onChange={(e) => {
                      const updatedQuestions = [...newModule.questions];
                      updatedQuestions[index].options[optionIndex] =
                        e.target.value;
                      setNewModule({
                        ...newModule,
                        questions: updatedQuestions,
                      });
                    }}
                    margin="normal"
                    size="small"
                  />
                ))}
                <FormControl fullWidth margin="normal">
                  <InputLabel>Correct Answer</InputLabel>
                  <Select
                    value={question.correctAnswer}
                    onChange={(e) => {
                      const updatedQuestions = [...newModule.questions];
                      updatedQuestions[index].correctAnswer = e.target.value;
                      setNewModule({
                        ...newModule,
                        questions: updatedQuestions,
                      });
                    }}
                  >
                    {question.options.map((_, optionIndex) => (
                      <MenuItem key={optionIndex} value={optionIndex}>
                        Option {optionIndex + 1}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  color="error"
                  onClick={() => {
                    const updatedQuestions = newModule.questions.filter(
                      (_, i) => i !== index
                    );
                    setNewModule({ ...newModule, questions: updatedQuestions });
                  }}
                >
                  Remove Question
                </Button>
              </Box>
            ))}
            <Button
              variant="outlined"
              onClick={() => {
                setNewModule({
                  ...newModule,
                  questions: [
                    ...newModule.questions,
                    {
                      text: "",
                      options: ["", "", "", ""],
                      correctAnswer: 0,
                    },
                  ],
                });
              }}
            >
              Add Question
            </Button>
          </Box>
        );

      case "video":
        return (
          <>
            <FormControl component="fieldset" fullWidth margin="normal">
              <FormLabel component="legend">Video Source</FormLabel>
              <RadioGroup
                value={newModule.contentType}
                onChange={(e) =>
                  setNewModule({ ...newModule, contentType: e.target.value })
                }
                row
              >
                <FormControlLabel
                  value="youtube"
                  control={<Radio />}
                  label="YouTube"
                />
                <FormControlLabel
                  value="vimeo"
                  control={<Radio />}
                  label="Vimeo"
                />
                <FormControlLabel
                  value="other"
                  control={<Radio />}
                  label="Other"
                />
              </RadioGroup>
            </FormControl>
            <TextField
              fullWidth
              label="Video URL"
              value={newModule.content}
              onChange={(e) =>
                setNewModule({ ...newModule, content: e.target.value })
              }
              margin="normal"
              helperText={`Enter the ${newModule.contentType} video URL`}
            />
          </>
        );

      default:
        return null;
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Training Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenCreate(true)}
        >
          Create New Module
        </Button>
      </Box>

      <Grid container spacing={3}>
        {modules.map((module) => (
          <Grid item xs={12} md={6} key={module.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{module.title}</Typography>
                <Typography color="textSecondary">
                  Type: {module.type}
                </Typography>
                <Typography variant="body2">{module.description}</Typography>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSelectedModule(module);
                      setOpenAssign(true);
                    }}
                  >
                    Assign to Agents
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Module Dialog */}
      <Dialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Training Module</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={newModule.title}
            onChange={(e) =>
              setNewModule({ ...newModule, title: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={newModule.description}
            onChange={(e) =>
              setNewModule({ ...newModule, description: e.target.value })
            }
            margin="normal"
            multiline
            rows={4}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Type</InputLabel>
            <Select
              value={newModule.type}
              onChange={(e) =>
                setNewModule({ ...newModule, type: e.target.value })
              }
              label="Type"
            >
              <MenuItem value="course">Course</MenuItem>
              <MenuItem value="quiz">Quiz</MenuItem>
              <MenuItem value="video">Video</MenuItem>
            </Select>
          </FormControl>
          {renderContentFields()}
          <TextField
            fullWidth
            label="Duration"
            value={newModule.duration}
            onChange={(e) =>
              setNewModule({ ...newModule, duration: e.target.value })
            }
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button
            onClick={handleCreateModule}
            variant="contained"
            color="primary"
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Module Dialog */}
      <Dialog
        open={openAssign}
        onClose={() => {
          setOpenAssign(false);
          setSelectedAgents([]);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Module: {selectedModule?.title}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              multiple
              options={agents}
              getOptionLabel={(option) =>
                `${option.firstName} ${option.lastName}`
              }
              value={agents.filter((agent) =>
                selectedAgents.includes(agent.id)
              )}
              onChange={(event, newValue) => {
                setSelectedAgents(newValue.map((agent) => agent.id));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Select Agents"
                  placeholder="Search agents..."
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const props = getTagProps({ index });
                  const { key, ...chipProps } = props;
                  return (
                    <Chip
                      key={option.id || key}
                      label={`${option.firstName} ${option.lastName}`}
                      {...chipProps}
                    />
                  );
                })
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenAssign(false);
              setSelectedAgents([]);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssignModule}
            variant="contained"
            color="primary"
            disabled={selectedAgents.length === 0}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default TrainingManagement;
