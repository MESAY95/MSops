import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Card,
    CardContent,
    Grid,
    Typography,
    Alert,
    Snackbar,
    Tooltip,
    IconButton,
    InputAdornment,
    Stack,
    Divider,
    CircularProgress
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Business as BusinessIcon,
    Print as PrintIcon,
    FilterList as FilterIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Code as CodeIcon,
    Clear as ClearIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    Visibility as VisibilityIcon
} from '@mui/icons-material';
import axios from 'axios';

// Enhanced debounce hook
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

const DepartmentManagement = ({ onBack }) => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [viewMode, setViewMode] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: ''
    });
    const [pagination, setPagination] = useState({
        page: 0,
        pageSize: 10,
        total: 0
    });
    const [stats, setStats] = useState({
        totalDepartments: 0,
        activeDepartments: 0,
        inactiveDepartments: 0
    });
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const tableRef = useRef();
    const [connectionError, setConnectionError] = useState(null);

    // API base URL
    const API_BASE = 'http://localhost:5000/api/departmentmanagements';

    // Configure axios defaults
    axios.defaults.timeout = 10000; // 10 seconds timeout
    axios.defaults.headers.common['Content-Type'] = 'application/json';

    // Use debounced search
    const debouncedSearch = useDebounce(filters.search, 500);

    // Form state
    const [formData, setFormData] = useState({
        departmentName: '',
        departmentCode: '',
        description: '',
        status: 'Active'
    });

    const [formErrors, setFormErrors] = useState({});
    const [touchedFields, setTouchedFields] = useState({});

    // Snackbar functions
    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Form validation
    const validateForm = () => {
        const errors = {};

        if (!formData.departmentName.trim()) {
            errors.departmentName = 'Department name is required';
        } else if (formData.departmentName.trim().length < 2) {
            errors.departmentName = 'Department name must be at least 2 characters';
        }

        if (!formData.departmentCode.trim()) {
            errors.departmentCode = 'Department code is required';
        } else if (formData.departmentCode.trim().length < 2) {
            errors.departmentCode = 'Department code must be at least 2 characters';
        } else if (!/^[A-Za-z0-9_-]+$/.test(formData.departmentCode.trim())) {
            errors.departmentCode = 'Department code can only contain letters, numbers, hyphens and underscores';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setTouchedFields(prev => ({ ...prev, [field]: true }));

        // Real-time validation
        if (touchedFields[field] || formErrors[field]) {
            const errors = { ...formErrors };

            if ((field === 'departmentName' || field === 'departmentCode') && !value.trim()) {
                errors[field] = `${field.replace(/([A-Z])/g, ' $1')} is required`;
            } else if (field === 'departmentName' && value.trim().length < 2) {
                errors.departmentName = 'Department name must be at least 2 characters';
            } else if (field === 'departmentCode' && value.trim().length < 2) {
                errors.departmentCode = 'Department code must be at least 2 characters';
            } else if (field === 'departmentCode' && !/^[A-Za-z0-9_-]+$/.test(value.trim())) {
                errors.departmentCode = 'Department code can only contain letters, numbers, hyphens and underscores';
            } else {
                delete errors[field];
            }

            setFormErrors(errors);
        }
    };

    // Fetch departments
    const fetchDepartments = useCallback(async () => {
        setLoading(true);
        setError(null);
        setConnectionError(null);
        
        try {
            const params = new URLSearchParams({
                page: pagination.page + 1,
                limit: pagination.pageSize,
                ...(filters.search && { search: filters.search }),
                ...(filters.status && { status: filters.status }),
                sortBy: 'createdAt',
                sortOrder: 'asc'
            });

            const response = await axios.get(`${API_BASE}?${params}`, { 
                timeout: 10000
            });

            // Handle different response formats
            let departmentsData = [];
            let paginationData = null;

            if (response.data && response.data.success) {
                departmentsData = response.data.data || [];
                paginationData = response.data.pagination;
            } else if (response.data && Array.isArray(response.data.data)) {
                departmentsData = response.data.data;
                paginationData = response.data.pagination;
            } else if (Array.isArray(response.data)) {
                departmentsData = response.data;
            } else {
                throw new Error('Unexpected response format from server');
            }

            setDepartments(departmentsData);

            if (paginationData) {
                setPagination(prev => ({
                    ...prev,
                    page: (paginationData.currentPage || 1) - 1,
                    total: paginationData.totalItems || departmentsData.length
                }));
            } else {
                setPagination(prev => ({
                    ...prev,
                    page: 0,
                    total: departmentsData.length
                }));
            }

            // Calculate stats
            const activeDepartments = departmentsData.filter(dept => 
                dept?.status === 'Active' || dept?.status === 'active'
            );
            const inactiveDepartments = departmentsData.filter(dept => 
                dept?.status === 'Inactive' || dept?.status === 'inactive'
            );

            setStats({
                totalDepartments: departmentsData.length,
                activeDepartments: activeDepartments.length,
                inactiveDepartments: inactiveDepartments.length
            });

            // Reset error state on success
            if (connectionError) {
                setConnectionError(null);
            }

        } catch (error) {
            let errorMessage = 'Failed to fetch departments';
            
            if (error.response) {
                if (error.response.status === 401) {
                    errorMessage = 'Authentication failed. Please login again.';
                } else if (error.response.status === 403) {
                    errorMessage = 'You do not have permission to access departments.';
                } else if (error.response.status === 404) {
                    errorMessage = 'Department API endpoint not found.';
                } else if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.data?.error) {
                    errorMessage = error.response.data.error;
                }
            } else if (error.request) {
                errorMessage = 'No response from server. Please check if the backend is running.';
                setConnectionError(errorMessage);
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timeout. Please try again.';
                setConnectionError(errorMessage);
            } else {
                errorMessage = error.message || 'Network error occurred.';
            }
            
            setError(errorMessage);
            showSnackbar(`Error: ${errorMessage}`, 'error');
            console.error('Error fetching departments:', error);
            
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.page, pagination.pageSize, connectionError]);

    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments, debouncedSearch]);

    const handleTableChange = (event, newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleRowsPerPageChange = (event) => {
        const newPageSize = parseInt(event.target.value, 10);
        setPagination(prev => ({ ...prev, page: 0, pageSize: newPageSize }));
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
        setPagination(prev => ({ ...prev, page: 0 }));
    };

    const handleResetFilters = () => {
        setFilters({
            search: '',
            status: ''
        });
        showSnackbar('Filters reset successfully', 'info');
    };

    const showModal = (department = null, view = false) => {
        setEditingDepartment(department);
        setViewMode(view);
        setModalVisible(true);

        setFormErrors({});
        setTouchedFields({});

        if (department) {
            setFormData({
                departmentName: department.departmentName || '',
                departmentCode: department.departmentCode || '',
                description: department.description || '',
                status: department.status || 'Active'
            });
        } else {
            setFormData({
                departmentName: '',
                departmentCode: '',
                description: '',
                status: 'Active'
            });
        }
    };

    const handleCancel = () => {
        setModalVisible(false);
        setEditingDepartment(null);
        setViewMode(false);
        setFormData({
            departmentName: '',
            departmentCode: '',
            description: '',
            status: 'Active'
        });
        setFormErrors({});
        setTouchedFields({});
    };

    const handleRefresh = () => {
        fetchDepartments();
        showSnackbar('Data refreshed successfully', 'success');
    };

    const handleDeleteDepartment = async (id) => {
        const department = departments.find(d => d._id === id);
        if (!department) return;

        if (window.confirm(`Are you sure you want to delete department: ${department.departmentName}?`)) {
            try {
                await axios.delete(`${API_BASE}/${id}`);
                showSnackbar(`Successfully deleted department: ${department.departmentName}`, 'success');
                await fetchDepartments();
            } catch (error) {
                let errorMessage = 'Delete failed';
                
                if (error.response) {
                    if (error.response.status === 401) {
                        errorMessage = 'Authentication failed. Please login again.';
                    } else if (error.response.status === 404) {
                        errorMessage = 'Department not found';
                    } else if (error.response.data?.message) {
                        errorMessage = error.response.data.message;
                    }
                }
                
                showSnackbar(`Delete failed: ${errorMessage}`, 'error');
                setError(errorMessage);
            }
        }
    };

    const handleSubmit = async () => {
        // Mark all required fields as touched
        const allTouched = {
            departmentName: true,
            departmentCode: true
        };
        setTouchedFields(allTouched);

        if (!validateForm()) {
            setError('Please fix the validation errors before submitting');
            showSnackbar('Please fix validation errors before submitting', 'error');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const submitData = {
                departmentName: formData.departmentName.trim(),
                departmentCode: formData.departmentCode.trim(),
                description: formData.description.trim(),
                status: formData.status
            };

            let response;
            if (editingDepartment) {
                response = await axios.put(`${API_BASE}/${editingDepartment._id}`, submitData, { 
                    timeout: 10000 
                });
                showSnackbar(`Successfully updated department: ${formData.departmentName}`, 'success');
            } else {
                response = await axios.post(API_BASE, submitData, { 
                    timeout: 10000 
                });
                showSnackbar(`Successfully created new department: ${formData.departmentName}`, 'success');
            }

            setModalVisible(false);
            setEditingDepartment(null);
            setViewMode(false);
            setFormData({
                departmentName: '',
                departmentCode: '',
                description: '',
                status: 'Active'
            });
            setFormErrors({});
            setTouchedFields({});

            await fetchDepartments();

        } catch (error) {
            let errorMessage = 'Operation failed';

            if (error.response) {
                const serverError = error.response.data;
                
                if (error.response.status === 401) {
                    errorMessage = 'Authentication failed. Please login again.';
                } else if (error.response.status === 409) {
                    errorMessage = serverError.message || 'Department code already exists';
                } else if (serverError.message) {
                    errorMessage = serverError.message;
                } else if (serverError.errors && Array.isArray(serverError.errors)) {
                    errorMessage = serverError.errors.join(', ');
                }
            } else if (error.request) {
                errorMessage = 'No response from server. Please check if the backend is running.';
                setConnectionError(errorMessage);
            } else {
                errorMessage = error.message;
            }

            setError(`Error: ${errorMessage}`);
            showSnackbar(`Operation failed: ${errorMessage}`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Print functionality
    const handlePrint = () => {
        try {
            const printWindow = window.open('', '_blank');
            const tableHtml = tableRef.current?.innerHTML || '';

            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Departments Report</title>
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
                        .active { 
                            color: green; 
                            font-weight: bold; 
                        }
                        .inactive { 
                            color: red; 
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
                        <div class="report-title">Departments Management Report</div>
                    </div>
                    
                    <div class="print-info">
                        <div><strong>Printed on:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
                        <div><strong>Printed by:</strong> User</div>
                    </div>

                    <div class="table-container">
                        ${tableHtml}
                    </div>

                    <div class="summary">
                        <strong>Summary:</strong><br/>
                        <strong>Total Departments:</strong> ${stats.totalDepartments}<br/>
                        <strong>Active Departments:</strong> ${stats.activeDepartments}<br/>
                        <strong>Inactive Departments:</strong> ${stats.inactiveDepartments}
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
        } catch (error) {
            console.error('Print error:', error);
            setError('Error generating print document');
            showSnackbar('Error generating print document', 'error');
        }
    };

    // Check if any filters are active
    const hasActiveFilters = () => {
        return (
            filters.search !== '' ||
            filters.status !== ''
        );
    };

    // Status colors and icons
    const getStatusColor = (status) => {
        switch (status) {
            case 'Active':
            case 'active': return 'success';
            case 'Inactive':
            case 'inactive': return 'error';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Active':
            case 'active': return <CheckCircleIcon />;
            case 'Inactive':
            case 'inactive': return <CancelIcon />;
            default: return null;
        }
    };

    // Table columns
    const columns = [
        {
            id: 'departmentCode',
            label: 'Department Code',
            render: (department) => (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CodeIcon sx={{ mr: 1, fontSize: 16, color: 'primary.main' }} />
                    <Typography variant="body2" fontWeight="bold" sx={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                        {department.departmentCode || 'N/A'}
                    </Typography>
                </Box>
            )
        },
        {
            id: 'departmentName',
            label: 'Department Name',
            render: (department) => (
                <Typography variant="body2" sx={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                    {department.departmentName || 'N/A'}
                </Typography>
            )
        },
        {
            id: 'description',
            label: 'Description',
            render: (department) => (
                <Typography variant="body2" color="text.secondary" sx={{ 
                    whiteSpace: 'nowrap', 
                    maxWidth: '150px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: '0.8125rem' 
                }} title={department.description}>
                    {department.description || 'No description'}
                </Typography>
            )
        },
        {
            id: 'status',
            label: 'Status',
            render: (department) => (
                <Chip
                    label={department.status}
                    color={getStatusColor(department.status)}
                    icon={getStatusIcon(department.status)}
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
            )
        },
        {
            id: 'actions',
            label: 'Actions',
            render: (department) => (
                <Box sx={{ display: 'flex', gap: 0.25 }}>
                    <Tooltip title="View">
                        <IconButton
                            size="small"
                            color="info"
                            onClick={(e) => {
                                e.stopPropagation();
                                showModal(department, true);
                            }}
                            sx={{ padding: '4px' }}
                        >
                            <VisibilityIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                showModal(department, false);
                            }}
                            sx={{ padding: '4px' }}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDepartment(department._id);
                            }}
                            sx={{ padding: '4px' }}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ];

    // Handle back navigation
    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate('/');
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            {/* Connection Error Alert */}
            {connectionError && (
                <Alert 
                    severity="error" 
                    sx={{ mb: 2 }}
                    action={
                        <Button 
                            color="inherit" 
                            size="small" 
                            onClick={() => setConnectionError(null)}
                        >
                            Dismiss
                        </Button>
                    }
                >
                    <Typography variant="body2">{connectionError}</Typography>
                </Alert>
            )}

            {/* Header with Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        Department Management
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Manage organizational departments
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Refresh">
                        <IconButton onClick={handleRefresh} size="small" disabled={loading}>
                            <RefreshIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Print">
                        <IconButton onClick={handlePrint} size="small" disabled={departments.length === 0}>
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
                        onClick={() => showModal()}
                        size="small"
                        sx={{ ml: 1 }}
                        disabled={loading || connectionError}
                    >
                        Add Department
                    </Button>
                </Box>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ minHeight: '80px', bgcolor: 'background.paper' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <BusinessIcon color="primary" sx={{ mr: 1, fontSize: '1rem' }} />
                                <Typography variant="body2" color="textSecondary">
                                    Total Departments
                                </Typography>
                            </Box>
                            <Typography variant="h6" color="primary">
                                {stats.totalDepartments}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ minHeight: '80px', bgcolor: 'background.paper' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: '1rem' }} />
                                <Typography variant="body2" color="textSecondary">
                                    Active Departments
                                </Typography>
                            </Box>
                            <Typography variant="h6" color="success">
                                {stats.activeDepartments}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ minHeight: '80px', bgcolor: 'background.paper' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <CancelIcon color="error" sx={{ mr: 1, fontSize: '1rem' }} />
                                <Typography variant="body2" color="textSecondary">
                                    Inactive Departments
                                </Typography>
                            </Box>
                            <Typography variant="h6" color="error">
                                {stats.inactiveDepartments}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filters - Collapsible */}
            {showFilters && (
                <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'background.paper' }}>
                    <Grid container spacing={1} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Search"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                placeholder="Search departments..."
                                size="small"
                                disabled={loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                    endAdornment: filters.search && (
                                        <IconButton
                                            size="small"
                                            onClick={() => handleFilterChange('search', '')}
                                            sx={{ mr: -1 }}
                                            disabled={loading}
                                        >
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    )
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth size="small" disabled={loading}>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    label="Status"
                                >
                                    <MenuItem value="">All Status</MenuItem>
                                    <MenuItem value="Active">Active</MenuItem>
                                    <MenuItem value="Inactive">Inactive</MenuItem>
                                </Select>
                            </FormControl>
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
                                        disabled={!hasActiveFilters() || loading}
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
                <Paper sx={{ p: 1, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <FilterIcon color="primary" fontSize="small" />
                        <Typography variant="body2" color="textSecondary">
                            Active Filters:
                        </Typography>
                        {filters.search && (
                            <Chip
                                label={`Search: ${filters.search}`}
                                size="small"
                                onDelete={() => handleFilterChange('search', '')}
                                disabled={loading}
                            />
                        )}
                        {filters.status && (
                            <Chip
                                label={`Status: ${filters.status}`}
                                size="small"
                                onDelete={() => handleFilterChange('status', '')}
                                disabled={loading}
                            />
                        )}
                    </Box>
                    <Box>
                        <Tooltip title="Clear All Filters">
                            <IconButton
                                size="small"
                                onClick={handleResetFilters}
                                color="primary"
                                disabled={loading || !hasActiveFilters()}
                            >
                                <ClearIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Paper>
            )}

            {/* Loading Indicator */}
            {loading && (
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <CircularProgress size={24} />
                    <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                        Loading departments...
                    </Typography>
                </Box>
            )}

            {/* Departments Table */}
            <Box sx={{ position: 'relative', mb: 2 }}>
                <TableContainer
                    component={Paper}
                    ref={tableRef}
                    sx={{
                        maxHeight: '400px',
                        overflow: 'auto',
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: '#f1f1f1',
                            borderRadius: '4px',
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
                                {columns.map((column) => (
                                    <TableCell
                                        key={column.id}
                                        sx={{
                                            padding: '6px 8px',
                                            fontWeight: 'bold',
                                            whiteSpace: 'nowrap',
                                            fontSize: '0.8125rem',
                                            backgroundColor: 'background.paper',
                                            position: 'sticky',
                                            top: 0,
                                            zIndex: 1,
                                            borderBottom: '2px solid',
                                            borderBottomColor: 'divider'
                                        }}
                                    >
                                        {column.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                                        <CircularProgress size={24} />
                                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                            Loading departments...
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : departments.length > 0 ? (
                                departments.map((department) => (
                                    <TableRow 
                                        key={department._id} 
                                        hover
                                        sx={{
                                            height: '36px',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                backgroundColor: 'action.hover'
                                            }
                                        }}
                                        onClick={() => showModal(department, true)}
                                    >
                                        {columns.map((column) => (
                                            <TableCell
                                                key={column.id}
                                                sx={{
                                                    padding: '4px 8px',
                                                    whiteSpace: 'nowrap',
                                                    fontSize: '0.8125rem'
                                                }}
                                            >
                                                {column.render ? column.render(department) : department[column.id]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <BusinessIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                            <Typography color="textSecondary" gutterBottom>
                                                No departments found
                                            </Typography>
                                            {hasActiveFilters() && (
                                                <Button 
                                                    variant="outlined" 
                                                    size="small" 
                                                    onClick={handleResetFilters}
                                                    sx={{ mt: 1 }}
                                                >
                                                    Clear filters
                                                </Button>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Scroll indicator */}
                {departments.length > 10 && !loading && (
                    <Box sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        display: 'flex',
                        gap: 0.5,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: 1,
                        p: 0.5,
                        border: '1px solid',
                        borderColor: 'divider'
                    }}>
                        <Typography variant="caption" color="textSecondary">
                            Scroll to see more departments
                        </Typography>
                        <KeyboardArrowDownIcon fontSize="small" color="action" />
                    </Box>
                )}
            </Box>

            {/* Department Count and Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                    Showing {departments.length} department{departments.length !== 1 ? 's' : ''}
                    {hasActiveFilters() && ' (filtered)'}
                    {pagination.total > 0 && ` of ${pagination.total}`}
                </Typography>

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={pagination.total}
                    rowsPerPage={pagination.pageSize}
                    page={pagination.page}
                    onPageChange={handleTableChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    sx={{
                        '& .MuiTablePagination-toolbar': {
                            minHeight: '40px',
                            padding: '0 8px'
                        },
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                            fontSize: '0.8rem',
                            marginBottom: 0
                        }
                    }}
                />
            </Box>

            {/* Create/Edit Department Dialog */}
            <Dialog
                open={modalVisible}
                onClose={handleCancel}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2
                    }
                }}
            >
                <DialogTitle>
                    {editingDepartment ? (viewMode ? 'View Department' : 'Edit Department') : 'Create New Department'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Department Name *"
                                value={formData.departmentName}
                                onChange={(e) => handleInputChange('departmentName', e.target.value)}
                                error={!!formErrors.departmentName && touchedFields.departmentName}
                                helperText={formErrors.departmentName && touchedFields.departmentName ? formErrors.departmentName : ''}
                                disabled={viewMode || submitting}
                                required
                                size="small"
                                onBlur={() => setTouchedFields(prev => ({ ...prev, departmentName: true }))}
                                InputProps={{
                                    readOnly: viewMode
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Department Code *"
                                value={formData.departmentCode}
                                onChange={(e) => handleInputChange('departmentCode', e.target.value)}
                                error={!!formErrors.departmentCode && touchedFields.departmentCode}
                                helperText={formErrors.departmentCode && touchedFields.departmentCode ? formErrors.departmentCode : ''}
                                disabled={viewMode || submitting || (editingDepartment && !viewMode)}
                                required
                                size="small"
                                onBlur={() => setTouchedFields(prev => ({ ...prev, departmentCode: true }))}
                                InputProps={{
                                    readOnly: viewMode || (editingDepartment && !viewMode)
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                disabled={viewMode || submitting}
                                multiline
                                rows={2}
                                size="small"
                                InputProps={{
                                    readOnly: viewMode
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth size="small" disabled={viewMode || submitting}>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={formData.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                    label="Status"
                                    readOnly={viewMode}
                                >
                                    <MenuItem value="Active">Active</MenuItem>
                                    <MenuItem value="Inactive">Inactive</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        {error && (
                            <Grid item xs={12}>
                                <Alert severity="error" sx={{ py: 1 }}>
                                    {error}
                                </Alert>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleCancel} size="small" disabled={submitting}>
                        {viewMode ? 'Close' : 'Cancel'}
                    </Button>
                    {!viewMode && (
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disabled={submitting}
                            size="small"
                            startIcon={submitting ? <CircularProgress size={16} /> : null}
                        >
                            {submitting ? 'Saving...' : (editingDepartment ? 'Update Department' : 'Create Department')}
                        </Button>
                    )}
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
                    sx={{ fontSize: '0.875rem', alignItems: 'center' }}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default DepartmentManagement;