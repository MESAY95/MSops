// import React, { useState, useEffect } from 'react';
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
//   Chip,
//   Avatar,
//   List,
//   ListItem,
//   ListItemText,
//   ListItemIcon,
//   LinearProgress,
//   IconButton,
//   Tabs,
//   Tab,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   Alert
// } from '@mui/material';
// import {
//   Assignment,
//   Today,
//   AccessTime,
//   CheckCircle,
//   Pending,
//   Error,
//   CalendarToday,
//   Person,
//   Dashboard as DashboardIcon,
//   Notifications,
//   TrendingUp,
//   BarChart,
//   MoreVert,
//   Add,
//   Visibility,
//   Edit,
//   Delete,
//   Refresh,
//   FilterList,
//   Search,
//   Download,
//   Print,
//   Share,
//   Favorite,
//   Star,
//   TrendingDown
// } from '@mui/icons-material';
// import { useAuth } from '../../context/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import { toast } from 'react-hot-toast';

// // Mock data for employee tasks
// const mockTasks = [
//   {
//     id: 1,
//     title: 'Complete monthly report',
//     description: 'Prepare and submit monthly performance report',
//     dueDate: '2024-01-20',
//     priority: 'high',
//     status: 'in-progress',
//     progress: 65,
//     category: 'Documentation'
//   },
//   {
//     id: 2,
//     title: 'Attend team meeting',
//     description: 'Weekly team sync-up meeting',
//     dueDate: '2024-01-15',
//     priority: 'medium',
//     status: 'pending',
//     progress: 0,
//     category: 'Meeting'
//   },
//   {
//     id: 3,
//     title: 'Client presentation',
//     description: 'Prepare slides for client presentation',
//     dueDate: '2024-01-18',
//     priority: 'high',
//     status: 'in-progress',
//     progress: 40,
//     category: 'Presentation'
//   },
//   {
//     id: 4,
//     title: 'Code review',
//     description: 'Review pull requests from junior team members',
//     dueDate: '2024-01-16',
//     priority: 'medium',
//     status: 'completed',
//     progress: 100,
//     category: 'Development'
//   },
//   {
//     id: 5,
//     title: 'Bug fixes',
//     description: 'Fix reported bugs in production',
//     dueDate: '2024-01-19',
//     priority: 'high',
//     status: 'pending',
//     progress: 0,
//     category: 'Maintenance'
//   }
// ];

// // Mock data for attendance
// const mockAttendance = [
//   { date: '2024-01-01', checkIn: '09:00', checkOut: '18:00', status: 'present' },
//   { date: '2024-01-02', checkIn: '08:45', checkOut: '17:50', status: 'present' },
//   { date: '2024-01-03', checkIn: '09:15', checkOut: '18:30', status: 'present', overtime: '1.5' },
//   { date: '2024-01-04', checkIn: '09:00', checkOut: '17:00', status: 'present' },
//   { date: '2024-01-05', checkIn: '09:30', checkOut: '17:45', status: 'present' }
// ];

// // Mock notifications
// const mockNotifications = [
//   { id: 1, title: 'New task assigned', message: 'You have been assigned a new task', time: '10 minutes ago', read: false },
//   { id: 2, title: 'Meeting reminder', message: 'Team meeting at 2 PM today', time: '1 hour ago', read: true },
//   { id: 3, title: 'Deadline approaching', message: 'Monthly report deadline in 2 days', time: '2 hours ago', read: false },
//   { id: 4, title: 'System update', message: 'System maintenance scheduled for Sunday', time: '1 day ago', read: true }
// ];

// const EmployeeDashboard = () => {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState(0);
//   const [tasks, setTasks] = useState(mockTasks);
//   const [attendance, setAttendance] = useState(mockAttendance);
//   const [notifications, setNotifications] = useState(mockNotifications);
//   const [openTaskDialog, setOpenTaskDialog] = useState(false);
//   const [selectedTask, setSelectedTask] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');

//   useEffect(() => {
//     // In a real app, you would fetch employee data here
//     fetchEmployeeData();
//   }, []);

//   const fetchEmployeeData = async () => {
//     // This would be an API call in a real application
//     // Example: const response = await api.get('/employee/dashboard-data');
//     console.log('Fetching employee data...');
//   };

//   const handleTabChange = (event, newValue) => {
//     setActiveTab(newValue);
//   };

//   const handleTaskClick = (task) => {
//     setSelectedTask(task);
//     setOpenTaskDialog(true);
//   };

//   const handleCloseDialog = () => {
//     setOpenTaskDialog(false);
//     setSelectedTask(null);
//   };

//   const handleTaskUpdate = (taskId, updates) => {
//     setTasks(tasks.map(task => 
//       task.id === taskId ? { ...task, ...updates } : task
//     ));
//     toast.success('Task updated successfully!');
//   };

//   const markNotificationAsRead = (notificationId) => {
//     setNotifications(notifications.map(notif => 
//       notif.id === notificationId ? { ...notif, read: true } : notif
//     ));
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'completed': return 'success';
//       case 'in-progress': return 'primary';
//       case 'pending': return 'warning';
//       default: return 'default';
//     }
//   };

//   const getPriorityColor = (priority) => {
//     switch (priority) {
//       case 'high': return 'error';
//       case 'medium': return 'warning';
//       case 'low': return 'success';
//       default: return 'default';
//     }
//   };

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case 'completed': return <CheckCircle color="success" />;
//       case 'in-progress': return <AccessTime color="primary" />;
//       case 'pending': return <Pending color="warning" />;
//       default: return <Error color="error" />;
//     }
//   };

//   const filteredTasks = tasks.filter(task =>
//     task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     task.category.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const stats = {
//     totalTasks: tasks.length,
//     completedTasks: tasks.filter(t => t.status === 'completed').length,
//     inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
//     pendingTasks: tasks.filter(t => t.status === 'pending').length,
//     attendanceRate: '95%',
//     productivityScore: '88%'
//   };

//   // Calculate completion percentage
//   const completionPercentage = tasks.length > 0 
//     ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100
//     : 0;

//   return (
//     <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
//       {/* Header Section */}
//       <Box sx={{ mb: 4 }}>
//         <Grid container alignItems="center" justifyContent="space-between" spacing={2}>
//           <Grid item xs={12} md={6}>
//             <Box display="flex" alignItems="center" gap={2}>
//               <Avatar
//                 sx={{
//                   width: 64,
//                   height: 64,
//                   bgcolor: 'primary.main',
//                   fontSize: '1.5rem'
//                 }}
//               >
//                 {user?.name?.charAt(0).toUpperCase() || 'E'}
//               </Avatar>
//               <Box>
//                 <Typography variant="h4" gutterBottom>
//                   Welcome back, {user?.name || 'Employee'}!
//                 </Typography>
//                 <Typography variant="body1" color="textSecondary">
//                   Here's what's happening with your tasks today.
//                 </Typography>
//                 <Chip
//                   label={user?.role?.toUpperCase() || 'EMPLOYEE'}
//                   color="primary"
//                   size="small"
//                   sx={{ mt: 1 }}
//                 />
//               </Box>
//             </Box>
//           </Grid>
//           <Grid item xs={12} md={6}>
//             <Box display="flex" justifyContent="flex-end" gap={2}>
//               <Button
//                 variant="contained"
//                 startIcon={<Today />}
//                 onClick={() => navigate('/hr/attendance')}
//               >
//                 Clock In/Out
//               </Button>
//               <Button
//                 variant="outlined"
//                 startIcon={<CalendarToday />}
//                 onClick={() => navigate('/hr/leave')}
//               >
//                 Apply Leave
//               </Button>
//               <IconButton color="primary">
//                 <Notifications />
//                 {notifications.filter(n => !n.read).length > 0 && (
//                   <Box
//                     sx={{
//                       position: 'absolute',
//                       top: 8,
//                       right: 8,
//                       width: 8,
//                       height: 8,
//                       bgcolor: 'error.main',
//                       borderRadius: '50%'
//                     }}
//                   />
//                 )}
//               </IconButton>
//             </Box>
//           </Grid>
//         </Grid>
//       </Box>

//       {/* Stats Overview */}
//       <Grid container spacing={3} sx={{ mb: 4 }}>
//         <Grid item xs={12} sm={6} md={3}>
//           <Card>
//             <CardContent>
//               <Box display="flex" alignItems="center" justifyContent="space-between">
//                 <Box>
//                   <Typography color="textSecondary" gutterBottom>
//                     Total Tasks
//                   </Typography>
//                   <Typography variant="h4">{stats.totalTasks}</Typography>
//                 </Box>
//                 <Avatar sx={{ bgcolor: 'primary.main' }}>
//                   <Assignment />
//                 </Avatar>
//               </Box>
//               <LinearProgress
//                 variant="determinate"
//                 value={completionPercentage}
//                 sx={{ mt: 2 }}
//               />
//               <Typography variant="caption" color="textSecondary">
//                 {completionPercentage.toFixed(0)}% completed
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>

//         <Grid item xs={12} sm={6} md={3}>
//           <Card>
//             <CardContent>
//               <Box display="flex" alignItems="center" justifyContent="space-between">
//                 <Box>
//                   <Typography color="textSecondary" gutterBottom>
//                     In Progress
//                   </Typography>
//                   <Typography variant="h4">{stats.inProgressTasks}</Typography>
//                 </Box>
//                 <Avatar sx={{ bgcolor: 'info.main' }}>
//                   <AccessTime />
//                 </Avatar>
//               </Box>
//               <Typography variant="body2" sx={{ mt: 1, color: 'info.main' }}>
//                 Active tasks
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>

//         <Grid item xs={12} sm={6} md={3}>
//           <Card>
//             <CardContent>
//               <Box display="flex" alignItems="center" justifyContent="space-between">
//                 <Box>
//                   <Typography color="textSecondary" gutterBottom>
//                     Attendance
//                   </Typography>
//                   <Typography variant="h4">{stats.attendanceRate}</Typography>
//                 </Box>
//                 <Avatar sx={{ bgcolor: 'success.main' }}>
//                   <CheckCircle />
//                 </Avatar>
//               </Box>
//               <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
//                 This month
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>

//         <Grid item xs={12} sm={6} md={3}>
//           <Card>
//             <CardContent>
//               <Box display="flex" alignItems="center" justifyContent="space-between">
//                 <Box>
//                   <Typography color="textSecondary" gutterBottom>
//                     Productivity
//                   </Typography>
//                   <Typography variant="h4">{stats.productivityScore}</Typography>
//                 </Box>
//                 <Avatar sx={{ bgcolor: 'warning.main' }}>
//                   <TrendingUp />
//                 </Avatar>
//               </Box>
//               <Typography variant="body2" sx={{ mt: 1, color: 'warning.main' }}>
//                 Last 30 days
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>

//       {/* Main Content */}
//       <Grid container spacing={3}>
//         {/* Left Column - Tasks */}
//         <Grid item xs={12} lg={8}>
//           <Paper sx={{ p: 3, height: '100%' }}>
//             <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
//               <Typography variant="h6">
//                 My Tasks
//               </Typography>
//               <Box display="flex" gap={1}>
//                 <TextField
//                   size="small"
//                   placeholder="Search tasks..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   InputProps={{
//                     startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
//                   }}
//                 />
//                 <IconButton>
//                   <FilterList />
//                 </IconButton>
//                 <IconButton>
//                   <Refresh />
//                 </IconButton>
//               </Box>
//             </Box>

//             <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
//               <Tab label="All Tasks" />
//               <Tab label="In Progress" />
//               <Tab label="Pending" />
//               <Tab label="Completed" />
//             </Tabs>

//             <List>
//               {filteredTasks
//                 .filter(task => {
//                   if (activeTab === 0) return true;
//                   if (activeTab === 1) return task.status === 'in-progress';
//                   if (activeTab === 2) return task.status === 'pending';
//                   if (activeTab === 3) return task.status === 'completed';
//                   return true;
//                 })
//                 .map((task) => (
//                   <Card key={task.id} sx={{ mb: 2 }}>
//                     <CardContent>
//                       <Box display="flex" justifyContent="space-between" alignItems="flex-start">
//                         <Box flex={1}>
//                           <Typography variant="h6" gutterBottom>
//                             {task.title}
//                           </Typography>
//                           <Typography variant="body2" color="textSecondary" paragraph>
//                             {task.description}
//                           </Typography>
//                           <Box display="flex" gap={1} flexWrap="wrap">
//                             <Chip
//                               label={task.category}
//                               size="small"
//                               variant="outlined"
//                             />
//                             <Chip
//                               label={task.priority}
//                               size="small"
//                               color={getPriorityColor(task.priority)}
//                             />
//                             <Chip
//                               label={task.status}
//                               size="small"
//                               color={getStatusColor(task.status)}
//                               icon={getStatusIcon(task.status)}
//                             />
//                           </Box>
//                         </Box>
//                         <Box display="flex" flexDirection="column" alignItems="flex-end">
//                           <Typography variant="caption" color="textSecondary">
//                             Due: {task.dueDate}
//                           </Typography>
//                           <Box mt={1}>
//                             <IconButton size="small" onClick={() => handleTaskClick(task)}>
//                               <Visibility />
//                             </IconButton>
//                             <IconButton 
//                               size="small" 
//                               onClick={() => handleTaskUpdate(task.id, { status: 'completed' })}
//                             >
//                               <CheckCircle />
//                             </IconButton>
//                           </Box>
//                         </Box>
//                       </Box>
//                       <Box mt={2}>
//                         <LinearProgress
//                           variant="determinate"
//                           value={task.progress}
//                           sx={{ height: 6, borderRadius: 3 }}
//                         />
//                         <Typography variant="caption" color="textSecondary">
//                           {task.progress}% complete
//                         </Typography>
//                       </Box>
//                     </CardContent>
//                   </Card>
//                 ))}
//             </List>

//             {filteredTasks.length === 0 && (
//               <Box textAlign="center" py={4}>
//                 <Assignment sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
//                 <Typography variant="h6" color="textSecondary">
//                   No tasks found
//                 </Typography>
//                 <Typography variant="body2" color="textSecondary">
//                   {searchQuery ? 'Try a different search term' : 'All tasks are completed!'}
//                 </Typography>
//               </Box>
//             )}
//           </Paper>
//         </Grid>

//         {/* Right Column - Sidebar */}
//         <Grid item xs={12} lg={4}>
//           {/* Recent Activity */}
//           <Paper sx={{ p: 3, mb: 3 }}>
//             <Typography variant="h6" gutterBottom>
//               Recent Activity
//             </Typography>
//             <List>
//               <ListItem>
//                 <ListItemIcon>
//                   <CheckCircle color="success" />
//                 </ListItemIcon>
//                 <ListItemText
//                   primary="Task completed"
//                   secondary="Monthly report submitted - 2 hours ago"
//                 />
//               </ListItem>
//               <ListItem>
//                 <ListItemIcon>
//                   <AccessTime color="primary" />
//                 </ListItemIcon>
//                 <ListItemText
//                   primary="Clock out"
//                   secondary="Logged out at 6:30 PM - Today"
//                 />
//               </ListItem>
//               <ListItem>
//                 <ListItemIcon>
//                   <Notifications color="warning" />
//                 </ListItemIcon>
//                 <ListItemText
//                   primary="New notification"
//                   secondary="Team meeting reminder - 1 hour ago"
//                 />
//               </ListItem>
//             </List>
//           </Paper>

//           {/* Attendance Summary */}
//           <Paper sx={{ p: 3, mb: 3 }}>
//             <Typography variant="h6" gutterBottom>
//               This Week's Attendance
//             </Typography>
//             <TableContainer>
//               <Table size="small">
//                 <TableHead>
//                   <TableRow>
//                     <TableCell>Date</TableCell>
//                     <TableCell>Check In</TableCell>
//                     <TableCell>Check Out</TableCell>
//                     <TableCell>Status</TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {attendance.map((record, index) => (
//                     <TableRow key={index}>
//                       <TableCell>{record.date}</TableCell>
//                       <TableCell>{record.checkIn}</TableCell>
//                       <TableCell>{record.checkOut}</TableCell>
//                       <TableCell>
//                         <Chip
//                           label={record.status}
//                           size="small"
//                           color={record.status === 'present' ? 'success' : 'error'}
//                         />
//                         {record.overtime && (
//                           <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>
//                             +{record.overtime}h OT
//                           </Typography>
//                         )}
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </TableContainer>
//             <Button
//               fullWidth
//               variant="outlined"
//               sx={{ mt: 2 }}
//               onClick={() => navigate('/hr/attendance')}
//             >
//               View Full Attendance
//             </Button>
//           </Paper>

//           {/* Notifications */}
//           <Paper sx={{ p: 3 }}>
//             <Typography variant="h6" gutterBottom>
//               Notifications
//             </Typography>
//             <List>
//               {notifications.map((notification) => (
//                 <ListItem
//                   key={notification.id}
//                   sx={{
//                     bgcolor: notification.read ? 'transparent' : 'action.hover',
//                     borderRadius: 1,
//                     mb: 1
//                   }}
//                   secondaryAction={
//                     <IconButton 
//                       size="small" 
//                       onClick={() => markNotificationAsRead(notification.id)}
//                     >
//                       <MoreVert />
//                     </IconButton>
//                   }
//                 >
//                   <ListItemIcon>
//                     <Notifications color={notification.read ? "disabled" : "primary"} />
//                   </ListItemIcon>
//                   <ListItemText
//                     primary={notification.title}
//                     secondary={
//                       <>
//                         <Typography variant="body2" color="textSecondary">
//                           {notification.message}
//                         </Typography>
//                         <Typography variant="caption" color="textSecondary">
//                           {notification.time}
//                         </Typography>
//                       </>
//                     }
//                   />
//                 </ListItem>
//               ))}
//             </List>
//             <Button
//               fullWidth
//               variant="text"
//               onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
//             >
//               Mark all as read
//             </Button>
//           </Paper>
//         </Grid>
//       </Grid>

//       {/* Task Detail Dialog */}
//       <Dialog open={openTaskDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
//         {selectedTask && (
//           <>
//             <DialogTitle>
//               <Box display="flex" justifyContent="space-between" alignItems="center">
//                 <Typography variant="h6">{selectedTask.title}</Typography>
//                 <Chip
//                   label={selectedTask.status}
//                   color={getStatusColor(selectedTask.status)}
//                 />
//               </Box>
//             </DialogTitle>
//             <DialogContent dividers>
//               <Grid container spacing={3}>
//                 <Grid item xs={12}>
//                   <Typography variant="subtitle1" gutterBottom>
//                     Description
//                   </Typography>
//                   <Typography variant="body1" paragraph>
//                     {selectedTask.description}
//                   </Typography>
//                 </Grid>
                
//                 <Grid item xs={12} md={6}>
//                   <Typography variant="subtitle1" gutterBottom>
//                     Details
//                   </Typography>
//                   <List dense>
//                     <ListItem>
//                       <ListItemText 
//                         primary="Due Date" 
//                         secondary={selectedTask.dueDate} 
//                       />
//                     </ListItem>
//                     <ListItem>
//                       <ListItemText 
//                         primary="Priority" 
//                         secondary={
//                           <Chip 
//                             label={selectedTask.priority} 
//                             size="small" 
//                             color={getPriorityColor(selectedTask.priority)}
//                           />
//                         } 
//                       />
//                     </ListItem>
//                     <ListItem>
//                       <ListItemText 
//                         primary="Category" 
//                         secondary={selectedTask.category} 
//                       />
//                     </ListItem>
//                   </List>
//                 </Grid>
                
//                 <Grid item xs={12} md={6}>
//                   <Typography variant="subtitle1" gutterBottom>
//                     Progress
//                   </Typography>
//                   <Box>
//                     <LinearProgress
//                       variant="determinate"
//                       value={selectedTask.progress}
//                       sx={{ height: 10, borderRadius: 5, mb: 1 }}
//                     />
//                     <Typography variant="body2" align="center">
//                       {selectedTask.progress}% Complete
//                     </Typography>
//                   </Box>
//                 </Grid>
//               </Grid>
//             </DialogContent>
//             <DialogActions>
//               <Button onClick={handleCloseDialog}>Close</Button>
//               <Button
//                 variant="contained"
//                 onClick={() => {
//                   handleTaskUpdate(selectedTask.id, { status: 'completed', progress: 100 });
//                   handleCloseDialog();
//                 }}
//                 disabled={selectedTask.status === 'completed'}
//               >
//                 Mark as Complete
//               </Button>
//             </DialogActions>
//           </>
//         )}
//       </Dialog>
//     </Container>
//   );
// };

// export default EmployeeDashboard;