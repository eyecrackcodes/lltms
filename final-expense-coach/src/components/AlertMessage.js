import React from 'react';
import { Alert, Snackbar } from '@mui/material';

function AlertMessage({ open, message, severity = 'info', onClose, duration = 6000 }) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

export default AlertMessage;