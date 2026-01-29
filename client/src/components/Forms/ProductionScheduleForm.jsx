// // components/ProductionScheduleForm.js
// import React, { useState, useEffect } from 'react';
// import {
//   Box,
//   Card,
//   CardContent,
//   Typography,
//   TextField,
//   Button,
//   Grid,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   Chip,
//   IconButton,
//   Alert,
//   Stepper,
//   Step,
//   StepLabel,
//   Paper
// } from '@mui/material';
// import { Add, Delete, Save, Cancel } from '@mui/icons-material';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// const ProductionScheduleForm = ({ scheduleId, onSave, onCancel }) => {
//   const [formData, setFormData] = useState({
//     product: '',
//     scheduleNumber: '',
//     batchSize: 1,
//     plannedQuantity: 1,
//     startDate: null,
//     endDate: null,
//     assignedTo: [],
//     requiredMaterials: [],
//     status: 'scheduled',
//     priority: 'medium',
//     remarks: ''
//   });
//   const [products, setProducts] = useState([]);
//   const [materials, setMaterials] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [activeStep, setActiveStep] = useState(0);

//   const steps = ['Basic Information', 'Materials & Resources', 'Review & Submit'];

//   useEffect(() => {
//     fetchFormData();
//     if (scheduleId) {
//       fetchSchedule();
//     } else {
//       // Generate schedule number for new schedule
//       setFormData(prev => ({
//         ...prev,
//         scheduleNumber: `PS-${Date.now()}`
//       }));
//     }
//   }, [scheduleId]);

//   const fetchFormData = async () => {
//     try {
//       // In a real app, these would be separate API calls
//       const [productsRes, materialsRes, usersRes] = await Promise.all([
//         fetch('/api/products'),
//         fetch('/api/materials'),
//         fetch('/api/users')
//       ]);

//       if (productsRes.ok) setProducts(await productsRes.json());
//       if (materialsRes.ok) setMaterials(await materialsRes.json());
//       if (usersRes.ok) setUsers(await usersRes.json());
//     } catch (err) {
//       setError('Failed to load form data');
//     }
//   };

//   const fetchSchedule = async () => {
//     try {
//       const response = await fetch(`/api/production-schedules/${scheduleId}`);
//       if (response.ok) {
//         const data = await response.json();
//         setFormData({
//           ...data,
//           startDate: new Date(data.startDate),
//           endDate: new Date(data.endDate)
//         });
//       } else {
//         setError('Failed to fetch schedule');
//       }
//     } catch (err) {
//       setError('Failed to fetch schedule');
//     }
//   };

//   const handleInputChange = (field, value) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//   };

//   const handleMaterialChange = (index, field, value) => {
//     const updatedMaterials = [...formData.requiredMaterials];
//     updatedMaterials[index] = {
//       ...updatedMaterials[index],
//       [field]: value
//     };
//     setFormData(prev => ({ ...prev, requiredMaterials: updatedMaterials }));
//   };

//   const addMaterial = () => {
//     setFormData(prev => ({
//       ...prev,
//       requiredMaterials: [
//         ...prev.requiredMaterials,
//         { material: '', quantity: 1, unit: '' }
//       ]
//     }));
//   };

//   const removeMaterial = (index) => {
//     const updatedMaterials = formData.requiredMaterials.filter((_, i) => i !== index);
//     setFormData(prev => ({ ...prev, requiredMaterials: updatedMaterials }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     try {
//       const url = scheduleId 
//         ? `/api/production-schedules/${scheduleId}`
//         : '/api/production-schedules';
      
//       const method = scheduleId ? 'PUT' : 'POST';

//       const response = await fetch(url, {
//         method,
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(formData),
//       });

//       if (response.ok) {
//         setSuccess(scheduleId ? 'Schedule updated successfully' : 'Schedule created successfully');
//         if (onSave) {
//           onSave(await response.json());
//         }
//       } else {
//         const data = await response.json();
//         setError(data.message);
//       }
//     } catch (err) {
//       setError('Failed to save production schedule');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderBasicInfoStep = () => (
//     <Grid container spacing={3}>
//       <Grid item xs={12} sm={6}>
//         <TextField
//           fullWidth
//           label="Schedule Number"
//           value={formData.scheduleNumber}
//           onChange={(e) => handleInputChange('scheduleNumber', e.target.value)}
//           required
//         />
//       </Grid>
      
//       <Grid item xs={12} sm={6}>
//         <FormControl fullWidth required>
//           <InputLabel>Product</InputLabel>
//           <Select
//             value={formData.product}
//             label="Product"
//             onChange={(e) => handleInputChange('product', e.target.value)}
//           >
//             {products.map((product) => (
//               <MenuItem key={product._id} value={product._id}>
//                 {product.name} ({product.sku})
//               </MenuItem>
//             ))}
//           </Select>
//         </FormControl>
//       </Grid>

//       <Grid item xs={12} sm={6}>
//         <TextField
//           fullWidth
//           label="Batch Size"
//           type="number"
//           value={formData.batchSize}
//           onChange={(e) => handleInputChange('batchSize', parseInt(e.target.value))}
//           required
//           inputProps={{ min: 1 }}
//         />
//       </Grid>

//       <Grid item xs={12} sm={6}>
//         <TextField
//           fullWidth
//           label="Planned Quantity"
//           type="number"
//           value={formData.plannedQuantity}
//           onChange={(e) => handleInputChange('plannedQuantity', parseInt(e.target.value))}
//           required
//           inputProps={{ min: 1 }}
//         />
//       </Grid>

//       <Grid item xs={12} sm={6}>
//         <DatePicker
//           label="Start Date"
//           value={formData.startDate}
//           onChange={(date) => handleInputChange('startDate', date)}
//           renderInput={(params) => <TextField {...params} fullWidth required />}
//         />
//       </Grid>

//       <Grid item xs={12} sm={6}>
//         <DatePicker
//           label="End Date"
//           value={formData.endDate}
//           onChange={(date) => handleInputChange('endDate', date)}
//           renderInput={(params) => <TextField {...params} fullWidth required />}
//           minDate={formData.startDate}
//         />
//       </Grid>

//       <Grid item xs={12} sm={6}>
//         <FormControl fullWidth>
//           <InputLabel>Status</InputLabel>
//           <Select
//             value={formData.status}
//             label="Status"
//             onChange={(e) => handleInputChange('status', e.target.value)}
//           >
//             <MenuItem value="scheduled">Scheduled</MenuItem>
//             <MenuItem value="in_progress">In Progress</MenuItem>
//             <MenuItem value="completed">Completed</MenuItem>
//             <MenuItem value="delayed">Delayed</MenuItem>
//             <MenuItem value="cancelled">Cancelled</MenuItem>
//           </Select>
//         </FormControl>
//       </Grid>

//       <Grid item xs={12} sm={6}>
//         <FormControl fullWidth>
//           <InputLabel>Priority</InputLabel>
//           <Select
//             value={formData.priority}
//             label="Priority"
//             onChange={(e) => handleInputChange('priority', e.target.value)}
//           >
//             <MenuItem value="low">Low</MenuItem>
//             <MenuItem value="medium">Medium</MenuItem>
//             <MenuItem value="high">High</MenuItem>
//             <MenuItem value="urgent">Urgent</MenuItem>
//           </Select>
//         </FormControl>
//       </Grid>

//       <Grid item xs={12}>
//         <TextField
//           fullWidth
//           label="Remarks"
//           multiline
//           rows={3}
//           value={formData.remarks}
//           onChange={(e) => handleInputChange('remarks', e.target.value)}
//         />
//       </Grid>
//     </Grid>
//   );

//   const renderMaterialsStep = () => (
//     <Grid container spacing={3}>
//       <Grid item xs={12}>
//         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//           <Typography variant="h6">Required Materials</Typography>
//           <Button startIcon={<Add />} onClick={addMaterial}>
//             Add Material
//           </Button>
//         </Box>

//         {formData.requiredMaterials.map((material, index) => (
//           <Paper key={index} sx={{ p: 2, mb: 2 }}>
//             <Grid container spacing={2} alignItems="center">
//               <Grid item xs={12} sm={4}>
//                 <FormControl fullWidth>
//                   <InputLabel>Material</InputLabel>
//                   <Select
//                     value={material.material}
//                     label="Material"
//                     onChange={(e) => handleMaterialChange(index, 'material', e.target.value)}
//                   >
//                     {materials.map((mat) => (
//                       <MenuItem key={mat._id} value={mat._id}>
//                         {mat.name} ({mat.unit})
//                       </MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </Grid>
              
//               <Grid item xs={12} sm={3}>
//                 <TextField
//                   fullWidth
//                   label="Quantity"
//                   type="number"
//                   value={material.quantity}
//                   onChange={(e) => handleMaterialChange(index, 'quantity', parseFloat(e.target.value))}
//                   inputProps={{ min: 0, step: 0.01 }}
//                 />
//               </Grid>
              
//               <Grid item xs={12} sm={3}>
//                 <TextField
//                   fullWidth
//                   label="Unit"
//                   value={material.unit}
//                   onChange={(e) => handleMaterialChange(index, 'unit', e.target.value)}
//                 />
//               </Grid>
              
//               <Grid item xs={12} sm={2}>
//                 <IconButton onClick={() => removeMaterial(index)} color="error">
//                   <Delete />
//                 </IconButton>
//               </Grid>
//             </Grid>
//           </Paper>
//         ))}

//         {formData.requiredMaterials.length === 0 && (
//           <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
//             No materials added. Click "Add Material" to get started.
//           </Typography>
//         )}
//       </Grid>

//       <Grid item xs={12}>
//         <FormControl fullWidth>
//           <InputLabel>Assigned To</InputLabel>
//           <Select
//             multiple
//             value={formData.assignedTo}
//             label="Assigned To"
//             onChange={(e) => handleInputChange('assignedTo', e.target.value)}
//             renderValue={(selected) => (
//               <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
//                 {selected.map((userId) => {
//                   const user = users.find(u => u._id === userId);
//                   return user ? <Chip key={userId} label={user.name} /> : null;
//                 })}
//               </Box>
//             )}
//           >
//             {users.map((user) => (
//               <MenuItem key={user._id} value={user._id}>
//                 {user.name} ({user.email})
//               </MenuItem>
//             ))}
//           </Select>
//         </FormControl>
//       </Grid>
//     </Grid>
//   );

//   const renderReviewStep = () => (
//     <Grid container spacing={3}>
//       <Grid item xs={12}>
//         <Typography variant="h6" gutterBottom>Schedule Summary</Typography>
        
//         <Grid container spacing={2}>
//           <Grid item xs={12} sm={6}>
//             <Typography variant="subtitle2">Schedule Number:</Typography>
//             <Typography>{formData.scheduleNumber}</Typography>
//           </Grid>
          
//           <Grid item xs={12} sm={6}>
//             <Typography variant="subtitle2">Product:</Typography>
//             <Typography>
//               {products.find(p => p._id === formData.product)?.name || 'N/A'}
//             </Typography>
//           </Grid>
          
//           <Grid item xs={12} sm={6}>
//             <Typography variant="subtitle2">Planned Quantity:</Typography>
//             <Typography>{formData.plannedQuantity}</Typography>
//           </Grid>
          
//           <Grid item xs={12} sm={6}>
//             <Typography variant="subtitle2">Batch Size:</Typography>
//             <Typography>{formData.batchSize}</Typography>
//           </Grid>
          
//           <Grid item xs={12} sm={6}>
//             <Typography variant="subtitle2">Start Date:</Typography>
//             <Typography>
//               {formData.startDate ? format(formData.startDate, 'MMM dd, yyyy') : 'N/A'}
//             </Typography>
//           </Grid>
          
//           <Grid item xs={12} sm={6}>
//             <Typography variant="subtitle2">End Date:</Typography>
//             <Typography>
//               {formData.endDate ? format(formData.endDate, 'MMM dd, yyyy') : 'N/A'}
//             </Typography>
//           </Grid>
          
//           <Grid item xs={12}>
//             <Typography variant="subtitle2">Required Materials:</Typography>
//             {formData.requiredMaterials.length > 0 ? (
//               <ul>
//                 {formData.requiredMaterials.map((material, index) => {
//                   const mat = materials.find(m => m._id === material.material);
//                   return (
//                     <li key={index}>
//                       {mat?.name || 'Unknown Material'}: {material.quantity} {material.unit}
//                     </li>
//                   );
//                 })}
//               </ul>
//             ) : (
//               <Typography>No materials specified</Typography>
//             )}
//           </Grid>
//         </Grid>
//       </Grid>
//     </Grid>
//   );

//   const getStepContent = (step) => {
//     switch (step) {
//       case 0:
//         return renderBasicInfoStep();
//       case 1:
//         return renderMaterialsStep();
//       case 2:
//         return renderReviewStep();
//       default:
//         return null;
//     }
//   };

//   const handleNext = () => {
//     setActiveStep((prev) => prev + 1);
//   };

//   const handleBack = () => {
//     setActiveStep((prev) => prev - 1);
//   };

//   return (
//     <LocalizationProvider dateAdapter={AdapterDateFns}>
//       <Card>
//         <CardContent>
//           <Typography variant="h5" gutterBottom>
//             {scheduleId ? 'Edit Production Schedule' : 'Create Production Schedule'}
//           </Typography>

//           {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
//           {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

//           <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
//             {steps.map((label) => (
//               <Step key={label}>
//                 <StepLabel>{label}</StepLabel>
//               </Step>
//             ))}
//           </Stepper>

//           <form onSubmit={handleSubmit}>
//             {getStepContent(activeStep)}

//             <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
//               <Button
//                 onClick={activeStep === 0 ? onCancel : handleBack}
//                 startIcon={<Cancel />}
//               >
//                 {activeStep === 0 ? 'Cancel' : 'Back'}
//               </Button>

//               <Box>
//                 {activeStep < steps.length - 1 && (
//                   <Button onClick={handleNext} variant="contained">
//                     Next
//                   </Button>
//                 )}
//                 {activeStep === steps.length - 1 && (
//                   <Button
//                     type="submit"
//                     variant="contained"
//                     startIcon={<Save />}
//                     disabled={loading}
//                   >
//                     {scheduleId ? 'Update Schedule' : 'Create Schedule'}
//                   </Button>
//                 )}
//               </Box>
//             </Box>
//           </form>
//         </CardContent>
//       </Card>
//     </LocalizationProvider>
//   );
// };

// export default ProductionScheduleForm;