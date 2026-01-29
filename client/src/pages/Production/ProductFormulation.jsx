// ProductFormulation.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Chip,
  Grid,
  Tooltip,
  Card,
  CardContent,
  CircularProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Add as AddIcon,
  Info as InfoIcon,
  Refresh,
  Print,
  GetApp,
  Publish,
  Schedule
} from '@mui/icons-material';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_ENDPOINT = '/api/productformulations';
const PRODUCTS_API = '/api/products';
const MATERIALS_API = '/api/materials';

const ProductFormulation = () => {
  const [formulations, setFormulations] = useState([]);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [open, setOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingFormulation, setEditingFormulation] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  const [formData, setFormData] = useState({
    productName: '',
    materialName: '',
    quantity: '',
    materialUnit: '',
    lossFactor: '0',
    status: 'Active'
  });

  // Auto refresh effect
  useEffect(() => {
    let intervalId;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchFormulations();
        console.log('Auto-refreshing formulations...');
      }, refreshInterval * 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, refreshInterval]);

  useEffect(() => {
    fetchFormulations();
    fetchProductsAndMaterials();
  }, []);

  const fetchProductsAndMaterials = async () => {
    try {
      const [productsRes, materialsRes] = await Promise.all([
        axios.get(PRODUCTS_API),
        axios.get(MATERIALS_API)
      ]);
      
      console.log('Products response:', productsRes.data);
      console.log('Materials response:', materialsRes.data);
      
      // Handle different response structures
      const productsData = Array.isArray(productsRes.data) ? productsRes.data : 
                          productsRes.data?.data || productsRes.data?.products || [];
      const materialsData = Array.isArray(materialsRes.data) ? materialsRes.data : 
                           materialsRes.data?.data || materialsRes.data?.materials || [];
      
      setProducts(productsData);
      setMaterials(materialsData);
    } catch (error) {
      console.error('Error details:', error);
      showSnackbar('Error fetching products or materials: ' + error.message, 'error');
    }
  };

  const fetchFormulations = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_ENDPOINT);
      setFormulations(response.data);
    } catch (error) {
      showSnackbar('Error fetching formulations: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available units for the selected material
  const fetchMaterialUnits = async (materialName) => {
    if (!materialName) {
      setAvailableUnits([]);
      setFormData(prev => ({ ...prev, materialUnit: '' }));
      return;
    }

    try {
      console.log('Fetching units for material:', materialName);
      
      // Find the material by name
      const material = materials.find(m => {
        const materialDisplayName = m.Material || m.name || '';
        console.log('Comparing:', materialDisplayName, 'with:', materialName);
        return materialDisplayName === materialName;
      });
      
      console.log('Found material:', material);

      if (material) {
        // Get available units from the material
        // Try different field names: AvailableUnits, units, Unit
        let units = [];
        
        if (material.AvailableUnits && material.AvailableUnits.length > 0) {
          units = material.AvailableUnits;
        } else if (material.units && material.units.length > 0) {
          units = material.units;
        } else if (material.Unit) {
          units = [material.Unit];
        } else {
          // Fallback to default units
          units = ['kg', 'g', 'lb', 'pcs', 'l', 'ml'];
        }
        
        console.log('Available units:', units);
        setAvailableUnits(units);
        
        // Auto-select the first unit if only one is available and no unit is currently selected
        if (units.length === 1 && !formData.materialUnit) {
          setFormData(prev => ({ ...prev, materialUnit: units[0] }));
        }
        
        // If editing and the current unit is not in available units, reset it
        if (formData.materialUnit && !units.includes(formData.materialUnit)) {
          setFormData(prev => ({ ...prev, materialUnit: '' }));
        }
      } else {
        console.log('Material not found in list, using default units');
        setAvailableUnits(['kg', 'g', 'lb', 'pcs', 'l', 'ml']);
      }
    } catch (error) {
      console.error('Error fetching material units:', error);
      // Use fallback units if API call fails
      setAvailableUnits(['kg', 'g', 'lb', 'pcs', 'l', 'ml']);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const resetForm = () => {
    setFormData({
      productName: '',
      materialName: '',
      quantity: '',
      materialUnit: '',
      lossFactor: '0',
      status: 'Active'
    });
    setAvailableUnits([]);
    setEditingFormulation(null);
  };

  const handleOpen = () => {
    resetForm();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleEdit = async (formulation) => {
    const editData = {
      productName: formulation.productName,
      materialName: formulation.materialName,
      quantity: formulation.quantity,
      materialUnit: formulation.materialUnit,
      lossFactor: formulation.lossFactor.toString(),
      status: formulation.status
    };

    setFormData(editData);
    setEditingFormulation(formulation);
    setOpen(true);
    
    // Fetch units for the material being edited
    await fetchMaterialUnits(formulation.materialName);
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // When material changes, fetch its available units
    if (name === 'materialName') {
      await fetchMaterialUnits(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submissionData = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        lossFactor: parseFloat(formData.lossFactor) || 0
      };

      if (editingFormulation) {
        await axios.put(`${API_ENDPOINT}/${editingFormulation._id}`, submissionData);
        showSnackbar('Formulation updated successfully');
      } else {
        await axios.post(API_ENDPOINT, submissionData);
        showSnackbar('Formulation created successfully');
      }
      fetchFormulations();
      handleClose();
    } catch (error) {
      showSnackbar('Error saving formulation: ' + error.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this formulation?')) {
      try {
        await axios.delete(`${API_ENDPOINT}/${id}`);
        showSnackbar('Formulation deleted successfully');
        fetchFormulations();
      } catch (error) {
        showSnackbar('Error deleting formulation: ' + error.message, 'error');
      }
    }
  };

  // Calculate effective quantity including loss factor
  const calculateEffectiveQuantity = (quantity, lossFactor) => {
    const qty = parseFloat(quantity) || 0;
    const loss = parseFloat(lossFactor) || 0;
    const lossMultiplier = 1 + (loss / 100);
    return qty * lossMultiplier;
  };

  // Auto Refresh Functions
  const handleAutoRefreshToggle = (event) => {
    setAutoRefresh(event.target.checked);
    if (event.target.checked) {
      showSnackbar(`Auto-refresh enabled (${refreshInterval}s)`, 'info');
    } else {
      showSnackbar('Auto-refresh disabled', 'info');
    }
  };

  const handleRefreshIntervalChange = (event) => {
    const interval = parseInt(event.target.value);
    setRefreshInterval(interval);
    if (autoRefresh) {
      showSnackbar(`Refresh interval updated to ${interval}s`, 'info');
    }
  };

  const handleManualRefresh = () => {
    fetchFormulations();
    showSnackbar('Data refreshed manually', 'success');
  };

  // Print Function
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Product Formulations Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .header { text-align: center; margin-bottom: 20px; }
            .timestamp { color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Product Formulations Report</h1>
            <p class="timestamp">Generated on: ${new Date().toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Material Name</th>
                <th>Base Quantity</th>
                <th>Unit</th>
                <th>Loss Factor</th>
                <th>Effective Quantity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${formulations.map(formulation => {
                const effectiveQuantity = calculateEffectiveQuantity(formulation.quantity, formulation.lossFactor);
                return `
                <tr>
                  <td>${formulation.productName}</td>
                  <td>${formulation.materialName}</td>
                  <td>${formulation.quantity}</td>
                  <td>${formulation.materialUnit}</td>
                  <td>${formulation.lossFactor}%</td>
                  <td>${effectiveQuantity.toFixed(3)}</td>
                  <td>${formulation.status}</td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Export Function
  const handleExport = () => {
    try {
      // Prepare data for export
      const exportData = formulations.map(formulation => {
        const effectiveQuantity = calculateEffectiveQuantity(formulation.quantity, formulation.lossFactor);
        return {
          'Product Name': formulation.productName,
          'Material Name': formulation.materialName,
          'Base Quantity': formulation.quantity,
          'Unit': formulation.materialUnit,
          'Loss Factor': `${formulation.lossFactor}%`,
          'Effective Quantity': effectiveQuantity,
          'Status': formulation.status,
          'Created At': new Date(formulation.createdAt).toLocaleDateString(),
          'Updated At': new Date(formulation.updatedAt).toLocaleDateString()
        };
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Product Formulations');
      
      // Generate Excel file and trigger download
      const fileName = `product-formulations-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      showSnackbar('Data exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      showSnackbar('Error exporting data', 'error');
    }
  };

  // Import Functions
  const handleImportOpen = () => {
    setImportDialogOpen(true);
  };

  const handleImportClose = () => {
    setImportDialogOpen(false);
    setImportFile(null);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImportFile(file);
    }
  };

  const handleImport = async () => {
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

          // Validate and transform data
          const importData = jsonData.map((row, index) => {
            // Basic validation
            if (!row['Product Name'] || !row['Material Name'] || !row['Base Quantity']) {
              throw new Error(`Row ${index + 2}: Missing required fields`);
            }

            return {
              productName: row['Product Name'],
              materialName: row['Material Name'],
              quantity: parseFloat(row['Base Quantity']),
              materialUnit: row['Unit'] || 'kg',
              lossFactor: parseFloat(row['Loss Factor']?.replace('%', '')) || 0,
              status: row['Status'] || 'Active'
            };
          });

          // Send to backend for processing
          const response = await axios.post(`${API_ENDPOINT}/import`, {
            data: importData
          });

          showSnackbar(`Successfully imported ${response.data.imported} formulations`, 'success');
          
          fetchFormulations();
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
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1" sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          Product Formulations
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
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
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen} size="small">
            New Formulation
          </Button>
        </Box>
      </Box>

      {/* Auto Refresh Settings Card */}
      <Card sx={{ mb: 1, p: 0.5 }} elevation={1}>
        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
          <Grid container spacing={1} alignItems="center">
            <Grid item>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={handleAutoRefreshToggle}
                    color="primary"
                    size="small"
                  />
                }
                label="Auto Refresh"
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
              />
            </Grid>
            <Grid item>
              <TextField
                select
                size="small"
                label="Refresh Interval"
                value={refreshInterval}
                onChange={handleRefreshIntervalChange}
                disabled={!autoRefresh}
                sx={{ minWidth: 120, '& .MuiInputBase-root': { height: '32px' } }}
              >
                <MenuItem value={15}>15 seconds</MenuItem>
                <MenuItem value={30}>30 seconds</MenuItem>
                <MenuItem value={60}>1 minute</MenuItem>
                <MenuItem value={300}>5 minutes</MenuItem>
              </TextField>
            </Grid>
            <Grid item>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {autoRefresh ? `Next refresh in ${refreshInterval}s` : 'Auto refresh disabled'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Loss Factor Information Card */}
      <Paper sx={{ p: 1, mb: 1, backgroundColor: 'info.light', color: 'info.contrastText' }} elevation={1}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <InfoIcon fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
            Loss Factor Information
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
          Loss Factor (%) = (Total Loss / Initial Quantity) × 100
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
          <strong>Example:</strong> Initial Quantity: 1000 kg, Total Loss: 50 kg → Loss Factor: (50/1000)×100 = 5%
        </Typography>
      </Paper>

      <TableContainer component={Paper} sx={{ maxHeight: 'calc(5 * 48px + 57px)', overflow: 'auto' }} elevation={1}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ 
                padding: '8px 4px', 
                fontSize: '0.75rem', 
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}>Product Name</TableCell>
              <TableCell sx={{ 
                padding: '8px 4px', 
                fontSize: '0.75rem', 
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}>Material Name</TableCell>
              <TableCell align="right" sx={{ 
                padding: '8px 4px', 
                fontSize: '0.75rem', 
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}>Base Quantity</TableCell>
              <TableCell sx={{ 
                padding: '8px 4px', 
                fontSize: '0.75rem', 
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}>Unit</TableCell>
              <TableCell align="right" sx={{ 
                padding: '8px 4px', 
                fontSize: '0.75rem', 
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}>Loss Factor</TableCell>
              <TableCell align="right" sx={{ 
                padding: '8px 4px', 
                fontSize: '0.75rem', 
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}>Effective Quantity</TableCell>
              <TableCell sx={{ 
                padding: '8px 4px', 
                fontSize: '0.75rem', 
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}>Status</TableCell>
              <TableCell sx={{ 
                padding: '8px 4px', 
                fontSize: '0.75rem', 
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {formulations.map((formulation) => {
              const effectiveQuantity = calculateEffectiveQuantity(formulation.quantity, formulation.lossFactor);
              return (
                <TableRow 
                  key={formulation._id}
                  sx={{ 
                    '&:last-child td, &:last-child th': { border: 0 },
                    height: '40px'
                  }}
                >
                  <TableCell sx={{ 
                    padding: '4px', 
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    <Typography variant="body2" fontWeight="medium">
                      {formulation.productName}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ 
                    padding: '4px', 
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    <Typography variant="body2">
                      {formulation.materialName}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    padding: '4px', 
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap'
                  }}>
                    <Typography variant="body2" fontWeight="medium">
                      {formulation.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ 
                    padding: '4px', 
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap'
                  }}>{formulation.materialUnit}</TableCell>
                  <TableCell align="right" sx={{ 
                    padding: '4px', 
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap'
                  }}>
                    <Chip 
                      label={`${formulation.lossFactor}%`} 
                      color={formulation.lossFactor > 0 ? 'warning' : 'default'}
                      size="small" 
                      sx={{ height: '20px', fontSize: '0.625rem' }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    padding: '4px', 
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap'
                  }}>
                    <Tooltip title={`Base: ${formulation.quantity} + Loss: ${formulation.lossFactor}%`}>
                      <Typography variant="body2" fontWeight="medium">
                        {effectiveQuantity.toFixed(3)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ 
                    padding: '4px', 
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap'
                  }}>
                    <Chip 
                      label={formulation.status} 
                      color={formulation.status === 'Active' ? 'success' : 'default'} 
                      size="small" 
                      sx={{ height: '20px', fontSize: '0.625rem' }}
                    />
                  </TableCell>
                  <TableCell sx={{ 
                    padding: '4px', 
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap'
                  }}>
                    <IconButton onClick={() => handleEdit(formulation)} color="primary" size="small" sx={{ padding: '4px' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(formulation._id)} color="error" size="small" sx={{ padding: '4px' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {formulations.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No formulations found. Click "New Formulation" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: '1.25rem', py: 1 }}>
          {editingFormulation ? 'Edit Formulation' : 'New Formulation'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ py: 1 }}>
            <Grid container spacing={1} sx={{ mt: 0 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="dense" size="small">
                  <InputLabel sx={{ fontSize: '0.875rem' }}>Product Name</InputLabel>
                  <Select
                    name="productName"
                    value={formData.productName}
                    label="Product Name"
                    onChange={handleChange}
                    required
                    sx={{ fontSize: '0.875rem' }}
                  >
                    {products.map(product => (
                      <MenuItem 
                        key={product._id} 
                        value={product.Product || product.name || product.productName}
                        sx={{ fontSize: '0.875rem' }}
                      >
                        {product.Product || product.name || product.productName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="dense" size="small">
                  <InputLabel sx={{ fontSize: '0.875rem' }}>Material Name</InputLabel>
                  <Select
                    name="materialName"
                    value={formData.materialName}
                    label="Material Name"
                    onChange={handleChange}
                    required
                    sx={{ fontSize: '0.875rem' }}
                  >
                    {materials.map(material => (
                      <MenuItem 
                        key={material._id} 
                        value={material.Material || material.name || material.materialName}
                        sx={{ fontSize: '0.875rem' }}
                      >
                        {material.Material || material.name || material.materialName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  margin="dense"
                  name="quantity"
                  label="Base Quantity"
                  type="number"
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={formData.quantity}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: 'any' }}
                  required
                  sx={{ fontSize: '0.875rem' }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth margin="dense" size="small">
                  <InputLabel sx={{ fontSize: '0.875rem' }}>Unit</InputLabel>
                  <Select
                    name="materialUnit"
                    value={formData.materialUnit}
                    label="Unit"
                    onChange={handleChange}
                    required
                    disabled={availableUnits.length === 0}
                    sx={{ fontSize: '0.875rem' }}
                  >
                    {availableUnits.map(unit => (
                      <MenuItem key={unit} value={unit} sx={{ fontSize: '0.875rem' }}>{unit}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {availableUnits.length === 0 && formData.materialName && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    No units available for selected material
                  </Typography>
                )}
                {availableUnits.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Available units for this material
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  margin="dense"
                  name="lossFactor"
                  label="Loss Factor %"
                  type="number"
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={formData.lossFactor}
                  onChange={handleChange}
                  inputProps={{ min: 0, max: 100, step: '0.1' }}
                  helperText="Percentage of material loss"
                  sx={{ fontSize: '0.875rem' }}
                  FormHelperTextProps={{ sx: { fontSize: '0.7rem' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="dense" size="small">
                  <InputLabel sx={{ fontSize: '0.875rem' }}>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    label="Status"
                    onChange={handleChange}
                    sx={{ fontSize: '0.875rem' }}
                  >
                    <MenuItem value="Active" sx={{ fontSize: '0.875rem' }}>Active</MenuItem>
                    <MenuItem value="Inactive" sx={{ fontSize: '0.875rem' }}>Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {formData.quantity && formData.lossFactor && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 1, backgroundColor: 'grey.50' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Effective Quantity: {calculateEffectiveQuantity(formData.quantity, formData.lossFactor).toFixed(3)} {formData.materialUnit}
                      <br />
                      <small>Base: {formData.quantity} + Loss: {formData.lossFactor}%</small>
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ py: 1 }}>
            <Button onClick={handleClose} size="small">Cancel</Button>
            <Button type="submit" variant="contained" size="small">
              {editingFormulation ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={handleImportClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '1.25rem', py: 1 }}>Import Product Formulations</DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.875rem' }}>
            Upload an Excel file (.xlsx) with product formulation data. The file should include columns for:
            Product Name, Material Name, Base Quantity, Unit, Loss Factor, and Status.
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
              <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.875rem' }}>
                Selected: {importFile.name}
              </Typography>
            )}
          </Box>

          <Box sx={{ mt: 1, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.875rem' }}>
              File Format Requirements:
            </Typography>
            <Typography variant="body2" component="div" sx={{ fontSize: '0.75rem' }}>
              • Required columns: Product Name, Material Name, Base Quantity<br/>
              • Optional columns: Unit, Loss Factor, Status<br/>
              • Base Quantity must be a number<br/>
              • Loss Factor should be a percentage (e.g., "5%")<br/>
              • Status must be "Active" or "Inactive"<br/>
              • Unit must be a valid unit (kg, g, lb, pcs, l, ml, etc.)
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ fontSize: '0.875rem' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductFormulation;