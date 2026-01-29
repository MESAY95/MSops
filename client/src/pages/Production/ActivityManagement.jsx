import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  Grid,
  Typography,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
  Collapse,
  InputAdornment,
  FormHelperText,
  Radio,
  RadioGroup,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Help as HelpIcon,
  FilterList as FilterListIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Code as CodeIcon,
  Home as HomeIcon,
  ImportExport as ImportExportIcon,
  AttachMoney as AttachMoneyIcon,
  Scale as ScaleIcon,
  TrendingUp as TrendingUpIcon,
  ExpandMore as ExpandMoreIcon,
  Build as BuildIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import axios from 'axios';
import useDebounce from '../../hooks/useDebounce';

// Styled components
const StyledTableRow = ({ children, selected, ...props }) => (
  <TableRow
    sx={{
      backgroundColor: selected ? 'action.selected' : 'transparent',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: 'action.hover',
      },
      height: '40px',
    }}
    {...props}
  >
    {children}
  </TableRow>
);

const StatisticCard = ({ children, color = 'default' }) => (
  <Card
    sx={{
      textAlign: 'center',
      p: 1,
      background: color === 'green' ? '#f6ffed' : 
                  color === 'red' ? '#fff2f0' : 
                  color === 'blue' ? '#f0f8ff' : 
                  color === 'orange' ? '#fff7e6' : '#fafafa',
      minHeight: '80px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}
  >
    {children}
  </Card>
);

const ActivityManagement = ({ onBack }) => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [filters, setFilters] = useState({
    page: 0,
    limit: 10,
    search: '',
    status: '',
    unit: ''
  });
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0
  });
  const [stats, setStats] = useState({
    totalActivities: 0,
    activeActivities: 0,
    inactiveActivities: 0,
    totalPaymentValue: 0,
    averagePayment: 0
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showCustomUnit, setShowCustomUnit] = useState(false);

  // API base URLs
  const API_BASE = 'http://localhost:5000/api/activitymanagements';
  const UNITS_API = 'http://localhost:5000/api/activitymanagements/units/list';

  // Use debounced search
  const debouncedSearch = useDebounce(filters.search, 500);

  // Form state
  const [formData, setFormData] = useState({
    activityCode: '',
    activityName: '',
    description: '',
    unit: 'pcs',
    customUnit: '',
    paymentPerUnit: '',
    status: 'Active'
  });

  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  // Notification system
  const addNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now().toString();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const NotificationContainer = () => (
    <Box sx={{ position: 'fixed', top: 80, right: 16, zIndex: 9999, maxWidth: 400 }}>
      {notifications.map((notification) => (
        <Alert
          key={notification.id}
          severity={notification.type}
          onClose={() => removeNotification(notification.id)}
          sx={{ mb: 1, boxShadow: 3 }}
        >
          {notification.message}
        </Alert>
      ))}
    </Box>
  );

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.activityName.trim()) {
      errors.activityName = 'Activity name is required';
    }
    
    if (!formData.activityCode.trim()) {
      errors.activityCode = 'Activity code is required';
    }

    if (!formData.paymentPerUnit || isNaN(formData.paymentPerUnit) || parseFloat(formData.paymentPerUnit) < 0) {
      errors.paymentPerUnit = 'Valid payment per unit is required (must be positive or zero)';
    }

    if (formData.unit === 'Custom' && !formData.customUnit.trim()) {
      errors.customUnit = 'Custom unit is required when unit is "Custom"';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    
    // Handle unit change
    if (field === 'unit') {
      setShowCustomUnit(value === 'Custom');
      if (value !== 'Custom') {
        setFormData(prev => ({ ...prev, customUnit: '' }));
      }
    }
    
    // Real-time validation
    if (touchedFields[field] || formErrors[field]) {
      const errors = { ...formErrors };
      
      if ((field === 'activityName' || field === 'activityCode') && !value.trim()) {
        errors[field] = `${field.replace(/([A-Z])/g, ' $1')} is required`;
      } else if (field === 'paymentPerUnit' && (!value || isNaN(value) || parseFloat(value) < 0)) {
        errors[field] = 'Valid payment per unit is required';
      } else if (field === 'customUnit' && showCustomUnit && !value.trim()) {
        errors[field] = 'Custom unit is required';
      } else {
        delete errors[field];
      }
      
      setFormErrors(errors);
    }
  };

  // Fetch units
  const fetchUnits = useCallback(async () => {
    setUnitsLoading(true);
    try {
      const response = await axios.get(UNITS_API);
      setUnits(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching units:', error);
      addNotification('Failed to load units', 'error');
      setUnits(['pcs', 'Hr', 'Month', 'Day', 'MD', 'Custom']);
    } finally {
      setUnitsLoading(false);
    }
  }, []);

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      params.append('sortBy', 'createdAt');
      params.append('sortOrder', 'asc');

      const response = await axios.get(`${API_BASE}?${params}`);
      
      let activitiesData = [];
      
      if (response.data && Array.isArray(response.data.data)) {
        activitiesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        activitiesData = response.data;
      } else if (response.data && Array.isArray(response.data.activities)) {
        activitiesData = response.data.activities;
      }
      
      setActivities(activitiesData);
      
      if (response.data.pagination) {
        setPagination({
          page: (response.data.pagination.currentPage || 1) - 1,
          pageSize: filters.limit,
          total: response.data.pagination.totalItems || activitiesData.length
        });
      }
      
      // Stats calculation
      const activeActivities = activitiesData.filter(activity => activity.status === 'Active');
      const inactiveActivities = activitiesData.filter(activity => activity.status === 'Inactive');
      
      const totalPaymentValue = activitiesData.reduce((sum, activity) => {
        const payment = activity.paymentPerUnit || 0;
        return sum + payment;
      }, 0);
      
      const averagePayment = activitiesData.length > 0 ? totalPaymentValue / activitiesData.length : 0;
      
      setStats({
        totalActivities: activitiesData.length,
        activeActivities: activeActivities.length,
        inactiveActivities: inactiveActivities.length,
        totalPaymentValue,
        averagePayment
      });

      setSelectedRowIndex(-1);
    } catch (error) {
      console.error('Error fetching activities:', error);
      
      let errorMessage = 'Failed to fetch activities';
      let detailedError = '';
      
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.statusText;
        detailedError = error.response.data?.error;
        
        if (error.response.status === 404) {
          errorMessage = 'Activities API endpoint not found';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error occurred while fetching activities';
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check if the backend is running.';
      } else {
        errorMessage = error.message;
      }
      
      const fullErrorMessage = `${errorMessage}${detailedError ? `: ${detailedError}` : ''}`;
      setError(fullErrorMessage);
      addNotification(`Error fetching activities: ${errorMessage}`, 'error');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchActivities();
    fetchUnits();
  }, [fetchActivities, fetchUnits, debouncedSearch]);

  const showModal = (activity = null, view = false) => {
    setEditingActivity(activity);
    setViewMode(view);
    setModalVisible(true);
    
    setFormErrors({});
    setTouchedFields({});
    
    if (activity) {
      setFormData({
        activityCode: activity.activityCode || '',
        activityName: activity.activityName || '',
        description: activity.description || '',
        unit: activity.unit || 'pcs',
        customUnit: activity.customUnit || '',
        paymentPerUnit: activity.paymentPerUnit || '',
        status: activity.status || 'Active'
      });
      setShowCustomUnit(activity.unit === 'Custom');
    } else {
      setFormData({
        activityCode: '',
        activityName: '',
        description: '',
        unit: 'pcs',
        customUnit: '',
        paymentPerUnit: '',
        status: 'Active'
      });
      setShowCustomUnit(false);
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingActivity(null);
    setViewMode(false);
    setFormData({
      activityCode: '',
      activityName: '',
      description: '',
      unit: 'pcs',
      customUnit: '',
      paymentPerUnit: '',
      status: 'Active'
    });
    setFormErrors({});
    setTouchedFields({});
    setShowCustomUnit(false);
  };

  const handleRefresh = () => {
    fetchActivities();
    fetchUnits();
    addNotification('Data refreshed successfully', 'success');
  };

  const handleDeleteActivity = async (id) => {
    const activity = activities.find(a => a._id === id);
    if (!activity) return;

    if (!window.confirm(`Are you sure you want to delete activity "${activity.activityName}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/${id}`);
      addNotification(`Successfully deleted activity: ${activity.activityName}`, 'success');
      await fetchActivities();
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error.response?.data?.message || 'Delete failed';
      const detailedError = error.response?.data?.error;
      
      addNotification(`Delete failed: ${errorMessage}`, 'error');
      setError(`${errorMessage}${detailedError ? `: ${detailedError}` : ''}`);
    }
  };

  const handleSubmit = async () => {
    // Mark all required fields as touched
    const allTouched = {
      activityName: true,
      activityCode: true,
      paymentPerUnit: true
    };
    if (showCustomUnit) allTouched.customUnit = true;
    
    setTouchedFields(allTouched);
    
    if (!validateForm()) {
      const errorMsg = 'Please fix the validation errors before submitting';
      setError(errorMsg);
      addNotification(errorMsg, 'error');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const submitData = {
        activityCode: formData.activityCode.trim(),
        activityName: formData.activityName.trim(),
        description: formData.description.trim(),
        unit: formData.unit,
        customUnit: formData.customUnit.trim(),
        paymentPerUnit: parseFloat(formData.paymentPerUnit),
        status: formData.status
      };

      let response;
      if (editingActivity) {
        response = await axios.put(`${API_BASE}/${editingActivity._id}`, submitData);
        addNotification(`Successfully updated activity: ${formData.activityName}`, 'success');
      } else {
        response = await axios.post(API_BASE, submitData);
        addNotification(`Successfully created new activity: ${formData.activityName}`, 'success');
      }

      setModalVisible(false);
      setEditingActivity(null);
      setViewMode(false);
      setFormData({
        activityCode: '',
        activityName: '',
        description: '',
        unit: 'pcs',
        customUnit: '',
        paymentPerUnit: '',
        status: 'Active'
      });
      setFormErrors({});
      setTouchedFields({});
      setShowCustomUnit(false);
      
      await fetchActivities();
      
    } catch (error) {
      console.error('Submit error:', error);
      
      let errorMessage = 'Operation failed';
      let detailedError = '';
      
      if (error.response?.data) {
        const serverError = error.response.data;
        
        if (serverError.message) {
          errorMessage = serverError.message;
        }
        
        if (serverError.errors && Array.isArray(serverError.errors)) {
          errorMessage = serverError.errors.join(', ');
        }
        
        detailedError = serverError.error;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check if the backend is running.';
      } else {
        errorMessage = error.message;
      }
      
      const fullErrorMessage = `${errorMessage}${detailedError ? `: ${detailedError}` : ''}`;
      setError(fullErrorMessage);
      addNotification(`Operation failed: ${errorMessage}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Print functionality
  const handlePrint = () => {
    try {
      const printContent = `
        <html>
          <head>
            <title>Activity Management Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { margin-bottom: 20px; }
              .timestamp { color: #666; font-size: 14px; }
              .active { color: green; }
              .inactive { color: red; }
              .statistics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
              .stat-card { background: #f5f5f5; padding: 10px; border-radius: 5px; text-align: center; }
              .amount { text-align: right; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Activity Management Report</h1>
              <div class="timestamp">Generated on: ${new Date().toLocaleString()}</div>
            </div>
            
            <div class="statistics">
              <div class="stat-card">
                <h3>Total Activities</h3>
                <p>${stats.totalActivities}</p>
              </div>
              <div class="stat-card">
                <h3>Active Activities</h3>
                <p>${stats.activeActivities}</p>
              </div>
              <div class="stat-card">
                <h3>Average Payment</h3>
                <p>${stats.averagePayment.toFixed(2)} ETB</p>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Activity Code</th>
                  <th>Activity Name</th>
                  <th>Unit</th>
                  <th>Payment/Unit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${activities.map(activity => {
                  const statusClass = activity.status === 'Active' ? 'active' : 'inactive';
                  const displayUnit = activity.displayUnit || activity.unit || 'N/A';
                  
                  return `
                    <tr>
                      <td>${activity.activityCode || 'N/A'}</td>
                      <td>${activity.activityName || 'N/A'}</td>
                      <td>${displayUnit}</td>
                      <td class="amount">${activity.paymentPerUnit?.toFixed(2) || '0.00'} ETB</td>
                      <td class="${statusClass}">${activity.status || 'N/A'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
      
      addNotification('Print document generated successfully', 'success');
      
    } catch (error) {
      console.error('Print error:', error);
      const errorMsg = 'Error generating print document';
      setError(errorMsg);
      addNotification(errorMsg, 'error');
    }
  };

  // Status colors and icons
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return <CheckCircleIcon />;
      case 'Inactive': return <CancelIcon />;
      default: return null;
    }
  };

  // Table columns
  const columns = [
    {
      id: 'activityCode',
      label: 'Activity Code',
      render: (activity) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CodeIcon sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
          <Typography variant="body2" fontWeight="bold" sx={{ whiteSpace: 'nowrap' }}>
            {activity.activityCode || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      id: 'activityName',
      label: 'Activity Name',
      render: (activity) => (
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
          {activity.activityName || 'N/A'}
        </Typography>
      )
    },
    {
      id: 'unit',
      label: 'Unit',
      render: (activity) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ScaleIcon sx={{ mr: 0.5, fontSize: 16, color: 'info.main' }} />
          <Chip 
            label={activity.displayUnit || activity.unit || 'N/A'} 
            size="small" 
            variant="outlined"
            sx={{ fontSize: '0.7rem' }}
          />
        </Box>
      )
    },
    {
      id: 'paymentPerUnit',
      label: 'Payment/Unit',
      render: (activity) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AttachMoneyIcon sx={{ mr: 0.5, fontSize: 16, color: 'success.main' }} />
          <Typography variant="body2" fontWeight="bold">
            {activity.paymentPerUnit?.toFixed(2) || '0.00'} ETB
          </Typography>
        </Box>
      )
    },
    {
      id: 'status',
      label: 'Status',
      render: (activity) => (
        <Chip 
          label={activity.status || 'Unknown'} 
          color={getStatusColor(activity.status)}
          icon={getStatusIcon(activity.status)}
          size="small"
        />
      )
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (activity) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => showModal(activity, true)}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => showModal(activity, false)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton 
              size="small" 
              color="error"
              onClick={() => handleDeleteActivity(activity._id)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 1, minHeight: '50vh' }}>
      <NotificationContainer />

      <Card sx={{ borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', m: 1 }}>
        <CardContent sx={{ p: 1 }}>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 1,
            pb: 1,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Button 
              variant="outlined"
              onClick={onBack || (() => navigate('/'))}
              size="medium"
              startIcon={<HomeIcon />}
              sx={{ minWidth: '120px' }}
            >
              {onBack ? 'Back' : 'Back to Home'}
            </Button>
            
            <Typography variant="h6" component="h1" sx={{ display: 'flex', alignItems: 'center', fontSize: '1.25rem' }}>
              <BusinessIcon sx={{ mr: 1, color: 'primary.main', fontSize: '1.5rem' }} />
              Activity Management
            </Typography>

            <Tooltip title="Help">
              <Button 
                variant="outlined"
                startIcon={<HelpIcon />}
                size="medium"
              >
                Help
              </Button>
            </Tooltip>
          </Box>

          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{ mb: 1 }}
            >
              {error}
            </Alert>
          )}

          {/* Statistics Section */}
          <Grid container spacing={1} sx={{ mb: 2, textAlign: 'center' }}>
            <Grid item xs={12} sm={2}>
              <StatisticCard color="default">
                <BusinessIcon color="action" sx={{ fontSize: 30, mb: 0.5 }} />
                <Typography variant="h6" component="div" sx={{ fontSize: '1.1rem' }}>
                  {stats.totalActivities}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Total Activities
                </Typography>
              </StatisticCard>
            </Grid>
            <Grid item xs={12} sm={2}>
              <StatisticCard color="green">
                <CheckCircleIcon sx={{ color: 'success.main', fontSize: 30, mb: 0.5 }} />
                <Typography variant="h6" component="div" color="success.main" sx={{ fontSize: '1.1rem' }}>
                  {stats.activeActivities}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Active
                </Typography>
              </StatisticCard>
            </Grid>
            <Grid item xs={12} sm={2}>
              <StatisticCard color="red">
                <CancelIcon sx={{ color: 'error.main', fontSize: 30, mb: 0.5 }} />
                <Typography variant="h6" component="div" color="error.main" sx={{ fontSize: '1.1rem' }}>
                  {stats.inactiveActivities}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Inactive
                </Typography>
              </StatisticCard>
            </Grid>
            <Grid item xs={12} sm={2}>
              <StatisticCard color="blue">
                <TrendingUpIcon sx={{ color: 'info.main', fontSize: 30, mb: 0.5 }} />
                <Typography variant="h6" component="div" color="info.main" sx={{ fontSize: '1.1rem' }}>
                  ${stats.totalPaymentValue.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Total Payment Value
                </Typography>
              </StatisticCard>
            </Grid>
            <Grid item xs={12} sm={2}>
              <StatisticCard color="orange">
                <AttachMoneyIcon sx={{ color: 'warning.main', fontSize: 30, mb: 0.5 }} />
                <Typography variant="h6" component="div" color="warning.main" sx={{ fontSize: '1.1rem' }}>
                  ${stats.averagePayment.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Average Payment
                </Typography>
              </StatisticCard>
            </Grid>
            <Grid item xs={12} sm={2}>
              <StatisticCard color="default">
                <ScaleIcon sx={{ color: 'action', fontSize: 30, mb: 0.5 }} />
                <Typography variant="h6" component="div" sx={{ fontSize: '1.1rem' }}>
                  {units.length}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Unit Types
                </Typography>
              </StatisticCard>
            </Grid>
          </Grid>

          <Divider sx={{ my: 1 }} />

          {/* Filters Section */}
          <Box sx={{ mb: 1 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 1
            }}>
              <Tooltip title="Filter">
                <IconButton
                  onClick={() => setShowFilters(!showFilters)}
                  color={showFilters ? "primary" : "default"}
                  size="medium"
                >
                  <FilterListIcon />
                </IconButton>
              </Tooltip>

              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Import">
                  <IconButton size="medium">
                    <ImportExportIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Export">
                  <IconButton size="medium">
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Print">
                  <IconButton onClick={handlePrint} size="medium">
                    <PrintIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Refresh">
                  <IconButton 
                    onClick={handleRefresh} 
                    disabled={loading}
                    size="medium"
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => showModal()}
                  size="medium"
                >
                  Add Activity
                </Button>
              </Box>
            </Box>

            <Collapse in={showFilters}>
              <Paper sx={{ p: 1, mb: 1 }}>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Search activities..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 0 }))}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 0 }))}
                        label="Status"
                      >
                        <MenuItem value="">All Status</MenuItem>
                        <MenuItem value="Active">Active</MenuItem>
                        <MenuItem value="Inactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Unit</InputLabel>
                      <Select
                        value={filters.unit}
                        onChange={(e) => setFilters(prev => ({ ...prev, unit: e.target.value, page: 0 }))}
                        label="Unit"
                      >
                        <MenuItem value="">All Units</MenuItem>
                        {units.map((unit) => (
                          <MenuItem key={unit} value={unit}>
                            {unit}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      <Button
                        variant="contained"
                        startIcon={<SearchIcon />}
                        onClick={() => fetchActivities()}
                        disabled={loading}
                        size="small"
                      >
                        Search
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={() => {
                          setFilters({
                            page: 0,
                            limit: 10,
                            search: '',
                            status: '',
                            unit: ''
                          });
                        }}
                        size="small"
                      >
                        Reset
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Collapse>
          </Box>

          {/* Data Table */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer 
                component={Paper} 
                sx={{ 
                  maxHeight: 400,
                  overflow: 'auto'
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {columns.map((column) => (
                        <TableCell 
                          key={column.id}
                          sx={{ 
                            padding: '6px 8px',
                            whiteSpace: 'nowrap',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {column.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(activities) && activities.length > 0 ? (
                      activities.map((activity, index) => (
                        <StyledTableRow 
                          key={activity._id || index}
                          selected={index === selectedRowIndex}
                          onClick={() => setSelectedRowIndex(index)}
                          onDoubleClick={() => showModal(activity, true)}
                        >
                          {columns.map((column) => (
                            <TableCell 
                              key={column.id}
                              sx={{ 
                                padding: '4px 8px',
                                whiteSpace: 'nowrap',
                                fontSize: '0.8rem'
                              }}
                            >
                              {column.render ? column.render(activity) : activity[column.id]}
                            </TableCell>
                          ))}
                        </StyledTableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            {error ? 'Error loading data' : 'No activities found'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {activities.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={pagination.total}
                  rowsPerPage={pagination.pageSize}
                  page={pagination.page}
                  onPageChange={(e, newPage) => setFilters(prev => ({ ...prev, page: newPage }))}
                  onRowsPerPageChange={(e) => setFilters(prev => ({ ...prev, limit: e.target.value, page: 0 }))}
                  sx={{
                    '& .MuiTablePagination-toolbar': {
                      minHeight: '40px',
                      padding: '0 8px'
                    },
                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                      fontSize: '0.8rem',
                      marginBottom: 0
                    }
                  }}
                />
              )}
            </>
          )}

          {/* Create/Edit Modal */}
          <Dialog
            open={modalVisible}
            onClose={handleCancel}
            maxWidth="md"
            fullWidth
            scroll="paper"
          >
            <DialogTitle sx={{ py: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {editingActivity ? (
                  <>
                    <EditIcon sx={{ mr: 1, color: 'primary.main', fontSize: '1.2rem' }} />
                    <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                      {viewMode ? 'View Activity' : 'Edit Activity'}
                    </Typography>
                  </>
                ) : (
                  <>
                    <AddIcon sx={{ mr: 1, color: 'success.main', fontSize: '1.2rem' }} />
                    <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                      Create New Activity
                    </Typography>
                  </>
                )}
              </Box>
            </DialogTitle>
            <DialogContent sx={{ py: 1 }}>
              <Grid container spacing={1} sx={{ mt: 0 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Activity Name *"
                    value={formData.activityName}
                    onChange={(e) => handleInputChange('activityName', e.target.value)}
                    error={!!formErrors.activityName && touchedFields.activityName}
                    helperText={formErrors.activityName && touchedFields.activityName ? formErrors.activityName : ''}
                    disabled={viewMode}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, activityName: true }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Activity Code *"
                    value={formData.activityCode}
                    onChange={(e) => handleInputChange('activityCode', e.target.value)}
                    error={!!formErrors.activityCode && touchedFields.activityCode}
                    helperText={formErrors.activityCode && touchedFields.activityCode ? formErrors.activityCode : ''}
                    disabled={viewMode}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, activityCode: true }))}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    label="Description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={viewMode}
                  />
                </Grid>

                {/* Unit Section */}
                <Grid item xs={12}>
                  <FormControl fullWidth size="small" disabled={viewMode}>
                    <InputLabel>Unit *</InputLabel>
                    <Select
                      value={formData.unit}
                      onChange={(e) => handleInputChange('unit', e.target.value)}
                      label="Unit *"
                    >
                      {units.map((unit) => (
                        <MenuItem key={unit} value={unit}>
                          {unit}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Custom Unit Field */}
                {showCustomUnit && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Custom Unit *"
                      value={formData.customUnit}
                      onChange={(e) => handleInputChange('customUnit', e.target.value)}
                      error={!!formErrors.customUnit && touchedFields.customUnit}
                      helperText={formErrors.customUnit && touchedFields.customUnit ? formErrors.customUnit : 'Enter custom unit name'}
                      disabled={viewMode}
                      onBlur={() => setTouchedFields(prev => ({ ...prev, customUnit: true }))}
                    />
                  </Grid>
                )}

                {/* Payment Section */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Payment Per Unit (ETB) *"
                    type="number"
                    value={formData.paymentPerUnit}
                    onChange={(e) => handleInputChange('paymentPerUnit', e.target.value)}
                    error={!!formErrors.paymentPerUnit && touchedFields.paymentPerUnit}
                    helperText={formErrors.paymentPerUnit && touchedFields.paymentPerUnit ? formErrors.paymentPerUnit : 'Amount per unit of measurement'}
                    disabled={viewMode}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, paymentPerUnit: true }))}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoneyIcon />
                        </InputAdornment>
                      ),
                      inputProps: { min: 0, step: 0.01 }
                    }}
                  />
                </Grid>

                {/* Status Section */}
                <Grid item xs={12}>
                  <FormControl fullWidth disabled={viewMode}>
                    <Typography variant="body2" sx={{ mb: 1 }}>Status</Typography>
                    <RadioGroup
                      row
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                    >
                      <FormControlLabel 
                        value="Active" 
                        control={<Radio />} 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CheckCircleIcon sx={{ color: 'success.main', mr: 1, fontSize: 16 }} />
                            Active
                          </Box>
                        }
                      />
                      <FormControlLabel 
                        value="Inactive" 
                        control={<Radio />} 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CancelIcon sx={{ color: 'error.main', mr: 1, fontSize: 16 }} />
                            Inactive
                          </Box>
                        }
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ py: 1 }}>
              {!viewMode && (
                <>
                  <Button onClick={handleCancel} disabled={submitting} size="small">
                    Cancel
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={handleSubmit}
                    disabled={submitting}
                    startIcon={submitting ? <CircularProgress size={16} /> : null}
                    size="small"
                  >
                    {editingActivity ? 'Update Activity' : 'Create Activity'}
                  </Button>
                </>
              )}
              {viewMode && (
                <Button onClick={handleCancel} size="small">
                  Close
                </Button>
              )}
            </DialogActions>
          </Dialog>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ActivityManagement;