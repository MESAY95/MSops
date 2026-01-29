// import React from 'react';
// import { Navigate, Outlet } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import { CircularProgress, Box } from '@mui/material';

// const ProtectedRoute = ({ allowedRoles = [] }) => {
//   const { user, loading } = useAuth();

//   if (loading) {
//     return (
//       <Box 
//         display="flex" 
//         justifyContent="center" 
//         alignItems="center" 
//         minHeight="100vh"
//       >
//         <CircularProgress />
//       </Box>
//     );
//   }

//   if (!user) {
//     return <Navigate to="/login" replace />;
//   }

//   if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
//     return <Navigate to="/unauthorized" replace />;
//   }

//   return <Outlet />;
// };

// export default ProtectedRoute; // This is the default export


// // import React from 'react';
// // import { Navigate, useLocation } from 'react-router-dom';
// // import { useAuth } from '../contexts/AuthContext';
// // import { CircularProgress, Box } from '@mui/material';

// // const ProtectedRoute = ({ children, roles = [] }) => {
// //   const { user, loading } = useAuth();
// //   const location = useLocation();

// //   if (loading) {
// //     return (
// //       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
// //         <CircularProgress />
// //       </Box>
// //     );
// //   }

// //   if (!user) {
// //     return <Navigate to="/login" state={{ from: location }} replace />;
// //   }

// //   if (roles.length > 0 && !roles.includes(user.role)) {
// //     return <Navigate to="/dashboard" replace />;
// //   }

// //   return children;
// // };

// // export default ProtectedRoute;