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
  Snackbar,
  Fade,
  LinearProgress,
  Backdrop
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Inventory as InventoryIcon,
  ArrowBack as ArrowBackIcon,
  FilterList as FilterIcon,
  Download as ExportIcon,
  Print as PrintIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Code as CodeIcon,
  AttachMoney as DollarIcon,
  Clear as ClearIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

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

const ProductManagement = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    product: '',
    productCode: '',
    status: '',
    packSize: '',
    unit: ''
  });
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0
  });
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    totalValue: 0
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [showFilters, setShowFilters] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  const tableRef = useRef();

  // API base URL
  const API_BASE = 'http://localhost:5000/api/products';

  // Use debounced search
  const debouncedSearch = useDebounce(filters.search, 500);

  // Filter options
  const [productOptions, setProductOptions] = useState([]);
  const [productCodeOptions, setProductCodeOptions] = useState([]);
  const [packSizeOptions, setPackSizeOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const statusOptions = ['Active', 'Inactive'];

  // Required fields
  const requiredFields = ['ProductCode', 'Product', 'PackSize', 'Unit', 'ProductPrice', 'ReorderQuantity'];

  // Form state
  const [formData, setFormData] = useState({
    ProductCode: '',
    Product: '',
    PackSize: '',
    Unit: '',
    ProductPrice: 0,
    ReorderQuantity: 0,
    MinimumStock: '',
    MaximumStock: '',
    MinimumLeadTime: '',
    MaximumLeadTime: '',
    Status: 'Active'
  });

  // Snackbar helper
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    requiredFields.forEach(field => {
      const value = formData[field];
      if (!value || String(value).trim() === '') {
        errors[field] = `${field.replace(/([A-Z])/g, ' $1')} is required`;
      }
    });

    if (formData.ProductPrice <= 0) {
      errors.ProductPrice = 'Product price must be greater than 0';
    }
    
    if (formData.ReorderQuantity < 0) {
      errors.ReorderQuantity = 'Reorder quantity cannot be negative';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form field changes
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Mark field as touched
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    
    // Clear error for this field if it exists
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await axios.get(`${API_BASE}?${params}`);
      
      let productsData = [];
      
      if (response.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
      }
      
      // Sort by creation date (most recent last)
      productsData.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }
        return a._id.localeCompare(b._id);
      });
      
      setProducts(productsData);
      setFilteredProducts(productsData);
      
      // Calculate stats
      calculateStats(productsData);
      
      // Update filter options
      if (Array.isArray(productsData)) {
        setProductOptions([...new Set(productsData.map(p => p.Product).filter(Boolean))]);
        setProductCodeOptions([...new Set(productsData.map(p => p.ProductCode).filter(Boolean))]);
        setPackSizeOptions([...new Set(productsData.map(p => p.PackSize).filter(Boolean))]);
        setUnitOptions([...new Set(productsData.map(p => p.Unit).filter(Boolean))]);
      }

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch products';
      showSnackbar(errorMessage, 'error');
      setError(errorMessage);
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Calculate stats
  const calculateStats = (productsData) => {
    if (!Array.isArray(productsData)) return;

    const activeProducts = productsData.filter(product => product?.Status === 'Active');
    const inactiveProducts = productsData.filter(product => product?.Status === 'Inactive');
    
    const totalValue = productsData.reduce((sum, product) => {
      const productPrice = Number(product?.ProductPrice) || 0;
      const reorderQuantity = Number(product?.ReorderQuantity) || 0;
      return sum + (productPrice * reorderQuantity);
    }, 0);

    setStats({
      totalProducts: productsData.length,
      activeProducts: activeProducts.length,
      inactiveProducts: inactiveProducts.length,
      totalValue: totalValue
    });
  };

  // Fetch products on mount and when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, debouncedSearch]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      product: '',
      productCode: '',
      status: '',
      packSize: '',
      unit: ''
    });
  };

  // Open modal for add/edit/view
  const showModal = (product = null, view = false) => {
    setEditingProduct(product);
    setViewMode(view);
    setModalVisible(true);
    
    setFormErrors({});
    setTouchedFields({});
    
    if (product) {
      setFormData({
        ProductCode: product.ProductCode || '',
        Product: product.Product || '',
        PackSize: product.PackSize || '',
        Unit: product.Unit || '',
        ProductPrice: product.ProductPrice || 0,
        ReorderQuantity: product.ReorderQuantity || 0,
        MinimumStock: product.MinimumStock || '',
        MaximumStock: product.MaximumStock || '',
        MinimumLeadTime: product.MinimumLeadTime || '',
        MaximumLeadTime: product.MaximumLeadTime || '',
        Status: product.Status || 'Active'
      });
    } else {
      setFormData({
        ProductCode: '',
        Product: '',
        PackSize: '',
        Unit: '',
        ProductPrice: 0,
        ReorderQuantity: 0,
        MinimumStock: '',
        MaximumStock: '',
        MinimumLeadTime: '',
        MaximumLeadTime: '',
        Status: 'Active'
      });
    }
  };

  // Close modal
  const handleCancel = () => {
    setModalVisible(false);
    setEditingProduct(null);
    setViewMode(false);
    setFormData({
      ProductCode: '',
      Product: '',
      PackSize: '',
      Unit: '',
      ProductPrice: 0,
      ReorderQuantity: 0,
      MinimumStock: '',
      MaximumStock: '',
      MinimumLeadTime: '',
      MaximumLeadTime: '',
      Status: 'Active'
    });
    setFormErrors({});
    setTouchedFields({});
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchProducts();
    showSnackbar('Data refreshed successfully', 'success');
  };

  // Handle delete product
  const handleDeleteProduct = (product) => {
    setProductToDelete(product);
    setDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/${productToDelete._id}`);
      showSnackbar(`Successfully deleted product: ${productToDelete.Product}`, 'success');
      fetchProducts();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Delete failed';
      showSnackbar(`Delete failed: ${errorMessage}`, 'error');
    } finally {
      setDeleteDialog(false);
      setProductToDelete(null);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Mark all required fields as touched
    const allTouched = {};
    requiredFields.forEach(field => {
      allTouched[field] = true;
    });
    setTouchedFields(allTouched);
    
    // Validate form
    if (!validateForm()) {
      showSnackbar('Please fix validation errors before submitting', 'error');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const submitData = {
        ProductCode: String(formData.ProductCode || '').trim(),
        Product: String(formData.Product || '').trim(),
        PackSize: String(formData.PackSize || '').trim(),
        Unit: String(formData.Unit || '').trim(),
        ProductPrice: parseFloat(formData.ProductPrice) || 0,
        ReorderQuantity: parseFloat(formData.ReorderQuantity) || 0,
        MinimumStock: formData.MinimumStock ? parseFloat(formData.MinimumStock) : undefined,
        MaximumStock: formData.MaximumStock ? parseFloat(formData.MaximumStock) : undefined,
        MinimumLeadTime: formData.MinimumLeadTime ? parseInt(formData.MinimumLeadTime) : undefined,
        MaximumLeadTime: formData.MaximumLeadTime ? parseInt(formData.MaximumLeadTime) : undefined,
        Status: formData.Status
      };

      // Remove empty string values for optional fields
      if (submitData.MinimumStock === undefined) delete submitData.MinimumStock;
      if (submitData.MaximumStock === undefined) delete submitData.MaximumStock;
      if (submitData.MinimumLeadTime === undefined) delete submitData.MinimumLeadTime;
      if (submitData.MaximumLeadTime === undefined) delete submitData.MaximumLeadTime;

      let response;
      if (editingProduct) {
        response = await axios.put(`${API_BASE}/${editingProduct._id}`, submitData);
        showSnackbar(`Successfully updated product: ${formData.Product}`, 'success');
      } else {
        response = await axios.post(API_BASE, submitData);
        showSnackbar(`Successfully created new product: ${formData.Product}`, 'success');
      }

      setModalVisible(false);
      setEditingProduct(null);
      setViewMode(false);
      setFormData({
        ProductCode: '',
        Product: '',
        PackSize: '',
        Unit: '',
        ProductPrice: 0,
        ReorderQuantity: 0,
        MinimumStock: '',
        MaximumStock: '',
        MinimumLeadTime: '',
        MaximumLeadTime: '',
        Status: 'Active'
      });
      setFormErrors({});
      setTouchedFields({});
      
      // Refresh data
      fetchProducts();
      
    } catch (error) {
      let errorMessage = 'Operation failed';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check if the backend is running.';
      } else {
        errorMessage = error.message;
      }
      
      showSnackbar(`Error: ${errorMessage}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Status colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'error';
      default: return 'default';
    }
  };

  // Status icons
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return <CheckCircleIcon />;
      case 'Inactive': return <CancelIcon />;
      default: return null;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `ETB ${amount?.toLocaleString() || '0'}`;
  };

  // Handle export
  const handleExport = () => {
    try {
      const headers = [
        'Product Code',
        'Product',
        'Pack Size',
        'Unit',
        'Product Price',
        'Reorder Quantity',
        'Minimum Stock',
        'Maximum Stock',
        'Minimum Lead Time',
        'Maximum Lead Time',
        'Status'
      ];
      
      const exportData = products.map(product => ({
        'Product Code': product.ProductCode || 'N/A',
        'Product': product.Product || 'N/A',
        'Pack Size': product.PackSize || 'N/A',
        'Unit': product.Unit || 'N/A',
        'Product Price': product.ProductPrice || 0,
        'Reorder Quantity': product.ReorderQuantity || 0,
        'Minimum Stock': product.MinimumStock || 'N/A',
        'Maximum Stock': product.MaximumStock || 'N/A',
        'Minimum Lead Time': product.MinimumLeadTime || 'N/A',
        'Maximum Lead Time': product.MaximumLeadTime || 'N/A',
        'Status': product.Status || 'N/A'
      }));

      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => `"${row[header]}"`).join(',')
        )
      ].join('\n');

      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `products-${dayjs().format('YYYY-MM-DD')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSnackbar('Data exported successfully', 'success');
    } catch (error) {
      showSnackbar('Error exporting data', 'error');
      console.error('Export error:', error);
    }
  };

  // Handle print
  const handlePrint = () => {
    try {
      const printContent = `
        <html>
          <head>
            <title>Products Report</title>
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
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Products Report</h1>
              <div class="timestamp">Generated on: ${new Date().toLocaleString()}</div>
              <div>Total Products: ${products.length}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Pack Size</th>
                  <th>Unit</th>
                  <th>Product Price</th>
                  <th>Reorder Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${products.map(product => {
                  const statusClass = product.Status === 'Active' ? 'active' : 'inactive';
                  
                  return `
                    <tr>
                      <td>${product.ProductCode || 'N/A'}</td>
                      <td>${product.Product || 'N/A'}</td>
                      <td>${product.PackSize || 'N/A'}</td>
                      <td>${product.Unit || 'N/A'}</td>
                      <td>ETB ${product.ProductPrice || 0}</td>
                      <td>${product.ReorderQuantity || 0}</td>
                      <td class="${statusClass}">${product.Status || 'N/A'}</td>
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
      
      showSnackbar('Print document generated successfully', 'success');
      
    } catch (error) {
      console.error('Print error:', error);
      showSnackbar('Error generating print document', 'error');
    }
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filters.search !== '' ||
      filters.product !== '' ||
      filters.productCode !== '' ||
      filters.status !== '' ||
      filters.packSize !== '' ||
      filters.unit !== ''
    );
  };

  // Table columns
  const columns = [
    {
      id: 'ProductCode',
      label: 'Product Code',
      render: (record) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CodeIcon fontSize="small" />
          <Typography variant="body2" fontWeight="bold">
            {record.ProductCode || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      id: 'Product',
      label: 'Product Name',
      render: (record) => record.Product || 'N/A'
    },
    {
      id: 'PackSize',
      label: 'Pack Size',
      render: (record) => record.PackSize || 'N/A'
    },
    {
      id: 'Unit',
      label: 'Unit',
      render: (record) => record.Unit || 'N/A'
    },
    {
      id: 'ProductPrice',
      label: 'Product Price',
      render: (record) => formatCurrency(record.ProductPrice)
    },
    {
      id: 'ReorderQuantity',
      label: 'Reorder Qty',
      render: (record) => record.ReorderQuantity || 0
    },
    {
      id: 'Status',
      label: 'Status',
      render: (record) => (
        <Chip 
          color={getStatusColor(record.Status)} 
          icon={getStatusIcon(record.Status)}
          label={record.Status}
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
      )
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (record) => (
        <Box sx={{ display: 'flex', gap: 0.25 }}>
          <Tooltip title="Edit">
            <IconButton
              color="primary"
              size="small"
              onClick={() => showModal(record, false)}
              sx={{ padding: '4px' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              color="error"
              size="small"
              onClick={() => handleDeleteProduct(record)}
              sx={{ padding: '4px' }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 2 }}>
      {/* Header with Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Product Management
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export">
            <IconButton onClick={handleExport} size="small">
              <ExportIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton onClick={handlePrint} size="small">
              <PrintIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Filter">
            <IconButton 
              onClick={() => setShowFilters(!showFilters)} 
              size="small"
              color={showFilters ? "primary" : "default"}
            >
              <FilterIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => showModal()}
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
                  Total Products
                </Typography>
              </Box>
              <Typography variant="h6">
                {stats.totalProducts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ minHeight: '80px' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: '1rem' }} />
                <Typography variant="body2" color="textSecondary">
                  Active Products
                </Typography>
              </Box>
              <Typography variant="h6" color="success">
                {stats.activeProducts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ minHeight: '80px' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <CancelIcon color="error" sx={{ mr: 1, fontSize: '1rem' }} />
                <Typography variant="body2" color="textSecondary">
                  Inactive Products
                </Typography>
              </Box>
              <Typography variant="h6" color="error">
                {stats.inactiveProducts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ minHeight: '80px' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <DollarIcon color="primary" sx={{ mr: 1, fontSize: '1rem' }} />
                <Typography variant="body2" color="textSecondary">
                  Total Value
                </Typography>
              </Box>
              <Typography variant="h6">
                {formatCurrency(stats.totalValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters - Collapsible */}
      {showFilters && (
        <Paper sx={{ p: 1.5, mb: 2 }}>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search products..."
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
            <Grid item xs={12} md={4}>
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
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Product Code</InputLabel>
                <Select
                  value={filters.productCode}
                  onChange={(e) => handleFilterChange('productCode', e.target.value)}
                  label="Product Code"
                >
                  <MenuItem value="">All Codes</MenuItem>
                  {productCodeOptions.map(code => (
                    <MenuItem key={code} value={code}>{code}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Box>
                  {hasActiveFilters() && (
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
                    disabled={!hasActiveFilters()}
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
      {hasActiveFilters() && !showFilters && (
        <Paper sx={{ p: 1, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon color="primary" fontSize="small" />
            <Typography variant="body2" color="textSecondary">
              Active Filters:
            </Typography>
            {filters.search && (
              <Chip
                label={`Search: ${filters.search}`}
                size="small"
                onDelete={() => handleFilterChange('search', '')}
              />
            )}
            {filters.status && (
              <Chip
                label={`Status: ${filters.status}`}
                size="small"
                onDelete={() => handleFilterChange('status', '')}
              />
            )}
            {filters.productCode && (
              <Chip
                label={`Code: ${filters.productCode}`}
                size="small"
                onDelete={() => handleFilterChange('productCode', '')}
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

      {/* Products Table */}
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
                {columns.map((column) => (
                  <TableCell 
                    key={column.id}
                    sx={{ 
                      padding: '6px 8px', 
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      fontSize: '0.8125rem',
                      backgroundColor: '#f5f5f5',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <TableRow 
                    key={product._id} 
                    hover
                    sx={{ height: '36px' }}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.id} sx={{ padding: '4px 8px', whiteSpace: 'nowrap' }}>
                        {column.render ? column.render(product) : product[column.id]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">
                      No products found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Scroll indicator */}
        {filteredProducts.length > 10 && (
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
              Scroll to see more products
            </Typography>
            <KeyboardArrowDownIcon fontSize="small" color="action" />
          </Box>
        )}
      </Box>

      {/* Product Count */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="textSecondary">
          Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          {hasActiveFilters() && ' (filtered)'}
        </Typography>
        
        <Typography variant="body2" color="textSecondary">
          Total: {products.length} products
        </Typography>
      </Box>

      {/* Add/Edit Product Dialog */}
      <Dialog 
        open={modalVisible} 
        onClose={handleCancel}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingProduct ? (viewMode ? 'View Product' : 'Edit Product') : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Code"
                value={formData.ProductCode}
                onChange={(e) => handleFormChange('ProductCode', e.target.value)}
                error={!!formErrors.ProductCode}
                helperText={formErrors.ProductCode}
                required
                size="small"
                disabled={viewMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Name"
                value={formData.Product}
                onChange={(e) => handleFormChange('Product', e.target.value)}
                error={!!formErrors.Product}
                helperText={formErrors.Product}
                required
                size="small"
                disabled={viewMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pack Size"
                value={formData.PackSize}
                onChange={(e) => handleFormChange('PackSize', e.target.value)}
                error={!!formErrors.PackSize}
                helperText={formErrors.PackSize}
                required
                size="small"
                disabled={viewMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unit"
                value={formData.Unit}
                onChange={(e) => handleFormChange('Unit', e.target.value)}
                error={!!formErrors.Unit}
                helperText={formErrors.Unit}
                required
                size="small"
                disabled={viewMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Price (ETB)"
                type="number"
                value={formData.ProductPrice}
                onChange={(e) => handleFormChange('ProductPrice', e.target.value)}
                error={!!formErrors.ProductPrice}
                helperText={formErrors.ProductPrice}
                required
                size="small"
                disabled={viewMode}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reorder Quantity"
                type="number"
                value={formData.ReorderQuantity}
                onChange={(e) => handleFormChange('ReorderQuantity', e.target.value)}
                error={!!formErrors.ReorderQuantity}
                helperText={formErrors.ReorderQuantity}
                required
                size="small"
                disabled={viewMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Minimum Stock"
                type="number"
                value={formData.MinimumStock}
                onChange={(e) => handleFormChange('MinimumStock', e.target.value)}
                size="small"
                disabled={viewMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Maximum Stock"
                type="number"
                value={formData.MaximumStock}
                onChange={(e) => handleFormChange('MaximumStock', e.target.value)}
                size="small"
                disabled={viewMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Minimum Lead Time (days)"
                type="number"
                value={formData.MinimumLeadTime}
                onChange={(e) => handleFormChange('MinimumLeadTime', e.target.value)}
                size="small"
                disabled={viewMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Maximum Lead Time (days)"
                type="number"
                value={formData.MaximumLeadTime}
                onChange={(e) => handleFormChange('MaximumLeadTime', e.target.value)}
                size="small"
                disabled={viewMode}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small" disabled={viewMode}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.Status}
                  onChange={(e) => handleFormChange('Status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} size="small">
            Cancel
          </Button>
          {!viewMode && (
            <Button 
              onClick={handleSubmit} 
              variant="contained"
              disabled={submitting}
              size="small"
            >
              {submitting ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
      >
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this product?
          </Typography>
          {productToDelete && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Product Code:</strong> {productToDelete.ProductCode}
              </Typography>
              <Typography variant="body2">
                <strong>Product Name:</strong> {productToDelete.Product}
              </Typography>
              <Typography variant="body2">
                <strong>Pack Size:</strong> {productToDelete.PackSize}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {productToDelete.Status}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)} size="small">
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete} 
            variant="contained" 
            color="error"
            size="small"
          >
            Delete
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

export default ProductManagement;