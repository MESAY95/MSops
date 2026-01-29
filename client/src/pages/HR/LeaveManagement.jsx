import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  alpha,
  useTheme,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  Refresh,
  CheckCircle,
  Cancel,
  Pending,
  Print,
  PictureAsPdf,
  GetApp,
  Publish,
  FilterList
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import LeaveForm from './LeaveForm';
import { useReactToPrint } from 'react-to-print';

const LeaveManagement = () => {
  const theme = useTheme();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [openForm, setOpenForm] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [printData, setPrintData] = useState([]);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const componentRef = useRef();
  const printPreviewRef = useRef();
  const [showFilters, setShowFilters] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    employee: '',
    leaveType: '',
    startDate: null,
    endDate: null,
    status: ''
  });

  const leaveTypeOptions = [
    { value: 'sick', label: 'Sick Leave' },
    { value: 'vacation', label: 'Vacation Leave' },
    { value: 'personal', label: 'Personal Leave' },
    { value: 'maternity', label: 'Maternity Leave' },
    { value: 'paternity', label: 'Paternity Leave' },
    { value: 'other', label: 'Other' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  // Fetch leave records
  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filters,
        sort: 'createdAt:desc'
      };

      if (filters.startDate) {
        params.startDate = filters.startDate.toISOString().split('T')[0];
      }
      if (filters.endDate) {
        params.endDate = filters.endDate.toISOString().split('T')[0];
      }

      const response = await axios.get('http://localhost:5000/api/leaves', { params });
      // Reverse the array to show newest entries at the bottom
      const sortedLeaves = response.data.leaves.reverse();
      setLeaves(sortedLeaves);
      setTotalPages(response.data.totalPages);
      setTotalRecords(response.data.totalRecords);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch leave statistics
  const fetchStats = async () => {
    try {
      const params = {};
      if (filters.startDate) {
        params.startDate = filters.startDate.toISOString().split('T')[0];
      }
      if (filters.endDate) {
        params.endDate = filters.endDate.toISOString().split('T')[0];
      }
      if (filters.leaveType) {
        params.leaveType = filters.leaveType;
      }

      const response = await axios.get('http://localhost:5000/api/leaves/stats/summary', { params });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch employees for filter
  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/employees');
      setEmployees(response.data.employees || response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  useEffect(() => {
    fetchLeaves();
    fetchStats();
  }, [page, rowsPerPage, filters]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenForm = (leaveRecord = null) => {
    setSelectedLeave(leaveRecord);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedLeave(null);
  };

  const handleSave = () => {
    fetchLeaves();
    fetchStats();
    handleCloseForm();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      try {
        await axios.delete(`http://localhost:5000/api/leaves/${id}`);
        fetchLeaves();
        fetchStats();
      } catch (error) {
        console.error('Error deleting leave:', error);
      }
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/leaves/${id}`, { status: 'approved' });
      fetchLeaves();
      fetchStats();
    } catch (error) {
      console.error('Error approving leave:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/leaves/${id}`, { status: 'rejected' });
      fetchLeaves();
      fetchStats();
    } catch (error) {
      console.error('Error rejecting leave:', error);
    }
  };

  const handleFilterChange = (field) => (event) => {
    const value = event?.target?.value ?? event;
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      employee: '',
      leaveType: '',
      startDate: null,
      endDate: null,
      status: ''
    });
    setPage(0);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'rejected': return <Cancel sx={{ color: 'error.main' }} />;
      case 'pending': return <Pending sx={{ color: 'warning.main' }} />;
      default: return <Pending />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getLeaveTypeColor = (type) => {
    const colors = {
      sick: 'error',
      vacation: 'success',
      personal: 'info',
      maternity: 'secondary',
      paternity: 'primary',
      other: 'warning'
    };
    return colors[type] || 'default';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateDuration = (startDate, endDate) => {
    const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Print functionality
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Leave_Report_${new Date().toISOString().split('T')[0]}`,
    onBeforeGetContent: () => {
      setPrintData(leaves);
      return Promise.resolve();
    }
  });

  const handlePrintPreview = async () => {
    try {
      const params = {
        ...filters,
        limit: 1000
      };

      if (filters.startDate) {
        params.startDate = filters.startDate.toISOString().split('T')[0];
      }
      if (filters.endDate) {
        params.endDate = filters.endDate.toISOString().split('T')[0];
      }

      const response = await axios.get('http://localhost:5000/api/leaves', { params });
      setPrintData(response.data.leaves);
      setPrintDialogOpen(true);
    } catch (error) {
      console.error('Error fetching data for print:', error);
    }
  };

  const handlePrintFromPreview = useReactToPrint({
    content: () => printPreviewRef.current,
    documentTitle: `Leave_Report_${new Date().toISOString().split('T')[0]}`,
  });

  // Import/Export functionality
  const handleImport = () => {
    // Implement import functionality
    console.log('Import leaves');
  };

  const handleExport = () => {
    // Implement export functionality
    console.log('Export leaves');
  };

  // Print styles
  const printStyles = `
    @media print {
      body * {
        visibility: hidden;
      }
      .print-section, .print-section * {
        visibility: visible;
      }
      .print-section {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
      .no-print {
        display: none !important;
      }
    }
  `;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <style>{printStyles}</style>
        
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Leave Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={fetchLeaves}
              color="primary"
              className="no-print"
              title="Refresh"
            >
              <Refresh />
            </IconButton>
            <IconButton
              onClick={handlePrintPreview}
              color="primary"
              className="no-print"
              title="Print Preview"
            >
              <Print />
            </IconButton>
            <IconButton
              onClick={handlePrint}
              color="primary"
              className="no-print"
              title="Print as PDF"
            >
              <PictureAsPdf />
            </IconButton>
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              color="primary"
              className="no-print"
              title="Filters"
            >
              <FilterList />
            </IconButton>
            <IconButton
              onClick={handleImport}
              color="primary"
              className="no-print"
              title="Import"
            >
              <Publish />
            </IconButton>
            <IconButton
              onClick={handleExport}
              color="primary"
              className="no-print"
              title="Export"
            >
              <GetApp />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenForm()}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                ml: 1
              }}
              className="no-print"
            >
              Request Leave
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards - Smaller Size */}
        <Grid container spacing={2} sx={{ mb: 3 }} className="no-print">
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ minHeight: 80 }}>
              <CardContent sx={{ textAlign: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Requests
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ minHeight: 80 }}>
              <CardContent sx={{ textAlign: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="h6" color="warning.main" fontWeight="bold">
                  {stats.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ minHeight: 80 }}>
              <CardContent sx={{ textAlign: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="h6" color="success.main" fontWeight="bold">
                  {stats.approved}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Approved
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ minHeight: 80 }}>
              <CardContent sx={{ textAlign: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="h6" color="error.main" fontWeight="bold">
                  {stats.rejected}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rejected
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters - Collapsible */}
        {showFilters && (
          <Card sx={{ mb: 2 }} className="no-print">
            <CardContent sx={{ p: 2 }}>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Employee"
                    value={filters.employee}
                    onChange={handleFilterChange('employee')}
                  >
                    <MenuItem value="">All Employees</MenuItem>
                    {employees.map((emp) => (
                      <MenuItem key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Leave Type"
                    value={filters.leaveType}
                    onChange={handleFilterChange('leaveType')}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {leaveTypeOptions.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Status"
                    value={filters.status}
                    onChange={handleFilterChange('status')}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    {statusOptions.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <DatePicker
                    label="Start Date"
                    value={filters.startDate}
                    onChange={handleFilterChange('startDate')}
                    renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <DatePicker
                    label="End Date"
                    value={filters.endDate}
                    onChange={handleFilterChange('endDate')}
                    renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={clearFilters}
                    sx={{ height: '40px' }}
                  >
                    Clear
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Leaves Table - Scrollable with 13 rows */}
        <TableContainer 
          component={Paper} 
          sx={{ 
            maxHeight: 'calc(13 * 48px + 57px)',
            overflow: 'auto'
          }}
        >
          <Table stickyHeader size="small">
            <TableHead sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', py: 1, px: 1 }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 1, px: 1 }}>Leave Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 1, px: 1 }}>Start Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 1, px: 1 }}>End Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 1, px: 1 }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 1, px: 1 }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 1, px: 1 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 1, px: 1 }} align="center" className="no-print">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 1 }}>
                    <LinearProgress />
                  </TableCell>
                </TableRow>
              ) : leaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      No leave requests found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                leaves.map((leave) => (
                  <TableRow key={leave._id} hover sx={{ height: 48 }}>
                    <TableCell sx={{ py: 0.5, px: 1, whiteSpace: 'nowrap' }}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {leave.employee?.firstName} {leave.employee?.lastName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 0.5, px: 1, whiteSpace: 'nowrap' }}>
                      <Chip
                        label={leaveTypeOptions.find(t => t.value === leave.leaveType)?.label || leave.leaveType}
                        color={getLeaveTypeColor(leave.leaveType)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ py: 0.5, px: 1, whiteSpace: 'nowrap' }}>{formatDate(leave.startDate)}</TableCell>
                    <TableCell sx={{ py: 0.5, px: 1, whiteSpace: 'nowrap' }}>{formatDate(leave.endDate)}</TableCell>
                    <TableCell sx={{ py: 0.5, px: 1, whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" fontWeight="bold">
                        {calculateDuration(leave.startDate, leave.endDate)} days
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.5, px: 1, whiteSpace: 'nowrap', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {leave.reason}
                    </TableCell>
                    <TableCell sx={{ py: 0.5, px: 1, whiteSpace: 'nowrap' }}>
                      <Chip
                        icon={getStatusIcon(leave.status)}
                        label={leave.status}
                        color={getStatusColor(leave.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 0.5, px: 1, whiteSpace: 'nowrap' }} className="no-print">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleOpenForm(leave)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      {leave.status === 'pending' && (
                        <>
                          <IconButton
                            color="success"
                            size="small"
                            onClick={() => handleApprove(leave._id)}
                          >
                            <CheckCircle fontSize="small" />
                          </IconButton>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleReject(leave._id)}
                          >
                            <Cancel fontSize="small" />
                          </IconButton>
                        </>
                      )}
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDelete(leave._id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalRecords}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          className="no-print"
        />

        {/* Hidden print section */}
        <Box sx={{ display: 'none' }}>
          <Box ref={componentRef} className="print-section" sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom align="center">
              Leave Management Report
            </Typography>
            <Typography variant="subtitle1" gutterBottom align="center">
              Generated on: {new Date().toLocaleDateString()}
            </Typography>
            
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Employee</strong></TableCell>
                  <TableCell><strong>Leave Type</strong></TableCell>
                  <TableCell><strong>Start Date</strong></TableCell>
                  <TableCell><strong>End Date</strong></TableCell>
                  <TableCell><strong>Duration</strong></TableCell>
                  <TableCell><strong>Reason</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {printData.map((leave) => (
                  <TableRow key={leave._id}>
                    <TableCell>
                      {leave.employee?.firstName} {leave.employee?.lastName}
                    </TableCell>
                    <TableCell>{leaveTypeOptions.find(t => t.value === leave.leaveType)?.label || leave.leaveType}</TableCell>
                    <TableCell>{formatDate(leave.startDate)}</TableCell>
                    <TableCell>{formatDate(leave.endDate)}</TableCell>
                    <TableCell>{calculateDuration(leave.startDate, leave.endDate)} days</TableCell>
                    <TableCell>{leave.reason}</TableCell>
                    <TableCell>{leave.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>

        {/* Leave Form Dialog */}
        <Dialog 
          open={openForm} 
          onClose={handleCloseForm} 
          maxWidth="md" 
          fullWidth
          className="no-print"
        >
          <DialogTitle>
            {selectedLeave ? 'Edit Leave Request' : 'Request New Leave'}
          </DialogTitle>
          <DialogContent>
            <LeaveForm
              leave={selectedLeave}
              onSave={handleSave}
              onCancel={handleCloseForm}
            />
          </DialogContent>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default LeaveManagement;