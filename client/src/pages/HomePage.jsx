import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Box,
  AppBar,
  Toolbar,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';

const HomePage = () => {
  const navigate = useNavigate();
  const [backendStatus, setBackendStatus] = useState('checking');
  const [frontendStatus, setFrontendStatus] = useState('checking');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(true);

  useEffect(() => {
    checkBackendConnection();
    checkFrontendStatus();
  }, []);

  useEffect(() => {
    if (backendStatus === 'connected') {
      fetchCompanyData();
    }
  }, [backendStatus]);

  useEffect(() => {
    if (backendStatus === 'error') {
      setNotificationOpen(true);
    }
  }, [backendStatus]);

  const checkBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('error');
      }
    } catch (error) {
      setBackendStatus('error');
      console.error('Backend connection failed:', error);
    }
  };

  const fetchCompanyData = async () => {
    try {
      setLoadingCompany(true);
      
      const response = await fetch('http://localhost:5000/api/companyManagements', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Handle different response formats
        let companies = [];
        
        if (Array.isArray(data)) {
          companies = data;
        } else if (data.data && Array.isArray(data.data)) {
          companies = data.data;
        } else if (data.companies && Array.isArray(data.companies)) {
          companies = data.companies;
        }
        
        // Find active company or use the first one
        const activeCompany = companies.find(company => company.status === 'Active') || companies[0];
        
        if (activeCompany) {
          setCompanyData(activeCompany);
        } else {
          setCompanyData(null);
        }
      } else {
        setCompanyData(null);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      setCompanyData(null);
    } finally {
      setLoadingCompany(false);
    }
  };

  const checkFrontendStatus = () => {
    if (process.env.NODE_ENV === 'development') {
      setFrontendStatus('connected');
    } else {
      setFrontendStatus('production');
    }
  };

  const handleContinue = () => {
    navigate('/Dashboard');
  };

  const handleCompanyManagement = () => {
    navigate('/companyManagements');
  };

  const handleDepartments = () => {
    navigate('/departmentmanagement');
  };

  const handleCloseNotification = () => {
    setNotificationOpen(false);
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'connected':
        return <Chip icon={<CheckCircleIcon />} label="Connected" color="success" size="small" />;
      case 'checking':
        return <Chip icon={<CircularProgress size={14} />} label="Checking..." color="default" size="small" />;
      case 'error':
        return <Chip icon={<ErrorIcon />} label="Not Connected" color="error" size="small" />;
      case 'production':
        return <Chip label="Production" color="primary" size="small" />;
      default:
        return <Chip label="Unknown" color="default" size="small" />;
    }
  };

  // Get company name with fallback
  const getCompanyName = () => {
    if (loadingCompany && backendStatus === 'connected') return 'Loading...';
    if (companyData && companyData.companyName) return companyData.companyName;
    return 'Mesay Foods'; // Fallback if no company data
  };

  // Get contact info with fallbacks
  const getContactEmail = () => {
    if (companyData && companyData.contact && companyData.contact.email) 
      return companyData.contact.email;
    return 'mesay710@gmail.com'; // Fallback
  };

  const getContactPhone = () => {
    if (companyData && companyData.contact && companyData.contact.phone) 
      return companyData.contact.phone;
    return '0912685990'; // Fallback
  };

  return (
    <>
      {/* Compact Header with Navigation Buttons */}
      <AppBar position="static" elevation={1} sx={{ backgroundColor: 'white', color: 'text.primary' }}>
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '56px', py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Transparent Logo Holder Box */}
            <Box
              sx={{
                height: 36,
                width: 36,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent', // Transparent background
                overflow: 'hidden' // Ensure logo stays within bounds
              }}
            >
              <Box
                component="img"
                src="/logo.jpg"
                alt={`${getCompanyName()} Logo`}
                sx={{
                  height: '100%',
                  width: '100%',
                  objectFit: 'cover'
                }}
              />
            </Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: '#2E7D32',
              fontSize: { xs: '1rem', sm: '1.1rem' } // Reduced font size
            }}>
              {getCompanyName()} Operations
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Navigation Buttons */}
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1, mr: 2 }}>
              <Button 
                variant="outlined" 
                size="small"
                onClick={handleCompanyManagement}
                sx={{
                  color: '#2E7D32',
                  borderColor: '#2E7D32',
                  '&:hover': {
                    backgroundColor: '#2E7D32',
                    color: 'white',
                    borderColor: '#2E7D32'
                  },
                  fontWeight: 500,
                  fontSize: '0.8rem'
                }}
              >
                Company Info
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                onClick={handleDepartments}
                sx={{
                  color: '#2E7D32',
                  borderColor: '#2E7D32',
                  '&:hover': {
                    backgroundColor: '#2E7D32',
                    color: 'white',
                    borderColor: '#2E7D32'
                  },
                  fontWeight: 500,
                  fontSize: '0.8rem'
                }}
              >
                Departments
              </Button>
            </Box>
            
            {/* Status Chips */}
            {getStatusChip(frontendStatus)}
            {getStatusChip(backendStatus)}
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Main Content - Centered and simplified */}
      <Container maxWidth="md" sx={{ 
        py: { xs: 4, sm: 6 },
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <Grid container spacing={4} alignItems="center" justifyContent="center">
          {/* Hero Content */}
          <Grid item xs={12} md={7}>
            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Typography 
                variant="h2" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '1.50rem', sm: '2.00rem', md: '2.50rem' },
                  lineHeight: 1.1,
                  mb: 2,
                  color: '#f82003ff'
                }}
              >
                {getCompanyName()}
                <Box component="span" sx={{ color: '#388E3C', display: 'block' }}>
                  Operations Manager
                </Box>
              </Typography>
              
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  color: 'text.secondary',
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  fontWeight: 400
                }}
              >
              </Typography>
              
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 4, 
                  color: 'text.secondary',
                  lineHeight: 1.6,
                  fontSize: { xs: '1rem', sm: '1.1rem' }
                }}
              >
              </Typography>
              
              {/* Additional buttons in main content (optional) */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' } }}>
                <Button 
                  variant="contained" 
                  size="large"
                  onClick={handleContinue}
                  disabled={backendStatus === 'error'}
                  sx={{ 
                    px: 5, 
                    py: 1.5,
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    backgroundColor: '#2E7D32',
                    fontWeight: 600,
                    borderRadius: 2,
                    minWidth: 160,
                    '&:hover': {
                      backgroundColor: '#1B5E20',
                      transform: 'translateY(-2px)',
                      boxShadow: 4
                    },
                    '&:disabled': {
                      backgroundColor: '#e0e0e0'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  {backendStatus === 'checking' ? 'Checking...' : 
                   backendStatus === 'error' ? 'Connection Issue' : 
                   'Get Started'}
                </Button>
                
                {/* Mobile-only buttons */}
                <Box sx={{ display: { xs: 'flex', sm: 'none' }, gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    size="medium"
                    onClick={handleCompanyManagement}
                    sx={{
                      color: '#2E7D32',
                      borderColor: '#2E7D32',
                      '&:hover': {
                        backgroundColor: '#2E7D32',
                        color: 'white',
                        borderColor: '#2E7D32'
                      }
                    }}
                  >
                    Company Info
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="medium"
                    onClick={handleDepartments}
                    sx={{
                      color: '#2E7D32',
                      borderColor: '#2E7D32',
                      '&:hover': {
                        backgroundColor: '#2E7D32',
                        color: 'white',
                        borderColor: '#2E7D32'
                      }
                    }}
                  >
                    Departments
                  </Button>
                </Box>
              </Box>
            </Box>
          </Grid>
          
          {/* Visual Section */}
          <Grid item xs={12} md={5}>
            <Box sx={{ textAlign: 'center' }}>
              {/* Transparent Logo Container for Main Image */}
              <Box
                sx={{
                  width: '100%',
                  maxWidth: 280,
                  margin: '0 auto',
                  borderRadius: 3,
                  overflow: 'hidden',
                  backgroundColor: 'transparent', // Transparent background
                  boxShadow: 3,
                  border: '6px solid white'
                }}
              >
                <Box
                  component="img"
                  src="/logo.jpg"
                  alt={getCompanyName()}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    display: 'block'
                  }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Compact Footer */}
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
            © 2025 {getCompanyName()} PLC. All rights reserved.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
            {getContactEmail()} || {getContactPhone()}
          </Typography>
        </Box>
      </Container>

      {/* Compact Connection Error Dialog */}
      <Dialog
        open={notificationOpen}
        onClose={handleCloseNotification}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 2,
          pb: 1
        }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            <ErrorIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#d32f2f' }} />
            Connection Issue
          </Typography>
          <IconButton onClick={handleCloseNotification} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          <Typography variant="body1" paragraph sx={{ fontSize: '0.9rem' }}>
            Unable to connect to the backend server.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2, py: 0.5 }}>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              Start the backend server with:
            </Typography>
          </Alert>
          
          <Box sx={{ 
            backgroundColor: '#f5f5f5', 
            p: 1.5, 
            borderRadius: 1, 
            fontFamily: 'monospace',
            fontSize: '0.8rem'
          }}>
            cd backend<br/>
            npm run server
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button onClick={handleCloseNotification} size="small">
            Dismiss
          </Button>
          <Button 
            onClick={checkBackendConnection} 
            variant="contained"
            size="small"
            startIcon={<CheckCircleIcon />}
          >
            Retry
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HomePage;