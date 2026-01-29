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
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
  Collapse,
  InputAdornment,
  LinearProgress,
  FormHelperText,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Inventory as InventoryIcon,
  Print as PrintIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  CloudUpload as UploadIcon,
  Clear as ClearIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

// Constants for better maintainability
const CONSTANTS = {
  DEBOUNCE_DELAY: 500,
  PAGE_SIZES: [50, 100, 500, 1000],
  DEFAULT_PAGE_SIZE: 1000,
  NOTIFICATION_DURATION: 5000,
  MAX_NOTE_LENGTH: 100
};

// UPDATED ACTIVITY TYPES
const ACTIVITY_TYPES = {
  RECEIVE: 'Receive',
  ISSUE: 'Issue',
  RETURN: 'Return',
  RECEIVE_CUSTOMER_REWORK: 'ReceiveCustomer [Rework]',
  ISSUE_CUSTOMER_REWORK: 'IssueCustomer [Rework]',
  ISSUE_PROD_REWORK: 'IssueProd [Rework]',
  RECEIVE_PROD_REWORK: 'ReceiveProd [Rework]',
  SAMPLE: 'Sample',
  GIFT: 'Gift',
  PROMOTION: 'Promotion',
  WASTE: 'Waste'
};

// NEW: Manual batch activities based on table
const MANUAL_BATCH_ACTIVITIES = [
  ACTIVITY_TYPES.RETURN,
  ACTIVITY_TYPES.RECEIVE_CUSTOMER_REWORK
];

// UPDATED: Activities that require expire date - now includes Issue and IssueCustomer [Rework]
const EXPIRE_DATE_ACTIVITIES = [
  ACTIVITY_TYPES.RECEIVE,
  ACTIVITY_TYPES.RECEIVE_PROD_REWORK,
  ACTIVITY_TYPES.WASTE,
  ACTIVITY_TYPES.ISSUE,
  ACTIVITY_TYPES.ISSUE_CUSTOMER_REWORK
];

// API ENDPOINTS
const API_ENDPOINTS = {
  BASE: 'http://localhost:5000/api/product-ri',
  PRODUCTS: 'http://localhost:5000/api/products',
  STOCK_SUMMARY: '/stocks/summary',
  AVAILABLE_BATCHES: '/batches/available'
};

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
    <InputLabel sx={{ fontSize: '0.875rem' }}>
      {label}
      {required && <span style={{ color: '#d32f2f', marginLeft: '4px' }}>*</span>}
    </InputLabel>
    {children}
    {(error || helperText) && (
      <FormHelperText error={!!error} sx={{ fontSize: '0.75rem' }}>
        {error || helperText}
      </FormHelperText>
    )}
  </FormControl>
);

// NEW: Batch source information based on table
const getBatchSourceInfo = (activity) => {
  const batchSources = {
    'Receive': {
      database: 'production-managements',
      description: 'All batches from Transfer activities',
      requiresExpireDate: true,
      validation: 'Transfer quantity - Receive quantity > 0'
    },
    'ReceiveProd [Rework]': {
      database: 'production-managements', 
      description: 'All batches from Issue [Rework] activities',
      requiresExpireDate: true,
      validation: 'Issue [Rework] quantity - ReceiveProd [Rework] quantity > 0'
    },
    'Waste': {
      database: 'production-managements',
      description: 'All batches from Waste activities', 
      requiresExpireDate: true,
      validation: 'Waste quantity (production) - Waste quantity (product-ri) > 0'
    },
    'Issue': {
      database: 'product-r1',
      description: 'All batches with Received quantity',
      requiresExpireDate: true, // UPDATED: Now requires expire date
      validation: 'Received quantity - Issue quantity > 0'
    },
    'IssueProd [Rework]': {
      database: 'product-r1',
      description: 'All batches with ReceivedCustomer [Rework] quantity',
      requiresExpireDate: false,
      validation: 'ReceivedCustomer [Rework] quantity - IssueProd [Rework] quantity > 0'
    },
    'IssueCustomer [Rework]': {
      database: 'product-r1', 
      description: 'All batches with ReceivedCustomer [Rework] quantity',
      requiresExpireDate: true, // UPDATED: Now requires expire date
      validation: 'ReceivedCustomer [Rework] quantity - IssueCustomer [Rework] quantity > 0'
    },
    'Sample': {
      database: 'product-r1',
      description: 'All batches with Received quantity',
      requiresExpireDate: false,
      validation: 'Received quantity - Sample quantity > 0'
    },
    'Gift': {
      database: 'product-r1',
      description: 'All batches with Received quantity',
      requiresExpireDate: false,
      validation: 'Received quantity - Gift quantity > 0'
    },
    'Promotion': {
      database: 'product-r1',
      description: 'All batches with Received quantity',
      requiresExpireDate: false,
      validation: 'Received quantity - Promotion quantity > 0'
    },
    'Return': {
      database: 'manual',
      description: 'Manually enter batch number',
      requiresExpireDate: false,
      validation: 'Manual entry'
    },
    'ReceiveCustomer [Rework]': {
      database: 'manual',
      description: 'Manually enter batch number',
      requiresExpireDate: false,
      validation: 'Manual entry'
    }
  };
  
  return batchSources[activity] || { database: 'unknown', description: '', requiresExpireDate: false, validation: '' };
};

// Batch format validation helper
const validateBatchFormat = (batch, productCode, activity) => {
  if (MANUAL_BATCH_ACTIVITIES.includes(activity)) {
    if (!batch.startsWith(`${productCode}-`)) {
      return `Batch must start with "${productCode}-" for ${activity} activities`;
    }
    
    if (batch === `${productCode}-` || batch.length <= productCode.length + 1) {
      return 'Please enter a batch identifier after the product code prefix';
    }
  }
  return null;
};

const ProductRI = () => {
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
  const [submitting, setSubmitting] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({
    Activity: ACTIVITY_TYPES.RECEIVE,
    Date: dayjs(),
    Product: '',
    Batch: '',
    ProductCode: '',
    Unit: 'PCS',
    DocumentNumber: '',
    Quantity: '',
    ExpireDate: null,
    Note: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [companyManagement, setCompanyManagement] = useState({ 
    companyName: '',
    fullAddress: '',
    phone: '',
    email: '',
    website: ''
  });

  const tableRef = useRef();

  // Use debounced search
  const debouncedSearch = useDebounce(filters.search, CONSTANTS.DEBOUNCE_DELAY);

  // Filter only active products and remove codes from names
  const activeProducts = useMemo(() => {
    return products
      .filter(product => product.status === 'Active')
      .map(product => ({
        ...product,
        displayName: product.name.replace(/\[.*?\]/g, '').trim() // Remove codes from product names
      }));
  }, [products]);

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Enhanced form validation with NEW batch system
  const validateForm = useCallback(() => {
    const errors = {};
    const batchInfo = getBatchSourceInfo(formData.Activity);
    
    // Required field validation
    if (!formData.Date) errors.Date = 'Date is required';
    if (!formData.Activity) errors.Activity = 'Activity is required';
    if (!formData.Product) errors.Product = 'Product is required';
    if (!formData.Batch) errors.Batch = 'Batch is required';
    if (!formData.DocumentNumber) errors.DocumentNumber = 'Document Number is required';
    if (!formData.Quantity || formData.Quantity <= 0) errors.Quantity = 'Valid quantity is required';
    
    // Batch format validation for manual entry activities
    if (batchInfo.database === 'manual' && formData.Batch && formData.ProductCode) {
      const batchError = validateBatchFormat(formData.Batch, formData.ProductCode, formData.Activity);
      if (batchError) {
        errors.Batch = batchError;
      }
    }
    
    // Expire Date validation
    if (batchInfo.requiresExpireDate) {
      if (!formData.ExpireDate) {
        errors.ExpireDate = 'Expire Date is required for ' + formData.Activity + ' activities';
      } else if (formData.ExpireDate.isBefore(formData.Date, 'day')) {
        errors.ExpireDate = 'Expire Date cannot be before the transaction date';
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

  // Enhanced fetch products with error boundary
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const response = await axios.get(`${API_ENDPOINTS.BASE}/products/active`);
      
      let productsData = [];
      
      if (response.data && Array.isArray(response.data)) {
        productsData = response.data;
      }

      setProducts(productsData);

      if (productsData.length === 0) {
        showSnackbar('No active products found. Please add active products first.', 'warning');
      }

    } catch (error) {
      console.error('Error fetching products:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.statusText || 
                          error.message || 
                          'Failed to fetch products from database';
      
      showSnackbar(`Failed to load products: ${errorMessage}`, 'error');
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [showSnackbar]);

  // Enhanced fetch records with better error handling - UPDATED SORTING
  const fetchRecords = useCallback(async (abortController) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Only append non-empty values
      if (filters.page) params.append('page', filters.page + 1); // API expects 1-based
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.activity) params.append('activity', filters.activity);
      if (filters.product) params.append('product', filters.product);
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      // Add sort order to ensure newest at bottom
      params.append('sortBy', 'Date');
      params.append('sortOrder', 'asc'); // Keep ascending to show newest at bottom

      const response = await axios.get(`${API_ENDPOINTS.BASE}?${params}`, {
        signal: abortController?.signal
      });
      
      let recordsData = [];
      if (response.data && Array.isArray(response.data.records)) {
        recordsData = response.data.records;
      } else if (Array.isArray(response.data)) {
        recordsData = response.data;
      }
      
      // UPDATED: Sort records by date in ascending order (oldest first, newest at bottom)
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
      showSnackbar(errorMessage, 'error');
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, showSnackbar]);

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

  // Fetch company management info
  const fetchCompanyManagement = useCallback(async () => {
    try {
      const response = await axios.get('/api/companyManagements');
      if (response.data) {
        setCompanyManagement(response.data || {});
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
      setCompanyManagement({});
    }
  }, []);

  // ENHANCED: Fetch ALL available batches with PROPER expire date handling
  const fetchAvailableBatches = useCallback(async (productName, activity = null) => {
    if (!productName || !activity) {
      setAvailableBatches([]);
      return;
    }

    try {
      let url = `${API_ENDPOINTS.BASE}${API_ENDPOINTS.AVAILABLE_BATCHES}?productName=${encodeURIComponent(productName)}&activity=${encodeURIComponent(activity)}`;

      const response = await axios.get(url);
      const batchesData = response.data?.availableBatches || [];
      
      setAvailableBatches(batchesData);
      
    } catch (error) {
      console.error('Error fetching available batches:', error);
      setAvailableBatches([]);
    }
  }, []);

  // Effect for fetching records with debounce and cleanup
  useEffect(() => {
    const abortController = new AbortController();
    
    // Use a timeout to prevent too frequent fetches
    const timeoutId = setTimeout(() => {
      fetchRecords(abortController);
    }, 300); // Small delay to prevent flickering
    
    return () => {
      abortController.abort();
      clearTimeout(timeoutId);
    };
  }, [fetchRecords, debouncedSearch]);

  // Initial data fetch
  useEffect(() => {
    const abortController = new AbortController();
    
    fetchProducts();
    fetchStockSummary();
    fetchCompanyManagement();
    
    return () => {
      abortController.abort();
    };
  }, [fetchProducts, fetchStockSummary, fetchCompanyManagement]);

  // ENHANCED: Effect to automatically set expire date when batch is selected or available batches change
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
              showSnackbar(`Expire date automatically set to ${expireDate.format('DD/MM/YYYY')} from selected batch`, 'info');
            }
          } catch (error) {
            console.error('Error in effect setting expire date:', error);
          }
        }
      }
    }
  }, [formData.Batch, availableBatches, formData.Activity, formData.ExpireDate]);

  // Back button handler
  const onBack = () => {
    navigate('/Dashboard');
  };

  const handleTableChange = useCallback((event, newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  const handleRowsPerPageChange = useCallback((event) => {
    const newPageSize = parseInt(event.target.value, 10);
    setFilters(prev => ({
      ...prev,
      page: 0,
      limit: newPageSize
    }));
    setPagination(prev => ({ ...prev, page: 0, pageSize: newPageSize }));
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 0
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      page: 0,
      limit: CONSTANTS.DEFAULT_PAGE_SIZE,
      activity: '',
      product: '',
      startDate: '',
      endDate: '',
      search: ''
    });
    showSnackbar('Filters reset', 'info');
  }, [showSnackbar]);

  // ENHANCED: showModal function
  const showModal = useCallback((record = null) => {
    setEditingRecord(record);
    setModalVisible(true);
    setFormErrors({});
    
    if (record) {
      const productName = record.Product || '';

      setFormData({
        ...record,
        Date: record.Date ? dayjs(record.Date) : dayjs(),
        ExpireDate: record.ExpireDate ? dayjs(record.ExpireDate) : null,
        Product: productName,
        ProductCode: record.ProductCode || '',
        Unit: record.Unit || 'PCS',
        DocumentNumber: record.DocumentNumber || '',
        Activity: record.Activity || ACTIVITY_TYPES.RECEIVE,
        Quantity: record.Quantity || '',
        Batch: record.Batch || '',
        Note: record.Note || ''
      });
      
      // Fetch ALL batches for the activity
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
        Activity: ACTIVITY_TYPES.RECEIVE,
        Date: dayjs(),
        Product: '',
        Batch: '',
        ProductCode: '',
        Unit: 'PCS',
        DocumentNumber: '',
        Quantity: '',
        ExpireDate: null,
        Note: ''
      });
    }
  }, [fetchAvailableBatches, fetchBatchStock]);

  const handleCancel = useCallback(() => {
    setModalVisible(false);
    setEditingRecord(null);
    setFormData({
      Activity: ACTIVITY_TYPES.RECEIVE,
      Date: dayjs(),
      Product: '',
      Batch: '',
      ProductCode: '',
      Unit: 'PCS',
      DocumentNumber: '',
      Quantity: '',
      ExpireDate: null,
      Note: ''
    });
    setAvailableBatches([]);
    setBatchStock(0);
    setFormErrors({});
  }, []);

  const handleRefresh = useCallback(() => {
    fetchRecords();
    fetchProducts();
    fetchStockSummary();
    showSnackbar('Data refreshed successfully', 'info');
  }, [fetchRecords, fetchProducts, fetchStockSummary, showSnackbar]);

  // Enhanced delete with proper refresh and notification
  const handleDelete = useCallback(async (id) => {
    try {
      await axios.delete(`${API_ENDPOINTS.BASE}/${id}`);
      
      await Promise.all([
        fetchRecords(),
        fetchStockSummary()
      ]);
      
      fetchProducts();
      
      showSnackbar('Record deleted successfully!', 'success');
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Delete failed';
      showSnackbar(errorMessage, 'error');
    }
  }, [fetchRecords, fetchProducts, fetchStockSummary, showSnackbar]);

  // Handle form input changes
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [formErrors]);

  // ENHANCED: Product selection change handler
  const handleProductChange = useCallback(async (productName) => {
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
      const selectedProduct = activeProducts.find(p => p.displayName === productName);
      
      if (selectedProduct) {
        // Auto-populate ProductCode and Unit when product is selected (but hidden from user)
        handleInputChange('ProductCode', selectedProduct.code);
        handleInputChange('Unit', selectedProduct.unit || 'PCS');

        const batchInfo = getBatchSourceInfo(formData.Activity);
        
        if (batchInfo.database === 'manual') {
          // Pre-populate manual batch entry with product code prefix
          setFormData(prev => ({ ...prev, Batch: `${selectedProduct.code}-` }));
        } else {
          // Fetch ALL batches based on activity type
          await fetchAvailableBatches(productName, formData.Activity);
        }
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
      showSnackbar('Error loading product details', 'error');
    }
  }, [activeProducts, fetchAvailableBatches, formData.Activity, handleInputChange, showSnackbar]);

  // ENHANCED: Activity change handler
  const handleActivityChange = useCallback((activity) => {
    handleInputChange('Activity', activity);
    
    const batchInfo = getBatchSourceInfo(activity);
    
    // Reset batch and expire date when activity changes
    setFormData(prev => ({ 
      ...prev,
      Batch: '',
      ExpireDate: null
    }));
    
    setAvailableBatches([]);
    setBatchStock(0);
    
    // If it's a populated batch activity and we have a product, fetch ALL batches
    if (batchInfo.database !== 'manual' && formData.Product) {
      fetchAvailableBatches(formData.Product, activity);
    } else if (batchInfo.database === 'manual' && formData.ProductCode) {
      // Pre-populate manual batch entry
      setFormData(prev => ({ ...prev, Batch: `${formData.ProductCode}-` }));
    }
    
    setFormErrors({});
  }, [fetchAvailableBatches, formData.Product, formData.ProductCode, handleInputChange]);

  // ENHANCED: Batch change handler with PROPER expire date retrieval
  const handleBatchChange = useCallback((batch) => {
    handleInputChange('Batch', batch);
    
    if (batch) {
      fetchBatchStock(batch);
      
      // ENHANCED: Auto-populate expire date from selected batch with PROPER handling
      const selectedBatch = availableBatches.find(b => b._id === batch);
      if (selectedBatch) {
        const batchInfo = getBatchSourceInfo(formData.Activity);
        if (batchInfo.requiresExpireDate && selectedBatch.expireDate) {
          try {
            // Ensure the expire date is properly parsed
            const expireDate = dayjs(selectedBatch.expireDate);
            if (expireDate.isValid()) {
              setFormData(prev => ({ ...prev, ExpireDate: expireDate }));
              showSnackbar(`Expire date set to ${expireDate.format('DD/MM/YYYY')}`, 'info');
            } else {
              setFormData(prev => ({ ...prev, ExpireDate: null }));
              showSnackbar('Invalid expire date found for selected batch', 'warning');
            }
          } catch (error) {
            console.error(`Error parsing expire date for batch ${batch}:`, error);
            setFormData(prev => ({ ...prev, ExpireDate: null }));
            showSnackbar('Error processing expire date from batch', 'error');
          }
        } else if (batchInfo.requiresExpireDate && !selectedBatch.expireDate) {
          setFormData(prev => ({ ...prev, ExpireDate: null }));
          showSnackbar('No expire date found for selected batch', 'warning');
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
  }, [availableBatches, fetchBatchStock, formData.Activity, handleInputChange, showSnackbar]);

  // Enhanced form submission
  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitting(false);
      showSnackbar('Please fix validation errors before submitting', 'error');
      return;
    }
    
    try {
      // For new records, validate product exists
      if (!editingRecord) {
        const product = activeProducts.find(p => p.displayName === formData.Product);
        if (!product) {
          showSnackbar('Selected product not found or is not active', 'error');
          setSubmitting(false);
          return;
        }
      }

      // Prepare data for backend
      const submitData = {
        Date: formData.Date.format('YYYY-MM-DD'),
        Activity: formData.Activity,
        Product: formData.Product,
        Batch: formData.Batch,
        Unit: formData.Unit,
        Quantity: parseFloat(formData.Quantity),
        ExpireDate: formData.ExpireDate ? formData.ExpireDate.format('YYYY-MM-DD') : undefined,
        Note: formData.Note || '',
        DocumentNumber: formData.DocumentNumber
      };

      if (editingRecord) {
        await axios.put(`${API_ENDPOINTS.BASE}/${editingRecord._id}`, submitData);
        showSnackbar('Record updated successfully!', 'success');
      } else {
        await axios.post(API_ENDPOINTS.BASE, submitData);
        showSnackbar('Record created successfully!', 'success');
      }

      setModalVisible(false);
      setEditingRecord(null);
      setFormData({
        Activity: ACTIVITY_TYPES.RECEIVE,
        Date: dayjs(),
        Product: '',
        Batch: '',
        ProductCode: '',
        Unit: 'PCS',
        DocumentNumber: '',
        Quantity: '',
        ExpireDate: null,
        Note: ''
      });
      setAvailableBatches([]);
      setBatchStock(0);
      setFormErrors({});
      
      // Refresh data
      await Promise.all([
        fetchRecords(),
        fetchStockSummary()
      ]);
      
    } catch (error) {
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
      
      showSnackbar(`Error: ${errorMessage}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [activeProducts, editingRecord, fetchRecords, fetchStockSummary, formData, showSnackbar, validateForm]);

  // Enhanced statistics calculation with UPDATED activity types
  const statistics = useMemo(() => {
    const positiveActivities = ['Receive', 'ReceiveCustomer [Rework]', 'ReceiveProd [Rework]'];
    const negativeActivities = ['Issue', 'IssueCustomer [Rework]', 'IssueProd [Rework]', 'Sample', 'Gift', 'Promotion', 'Waste', 'Return'];
    
    const positiveTransactions = records.filter(r => positiveActivities.includes(r.Activity));
    const negativeTransactions = records.filter(r => negativeActivities.includes(r.Activity));
    
    return {
      totalProduction: positiveTransactions.reduce((sum, r) => sum + (r.Quantity || 0), 0),
      totalTransfer: negativeTransactions.reduce((sum, r) => sum + (r.Quantity || 0), 0),
      netQuantity: positiveTransactions.reduce((sum, r) => sum + (r.Quantity || 0), 0) - 
                   negativeTransactions.reduce((sum, r) => sum + (r.Quantity || 0), 0)
    };
  }, [records]);

  // Check if current activity requires manual batch entry
  const requiresManualBatch = MANUAL_BATCH_ACTIVITIES.includes(formData.Activity);
  const requiresExpireDate = EXPIRE_DATE_ACTIVITIES.includes(formData.Activity);
  const batchInfo = getBatchSourceInfo(formData.Activity);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.activity !== '' ||
      filters.product !== '' ||
      filters.search !== '' ||
      filters.startDate !== '' ||
      filters.endDate !== ''
    );
  }, [filters]);

  // Memoize the render functions for table cells to prevent re-renders
  const renderDateCell = useCallback((record) => {
    return record.Date ? dayjs(record.Date).format('DD/MM/YYYY') : 'N/A';
  }, []);

  const renderActivityCell = useCallback((record) => {
    const getActivityColor = (activity) => {
      switch(activity) {
        case 'Receive': return 'success';
        case 'Issue': return 'primary';
        case 'Return': return 'warning';
        case 'ReceiveCustomer [Rework]': return 'info';
        case 'IssueCustomer [Rework]': return 'warning';
        case 'IssueProd [Rework]': return 'warning';
        case 'ReceiveProd [Rework]': return 'info';
        case 'Sample': return 'secondary';
        case 'Gift': return 'secondary';
        case 'Promotion': return 'secondary';
        case 'Waste': return 'error';
        default: return 'default';
      }
    };
    
    return (
      <Chip 
        label={record.Activity} 
        color={getActivityColor(record.Activity)}
        size="small"
        sx={{ 
          height: '20px', 
          fontSize: '0.75rem',
          '& .MuiChip-label': {
            px: 0.75,
            py: 0.25
          }
        }}
      />
    );
  }, []);

  const renderProductCell = useCallback((record) => {
    const displayName = record.Product ? record.Product.replace(/\[.*?\]/g, '').trim() : 'N/A';
    return displayName;
  }, []);

  const renderQuantityCell = useCallback((record) => {
    const positiveActivities = ['Receive', 'ReceiveCustomer [Rework]', 'ReceiveProd [Rework]'];
    const isPositive = positiveActivities.includes(record.Activity);
    
    return (
      <Typography 
        color={isPositive ? 'success.main' : 'error.main'}
        fontWeight="bold"
        variant="body2"
        sx={{ fontSize: '0.8125rem' }}
      >
        {isPositive ? '+' : '-'}{record.Quantity || 0}
      </Typography>
    );
  }, []);

  const renderNoteCell = useCallback((record) => {
    return record.Note ? 
      (record.Note.length > 20 ? `${record.Note.substring(0, 20)}...` : record.Note) : 
      'N/A';
  }, []);

  // Memoize the table rows to prevent unnecessary re-renders
  const tableRows = useMemo(() => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
            <CircularProgress size={24} />
          </TableCell>
        </TableRow>
      );
    }

    if (records.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
            <Typography color="textSecondary">
              No records found
            </Typography>
          </TableCell>
        </TableRow>
      );
    }

    return records.map((record, index) => (
      <TableRow 
        key={record._id} 
        hover
        selected={index === selectedRowIndex}
        onClick={() => setSelectedRowIndex(index)}
        sx={{ height: '36px' }}
      >
        <TableCell sx={{ 
          padding: '4px 8px',
          whiteSpace: 'nowrap',
          minWidth: '80px',
          width: '80px',
          fontSize: '0.8125rem'
        }}>
          {renderDateCell(record)}
        </TableCell>
        <TableCell sx={{ 
          padding: '4px 8px',
          whiteSpace: 'nowrap'
        }}>
          {renderActivityCell(record)}
        </TableCell>
        <TableCell sx={{ 
          padding: '4px 8px',
          whiteSpace: 'nowrap',
          fontSize: '0.8125rem'
        }}>{renderProductCell(record)}</TableCell>
        <TableCell sx={{ 
          padding: '4px 8px',
          whiteSpace: 'nowrap',
          fontSize: '0.8125rem'
        }}>{record.Unit || 'PCS'}</TableCell>
        <TableCell sx={{ 
          padding: '4px 8px',
          whiteSpace: 'nowrap',
          fontSize: '0.8125rem'
        }}>{record.DocumentNumber || 'N/A'}</TableCell>
        <TableCell sx={{ 
          padding: '4px 8px',
          whiteSpace: 'nowrap',
          fontSize: '0.8125rem'
        }}>
          {renderQuantityCell(record)}
        </TableCell>
        <TableCell sx={{ 
          padding: '4px 8px',
          whiteSpace: 'nowrap',
          fontSize: '0.8125rem'
        }}>{record.Batch || 'N/A'}</TableCell>
        <TableCell sx={{ 
          padding: '4px 8px',
          whiteSpace: 'nowrap',
          maxWidth: '150px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: '0.8125rem'
        }} title={record.Note}>
          {renderNoteCell(record)}
        </TableCell>
        <TableCell sx={{ 
          padding: '4px 8px',
          whiteSpace: 'nowrap'
        }}>
          <Box sx={{ display: 'flex', gap: 0.25 }}>
            <Tooltip title="Edit">
              <IconButton 
                size="small" 
                color="primary"
                onClick={() => showModal(record)}
                sx={{ padding: '4px' }}
              >
                <EditIcon fontSize="small" />
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
                sx={{ padding: '4px' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
    ));
  }, [loading, records, selectedRowIndex, renderDateCell, renderActivityCell, renderProductCell, renderQuantityCell, renderNoteCell, showModal, handleDelete]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 2 }}>
        {/* Header with Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Product Receiving & Issuing
            </Typography>
            {companyManagement?.companyName && (
              <Typography variant="body2" color="textSecondary">
                {companyManagement.companyName}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Back to Dashboard">
              <IconButton onClick={onBack} size="small">
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} size="small">
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print">
              <IconButton onClick={() => window.print()} size="small">
                <PrintIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export">
              <IconButton onClick={() => {}} size="small">
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Filter">
              <IconButton 
                onClick={() => setShowFilters(!showFilters)} 
                size="small"
                color={showFilters ? "primary" : "default"}
              >
                <FilterListIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => showModal()}
              disabled={activeProducts.length === 0}
              size="small"
              sx={{ ml: 1 }}
            >
              Add Record
            </Button>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ minHeight: '80px' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <InventoryIcon color="primary" sx={{ mr: 1, fontSize: '1rem' }} />
                  <Typography variant="body2" color="textSecondary">
                    Active Products
                  </Typography>
                </Box>
                <Typography variant="h6" color="primary">
                  {activeProducts.length}
                </Typography>
                {productsLoading && <LinearProgress sx={{ mt: 0.5, height: 2 }} />}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ minHeight: '80px' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <UploadIcon sx={{ color: 'success.main', mr: 1, fontSize: '1rem' }} />
                  <Typography variant="body2" color="textSecondary">
                    Total Receiving
                  </Typography>
                </Box>
                <Typography variant="h6" color="success.main">
                  {statistics.totalProduction.toFixed(3)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ minHeight: '80px' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <UploadIcon sx={{ color: 'error.main', mr: 1, fontSize: '1rem' }} />
                  <Typography variant="body2" color="textSecondary">
                    Total Issuing
                  </Typography>
                </Box>
                <Typography variant="h6" color="error.main">
                  {statistics.totalTransfer.toFixed(3)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ minHeight: '80px' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <InventoryIcon color="primary" sx={{ mr: 1, fontSize: '1rem' }} />
                  <Typography variant="body2" color="textSecondary">
                    Net Quantity
                  </Typography>
                </Box>
                <Typography variant="h6" color="primary">
                  {statistics.netQuantity.toFixed(3)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters - Collapsible */}
        {showFilters && (
          <Paper sx={{ p: 1.5, mb: 2 }}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} md={2.4}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.875rem' }}>Activity</InputLabel>
                  <Select
                    value={filters.activity}
                    onChange={(e) => handleFilterChange('activity', e.target.value)}
                    label="Activity"
                    sx={{ fontSize: '0.875rem' }}
                    InputProps={{
                      endAdornment: filters.activity && (
                        <IconButton
                          size="small"
                          onClick={() => handleFilterChange('activity', '')}
                          sx={{ mr: -1 }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.875rem' }}>All Activities</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.RECEIVE} sx={{ fontSize: '0.875rem' }}>Receive</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.ISSUE} sx={{ fontSize: '0.875rem' }}>Issue</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.RETURN} sx={{ fontSize: '0.875rem' }}>Return</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.RECEIVE_CUSTOMER_REWORK} sx={{ fontSize: '0.875rem' }}>ReceiveCustomer [Rework]</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.ISSUE_CUSTOMER_REWORK} sx={{ fontSize: '0.875rem' }}>IssueCustomer [Rework]</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.ISSUE_PROD_REWORK} sx={{ fontSize: '0.875rem' }}>IssueProd [Rework]</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.RECEIVE_PROD_REWORK} sx={{ fontSize: '0.875rem' }}>ReceiveProd [Rework]</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.SAMPLE} sx={{ fontSize: '0.875rem' }}>Sample</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.GIFT} sx={{ fontSize: '0.875rem' }}>Gift</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.PROMOTION} sx={{ fontSize: '0.875rem' }}>Promotion</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.WASTE} sx={{ fontSize: '0.875rem' }}>Waste</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.875rem' }}>Product</InputLabel>
                  <Select
                    value={filters.product}
                    onChange={(e) => handleFilterChange('product', e.target.value)}
                    label="Product"
                    sx={{ fontSize: '0.875rem' }}
                    InputProps={{
                      endAdornment: filters.product && (
                        <IconButton
                          size="small"
                          onClick={() => handleFilterChange('product', '')}
                          sx={{ mr: -1 }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.875rem' }}>All Products</MenuItem>
                    {activeProducts.map(product => (
                      <MenuItem key={product._id} value={product.displayName} sx={{ fontSize: '0.875rem' }}>
                        {product.displayName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Document No., Note, Product..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: filters.search && (
                      <IconButton
                        size="small"
                        onClick={() => handleFilterChange('search', '')}
                        sx={{ mr: -1 }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    )
                  }}
                  sx={{ 
                    '& .MuiInputBase-input': { fontSize: '0.875rem' },
                    '& .MuiInputLabel-root': { fontSize: '0.875rem' }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2.4}>
                <DatePicker
                  label="Start Date"
                  value={filters.startDate ? dayjs(filters.startDate) : null}
                  onChange={(date) => handleFilterChange('startDate', date?.format('YYYY-MM-DD') || '')}
                  slotProps={{ 
                    textField: { 
                      size: 'small',
                      sx: { 
                        '& .MuiInputBase-input': { fontSize: '0.875rem' },
                        '& .MuiInputLabel-root': { fontSize: '0.875rem' }
                      }
                    } 
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2.4}>
                <DatePicker
                  label="End Date"
                  value={filters.endDate ? dayjs(filters.endDate) : null}
                  onChange={(date) => handleFilterChange('endDate', date?.format('YYYY-MM-DD') || '')}
                  slotProps={{ 
                    textField: { 
                      size: 'small',
                      sx: { 
                        '& .MuiInputBase-input': { fontSize: '0.875rem' },
                        '& .MuiInputLabel-root': { fontSize: '0.875rem' }
                      }
                    } 
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Box>
                    {hasActiveFilters && (
                      <Chip
                        label="Active Filters"
                        color="primary"
                        size="small"
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                    )}
                  </Box>
                  <Box>
                    <Button
                      variant="outlined"
                      startIcon={<ClearIcon />}
                      onClick={resetFilters}
                      size="small"
                      disabled={!hasActiveFilters}
                      sx={{ ml: 1 }}
                    >
                      Reset Filters
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Active Filters Indicator */}
        {hasActiveFilters && !showFilters && (
          <Paper sx={{ p: 1, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon color="primary" fontSize="small" />
              <Typography variant="body2" color="textSecondary">
                Active Filters:
              </Typography>
              {filters.activity && (
                <Chip
                  label={`Activity: ${filters.activity}`}
                  size="small"
                  onDelete={() => handleFilterChange('activity', '')}
                />
              )}
              {filters.product && (
                <Chip
                  label={`Product: ${filters.product}`}
                  size="small"
                  onDelete={() => handleFilterChange('product', '')}
                />
              )}
              {filters.search && (
                <Chip
                  label={`Search: ${filters.search}`}
                  size="small"
                  onDelete={() => handleFilterChange('search', '')}
                />
              )}
              {filters.startDate && (
                <Chip
                  label={`From: ${dayjs(filters.startDate).format('DD/MM/YYYY')}`}
                  size="small"
                  onDelete={() => handleFilterChange('startDate', '')}
                />
              )}
              {filters.endDate && (
                <Chip
                  label={`To: ${dayjs(filters.endDate).format('DD/MM/YYYY')}`}
                  size="small"
                  onDelete={() => handleFilterChange('endDate', '')}
                />
              )}
            </Box>
            <Box>
              <Tooltip title="Clear All Filters">
                <IconButton
                  size="small"
                  onClick={resetFilters}
                  color="primary"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        )}

        {/* Product Alert */}
        {activeProducts.length === 0 && !productsLoading && (
          <Alert
            severity="warning"
            sx={{ mb: 2, fontSize: '0.875rem' }}
          >
            Please add active products to the database before creating records.
          </Alert>
        )}

        {/* Data Table - FIXED with memoized rows */}
        <Box sx={{ position: 'relative', mb: 2 }}>
          <TableContainer 
            component={Paper} 
            ref={tableRef}
            sx={{ 
              maxHeight: '400px',
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#888',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#555',
              }
            }}
          >
            <Table sx={{ minWidth: 650 }} size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ 
                    padding: '6px 8px', 
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    fontSize: '0.8125rem',
                    minWidth: '80px',
                    width: '80px',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}>Date</TableCell>
                  <TableCell sx={{ 
                    padding: '6px 8px', 
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    fontSize: '0.8125rem',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}>Activity</TableCell>
                  <TableCell sx={{ 
                    padding: '6px 8px', 
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    fontSize: '0.8125rem',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}>Product</TableCell>
                  <TableCell sx={{ 
                    padding: '6px 8px', 
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    fontSize: '0.8125rem',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}>Unit</TableCell>
                  <TableCell sx={{ 
                    padding: '6px 8px', 
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    fontSize: '0.8125rem',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}>Doc No</TableCell>
                  <TableCell sx={{ 
                    padding: '6px 8px', 
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    fontSize: '0.8125rem',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}>Quantity</TableCell>
                  <TableCell sx={{ 
                    padding: '6px 8px', 
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    fontSize: '0.8125rem',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}>Batch</TableCell>
                  <TableCell sx={{ 
                    padding: '6px 8px', 
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    fontSize: '0.8125rem',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}>Note</TableCell>
                  <TableCell sx={{ 
                    padding: '6px 8px', 
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    fontSize: '0.8125rem',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Pagination and Summary */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2 
        }}>
          <Typography variant="body2" color="textSecondary">
            Showing {records.length} of {pagination.total} records
            {hasActiveFilters && ' (filtered)'}
          </Typography>
          
          <TablePagination
            rowsPerPageOptions={CONSTANTS.PAGE_SIZES}
            component="div"
            count={pagination.total}
            rowsPerPage={pagination.pageSize}
            page={pagination.page}
            onPageChange={handleTableChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            sx={{
              '& .MuiTablePagination-toolbar': {
                padding: 0,
                minHeight: 'auto',
                fontSize: '0.75rem'
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.75rem',
                margin: 0
              }
            }}
          />
        </Box>

        {/* Create/Edit Modal */}
        <Dialog
          open={modalVisible}
          onClose={handleCancel}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1, fontSize: '1rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {editingRecord ? (
                <>
                  <EditIcon sx={{ mr: 1, color: 'primary.main', fontSize: '1.2rem' }} />
                  Edit Record
                </>
              ) : (
                <>
                  <AddIcon sx={{ mr: 1, color: 'success.main', fontSize: '1.2rem' }} />
                  Create New Record
                </>
              )}
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Grid container spacing={1.5}>
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
                      helperText: formErrors.Date || 'Cannot be a future date',
                      size: 'small',
                      sx: { 
                        '& .MuiInputBase-input': { fontSize: '0.875rem' },
                        '& .MuiInputLabel-root': { fontSize: '0.875rem' }
                      }
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
                    sx={{ fontSize: '0.875rem' }}
                  >
                    <MenuItem value={ACTIVITY_TYPES.RECEIVE} sx={{ fontSize: '0.875rem' }}>Receive</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.ISSUE} sx={{ fontSize: '0.875rem' }}>Issue</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.RETURN} sx={{ fontSize: '0.875rem' }}>Return</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.RECEIVE_CUSTOMER_REWORK} sx={{ fontSize: '0.875rem' }}>ReceiveCustomer [Rework]</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.ISSUE_CUSTOMER_REWORK} sx={{ fontSize: '0.875rem' }}>IssueCustomer [Rework]</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.ISSUE_PROD_REWORK} sx={{ fontSize: '0.875rem' }}>IssueProd [Rework]</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.RECEIVE_PROD_REWORK} sx={{ fontSize: '0.875rem' }}>ReceiveProd [Rework]</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.SAMPLE} sx={{ fontSize: '0.875rem' }}>Sample</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.GIFT} sx={{ fontSize: '0.875rem' }}>Gift</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.PROMOTION} sx={{ fontSize: '0.875rem' }}>Promotion</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.WASTE} sx={{ fontSize: '0.875rem' }}>Waste</MenuItem>
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
                    sx={{ fontSize: '0.875rem' }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.875rem' }}>Select Product</MenuItem>
                    {activeProducts.map(product => (
                      <MenuItem key={product._id} value={product.displayName} sx={{ fontSize: '0.875rem' }}>
                        {product.displayName}
                      </MenuItem>
                    ))}
                  </Select>
                </EnhancedFormField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                {requiresManualBatch ? (
                  <TextField
                    fullWidth
                    label="Batch"
                    value={formData.Batch}
                    onChange={(e) => handleBatchChange(e.target.value)}
                    required
                    error={!!formErrors.Batch}
                    helperText={`${batchInfo.description}. Format: ${formData.ProductCode}-[identifier]`}
                    size="small"
                    sx={{ 
                      '& .MuiInputBase-input': { fontSize: '0.875rem' },
                      '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                      '& .MuiFormHelperText-root': { fontSize: '0.75rem' }
                    }}
                  />
                ) : (
                  <EnhancedFormField 
                    label="Batch" 
                    required 
                    error={formErrors.Batch}
                    helperText={batchInfo.description}
                  >
                    <Select
                      value={formData.Batch}
                      onChange={(e) => handleBatchChange(e.target.value)}
                      label="Batch"
                      sx={{ fontSize: '0.875rem' }}
                    >
                      <MenuItem value="" sx={{ fontSize: '0.875rem' }}>
                        {availableBatches.length === 0 ? 'No batches found' : 'Select Batch'}
                      </MenuItem>
                      {availableBatches.map(batch => (
                        <MenuItem key={batch._id} value={batch._id} sx={{ fontSize: '0.875rem' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                              {batch._id}
                              {!batch.isAvailable && ' (No Stock)'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              Available: {batch.totalStock.toFixed(3)} | Source: {batch.sourceActivity}
                            </Typography>
                            {batch.expireDate && (
                              <Typography 
                                variant="caption" 
                                color="success.main"
                                sx={{ fontSize: '0.75rem' }}
                                fontWeight="bold"
                              >
                                Expires: {dayjs(batch.expireDate).format('DD/MM/YYYY')}
                              </Typography>
                            )}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </EnhancedFormField>
                )}
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
                  size="small"
                  sx={{ 
                    '& .MuiInputBase-input': { fontSize: '0.875rem' },
                    '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                    '& .MuiFormHelperText-root': { fontSize: '0.75rem' }
                  }}
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
                  size="small"
                  sx={{ 
                    '& .MuiInputBase-input': { fontSize: '0.875rem' },
                    '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                    '& .MuiFormHelperText-root': { fontSize: '0.75rem' }
                  }}
                />
              </Grid>

              {requiresExpireDate && (
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Expire Date"
                    value={formData.ExpireDate}
                    onChange={(date) => handleInputChange('ExpireDate', date)}
                    format="DD/MM/YYYY"
                    minDate={formData.Date}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!formErrors.ExpireDate,
                        helperText: formErrors.ExpireDate || 'Must be on or after transaction date',
                        size: 'small',
                        sx: { 
                          '& .MuiInputBase-input': { fontSize: '0.875rem' },
                          '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                          '& .MuiFormHelperText-root': { fontSize: '0.75rem' }
                        }
                      }
                    }}
                  />
                </Grid>
              )}

              {batchStock > 0 && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ fontSize: '0.875rem', py: 0.5 }}>
                    Available Stock for selected batch: {batchStock.toFixed(3)}
                  </Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Note (Max 100 characters)"
                  multiline
                  rows={2}
                  value={formData.Note}
                  onChange={(e) => handleInputChange('Note', e.target.value)}
                  inputProps={{ maxLength: CONSTANTS.MAX_NOTE_LENGTH }}
                  helperText={`${formData.Note.length}/${CONSTANTS.MAX_NOTE_LENGTH} characters`}
                  size="small"
                  sx={{ 
                    '& .MuiInputBase-input': { fontSize: '0.875rem' },
                    '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                    '& .MuiFormHelperText-root': { fontSize: '0.75rem' }
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 2, py: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Required fields are marked with <span style={{ color: '#d32f2f' }}>*</span>
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
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
                  {editingRecord ? 'Update' : 'Create'}
                </Button>
              </Box>
            </Box>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ fontSize: '0.875rem' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default ProductRI;