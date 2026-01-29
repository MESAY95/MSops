import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Snackbar,
  Alert,
  Grid,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  TablePagination,
  LinearProgress,
  FormHelperText,
  Collapse
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  Refresh,
  Print,
  GetApp,
  Publish,
  Schedule,
  Search,
  FilterList,
  Clear,
  ArrowBack,
  Inventory
} from '@mui/icons-material';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

// Constants for better maintainability
const CONSTANTS = {
  DEBOUNCE_DELAY: 500,
  PAGE_SIZES: [50, 100, 500, 1000],
  DEFAULT_PAGE_SIZE: 1000,
  NOTIFICATION_DURATION: 5000,
  MAX_NOTE_LENGTH: 100,
  SCROLLABLE_TABLE_ROWS: 5,
  ROW_HEIGHT: 40,
  TABLE_HEADER_HEIGHT: 45
};

// API ENDPOINTS
const API_ENDPOINTS = {
  BASE: 'http://localhost:5000/api/inventoryplans',
  PRODUCTS: 'http://localhost:5000/api/inventoryplans/products',
  MATERIALS: 'http://localhost:5000/api/inventoryplans/materials',
  FISCAL_YEARS: 'http://localhost:5000/api/inventoryplans/fiscal-years'
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

const InventoryPlan = () => {
  const navigate = useNavigate();
  const tableRef = useRef();

  // State management
  const [inventoryPlans, setInventoryPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [balanceTypes] = useState(['Opening Balance', 'Closing Balance']);
  const [open, setOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loadingItems, setLoadingItems] = useState(false);
  const [currentItems, setCurrentItems] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [companyManagement, setCompanyManagement] = useState({});
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Filters state
  const [filters, setFilters] = useState({
    page: 0,
    limit: CONSTANTS.DEFAULT_PAGE_SIZE,
    category: '',
    product: '',
    material: '',
    fiscalYear: '',
    month: '',
    balanceType: '',
    search: ''
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: CONSTANTS.DEFAULT_PAGE_SIZE,
    total: 0
  });

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    item: '',
    itemId: '',
    unit: '',
    fiscalYear: new Date().getFullYear(),
    month: '',
    balanceType: '',
    quantity: 0,
    note: ''
  });

  const categoryOptions = ['Product', 'Material'];
  const monthOptions = [
    'July', 'August', 'September', 'October', 'November', 'December',
    'January', 'February', 'March', 'April', 'May', 'June'
  ];

  // Use debounced search
  const debouncedSearch = useDebounce(filters.search, CONSTANTS.DEBOUNCE_DELAY);

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Generate fiscal year options
  const generateFiscalYears = useCallback(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = -2; i <= 3; i++) {
      years.push(currentYear + i);
    }
    return years;
  }, []);

  // Format fiscal year as "2024-2025"
  const formatFiscalYear = useCallback((year) => {
    if (!year) return '';
    return `${year}-${year + 1}`;
  }, []);

  // Format currency as Ethiopian Birr
  const formatCurrency = useCallback((amount) => {
    return `ETB ${amount?.toLocaleString()}`;
  }, []);

  // Fetch inventory plans from API with sorting
  const fetchInventoryPlans = useCallback(async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.BASE);
      const sortedPlans = response.data.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      setInventoryPlans(sortedPlans);
      setPagination(prev => ({ ...prev, total: sortedPlans.length }));
    } catch (error) {
      console.error('Error fetching inventory plans:', error);
      showSnackbar('Error fetching inventory plans', 'error');
    }
  }, [showSnackbar]);

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    try {
      setLoadingItems(true);
      const response = await axios.get(API_ENDPOINTS.PRODUCTS);
      
      let productsData = [];
      
      if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data && Array.isArray(response.data.products)) {
        productsData = response.data.products;
      } else if (response.data && response.data.data) {
        productsData = Array.isArray(response.data.data) ? response.data.data : [];
      }
      
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      showSnackbar('Error fetching products', 'error');
      setProducts([]);
    } finally {
      setLoadingItems(false);
    }
  }, [showSnackbar]);

  // Fetch materials from API
  const fetchMaterials = useCallback(async () => {
    try {
      setLoadingItems(true);
      const response = await axios.get(API_ENDPOINTS.MATERIALS);
      
      let materialsData = [];
      
      if (Array.isArray(response.data)) {
        materialsData = response.data;
      } else if (response.data && Array.isArray(response.data.materials)) {
        materialsData = response.data.materials;
      } else if (response.data && response.data.data) {
        materialsData = Array.isArray(response.data.data) ? response.data.data : [];
      }
      
      setMaterials(materialsData);
    } catch (error) {
      console.error('Error fetching materials:', error);
      showSnackbar('Error fetching materials', 'error');
      setMaterials([]);
    } finally {
      setLoadingItems(false);
    }
  }, [showSnackbar]);

  // Fetch fiscal years from API
  const fetchFiscalYears = useCallback(async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.FISCAL_YEARS);
      setFiscalYears(response.data);
    } catch (error) {
      console.error('Error fetching fiscal years:', error);
      setFiscalYears(generateFiscalYears());
    }
  }, [generateFiscalYears]);

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

  // Auto refresh effect
  useEffect(() => {
    let intervalId;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchInventoryPlans();
        console.log('Auto-refreshing inventory plans...');
      }, refreshInterval * 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, refreshInterval, fetchInventoryPlans]);

  // Effect to update current items when category changes
  useEffect(() => {
    if (formData.category === 'Product') {
      setCurrentItems(products);
    } else if (formData.category === 'Material') {
      setCurrentItems(materials);
    } else {
      setCurrentItems([]);
    }
  }, [formData.category, products, materials]);

  // Initial data fetch
  useEffect(() => {
    fetchInventoryPlans();
    fetchFiscalYears();
    fetchProducts();
    fetchMaterials();
    fetchCompanyManagement();
  }, [fetchInventoryPlans, fetchFiscalYears, fetchProducts, fetchMaterials, fetchCompanyManagement]);

  // Effect for fetching with debounce
  useEffect(() => {
    const filteredPlans = inventoryPlans.filter(plan => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          (plan.item && plan.item.toLowerCase().includes(searchLower)) ||
          (plan.note && plan.note.toLowerCase().includes(searchLower)) ||
          (plan.category && plan.category.toLowerCase().includes(searchLower))
        );
      }
      if (filters.category && plan.category !== filters.category) return false;
      if (filters.fiscalYear && plan.fiscalYear !== parseInt(filters.fiscalYear)) return false;
      if (filters.month && plan.month !== filters.month) return false;
      if (filters.balanceType && plan.balanceType !== filters.balanceType) return false;
      return true;
    });

    setPagination(prev => ({ ...prev, total: filteredPlans.length }));
  }, [filters, inventoryPlans, debouncedSearch]);

  // Auto-scroll to bottom when new records are added
  useEffect(() => {
    const tableContainer = tableRef.current;
    if (tableContainer && inventoryPlans.length > 0) {
      tableContainer.scrollTop = tableContainer.scrollHeight;
    }
  }, [inventoryPlans.length]);

  // Form validation
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.itemId) errors.itemId = 'Item is required';
    if (!formData.fiscalYear) errors.fiscalYear = 'Fiscal year is required';
    if (!formData.month) errors.month = 'Month is required';
    if (!formData.balanceType) errors.balanceType = 'Balance type is required';
    if (!formData.quantity || formData.quantity <= 0) errors.quantity = 'Valid quantity is required';
    
    return errors;
  }, [formData]);

  const handleOpen = useCallback((plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      let itemId = '';
      let itemUnit = plan.unit || '';
      
      if (plan.category === 'Product') {
        const product = products.find(p => p.name === plan.item);
        itemId = product?._id || '';
        itemUnit = product?.unit || itemUnit;
      } else if (plan.category === 'Material') {
        const material = materials.find(m => m.name === plan.item);
        itemId = material?._id || '';
        itemUnit = material?.unit || itemUnit;
      }
      
      setFormData({
        ...plan,
        itemId: itemId,
        unit: itemUnit,
        quantity: plan.quantity || 0
      });
    } else {
      setEditingPlan(null);
      setFormData({
        category: '',
        item: '',
        itemId: '',
        unit: '',
        fiscalYear: new Date().getFullYear(),
        month: '',
        balanceType: '',
        quantity: 0,
        note: ''
      });
    }
    setOpen(true);
    setFormErrors({});
  }, [products, materials]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setEditingPlan(null);
    setFormData({
      category: '',
      item: '',
      itemId: '',
      unit: '',
      fiscalYear: new Date().getFullYear(),
      month: '',
      balanceType: '',
      quantity: 0,
      note: ''
    });
    setFormErrors({});
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    if (name === 'category') {
      setFormData({ 
        ...formData, 
        [name]: value,
        item: '',
        itemId: '',
        unit: ''
      });
    } else if (name === 'itemId') {
      const selectedItem = currentItems.find(item => item._id === value);
      setFormData({ 
        ...formData, 
        itemId: value,
        item: selectedItem ? getItemDisplayName(selectedItem) : '',
        unit: selectedItem ? selectedItem.unit : ''
      });
    } else if (name === 'quantity') {
      setFormData({ 
        ...formData, 
        [name]: value === '' ? 0 : Number(value) 
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Clear field-specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [formData, currentItems, formErrors]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [formErrors]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
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
      const selectedItem = currentItems.find(item => item._id === formData.itemId);
      if (!selectedItem) {
        showSnackbar('Please select a valid item', 'error');
        setSubmitting(false);
        return;
      }

      const itemName = getItemDisplayName(selectedItem);
      const itemUnit = selectedItem.unit || formData.unit;

      const submitData = {
        category: formData.category,
        item: itemName,
        unit: itemUnit,
        fiscalYear: Number(formData.fiscalYear),
        month: formData.month,
        balanceType: formData.balanceType,
        quantity: Number(formData.quantity),
        note: formData.note
      };

      if (editingPlan) {
        await axios.put(`${API_ENDPOINTS.BASE}/${editingPlan._id}`, submitData);
        showSnackbar('Inventory plan updated successfully', 'success');
      } else {
        await axios.post(API_ENDPOINTS.BASE, submitData);
        showSnackbar('Inventory plan created successfully', 'success');
      }
      
      fetchInventoryPlans();
      handleClose();
    } catch (error) {
      console.error('Error saving inventory plan:', error);
      const errorMessage = error.response?.data?.message || 'Error saving inventory plan';
      showSnackbar(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [formData, currentItems, editingPlan, fetchInventoryPlans, handleClose, showSnackbar, validateForm]);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this inventory plan?')) {
      try {
        await axios.delete(`${API_ENDPOINTS.BASE}/${id}`);
        showSnackbar('Inventory plan deleted successfully', 'success');
        fetchInventoryPlans();
      } catch (error) {
        console.error('Error deleting inventory plan:', error);
        showSnackbar('Error deleting inventory plan', 'error');
      }
    }
  }, [fetchInventoryPlans, showSnackbar]);

  // Get available fiscal years
  const getAvailableFiscalYears = useCallback(() => {
    const generatedYears = generateFiscalYears();
    const allYears = [...new Set([...generatedYears, ...fiscalYears])];
    return allYears.sort((a, b) => b - a);
  }, [fiscalYears, generateFiscalYears]);

  // Get display name for item
  const getItemDisplayName = useCallback((item) => {
    return item.name || item.productName || item.materialName || 'Unnamed Item';
  }, []);

  // Auto Refresh Functions
  const handleAutoRefreshToggle = useCallback((event) => {
    setAutoRefresh(event.target.checked);
    if (event.target.checked) {
      showSnackbar(`Auto-refresh enabled (${refreshInterval}s)`, 'info');
    } else {
      showSnackbar('Auto-refresh disabled', 'info');
    }
  }, [refreshInterval, showSnackbar]);

  const handleRefreshIntervalChange = useCallback((event) => {
    const interval = parseInt(event.target.value);
    setRefreshInterval(interval);
    if (autoRefresh) {
      showSnackbar(`Refresh interval updated to ${interval}s`, 'info');
    }
  }, [autoRefresh, showSnackbar]);

  const handleManualRefresh = useCallback(() => {
    fetchInventoryPlans();
    showSnackbar('Data refreshed manually', 'success');
  }, [fetchInventoryPlans, showSnackbar]);

  // Filter functions
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
      category: '',
      product: '',
      material: '',
      fiscalYear: '',
      month: '',
      balanceType: '',
      search: ''
    });
    showSnackbar('Filters reset', 'info');
  }, [showSnackbar]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.category !== '' ||
      filters.fiscalYear !== '' ||
      filters.month !== '' ||
      filters.balanceType !== '' ||
      filters.search !== ''
    );
  }, [filters]);

  // Pagination handlers
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

  // Print Function
  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Inventory Plans Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 12px; }
            th { background-color: #f5f5f5; }
            .header { text-align: center; margin-bottom: 20px; }
            .timestamp { color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Inventory Plans Report</h2>
            <p class="timestamp">Generated on: ${new Date().toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Item</th>
                <th>Unit</th>
                <th>Fiscal Year</th>
                <th>Month</th>
                <th>Balance Type</th>
                <th>Quantity</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              ${inventoryPlans.map(plan => `
                <tr>
                  <td>${plan.category}</td>
                  <td>${plan.item}</td>
                  <td>${plan.unit}</td>
                  <td>${formatFiscalYear(plan.fiscalYear)}</td>
                  <td>${plan.month}</td>
                  <td>${plan.balanceType}</td>
                  <td>${plan.quantity?.toLocaleString()}</td>
                  <td>${plan.note || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, [inventoryPlans, formatFiscalYear]);

  // Export Function
  const handleExport = useCallback(() => {
    try {
      const exportData = inventoryPlans.map(plan => ({
        Category: plan.category,
        Item: plan.item,
        Unit: plan.unit,
        'Fiscal Year': formatFiscalYear(plan.fiscalYear),
        Month: plan.month,
        'Balance Type': plan.balanceType,
        Quantity: plan.quantity,
        Note: plan.note || '',
        'Created At': new Date(plan.createdAt).toLocaleDateString(),
        'Updated At': new Date(plan.updatedAt).toLocaleDateString()
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory Plans');
      
      const fileName = `inventory-plans-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      showSnackbar('Data exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      showSnackbar('Error exporting data', 'error');
    }
  }, [inventoryPlans, formatFiscalYear, showSnackbar]);

  // Import Functions
  const handleImportOpen = useCallback(() => {
    setImportDialogOpen(true);
  }, []);

  const handleImportClose = useCallback(() => {
    setImportDialogOpen(false);
    setImportFile(null);
  }, []);

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      setImportFile(file);
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!importFile) {
      showSnackbar('Please select a file to import', 'error');
      return;
    }

    setImportLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const importData = jsonData.map((row, index) => {
            if (!row.Category || !row.Item || !row['Fiscal Year'] || !row.Month || !row['Balance Type'] || !row.Quantity) {
              throw new Error(`Row ${index + 2}: Missing required fields`);
            }

            return {
              category: row.Category,
              item: row.Item,
              unit: row.Unit || 'pcs',
              fiscalYear: parseInt(row['Fiscal Year']),
              month: row.Month,
              balanceType: row['Balance Type'],
              quantity: parseInt(row.Quantity),
              note: row.Note || ''
            };
          });

          const response = await axios.post(`${API_ENDPOINTS.BASE}/import`, {
            data: importData
          });

          showSnackbar(`Successfully imported ${response.data.imported} inventory plans`, 'success');
          
          fetchInventoryPlans();
          handleImportClose();
        } catch (error) {
          console.error('Error processing import file:', error);
          showSnackbar(`Import error: ${error.message}`, 'error');
        } finally {
          setImportLoading(false);
        }
      };
      reader.readAsArrayBuffer(importFile);
    } catch (error) {
      console.error('Error importing data:', error);
      showSnackbar('Error importing data', 'error');
      setImportLoading(false);
    }
  }, [importFile, fetchInventoryPlans, handleImportClose, showSnackbar]);

  // Back button handler
  const onBack = useCallback(() => {
    navigate('/Dashboard');
  }, [navigate]);

  // Memoized active products and materials
  const activeProducts = useMemo(() => {
    return products.filter(product => product.status === 'Active');
  }, [products]);

  const activeMaterials = useMemo(() => {
    return materials.filter(material => material.status === 'Active');
  }, [materials]);

  // Memoized table rows
  const tableRows = useMemo(() => {
    const filteredPlans = inventoryPlans.filter(plan => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          (plan.item && plan.item.toLowerCase().includes(searchLower)) ||
          (plan.note && plan.note.toLowerCase().includes(searchLower)) ||
          (plan.category && plan.category.toLowerCase().includes(searchLower))
        );
      }
      if (filters.category && plan.category !== filters.category) return false;
      if (filters.fiscalYear && plan.fiscalYear !== parseInt(filters.fiscalYear)) return false;
      if (filters.month && plan.month !== filters.month) return false;
      if (filters.balanceType && plan.balanceType !== filters.balanceType) return false;
      return true;
    });

    const startIndex = pagination.page * pagination.pageSize;
    const paginatedPlans = filteredPlans.slice(startIndex, startIndex + pagination.pageSize);

    if (paginatedPlans.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
            <Typography color="textSecondary">
              No inventory plans found. Click "Add Plan" to create one.
            </Typography>
          </TableCell>
        </TableRow>
      );
    }

    return paginatedPlans.map((plan, index) => (
      <TableRow 
        key={plan._id}
        hover
        selected={index === selectedRowIndex}
        onClick={() => setSelectedRowIndex(index)}
        sx={{ 
          '&:last-child td, &:last-child th': { border: 0 },
          backgroundColor: index === paginatedPlans.length - 1 ? 'action.hover' : 'inherit',
          transition: 'background-color 0.2s ease-in-out',
          height: CONSTANTS.ROW_HEIGHT
        }}
      >
        <TableCell sx={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
          <Chip 
            label={plan.category} 
            color={plan.category === 'Product' ? 'primary' : 'secondary'} 
            variant="outlined"
            size="small"
            sx={{ height: '24px', fontSize: '0.7rem' }}
          />
        </TableCell>
        <TableCell sx={{ padding: '6px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {plan.item}
        </TableCell>
        <TableCell sx={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{plan.unit}</TableCell>
        <TableCell sx={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{formatFiscalYear(plan.fiscalYear)}</TableCell>
        <TableCell sx={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{plan.month}</TableCell>
        <TableCell sx={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
          <Chip 
            label={plan.balanceType} 
            color={plan.balanceType === 'Opening Balance' ? 'primary' : 'secondary'} 
            variant="filled"
            size="small"
            sx={{ height: '24px', fontSize: '0.7rem' }}
          />
        </TableCell>
        <TableCell sx={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
          <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.75rem' }}>
            {plan.quantity?.toLocaleString()}
          </Typography>
        </TableCell>
        <TableCell sx={{ padding: '6px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {plan.note || '-'}
        </TableCell>
        <TableCell sx={{ padding: '4px 6px', whiteSpace: 'nowrap' }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Edit">
              <IconButton onClick={() => handleOpen(plan)} color="primary" size="small" sx={{ padding: '4px' }}>
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton onClick={() => handleDelete(plan._id)} color="error" size="small" sx={{ padding: '4px' }}>
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
    ));
  }, [inventoryPlans, filters, pagination, selectedRowIndex, formatFiscalYear, handleOpen, handleDelete]);

  // Statistics
  const statistics = useMemo(() => {
    const openingBalances = inventoryPlans.filter(plan => plan.balanceType === 'Opening Balance');
    const closingBalances = inventoryPlans.filter(plan => plan.balanceType === 'Closing Balance');
    
    return {
      totalOpening: openingBalances.reduce((sum, plan) => sum + (plan.quantity || 0), 0),
      totalClosing: closingBalances.reduce((sum, plan) => sum + (plan.quantity || 0), 0),
      totalPlans: inventoryPlans.length
    };
  }, [inventoryPlans]);

  return (
    <Box sx={{ p: 2 }}>
      {/* Header with Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Inventory Plans
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
              <ArrowBack fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Auto Refresh Settings">
            <IconButton onClick={() => setAutoRefresh(!autoRefresh)} color={autoRefresh ? "primary" : "default"} size="small">
              <Schedule fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleManualRefresh} color="primary" size="small">
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print Report">
            <IconButton onClick={handlePrint} color="primary" size="small">
              <Print fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Data">
            <IconButton onClick={handleExport} color="primary" size="small">
              <GetApp fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Import Data">
            <IconButton onClick={handleImportOpen} color="primary" size="small">
              <Publish fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Filter">
            <IconButton 
              onClick={() => setShowFilters(!showFilters)} 
              size="small"
              color={showFilters ? "primary" : "default"}
            >
              <FilterList fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()} size="small">
            Add Plan
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ minHeight: '80px' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Inventory color="primary" sx={{ mr: 1, fontSize: '1rem' }} />
                <Typography variant="body2" color="textSecondary">
                  Total Plans
                </Typography>
              </Box>
              <Typography variant="h6" color="primary">
                {statistics.totalPlans}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ minHeight: '80px' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Inventory color="success" sx={{ mr: 1, fontSize: '1rem' }} />
                <Typography variant="body2" color="textSecondary">
                  Opening Balance
                </Typography>
              </Box>
              <Typography variant="h6" color="success.main">
                {statistics.totalOpening.toFixed(0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ minHeight: '80px' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Inventory color="info" sx={{ mr: 1, fontSize: '1rem' }} />
                <Typography variant="body2" color="textSecondary">
                  Closing Balance
                </Typography>
              </Box>
              <Typography variant="h6" color="info.main">
                {statistics.totalClosing.toFixed(0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ minHeight: '80px' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Schedule color="warning" sx={{ mr: 1, fontSize: '1rem' }} />
                <Typography variant="body2" color="textSecondary">
                  Auto Refresh
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={handleAutoRefreshToggle}
                    color="primary"
                    size="small"
                  />
                }
                label={autoRefresh ? `Enabled (${refreshInterval}s)` : 'Disabled'}
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters - Collapsible */}
      {showFilters && (
        <Paper sx={{ p: 1.5, mb: 2 }}>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.875rem' }}>Category</InputLabel>
                <Select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  label="Category"
                  sx={{ fontSize: '0.875rem' }}
                  InputProps={{
                    endAdornment: filters.category && (
                      <IconButton
                        size="small"
                        onClick={() => handleFilterChange('category', '')}
                        sx={{ mr: -1 }}
                      >
                        <Clear fontSize="small" />
                      </IconButton>
                    )
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.875rem' }}>All Categories</MenuItem>
                  <MenuItem value="Product" sx={{ fontSize: '0.875rem' }}>Product</MenuItem>
                  <MenuItem value="Material" sx={{ fontSize: '0.875rem' }}>Material</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.875rem' }}>Fiscal Year</InputLabel>
                <Select
                  value={filters.fiscalYear}
                  onChange={(e) => handleFilterChange('fiscalYear', e.target.value)}
                  label="Fiscal Year"
                  sx={{ fontSize: '0.875rem' }}
                  InputProps={{
                    endAdornment: filters.fiscalYear && (
                      <IconButton
                        size="small"
                        onClick={() => handleFilterChange('fiscalYear', '')}
                        sx={{ mr: -1 }}
                      >
                        <Clear fontSize="small" />
                      </IconButton>
                    )
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.875rem' }}>All Fiscal Years</MenuItem>
                  {getAvailableFiscalYears().map(year => (
                    <MenuItem key={year} value={year} sx={{ fontSize: '0.875rem' }}>
                      {formatFiscalYear(year)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.875rem' }}>Month</InputLabel>
                <Select
                  value={filters.month}
                  onChange={(e) => handleFilterChange('month', e.target.value)}
                  label="Month"
                  sx={{ fontSize: '0.875rem' }}
                  InputProps={{
                    endAdornment: filters.month && (
                      <IconButton
                        size="small"
                        onClick={() => handleFilterChange('month', '')}
                        sx={{ mr: -1 }}
                      >
                        <Clear fontSize="small" />
                      </IconButton>
                    )
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.875rem' }}>All Months</MenuItem>
                  {monthOptions.map(month => (
                    <MenuItem key={month} value={month} sx={{ fontSize: '0.875rem' }}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.875rem' }}>Balance Type</InputLabel>
                <Select
                  value={filters.balanceType}
                  onChange={(e) => handleFilterChange('balanceType', e.target.value)}
                  label="Balance Type"
                  sx={{ fontSize: '0.875rem' }}
                  InputProps={{
                    endAdornment: filters.balanceType && (
                      <IconButton
                        size="small"
                        onClick={() => handleFilterChange('balanceType', '')}
                        sx={{ mr: -1 }}
                      >
                        <Clear fontSize="small" />
                      </IconButton>
                    )
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.875rem' }}>All Types</MenuItem>
                  {balanceTypes.map(type => (
                    <MenuItem key={type} value={type} sx={{ fontSize: '0.875rem' }}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search by item, note..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: filters.search && (
                    <IconButton
                      size="small"
                      onClick={() => handleFilterChange('search', '')}
                      sx={{ mr: -1 }}
                    >
                      <Clear fontSize="small" />
                    </IconButton>
                  )
                }}
                sx={{ 
                  '& .MuiInputBase-input': { fontSize: '0.875rem' },
                  '& .MuiInputLabel-root': { fontSize: '0.875rem' }
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
                    startIcon={<Clear />}
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
            <FilterList color="primary" fontSize="small" />
            <Typography variant="body2" color="textSecondary">
              Active Filters:
            </Typography>
            {filters.category && (
              <Chip
                label={`Category: ${filters.category}`}
                size="small"
                onDelete={() => handleFilterChange('category', '')}
              />
            )}
            {filters.fiscalYear && (
              <Chip
                label={`Fiscal Year: ${formatFiscalYear(parseInt(filters.fiscalYear))}`}
                size="small"
                onDelete={() => handleFilterChange('fiscalYear', '')}
              />
            )}
            {filters.month && (
              <Chip
                label={`Month: ${filters.month}`}
                size="small"
                onDelete={() => handleFilterChange('month', '')}
              />
            )}
            {filters.balanceType && (
              <Chip
                label={`Balance Type: ${filters.balanceType}`}
                size="small"
                onDelete={() => handleFilterChange('balanceType', '')}
              />
            )}
            {filters.search && (
              <Chip
                label={`Search: ${filters.search}`}
                size="small"
                onDelete={() => handleFilterChange('search', '')}
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
                <Clear fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>
      )}

      {/* Data Table */}
      <Box sx={{ position: 'relative', mb: 2 }}>
        <TableContainer 
          component={Paper} 
          ref={tableRef}
          sx={{ 
            maxHeight: CONSTANTS.SCROLLABLE_TABLE_ROWS * CONSTANTS.ROW_HEIGHT + CONSTANTS.TABLE_HEADER_HEIGHT,
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
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 'bold',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  padding: '8px 8px',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap'
                }}>
                  Category
                </TableCell>
                <TableCell sx={{
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 'bold',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  padding: '8px 8px',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap'
                }}>
                  Item
                </TableCell>
                <TableCell sx={{
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 'bold',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  padding: '8px 8px',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap'
                }}>
                  Unit
                </TableCell>
                <TableCell sx={{
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 'bold',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  padding: '8px 8px',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap'
                }}>
                  Fiscal Year
                </TableCell>
                <TableCell sx={{
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 'bold',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  padding: '8px 8px',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap'
                }}>
                  Month
                </TableCell>
                <TableCell sx={{
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 'bold',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  padding: '8px 8px',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap'
                }}>
                  Balance Type
                </TableCell>
                <TableCell sx={{
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 'bold',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  padding: '8px 8px',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap'
                }}>
                  Quantity
                </TableCell>
                <TableCell sx={{
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 'bold',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  padding: '8px 8px',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap'
                }}>
                  Note
                </TableCell>
                <TableCell sx={{
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 'bold',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  padding: '8px 8px',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  width: '80px'
                }}>
                  Actions
                </TableCell>
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
          Showing {Math.min(pagination.pageSize, pagination.total)} of {pagination.total} records
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

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ py: 1, fontSize: '1.1rem' }}>
          {editingPlan ? 'Edit Inventory Plan' : 'Add Inventory Plan'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ py: 1 }}>
            <Grid container spacing={1.5} sx={{ mt: 0 }}>
              <Grid item xs={12} sm={6}>
                <EnhancedFormField 
                  label="Category" 
                  required 
                  error={formErrors.category}
                >
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    label="Category"
                    sx={{ fontSize: '0.875rem' }}
                  >
                    {categoryOptions.map(category => (
                      <MenuItem key={category} value={category} sx={{ fontSize: '0.875rem' }}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </EnhancedFormField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <EnhancedFormField 
                  label="Item" 
                  required 
                  error={formErrors.itemId}
                >
                  <Select
                    name="itemId"
                    value={formData.itemId}
                    onChange={handleChange}
                    label="Item"
                    required
                    disabled={!formData.category || loadingItems}
                    sx={{ fontSize: '0.875rem' }}
                    InputProps={{
                      endAdornment: loadingItems ? <CircularProgress size={16} /> : null,
                    }}
                  >
                    {currentItems.length > 0 ? (
                      currentItems.map(item => (
                        <MenuItem key={item._id} value={item._id} sx={{ fontSize: '0.875rem' }}>
                          {getItemDisplayName(item)}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="" disabled sx={{ fontSize: '0.875rem' }}>
                        {formData.category ? `No ${formData.category.toLowerCase()}s available` : 'Select category first'}
                      </MenuItem>
                    )}
                  </Select>
                </EnhancedFormField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Unit"
                  name="unit"
                  value={formData.unit}
                  size="small"
                  margin="dense"
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{ 
                    '& .MuiInputBase-input': { fontSize: '0.875rem' },
                    '& .MuiInputLabel-root': { fontSize: '0.875rem' }
                  }}
                  helperText="Automatically retrieved from selected item"
                  FormHelperTextProps={{ sx: { fontSize: '0.75rem' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <EnhancedFormField 
                  label="Balance Type" 
                  required 
                  error={formErrors.balanceType}
                >
                  <Select
                    name="balanceType"
                    value={formData.balanceType}
                    onChange={handleChange}
                    label="Balance Type"
                    sx={{ fontSize: '0.875rem' }}
                  >
                    {balanceTypes.map(type => (
                      <MenuItem key={type} value={type} sx={{ fontSize: '0.875rem' }}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </EnhancedFormField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <EnhancedFormField 
                  label="Fiscal Year" 
                  required 
                  error={formErrors.fiscalYear}
                >
                  <Select
                    name="fiscalYear"
                    value={formData.fiscalYear}
                    onChange={handleChange}
                    label="Fiscal Year"
                    sx={{ fontSize: '0.875rem' }}
                  >
                    {getAvailableFiscalYears().map(year => (
                      <MenuItem key={year} value={year} sx={{ fontSize: '0.875rem' }}>
                        {formatFiscalYear(year)}
                      </MenuItem>
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
                    name="month"
                    value={formData.month}
                    onChange={handleChange}
                    label="Month"
                    sx={{ fontSize: '0.875rem' }}
                  >
                    {monthOptions.map(month => (
                      <MenuItem key={month} value={month} sx={{ fontSize: '0.875rem' }}>
                        {month}
                      </MenuItem>
                    ))}
                  </Select>
                </EnhancedFormField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  error={!!formErrors.quantity}
                  helperText={formErrors.quantity || "Quantity (unit will be automatically applied)"}
                  size="small"
                  margin="dense"
                  inputProps={{ min: 0, step: 1 }}
                  sx={{ 
                    '& .MuiInputBase-input': { fontSize: '0.875rem' },
                    '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                    '& .MuiFormHelperText-root': { fontSize: '0.75rem' }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Note"
                  name="note"
                  multiline
                  rows={2}
                  value={formData.note}
                  onChange={handleChange}
                  size="small"
                  margin="dense"
                  placeholder="Additional notes or comments..."
                  sx={{ 
                    '& .MuiInputBase-input': { fontSize: '0.875rem' },
                    '& .MuiInputLabel-root': { fontSize: '0.875rem' }
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
                <Button onClick={handleClose} disabled={submitting} size="small">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained"
                  disabled={submitting || loadingItems || !formData.itemId || !formData.balanceType}
                  startIcon={submitting ? <CircularProgress size={16} /> : null}
                  size="small"
                >
                  {editingPlan ? 'Update' : 'Add'}
                </Button>
              </Box>
            </Box>
          </DialogActions>
        </form>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={handleImportClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ py: 1, fontSize: '1.1rem' }}>Import Inventory Plans</DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.8rem' }}>
            Upload an Excel file (.xlsx) with inventory plan data. The file should include columns for:
            Category, Item, Unit, Fiscal Year, Month, Balance Type, Quantity, and Note.
          </Typography>
          
          <Box sx={{ border: '2px dashed', borderColor: 'grey.300', p: 2, textAlign: 'center', borderRadius: 1 }}>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="import-file-input"
            />
            <label htmlFor="import-file-input">
              <Button variant="outlined" component="span" startIcon={<Publish />} size="small">
                Select File
              </Button>
            </label>
            {importFile && (
              <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.8rem' }}>
                Selected: {importFile.name}
              </Typography>
            )}
          </Box>

          <Box sx={{ mt: 1, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.8rem' }}>
              File Format Requirements:
            </Typography>
            <Typography variant="body2" component="div" sx={{ fontSize: '0.75rem' }}>
              • Required columns: Category, Item, Fiscal Year, Month, Balance Type, Quantity<br/>
              • Optional columns: Unit, Note<br/>
              • Category must be "Product" or "Material"<br/>
              • Balance Type must be "Opening Balance" or "Closing Balance"<br/>
              • Month must be full name (e.g., "January")<br/>
              • Fiscal Year and Quantity must be numbers
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ py: 1 }}>
          <Button onClick={handleImportClose} size="small">Cancel</Button>
          <Button 
            onClick={handleImport} 
            variant="contained" 
            disabled={!importFile || importLoading}
            startIcon={importLoading ? <CircularProgress size={16} /> : <Publish />}
            size="small"
          >
            {importLoading ? 'Importing...' : 'Import'}
          </Button>
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
  );
};

export default InventoryPlan;