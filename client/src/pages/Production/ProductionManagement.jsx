import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
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
  Print as PrintIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  CloudUpload as UploadIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon
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

const ACTIVITY_TYPES = {
  PRODUCTION: 'Production',
  TRANSFER: 'Transfer',
  RECEIVE_REWORK: 'Receive [Rework]',
  ISSUE_REWORK: 'Issue [Rework]',
  WASTE: 'Waste'
};

const MANUAL_BATCH_ACTIVITIES = [
  ACTIVITY_TYPES.RECEIVE_REWORK,
  ACTIVITY_TYPES.WASTE
];

const FETCH_BATCHES_ACTIVITIES = [
  ACTIVITY_TYPES.TRANSFER,
  ACTIVITY_TYPES.ISSUE_REWORK,
  ACTIVITY_TYPES.RECEIVE_REWORK
];

const API_ENDPOINTS = {
  BASE: 'http://localhost:5000/api/production-managements',
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

// Enhanced Form Field Component - Simplified version
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

// Batch format validation helper
const validateBatchFormat = (batch, productCode, activity) => {
  if (MANUAL_BATCH_ACTIVITIES.includes(activity)) {
    // For manual batch activities, ensure it starts with product code
    if (!batch.startsWith(`${productCode}-`)) {
      return `Batch must start with "${productCode}-" for ${activity} activities`;
    }
    
    // Ensure there's content after the prefix
    if (batch === `${productCode}-` || batch.length <= productCode.length + 1) {
      return 'Please enter a batch identifier after the product code prefix';
    }
  }
  return null;
};

// Custom DatePicker component that opens calendar when any part is clicked
const CustomDatePicker = ({ label, value, onChange, maxDate, readOnly, ...props }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <DatePicker
      label={label}
      value={value}
      onChange={onChange}
      maxDate={maxDate}
      open={open}
      onOpen={() => !readOnly && setOpen(true)}
      onClose={() => setOpen(false)}
      format="DD/MM/YYYY"
      renderInput={(params) => (
        <TextField
          {...params}
          fullWidth
          size="small"
          onClick={() => !readOnly && setOpen(true)}
          InputProps={{
            ...params.InputProps,
            endAdornment: !readOnly && (
              <IconButton
                size="small"
                onClick={() => setOpen(true)}
                sx={{ padding: '4px' }}
              >
                <CalendarIcon fontSize="small" />
              </IconButton>
            )
          }}
        />
      )}
      {...props}
    />
  );
};

const ProductionManagement = () => {
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
    startDate: null,
    endDate: null,
    search: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({
    Activity: ACTIVITY_TYPES.PRODUCTION,
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

  // ✅ FIXED: Enhanced batch number generation with proper DDMMYY format
  const generateBatchNumber = useCallback((productName, date) => {
    if (!productName || !date) return '';
    
    const product = activeProducts.find(p => p.displayName === productName);
    if (!product || !product.code) return '';
    
    try {
      const dateObj = dayjs(date).toDate();
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = String(dateObj.getFullYear()).slice(-2);
      const dateStr = `${day}${month}${year}`;
      const batchNumber = `${product.code}-${dateStr}`;
      
      return batchNumber;
    } catch (error) {
      console.error('Error generating batch number:', error);
      return '';
    }
  }, [activeProducts]);

  // ✅ FIXED: Auto-generate batch number when product or date changes for Production activities
  useEffect(() => {
    if (modalVisible && formData.Activity === ACTIVITY_TYPES.PRODUCTION && !editingRecord) {
      const { Product, Date } = formData;
      if (Product && Date) {
        const newBatch = generateBatchNumber(Product, Date);
        if (newBatch && newBatch !== formData.Batch) {
          setFormData(prev => ({ ...prev, Batch: newBatch }));
        }
      } else {
        // Clear batch if product or date is missing
        if (formData.Batch) {
          setFormData(prev => ({ ...prev, Batch: '' }));
        }
      }
    }
  }, [formData.Product, formData.Date, formData.Activity, modalVisible, generateBatchNumber, editingRecord]);

  // Effect to update ExpireDate when batch changes for Transfer and Receive [Rework]
  useEffect(() => {
    if ((formData.Activity === ACTIVITY_TYPES.TRANSFER || formData.Activity === ACTIVITY_TYPES.RECEIVE_REWORK) && formData.Batch) {
      const selectedBatch = availableBatches.find(batch => batch._id === formData.Batch);
      if (selectedBatch && selectedBatch.expireDate) {
        setFormData(prev => ({ 
          ...prev, 
          ExpireDate: dayjs(selectedBatch.expireDate) 
        }));
      }
    }
  }, [formData.Batch, formData.Activity, availableBatches]);

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Enhanced form validation
  const validateForm = useCallback(() => {
    const errors = {};
    
    // Required field validation
    if (!formData.Date) errors.Date = 'Date is required';
    if (!formData.Activity) errors.Activity = 'Activity is required';
    if (!formData.Product) errors.Product = 'Product is required';
    if (!formData.Batch) errors.Batch = 'Batch is required';
    if (!formData.DocumentNumber) errors.DocumentNumber = 'Document Number is required';
    if (!formData.Quantity || formData.Quantity <= 0) errors.Quantity = 'Valid quantity is required';
    
    // Batch format validation for manual entry activities
    if (MANUAL_BATCH_ACTIVITIES.includes(formData.Activity) && formData.Batch && formData.ProductCode) {
      const batchError = validateBatchFormat(formData.Batch, formData.ProductCode, formData.Activity);
      if (batchError) {
        errors.Batch = batchError;
      }
    }
    
    // Expire Date validation - must be on or after transaction date for Production, Transfer, and Receive [Rework]
    const expireDateRequiredActivities = [ACTIVITY_TYPES.PRODUCTION, ACTIVITY_TYPES.TRANSFER, ACTIVITY_TYPES.RECEIVE_REWORK];
    if (expireDateRequiredActivities.includes(formData.Activity)) {
      if (!formData.ExpireDate) {
        errors.ExpireDate = 'Expire Date is required for ' + formData.Activity + ' activities';
      } else if (formData.ExpireDate.isBefore(formData.Date, 'day')) {
        errors.ExpireDate = 'Expire Date cannot be before the transaction date';
      }
    }
    
    // Business logic validation for stock-consuming activities
    const stockCheckActivities = [ACTIVITY_TYPES.TRANSFER, ACTIVITY_TYPES.ISSUE_REWORK];
    if (stockCheckActivities.includes(formData.Activity) && formData.Quantity > batchStock) {
      errors.Quantity = `Issue quantity cannot exceed available stock (${batchStock.toFixed(3)})`;
    }
    
    return errors;
  }, [formData, batchStock]);

  // ENHANCED: Updated fetch available batches with ACTIVITY FILTERING and Receive [Rework] support
  const fetchAvailableBatches = useCallback(async (productName, activity = null) => {
    if (!productName) {
      setAvailableBatches([]);
      return;
    }

    try {
      let url = `${API_ENDPOINTS.BASE}${API_ENDPOINTS.AVAILABLE_BATCHES}?productName=${encodeURIComponent(productName)}`;
      
      // Add activity parameter for activities that require batch filtering
      if (FETCH_BATCHES_ACTIVITIES.includes(activity)) {
        url += `&activity=${encodeURIComponent(activity)}`;
      }

      const response = await axios.get(url);
      const batchesData = response.data?.availableBatches || [];
      
      // Enhanced batch information display with detailed breakdown for Receive [Rework]
      const enhancedBatches = batchesData.map(batch => {
        if (activity === ACTIVITY_TYPES.RECEIVE_REWORK && batch.totalIssued !== undefined) {
          return {
            ...batch,
            displayText: `${batch._id} (Available: ${batch.totalStock.toFixed(3)} - Issued: ${batch.totalIssued.toFixed(3)}, Received: ${batch.totalReceived.toFixed(3)})`
          };
        }
        return {
          ...batch,
          displayText: `${batch._id} (Available: ${batch.totalStock.toFixed(3)})`
        };
      });
      
      setAvailableBatches(enhancedBatches);
      
    } catch (error) {
      console.error('Error fetching available batches:', error);
      setAvailableBatches([]);
    }
  }, []);

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

  // Enhanced fetch records with better error handling
  const fetchRecords = useCallback(async (abortController) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Only append non-empty values
      if (filters.page) params.append('page', filters.page + 1);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.activity) params.append('activity', filters.activity);
      if (filters.product) params.append('product', filters.product);
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('startDate', dayjs(filters.startDate).format('YYYY-MM-DD'));
      if (filters.endDate) params.append('endDate', dayjs(filters.endDate).format('YYYY-MM-DD'));

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
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching stock summary:', error);
      return [];
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

  // Initial data fetch
  useEffect(() => {
    const abortController = new AbortController();
    
    fetchProducts();
    fetchCompanyManagement();
    
    return () => {
      abortController.abort();
    };
  }, [fetchProducts, fetchCompanyManagement]);

  // Effect for fetching records with debounce and cleanup
  useEffect(() => {
    const abortController = new AbortController();
    
    // Use a timeout to prevent too frequent fetches
    const timeoutId = setTimeout(() => {
      fetchRecords(abortController);
    }, 300);
    
    return () => {
      abortController.abort();
      clearTimeout(timeoutId);
    };
  }, [fetchRecords, debouncedSearch]);

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
      startDate: null,
      endDate: null,
      search: ''
    });
    showSnackbar('Filters reset', 'info');
  }, [showSnackbar]);

  // ✅ FIXED: Enhanced showModal function
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
        Activity: record.Activity || ACTIVITY_TYPES.PRODUCTION,
        Quantity: record.Quantity || '',
        Batch: record.Batch || '',
        Note: record.Note || ''
      });
      
      const stockCheckActivities = [ACTIVITY_TYPES.TRANSFER, ACTIVITY_TYPES.ISSUE_REWORK];
      if (stockCheckActivities.includes(record.Activity) && record.Batch) {
        fetchBatchStock(record.Batch);
      }
      
      if (productName && FETCH_BATCHES_ACTIVITIES.includes(record.Activity)) {
        fetchAvailableBatches(productName, record.Activity);
      }
    } else {
      setFormData({
        Activity: ACTIVITY_TYPES.PRODUCTION,
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
      Activity: ACTIVITY_TYPES.PRODUCTION,
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
    showSnackbar('Data refreshed successfully', 'info');
  }, [fetchRecords, fetchProducts, showSnackbar]);

  // Enhanced delete with proper refresh and notification
  const handleDelete = useCallback(async (id) => {
    try {
      await axios.delete(`${API_ENDPOINTS.BASE}/${id}`);
      
      await fetchRecords();
      fetchProducts();
      
      showSnackbar('Record deleted successfully!', 'success');
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Delete failed';
      showSnackbar(errorMessage, 'error');
    }
  }, [fetchRecords, fetchProducts, showSnackbar]);

  // Handle form input changes
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [formErrors]);

  // ✅ FIXED: Enhanced product selection change handler
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
      if (!editingRecord) {
        const selectedProduct = activeProducts.find(p => p.displayName === productName);
        
        if (selectedProduct) {
          handleInputChange('ProductCode', selectedProduct.code);
          handleInputChange('Unit', selectedProduct.unit || 'PCS');

          if (formData.Activity === ACTIVITY_TYPES.PRODUCTION && formData.Date) {
            const batchNumber = generateBatchNumber(productName, formData.Date);
            if (batchNumber) {
              setFormData(prev => ({ ...prev, Batch: batchNumber }));
            }
          } else if (MANUAL_BATCH_ACTIVITIES.includes(formData.Activity)) {
            setFormData(prev => ({ ...prev, Batch: `${selectedProduct.code}-` }));
          }

          if (FETCH_BATCHES_ACTIVITIES.includes(formData.Activity)) {
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
      } else {
        if (FETCH_BATCHES_ACTIVITIES.includes(formData.Activity)) {
          await fetchAvailableBatches(productName, formData.Activity);
        }
      }
    } catch (error) {
      console.error('Error handling product change:', error);
      showSnackbar('Error loading product details', 'error');
    }
  }, [activeProducts, editingRecord, fetchAvailableBatches, formData.Activity, formData.Date, generateBatchNumber, handleInputChange, showSnackbar]);

  // ✅ FIXED: Handle date change with immediate batch generation
  const handleDateChange = useCallback((date) => {
    handleInputChange('Date', date);
    
    if (formData.Activity === ACTIVITY_TYPES.PRODUCTION && formData.Product && date) {
      const batchNumber = generateBatchNumber(formData.Product, date);
      if (batchNumber) {
        setFormData(prev => ({ ...prev, Batch: batchNumber }));
      }
    }
  }, [formData.Activity, formData.Product, generateBatchNumber, handleInputChange]);

  // ✅ ENHANCED: Handle activity change with proper batch reset and Expire Date handling
  const handleActivityChange = useCallback((activity) => {
    handleInputChange('Activity', activity);
    
    const manualBatchActivities = [ACTIVITY_TYPES.RECEIVE_REWORK, ACTIVITY_TYPES.WASTE];
    const stockCheckActivities = [ACTIVITY_TYPES.TRANSFER, ACTIVITY_TYPES.ISSUE_REWORK];
    const expireDateActivities = [ACTIVITY_TYPES.PRODUCTION, ACTIVITY_TYPES.TRANSFER, ACTIVITY_TYPES.RECEIVE_REWORK];
    
    if (activity === ACTIVITY_TYPES.PRODUCTION) {
      if (formData.Product && formData.Date) {
        const batchNumber = generateBatchNumber(formData.Product, formData.Date);
        setFormData(prev => ({ 
          ...prev,
          Batch: batchNumber,
          ExpireDate: null
        }));
      } else {
        setFormData(prev => ({ 
          ...prev,
          Batch: '',
          ExpireDate: null
        }));
      }
      setAvailableBatches([]);
    } else if (manualBatchActivities.includes(activity) || stockCheckActivities.includes(activity)) {
      setFormData(prev => ({ 
        ...prev,
        Batch: '',
        ExpireDate: expireDateActivities.includes(activity) ? null : undefined
      }));
      
      if (formData.Product) {
        fetchAvailableBatches(formData.Product, activity);
      }
    }
    
    setBatchStock(0);
    setFormErrors({});
  }, [fetchAvailableBatches, formData.Date, formData.Product, generateBatchNumber, handleInputChange]);

  const handleBatchChange = useCallback((batch) => {
    handleInputChange('Batch', batch);
    if (batch) {
      fetchBatchStock(batch);
    } else {
      setBatchStock(0);
    }
  }, [fetchBatchStock, handleInputChange]);

  // ✅ FIXED: Enhanced form submission with better update handling
  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitting(false);
      showSnackbar('Please fix validation errors before submitting', 'error');
      return;
    }
    
    try {
      if (!editingRecord) {
        const product = activeProducts.find(p => p.displayName === formData.Product);
        if (!product) {
          showSnackbar('Selected product not found or is not active', 'error');
          setSubmitting(false);
          return;
        }
      }

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
        Activity: ACTIVITY_TYPES.PRODUCTION,
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
      
      await Promise.all([
        fetchRecords(),
        fetchProducts()
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
  }, [activeProducts, editingRecord, fetchRecords, fetchProducts, formData, showSnackbar, validateForm]);

  // Enhanced statistics calculation
  const statistics = useMemo(() => {
    const positiveActivities = ['Production', 'Receive [Rework]'];
    const negativeActivities = ['Transfer', 'Issue [Rework]', 'Waste'];
    
    const positiveTransactions = records.filter(r => positiveActivities.includes(r.Activity));
    const negativeTransactions = records.filter(r => negativeActivities.includes(r.Activity));
    
    return {
      totalProduction: positiveTransactions.reduce((sum, r) => sum + (r.Quantity || 0), 0),
      totalTransfer: negativeTransactions.reduce((sum, r) => sum + (r.Quantity || 0), 0),
      netQuantity: positiveTransactions.reduce((sum, r) => sum + (r.Quantity || 0), 0) - 
                   negativeTransactions.reduce((sum, r) => sum + (r.Quantity || 0), 0)
    };
  }, [records]);

  // Simplified date display for table cells
  const DateDisplayCell = ({ date }) => {
    return (
      <Typography
        variant="body2"
        sx={{
          fontSize: '0.8125rem',
          lineHeight: 1.2,
          whiteSpace: 'nowrap'
        }}
      >
        {dayjs(date).format('DD/MM/YYYY')}
      </Typography>
    );
  };

  // Activity chip color
  const getActivityColor = (activity) => {
    switch(activity) {
      case 'Production': return 'success';
      case 'Transfer': return 'primary';
      case 'Receive [Rework]': return 'info';
      case 'Issue [Rework]': return 'warning';
      case 'Waste': return 'error';
      default: return 'default';
    }
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.activity !== '' ||
      filters.product !== '' ||
      filters.search !== '' ||
      filters.startDate !== null ||
      filters.endDate !== null
    );
  }, [filters]);

  // Handle row click to show details/edit
  const handleRowClick = (record) => {
    showModal(record);
  };

  // Handle export
  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(filters.activity && { activity: filters.activity }),
        ...(filters.product && { product: filters.product }),
        ...(filters.search && { search: filters.search }),
        ...(filters.startDate && { startDate: dayjs(filters.startDate).format('YYYY-MM-DD') }),
        ...(filters.endDate && { endDate: dayjs(filters.endDate).format('YYYY-MM-DD') })
      });

      const response = await fetch(`${API_ENDPOINTS.BASE}/export/data?${params}`);
      const data = await response.json();

      const headers = Object.keys(data[0] || {}).join(',');
      const csvData = data.map(row => 
        Object.values(row).map(value => 
          `"${value}"`
        ).join(',')
      ).join('\n');

      const csv = `${headers}\n${csvData}`;
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `production-records-${dayjs().format('YYYY-MM-DD')}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      showSnackbar('Data exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      showSnackbar('Error exporting data', 'error');
    }
  };

  // Handle print
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const tableHtml = tableRef.current?.innerHTML || '';
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Production Management Report</title>
          <style>
              body { 
                  font-family: "Times New Roman", Times, serif; 
                  margin: 20px; 
                  font-size: 12px; 
                  line-height: 1.0;
              }
              .header { 
                  text-align: center; 
                  margin-bottom: 15px; 
                  border-bottom: 2px solid #333; 
                  padding-bottom: 8px; 
                  line-height: 1.0;
              }
              .company-name { 
                  font-family: "Times New Roman", Times, serif;
                  font-size: 20px; 
                  font-weight: bold; 
                  margin-bottom: 3px; 
                  line-height: 1.0;
              }
              .company-details { 
                  font-family: "Times New Roman", Times, serif;
                  font-size: 11px; 
                  margin-bottom: 2px; 
                  color: #666; 
                  line-height: 1.0;
              }
              .report-title { 
                  font-family: "Times New Roman", Times, serif;
                  font-size: 16px; 
                  margin-bottom: 5px; 
                  font-weight: bold; 
                  line-height: 1.0;
              }
              .print-info { 
                  display: flex; 
                  justify-content: space-between; 
                  margin-bottom: 10px; 
                  font-size: 11px; 
                  font-family: "Times New Roman", Times, serif;
                  line-height: 1.0;
              }
              table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin-bottom: 12px; 
                  font-size: 12px; 
                  font-family: "Times New Roman", Times, serif;
                  line-height: 1.0;
              }
              th, td { 
                  border: 1px solid #ddd; 
                  padding: 4px; 
                  text-align: left; 
                  font-size: 12px; 
                  font-family: "Times New Roman", Times, serif;
                  line-height: 1.0;
              }
              th { 
                  background-color: #f5f5f5; 
                  font-weight: bold; 
                  font-size: 12px; 
                  font-family: "Times New Roman", Times, serif;
                  line-height: 1.0;
              }
              .summary { 
                  margin-top: 12px; 
                  padding: 10px; 
                  background-color: #f9f9f9; 
                  border-radius: 4px; 
                  border: 1px solid #ddd; 
                  font-size: 12px; 
                  font-family: "Times New Roman", Times, serif;
                  line-height: 1.0;
              }
              @media print {
                  body { 
                      margin: 0.4in; 
                      font-size: 12px; 
                      font-family: "Times New Roman", Times, serif;
                      line-height: 1.0;
                  }
                  table { 
                      font-size: 12px; 
                      font-family: "Times New Roman", Times, serif;
                      line-height: 1.0;
                  }
                  th, td { 
                      font-size: 12px; 
                      padding: 3px; 
                      font-family: "Times New Roman", Times, serif;
                      line-height: 1.0;
                  }
                  .header, .summary, .print-info {
                      font-family: "Times New Roman", Times, serif;
                      line-height: 1.0;
                  }
                  .header {
                      margin-bottom: 12px;
                  }
                  .summary {
                      margin-top: 10px;
                      padding: 8px;
                  }
              }
          </style>
      </head>
      <body>
          <div class="header">
              <div class="company-name">${companyManagement?.companyName || 'Company Name Not Set'}</div>
              ${companyManagement?.fullAddress ? `<div class="company-details">${companyManagement.fullAddress}</div>` : ''}
              ${companyManagement?.phone ? `<div class="company-details">Phone: ${companyManagement.phone}</div>` : ''}
              ${companyManagement?.email ? `<div class="company-details">Email: ${companyManagement.email}</div>` : ''}
              ${companyManagement?.website ? `<div class="company-details">Website: ${companyManagement.website}</div>` : ''}
              <div class="report-title">Production Management Report</div>
          </div>
          
          <div class="print-info">
              <div><strong>Printed on:</strong> ${dayjs().format('DD/MM/YYYY')} ${new Date().toLocaleTimeString()}</div>
          </div>

          <div class="table-container">
              ${tableHtml}
          </div>

          <div class="summary">
              <strong>Summary:</strong><br/>
              <strong>Total Production:</strong> ${statistics.totalProduction.toFixed(3)}<br/>
              <strong>Total Transfer:</strong> ${statistics.totalTransfer.toFixed(3)}<br/>
              <strong>Net Quantity:</strong> ${statistics.netQuantity.toFixed(3)}<br/>
              <strong>Active Products:</strong> ${activeProducts.length}
          </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Check if current activity requires manual batch entry
  const requiresManualBatch = MANUAL_BATCH_ACTIVITIES.includes(formData.Activity);
  const requiresExpireDate = [ACTIVITY_TYPES.PRODUCTION, ACTIVITY_TYPES.TRANSFER, ACTIVITY_TYPES.RECEIVE_REWORK].includes(formData.Activity);
  const requiresStockCheck = [ACTIVITY_TYPES.TRANSFER, ACTIVITY_TYPES.ISSUE_REWORK].includes(formData.Activity);
  const isReceiveRework = formData.Activity === ACTIVITY_TYPES.RECEIVE_REWORK;
  const isTransfer = formData.Activity === ACTIVITY_TYPES.TRANSFER;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 2 }}>
        {/* Header with Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Production Management
            </Typography>
            {companyManagement?.companyName && (
              <Typography variant="body2" color="textSecondary">
                {companyManagement.companyName}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} size="small">
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print">
              <IconButton onClick={handlePrint} size="small">
                <PrintIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export">
              <IconButton onClick={handleExport} size="small">
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
              Add
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
                    Total Production
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
                    Total Transfer
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
                <TextField
                  select
                  fullWidth
                  label="Activity"
                  value={filters.activity}
                  onChange={(e) => handleFilterChange('activity', e.target.value)}
                  size="small"
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
                  <MenuItem value="">All Activities</MenuItem>
                  <MenuItem value={ACTIVITY_TYPES.PRODUCTION}>Production</MenuItem>
                  <MenuItem value={ACTIVITY_TYPES.TRANSFER}>Transfer</MenuItem>
                  <MenuItem value={ACTIVITY_TYPES.RECEIVE_REWORK}>Receive [Rework]</MenuItem>
                  <MenuItem value={ACTIVITY_TYPES.ISSUE_REWORK}>Issue [Rework]</MenuItem>
                  <MenuItem value={ACTIVITY_TYPES.WASTE}>Waste</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <TextField
                  select
                  fullWidth
                  label="Product"
                  value={filters.product}
                  onChange={(e) => handleFilterChange('product', e.target.value)}
                  size="small"
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
                  <MenuItem value="">All Products</MenuItem>
                  {activeProducts.map(product => (
                    <MenuItem key={product._id} value={product.displayName}>
                      {product.displayName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <TextField
                  fullWidth
                  label="Search"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Document No., Note, Batch..."
                  size="small"
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
                />
              </Grid>
              <Grid item xs={12} md={2.4}>
                <CustomDatePicker
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(date) => handleFilterChange('startDate', date)}
                />
              </Grid>
              <Grid item xs={12} md={2.4}>
                <CustomDatePicker
                  label="End Date"
                  value={filters.endDate}
                  onChange={(date) => handleFilterChange('endDate', date)}
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
                  onDelete={() => handleFilterChange('startDate', null)}
                />
              )}
              {filters.endDate && (
                <Chip
                  label={`To: ${dayjs(filters.endDate).format('DD/MM/YYYY')}`}
                  size="small"
                  onDelete={() => handleFilterChange('endDate', null)}
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

        {/* Data Table */}
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                      <Typography color="textSecondary">
                        Loading...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                      <Typography color="textSecondary">
                        No records found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow 
                      key={record._id} 
                      hover
                      sx={{ 
                        height: '36px',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                      onClick={() => handleRowClick(record)}
                    >
                      <TableCell sx={{ 
                        padding: '4px 8px',
                        whiteSpace: 'nowrap',
                        minWidth: '80px',
                        width: '80px'
                      }}>
                        <DateDisplayCell date={record.Date} />
                      </TableCell>
                      <TableCell sx={{ 
                        padding: '4px 8px',
                        whiteSpace: 'nowrap'
                      }}>
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
                      </TableCell>
                      <TableCell sx={{ 
                        padding: '4px 8px',
                        whiteSpace: 'nowrap',
                        fontSize: '0.8125rem'
                      }}>{record.Product ? record.Product.replace(/\[.*?\]/g, '').trim() : 'N/A'}</TableCell>
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
                        <Typography 
                          color={['Production', 'Receive [Rework]'].includes(record.Activity) ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                          variant="body2"
                          sx={{ fontSize: '0.8125rem' }}
                        >
                          {['Production', 'Receive [Rework]'].includes(record.Activity) ? '+' : '-'}{record.Quantity || 0}
                        </Typography>
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
                        {record.Note ? 
                          (record.Note.length > 20 ? `${record.Note.substring(0, 20)}...` : record.Note) : 
                          'N/A'}
                      </TableCell>
                      <TableCell sx={{ 
                        padding: '4px 8px',
                        whiteSpace: 'nowrap'
                      }} onClick={(e) => e.stopPropagation()}>
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
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Scroll indicator - shows when there are many records */}
          {records.length > 10 && (
            <Box sx={{ 
              position: 'absolute', 
              bottom: 8, 
              right: 8, 
              display: 'flex', 
              gap: 0.5,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: 1,
              p: 0.5
            }}>
              <Typography variant="caption" color="textSecondary">
                Scroll to see more records
              </Typography>
              <KeyboardArrowDownIcon fontSize="small" color="action" />
            </Box>
          )}
        </Box>

        {/* Record Count and Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Showing {records.length} record{records.length !== 1 ? 's' : ''}
            {hasActiveFilters && ' (filtered)'}
          </Typography>
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
                <CustomDatePicker
                  label="Date"
                  value={formData.Date}
                  onChange={handleDateChange}
                  maxDate={dayjs()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!formErrors.Date,
                      helperText: formErrors.Date || 'Cannot be a future date',
                      size: 'small',
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
                    size="small"
                  >
                    <MenuItem value={ACTIVITY_TYPES.PRODUCTION}>Production</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.TRANSFER}>Transfer</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.RECEIVE_REWORK}>Receive [Rework]</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.ISSUE_REWORK}>Issue [Rework]</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.WASTE}>Waste</MenuItem>
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
                    size="small"
                  >
                    <MenuItem value="">Select Product</MenuItem>
                    {activeProducts.map(product => (
                      <MenuItem key={product._id} value={product.displayName}>
                        {product.displayName}
                      </MenuItem>
                    ))}
                  </Select>
                </EnhancedFormField>
              </Grid>
              <Grid item xs={12} sm={6}>
                {formData.Activity === ACTIVITY_TYPES.PRODUCTION ? (
                  <TextField
                    fullWidth
                    label="Batch"
                    value={formData.Batch}
                    InputProps={{
                      readOnly: true,
                    }}
                    helperText="Auto-generated from Product Code and Date (DDMMYY format)"
                    required
                    error={!!formErrors.Batch}
                    size="small"
                  />
                ) : requiresManualBatch || isReceiveRework || isTransfer ? (
                  <EnhancedFormField 
                    label="Batch" 
                    required 
                    error={formErrors.Batch}
                    helperText={
                      isReceiveRework 
                        ? "Available batches from IssueProd [Rework] (Issued - Received > 0)" 
                        : isTransfer
                        ? "Select batch to transfer from available stock"
                        : `Enter batch identifier after "${formData.ProductCode}-" prefix`
                    }
                  >
                    <Select
                      value={formData.Batch}
                      onChange={(e) => handleBatchChange(e.target.value)}
                      label="Batch"
                      size="small"
                    >
                      <MenuItem value="">Select Batch</MenuItem>
                      {availableBatches.map(batch => (
                        <MenuItem key={batch._id} value={batch._id}>
                          <Box>
                            <Typography variant="body2">
                              {batch._id}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Available: {batch.totalStock.toFixed(3)}
                              {batch.totalIssued !== undefined && ` | Issued: ${batch.totalIssued.toFixed(3)}`}
                              {batch.totalReceived !== undefined && ` | Received: ${batch.totalReceived.toFixed(3)}`}
                            </Typography>
                            {batch.expireDate && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Expires: {dayjs(batch.expireDate).format('DD/MM/YYYY')}
                              </Typography>
                            )}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </EnhancedFormField>
                ) : (
                  <EnhancedFormField 
                    label="Batch" 
                    required 
                    error={formErrors.Batch}
                  >
                    <Select
                      value={formData.Batch}
                      onChange={(e) => handleBatchChange(e.target.value)}
                      label="Batch"
                      size="small"
                    >
                      <MenuItem value="">Select Batch</MenuItem>
                      {availableBatches.map(batch => (
                        <MenuItem key={batch._id} value={batch._id}>
                          {batch._id} (Available: {batch.totalStock.toFixed(3)})
                          {batch.sourceActivity && ` - Source: ${batch.sourceActivity}`}
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
                />
              </Grid>

              {requiresExpireDate && (
                <Grid item xs={12} sm={6}>
                  <CustomDatePicker
                    label="Expire Date"
                    value={formData.ExpireDate}
                    onChange={(date) => handleInputChange('ExpireDate', date)}
                    minDate={formData.Date}
                    readOnly={isTransfer || isReceiveRework}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!formErrors.ExpireDate,
                        helperText: formErrors.ExpireDate || 
                          (isTransfer || isReceiveRework 
                            ? 'Auto-populated from selected batch' 
                            : 'Must be on or after transaction date'),
                        size: 'small',
                      }
                    }}
                  />
                </Grid>
              )}

              {requiresStockCheck && batchStock > 0 && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ fontSize: '0.875rem', py: 0.5 }}>
                    Available Stock: {batchStock.toFixed(3)} - You are issuing {formData.Quantity || 0} from available stock
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

export default ProductionManagement;