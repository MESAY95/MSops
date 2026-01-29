import React, { useState, useEffect } from 'react';
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
  Card,
  CardContent,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  Refresh,
  Print,
  ImportExport,
  GetApp,
  Publish,
  Schedule,
  Calculate  // Added this missing import
} from '@mui/icons-material';
import axios from 'axios';
import * as XLSX from 'xlsx';

const MaterialCostManagement = () => {
  const [materialCosts, setMaterialCosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [open, setOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    product: '',
    productId: '',
    productUnit: '',
    material: '',
    materialId: '',
    materialUnit: '',
    materialPrice: 0,
    priceIncrement: 0,
    totalCost: 0,
    note: ''
  });

  // Fetch material costs from API
  const fetchMaterialCosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/materialcosts');
      setMaterialCosts(response.data);
    } catch (error) {
      console.error('Error fetching material costs:', error);
      setSnackbar({ open: true, message: 'Error fetching material costs', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch active products from API
  const fetchProducts = async () => {
    try {
      setFormLoading(true);
      const response = await axios.get('http://localhost:5000/api/materialcosts/products');
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setSnackbar({ open: true, message: 'Error fetching active products', severity: 'error' });
      setProducts([]);
    } finally {
      setFormLoading(false);
    }
  };

  // Fetch active materials from API
  const fetchMaterials = async () => {
    try {
      setFormLoading(true);
      const response = await axios.get('http://localhost:5000/api/materialcosts/materials');
      setMaterials(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setSnackbar({ open: true, message: 'Error fetching active materials', severity: 'error' });
      setMaterials([]);
    } finally {
      setFormLoading(false);
    }
  };

  // Fetch material unit price from database
  const fetchMaterialPrice = async (materialId) => {
    if (!materialId) return;
    
    try {
      setPriceLoading(true);
      const response = await axios.get(`http://localhost:5000/api/materialcosts/material-price/${materialId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching material price:', error);
      setSnackbar({ open: true, message: 'Error fetching material unit price', severity: 'error' });
      return { price: 0, unit: 'pcs' };
    } finally {
      setPriceLoading(false);
    }
  };

  // Auto refresh effect
  useEffect(() => {
    let intervalId;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchMaterialCosts();
        console.log('Auto-refreshing material costs...');
      }, refreshInterval * 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, refreshInterval]);

  useEffect(() => {
    fetchMaterialCosts();
    fetchProducts();
    fetchMaterials();
  }, []);

  // Calculate total cost when material price or increment changes
  useEffect(() => {
    const materialPrice = Number(formData.materialPrice) || 0;
    const priceIncrement = Number(formData.priceIncrement) || 0;
    const totalCost = materialPrice + (materialPrice * priceIncrement / 100);
    
    setFormData(prev => ({
      ...prev,
      totalCost: Math.round(totalCost * 100) / 100 // Round to 2 decimal places
    }));
  }, [formData.materialPrice, formData.priceIncrement]);

  const handleOpen = (cost = null) => {
    if (cost) {
      setEditingCost(cost);
      // Find product and material IDs from the fetched lists
      const product = products.find(p => p.name === cost.product);
      const material = materials.find(m => m.name === cost.material);
      
      setFormData({
        product: cost.product,
        productId: product?._id || '',
        productUnit: cost.productUnit,
        material: cost.material,
        materialId: material?._id || '',
        materialUnit: cost.materialUnit,
        materialPrice: cost.materialPrice,
        priceIncrement: cost.priceIncrement,
        totalCost: cost.totalCost,
        note: cost.note || ''
      });
    } else {
      setEditingCost(null);
      setFormData({
        product: '',
        productId: '',
        productUnit: '',
        material: '',
        materialId: '',
        materialUnit: '',
        materialPrice: 0,
        priceIncrement: 0,
        totalCost: 0,
        note: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    
    if (name === 'productId') {
      const selectedProduct = products.find(product => product._id === value);
      if (selectedProduct) {
        setFormData({ 
          ...formData, 
          productId: value,
          product: selectedProduct.name,
          productUnit: selectedProduct.unit
        });
      }
    } else if (name === 'materialId') {
      const selectedMaterial = materials.find(material => material._id === value);
      if (selectedMaterial) {
        // First update the material and unit
        setFormData({ 
          ...formData, 
          materialId: value,
          material: selectedMaterial.name,
          materialUnit: selectedMaterial.unit
        });

        // Then fetch the current unit price from database
        try {
          const priceData = await fetchMaterialPrice(value);
          setFormData(prev => ({ 
            ...prev, 
            materialPrice: priceData.price || 0
          }));
        } catch (error) {
          console.error('Error setting material price:', error);
          // If price fetch fails, use the price from the materials list as fallback
          setFormData(prev => ({ 
            ...prev, 
            materialPrice: selectedMaterial.price || 0
          }));
        }
      }
    } else if (name === 'priceIncrement') {
      setFormData({ 
        ...formData, 
        [name]: value === '' ? 0 : Number(value) 
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        product: formData.product,
        material: formData.material,
        materialPrice: Number(formData.materialPrice),
        priceIncrement: Number(formData.priceIncrement),
        note: formData.note
      };

      console.log('Submitting material cost data:', submitData);

      if (editingCost) {
        await axios.put(`http://localhost:5000/api/materialcosts/${editingCost._id}`, submitData);
        setSnackbar({ open: true, message: 'Material cost updated successfully', severity: 'success' });
      } else {
        await axios.post('http://localhost:5000/api/materialcosts', submitData);
        setSnackbar({ open: true, message: 'Material cost created successfully', severity: 'success' });
      }
      fetchMaterialCosts();
      handleClose();
    } catch (error) {
      console.error('Error saving material cost:', error);
      const errorMessage = error.response?.data?.message || 'Error saving material cost';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this material cost?')) {
      try {
        await axios.delete(`http://localhost:5000/api/materialcosts/${id}`);
        setSnackbar({ open: true, message: 'Material cost deleted successfully', severity: 'success' });
        fetchMaterialCosts();
      } catch (error) {
        console.error('Error deleting material cost:', error);
        setSnackbar({ open: true, message: 'Error deleting material cost', severity: 'error' });
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Auto Refresh Functions
  const handleAutoRefreshToggle = (event) => {
    setAutoRefresh(event.target.checked);
    if (event.target.checked) {
      setSnackbar({ open: true, message: `Auto-refresh enabled (${refreshInterval}s)`, severity: 'info' });
    } else {
      setSnackbar({ open: true, message: 'Auto-refresh disabled', severity: 'info' });
    }
  };

  const handleRefreshIntervalChange = (event) => {
    const interval = parseInt(event.target.value);
    setRefreshInterval(interval);
    if (autoRefresh) {
      setSnackbar({ open: true, message: `Refresh interval updated to ${interval}s`, severity: 'info' });
    }
  };

  const handleManualRefresh = () => {
    fetchMaterialCosts();
    fetchProducts();
    fetchMaterials();
    setSnackbar({ open: true, message: 'Data refreshed successfully', severity: 'success' });
  };

  // Print Function
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Material Costs Report</title>
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
            <h1>Material Costs Report</h1>
            <p class="timestamp">Generated on: ${new Date().toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Product Unit</th>
                <th>Material</th>
                <th>Material Unit</th>
                <th>Material Price (ETB)</th>
                <th>Price Increment (%)</th>
                <th>Total Cost (ETB)</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              ${materialCosts.map(cost => `
                <tr>
                  <td>${cost.product}</td>
                  <td>${cost.productUnit}</td>
                  <td>${cost.material}</td>
                  <td>${cost.materialUnit}</td>
                  <td>ETB ${cost.materialPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>${cost.priceIncrement}%</td>
                  <td>ETB ${cost.totalCost?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>${cost.note || ''}</td>
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
  };

  // Export Function
  const handleExport = () => {
    try {
      // Prepare data for export
      const exportData = materialCosts.map(cost => ({
        Product: cost.product,
        'Product Unit': cost.productUnit,
        Material: cost.material,
        'Material Unit': cost.materialUnit,
        'Material Price (ETB)': cost.materialPrice,
        'Price Increment (%)': cost.priceIncrement,
        'Total Cost (ETB)': cost.totalCost,
        Note: cost.note || '',
        'Created At': new Date(cost.createdAt).toLocaleDateString(),
        'Updated At': new Date(cost.updatedAt).toLocaleDateString()
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Material Costs');
      
      // Generate Excel file and trigger download
      const fileName = `material-costs-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      setSnackbar({ open: true, message: 'Data exported successfully', severity: 'success' });
    } catch (error) {
      console.error('Error exporting data:', error);
      setSnackbar({ open: true, message: 'Error exporting data', severity: 'error' });
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
      setSnackbar({ open: true, message: 'Please select a file to import', severity: 'error' });
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
            if (!row.Product || !row.Material || !row['Material Price (ETB)'] || !row['Price Increment (%)']) {
              throw new Error(`Row ${index + 2}: Missing required fields`);
            }

            return {
              product: row.Product,
              material: row.Material,
              materialPrice: parseFloat(row['Material Price (ETB)']),
              priceIncrement: parseFloat(row['Price Increment (%)']),
              note: row.Note || ''
            };
          });

          // Send to backend for processing
          const response = await axios.post('http://localhost:5000/api/materialcosts/import', {
            data: importData
          });

          setSnackbar({ 
            open: true, 
            message: `Successfully imported ${response.data.imported} material costs`, 
            severity: 'success' 
          });
          
          fetchMaterialCosts();
          handleImportClose();
        } catch (error) {
          console.error('Error processing import file:', error);
          setSnackbar({ open: true, message: `Import error: ${error.message}`, severity: 'error' });
        } finally {
          setImportLoading(false);
        }
      };
      reader.readAsArrayBuffer(importFile);
    } catch (error) {
      console.error('Error importing data:', error);
      setSnackbar({ open: true, message: 'Error importing data', severity: 'error' });
      setImportLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Material Cost Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Auto Refresh Settings">
            <IconButton onClick={() => setAutoRefresh(!autoRefresh)} color={autoRefresh ? "primary" : "default"}>
              <Schedule />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleManualRefresh} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print Report">
            <IconButton onClick={handlePrint} color="primary">
              <Print />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Data">
            <IconButton onClick={handleExport} color="primary">
              <GetApp />
            </IconButton>
          </Tooltip>
          <Tooltip title="Import Data">
            <IconButton onClick={handleImportOpen} color="primary">
              <Publish />
            </IconButton>
          </Tooltip>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={() => handleOpen()}
            disabled={formLoading}
          >
            Add Cost
          </Button>
        </Box>
      </Box>

      {/* Auto Refresh Settings Card */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={handleAutoRefreshToggle}
                    color="primary"
                  />
                }
                label="Auto Refresh"
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
                sx={{ minWidth: 120 }}
              >
                <MenuItem value={15}>15 seconds</MenuItem>
                <MenuItem value={30}>30 seconds</MenuItem>
                <MenuItem value={60}>1 minute</MenuItem>
                <MenuItem value={300}>5 minutes</MenuItem>
              </TextField>
            </Grid>
            <Grid item>
              <Typography variant="body2" color="text.secondary">
                {autoRefresh ? `Next refresh in ${refreshInterval}s` : 'Auto refresh disabled'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Records
              </Typography>
              <Typography variant="h5" component="div">
                {materialCosts.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Products
              </Typography>
              <Typography variant="h5" component="div">
                {products.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Materials
              </Typography>
              <Typography variant="h5" component="div">
                {materials.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Enhanced Table with Sticky Header */}
      <TableContainer component={Paper} sx={{ maxHeight: '70vh' }} id="material-cost-table">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Product Unit</TableCell>
              <TableCell>Material</TableCell>
              <TableCell>Material Unit</TableCell>
              <TableCell>Material Price (ETB)</TableCell>
              <TableCell>Price Increment (%)</TableCell>
              <TableCell>Total Cost (ETB)</TableCell>
              <TableCell>Note</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {materialCosts.map((cost) => (
              <TableRow 
                key={cost._id}
                sx={{ 
                  '&:last-child td, &:last-child th': { border: 0 },
                  backgroundColor: cost === materialCosts[materialCosts.length - 1] ? 'action.hover' : 'inherit'
                }}
              >
                <TableCell>
                  <Chip label={cost.product} color="primary" variant="outlined" size="small" />
                </TableCell>
                <TableCell>{cost.productUnit}</TableCell>
                <TableCell>
                  <Chip label={cost.material} color="secondary" variant="outlined" size="small" />
                </TableCell>
                <TableCell>{cost.materialUnit}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    ETB {cost.materialPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={`${cost.priceIncrement}%`} 
                    color={cost.priceIncrement > 10 ? 'error' : 'success'} 
                    variant="filled"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    ETB {cost.totalCost?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={cost.note}
                  >
                    {cost.note || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(cost)} color="primary" size="small">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(cost._id)} color="error" size="small">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {materialCosts.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No material costs found. Click "Add Cost" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Loading material costs...
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCost ? 'Edit Material Cost' : 'Add Material Cost'}
          {(formLoading || priceLoading) && <CircularProgress size={20} sx={{ ml: 2 }} />}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Product"
                  name="productId"
                  value={formData.productId}
                  onChange={handleChange}
                  required
                  disabled={formLoading}
                  helperText={formLoading ? "Loading active products..." : "Select an active product"}
                >
                  {products.map(product => (
                    <MenuItem key={product._id} value={product._id}>
                      {product.name}
                      {product.sku && ` (${product.sku})`}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Product Unit"
                  name="productUnit"
                  value={formData.productUnit}
                  InputProps={{ readOnly: true }}
                  helperText="Automatically retrieved from product"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Material"
                  name="materialId"
                  value={formData.materialId}
                  onChange={handleChange}
                  required
                  disabled={formLoading || priceLoading}
                  helperText={
                    formLoading ? "Loading active materials..." : 
                    priceLoading ? "Fetching material unit price..." :
                    "Select an active material - unit price will auto-populate"
                  }
                >
                  {materials.map(material => (
                    <MenuItem key={material._id} value={material._id}>
                      {material.name}
                      {material.sku && ` (${material.sku})`}
                      {material.price && ` - Unit Price: ETB ${material.price}`}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Material Unit"
                  name="materialUnit"
                  value={formData.materialUnit}
                  InputProps={{ readOnly: true }}
                  helperText="Automatically retrieved from material"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Material Unit Price (ETB)"
                  name="materialPrice"
                  type="number"
                  value={formData.materialPrice}
                  InputProps={{ 
                    readOnly: true,
                    endAdornment: priceLoading ? <CircularProgress size={20} /> : null
                  }}
                  helperText="Retrieved from material database (non-editable)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price Increment (%)"
                  name="priceIncrement"
                  type="number"
                  value={formData.priceIncrement}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                  helperText="Percentage increase (0-100%)"
                />
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ backgroundColor: 'action.hover' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Calculate color="primary" />
                      <Typography variant="h6" component="div">
                        Total Cost: ETB {formData.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Calculated as: Unit Price + (Unit Price × {formData.priceIncrement}%)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Note"
                  name="note"
                  multiline
                  rows={3}
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="Additional notes or comments..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={formLoading || priceLoading}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={!formData.productId || !formData.materialId || formLoading || priceLoading}
            >
              {editingCost ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={handleImportClose} maxWidth="sm" fullWidth>
        <DialogTitle>Import Material Costs</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload an Excel file (.xlsx) with material cost data. The file should include columns for:
            Product, Material, Material Price (ETB), Price Increment (%), and Note.
          </Typography>
          
          <Box sx={{ border: '2px dashed', borderColor: 'grey.300', p: 3, textAlign: 'center', borderRadius: 1 }}>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="import-file-input"
            />
            <label htmlFor="import-file-input">
              <Button variant="outlined" component="span" startIcon={<Publish />}>
                Select File
              </Button>
            </label>
            {importFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {importFile.name}
              </Typography>
            )}
          </Box>

          <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              File Format Requirements:
            </Typography>
            <Typography variant="body2" component="div">
              • Required columns: Product, Material, Material Price (ETB), Price Increment (%)<br/>
              • Optional columns: Note<br/>
              • Product and Material must exist in the system<br/>
              • Material Price must be a positive number<br/>
              • Price Increment must be between 0 and 100<br/>
              • Product-Material combinations must be unique
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleImportClose}>Cancel</Button>
          <Button 
            onClick={handleImport} 
            variant="contained" 
            disabled={!importFile || importLoading}
            startIcon={importLoading ? <CircularProgress size={20} /> : <ImportExport />}
          >
            {importLoading ? 'Importing...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MaterialCostManagement;