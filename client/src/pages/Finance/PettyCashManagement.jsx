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
    Select
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
    Add as AddIcon, 
    Print as PrintIcon, 
    Refresh as RefreshIcon,
    GetApp as ExportIcon,
    AccountBalance as BalanceIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    FilterList as FilterIcon,
    CalendarToday as CalendarIcon,
    Clear as ClearIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material';

const PettyCashManagement = () => {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totals, setTotals] = useState({
        totalDebit: 0,
        totalCredit: 0,
        balance: 0
    });
    const [filters, setFilters] = useState({
        activity: '',
        action: '',
        PCPV: '',
        startDate: null,
        endDate: null
    });
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentTransactionId, setCurrentTransactionId] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [submitting, setSubmitting] = useState(false);
    const [companyManagement, setCompanyManagement] = useState({ 
        companyName: '',
        fullAddress: '',
        phone: '',
        email: '',
        website: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const tableRef = useRef();

    // Get current date
    const getCurrentDate = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    };

    // Get today's date range (start of day to end of day)
    const getTodayDateRange = () => {
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        
        return { startOfDay, endOfDay };
    };

    // Form state with current date as default
    const [formData, setFormData] = useState({
        date: getCurrentDate(),
        activity: '',
        action: '',
        PCPV: '',
        paymentDescription: '',
        amount: '',
        attachment: '',
        preparedBy: '',
        checkedBy: '',
        approvedBy: '',
        remarks: ''
    });

    const [errors, setErrors] = useState({});

    const activities = ['Debit', 'Credit'];
    const actionTypes = ['Payment', 'Receipt', 'Expense', 'Reimbursement', 'Adjustment', 'Other'];

    useEffect(() => {
        fetchTransactions();
        fetchCompanyManagement();
    }, []);

    useEffect(() => {
        // Apply filters to transactions
        let filtered = [...transactions];
        
        // Filter by activity
        if (filters.activity) {
            filtered = filtered.filter(t => t.activity === filters.activity);
        }
        
        // Filter by action (case-insensitive search)
        if (filters.action) {
            filtered = filtered.filter(t => 
                t.action.toLowerCase().includes(filters.action.toLowerCase())
            );
        }
        
        // Filter by PCPV (case-insensitive search)
        if (filters.PCPV) {
            filtered = filtered.filter(t => 
                t.PCPV.toLowerCase().includes(filters.PCPV.toLowerCase())
            );
        }
        
        // Filter by date range
        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            startDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(t => new Date(t.date) >= startDate);
        }
        
        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(t => new Date(t.date) <= endDate);
        }
        
        // Apply auto date filter for activity
        if (filters.activity && !filters.startDate && !filters.endDate) {
            const todayRange = getTodayDateRange();
            filtered = filtered.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= todayRange.startOfDay && 
                       transactionDate <= todayRange.endOfDay;
            });
        }
        
        // Sort by date ascending (oldest first) - NEWEST TRANSACTIONS AT THE BOTTOM
        const sortedFiltered = filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        setFilteredTransactions(sortedFiltered);
        calculateTotals(sortedFiltered);
        
    }, [transactions, filters]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/pettycashmanagements?limit=1000');
            const data = await response.json();
            
            // Sort transactions by date ascending (oldest first) - NEWEST AT BOTTOM
            const sortedTransactions = (data.transactions || []).sort((a, b) => 
                new Date(a.date) - new Date(b.date)
            );
            
            setTransactions(sortedTransactions);
            
            if (data.companyManagement) {
                setCompanyManagement(data.companyManagement);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            showSnackbar('Error fetching transactions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotals = (transactionList) => {
        const totals = transactionList.reduce((acc, transaction) => {
            if (transaction.activity === 'Debit') {
                acc.totalDebit += transaction.amount;
            } else if (transaction.activity === 'Credit') {
                acc.totalCredit += transaction.amount;
            }
            return acc;
        }, { totalDebit: 0, totalCredit: 0 });
        
        const balance = totals.totalCredit - totals.totalDebit;
        setTotals({ ...totals, balance });
    };

    const fetchCompanyManagement = async () => {
        try {
            const response = await fetch('/api/pettycashmanagements/company/info');
            if (response.ok) {
                const data = await response.json();
                setCompanyManagement(data);
            } else {
                const fallbackResponse = await fetch('/api/companyManagements');
                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    setCompanyManagement(fallbackData || {});
                }
            }
        } catch (error) {
            console.error('Error fetching company info:', error);
            setCompanyManagement({ 
                companyName: '',
                fullAddress: '',
                phone: '',
                email: '',
                website: ''
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.activity) newErrors.activity = 'Activity is required';
        if (!formData.action.trim()) newErrors.action = 'Action is required';
        if (!formData.PCPV.trim()) newErrors.PCPV = 'PCPV is required';
        if (!formData.paymentDescription.trim()) newErrors.paymentDescription = 'Payment description is required';
        if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Valid amount is required';
        if (!formData.preparedBy.trim()) newErrors.preparedBy = 'Prepared by is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const url = editMode 
                ? `/api/pettycashmanagements/${currentTransactionId}`
                : '/api/pettycashmanagements';
            
            const method = editMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    date: formatDateForAPI(formData.date),
                    currency: 'ETB'
                }),
            });

            if (response.ok) {
                showSnackbar(
                    editMode 
                        ? 'Transaction updated successfully!' 
                        : 'Transaction recorded successfully!', 
                    'success'
                );
                handleCloseDialog();
                fetchTransactions();
            } else {
                const errorData = await response.json();
                showSnackbar(errorData.message || 'Error saving transaction', 'error');
            }
        } catch (error) {
            console.error('Error saving transaction:', error);
            showSnackbar('Error saving transaction', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle row click to open edit dialog
    const handleRowClick = (transaction) => {
        setFormData({
            date: new Date(transaction.date),
            activity: transaction.activity,
            action: transaction.action,
            PCPV: transaction.PCPV,
            paymentDescription: transaction.paymentDescription,
            amount: transaction.amount,
            attachment: transaction.attachment || '',
            preparedBy: transaction.preparedBy,
            checkedBy: transaction.checkedBy || '',
            approvedBy: transaction.approvedBy || '',
            remarks: transaction.remarks || ''
        });
        setEditMode(true);
        setCurrentTransactionId(transaction._id);
        setOpenDialog(true);
        setErrors({});
    };

    const handleEdit = (transaction) => {
        handleRowClick(transaction);
    };

    const handleDelete = (transaction) => {
        setTransactionToDelete(transaction);
        setDeleteDialog(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await fetch(`/api/pettycashmanagements/${transactionToDelete._id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                showSnackbar('Transaction deleted successfully!', 'success');
                fetchTransactions();
            } else {
                const errorData = await response.json();
                showSnackbar(errorData.message || 'Error deleting transaction', 'error');
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            showSnackbar('Error deleting transaction', 'error');
        } finally {
            setDeleteDialog(false);
            setTransactionToDelete(null);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleOpenDialog = () => {
        setOpenDialog(true);
        setEditMode(false);
        setCurrentTransactionId(null);
        setFormData({
            date: getCurrentDate(), // Set to current date
            activity: '',
            action: '',
            PCPV: '',
            paymentDescription: '',
            amount: '',
            attachment: '',
            preparedBy: '',
            checkedBy: '',
            approvedBy: '',
            remarks: ''
        });
        setErrors({});
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditMode(false);
        setCurrentTransactionId(null);
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const handleFilterChange = (field, value) => {
        const newFilters = { ...filters, [field]: value };
        
        // If filtering by activity and no date filter is set, automatically add today's date filter
        if (field === 'activity' && value && !newFilters.startDate && !newFilters.endDate) {
            newFilters.startDate = getCurrentDate();
            newFilters.endDate = getCurrentDate();
        }
        
        // If clearing activity filter and date filters were auto-added, clear date filters too
        if (field === 'activity' && !value && 
            filters.startDate && filters.endDate && 
            isToday(filters.startDate) && isToday(filters.endDate)) {
            newFilters.startDate = null;
            newFilters.endDate = null;
        }
        
        setFilters(newFilters);
    };

    // Check if a date is today
    const isToday = (date) => {
        if (!date) return false;
        const checkDate = new Date(date);
        const today = getCurrentDate();
        return (
            checkDate.getDate() === today.getDate() &&
            checkDate.getMonth() === today.getMonth() &&
            checkDate.getFullYear() === today.getFullYear()
        );
    };

    const handleRefresh = () => {
        fetchTransactions();
        showSnackbar('Data refreshed successfully', 'success');
    };

    // Reset all filters
    const handleResetFilters = () => {
        setFilters({
            activity: '',
            action: '',
            PCPV: '',
            startDate: null,
            endDate: null
        });
        showSnackbar('Filters reset successfully', 'info');
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams({
                ...(filters.activity && { activity: filters.activity }),
                ...(filters.action && { action: filters.action }),
                ...(filters.PCPV && { PCPV: filters.PCPV }),
                ...(filters.startDate && { startDate: formatDateForAPI(filters.startDate) }),
                ...(filters.endDate && { endDate: formatDateForAPI(filters.endDate) })
            });

            // If activity is filtered but no date filter is set, add today's date filter for export
            if (filters.activity && !filters.startDate && !filters.endDate) {
                const todayRange = getTodayDateRange();
                params.append('startDate', formatDateForAPI(todayRange.startOfDay));
                params.append('endDate', formatDateForAPI(todayRange.endOfDay));
            }

            const response = await fetch(`/api/pettycashmanagements/export/data?${params}`);
            const data = await response.json();

            const headers = Object.keys(data[0] || {}).join(',');
            const csvData = data.map(row => 
                Object.values(row).map(value => 
                    `"${value}"`
                ).join(',')
            ).join('\n');

            const csv = `${headers}\n${csvData}`;
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `petty-cash-${new Date().toISOString().split('T')[0]}.csv`;
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
                <title>Petty Cash Report</title>
                <style>
                    body { 
                        font-family: "Times New Roman", Times, serif; 
                        margin: 20px; 
                        font-size: 12px; 
                        line-height: 1.0;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 15px; 
                        border-bottom: 2px solid #333; 
                        padding-bottom: 8px; 
                        line-height: 1.0;
                    }
                    .company-name { 
                        font-family: "Times New Roman", Times, serif;
                        font-size: 20px; 
                        font-weight: bold; 
                        margin-bottom: 3px; 
                        line-height: 1.0;
                    }
                    .company-details { 
                        font-family: "Times New Roman", Times, serif;
                        font-size: 11px; 
                        margin-bottom: 2px; 
                        color: #666; 
                        line-height: 1.0;
                    }
                    .report-title { 
                        font-family: "Times New Roman", Times, serif;
                        font-size: 16px; 
                        margin-bottom: 5px; 
                        font-weight: bold; 
                        line-height: 1.0;
                    }
                    .print-info { 
                        display: flex; 
                        justify-content: space-between; 
                        margin-bottom: 10px; 
                        font-size: 11px; 
                        font-family: "Times New Roman", Times, serif;
                        line-height: 1.0;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-bottom: 12px; 
                        font-size: 12px; 
                        font-family: "Times New Roman", Times, serif;
                        line-height: 1.0;
                    }
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 4px; 
                        text-align: left; 
                        font-size: 12px; 
                        font-family: "Times New Roman", Times, serif;
                        line-height: 1.0;
                    }
                    th { 
                        background-color: #f5f5f5; 
                        font-weight: bold; 
                        font-size: 12px; 
                        font-family: "Times New Roman", Times, serif;
                        line-height: 1.0;
                    }
                    .summary { 
                        margin-top: 12px; 
                        padding: 10px; 
                        background-color: #f9f9f9; 
                        border-radius: 4px; 
                        border: 1px solid #ddd; 
                        font-size: 12px; 
                        font-family: "Times New Roman", Times, serif;
                        line-height: 1.0;
                    }
                    .footer { 
                        margin-top: 20px; 
                        display: flex; 
                        justify-content: space-between; 
                        font-size: 11px; 
                        font-family: "Times New Roman", Times, serif;
                        line-height: 1.0;
                    }
                    .signature { 
                        width: 180px; 
                        border-top: 1px solid #333; 
                        margin-top: 30px; 
                        padding-top: 3px; 
                        font-size: 11px; 
                        font-family: "Times New Roman", Times, serif;
                        line-height: 1.0;
                    }
                    .currency { 
                        text-align: right; 
                    }
                    .negative { 
                        color: red; 
                        font-weight: bold; 
                    }
                    .positive { 
                        color: green; 
                        font-weight: bold; 
                    }
                    .table-container { 
                        font-size: 12px; 
                        font-family: "Times New Roman", Times, serif;
                        line-height: 1.0;
                    }
                    @media print {
                        body { 
                            margin: 0.4in; 
                            font-size: 12px; 
                            font-family: "Times New Roman", Times, serif;
                            line-height: 1.0;
                        }
                        table { 
                            font-size: 12px; 
                            font-family: "Times New Roman", Times, serif;
                            line-height: 1.0;
                        }
                        th, td { 
                            font-size: 12px; 
                            padding: 3px; 
                            font-family: "Times New Roman", Times, serif;
                            line-height: 1.0;
                        }
                        .header, .summary, .footer, .print-info {
                            font-family: "Times New Roman", Times, serif;
                            line-height: 1.0;
                        }
                        .header {
                            margin-bottom: 12px;
                        }
                        .summary {
                            margin-top: 10px;
                            padding: 8px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-name">${companyManagement?.companyName || 'Company Name Not Set'}</div>
                    ${companyManagement?.fullAddress ? `<div class="company-details">${companyManagement.fullAddress}</div>` : ''}
                    ${companyManagement?.phone ? `<div class="company-details">Phone: ${companyManagement.phone}</div>` : ''}
                    ${companyManagement?.email ? `<div class="company-details">Email: ${companyManagement.email}</div>` : ''}
                    ${companyManagement?.website ? `<div class="company-details">Website: ${companyManagement.website}</div>` : ''}
                    <div class="report-title">Petty Cash Transactions Report</div>
                    <div class="report-title">Currency: ETB</div>
                </div>
                
                <div class="print-info">
                    <div><strong>Printed on:</strong> ${formatDisplayDate(getCurrentDate().toString())} ${new Date().toLocaleTimeString()}</div>
                </div>

                <div class="table-container">
                    ${tableHtml}
                </div>

                <div class="summary">
                    <strong>Summary (ETB):</strong><br/>
                    <strong>Total Debit:</strong> ${formatCurrency(totals?.totalDebit || 0)}<br/>
                    <strong>Total Credit:</strong> ${formatCurrency(totals?.totalCredit || 0)}<br/>
                    <strong>Balance:</strong> <span class="${(totals?.balance || 0) < 0 ? 'negative' : 'positive'}">${formatCurrency(totals?.balance || 0)}</span>
                </div>

                <div class="footer">
                    <div class="signature">
                        <strong>Prepared by:</strong> ________________<br/>
                        ${formData.preparedBy || 'N/A'}
                    </div>
                    <div class="signature">
                        <strong>Checked by:</strong> ________________<br/>
                        ${formData.checkedBy || 'N/A'}
                    </div>
                    <div class="signature">
                        <strong>Approved by:</strong> ________________<br/>
                        ${formData.approvedBy || 'N/A'}
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

    // Format date to MM/DD/YYYY for display
    const formatDisplayDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    };

    // Format date for API (YYYY-MM-DD)
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
            currency: 'ETB'
        }).format(amount);
    };

    // Custom DatePicker component that opens calendar when any part is clicked
    const CustomDatePicker = ({ label, value, onChange, ...props }) => {
        const [open, setOpen] = useState(false);
        
        return (
            <DatePicker
                label={label}
                value={value || getCurrentDate()} // Default to current date
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

    // Simplified compact date display for table cells
    const DateDisplayCell = ({ date }) => {
        return (
            <Typography
                variant="body2"
                sx={{
                    fontSize: '0.8125rem',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap'
                }}
            >
                {formatDisplayDate(date)}
            </Typography>
        );
    };

    // Check if any filters are active
    const hasActiveFilters = () => {
        return (
            filters.activity !== '' ||
            filters.action !== '' ||
            filters.PCPV !== '' ||
            filters.startDate !== null ||
            filters.endDate !== null
        );
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 2 }}>
                {/* Header with Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            Petty Cash Management
                        </Typography>
                        {companyManagement?.companyName && (
                            <Typography variant="body2" color="textSecondary">
                                {companyManagement.companyName}
                            </Typography>
                        )}
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
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenDialog}
                            size="small"
                            sx={{ ml: 1 }}
                        >
                            Add
                        </Button>
                    </Box>
                </Box>

                {/* Summary Cards */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ minHeight: '80px' }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <BalanceIcon color="error" sx={{ mr: 1, fontSize: '1rem' }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Total Debit (ETB)
                                    </Typography>
                                </Box>
                                <Typography variant="h6" color="error">
                                    {formatCurrency(totals?.totalDebit || 0)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ minHeight: '80px' }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <BalanceIcon color="success" sx={{ mr: 1, fontSize: '1rem' }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Total Credit (ETB)
                                    </Typography>
                                </Box>
                                <Typography variant="h6" color="success">
                                    {formatCurrency(totals?.totalCredit || 0)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ minHeight: '80px' }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <BalanceIcon 
                                        color={(totals?.balance || 0) < 0 ? 'error' : 'success'} 
                                        sx={{ mr: 1, fontSize: '1rem' }} 
                                    />
                                    <Typography variant="body2" color="textSecondary">
                                        Balance (ETB)
                                    </Typography>
                                </Box>
                                <Typography 
                                    variant="h6" 
                                    color={(totals?.balance || 0) < 0 ? 'error' : 'success'}
                                >
                                    {formatCurrency(totals?.balance || 0)}
                                </Typography>
                                {(totals?.balance || 0) < 0 && (
                                    <Alert severity="warning" sx={{ mt: 0.5, p: 0.5, fontSize: '0.7rem' }}>
                                        Negative balance!
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Filters - Collapsible */}
                {showFilters && (
                    <Paper sx={{ p: 1.5, mb: 2 }}>
                        <Grid container spacing={1} alignItems="center">
                            <Grid item xs={12} md={2.4}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Activity"
                                    value={filters.activity}
                                    onChange={(e) => handleFilterChange('activity', e.target.value)}
                                    size="small"
                                    InputProps={{
                                        endAdornment: filters.activity && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleFilterChange('activity', '')}
                                                sx={{ mr: -1 }}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        )
                                    }}
                                >
                                    <MenuItem value="">All Activities</MenuItem>
                                    {activities.map(activity => (
                                        <MenuItem key={activity} value={activity}>
                                            {activity}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2.4}>
                                <TextField
                                    fullWidth
                                    label="Action"
                                    value={filters.action}
                                    onChange={(e) => handleFilterChange('action', e.target.value)}
                                    placeholder="Search action..."
                                    size="small"
                                    InputProps={{
                                        endAdornment: filters.action && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleFilterChange('action', '')}
                                                sx={{ mr: -1 }}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={2.4}>
                                <TextField
                                    fullWidth
                                    label="PCPV"
                                    value={filters.PCPV}
                                    onChange={(e) => handleFilterChange('PCPV', e.target.value)}
                                    placeholder="Search PCPV..."
                                    size="small"
                                    InputProps={{
                                        endAdornment: filters.PCPV && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleFilterChange('PCPV', '')}
                                                sx={{ mr: -1 }}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={2.4}>
                                <CustomDatePicker
                                    label="Start Date"
                                    value={filters.startDate}
                                    onChange={(date) => {
                                        const newFilters = { ...filters, startDate: date };
                                        // If clearing start date and it was auto-added for activity, clear activity too
                                        if (!date && filters.activity && isToday(filters.startDate)) {
                                            newFilters.activity = '';
                                            newFilters.endDate = null;
                                        }
                                        setFilters(newFilters);
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={2.4}>
                                <CustomDatePicker
                                    label="End Date"
                                    value={filters.endDate}
                                    onChange={(date) => {
                                        const newFilters = { ...filters, endDate: date };
                                        // If clearing end date and it was auto-added for activity, clear activity too
                                        if (!date && filters.activity && isToday(filters.endDate)) {
                                            newFilters.activity = '';
                                            newFilters.startDate = null;
                                        }
                                        setFilters(newFilters);
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                    <Box>
                                        {hasActiveFilters() && (
                                            <Chip
                                                label="Active Filters"
                                                color="primary"
                                                size="small"
                                                variant="outlined"
                                                sx={{ mr: 1 }}
                                            />
                                        )}
                                    </Box>
                                    <Box>
                                        <Button
                                            variant="outlined"
                                            startIcon={<ClearIcon />}
                                            onClick={handleResetFilters}
                                            size="small"
                                            disabled={!hasActiveFilters()}
                                            sx={{ ml: 1 }}
                                        >
                                            Reset Filters
                                        </Button>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                )}

                {/* Active Filters Indicator */}
                {hasActiveFilters() && !showFilters && (
                    <Paper sx={{ p: 1, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FilterIcon color="primary" fontSize="small" />
                            <Typography variant="body2" color="textSecondary">
                                Active Filters:
                            </Typography>
                            {filters.activity && (
                                <Chip
                                    label={`Activity: ${filters.activity}`}
                                    size="small"
                                    onDelete={() => handleFilterChange('activity', '')}
                                />
                            )}
                            {filters.action && (
                                <Chip
                                    label={`Action: ${filters.action}`}
                                    size="small"
                                    onDelete={() => handleFilterChange('action', '')}
                                />
                            )}
                            {filters.PCPV && (
                                <Chip
                                    label={`PCPV: ${filters.PCPV}`}
                                    size="small"
                                    onDelete={() => handleFilterChange('PCPV', '')}
                                />
                            )}
                            {filters.startDate && (
                                <Chip
                                    label={`From: ${formatDisplayDate(filters.startDate)}`}
                                    size="small"
                                    onDelete={() => {
                                        const newFilters = { ...filters, startDate: null };
                                        // If clearing auto-added date for activity, clear activity too
                                        if (filters.activity && isToday(filters.startDate)) {
                                            newFilters.activity = '';
                                            newFilters.endDate = null;
                                        }
                                        setFilters(newFilters);
                                    }}
                                />
                            )}
                            {filters.endDate && (
                                <Chip
                                    label={`To: ${formatDisplayDate(filters.endDate)}`}
                                    size="small"
                                    onDelete={() => {
                                        const newFilters = { ...filters, endDate: null };
                                        // If clearing auto-added date for activity, clear activity too
                                        if (filters.activity && isToday(filters.endDate)) {
                                            newFilters.activity = '';
                                            newFilters.startDate = null;
                                        }
                                        setFilters(newFilters);
                                    }}
                                />
                            )}
                        </Box>
                        <Box>
                            <Tooltip title="Clear All Filters">
                                <IconButton
                                    size="small"
                                    onClick={handleResetFilters}
                                    color="primary"
                                >
                                    <ClearIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Paper>
                )}

                {/* Transactions Table - Now shows ALL transactions with newest at the bottom */}
                <Box sx={{ position: 'relative', mb: 2 }}>
                    <TableContainer 
                        component={Paper} 
                        ref={tableRef}
                        sx={{ 
                            maxHeight: '400px', // Fixed height for scrolling
                            overflow: 'auto',
                            '&::-webkit-scrollbar': {
                                width: '8px',
                            },
                            '&::-webkit-scrollbar-track': {
                                background: '#f1f1f1',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: '#888',
                                borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-thumb:hover': {
                                background: '#555',
                            }
                        }}
                    >
                        <Table sx={{ minWidth: 650 }} size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ 
                                        padding: '6px 8px', 
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.8125rem',
                                        minWidth: '80px',
                                        width: '80px',
                                        backgroundColor: '#f5f5f5',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1
                                    }}>Date</TableCell>
                                    <TableCell sx={{ 
                                        padding: '6px 8px', 
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.8125rem',
                                        backgroundColor: '#f5f5f5',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1
                                    }}>Activity</TableCell>
                                    <TableCell sx={{ 
                                        padding: '6px 8px', 
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.8125rem',
                                        backgroundColor: '#f5f5f5',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1
                                    }}>Action</TableCell>
                                    <TableCell sx={{ 
                                        padding: '6px 8px', 
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.8125rem',
                                        backgroundColor: '#f5f5f5',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1
                                    }}>PCPV</TableCell>
                                    <TableCell sx={{ 
                                        padding: '6px 8px', 
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.8125rem',
                                        backgroundColor: '#f5f5f5',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1
                                    }}>Payment Description</TableCell>
                                    <TableCell sx={{ 
                                        padding: '6px 8px', 
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.8125rem',
                                        backgroundColor: '#f5f5f5',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1
                                    }}>Amount (ETB)</TableCell>
                                    <TableCell sx={{ 
                                        padding: '6px 8px', 
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.8125rem',
                                        backgroundColor: '#f5f5f5',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1
                                    }}>Prepared By</TableCell>
                                    <TableCell sx={{ 
                                        padding: '6px 8px', 
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.8125rem',
                                        backgroundColor: '#f5f5f5',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1
                                    }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((transaction) => (
                                        <TableRow 
                                            key={transaction._id} 
                                            hover
                                            sx={{ 
                                                height: '36px',
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                                }
                                            }}
                                            onClick={() => handleRowClick(transaction)}
                                        >
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap',
                                                minWidth: '80px',
                                                width: '80px'
                                            }}>
                                                <DateDisplayCell date={transaction.date} />
                                            </TableCell>
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                <Chip 
                                                    label={transaction.activity} 
                                                    color={transaction.activity === 'Debit' ? 'error' : 'success'}
                                                    size="small" 
                                                    sx={{ 
                                                        height: '20px', 
                                                        fontSize: '0.75rem',
                                                        '& .MuiChip-label': {
                                                            px: 0.75,
                                                            py: 0.25
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.8125rem'
                                            }}>{transaction.action}</TableCell>
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.8125rem'
                                            }}>{transaction.PCPV}</TableCell>
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap',
                                                maxWidth: '150px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                fontSize: '0.8125rem'
                                            }} title={transaction.paymentDescription}>
                                                {transaction.paymentDescription}
                                            </TableCell>
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.8125rem'
                                            }}>
                                                <Typography 
                                                    color={transaction.activity === 'Debit' ? 'error' : 'success'}
                                                    fontWeight="bold"
                                                    variant="body2"
                                                    sx={{ fontSize: '0.8125rem' }}
                                                >
                                                    {formatCurrency(transaction.amount)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.8125rem'
                                            }}>{transaction.preparedBy}</TableCell>
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap'
                                            }} onClick={(e) => e.stopPropagation()}>
                                                <Box sx={{ display: 'flex', gap: 0.25 }}>
                                                    <Tooltip title="Edit">
                                                        <IconButton 
                                                            size="small" 
                                                            color="primary"
                                                            onClick={() => handleEdit(transaction)}
                                                            sx={{ padding: '4px' }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                        <IconButton 
                                                            size="small" 
                                                            color="error"
                                                            onClick={() => handleDelete(transaction)}
                                                            sx={{ padding: '4px' }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                            <Typography color="textSecondary">
                                                No transactions found
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Scroll indicator - shows when there are many transactions */}
                    {filteredTransactions.length > 10 && (
                        <Box sx={{ 
                            position: 'absolute', 
                            bottom: 8, 
                            right: 8, 
                            display: 'flex', 
                            gap: 0.5,
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            borderRadius: 1,
                            p: 0.5
                        }}>
                            <Typography variant="caption" color="textSecondary">
                                Scroll to see more transactions
                            </Typography>
                            <KeyboardArrowDownIcon fontSize="small" color="action" />
                        </Box>
                    )}
                </Box>

                {/* Transaction Count and Status */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                        Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
                        {hasActiveFilters() && ' (filtered)'}
                        {filters.activity && isToday(filters.startDate) && isToday(filters.endDate) && ' (Today)'}
                    </Typography>
                    
                    {/* Total transaction count */}
                    <Typography variant="body2" color="textSecondary">
                        Total: {transactions.length} transactions
                    </Typography>
                </Box>

                {/* Add/Edit Transaction Dialog */}
                <Dialog 
                    open={openDialog} 
                    onClose={handleCloseDialog}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        {editMode ? 'Edit Transaction' : 'Record New Petty Cash Transaction'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <Grid item xs={12} md={6}>
                                <CustomDatePicker
                                    label="Transaction Date"
                                    value={formData.date}
                                    onChange={(date) => handleInputChange('date', date)}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth error={!!errors.activity} required size="small">
                                    <InputLabel>Activity</InputLabel>
                                    <Select
                                        value={formData.activity}
                                        label="Activity"
                                        onChange={(e) => handleInputChange('activity', e.target.value)}
                                    >
                                        {activities.map(activity => (
                                            <MenuItem key={activity} value={activity}>
                                                {activity}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.activity && (
                                        <Typography variant="caption" color="error">
                                            {errors.activity}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth error={!!errors.action} required size="small">
                                    <InputLabel>Action</InputLabel>
                                    <Select
                                        value={formData.action}
                                        label="Action"
                                        onChange={(e) => handleInputChange('action', e.target.value)}
                                    >
                                        {actionTypes.map(action => (
                                            <MenuItem key={action} value={action}>
                                                {action}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.action && (
                                        <Typography variant="caption" color="error">
                                            {errors.action}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="PCPV"
                                    value={formData.PCPV}
                                    onChange={(e) => handleInputChange('PCPV', e.target.value)}
                                    error={!!errors.PCPV}
                                    helperText={errors.PCPV}
                                    required
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Amount (ETB)"
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => handleInputChange('amount', e.target.value)}
                                    error={!!errors.amount}
                                    helperText={errors.amount}
                                    required
                                    size="small"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Payment Description"
                                    value={formData.paymentDescription}
                                    onChange={(e) => handleInputChange('paymentDescription', e.target.value)}
                                    error={!!errors.paymentDescription}
                                    helperText={errors.paymentDescription}
                                    required
                                    multiline
                                    rows={2}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Prepared By"
                                    value={formData.preparedBy}
                                    onChange={(e) => handleInputChange('preparedBy', e.target.value)}
                                    error={!!errors.preparedBy}
                                    helperText={errors.preparedBy}
                                    required
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Checked By"
                                    value={formData.checkedBy}
                                    onChange={(e) => handleInputChange('checkedBy', e.target.value)}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Approved By"
                                    value={formData.approvedBy}
                                    onChange={(e) => handleInputChange('approvedBy', e.target.value)}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Attachment URL"
                                    value={formData.attachment}
                                    onChange={(e) => handleInputChange('attachment', e.target.value)}
                                    helperText="Link to receipt or document"
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Remarks"
                                    value={formData.remarks}
                                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                                    multiline
                                    rows={2}
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog} size="small">
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            variant="contained"
                            disabled={submitting}
                            size="small"
                        >
                            {submitting ? 'Saving...' : (editMode ? 'Update Transaction' : 'Submit Transaction')}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteDialog}
                    onClose={() => setDeleteDialog(false)}
                >
                    <DialogTitle>
                        Confirm Delete
                    </DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete this transaction?
                        </Typography>
                        {transactionToDelete && (
                            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                                <Typography variant="body2">
                                    <strong>Date:</strong> {formatDisplayDate(transactionToDelete.date)}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Activity:</strong> {transactionToDelete.activity}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Action:</strong> {transactionToDelete.action}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Amount:</strong> {formatCurrency(transactionToDelete.amount)}
                                </Typography>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialog(false)} size="small">
                            Cancel
                        </Button>
                        <Button 
                            onClick={confirmDelete} 
                            variant="contained" 
                            color="error"
                            size="small"
                        >
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Snackbar for notifications */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                >
                    <Alert 
                        onClose={handleCloseSnackbar} 
                        severity={snackbar.severity}
                        sx={{ fontSize: '0.875rem' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
};

export default PettyCashManagement;