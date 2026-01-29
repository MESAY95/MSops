import React, { useState, useEffect, useRef } from 'react';
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
    CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
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
    Paid,
    ArrowBack,
    Visibility,
    GppGood,
    Download,
    ThumbUp,
    ThumbDown,
    Payment,
    Search
} from '@mui/icons-material';

const FinanceOvertimeApproval = ({ onBack }) => {
    const [overtimeRecords, setOvertimeRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [activeTab, setActiveTab] = useState('checked');
    const [filters, setFilters] = useState({
        department: '',
        employee: '',
        startDate: null,
        endDate: null,
        month: null
    });
    const [approvalDialog, setApprovalDialog] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [approving, setApproving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [showFilters, setShowFilters] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date());
    const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
    const tableRef = useRef();

    useEffect(() => {
        checkUserPermissions();
        fetchOvertimeRecords();
        fetchDepartments();
    }, []);

    useEffect(() => {
        filterRecords();
    }, [overtimeRecords, activeTab, filters, searchTerm]);

    const checkUserPermissions = () => {
        const storedRole = localStorage.getItem('userRole') || 'Finance Manager';
        setUserRole(storedRole);
    };

    const filterRecords = () => {
        let filtered = [...overtimeRecords];
        
        // Filter by active tab
        if (activeTab === 'checked') {
            filtered = filtered.filter(record => record.status === 'Checked');
        } else if (activeTab === 'approved') {
            filtered = filtered.filter(record => record.status === 'Approved');
        } else if (activeTab === 'paid') {
            filtered = filtered.filter(record => record.status === 'Paid');
        } else if (activeTab === 'all') {
            filtered = filtered.filter(record => ['Checked', 'Approved', 'Paid', 'Rejected'].includes(record.status));
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
                (record.employeeName || record.employeeInfo?.fullName || '').toLowerCase().includes(term) ||
                (record.department || '').toLowerCase().includes(term)
            );
        }
        
        // Sort by date ascending
        const sortedFiltered = filtered.sort((a, b) => new Date(a.overtimeDate) - new Date(b.overtimeDate));
        
        setFilteredRecords(sortedFiltered);
    };

    const fetchOvertimeRecords = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/overtimemanagements?status=Checked,Approved,Paid,Rejected&limit=1000', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Handle different API response formats
            let records = [];
            if (Array.isArray(data)) {
                records = data;
            } else if (data.overtimeRecords) {
                records = data.overtimeRecords;
            } else if (data.data) {
                records = data.data;
            } else if (data.records) {
                records = data.records;
            }
            
            const sortedRecords = records.sort((a, b) => 
                new Date(b.overtimeDate) - new Date(a.overtimeDate)
            );
            
            setOvertimeRecords(sortedRecords);
            console.log('Fetched records:', sortedRecords); // Debug log
        } catch (error) {
            console.error('Error fetching overtime records:', error);
            showSnackbar('Error fetching overtime records', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/departmentmanagements?status=Active', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setDepartments(data.departments || data.data || []);
        } catch (error) {
            console.error('Error fetching departments:', error);
            showSnackbar('Error fetching departments', 'error');
        }
    };

    const handleApproveRecord = (record, action) => {
        if (!['Checked', 'Approved'].includes(record.status)) {
            showSnackbar('Only checked or approved records can be processed', 'error');
            return;
        }
        
        setSelectedRecord(record);
        setRemarks(record.remarks || '');
        setPaymentDate(new Date());
        setApprovalDialog(true);
    };

    const confirmApproval = async (action) => {
        if (!selectedRecord) return;

        setApproving(true);
        try {
            let updateData = {};
            
            if (action === 'approve') {
                updateData = {
                    status: 'Approved',
                    approvedBy: userRole,
                    approvedDate: new Date().toISOString(),
                    financeRemarks: remarks || `Approved by ${userRole}`
                };
            } else if (action === 'pay') {
                updateData = {
                    status: 'Paid',
                    paymentMethod: paymentMethod,
                    paymentDate: paymentDate.toISOString(),
                    paidBy: userRole,
                    financeRemarks: remarks || `Paid on ${paymentDate.toLocaleDateString()} via ${paymentMethod}`
                };
            } else if (action === 'reject') {
                updateData = {
                    status: 'Rejected',
                    rejectedBy: userRole,
                    rejectedDate: new Date().toISOString(),
                    financeRemarks: remarks || `Rejected by Finance: ${remarks}`
                };
            }

            const token = localStorage.getItem('token');
            
            // Try multiple API endpoint patterns to find the correct one
            let response;
            let successful = false;
            let lastError = null;
            
            // List of possible endpoint patterns to try
            const endpointsToTry = [
                // Pattern 1: Standard REST endpoint with PATCH
                `/api/overtimemanagements/${selectedRecord._id}`,
                // Pattern 2: Status-specific endpoint
                `/api/overtimemanagements/${selectedRecord._id}/status`,
                // Pattern 3: Versioned API
                `/api/v1/overtimemanagements/${selectedRecord._id}`,
                // Pattern 4: Different naming convention
                `/api/overtime/${selectedRecord._id}`,
                // Pattern 5: Overtime management specific
                `/api/overtime-management/${selectedRecord._id}`,
            ];

            // Try each endpoint pattern with PATCH
            for (const endpoint of endpointsToTry) {
                try {
                    console.log(`Trying PATCH endpoint: ${endpoint}`);
                    
                    response = await fetch(endpoint, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(updateData),
                    });

                    if (response.ok) {
                        successful = true;
                        console.log(`Success with endpoint: ${endpoint}`);
                        break;
                    } else if (response.status === 404) {
                        console.log(`Endpoint ${endpoint} returned 404, trying next...`);
                        continue;
                    } else {
                        console.log(`Endpoint ${endpoint} returned ${response.status}`);
                        const errorData = await response.text();
                        console.log('Error response:', errorData);
                    }
                } catch (error) {
                    console.log(`Error with endpoint ${endpoint}:`, error);
                    lastError = error;
                    continue;
                }
            }

            // If PATCH doesn't work, try PUT as fallback
            if (!successful) {
                console.log('PATCH failed, trying PUT as fallback...');
                try {
                    response = await fetch(`/api/overtimemanagements/${selectedRecord._id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(updateData),
                    });
                    
                    if (response.ok) {
                        successful = true;
                        console.log('Success with PUT method');
                    }
                } catch (putError) {
                    console.error('PUT request also failed:', putError);
                    lastError = putError;
                }
            }

            if (successful && response.ok) {
                const result = await response.json();
                showSnackbar(
                    action === 'approve' ? 'Overtime approved successfully!' :
                    action === 'pay' ? 'Payment recorded successfully!' :
                    'Record rejected successfully!',
                    'success'
                );
                
                // Update the local state immediately
                setOvertimeRecords(prev => prev.map(record => 
                    record._id === selectedRecord._id 
                        ? { ...record, ...updateData }
                        : record
                ));
                
                // Also refetch to ensure consistency
                setTimeout(() => {
                    fetchOvertimeRecords();
                }, 500);
                
                setApprovalDialog(false);
                setSelectedRecord(null);
                setRemarks('');
            } else {
                // Show detailed error message
                let errorMessage = 'Error updating record. ';
                
                if (response) {
                    try {
                        const errorData = await response.json();
                        errorMessage += errorData.message || `HTTP ${response.status}`;
                    } catch (e) {
                        errorMessage += `HTTP ${response.status}`;
                    }
                } else if (lastError) {
                    errorMessage += lastError.message;
                } else {
                    errorMessage += 'Please check your network connection and API endpoints.';
                }
                
                showSnackbar(errorMessage, 'error');
                
                // For debugging - log the exact request that failed
                console.error('Failed request details:', {
                    recordId: selectedRecord._id,
                    action: action,
                    updateData: updateData,
                    endpointsTried: endpointsToTry
                });
            }
        } catch (error) {
            console.error('Error in confirmApproval:', error);
            showSnackbar('An unexpected error occurred. Please try again.', 'error');
        } finally {
            setApproving(false);
        }
    };

    const downloadAttachment = async (recordId, fileName) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/overtimemanagements/${recordId}/attachment`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
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
    };

    const handleRefresh = () => {
        fetchOvertimeRecords();
        fetchDepartments();
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
        showSnackbar('Filters reset successfully', 'info');
    };

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                ...(filters.department && { department: filters.department }),
                ...(filters.startDate && { startDate: formatDateForAPI(filters.startDate) }),
                ...(filters.endDate && { endDate: formatDateForAPI(filters.endDate) }),
                ...(filters.month && { month: formatDateForAPI(filters.month) }),
                status: activeTab === 'checked' ? 'Checked' : 
                       activeTab === 'approved' ? 'Approved' : 
                       activeTab === 'paid' ? 'Paid' : 'Checked,Approved,Paid,Rejected'
            });

            const response = await fetch(`/api/overtimemanagements/export/csv?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `finance-overtime-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
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
                <title>Finance Overtime Approval Report</title>
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
                    <div class="company-name">Finance Department</div>
                    <div class="report-title">Overtime Payment Report - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Records</div>
                    <div>Generated on: ${new Date().toLocaleDateString()} by ${userRole}</div>
                </div>
                
                <div class="table-container">
                    ${tableHtml}
                </div>

                <div class="summary">
                    <strong>Financial Summary:</strong><br/>
                    <strong>Total Records:</strong> ${filteredRecords.length}<br/>
                    <strong>Total Hours:</strong> ${calculateTotalHours(filteredRecords).toFixed(2)}<br/>
                    <strong>Total Amount Payable (ETB):</strong> ${formatCurrency(calculateTotalAmount(filteredRecords))}<br/>
                    <strong>Average per Record:</strong> ${formatCurrency(filteredRecords.length > 0 ? calculateTotalAmount(filteredRecords) / filteredRecords.length : 0)}
                </div>

                <div class="footer">
                    <div>
                        <strong>Approved by:</strong> ________________<br/>
                        Finance Department
                    </div>
                    <div>
                        <strong>Payment Authorized by:</strong> ________________<br/>
                        ${userRole}
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

    const formatDisplayDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const formatDateForAPI = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    // Helper function to extract hours from record (handles different data structures)
    const getHoursFromRecord = (record) => {
        if (!record) return 0;
        
        // Try different possible field names for hours
        if (typeof record.hoursWorked === 'number') return record.hoursWorked;
        if (typeof record.totalHours === 'number') return record.totalHours;
        if (typeof record.hours === 'number') return record.hours;
        if (record.timeDetails && typeof record.timeDetails.hoursWorked === 'number') return record.timeDetails.hoursWorked;
        if (record.timeDetails && typeof record.timeDetails.totalHours === 'number') return record.timeDetails.totalHours;
        
        return 0;
    };

    // Helper function to extract amount from record (handles different data structures)
    const getAmountFromRecord = (record) => {
        if (!record) return 0;
        
        // Try different possible field names for amount
        if (typeof record.calculatedAmount === 'number') return record.calculatedAmount;
        if (typeof record.amount === 'number') return record.amount;
        if (typeof record.totalAmount === 'number') return record.totalAmount;
        if (record.financials && typeof record.financials.calculatedAmount === 'number') return record.financials.calculatedAmount;
        if (record.financials && typeof record.financials.totalAmount === 'number') return record.financials.totalAmount;
        
        return 0;
    };

    // Calculate total hours from records
    const calculateTotalHours = (records) => {
        if (!records || !Array.isArray(records)) return 0;
        return records.reduce((sum, record) => sum + getHoursFromRecord(record), 0);
    };

    // Calculate total amount from records
    const calculateTotalAmount = (records) => {
        if (!records || !Array.isArray(records)) return 0;
        return records.reduce((sum, record) => sum + getAmountFromRecord(record), 0);
    };

    const CustomDatePicker = ({ label, value, onChange, ...props }) => {
        const [open, setOpen] = useState(false);
        
        return (
            <DatePicker
                label={label}
                value={value}
                onChange={onChange}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        fullWidth
                        size="small"
                        onClick={() => setOpen(true)}
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <IconButton
                                    size="small"
                                    onClick={() => setOpen(true)}
                                    sx={{ padding: '4px' }}
                                >
                                    <CalendarIcon fontSize="small" />
                                </IconButton>
                            )
                        }}
                    />
                )}
                {...props}
            />
        );
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Checked': return 'info';
            case 'Approved': return 'warning';
            case 'Paid': return 'success';
            case 'Rejected': return 'error';
            case 'Pending': return 'default';
            default: return 'default';
        }
    };

    // Calculate totals for ALL records, not just filtered ones
    const calculateTotals = () => {
        // Count all records by status
        const checkedCount = overtimeRecords.filter(r => r.status === 'Checked').length;
        const approvedCount = overtimeRecords.filter(r => r.status === 'Approved').length;
        const paidCount = overtimeRecords.filter(r => r.status === 'Paid').length;
        
        // Calculate totals for APPROVED and CHECKED records only (payable records)
        const payableRecords = overtimeRecords.filter(r => 
            r.status === 'Approved' || r.status === 'Checked'
        );
        
        // Calculate totals for ALL records
        const totalHoursAll = calculateTotalHours(overtimeRecords);
        const totalAmountAll = calculateTotalAmount(overtimeRecords);
        
        // Calculate totals for PAYABLE records only
        const payableHours = calculateTotalHours(payableRecords);
        const payableAmount = calculateTotalAmount(payableRecords);
        
        return { 
            checkedCount, 
            approvedCount, 
            paidCount, 
            totalHoursAll, 
            totalAmountAll, 
            payableHours, 
            payableAmount 
        };
    };

    const totals = calculateTotals();

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
                                Finance Overtime Approval
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                            Approve and process overtime payments
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Refresh">
                            <IconButton onClick={handleRefresh} size="small">
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
                        <strong>Role:</strong> Review HR-checked overtime records, approve for payment, 
                        and record payment details. Manage the financial approval workflow.
                    </Typography>
                </Alert>

                {/* Search Bar */}
                <Paper sx={{ p: 2, mb: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Search by employee name or department..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                        onChange={(e, newValue) => setActiveTab(newValue)}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab 
                            label={
                                <Badge badgeContent={totals.checkedCount} color="info" showZero>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircle fontSize="small" />
                                        Checked by HR
                                    </Box>
                                </Badge>
                            } 
                            value="checked" 
                        />
                        <Tab 
                            label={
                                <Badge badgeContent={totals.approvedCount} color="warning" showZero>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <GppGood fontSize="small" />
                                        Approved
                                    </Box>
                                </Badge>
                            } 
                            value="approved" 
                        />
                        <Tab 
                            label={
                                <Badge badgeContent={totals.paidCount} color="success" showZero>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Paid fontSize="small" />
                                        Paid
                                    </Box>
                                </Badge>
                            } 
                            value="paid" 
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
                                    <CheckCircle color="info" sx={{ mr: 1, fontSize: '1rem' }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Checked
                                    </Typography>
                                </Box>
                                <Typography variant="h6" color="info">
                                    {totals.checkedCount}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Ready for approval
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Card>
                            <CardContent sx={{ p: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <GppGood color="warning" sx={{ mr: 1, fontSize: '1rem' }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Approved
                                    </Typography>
                                </Box>
                                <Typography variant="h6" color="warning">
                                    {totals.approvedCount}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Ready for payment
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Card>
                            <CardContent sx={{ p: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <Paid color="success" sx={{ mr: 1, fontSize: '1rem' }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Paid
                                    </Typography>
                                </Box>
                                <Typography variant="h6" color="success">
                                    {totals.paidCount}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Completed payments
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Card>
                            <CardContent sx={{ p: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <MoneyIcon color="error" sx={{ mr: 1, fontSize: '1rem' }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Payable (ETB)
                                    </Typography>
                                </Box>
                                <Typography variant="h6" color="error">
                                    {formatCurrency(totals.payableAmount)}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    {totals.checkedCount + totals.approvedCount} records
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
                                    {totals.totalHoursAll.toFixed(2)}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    All records
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
                                        <MenuItem key={dept._id} value={dept.departmentName}>
                                            {dept.departmentName}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <CustomDatePicker
                                    label="Start Date"
                                    value={filters.startDate}
                                    onChange={(date) => handleFilterChange('startDate', date)}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <CustomDatePicker
                                    label="End Date"
                                    value={filters.endDate}
                                    onChange={(date) => handleFilterChange('endDate', date)}
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
                                <TableCell>Amount (ETB)</TableCell>
                                <TableCell>Checked By</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                        <CircularProgress size={32} />
                                    </TableCell>
                                </TableRow>
                            ) : filteredRecords.length > 0 ? (
                                filteredRecords.map((record) => {
                                    const employeeName = record.employeeName || record.employeeInfo?.fullName || 'N/A';
                                    const employeeId = record.employeeId || record.employeeInfo?.employeeId || 'N/A';
                                    const department = record.department || 'N/A';
                                    const hours = getHoursFromRecord(record);
                                    const amount = getAmountFromRecord(record);
                                    const status = record.status || 'Pending';
                                    const checkedBy = record.checkedBy || record.workflow?.checkedBy || 'Not checked';
                                    const checkedDate = record.checkedDate || record.workflow?.checkedDate;
                                    
                                    return (
                                        <TableRow key={record._id} hover>
                                            <TableCell>{formatDisplayDate(record.overtimeDate)}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                                                        <BusinessIcon fontSize="small" />
                                                    </Avatar>
                                                    <Typography variant="body2">
                                                        {department}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.main' }}>
                                                        <PeopleIcon fontSize="small" />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {employeeName}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            ID: {employeeId}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography fontWeight="bold">
                                                    {hours.toFixed(2)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography color="success" fontWeight="bold">
                                                    {formatCurrency(amount)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {checkedBy}
                                                </Typography>
                                                {checkedDate && (
                                                    <Typography variant="caption" color="textSecondary">
                                                        {formatDisplayDate(checkedDate)}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={status} 
                                                    color={getStatusColor(status)}
                                                    size="small" 
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <Tooltip title="View Details">
                                                        <IconButton 
                                                            size="small"
                                                            onClick={() => {
                                                                setSelectedRecord(record);
                                                                setRemarks(record.remarks || '');
                                                                setApprovalDialog(true);
                                                            }}
                                                        >
                                                            <Visibility fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    
                                                    {record.status === 'Checked' && (
                                                        <>
                                                            <Tooltip title="Approve for Payment">
                                                                <IconButton 
                                                                    size="small" 
                                                                    color="success"
                                                                    onClick={() => handleApproveRecord(record, 'approve')}
                                                                >
                                                                    <ThumbUp fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Reject">
                                                                <IconButton 
                                                                    size="small" 
                                                                    color="error"
                                                                    onClick={() => handleApproveRecord(record, 'reject')}
                                                                >
                                                                    <ThumbDown fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                    
                                                    {record.status === 'Approved' && (
                                                        <Tooltip title="Mark as Paid">
                                                            <IconButton 
                                                                size="small" 
                                                                color="primary"
                                                                onClick={() => handleApproveRecord(record, 'pay')}
                                                            >
                                                                <Payment fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                        <Typography color="textSecondary">
                                            No overtime records found for processing
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Approval Dialog */}
                <Dialog open={approvalDialog} onClose={() => setApprovalDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        Process Overtime Record
                        {selectedRecord && (
                            <Typography variant="caption" display="block" color="textSecondary">
                                {selectedRecord.department} Department • {selectedRecord.status}
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
                                                    <strong>Employee:</strong> {selectedRecord.employeeName || selectedRecord.employeeInfo?.fullName}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2">
                                                    <strong>Hours:</strong> {getHoursFromRecord(selectedRecord).toFixed(2)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2">
                                                    <strong>Amount:</strong> {formatCurrency(getAmountFromRecord(selectedRecord))}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Typography variant="body2">
                                                    <strong>Checked by:</strong> {selectedRecord.checkedBy || selectedRecord.workflow?.checkedBy || 'Not checked'}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Grid>
                                
                                {selectedRecord.status === 'Approved' && (
                                    <>
                                        <Grid item xs={12} md={6}>
                                            <CustomDatePicker
                                                label="Payment Date"
                                                value={paymentDate}
                                                onChange={setPaymentDate}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                select
                                                fullWidth
                                                label="Payment Method"
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                size="small"
                                            >
                                                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                                                <MenuItem value="Cash">Cash</MenuItem>
                                                <MenuItem value="Check">Check</MenuItem>
                                                <MenuItem value="Mobile Payment">Mobile Payment</MenuItem>
                                            </TextField>
                                        </Grid>
                                    </>
                                )}
                                
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Finance Remarks"
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        multiline
                                        rows={3}
                                        size="small"
                                        placeholder="Enter payment instructions, rejection reasons, or other comments..."
                                    />
                                </Grid>
                                
                                <Grid item xs={12}>
                                    <Alert severity={
                                        selectedRecord.status === 'Checked' ? 'info' : 
                                        selectedRecord.status === 'Approved' ? 'success' : 'warning'
                                    } sx={{ mt: 2 }}>
                                        <Typography variant="body2">
                                            {selectedRecord.status === 'Checked' ? 
                                                'This record has been checked by HR and is ready for financial approval.' :
                                            selectedRecord.status === 'Approved' ? 
                                                'This record is approved for payment. Mark as paid when payment is processed.' :
                                                'Review this record before taking action.'}
                                        </Typography>
                                    </Alert>
                                </Grid>
                            </Grid>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setApprovalDialog(false)} size="small">
                            Cancel
                        </Button>
                        
                        {selectedRecord?.status === 'Checked' && (
                            <>
                                <Button 
                                    onClick={() => confirmApproval('reject')} 
                                    variant="outlined" 
                                    color="error"
                                    disabled={approving}
                                    size="small"
                                    startIcon={<ThumbDown />}
                                >
                                    Reject
                                </Button>
                                <Button 
                                    onClick={() => confirmApproval('approve')} 
                                    variant="contained"
                                    color="warning"
                                    disabled={approving}
                                    size="small"
                                    startIcon={<ThumbUp />}
                                >
                                    {approving ? 'Processing...' : 'Approve for Payment'}
                                </Button>
                            </>
                        )}
                        
                        {selectedRecord?.status === 'Approved' && (
                            <Button 
                                onClick={() => confirmApproval('pay')} 
                                variant="contained"
                                color="success"
                                disabled={approving}
                                size="small"
                                startIcon={<Payment />}
                            >
                                {approving ? 'Processing...' : 'Mark as Paid'}
                            </Button>
                        )}
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

export default FinanceOvertimeApproval;