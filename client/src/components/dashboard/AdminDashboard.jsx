// import React from 'react';
// import {
//   Container,
//   Grid,
//   Paper,
//   Typography,
//   Box,
//   Card,
//   CardContent,
//   CardActions,
//   Button,
//   List,
//   ListItem,
//   ListItemText,
//   ListItemIcon,
//   Avatar
// } from '@mui/material';
// import {
//   People,
//   Settings,
//   Analytics,
//   Security,
//   Assignment,
//   Dashboard as DashboardIcon
// } from '@mui/icons-material';

// const AdminDashboard = () => {
//   const modules = [
//     { title: 'User Management', icon: <People />, description: 'Manage all system users' },
//     { title: 'System Settings', icon: <Settings />, description: 'Configure system preferences' },
//     { title: 'Analytics', icon: <Analytics />, description: 'View system analytics' },
//     { title: 'Security', icon: <Security />, description: 'Security configurations' },
//     { title: 'Task Management', icon: <Assignment />, description: 'Manage all tasks' },
//     { title: 'Reports', icon: <DashboardIcon />, description: 'Generate reports' }
//   ];

//   const recentActivities = [
//     { action: 'New user registered', time: '10 minutes ago' },
//     { action: 'System backup completed', time: '1 hour ago' },
//     { action: 'Settings updated', time: '2 hours ago' }
//   ];

//   return (
//     <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
//       <Typography variant="h4" gutterBottom>
//         Admin Dashboard
//       </Typography>
      
//       <Grid container spacing={3}>
//         {/* Stats Cards */}
//         <Grid item xs={12} md={3}>
//           <Card>
//             <CardContent>
//               <Typography color="textSecondary" gutterBottom>
//                 Total Users
//               </Typography>
//               <Typography variant="h4">
//                 42
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>
        
//         <Grid item xs={12} md={3}>
//           <Card>
//             <CardContent>
//               <Typography color="textSecondary" gutterBottom>
//                 Active Tasks
//               </Typography>
//               <Typography variant="h4">
//                 156
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>
        
//         <Grid item xs={12} md={3}>
//           <Card>
//             <CardContent>
//               <Typography color="textSecondary" gutterBottom>
//                 System Health
//               </Typography>
//               <Typography variant="h4" color="success.main">
//                 98%
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>
        
//         <Grid item xs={12} md={3}>
//           <Card>
//             <CardContent>
//               <Typography color="textSecondary" gutterBottom>
//                 Storage Used
//               </Typography>
//               <Typography variant="h4">
//                 64%
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>

//         {/* Modules */}
//         <Grid item xs={12}>
//           <Typography variant="h6" gutterBottom>
//             System Modules
//           </Typography>
//           <Grid container spacing={2}>
//             {modules.map((module, index) => (
//               <Grid item xs={12} sm={6} md={4} key={index}>
//                 <Card>
//                   <CardContent>
//                     <Box display="flex" alignItems="center" mb={2}>
//                       <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
//                         {module.icon}
//                       </Avatar>
//                       <Typography variant="h6">
//                         {module.title}
//                       </Typography>
//                     </Box>
//                     <Typography variant="body2" color="textSecondary">
//                       {module.description}
//                     </Typography>
//                   </CardContent>
//                   <CardActions>
//                     <Button size="small" color="primary">
//                       Access
//                     </Button>
//                   </CardActions>
//                 </Card>
//               </Grid>
//             ))}
//           </Grid>
//         </Grid>

//         {/* Recent Activity */}
//         <Grid item xs={12} md={6}>
//           <Paper sx={{ p: 2 }}>
//             <Typography variant="h6" gutterBottom>
//               Recent Activity
//             </Typography>
//             <List>
//               {recentActivities.map((activity, index) => (
//                 <ListItem key={index}>
//                   <ListItemIcon>
//                     <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
//                       <People fontSize="small" />
//                     </Avatar>
//                   </ListItemIcon>
//                   <ListItemText
//                     primary={activity.action}
//                     secondary={activity.time}
//                   />
//                 </ListItem>
//               ))}
//             </List>
//           </Paper>
//         </Grid>

//         {/* Quick Actions */}
//         <Grid item xs={12} md={6}>
//           <Paper sx={{ p: 2 }}>
//             <Typography variant="h6" gutterBottom>
//               Quick Actions
//             </Typography>
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
//               <Button variant="contained" startIcon={<People />}>
//                 Add New User
//               </Button>
//               <Button variant="outlined" startIcon={<Settings />}>
//                 System Settings
//               </Button>
//               <Button variant="outlined" startIcon={<Analytics />}>
//                 View Reports
//               </Button>
//             </Box>
//           </Paper>
//         </Grid>
//       </Grid>
//     </Container>
//   );
// };

// export default AdminDashboard;