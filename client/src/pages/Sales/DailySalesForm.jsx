import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  LinearProgress,
  FormHelperText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Inventory as InventoryIcon,
  ArrowBack as ArrowBackIcon,
  Help as HelpIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  ImportExport as ImportExportIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

// Constants for better maintainability
const CONSTANTS = {
  DEBOUNCE_DELAY: 500,
  PAGE_SIZES: [5, 10, 25, 50],
  DEFAULT_PAGE_SIZE: 10,
  NOTIFICATION_DURATION: 5000,
  MAX_NOTE_LENGTH: 100
};

// UPDATED ACTIVITY TYPES for Daily Sales
const ACTIVITY_TYPES = {
  SALES: 'Sales',
  RETURN_FROM_CUSTOMER: 'Return from Customer',
  RETURN_TO_CUSTOMER: 'Return to customer',
  LOSS: 'Loss',
  RECEIVE: 'Receive'
};

// UPDATED: Categories for sales
const CATEGORY_TYPES = {
  RECEIVE: 'Receive',
  RETAIL: 'Retail',
  AGENT: 'Agent',
  TENDER: 'Tender',
  PROJECT: 'Project',
  PROMOTION: 'Promotion',
  OTHER: 'Other'
};

// Activities that require expire date
const EXPIRE_DATE_ACTIVITIES = [
  ACTIVITY_TYPES.RECEIVE
];

const API_ENDPOINTS = {
  BASE: 'http://localhost:5000/api/daily-sales',
  // Remove the separate PRODUCTS endpoint or update it to match
  STOCK_SUMMARY: '/stocks/summary',
  AVAILABLE_BATCHES: '/batches/available',
  SALES_SUMMARY: '/sales-summary'
};

// Styled components
const StyledTableRow = styled(TableRow)(({ theme, selected }) => ({
  backgroundColor: selected ? theme.palette.action.selected : 'transparent',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  transition: 'all 0.2s ease-in-out',
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  margin: theme.spacing(1),
}));

const StatisticCard = styled(Card)(({ theme, color }) => ({
  textAlign: 'center',
  padding: theme.spacing(2),
  background: color === 'green' ? '#f6ffed' : 
              color === 'red' ? '#fff2f0' : 
              color === 'blue' ? '#f0f8ff' : '#fafafa',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
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
  <FormControl fullWidth required={required} error={!!error}>
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
    {notifications.success && (
      <Alert 
        severity="success" 
        onClose={() => onClose('success')}
        sx={{ mb: 1 }}
      >
        {notifications.success}
      </Alert>
    )}
    
    {notifications.error && (
      <Alert 
        severity="error" 
        onClose={() => onClose('error')}
        sx={{ mb: 1 }}
      >
        {notifications.error}
      </Alert>
    )}
    
    {notifications.info && (
      <Alert 
        severity="info" 
        onClose={() => onClose('info')}
        sx={{ mb: 1 }}
      >
        {notifications.info}
      </Alert>
    )}
  </Box>
);

// Batch source information
const getBatchSourceInfo = (activity) => {
  const batchSources = {
    'Receive': {
      database: 'sales',
      description: 'All batches from Transfer activities',
      requiresExpireDate: true,
      validation: 'Transfer quantity - Receive quantity > 0'
    },
    'Sales': {
      database: 'daily-sales',
      description: 'All batches with Received quantity',
      requiresExpireDate: false,
      validation: 'Received quantity - Sales quantity > 0'
    },
    'Return from Customer': {
      database: 'daily-sales',
      description: 'All batches previously sold to customers',
      requiresExpireDate: false,
      validation: 'Sales quantity - Return quantity > 0'
    },
    'Return to customer': {
      database: 'daily-sales',
      description: 'All batches with Received quantity',
      requiresExpireDate: false,
      validation: 'Manual entry with stock validation'
    },
    'Loss': {
      database: 'daily-sales',
      description: 'All batches with Received quantity',
      requiresExpireDate: false,
      validation: 'Received quantity - Loss quantity > 0'
    }
  };
  
  return batchSources[activity] || { database: 'unknown', description: '', requiresExpireDate: false, validation: '' };
};

const DailySalesForm = () => {
  const navigate = useNavigate();
  
  // State management
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [products, setProducts] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [batchStock, setBatchStock] = useState(0);
  const [filters, setFilters] = useState({
    page: 0,
    limit: CONSTANTS.DEFAULT_PAGE_SIZE,
    activity: '',
    category: '',
    product: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: CONSTANTS.DEFAULT_PAGE_SIZE,
    total: 0
  });
  const [stockSummary, setStockSummary] = useState([]);
  const [salesSummary, setSalesSummary] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({
    Activity: ACTIVITY_TYPES.SALES,
    Category: CATEGORY_TYPES.RETAIL,
    Date: dayjs(),
    Product: '',
    Batch: '',
    ProductCode: '',
    Unit: 'PCS',
    DocumentNumber: '',
    Quantity: '',
    Price: '',
    TotalAmount: '',
    ExpireDate: null,
    Note: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [notifications, setNotifications] = useState({
    success: null,
    error: null,
    info: null
  });

  const tableRef = useRef();

  // Use debounced search
  const debouncedSearch = useDebounce(filters.search, CONSTANTS.DEBOUNCE_DELAY);

  // Filter only active products
  const activeProducts = useMemo(() => {
    return products.filter(product => product.status === 'Active');
  }, [products]);

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

  // Enhanced form validation
  const validateForm = useCallback(() => {
    const errors = {};
    const batchInfo = getBatchSourceInfo(formData.Activity);
    
    // Required field validation
    if (!formData.Date) errors.Date = 'Date is required';
    if (!formData.Activity) errors.Activity = 'Activity is required';
    if (!formData.Category) errors.Category = 'Category is required';
    if (!formData.Product) errors.Product = 'Product is required';
    if (!formData.Batch) errors.Batch = 'Batch is required';
    if (!formData.DocumentNumber) errors.DocumentNumber = 'Document Number is required';
    if (!formData.Quantity || formData.Quantity <= 0) errors.Quantity = 'Valid quantity is required';
    
    // Price validation for Sales
    if (formData.Activity === ACTIVITY_TYPES.SALES) {
      if (!formData.Price || formData.Price < 0) {
        errors.Price = 'Valid price is required for Sales';
      }
    }
    
    // Stock validation for populated batch activities
    if (batchInfo.database !== 'manual' && formData.Batch && formData.Quantity) {
      const selectedBatch = availableBatches.find(b => b._id === formData.Batch);
      if (selectedBatch && selectedBatch.isAvailable && formData.Quantity > selectedBatch.totalStock) {
        errors.Quantity = `Quantity cannot exceed available stock (${selectedBatch.totalStock.toFixed(3)})`;
      }
    }
    
    return errors;
  }, [formData, availableBatches]);

  // CORRECTED: Enhanced fetch products with error boundary
const fetchProducts = useCallback(async () => {
  setProductsLoading(true);
  try {
    // Use the correct endpoint: /api/daily-sales/products/active
    const response = await axios.get(`${API_ENDPOINTS.BASE}/products/active`);
    
    let productsData = [];
    
    if (response.data && Array.isArray(response.data)) {
      productsData = response.data;
    }

    setProducts(productsData);

    if (productsData.length === 0) {
      showNotification('warning', 'No active products found. Please add active products to create sales records.', false);
    }

  } catch (error) {
    console.error('Error fetching products:', error);
    const errorMessage = error.response?.data?.message || 
                        error.response?.statusText || 
                        error.message || 
                        'Failed to fetch products from database';
    
    showNotification('error', `Failed to load products: ${errorMessage}`);
    setProducts([]);
  } finally {
    setProductsLoading(false);
  }
}, [showNotification]);

  // Enhanced fetch records with better error handling
  const fetchRecords = useCallback(async (abortController) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      // Add sort order to ensure newest at bottom
      params.append('sortBy', 'Date');
      params.append('sortOrder', 'asc');

      const response = await axios.get(`${API_ENDPOINTS.BASE}?${params}`, {
        signal: abortController?.signal
      });
      
      let recordsData = [];
      if (response.data && Array.isArray(response.data.records)) {
        recordsData = response.data.records;
      } else if (Array.isArray(response.data)) {
        recordsData = response.data;
      }
      
      // Sort records by date in ascending order (oldest first, newest at bottom)
      const sortedRecords = [...recordsData].sort((a, b) => 
        new Date(a.Date) - new Date(b.Date)
      );
      
      setRecords(sortedRecords);
      
      if (response.data) {
        setPagination({
          page: response.data.currentPage - 1 || 0,
          pageSize: filters.limit,
          total: response.data.totalRecords || sortedRecords.length
        });
      }
      
      // Reset selected row index
      setSelectedRowIndex(-1);
    } catch (error) {
      if (axios.isCancel(error)) return;
      
      const errorMessage = error.response?.data?.message || 'Failed to fetch records';
      showNotification('error', errorMessage);
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, showNotification]);

  // Fetch stock summary
  const fetchStockSummary = useCallback(async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.BASE}${API_ENDPOINTS.STOCK_SUMMARY}`);
      setStockSummary(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching stock summary:', error);
      setStockSummary([]);
    }
  }, []);

  // Fetch sales summary
  const fetchSalesSummary = useCallback(async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.BASE}${API_ENDPOINTS.SALES_SUMMARY}`);
      setSalesSummary(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching sales summary:', error);
      setSalesSummary([]);
    }
  }, []);

  // Fetch batch stock
  const fetchBatchStock = useCallback(async (batch) => {
    if (!batch) {
      setBatchStock(0);
      return;
    }
    
    try {
      const response = await axios.get(`${API_ENDPOINTS.BASE}/stock/${batch}`);
      const stock = response.data?.stock || 0;
      setBatchStock(stock);
    } catch (error) {
      console.error('Error fetching batch stock:', error);
      setBatchStock(0);
    }
  }, []);

  // Fetch available batches
  const fetchAvailableBatches = useCallback(async (productName, activity = null) => {
    if (!productName || !activity) {
      setAvailableBatches([]);
      return;
    }

    try {
      let url = `${API_ENDPOINTS.BASE}${API_ENDPOINTS.AVAILABLE_BATCHES}?productName=${encodeURIComponent(productName)}&activity=${encodeURIComponent(activity)}`;

      console.log(`🔍 Fetching batches from: ${url}`);
      const response = await axios.get(url);
      const batchesData = response.data?.availableBatches || [];
      
      console.log(`✅ Found ${batchesData.length} batches for ${activity}`);
      console.log(`📅 Batches with expire dates: ${batchesData.filter(b => b.expireDate).length}`);
      
      setAvailableBatches(batchesData);
      
    } catch (error) {
      console.error('Error fetching available batches:', error);
      setAvailableBatches([]);
    }
  }, []);

  // Effect for fetching records with debounce and cleanup
  useEffect(() => {
    const abortController = new AbortController();
    fetchRecords(abortController);
    
    return () => {
      abortController.abort();
    };
  }, [fetchRecords, debouncedSearch]);

  // Initial data fetch
  useEffect(() => {
    fetchProducts();
    fetchStockSummary();
    fetchSalesSummary();
  }, [fetchProducts, fetchStockSummary, fetchSalesSummary]);

  // Effect to automatically set expire date when batch is selected or available batches change
  useEffect(() => {
    if (formData.Batch && availableBatches.length > 0) {
      const selectedBatch = availableBatches.find(b => b._id === formData.Batch);
      if (selectedBatch) {
        const batchInfo = getBatchSourceInfo(formData.Activity);
        if (batchInfo.requiresExpireDate && selectedBatch.expireDate) {
          try {
            const expireDate = dayjs(selectedBatch.expireDate);
            if (expireDate.isValid() && (!formData.ExpireDate || !formData.ExpireDate.isSame(expireDate, 'day'))) {
              setFormData(prev => ({ ...prev, ExpireDate: expireDate }));
              console.log(`📅 Effect: Auto-set expire date from batch: ${expireDate.format('DD/MM/YYYY')}`);
              showNotification('info', `Expire date automatically set to ${expireDate.format('DD/MM/YYYY')} from selected batch`);
            }
          } catch (error) {
            console.error('❌ Error in effect setting expire date:', error);
          }
        }
      }
    }
  }, [formData.Batch, availableBatches, formData.Activity, formData.ExpireDate]);

  // Calculate total amount when price or quantity changes for Sales
  useEffect(() => {
    if (formData.Activity === ACTIVITY_TYPES.SALES && formData.Price && formData.Quantity) {
      const totalAmount = parseFloat(formData.Price) * parseFloat(formData.Quantity);
      setFormData(prev => ({ ...prev, TotalAmount: totalAmount.toFixed(2) }));
    } else if (formData.Activity !== ACTIVITY_TYPES.SALES) {
      setFormData(prev => ({ ...prev, Price: '', TotalAmount: '' }));
    }
  }, [formData.Price, formData.Quantity, formData.Activity]);

  // Back button handler
  const onBack = () => {
    navigate('/Dashboard');
  };

  const handleTableChange = (event, newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event) => {
    const newPageSize = parseInt(event.target.value, 10);
    setFilters(prev => ({
      ...prev,
      page: 0,
      limit: newPageSize
    }));
    setPagination(prev => ({ ...prev, page: 0, pageSize: newPageSize }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 0
    }));
  };

  const resetFilters = () => {
    setFilters({
      page: 0,
      limit: CONSTANTS.DEFAULT_PAGE_SIZE,
      activity: '',
      category: '',
      product: '',
      startDate: '',
      endDate: '',
      search: ''
    });
    showNotification('info', 'Filters reset');
  };

  // showModal function
  const showModal = (record = null) => {
    setEditingRecord(record);
    setModalVisible(true);
    setFormErrors({});
    
    if (record) {
      const productName = record.Product || '';

      console.log('📝 Editing record with product:', {
        recordProduct: record.Product,
        productName,
        record
      });

      setFormData({
        ...record,
        Date: record.Date ? dayjs(record.Date) : dayjs(),
        ExpireDate: record.ExpireDate ? dayjs(record.ExpireDate) : null,
        Product: productName,
        ProductCode: record.ProductCode || '',
        Unit: record.Unit || 'PCS',
        DocumentNumber: record.DocumentNumber || '',
        Activity: record.Activity || ACTIVITY_TYPES.SALES,
        Category: record.Category || CATEGORY_TYPES.RETAIL,
        Quantity: record.Quantity || '',
        Price: record.Price || '',
        TotalAmount: record.TotalAmount || '',
        Batch: record.Batch || '',
        Note: record.Note || ''
      });
      
      // Fetch batches for the activity
      if (productName && record.Activity) {
        const batchInfo = getBatchSourceInfo(record.Activity);
        if (batchInfo.database !== 'manual') {
          fetchAvailableBatches(productName, record.Activity);
        }
      }
      
      if (record.Batch) {
        fetchBatchStock(record.Batch);
      }
    } else {
      // For new records, set initial form data
      setFormData({
        Activity: ACTIVITY_TYPES.SALES,
        Category: CATEGORY_TYPES.RETAIL,
        Date: dayjs(),
        Product: '',
        Batch: '',
        ProductCode: '',
        Unit: 'PCS',
        DocumentNumber: '',
        Quantity: '',
        Price: '',
        TotalAmount: '',
        ExpireDate: null,
        Note: ''
      });
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingRecord(null);
    setFormData({
      Activity: ACTIVITY_TYPES.SALES,
      Category: CATEGORY_TYPES.RETAIL,
      Date: dayjs(),
      Product: '',
      Batch: '',
      ProductCode: '',
      Unit: 'PCS',
      DocumentNumber: '',
      Quantity: '',
      Price: '',
      TotalAmount: '',
      ExpireDate: null,
      Note: ''
    });
    setAvailableBatches([]);
    setBatchStock(0);
    setFormErrors({});
  };

  const handleRefresh = () => {
    fetchRecords();
    fetchProducts();
    fetchStockSummary();
    fetchSalesSummary();
    showNotification('info', 'Data refreshed successfully');
  };

  // Enhanced delete with proper refresh and notification
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_ENDPOINTS.BASE}/${id}`);
      
      // Refresh all data after delete
      await Promise.all([
        fetchRecords(),
        fetchStockSummary(),
        fetchSalesSummary()
      ]);
      
      // Also refresh products to ensure consistency
      fetchProducts();
      
      showNotification('success', 'Record deleted successfully!');
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Delete failed';
      showNotification('error', errorMessage);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Product selection change handler
  const handleProductChange = async (productName) => {
    handleInputChange('Product', productName);
    
    if (!productName) {
      setFormData(prev => ({
        ...prev,
        ProductCode: '',
        Unit: 'PCS',
        Batch: ''
      }));
      setAvailableBatches([]);
      setBatchStock(0);
      return;
    }

    try {
      const selectedProduct = activeProducts.find(p => p.name === productName);
      
      if (selectedProduct) {
        // Auto-populate ProductCode and Unit when product is selected
        handleInputChange('ProductCode', selectedProduct.code);
        handleInputChange('Unit', selectedProduct.unit || 'PCS');

        const batchInfo = getBatchSourceInfo(formData.Activity);
        
        // Fetch batches based on activity type
        await fetchAvailableBatches(productName, formData.Activity);
      } else {
        setFormData(prev => ({
          ...prev,
          ProductCode: '',
          Unit: 'PCS',
          Batch: ''
        }));
        setAvailableBatches([]);
      }
    } catch (error) {
      console.error('Error handling product change:', error);
      showNotification('error', 'Error loading product details');
    }
  };

  // Activity change handler
  const handleActivityChange = (activity) => {
    handleInputChange('Activity', activity);
    
    const batchInfo = getBatchSourceInfo(activity);
    
    // Reset batch and expire date when activity changes
    setFormData(prev => ({ 
      ...prev,
      Batch: '',
      ExpireDate: null,
      Price: '',
      TotalAmount: ''
    }));
    
    setAvailableBatches([]);
    setBatchStock(0);
    
    // If we have a product, fetch batches
    if (batchInfo.database !== 'manual' && formData.Product) {
      fetchAvailableBatches(formData.Product, activity);
    }
    
    setFormErrors({});
  };

  // Batch change handler
  const handleBatchChange = (batch) => {
    handleInputChange('Batch', batch);
    
    if (batch) {
      fetchBatchStock(batch);
      
      // Auto-populate expire date from selected batch
      const selectedBatch = availableBatches.find(b => b._id === batch);
      if (selectedBatch) {
        const batchInfo = getBatchSourceInfo(formData.Activity);
        if (batchInfo.requiresExpireDate && selectedBatch.expireDate) {
          try {
            const expireDate = dayjs(selectedBatch.expireDate);
            if (expireDate.isValid()) {
              setFormData(prev => ({ ...prev, ExpireDate: expireDate }));
              console.log(`📅 Auto-populated expire date: ${expireDate.format('DD/MM/YYYY')} from batch: ${batch}`);
              showNotification('info', `Expire date set to ${expireDate.format('DD/MM/YYYY')}`);
            }
          } catch (error) {
            console.error(`❌ Error parsing expire date for batch ${batch}:`, error);
            setFormData(prev => ({ ...prev, ExpireDate: null }));
          }
        }
      }
    } else {
      setBatchStock(0);
      // Clear expire date if batch is cleared
      const batchInfo = getBatchSourceInfo(formData.Activity);
      if (batchInfo.requiresExpireDate) {
        setFormData(prev => ({ ...prev, ExpireDate: null }));
      }
    }
  };

  // Batch field rendering
  const renderBatchField = () => {
    const batchInfo = getBatchSourceInfo(formData.Activity);
    
    // Populated batch selection for activities
    const availableCount = availableBatches.filter(b => b.isAvailable).length;
    const totalCount = availableBatches.length;
    const batchesWithExpireDate = availableBatches.filter(b => b.expireDate).length;
    
    return (
      <EnhancedFormField 
        label="Batch" 
        required 
        error={formErrors.Batch}
        helperText={
          `${batchInfo.description} (${availableCount} available out of ${totalCount} total batches, ${batchesWithExpireDate} with expire dates)`
        }
      >
        <Select
          value={formData.Batch}
          onChange={(e) => handleBatchChange(e.target.value)}
          label="Batch"
          disabled={availableBatches.length === 0}
        >
          <MenuItem value="">
            {availableBatches.length === 0 ? 'No batches found' : `Select Batch (${availableCount} available)`}
          </MenuItem>
          {availableBatches.map(batch => (
            <MenuItem 
              key={batch._id} 
              value={batch._id}
              sx={{ 
                opacity: batch.isAvailable ? 1 : 0.6,
                backgroundColor: batch.isAvailable ? 'transparent' : 'rgba(0,0,0,0.04)'
              }}
            >
              <Box>
                <Typography 
                  variant="body2" 
                  fontWeight="bold"
                  color={batch.isAvailable ? 'text.primary' : 'text.secondary'}
                >
                  {batch._id}
                  {!batch.isAvailable && ' (No Stock)'}
                </Typography>
                <Typography variant="caption" display="block" color={batch.isAvailable ? 'text.primary' : 'text.secondary'}>
                  Available: {batch.totalStock.toFixed(3)} | Source: {batch.sourceActivity}
                </Typography>
                {batch.expireDate && (
                  <Typography 
                    variant="caption" 
                    display="block" 
                    color={batch.isAvailable ? 'success.main' : 'text.secondary'}
                    fontWeight="bold"
                  >
                    📅 Expires: {dayjs(batch.expireDate).format('DD/MM/YYYY')}
                  </Typography>
                )}
                {!batch.expireDate && batchInfo.requiresExpireDate && (
                  <Typography variant="caption" display="block" color="warning.main">
                    ⚠️ No expire date
                  </Typography>
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </EnhancedFormField>
    );
  };

  // Expire date field rendering
  const renderExpireDateField = () => {
    const batchInfo = getBatchSourceInfo(formData.Activity);
    
    if (!batchInfo.requiresExpireDate) {
      return null;
    }

    const selectedBatch = availableBatches.find(b => b._id === formData.Batch);
    const isAutoPopulated = selectedBatch && selectedBatch.expireDate;
    const hasNoExpireDate = selectedBatch && !selectedBatch.expireDate;

    return (
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Expire Date"
          value={formData.ExpireDate ? formData.ExpireDate.format('DD/MM/YYYY') : ''}
          InputProps={{
            readOnly: isAutoPopulated,
          }}
          required
          error={!!formErrors.ExpireDate}
          helperText={
            formErrors.ExpireDate || 
            (isAutoPopulated 
              ? 'Auto-populated from selected batch (non-editable)' 
              : hasNoExpireDate
              ? 'No expire date found for selected batch'
              : 'Must be on or after transaction date')
          }
          sx={{
            '& .MuiInputBase-input': {
              backgroundColor: isAutoPopulated ? 'action.hover' : 'transparent',
              color: isAutoPopulated ? 'text.primary' : 'text.primary'
            }
          }}
        />
        {isAutoPopulated && (
          <Typography variant="caption" color="success.main" display="block" sx={{ mt: 0.5 }}>
            ✅ Expire date automatically retrieved from the selected batch
          </Typography>
        )}
        {hasNoExpireDate && (
          <Alert severity="warning" sx={{ mt: 1 }} size="small">
            No expire date found for the selected batch. Please contact administrator.
          </Alert>
        )}
      </Grid>
    );
  };

  // Enhanced form submission
  const handleSubmit = async () => {
    setSubmitting(true);
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitting(false);
      showNotification('error', 'Please fix validation errors before submitting');
      return;
    }
    
    try {
      // For new records, validate product exists
      if (!editingRecord) {
        const product = activeProducts.find(p => p.name === formData.Product);
        if (!product) {
          showNotification('error', 'Selected product not found or is not active. Please select a valid active product.');
          setSubmitting(false);
          return;
        }
      }

      // Prepare data for backend
      const submitData = {
        Date: formData.Date.format('YYYY-MM-DD'),
        Activity: formData.Activity,
        Category: formData.Category,
        Product: formData.Product,
        Batch: formData.Batch,
        Unit: formData.Unit,
        Quantity: parseFloat(formData.Quantity),
        Price: formData.Activity === ACTIVITY_TYPES.SALES ? parseFloat(formData.Price) : undefined,
        ExpireDate: formData.ExpireDate ? formData.ExpireDate.format('YYYY-MM-DD') : undefined,
        Note: formData.Note || '',
        DocumentNumber: formData.DocumentNumber
      };

      console.log('📤 Submitting data:', {
        editing: !!editingRecord,
        product: submitData.Product,
        activity: submitData.Activity,
        category: submitData.Category,
        batch: submitData.Batch,
        price: submitData.Price,
        expireDate: submitData.ExpireDate
      });

      if (editingRecord) {
        await axios.put(`${API_ENDPOINTS.BASE}/${editingRecord._id}`, submitData);
        showNotification('success', 'Record updated successfully!');
      } else {
        await axios.post(API_ENDPOINTS.BASE, submitData);
        showNotification('success', 'Record created successfully!');
      }

      setModalVisible(false);
      setEditingRecord(null);
      setFormData({
        Activity: ACTIVITY_TYPES.SALES,
        Category: CATEGORY_TYPES.RETAIL,
        Date: dayjs(),
        Product: '',
        Batch: '',
        ProductCode: '',
        Unit: 'PCS',
        DocumentNumber: '',
        Quantity: '',
        Price: '',
        TotalAmount: '',
        ExpireDate: null,
        Note: ''
      });
      setAvailableBatches([]);
      setBatchStock(0);
      setFormErrors({});
      
      // Refresh data
      await Promise.all([
        fetchRecords(),
        fetchStockSummary(),
        fetchSalesSummary()
      ]);
      
    } catch (error) {
      console.error('❌ Full error object:', error);
      
      let errorMessage = 'Operation failed';
      
      if (error.response?.data) {
        const serverError = error.response.data;
        
        if (serverError.message) {
          errorMessage = serverError.message;
        }
        
        if (serverError.errors && Array.isArray(serverError.errors)) {
          errorMessage = serverError.errors.join(', ');
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check if the backend is running.';
      } else {
        errorMessage = error.message;
      }
      
      showNotification('error', `Error: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Enhanced statistics calculation
  const statistics = useMemo(() => {
    const positiveActivities = ['Receive', 'Return from Customer'];
    const negativeActivities = ['Sales', 'Return to customer', 'Loss'];
    
    const positiveTransactions = records.filter(r => positiveActivities.includes(r.Activity));
    const negativeTransactions = records.filter(r => negativeActivities.includes(r.Activity));
    
    const totalSales = records.filter(r => r.Activity === 'Sales')
      .reduce((sum, r) => sum + (r.TotalAmount || 0), 0);
    
    return {
      totalProduction: positiveTransactions.reduce((sum, r) => sum + (r.Quantity || 0), 0),
      totalTransfer: negativeTransactions.reduce((sum, r) => sum + (r.Quantity || 0), 0),
      netQuantity: positiveTransactions.reduce((sum, r) => sum + (r.Quantity || 0), 0) - 
                   negativeTransactions.reduce((sum, r) => sum + (r.Quantity || 0), 0),
      totalSales: totalSales
    };
  }, [records]);

  // UPDATED columns for table with new activity types and categories
  const columns = [
    {
      id: 'Date',
      label: 'Date',
      render: (record) => record.Date ? dayjs(record.Date).format('DD/MM/YYYY') : 'N/A'
    },
    {
      id: 'Activity',
      label: 'Activity',
      render: (record) => {
        const getActivityColor = (activity) => {
          switch(activity) {
            case 'Receive': return 'success';
            case 'Sales': return 'primary';
            case 'Return from Customer': return 'warning';
            case 'Return to customer': return 'warning';
            case 'Loss': return 'error';
            default: return 'default';
          }
        };
        
        return (
          <Chip 
            label={record.Activity} 
            color={getActivityColor(record.Activity)}
            size="small"
          />
        );
      }
    },
    {
      id: 'Category',
      label: 'Category',
      render: (record) => {
        const getCategoryColor = (category) => {
          switch(category) {
            case 'Retail': return 'primary';
            case 'Agent': return 'secondary';
            case 'Tender': return 'success';
            case 'Project': return 'warning';
            case 'Promotion': return 'info';
            case 'Other': return 'default';
            default: return 'default';
          }
        };
        
        return (
          <Chip 
            label={record.Category} 
            color={getCategoryColor(record.Category)}
            size="small"
            variant="outlined"
          />
        );
      }
    },
    {
      id: 'Product',
      label: 'Product Name',
      render: (record) => record.Product || 'N/A'
    },
    {
      id: 'Unit',
      label: 'Unit',
      render: (record) => record.Unit || 'PCS'
    },
    {
      id: 'DocumentNumber',
      label: 'Document No.',
      render: (record) => record.DocumentNumber || 'N/A'
    },
    {
      id: 'Quantity',
      label: 'Quantity',
      render: (record) => {
        const positiveActivities = ['Receive', 'Return from Customer'];
        const isPositive = positiveActivities.includes(record.Activity);
        
        return (
          <Typography 
            color={isPositive ? 'success.main' : 'error.main'}
            fontWeight="bold"
          >
            {isPositive ? '+' : '-'}{record.Quantity || 0}
          </Typography>
        );
      }
    },
    {
      id: 'Price',
      label: 'Price',
      render: (record) => record.Price ? `$${record.Price.toFixed(2)}` : 'N/A'
    },
    {
      id: 'TotalAmount',
      label: 'Total Amount',
      render: (record) => record.TotalAmount ? `$${record.TotalAmount.toFixed(2)}` : 'N/A'
    },
    {
      id: 'Note',
      label: 'Note',
      render: (record) => record.Note ? 
        (record.Note.length > 30 ? `${record.Note.substring(0, 30)}...` : record.Note) : 
        'N/A'
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (record) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => showModal(record)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton 
              size="small" 
              color="error"
              onClick={() => {
                if (window.confirm('Are you sure to delete this record?')) {
                  handleDelete(record._id);
                }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 1, minHeight: '50vh' }}>
        
        {/* Enhanced Notification System */}
        <NotificationSystem 
          notifications={notifications} 
          onClose={closeNotification}
        />

        <StyledCard>
          <CardContent sx={{ p: 2 }}>
            {/* Enhanced Header */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 2,
              pb: 2,
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}>
              <Button 
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={onBack}
                size="large"
                sx={{ minWidth: '120px' }}
              >
                Back to Dashboard
              </Button>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Help & Documentation">
                  <Button 
                    variant="outlined"
                    startIcon={<HelpIcon />}
                    size="large"
                  >
                    Help
                  </Button>
                </Tooltip>
              </Box>
            </Box>

            {/* Enhanced Statistics Section - Centered */}
            <Grid container spacing={2} sx={{ mb: 3, textAlign: 'center' }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatisticCard color="default">
                  <InventoryIcon color="action" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6" component="div">
                    {activeProducts.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Products
                  </Typography>
                  {productsLoading && <LinearProgress sx={{ mt: 1 }} />}
                </StatisticCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatisticCard color="green">
                  <Typography variant="h6" component="div" color="success.main">
                    {statistics.totalProduction.toFixed(3)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Receiving
                  </Typography>
                </StatisticCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatisticCard color="red">
                  <Typography variant="h6" component="div" color="error.main">
                    {statistics.totalTransfer.toFixed(3)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Sales & Returns
                  </Typography>
                </StatisticCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatisticCard color="blue">
                  <AttachMoneyIcon sx={{ color: 'primary.main', fontSize: 40, mb: 1 }} />
                  <Typography variant="h6" component="div" color="primary.main">
                    ${statistics.totalSales.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Sales Amount
                  </Typography>
                </StatisticCard>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Enhanced Filters Section with Toggle */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2
              }}>
                <Button
                  startIcon={<FilterListIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                  variant={showFilters ? "contained" : "outlined"}
                >
                  Filters {showFilters ? '(Hide)' : '(Show)'}
                </Button>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Print">
                    <IconButton onClick={() => window.print()} size="large">
                      <PrintIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Import">
                    <IconButton size="large">
                      <ImportExportIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Export">
                    <IconButton size="large">
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Refresh">
                    <IconButton 
                      onClick={handleRefresh} 
                      disabled={loading || productsLoading}
                      size="large"
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  {/* UPDATED: Add Sales Record button is now always active */}
                  <Tooltip title="Add New Sales Record">
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => showModal()}
                      size="large"
                    >
                      Add Sales Record
                    </Button>
                  </Tooltip>
                </Box>
              </Box>

              <Collapse in={showFilters}>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Grid container spacing={2}>
                    {/* First Line: Activity, Category, Product */}
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Activity</InputLabel>
                        <Select
                          value={filters.activity}
                          onChange={(e) => handleFilterChange('activity', e.target.value)}
                          label="Activity"
                        >
                          <MenuItem value="">All Activities</MenuItem>
                          <MenuItem value={ACTIVITY_TYPES.SALES}>Sales</MenuItem>
                          <MenuItem value={ACTIVITY_TYPES.RECEIVE}>Receive</MenuItem>
                          <MenuItem value={ACTIVITY_TYPES.RETURN_FROM_CUSTOMER}>Return from Customer</MenuItem>
                          <MenuItem value={ACTIVITY_TYPES.RETURN_TO_CUSTOMER}>Return to customer</MenuItem>
                          <MenuItem value={ACTIVITY_TYPES.LOSS}>Loss</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Category</InputLabel>
                        <Select
                          value={filters.category}
                          onChange={(e) => handleFilterChange('category', e.target.value)}
                          label="Category"
                        >
                          <MenuItem value="">All Categories</MenuItem>
                          <MenuItem value={CATEGORY_TYPES.RECEIVE}>Receive</MenuItem>
                          <MenuItem value={CATEGORY_TYPES.RETAIL}>Retail</MenuItem>
                          <MenuItem value={CATEGORY_TYPES.AGENT}>Agent</MenuItem>
                          <MenuItem value={CATEGORY_TYPES.TENDER}>Tender</MenuItem>
                          <MenuItem value={CATEGORY_TYPES.PROJECT}>Project</MenuItem>
                          <MenuItem value={CATEGORY_TYPES.PROMOTION}>Promotion</MenuItem>
                          <MenuItem value={CATEGORY_TYPES.OTHER}>Other</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Product</InputLabel>
                        <Select
                          value={filters.product}
                          onChange={(e) => handleFilterChange('product', e.target.value)}
                          label="Product"
                          loading={productsLoading}
                        >
                          <MenuItem value="">All Products</MenuItem>
                          {activeProducts.map(product => (
                            <MenuItem key={product._id} value={product.name}>
                              {product.name} ({product.code})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Second Line: Date Range, Search, Action Buttons */}
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <DatePicker
                          label="Start Date"
                          value={filters.startDate ? dayjs(filters.startDate) : null}
                          onChange={(date) => handleFilterChange('startDate', date?.format('YYYY-MM-DD') || '')}
                          slotProps={{ textField: { size: 'small' } }}
                        />
                        <DatePicker
                          label="End Date"
                          value={filters.endDate ? dayjs(filters.endDate) : null}
                          onChange={(date) => handleFilterChange('endDate', date?.format('YYYY-MM-DD') || '')}
                          slotProps={{ textField: { size: 'small' } }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Search by Document No., Note, Product"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button
                          variant="contained"
                          startIcon={<SearchIcon />}
                          onClick={() => fetchRecords()}
                          disabled={loading}
                        >
                          Search
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<RefreshIcon />}
                          onClick={resetFilters}
                        >
                          Reset
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Collapse>
            </Box>

            {/* UPDATED: Changed from warning to info alert and updated message */}
            {activeProducts.length === 0 && !productsLoading && (
              <Alert
                severity="info"
                sx={{ mb: 2 }}
              >
                No active products found. You can still create sales records, but please ensure you select valid products when they become available.
              </Alert>
            )}

            {/* Enhanced Data Table */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer component={Paper} ref={tableRef}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {columns.map((column) => (
                          <TableCell key={column.id}>
                            {column.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {records.map((record, index) => (
                        <StyledTableRow 
                          key={record._id}
                          selected={index === selectedRowIndex}
                          onClick={() => setSelectedRowIndex(index)}
                        >
                          {columns.map((column) => (
                            <TableCell key={column.id}>
                              {column.render ? column.render(record) : record[column.id]}
                            </TableCell>
                          ))}
                        </StyledTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={CONSTANTS.PAGE_SIZES}
                  component="div"
                  count={pagination.total}
                  rowsPerPage={pagination.pageSize}
                  page={pagination.page}
                  onPageChange={handleTableChange}
                  onRowsPerPageChange={handleRowsPerPageChange}
                />
              </>
            )}
          </CardContent>
        </StyledCard>

        {/* Enhanced Create/Edit Modal */}
        <Dialog
          open={modalVisible}
          onClose={handleCancel}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {editingRecord ? (
                <>
                  <EditIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Edit Sales Record
                </>
              ) : (
                <>
                  <AddIcon sx={{ mr: 1, color: 'success.main' }} />
                  Create New Sales Record
                </>
              )}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Date"
                  value={formData.Date}
                  onChange={(date) => handleInputChange('Date', date)}
                  format="DD/MM/YYYY"
                  maxDate={dayjs()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!formErrors.Date,
                      helperText: formErrors.Date || 'Cannot be a future date'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <EnhancedFormField 
                  label="Activity" 
                  required 
                  error={formErrors.Activity}
                >
                  <Select
                    value={formData.Activity}
                    onChange={(e) => handleActivityChange(e.target.value)}
                    label="Activity"
                  >
                    <MenuItem value={ACTIVITY_TYPES.SALES}>Sales</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.RECEIVE}>Receive</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.RETURN_FROM_CUSTOMER}>Return from Customer</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.RETURN_TO_CUSTOMER}>Return to customer</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.LOSS}>Loss</MenuItem>
                  </Select>
                </EnhancedFormField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <EnhancedFormField 
                  label="Category" 
                  required 
                  error={formErrors.Category}
                >
                  <Select
                    value={formData.Category}
                    onChange={(e) => handleInputChange('Category', e.target.value)}
                    label="Category"
                  >
                    <MenuItem value={CATEGORY_TYPES.RECEIVE}>Receive</MenuItem>
                    <MenuItem value={CATEGORY_TYPES.RETAIL}>Retail</MenuItem>
                    <MenuItem value={CATEGORY_TYPES.AGENT}>Agent</MenuItem>
                    <MenuItem value={CATEGORY_TYPES.TENDER}>Tender</MenuItem>
                    <MenuItem value={CATEGORY_TYPES.PROJECT}>Project</MenuItem>
                    <MenuItem value={CATEGORY_TYPES.PROMOTION}>Promotion</MenuItem>
                    <MenuItem value={CATEGORY_TYPES.OTHER}>Other</MenuItem>
                  </Select>
                </EnhancedFormField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <EnhancedFormField 
                  label="Product Name" 
                  required 
                  error={formErrors.Product}
                >
                  <Select
                    value={formData.Product}
                    onChange={(e) => handleProductChange(e.target.value)}
                    label="Product Name"
                    disabled={!!editingRecord}
                  >
                    <MenuItem value="">Select Product</MenuItem>
                    {activeProducts.map(product => (
                      <MenuItem key={product._id} value={product.name}>
                        {product.name}
                      </MenuItem>
                    ))}
                  </Select>
                </EnhancedFormField>
              </Grid>

              {/* Dynamic Batch Field */}
              <Grid item xs={12} sm={6}>
                {renderBatchField()}
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Document Number"
                  value={formData.DocumentNumber}
                  onChange={(e) => handleInputChange('DocumentNumber', e.target.value)}
                  required
                  error={!!formErrors.DocumentNumber}
                  helperText={formErrors.DocumentNumber}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={formData.Quantity}
                  onChange={(e) => handleInputChange('Quantity', e.target.value)}
                  inputProps={{ 
                    min: 0.001,
                    step: 0.001
                  }}
                  required
                  error={!!formErrors.Quantity}
                  helperText={formErrors.Quantity}
                />
              </Grid>

              {/* Price and Total Amount for Sales */}
              {formData.Activity === ACTIVITY_TYPES.SALES && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Price"
                      type="number"
                      value={formData.Price}
                      onChange={(e) => handleInputChange('Price', e.target.value)}
                      inputProps={{ 
                        min: 0,
                        step: 0.01
                      }}
                      required
                      error={!!formErrors.Price}
                      helperText={formErrors.Price}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Total Amount"
                      value={formData.TotalAmount}
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        ),
                      }}
                      helperText="Calculated automatically (Price × Quantity)"
                    />
                  </Grid>
                </>
              )}

              {/* Dynamic Expire Date Field */}
              {renderExpireDateField()}

              {/* Stock Information */}
              {batchStock > 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Available Stock for selected batch: {batchStock.toFixed(3)}
                  </Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Note (Max 100 characters)"
                  multiline
                  rows={3}
                  value={formData.Note}
                  onChange={(e) => handleInputChange('Note', e.target.value)}
                  inputProps={{ maxLength: CONSTANTS.MAX_NOTE_LENGTH }}
                  helperText={`${formData.Note.length}/${CONSTANTS.MAX_NOTE_LENGTH} characters`}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Required fields are marked with <RequiredAsterisk>*</RequiredAsterisk>
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button onClick={handleCancel} disabled={submitting}>
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleSubmit}
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={20} /> : null}
                >
                  {editingRecord ? 'Update Record' : 'Create Record'}
                </Button>
              </Box>
            </Box>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default DailySalesForm;