// // src/pages/Auth/RegisterAdmin.jsx
// import React, { useState, useEffect } from 'react';
// import {
//   Container,
//   Paper,
//   TextField,
//   Button,
//   Typography,
//   Box,
//   Alert,
//   CircularProgress,
//   Grid,
//   InputAdornment,
//   IconButton,
//   Stepper,
//   Step,
//   StepLabel,
//   Card,
//   CardContent,
//   List,
//   ListItem,
//   ListItemIcon,
//   ListItemText,
//   Fade,
//   Zoom,
//   MenuItem,
//   Select,
//   FormControl,
//   InputLabel
// } from '@mui/material';
// import {
//   Person as PersonIcon,
//   PersonOutline as UsernameIcon,
//   Lock as LockIcon,
//   Visibility as VisibilityIcon,
//   VisibilityOff as VisibilityOffIcon,
//   CheckCircle as CheckCircleIcon,
//   Business as BusinessIcon,
//   Phone as PhoneIcon,
//   Badge as BadgeIcon,
//   Work as WorkIcon,
//   BusinessCenter as BusinessCenterIcon
// } from '@mui/icons-material';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';
// import axios from 'axios';

// const steps = ['Admin Details', 'Security Settings', 'Additional Information'];

// const departments = ['HR', 'Production', 'Supply Chain', 'Finance', 'Sales', 'General'];

// const RegisterAdmin = () => {
//   const [activeStep, setActiveStep] = useState(0);
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     username: '',
//     password: '',
//     confirmPassword: '',
//     role: 'admin',
//     department: 'General',
//     phoneNumber: '',
//     position: 'System Administrator',
//     employeeId: ''
//   });
//   const [usernameError, setUsernameError] = useState('');
//   const [checkingUsername, setCheckingUsername] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [checking, setChecking] = useState(true);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [showAlert, setShowAlert] = useState(false);
//   const [passwordStrength, setPasswordStrength] = useState({
//     score: 0,
//     message: '',
//     color: 'error.main'
//   });
  
//   const navigate = useNavigate();

//   useEffect(() => {
//     const checkSystem = async () => {
//       try {
//         const response = await axios.get('/api/auth/system-status');
//         if (response.data.hasAdmin) {
//           navigate('/login');
//         }
//       } catch (error) {
//         console.error('Error checking system status:', error);
//       } finally {
//         setChecking(false);
//       }
//     };
    
//     checkSystem();
//   }, [navigate]);

//   const checkUsernameAvailability = async (username) => {
//     if (!username || username.length < 3) return;
    
//     setCheckingUsername(true);
//     try {
//       const response = await axios.get(`/api/auth/check-username?username=${username}`);
//       if (response.data.exists) {
//         setUsernameError('Username already taken');
//       } else {
//         setUsernameError('');
//       }
//     } catch (error) {
//       console.error('Error checking username:', error);
//       setUsernameError('Error checking username availability');
//     } finally {
//       setCheckingUsername(false);
//     }
//   };

//   if (checking) {
//     return (
//       <Container sx={{ 
//         display: 'flex', 
//         justifyContent: 'center', 
//         alignItems: 'center', 
//         height: '100vh',
//         flexDirection: 'column',
//         gap: 2
//       }}>
//         <CircularProgress size={60} />
//         <Typography variant="body1" color="text.secondary">
//           Checking system configuration...
//         </Typography>
//       </Container>
//     );
//   }

//   const handleNext = () => {
//     if (activeStep === 0) {
//       if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.username.trim()) {
//         setError('Please fill in all personal details');
//         setShowAlert(true);
//         return;
//       }
      
//       const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
//       if (!usernameRegex.test(formData.username)) {
//         setError('Username must be 3-20 characters (letters, numbers, underscores only)');
//         setShowAlert(true);
//         return;
//       }
      
//       if (usernameError) {
//         setError('Please fix the username error before proceeding');
//         setShowAlert(true);
//         return;
//       }
//     } else if (activeStep === 1) {
//       if (!formData.password.trim() || !formData.confirmPassword.trim()) {
//         setError('Please fill in both password fields');
//         setShowAlert(true);
//         return;
//       }
      
//       if (formData.password !== formData.confirmPassword) {
//         setError('Passwords do not match');
//         setShowAlert(true);
//         return;
//       }
      
//       if (formData.password.length < 8) {
//         setError('Password must be at least 8 characters long');
//         setShowAlert(true);
//         return;
//       }
      
//       if (passwordStrength.score < 3) {
//         setError('Please choose a stronger password');
//         setShowAlert(true);
//         return;
//       }
//     }
    
//     setError('');
//     setShowAlert(false);
//     setActiveStep((prevStep) => prevStep + 1);
//   };

//   const handleBack = () => {
//     setError('');
//     setShowAlert(false);
//     setActiveStep((prevStep) => prevStep - 1);
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     const newFormData = {
//       ...formData,
//       [name]: value
//     };
//     setFormData(newFormData);
    
//     if (error) {
//       setError('');
//       setShowAlert(false);
//     }
    
//     if (name === 'password') {
//       checkPasswordStrength(value);
      
//       if (newFormData.confirmPassword && value !== newFormData.confirmPassword) {
//         setError('Passwords do not match');
//         setShowAlert(true);
//       }
//     }
    
//     if (name === 'confirmPassword' && formData.password && value !== formData.password) {
//       setError('Passwords do not match');
//       setShowAlert(true);
//     }
    
//     if (name === 'username') {
//       setUsernameError('');
//       const timer = setTimeout(() => {
//         checkUsernameAvailability(value);
//       }, 800);
//       return () => clearTimeout(timer);
//     }
//   };

//   const checkPasswordStrength = (password) => {
//     let score = 0;
//     let message = '';
//     let color = 'error.main';
    
//     if (password.length >= 8) score += 1;
//     if (password.length >= 12) score += 1;
//     if (/[A-Z]/.test(password)) score += 1;
//     if (/[a-z]/.test(password)) score += 1;
//     if (/[0-9]/.test(password)) score += 1;
//     if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
//     if (score <= 2) {
//       message = 'Weak';
//       color = 'error.main';
//     } else if (score <= 4) {
//       message = 'Fair';
//       color = 'warning.main';
//     } else if (score === 5) {
//       message = 'Good';
//       color = 'success.main';
//     } else {
//       message = 'Strong';
//       color = 'success.main';
//     }
    
//     setPasswordStrength({ score, message, color });
//   };

//   const handleTogglePasswordVisibility = () => {
//     setShowPassword(!showPassword);
//   };

//   const handleToggleConfirmPasswordVisibility = () => {
//     setShowConfirmPassword(!showConfirmPassword);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setSuccess('');
//     setShowAlert(false);
//     setLoading(true);

//     try {
//       const employeeId = formData.employeeId || `ADM-${Date.now().toString().slice(-6)}`;
      
//       const response = await axios.post('/api/auth/register-admin', {
//         firstName: formData.firstName,
//         lastName: formData.lastName,
//         username: formData.username,
//         password: formData.password,
//         role: 'admin',
//         department: formData.department,
//         phoneNumber: formData.phoneNumber,
//         position: formData.position || 'System Administrator',
//         employeeId: employeeId
//       });

//       if (response.data.success) {
//         setSuccess('Admin account created successfully! Redirecting to login...');
//         setShowAlert(true);
        
//         setTimeout(() => {
//           navigate('/login');
//         }, 3000);
//       } else {
//         setError(response.data.message || 'Registration failed. Please try again.');
//         setShowAlert(true);
//       }
//     } catch (err) {
//       const errorMessage = err.response?.data?.message || 
//                           err.response?.data?.error || 
//                           'Registration failed. Please try again.';
//       setError(errorMessage);
//       setShowAlert(true);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderStepContent = (step) => {
//     switch (step) {
//       case 0:
//         return (
//           <Zoom in={true}>
//             <Grid container spacing={3}>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   required
//                   fullWidth
//                   id="firstName"
//                   label="First Name"
//                   name="firstName"
//                   autoComplete="given-name"
//                   value={formData.firstName}
//                   onChange={handleChange}
//                   disabled={loading}
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <PersonIcon color="action" />
//                       </InputAdornment>
//                     ),
//                   }}
//                   helperText="Enter your first name"
//                 />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   required
//                   fullWidth
//                   id="lastName"
//                   label="Last Name"
//                   name="lastName"
//                   autoComplete="family-name"
//                   value={formData.lastName}
//                   onChange={handleChange}
//                   disabled={loading}
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <PersonIcon color="action" />
//                       </InputAdornment>
//                     ),
//                   }}
//                   helperText="Enter your last name"
//                 />
//               </Grid>
//               <Grid item xs={12}>
//                 <TextField
//                   required
//                   fullWidth
//                   id="username"
//                   label="Username"
//                   name="username"
//                   autoComplete="username"
//                   value={formData.username}
//                   onChange={handleChange}
//                   error={!!usernameError}
//                   helperText={usernameError || "Choose a unique username (3-20 characters, letters, numbers, underscores)"}
//                   disabled={loading || checkingUsername}
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <UsernameIcon color="action" />
//                       </InputAdornment>
//                     ),
//                     endAdornment: checkingUsername ? (
//                       <InputAdornment position="end">
//                         <CircularProgress size={20} />
//                       </InputAdornment>
//                     ) : null
//                   }}
//                 />
//               </Grid>
//             </Grid>
//           </Zoom>
//         );
//       case 1:
//         return (
//           <Zoom in={true}>
//             <Grid container spacing={3}>
//               <Grid item xs={12}>
//                 <TextField
//                   required
//                   fullWidth
//                   name="password"
//                   label="Password"
//                   type={showPassword ? 'text' : 'password'}
//                   id="password"
//                   autoComplete="new-password"
//                   value={formData.password}
//                   onChange={handleChange}
//                   disabled={loading}
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <LockIcon color="action" />
//                       </InputAdornment>
//                     ),
//                     endAdornment: (
//                       <InputAdornment position="end">
//                         <IconButton
//                           onClick={handleTogglePasswordVisibility}
//                           edge="end"
//                           disabled={loading}
//                         >
//                           {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
//                         </IconButton>
//                       </InputAdornment>
//                     ),
//                   }}
//                 />
//                 {formData.password && (
//                   <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
//                     <Typography variant="body2" color={passwordStrength.color}>
//                       Password Strength: {passwordStrength.message}
//                     </Typography>
//                     <Box sx={{ flexGrow: 1, height: 4, bgcolor: 'grey.200', borderRadius: 2 }}>
//                       <Box 
//                         sx={{ 
//                           width: `${Math.min(passwordStrength.score * 16.67, 100)}%`, 
//                           height: '100%', 
//                           bgcolor: passwordStrength.color,
//                           borderRadius: 2,
//                           transition: 'width 0.3s ease'
//                         }} 
//                       />
//                     </Box>
//                   </Box>
//                 )}
//               </Grid>
//               <Grid item xs={12}>
//                 <TextField
//                   required
//                   fullWidth
//                   name="confirmPassword"
//                   label="Confirm Password"
//                   type={showConfirmPassword ? 'text' : 'password'}
//                   id="confirmPassword"
//                   value={formData.confirmPassword}
//                   onChange={handleChange}
//                   disabled={loading}
//                   error={formData.confirmPassword && formData.password !== formData.confirmPassword}
//                   helperText={formData.confirmPassword && formData.password !== formData.confirmPassword ? "Passwords do not match" : ""}
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <LockIcon color="action" />
//                       </InputAdornment>
//                     ),
//                     endAdornment: (
//                       <InputAdornment position="end">
//                         <IconButton
//                           onClick={handleToggleConfirmPasswordVisibility}
//                           edge="end"
//                           disabled={loading}
//                         >
//                           {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
//                         </IconButton>
//                       </InputAdornment>
//                     ),
//                   }}
//                 />
//               </Grid>
//               <Grid item xs={12}>
//                 <Card variant="outlined" sx={{ mt: 2 }}>
//                   <CardContent>
//                     <Typography variant="subtitle2" gutterBottom>
//                       Password Requirements:
//                     </Typography>
//                     <List dense>
//                       <ListItem disablePadding sx={{ mb: 0.5 }}>
//                         <ListItemIcon sx={{ minWidth: 30 }}>
//                           {formData.password.length >= 8 ? 
//                             <CheckCircleIcon color="success" fontSize="small" /> : 
//                             <Box sx={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid', borderColor: 'grey.400' }} />
//                           }
//                         </ListItemIcon>
//                         <ListItemText primary="At least 8 characters" />
//                       </ListItem>
//                       <ListItem disablePadding sx={{ mb: 0.5 }}>
//                         <ListItemIcon sx={{ minWidth: 30 }}>
//                           {/[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password) ? 
//                             <CheckCircleIcon color="success" fontSize="small" /> : 
//                             <Box sx={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid', borderColor: 'grey.400' }} />
//                           }
//                         </ListItemIcon>
//                         <ListItemText primary="Mix of uppercase and lowercase letters" />
//                       </ListItem>
//                       <ListItem disablePadding sx={{ mb: 0.5 }}>
//                         <ListItemIcon sx={{ minWidth: 30 }}>
//                           {/[0-9]/.test(formData.password) ? 
//                             <CheckCircleIcon color="success" fontSize="small" /> : 
//                             <Box sx={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid', borderColor: 'grey.400' }} />
//                           }
//                         </ListItemIcon>
//                         <ListItemText primary="At least one number" />
//                       </ListItem>
//                       <ListItem disablePadding>
//                         <ListItemIcon sx={{ minWidth: 30 }}>
//                           {/[^A-Za-z0-9]/.test(formData.password) ? 
//                             <CheckCircleIcon color="success" fontSize="small" /> : 
//                             <Box sx={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid', borderColor: 'grey.400' }} />
//                           }
//                         </ListItemIcon>
//                         <ListItemText primary="At least one special character" />
//                       </ListItem>
//                     </List>
//                   </CardContent>
//                 </Card>
//               </Grid>
//             </Grid>
//           </Zoom>
//         );
//       case 2:
//         return (
//           <Zoom in={true}>
//             <Grid container spacing={3}>
//               <Grid item xs={12} sm={6}>
//                 <FormControl fullWidth required disabled={loading}>
//                   <InputLabel>Department</InputLabel>
//                   <Select
//                     label="Department"
//                     name="department"
//                     value={formData.department}
//                     onChange={handleChange}
//                     startAdornment={
//                       <InputAdornment position="start">
//                         <BusinessCenterIcon color="action" />
//                       </InputAdornment>
//                     }
//                   >
//                     {departments.map((dept) => (
//                       <MenuItem key={dept} value={dept}>{dept}</MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </Grid>
//               <Grid item xs={12}>
//                 <TextField
//                   fullWidth
//                   id="phoneNumber"
//                   label="Phone Number"
//                   name="phoneNumber"
//                   value={formData.phoneNumber}
//                   onChange={handleChange}
//                   disabled={loading}
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <PhoneIcon color="action" />
//                       </InputAdornment>
//                     ),
//                   }}
//                   helperText="Optional"
//                 />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   id="position"
//                   label="Position"
//                   name="position"
//                   value={formData.position}
//                   onChange={handleChange}
//                   disabled={loading}
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <WorkIcon color="action" />
//                       </InputAdornment>
//                     ),
//                   }}
//                   helperText="e.g., System Administrator"
//                 />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   id="employeeId"
//                   label="Employee ID"
//                   name="employeeId"
//                   value={formData.employeeId}
//                   onChange={handleChange}
//                   disabled={loading}
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <BadgeIcon color="action" />
//                       </InputAdornment>
//                     ),
//                   }}
//                   helperText="Optional - Auto-generated if empty"
//                 />
//               </Grid>
//               <Grid item xs={12}>
//                 <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1, mt: 2, border: '1px solid', borderColor: 'info.main' }}>
//                   <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'info.dark' }}>
//                     Important: As the first system administrator, you will have complete control over the system. 
//                     Please store your credentials securely. This account cannot be deleted.
//                   </Typography>
//                 </Box>
//               </Grid>
//             </Grid>
//           </Zoom>
//         );
//       default:
//         return 'Unknown step';
//     }
//   };

//   const isStepComplete = () => {
//     switch (activeStep) {
//       case 0:
//         return formData.firstName && formData.lastName && formData.username && !usernameError;
//       case 1:
//         return formData.password && formData.confirmPassword && 
//                formData.password === formData.confirmPassword && 
//                formData.password.length >= 8 && 
//                passwordStrength.score >= 3;
//       case 2:
//         return formData.department;
//       default:
//         return false;
//     }
//   };

//   return (
//     <Container component="main" maxWidth="md">
//       <Box
//         sx={{
//           minHeight: '100vh',
//           display: 'flex',
//           flexDirection: 'column',
//           justifyContent: 'center',
//           alignItems: 'center',
//           py: 4
//         }}
//       >
//         <Box sx={{ width: '100%', mb: 4, textAlign: 'center' }}>
//           <BusinessIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
//           <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
//             Mesay Operations Setup
//           </Typography>
//           <Typography variant="subtitle1" color="text.secondary">
//             First-Time System Administrator Registration
//           </Typography>
//         </Box>

//         <Paper
//           elevation={6}
//           sx={{
//             padding: { xs: 3, sm: 4 },
//             width: '100%',
//             borderRadius: 2,
//             position: 'relative'
//           }}
//         >
//           <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
//             {steps.map((label) => (
//               <Step key={label}>
//                 <StepLabel>{label}</StepLabel>
//               </Step>
//             ))}
//           </Stepper>

//           {error && (
//             <Fade in={showAlert}>
//               <Alert 
//                 severity="error" 
//                 sx={{ mb: 3, borderRadius: 1 }}
//                 onClose={() => setShowAlert(false)}
//               >
//                 {error}
//               </Alert>
//             </Fade>
//           )}

//           {success && (
//             <Fade in={showAlert}>
//               <Alert 
//                 severity="success" 
//                 sx={{ mb: 3, borderRadius: 1 }}
//                 onClose={() => setShowAlert(false)}
//               >
//                 {success}
//               </Alert>
//             </Fade>
//           )}

//           <Box component="form" onSubmit={activeStep === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
//             {renderStepContent(activeStep)}
            
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
//               <Button
//                 disabled={activeStep === 0 || loading}
//                 onClick={handleBack}
//                 variant="outlined"
//                 sx={{ minWidth: 100 }}
//               >
//                 Back
//               </Button>
//               <Button
//                 type="submit"
//                 variant="contained"
//                 disabled={loading || checkingUsername || !!usernameError || !isStepComplete()}
//                 sx={{ minWidth: 150 }}
//               >
//                 {loading ? (
//                   <CircularProgress size={24} color="inherit" />
//                 ) : activeStep === steps.length - 1 ? (
//                   'Create Admin Account'
//                 ) : (
//                   'Next'
//                 )}
//               </Button>
//             </Box>
//           </Box>
//         </Paper>

//         <Box sx={{ mt: 4, textAlign: 'center', maxWidth: 600 }}>
//           <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
//             Need help? Contact support@mesayoperations.com
//           </Typography>
//           <Typography variant="caption" color="text.secondary">
//             By creating an account, you agree to our Terms of Service and Privacy Policy.
//           </Typography>
//         </Box>
//       </Box>
//     </Container>
//   );
// };

// export default RegisterAdmin;