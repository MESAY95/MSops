// // src/components/Layout/ProtectedLayout.jsx
// import React, { useEffect } from 'react';
// import { Navigate, Outlet, useLocation } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';
// import { CircularProgress, Box } from '@mui/material';

// const ProtectedLayout = () => {
//   const { user, adminExists, loading } = useAuth();
//   const location = useLocation();

//   if (loading || adminExists === null) {
//     return (
//       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
//         <CircularProgress />
//       </Box>
//     );
//   }

//   // If no admin exists and user is not on register-admin page, redirect to register-admin
//   if (!adminExists && location.pathname !== '/register-admin') {
//     return <Navigate to="/register-admin" replace />;
//   }

//   // If admin exists and user is on register-admin page, redirect to login
//   if (adminExists && location.pathname === '/register-admin') {
//     return <Navigate to="/login" replace />;
//   }

//   // If admin exists but no user is logged in and not on login page, redirect to login
//   if (adminExists && !user && location.pathname !== '/login') {
//     return <Navigate to="/login" replace />;
//   }

//   // If user is logged in and on login/register-admin pages, redirect to dashboard
//   if (user && (location.pathname === '/login' || location.pathname === '/register-admin')) {
//     return <Navigate to="/dashboard" replace />;
//   }

//   return <Outlet />;
// };

// export default ProtectedLayout;