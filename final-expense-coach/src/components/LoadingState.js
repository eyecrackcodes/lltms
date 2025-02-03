import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

function LoadingState({ message = 'Loading...' }) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="200px"
    >
      <CircularProgress size={40} sx={{ mb: 2 }} />
      <Typography color="text.secondary" variant="body1">
        {message}
      </Typography>
    </Box>
  );
}

export default LoadingState;