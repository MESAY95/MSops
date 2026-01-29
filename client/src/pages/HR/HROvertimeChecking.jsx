import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    TextField,
    MenuItem,
    Grid,
    Card,
    CardContent,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Snackbar,
    IconButton,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    Tab,
    Tabs,
    Avatar,
    Badge,
    CircularProgress,
    TablePagination
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isValid, parseISO } from 'date-fns';
import { 
    Print as PrintIcon, 
    Refresh as RefreshIcon,
    GetApp as ExportIcon,
    AccessTime as TimeIcon,
    FilterList as FilterIcon,
    CalendarToday as CalendarIcon,
    Clear as ClearIcon,
    People as PeopleIcon,
    Business as BusinessIcon,
    AttachMoney as MoneyIcon,
    CheckCircle,
    PendingActions,
    Cancel,
    ArrowBack,
    Visibility,
    HowToReg,
    Download,
    ThumbUp,
    ThumbDown,
    Comment,
    Search,
    Description,
    CloudDownload,
    PictureAsPdf
} from '@mui/icons-material';

// Use the same employee service
const useEmployeeService = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const employeeCache = useMemo(() => new Map(), []);
    const CACHE_DURATION = 5 * 60 * 1000;

    const fetchEmployeesByDepartment = useCallback(async (department, forceRefresh = false) => {
        const cacheKey = `employees_${department}`;
        const cached = employeeCache.get(cacheKey);

        if (cached && !forceRefresh && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            return cached.data;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/employeemanagements?departmentName=${encodeURIComponent(department)}&employmentStatus=Active&limit=1000`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch employees: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            let employees = [];
            if (data.employees && Array.isArray(data.employees)) {
                employees = data.employees;
            } else if (Array.isArray(data)) {
                employees = data;
            }

            const processedEmployees = employees.map(emp => ({
                _id: emp._id,
                employeeId: emp.employeeId,
                fullName: emp.fullName || `${emp.firstName} ${emp.middleName ? emp.middleName + ' ' : ''}${emp.lastName}`.trim(),
                firstName: emp.firstName,
                lastName: emp.lastName,
                position: emp.position,
                basicSalary: emp.basicSalary || emp.baseSalary || 0,
                department: emp.departmentName || emp.department || department,
                email: emp.email,
                phone: emp.phone,
                employmentStatus: emp.employmentStatus || 'Active',
                employmentType: emp.employmentType,
                profileImage: emp.profileImage
            }));

            employeeCache.set(cacheKey, {
                timestamp: Date.now(),
                data: processedEmployees
            });

            return processedEmployees;
        } catch (err) {
            console.error('Error fetching employees:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [employeeCache]);

    const clearDepartmentCache = useCallback((department) => {
        const keysToDelete = [];
        for (const [key] of employeeCache.entries()) {
            if (key.includes(department) || key === 'all') {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => employeeCache.delete(key));
    }, [employeeCache]);

    return {
        fetchEmployeesByDepartment,
        clearDepartmentCache,
        loading,
        error
    };
};

// Helper functions
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 2
    }).format(amount || 0);
};

const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy');
};

const getStatusColor = (status) => {
    switch(status) {
        case 'Checked': return 'success';
        case 'Rejected': return 'error';
        case 'Pending': return 'warning';
        case 'Approved': return 'info';
        case 'Paid': return 'primary';
        default: return 'default';
    }
};

const getOvertimeTypeColor = (type) => {
    switch(type) {
        case 'Regular': return 'primary';
        case 'Weekend': return 'secondary';
        case 'Holiday': return 'error';
        case 'Emergency': return 'warning';
        case 'Night': return 'info';
        default: return 'default';
    }
};

const HROvertimeChecking = ({ onBack }) => {
    const [overtimeRecords, setOvertimeRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [filters, setFilters] = useState({
        department: '',
        employee: '',
        startDate: null,
        endDate: null,
        month: null
    });
    const [checkDialog, setCheckDialog] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [checking, setChecking] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [showFilters, setShowFilters] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const tableRef = useRef();
    
    // Employee service
    const employeeService = useEmployeeService();
    
    // Cache for employee data by department
    const [departmentEmployees, setDepartmentEmployees] = useState({});

    useEffect(() => {
        checkUserPermissions();
        fetchOvertimeRecords();
        fetchDepartments();
    }, []);

    const checkUserPermissions = () => {
        const storedRole = localStorage.getItem('userRole') || 'HR Manager';
        setUserRole(storedRole);
    };

    // Fetch employees for a specific department
    const fetchEmployeesForDepartment = useCallback(async (department) => {
        if (!department || departmentEmployees[department]) return;
        
        try {
            const employees = await employeeService.fetchEmployeesByDepartment(department);
            setDepartmentEmployees(prev => ({
                ...prev,
                [department]: employees
            }));
        } catch (error) {
            console.error(`Error fetching employees for ${department}:`, error);
        }
    }, [employeeService, departmentEmployees]);

    // Memoized filtered records
    const filteredRecords = useMemo(() => {
        let filtered = [...overtimeRecords];
        
        // Filter by active tab
        if (activeTab === 'pending') {
            filtered = filtered.filter(record => record.status === 'Pending');
        } else if (activeTab === 'checked') {
            filtered = filtered.filter(record => record.status === 'Checked');
        } else if (activeTab === 'rejected') {
            filtered = filtered.filter(record => record.status === 'Rejected');
        } else if (activeTab === 'all') {
            filtered = filtered.filter(record => ['Pending', 'Checked', 'Rejected', 'Approved', 'Paid'].includes(record.status));
        }
        
        // Filter by department
        if (filters.department) {
            filtered = filtered.filter(record => record.department === filters.department);
        }
        
        // Filter by date range
        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            startDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(record => new Date(record.overtimeDate) >= startDate);
        }
        
        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(record => new Date(record.overtimeDate) <= endDate);
        }
        
        // Filter by month
        if (filters.month) {
            const monthStart = new Date(filters.month);
            const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
            monthEnd.setHours(23, 59, 59, 999);
            
            filtered = filtered.filter(record => {
                const recordDate = new Date(record.overtimeDate);
                return recordDate >= monthStart && recordDate <= monthEnd;
            });
        }
        
        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(record => 
                (record.employeeInfo?.fullName || '').toLowerCase().includes(term) ||
                (record.employeeInfo?.employeeId || '').toLowerCase().includes(term) ||
                (record.department || '').toLowerCase().includes(term) ||
                (record.reason || '').toLowerCase().includes(term)
            );
        }
        
        // Sort by date ascending (oldest pending first for review)
        return filtered.sort((a, b) => new Date(a.overtimeDate) - new Date(b.overtimeDate));
    }, [overtimeRecords, activeTab, filters, searchTerm]);

    // Paginated records
    const paginatedRecords = useMemo(() => {
        const startIndex = page * rowsPerPage;
        return filteredRecords.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredRecords, page, rowsPerPage]);

    const fetchOvertimeRecords = async () => {
        setLoading(true);
        try {
            const cacheBuster = new Date().getTime();
            const response = await fetch(`/api/overtimemanagements?status=Pending,Checked,Rejected,Approved,Paid&limit=1000&_=${cacheBuster}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            let records = [];
            if (data.success && data.overtimeRecords) {
                records = data.overtimeRecords;
            } else if (Array.isArray(data)) {
                records = data;
            }
            
            const sortedRecords = records.sort((a, b) => 
                new Date(b.overtimeDate) - new Date(a.overtimeDate)
            );
            
            setOvertimeRecords(sortedRecords);
            
            // Pre-fetch employees for all departments in the records
            const uniqueDepartments = [...new Set(records.map(r => r.department))];
            uniqueDepartments.forEach(dept => {
                if (dept) fetchEmployeesForDepartment(dept);
            });
            
            showSnackbar('Overtime records loaded successfully', 'success');
        } catch (error) {
            console.error('Error fetching overtime records:', error);
            showSnackbar('Error fetching overtime records', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const cacheBuster = new Date().getTime();
            const response = await fetch(`/api/departmentmanagements?status=Active&_=${cacheBuster}`);
            const data = await response.json();
            
            let depts = [];
            if (data.departments && Array.isArray(data.departments)) {
                depts = data.departments;
            } else if (data.data && Array.isArray(data.data)) {
                depts = data.data;
            } else if (Array.isArray(data)) {
                depts = data;
            }
            
            setDepartments(depts);
        } catch (error) {
            console.error('Error fetching departments:', error);
            showSnackbar('Error fetching departments', 'error');
        }
    };

    const handleCheckRecord = (record, action) => {
        if (record.status !== 'Pending') {
            showSnackbar('Only pending records can be checked', 'error');
            return;
        }
        
        setSelectedRecord(record);
        setRemarks(record.remarks?.hrRemarks || '');
        setCheckDialog(true);
    };

    const confirmCheck = async (action) => {
        if (!selectedRecord) return;

        setChecking(true);
        try {
            const updateData = {
                status: action === 'approve' ? 'Checked' : 'Rejected',
                remarks: remarks || ''
            };

            const response = await fetch(`/api/overtimemanagements/${selectedRecord._id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData),
            });

            if (response.ok) {
                showSnackbar(
                    action === 'approve' 
                        ? 'Overtime record checked successfully!' 
                        : 'Overtime record rejected!', 
                    'success'
                );
                setCheckDialog(false);
                fetchOvertimeRecords();
            } else {
                const errorData = await response.json();
                showSnackbar(errorData.message || 'Error updating record', 'error');
            }
        } catch (error) {
            console.error('Error updating record:', error);
            showSnackbar('Error updating record', 'error');
        } finally {
            setChecking(false);
            setSelectedRecord(null);
            setRemarks('');
        }
    };

    const downloadAttachment = async (recordId, fileName) => {
        try {
            const response = await fetch(`/api/overtimemanagements/${recordId}/attachment`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName || 'attachment';
                link.click();
                window.URL.revokeObjectURL(url);
            } else {
                showSnackbar('Error downloading attachment', 'error');
            }
        } catch (error) {
            console.error('Error downloading attachment:', error);
            showSnackbar('Error downloading attachment', 'error');
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setPage(0);
        
        // Fetch employees for the selected department
        if (field === 'department' && value) {
            fetchEmployeesForDepartment(value);
        }
    };

    const handleRefresh = () => {
        fetchOvertimeRecords();
        fetchDepartments();
        
        // Clear employee cache for all departments
        Object.keys(departmentEmployees).forEach(dept => {
            employeeService.clearDepartmentCache(dept);
        });
        setDepartmentEmployees({});
        
        showSnackbar('Data refreshed successfully', 'success');
    };

    const handleResetFilters = () => {
        setFilters({
            department: '',
            employee: '',
            startDate: null,
            endDate: null,
            month: null
        });
        setSearchTerm('');
        setPage(0);
        showSnackbar('Filters reset successfully', 'info');
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams({
                ...(filters.department && { department: filters.department }),
                ...(filters.startDate && { startDate: format(filters.startDate, 'yyyy-MM-dd') }),
                ...(filters.endDate && { endDate: format(filters.endDate, 'yyyy-MM-dd') }),
                ...(filters.month && { month: format(filters.month, 'yyyy-MM-dd') }),
                status: activeTab === 'pending' ? 'Pending' : activeTab === 'checked' ? 'Checked' : activeTab === 'rejected' ? 'Rejected' : 'Pending,Checked,Rejected,Approved,Paid'
            });

            const response = await fetch(`/api/overtimemanagements/export/csv?${params}`);
            
            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `hr-overtime-${activeTab}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);

            showSnackbar('Data exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            showSnackbar('Error exporting data', 'error');
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const tableHtml = tableRef.current?.innerHTML || '';
        
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>HR Overtime Checking Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .company-name { font-size: 24px; font-weight: bold; }
                    .report-title { font-size: 18px; margin: 10px 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; }
                    .summary { margin-top: 20px; padding: 15px; background-color: #f9f9f9; }
                    .footer { margin-top: 30px; display: flex; justify-content: space-between; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-name">Human Resources Department</div>
                    <div class="report-title">Overtime Checking Report - ${activeTab === 'pending' ? 'Pending Review' : 'Checked Records'}</div>
                    <div>Generated on: ${format(new Date(), 'MMM dd, yyyy')} by ${userRole}</div>
                </div>
                
                <div class="table-container">
                    ${tableHtml}
                </div>

                <div class="summary">
                    <strong>Summary:</strong><br/>
                    <strong>Total Records:</strong> ${filteredRecords.length}<br/>
                    <strong>Total Hours:</strong> ${filteredRecords.reduce((sum, record) => sum + (record.timeDetails?.hoursWorked || 0), 0).toFixed(2)}<br/>
                    <strong>Total Amount (ETB):</strong> ${formatCurrency(filteredRecords.reduce((sum, record) => sum + (record.financials?.calculatedAmount || 0), 0))}
                </div>

                <div class="footer">
                    <div>
                        <strong>Checked by:</strong> ________________<br/>
                        HR Department
                    </div>
                    <div>
                        <strong>Date:</strong> ${format(new Date(), 'MMM dd, yyyy')}
                    </div>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    // Memoized totals calculation
    const totals = useMemo(() => {
        const pendingCount = overtimeRecords.filter(r => r.status === 'Pending').length;
        const checkedCount = overtimeRecords.filter(r => r.status === 'Checked').length;
        const rejectedCount = overtimeRecords.filter(r => r.status === 'Rejected').length;
        const approvedCount = overtimeRecords.filter(r => r.status === 'Approved').length;
        const paidCount = overtimeRecords.filter(r => r.status === 'Paid').length;
        const totalHours = filteredRecords.reduce((sum, record) => sum + (record.timeDetails?.hoursWorked || 0), 0);
        const totalAmount = filteredRecords.reduce((sum, record) => sum + (record.financials?.calculatedAmount || 0), 0);
        return { pendingCount, checkedCount, rejectedCount, approvedCount, paidCount, totalHours, totalAmount };
    }, [overtimeRecords, filteredRecords]);

    const hasActiveFilters = filters.department || filters.startDate || filters.endDate || filters.month || searchTerm;

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 2 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {onBack && (
                                <IconButton onClick={onBack} size="small">
                                    <ArrowBack />
                                </IconButton>
                            )}
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                HR Overtime Checking
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                            Review and approve overtime records from all departments
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Refresh">
                            <IconButton onClick={handleRefresh} size="small" disabled={loading}>
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Export">
                            <IconButton onClick={handleExport} size="small">
                                <ExportIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Print">
                            <IconButton onClick={handlePrint} size="small">
                                <PrintIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Filter">
                            <IconButton 
                                onClick={() => setShowFilters(!showFilters)} 
                                size="small"
                                color={showFilters ? "primary" : "default"}
                            >
                                <FilterIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Instructions */}
                <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                        <strong>Role:</strong> Review pending overtime records from all departments. 
                        Check for accuracy, proper documentation, and compliance with company policies.
                        Reason and remarks are optional fields.
                    </Typography>
                </Alert>

                {/* Search Bar */}
                <Paper sx={{ p: 2, mb: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Search by employee name, employee ID, department, or reason..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(0);
                        }}
                        size="small"
                        InputProps={{
                            startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
                            endAdornment: searchTerm && (
                                <IconButton size="small" onClick={() => setSearchTerm('')}>
                                    <ClearIcon fontSize="small" />
                                </IconButton>
                            )
                        }}
                    />
                </Paper>

                {/* Status Tabs */}
                <Paper sx={{ mb: 2 }}>
                    <Tabs
                        value={activeTab}
                        onChange={(e, newValue) => {
                            setActiveTab(newValue);
                            setPage(0);
                        }}
                        variant="fullWidth"
                    >
                        <Tab 
                            label={
                                <Badge badgeContent={totals.pendingCount} color="error">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PendingActions fontSize="small" />
                                        Pending Review
                                    </Box>
                                </Badge>
                            } 
                            value="pending" 
                        />
                        <Tab 
                            label={
                                <Badge badgeContent={totals.checkedCount} color="success">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircle fontSize="small" />
                                        Checked
                                    </Box>
                                </Badge>
                            } 
                            value="checked" 
                        />
                        <Tab 
                            label={
                                <Badge badgeContent={totals.rejectedCount} color="error">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Cancel fontSize="small" />
                                        Rejected
                                    </Box>
                                </Badge>
                            } 
                            value="rejected" 
                        />
                        <Tab 
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TimeIcon fontSize="small" />
                                    All Records
                                </Box>
                            } 
                            value="all" 
                        />
                    </Tabs>
                </Paper>

                {/* Summary Cards */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Card>
                            <CardContent sx={{ p: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <PendingActions color="warning" sx={{ mr: 1, fontSize: '1rem' }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Pending
                                    </Typography>
                                </Box>
                                <Typography variant="h6" color="warning">
                                    {totals.pendingCount}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Card>
                            <CardContent sx={{ p: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <CheckCircle color="success" sx={{ mr: 1, fontSize: '1rem' }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Checked
                                    </Typography>
                                </Box>
                                <Typography variant="h6" color="success">
                                    {totals.checkedCount}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Card>
                            <CardContent sx={{ p: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <Cancel color="error" sx={{ mr: 1, fontSize: '1rem' }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Rejected
                                    </Typography>
                                </Box>
                                <Typography variant="h6" color="error">
                                    {totals.rejectedCount}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Card>
                            <CardContent sx={{ p: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <MoneyIcon color="info" sx={{ mr: 1, fontSize: '1rem' }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Total Amount
                                    </Typography>
                                </Box>
                                <Typography variant="h6" color="info">
                                    {formatCurrency(totals.totalAmount)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Card>
                            <CardContent sx={{ p: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <TimeIcon color="secondary" sx={{ mr: 1, fontSize: '1rem' }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Total Hours
                                    </Typography>
                                </Box>
                                <Typography variant="h6" color="secondary">
                                    {totals.totalHours.toFixed(2)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Filters */}
                {showFilters && (
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Department"
                                    value={filters.department}
                                    onChange={(e) => handleFilterChange('department', e.target.value)}
                                    size="small"
                                >
                                    <MenuItem value="">All Departments</MenuItem>
                                    {departments.map(dept => (
                                        <MenuItem key={dept._id || dept.id} value={dept.departmentName || dept.name}>
                                            {dept.departmentName || dept.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <DatePicker
                                    label="Start Date"
                                    value={filters.startDate}
                                    onChange={(date) => handleFilterChange('startDate', date)}
                                    renderInput={(params) => (
                                        <TextField {...params} fullWidth size="small" />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <DatePicker
                                    label="End Date"
                                    value={filters.endDate}
                                    onChange={(date) => handleFilterChange('endDate', date)}
                                    renderInput={(params) => (
                                        <TextField {...params} fullWidth size="small" />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<ClearIcon />}
                                        onClick={handleResetFilters}
                                        size="small"
                                    >
                                        Clear Filters
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                )}

                {/* Overtime Records Table */}
                <TableContainer component={Paper} ref={tableRef}>
                    <Table sx={{ minWidth: 1000 }} size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Department</TableCell>
                                <TableCell>Employee</TableCell>
                                <TableCell>Hours</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Amount (ETB)</TableCell>
                                <TableCell>Reason</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Attachment</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                        <CircularProgress size={32} />
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            Loading overtime records...
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedRecords.length > 0 ? (
                                paginatedRecords.map((record) => {
                                    // Use stored employee info - no additional fetching needed
                                    const employeeName = record.employeeInfo?.fullName || 'N/A';
                                    const employeeId = record.employeeInfo?.employeeId || 'N/A';
                                    const employeePosition = record.employeeInfo?.position || '';
                                    const department = record.department || 'N/A';
                                    const hours = record.timeDetails?.hoursWorked || record.hoursWorked || 0;
                                    const amount = record.financials?.calculatedAmount || record.calculatedAmount || 0;
                                    const overtimeType = record.overtimeType || 'Regular';
                                    const status = record.status || 'Pending';
                                    const reason = record.reason || 'No reason provided';
                                    
                                    return (
                                        <TableRow key={record._id} hover>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {formatDisplayDate(record.overtimeDate)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                                                        {department.charAt(0)}
                                                    </Avatar>
                                                    <Typography variant="body2">
                                                        {department}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.main' }}>
                                                        {employeeName.charAt(0)}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {employeeName}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            ID: {employeeId}
                                                            {employeePosition && ` • ${employeePosition}`}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {hours.toFixed(2)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={overtimeType} 
                                                    color={getOvertimeTypeColor(overtimeType)}
                                                    size="small" 
                                                    sx={{ minWidth: 80 }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="success.main" fontWeight="bold">
                                                    {formatCurrency(amount)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title={reason} arrow>
                                                    <Typography variant="body2" noWrap sx={{ maxWidth: '200px' }}>
                                                        {reason}
                                                    </Typography>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={status} 
                                                    color={getStatusColor(status)}
                                                    size="small" 
                                                    sx={{ minWidth: 80 }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {record.attachments && record.attachments.length > 0 && (
                                                    <Tooltip title="Download attachment">
                                                        <IconButton 
                                                            size="small"
                                                            onClick={() => downloadAttachment(record._id, record.attachments[0].originalName)}
                                                        >
                                                            <Download fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <Tooltip title="View Details">
                                                        <IconButton 
                                                            size="small"
                                                            onClick={() => {
                                                                setSelectedRecord(record);
                                                                setRemarks(record.remarks?.hrRemarks || '');
                                                                setCheckDialog(true);
                                                            }}
                                                        >
                                                            <Visibility fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    
                                                    {record.status === 'Pending' && (
                                                        <>
                                                            <Tooltip title="Approve">
                                                                <IconButton 
                                                                    size="small" 
                                                                    color="success"
                                                                    onClick={() => handleCheckRecord(record, 'approve')}
                                                                >
                                                                    <ThumbUp fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Reject">
                                                                <IconButton 
                                                                    size="small" 
                                                                    color="error"
                                                                    onClick={() => handleCheckRecord(record, 'reject')}
                                                                >
                                                                    <ThumbDown fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                                        <Typography color="textSecondary">
                                            {hasActiveFilters 
                                                ? 'No records match your filters' 
                                                : 'No overtime records found for review'
                                            }
                                        </Typography>
                                        {hasActiveFilters && (
                                            <Button 
                                                size="small" 
                                                onClick={handleResetFilters}
                                                sx={{ mt: 1 }}
                                            >
                                                Clear Filters
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    
                    <TablePagination
                        component="div"
                        count={filteredRecords.length}
                        page={page}
                        onPageChange={(event, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(event) => {
                            setRowsPerPage(parseInt(event.target.value, 10));
                            setPage(0);
                        }}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        labelRowsPerPage="Rows per page:"
                    />
                </TableContainer>

                {/* Check Dialog */}
                <Dialog open={checkDialog} onClose={() => setCheckDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        Review Overtime Record
                        {selectedRecord && (
                            <Typography variant="caption" display="block" color="textSecondary">
                                {selectedRecord.department} Department
                            </Typography>
                        )}
                    </DialogTitle>
                    <DialogContent>
                        {selectedRecord && (
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12}>
                                    <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Record Details:
                                        </Typography>
                                        <Grid container spacing={1}>
                                            <Grid item xs={6}>
                                                <Typography variant="body2">
                                                    <strong>Date:</strong> {formatDisplayDate(selectedRecord.overtimeDate)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2">
                                                    <strong>Employee:</strong> {selectedRecord.employeeInfo?.fullName}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2">
                                                    <strong>ID:</strong> {selectedRecord.employeeInfo?.employeeId}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2">
                                                    <strong>Position:</strong> {selectedRecord.employeeInfo?.position}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2">
                                                    <strong>Hours:</strong> {(selectedRecord.timeDetails?.hoursWorked || 0).toFixed(2)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2">
                                                    <strong>Amount:</strong> {formatCurrency(selectedRecord.financials?.calculatedAmount || 0)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Typography variant="body2">
                                                    <strong>Reason:</strong> {selectedRecord.reason || 'No reason provided'}
                                                </Typography>
                                            </Grid>
                                            {selectedRecord.remarks?.departmentRemarks && (
                                                <Grid item xs={12}>
                                                    <Typography variant="body2">
                                                        <strong>Department Remarks:</strong> {selectedRecord.remarks.departmentRemarks}
                                                    </Typography>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </Box>
                                </Grid>
                                
                                {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Description color="primary" />
                                            <Typography variant="body2">
                                                Attachment: {selectedRecord.attachments[0].originalName}
                                            </Typography>
                                            <Button
                                                size="small"
                                                startIcon={<Download />}
                                                onClick={() => downloadAttachment(selectedRecord._id, selectedRecord.attachments[0].originalName)}
                                            >
                                                Download
                                            </Button>
                                        </Box>
                                    </Grid>
                                )
                                }
                                
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="HR Remarks (Optional)"
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        multiline
                                        rows={3}
                                        size="small"
                                        placeholder="Enter your review comments or feedback (optional)..."
                                    />
                                </Grid>
                                
                                <Grid item xs={12}>
                                    <Alert severity="info" sx={{ mt: 2 }}>
                                        <Typography variant="body2">
                                            <strong>Note:</strong> Approved records will be sent to Finance for final approval.
                                            Rejected records will be returned to the department. Remarks are optional.
                                        </Typography>
                                    </Alert>
                                </Grid>
                            </Grid>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCheckDialog(false)} size="small" disabled={checking}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={() => confirmCheck('reject')} 
                            variant="outlined" 
                            color="error"
                            disabled={checking}
                            size="small"
                            startIcon={<ThumbDown />}
                        >
                            {checking ? 'Processing...' : 'Reject'}
                        </Button>
                        <Button 
                            onClick={() => confirmCheck('approve')} 
                            variant="contained"
                            color="success"
                            disabled={checking}
                            size="small"
                            startIcon={<ThumbUp />}
                        >
                            {checking ? 'Processing...' : 'Approve & Forward to Finance'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Snackbar */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                >
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
};

export default HROvertimeChecking;