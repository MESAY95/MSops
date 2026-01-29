import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent
} from '@mui/material';

const PricingTables = () => {
  const [infoPricings, setInfoPricings] = useState([]);
  const [pricingData, setPricingData] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [calculatedPricing, setCalculatedPricing] = useState(null);

  useEffect(() => {
    fetchInfoPricings();
    fetchPricingData();
  }, []);

  useEffect(() => {
    if (selectedProduct && pricingData.length > 0) {
      calculateProductPricing(selectedProduct);
    }
  }, [selectedProduct, pricingData]);

  const fetchInfoPricings = async () => {
    try {
      const response = await fetch('/api/info-pricings');
      if (response.ok) {
        const data = await response.json();
        setInfoPricings(data);
      }
    } catch (error) {
      console.error('Error fetching info pricings:', error);
    }
  };

  const fetchPricingData = async () => {
    try {
      const response = await fetch('/api/pricings');
      if (response.ok) {
        const data = await response.json();
        setPricingData(data);
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error);
    }
  };

  const calculateProductPricing = (productType) => {
    const productPricing = pricingData.find(p => p.productType === productType);
    if (productPricing) {
      setCalculatedPricing(productPricing);
    }
  };

  const products = [
    'BH_30g_PET',
    'BH_500g_PET', 
    'BH_30g_GLASS',
    'BH_500g_GLASS',
    'BLISTER_20g',
    'SACHET_30g'
  ];

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Pricing Summary Tables
      </Typography>

      <Grid container spacing={3}>
        {/* Table 1: Pricing Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Table 1: Pricing Information
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell>Remark</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {infoPricings.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.product.replace(/_/g, ' ')}</TableCell>
                        <TableCell>{item.value?.toFixed(2)}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>{item.remark}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Table 2: Pricing Data */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Table 2: Pricing Data
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Cost Category</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Value (ETB)</TableCell>
                      <TableCell>Remark</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pricingData.flatMap(pricing => 
                      pricing.costItems.map((item, index) => (
                        <TableRow key={`${pricing._id}-${index}`}>
                          <TableCell>{item.item}</TableCell>
                          <TableCell>{item.costCategory}</TableCell>
                          <TableCell>{pricing.productType.replace(/_/g, ' ')}</TableCell>
                          <TableCell align="right">{item.value?.toFixed(2)}</TableCell>
                          <TableCell>{item.remark}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Table 3: Calculated Pricing Summary */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Table 3: Product Price Summary
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Select Product</InputLabel>
                <Select
                  value={selectedProduct}
                  label="Select Product"
                  onChange={(e) => setSelectedProduct(e.target.value)}
                >
                  {products.map(product => (
                    <MenuItem key={product} value={product}>
                      {product.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {calculatedPricing && (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Cost Category</TableCell>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Value per Piece (ETB)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Raw Material</TableCell>
                        <TableCell>{calculatedPricing.productType.replace(/_/g, ' ')}</TableCell>
                        <TableCell align="right">
                          {calculatedPricing.summary?.costByCategory?.rawMaterial?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Packaging</TableCell>
                        <TableCell>{calculatedPricing.productType.replace(/_/g, ' ')}</TableCell>
                        <TableCell align="right">
                          {calculatedPricing.summary?.costByCategory?.packaging?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Labor</TableCell>
                        <TableCell>{calculatedPricing.productType.replace(/_/g, ' ')}</TableCell>
                        <TableCell align="right">
                          {calculatedPricing.summary?.costByCategory?.labor?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Overhead</TableCell>
                        <TableCell>{calculatedPricing.productType.replace(/_/g, ' ')}</TableCell>
                        <TableCell align="right">
                          {calculatedPricing.summary?.costByCategory?.overhead?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Other</TableCell>
                        <TableCell>{calculatedPricing.productType.replace(/_/g, ' ')}</TableCell>
                        <TableCell align="right">
                          {calculatedPricing.summary?.costByCategory?.other?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Total Production Cost</strong></TableCell>
                        <TableCell><strong>{calculatedPricing.productType.replace(/_/g, ' ')}</strong></TableCell>
                        <TableCell align="right"><strong>
                          {calculatedPricing.summary?.totalCostPerPiece?.toFixed(2)}
                        </strong></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Profit Margin ({calculatedPricing.summary?.profitMargin}%)</TableCell>
                        <TableCell>{calculatedPricing.productType.replace(/_/g, ' ')}</TableCell>
                        <TableCell align="right">
                          {calculatedPricing.summary?.profitAmount?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>VAT (15%)</TableCell>
                        <TableCell>{calculatedPricing.productType.replace(/_/g, ' ')}</TableCell>
                        <TableCell align="right">
                          {calculatedPricing.summary?.vatAmount?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Final Price with VAT</strong></TableCell>
                        <TableCell><strong>{calculatedPricing.productType.replace(/_/g, ' ')}</strong></TableCell>
                        <TableCell align="right"><strong>
                          {calculatedPricing.summary?.finalPriceWithVat?.toFixed(2)}
                        </strong></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PricingTables;