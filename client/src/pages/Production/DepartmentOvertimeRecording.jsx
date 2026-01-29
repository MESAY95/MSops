import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, TextField, MenuItem, Grid, Card, CardContent,
    Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert,
    Snackbar, IconButton, Tooltip, FormControl, InputLabel, Select,
    Avatar, CircularProgress, Checkbox, FormControlLabel,
    TablePagination
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isValid, parseISO } from 'date-fns';
import { 
    Add as AddIcon, Print as PrintIcon, Refresh as RefreshIcon,
    AccessTime as TimeIcon, Edit as EditIcon, Delete as DeleteIcon,
    FilterList as FilterIcon, CalendarToday as CalendarIcon,
    Clear as ClearIcon, People as PeopleIcon, Business as BusinessIcon,
    AttachMoney as MoneyIcon, PendingActions, ArrowBack, Visibility,
    AttachFile, Description, Download, Search, FileCopy,
    CheckCircle, Cancel, Save, Upload, CloudDownload, PictureAsPdf
} from '@mui/icons-material';

// Employee service hook
const useEmployeeService = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Global cache
    const employeeCache = useMemo(() => new Map(), []);
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

            // Process and ensure required fields
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

            // Cache the results
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

    const clearAllCache = useCallback(() => {
        employeeCache.clear();
    }, [employeeCache]);

    return {
        fetchEmployeesByDepartment,
        clearDepartmentCache,
        clearAllCache,
        loading,
        error
    };
};

// Helper functions
const getStatusColor = (status) => {
    switch(status) {
        case 'Pending': return 'warning';
        case 'Checked': return 'info';
        case 'Approved': return 'success';
        case 'Paid': return 'primary';
        case 'Rejected': return 'error';
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

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 2
    }).format(amount || 0);
};

const calculateOvertimeAmount = (hours, basicSalary, overtimeType) => {
    const hourlyRate = basicSalary / 160; // 160 working hours per month
    const rateMultipliers = {
        'Regular': 1.5,
        'Weekend': 2.0,
        'Holiday': 2.5,
        'Emergency': 1.75,
        'Night': 1.75
    };
    const multiplier = rateMultipliers[overtimeType] || 1.5;
    return Math.round((hours * hourlyRate * multiplier) * 100) / 100;
};

// Enhanced Table Toolbar Component
const EnhancedTableToolbar = ({ 
    filters, 
    updateFilter, 
    resetFilters, 
    hasActiveFilters, 
    onRefresh,
    onExport,
    onPrint,
    searchTerm,
    onSearchChange 
}) => (
    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Overtime Records
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Export CSV">
                    <IconButton onClick={onExport} size="small">
                        <CloudDownload />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Print">
                    <IconButton onClick={onPrint} size="small">
                        <PrintIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Refresh">
                    <IconButton onClick={onRefresh} size="small">
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <TextField
                fullWidth
                size="small"
                placeholder="Search by employee name or ID..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
                    endAdornment: searchTerm && (
                        <IconButton size="small" onClick={() => onSearchChange('')}>
                            <ClearIcon />
                        </IconButton>
                    )
                }}
            />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
                select
                size="small"
                label="Status"
                value={filters.status || ''}
                onChange={(e) => updateFilter('status', e.target.value)}
                sx={{ minWidth: 150 }}
            >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Checked">Checked</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Paid">Paid</MenuItem>
                <MenuItem value="Rejected">Rejected</MenuItem>
            </TextField>
            
            <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => updateFilter('startDate', date)}
                renderInput={(params) => (
                    <TextField {...params} size="small" sx={{ width: 160 }} />
                )}
            />
            
            <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => updateFilter('endDate', date)}
                renderInput={(params) => (
                    <TextField {...params} size="small" sx={{ width: 160 }} />
                )}
            />
            
            {hasActiveFilters && (
                <Tooltip title="Clear Filters">
                    <IconButton onClick={resetFilters} size="small">
                        <ClearIcon />
                    </IconButton>
                </Tooltip>
            )}
        </Box>
    </Box>
);

// Enhanced Table Head Component
const EnhancedTableHead = ({ selectedCount, rowCount, onSelectAll }) => (
    <TableHead>
        <TableRow>
            <TableCell padding="checkbox">
                <Checkbox
                    indeterminate={selectedCount > 0 && selectedCount < rowCount}
                    checked={rowCount > 0 && selectedCount === rowCount}
                    onChange={(e) => onSelectAll(e.target.checked)}
                />
            </TableCell>
            <TableCell><strong>Date</strong></TableCell>
            <TableCell><strong>Employee</strong></TableCell>
            <TableCell><strong>Time Range</strong></TableCell>
            <TableCell><strong>Hours</strong></TableCell>
            <TableCell><strong>Type</strong></TableCell>
            <TableCell><strong>Amount</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Actions</strong></TableCell>
        </TableRow>
    </TableHead>
);

// Overtime Form Dialog Component
const OvertimeFormDialog = ({ 
    open, 
    onClose, 
    formData, 
    errors, 
    employees, 
    editMode, 
    onSubmit,
    onFormChange,
    isSubmitting 
}) => {
    const [attachment, setAttachment] = useState(null);
    const [previewHours, setPreviewHours] = useState(0);
    const [previewAmount, setPreviewAmount] = useState(0);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setAttachment(file);
            onFormChange('attachment', file);
        }
    };

    const calculatePreview = useCallback(() => {
        if (formData.startTime && formData.endTime && selectedEmployee) {
            const start = new Date(formData.startTime);
            const end = new Date(formData.endTime);
            const hours = Math.max(0, (end - start) / (1000 * 60 * 60));
            setPreviewHours(hours);
            
            if (hours > 0) {
                const amount = calculateOvertimeAmount(
                    hours, 
                    selectedEmployee.basicSalary || 0,
                    formData.overtimeType
                );
                setPreviewAmount(amount);
            }
        }
    }, [formData, selectedEmployee]);

    useEffect(() => {
        if (formData.employeeId) {
            const emp = employees.find(e => e.employeeId === formData.employeeId);
            setSelectedEmployee(emp || null);
        } else {
            setSelectedEmployee(null);
        }
    }, [formData.employeeId, employees]);

    useEffect(() => {
        calculatePreview();
    }, [calculatePreview]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {editMode ? 'Edit Overtime Record' : 'Add New Overtime Record'}
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <FormControl fullWidth size="small" error={!!errors.employeeId}>
                            <InputLabel>Employee *</InputLabel>
                            <Select
                                value={formData.employeeId}
                                label="Employee *"
                                onChange={(e) => {
                                    onFormChange('employeeId', e.target.value);
                                }}
                                disabled={editMode}
                            >
                                <MenuItem value="">Select Employee</MenuItem>
                                {employees.map((emp) => (
                                    <MenuItem key={emp._id || emp.employeeId} value={emp.employeeId}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                            <Typography variant="body2">
                                                {emp.fullName} ({emp.employeeId})
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {emp.position} • {formatCurrency(emp.basicSalary || 0)}/month
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                            {selectedEmployee && (
                                <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">
                                                Department:
                                            </Typography>
                                            <Typography variant="body2">
                                                {selectedEmployee.department}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">
                                                Status:
                                            </Typography>
                                            <Typography variant="body2">
                                                {selectedEmployee.employmentStatus}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">
                                                Email:
                                            </Typography>
                                            <Typography variant="body2">
                                                {selectedEmployee.email}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">
                                                Phone:
                                            </Typography>
                                            <Typography variant="body2">
                                                {selectedEmployee.phone}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}
                            {errors.employeeId && (
                                <Typography variant="caption" color="error">
                                    {errors.employeeId}
                                </Typography>
                            )}
                        </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <DatePicker
                            label="Overtime Date *"
                            value={formData.overtimeDate}
                            onChange={(date) => onFormChange('overtimeDate', date)}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    fullWidth 
                                    size="small"
                                    error={!!errors.overtimeDate}
                                    helperText={errors.overtimeDate}
                                />
                            )}
                        />
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                        <TimePicker
                            label="Start Time *"
                            value={formData.startTime}
                            onChange={(time) => {
                                onFormChange('startTime', time);
                                setTimeout(calculatePreview, 100);
                            }}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    fullWidth 
                                    size="small"
                                    error={!!errors.startTime}
                                    helperText={errors.startTime}
                                />
                            )}
                        />
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                        <TimePicker
                            label="End Time *"
                            value={formData.endTime}
                            onChange={(time) => {
                                onFormChange('endTime', time);
                                setTimeout(calculatePreview, 100);
                            }}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    fullWidth 
                                    size="small"
                                    error={!!errors.endTime}
                                    helperText={errors.endTime}
                                />
                            )}
                        />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Overtime Type</InputLabel>
                            <Select
                                value={formData.overtimeType}
                                label="Overtime Type"
                                onChange={(e) => {
                                    onFormChange('overtimeType', e.target.value);
                                    calculatePreview();
                                }}
                            >
                                <MenuItem value="Regular">Regular (1.5x)</MenuItem>
                                <MenuItem value="Weekend">Weekend (2.0x)</MenuItem>
                                <MenuItem value="Holiday">Holiday (2.5x)</MenuItem>
                                <MenuItem value="Emergency">Emergency (1.75x)</MenuItem>
                                <MenuItem value="Night">Night (1.75x)</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Preview Calculation:
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Hours:</Typography>
                                <Typography variant="body2" fontWeight="bold">
                                    {previewHours.toFixed(2)}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Estimated Amount:</Typography>
                                <Typography variant="body2" fontWeight="bold" color="success.main">
                                    {formatCurrency(previewAmount)}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Reason (Optional)"
                            value={formData.reason}
                            onChange={(e) => onFormChange('reason', e.target.value)}
                            multiline
                            rows={2}
                            size="small"
                            placeholder="Enter reason for overtime (optional)"
                        />
                    </Grid>
                    
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Remarks (Optional)"
                            value={formData.remarks}
                            onChange={(e) => onFormChange('remarks', e.target.value)}
                            multiline
                            rows={2}
                            size="small"
                            placeholder="Additional notes or comments (optional)"
                        />
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<AttachFile />}
                            size="small"
                            fullWidth
                        >
                            {attachment ? attachment.name : 'Attach Supporting Document (Optional)'}
                            <input
                                type="file"
                                hidden
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                            />
                        </Button>
                        {attachment && (
                            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                Selected: {attachment.name} ({Math.round(attachment.size / 1024)} KB)
                            </Typography>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} size="small" disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button 
                    onClick={onSubmit} 
                    variant="contained" 
                    size="small"
                    startIcon={editMode ? <Save /> : <AddIcon />}
                    disabled={isSubmitting || !selectedEmployee}
                >
                    {isSubmitting ? (
                        <>
                            <CircularProgress size={16} sx={{ mr: 1 }} />
                            {editMode ? 'Updating...' : 'Submitting...'}
                        </>
                    ) : (
                        editMode ? 'Update Record' : 'Submit for Review'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Main Component
const DepartmentOvertimeRecording = ({ onBack, department: propDepartment }) => {
    const [overtimeRecords, setOvertimeRecords] = useState([]);
    const [departmentEmployees, setDepartmentEmployees] = useState([]);
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [userDepartment, setUserDepartment] = useState('');
    const [userRole, setUserRole] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [filters, setFilters] = useState({
        status: '',
        startDate: null,
        endDate: null
    });

    // Form state with validation
    const [formData, setFormData] = useState({
        employeeId: '',
        overtimeDate: new Date(),
        startTime: new Date(new Date().setHours(17, 0, 0, 0)),
        endTime: new Date(new Date().setHours(20, 0, 0, 0)),
        overtimeType: 'Regular',
        reason: '',
        remarks: '',
        attachment: null
    });

    const [errors, setErrors] = useState({});

    // Employee service
    const employeeService = useEmployeeService();

    useEffect(() => {
        checkUserPermissions();
    }, []);

    useEffect(() => {
        if (userDepartment) {
            loadData();
            loadDepartmentEmployees();
        }
    }, [userDepartment]);

    const checkUserPermissions = () => {
        const storedDept = propDepartment || localStorage.getItem('userDepartment') || 'Production';
        const storedRole = localStorage.getItem('userRole') || 'Department Manager';
        
        setUserDepartment(storedDept);
        setUserRole(storedRole);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                department: userDepartment,
                limit: 1000,
                _: new Date().getTime()
            });

            const response = await fetch(`/api/overtimemanagements?${queryParams}`);
            if (!response.ok) throw new Error('Failed to fetch records');
            
            const data = await response.json();
            
            if (data.success && data.overtimeRecords) {
                setOvertimeRecords(data.overtimeRecords || []);
            } else if (Array.isArray(data)) {
                setOvertimeRecords(data);
            } else {
                setOvertimeRecords([]);
            }
        } catch (err) {
            console.error('Error loading overtime records:', err);
            showSnackbar('Error loading overtime records', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadDepartmentEmployees = async () => {
        setLoadingEmployees(true);
        try {
            const employees = await employeeService.fetchEmployeesByDepartment(userDepartment);
            setDepartmentEmployees(employees);
        } catch (err) {
            console.error('Error loading employees:', err);
            showSnackbar('Error loading employees', 'error');
            setDepartmentEmployees([]);
        } finally {
            setLoadingEmployees(false);
        }
    };

    const updateFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(0);
    };

    const resetFilters = () => {
        setFilters({
            status: '',
            startDate: null,
            endDate: null
        });
        setSearchTerm('');
        setPage(0);
    };

    const hasActiveFilters = filters.status || filters.startDate || filters.endDate || searchTerm;

    // Memoized filtered records with search
    const filteredRecords = useMemo(() => {
        let result = [...overtimeRecords];
        
        // Apply status filter
        if (filters.status) {
            result = result.filter(record => record.status === filters.status);
        }
        
        // Apply date range filter
        if (filters.startDate) {
            const start = new Date(filters.startDate);
            start.setHours(0, 0, 0, 0);
            result = result.filter(record => new Date(record.overtimeDate) >= start);
        }
        
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            result = result.filter(record => new Date(record.overtimeDate) <= end);
        }

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(record => 
                (record.employeeInfo?.fullName || '').toLowerCase().includes(term) ||
                (record.employeeInfo?.employeeId || '').toLowerCase().includes(term) ||
                (record.reason || '').toLowerCase().includes(term)
            );
        }

        // Sort by date (newest first)
        return result.sort((a, b) => new Date(b.overtimeDate) - new Date(a.overtimeDate));
    }, [overtimeRecords, filters, searchTerm]);

    // Paginated records
    const paginatedRecords = useMemo(() => {
        const startIndex = page * rowsPerPage;
        return filteredRecords.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredRecords, page, rowsPerPage]);

    const totals = useMemo(() => {
        const pendingRecords = filteredRecords.filter(r => r.status === 'Pending');
        const checkedRecords = filteredRecords.filter(r => r.status === 'Checked');
        const approvedRecords = filteredRecords.filter(r => r.status === 'Approved');
        const paidRecords = filteredRecords.filter(r => r.status === 'Paid');
        const rejectedRecords = filteredRecords.filter(r => r.status === 'Rejected');

        return {
            totalHours: filteredRecords.reduce((sum, record) => sum + (record.timeDetails?.hoursWorked || 0), 0),
            totalAmount: filteredRecords.reduce((sum, record) => sum + (record.financials?.calculatedAmount || 0), 0),
            pendingCount: pendingRecords.length,
            checkedCount: checkedRecords.length,
            approvedCount: approvedRecords.length,
            paidCount: paidRecords.length,
            rejectedCount: rejectedRecords.length,
            pendingHours: pendingRecords.reduce((sum, record) => sum + (record.timeDetails?.hoursWorked || 0), 0),
            pendingAmount: pendingRecords.reduce((sum, record) => sum + (record.financials?.calculatedAmount || 0), 0)
        };
    }, [filteredRecords]);

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.employeeId) newErrors.employeeId = 'Employee is required';
        if (!formData.overtimeDate) newErrors.overtimeDate = 'Date is required';
        if (!formData.startTime) newErrors.startTime = 'Start time is required';
        if (!formData.endTime) newErrors.endTime = 'End time is required';
        
        // Validate time range
        if (formData.startTime && formData.endTime) {
            const start = new Date(formData.startTime);
            const end = new Date(formData.endTime);
            
            if (end <= start) {
                newErrors.endTime = 'End time must be after start time';
            }
            
            // Validate maximum overtime hours (12 hours)
            const hours = (end - start) / (1000 * 60 * 60);
            if (hours > 12) {
                newErrors.endTime = 'Overtime cannot exceed 12 hours';
            }
            
            if (hours <= 0) {
                newErrors.endTime = 'Invalid time range';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const formDataToSend = new FormData();
            
            // Get complete employee data
            const employee = departmentEmployees.find(emp => emp.employeeId === formData.employeeId);
            if (!employee) {
                showSnackbar('Employee not found in department', 'error');
                setIsSubmitting(false);
                return;
            }
            
            // Calculate hours
            const start = new Date(formData.startTime);
            const end = new Date(formData.endTime);
            const hours = Math.max(0, (end - start) / (1000 * 60 * 60));
            
            // Add individual employee fields (BACKEND EXPECTS THESE)
            formDataToSend.append('employeeId', employee.employeeId);
            formDataToSend.append('employeeName', employee.fullName);
            formDataToSend.append('employeePosition', employee.position || '');
            formDataToSend.append('employeeBasicSalary', employee.basicSalary || 0);
            formDataToSend.append('employeeDepartment', employee.department);
            
            // Add department (using employee's department as source of truth)
            formDataToSend.append('department', employee.department);
            
            // Add other form data
            formDataToSend.append('overtimeDate', formData.overtimeDate.toISOString());
            formDataToSend.append('startTime', formData.startTime.toISOString());
            formDataToSend.append('endTime', formData.endTime.toISOString());
            formDataToSend.append('hoursWorked', hours.toFixed(2));
            formDataToSend.append('overtimeType', formData.overtimeType);
            formDataToSend.append('baseSalary', employee.basicSalary || 0);
            
            // Add reason and remarks
            if (formData.reason && formData.reason.trim()) {
                formDataToSend.append('reason', formData.reason);
            }
            
            if (formData.remarks && formData.remarks.trim()) {
                formDataToSend.append('remarks', formData.remarks);
            }
            
            // Add attachment
            if (formData.attachment) {
                formDataToSend.append('attachment', formData.attachment);
            }

            const endpoint = editMode && currentRecord 
                ? `/api/overtimemanagements/${currentRecord._id}`
                : '/api/overtimemanagements';

            const method = editMode ? 'PUT' : 'POST';

            console.log('Submitting overtime data:', {
                employeeId: employee.employeeId,
                employeeName: employee.fullName,
                department: employee.department,
                hours: hours.toFixed(2)
            });

            const response = await fetch(endpoint, {
                method,
                body: formDataToSend
            });

            if (response.ok) {
                const result = await response.json();
                showSnackbar(
                    editMode ? 'Record updated successfully' : 'Record submitted for review',
                    'success'
                );
                handleCloseDialog();
                loadData();
                // Clear employee cache after new record
                employeeService.clearDepartmentCache(userDepartment);
            } else {
                const errorData = await response.json();
                showSnackbar(errorData.message || 'Error saving record', 'error');
            }
        } catch (error) {
            console.error('Error saving record:', error);
            showSnackbar('Error saving record', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBatchDelete = async () => {
        if (selectedRecords.length === 0) return;

        const confirmed = window.confirm(`Delete ${selectedRecords.length} selected record(s)?`);
        if (!confirmed) return;

        try {
            const deletePromises = selectedRecords.map(recordId =>
                fetch(`/api/overtimemanagements/${recordId}`, {
                    method: 'DELETE'
                })
            );

            await Promise.all(deletePromises);
            showSnackbar('Selected records deleted successfully', 'success');
            setSelectedRecords([]);
            loadData();
        } catch (error) {
            showSnackbar('Error deleting records', 'error');
        }
    };

    const handleDuplicateRecord = (record) => {
        setFormData({
            employeeId: record.employeeInfo?.employeeId || record.employeeId,
            overtimeDate: new Date(),
            startTime: new Date(record.timeDetails?.startTime || record.startTime),
            endTime: new Date(record.timeDetails?.endTime || record.endTime),
            overtimeType: record.overtimeType,
            reason: record.reason || '',
            remarks: `Duplicated from record dated ${format(new Date(record.overtimeDate), 'MMM dd, yyyy')}`,
            attachment: null
        });
        setEditMode(false);
        setCurrentRecord(null);
        setOpenDialog(true);
    };

    const handleViewRecord = (record) => {
        setCurrentRecord(record);
        setFormData({
            employeeId: record.employeeInfo?.employeeId || record.employeeId,
            overtimeDate: new Date(record.overtimeDate),
            startTime: new Date(record.timeDetails?.startTime || record.startTime),
            endTime: new Date(record.timeDetails?.endTime || record.endTime),
            overtimeType: record.overtimeType,
            reason: record.reason || '',
            remarks: record.remarks?.departmentRemarks || record.remarks || '',
            attachment: null
        });
        setEditMode(false);
        setOpenDialog(true);
    };

    const handleEditRecord = (record) => {
        if (record.status !== 'Pending') {
            showSnackbar('Only pending records can be edited', 'warning');
            return;
        }
        
        setCurrentRecord(record);
        setFormData({
            employeeId: record.employeeInfo?.employeeId || record.employeeId,
            overtimeDate: new Date(record.overtimeDate),
            startTime: new Date(record.timeDetails?.startTime || record.startTime),
            endTime: new Date(record.timeDetails?.endTime || record.endTime),
            overtimeType: record.overtimeType,
            reason: record.reason || '',
            remarks: record.remarks?.departmentRemarks || record.remarks || '',
            attachment: null
        });
        setEditMode(true);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditMode(false);
        setCurrentRecord(null);
        setFormData({
            employeeId: '',
            overtimeDate: new Date(),
            startTime: new Date(new Date().setHours(17, 0, 0, 0)),
            endTime: new Date(new Date().setHours(20, 0, 0, 0)),
            overtimeType: 'Regular',
            reason: '',
            remarks: '',
            attachment: null
        });
        setErrors({});
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams({
                department: userDepartment,
                status: filters.status || '',
                ...(filters.startDate && { startDate: format(filters.startDate, 'yyyy-MM-dd') }),
                ...(filters.endDate && { endDate: format(filters.endDate, 'yyyy-MM-dd') })
            });

            const response = await fetch(`/api/overtimemanagements/export/csv?${params}`);
            
            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${userDepartment}-overtime-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${userDepartment} Overtime Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .department-name { font-size: 24px; font-weight: bold; color: #1976d2; }
                    .report-title { font-size: 18px; margin: 10px 0; }
                    .summary { display: flex; justify-content: space-between; margin-bottom: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 4px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; font-weight: bold; }
                    .status-pending { color: #ed6c02; }
                    .status-checked { color: #0288d1; }
                    .status-approved { color: #2e7d32; }
                    .status-paid { color: #9c27b0; }
                    .status-rejected { color: #d32f2f; }
                    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="department-name">${userDepartment} Department</div>
                    <div class="report-title">Overtime Records Report</div>
                    <div>Generated on: ${format(new Date(), 'MMM dd, yyyy HH:mm')}</div>
                    <div>Total Records: ${filteredRecords.length}</div>
                </div>
                
                <div class="summary">
                    <div>
                        <strong>Pending:</strong> ${totals.pendingCount} records<br>
                        <strong>Checked:</strong> ${totals.checkedCount} records<br>
                        <strong>Approved:</strong> ${totals.approvedCount} records
                    </div>
                    <div>
                        <strong>Paid:</strong> ${totals.paidCount} records<br>
                        <strong>Rejected:</strong> ${totals.rejectedCount} records<br>
                        <strong>Total Amount:</strong> ${formatCurrency(totals.totalAmount)}
                    </div>
                    <div>
                        <strong>Total Hours:</strong> ${totals.totalHours.toFixed(2)}<br>
                        <strong>Pending Amount:</strong> ${formatCurrency(totals.pendingAmount)}<br>
                        <strong>Pending Hours:</strong> ${totals.pendingHours.toFixed(2)}
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Employee</th>
                            <th>ID</th>
                            <th>Hours</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredRecords.map(record => `
                            <tr>
                                <td>${format(new Date(record.overtimeDate), 'MMM dd, yyyy')}</td>
                                <td>${record.employeeInfo?.fullName || 'N/A'}</td>
                                <td>${record.employeeInfo?.employeeId || 'N/A'}</td>
                                <td>${(record.timeDetails?.hoursWorked || 0).toFixed(2)}</td>
                                <td>${record.overtimeType}</td>
                                <td>${formatCurrency(record.financials?.calculatedAmount || 0)}</td>
                                <td class="status-${record.status.toLowerCase()}">${record.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="footer">
                    <div>Generated by: ${userRole}</div>
                    <div>Department: ${userDepartment}</div>
                    <div>Page 1 of 1</div>
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

    const handleSelectAll = (checked) => {
        if (checked) {
            const pendingIds = filteredRecords
                .filter(r => r.status === 'Pending')
                .map(r => r._id);
            setSelectedRecords(pendingIds);
        } else {
            setSelectedRecords([]);
        }
    };

    const formatOvertimeData = (record) => {
        const date = new Date(record.overtimeDate);
        const start = new Date(record.timeDetails?.startTime || record.startTime);
        const end = new Date(record.timeDetails?.endTime || record.endTime);
        
        return {
            date: format(date, 'MMM dd, yyyy'),
            employee: {
                name: record.employeeInfo?.fullName || 'N/A',
                id: record.employeeInfo?.employeeId || 'N/A',
                position: record.employeeInfo?.position || ''
            },
            timeRange: `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`,
            hours: (record.timeDetails?.hoursWorked || record.hoursWorked || 0).toFixed(2),
            amount: formatCurrency(record.financials?.calculatedAmount || record.calculatedAmount || 0),
            status: record.status,
            type: record.overtimeType,
            reason: record.reason || 'No reason provided'
        };
    };

    const renderTableRow = (record) => {
        const formatted = formatOvertimeData(record);
        const isSelected = selectedRecords.includes(record._id);

        return (
            <TableRow key={record._id} hover selected={isSelected}>
                <TableCell padding="checkbox">
                    {record.status === 'Pending' && (
                        <Checkbox
                            checked={isSelected}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedRecords([...selectedRecords, record._id]);
                                } else {
                                    setSelectedRecords(selectedRecords.filter(id => id !== record._id));
                                }
                            }}
                        />
                    )}
                </TableCell>
                <TableCell>
                    <Typography variant="body2">
                        {formatted.date}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        {format(new Date(record.overtimeDate), 'EEEE')}
                    </Typography>
                </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            {formatted.employee.name.charAt(0)}
                        </Avatar>
                        <Box>
                            <Typography variant="body2" fontWeight="bold">
                                {formatted.employee.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {formatted.employee.id}
                                {formatted.employee.position && ` • ${formatted.employee.position}`}
                            </Typography>
                        </Box>
                    </Box>
                </TableCell>
                <TableCell>
                    <Typography variant="body2">
                        {formatted.timeRange}
                    </Typography>
                </TableCell>
                <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                        {formatted.hours}
                    </Typography>
                </TableCell>
                <TableCell>
                    <Chip 
                        label={formatted.type} 
                        size="small"
                        color={getOvertimeTypeColor(formatted.type)}
                        sx={{ minWidth: 80 }}
                    />
                </TableCell>
                <TableCell>
                    <Typography variant="body2" color="success.main" fontWeight="bold">
                        {formatted.amount}
                    </Typography>
                </TableCell>
                <TableCell>
                    <Chip 
                        label={formatted.status} 
                        size="small"
                        color={getStatusColor(formatted.status)}
                        sx={{ minWidth: 80 }}
                    />
                </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleViewRecord(record)}>
                                <Visibility fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        
                        {record.status === 'Pending' && (
                            <>
                                <Tooltip title="Edit">
                                    <IconButton 
                                        size="small" 
                                        color="primary"
                                        onClick={() => handleEditRecord(record)}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Duplicate">
                                    <IconButton 
                                        size="small" 
                                        color="secondary"
                                        onClick={() => handleDuplicateRecord(record)}
                                    >
                                        <FileCopy fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </>
                        )}
                    </Box>
                </TableCell>
            </TableRow>
        );
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: { xs: 1, sm: 2 } }}>
                {/* Header with bulk actions */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {onBack && (
                            <IconButton onClick={onBack} size="small">
                                <ArrowBack />
                            </IconButton>
                        )}
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                {userDepartment} Overtime Management
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {filteredRecords.length} records • {departmentEmployees.length} active employees
                            </Typography>
                        </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {selectedRecords.length > 0 && (
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={handleBatchDelete}
                                size="small"
                                startIcon={<DeleteIcon />}
                                disabled={loading}
                            >
                                Delete Selected ({selectedRecords.length})
                            </Button>
                        )}
                        
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenDialog(true)}
                            size="small"
                            disabled={loadingEmployees || departmentEmployees.length === 0}
                        >
                            New Record
                        </Button>
                    </Box>
                </Box>

                {/* Employee loading indicator */}
                {loadingEmployees && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        Loading employees from {userDepartment} department...
                    </Alert>
                )}

                {!loadingEmployees && departmentEmployees.length === 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        No active employees found in {userDepartment} department. Cannot create overtime records.
                    </Alert>
                )}

                {/* Summary Cards */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <SummaryCard
                            title="Total Records"
                            value={filteredRecords.length}
                            icon={<TimeIcon />}
                            color="primary"
                            subtitle="All status"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <SummaryCard
                            title="Pending Review"
                            value={totals.pendingCount}
                            icon={<PendingActions />}
                            color="warning"
                            subtitle={`${formatCurrency(totals.pendingAmount)}`}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <SummaryCard
                            title="Checked"
                            value={totals.checkedCount}
                            icon={<CheckCircle />}
                            color="info"
                            subtitle="Awaiting approval"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <SummaryCard
                            title="Approved"
                            value={totals.approvedCount}
                            icon={<CheckCircle />}
                            color="success"
                            subtitle="Ready for payment"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <SummaryCard
                            title="Paid"
                            value={totals.paidCount}
                            icon={<MoneyIcon />}
                            color="primary"
                            subtitle="Completed"
                        />
                    </Grid>
                </Grid>

                {/* Enhanced Table */}
                <Paper sx={{ overflow: 'hidden', mb: 2 }}>
                    <EnhancedTableToolbar
                        filters={filters}
                        updateFilter={updateFilter}
                        resetFilters={resetFilters}
                        hasActiveFilters={hasActiveFilters}
                        onRefresh={() => {
                            loadData();
                            loadDepartmentEmployees();
                        }}
                        onExport={handleExport}
                        onPrint={handlePrint}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                    />
                    
                    <TableContainer sx={{ maxHeight: 500 }}>
                        <Table stickyHeader size="small">
                            <EnhancedTableHead
                                selectedCount={selectedRecords.length}
                                rowCount={filteredRecords.length}
                                onSelectAll={handleSelectAll}
                            />
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                            <CircularProgress size={32} />
                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                                Loading overtime records...
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedRecords.length > 0 ? (
                                    paginatedRecords.map(renderTableRow)
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">
                                                {hasActiveFilters 
                                                    ? 'No records match your filters' 
                                                    : 'No overtime records found'
                                                }
                                            </Typography>
                                            {hasActiveFilters && (
                                                <Button 
                                                    size="small" 
                                                    onClick={resetFilters}
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
                    </TableContainer>
                    
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
                </Paper>

                {/* Add/Edit Dialog */}
                <OvertimeFormDialog
                    open={openDialog}
                    onClose={handleCloseDialog}
                    formData={formData}
                    errors={errors}
                    employees={departmentEmployees}
                    editMode={editMode}
                    onSubmit={handleSubmit}
                    onFormChange={(field, value) => {
                        setFormData(prev => ({ ...prev, [field]: value }));
                        if (errors[field]) {
                            setErrors(prev => ({ ...prev, [field]: '' }));
                        }
                    }}
                    isSubmitting={isSubmitting}
                />

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                >
                    <Alert 
                        severity={snackbar.severity} 
                        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
};

// Reusable components
const SummaryCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ color, mr: 1 }}>{icon}</Box>
                <Typography variant="body2" color="textSecondary">
                    {title}
                </Typography>
            </Box>
            <Typography variant="h6" color={color} gutterBottom>
                {value}
            </Typography>
            {subtitle && (
                <Typography variant="caption" color="textSecondary">
                    {subtitle}
                </Typography>
            )}
        </CardContent>
    </Card>
);

export default DepartmentOvertimeRecording;