// // src/pages/Auth/Signup.jsx
// import React, { useState, useEffect } from 'react';
// import {
//   Container,
//   Paper,
//   TextField,
//   Button,
//   Typography,
//   Box,
//   Alert,
//   Select,
//   MenuItem,
//   FormControl,
//   InputLabel,
//   Grid,
//   Link,
//   CircularProgress,
//   InputAdornment,
//   IconButton,
//   Card,
//   CardContent,
//   List,
//   ListItem,
//   ListItemIcon,
//   ListItemText,
//   Fade
// } from '@mui/material';
// import {
//   Person as PersonIcon,
//   PersonOutline as UsernameIcon,
//   Lock as LockIcon,
//   Visibility as VisibilityIcon,
//   VisibilityOff as VisibilityOffIcon,
//   CheckCircle as CheckCircleIcon,
//   Phone as PhoneIcon,
//   Badge as BadgeIcon,
//   Work as WorkIcon,
//   BusinessCenter as BusinessCenterIcon
// } from '@mui/icons-material';
// import { Link as RouterLink, useNavigate } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';
// import axios from 'axios';

// const departments = ['Finance', 'HR', 'IT', 'Operations', 'Sales', 'Marketing'];
// const positions = [
//   'Software Developer',
//   'HR Manager',
//   'Financial Analyst',
//   'Sales Executive',
//   'Operations Manager',
//   'Marketing Specialist',
//   'System Administrator',
//   'IT Support'
// ];

// const Signup = () => {
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     username: '',
//     password: '',
//     confirmPassword: '',
//     department: '',
//     position: '',
//     phoneNumber: '',
//     employeeId: ''
//   });
  
//   const [usernameError, setUsernameError] = useState('');
//   const [checkingUsername, setCheckingUsername] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [showAlert, setShowAlert] = useState(false);
//   const [passwordStrength, setPasswordStrength] = useState({
//     score: 0,
//     message: '',
//     color: 'error.main'
//   });

//   const { user, login } = useAuth();
//   const navigate = useNavigate();

//   // Redirect if already logged in or if no admin exists (should use RegisterAdmin instead)
//   useEffect(() => {
//     if (user) {
//       const role = user.role || 'employee';
//       navigate(`/${role}/dashboard`);
//     }
//   }, [user, navigate]);

//   // Check username availability
//   const checkUsernameAvailability = async (username) => {
//     if (!username || username.length < 3) return;
    
//     setCheckingUsername(true);
//     try {
//       const response = await axios.get(`/api/auth/check-username?username=${username}`);
//       if (response.data.exists) {
//         setUsernameError('⚠️ Username already taken');
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

//   const validateForm = () => {
//     const newErrors = {};
    
//     if (!formData.firstName.trim()) {
//       newErrors.firstName = 'First name is required';
//     }
    
//     if (!formData.lastName.trim()) {
//       newErrors.lastName = 'Last name is required';
//     }
    
//     if (!formData.username.trim()) {
//       newErrors.username = 'Username is required';
//     } else if (formData.username.length < 3) {
//       newErrors.username = 'Username must be at least 3 characters';
//     } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
//       newErrors.username = 'Username can only contain letters, numbers, and underscores';
//     } else if (usernameError) {
//       newErrors.username = usernameError;
//     }
    
//     if (!formData.password) {
//       newErrors.password = 'Password is required';
//     } else if (formData.password.length < 8) {
//       newErrors.password = 'Password must be at least 8 characters';
//     } else if (passwordStrength.score < 3) {
//       newErrors.password = 'Password strength is too weak';
//     }
    
//     if (!formData.confirmPassword) {
//       newErrors.confirmPassword = 'Please confirm your password';
//     } else if (formData.password !== formData.confirmPassword) {
//       newErrors.confirmPassword = 'Passwords do not match';
//     }
    
//     if (!formData.department) {
//       newErrors.department = 'Department is required';
//     }
    
//     if (!formData.position) {
//       newErrors.position = 'Position is required';
//     }

//     setError(Object.keys(newErrors).length > 0 ? 'Please fix the errors above' : '');
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     const newFormData = {
//       ...formData,
//       [name]: value
//     };
//     setFormData(newFormData);
    
//     // Clear errors when user starts typing
//     if (error) {
//       setError('');
//       setShowAlert(false);
//     }
    
//     // Check password strength
//     if (name === 'password') {
//       checkPasswordStrength(value);
      
//       // Check if passwords match
//       if (newFormData.confirmPassword && value !== newFormData.confirmPassword) {
//         setError('Passwords do not match');
//         setShowAlert(true);
//       }
//     }
    
//     // Check if confirm password matches
//     if (name === 'confirmPassword' && formData.password && value !== formData.password) {
//       setError('Passwords do not match');
//       setShowAlert(true);
//     }
    
//     // Check username availability
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
    
//     if (!validateForm()) {
//       setShowAlert(true);
//       return;
//     }

//     setLoading(true);
//     setError('');
//     setSuccess('');
//     setShowAlert(false);

//     try {
//       // Generate employee ID if not provided
//       const employeeId = formData.employeeId || `EMP-${Date.now().toString().slice(-6)}`;
      
//       const response = await axios.post('/api/auth/register', {
//         firstName: formData.firstName,
//         lastName: formData.lastName,
//         username: formData.username,
//         password: formData.password,
//         department: formData.department,
//         position: formData.position,
//         phoneNumber: formData.phoneNumber,
//         employeeId: employeeId,
//         role: 'employee' // Regular users get employee role by default
//       });

//       if (response.data.success) {
//         setSuccess('Account created successfully! Please wait for administrator approval.');
//         setShowAlert(true);
        
//         // Optionally auto-login after registration
//         // const loginResult = await login(formData.username, formData.password);
//         // if (loginResult.success) {
//         //   navigate('/employee/dashboard');
//         // }
        
//         // Clear form after successful registration
//         setTimeout(() => {
//           setFormData({
//             firstName: '',
//             lastName: '',
//             username: '',
//             password: '',
//             confirmPassword: '',
//             department: '',
//             position: '',
//             phoneNumber: '',
//             employeeId: ''
//           });
//           setPasswordStrength({ score: 0, message: '', color: 'error.main' });
//           setSuccess('');
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
//           <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
//             Employee Registration
//           </Typography>
//           <Typography variant="subtitle1" color="text.secondary">
//             Create a new employee account
//           </Typography>
//         </Box>

//         <Paper
//           elevation={6}
//           sx={{
//             padding: { xs: 3, sm: 4 },
//             width: '100%',
//             borderRadius: 2
//           }}
//         >
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

//           <Box component="form" onSubmit={handleSubmit} noValidate>
//             <Grid container spacing={3}>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   required
//                   fullWidth
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

//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   required
//                   fullWidth
//                   name="password"
//                   label="Password"
//                   type={showPassword ? 'text' : 'password'}
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
//                       Strength: {passwordStrength.message}
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
              
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   required
//                   fullWidth
//                   name="confirmPassword"
//                   label="Confirm Password"
//                   type={showConfirmPassword ? 'text' : 'password'}
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

//               <Grid item xs={12} sm={6}>
//                 <FormControl fullWidth required>
//                   <InputLabel>Department</InputLabel>
//                   <Select
//                     label="Department"
//                     name="department"
//                     value={formData.department}
//                     onChange={handleChange}
//                     disabled={loading}
//                     startAdornment={
//                       <InputAdornment position="start">
//                         <BusinessCenterIcon color="action" />
//                       </InputAdornment>
//                     }
//                   >
//                     <MenuItem value=""><em>Select Department</em></MenuItem>
//                     {departments.map((dept) => (
//                       <MenuItem key={dept} value={dept}>{dept}</MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <FormControl fullWidth required>
//                   <InputLabel>Position</InputLabel>
//                   <Select
//                     label="Position"
//                     name="position"
//                     value={formData.position}
//                     onChange={handleChange}
//                     disabled={loading}
//                     startAdornment={
//                       <InputAdornment position="start">
//                         <WorkIcon color="action" />
//                       </InputAdornment>
//                     }
//                   >
//                     <MenuItem value=""><em>Select Position</em></MenuItem>
//                     {positions.map((pos) => (
//                       <MenuItem key={pos} value={pos}>{pos}</MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
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
//                 <Card variant="outlined" sx={{ mt: 1 }}>
//                   <CardContent>
//                     <Typography variant="subtitle2" gutterBottom>
//                       📋 Password Requirements:
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
//                         <ListItemText primary="Mix of uppercase and lowercase" />
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

//             <Box sx={{ mt: 4, textAlign: 'center' }}>
//               <Button
//                 type="submit"
//                 variant="contained"
//                 size="large"
//                 disabled={loading || checkingUsername || !!usernameError}
//                 sx={{ minWidth: 200, py: 1.5 }}
//               >
//                 {loading ? (
//                   <CircularProgress size={24} color="inherit" />
//                 ) : (
//                   'Register Account'
//                 )}
//               </Button>
//             </Box>

//             <Box sx={{ mt: 3, textAlign: 'center' }}>
//               <Typography variant="body2">
//                 Already have an account?{' '}
//                 <Link 
//                   component={RouterLink} 
//                   to="/login"
//                   sx={{ 
//                     textDecoration: 'none', 
//                     '&:hover': { textDecoration: 'underline' },
//                     fontWeight: 'medium'
//                   }}
//                 >
//                   Sign In
//                 </Link>
//               </Typography>
//               <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
//                 Need help? Contact your system administrator
//               </Typography>
//             </Box>
//           </Box>
//         </Paper>

//         <Box sx={{ mt: 4, textAlign: 'center', maxWidth: 600 }}>
//           <Typography variant="caption" color="text.secondary">
//             Note: New accounts require administrator approval before they can access the system.
//             You will be notified once your account is approved.
//           </Typography>
//         </Box>
//       </Box>
//     </Container>
//   );
// };

// export default Signup;