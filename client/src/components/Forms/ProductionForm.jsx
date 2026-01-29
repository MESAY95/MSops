// import React, { useState, useEffect } from 'react';
// import {
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Button,
//   TextField,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   Grid,
//   Box,
//   Typography,
//   Alert,
//   CircularProgress,
//   InputAdornment,
//   Chip
// } from '@mui/material';
// import {
//   Save,
//   Cancel,
//   Edit,
//   Visibility
// } from '@mui/icons-material';
// import axios from 'axios';

// const ProductionForm = ({ open, onClose, record, viewMode, onSave, loading }) => {
//   const [formData, setFormData] = useState({
//     date: '',
//     activity: 'Production',
//     product: '',
//     batch: '',
//     quantity: 0,
//     unit: 'kg',
//     stock: 0,
//     refNo: '',
//     notes: ''
//   });

//   const [products, setProducts] = useState([]);
//   const [errors, setErrors] = useState({});
//   const [formLoading, setFormLoading] = useState(false);

//   // Activities list
//   const activities = ['Production', 'Transfer'];

//   // Units list
//   const units = ['kg', 'g', 'lb', 'oz', 'units', 'liters', 'ml'];

//   // Fetch products for dropdown
//   const fetchProducts = async () => {
//     setFormLoading(true);
//     try {
//       const response = await axios.get('http://localhost:5000/api/products?limit=1000');
//       setProducts(response.data.products || response.data || []);
//     } catch (error) {
//       console.error('Error fetching products:', error);
//     } finally {
//       setFormLoading(false);
//     }
//   };

//   // Initialize form when record changes or form opens
//   useEffect(() => {
//     if (open) {
//       fetchProducts();
      
//       if (record) {
//         // Populate form with existing record data
//         setFormData({
//           date: record.date ? record.date.split('T')[0] : new Date().toISOString().split('T')[0],
//           activity: record.activity || 'Production',
//           product: record.product?._id || record.product || '',
//           batch: record.batch || '',
//           quantity: record.quantity || 0,
//           unit: record.unit || 'kg',
//           stock: record.stock || 0,
//           refNo: record.refNo || '',
//           notes: record.notes || ''
//         });
//       } else {
//         // Reset form for new record
//         setFormData({
//           date: new Date().toISOString().split('T')[0],
//           activity: 'Production',
//           product: '',
//           batch: '',
//           quantity: 0,
//           unit: 'kg',
//           stock: 0,
//           refNo: '',
//           notes: ''
//         });
//       }
//       setErrors({});
//     }
//   }, [record, open]);

//   // Handle form input changes
//   const handleChange = (field, value) => {
//     setFormData(prev => ({
//       ...prev,
//       [field]: value
//     }));

//     // Clear error when field is updated
//     if (errors[field]) {
//       setErrors(prev => ({
//         ...prev,
//         [field]: ''
//       }));
//     }

//     // Auto-generate batch number for new production records
//     if (field === 'activity' && value === 'Production' && !record && !formData.batch) {
//       const timestamp = new Date().getTime().toString().slice(-6);
//       const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
//       setFormData(prev => ({
//         ...prev,
//         batch: `BATCH-${timestamp}${random}`
//       }));
//     }

//     // Auto-generate ref number if empty
//     if (field === 'activity' && !record && !formData.refNo) {
//       const prefix = value === 'Production' ? 'PROD' : 'TRF';
//       const timestamp = new Date().getTime().toString().slice(-6);
//       setFormData(prev => ({
//         ...prev,
//         refNo: `${prefix}-${timestamp}`
//       }));
//     }
//   };

//   // Validate form
//   const validateForm = () => {
//     const newErrors = {};

//     if (!formData.date) {
//       newErrors.date = 'Date is required';
//     }

//     if (!formData.activity) {
//       newErrors.activity = 'Activity is required';
//     }

//     if (!formData.product) {
//       newErrors.product = 'Product is required';
//     }

//     if (!formData.batch) {
//       newErrors.batch = 'Batch number is required';
//     }

//     if (!formData.quantity || formData.quantity <= 0) {
//       newErrors.quantity = 'Quantity must be greater than 0';
//     }

//     if (!formData.unit) {
//       newErrors.unit = 'Unit is required';
//     }

//     if (formData.stock < 0) {
//       newErrors.stock = 'Stock cannot be negative';
//     }

//     if (!formData.refNo) {
//       newErrors.refNo = 'Reference number is required';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // Handle form submission
//   const handleSubmit = (e) => {
//     e.preventDefault();
    
//     if (validateForm()) {
//       console.log('✅ Form validated, submitting data:', formData);
//       onSave(formData);
//     } else {
//       console.log('❌ Form validation failed');
//     }
//   };

//   // Get selected product details
//   const selectedProduct = products.find(p => p._id === formData.product);

//   // Calculate estimated stock if it's a new record and not manually set
//   const calculateEstimatedStock = () => {
//     if (record || formData.stock > 0) return formData.stock;
    
//     if (formData.activity === 'Production') {
//       return formData.quantity;
//     } else if (formData.activity === 'Transfer') {
//       return -formData.quantity;
//     }
//     return 0;
//   };

//   // Handle product change
//   const handleProductChange = (productId) => {
//     const product = products.find(p => p._id === productId);
//     handleChange('product', productId);
    
//     // Auto-set unit from product if available
//     if (product && product.unit) {
//       handleChange('unit', product.unit);
//     }
//   };

//   // Handle quantity change with stock calculation
//   const handleQuantityChange = (value) => {
//     handleChange('quantity', value);
    
//     // Auto-update stock for new records based on activity
//     if (!record) {
//       if (formData.activity === 'Production') {
//         handleChange('stock', value);
//       } else if (formData.activity === 'Transfer') {
//         handleChange('stock', -value);
//       }
//     }
//   };

//   // Handle activity change with auto stock adjustment
//   const handleActivityChange = (activity) => {
//     handleChange('activity', activity);
    
//     // Auto-adjust stock sign based on activity for new records
//     if (!record && formData.quantity > 0) {
//       if (activity === 'Production') {
//         handleChange('stock', Math.abs(formData.stock));
//       } else if (activity === 'Transfer') {
//         handleChange('stock', -Math.abs(formData.stock));
//       }
//     }
//   };

//   const getDialogTitle = () => {
//     if (viewMode) {
//       return `View Production Record - ${record?.refNo || ''}`;
//     }
//     return record ? `Edit Production Record - ${record.refNo}` : 'Add New Production Record';
//   };

//   const getSubmitButtonText = () => {
//     if (loading) return 'Saving...';
//     return record ? 'Update Record' : 'Create Record';
//   };

//   return (
//     <Dialog 
//       open={open} 
//       onClose={onClose}
//       maxWidth="md"
//       fullWidth
//       PaperProps={{
//         component: 'form',
//         onSubmit: handleSubmit
//       }}
//     >
//       <DialogTitle sx={{ 
//         backgroundColor: 'primary.main', 
//         color: 'white',
//         display: 'flex',
//         alignItems: 'center',
//         gap: 1
//       }}>
//         {viewMode ? <Visibility /> : record ? <Edit /> : <Save />}
//         {getDialogTitle()}
//         {record && (
//           <Chip 
//             label={record.activity} 
//             size="small"
//             color={record.activity === 'Production' ? 'success' : 'primary'}
//             sx={{ ml: 2, color: 'white', backgroundColor: 'rgba(255,255,255,0.2)' }}
//           />
//         )}
//       </DialogTitle>

//       <DialogContent sx={{ p: 3 }}>
//         {formLoading && (
//           <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
//             <CircularProgress />
//           </Box>
//         )}

//         <Grid container spacing={3}>
//           {/* Date */}
//           <Grid item xs={12} sm={6}>
//             <TextField
//               fullWidth
//               label="Date"
//               type="date"
//               value={formData.date}
//               onChange={(e) => handleChange('date', e.target.value)}
//               error={!!errors.date}
//               helperText={errors.date}
//               disabled={viewMode}
//               InputLabelProps={{ shrink: true }}
//               required
//             />
//           </Grid>

//           {/* Activity */}
//           <Grid item xs={12} sm={6}>
//             <FormControl fullWidth error={!!errors.activity} disabled={viewMode}>
//               <InputLabel>Activity *</InputLabel>
//               <Select
//                 value={formData.activity}
//                 label="Activity *"
//                 onChange={(e) => handleActivityChange(e.target.value)}
//               >
//                 {activities.map((activity) => (
//                   <MenuItem key={activity} value={activity}>
//                     {activity}
//                   </MenuItem>
//                 ))}
//               </Select>
//               {errors.activity && (
//                 <Typography variant="caption" color="error">
//                   {errors.activity}
//                 </Typography>
//               )}
//             </FormControl>
//           </Grid>

//           {/* Product */}
//           <Grid item xs={12} sm={6}>
//             <FormControl fullWidth error={!!errors.product} disabled={viewMode}>
//               <InputLabel>Product *</InputLabel>
//               <Select
//                 value={formData.product}
//                 label="Product *"
//                 onChange={(e) => handleProductChange(e.target.value)}
//               >
//                 <MenuItem value="">
//                   <em>Select a product</em>
//                 </MenuItem>
//                 {products.map((product) => (
//                   <MenuItem key={product._id} value={product._id}>
//                     {product.name} ({product.code})
//                   </MenuItem>
//                 ))}
//               </Select>
//               {errors.product && (
//                 <Typography variant="caption" color="error">
//                   {errors.product}
//                 </Typography>
//               )}
//             </FormControl>
//           </Grid>

//           {/* Batch Number */}
//           <Grid item xs={12} sm={6}>
//             <TextField
//               fullWidth
//               label="Batch Number"
//               value={formData.batch}
//               onChange={(e) => handleChange('batch', e.target.value)}
//               error={!!errors.batch}
//               helperText={errors.batch}
//               disabled={viewMode}
//               required
//               placeholder="e.g., BATCH-001"
//             />
//           </Grid>

//           {/* Quantity and Unit */}
//           <Grid item xs={12} sm={6}>
//             <TextField
//               fullWidth
//               label="Quantity"
//               type="number"
//               value={formData.quantity}
//               onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)}
//               error={!!errors.quantity}
//               helperText={errors.quantity}
//               disabled={viewMode}
//               required
//               InputProps={{
//                 inputProps: { min: 0, step: 0.01 }
//               }}
//             />
//           </Grid>

//           <Grid item xs={12} sm={6}>
//             <FormControl fullWidth error={!!errors.unit} disabled={viewMode}>
//               <InputLabel>Unit *</InputLabel>
//               <Select
//                 value={formData.unit}
//                 label="Unit *"
//                 onChange={(e) => handleChange('unit', e.target.value)}
//               >
//                 {units.map((unit) => (
//                   <MenuItem key={unit} value={unit}>
//                     {unit}
//                   </MenuItem>
//                 ))}
//               </Select>
//               {errors.unit && (
//                 <Typography variant="caption" color="error">
//                   {errors.unit}
//                 </Typography>
//               )}
//             </FormControl>
//           </Grid>

//           {/* Stock */}
//           <Grid item xs={12} sm={6}>
//             <TextField
//               fullWidth
//               label="Stock"
//               type="number"
//               value={formData.stock}
//               onChange={(e) => handleChange('stock', parseFloat(e.target.value) || 0)}
//               error={!!errors.stock}
//               helperText={errors.stock || "Positive for production, negative for transfers"}
//               disabled={viewMode}
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     {formData.stock >= 0 ? '+' : ''}
//                   </InputAdornment>
//                 )
//               }}
//             />
//           </Grid>

//           {/* Reference Number */}
//           <Grid item xs={12} sm={6}>
//             <TextField
//               fullWidth
//               label="Reference Number"
//               value={formData.refNo}
//               onChange={(e) => handleChange('refNo', e.target.value)}
//               error={!!errors.refNo}
//               helperText={errors.refNo}
//               disabled={viewMode}
//               required
//               placeholder="e.g., PROD-001"
//             />
//           </Grid>

//           {/* Notes */}
//           <Grid item xs={12}>
//             <TextField
//               fullWidth
//               label="Notes"
//               multiline
//               rows={3}
//               value={formData.notes}
//               onChange={(e) => handleChange('notes', e.target.value)}
//               disabled={viewMode}
//               placeholder="Additional notes or comments..."
//             />
//           </Grid>

//           {/* Summary Info */}
//           {!viewMode && (
//             <Grid item xs={12}>
//               <Alert severity="info" sx={{ mt: 1 }}>
//                 <Typography variant="body2">
//                   <strong>Summary:</strong> {formData.activity} of {formData.quantity} {formData.unit} 
//                   {selectedProduct && ` for ${selectedProduct.name}`}
//                   {formData.batch && ` (Batch: ${formData.batch})`}
//                 </Typography>
//               </Alert>
//             </Grid>
//           )}

//           {/* View Mode Display */}
//           {viewMode && record && (
//             <Grid item xs={12}>
//               <Alert severity="info">
//                 <Typography variant="body2">
//                   <strong>Record Details:</strong> Created on {new Date(record.createdAt).toLocaleDateString()} • 
//                   Last updated: {new Date(record.updatedAt).toLocaleDateString()}
//                 </Typography>
//               </Alert>
//             </Grid>
//           )}
//         </Grid>
//       </DialogContent>

//       <DialogActions sx={{ p: 3, gap: 1 }}>
//         <Button
//           onClick={onClose}
//           disabled={loading}
//           startIcon={<Cancel />}
//         >
//           Cancel
//         </Button>
        
//         {!viewMode && (
//           <Button
//             type="submit"
//             variant="contained"
//             disabled={loading}
//             startIcon={loading ? <CircularProgress size={16} /> : <Save />}
//             sx={{ minWidth: 140 }}
//           >
//             {getSubmitButtonText()}
//           </Button>
//         )}
//       </DialogActions>
//     </Dialog>
//   );
// };

// export default ProductionForm;