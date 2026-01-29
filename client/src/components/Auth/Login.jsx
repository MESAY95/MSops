// // src/pages/Auth/Login.jsx
// import React, { useState, useEffect } from 'react';
// import {
//   Container,
//   Paper,
//   TextField,
//   Button,
//   Typography,
//   Box,
//   Alert,
//   Link,
//   IconButton,
//   InputAdornment,
//   CircularProgress,
//   Fade
// } from '@mui/material';
// import {
//   Person as PersonIcon,
//   Lock as LockIcon,
//   Visibility as VisibilityIcon,
//   VisibilityOff as VisibilityOffIcon,
//   Business as BusinessIcon
// } from '@mui/icons-material';
// import { Link as RouterLink, useNavigate } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';
// import axios from 'axios';

// const Login = () => {
//   const [formData, setFormData] = useState({
//     username: '',
//     password: ''
//   });
//   const [errors, setErrors] = useState({});
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [showAlert, setShowAlert] = useState(false);
//   const [checkingSystem, setCheckingSystem] = useState(true);
//   const { login, user, checkAdminExists } = useAuth();
//   const navigate = useNavigate();

//   // Redirect to dashboard if already logged in
//   useEffect(() => {
//     if (user) {
//       const role = user.role || 'employee';
//       navigate(`/${role}/dashboard`);
//     }
//   }, [user, navigate]);

//   // Check system status on mount
//   useEffect(() => {
//     const checkSystem = async () => {
//       try {
//         const response = await axios.get('/api/auth/system-status');
//         if (!response.data.hasAdmin) {
//           navigate('/register-admin');
//         }
//       } catch (error) {
//         console.error('Error checking system status:', error);
//       } finally {
//         setCheckingSystem(false);
//       }
//     };

//     checkSystem();
//   }, [navigate]);

//   const validateForm = () => {
//     const newErrors = {};
    
//     if (!formData.username.trim()) {
//       newErrors.username = 'Username is required';
//     }
    
//     if (!formData.password) {
//       newErrors.password = 'Password is required';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({
//       ...formData,
//       [name]: value
//     });
    
//     // Clear errors when user starts typing
//     if (errors[name]) {
//       setErrors({
//         ...errors,
//         [name]: ''
//       });
//     }
    
//     // Clear general error
//     if (error) {
//       setError('');
//       setShowAlert(false);
//     }
//   };

//   const handleTogglePasswordVisibility = () => {
//     setShowPassword(!showPassword);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!validateForm()) return;

//     setLoading(true);
//     setError('');
//     setShowAlert(false);

//     try {
//       const result = await login(formData.username, formData.password);
      
//       if (result.success) {
//         // Role-based redirection
//         const role = result.user?.role || 'employee';
//         navigate(`/${role}/dashboard`);
//       } else {
//         setError(result.message || 'Login failed');
//         setShowAlert(true);
//       }
//     } catch (err) {
//       const errorMessage = err.response?.data?.message || 
//                           err.message || 
//                           'Login failed. Please check your credentials and try again.';
//       setError(errorMessage);
//       setShowAlert(true);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Show loading while checking system
//   if (checkingSystem) {
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

//   return (
//     <Container component="main" maxWidth="xs">
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
//             Mesay Operations
//           </Typography>
//           <Typography variant="subtitle1" color="text.secondary">
//             Enterprise Management System
//           </Typography>
//         </Box>

//         <Paper
//           elevation={6}
//           sx={{
//             padding: { xs: 3, sm: 4 },
//             width: '100%',
//             borderRadius: 2,
//             position: 'relative',
//             overflow: 'hidden'
//           }}
//         >
//           <Box sx={{ mb: 3, textAlign: 'center' }}>
//             <Typography component="h2" variant="h5" sx={{ fontWeight: 'bold' }}>
//               Welcome Back
//             </Typography>
//             <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
//               Sign in to your account to continue
//             </Typography>
//           </Box>

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

//           <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
//             <TextField
//               margin="normal"
//               required
//               fullWidth
//               id="username"
//               label="Username"
//               name="username"
//               autoComplete="username"
//               autoFocus
//               value={formData.username}
//               onChange={handleChange}
//               error={!!errors.username}
//               helperText={errors.username || "Enter your username"}
//               disabled={loading}
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <PersonIcon color="action" />
//                   </InputAdornment>
//                 ),
//               }}
//               sx={{ mb: 2 }}
//             />
            
//             <TextField
//               margin="normal"
//               required
//               fullWidth
//               name="password"
//               label="Password"
//               type={showPassword ? 'text' : 'password'}
//               id="password"
//               autoComplete="current-password"
//               value={formData.password}
//               onChange={handleChange}
//               error={!!errors.password}
//               helperText={errors.password}
//               disabled={loading}
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <LockIcon color="action" />
//                   </InputAdornment>
//                 ),
//                 endAdornment: (
//                   <InputAdornment position="end">
//                     <IconButton
//                       onClick={handleTogglePasswordVisibility}
//                       edge="end"
//                       disabled={loading}
//                     >
//                       {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
//                     </IconButton>
//                   </InputAdornment>
//                 )
//               }}
//             />

//             <Box sx={{ textAlign: 'right', mt: 1, mb: 3 }}>
//               <Link 
//                 component={RouterLink} 
//                 to="/forgot-password" 
//                 variant="body2"
//                 sx={{ 
//                   textDecoration: 'none', 
//                   '&:hover': { textDecoration: 'underline' },
//                   pointerEvents: loading ? 'none' : 'auto',
//                   opacity: loading ? 0.5 : 1
//                 }}
//               >
//                 Forgot password?
//               </Link>
//             </Box>

//             <Button
//               type="submit"
//               fullWidth
//               variant="contained"
//               size="large"
//               disabled={loading}
//               sx={{
//                 py: 1.5,
//                 fontSize: '1rem',
//                 fontWeight: 'bold',
//                 borderRadius: 1
//               }}
//             >
//               {loading ? (
//                 <CircularProgress size={24} color="inherit" />
//               ) : (
//                 'Sign In'
//               )}
//             </Button>
//           </Box>

//           <Box sx={{ textAlign: 'center', mt: 3 }}>
//             <Typography variant="body2">
//               Don't have an account?{' '}
//               <Link 
//                 component={RouterLink} 
//                 to="/signup" 
//                 variant="body2"
//                 sx={{ 
//                   textDecoration: 'none', 
//                   '&:hover': { textDecoration: 'underline' },
//                   fontWeight: 'medium'
//                 }}
//               >
//                 Request Access
//               </Link>
//             </Typography>
//           </Box>
//         </Paper>

//         {/* Footer */}
//         <Box sx={{ mt: 4, textAlign: 'center' }}>
//           <Typography variant="body2" color="text.secondary">
//             © {new Date().getFullYear()} Mesay Operations. All rights reserved.
//           </Typography>
//         </Box>
//       </Box>
//     </Container>
//   );
// };

// export default Login;