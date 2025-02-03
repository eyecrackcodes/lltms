import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper
} from '@mui/material';
import { MODULE_TYPES } from '../../firebase/firebaseUtils';

function ModuleBuilder() {
  const [moduleData, setModuleData] = useState({
    title: '',
    type: '',
    description: '',
    content: '',
    duration: '',
    requirements: [],
    resources: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Add module creation logic here
      console.log('Module data:', moduleData);
    } catch (error) {
      console.error('Error creating module:', error);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Create New Module
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField
          fullWidth
          label="Module Title"
          value={moduleData.title}
          onChange={(e) => setModuleData({ ...moduleData, title: e.target.value })}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Module Type</InputLabel>
          <Select
            value={moduleData.type}
            label="Module Type"
            onChange={(e) => setModuleData({ ...moduleData, type: e.target.value })}
          >
            {Object.entries(MODULE_TYPES).map(([key, value]) => (
              <MenuItem key={key} value={value}>
                {key}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Description"
          value={moduleData.description}
          onChange={(e) => setModuleData({ ...moduleData, description: e.target.value })}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Duration (e.g., '30 mins')"
          value={moduleData.duration}
          onChange={(e) => setModuleData({ ...moduleData, duration: e.target.value })}
          sx={{ mb: 2 }}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
        >
          Create Module
        </Button>
      </Box>
    </Paper>
  );
}

export default ModuleBuilder;