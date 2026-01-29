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
//   Code
// } from '@mui/icons-material';
// import axios from 'axios';

// const MaterialForm2 = ({ open, onClose, material, viewMode, onSave, loading }) => {
//   const [formData, setFormData] = useState({
//     Material: '',
//     MaterialCode: '',
//     PackSize: '',
//     Unit: '',
//     UnitPrice: '',
//     ReorderQuantity: '',
//     MinimumConsumption: '',
//     MaximumConsumption: '',
//     MinimumLeadTime: '',
//     MaximumLeadTime: '',
//     Status: 'Active'
//   });

//   const [errors, setErrors] = useState({});
//   const [touched, setTouched] = useState({});
//   const [showShortcuts, setShowShortcuts] = useState(false);
//   const [checkingDuplicate, setCheckingDuplicate] = useState(false);
//   const [existingMaterials, setExistingMaterials] = useState([]);

//   // Refs for form fields to enable keyboard navigation
//   const fieldRefs = useRef({});
//   const formRef = useRef(null);

//   // Fetch existing materials to check for duplicates
//   useEffect(() => {
//     const fetchExistingMaterials = async () => {
//       try {
//         const response = await axios.get('http://localhost:5000/api/materials?limit=1000');
//         setExistingMaterials(response.data.data || response.data || []);
//       } catch (error) {
//         console.error('Error fetching materials for duplicate check:', error);
//       }
//     };

//     if (open) {
//       fetchExistingMaterials();
//     }
//   }, [open]);

//   // Initialize form when material prop changes - UPDATED for Material2 model
//   useEffect(() => {
//     if (material) {
//       setFormData({
//         Material: material.Material || '',
//         MaterialCode: material.MaterialCode || '',
//         PackSize: material.PackSize || '',
//         Unit: material.Unit || '',
//         UnitPrice: material.UnitPrice || '',
//         ReorderQuantity: material.ReorderQuantity || '',
//         MinimumConsumption: material.MinimumConsumption || '',
//         MaximumConsumption: material.MaximumConsumption || '',
//         MinimumLeadTime: material.MinimumLeadTime || '',
//         MaximumLeadTime: material.MaximumLeadTime || '',
//         Status: material.Status || 'Active'
//       });
//     } else {
//       // Reset form for new material
//       setFormData({
//         Material: '',
//         MaterialCode: '',
//         PackSize: '',
//         Unit: '',
//         UnitPrice: '',
//         ReorderQuantity: '',
//         MinimumConsumption: '',
//         MaximumConsumption: '',
//         MinimumLeadTime: '',
//         MaximumLeadTime: '',
//         Status: 'Active'
//       });
//     }
//     setErrors({});
//     setTouched({});
//   }, [material, open]);

//   // Focus first field when form opens
//   useEffect(() => {
//     if (open && fieldRefs.current.Material) {
//       setTimeout(() => {
//         fieldRefs.current.Material.focus();
//       }, 100);
//     }
//   }, [open]);

//   // Updated status options based on model enum
//   const statusOptions = [
//     { value: 'Active', label: 'Active', color: 'success' },
//     { value: 'Inactive', label: 'Inactive', color: 'error' }
//   ];

//   // Field order for keyboard navigation - UPDATED with MaterialCode
//   const fieldOrder = [
//     'Material', 'MaterialCode', 'PackSize', 'Unit', 
//     'UnitPrice', 'ReorderQuantity',
//     'MinimumConsumption', 'MaximumConsumption', 
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

//   // Check if material code already exists - UPDATED for Material2 model
//   const checkDuplicateMaterialCode = async (code) => {
//     if (!code.trim()) return false;
    
//     setCheckingDuplicate(true);
//     try {
//       const isDuplicate = existingMaterials.some(existingMaterial => {
//         // Skip the current material when editing
//         if (material && existingMaterial._id === material._id) {
//           return false;
//         }
        
//         // Check if material code matches (case insensitive)
//         return existingMaterial.MaterialCode?.toUpperCase() === code.toUpperCase();
//       });

//       return isDuplicate;
//     } catch (error) {
//       console.error('Error checking duplicate material code:', error);
//       return false;
//     } finally {
//       setCheckingDuplicate(false);
//     }
//   };

//   // Check if material name already exists - NEW for Material2 model
//   const checkDuplicateMaterialName = async (name) => {
//     if (!name.trim()) return false;
    
//     try {
//       const isDuplicate = existingMaterials.some(existingMaterial => {
//         // Skip the current material when editing
//         if (material && existingMaterial._id === material._id) {
//           return false;
//         }
        
//         // Check if material name matches (case insensitive)
//         return existingMaterial.Material?.toUpperCase() === name.toUpperCase();
//       });

//       return isDuplicate;
//     } catch (error) {
//       console.error('Error checking duplicate material name:', error);
//       return false;
//     }
//   };

//   // Validation rules based on Material2 model - UPDATED
//   const validateField = async (name, value) => {
//     const newErrors = { ...errors };

//     switch (name) {
//       case 'Material':
//         if (!value.trim()) {
//           newErrors.Material = 'Material name is required';
//         } else if (value.trim().length < 2) {
//           newErrors.Material = 'Material name must be at least 2 characters';
//         } else if (value.trim().length > 100) {
//           newErrors.Material = 'Material name must be less than 100 characters';
//         } else {
//           // Check for duplicates
//           const isDuplicate = await checkDuplicateMaterialName(value);
//           if (isDuplicate) {
//             newErrors.Material = 'Material name already exists';
//           } else {
//             delete newErrors.Material;
//           }
//         }
//         break;

//       case 'MaterialCode':
//         if (!value.trim()) {
//           newErrors.MaterialCode = 'Material code is required';
//         } else if (value.trim().length > 20) {
//           newErrors.MaterialCode = 'Material code must be less than 20 characters';
//         } else if (!/^[A-Z0-9\-_]+$/.test(value)) {
//           newErrors.MaterialCode = 'Material code can only contain uppercase letters, numbers, hyphens, and underscores';
//         } else {
//           // Check for duplicates
//           const isDuplicate = await checkDuplicateMaterialCode(value);
//           if (isDuplicate) {
//             newErrors.MaterialCode = 'Material code already exists';
//           } else {
//             delete newErrors.MaterialCode;
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

//       case 'UnitPrice':
//         if (!value || value === '') newErrors.UnitPrice = 'Unit price is required';
//         else if (isNaN(value) || parseFloat(value) < 0) newErrors.UnitPrice = 'Unit price must be a valid positive number';
//         else delete newErrors.UnitPrice;
//         break;

//       case 'ReorderQuantity':
//         if (!value || value === '') newErrors.ReorderQuantity = 'Reorder quantity is required';
//         else if (isNaN(value) || parseInt(value) < 0) newErrors.ReorderQuantity = 'Reorder quantity must be a valid positive integer';
//         else delete newErrors.ReorderQuantity;
//         break;

//       case 'MinimumConsumption':
//         if (!value || value === '') newErrors.MinimumConsumption = 'Minimum consumption is required';
//         else if (isNaN(value) || parseFloat(value) < 0) newErrors.MinimumConsumption = 'Minimum consumption must be a valid positive number';
//         else if (parseFloat(value) > 100000) newErrors.MinimumConsumption = 'Minimum consumption cannot exceed 100,000 units/week';
//         else delete newErrors.MinimumConsumption;
//         break;

//       case 'MaximumConsumption':
//         if (!value || value === '') newErrors.MaximumConsumption = 'Maximum consumption is required';
//         else if (isNaN(value) || parseFloat(value) < 0) newErrors.MaximumConsumption = 'Maximum consumption must be a valid positive number';
//         else if (parseFloat(value) > 100000) newErrors.MaximumConsumption = 'Maximum consumption cannot exceed 100,000 units/week';
//         else if (parseFloat(value) <= parseFloat(formData.MinimumConsumption || 0)) {
//           newErrors.MaximumConsumption = 'Maximum consumption must be greater than minimum consumption';
//         } else delete newErrors.MaximumConsumption;
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
    
//     // Special handling for MaterialCode - auto uppercase and restrict characters
//     if (field === 'MaterialCode') {
//       const processedValue = value.toUpperCase().replace(/[^A-Z0-9\-_]/g, '');
//       setFormData(prev => ({
//         ...prev,
//         [field]: processedValue
//       }));

//       // Validate the field if it's been touched
//       if (touched[field]) {
//         validateField(field, processedValue);
//       }
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         [field]: value
//       }));

//       // Validate the field if it's been touched
//       if (touched[field]) {
//         validateField(field, value);
//       }
//     }
//   };

//   const handleBlur = (field) => (event) => {
//     setTouched(prev => ({
//       ...prev,
//       [field]: true
//     }));
//     validateField(field, formData[field]);
//   };

//   // Check if form is valid - UPDATED for Material2 model
//   const isFormValid = () => {
//     const hasRequiredFields = 
//       formData.Material &&
//       formData.MaterialCode &&
//       formData.PackSize &&
//       formData.Unit &&
//       formData.UnitPrice &&
//       formData.ReorderQuantity &&
//       formData.MinimumConsumption &&
//       formData.MaximumConsumption &&
//       formData.MinimumLeadTime &&
//       formData.MaximumLeadTime;

//     const noErrors = Object.keys(errors).length === 0;

//     return hasRequiredFields && noErrors;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     // Mark all fields as touched to show errors
//     const allTouched = {};
//     Object.keys(formData).forEach(key => {
//       allTouched[key] = true;
//     });
//     setTouched(allTouched);

//     // Validate all fields
//     for (const key of Object.keys(formData)) {
//       await validateField(key, formData[key]);
//     }

//     // Final duplicate checks before submitting
//     if (formData.Material) {
//       const isNameDuplicate = await checkDuplicateMaterialName(formData.Material);
//       if (isNameDuplicate) {
//         setErrors(prev => ({
//           ...prev,
//           Material: 'Material name already exists'
//         }));
//         return;
//       }
//     }

//     if (formData.MaterialCode) {
//       const isCodeDuplicate = await checkDuplicateMaterialCode(formData.MaterialCode);
//       if (isCodeDuplicate) {
//         setErrors(prev => ({
//           ...prev,
//           MaterialCode: 'Material code already exists'
//         }));
//         return;
//       }
//     }

//     if (isFormValid()) {
//       // Convert numeric fields to numbers - UPDATED for Material2 model
//       const submitData = {
//         Material: formData.Material.trim(),
//         MaterialCode: formData.MaterialCode.trim(),
//         PackSize: parseFloat(formData.PackSize),
//         Unit: formData.Unit.trim(),
//         UnitPrice: parseFloat(formData.UnitPrice),
//         ReorderQuantity: parseInt(formData.ReorderQuantity),
//         MinimumConsumption: parseFloat(formData.MinimumConsumption),
//         MaximumConsumption: parseFloat(formData.MaximumConsumption),
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

//   // Calculate some derived values for display
//   const consumptionRange = formData.MaximumConsumption && formData.MinimumConsumption 
//     ? parseFloat(formData.MaximumConsumption) - parseFloat(formData.MinimumConsumption)
//     : 0;

//   const leadTimeRange = formData.MaximumLeadTime && formData.MinimumLeadTime
//     ? parseInt(formData.MaximumLeadTime) - parseInt(formData.MinimumLeadTime)
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
//               {viewMode ? 'View Material' : material ? 'Edit Material' : 'Add New Material'}
//             </Typography>
//             <Typography variant="caption" sx={{ opacity: 0.9 }}>
//               {viewMode ? 'Material details' : material ? 'Update material information' : 'Create new material entry'}
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
//           {/* Basic Information Section - UPDATED for Material2 model */}
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
//                   label="Material Name"
//                   value={formData.Material}
//                   onChange={handleChange('Material')}
//                   onBlur={handleBlur('Material')}
//                   onKeyDown={(e) => handleKeyDown(e, 'Material')}
//                   error={touched.Material && !!errors.Material}
//                   helperText={touched.Material && errors.Material}
//                   disabled={viewMode}
//                   required
//                   inputRef={setFieldRef('Material')}
//                   placeholder="e.g., Cement, Steel Rods"
//                 />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   size="small"
//                   label="Material Code"
//                   value={formData.MaterialCode}
//                   onChange={handleChange('MaterialCode')}
//                   onBlur={handleBlur('MaterialCode')}
//                   onKeyDown={(e) => handleKeyDown(e, 'MaterialCode')}
//                   error={touched.MaterialCode && !!errors.MaterialCode}
//                   helperText={touched.MaterialCode && errors.MaterialCode}
//                   disabled={viewMode}
//                   required
//                   inputRef={setFieldRef('MaterialCode')}
//                   placeholder="e.g., CEMENT-001, STR-50MM"
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <Code color="action" fontSize="small" />
//                       </InputAdornment>
//                     ),
//                     endAdornment: checkingDuplicate ? (
//                       <InputAdornment position="end">
//                         <CircularProgress size={16} />
//                       </InputAdornment>
//                     ) : null,
//                   }}
//                 />
//               </Grid>
//               <Grid item xs={12}>
//                 <Box sx={{ p: 1, backgroundColor: 'info.light', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
//                   <Typography variant="caption" fontWeight="bold" display="block" gutterBottom color="info.dark">
//                     Material Identification:
//                   </Typography>
//                   <Typography variant="body2" color="info.dark">
//                     {formData.Material && formData.MaterialCode 
//                       ? `${formData.Material} (Code: ${formData.MaterialCode})`
//                       : 'Enter material name and code to see preview'
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

//           {/* Pricing & Inventory Section */}
//           <Box sx={{ mb: 2 }}>
//             <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 'bold' }}>
//               <AttachMoney fontSize="small" />
//               Pricing & Inventory
//             </Typography>
//             <Grid container spacing={1.5}>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   size="small"
//                   label="Unit Price (ETB)"
//                   type="number"
//                   value={formData.UnitPrice}
//                   onChange={handleChange('UnitPrice')}
//                   onBlur={handleBlur('UnitPrice')}
//                   onKeyDown={(e) => handleKeyDown(e, 'UnitPrice')}
//                   error={touched.UnitPrice && !!errors.UnitPrice}
//                   helperText={touched.UnitPrice && errors.UnitPrice}
//                   disabled={viewMode}
//                   required
//                   inputRef={setFieldRef('UnitPrice')}
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
//           </Box>

//           <Divider sx={{ my: 1.5 }} />

//           {/* Consumption & Lead Time Section */}
//           <Box sx={{ mb: 2 }}>
//             <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 'bold' }}>
//               <Speed fontSize="small" />
//               Consumption & Lead Time
//             </Typography>
            
//             {/* Consumption Section */}
//             <Box sx={{ mb: 2 }}>
//               <Typography variant="body2" gutterBottom color="text.secondary" fontWeight="medium">
//                 Consumption Rate (Units/Week)
//               </Typography>
//               <Grid container spacing={1.5}>
//                 <Grid item xs={12} sm={6}>
//                   <TextField
//                     fullWidth
//                     size="small"
//                     label="Minimum Consumption"
//                     type="number"
//                     value={formData.MinimumConsumption}
//                     onChange={handleChange('MinimumConsumption')}
//                     onBlur={handleBlur('MinimumConsumption')}
//                     onKeyDown={(e) => handleKeyDown(e, 'MinimumConsumption')}
//                     error={touched.MinimumConsumption && !!errors.MinimumConsumption}
//                     helperText={touched.MinimumConsumption && errors.MinimumConsumption}
//                     disabled={viewMode}
//                     required
//                     inputRef={setFieldRef('MinimumConsumption')}
//                     InputProps={{
//                       startAdornment: (
//                         <InputAdornment position="start">
//                           <TrendingDown color="action" fontSize="small" />
//                         </InputAdornment>
//                       ),
//                       inputProps: { min: 0, max: 100000, step: 0.1 }
//                     }}
//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <TextField
//                     fullWidth
//                     size="small"
//                     label="Maximum Consumption"
//                     type="number"
//                     value={formData.MaximumConsumption}
//                     onChange={handleChange('MaximumConsumption')}
//                     onBlur={handleBlur('MaximumConsumption')}
//                     onKeyDown={(e) => handleKeyDown(e, 'MaximumConsumption')}
//                     error={touched.MaximumConsumption && !!errors.MaximumConsumption}
//                     helperText={touched.MaximumConsumption && errors.MaximumConsumption}
//                     disabled={viewMode}
//                     required
//                     inputRef={setFieldRef('MaximumConsumption')}
//                     InputProps={{
//                       startAdornment: (
//                         <InputAdornment position="start">
//                           <TrendingUp color="action" fontSize="small" />
//                         </InputAdornment>
//                       ),
//                       inputProps: { min: 0, max: 100000, step: 0.1 }
//                     }}
//                   />
//                 </Grid>
//               </Grid>
//               {formData.MinimumConsumption && formData.MaximumConsumption && (
//                 <Box sx={{ mt: 1 }}>
//                   <Chip 
//                     label={`Range: ${consumptionRange.toFixed(1)} units/week`}
//                     variant="outlined"
//                     color={consumptionRange > 0 ? "info" : "error"}
//                     size="small"
//                     sx={{ height: 20, fontSize: '0.6rem' }}
//                   />
//                 </Box>
//               )}
//             </Box>

//             {/* Lead Time Section - UPDATED for days instead of weeks */}
//             <Box>
//               <Typography variant="body2" gutterBottom color="text.secondary" fontWeight="medium">
//                 Lead Time (Days)
//               </Typography>
//               <Grid container spacing={1.5}>
//                 <Grid item xs={12} sm={6}>
//                   <TextField
//                     fullWidth
//                     size="small"
//                     label="Minimum Lead Time"
//                     type="number"
//                     value={formData.MinimumLeadTime}
//                     onChange={handleChange('MinimumLeadTime')}
//                     onBlur={handleBlur('MinimumLeadTime')}
//                     onKeyDown={(e) => handleKeyDown(e, 'MinimumLeadTime')}
//                     error={touched.MinimumLeadTime && !!errors.MinimumLeadTime}
//                     helperText={touched.MinimumLeadTime && errors.MinimumLeadTime}
//                     disabled={viewMode}
//                     required
//                     inputRef={setFieldRef('MinimumLeadTime')}
//                     InputProps={{
//                       startAdornment: (
//                         <InputAdornment position="start">
//                           <Schedule color="action" fontSize="small" />
//                         </InputAdornment>
//                       ),
//                       inputProps: { min: 0, max: 365 }
//                     }}
//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <TextField
//                     fullWidth
//                     size="small"
//                     label="Maximum Lead Time"
//                     type="number"
//                     value={formData.MaximumLeadTime}
//                     onChange={handleChange('MaximumLeadTime')}
//                     onBlur={handleBlur('MaximumLeadTime')}
//                     onKeyDown={(e) => handleKeyDown(e, 'MaximumLeadTime')}
//                     error={touched.MaximumLeadTime && !!errors.MaximumLeadTime}
//                     helperText={touched.MaximumLeadTime && errors.MaximumLeadTime}
//                     disabled={viewMode}
//                     required
//                     inputRef={setFieldRef('MaximumLeadTime')}
//                     InputProps={{
//                       startAdornment: (
//                         <InputAdornment position="start">
//                           <Schedule color="action" fontSize="small" />
//                         </InputAdornment>
//                       ),
//                       inputProps: { min: 0, max: 365 }
//                     }}
//                   />
//                 </Grid>
//               </Grid>
//               {formData.MinimumLeadTime && formData.MaximumLeadTime && (
//                 <Box sx={{ mt: 1 }}>
//                   <Chip 
//                     label={`Range: ${leadTimeRange} days`}
//                     variant="outlined"
//                     color={leadTimeRange > 0 ? "info" : "error"}
//                     size="small"
//                     sx={{ height: 20, fontSize: '0.6rem' }}
//                   />
//                 </Box>
//               )}
//             </Box>
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

//           {/* Material Information - UPDATED for Material2 model */}
//           <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
//             <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
//               📋 Material Information:
//             </Typography>
//             <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
//               • <strong>Material Name</strong> and <strong>Material Code</strong> are separate fields<br/>
//               • Both fields are required and must be unique<br/>
//               • Material Code will be automatically converted to uppercase<br/>
//               • <strong>Duplicate material names and codes are not allowed</strong><br/>
//               • Material Code can contain letters, numbers, hyphens, and underscores
//             </Typography>
//           </Box>

//           {/* Validation Summary */}
//           {Object.keys(errors).length > 0 && (
//             <Alert severity="error" sx={{ mt: 1.5 }} size="small">
//               Please fix the validation errors above before saving.
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
//               {loading ? 'Saving...' : material ? 'Update' : 'Save (Ctrl+Enter)'}
//             </Button>
//           )}
//         </DialogActions>
//       </form>
//     </Dialog>
//   );
// };

// export default MaterialForm2;