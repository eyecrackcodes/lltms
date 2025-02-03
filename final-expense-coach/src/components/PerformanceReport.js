import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Paper, Button, Stack } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const PerformanceReport = () => {
  const { currentUser, userRole } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  const reportUrl = "https://lookerstudio.google.com/u/0/reporting/cae920a3-5b27-4045-919f-f13f654d4fc6/page/p_vu3vk371od";

  useEffect(() => {
    if (currentUser) {
      setIsLoading(false);
    }
  }, [currentUser]);

  const handleOpenReport = () => {
    window.open(reportUrl, '_blank', 'noopener,noreferrer');
  };

  if (!currentUser) {
    return <Typography>Please log in to view the report.</Typography>;
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper 
        elevation={1}
        sx={{ 
          p: 4,
          textAlign: 'center',
          backgroundColor: 'background.paper',
          borderRadius: 2
        }}
      >
        <Stack spacing={3} alignItems="center">
          <Typography variant="h6" color="primary">
            Performance Dashboard
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountCircleIcon color="action" />
            <Typography variant="body2" color="textSecondary">
              Signed in as: {currentUser.email}
            </Typography>
          </Box>

          <Typography variant="body1">
            Click below to view your performance metrics dashboard
          </Typography>

          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<OpenInNewIcon />}
            onClick={handleOpenReport}
            sx={{ 
              minWidth: 200,
              py: 1.5
            }}
          >
            Open Dashboard
          </Button>

          <Typography variant="caption" color="textSecondary">
            Note: The dashboard will open in a new tab
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default React.memo(PerformanceReport); 