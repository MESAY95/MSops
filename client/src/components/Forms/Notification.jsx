// frontend/src/components/Notification.jsx
import React from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  Collapse,
  Box
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const iconMapping = {
  success: <SuccessIcon />,
  error: <ErrorIcon />,
  warning: <WarningIcon />,
  info: <InfoIcon />
};

export const Notification = ({ 
  open, 
  onClose, 
  title, 
  message, 
  severity = 'info',
  autoHideDuration = 6000,
  action = null 
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        severity={severity}
        variant="filled"
        onClose={onClose}
        action={action}
        icon={iconMapping[severity]}
        sx={{ 
          width: '100%',
          alignItems: 'center',
          '& .MuiAlert-message': {
            flex: 1
          }
        }}
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
      </Alert>
    </Snackbar>
  );
};

export const InlineNotification = ({ 
  message, 
  severity = 'info',
  onClose,
  showIcon = true
}) => {
  return (
    <Alert
      severity={severity}
      variant="outlined"
      onClose={onClose}
      icon={showIcon ? iconMapping[severity] : null}
      sx={{ mb: 2 }}
    >
      {message}
    </Alert>
  );
};

export default Notification;