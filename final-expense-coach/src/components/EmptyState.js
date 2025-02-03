import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { InboxOutlined } from '@mui/icons-material';

function EmptyState({
  title = 'No Data Available',
  message = 'There are no items to display at this time.',
  action,
  actionText
}) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={8}
      px={2}
    >
      <InboxOutlined sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography color="text.secondary" align="center" sx={{ mb: 3 }}>
        {message}
      </Typography>
      {action && actionText && (
        <Button variant="contained" color="primary" onClick={action}>
          {actionText}
        </Button>
      )}
    </Box>
  );
}

export default EmptyState;
