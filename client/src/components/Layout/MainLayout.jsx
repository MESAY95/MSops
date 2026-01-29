// import React, { useState } from 'react';
// import { Outlet, useNavigate } from 'react-router-dom';
// import {
//   AppBar,
//   Box,
//   CssBaseline,
//   Drawer,
//   IconButton,
//   List,
//   ListItem,
//   ListItemIcon,
//   ListItemText,
//   Toolbar,
//   Typography,
//   Avatar,
//   Menu,
//   MenuItem,
//   Divider,
//   Badge
// } from '@mui/material';
// import {
//   Menu as MenuIcon,
//   Dashboard as DashboardIcon,
//   People as PeopleIcon,
//   Business as BusinessIcon,
//   Inventory as InventoryIcon,
//   Factory as FactoryIcon,
//   AttachMoney as AttachMoneyIcon,
//   Store as StoreIcon,
//   Assessment as AssessmentIcon,
//   Settings as SettingsIcon,
//   Logout as LogoutIcon,
//   Person as PersonIcon,
//   Notifications as NotificationsIcon
// } from '@mui/icons-material';
// import { useAuth } from '../contexts/AuthContext';

// const drawerWidth = 240;

// const MainLayout = () => {
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [anchorEl, setAnchorEl] = useState(null);
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   const handleDrawerToggle = () => {
//     setMobileOpen(!mobileOpen);
//   };

//   const handleProfileMenuOpen = (event) => {
//     setAnchorEl(event.currentTarget);
//   };

//   const handleProfileMenuClose = () => {
//     setAnchorEl(null);
//   };

//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//   };

//   const navigationItems = [
//     { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
//     { text: 'User Management', icon: <PeopleIcon />, path: '/user-management', roles: ['admin'] },
//     { text: 'Department Management', icon: <BusinessIcon />, path: '/departmentmanagement', roles: ['admin', 'manager'] },
//     { text: 'Company Management', icon: <BusinessIcon />, path: '/companyManagements', roles: ['admin'] },
//     { divider: true },
//     { text: 'HR Management', icon: <PeopleIcon />, submenu: [
//       { text: 'Employee Management', path: '/hr/employeemanagements', roles: ['admin', 'manager'] },
//       { text: 'Attendance', path: '/hr/attendances', roles: ['admin', 'manager', 'employee'] },
//       { text: 'Leave Management', path: '/hr/leaves', roles: ['admin', 'manager', 'employee'] },
//       { text: 'Overtime Checking', path: '/hr/overtime-checking', roles: ['admin', 'manager'] },
//     ]},
//     { text: 'Supply Chain', icon: <InventoryIcon />, submenu: [
//       { text: 'Material Management', path: '/supplychain/materials', roles: ['admin', 'manager'] },
//       { text: 'Product Management', path: '/supplychain/products', roles: ['admin', 'manager'] },
//       { text: 'Material RI', path: '/supplychain/material-ri', roles: ['admin', 'manager'] },
//       { text: 'Product RI', path: '/supplychain/product-ri', roles: ['admin', 'manager'] },
//       { text: 'Inventory Plan', path: '/supplychain/inventoryplans', roles: ['admin', 'manager'] },
//     ]},
//     { text: 'Production', icon: <FactoryIcon />, submenu: [
//       { text: 'Production Management', path: '/production/production-managements', roles: ['admin', 'manager'] },
//       { text: 'Production Schedule', path: '/production/productionSchedules', roles: ['admin', 'manager'] },
//       { text: 'Product Formulation', path: '/production/productformulation', roles: ['admin', 'manager'] },
//       { text: 'Line Management', path: '/production/lineManagements', roles: ['admin', 'manager'] },
//       { text: 'Production Plan', path: '/productionplan', roles: ['admin', 'manager'] },
//       { text: 'Labor Cost', path: '/production/labor-cost', roles: ['admin', 'manager'] },
//       { text: 'Activity Management', path: '/production/activityManagements', roles: ['admin', 'manager'] },
//     ]},
//     { text: 'Finance', icon: <AttachMoneyIcon />, submenu: [
//       { text: 'Pricing', path: '/finance/pricings', roles: ['admin', 'manager'] },
//       { text: 'Material Cost', path: '/finance/materialcosts', roles: ['admin', 'manager'] },
//       { text: 'Petty Cash', path: '/finance/pettycashmanagement', roles: ['admin', 'manager'] },
//       { text: 'Payroll', path: '/finance/payrollmanagement', roles: ['admin', 'manager'] },
//       { text: 'Expense Management', path: '/finance/expense-management', roles: ['admin', 'manager'] },
//       { text: 'Overtime Approval', path: '/finance/overtime-approval', roles: ['admin', 'manager'] },
//     ]},
//     { text: 'Sales', icon: <StoreIcon />, submenu: [
//       { text: 'Daily Sales', path: '/sales/daily-sales', roles: ['admin', 'manager'] },
//       { text: 'Sales Plan', path: '/sales/sales-plans', roles: ['admin', 'manager'] },
//     ]},
//     { divider: true },
//     { text: 'Reports', icon: <AssessmentIcon />, path: '/reports', roles: ['admin', 'manager'] },
//   ];

//   const hasPermission = (roles) => {
//     if (!roles) return true;
//     return roles.includes(user?.role);
//   };

//   const drawer = (
//     <div>
//       <Toolbar>
//         <Typography variant="h6" noWrap>
//           Mesay Operations
//         </Typography>
//       </Toolbar>
//       <Divider />
//       <List>
//         {navigationItems.map((item, index) => {
//           if (item.divider) {
//             return <Divider key={index} />;
//           }
          
//           if (item.submenu) {
//             return (
//               <Box key={index}>
//                 <ListItem>
//                   <ListItemIcon>{item.icon}</ListItemIcon>
//                   <ListItemText primary={item.text} />
//                 </ListItem>
//                 <List component="div" disablePadding>
//                   {item.submenu.map((subItem, subIndex) => {
//                     if (hasPermission(subItem.roles)) {
//                       return (
//                         <ListItem
//                           key={`${index}-${subIndex}`}
//                           button
//                           onClick={() => navigate(subItem.path)}
//                           sx={{ pl: 4 }}
//                         >
//                           <ListItemText primary={subItem.text} />
//                         </ListItem>
//                       );
//                     }
//                     return null;
//                   })}
//                 </List>
//               </Box>
//             );
//           }
          
//           if (hasPermission(item.roles)) {
//             return (
//               <ListItem
//                 key={index}
//                 button
//                 onClick={() => navigate(item.path)}
//               >
//                 <ListItemIcon>{item.icon}</ListItemIcon>
//                 <ListItemText primary={item.text} />
//               </ListItem>
//             );
//           }
          
//           return null;
//         })}
//       </List>
//     </div>
//   );

//   return (
//     <Box sx={{ display: 'flex' }}>
//       <CssBaseline />
//       <AppBar
//         position="fixed"
//         sx={{
//           width: { sm: `calc(100% - ${drawerWidth}px)` },
//           ml: { sm: `${drawerWidth}px` },
//         }}
//       >
//         <Toolbar>
//           <IconButton
//             color="inherit"
//             aria-label="open drawer"
//             edge="start"
//             onClick={handleDrawerToggle}
//             sx={{ mr: 2, display: { sm: 'none' } }}
//           >
//             <MenuIcon />
//           </IconButton>
//           <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
//             Operation Management System
//           </Typography>
          
//           <IconButton color="inherit">
//             <Badge badgeContent={4} color="error">
//               <NotificationsIcon />
//             </Badge>
//           </IconButton>
          
//           <IconButton onClick={handleProfileMenuOpen} color="inherit">
//             <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
//               {user?.firstName?.[0] || <PersonIcon />}
//             </Avatar>
//           </IconButton>
          
//           <Menu
//             anchorEl={anchorEl}
//             open={Boolean(anchorEl)}
//             onClose={handleProfileMenuClose}
//           >
//             <MenuItem disabled>
//               <Typography variant="body2">
//                 {user?.firstName} {user?.lastName}
//                 <br />
//                 <Typography variant="caption" color="text.secondary">
//                   {user?.role} - {user?.department}
//                 </Typography>
//               </Typography>
//             </MenuItem>
//             <Divider />
//             <MenuItem onClick={() => navigate('/profile')}>
//               <ListItemIcon>
//                 <PersonIcon fontSize="small" />
//               </ListItemIcon>
//               Profile
//             </MenuItem>
//             <MenuItem onClick={handleLogout}>
//               <ListItemIcon>
//                 <LogoutIcon fontSize="small" />
//               </ListItemIcon>
//               Logout
//             </MenuItem>
//           </Menu>
//         </Toolbar>
//       </AppBar>
//       <Box
//         component="nav"
//         sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
//       >
//         <Drawer
//           variant="temporary"
//           open={mobileOpen}
//           onClose={handleDrawerToggle}
//           ModalProps={{
//             keepMounted: true, // Better open performance on mobile.
//           }}
//           sx={{
//             display: { xs: 'block', sm: 'none' },
//             '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
//           }}
//         >
//           {drawer}
//         </Drawer>
//         <Drawer
//           variant="permanent"
//           sx={{
//             display: { xs: 'none', sm: 'block' },
//             '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
//           }}
//           open
//         >
//           {drawer}
//         </Drawer>
//       </Box>
//       <Box
//         component="main"
//         sx={{
//           flexGrow: 1,
//           p: 3,
//           width: { sm: `calc(100% - ${drawerWidth}px)` },
//           mt: 8
//         }}
//       >
//         <Outlet />
//       </Box>
//     </Box>
//   );
// };

// export default MainLayout;