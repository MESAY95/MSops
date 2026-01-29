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
  FormControlLabel,
  Checkbox,
  Autocomplete,
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
  Person as PersonIcon,
  AttachMoney as AttachMoneyIcon,
  DateRange as DateRangeIcon,
  Home as HomeIcon,
  ImportExport as ImportExportIcon,
  TrendingUp as TrendingUpIcon,
  ExpandMore as ExpandMoreIcon,
  Build as BuildIcon,
  PlaylistPlay as PlaylistPlayIcon,
  Visibility as VisibilityIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Payment as PaymentIcon,
  AccessTime as AccessTimeIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
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

const LaborCost = ({ onBack }) => {
  const navigate = useNavigate();
  const [laborCosts, setLaborCosts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLaborCost, setEditingLaborCost] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [filters, setFilters] = useState({
    page: 0,
    limit: 10,
    search: '',
    status: '',
    employee: '',
    activity: '',
    startDate: null,
    endDate: null
  });
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0
  });
  const [stats, setStats] = useState({
    totalLaborCosts: 0,
    pendingLaborCosts: 0,
    approvedLaborCosts: 0,
    rejectedLaborCosts: 0,
    paidLaborCosts: 0,
    totalAmount: 0,
    avgAmount: 0
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [employeesWithCosts, setEmployeesWithCosts] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [bulkSelected, setBulkSelected] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  // API base URLs
  const API_BASE = 'http://localhost:5000/api/laborcosts';
  const EMPLOYEES_API = 'http://localhost:5000/api/laborcosts/employees/active';
  const ACTIVITIES_API = 'http://localhost:5000/api/laborcosts/activities/active';
  const EMPLOYEES_WITH_COSTS_API = (date) => `${API_BASE}/date/${date}/employees`;
  const DUPLICATE_CHECK_API = `${API_BASE}/check/duplicate`;

  // Use debounced search
  const debouncedSearch = useDebounce(filters.search, 500);

  // Form state
  const [formData, setFormData] = useState({
    employee: '',
    activity: '',
    date: new Date(),
    quantity: '',
    remarks: '',
    status: 'Pending'
  });

  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  // Get current date in YYYY-MM-DD format
  const getCurrentDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Format date to YYYY-MM-DD for API
  const formatDateForAPI = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Check if a date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    const compareDate = new Date(date);
    return (
      compareDate.getDate() === today.getDate() &&
      compareDate.getMonth() === today.getMonth() &&
      compareDate.getFullYear() === today.getFullYear()
    );
  };

  // Format date for display
  const formatDateForDisplay = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
    
    if (!formData.employee) {
      errors.employee = 'Employee is required';
    }
    
    if (!formData.activity) {
      errors.activity = 'Activity is required';
    }

    if (!formData.date) {
      errors.date = 'Date is required';
    } else if (new Date(formData.date) > new Date()) {
      errors.date = 'Date cannot be in the future';
    } else if (!isToday(formData.date) && !editingLaborCost) {
      errors.date = 'Only current date is allowed for new entries';
    }

    if (!formData.quantity || isNaN(formData.quantity) || parseFloat(formData.quantity) <= 0) {
      errors.quantity = 'Valid quantity is required (must be positive)';
    } else if (parseFloat(formData.quantity) > 1000) {
      errors.quantity = 'Quantity cannot exceed 1000';
    } else if (parseFloat(formData.quantity) < 0.1) {
      errors.quantity = 'Quantity must be at least 0.1';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check for duplicate entry
  const checkDuplicate = async (employeeId, activityId, date) => {
    try {
      const params = new URLSearchParams({
        employeeId,
        activityId,
        date: formatDateForAPI(date)
      });
      
      const response = await axios.get(`${DUPLICATE_CHECK_API}?${params}`);
      return response.data.isDuplicate;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return false;
    }
  };

  const handleInputChange = async (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    
    // Real-time validation
    if (touchedFields[field] || formErrors[field]) {
      const errors = { ...formErrors };
      
      if ((field === 'employee' || field === 'activity') && !value) {
        errors[field] = `${field} is required`;
      } else if (field === 'quantity' && (!value || isNaN(value) || parseFloat(value) <= 0)) {
        errors.quantity = 'Valid quantity is required';
      } else if (field === 'date' && value) {
        const dateValue = new Date(value);
        if (dateValue > new Date()) {
          errors.date = 'Date cannot be in the future';
        } else if (!isToday(dateValue) && !editingLaborCost) {
          errors.date = 'Only current date is allowed for new entries';
        }
      } else {
        delete errors[field];
      }
      
      setFormErrors(errors);
    }
    
    // Check for duplicate when all required fields are filled
    if (field === 'date' || field === 'employee' || field === 'activity') {
      if (formData.employee && formData.activity && formData.date && !editingLaborCost) {
        const isDuplicate = await checkDuplicate(formData.employee, formData.activity, formData.date);
        if (isDuplicate) {
          setFormErrors(prev => ({
            ...prev,
            duplicate: 'This employee already has this activity recorded for the selected date'
          }));
        } else {
          setFormErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.duplicate;
            return newErrors;
          });
        }
      }
    }
  };

  // Fetch employees - only fetch for current date
  const fetchEmployees = useCallback(async (date = null) => {
    setEmployeesLoading(true);
    try {
      // Only fetch employees if the selected date is today
      const checkDate = date || selectedDate;
      if (!isToday(checkDate)) {
        setEmployees([]);
        setEmployeesLoading(false);
        return;
      }
      
      const currentDateStr = getCurrentDateString();
      const url = `${EMPLOYEES_API}?date=${currentDateStr}`;
      const response = await axios.get(url);
      
      const employeeData = Array.isArray(response.data) ? response.data.map(emp => ({
        _id: emp._id,
        displayName: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
        firstName: emp.firstName || '',
        lastName: emp.lastName || '',
        employeeId: emp.employeeId || '',
        department: emp.department || ''
      })) : [];
      
      setEmployees(employeeData);
    } catch (error) {
      console.error('Error fetching employees:', error);
      addNotification('Failed to load employees', 'error');
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  }, [selectedDate]);

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const response = await axios.get(ACTIVITIES_API);
      
      const activityData = Array.isArray(response.data) ? response.data.map(activity => ({
        _id: activity._id,
        displayName: `${activity.activityCode} - ${activity.activityName}`,
        activityCode: activity.activityCode || '',
        activityName: activity.activityName || '',
        unit: activity.unit || '',
        paymentPerUnit: activity.paymentPerUnit || 0
      })) : [];
      
      setActivities(activityData);
    } catch (error) {
      console.error('Error fetching activities:', error);
      addNotification('Failed to load activities', 'error');
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  // Fetch employees with existing labor costs - only for current date
  const fetchEmployeesWithCosts = useCallback(async (date) => {
    if (!isToday(date)) {
      setEmployeesWithCosts([]);
      return;
    }
    
    try {
      const currentDateStr = getCurrentDateString();
      const response = await axios.get(`${EMPLOYEES_WITH_COSTS_API(currentDateStr)}`);
      setEmployeesWithCosts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching employees with costs:', error);
      setEmployeesWithCosts([]);
    }
  }, []);

  // Fetch labor costs
  const fetchLaborCosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      
      // Fix pagination: Convert to 1-based for backend
      const pageNumber = filters.page + 1;
      params.append('page', pageNumber);
      params.append('limit', filters.limit);
      
      // Add other filters
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.employee) params.append('employee', filters.employee);
      if (filters.activity) params.append('activity', filters.activity);
      if (filters.startDate) params.append('startDate', formatDateForAPI(filters.startDate));
      if (filters.endDate) params.append('endDate', formatDateForAPI(filters.endDate));
      
      params.append('sortBy', 'date');
      params.append('sortOrder', 'desc');

      const response = await axios.get(`${API_BASE}?${params}`);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      let laborCostsData = [];
      let paginationData = {
        page: 0,
        pageSize: filters.limit,
        total: 0
      };
      let summaryData = {
        totalAmount: 0,
        totalRecords: 0
      };
      
      // Handle different response formats
      if (response.data.data && Array.isArray(response.data.data)) {
        laborCostsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        laborCostsData = response.data;
      }
      
      if (response.data.pagination) {
        // Convert 1-based backend pagination to 0-based frontend
        paginationData = {
          page: (response.data.pagination.currentPage || 1) - 1,
          pageSize: response.data.pagination.itemsPerPage || filters.limit,
          total: response.data.pagination.totalItems || 0
        };
      }
      
      if (response.data.summary) {
        summaryData = {
          totalAmount: parseFloat(response.data.summary.totalAmount) || 0,
          totalRecords: response.data.summary.totalRecords || 0
        };
      }
      
      // Format the data
      const formattedLaborCosts = laborCostsData.map(cost => {
        const formattedDate = formatDateForDisplay(cost.date);
        
        return {
          ...cost,
          formattedDate,
          employee: cost.employee ? {
            ...cost.employee,
            fullName: `${cost.employee.firstName || ''} ${cost.employee.lastName || ''}`.trim(),
            employeeId: cost.employee.employeeId || 'N/A'
          } : { fullName: 'N/A', employeeId: 'N/A' },
          activity: cost.activity ? {
            ...cost.activity,
            activityCode: cost.activity.activityCode || 'N/A',
            activityName: cost.activity.activityName || 'N/A'
          } : { activityCode: 'N/A', activityName: 'N/A' },
          isEditable: cost.status === 'Pending' || cost.status === 'Rejected'
        };
      });
      
      setLaborCosts(formattedLaborCosts);
      setPagination(paginationData);
      
      // Calculate statistics
      const pendingCount = formattedLaborCosts.filter(cost => cost.status === 'Pending').length;
      const approvedCount = formattedLaborCosts.filter(cost => cost.status === 'Approved').length;
      const rejectedCount = formattedLaborCosts.filter(cost => cost.status === 'Rejected').length;
      const paidCount = formattedLaborCosts.filter(cost => cost.status === 'Paid').length;
      
      const totalAmount = formattedLaborCosts.reduce((sum, cost) => 
        sum + (parseFloat(cost.totalAmount) || 0), 0
      );
      
      const avgAmount = formattedLaborCosts.length > 0 ? 
        totalAmount / formattedLaborCosts.length : 0;
      
      setStats({
        totalLaborCosts: summaryData.totalRecords,
        pendingLaborCosts: pendingCount,
        approvedLaborCosts: approvedCount,
        rejectedLaborCosts: rejectedCount,
        paidLaborCosts: paidCount,
        totalAmount: totalAmount,
        avgAmount: avgAmount
      });

      setSelectedRowIndex(-1);
      
    } catch (error) {
      console.error('Error fetching labor costs:', error);
      
      let errorMessage = 'Failed to fetch labor costs';
      let detailedError = '';
      
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.statusText;
        detailedError = error.response.data?.error;
        
        if (error.response.status === 400) {
          if (detailedError && detailedError.includes("BSON field 'skip'")) {
            errorMessage = 'Pagination error. Please refresh the page.';
          }
        } else if (error.response.status === 404) {
          errorMessage = 'Labor costs API endpoint not found';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error occurred while fetching labor costs';
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check if the backend is running at http://localhost:5000';
      } else {
        errorMessage = error.message;
      }
      
      const fullErrorMessage = `${errorMessage}${detailedError ? `: ${detailedError}` : ''}`;
      setError(fullErrorMessage);
      addNotification(`Error: ${errorMessage}`, 'error');
      setLaborCosts([]);
      setPagination({ page: 0, pageSize: 10, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLaborCosts();
    fetchActivities();
    fetchEmployees(new Date());
    fetchEmployeesWithCosts(new Date());
  }, [fetchLaborCosts, fetchActivities, fetchEmployees, fetchEmployeesWithCosts, debouncedSearch]);

  const showModal = (laborCost = null, view = false) => {
    setEditingLaborCost(laborCost);
    setViewMode(view);
    setModalVisible(true);
    
    setFormErrors({});
    setTouchedFields({});
    
    if (laborCost) {
      setFormData({
        employee: laborCost.employee?._id || '',
        activity: laborCost.activity?._id || '',
        date: new Date(laborCost.date || new Date()),
        quantity: laborCost.quantity || '',
        remarks: laborCost.remarks || '',
        status: laborCost.status || 'Pending'
      });
    } else {
      const currentDate = new Date();
      setFormData({
        employee: selectedEmployeeId || '',
        activity: '',
        date: currentDate,
        quantity: '',
        remarks: '',
        status: 'Pending'
      });
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingLaborCost(null);
    setViewMode(false);
    setSelectedEmployeeId('');
    setFormData({
      employee: '',
      activity: '',
      date: new Date(),
      quantity: '',
      remarks: '',
      status: 'Pending'
    });
    setFormErrors({});
    setTouchedFields({});
  };

  const handleRefresh = () => {
    fetchLaborCosts();
    fetchActivities();
    fetchEmployees(new Date());
    fetchEmployeesWithCosts(new Date());
    addNotification('Data refreshed successfully', 'success');
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (isToday(date)) {
      fetchEmployees(date);
      fetchEmployeesWithCosts(date);
    } else {
      setEmployees([]);
      setEmployeesWithCosts([]);
    }
  };

  const handleDeleteLaborCost = async (id) => {
    const laborCost = laborCosts.find(l => l._id === id);
    if (!laborCost) return;

    if (!window.confirm(`Are you sure you want to delete this labor cost record?`)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/${id}`);
      addNotification('Successfully deleted labor cost record', 'success');
      await fetchLaborCosts();
      fetchEmployeesWithCosts(new Date());
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
      employee: true,
      activity: true,
      date: true,
      quantity: true
    };
    
    setTouchedFields(allTouched);
    
    // Validate date is today for new entries
    if (!editingLaborCost && !isToday(formData.date)) {
      setFormErrors(prev => ({
        ...prev,
        date: 'Only current date is allowed for new entries'
      }));
      const errorMsg = 'Only current date is allowed for new entries';
      setError(errorMsg);
      addNotification(errorMsg, 'error');
      return;
    }
    
    // Check for duplicate entry
    if (!editingLaborCost) {
      const isDuplicate = await checkDuplicate(formData.employee, formData.activity, formData.date);
      if (isDuplicate) {
        setFormErrors(prev => ({
          ...prev,
          duplicate: 'This employee already has this activity recorded for the selected date'
        }));
        addNotification('Duplicate entry detected', 'error');
        return;
      }
    }
    
    if (!validateForm()) {
      const errorMsg = 'Please fix the validation errors before submitting';
      setError(errorMsg);
      addNotification(errorMsg, 'error');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Get selected activity to get unit rate
      const selectedActivity = activities.find(a => a._id === formData.activity);
      const unitRate = selectedActivity?.paymentPerUnit || 0;
      const unit = selectedActivity?.unit || '';
      
      const submitData = {
        employee: formData.employee,
        activity: formData.activity,
        date: formatDateForAPI(formData.date),
        quantity: parseFloat(formData.quantity),
        remarks: formData.remarks,
        status: formData.status
      };

      let response;
      if (editingLaborCost) {
        response = await axios.put(`${API_BASE}/${editingLaborCost._id}`, submitData);
        addNotification('Successfully updated labor cost record', 'success');
      } else {
        response = await axios.post(API_BASE, submitData);
        addNotification('Successfully created new labor cost record', 'success');
      }

      setModalVisible(false);
      setEditingLaborCost(null);
      setViewMode(false);
      setSelectedEmployeeId('');
      setFormData({
        employee: '',
        activity: '',
        date: new Date(),
        quantity: '',
        remarks: '',
        status: 'Pending'
      });
      setFormErrors({});
      setTouchedFields({});
      
      await fetchLaborCosts();
      fetchEmployees(new Date());
      fetchEmployeesWithCosts(new Date());
      
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

  // Bulk actions
  const handleBulkSelect = (id) => {
    setBulkSelected(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (bulkSelected.length === laborCosts.length) {
      setBulkSelected([]);
    } else {
      setBulkSelected(laborCosts.map(cost => cost._id));
    }
  };

  const handleBulkAction = async () => {
    if (bulkSelected.length === 0) {
      addNotification('Please select records to perform bulk action', 'warning');
      return;
    }

    if (!bulkAction) {
      addNotification('Please select an action to perform', 'warning');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/bulk/status`, {
        ids: bulkSelected,
        status: bulkAction
      });

      addNotification(`Successfully ${bulkAction.toLowerCase()}d ${response.data.modifiedCount} record(s)`, 'success');
      
      await fetchLaborCosts();
      fetchEmployeesWithCosts(new Date());
      
      setBulkSelected([]);
      setBulkAction('');
    } catch (error) {
      console.error('Bulk action error:', error);
      const errorMessage = error.response?.data?.message || 'Bulk action failed';
      addNotification(`Bulk action failed: ${errorMessage}`, 'error');
    }
  };

  // Print functionality
  const handlePrint = () => {
    try {
      const printContent = `
        <html>
          <head>
            <title>Labor Cost Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { margin-bottom: 20px; }
              .timestamp { color: #666; font-size: 14px; }
              .pending { color: orange; }
              .approved { color: green; }
              .rejected { color: red; }
              .paid { color: blue; }
              .statistics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
              .stat-card { background: #f5f5f5; padding: 10px; border-radius: 5px; text-align: center; }
              .amount { text-align: right; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Labor Cost Report</h1>
              <div class="timestamp">Generated on: ${new Date().toLocaleString()}</div>
              <div class="timestamp">Date Range: ${filters.startDate ? formatDateForDisplay(filters.startDate) : 'All'} - ${filters.endDate ? formatDateForDisplay(filters.endDate) : 'All'}</div>
            </div>
            
            <div class="statistics">
              <div class="stat-card">
                <h3>Total Records</h3>
                <p>${stats.totalLaborCosts}</p>
              </div>
              <div class="stat-card">
                <h3>Total Amount</h3>
                <p>${stats.totalAmount.toFixed(2)} ETB</p>
              </div>
              <div class="stat-card">
                <h3>Average Amount</h3>
                <p>${stats.avgAmount.toFixed(2)} ETB</p>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Activity Code</th>
                  <th>Quantity</th>
                  <th>Unit Rate</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${laborCosts.map(cost => {
                  const statusClass = cost.status.toLowerCase();
                  const employeeName = cost.employee ? cost.employee.fullName : 'N/A';
                  const activityCode = cost.activity ? cost.activity.activityCode : 'N/A';
                  
                  return `
                    <tr>
                      <td>${cost.formattedDate || 'N/A'}</td>
                      <td>${employeeName}</td>
                      <td>${activityCode}</td>
                      <td>${cost.quantity || '0'} ${cost.unit || ''}</td>
                      <td class="amount">${cost.unitRate || '0.00'} ETB</td>
                      <td class="amount">${cost.totalAmount || '0.00'} ETB</td>
                      <td class="${statusClass}">${cost.status || 'N/A'}</td>
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

  // Handle pagination changes
  const handlePageChange = (event, newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event) => {
    const newPageSize = parseInt(event.target.value, 10);
    setFilters(prev => ({ ...prev, limit: newPageSize, page: 0 }));
  };

  // Status colors and icons
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Approved': return 'success';
      case 'Rejected': return 'error';
      case 'Paid': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <AccessTimeIcon />;
      case 'Approved': return <CheckCircleIcon />;
      case 'Rejected': return <CancelIcon />;
      case 'Paid': return <PaymentIcon />;
      default: return null;
    }
  };

  // Table columns
  const columns = [
    {
      id: 'select',
      label: '',
      render: (cost) => (
        <Checkbox
          size="small"
          checked={bulkSelected.includes(cost._id)}
          onChange={() => handleBulkSelect(cost._id)}
        />
      )
    },
    {
      id: 'date',
      label: 'Date',
      render: (cost) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DateRangeIcon sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
          <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
            {cost.formattedDate || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      id: 'employee',
      label: 'Employee',
      render: (cost) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {cost.employee ? cost.employee.fullName : 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {cost.employee?.employeeId || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      id: 'activity',
      label: 'Activity',
      render: (cost) => (
        <Box>
          <Typography variant="body2">
            {cost.activity ? cost.activity.activityCode : 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {cost.activity?.activityName || ''}
          </Typography>
        </Box>
      )
    },
    {
      id: 'quantity',
      label: 'Qty / Unit',
      render: (cost) => (
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
          {cost.quantity || '0'} {cost.unit || ''}
        </Typography>
      )
    },
    {
      id: 'totalAmount',
      label: 'Total Amount',
      render: (cost) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AttachMoneyIcon sx={{ mr: 0.5, fontSize: 16, color: 'success.main' }} />
          <Typography variant="body2" fontWeight="bold">
            {cost.totalAmount ? parseFloat(cost.totalAmount).toFixed(2) : '0.00'} ETB
          </Typography>
        </Box>
      )
    },
    {
      id: 'status',
      label: 'Status',
      render: (cost) => (
        <Chip 
          label={cost.status || 'Unknown'} 
          color={getStatusColor(cost.status)}
          icon={getStatusIcon(cost.status)}
          size="small"
        />
      )
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (cost) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => showModal(cost, true)}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton 
              size="small" 
              onClick={() => showModal(cost, false)}
              disabled={!cost.isEditable}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton 
              size="small" 
              color="error"
              onClick={() => handleDeleteLaborCost(cost._id)}
              disabled={!['Pending', 'Rejected'].includes(cost.status)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  // Employees with costs on selected date
  const EmployeeWithCostsCard = ({ employeeData }) => (
    <Card sx={{ mb: 1 }}>
      <CardContent sx={{ p: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              {employeeData.employee.fullName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {employeeData.employee.employeeId} • {employeeData.employee.department || 'No Department'}
            </Typography>
          </Box>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedEmployeeId(employeeData.employee._id);
              showModal();
            }}
          >
            Add Activity
          </Button>
        </Box>
        
        <Divider sx={{ my: 1 }} />
        
        {employeeData.activities.length > 0 ? (
          <Box>
            <Typography variant="caption" fontWeight="bold" sx={{ display: 'block', mb: 0.5 }}>
              Activities for today:
            </Typography>
            {employeeData.activities.map((activity, index) => (
              <Box key={index} sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                p: 0.5,
                backgroundColor: index % 2 === 0 ? 'action.hover' : 'transparent',
                borderRadius: 0.5
              }}>
                <Box>
                  <Typography variant="caption">
                    {activity.activity.activityCode}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    {activity.quantity} {activity.activity.unit} × {activity.unitRate} ETB
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label={activity.status} 
                    size="small"
                    color={getStatusColor(activity.status)}
                    sx={{ height: 20, fontSize: '0.6rem' }}
                  />
                  <Typography variant="caption" fontWeight="bold">
                    {parseFloat(activity.totalAmount).toFixed(2)} ETB
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary" fontStyle="italic">
            No activities recorded for today
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
                <AttachMoneyIcon sx={{ mr: 1, color: 'primary.main', fontSize: '1.5rem' }} />
                Labor Cost Management
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
                    {stats.totalLaborCosts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Total Records
                  </Typography>
                </StatisticCard>
              </Grid>
              <Grid item xs={12} sm={2}>
                <StatisticCard color="orange">
                  <AccessTimeIcon sx={{ color: 'warning.main', fontSize: 30, mb: 0.5 }} />
                  <Typography variant="h6" component="div" color="warning.main" sx={{ fontSize: '1.1rem' }}>
                    {stats.pendingLaborCosts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Pending
                  </Typography>
                </StatisticCard>
              </Grid>
              <Grid item xs={12} sm={2}>
                <StatisticCard color="green">
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 30, mb: 0.5 }} />
                  <Typography variant="h6" component="div" color="success.main" sx={{ fontSize: '1.1rem' }}>
                    {stats.approvedLaborCosts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Approved
                  </Typography>
                </StatisticCard>
              </Grid>
              <Grid item xs={12} sm={2}>
                <StatisticCard color="red">
                  <CancelIcon sx={{ color: 'error.main', fontSize: 30, mb: 0.5 }} />
                  <Typography variant="h6" component="div" color="error.main" sx={{ fontSize: '1.1rem' }}>
                    {stats.rejectedLaborCosts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Rejected
                  </Typography>
                </StatisticCard>
              </Grid>
              <Grid item xs={12} sm={2}>
                <StatisticCard color="blue">
                  <PaymentIcon sx={{ color: 'info.main', fontSize: 30, mb: 0.5 }} />
                  <Typography variant="h6" component="div" color="info.main" sx={{ fontSize: '1.1rem' }}>
                    {stats.paidLaborCosts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Paid
                  </Typography>
                </StatisticCard>
              </Grid>
              <Grid item xs={12} sm={2}>
                <StatisticCard color="default">
                  <AttachMoneyIcon sx={{ color: 'action', fontSize: 30, mb: 0.5 }} />
                  <Typography variant="h6" component="div" sx={{ fontSize: '1.1rem' }}>
                    {stats.totalAmount.toFixed(2)} ETB
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Total Amount
                  </Typography>
                </StatisticCard>
              </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />

            {/* Date Selection Section */}
            <Box sx={{ mb: 2, p: 1, backgroundColor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                Current Date Entries Only
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} size="small" sx={{ width: 200 }} />}
                  maxDate={new Date()}
                  shouldDisableDate={(date) => !isToday(date)}
                />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Current Date: {formatDateForDisplay(new Date())}
                  </Typography>
                  {!isToday(selectedDate) && (
                    <Typography variant="caption" color="warning.main">
                      Only current date is active for new entries
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Employees with costs on current date */}
            {isToday(selectedDate) && employeesWithCosts.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1, fontSize: 18 }} />
                  Employees with Labor Costs for Today ({employeesWithCosts.length})
                </Typography>
                {employeesWithCosts.map((employeeData, index) => (
                  <EmployeeWithCostsCard key={index} employeeData={employeeData} />
                ))}
              </Box>
            )}

            {/* Bulk Actions Section */}
            {bulkSelected.length > 0 && (
              <Box sx={{ mb: 2, p: 1, backgroundColor: 'action.selected', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Bulk Actions ({bulkSelected.length} selected)
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Action</InputLabel>
                    <Select
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                      label="Action"
                    >
                      <MenuItem value="">Select Action</MenuItem>
                      <MenuItem value="Approved">Approve Selected</MenuItem>
                      <MenuItem value="Rejected">Reject Selected</MenuItem>
                      <MenuItem value="Paid">Mark as Paid</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                    size="small"
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setBulkSelected([])}
                    size="small"
                  >
                    Clear Selection
                  </Button>
                </Box>
              </Box>
            )}

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
                    disabled={!isToday(selectedDate)}
                  >
                    Add Labor Cost
                  </Button>
                </Box>
              </Box>

              <Collapse in={showFilters}>
                <Paper sx={{ p: 1, mb: 1 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Search remarks..."
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
                    <Grid item xs={12} sm={6} md={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={filters.status}
                          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 0 }))}
                          label="Status"
                        >
                          <MenuItem value="">All Status</MenuItem>
                          <MenuItem value="Pending">Pending</MenuItem>
                          <MenuItem value="Approved">Approved</MenuItem>
                          <MenuItem value="Rejected">Rejected</MenuItem>
                          <MenuItem value="Paid">Paid</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <DatePicker
                        label="From Date"
                        value={filters.startDate}
                        onChange={(date) => setFilters(prev => ({ ...prev, startDate: date, page: 0 }))}
                        renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                        maxDate={filters.endDate || new Date()}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <DatePicker
                        label="To Date"
                        value={filters.endDate}
                        onChange={(date) => setFilters(prev => ({ ...prev, endDate: date, page: 0 }))}
                        renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                        minDate={filters.startDate}
                        maxDate={new Date()}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                        <Button
                          variant="contained"
                          startIcon={<SearchIcon />}
                          onClick={() => fetchLaborCosts()}
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
                              employee: '',
                              activity: '',
                              startDate: null,
                              endDate: null
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
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            indeterminate={bulkSelected.length > 0 && bulkSelected.length < laborCosts.length}
                            checked={laborCosts.length > 0 && bulkSelected.length === laborCosts.length}
                            onChange={handleSelectAll}
                          />
                        </TableCell>
                        {columns.filter(col => col.id !== 'select').map((column) => (
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
                      {Array.isArray(laborCosts) && laborCosts.length > 0 ? (
                        laborCosts.map((cost, index) => (
                          <StyledTableRow 
                            key={cost._id || index}
                            selected={index === selectedRowIndex}
                            onClick={() => setSelectedRowIndex(index)}
                            onDoubleClick={() => showModal(cost, true)}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                size="small"
                                checked={bulkSelected.includes(cost._id)}
                                onChange={() => handleBulkSelect(cost._id)}
                              />
                            </TableCell>
                            {columns.filter(col => col.id !== 'select').map((column) => (
                              <TableCell 
                                key={column.id}
                                sx={{ 
                                  padding: '4px 8px',
                                  whiteSpace: 'nowrap',
                                  fontSize: '0.8rem'
                                }}
                              >
                                {column.render ? column.render(cost) : cost[column.id]}
                              </TableCell>
                            ))}
                          </StyledTableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                              {error ? 'Error loading data' : 'No labor cost records found'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {laborCosts.length > 0 && (
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={pagination.total}
                    rowsPerPage={pagination.pageSize}
                    page={pagination.page}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
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
                  {editingLaborCost ? (
                    <>
                      <EditIcon sx={{ mr: 1, color: 'primary.main', fontSize: '1.2rem' }} />
                      <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                        {viewMode ? 'View Labor Cost' : 'Edit Labor Cost'}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <AddIcon sx={{ mr: 1, color: 'success.main', fontSize: '1.2rem' }} />
                      <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                        Create New Labor Cost (Today Only)
                      </Typography>
                    </>
                  )}
                </Box>
              </DialogTitle>
              <DialogContent sx={{ py: 1 }}>
                {formErrors.duplicate && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {formErrors.duplicate}
                  </Alert>
                )}
                
                <Grid container spacing={1} sx={{ mt: 0 }}>
                  {/* Employee Selection */}
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small" disabled={viewMode || employeesLoading}>
                      <InputLabel>Employee *</InputLabel>
                      <Select
                        value={selectedEmployeeId || formData.employee}
                        onChange={(e) => {
                          handleInputChange('employee', e.target.value);
                          setSelectedEmployeeId(e.target.value);
                        }}
                        label="Employee *"
                        error={!!formErrors.employee && touchedFields.employee}
                      >
                        {employeesLoading ? (
                          <MenuItem disabled>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Loading employees...
                          </MenuItem>
                        ) : employees.length === 0 ? (
                          <MenuItem disabled>
                            No available employees for today
                          </MenuItem>
                        ) : (
                          employees.map((employee) => (
                            <MenuItem key={employee._id} value={employee._id}>
                              <Typography variant="body2" fontWeight="medium">
                                {employee.displayName} ({employee.employeeId})
                              </Typography>
                            </MenuItem>
                          ))
                        )}
                      </Select>
                      {formErrors.employee && touchedFields.employee && (
                        <FormHelperText error>{formErrors.employee}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Activity Selection */}
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small" disabled={viewMode || activitiesLoading}>
                      <InputLabel>Activity *</InputLabel>
                      <Select
                        value={formData.activity}
                        onChange={(e) => handleInputChange('activity', e.target.value)}
                        label="Activity *"
                        error={!!formErrors.activity && touchedFields.activity}
                      >
                        {activitiesLoading ? (
                          <MenuItem disabled>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Loading activities...
                          </MenuItem>
                        ) : activities.length === 0 ? (
                          <MenuItem disabled>
                            No activities available
                          </MenuItem>
                        ) : (
                          activities.map((activity) => (
                            <MenuItem key={activity._id} value={activity._id}>
                              <Typography variant="body2" fontWeight="medium">
                                {activity.displayName}
                              </Typography>
                              <Typography variant="caption" sx={{ ml: 1 }}>
                                {activity.paymentPerUnit} ETB/{activity.unit}
                              </Typography>
                            </MenuItem>
                          ))
                        )}
                      </Select>
                      {formErrors.activity && touchedFields.activity && (
                        <FormHelperText error>{formErrors.activity}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Date Selection */}
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Date *"
                      value={formData.date}
                      onChange={(date) => handleInputChange('date', date)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          fullWidth
                          error={!!formErrors.date && touchedFields.date}
                          helperText={formErrors.date && touchedFields.date ? formErrors.date : ''}
                          onBlur={() => setTouchedFields(prev => ({ ...prev, date: true }))}
                          disabled={!editingLaborCost && !viewMode}
                        />
                      )}
                      disabled={viewMode || (!editingLaborCost && !viewMode)}
                      maxDate={new Date()}
                      shouldDisableDate={(date) => !editingLaborCost && !isToday(date)}
                    />
                    {!editingLaborCost && (
                      <Typography variant="caption" color="text.secondary">
                        New entries are only allowed for today's date
                      </Typography>
                    )}
                  </Grid>

                  {/* Quantity Input */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Quantity *"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                      error={!!formErrors.quantity && touchedFields.quantity}
                      helperText={formErrors.quantity && touchedFields.quantity ? formErrors.quantity : ''}
                      disabled={viewMode}
                      onBlur={() => setTouchedFields(prev => ({ ...prev, quantity: true }))}
                      InputProps={{
                        inputProps: { min: 0.1, max: 1000, step: 0.1 }
                      }}
                    />
                  </Grid>

                  {/* Remarks */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      label="Remarks"
                      value={formData.remarks}
                      onChange={(e) => handleInputChange('remarks', e.target.value)}
                      disabled={viewMode}
                    />
                  </Grid>

                  {/* Status Selection (only for editing) */}
                  {editingLaborCost && !viewMode && (
                    <Grid item xs={12}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={formData.status}
                          onChange={(e) => handleInputChange('status', e.target.value)}
                          label="Status"
                        >
                          <MenuItem value="Pending">Pending</MenuItem>
                          <MenuItem value="Approved">Approved</MenuItem>
                          <MenuItem value="Rejected">Rejected</MenuItem>
                          <MenuItem value="Paid">Paid</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  )}

                  {/* Preview Section */}
                  {formData.employee && formData.activity && formData.quantity && (
                    <Grid item xs={12}>
                      <Card variant="outlined" sx={{ p: 1 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                          Cost Preview
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Selected Employee:
                            </Typography>
                            <Typography variant="body2">
                              {employees.find(e => e._id === formData.employee)?.displayName || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Selected Activity:
                            </Typography>
                            <Typography variant="body2">
                              {activities.find(a => a._id === formData.activity)?.displayName || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Unit Rate:
                            </Typography>
                            <Typography variant="body2">
                              {activities.find(a => a._id === formData.activity)?.paymentPerUnit || '0.00'} ETB/{activities.find(a => a._id === formData.activity)?.unit || ''}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Total Amount:
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              {(
                                parseFloat(activities.find(a => a._id === formData.activity)?.paymentPerUnit || 0) * 
                                parseFloat(formData.quantity || 0)
                              ).toFixed(2)} ETB
                            </Typography>
                          </Grid>
                        </Grid>
                      </Card>
                    </Grid>
                  )}
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
                      disabled={submitting || !!formErrors.duplicate}
                      startIcon={submitting ? <CircularProgress size={16} /> : null}
                      size="small"
                    >
                      {editingLaborCost ? 'Update Record' : 'Create Record'}
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
    </LocalizationProvider>
  );
};

export default LaborCost;