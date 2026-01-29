// import React, { useState } from 'react';
// import {
//   AppBar,
//   Toolbar,
//   Typography,
//   Button,
//   Box,
//   IconButton,
//   Menu,
//   MenuItem,
//   Avatar,
//   Container,
//   useMediaQuery,
//   Drawer,
//   List,
//   ListItem,
//   ListItemIcon,
//   ListItemText,
//   Divider
// } from '@mui/material';
// import {
//   Menu as MenuIcon,
//   Dashboard,
//   People,
//   Assignment,
//   ExitToApp,
//   AccountCircle
// } from '@mui/icons-material';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';

// const Navbar = () => {
//   const [anchorEl, setAnchorEl] = useState(null);
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();
//   const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));

//   const handleMenu = (event) => {
//     setAnchorEl(event.currentTarget);
//   };

//   const handleClose = () => {
//     setAnchorEl(null);
//   };

//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//     handleClose();
//   };

//   const handleDrawerToggle = () => {
//     setMobileOpen(!mobileOpen);
//   };

//   const getDashboardLink = () => {
//     if (!user) return '/login';
//     return `/${user.role}/dashboard`;
//   };

//   const drawer = (
//     <Box onClick={handleDrawerToggle} sx={{ width: 250 }}>
//       <List>
//         <ListItem button onClick={() => navigate(getDashboardLink())}>
//           <ListItemIcon>
//             <Dashboard />
//           </ListItemIcon>
//           <ListItemText primary="Dashboard" />
//         </ListItem>
        
//         {user?.role === 'admin' && (
//           <ListItem button onClick={() => navigate('/admin/users')}>
//             <ListItemIcon>
//               <People />
//             </ListItemIcon>
//             <ListItemText primary="Users" />
//           </ListItem>
//         )}
        
//         <ListItem button onClick={() => navigate('/tasks')}>
//           <ListItemIcon>
//             <Assignment />
//           </ListItemIcon>
//           <ListItemText primary="Tasks" />
//         </ListItem>
//       </List>
//       <Divider />
//       <List>
//         <ListItem button onClick={handleLogout}>
//           <ListItemIcon>
//             <ExitToApp />
//           </ListItemIcon>
//           <ListItemText primary="Logout" />
//         </ListItem>
//       </List>
//     </Box>
//   );

//   return (
//     <>
//       <AppBar position="static">
//         <Container maxWidth="xl">
//           <Toolbar>
//             {user && isMobile && (
//               <IconButton
//                 color="inherit"
//                 edge="start"
//                 onClick={handleDrawerToggle}
//                 sx={{ mr: 2 }}
//               >
//                 <MenuIcon />
//               </IconButton>
//             )}
            
//             <Typography
//               variant="h6"
//               component="div"
//               sx={{ flexGrow: 1, cursor: 'pointer' }}
//               onClick={() => navigate(getDashboardLink())}
//             >
//               Operation Management System
//             </Typography>

//             {user ? (
//               <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
//                 <Button
//                   color="inherit"
//                   onClick={() => navigate(getDashboardLink())}
//                   startIcon={<Dashboard />}
//                 >
//                   Dashboard
//                 </Button>
                
//                 {user.role === 'admin' && (
//                   <Button
//                     color="inherit"
//                     onClick={() => navigate('/admin/users')}
//                     startIcon={<People />}
//                   >
//                     Users
//                   </Button>
//                 )}
                
//                 <Button
//                   color="inherit"
//                   onClick={() => navigate('/tasks')}
//                   startIcon={<Assignment />}
//                 >
//                   Tasks
//                 </Button>

//                 <IconButton
//                   size="large"
//                   onClick={handleMenu}
//                   color="inherit"
//                 >
//                   <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
//                     <AccountCircle />
//                   </Avatar>
//                 </IconButton>
                
//                 <Menu
//                   anchorEl={anchorEl}
//                   open={Boolean(anchorEl)}
//                   onClose={handleClose}
//                 >
//                   <MenuItem disabled>
//                     <Typography variant="body2">
//                       Signed in as <strong>{user.name}</strong>
//                     </Typography>
//                   </MenuItem>
//                   <MenuItem onClick={() => navigate('/profile')}>
//                     <ListItemIcon>
//                       <AccountCircle fontSize="small" />
//                     </ListItemIcon>
//                     Profile
//                   </MenuItem>
//                   <MenuItem onClick={handleLogout}>
//                     <ListItemIcon>
//                       <ExitToApp fontSize="small" />
//                     </ListItemIcon>
//                     Logout
//                   </MenuItem>
//                 </Menu>
//               </Box>
//             ) : (
//               <Button color="inherit" onClick={() => navigate('/login')}>
//                 Login
//               </Button>
//             )}
//           </Toolbar>
//         </Container>
//       </AppBar>
      
//       {user && (
//         <Drawer
//           variant="temporary"
//           open={mobileOpen}
//           onClose={handleDrawerToggle}
//           ModalProps={{ keepMounted: true }}
//           sx={{
//             display: { xs: 'block', md: 'none' },
//             '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
//           }}
//         >
//           {drawer}
//         </Drawer>
//       )}
//     </>
//   );
// };

// export default Navbar;