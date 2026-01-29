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
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails
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
  Speed as SpeedIcon,
  Inventory as InventoryIcon,
  Schedule as ScheduleIcon,
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

const LineManagement = ({ onBack }) => {
  const navigate = useNavigate();
  const [lines, setLines] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLine, setEditingLine] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [filters, setFilters] = useState({
    page: 0,
    limit: 10,
    search: '',
    status: '',
    product: ''
  });
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0
  });
  const [stats, setStats] = useState({
    totalLines: 0,
    activeLines: 0,
    inactiveLines: 0,
    maintenanceLines: 0,
    totalHourlyCapacity: 0,
    totalDailyCapacity: 0
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [expandedSection, setExpandedSection] = useState('capacity');

  // API base URLs
  const API_BASE = 'http://localhost:5000/api/linemanagements';
  const PRODUCTS_API = 'http://localhost:5000/api/linemanagements/products/active'; // Fixed endpoint

  // Use debounced search
  const debouncedSearch = useDebounce(filters.search, 500);

  // Form state
  const [formData, setFormData] = useState({
    lineName: '',
    lineCode: '',
    description: '',
    capacity: {
      hourlyCapacity: '',
      dailyCapacity: '',
      weeklyCapacity: '',
      monthlyCapacity: ''
    },
    operationalHours: {
      shiftsPerDay: 2,
      hoursPerShift: 8,
      workingDaysPerWeek: 5
    },
    products: [],
    status: 'active'
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
    
    if (!formData.lineName.trim()) {
      errors.lineName = 'Line name is required';
    }
    
    if (!formData.lineCode.trim()) {
      errors.lineCode = 'Line code is required';
    }

    // Validate capacity fields
    const capacityFields = ['hourlyCapacity', 'dailyCapacity', 'weeklyCapacity', 'monthlyCapacity'];
    capacityFields.forEach(field => {
      const value = formData.capacity[field];
      if (!value || value === '' || isNaN(value) || parseFloat(value) <= 0) {
        errors[`capacity.${field}`] = `Valid ${field} is required`;
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    
    // Real-time validation
    if (touchedFields[field] || formErrors[field]) {
      const errors = { ...formErrors };
      
      if ((field === 'lineName' || field === 'lineCode') && !value.trim()) {
        errors[field] = `${field.replace(/([A-Z])/g, ' $1')} is required`;
      } else {
        delete errors[field];
      }
      
      setFormErrors(errors);
    }
  };

  // Handle product selection
  const handleProductChange = (event) => {
    const { value } = event.target;
    setFormData(prev => ({
      ...prev,
      products: typeof value === 'string' ? value.split(',') : value
    }));
  };

  // Calculate derived capacities based on operational hours
  const calculateDerivedCapacity = () => {
    const hourly = parseFloat(formData.capacity.hourlyCapacity) || 0;
    const shiftsPerDay = formData.operationalHours.shiftsPerDay;
    const hoursPerShift = formData.operationalHours.hoursPerShift;
    const workingDays = formData.operationalHours.workingDaysPerWeek;

    const dailyHours = shiftsPerDay * hoursPerShift;
    const weeklyHours = dailyHours * workingDays;
    const monthlyHours = weeklyHours * 4; // Approximate

    return {
      calculatedDaily: (hourly * dailyHours).toFixed(2),
      calculatedWeekly: (hourly * weeklyHours).toFixed(2),
      calculatedMonthly: (hourly * monthlyHours).toFixed(2)
    };
  };

  // Enhanced fetch products with better error handling
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const response = await axios.get(PRODUCTS_API);
      
      let productsData = [];
      if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
      } else if (response.data && Array.isArray(response.data.products)) {
        productsData = response.data.products;
      }
      
      // Use the transformed products directly from backend
      setProducts(productsData);

      if (productsData.length === 0) {
        addNotification('No active products found. Please add active products first.', 'warning');
      }

    } catch (error) {
      console.error('Error fetching products:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.statusText || 
                          error.message || 
                          'Failed to fetch products from database';
      
      addNotification(`Failed to load products: ${errorMessage}`, 'error');
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // Enhanced fetch lines with better error handling and data processing
  const fetchLines = useCallback(async () => {
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
      
      let linesData = [];
      
      if (response.data && Array.isArray(response.data.data)) {
        linesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        linesData = response.data;
      } else if (response.data && Array.isArray(response.data.lines)) {
        linesData = response.data.lines;
      }
      
      // Use the processed lines directly from backend (products already transformed)
      setLines(linesData);
      
      if (response.data.pagination) {
        setPagination({
          page: (response.data.pagination.currentPage || 1) - 1,
          pageSize: filters.limit,
          total: response.data.pagination.totalItems || linesData.length
        });
      }
      
      // Enhanced stats calculation with fallbacks
      const activeLines = linesData.filter(line => line.status === 'active');
      const inactiveLines = linesData.filter(line => line.status === 'inactive');
      const maintenanceLines = linesData.filter(line => line.status === 'maintenance');
      
      const totalHourlyCapacity = activeLines.reduce((sum, line) => {
        const capacity = line.capacity?.hourlyCapacity;
        return sum + (typeof capacity === 'number' ? capacity : 0);
      }, 0);
      
      const totalDailyCapacity = activeLines.reduce((sum, line) => {
        const capacity = line.capacity?.dailyCapacity;
        return sum + (typeof capacity === 'number' ? capacity : 0);
      }, 0);
      
      setStats({
        totalLines: linesData.length,
        activeLines: activeLines.length,
        inactiveLines: inactiveLines.length,
        maintenanceLines: maintenanceLines.length,
        totalHourlyCapacity,
        totalDailyCapacity
      });

      setSelectedRowIndex(-1);
    } catch (error) {
      console.error('Error fetching lines:', error);
      
      let errorMessage = 'Failed to fetch lines';
      let detailedError = '';
      
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.statusText;
        detailedError = error.response.data?.error;
        
        // Handle specific error types
        if (error.response.status === 404) {
          errorMessage = 'Lines API endpoint not found';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error occurred while fetching lines';
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check if the backend is running.';
      } else {
        errorMessage = error.message;
      }
      
      const fullErrorMessage = `${errorMessage}${detailedError ? `: ${detailedError}` : ''}`;
      setError(fullErrorMessage);
      addNotification(`Error fetching lines: ${errorMessage}`, 'error');
      setLines([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLines();
    fetchProducts();
  }, [fetchLines, fetchProducts, debouncedSearch]);

  const showModal = (line = null, view = false) => {
    setEditingLine(line);
    setViewMode(view);
    setModalVisible(true);
    setExpandedSection('capacity');
    
    setFormErrors({});
    setTouchedFields({});
    
    if (line) {
      setFormData({
        lineName: line.lineName || '',
        lineCode: line.lineCode || '',
        description: line.description || '',
        capacity: {
          hourlyCapacity: line.capacity?.hourlyCapacity || '',
          dailyCapacity: line.capacity?.dailyCapacity || '',
          weeklyCapacity: line.capacity?.weeklyCapacity || '',
          monthlyCapacity: line.capacity?.monthlyCapacity || ''
        },
        operationalHours: {
          shiftsPerDay: line.operationalHours?.shiftsPerDay || 2,
          hoursPerShift: line.operationalHours?.hoursPerShift || 8,
          workingDaysPerWeek: line.operationalHours?.workingDaysPerWeek || 5
        },
        products: Array.isArray(line.products) 
          ? line.products.map(p => p._id || p.id || p).filter(id => id)
          : [],
        status: line.status || 'active'
      });
    } else {
      setFormData({
        lineName: '',
        lineCode: '',
        description: '',
        capacity: {
          hourlyCapacity: '',
          dailyCapacity: '',
          weeklyCapacity: '',
          monthlyCapacity: ''
        },
        operationalHours: {
          shiftsPerDay: 2,
          hoursPerShift: 8,
          workingDaysPerWeek: 5
        },
        products: [],
        status: 'active'
      });
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingLine(null);
    setViewMode(false);
    setFormData({
      lineName: '',
      lineCode: '',
      description: '',
      capacity: {
        hourlyCapacity: '',
        dailyCapacity: '',
        weeklyCapacity: '',
        monthlyCapacity: ''
      },
      operationalHours: {
        shiftsPerDay: 2,
        hoursPerShift: 8,
        workingDaysPerWeek: 5
      },
      products: [],
      status: 'active'
    });
    setFormErrors({});
    setTouchedFields({});
  };

  const handleRefresh = () => {
    fetchLines();
    fetchProducts();
    addNotification('Data refreshed successfully', 'success');
  };

  const handleDeleteLine = async (id) => {
    const line = lines.find(l => l._id === id);
    if (!line) return;

    if (!window.confirm(`Are you sure you want to delete line "${line.lineName}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/${id}`);
      addNotification(`Successfully deleted line: ${line.lineName}`, 'success');
      await fetchLines();
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
      lineName: true,
      lineCode: true,
      'capacity.hourlyCapacity': true,
      'capacity.dailyCapacity': true,
      'capacity.weeklyCapacity': true,
      'capacity.monthlyCapacity': true
    };
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
        lineName: formData.lineName.trim(),
        lineCode: formData.lineCode.trim(),
        description: formData.description.trim(),
        capacity: {
          hourlyCapacity: parseFloat(formData.capacity.hourlyCapacity),
          dailyCapacity: parseFloat(formData.capacity.dailyCapacity),
          weeklyCapacity: parseFloat(formData.capacity.weeklyCapacity),
          monthlyCapacity: parseFloat(formData.capacity.monthlyCapacity)
        },
        operationalHours: formData.operationalHours,
        products: formData.products,
        status: formData.status
      };

      let response;
      if (editingLine) {
        response = await axios.put(`${API_BASE}/${editingLine._id}`, submitData);
        addNotification(`Successfully updated line: ${formData.lineName}`, 'success');
      } else {
        response = await axios.post(API_BASE, submitData);
        addNotification(`Successfully created new line: ${formData.lineName}`, 'success');
      }

      setModalVisible(false);
      setEditingLine(null);
      setViewMode(false);
      setFormData({
        lineName: '',
        lineCode: '',
        description: '',
        capacity: {
          hourlyCapacity: '',
          dailyCapacity: '',
          weeklyCapacity: '',
          monthlyCapacity: ''
        },
        operationalHours: {
          shiftsPerDay: 2,
          hoursPerShift: 8,
          workingDaysPerWeek: 5
        },
        products: [],
        status: 'active'
      });
      setFormErrors({});
      setTouchedFields({});
      
      await fetchLines();
      
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
            <title>Production Lines Report</title>
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
              .maintenance { color: orange; }
              .statistics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
              .stat-card { background: #f5f5f5; padding: 10px; border-radius: 5px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Production Lines Report</h1>
              <div class="timestamp">Generated on: ${new Date().toLocaleString()}</div>
            </div>
            
            <div class="statistics">
              <div class="stat-card">
                <h3>Total Lines</h3>
                <p>${stats.totalLines}</p>
              </div>
              <div class="stat-card">
                <h3>Active Lines</h3>
                <p>${stats.activeLines}</p>
              </div>
              <div class="stat-card">
                <h3>Total Hourly Capacity</h3>
                <p>${stats.totalHourlyCapacity} units/hr</p>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Line Code</th>
                  <th>Line Name</th>
                  <th>Hourly Capacity</th>
                  <th>Daily Capacity</th>
                  <th>Operational Hours</th>
                  <th>Products</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${lines.map(line => {
                  const statusClass = line.status || 'inactive';
                  const productsList = Array.isArray(line.products) && line.products.length > 0 ? 
                    line.products.map(p => `${p.productName || p.name || 'Unknown'} (${p.unit || 'N/A'})`).join(', ') : 'None';
                  const operationalHours = line.operationalHours ? 
                    `${line.operationalHours.shiftsPerDay} shifts × ${line.operationalHours.hoursPerShift} hrs` : 'N/A';
                  
                  return `
                    <tr>
                      <td>${line.lineCode || 'N/A'}</td>
                      <td>${line.lineName || 'N/A'}</td>
                      <td>${line.capacity?.hourlyCapacity || 'N/A'}</td>
                      <td>${line.capacity?.dailyCapacity || 'N/A'}</td>
                      <td>${operationalHours}</td>
                      <td>${productsList}</td>
                      <td class="${statusClass}">${line.status || 'N/A'}</td>
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
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'maintenance': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircleIcon />;
      case 'inactive': return <CancelIcon />;
      case 'maintenance': return <BuildIcon />;
      default: return null;
    }
  };

  // Table columns
  const columns = [
    {
      id: 'lineCode',
      label: 'Line Code',
      render: (line) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CodeIcon sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
          <Typography variant="body2" fontWeight="bold" sx={{ whiteSpace: 'nowrap' }}>
            {line.lineCode || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      id: 'lineName',
      label: 'Line Name',
      render: (line) => (
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
          {line.lineName || 'N/A'}
        </Typography>
      )
    },
    {
      id: 'hourlyCapacity',
      label: 'Hourly Capacity',
      render: (line) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SpeedIcon sx={{ mr: 0.5, fontSize: 16, color: 'info.main' }} />
          <Typography variant="body2" fontWeight="bold">
            {line.capacity?.hourlyCapacity || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      id: 'dailyCapacity',
      label: 'Daily Capacity',
      render: (line) => (
        <Typography variant="body2">
          {line.capacity?.dailyCapacity || 'N/A'}
        </Typography>
      )
    },
    {
      id: 'operationalHours',
      label: 'Operational Hours',
      render: (line) => (
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          {line.operationalHours ? 
            `${line.operationalHours.shiftsPerDay}×${line.operationalHours.hoursPerShift}h` : 'N/A'}
        </Typography>
      )
    },
    {
      id: 'products',
      label: 'Products & Units',
      render: (line) => (
        <Box>
          {Array.isArray(line.products) && line.products.length > 0 ? (
            line.products.map((product, index) => (
              <Chip
                key={product._id || product.id || index}
                label={`${product.productName || product.name || 'Unknown'} (${product.unit || 'N/A'})`}
                size="small"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }}
              />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No products
            </Typography>
          )}
        </Box>
      )
    },
    {
      id: 'status',
      label: 'Status',
      render: (line) => (
        <Chip 
          label={line.status || 'Unknown'} 
          color={getStatusColor(line.status)}
          icon={getStatusIcon(line.status)}
          size="small"
        />
      )
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (line) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => showModal(line, true)}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => showModal(line, false)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton 
              size="small" 
              color="error"
              onClick={() => handleDeleteLine(line._id)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const derivedCapacity = calculateDerivedCapacity();

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
              Line Management
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
                  {stats.totalLines}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Total Lines
                </Typography>
              </StatisticCard>
            </Grid>
            <Grid item xs={12} sm={2}>
              <StatisticCard color="green">
                <CheckCircleIcon sx={{ color: 'success.main', fontSize: 30, mb: 0.5 }} />
                <Typography variant="h6" component="div" color="success.main" sx={{ fontSize: '1.1rem' }}>
                  {stats.activeLines}
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
                  {stats.inactiveLines}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Inactive
                </Typography>
              </StatisticCard>
            </Grid>
            <Grid item xs={12} sm={2}>
              <StatisticCard color="orange">
                <BuildIcon sx={{ color: 'warning.main', fontSize: 30, mb: 0.5 }} />
                <Typography variant="h6" component="div" color="warning.main" sx={{ fontSize: '1.1rem' }}>
                  {stats.maintenanceLines}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Maintenance
                </Typography>
              </StatisticCard>
            </Grid>
            <Grid item xs={12} sm={2}>
              <StatisticCard color="blue">
                <SpeedIcon sx={{ color: 'info.main', fontSize: 30, mb: 0.5 }} />
                <Typography variant="h6" component="div" color="info.main" sx={{ fontSize: '1.1rem' }}>
                  {stats.totalHourlyCapacity}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Total Hourly
                </Typography>
              </StatisticCard>
            </Grid>
            <Grid item xs={12} sm={2}>
              <StatisticCard color="blue">
                <ScheduleIcon sx={{ color: 'info.main', fontSize: 30, mb: 0.5 }} />
                <Typography variant="h6" component="div" color="info.main" sx={{ fontSize: '1.1rem' }}>
                  {stats.totalDailyCapacity}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Total Daily
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
                  Add Line
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
                      label="Search lines..."
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
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                        <MenuItem value="maintenance">Maintenance</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Product</InputLabel>
                      <Select
                        value={filters.product}
                        onChange={(e) => setFilters(prev => ({ ...prev, product: e.target.value, page: 0 }))}
                        label="Product"
                      >
                        <MenuItem value="">All Products</MenuItem>
                        {Array.isArray(products) && products.map(product => (
                          <MenuItem key={product._id} value={product._id}>
                            {product.displayName || product.productName}
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
                        onClick={() => fetchLines()}
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
                            product: ''
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
                    {Array.isArray(lines) && lines.length > 0 ? (
                      lines.map((line, index) => (
                        <StyledTableRow 
                          key={line._id || index}
                          selected={index === selectedRowIndex}
                          onClick={() => setSelectedRowIndex(index)}
                          onDoubleClick={() => showModal(line, true)}
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
                              {column.render ? column.render(line) : line[column.id]}
                            </TableCell>
                          ))}
                        </StyledTableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            {error ? 'Error loading data' : 'No production lines found'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {lines.length > 0 && (
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
                {editingLine ? (
                  <>
                    <EditIcon sx={{ mr: 1, color: 'primary.main', fontSize: '1.2rem' }} />
                    <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                      {viewMode ? 'View Line' : 'Edit Line'}
                    </Typography>
                  </>
                ) : (
                  <>
                    <AddIcon sx={{ mr: 1, color: 'success.main', fontSize: '1.2rem' }} />
                    <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                      Create New Line
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
                    label="Line Name *"
                    value={formData.lineName}
                    onChange={(e) => handleInputChange('lineName', e.target.value)}
                    error={!!formErrors.lineName && touchedFields.lineName}
                    helperText={formErrors.lineName && touchedFields.lineName ? formErrors.lineName : ''}
                    disabled={viewMode}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, lineName: true }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Line Code *"
                    value={formData.lineCode}
                    onChange={(e) => handleInputChange('lineCode', e.target.value)}
                    error={!!formErrors.lineCode && touchedFields.lineCode}
                    helperText={formErrors.lineCode && touchedFields.lineCode ? formErrors.lineCode : ''}
                    disabled={viewMode}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, lineCode: true }))}
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

                {/* Capacity Section */}
                <Grid item xs={12}>
                  <Accordion 
                    expanded={expandedSection === 'capacity'} 
                    onChange={() => setExpandedSection(expandedSection === 'capacity' ? '' : 'capacity')}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SpeedIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography>Capacity Settings</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={1}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Hourly Capacity (units/hr) *"
                            type="number"
                            value={formData.capacity.hourlyCapacity}
                            onChange={(e) => handleInputChange('capacity.hourlyCapacity', e.target.value)}
                            error={!!formErrors['capacity.hourlyCapacity']}
                            helperText={formErrors['capacity.hourlyCapacity'] || 'Base capacity per hour'}
                            disabled={viewMode}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <SpeedIcon />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Daily Capacity (units/day) *"
                            type="number"
                            value={formData.capacity.dailyCapacity}
                            onChange={(e) => handleInputChange('capacity.dailyCapacity', e.target.value)}
                            error={!!formErrors['capacity.dailyCapacity']}
                            helperText={formErrors['capacity.dailyCapacity'] || `Calculated: ${derivedCapacity.calculatedDaily} units`}
                            disabled={viewMode}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Weekly Capacity (units/week) *"
                            type="number"
                            value={formData.capacity.weeklyCapacity}
                            onChange={(e) => handleInputChange('capacity.weeklyCapacity', e.target.value)}
                            error={!!formErrors['capacity.weeklyCapacity']}
                            helperText={formErrors['capacity.weeklyCapacity'] || `Calculated: ${derivedCapacity.calculatedWeekly} units`}
                            disabled={viewMode}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Monthly Capacity (units/month) *"
                            type="number"
                            value={formData.capacity.monthlyCapacity}
                            onChange={(e) => handleInputChange('capacity.monthlyCapacity', e.target.value)}
                            error={!!formErrors['capacity.monthlyCapacity']}
                            helperText={formErrors['capacity.monthlyCapacity'] || `Calculated: ${derivedCapacity.calculatedMonthly} units`}
                            disabled={viewMode}
                          />
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Grid>

                {/* Operational Hours Section */}
                <Grid item xs={12}>
                  <Accordion 
                    expanded={expandedSection === 'operational'} 
                    onChange={() => setExpandedSection(expandedSection === 'operational' ? '' : 'operational')}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography>Operational Hours</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={1}>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Shifts Per Day"
                            type="number"
                            value={formData.operationalHours.shiftsPerDay}
                            onChange={(e) => handleInputChange('operationalHours.shiftsPerDay', parseInt(e.target.value) || 2)}
                            disabled={viewMode}
                            inputProps={{ min: 1, max: 3 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Hours Per Shift"
                            type="number"
                            value={formData.operationalHours.hoursPerShift}
                            onChange={(e) => handleInputChange('operationalHours.hoursPerShift', parseInt(e.target.value) || 8)}
                            disabled={viewMode}
                            inputProps={{ min: 4, max: 12 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Working Days/Week"
                            type="number"
                            value={formData.operationalHours.workingDaysPerWeek}
                            onChange={(e) => handleInputChange('operationalHours.workingDaysPerWeek', parseInt(e.target.value) || 5)}
                            disabled={viewMode}
                            inputProps={{ min: 1, max: 7 }}
                          />
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Grid>

                {/* Products Section */}
                <Grid item xs={12}>
                  <Accordion 
                    expanded={expandedSection === 'products'} 
                    onChange={() => setExpandedSection(expandedSection === 'products' ? '' : 'products')}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <InventoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography>Associated Products</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <FormControl fullWidth size="small" disabled={viewMode || productsLoading}>
                        <InputLabel>Products</InputLabel>
                        <Select
                          multiple
                          value={formData.products}
                          onChange={handleProductChange}
                          label="Products"
                          renderValue={(selected) => {
                            const selectedProducts = Array.isArray(products) ? 
                              products.filter(p => selected.includes(p._id)) : [];
                            return selectedProducts.map(p => p.displayName || p.productName).join(', ');
                          }}
                        >
                          {productsLoading ? (
                            <MenuItem disabled>
                              <CircularProgress size={20} sx={{ mr: 1 }} />
                              Loading products...
                            </MenuItem>
                          ) : !Array.isArray(products) || products.length === 0 ? (
                            <MenuItem disabled>
                              No products available
                            </MenuItem>
                          ) : (
                            products.map((product) => (
                              <MenuItem key={product._id} value={product._id}>
                                <Checkbox checked={formData.products.indexOf(product._id) > -1} />
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                  <Typography variant="body2" fontWeight="medium">
                                    {product.displayName || product.productName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Unit: {product.unit || 'N/A'}
                                    {product.productCode && ` | Code: ${product.productCode}`}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))
                          )}
                        </Select>
                      </FormControl>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Select products that this production line can manufacture.
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth size="small" disabled={viewMode}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="maintenance">Maintenance</MenuItem>
                    </Select>
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
                    {editingLine ? 'Update Line' : 'Create Line'}
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

export default LineManagement;