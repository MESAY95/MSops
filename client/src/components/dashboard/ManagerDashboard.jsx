// import React from 'react';
// import {
//   Container,
//   Grid,
//   Paper,
//   Typography,
//   Box,
//   Card,
//   CardContent,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Chip,
//   Button
// } from '@mui/material';
// import { People, Assignment, TrendingUp, Group } from '@mui/icons-material';

// const ManagerDashboard = () => {
//   const teamMembers = [
//     { name: 'John Doe', role: 'Developer', tasks: 5, status: 'active' },
//     { name: 'Jane Smith', role: 'Designer', tasks: 3, status: 'active' },
//     { name: 'Bob Johnson', role: 'Tester', tasks: 7, status: 'away' },
//     { name: 'Alice Brown', role: 'Analyst', tasks: 4, status: 'active' }
//   ];

//   const departmentTasks = [
//     { id: 1, title: 'Project Planning', priority: 'high', status: 'in-progress' },
//     { id: 2, title: 'Team Meeting', priority: 'medium', status: 'completed' },
//     { id: 3, title: 'Client Presentation', priority: 'high', status: 'pending' },
//     { id: 4, title: 'Budget Review', priority: 'low', status: 'in-progress' }
//   ];

//   return (
//     <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
//       <Typography variant="h4" gutterBottom>
//         Manager Dashboard
//       </Typography>
      
//       <Grid container spacing={3}>
//         {/* Stats */}
//         <Grid item xs={12} sm={6} md={3}>
//           <Card>
//             <CardContent>
//               <Box display="flex" alignItems="center">
//                 <People sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
//                 <Box>
//                   <Typography color="textSecondary">Team Size</Typography>
//                   <Typography variant="h5">24</Typography>
//                 </Box>
//               </Box>
//             </CardContent>
//           </Card>
//         </Grid>

//         <Grid item xs={12} sm={6} md={3}>
//           <Card>
//             <CardContent>
//               <Box display="flex" alignItems="center">
//                 <Assignment sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
//                 <Box>
//                   <Typography color="textSecondary">Active Tasks</Typography>
//                   <Typography variant="h5">48</Typography>
//                 </Box>
//               </Box>
//             </CardContent>
//           </Card>
//         </Grid>

//         <Grid item xs={12} sm={6} md={3}>
//           <Card>
//             <CardContent>
//               <Box display="flex" alignItems="center">
//                 <TrendingUp sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
//                 <Box>
//                   <Typography color="textSecondary">Completion Rate</Typography>
//                   <Typography variant="h5">85%</Typography>
//                 </Box>
//               </Box>
//             </CardContent>
//           </Card>
//         </Grid>

//         <Grid item xs={12} sm={6} md={3}>
//           <Card>
//             <CardContent>
//               <Box display="flex" alignItems="center">
//                 <Group sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
//                 <Box>
//                   <Typography color="textSecondary">Departments</Typography>
//                   <Typography variant="h5">3</Typography>
//                 </Box>
//               </Box>
//             </CardContent>
//           </Card>
//         </Grid>

//         {/* Team Members */}
//         <Grid item xs={12} md={6}>
//           <Paper sx={{ p: 2 }}>
//             <Typography variant="h6" gutterBottom>
//               Team Members
//             </Typography>
//             <TableContainer>
//               <Table size="small">
//                 <TableHead>
//                   <TableRow>
//                     <TableCell>Name</TableCell>
//                     <TableCell>Role</TableCell>
//                     <TableCell>Tasks</TableCell>
//                     <TableCell>Status</TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {teamMembers.map((member, index) => (
//                     <TableRow key={index}>
//                       <TableCell>{member.name}</TableCell>
//                       <TableCell>{member.role}</TableCell>
//                       <TableCell>{member.tasks}</TableCell>
//                       <TableCell>
//                         <Chip 
//                           label={member.status} 
//                           color={member.status === 'active' ? 'success' : 'warning'}
//                           size="small"
//                         />
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </TableContainer>
//           </Paper>
//         </Grid>

//         {/* Department Tasks */}
//         <Grid item xs={12} md={6}>
//           <Paper sx={{ p: 2 }}>
//             <Typography variant="h6" gutterBottom>
//               Department Tasks
//             </Typography>
//             <TableContainer>
//               <Table size="small">
//                 <TableHead>
//                   <TableRow>
//                     <TableCell>Task</TableCell>
//                     <TableCell>Priority</TableCell>
//                     <TableCell>Status</TableCell>
//                     <TableCell>Action</TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {departmentTasks.map((task) => (
//                     <TableRow key={task.id}>
//                       <TableCell>{task.title}</TableCell>
//                       <TableCell>
//                         <Chip 
//                           label={task.priority}
//                           color={
//                             task.priority === 'high' ? 'error' : 
//                             task.priority === 'medium' ? 'warning' : 'default'
//                           }
//                           size="small"
//                         />
//                       </TableCell>
//                       <TableCell>
//                         <Chip 
//                           label={task.status}
//                           color={
//                             task.status === 'completed' ? 'success' : 
//                             task.status === 'in-progress' ? 'primary' : 'default'
//                           }
//                           size="small"
//                         />
//                       </TableCell>
//                       <TableCell>
//                         <Button size="small" variant="outlined">
//                           View
//                         </Button>
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </TableContainer>
//           </Paper>
//         </Grid>

//         {/* Quick Actions */}
//         <Grid item xs={12}>
//           <Paper sx={{ p: 2 }}>
//             <Typography variant="h6" gutterBottom>
//               Management Tools
//             </Typography>
//             <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
//               <Button variant="contained" startIcon={<People />}>
//                 Manage Team
//               </Button>
//               <Button variant="outlined" startIcon={<Assignment />}>
//                 Assign Tasks
//               </Button>
//               <Button variant="outlined">
//                 Generate Reports
//               </Button>
//               <Button variant="outlined">
//                 Schedule Meeting
//               </Button>
//             </Box>
//           </Paper>
//         </Grid>
//       </Grid>
//     </Container>
//   );
// };

// export default ManagerDashboard;