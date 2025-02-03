import React from 'react';
import { TextField } from '@mui/material';

function RichTextEditor({ value, onChange }) {
  return (
    <TextField
      fullWidth
      multiline
      rows={6}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      variant="outlined"
    />
  );
}

export default RichTextEditor; 