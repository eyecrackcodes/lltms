import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
} from "@mui/material";

function CourseBuilder() {
  const [course, setCourse] = useState({
    title: "",
    description: "",
    modules: [],
    prerequisites: [],
  });

  const handleDragEnd = (result) => {
    // Reorder modules logic
  };

  return (
    <Box>
      <TextField
        fullWidth
        label="Course Title"
        value={course.title}
        onChange={(e) => setCourse({ ...course, title: e.target.value })}
        sx={{ mb: 2 }}
      />

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="modules">
          {(provided) => (
            <List {...provided.droppableProps} ref={provided.innerRef}>
              {course.modules.map((module, index) => (
                <Draggable
                  key={module.id}
                  draggableId={module.id}
                  index={index}
                >
                  {(provided) => (
                    <ListItem
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <Paper sx={{ p: 2, width: "100%" }}>
                        <Typography>{module.title}</Typography>
                      </Paper>
                    </ListItem>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </List>
          )}
        </Droppable>
      </DragDropContext>

      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          /* Save course logic */
        }}
      >
        Save Course
      </Button>
    </Box>
  );
}

export default CourseBuilder;
