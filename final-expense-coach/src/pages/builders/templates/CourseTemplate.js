import React from "react";
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
} from "@mui/material";

function CourseTemplate({ onSave }) {
  const [courseData, setCourseData] = React.useState({
    title: "",
    description: "",
    type: "course",
    sections: [
      {
        title: "",
        content: "",
        duration: "",
        resources: [],
      },
    ],
    requirements: [],
    totalDuration: "",
    skillLevel: "beginner",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(courseData);
  };

  const addSection = () => {
    setCourseData({
      ...courseData,
      sections: [
        ...courseData.sections,
        { title: "", content: "", duration: "", resources: [] },
      ],
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Course Title"
            value={courseData.title}
            onChange={(e) =>
              setCourseData({ ...courseData, title: e.target.value })
            }
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Course Description"
            value={courseData.description}
            onChange={(e) =>
              setCourseData({ ...courseData, description: e.target.value })
            }
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Skill Level</InputLabel>
            <Select
              value={courseData.skillLevel}
              onChange={(e) =>
                setCourseData({ ...courseData, skillLevel: e.target.value })
              }
            >
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="advanced">Advanced</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Course Sections
          </Typography>
          {courseData.sections.map((section, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={`Section ${index + 1} Title`}
                    value={section.title}
                    onChange={(e) => {
                      const newSections = [...courseData.sections];
                      newSections[index].title = e.target.value;
                      setCourseData({ ...courseData, sections: newSections });
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Content"
                    value={section.content}
                    onChange={(e) => {
                      const newSections = [...courseData.sections];
                      newSections[index].content = e.target.value;
                      setCourseData({ ...courseData, sections: newSections });
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Duration (e.g., 30 mins)"
                    value={section.duration}
                    onChange={(e) => {
                      const newSections = [...courseData.sections];
                      newSections[index].duration = e.target.value;
                      setCourseData({ ...courseData, sections: newSections });
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
          ))}
          <Button variant="outlined" onClick={addSection} sx={{ mt: 2 }}>
            Add Section
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
            Create Course
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}

export default CourseTemplate;
