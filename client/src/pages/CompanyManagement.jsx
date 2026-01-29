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
    Divider
} from '@mui/material';
import { 
    Add as AddIcon, 
    Print as PrintIcon, 
    Refresh as RefreshIcon,
    GetApp as ExportIcon,
    Business as BusinessIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    FilterList as FilterIcon,
    LocationOn as LocationIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Language as LanguageIcon,
    Clear as ClearIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';

const CompanyManagement = ({ onBack }) => {
    const [companies, setCompanies] = useState([]);
    const [filteredCompanies, setFilteredCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        city: '',
        country: ''
    });
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentCompanyId, setCurrentCompanyId] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [submitting, setSubmitting] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const tableRef = useRef();

    // Form state
    const [formData, setFormData] = useState({
        companyName: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'Ethiopia'
        },
        contact: {
            phone: '',
            email: '',
            website: ''
        },
        additionalInfo: {
            taxId: '',
            registrationNumber: '',
            establishedYear: ''
        },
        status: 'Active'
    });

    const [errors, setErrors] = useState({});

    const statusOptions = ['Active', 'Inactive'];
    const countries = ['Ethiopia', 'Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Other'];

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        // Apply filters to companies
        let filtered = [...companies];
        
        // Filter by search (case-insensitive)
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(company => 
                company.companyName?.toLowerCase().includes(searchTerm) ||
                company.contact?.email?.toLowerCase().includes(searchTerm) ||
                company.address?.city?.toLowerCase().includes(searchTerm) ||
                company.additionalInfo?.taxId?.toLowerCase().includes(searchTerm)
            );
        }
        
        // Filter by status
        if (filters.status) {
            filtered = filtered.filter(company => company.status === filters.status);
        }
        
        // Filter by city
        if (filters.city) {
            filtered = filtered.filter(company => 
                company.address?.city?.toLowerCase().includes(filters.city.toLowerCase())
            );
        }
        
        // Filter by country
        if (filters.country) {
            filtered = filtered.filter(company => 
                company.address?.country?.toLowerCase().includes(filters.country.toLowerCase())
            );
        }
        
        // Sort by company name ascending
        const sortedFiltered = filtered.sort((a, b) => 
            (a.companyName || '').localeCompare(b.companyName || '')
        );
        
        setFilteredCompanies(sortedFiltered);
        
    }, [companies, filters]);

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/companymanagements?limit=1000');
            const data = await response.json();
            
            // Sort companies by name ascending
            const sortedCompanies = (data.data || []).sort((a, b) => 
                (a.companyName || '').localeCompare(b.companyName || '')
            );
            
            setCompanies(sortedCompanies);
        } catch (error) {
            console.error('Error fetching companies:', error);
            showSnackbar('Error fetching companies', 'error');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
        if (!formData.address.street.trim()) newErrors.street = 'Street address is required';
        if (!formData.address.city.trim()) newErrors.city = 'City is required';
        if (!formData.address.state.trim()) newErrors.state = 'State/Region is required';
        if (!formData.address.zipCode.trim()) newErrors.zipCode = 'ZIP/Postal code is required';
        if (!formData.address.country.trim()) newErrors.country = 'Country is required';
        
        // Email validation
        if (formData.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact.email)) {
            newErrors.email = 'Invalid email format';
        }
        
        // Year validation
        if (formData.additionalInfo.establishedYear) {
            const year = parseInt(formData.additionalInfo.establishedYear);
            const currentYear = new Date().getFullYear();
            if (isNaN(year) || year < 1900 || year > currentYear) {
                newErrors.establishedYear = `Year must be between 1900 and ${currentYear}`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const url = editMode 
                ? `/api/companymanagements/${currentCompanyId}`
                : '/api/companymanagements';
            
            const method = editMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                showSnackbar(
                    editMode 
                        ? 'Company updated successfully!' 
                        : 'Company created successfully!', 
                    'success'
                );
                handleCloseDialog();
                fetchCompanies();
            } else {
                const errorData = await response.json();
                showSnackbar(errorData.message || 'Error saving company', 'error');
            }
        } catch (error) {
            console.error('Error saving company:', error);
            showSnackbar('Error saving company', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (company) => {
        setFormData({
            companyName: company.companyName || '',
            address: {
                street: company.address?.street || '',
                city: company.address?.city || '',
                state: company.address?.state || '',
                zipCode: company.address?.zipCode || '',
                country: company.address?.country || 'Ethiopia'
            },
            contact: {
                phone: company.contact?.phone || '',
                email: company.contact?.email || '',
                website: company.contact?.website || ''
            },
            additionalInfo: {
                taxId: company.additionalInfo?.taxId || '',
                registrationNumber: company.additionalInfo?.registrationNumber || '',
                establishedYear: company.additionalInfo?.establishedYear || ''
            },
            status: company.status || 'Active'
        });
        setEditMode(true);
        setCurrentCompanyId(company._id);
        setOpenDialog(true);
        setErrors({});
    };

    const handleDelete = (company) => {
        setCompanyToDelete(company);
        setDeleteDialog(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await fetch(`/api/companymanagements/${companyToDelete._id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                showSnackbar('Company deleted successfully!', 'success');
                fetchCompanies();
            } else {
                const errorData = await response.json();
                showSnackbar(errorData.message || 'Error deleting company', 'error');
            }
        } catch (error) {
            console.error('Error deleting company:', error);
            showSnackbar('Error deleting company', 'error');
        } finally {
            setDeleteDialog(false);
            setCompanyToDelete(null);
        }
    };

    const handleInputChange = (path, value) => {
        const paths = path.split('.');
        setFormData(prev => {
            const newData = { ...prev };
            let current = newData;
            
            for (let i = 0; i < paths.length - 1; i++) {
                if (!current[paths[i]]) {
                    current[paths[i]] = {};
                }
                current = current[paths[i]];
            }
            
            current[paths[paths.length - 1]] = value;
            return newData;
        });
        
        // Clear error for this field
        const fieldName = paths[paths.length - 1];
        if (errors[fieldName]) {
            setErrors(prev => ({
                ...prev,
                [fieldName]: ''
            }));
        }
    };

    const handleOpenDialog = () => {
        setOpenDialog(true);
        setEditMode(false);
        setCurrentCompanyId(null);
        setFormData({
            companyName: '',
            address: {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: 'Ethiopia'
            },
            contact: {
                phone: '',
                email: '',
                website: ''
            },
            additionalInfo: {
                taxId: '',
                registrationNumber: '',
                establishedYear: ''
            },
            status: 'Active'
        });
        setErrors({});
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditMode(false);
        setCurrentCompanyId(null);
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
        fetchCompanies();
        showSnackbar('Data refreshed successfully', 'success');
    };

    // Reset all filters
    const handleResetFilters = () => {
        setFilters({
            search: '',
            status: '',
            city: '',
            country: ''
        });
        showSnackbar('Filters reset successfully', 'info');
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams({
                ...(filters.search && { search: filters.search }),
                ...(filters.status && { status: filters.status }),
                ...(filters.city && { city: filters.city }),
                ...(filters.country && { country: filters.country })
            });

            const response = await fetch(`/api/companymanagements/export/data?${params}`);
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
            link.download = `companies-${new Date().toISOString().split('T')[0]}.csv`;
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
                <title>Company Directory</title>
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
                    .report-title { 
                        font-family: "Times New Roman", Times, serif;
                        font-size: 18px; 
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
                    <div class="report-title">Company Directory</div>
                    <div class="report-title">Total Companies: ${filteredCompanies.length}</div>
                </div>
                
                <div class="print-info">
                    <div><strong>Printed on:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
                </div>

                <div class="table-container">
                    ${tableHtml}
                </div>

                <div class="summary">
                    <strong>Summary:</strong><br/>
                    <strong>Total Companies:</strong> ${filteredCompanies.length}<br/>
                    <strong>Active Companies:</strong> ${filteredCompanies.filter(c => c.status === 'Active').length}<br/>
                    <strong>Inactive Companies:</strong> ${filteredCompanies.filter(c => c.status === 'Inactive').length}
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

    const getStatusColor = (status) => {
        return status === 'Active' ? 'success' : 'error';
    };

    const getStatusIcon = (status) => {
        return status === 'Active' ? 
            <CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} /> : 
            <CancelIcon fontSize="small" sx={{ mr: 0.5 }} />;
    };

    // Check if any filters are active
    const hasActiveFilters = () => {
        return (
            filters.search !== '' ||
            filters.status !== '' ||
            filters.city !== '' ||
            filters.country !== ''
        );
    };

    // Stats
    const stats = {
        total: filteredCompanies.length,
        active: filteredCompanies.filter(c => c.status === 'Active').length,
        inactive: filteredCompanies.filter(c => c.status === 'Inactive').length
    };

    return (
        <Box sx={{ p: 2 }}>
            {/* Header with Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        Company Management
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Manage company profiles and information
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
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenDialog}
                        size="small"
                        sx={{ ml: 1 }}
                    >
                        Add Company
                    </Button>
                </Box>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ minHeight: '80px' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <BusinessIcon color="primary" sx={{ mr: 1, fontSize: '1rem' }} />
                                <Typography variant="body2" color="textSecondary">
                                    Total Companies
                                </Typography>
                            </Box>
                            <Typography variant="h6" color="primary">
                                {stats.total}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ minHeight: '80px' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: '1rem' }} />
                                <Typography variant="body2" color="textSecondary">
                                    Active Companies
                                </Typography>
                            </Box>
                            <Typography variant="h6" color="success">
                                {stats.active}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ minHeight: '80px' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <CancelIcon color="error" sx={{ mr: 1, fontSize: '1rem' }} />
                                <Typography variant="body2" color="textSecondary">
                                    Inactive Companies
                                </Typography>
                            </Box>
                            <Typography variant="h6" color="error">
                                {stats.inactive}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filters - Collapsible */}
            {showFilters && (
                <Paper sx={{ p: 1.5, mb: 2 }}>
                    <Grid container spacing={1} alignItems="center">
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Search"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                placeholder="Search companies..."
                                size="small"
                                InputProps={{
                                    endAdornment: filters.search && (
                                        <IconButton
                                            size="small"
                                            onClick={() => handleFilterChange('search', '')}
                                            sx={{ mr: -1 }}
                                        >
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    )
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                select
                                fullWidth
                                label="Status"
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                size="small"
                                InputProps={{
                                    endAdornment: filters.status && (
                                        <IconButton
                                            size="small"
                                            onClick={() => handleFilterChange('status', '')}
                                            sx={{ mr: -1 }}
                                        >
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    )
                                }}
                            >
                                <MenuItem value="">All Status</MenuItem>
                                {statusOptions.map(status => (
                                    <MenuItem key={status} value={status}>
                                        {status}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="City"
                                value={filters.city}
                                onChange={(e) => handleFilterChange('city', e.target.value)}
                                placeholder="Filter by city..."
                                size="small"
                                InputProps={{
                                    endAdornment: filters.city && (
                                        <IconButton
                                            size="small"
                                            onClick={() => handleFilterChange('city', '')}
                                            sx={{ mr: -1 }}
                                        >
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    )
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                select
                                fullWidth
                                label="Country"
                                value={filters.country}
                                onChange={(e) => handleFilterChange('country', e.target.value)}
                                size="small"
                                InputProps={{
                                    endAdornment: filters.country && (
                                        <IconButton
                                            size="small"
                                            onClick={() => handleFilterChange('country', '')}
                                            sx={{ mr: -1 }}
                                        >
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    )
                                }}
                            >
                                <MenuItem value="">All Countries</MenuItem>
                                {countries.map(country => (
                                    <MenuItem key={country} value={country}>
                                        {country}
                                    </MenuItem>
                                ))}
                            </TextField>
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
                        {filters.search && (
                            <Chip
                                label={`Search: ${filters.search}`}
                                size="small"
                                onDelete={() => handleFilterChange('search', '')}
                            />
                        )}
                        {filters.status && (
                            <Chip
                                label={`Status: ${filters.status}`}
                                size="small"
                                onDelete={() => handleFilterChange('status', '')}
                            />
                        )}
                        {filters.city && (
                            <Chip
                                label={`City: ${filters.city}`}
                                size="small"
                                onDelete={() => handleFilterChange('city', '')}
                            />
                        )}
                        {filters.country && (
                            <Chip
                                label={`Country: ${filters.country}`}
                                size="small"
                                onDelete={() => handleFilterChange('country', '')}
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

            {/* Companies Table */}
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
                                    backgroundColor: '#f5f5f5',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 1
                                }}>Company Name</TableCell>
                                <TableCell sx={{ 
                                    padding: '6px 8px', 
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap',
                                    fontSize: '0.8125rem',
                                    backgroundColor: '#f5f5f5',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 1
                                }}>Address</TableCell>
                                <TableCell sx={{ 
                                    padding: '6px 8px', 
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap',
                                    fontSize: '0.8125rem',
                                    backgroundColor: '#f5f5f5',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 1
                                }}>Contact</TableCell>
                                <TableCell sx={{ 
                                    padding: '6px 8px', 
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap',
                                    fontSize: '0.8125rem',
                                    backgroundColor: '#f5f5f5',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 1
                                }}>Additional Info</TableCell>
                                <TableCell sx={{ 
                                    padding: '6px 8px', 
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap',
                                    fontSize: '0.8125rem',
                                    backgroundColor: '#f5f5f5',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 1
                                }}>Status</TableCell>
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
                            {filteredCompanies.length > 0 ? (
                                filteredCompanies.map((company) => (
                                    <TableRow 
                                        key={company._id} 
                                        hover
                                        sx={{ height: '36px' }}
                                    >
                                        <TableCell sx={{ 
                                            padding: '4px 8px',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <BusinessIcon sx={{ mr: 1, color: 'primary.main', fontSize: '1rem' }} />
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 'bold' }}>
                                                        {company.companyName}
                                                    </Typography>
                                                    {company.additionalInfo?.taxId && (
                                                        <Typography variant="caption" color="textSecondary">
                                                            Tax ID: {company.additionalInfo.taxId}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ 
                                            padding: '4px 8px',
                                            whiteSpace: 'nowrap',
                                            maxWidth: '200px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            fontSize: '0.8125rem'
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <LocationIcon sx={{ mr: 0.5, color: 'secondary.main', fontSize: '0.875rem' }} />
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                                                        {company.address?.street}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                                                        {company.address?.city}, {company.address?.state}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                                                        {company.address?.country}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ 
                                            padding: '4px 8px',
                                            whiteSpace: 'nowrap',
                                            maxWidth: '150px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            fontSize: '0.8125rem'
                                        }}>
                                            {company.contact?.phone && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                    <PhoneIcon sx={{ mr: 0.5, fontSize: '0.75rem' }} />
                                                    <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                                                        {company.contact.phone}
                                                    </Typography>
                                                </Box>
                                            )}
                                            {company.contact?.email && (
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <EmailIcon sx={{ mr: 0.5, fontSize: '0.75rem' }} />
                                                    <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                                                        {company.contact.email}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ 
                                            padding: '4px 8px',
                                            whiteSpace: 'nowrap',
                                            fontSize: '0.8125rem'
                                        }}>
                                            {company.additionalInfo?.registrationNumber && (
                                                <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                                                    Reg: {company.additionalInfo.registrationNumber}
                                                </Typography>
                                            )}
                                            {company.additionalInfo?.establishedYear && (
                                                <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                                                    Est: {company.additionalInfo.establishedYear}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ 
                                            padding: '4px 8px',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            <Chip 
                                                label={company.status} 
                                                color={getStatusColor(company.status)}
                                                size="small" 
                                                icon={getStatusIcon(company.status)}
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
                                            whiteSpace: 'nowrap'
                                        }}>
                                            <Box sx={{ display: 'flex', gap: 0.25 }}>
                                                <Tooltip title="Edit">
                                                    <IconButton 
                                                        size="small" 
                                                        color="primary"
                                                        onClick={() => handleEdit(company)}
                                                        sx={{ padding: '4px' }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton 
                                                        size="small" 
                                                        color="error"
                                                        onClick={() => handleDelete(company)}
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
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        <Typography color="textSecondary">
                                            No companies found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Scroll indicator - shows when there are many companies */}
                {filteredCompanies.length > 10 && (
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
                            Scroll to see more companies
                        </Typography>
                        <KeyboardArrowDownIcon fontSize="small" color="action" />
                    </Box>
                )}
            </Box>

            {/* Company Count and Status */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                    Showing {filteredCompanies.length} company{filteredCompanies.length !== 1 ? 'ies' : ''}
                    {hasActiveFilters() && ' (filtered)'}
                </Typography>
                
                {/* Total company count */}
                <Typography variant="body2" color="textSecondary">
                    Total: {companies.length} companies
                </Typography>
            </Box>

            {/* Add/Edit Company Dialog */}
            <Dialog 
                open={openDialog} 
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {editMode ? 'Edit Company' : 'Add New Company'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        {/* Company Name */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                                Basic Information
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <TextField
                                fullWidth
                                label="Company Name *"
                                value={formData.companyName}
                                onChange={(e) => handleInputChange('companyName', e.target.value)}
                                error={!!errors.companyName}
                                helperText={errors.companyName}
                                required
                                size="small"
                            />
                        </Grid>

                        {/* Address Section */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="primary" sx={{ mb: 1, mt: 2 }}>
                                Address Information
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Street Address *"
                                value={formData.address.street}
                                onChange={(e) => handleInputChange('address.street', e.target.value)}
                                error={!!errors.street}
                                helperText={errors.street}
                                required
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="City *"
                                value={formData.address.city}
                                onChange={(e) => handleInputChange('address.city', e.target.value)}
                                error={!!errors.city}
                                helperText={errors.city}
                                required
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="State/Region *"
                                value={formData.address.state}
                                onChange={(e) => handleInputChange('address.state', e.target.value)}
                                error={!!errors.state}
                                helperText={errors.state}
                                required
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="ZIP/Postal Code *"
                                value={formData.address.zipCode}
                                onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                                error={!!errors.zipCode}
                                helperText={errors.zipCode}
                                required
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                select
                                fullWidth
                                label="Country *"
                                value={formData.address.country}
                                onChange={(e) => handleInputChange('address.country', e.target.value)}
                                error={!!errors.country}
                                helperText={errors.country}
                                required
                                size="small"
                            >
                                {countries.map(country => (
                                    <MenuItem key={country} value={country}>
                                        {country}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        {/* Contact Section */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="primary" sx={{ mb: 1, mt: 2 }}>
                                Contact Information
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Phone Number"
                                value={formData.contact.phone}
                                onChange={(e) => handleInputChange('contact.phone', e.target.value)}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={formData.contact.email}
                                onChange={(e) => handleInputChange('contact.email', e.target.value)}
                                error={!!errors.email}
                                helperText={errors.email}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Website"
                                value={formData.contact.website}
                                onChange={(e) => handleInputChange('contact.website', e.target.value)}
                                size="small"
                            />
                        </Grid>

                        {/* Additional Information */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="primary" sx={{ mb: 1, mt: 2 }}>
                                Additional Information
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Tax ID"
                                value={formData.additionalInfo.taxId}
                                onChange={(e) => handleInputChange('additionalInfo.taxId', e.target.value)}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Registration Number"
                                value={formData.additionalInfo.registrationNumber}
                                onChange={(e) => handleInputChange('additionalInfo.registrationNumber', e.target.value)}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Established Year"
                                type="number"
                                value={formData.additionalInfo.establishedYear}
                                onChange={(e) => handleInputChange('additionalInfo.establishedYear', e.target.value)}
                                error={!!errors.establishedYear}
                                helperText={errors.establishedYear}
                                inputProps={{ min: 1900, max: new Date().getFullYear() }}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={formData.status}
                                    label="Status"
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                >
                                    {statusOptions.map(status => (
                                        <MenuItem key={status} value={status}>
                                            {status}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
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
                        {submitting ? 'Saving...' : (editMode ? 'Update Company' : 'Add Company')}
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
                        Are you sure you want to delete this company?
                    </Typography>
                    {companyToDelete && (
                        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="body2">
                                <strong>Company Name:</strong> {companyToDelete.companyName}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Address:</strong> {companyToDelete.address?.city}, {companyToDelete.address?.country}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Status:</strong> {companyToDelete.status}
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
    );
};

export default CompanyManagement;