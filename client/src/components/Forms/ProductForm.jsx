// import React, { useState, useEffect, useRef } from 'react';
// import {
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   Button,
//   Grid,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   Box,
//   Typography,
//   Divider,
//   Chip,
//   CircularProgress,
//   InputAdornment,
//   Alert,
//   Tooltip,
//   IconButton,
//   Collapse
// } from '@mui/material';
// import {
//   AttachMoney,
//   Inventory,
//   Speed,
//   Schedule,
//   TrendingUp,
//   TrendingDown,
//   CheckCircle,
//   Cancel,
//   Close,
//   Keyboard,
//   ShoppingCart,
//   ProductionQuantityLimits
// } from '@mui/icons-material';
// import axios from 'axios';

// const ProductForm = ({ open, onClose, product, viewMode, onSave, loading }) => {
//   const [formData, setFormData] = useState({
//     Product: '',
//     PackSize: '',
//     Unit: '',
//     ProductionCost: '',
//     SalesPrice: '',
//     ReorderQuantity: '',
//     MinimumStock: '',
//     MaximumStock: '',
//     MinimumLeadTime: '',
//     MaximumLeadTime: '',
//     Status: 'Active'
//   });

//   const [productCode, setProductCode] = useState('');
//   const [errors, setErrors] = useState({});
//   const [touched, setTouched] = useState({});
//   const [showShortcuts, setShowShortcuts] = useState(false);
//   const [checkingDuplicate, setCheckingDuplicate] = useState(false);
//   const [existingProducts, setExistingProducts] = useState([]);

//   // Refs for form fields to enable keyboard navigation
//   const fieldRefs = useRef({});
//   const formRef = useRef(null);

//   // Fetch existing products to check for duplicates
//   useEffect(() => {
//     const fetchExistingProducts = async () => {
//       try {
//         const response = await axios.get('http://localhost:5000/api/products?limit=1000');
//         setExistingProducts(response.data.data || response.data || []);
//       } catch (error) {
//         console.error('Error fetching products for duplicate check:', error);
//       }
//     };

//     if (open) {
//       fetchExistingProducts();
//     }
//   }, [open]);

//   // Initialize form when product prop changes
//   useEffect(() => {
//     if (product) {
//       // Parse product name to extract product code if it exists
//       const productName = product.Product || '';
//       let extractedCode = '';
//       let displayName = productName;
      
//       // Extract code from format: "Product Name / [CODE]"
//       const codeMatch = productName.match(/\/\s*\[([^\]]+)\]$/);
//       if (codeMatch) {
//         extractedCode = codeMatch[1];
//         displayName = productName.replace(/\s*\/\s*\[[^\]]+\]\s*$/, '').trim();
//       }
      
//       setFormData({
//         Product: displayName,
//         PackSize: product.PackSize || '',
//         Unit: product.Unit || '',
//         ProductionCost: product.ProductionCost || '',
//         SalesPrice: product.SalesPrice || '',
//         ReorderQuantity: product.ReorderQuantity || '',
//         MinimumStock: product.MinimumStock || '',
//         MaximumStock: product.MaximumStock || '',
//         MinimumLeadTime: product.MinimumLeadTime || '',
//         MaximumLeadTime: product.MaximumLeadTime || '',
//         Status: product.Status || 'Active'
//       });
//       setProductCode(extractedCode);
//     } else {
//       // Reset form for new product
//       setFormData({
//         Product: '',
//         PackSize: '',
//         Unit: '',
//         ProductionCost: '',
//         SalesPrice: '',
//         ReorderQuantity: '',
//         MinimumStock: '',
//         MaximumStock: '',
//         MinimumLeadTime: '',
//         MaximumLeadTime: '',
//         Status: 'Active'
//       });
//       setProductCode('');
//     }
//     setErrors({});
//     setTouched({});
//   }, [product, open]);

//   // Focus first field when form opens
//   useEffect(() => {
//     if (open && fieldRefs.current.Product) {
//       setTimeout(() => {
//         fieldRefs.current.Product.focus();
//       }, 100);
//     }
//   }, [open]);

//   // Updated status options based on model enum
//   const statusOptions = [
//     { value: 'Active', label: 'Active', color: 'success' },
//     { value: 'Inactive', label: 'Inactive', color: 'error' }
//   ];

//   // Field order for keyboard navigation
//   const fieldOrder = [
//     'Product', 'ProductCode', 'PackSize', 'Unit', 
//     'ProductionCost', 'SalesPrice', 'ReorderQuantity',
//     'MinimumStock', 'MaximumStock', 
//     'MinimumLeadTime', 'MaximumLeadTime', 'Status'
//   ];

//   // Enhanced keyboard navigation handler
//   const handleKeyDown = (event, fieldName) => {
//     // Enter key to move to next field (but not for textarea or when Ctrl/Cmd is pressed)
//     if (event.key === 'Enter' && !event.shiftKey) {
//       // Don't handle Enter if it's a form submission (Ctrl+Enter)
//       if (event.ctrlKey || event.metaKey) {
//         return;
//       }

//       event.preventDefault();
      
//       const currentIndex = fieldOrder.indexOf(fieldName);
//       if (currentIndex > -1 && currentIndex < fieldOrder.length - 1) {
//         const nextField = fieldOrder[currentIndex + 1];
//         if (fieldRefs.current[nextField]) {
//           fieldRefs.current[nextField].focus();
//         }
//       } else if (currentIndex === fieldOrder.length - 1) {
//         // If last field, focus the submit button
//         const submitButton = document.querySelector('[type="submit"]');
//         if (submitButton) {
//           submitButton.focus();
//         }
//       }
//     }

//     // Escape key to close dialog
//     if (event.key === 'Escape') {
//       event.preventDefault();
//       handleClose();
//     }

//     // Ctrl+Enter to submit form
//     if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
//       event.preventDefault();
//       if (!viewMode && isFormValid()) {
//         handleSubmit(event);
//       }
//     }

//     // Ctrl+Shift+H to toggle shortcuts help
//     if (event.ctrlKey && event.shiftKey && event.key === 'H') {
//       event.preventDefault();
//       setShowShortcuts(prev => !prev);
//     }
//   };

//   // Check if product code and name already exist
// const checkDuplicateProductCode = async (code) => {
//   if (!code.trim()) return false;

//   setCheckingDuplicate(true);
//   try {
//     // Normalize the new code by trimming whitespace
//     const normalizedCode = code.trim().toUpperCase();
//     const normalizedProductName = formData.Product.trim().toUpperCase();

//     // Check for duplicates in existing products
//     const isDuplicate = existingProducts.some(existingProduct => {
//       // Skip the current product when editing
//       if (product && existingProduct._id === product._id) {
//         return false;
//       }

//       // Extract the existing code and name
//       const existingCodeMatch = existingProduct.Product.match(/\/\s*\[([^\]]+)\]$/);
//       const existingProductName = existingProduct.Product.replace(/\/\s*\[([^\]]+)\]$/, '').trim().toUpperCase();

//       if (existingCodeMatch) {
//         const existingCode = existingCodeMatch[1].trim().toUpperCase();

//         // Check for exact matches of both the product name and the code
//         return existingProductName === normalizedProductName && existingCode === normalizedCode;
//       }
//       return false;
//     });

//     return isDuplicate;
//   } catch (error) {
//     console.error('Error checking duplicate product code:', error);
//     return false;
//   } finally {
//     setCheckingDuplicate(false);
//   }
// };

//   // Validation rules based on Product model
//   const validateField = async (name, value) => {
//     const newErrors = { ...errors };

//     switch (name) {
//       case 'Product':
//         if (!value.trim()) newErrors.Product = 'Product name is required';
//         else if (value.trim().length < 2) newErrors.Product = 'Product name must be at least 2 characters';
//         else if (value.trim().length > 100) newErrors.Product = 'Product name must be less than 100 characters';
//         else delete newErrors.Product;
//         break;

//       case 'ProductCode':
//         if (!value.trim()) {
//           newErrors.ProductCode = 'Product code is required';
//         } else if (value.trim().length > 10) {
//           newErrors.ProductCode = 'Product code must be less than 10 characters';
//         } else if (!/^[A-Z0-9]+$/.test(value)) {
//           newErrors.ProductCode = 'Product code can only contain uppercase letters and numbers';
//         } else {
//           // Check for duplicates
//           const isDuplicate = await checkDuplicateProductCode(value);
//           if (isDuplicate) {
//             newErrors.ProductCode = 'Product code already exists';
//           } else {
//             delete newErrors.ProductCode;
//           }
//         }
//         break;

//       case 'PackSize':
//         if (!value || value === '') newErrors.PackSize = 'Pack size is required';
//         else if (isNaN(value) || parseFloat(value) <= 0) newErrors.PackSize = 'Pack size must be a valid positive number';
//         else delete newErrors.PackSize;
//         break;

//       case 'Unit':
//         if (!value.trim()) newErrors.Unit = 'Unit is required';
//         else if (value.trim().length > 20) newErrors.Unit = 'Unit must be less than 20 characters';
//         else delete newErrors.Unit;
//         break;

//       case 'ProductionCost':
//         if (!value || value === '') newErrors.ProductionCost = 'Production cost is required';
//         else if (isNaN(value) || parseFloat(value) < 0) newErrors.ProductionCost = 'Production cost must be a valid positive number';
//         else delete newErrors.ProductionCost;
//         break;

//       case 'SalesPrice':
//         if (!value || value === '') newErrors.SalesPrice = 'Sales price is required';
//         else if (isNaN(value) || parseFloat(value) < 0) newErrors.SalesPrice = 'Sales price must be a valid positive number';
//         else if (parseFloat(value) <= parseFloat(formData.ProductionCost || 0)) {
//           newErrors.SalesPrice = 'Sales price must be higher than production cost';
//         } else delete newErrors.SalesPrice;
//         break;

//       case 'ReorderQuantity':
//         if (!value || value === '') newErrors.ReorderQuantity = 'Reorder quantity is required';
//         else if (isNaN(value) || parseInt(value) < 0) newErrors.ReorderQuantity = 'Reorder quantity must be a valid positive integer';
//         else delete newErrors.ReorderQuantity;
//         break;

//       case 'MinimumStock':
//         if (!value || value === '') newErrors.MinimumStock = 'Minimum stock is required';
//         else if (isNaN(value) || parseInt(value) < 0) newErrors.MinimumStock = 'Minimum stock must be a valid positive integer';
//         else if (parseInt(value) > 100000) newErrors.MinimumStock = 'Minimum stock cannot exceed 100,000 units';
//         else delete newErrors.MinimumStock;
//         break;

//       case 'MaximumStock':
//         if (!value || value === '') newErrors.MaximumStock = 'Maximum stock is required';
//         else if (isNaN(value) || parseInt(value) < 0) newErrors.MaximumStock = 'Maximum stock must be a valid positive integer';
//         else if (parseInt(value) > 100000) newErrors.MaximumStock = 'Maximum stock cannot exceed 100,000 units';
//         else if (parseInt(value) <= parseInt(formData.MinimumStock || 0)) {
//           newErrors.MaximumStock = 'Maximum stock must be greater than minimum stock';
//         } else delete newErrors.MaximumStock;
//         break;

//       case 'MinimumLeadTime':
//         if (!value || value === '') newErrors.MinimumLeadTime = 'Minimum lead time is required';
//         else if (isNaN(value) || parseInt(value) < 0) newErrors.MinimumLeadTime = 'Minimum lead time must be a valid positive number';
//         else if (parseInt(value) > 365) newErrors.MinimumLeadTime = 'Minimum lead time cannot exceed 365 days';
//         else delete newErrors.MinimumLeadTime;
//         break;

//       case 'MaximumLeadTime':
//         if (!value || value === '') newErrors.MaximumLeadTime = 'Maximum lead time is required';
//         else if (isNaN(value) || parseInt(value) < 0) newErrors.MaximumLeadTime = 'Maximum lead time must be a valid positive number';
//         else if (parseInt(value) > 365) newErrors.MaximumLeadTime = 'Maximum lead time cannot exceed 365 days';
//         else if (parseInt(value) <= parseInt(formData.MinimumLeadTime || 0)) {
//           newErrors.MaximumLeadTime = 'Maximum lead time must be greater than minimum lead time';
//         } else delete newErrors.MaximumLeadTime;
//         break;

//       default:
//         break;
//     }

//     setErrors(newErrors);
//   };

//   const handleChange = (field) => (event) => {
//     const value = event.target.value;
//     setFormData(prev => ({
//       ...prev,
//       [field]: value
//     }));

//     // Validate the field if it's been touched
//     if (touched[field]) {
//       validateField(field, value);
//     }

//     // Special validation for SalesPrice when ProductionCost changes and vice versa
//     if (field === 'ProductionCost' && touched.SalesPrice) {
//       validateField('SalesPrice', formData.SalesPrice);
//     }
//     if (field === 'SalesPrice' && touched.ProductionCost) {
//       validateField('ProductionCost', formData.ProductionCost);
//     }
//   };

//   const handleProductCodeChange = (event) => {
//     const value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
//     setProductCode(value);

//     // Validate the field if it's been touched
//     if (touched.ProductCode) {
//       validateField('ProductCode', value);
//     }
//   };

//   const handleBlur = (field) => (event) => {
//     setTouched(prev => ({
//       ...prev,
//       [field]: true
//     }));
//     if (field === 'ProductCode') {
//       validateField(field, productCode);
//     } else {
//       validateField(field, formData[field]);
//     }
//   };

//   // Check if form is valid
//   const isFormValid = () => {
//     const hasRequiredFields = 
//       formData.Product &&
//       productCode &&
//       formData.PackSize &&
//       formData.Unit &&
//       formData.ProductionCost &&
//       formData.SalesPrice &&
//       formData.ReorderQuantity &&
//       formData.MinimumStock &&
//       formData.MaximumStock &&
//       formData.MinimumLeadTime &&
//       formData.MaximumLeadTime;

//     const noErrors = Object.keys(errors).length === 0;

//     return hasRequiredFields && noErrors;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     // Mark all fields as touched to show errors
//     const allTouched = {};
//     [...Object.keys(formData), 'ProductCode'].forEach(key => {
//       allTouched[key] = true;
//     });
//     setTouched(allTouched);

//     // Validate all fields
//     for (const key of Object.keys(formData)) {
//       await validateField(key, formData[key]);
//     }
//     await validateField('ProductCode', productCode);

//     // Final duplicate check before submitting
//     if (productCode) {
//       const isDuplicate = await checkDuplicateProductCode(productCode);
//       if (isDuplicate) {
//         setErrors(prev => ({
//           ...prev,
//           ProductCode: 'Product code already exists'
//         }));
//         return;
//       }
//     }

//     if (isFormValid()) {
//       // Combine product name and code in the required format: "Product Name / [CODE]"
//       const combinedProductName = `${formData.Product.trim()} / [${productCode.trim()}]`;
      
//       // Convert numeric fields to numbers
//       const submitData = {
//         Product: combinedProductName,
//         PackSize: parseFloat(formData.PackSize),
//         Unit: formData.Unit.trim(),
//         ProductionCost: parseFloat(formData.ProductionCost),
//         SalesPrice: parseFloat(formData.SalesPrice),
//         ReorderQuantity: parseInt(formData.ReorderQuantity),
//         MinimumStock: parseInt(formData.MinimumStock),
//         MaximumStock: parseInt(formData.MaximumStock),
//         MinimumLeadTime: parseInt(formData.MinimumLeadTime),
//         MaximumLeadTime: parseInt(formData.MaximumLeadTime),
//         Status: formData.Status
//       };
      
//       onSave(submitData);
//     }
//   };

//   const handleClose = () => {
//     onClose();
//   };

//   // Calculate derived values for display
//   const stockRange = formData.MaximumStock && formData.MinimumStock 
//     ? parseInt(formData.MaximumStock) - parseInt(formData.MinimumStock)
//     : 0;

//   const leadTimeRange = formData.MaximumLeadTime && formData.MinimumLeadTime
//     ? parseInt(formData.MaximumLeadTime) - parseInt(formData.MinimumLeadTime)
//     : 0;

//   // Calculate profit and margin
//   const profit = formData.SalesPrice && formData.ProductionCost
//     ? parseFloat(formData.SalesPrice) - parseFloat(formData.ProductionCost)
//     : 0;

//   const profitMargin = formData.SalesPrice && profit > 0
//     ? (profit / parseFloat(formData.SalesPrice)) * 100
//     : 0;

//   // Common pack size and unit suggestions
//   const packSizeSuggestions = ['1', '5', '10', '25', '50', '100', '250', '500', '1000'];
//   const unitSuggestions = ['Pcs', 'Kg', 'g', 'L', 'ml', 'Box', 'Packet', 'Roll', 'Meter', 'Yard', 'Liter', 'Gallon', 'Ton'];

//   // Set ref for a field
//   const setFieldRef = (field) => (el) => {
//     fieldRefs.current[field] = el;
//   };

//   // Get status icon
//   const getStatusIcon = (status) => {
//     switch (status) {
//       case 'Active': return <CheckCircle color="success" fontSize="small" />;
//       case 'Inactive': return <Cancel color="error" fontSize="small" />;
//       default: return <CheckCircle color="success" fontSize="small" />;
//     }
//   };

//   // Format currency
//   const formatCurrency = (amount) => {
//     return `ETB ${amount ? parseFloat(amount).toLocaleString() : '0'}`;
//   };

//   return (
//     <Dialog 
//       open={open} 
//       onClose={handleClose} 
//       maxWidth="md" 
//       fullWidth
//       PaperProps={{
//         sx: { 
//           borderRadius: 2,
//           maxHeight: '95vh'
//         }
//       }}
//       onKeyDown={(e) => {
//         // Global Escape key handler for the dialog
//         if (e.key === 'Escape' && !loading) {
//           handleClose();
//         }
//         // Ctrl+Shift+H to toggle shortcuts
//         if (e.ctrlKey && e.shiftKey && e.key === 'H') {
//           e.preventDefault();
//           setShowShortcuts(prev => !prev);
//         }
//       }}
//     >
//       <DialogTitle sx={{ 
//         backgroundColor: 'primary.main', 
//         color: 'white',
//         py: 2,
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'space-between'
//       }}>
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//           <Inventory sx={{ fontSize: 24 }} />
//           <Box>
//             <Typography variant="h6" component="div" fontWeight="bold">
//               {viewMode ? 'View Product' : product ? 'Edit Product' : 'Add New Product'}
//             </Typography>
//             <Typography variant="caption" sx={{ opacity: 0.9 }}>
//               {viewMode ? 'Product details' : product ? 'Update product information' : 'Create new product entry'}
//             </Typography>
//           </Box>
//         </Box>
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//           <Tooltip title="Keyboard Shortcuts (Ctrl+Shift+H)" arrow>
//             <IconButton 
//               size="small" 
//               sx={{ color: 'white' }}
//               onClick={() => setShowShortcuts(prev => !prev)}
//             >
//               <Keyboard />
//             </IconButton>
//           </Tooltip>
//           <IconButton 
//             size="small" 
//             sx={{ color: 'white' }}
//             onClick={handleClose}
//             disabled={loading}
//           >
//             <Close />
//           </IconButton>
//         </Box>
//       </DialogTitle>

//       {/* Compact Keyboard Shortcuts Help */}
//       <Collapse in={showShortcuts}>
//         <Box sx={{ p: 1, backgroundColor: 'primary.light', color: 'white' }}>
//           <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontSize: '0.65rem' }}>
//             <strong>Keyboard Shortcuts:</strong>
//           </Typography>
//           <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, fontSize: '0.6rem' }}>
//             <Chip label="Enter" size="small" variant="outlined" sx={{ color: 'white', borderColor: 'white', height: 18, fontSize: '0.55rem' }} /> Next field •
//             <Chip label="Ctrl+Enter" size="small" variant="outlined" sx={{ color: 'white', borderColor: 'white', height: 18, fontSize: '0.55rem' }} /> Save •
//             <Chip label="Escape" size="small" variant="outlined" sx={{ color: 'white', borderColor: 'white', height: 18, fontSize: '0.55rem' }} /> Close •
//             <Chip label="Ctrl+Shift+H" size="small" variant="outlined" sx={{ color: 'white', borderColor: 'white', height: 18, fontSize: '0.55rem' }} /> Toggle help
//           </Box>
//         </Box>
//       </Collapse>

//       <form onSubmit={handleSubmit} ref={formRef}>
//         <DialogContent sx={{ p: 2, '& .MuiFormControl-root': { mb: 1 } }}>
//           {/* Basic Information Section */}
//           <Box sx={{ mb: 2 }}>
//             <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 'bold' }}>
//               <Inventory fontSize="small" />
//               Basic Information
//             </Typography>
//             <Grid container spacing={1.5}>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   size="small"
//                   label="Product Name"
//                   value={formData.Product}
//                   onChange={handleChange('Product')}
//                   onBlur={handleBlur('Product')}
//                   onKeyDown={(e) => handleKeyDown(e, 'Product')}
//                   error={touched.Product && !!errors.Product}
//                   helperText={touched.Product && errors.Product}
//                   disabled={viewMode}
//                   required
//                   inputRef={setFieldRef('Product')}
//                   placeholder="e.g., Cement, Steel Rods"
//                 />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   size="small"
//                   label="Product Code"
//                   value={productCode}
//                   onChange={handleProductCodeChange}
//                   onBlur={handleBlur('ProductCode')}
//                   onKeyDown={(e) => handleKeyDown(e, 'ProductCode')}
//                   error={touched.ProductCode && !!errors.ProductCode}
//                   helperText={touched.ProductCode && errors.ProductCode}
//                   disabled={viewMode}
//                   required
//                   inputRef={setFieldRef('ProductCode')}
//                   placeholder="e.g., CEM, STR"
//                   InputProps={{
//                     endAdornment: checkingDuplicate ? (
//                       <InputAdornment position="end">
//                         <CircularProgress size={16} />
//                       </InputAdornment>
//                     ) : null,
//                     inputProps: { 
//                       style: { textTransform: 'uppercase' },
//                       maxLength: 10,
//                       pattern: '[A-Z0-9]*'
//                     }
//                   }}
//                 />
//               </Grid>
//               <Grid item xs={12}>
//                 <Box sx={{ p: 1, backgroundColor: 'info.light', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
//                   <Typography variant="caption" fontWeight="bold" display="block" gutterBottom color="info.dark">
//                     Product Name Preview:
//                   </Typography>
//                   <Typography variant="body2" color="info.dark">
//                     {formData.Product && productCode 
//                       ? `${formData.Product} / [${productCode}]`
//                       : 'Enter product name and code to see preview'
//                     }
//                   </Typography>
//                 </Box>
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   size="small"
//                   label="Pack Size"
//                   type="number"
//                   value={formData.PackSize}
//                   onChange={handleChange('PackSize')}
//                   onBlur={handleBlur('PackSize')}
//                   onKeyDown={(e) => handleKeyDown(e, 'PackSize')}
//                   error={touched.PackSize && !!errors.PackSize}
//                   helperText={touched.PackSize && errors.PackSize}
//                   disabled={viewMode}
//                   required
//                   inputRef={setFieldRef('PackSize')}
//                   InputProps={{
//                     inputProps: { min: 0, step: 0.01 }
//                   }}
//                 />
//                 <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
//                   {packSizeSuggestions.slice(0, 6).map((size) => (
//                     <Chip
//                       key={size}
//                       label={size}
//                       size="small"
//                       variant="outlined"
//                       onClick={() => !viewMode && handleChange('PackSize')({ target: { value: size } })}
//                       sx={{ cursor: viewMode ? 'default' : 'pointer', height: 20, fontSize: '0.6rem' }}
//                     />
//                   ))}
//                 </Box>
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   size="small"
//                   label="Unit"
//                   value={formData.Unit}
//                   onChange={handleChange('Unit')}
//                   onBlur={handleBlur('Unit')}
//                   onKeyDown={(e) => handleKeyDown(e, 'Unit')}
//                   error={touched.Unit && !!errors.Unit}
//                   helperText={touched.Unit && errors.Unit}
//                   disabled={viewMode}
//                   required
//                   inputRef={setFieldRef('Unit')}
//                 />
//                 <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
//                   {unitSuggestions.slice(0, 6).map((unit) => (
//                     <Chip
//                       key={unit}
//                       label={unit}
//                       size="small"
//                       variant="outlined"
//                       onClick={() => !viewMode && handleChange('Unit')({ target: { value: unit } })}
//                       sx={{ cursor: viewMode ? 'default' : 'pointer', height: 20, fontSize: '0.6rem' }}
//                     />
//                   ))}
//                 </Box>
//               </Grid>
//             </Grid>
//           </Box>

//           <Divider sx={{ my: 1.5 }} />

//           {/* Pricing Section */}
//           <Box sx={{ mb: 2 }}>
//             <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 'bold' }}>
//               <AttachMoney fontSize="small" />
//               Pricing & Profit
//             </Typography>
//             <Grid container spacing={1.5}>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   size="small"
//                   label="Production Cost (ETB)"
//                   type="number"
//                   value={formData.ProductionCost}
//                   onChange={handleChange('ProductionCost')}
//                   onBlur={handleBlur('ProductionCost')}
//                   onKeyDown={(e) => handleKeyDown(e, 'ProductionCost')}
//                   error={touched.ProductionCost && !!errors.ProductionCost}
//                   helperText={touched.ProductionCost && errors.ProductionCost}
//                   disabled={viewMode}
//                   required
//                   inputRef={setFieldRef('ProductionCost')}
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <AttachMoney color="action" fontSize="small" />
//                       </InputAdornment>
//                     ),
//                     inputProps: { min: 0, step: 0.01 }
//                   }}
//                 />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   size="small"
//                   label="Sales Price (ETB)"
//                   type="number"
//                   value={formData.SalesPrice}
//                   onChange={handleChange('SalesPrice')}
//                   onBlur={handleBlur('SalesPrice')}
//                   onKeyDown={(e) => handleKeyDown(e, 'SalesPrice')}
//                   error={touched.SalesPrice && !!errors.SalesPrice}
//                   helperText={touched.SalesPrice && errors.SalesPrice}
//                   disabled={viewMode}
//                   required
//                   inputRef={setFieldRef('SalesPrice')}
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <ShoppingCart color="action" fontSize="small" />
//                       </InputAdornment>
//                     ),
//                     inputProps: { min: 0, step: 0.01 }
//                   }}
//                 />
//               </Grid>
//             </Grid>

//             {/* Profit Calculation Display */}
//             {formData.ProductionCost && formData.SalesPrice && (
//               <Box sx={{ mt: 1, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
//                 <Grid container spacing={1}>
//                   <Grid item xs={4}>
//                     <Typography variant="caption" display="block" color="text.secondary">
//                       Profit
//                     </Typography>
//                     <Typography variant="body2" fontWeight="bold" color={profit >= 0 ? 'success.main' : 'error.main'}>
//                       {formatCurrency(profit)}
//                     </Typography>
//                   </Grid>
//                   <Grid item xs={4}>
//                     <Typography variant="caption" display="block" color="text.secondary">
//                       Margin
//                     </Typography>
//                     <Typography variant="body2" fontWeight="bold" color={profitMargin >= 20 ? 'success.main' : profitMargin >= 10 ? 'warning.main' : 'error.main'}>
//                       {profitMargin.toFixed(1)}%
//                     </Typography>
//                   </Grid>
//                   <Grid item xs={4}>
//                     <Typography variant="caption" display="block" color="text.secondary">
//                       Markup
//                     </Typography>
//                     <Typography variant="body2" fontWeight="bold">
//                       {formData.ProductionCost ? ((profit / parseFloat(formData.ProductionCost)) * 100).toFixed(1) : '0'}%
//                     </Typography>
//                   </Grid>
//                 </Grid>
//               </Box>
//             )}
//           </Box>

//           <Divider sx={{ my: 1.5 }} />

//           {/* Inventory Management Section */}
//           <Box sx={{ mb: 2 }}>
//             <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 'bold' }}>
//               <ProductionQuantityLimits fontSize="small" />
//               Inventory Management
//             </Typography>
            
//             <Grid container spacing={1.5}>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   size="small"
//                   label="Reorder Quantity"
//                   type="number"
//                   value={formData.ReorderQuantity}
//                   onChange={handleChange('ReorderQuantity')}
//                   onBlur={handleBlur('ReorderQuantity')}
//                   onKeyDown={(e) => handleKeyDown(e, 'ReorderQuantity')}
//                   error={touched.ReorderQuantity && !!errors.ReorderQuantity}
//                   helperText={touched.ReorderQuantity && errors.ReorderQuantity}
//                   disabled={viewMode}
//                   required
//                   inputRef={setFieldRef('ReorderQuantity')}
//                   InputProps={{
//                     inputProps: { min: 0 }
//                   }}
//                 />
//               </Grid>
//             </Grid>

//             {/* Stock Levels */}
//             <Box sx={{ mt: 2 }}>
//               <Typography variant="body2" gutterBottom color="text.secondary" fontWeight="medium">
//                 Stock Levels (Units)
//               </Typography>
//               <Grid container spacing={1.5}>
//                 <Grid item xs={12} sm={6}>
//                   <TextField
//                     fullWidth
//                     size="small"
//                     label="Minimum Stock"
//                     type="number"
//                     value={formData.MinimumStock}
//                     onChange={handleChange('MinimumStock')}
//                     onBlur={handleBlur('MinimumStock')}
//                     onKeyDown={(e) => handleKeyDown(e, 'MinimumStock')}
//                     error={touched.MinimumStock && !!errors.MinimumStock}
//                     helperText={touched.MinimumStock && errors.MinimumStock}
//                     disabled={viewMode}
//                     required
//                     inputRef={setFieldRef('MinimumStock')}
//                     InputProps={{
//                       startAdornment: (
//                         <InputAdornment position="start">
//                           <TrendingDown color="action" fontSize="small" />
//                         </InputAdornment>
//                       ),
//                       inputProps: { min: 0, max: 100000 }
//                     }}
//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <TextField
//                     fullWidth
//                     size="small"
//                     label="Maximum Stock"
//                     type="number"
//                     value={formData.MaximumStock}
//                     onChange={handleChange('MaximumStock')}
//                     onBlur={handleBlur('MaximumStock')}
//                     onKeyDown={(e) => handleKeyDown(e, 'MaximumStock')}
//                     error={touched.MaximumStock && !!errors.MaximumStock}
//                     helperText={touched.MaximumStock && errors.MaximumStock}
//                     disabled={viewMode}
//                     required
//                     inputRef={setFieldRef('MaximumStock')}
//                     InputProps={{
//                       startAdornment: (
//                         <InputAdornment position="start">
//                           <TrendingUp color="action" fontSize="small" />
//                         </InputAdornment>
//                       ),
//                       inputProps: { min: 0, max: 100000 }
//                     }}
//                   />
//                 </Grid>
//               </Grid>
//               {formData.MinimumStock && formData.MaximumStock && (
//                 <Box sx={{ mt: 1 }}>
//                   <Chip 
//                     label={`Stock Range: ${stockRange} units`}
//                     variant="outlined"
//                     color={stockRange > 0 ? "info" : "error"}
//                     size="small"
//                     sx={{ height: 20, fontSize: '0.6rem' }}
//                   />
//                 </Box>
//               )}
//             </Box>
//           </Box>

//           <Divider sx={{ my: 1.5 }} />

//           {/* Lead Time Section */}
//           <Box sx={{ mb: 2 }}>
//             <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 'bold' }}>
//               <Schedule fontSize="small" />
//               Lead Time (Days)
//             </Typography>
//             <Grid container spacing={1.5}>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   size="small"
//                   label="Minimum Lead Time"
//                   type="number"
//                   value={formData.MinimumLeadTime}
//                   onChange={handleChange('MinimumLeadTime')}
//                   onBlur={handleBlur('MinimumLeadTime')}
//                   onKeyDown={(e) => handleKeyDown(e, 'MinimumLeadTime')}
//                   error={touched.MinimumLeadTime && !!errors.MinimumLeadTime}
//                   helperText={touched.MinimumLeadTime && errors.MinimumLeadTime}
//                   disabled={viewMode}
//                   required
//                   inputRef={setFieldRef('MinimumLeadTime')}
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <Schedule color="action" fontSize="small" />
//                       </InputAdornment>
//                     ),
//                     inputProps: { min: 0, max: 365 }
//                   }}
//                 />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   size="small"
//                   label="Maximum Lead Time"
//                   type="number"
//                   value={formData.MaximumLeadTime}
//                   onChange={handleChange('MaximumLeadTime')}
//                   onBlur={handleBlur('MaximumLeadTime')}
//                   onKeyDown={(e) => handleKeyDown(e, 'MaximumLeadTime')}
//                   error={touched.MaximumLeadTime && !!errors.MaximumLeadTime}
//                   helperText={touched.MaximumLeadTime && errors.MaximumLeadTime}
//                   disabled={viewMode}
//                   required
//                   inputRef={setFieldRef('MaximumLeadTime')}
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <Schedule color="action" fontSize="small" />
//                       </InputAdornment>
//                     ),
//                     inputProps: { min: 0, max: 365 }
//                   }}
//                 />
//               </Grid>
//             </Grid>
//             {formData.MinimumLeadTime && formData.MaximumLeadTime && (
//               <Box sx={{ mt: 1 }}>
//                 <Chip 
//                   label={`Lead Time Range: ${leadTimeRange} days`}
//                   variant="outlined"
//                   color={leadTimeRange > 0 ? "info" : "error"}
//                   size="small"
//                   sx={{ height: 20, fontSize: '0.6rem' }}
//                 />
//               </Box>
//             )}
//           </Box>

//           <Divider sx={{ my: 1.5 }} />

//           {/* Status Section */}
//           <Box sx={{ mb: 2 }}>
//             <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 'bold' }}>
//               {getStatusIcon(formData.Status)}
//               Status
//             </Typography>
//             <Grid container spacing={1.5}>
//               <Grid item xs={12}>
//                 <FormControl fullWidth size="small">
//                   <InputLabel>Status</InputLabel>
//                   <Select
//                     value={formData.Status}
//                     label="Status"
//                     onChange={handleChange('Status')}
//                     onKeyDown={(e) => handleKeyDown(e, 'Status')}
//                     disabled={viewMode}
//                     inputRef={setFieldRef('Status')}
//                   >
//                     {statusOptions.map((option) => (
//                       <MenuItem key={option.value} value={option.value}>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                           {getStatusIcon(option.value)}
//                           {option.label}
//                         </Box>
//                       </MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </Grid>
//             </Grid>
//           </Box>

//           {/* Product Name Information */}
//           <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
//             <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
//               📋 Product Name Format:
//             </Typography>
//             <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
//               • Product name and code will be combined as: <strong>Product Name / [CODE]</strong><br/>
//               • Example: <strong>Cement Bags / [CEM]</strong> or <strong>Steel Rods / [STR]</strong><br/>
//               • Product code will be automatically converted to uppercase<br/>
//               • <strong>Duplicate product codes are not allowed</strong>
//             </Typography>
//           </Box>

//           {/* Validation Summary */}
//           {Object.keys(errors).length > 0 && (
//             <Alert severity="error" sx={{ mt: 1.5 }} size="small">
//               Product Code Duplication is Restricted!!!
//             </Alert>
//           )}
//         </DialogContent>

//         <DialogActions sx={{ p: 2, gap: 1 }}>
//           <Button 
//             onClick={handleClose}
//             disabled={loading}
//             variant="outlined"
//             size="small"
//             startIcon={<Close />}
//           >
//             Cancel (Esc)
//           </Button>
//           {!viewMode && (
//             <Button 
//               type="submit"
//               variant="contained"
//               disabled={loading || !isFormValid() || checkingDuplicate}
//               startIcon={loading ? <CircularProgress size={16} /> : null}
//               size="small"
//               sx={{ minWidth: 100 }}
//             >
//               {loading ? 'Saving...' : product ? 'Update' : 'Save (Ctrl+Enter)'}
//             </Button>
//           )}
//         </DialogActions>
//       </form>
//     </Dialog>
//   );
// };

// export default ProductForm;