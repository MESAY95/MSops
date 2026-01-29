// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   Container,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Button,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   MenuItem,
//   IconButton,
//   Typography,
//   Box,
//   Alert,
//   CircularProgress,
//   Chip,
//   Grid,
//   Tooltip,
//   Avatar,
//   InputAdornment,
//   Pagination,
//   Select,
//   FormControl,
//   InputLabel,
//   Card,
//   CardContent,
//   LinearProgress,
//   Fade,
//   Snackbar
// } from '@mui/material';
// import {
//   Add as AddIcon,
//   Edit as EditIcon,
//   Delete as DeleteIcon,
//   Lock as LockIcon,
//   LockOpen as LockOpenIcon,
//   Search as SearchIcon,
//   Refresh as RefreshIcon,
//   Download as DownloadIcon,
//   Person as PersonIcon,
//   AdminPanelSettings as AdminPanelSettingsIcon,
//   ManageAccounts as ManageAccountsIcon,
//   Engineering as EngineeringIcon,
//   PersonOutline as UsernameIcon,
//   Phone as PhoneIcon,
//   Business as BusinessIcon,
//   CheckCircle as CheckCircleIcon,
//   Cancel as CancelIcon,
//   Visibility as VisibilityIcon,
//   VisibilityOff as VisibilityOffIcon
// } from '@mui/icons-material';
// import { useAuth } from '../../contexts/AuthContext';
// import axios from 'axios';
// import { format } from 'date-fns';

// const UserManagement = () => {
//   const [users, setUsers] = useState([]);
//   const [filteredUsers, setFilteredUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [dialogLoading, setDialogLoading] = useState(false);
//   const [openDialog, setOpenDialog] = useState(false);
//   const [editMode, setEditMode] = useState(false);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [snackbarOpen, setSnackbarOpen] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [roleFilter, setRoleFilter] = useState('all');
//   const [departmentFilter, setDepartmentFilter] = useState('all');
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [page, setPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(10);
//   const [stats, setStats] = useState({
//     total: 0,
//     admin: 0,
//     manager: 0,
//     employee: 0,
//     active: 0,
//     inactive: 0
//   });
  
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     username: '',
//     password: '',
//     role: 'employee',
//     department: 'General',
//     phoneNumber: '',
//     position: '',
//     employeeId: ''
//   });

//   const [formErrors, setFormErrors] = useState({});
//   const [showPassword, setShowPassword] = useState(false);
//   const [checkingUsername, setCheckingUsername] = useState(false);
//   const [usernameError, setUsernameError] = useState('');
  
//   const { user: currentUser } = useAuth();

//   const departments = [
//     'HR',
//     'Production', 
//     'Supply Chain',
//     'Finance',
//     'Sales',
//     'General'
//   ];

//   const roles = [
//     { value: 'admin', label: 'Administrator', icon: <AdminPanelSettingsIcon /> },
//     { value: 'manager', label: 'Manager', icon: <ManageAccountsIcon /> },
//     { value: 'employee', label: 'Employee', icon: <EngineeringIcon /> }
//   ];

//   const getRoleColor = (role) => {
//     switch (role) {
//       case 'admin': return 'error';
//       case 'manager': return 'warning';
//       case 'employee': return 'info';
//       default: return 'default';
//     }
//   };

//   const getRoleIcon = (role) => {
//     switch (role) {
//       case 'admin': return <AdminPanelSettingsIcon />;
//       case 'manager': return <ManageAccountsIcon />;
//       case 'employee': return <EngineeringIcon />;
//       default: return <PersonIcon />;
//     }
//   };

//   const fetchUsers = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get('/api/users', {
//         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
//       });
//       const usersData = response.data?.data || [];
//       setUsers(usersData);
//       setFilteredUsers(usersData);
      
//       const statsData = {
//         total: usersData.length,
//         admin: usersData.filter(u => u.role === 'admin').length,
//         manager: usersData.filter(u => u.role === 'manager').length,
//         employee: usersData.filter(u => u.role === 'employee').length,
//         active: usersData.filter(u => u.isActive).length,
//         inactive: usersData.filter(u => !u.isActive).length
//       };
//       setStats(statsData);
      
//       setError('');
//     } catch (err) {
//       console.error('Error fetching users:', err);
//       const errorMessage = err.response?.data?.message || 'Failed to fetch users. Please try again.';
//       setError(errorMessage);
//       showSnackbar('error', errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchUsers();
//   }, [fetchUsers]);

//   useEffect(() => {
//     let result = users;
    
//     if (searchTerm) {
//       const term = searchTerm.toLowerCase();
//       result = result.filter(user => 
//         user.firstName?.toLowerCase().includes(term) ||
//         user.lastName?.toLowerCase().includes(term) ||
//         user.username?.toLowerCase().includes(term) ||
//         (user.employeeId && user.employeeId.toLowerCase().includes(term)) ||
//         (user.position && user.position.toLowerCase().includes(term))
//       );
//     }
    
//     if (roleFilter !== 'all') {
//       result = result.filter(user => user.role === roleFilter);
//     }
    
//     if (departmentFilter !== 'all') {
//       result = result.filter(user => user.department === departmentFilter);
//     }
    
//     if (statusFilter !== 'all') {
//       const isActive = statusFilter === 'active';
//       result = result.filter(user => user.isActive === isActive);
//     }
    
//     setFilteredUsers(result);
//     setPage(1);
//   }, [users, searchTerm, roleFilter, departmentFilter, statusFilter]);

//   const showSnackbar = (type, message) => {
//     if (type === 'success') {
//       setSuccess(message);
//     } else {
//       setError(message);
//     }
//     setSnackbarOpen(true);
//   };

//   const handleCloseSnackbar = () => {
//     setSnackbarOpen(false);
//   };

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

//   const handleOpenDialog = (user = null) => {
//     setFormErrors({});
//     setUsernameError('');
    
//     if (user) {
//       setEditMode(true);
//       setSelectedUser(user);
//       setFormData({
//         firstName: user.firstName || '',
//         lastName: user.lastName || '',
//         username: user.username || '',
//         password: '',
//         role: user.role || 'employee',
//         department: user.department || 'General',
//         phoneNumber: user.phoneNumber || '',
//         position: user.position || '',
//         employeeId: user.employeeId || ''
//       });
//     } else {
//       setEditMode(false);
//       setSelectedUser(null);
//       setFormData({
//         firstName: '',
//         lastName: '',
//         username: '',
//         password: '',
//         role: 'employee',
//         department: 'General',
//         phoneNumber: '',
//         position: '',
//         employeeId: ''
//       });
//     }
//     setOpenDialog(true);
//   };

//   const handleCloseDialog = () => {
//     setOpenDialog(false);
//     setFormErrors({});
//     setUsernameError('');
//   };

//   const validateForm = () => {
//     const errors = {};
    
//     if (!formData.firstName.trim()) errors.firstName = 'First name is required';
//     if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
//     if (!formData.username.trim()) {
//       errors.username = 'Username is required';
//     } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
//       errors.username = 'Username must be 3-20 characters (letters, numbers, underscores only)';
//     }
    
//     if (!editMode && !formData.password.trim()) {
//       errors.password = 'Password is required';
//     } else if (!editMode && formData.password.length < 8) {
//       errors.password = 'Password must be at least 8 characters';
//     }
    
//     if (!formData.role) errors.role = 'Role is required';
//     if (!formData.department) errors.department = 'Department is required';
    
//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({
//       ...formData,
//       [name]: value
//     });
    
//     if (formErrors[name]) {
//       setFormErrors({
//         ...formErrors,
//         [name]: ''
//       });
//     }
    
//     if (name === 'username' && !editMode) {
//       setUsernameError('');
//       const timer = setTimeout(() => {
//         checkUsernameAvailability(value);
//       }, 500);
//       return () => clearTimeout(timer);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setSuccess('');
    
//     if (!validateForm()) return;
    
//     if (usernameError && !editMode) {
//       setError('Please fix username error before submitting');
//       return;
//     }
    
//     setDialogLoading(true);

//     try {
//       if (editMode) {
//         const updateData = { ...formData };
//         delete updateData.password;
        
//         const response = await axios.put(`/api/users/${selectedUser._id}`, updateData, {
//           headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
//         });
//         showSnackbar('success', response.data.message || 'User updated successfully');
//       } else {
//         const response = await axios.post('/api/auth/register', formData, {
//           headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
//         });
//         showSnackbar('success', response.data.message || 'User created successfully');
//       }
      
//       fetchUsers();
//       setTimeout(() => {
//         handleCloseDialog();
//       }, 1000);
//     } catch (err) {
//       const errorMessage = err.response?.data?.message || 'Operation failed. Please try again.';
//       setError(errorMessage);
//       showSnackbar('error', errorMessage);
//     } finally {
//       setDialogLoading(false);
//     }
//   };

//   const handleToggleActive = async (userId, currentStatus) => {
//     if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) {
//       return;
//     }
    
//     try {
//       const endpoint = currentStatus ? 'deactivate' : 'reactivate';
//       const response = await axios.post(`/api/users/${userId}/${endpoint}`, {}, {
//         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
//       });
//       showSnackbar('success', response.data.message || `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
//       fetchUsers();
//     } catch (err) {
//       const errorMessage = err.response?.data?.message || 'Failed to update user status';
//       showSnackbar('error', errorMessage);
//     }
//   };

//   const handleResetPassword = async (userId) => {
//     if (!window.confirm('Reset password for this user? A temporary password will be generated.')) {
//       return;
//     }
    
//     try {
//       const tempPassword = Math.random().toString(36).slice(-8);
//       const response = await axios.post(`/api/users/${userId}/reset-password`, { 
//         password: tempPassword 
//       }, {
//         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
//       });
//       showSnackbar('success', `Password reset successfully. New password: ${tempPassword}`);
//     } catch (err) {
//       const errorMessage = err.response?.data?.message || 'Failed to reset password';
//       showSnackbar('error', errorMessage);
//     }
//   };

//   const handleExportUsers = () => {
//     if (filteredUsers.length === 0) {
//       showSnackbar('error', 'No users to export');
//       return;
//     }

//     const csvContent = [
//       ['First Name', 'Last Name', 'Username', 'Role', 'Department', 'Position', 'Employee ID', 'Status', 'Last Login', 'Created At'],
//       ...filteredUsers.map(user => [
//         user.firstName,
//         user.lastName,
//         user.username,
//         user.role,
//         user.department,
//         user.position || '',
//         user.employeeId || '',
//         user.isActive ? 'Active' : 'Inactive',
//         user.lastLogin ? format(new Date(user.lastLogin), 'yyyy-MM-dd HH:mm') : 'Never',
//         user.createdAt ? format(new Date(user.createdAt), 'yyyy-MM-dd') : ''
//       ])
//     ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `users_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     window.URL.revokeObjectURL(url);
//   };

//   const handlePageChange = (event, value) => {
//     setPage(value);
//   };

//   const handleRowsPerPageChange = (event) => {
//     setRowsPerPage(parseInt(event.target.value, 10));
//     setPage(1);
//   };

//   const paginatedUsers = filteredUsers.slice(
//     (page - 1) * rowsPerPage,
//     page * rowsPerPage
//   );

//   const handleTogglePasswordVisibility = () => {
//     setShowPassword(!showPassword);
//   };

//   if (loading && users.length === 0) {
//     return (
//       <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
//         <CircularProgress />
//       </Container>
//     );
//   }

//   return (
//     <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
//       <Box sx={{ mb: 4 }}>
//         <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
//           User Management
//         </Typography>
//         <Typography variant="body1" color="text.secondary" gutterBottom>
//           Manage system users, roles, and permissions
//         </Typography>
//       </Box>

//       {/* Statistics Cards */}
//       <Grid container spacing={3} sx={{ mb: 4 }}>
//         <Grid item xs={12} sm={6} md={4} lg={2}>
//           <Card>
//             <CardContent>
//               <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                 <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
//                   <PersonIcon />
//                 </Avatar>
//                 <Box>
//                   <Typography variant="h6">{stats.total}</Typography>
//                   <Typography variant="body2" color="text.secondary">Total Users</Typography>
//                 </Box>
//               </Box>
//             </CardContent>
//           </Card>
//         </Grid>
        
//         <Grid item xs={12} sm={6} md={4} lg={2}>
//           <Card>
//             <CardContent>
//               <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                 <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
//                   <AdminPanelSettingsIcon />
//                 </Avatar>
//                 <Box>
//                   <Typography variant="h6">{stats.admin}</Typography>
//                   <Typography variant="body2" color="text.secondary">Admins</Typography>
//                 </Box>
//               </Box>
//             </CardContent>
//           </Card>
//         </Grid>
        
//         <Grid item xs={12} sm={6} md={4} lg={2}>
//           <Card>
//             <CardContent>
//               <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                 <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
//                   <ManageAccountsIcon />
//                 </Avatar>
//                 <Box>
//                   <Typography variant="h6">{stats.manager}</Typography>
//                   <Typography variant="body2" color="text.secondary">Managers</Typography>
//                 </Box>
//               </Box>
//             </CardContent>
//           </Card>
//         </Grid>
        
//         <Grid item xs={12} sm={6} md={4} lg={2}>
//           <Card>
//             <CardContent>
//               <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                 <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
//                   <EngineeringIcon />
//                 </Avatar>
//                 <Box>
//                   <Typography variant="h6">{stats.employee}</Typography>
//                   <Typography variant="body2" color="text.secondary">Employees</Typography>
//                 </Box>
//               </Box>
//             </CardContent>
//           </Card>
//         </Grid>
        
//         <Grid item xs={12} sm={6} md={4} lg={2}>
//           <Card>
//             <CardContent>
//               <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                 <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
//                   <CheckCircleIcon />
//                 </Avatar>
//                 <Box>
//                   <Typography variant="h6">{stats.active}</Typography>
//                   <Typography variant="body2" color="text.secondary">Active</Typography>
//                 </Box>
//               </Box>
//             </CardContent>
//           </Card>
//         </Grid>
        
//         <Grid item xs={12} sm={6} md={4} lg={2}>
//           <Card>
//             <CardContent>
//               <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                 <Avatar sx={{ bgcolor: 'grey.400', mr: 2 }}>
//                   <CancelIcon />
//                 </Avatar>
//                 <Box>
//                   <Typography variant="h6">{stats.inactive}</Typography>
//                   <Typography variant="body2" color="text.secondary">Inactive</Typography>
//                 </Box>
//               </Box>
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>

//       {/* Filters and Actions */}
//       <Paper sx={{ p: 3, mb: 3 }}>
//         <Grid container spacing={2} alignItems="center">
//           <Grid item xs={12} md={4}>
//             <TextField
//               fullWidth
//               placeholder="Search users..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <SearchIcon />
//                   </InputAdornment>
//                 ),
//               }}
//             />
//           </Grid>
          
//           <Grid item xs={12} sm={6} md={2}>
//             <FormControl fullWidth>
//               <InputLabel>Role</InputLabel>
//               <Select
//                 value={roleFilter}
//                 onChange={(e) => setRoleFilter(e.target.value)}
//                 label="Role"
//               >
//                 <MenuItem value="all">All Roles</MenuItem>
//                 <MenuItem value="admin">Admin</MenuItem>
//                 <MenuItem value="manager">Manager</MenuItem>
//                 <MenuItem value="employee">Employee</MenuItem>
//               </Select>
//             </FormControl>
//           </Grid>
          
//           <Grid item xs={12} sm={6} md={2}>
//             <FormControl fullWidth>
//               <InputLabel>Department</InputLabel>
//               <Select
//                 value={departmentFilter}
//                 onChange={(e) => setDepartmentFilter(e.target.value)}
//                 label="Department"
//               >
//                 <MenuItem value="all">All Departments</MenuItem>
//                 {departments.map(dept => (
//                   <MenuItem key={dept} value={dept}>{dept}</MenuItem>
//                 ))}
//               </Select>
//             </FormControl>
//           </Grid>
          
//           <Grid item xs={12} sm={6} md={2}>
//             <FormControl fullWidth>
//               <InputLabel>Status</InputLabel>
//               <Select
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//                 label="Status"
//               >
//                 <MenuItem value="all">All Status</MenuItem>
//                 <MenuItem value="active">Active</MenuItem>
//                 <MenuItem value="inactive">Inactive</MenuItem>
//               </Select>
//             </FormControl>
//           </Grid>
          
//           <Grid item xs={12} sm={6} md={2}>
//             <Button
//               fullWidth
//               variant="outlined"
//               startIcon={<RefreshIcon />}
//               onClick={fetchUsers}
//               disabled={loading}
//             >
//               Refresh
//             </Button>
//           </Grid>
//         </Grid>
        
//         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
//           <Typography variant="body2" color="text.secondary">
//             Showing {filteredUsers.length} of {users.length} users
//           </Typography>
          
//           <Box sx={{ display: 'flex', gap: 2 }}>
//             <Button
//               variant="outlined"
//               startIcon={<DownloadIcon />}
//               onClick={handleExportUsers}
//               disabled={filteredUsers.length === 0 || loading}
//             >
//               Export
//             </Button>
            
//             <Button
//               variant="contained"
//               startIcon={<AddIcon />}
//               onClick={() => handleOpenDialog()}
//             >
//               Add User
//             </Button>
//           </Box>
//         </Box>
//       </Paper>

//       {/* Users Table */}
//       <Paper sx={{ width: '100%', overflow: 'hidden' }}>
//         <TableContainer sx={{ maxHeight: 600 }}>
//           <Table stickyHeader>
//             <TableHead>
//               <TableRow>
//                 <TableCell>User</TableCell>
//                 <TableCell>Contact</TableCell>
//                 <TableCell>Role</TableCell>
//                 <TableCell>Department</TableCell>
//                 <TableCell>Status</TableCell>
//                 <TableCell>Last Login</TableCell>
//                 <TableCell align="center">Actions</TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {paginatedUsers.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
//                     <Typography color="text.secondary">
//                       No users found
//                     </Typography>
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 paginatedUsers.map((userItem) => (
//                   <Fade in={true} key={userItem._id}>
//                     <TableRow hover>
//                       <TableCell>
//                         <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                           <Avatar sx={{ mr: 2, bgcolor: getRoleColor(userItem.role) }}>
//                             {getRoleIcon(userItem.role)}
//                           </Avatar>
//                           <Box>
//                             <Typography variant="subtitle2">
//                               {userItem.firstName} {userItem.lastName}
//                             </Typography>
//                             {userItem.position && (
//                               <Typography variant="caption" color="text.secondary">
//                                 {userItem.position}
//                               </Typography>
//                             )}
//                             {userItem.employeeId && (
//                               <Typography variant="caption" display="block" color="text.secondary">
//                                 ID: {userItem.employeeId}
//                               </Typography>
//                             )}
//                           </Box>
//                         </Box>
//                       </TableCell>
                      
//                       <TableCell>
//                         <Box>
//                           <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
//                             <UsernameIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
//                             <Typography variant="body2">{userItem.username}</Typography>
//                           </Box>
//                           {userItem.phoneNumber && (
//                             <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                               <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
//                               <Typography variant="body2">{userItem.phoneNumber}</Typography>
//                             </Box>
//                           )}
//                         </Box>
//                       </TableCell>
                      
//                       <TableCell>
//                         <Chip
//                           label={userItem.role}
//                           color={getRoleColor(userItem.role)}
//                           size="small"
//                           icon={getRoleIcon(userItem.role)}
//                         />
//                       </TableCell>
                      
//                       <TableCell>
//                         <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                           <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
//                           <Typography variant="body2">{userItem.department}</Typography>
//                         </Box>
//                       </TableCell>
                      
//                       <TableCell>
//                         <Chip
//                           label={userItem.isActive ? 'Active' : 'Inactive'}
//                           color={userItem.isActive ? 'success' : 'default'}
//                           size="small"
//                           icon={userItem.isActive ? <CheckCircleIcon /> : <CancelIcon />}
//                         />
//                       </TableCell>
                      
//                       <TableCell>
//                         {userItem.lastLogin ? (
//                           <Typography variant="body2">
//                             {format(new Date(userItem.lastLogin), 'MMM dd, yyyy HH:mm')}
//                           </Typography>
//                         ) : (
//                           <Typography variant="body2" color="text.secondary">
//                             Never
//                           </Typography>
//                         )}
//                       </TableCell>
                      
//                       <TableCell align="center">
//                         <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
//                           <Tooltip title="Edit User">
//                             <IconButton
//                               size="small"
//                               onClick={() => handleOpenDialog(userItem)}
//                               disabled={userItem._id === currentUser?.id}
//                               color="primary"
//                             >
//                               <EditIcon />
//                             </IconButton>
//                           </Tooltip>
                          
//                           <Tooltip title={userItem.isActive ? 'Deactivate' : 'Activate'}>
//                             <IconButton
//                               size="small"
//                               onClick={() => handleToggleActive(userItem._id, userItem.isActive)}
//                               disabled={userItem._id === currentUser?.id}
//                               color={userItem.isActive ? 'warning' : 'success'}
//                             >
//                               {userItem.isActive ? <LockIcon /> : <LockOpenIcon />}
//                             </IconButton>
//                           </Tooltip>
                          
//                           <Tooltip title="Reset Password">
//                             <IconButton
//                               size="small"
//                               onClick={() => handleResetPassword(userItem._id)}
//                               disabled={userItem._id === currentUser?.id}
//                               color="secondary"
//                             >
//                               <LockIcon />
//                             </IconButton>
//                           </Tooltip>
//                         </Box>
//                       </TableCell>
//                     </TableRow>
//                   </Fade>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </TableContainer>
        
//         {/* Pagination */}
//         <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           <FormControl size="small" sx={{ minWidth: 120 }}>
//             <InputLabel>Rows per page</InputLabel>
//             <Select
//               value={rowsPerPage}
//               onChange={handleRowsPerPageChange}
//               label="Rows per page"
//             >
//               <MenuItem value={5}>5</MenuItem>
//               <MenuItem value={10}>10</MenuItem>
//               <MenuItem value={25}>25</MenuItem>
//               <MenuItem value={50}>50</MenuItem>
//             </Select>
//           </FormControl>
          
//           <Pagination
//             count={Math.ceil(filteredUsers.length / rowsPerPage)}
//             page={page}
//             onChange={handlePageChange}
//             color="primary"
//             showFirstButton
//             showLastButton
//             disabled={loading}
//           />
//         </Box>
//       </Paper>

//       {/* Add/Edit User Dialog */}
//       <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
//         <DialogTitle>
//           {editMode ? 'Edit User' : 'Add New User'}
//         </DialogTitle>
//         <DialogContent>
//           {dialogLoading && <LinearProgress />}
          
//           {error && (
//             <Alert severity="error" sx={{ mt: 2, mb: 2 }} onClose={() => setError('')}>
//               {error}
//             </Alert>
//           )}
          
//           <Box component="form" sx={{ mt: 2 }}>
//             <Grid container spacing={2}>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   required
//                   fullWidth
//                   label="First Name"
//                   name="firstName"
//                   value={formData.firstName}
//                   onChange={handleChange}
//                   error={!!formErrors.firstName}
//                   helperText={formErrors.firstName}
//                   disabled={dialogLoading}
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <PersonIcon />
//                       </InputAdornment>
//                     ),
//                   }}
//                 />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   required
//                   fullWidth
//                   label="Last Name"
//                   name="lastName"
//                   value={formData.lastName}
//                   onChange={handleChange}
//                   error={!!formErrors.lastName}
//                   helperText={formErrors.lastName}
//                   disabled={dialogLoading}
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <PersonIcon />
//                       </InputAdornment>
//                     ),
//                   }}
//                 />
//               </Grid>
              
//               <Grid item xs={12}>
//                 <TextField
//                   required
//                   fullWidth
//                   label="Username"
//                   name="username"
//                   value={formData.username}
//                   onChange={handleChange}
//                   error={!!formErrors.username || !!usernameError}
//                   helperText={formErrors.username || usernameError}
//                   disabled={editMode || dialogLoading}
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <UsernameIcon />
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
              
//               {!editMode && (
//                 <Grid item xs={12}>
//                   <TextField
//                     required
//                     fullWidth
//                     label="Password"
//                     name="password"
//                     type={showPassword ? 'text' : 'password'}
//                     value={formData.password}
//                     onChange={handleChange}
//                     error={!!formErrors.password}
//                     helperText={formErrors.password || 'Minimum 8 characters'}
//                     disabled={dialogLoading}
//                     InputProps={{
//                       startAdornment: (
//                         <InputAdornment position="start">
//                           <LockIcon />
//                         </InputAdornment>
//                       ),
//                       endAdornment: (
//                         <InputAdornment position="end">
//                           <IconButton
//                             onClick={handleTogglePasswordVisibility}
//                             edge="end"
//                           >
//                             {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
//                           </IconButton>
//                         </InputAdornment>
//                       ),
//                     }}
//                   />
//                 </Grid>
//               )}
              
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   select
//                   required
//                   fullWidth
//                   label="Role"
//                   name="role"
//                   value={formData.role}
//                   onChange={handleChange}
//                   error={!!formErrors.role}
//                   helperText={formErrors.role}
//                   disabled={dialogLoading}
//                 >
//                   {roles.map((role) => (
//                     <MenuItem key={role.value} value={role.value}>
//                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                         {role.icon}
//                         {role.label}
//                       </Box>
//                     </MenuItem>
//                   ))}
//                 </TextField>
//               </Grid>
              
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   select
//                   required
//                   fullWidth
//                   label="Department"
//                   name="department"
//                   value={formData.department}
//                   onChange={handleChange}
//                   error={!!formErrors.department}
//                   helperText={formErrors.department}
//                   disabled={dialogLoading}
//                 >
//                   {departments.map((dept) => (
//                     <MenuItem key={dept} value={dept}>
//                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                         <BusinessIcon fontSize="small" />
//                         {dept}
//                       </Box>
//                     </MenuItem>
//                   ))}
//                 </TextField>
//               </Grid>
              
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   label="Phone Number"
//                   name="phoneNumber"
//                   value={formData.phoneNumber}
//                   onChange={handleChange}
//                   disabled={dialogLoading}
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <PhoneIcon />
//                       </InputAdornment>
//                     ),
//                   }}
//                 />
//               </Grid>
              
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   label="Position"
//                   name="position"
//                   value={formData.position}
//                   onChange={handleChange}
//                   disabled={dialogLoading}
//                 />
//               </Grid>
              
//               <Grid item xs={12}>
//                 <TextField
//                   fullWidth
//                   label="Employee ID"
//                   name="employeeId"
//                   value={formData.employeeId}
//                   onChange={handleChange}
//                   disabled={dialogLoading}
//                   placeholder="Auto-generated if left empty"
//                   helperText="Leave empty for auto-generation"
//                 />
//               </Grid>
//             </Grid>
//           </Box>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleCloseDialog} disabled={dialogLoading}>
//             Cancel
//           </Button>
//           <Button 
//             onClick={handleSubmit} 
//             variant="contained"
//             disabled={dialogLoading || checkingUsername || (usernameError && !editMode)}
//           >
//             {dialogLoading ? (
//               <CircularProgress size={24} />
//             ) : editMode ? (
//               'Update User'
//             ) : (
//               'Create User'
//             )}
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Snackbar for notifications */}
//       <Snackbar
//         open={snackbarOpen}
//         autoHideDuration={6000}
//         onClose={handleCloseSnackbar}
//         anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
//       >
//         <Alert 
//           onClose={handleCloseSnackbar} 
//           severity={success ? 'success' : 'error'}
//           sx={{ width: '100%' }}
//         >
//           {success || error}
//         </Alert>
//       </Snackbar>
//     </Container>
//   );
// };

// export default UserManagement;