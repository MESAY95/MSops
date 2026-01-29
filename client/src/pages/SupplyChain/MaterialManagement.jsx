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
  Snackbar,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Inventory as InventoryIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  ImportExport as ImportExportIcon,
  ArrowBack as ArrowBackIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Code as CodeIcon,
  AttachMoney as AttachMoneyIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

// Styled components - more compact like PettyCash
const StyledTableRow = styled(TableRow)(({ theme, selected }) => ({
  backgroundColor: selected ? theme.palette.action.selected : 'transparent',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  height: '36px',
}));

const StatisticCard = styled(Card)(({ theme, color }) => ({
  minHeight: '80px',
  '& .MuiCardContent-root': {
    padding: theme.spacing(1.5),
    '&:last-child': { 
      paddingBottom: theme.spacing(1.5) 
    }
  },
  textAlign: 'center',
  background: color === 'green' ? '#f6ffed' : 
              color === 'red' ? '#fff2f0' : 
              color === 'blue' ? '#f0f8ff' : 
              color === 'orange' ? '#fff7e6' : '#fafafa',
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

const MaterialManagement = ({ onBack }) => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [filters, setFilters] = useState({
    page: 0,
    limit: 10,
    search: '',
    material: '',
    materialCode: '',
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
    totalMaterials: 0,
    activeMaterials: 0,
    inactiveMaterials: 0,
    totalValue: 0,
    lowConsumption: 0,
    highLeadTime: 0
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState(null);

  const tableRef = useRef();

  // API base URL
  const API_BASE = 'http://localhost:5000/api/materials';

  // Use debounced search
  const debouncedSearch = useDebounce(filters.search, 500);

  // Filter options
  const [materialOptions, setMaterialOptions] = useState([]);
  const [materialCodeOptions, setMaterialCodeOptions] = useState([]);
  const [packSizeOptions, setPackSizeOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const statusOptions = ['Active', 'Inactive'];

  // Form state
  const [formData, setFormData] = useState({
    MaterialCode: '',
    Material: '',
    PackSize: '',
    Unit: '',
    UnitPrice: 0,
    ReorderQuantity: 0,
    MinimumConsumption: '',
    MaximumConsumption: '',
    MinimumLeadTime: '',
    MaximumLeadTime: '',
    Status: 'Active'
  });

  const [errors, setErrors] = useState({});

  // Enhanced fetch materials
  const fetchMaterials = useCallback(async (abortController) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      params.append('sortBy', 'Material');
      params.append('sortOrder', 'asc');

      const response = await axios.get(`${API_BASE}?${params}`, {
        signal: abortController?.signal
      });
      
      let materialsData = [];
      
      if (response.data && Array.isArray(response.data.data)) {
        materialsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        materialsData = response.data;
      }
      
      setMaterials(materialsData);
      
      if (response.data) {
        setPagination({
          page: (response.data.currentPage || 1) - 1,
          pageSize: filters.limit,
          total: response.data.totalRecords || materialsData.length
        });
      }
      
      // Calculate stats
      calculateStats(materialsData);
      
      // Update filter options
      if (Array.isArray(materialsData)) {
        setMaterialOptions([...new Set(materialsData.map(m => m.Material).filter(Boolean))]);
        setMaterialCodeOptions([...new Set(materialsData.map(m => m.MaterialCode).filter(Boolean))]);
        setPackSizeOptions([...new Set(materialsData.map(m => m.PackSize).filter(Boolean))]);
        setUnitOptions([...new Set(materialsData.map(m => m.Unit).filter(Boolean))]);
      }

      // Reset selected row index
      setSelectedRowIndex(-1);
    } catch (error) {
      if (axios.isCancel(error)) return;
      
      const errorMessage = error.response?.data?.message || 'Failed to fetch materials';
      setError(errorMessage);
      showSnackbar(`Error fetching materials: ${errorMessage}`, 'error');
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Calculate stats from materials
  const calculateStats = (materialsData) => {
    if (!Array.isArray(materialsData)) return;

    const activeMaterials = materialsData.filter(material => material?.Status === 'Active');
    const inactiveMaterials = materialsData.filter(material => material?.Status === 'Inactive');
    
    const totalValue = materialsData.reduce((sum, material) => {
      const unitPrice = Number(material?.UnitPrice) || 0;
      const reorderQuantity = Number(material?.ReorderQuantity) || 0;
      return sum + (unitPrice * reorderQuantity);
    }, 0);

    const lowConsumption = activeMaterials.filter(material => {
      const minConsumption = Number(material?.MinimumConsumption) || 0;
      const reorderQuantity = Number(material?.ReorderQuantity) || 0;
      return minConsumption > 0 && reorderQuantity < minConsumption;
    }).length;

    const highLeadTime = activeMaterials.filter(material => {
      const minLeadTime = Number(material?.MinimumLeadTime) || 0;
      const maxLeadTime = Number(material?.MaximumLeadTime) || 0;
      return maxLeadTime > 0 && minLeadTime > maxLeadTime;
    }).length;

    setStats({
      totalMaterials: materialsData.length,
      activeMaterials: activeMaterials.length,
      inactiveMaterials: inactiveMaterials.length,
      totalValue: totalValue,
      lowConsumption: lowConsumption,
      highLeadTime: highLeadTime
    });
  };

  // Effect for fetching materials
  useEffect(() => {
    const abortController = new AbortController();
    fetchMaterials(abortController);
    
    return () => {
      abortController.abort();
    };
  }, [fetchMaterials, debouncedSearch]);

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
      limit: 10,
      search: '',
      material: '',
      materialCode: '',
      status: '',
      packSize: '',
      unit: ''
    });
    showSnackbar('Filters reset successfully', 'info');
  };

  const showModal = (material = null, view = false) => {
    setEditingMaterial(material);
    setViewMode(view);
    setModalVisible(true);
    setErrors({});
    
    if (material) {
      setFormData({
        MaterialCode: material.MaterialCode || '',
        Material: material.Material || '',
        PackSize: material.PackSize || '',
        Unit: material.Unit || '',
        UnitPrice: material.UnitPrice || 0,
        ReorderQuantity: material.ReorderQuantity || 0,
        MinimumConsumption: material.MinimumConsumption || '',
        MaximumConsumption: material.MaximumConsumption || '',
        MinimumLeadTime: material.MinimumLeadTime || '',
        MaximumLeadTime: material.MaximumLeadTime || '',
        Status: material.Status || 'Active'
      });
    } else {
      setFormData({
        MaterialCode: '',
        Material: '',
        PackSize: '',
        Unit: '',
        UnitPrice: 0,
        ReorderQuantity: 0,
        MinimumConsumption: '',
        MaximumConsumption: '',
        MinimumLeadTime: '',
        MaximumLeadTime: '',
        Status: 'Active'
      });
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingMaterial(null);
    setViewMode(false);
    setFormData({
      MaterialCode: '',
      Material: '',
      PackSize: '',
      Unit: '',
      UnitPrice: 0,
      ReorderQuantity: 0,
      MinimumConsumption: '',
      MaximumConsumption: '',
      MinimumLeadTime: '',
      MaximumLeadTime: '',
      Status: 'Active'
    });
    setErrors({});
  };

  const handleRefresh = () => {
    fetchMaterials();
    showSnackbar('Data refreshed successfully', 'success');
  };

  // Show delete confirmation
  const handleDeleteClick = (material) => {
    setMaterialToDelete(material);
    setDeleteDialog(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!materialToDelete) return;

    try {
      await axios.delete(`${API_BASE}/${materialToDelete._id}`);
      
      showSnackbar(`Successfully deleted material: ${materialToDelete.Material}`, 'success');
      
      // Refresh data after delete
      await fetchMaterials();
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Delete failed';
      showSnackbar(`Delete failed: ${errorMessage}`, 'error');
      setError(errorMessage);
    } finally {
      setDeleteDialog(false);
      setMaterialToDelete(null);
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.MaterialCode.trim()) newErrors.MaterialCode = 'Material Code is required';
    if (!formData.Material.trim()) newErrors.Material = 'Material Name is required';
    if (!formData.PackSize.trim()) newErrors.PackSize = 'Pack Size is required';
    if (!formData.Unit.trim()) newErrors.Unit = 'Unit is required';
    if (!formData.UnitPrice || formData.UnitPrice <= 0) newErrors.UnitPrice = 'Unit price must be greater than 0';
    if (formData.ReorderQuantity < 0) newErrors.ReorderQuantity = 'Reorder quantity cannot be negative';

    // Lead time validation
    if (formData.MinimumLeadTime && formData.MaximumLeadTime) {
      const minLead = parseInt(formData.MinimumLeadTime);
      const maxLead = parseInt(formData.MaximumLeadTime);
      if (minLead > maxLead) {
        newErrors.MaximumLeadTime = 'Maximum lead time must be greater than minimum';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      showSnackbar('Please fix the validation errors before submitting', 'error');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Prepare data for backend
      const submitData = {
        MaterialCode: formData.MaterialCode.trim(),
        Material: formData.Material.trim(),
        PackSize: formData.PackSize.trim(),
        Unit: formData.Unit.trim(),
        UnitPrice: parseFloat(formData.UnitPrice) || 0,
        ReorderQuantity: parseFloat(formData.ReorderQuantity) || 0,
        MinimumConsumption: formData.MinimumConsumption ? parseFloat(formData.MinimumConsumption) : undefined,
        MaximumConsumption: formData.MaximumConsumption ? parseFloat(formData.MaximumConsumption) : undefined,
        MinimumLeadTime: formData.MinimumLeadTime ? parseInt(formData.MinimumLeadTime) : undefined,
        MaximumLeadTime: formData.MaximumLeadTime ? parseInt(formData.MaximumLeadTime) : undefined,
        Status: formData.Status
      };

      let response;
      if (editingMaterial) {
        response = await axios.put(`${API_BASE}/${editingMaterial._id}`, submitData);
        showSnackbar(`Successfully updated material: ${formData.Material}`, 'success');
      } else {
        response = await axios.post(API_BASE, submitData);
        showSnackbar(`Successfully created new material: ${formData.Material}`, 'success');
      }

      setModalVisible(false);
      setEditingMaterial(null);
      setViewMode(false);
      setFormData({
        MaterialCode: '',
        Material: '',
        PackSize: '',
        Unit: '',
        UnitPrice: 0,
        ReorderQuantity: 0,
        MinimumConsumption: '',
        MaximumConsumption: '',
        MinimumLeadTime: '',
        MaximumLeadTime: '',
        Status: 'Active'
      });
      setErrors({});
      
      // Refresh data
      await fetchMaterials();
      
    } catch (error) {
      console.error('Error:', error);
      
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
      
      setError(`Error: ${errorMessage}`);
      showSnackbar(`Operation failed: ${errorMessage}`, 'error');
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
            <title>Materials Report</title>
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
              <h1>Materials Report</h1>
              <div class="timestamp">Generated on: ${new Date().toLocaleString()}</div>
              <div>Total Materials: ${materials.length}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Material Code</th>
                  <th>Material Name</th>
                  <th>Pack Size</th>
                  <th>Unit</th>
                  <th>Unit Price</th>
                  <th>Reorder Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${materials.map(material => {
                  const statusClass = material.Status === 'Active' ? 'active' : 'inactive';
                  
                  return `
                    <tr>
                      <td>${material.MaterialCode || 'N/A'}</td>
                      <td>${material.Material || 'N/A'}</td>
                      <td>${material.PackSize || 'N/A'}</td>
                      <td>${material.Unit || 'N/A'}</td>
                      <td>ETB ${material.UnitPrice || 0}</td>
                      <td>${material.ReorderQuantity || 0}</td>
                      <td class="${statusClass}">${material.Status || 'N/A'}</td>
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
      setError('Error generating print document');
      showSnackbar('Error generating print document', 'error');
    }
  };

  // Export functionality
  const handleExport = () => {
    try {
      const headers = [
        'Material Code',
        'Material',
        'Pack Size',
        'Unit',
        'Unit Price',
        'Reorder Quantity',
        'Minimum Consumption',
        'Maximum Consumption',
        'Minimum Lead Time',
        'Maximum Lead Time',
        'Status'
      ];
      
      const exportData = materials.map(material => ({
        'Material Code': material.MaterialCode || 'N/A',
        'Material': material.Material || 'N/A',
        'Pack Size': material.PackSize || 'N/A',
        'Unit': material.Unit || 'N/A',
        'Unit Price': material.UnitPrice || 0,
        'Reorder Quantity': material.ReorderQuantity || 0,
        'Minimum Consumption': material.MinimumConsumption || 'N/A',
        'Maximum Consumption': material.MaximumConsumption || 'N/A',
        'Minimum Lead Time': material.MinimumLeadTime || 'N/A',
        'Maximum Lead Time': material.MaximumLeadTime || 'N/A',
        'Status': material.Status || 'N/A'
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
      link.setAttribute('download', `materials-${dayjs().format('YYYY-MM-DD')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSnackbar('Data exported successfully', 'success');
      
    } catch (error) {
      console.error('Export error:', error);
      setError('Error exporting data');
      showSnackbar('Error exporting data', 'error');
    }
  };

  // Import functionality
  const handleImport = () => {
    showSnackbar('Import functionality will be implemented soon', 'info');
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

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filters.search !== '' ||
      filters.material !== '' ||
      filters.materialCode !== '' ||
      filters.status !== '' ||
      filters.packSize !== '' ||
      filters.unit !== ''
    );
  };

  // Show snackbar
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 2 }}>
        {/* Header with Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Material Management
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage your inventory materials
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Back">
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
              <IconButton onClick={handlePrint} size="small">
                <PrintIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export">
              <IconButton onClick={handleExport} size="small">
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Import">
              <IconButton onClick={handleImport} size="small">
                <ImportExportIcon fontSize="small" />
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
              Add Material
            </Button>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatisticCard color="default">
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                  <InventoryIcon color="action" sx={{ mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body2" color="textSecondary">
                    Total Materials
                  </Typography>
                </Box>
                <Typography variant="h6" component="div">
                  {stats.totalMaterials}
                </Typography>
              </CardContent>
            </StatisticCard>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatisticCard color="green">
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                  <CheckCircleIcon sx={{ color: 'success.main', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body2" color="textSecondary">
                    Active
                  </Typography>
                </Box>
                <Typography variant="h6" component="div" color="success.main">
                  {stats.activeMaterials}
                </Typography>
              </CardContent>
            </StatisticCard>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatisticCard color="red">
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                  <CancelIcon sx={{ color: 'error.main', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body2" color="textSecondary">
                    Inactive
                  </Typography>
                </Box>
                <Typography variant="h6" component="div" color="error.main">
                  {stats.inactiveMaterials}
                </Typography>
              </CardContent>
            </StatisticCard>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatisticCard color="blue">
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                  <AttachMoneyIcon sx={{ color: 'primary.main', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body2" color="textSecondary">
                    Total Value
                  </Typography>
                </Box>
                <Typography variant="h6" component="div" color="primary.main">
                  {formatCurrency(stats.totalValue)}
                </Typography>
              </CardContent>
            </StatisticCard>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatisticCard color="orange">
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                  <WarningIcon sx={{ color: 'warning.main', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body2" color="textSecondary">
                    Low Consumption
                  </Typography>
                </Box>
                <Typography variant="h6" component="div" color="warning.main">
                  {stats.lowConsumption}
                </Typography>
              </CardContent>
            </StatisticCard>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <StatisticCard color="red">
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                  <ScheduleIcon sx={{ color: 'error.main', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body2" color="textSecondary">
                    High Lead Time
                  </Typography>
                </Box>
                <Typography variant="h6" component="div" color="error.main">
                  {stats.highLeadTime}
                </Typography>
              </CardContent>
            </StatisticCard>
          </Grid>
        </Grid>

        {/* Filters - Collapsible */}
        {showFilters && (
          <Paper sx={{ p: 1.5, mb: 2 }}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search materials..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
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
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    label="Status"
                    endAdornment={filters.status && (
                      <IconButton
                        size="small"
                        onClick={() => handleFilterChange('status', '')}
                        sx={{ mr: -1 }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    )}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    {statusOptions.map(status => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Material Code</InputLabel>
                  <Select
                    value={filters.materialCode}
                    onChange={(e) => handleFilterChange('materialCode', e.target.value)}
                    label="Material Code"
                  >
                    <MenuItem value="">All Codes</MenuItem>
                    {materialCodeOptions.map(code => (
                      <MenuItem key={code} value={code}>{code}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Material</InputLabel>
                  <Select
                    value={filters.material}
                    onChange={(e) => handleFilterChange('material', e.target.value)}
                    label="Material"
                  >
                    <MenuItem value="">All Materials</MenuItem>
                    {materialOptions.map(material => (
                      <MenuItem key={material} value={material}>{material}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Additional Filters */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Pack Size</InputLabel>
                  <Select
                    value={filters.packSize}
                    onChange={(e) => handleFilterChange('packSize', e.target.value)}
                    label="Pack Size"
                  >
                    <MenuItem value="">All Pack Sizes</MenuItem>
                    {packSizeOptions.map(size => (
                      <MenuItem key={size} value={size}>{size}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={filters.unit}
                    onChange={(e) => handleFilterChange('unit', e.target.value)}
                    label="Unit"
                  >
                    <MenuItem value="">All Units</MenuItem>
                    {unitOptions.map(unit => (
                      <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={() => fetchMaterials()}
                    disabled={loading}
                    size="small"
                  >
                    Search
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={resetFilters}
                    size="small"
                    disabled={!hasActiveFilters()}
                  >
                    Reset Filters
                  </Button>
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
              {filters.material && (
                <Chip
                  label={`Material: ${filters.material}`}
                  size="small"
                  onDelete={() => handleFilterChange('material', '')}
                />
              )}
              {filters.materialCode && (
                <Chip
                  label={`Code: ${filters.materialCode}`}
                  size="small"
                  onDelete={() => handleFilterChange('materialCode', '')}
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

        {/* Data Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
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
                      backgroundColor: '#f5f5f5',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}>Material Code</TableCell>
                    <TableCell sx={{ 
                      padding: '6px 8px', 
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      fontSize: '0.8125rem',
                      backgroundColor: '#f5f5f5',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}>Material Name</TableCell>
                    <TableCell sx={{ 
                      padding: '6px 8px', 
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      fontSize: '0.8125rem',
                      backgroundColor: '#f5f5f5',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}>Pack Size</TableCell>
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
                    }}>Unit Price</TableCell>
                    <TableCell sx={{ 
                      padding: '6px 8px', 
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      fontSize: '0.8125rem',
                      backgroundColor: '#f5f5f5',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}>Reorder Qty</TableCell>
                    <TableCell sx={{ 
                      padding: '6px 8px', 
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      fontSize: '0.8125rem',
                      backgroundColor: '#f5f5f5',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}>Status</TableCell>
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
                  {materials.length > 0 ? (
                    materials.map((material, index) => (
                      <StyledTableRow 
                        key={material._id}
                        selected={index === selectedRowIndex}
                        onClick={() => setSelectedRowIndex(index)}
                        onDoubleClick={() => showModal(material, true)}
                        sx={{ height: '36px' }}
                      >
                        <TableCell sx={{ 
                          padding: '4px 8px',
                          whiteSpace: 'nowrap',
                          fontSize: '0.8125rem'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CodeIcon sx={{ mr: 0.5, fontSize: 14, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight="medium">
                              {material.MaterialCode || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ 
                          padding: '4px 8px',
                          whiteSpace: 'nowrap',
                          fontSize: '0.8125rem'
                        }}>
                          {material.Material || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ 
                          padding: '4px 8px',
                          whiteSpace: 'nowrap',
                          fontSize: '0.8125rem'
                        }}>
                          {material.PackSize || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ 
                          padding: '4px 8px',
                          whiteSpace: 'nowrap',
                          fontSize: '0.8125rem'
                        }}>
                          {material.Unit || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ 
                          padding: '4px 8px',
                          whiteSpace: 'nowrap',
                          fontSize: '0.8125rem'
                        }}>
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(material.UnitPrice)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ 
                          padding: '4px 8px',
                          whiteSpace: 'nowrap',
                          fontSize: '0.8125rem'
                        }}>
                          {material.ReorderQuantity || 0}
                        </TableCell>
                        <TableCell sx={{ 
                          padding: '4px 8px',
                          whiteSpace: 'nowrap'
                        }}>
                          <Chip 
                            label={material.Status} 
                            color={getStatusColor(material.Status)}
                            icon={getStatusIcon(material.Status)}
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
                          whiteSpace: 'nowrap'
                        }}>
                          <Box sx={{ display: 'flex', gap: 0.25 }}>
                            <Tooltip title="Edit">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => showModal(material, false)}
                                sx={{ padding: '4px' }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteClick(material)}
                                sx={{ padding: '4px' }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </StyledTableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        <Typography color="textSecondary">
                          No materials found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={pagination.total}
              rowsPerPage={pagination.pageSize}
              page={pagination.page}
              onPageChange={handleTableChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              sx={{ '& .MuiTablePagination-toolbar': { minHeight: '44px' } }}
            />
          </>
        )}

        {/* Add/Edit Material Dialog */}
        <Dialog 
          open={modalVisible} 
          onClose={handleCancel}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingMaterial ? 
              (viewMode ? 'View Material' : 'Edit Material') : 
              'Create New Material'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={1} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Material Code"
                  value={formData.MaterialCode}
                  onChange={(e) => handleInputChange('MaterialCode', e.target.value)}
                  error={!!errors.MaterialCode}
                  helperText={errors.MaterialCode}
                  required
                  disabled={viewMode}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Material Name"
                  value={formData.Material}
                  onChange={(e) => handleInputChange('Material', e.target.value)}
                  error={!!errors.Material}
                  helperText={errors.Material}
                  required
                  disabled={viewMode}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Pack Size"
                  value={formData.PackSize}
                  onChange={(e) => handleInputChange('PackSize', e.target.value)}
                  error={!!errors.PackSize}
                  helperText={errors.PackSize}
                  required
                  disabled={viewMode}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Unit"
                  value={formData.Unit}
                  onChange={(e) => handleInputChange('Unit', e.target.value)}
                  error={!!errors.Unit}
                  helperText={errors.Unit}
                  required
                  disabled={viewMode}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Unit Price (ETB)"
                  value={formData.UnitPrice}
                  onChange={(e) => handleInputChange('UnitPrice', e.target.value)}
                  type="number"
                  error={!!errors.UnitPrice}
                  helperText={errors.UnitPrice}
                  required
                  disabled={viewMode}
                  size="small"
                  InputProps={{ 
                    startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Reorder Quantity"
                  value={formData.ReorderQuantity}
                  onChange={(e) => handleInputChange('ReorderQuantity', e.target.value)}
                  type="number"
                  error={!!errors.ReorderQuantity}
                  helperText={errors.ReorderQuantity}
                  required
                  disabled={viewMode}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Minimum Consumption"
                  value={formData.MinimumConsumption}
                  onChange={(e) => handleInputChange('MinimumConsumption', e.target.value)}
                  type="number"
                  disabled={viewMode}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Maximum Consumption"
                  value={formData.MaximumConsumption}
                  onChange={(e) => handleInputChange('MaximumConsumption', e.target.value)}
                  type="number"
                  disabled={viewMode}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Minimum Lead Time (days)"
                  value={formData.MinimumLeadTime}
                  onChange={(e) => handleInputChange('MinimumLeadTime', e.target.value)}
                  type="number"
                  disabled={viewMode}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Maximum Lead Time (days)"
                  value={formData.MaximumLeadTime}
                  onChange={(e) => handleInputChange('MaximumLeadTime', e.target.value)}
                  type="number"
                  error={!!errors.MaximumLeadTime}
                  helperText={errors.MaximumLeadTime}
                  disabled={viewMode}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required disabled={viewMode} size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.Status}
                    onChange={(e) => handleInputChange('Status', e.target.value)}
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
            {!viewMode && (
              <>
                <Button onClick={handleCancel} disabled={submitting} size="small">
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleSubmit}
                  disabled={submitting}
                  size="small"
                >
                  {submitting ? 'Saving...' : (editingMaterial ? 'Update Material' : 'Create Material')}
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
              Are you sure you want to delete this material?
            </Typography>
            {materialToDelete && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Material Code:</strong> {materialToDelete.MaterialCode}
                </Typography>
                <Typography variant="body2">
                  <strong>Material Name:</strong> {materialToDelete.Material}
                </Typography>
                <Typography variant="body2">
                  <strong>Pack Size:</strong> {materialToDelete.PackSize}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {materialToDelete.Status}
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
    </LocalizationProvider>
  );
};

export default MaterialManagement;