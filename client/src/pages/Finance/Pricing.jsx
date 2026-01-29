// Pricing.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Snackbar,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Business as BusinessIcon,
  Inventory as InventoryIcon,
  Build as BuildIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import axios from 'axios';

// Import MaterialCostManagement component
import MaterialCostManagement from './MaterialCostManagement';

// Constants
const API_ENDPOINTS = {
  PRODUCTS: '/api/products?status=Active',
  PRODUCT_FORMULATIONS: '/api/productformulations',
  MATERIALS: '/api/materials?status=Active'
};

// Utility functions
const safeArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  return [];
};

const Pricing = ({ onBack }) => {
  // State management
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [productFormulations, setProductFormulations] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Selections
  const [selectedProduct, setSelectedProduct] = useState('');
  
  // Cost inputs
  const [costData, setCostData] = useState({
    materialCost: 0,
    operationalCost: 0,
    laborCost: 0,
    administrationalCost: 0,
    profitPerUnit: 0,
    profitMargin: 0
  });

  // Active page state
  const [activePage, setActivePage] = useState('pricing');

  // Derived data
  const selectedProductData = products.find(p => p._id === selectedProduct);
  const selectedProductName = selectedProductData?.Product || selectedProductData?.name || '';
  const selectedProductUnit = selectedProductData?.Unit || selectedProductData?.unit || 'pcs';

  // Calculate pricing
  const pricingCalculations = useMemo(() => {
    const {
      materialCost,
      operationalCost,
      laborCost,
      administrationalCost,
      profitPerUnit,
      profitMargin
    } = costData;

    // Calculate total cost per unit
    const totalProductCostPerUnit = materialCost + operationalCost + laborCost + administrationalCost;
    
    // Calculate profit based on either fixed amount or percentage
    const calculatedProfit = profitMargin > 0 
      ? (totalProductCostPerUnit * profitMargin) / 100
      : profitPerUnit;

    // Calculate grand total cost per unit (including profit)
    const grandTotalCostPerUnit = totalProductCostPerUnit + calculatedProfit;
    
    // Calculate VAT (15%)
    const vatAmount = grandTotalCostPerUnit * 0.15;
    
    // Final price including VAT
    const finalPriceWithVAT = grandTotalCostPerUnit + vatAmount;

    // Recalculate actual profit margin based on final values
    const actualProfitMargin = totalProductCostPerUnit > 0 
      ? (calculatedProfit / totalProductCostPerUnit) * 100 
      : 0;

    return {
      totalProductCostPerUnit,
      calculatedProfit,
      grandTotalCostPerUnit,
      vatAmount,
      finalPriceWithVAT,
      actualProfitMargin
    };
  }, [costData]);

  // Data fetching functions
  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.PRODUCTS);
      const productsData = safeArray(response.data);
      
      const activeProducts = productsData.filter(product => 
        product.status === 'Active' || product.status === 'active' || !product.status
      );
      
      setProducts(activeProducts);
      if (activeProducts.length > 0 && !selectedProduct) {
        setSelectedProduct(activeProducts[0]._id);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    }
  }, [selectedProduct]);

  const fetchMaterials = useCallback(async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.MATERIALS);
      const materialsData = safeArray(response.data);
      
      const activeMaterials = materialsData.filter(material => 
        material.status === 'Active' || material.status === 'active' || !material.status
      );
      
      setMaterials(activeMaterials);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setError('Failed to load materials');
    }
  }, []);

  const fetchProductFormulations = useCallback(async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.PRODUCT_FORMULATIONS);
      const formulations = safeArray(response.data);
      setProductFormulations(formulations);
    } catch (error) {
      console.error('Error fetching formulations:', error);
      setError('Failed to load product formulations');
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchProducts(),
        fetchMaterials(),
        fetchProductFormulations()
      ]);
      setSuccess('Pricing data loaded successfully');
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  }, [fetchProducts, fetchMaterials, fetchProductFormulations]);

  // Event handlers
  const handleProductChange = (event) => {
    setSelectedProduct(event.target.value);
  };

  const handleCostChange = (field, value) => {
    setCostData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleRefresh = () => {
    fetchAllData();
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(null);
  };

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Navigation buttons component
  const NavigationButtons = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={2.4}>
        <Button
          fullWidth
          variant={activePage === 'general' ? 'contained' : 'outlined'}
          startIcon={<InfoIcon />}
          onClick={() => setActivePage('general')}
          size="large"
        >
          General Information
        </Button>
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <Button
          fullWidth
          variant={activePage === 'product' ? 'contained' : 'outlined'}
          startIcon={<BusinessIcon />}
          onClick={() => setActivePage('product')}
          size="large"
        >
          Product Related Info
        </Button>
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <Button
          fullWidth
          variant={activePage === 'material' ? 'contained' : 'outlined'}
          startIcon={<InventoryIcon />}
          onClick={() => setActivePage('material')}
          size="large"
        >
          Material Cost
        </Button>
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <Button
          fullWidth
          variant={activePage === 'operational' ? 'contained' : 'outlined'}
          startIcon={<BuildIcon />}
          onClick={() => setActivePage('operational')}
          size="large"
        >
          Operational Cost
        </Button>
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <Button
          fullWidth
          variant={activePage === 'labor' ? 'contained' : 'outlined'}
          startIcon={<PeopleIcon />}
          onClick={() => setActivePage('labor')}
          size="large"
        >
          Labor Cost
        </Button>
      </Grid>
    </Grid>
  );

  // Main Pricing Table
  const PricingTable = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CalculateIcon />
        Product Pricing Calculation
      </Typography>

      {products.length === 0 ? (
        <Alert severity="warning">No active products available</Alert>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={8}>
              <FormControl fullWidth>
                <InputLabel>Product</InputLabel>
                <Select value={selectedProduct} label="Product" onChange={handleProductChange}>
                  {products.map(product => (
                    <MenuItem key={product._id} value={product._id}>
                      {product.Product || product.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Unit" value={selectedProductUnit} InputProps={{ readOnly: true }} fullWidth />
            </Grid>
          </Grid>

          <TableContainer>
            <Table className="pricing-table">
              <TableHead>
                <TableRow>
                  <TableCell>Costs</TableCell>
                  <TableCell align="right">Cost per unit for {selectedProductName}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Cost Input Rows */}
                <TableRow>
                  <TableCell>Material Cost</TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      value={costData.materialCost}
                      onChange={(e) => handleCostChange('materialCost', e.target.value)}
                      size="small"
                      InputProps={{
                        endAdornment: 'ETB'
                      }}
                      sx={{ maxWidth: 150 }}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Operational Cost</TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      value={costData.operationalCost}
                      onChange={(e) => handleCostChange('operationalCost', e.target.value)}
                      size="small"
                      InputProps={{
                        endAdornment: 'ETB'
                      }}
                      sx={{ maxWidth: 150 }}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Labor Cost</TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      value={costData.laborCost}
                      onChange={(e) => handleCostChange('laborCost', e.target.value)}
                      size="small"
                      InputProps={{
                        endAdornment: 'ETB'
                      }}
                      sx={{ maxWidth: 150 }}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Administrational Cost</TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      value={costData.administrationalCost}
                      onChange={(e) => handleCostChange('administrationalCost', e.target.value)}
                      size="small"
                      InputProps={{
                        endAdornment: 'ETB'
                      }}
                      sx={{ maxWidth: 150 }}
                    />
                  </TableCell>
                </TableRow>

                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell>
                    <Typography fontWeight="bold">Total Product Cost / pcs</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold">
                      {pricingCalculations.totalProductCostPerUnit.toFixed(2)} ETB
                    </Typography>
                  </TableCell>
                </TableRow>

                {/* Profit Input */}
                <TableRow>
                  <TableCell>Profit (ETB / pcs)</TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      value={costData.profitPerUnit}
                      onChange={(e) => handleCostChange('profitPerUnit', e.target.value)}
                      size="small"
                      InputProps={{
                        endAdornment: 'ETB'
                      }}
                      sx={{ maxWidth: 150 }}
                    />
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>Profit Margin (%)</TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      value={costData.profitMargin}
                      onChange={(e) => handleCostChange('profitMargin', e.target.value)}
                      size="small"
                      InputProps={{
                        endAdornment: '%'
                      }}
                      sx={{ maxWidth: 150 }}
                    />
                  </TableCell>
                </TableRow>

                <TableRow sx={{ backgroundColor: 'primary.light', color: 'white' }}>
                  <TableCell>
                    <Typography fontWeight="bold" color="inherit">
                      G. Total Product Cost / pcs
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold" color="inherit">
                      {pricingCalculations.grandTotalCostPerUnit.toFixed(2)} ETB
                    </Typography>
                  </TableCell>
                </TableRow>

                {/* VAT Calculation */}
                <TableRow>
                  <TableCell>VAT (15%)</TableCell>
                  <TableCell align="right">
                    <Typography>
                      {pricingCalculations.vatAmount.toFixed(2)} ETB
                    </Typography>
                  </TableCell>
                </TableRow>

                <TableRow sx={{ backgroundColor: 'secondary.light', color: 'white' }}>
                  <TableCell>
                    <Typography fontWeight="bold" color="inherit">
                      Product Cost + VAT
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold" color="inherit">
                      {pricingCalculations.finalPriceWithVAT.toFixed(2)} ETB
                    </Typography>
                  </TableCell>
                </TableRow>

                {/* Final Profit Margin Display */}
                <TableRow sx={{ backgroundColor: 'success.light', color: 'white' }}>
                  <TableCell>
                    <Typography fontWeight="bold" color="inherit">
                      Profit Margin (%)
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold" color="inherit">
                      {pricingCalculations.actualProfitMargin.toFixed(1)}%
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Paper>
  );

  // Placeholder components for other pages
  const GeneralInformationPage = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        General Information
      </Typography>
      <Typography color="text.secondary">
        General company and pricing information will be displayed here.
      </Typography>
    </Paper>
  );

  const ProductRelatedInfoPage = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Product Related Information
      </Typography>
      <Typography color="text.secondary">
        Product specifications and details will be displayed here.
      </Typography>
    </Paper>
  );

  // Updated MaterialCostPage to use the actual MaterialCostManagement component
  const MaterialCostPage = () => (
    <MaterialCostManagement />
  );

  const OperationalCostPage = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Operational Cost Analysis
      </Typography>
      <Typography color="text.secondary">
        Operational expenses and overhead costs will be displayed here.
      </Typography>
    </Paper>
  );

  const LaborCostPage = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Labor Cost Details
      </Typography>
      <Typography color="text.secondary">
        Labor costs and workforce expenses will be displayed here.
      </Typography>
    </Paper>
  );

  // Render active page
  const renderActivePage = () => {
    switch (activePage) {
      case 'general':
        return <GeneralInformationPage />;
      case 'product':
        return <ProductRelatedInfoPage />;
      case 'material':
        return <MaterialCostPage />;
      case 'operational':
        return <OperationalCostPage />;
      case 'labor':
        return <LaborCostPage />;
      default:
        return <PricingTable />;
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        {onBack && (
          <IconButton onClick={onBack} sx={{ border: 1, borderColor: 'divider' }}>
            <ArrowBackIcon />
          </IconButton>
        )}
        <Box flex={1}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalculateIcon />
            Product Pricing System
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive product cost calculation and pricing
          </Typography>
        </Box>
        <Tooltip title="Refresh Data">
          <IconButton
            onClick={handleRefresh}
            disabled={loading}
            color="primary"
            sx={{ border: 1, borderColor: 'divider' }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success">
          {success}
        </Alert>
      </Snackbar>

      {/* Navigation Buttons */}
      <NavigationButtons />

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        renderActivePage()
      )}
    </Box>
  );
};

export default Pricing;