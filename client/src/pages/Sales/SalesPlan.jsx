import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Grid,
  Card,
  CardContent,
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Alert,
  LinearProgress,
  FormHelperText,
  Collapse,
  InputAdornment,
  Divider
} from '@mui/material';
import { 
  Edit, 
  Delete, 
  Add, 
  TrendingUp, 
  Inventory, 
  Search, 
  Refresh,
  FilterList,
  Help,
  Print,
  ImportExport,
  Download
} from '@mui/icons-material';
import axios from 'axios';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { styled } from '@mui/material/styles';

// Constants for better maintainability
const CONSTANTS = {
  DEBOUNCE_DELAY: 500,
  NOTIFICATION_DURATION: 5000,
  MAX_NOTE_LENGTH: 500
};

// FIX: Use environment variable properly with safe fallback for browser
const API_BASE_URL = 
  typeof process !== 'undefined' && process.env.REACT_APP_API_URL 
    ? process.env.REACT_APP_API_URL 
    : 'http://localhost:5000/api';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(0.5),
  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  margin: theme.spacing(0.5),
}));

const StatisticCard = styled(Card)(({ theme, color }) => ({
  textAlign: 'center',
  padding: theme.spacing(1),
  background: color === 'green' ? '#f6ffed' : 
              color === 'red' ? '#fff2f0' : 
              color === 'blue' ? '#f0f8ff' : '#fafafa',
  transition: 'transform 0.2s ease-in-out',
  minHeight: '80px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  '&:hover': {
    transform: 'translateY(-1px)',
  },
}));

const RequiredAsterisk = styled('span')(({ theme }) => ({
  color: theme.palette.error.main,
  marginLeft: theme.spacing(0.5),
}));

// Enhanced debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Enhanced Form Field Component
const EnhancedFormField = ({ label, required, children, error, helperText }) => (
  <FormControl fullWidth required={required} error={!!error} size="small">
    <InputLabel>
      {label}
      {required && <RequiredAsterisk>*</RequiredAsterisk>}
    </InputLabel>
    {children}
    {(error || helperText) && (
      <FormHelperText error={!!error}>
        {error || helperText}
      </FormHelperText>
    )}
  </FormControl>
);

// Notification System Component
const NotificationSystem = ({ notifications, onClose }) => (
  <Box sx={{ 
    position: 'fixed', 
    top: 80, 
    right: 20, 
    zIndex: 9999, 
    minWidth: 300,
    maxWidth: 400
  }}>
    {/* Success Notification */}
    {notifications.success && (
      <Alert 
        severity="success" 
        onClose={() => onClose('success')}
        sx={{ mb: 1 }}
      >
        {notifications.success}
      </Alert>
    )}
    
    {/* Error Notification */}
    {notifications.error && (
      <Alert 
        severity="error" 
        onClose={() => onClose('error')}
        sx={{ mb: 1 }}
      >
        {notifications.error}
      </Alert>
    )}
    
    {/* Info Notification */}
    {notifications.info && (
      <Alert 
        severity="info" 
        onClose={() => onClose('info')}
        sx={{ mb: 1 }}
      >
        {notifications.info}
      </Alert>
    )}

    {/* Warning Notification */}
    {notifications.warning && (
      <Alert 
        severity="warning" 
        onClose={() => onClose('warning')}
        sx={{ mb: 1 }}
      >
        {notifications.warning}
      </Alert>
    )}
  </Box>
);

const SalesPlan = () => {
  const [salesPlans, setSalesPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [notifications, setNotifications] = useState({
    success: null,
    error: null,
    info: null,
    warning: null
  });

  // Enhanced loading states
  const [loading, setLoading] = useState({
    salesPlans: false,
    dashboard: false,
    products: false,
    submit: false,
    refresh: false,
    delete: false
  });

  // Enhanced filter states
  const [filters, setFilters] = useState({
    status: '',
    fiscalYear: '',
    month: '',
    product: ''
  });

  // Enhanced form state - UPDATED: fiscalYear as string in range format
  const [formData, setFormData] = useState({
    product: '',
    unit: '',
    fiscalYear: '', // UPDATED: Will be set to default fiscal year
    month: '',
    status: 'Active',
    note: '',
    targetQuantity: ''
  });

  const statusOptions = ['Active', 'Inactive'];
  
  // UPDATED: Months from July to June (Fiscal Year)
  const months = [
    'July', 'August', 'September', 'October', 'November', 'December',
    'January', 'February', 'March', 'April', 'May', 'June'
  ];

  // Use debounced search
  const debouncedSearch = useDebounce(filters.search, CONSTANTS.DEBOUNCE_DELAY);

  // Enhanced notification handler
  const showNotification = useCallback((type, message, autoHide = true) => {
    setNotifications(prev => ({ ...prev, [type]: message }));
    
    if (autoHide) {
      setTimeout(() => {
        setNotifications(prev => ({ ...prev, [type]: null }));
      }, CONSTANTS.NOTIFICATION_DURATION);
    }
  }, []);

  const closeNotification = useCallback((type) => {
    setNotifications(prev => ({ ...prev, [type]: null }));
  }, []);

  // UPDATED: Generate fiscal years in range format (2024-2025, 2025-2026, etc.)
  const generateFiscalYears = () => {
    const startYear = 2024;
    const endYear = 2030;
    const fiscalYears = [];
    
    for (let year = startYear; year <= endYear; year++) {
      fiscalYears.push(`${year}-${year + 1}`);
    }
    
    return fiscalYears;
  };

  // UPDATED: Get current fiscal year based on current date
  const getCurrentFiscalYear = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // January is 0
    
    // Fiscal year runs from July to June
    // If current month is July or later, fiscal year is currentYear - nextYear
    // If current month is June or earlier, fiscal year is previousYear - currentYear
    if (currentMonth >= 7) {
      return `${currentYear}-${currentYear + 1}`;
    } else {
      return `${currentYear - 1}-${currentYear}`;
    }
  };

  // Enhanced form validation
  const validateForm = useCallback(() => {
    const errors = {};
    
    // Required field validation
    if (!formData.product) errors.product = 'Product is required';
    if (!formData.fiscalYear) errors.fiscalYear = 'Fiscal year is required';
    if (!formData.month) errors.month = 'Month is required';
    if (!formData.targetQuantity || formData.targetQuantity <= 0) errors.targetQuantity = 'Valid target quantity is required';
    if (!formData.status) errors.status = 'Status is required';
    
    // Target quantity validation
    if (formData.targetQuantity && formData.targetQuantity < 0) {
      errors.targetQuantity = 'Target quantity cannot be negative';
    }
    
    // Note length validation
    if (formData.note && formData.note.length > CONSTANTS.MAX_NOTE_LENGTH) {
      errors.note = `Note cannot exceed ${CONSTANTS.MAX_NOTE_LENGTH} characters`;
    }
    
    return errors;
  }, [formData]);

  // Enhanced fetch functions with better error handling
  const fetchSalesPlans = useCallback(async () => {
    setLoading(prev => ({ ...prev, salesPlans: true }));
    try {
      const response = await axios.get(`${API_BASE_URL}/salesplans`);
      if (response.data.success) {
        setSalesPlans(response.data.salesPlans);
        console.log('📊 Sales plans fetched:', response.data.salesPlans.length);
      } else {
        throw new Error(response.data.message || 'Failed to fetch sales plans');
      }
    } catch (error) {
      console.error('Error fetching sales plans:', error);
      showNotification('error', error.response?.data?.message || 'Error fetching sales plans');
    } finally {
      setLoading(prev => ({ ...prev, salesPlans: false }));
    }
  }, [showNotification]);

  const fetchDashboardStats = useCallback(async () => {
    setLoading(prev => ({ ...prev, dashboard: true }));
    try {
      const response = await axios.get(`${API_BASE_URL}/salesplans/dashboard/stats`);
      if (response.data.success) {
        setDashboardStats(response.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      showNotification('error', error.response?.data?.message || 'Error fetching dashboard statistics');
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  }, [showNotification]);

  const fetchProducts = useCallback(async () => {
    setLoading(prev => ({ ...prev, products: true }));
    try {
      const response = await axios.get(`${API_BASE_URL}/salesplans/products/active`);
      console.log('Products API Response:', response.data);
      
      let productsData = [];
      
      if (response.data && response.data.success && Array.isArray(response.data.products)) {
        productsData = response.data.products;
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data && Array.isArray(response.data.products)) {
        productsData = response.data.products;
      }
      
      console.log('🛍️ Processed Products:', productsData.length);
      setProducts(productsData);
      
      if (productsData.length === 0) {
        showNotification('warning', 'No active products found. Please add products first.', false);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      showNotification('error', 'Error fetching products. Please check your connection.');
      setProducts([]);
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  }, [showNotification]);

  const fetchFiscalYears = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/salesplans/fiscal-years`);
      if (response.data.success && response.data.fiscalYears.length > 0) {
        setFiscalYears(response.data.fiscalYears);
        
        // UPDATED: Set default fiscal year to current fiscal year if formData is empty
        if (!formData.fiscalYear) {
          const currentFiscalYear = getCurrentFiscalYear();
          setFormData(prev => ({ ...prev, fiscalYear: currentFiscalYear }));
        }
      } else {
        // UPDATED: Use the new fiscal years range in format
        const generatedFiscalYears = generateFiscalYears();
        setFiscalYears(generatedFiscalYears);
        
        if (!formData.fiscalYear) {
          const currentFiscalYear = getCurrentFiscalYear();
          setFormData(prev => ({ ...prev, fiscalYear: currentFiscalYear }));
        }
      }
    } catch (error) {
      console.error('Error fetching fiscal years:', error);
      // UPDATED: Use the new fiscal years range in format
      const generatedFiscalYears = generateFiscalYears();
      setFiscalYears(generatedFiscalYears);
      
      if (!formData.fiscalYear) {
        const currentFiscalYear = getCurrentFiscalYear();
        setFormData(prev => ({ ...prev, fiscalYear: currentFiscalYear }));
      }
    }
  }, [formData.fiscalYear]);

  // Enhanced refresh all data
  const refreshAllData = useCallback(async () => {
    setLoading(prev => ({ ...prev, refresh: true }));
    try {
      await Promise.all([
        fetchSalesPlans(),
        fetchDashboardStats(),
        fetchProducts(),
        fetchFiscalYears()
      ]);
      showNotification('success', 'All data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showNotification('error', 'Error refreshing data');
    } finally {
      setLoading(prev => ({ ...prev, refresh: false }));
    }
  }, [fetchSalesPlans, fetchDashboardStats, fetchProducts, fetchFiscalYears, showNotification]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Helper functions for product data
  const getProductDisplayName = useCallback((product) => {
    if (!product) return 'N/A';
    // REMOVED: Product codes from display name
    return product.Product || product.name || 'Unnamed Product';
  }, []);

  const getProductUnit = useCallback((product) => {
    if (!product) return '';
    return product.Unit || product.unit || '';
  }, []);

  const getProductPrice = useCallback((product) => {
    if (!product) return null;
    return product.ProductPrice || product.price || null;
  }, []);

  const getProductCode = useCallback((product) => {
    if (!product) return '';
    return product.ProductCode || product.code || '';
  }, []);

  const findProductById = useCallback((productId) => {
    if (!productId) {
      console.warn('No product ID provided to findProductById');
      return null;
    }
    
    const idString = String(productId).trim();
    
    const foundProduct = products.find(product => {
      const productIdStr = String(product._id || product.id).trim();
      return productIdStr === idString;
    });
    
    return foundProduct;
  }, [products]);

  const findProductByName = useCallback((productName) => {
    if (!productName) return null;
    return products.find(product => getProductDisplayName(product) === productName);
  }, [products, getProductDisplayName]);

  // Enhanced product selection handler
  const handleProductChange = useCallback(async (productId) => {
    if (!productId) {
      setFormData(prev => ({
        ...prev,
        product: '',
        unit: ''
      }));
      return;
    }

    try {
      const selectedProduct = findProductById(productId);
      
      if (selectedProduct) {
        const productUnit = getProductUnit(selectedProduct);
        
        console.log('✅ Selected Product:', {
          id: selectedProduct._id,
          name: getProductDisplayName(selectedProduct),
          unit: productUnit
        });
        
        setFormData(prev => ({
          ...prev,
          product: productId,
          unit: productUnit || ''
        }));

        showNotification('success', `Product "${getProductDisplayName(selectedProduct)}" selected`);
      } else {
        console.error('❌ Product not found with ID:', productId);
        setFormData(prev => ({
          ...prev,
          product: productId,
          unit: ''
        }));
        
        showNotification('error', 'Selected product not found. Please refresh the product list.');
      }
    } catch (error) {
      console.error('Error handling product change:', error);
      showNotification('error', 'Error loading product details');
    }
  }, [findProductById, getProductDisplayName, getProductUnit, showNotification]);

  // Enhanced form opening with product resolution by name
  const handleOpen = useCallback((plan = null) => {
    if (plan) {
      // For editing, find the product by name since sales plan stores productName
      const product = findProductByName(plan.productName);
      const productId = product ? product._id : '';
      
      console.log('📝 Editing Plan Details:', {
        planId: plan._id,
        productName: plan.productName,
        foundProduct: product,
        productId: productId
      });
      
      setEditingPlan(plan);
      setFormData({
        product: productId,
        unit: plan.unit || '',
        fiscalYear: plan.fiscalYear, // UPDATED: Already in range format from backend
        month: plan.month,
        status: plan.status,
        note: plan.note || '',
        targetQuantity: plan.targetQuantity || ''
      });

      if (!product) {
        showNotification('warning', `Product "${plan.productName}" not found in current product list. You may need to select a new product.`);
      }
    } else {
      console.log('🆕 Creating new sales plan');
      setEditingPlan(null);
      setFormData({
        product: '',
        unit: '',
        fiscalYear: getCurrentFiscalYear(), // UPDATED: Set to current fiscal year
        month: '',
        status: 'Active',
        note: '',
        targetQuantity: ''
      });
    }
    setOpen(true);
    setFormErrors({});
  }, [findProductByName, showNotification]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setEditingPlan(null);
    setFormErrors({});
  }, []);

  // Enhanced input change handler
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [formErrors]);

  // ✅ ENHANCED: Form submission method
  const handleSubmit = useCallback(async () => {
    setLoading(prev => ({ ...prev, submit: true }));
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setLoading(prev => ({ ...prev, submit: false }));
      showNotification('error', 'Please fix validation errors before submitting');
      return;
    }
    
    try {
      console.log(editingPlan ? '📝 Updating sales plan...' : '🆕 Creating new sales plan...');
      
      const selectedProduct = findProductById(formData.product);
      if (!selectedProduct) {
        showNotification('error', 'Selected product not found. Please refresh the product list.');
        setLoading(prev => ({ ...prev, submit: false }));
        return;
      }

      // Enhanced validation for required fields
      if (!formData.targetQuantity || formData.targetQuantity < 0) {
        showNotification('error', 'Please enter a valid target quantity');
        setLoading(prev => ({ ...prev, submit: false }));
        return;
      }

      if (!formData.month) {
        showNotification('error', 'Please select a month');
        setLoading(prev => ({ ...prev, submit: false }));
        return;
      }

      // ✅ UPDATED: Submission data - fiscalYear is now in range format
      const submissionData = {
        product: formData.product, // Send product ID, backend will convert to name
        unit: formData.unit || 'Unit', // Send unit
        fiscalYear: formData.fiscalYear, // UPDATED: In range format like "2025-2026"
        month: formData.month,
        status: formData.status,
        note: formData.note,
        targetQuantity: Number(formData.targetQuantity)
      };

      console.log('📤 Submitting sales plan data:', submissionData);
      
      let response;
      if (editingPlan) {
        console.log(`🔄 Updating existing sales plan: ${editingPlan._id}`);
        response = await axios.put(`${API_BASE_URL}/salesplans/${editingPlan._id}`, submissionData);
        showNotification('success', 'Sales plan updated successfully!');
      } else {
        console.log('🆕 Creating new sales plan...');
        response = await axios.post(`${API_BASE_URL}/salesplans`, submissionData);
        showNotification('success', 'Sales plan created successfully!');
      }
      
      console.log('✅ Server response:', response.data);
      
      // Refresh data to get the latest with new IDs
      await Promise.all([
        fetchSalesPlans(),
        fetchDashboardStats()
      ]);
      
      handleClose();
    } catch (error) {
      console.error('❌ Error saving sales plan:', error);
      
      // Enhanced error handling for duplicate entries
      if (error.response?.status === 409) {
        showNotification('warning', 'A sales plan already exists for this product, fiscal year, and month combination.');
      } else if (error.response?.data?.message) {
        showNotification('error', error.response.data.message);
      } else {
        showNotification('error', 'Error saving sales plan. Please try again.');
      }
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  }, [
    formData, 
    editingPlan, 
    validateForm, 
    findProductById, 
    fetchSalesPlans, 
    fetchDashboardStats, 
    handleClose, 
    showNotification
  ]);

  // Enhanced delete with proper refresh and notification
  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this sales plan?')) {
      setLoading(prev => ({ ...prev, delete: true }));
      try {
        console.log(`🗑️ Deleting sales plan: ${id}`);
        await axios.delete(`${API_BASE_URL}/salesplans/${id}`);
        
        await Promise.all([
          fetchSalesPlans(),
          fetchDashboardStats()
        ]);
        
        showNotification('success', 'Sales plan deleted successfully!');
      } catch (error) {
        console.error('Error deleting sales plan:', error);
        showNotification('error', error.response?.data?.message || 'Error deleting sales plan');
      } finally {
        setLoading(prev => ({ ...prev, delete: false }));
      }
    }
  }, [fetchSalesPlans, fetchDashboardStats, showNotification]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      status: '',
      fiscalYear: '',
      month: '',
      product: ''
    });
    showNotification('info', 'Filters reset');
  }, [showNotification]);

  // UPDATED: Enhanced filtered plans calculation - sort to show new entries at bottom
  const filteredPlans = useMemo(() => {
    const filtered = salesPlans.filter(plan => {
      const filterProduct = filters.product ? findProductById(filters.product) : null;
      const filterProductName = filterProduct ? getProductDisplayName(filterProduct) : null;
      
      return (
        (!filters.status || plan.status === filters.status) &&
        (!filters.fiscalYear || plan.fiscalYear === filters.fiscalYear) &&
        (!filters.month || plan.month === filters.month) &&
        (!filters.product || plan.productName === filterProductName)
      );
    });
    
    // UPDATED: Sort by creation date to show newest entries at the bottom
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || '2000-01-01');
      const dateB = new Date(b.createdAt || b.updatedAt || '2000-01-01');
      return dateA - dateB; // Ascending order - oldest first, newest last
    });
  }, [salesPlans, filters, findProductById, getProductDisplayName]);

  // Enhanced statistics calculation
  const statistics = useMemo(() => {
    const activePlans = salesPlans.filter(plan => plan.status === 'Active');
    const totalTarget = activePlans.reduce((sum, plan) => sum + (plan.targetQuantity || 0), 0);
    
    return {
      totalPlans: salesPlans.length,
      activePlans: activePlans.length,
      totalTarget: totalTarget,
      averageTarget: activePlans.length > 0 ? Math.round(totalTarget / activePlans.length) : 0
    };
  }, [salesPlans]);

  const handleCloseSnackbar = useCallback(() => {
    setNotifications({ 
      success: null, 
      error: null, 
      info: null, 
      warning: null 
    });
  }, []);

  // Format date for display
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 1, minHeight: '50vh' }}>
        
        {/* Enhanced Notification System */}
        <NotificationSystem 
          notifications={notifications} 
          onClose={closeNotification}
        />

        <StyledCard>
          <CardContent sx={{ p: 1 }}>
            {/* Enhanced Header */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 1,
              pb: 1,
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Help & Documentation">
                  <Button 
                    variant="outlined"
                    startIcon={<Help />}
                    size="small"
                  >
                    Help
                  </Button>
                </Tooltip>
              </Box>
            </Box>

            {/* Enhanced Statistics Section */}
            <Grid container spacing={1} sx={{ mb: 2, textAlign: 'center' }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatisticCard color="default">
                  <Inventory color="action" sx={{ fontSize: 30, mb: 0.5 }} />
                  <Typography variant="h6" component="div" fontSize="1rem">
                    {statistics.totalPlans}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                    Total Plans
                  </Typography>
                  {loading.salesPlans && <LinearProgress sx={{ mt: 0.5 }} />}
                </StatisticCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatisticCard color="green">
                  <TrendingUp sx={{ color: 'success.main', fontSize: 30, mb: 0.5 }} />
                  <Typography variant="h6" component="div" color="success.main" fontSize="1rem">
                    {statistics.activePlans}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                    Active Plans
                  </Typography>
                </StatisticCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatisticCard color="blue">
                  <Typography variant="h6" component="div" color="primary.main" fontSize="1rem">
                    {statistics.totalTarget.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                    Total Target
                  </Typography>
                </StatisticCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatisticCard color="blue">
                  <Typography variant="h6" component="div" color="primary.main" fontSize="1rem">
                    {statistics.averageTarget.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                    Average per Plan
                  </Typography>
                </StatisticCard>
              </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />

            {/* Enhanced Filters Section with Toggle */}
            <Box sx={{ mb: 1 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 1
              }}>
                <Tooltip title="Show/Hide Filters">
                  <IconButton
                    onClick={() => setShowFilters(!showFilters)}
                    color={showFilters ? "primary" : "default"}
                    size="small"
                  >
                    <FilterList />
                  </IconButton>
                </Tooltip>

                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Print">
                    <IconButton onClick={() => window.print()} size="small">
                      <Print fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Export">
                    <IconButton size="small">
                      <Download fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Refresh">
                    <IconButton 
                      onClick={refreshAllData} 
                      disabled={loading.refresh}
                      size="small"
                    >
                      <Refresh fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Add New Sales Plan">
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => handleOpen()}
                      disabled={products.length === 0}
                      size="small"
                    >
                      Add Plan
                    </Button>
                  </Tooltip>
                </Box>
              </Box>

              <Collapse in={showFilters}>
                <Paper sx={{ p: 1, mb: 1 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={filters.status}
                          onChange={(e) => handleFilterChange('status', e.target.value)}
                          label="Status"
                        >
                          <MenuItem value="">All Status</MenuItem>
                          {statusOptions.map(status => (
                            <MenuItem key={status} value={status}>{status}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Fiscal Year</InputLabel>
                        <Select
                          value={filters.fiscalYear}
                          onChange={(e) => handleFilterChange('fiscalYear', e.target.value)}
                          label="Fiscal Year"
                        >
                          <MenuItem value="">All Years</MenuItem>
                          {/* UPDATED: Fiscal Years in range format like "2024-2025" */}
                          {fiscalYears.map(year => (
                            <MenuItem key={year} value={year}>{year}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Month</InputLabel>
                        <Select
                          value={filters.month}
                          onChange={(e) => handleFilterChange('month', e.target.value)}
                          label="Month"
                        >
                          <MenuItem value="">All Months</MenuItem>
                          {/* UPDATED: Months from July to June */}
                          {months.map(month => (
                            <MenuItem key={month} value={month}>{month}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Product</InputLabel>
                        <Select
                          value={filters.product}
                          onChange={(e) => handleFilterChange('product', e.target.value)}
                          label="Product"
                          loading={loading.products}
                        >
                          <MenuItem value="">All Products</MenuItem>
                          {products.map(product => (
                            <MenuItem key={product._id} value={product._id}>
                              {getProductDisplayName(product)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={1}>
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        onClick={clearFilters}
                        sx={{ height: '40px' }}
                        size="small"
                      >
                        Clear
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Collapse>
            </Box>

            {products.length === 0 && !loading.products && (
              <Alert
                severity="warning"
                sx={{ mb: 1 }}
              >
                Please add active products to the database before creating sales plans.
              </Alert>
            )}

            {/* Enhanced Data Table */}
            {loading.salesPlans ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer 
                component={Paper} 
                sx={{ 
                  maxHeight: 400, // Scrollable after 5 rows
                  overflow: 'auto'
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ 
                        padding: '8px 12px', 
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        backgroundColor: 'background.paper'
                      }}>Product Name</TableCell>
                      <TableCell sx={{ 
                        padding: '8px 12px', 
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        backgroundColor: 'background.paper'
                      }}>Unit</TableCell>
                      <TableCell sx={{ 
                        padding: '8px 12px', 
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        backgroundColor: 'background.paper'
                      }}>Fiscal Year</TableCell>
                      <TableCell sx={{ 
                        padding: '8px 12px', 
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        backgroundColor: 'background.paper'
                      }}>Month</TableCell>
                      <TableCell sx={{ 
                        padding: '8px 12px', 
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        backgroundColor: 'background.paper'
                      }}>Target Quantity</TableCell>
                      <TableCell sx={{ 
                        padding: '8px 12px', 
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        backgroundColor: 'background.paper'
                      }}>Status</TableCell>
                      <TableCell sx={{ 
                        padding: '8px 12px', 
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        backgroundColor: 'background.paper'
                      }}>Created</TableCell>
                      <TableCell sx={{ 
                        padding: '8px 12px', 
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        backgroundColor: 'background.paper'
                      }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* UPDATED: New entries will appear at the bottom due to sorting */}
                    {filteredPlans.length > 0 ? (
                      filteredPlans.map((plan) => (
                        <TableRow 
                          key={plan._id}
                          sx={{ 
                            '&:last-child td, &:last-child th': { border: 0 },
                            height: '48px' // Reduced row height
                          }}
                        >
                          <TableCell sx={{ 
                            padding: '6px 12px',
                            whiteSpace: 'nowrap' // Prevent wrapping
                          }}>
                            <Typography variant="body2" fontWeight="bold" fontSize="0.875rem">
                              {plan.productName || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ 
                            padding: '6px 12px',
                            whiteSpace: 'nowrap'
                          }}>
                            <Chip 
                              label={plan.unit || 'Not set'} 
                              variant="outlined" 
                              size="small"
                              color={plan.unit ? "primary" : "error"}
                            />
                          </TableCell>
                          <TableCell sx={{ 
                            padding: '6px 12px',
                            whiteSpace: 'nowrap',
                            fontSize: '0.875rem'
                          }}>{plan.fiscalYear}</TableCell>
                          <TableCell sx={{ 
                            padding: '6px 12px',
                            whiteSpace: 'nowrap',
                            fontSize: '0.875rem'
                          }}>{plan.month}</TableCell>
                          <TableCell sx={{ 
                            padding: '6px 12px',
                            whiteSpace: 'nowrap'
                          }}>
                            <Typography variant="body2" fontWeight="bold" fontSize="0.875rem">
                              {plan.targetQuantity?.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ 
                            padding: '6px 12px',
                            whiteSpace: 'nowrap'
                          }}>
                            <Chip 
                              label={plan.status} 
                              color={plan.status === 'Active' ? 'success' : 'default'} 
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ 
                            padding: '6px 12px',
                            whiteSpace: 'nowrap'
                          }}>
                            <Tooltip title={plan.createdAt ? `Created: ${new Date(plan.createdAt).toLocaleString()}` : ''} arrow>
                              <Typography variant="caption" fontSize="0.75rem">
                                {plan.createdAt ? formatDate(plan.createdAt) : 'N/A'}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ 
                            padding: '6px 12px',
                            whiteSpace: 'nowrap'
                          }}>
                            <IconButton 
                              onClick={() => handleOpen(plan)} 
                              size="small" 
                              color="primary"
                              disabled={loading.delete}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton 
                              onClick={() => handleDelete(plan._id)} 
                              size="small" 
                              color="error"
                              disabled={loading.delete}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 2 }}>
                          <Typography variant="body1" color="textSecondary">
                            No sales plans found
                          </Typography>
                          {salesPlans.length === 0 && (
                            <Button 
                              variant="text" 
                              onClick={() => handleOpen()} 
                              sx={{ mt: 0.5 }}
                              size="small"
                            >
                              Create your first sales plan
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Enhanced Create/Edit Modal */}
            <Dialog
              open={open}
              onClose={handleClose}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {editingPlan ? (
                    <>
                      <Edit sx={{ mr: 1, color: 'primary.main', fontSize: '1.25rem' }} />
                      <Typography variant="h6" fontSize="1.1rem">
                        Edit Sales Plan
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Add sx={{ mr: 1, color: 'success.main', fontSize: '1.25rem' }} />
                      <Typography variant="h6" fontSize="1.1rem">
                        Create New Sales Plan
                      </Typography>
                    </>
                  )}
                </Box>
                {editingPlan ? (
                  <Typography variant="caption" display="block" color="textSecondary">
                    Editing plan for {formData.fiscalYear} - {formData.month}
                  </Typography>
                ) : (
                  <Typography variant="caption" display="block" color="textSecondary">
                    New plan will be created with auto-generated ID
                  </Typography>
                )}
              </DialogTitle>
              <DialogContent sx={{ pt: 1 }}>
                <Grid container spacing={1} sx={{ mt: 0 }}>
                  <Grid item xs={12}>
                    <EnhancedFormField 
                      label="Product" 
                      required 
                      error={formErrors.product}
                    >
                      <Select
                        value={formData.product}
                        onChange={(e) => handleProductChange(e.target.value)}
                        label="Product"
                        disabled={loading.products}
                        size="small"
                      >
                        <MenuItem value="">Select Product</MenuItem>
                        {loading.products ? (
                          <MenuItem value="" disabled>Loading products...</MenuItem>
                        ) : products.length > 0 ? (
                          products.map(product => {
                            const productName = getProductDisplayName(product);
                            const productUnit = getProductUnit(product);
                            const productPrice = getProductPrice(product);
                            
                            return (
                              <MenuItem key={product._id} value={product._id}>
                                <Box>
                                  <Typography variant="body1" fontSize="0.875rem">{productName}</Typography>
                                  <Typography variant="caption" color="textSecondary" fontSize="0.75rem">
                                    {productUnit && `Unit: ${productUnit} • `}
                                    {productPrice && `Price: ${productPrice} ETB`}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            );
                          })
                        ) : (
                          <MenuItem value="" disabled>
                            <Typography color="error" fontSize="0.875rem">
                              No products available. Please add products first.
                            </Typography>
                          </MenuItem>
                        )}
                      </Select>
                    </EnhancedFormField>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Unit"
                      value={formData.unit}
                      disabled
                      helperText="Auto-filled from selected product"
                      error={!!formErrors.unit}
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <EnhancedFormField 
                      label="Fiscal Year" 
                      required 
                      error={formErrors.fiscalYear}
                    >
                      <Select
                        value={formData.fiscalYear}
                        onChange={(e) => handleInputChange('fiscalYear', e.target.value)}
                        label="Fiscal Year"
                        size="small"
                      >
                        <MenuItem value="">Select Fiscal Year</MenuItem>
                        {/* UPDATED: Fiscal Years in range format like "2024-2025" */}
                        {fiscalYears.map(year => (
                          <MenuItem key={year} value={year}>{year}</MenuItem>
                        ))}
                      </Select>
                    </EnhancedFormField>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <EnhancedFormField 
                      label="Month" 
                      required 
                      error={formErrors.month}
                    >
                      <Select
                        value={formData.month}
                        onChange={(e) => handleInputChange('month', e.target.value)}
                        label="Month"
                        size="small"
                      >
                        <MenuItem value="">Select Month</MenuItem>
                        {/* UPDATED: Months from July to June */}
                        {months.map(month => (
                          <MenuItem key={month} value={month}>{month}</MenuItem>
                        ))}
                      </Select>
                    </EnhancedFormField>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <EnhancedFormField 
                      label="Status" 
                      required 
                      error={formErrors.status}
                    >
                      <Select
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        label="Status"
                        size="small"
                      >
                        {statusOptions.map(status => (
                          <MenuItem key={status} value={status}>{status}</MenuItem>
                        ))}
                      </Select>
                    </EnhancedFormField>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Target Quantity"
                      name="targetQuantity"
                      type="number"
                      value={formData.targetQuantity}
                      onChange={(e) => handleInputChange('targetQuantity', e.target.value)}
                      required
                      inputProps={{ min: 0 }}
                      error={!!formErrors.targetQuantity}
                      helperText={formErrors.targetQuantity || "Enter the target quantity for this sales plan"}
                      size="small"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={`Note (Max ${CONSTANTS.MAX_NOTE_LENGTH} characters)`}
                      name="note"
                      multiline
                      rows={2}
                      value={formData.note}
                      onChange={(e) => handleInputChange('note', e.target.value)}
                      placeholder="Add any notes or comments about this sales plan..."
                      helperText={`${formData.note.length}/${CONSTANTS.MAX_NOTE_LENGTH} characters`}
                      inputProps={{ maxLength: CONSTANTS.MAX_NOTE_LENGTH }}
                      error={!!formErrors.note}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ px: 2, pb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                    Required fields are marked with <RequiredAsterisk>*</RequiredAsterisk>
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button onClick={handleClose} disabled={loading.submit} size="small">
                      Cancel
                    </Button>
                    <Button 
                      variant="contained" 
                      onClick={handleSubmit}
                      disabled={loading.submit}
                      startIcon={loading.submit ? <CircularProgress size={16} /> : null}
                      size="small"
                    >
                      {editingPlan ? 'Update' : 'Create'}
                    </Button>
                  </Box>
                </Box>
              </DialogActions>
            </Dialog>
          </CardContent>
        </StyledCard>
      </Box>
    </LocalizationProvider>
  );
};

export default SalesPlan;