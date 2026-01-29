import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  TextField,
  Button,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  InputAdornment,
  Tooltip
} from '@mui/material';
import { 
  Save, 
  Add, 
  Delete, 
  Calculate,
  AttachMoney,
  Inventory 
} from '@mui/icons-material';

const PricingDataForm = ({ onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  
  const [formData, setFormData] = useState({
    productId: '',
    productType: '',
    costItems: [],
    productionData: {
      monthlyProductionPlan: 1000,
      productionEfficiency: 1.0
    },
    summary: {
      profitMargin: 20
    }
  });

  const [newCostItem, setNewCostItem] = useState({
    item: '',
    materialId: '',
    costCategory: '',
    value: '',
    unit: 'ETB',
    remark: '',
    quantity: 1,
    calculationDetails: {
      allocationFactor: 1.0,
      usageRate: 1.0,
      wasteFactor: 1.0
    }
  });

  const costCategories = [
    'Raw Material',
    'Packaging',
    'Labor', 
    'Fuel',
    'Utilities',
    'Administrative',
    'Transport',
    'Other'
  ];

  useEffect(() => {
    fetchProducts();
    fetchMaterials();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?active=true');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/materials?active=true');
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const handleFormChange = (path, value) => {
    setFormData(prev => {
      const keys = path.split('.');
      const lastKey = keys.pop();
      const nested = keys.reduce((obj, key) => obj[key], prev);
      nested[lastKey] = value;
      return { ...prev };
    });
  };

  const handleCostItemChange = (field, value) => {
    setNewCostItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedCostItemChange = (parent, field, value) => {
    setNewCostItem(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const addCostItem = () => {
    if (!newCostItem.item || !newCostItem.costCategory || !newCostItem.value || parseFloat(newCostItem.value) <= 0) {
      onError('Please fill all required fields for cost item (Item, Category, and Value > 0)');
      return;
    }

    const costItem = {
      ...newCostItem,
      value: parseFloat(newCostItem.value),
      quantity: parseFloat(newCostItem.quantity) || 1,
      calculationDetails: {
        allocationFactor: parseFloat(newCostItem.calculationDetails.allocationFactor),
        usageRate: parseFloat(newCostItem.calculationDetails.usageRate),
        wasteFactor: parseFloat(newCostItem.calculationDetails.wasteFactor)
      }
    };

    setFormData(prev => ({
      ...prev,
      costItems: [...prev.costItems, costItem]
    }));

    setNewCostItem({
      item: '',
      materialId: '',
      costCategory: '',
      value: '',
      unit: 'ETB',
      remark: '',
      quantity: 1,
      calculationDetails: {
        allocationFactor: 1.0,
        usageRate: 1.0,
        wasteFactor: 1.0
      }
    });
  };

  const removeCostItem = (index) => {
    setFormData(prev => ({
      ...prev,
      costItems: prev.costItems.filter((_, i) => i !== index)
    }));
  };

  const calculatePricing = async () => {
    if (formData.costItems.length === 0) {
      onError('Please add at least one cost item before calculating');
      return;
    }

    try {
      const response = await fetch('/api/pricings/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const calculated = await response.json();
        setFormData(calculated.data);
        onSuccess('Pricing calculated successfully! Check the summary below.');
      } else {
        throw new Error('Calculation failed');
      }
    } catch (error) {
      onError('Error calculating pricing: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.costItems.length === 0) {
      onError('Please add at least one cost item before saving');
      return;
    }

    if (!formData.productId) {
      onError('Please select a product');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        productionData: {
          ...formData.productionData,
          monthlyProductionPlan: parseInt(formData.productionData.monthlyProductionPlan),
          productionEfficiency: parseFloat(formData.productionData.productionEfficiency)
        },
        summary: {
          profitMargin: parseFloat(formData.summary.profitMargin)
        }
      };

      const response = await fetch('/api/pricings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (response.ok) {
        onSuccess('Pricing data saved successfully!');
        // Reset form
        setFormData({
          productId: '',
          productType: '',
          costItems: [],
          productionData: {
            monthlyProductionPlan: 1000,
            productionEfficiency: 1.0
          },
          summary: {
            profitMargin: 20
          }
        });
      } else {
        throw new Error(result.message || 'Failed to save pricing data');
      }
    } catch (error) {
      onError(error.message || 'Error saving pricing data');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Raw Material': 'primary',
      'Packaging': 'secondary',
      'Labor': 'success',
      'Fuel': 'warning',
      'Utilities': 'info',
      'Administrative': 'error',
      'Transport': 'default',
      'Other': 'default'
    };
    return colors[category] || 'default';
  };

  const totalCostValue = formData.costItems.reduce((sum, item) => sum + (item.value || 0), 0);

  return (
    <Box>
      <Typography variant="h5" gutterBottom color="primary">
        Cost Data Recording
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Record detailed cost entries for products and manage cost allocation across different categories.
      </Typography>
      
      <Card sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Product Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Product</InputLabel>
                <Select
                  value={formData.productId}
                  label="Product"
                  onChange={(e) => {
                    const product = products.find(p => p._id === e.target.value);
                    handleFormChange('productId', e.target.value);
                    handleFormChange('productType', product?.category || '');
                  }}
                >
                  {products.map(product => (
                    <MenuItem key={product._id} value={product._id}>
                      {product.name} - {product.sku} ({product.category.replace(/_/g, ' ')})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Product Type"
                value={formData.productType ? formData.productType.replace(/_/g, ' ') : ''}
                InputProps={{ readOnly: true }}
                helperText="Automatically set from product selection"
              />
            </Grid>

            {/* Add Cost Items Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Chip label="Add Cost Items" size="small" />
              </Divider>
              
              <Paper sx={{ p: 2, backgroundColor: 'background.default' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Item Description"
                      value={newCostItem.item}
                      onChange={(e) => handleCostItemChange('item', e.target.value)}
                      placeholder="e.g., Honey Raw Material, Packaging Jar"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={newCostItem.costCategory}
                        label="Category"
                        onChange={(e) => handleCostItemChange('costCategory', e.target.value)}
                      >
                        {costCategories.map(cat => (
                          <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={1}>
                    <TextField
                      fullWidth
                      label="Value"
                      type="number"
                      value={newCostItem.value}
                      onChange={(e) => handleCostItemChange('value', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AttachMoney fontSize="small" />
                          </InputAdornment>
                        ),
                        inputProps: { min: 0, step: 0.01 }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={1}>
                    <TextField
                      fullWidth
                      label="Qty"
                      type="number"
                      value={newCostItem.quantity}
                      onChange={(e) => handleCostItemChange('quantity', e.target.value)}
                      InputProps={{
                        inputProps: { min: 0, step: 0.001 }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={1}>
                    <TextField
                      fullWidth
                      label="Unit"
                      value={newCostItem.unit}
                      onChange={(e) => handleCostItemChange('unit', e.target.value)}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth>
                      <InputLabel>Material</InputLabel>
                      <Select
                        value={newCostItem.materialId}
                        label="Material"
                        onChange={(e) => handleCostItemChange('materialId', e.target.value)}
                      >
                        <MenuItem value="">None</MenuItem>
                        {materials.map(material => (
                          <MenuItem key={material._id} value={material._id}>
                            {material.name} - {material.sku}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={2}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Add Cost Item">
                        <IconButton 
                          color="primary" 
                          onClick={addCostItem}
                          size="large"
                          disabled={!newCostItem.item || !newCostItem.costCategory || !newCostItem.value}
                        >
                          <Add />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>

                  {/* Calculation Details */}
                  <Grid item xs={12}>
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Allocation Factor"
                          type="number"
                          value={newCostItem.calculationDetails.allocationFactor}
                          onChange={(e) => handleNestedCostItemChange('calculationDetails', 'allocationFactor', e.target.value)}
                          InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Usage Rate"
                          type="number"
                          value={newCostItem.calculationDetails.usageRate}
                          onChange={(e) => handleNestedCostItemChange('calculationDetails', 'usageRate', e.target.value)}
                          InputProps={{ inputProps: { min: 0, step: 0.001 } }}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Waste Factor"
                          type="number"
                          value={newCostItem.calculationDetails.wasteFactor}
                          onChange={(e) => handleNestedCostItemChange('calculationDetails', 'wasteFactor', e.target.value)}
                          InputProps={{ inputProps: { min: 1, step: 0.01 } }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Cost Items Table */}
            {formData.costItems.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Cost Items ({formData.costItems.length})
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Value</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Unit</TableCell>
                        <TableCell align="right">Cost/Piece</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.costItems.map((item, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Typography variant="body2">{item.item}</Typography>
                            {item.remark && (
                              <Typography variant="caption" color="text.secondary">
                                {item.remark}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={item.costCategory} 
                              size="small" 
                              color={getCategoryColor(item.costCategory)}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {item.value?.toFixed(2)} ETB
                          </TableCell>
                          <TableCell align="right">
                            {item.quantity}
                          </TableCell>
                          <TableCell align="right">
                            {item.unit}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              {((item.value / item.quantity) || 0).toFixed(2)} ETB
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton 
                              color="error" 
                              size="small"
                              onClick={() => removeCostItem(index)}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={2}>
                          <Typography variant="body2" fontWeight="bold">
                            Total Cost Value
                          </Typography>
                        </TableCell>
                        <TableCell align="right" colSpan={4}>
                          <Typography variant="body2" fontWeight="bold">
                            {totalCostValue.toFixed(2)} ETB
                          </Typography>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}

            {/* Production Data & Calculation */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Chip label="Production & Calculation" size="small" />
              </Divider>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Monthly Production Plan"
                type="number"
                value={formData.productionData.monthlyProductionPlan}
                onChange={(e) => handleFormChange('productionData.monthlyProductionPlan', e.target.value)}
                InputProps={{
                  inputProps: { min: 0 }
                }}
                helperText="Units per month"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Production Efficiency"
                type="number"
                value={formData.productionData.productionEfficiency}
                onChange={(e) => handleFormChange('productionData.productionEfficiency', e.target.value)}
                InputProps={{
                  inputProps: { min: 0, max: 1, step: 0.01 }
                }}
                helperText="0.0 to 1.0 (100%)"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Profit Margin (%)"
                type="number"
                value={formData.summary.profitMargin}
                onChange={(e) => handleFormChange('summary.profitMargin', e.target.value)}
                InputProps={{
                  inputProps: { min: 0, step: 0.1 },
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }}
              />
            </Grid>

            {/* Pricing Summary */}
            {formData.summary.totalCostPerPiece > 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, backgroundColor: 'success.light', color: 'success.contrastText' }}>
                  <Typography variant="h6" gutterBottom>
                    Pricing Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={3}>
                      <Typography variant="body2">Total Cost/Piece:</Typography>
                      <Typography variant="h6">{formData.summary.totalCostPerPiece?.toFixed(2)} ETB</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2">Profit ({formData.summary.profitMargin}%):</Typography>
                      <Typography variant="h6">{formData.summary.profitAmount?.toFixed(2)} ETB</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2">VAT (15%):</Typography>
                      <Typography variant="h6">{formData.summary.vatAmount?.toFixed(2)} ETB</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2">Final Price:</Typography>
                      <Typography variant="h6">{formData.summary.finalPriceWithVat?.toFixed(2)} ETB</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<Calculate />}
                  onClick={calculatePricing}
                  disabled={formData.costItems.length === 0}
                >
                  Calculate Pricing
                </Button>
                
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  disabled={loading || formData.costItems.length === 0 || !formData.productId}
                  size="large"
                >
                  {loading ? 'Saving...' : 'Save Pricing Data'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Card>
    </Box>
  );
};

export default PricingDataForm;