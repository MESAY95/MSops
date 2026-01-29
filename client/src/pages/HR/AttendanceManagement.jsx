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
    Checkbox,
    FormGroup,
    FormControlLabel,
    Avatar,
    LinearProgress,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    Divider,
    ListItemAvatar,
    Popover
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { 
    Add as AddIcon, 
    Print as PrintIcon, 
    Refresh as RefreshIcon,
    GetApp as ExportIcon,
    GroupAdd as GroupAddIcon,
    FilterList as FilterIcon,
    CalendarToday as CalendarIcon,
    Clear as ClearIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CheckCircle as PresentIcon,
    Cancel as AbsentIcon,
    Schedule as LateIcon,
    HourglassEmpty as HalfDayIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    Search as SearchIcon,
    People as PeopleIcon,
    Summarize as SummaryIcon,
    DateRange as DateRangeIcon,
    DeleteSweep as DeleteSweepIcon,
    History as HistoryIcon,
    AccessTime as AccessTimeIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    AccountBalance as BalanceIcon,
    EventBusy as LeaveIcon  // CHANGED: Fixed icon import
} from '@mui/icons-material';

const AttendanceManagement = () => {
    // Helper functions - MOVED BEFORE STATE INITIALIZATION
    const getDefaultCheckIn = () => {
        const date = new Date();
        date.setHours(8, 0, 0, 0);
        return date;
    };

    const getDefaultCheckOut = () => {
        const date = new Date();
        date.setHours(17, 0, 0, 0);
        return date;
    };

    // Get current date (today at 00:00:00)
    const getCurrentDate = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    };

    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [loadingDeletePreview, setLoadingDeletePreview] = useState(false);
    const [summary, setSummary] = useState({
        totalEmployees: 0,
        totalPresent: 0,
        totalAbsent: 0,
        totalLate: 0,
        totalHalfDay: 0,
        totalOnLeave: 0,
        totalAnnualLeave: 0,
        totalSickLeave: 0,
        attendanceRate: 0,
        fullTimeStats: { present: 0, total: 0, rate: 0 },
        partTimeStats: { present: 0, total: 0, rate: 0 },
        contractorStats: { present: 0, total: 0, rate: 0 }
    });
    const [filters, setFilters] = useState({
        employeeId: '',
        employeeName: '',
        department: '',
        status: '',
        employmentType: '',
        startDate: null,
        endDate: null
    });
    const [openDialog, setOpenDialog] = useState(false);
    const [bulkDialog, setBulkDialog] = useState(false);
    const [bulkRangeDialog, setBulkRangeDialog] = useState(false);
    const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentRecordId, setCurrentRecordId] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [submitting, setSubmitting] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [employmentTypes, setEmploymentTypes] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [activeTab, setActiveTab] = useState(0);
    const [summaryReport, setSummaryReport] = useState([]);
    const [recentRecords, setRecentRecords] = useState([]);
    const [recordsToDelete, setRecordsToDelete] = useState([]);
    const [estimatedCount, setEstimatedCount] = useState(0);
    const tableRef = useRef();

    // Form state
    const [formData, setFormData] = useState({
        date: getCurrentDate(),
        employeeId: '',
        employeeName: '',
        department: '',
        employmentType: '',
        status: 'Present',
        checkIn: getDefaultCheckIn(),
        checkOut: getDefaultCheckOut(),
        notes: '',
        leaveType: 'None'
    });

    // Bulk attendance form
    const [bulkFormData, setBulkFormData] = useState({
        date: getCurrentDate(),
        status: 'Present',
        checkIn: getDefaultCheckIn(),
        checkOut: getDefaultCheckOut(),
        notes: '',
        leaveType: 'None'
    });

    // Bulk range attendance form
    const [bulkRangeFormData, setBulkRangeFormData] = useState({
        startDate: getCurrentDate(),
        endDate: getCurrentDate(),
        status: 'Present',
        checkIn: getDefaultCheckIn(),
        checkOut: getDefaultCheckOut(),
        notes: '',
        leaveType: 'None'
    });

    // Bulk delete form
    const [bulkDeleteFormData, setBulkDeleteFormData] = useState({
        startDate: getCurrentDate(),
        endDate: getCurrentDate(),
        employeeIds: [],
        department: '',
        employmentType: '',
        status: ''
    });

    const [errors, setErrors] = useState({});

    const statusOptions = [
        { value: 'Present', label: 'Present', icon: <PresentIcon />, color: 'success' },
        { value: 'Absent', label: 'Absent', icon: <AbsentIcon />, color: 'error' },
        { value: 'Late', label: 'Late', icon: <LateIcon />, color: 'warning' },
        { value: 'Half-day', label: 'Half Day', icon: <HalfDayIcon />, color: 'info' },
        { value: 'Annual Leave', label: 'Annual Leave', icon: <LeaveIcon />, color: 'primary' },
        { value: 'Sick Leave', label: 'Sick Leave', icon: <LeaveIcon />, color: 'secondary' },
        { value: 'Other Leave', label: 'Other Leave', icon: <LeaveIcon />, color: 'primary' }
    ];

    const leaveTypes = ['None', 'Annual Leave', 'Sick Leave', 'Casual Leave', 'Emergency Leave', 'Other'];

    useEffect(() => {
        fetchAttendance();
        fetchEmployees();
        fetchDepartments();
    }, []);

    useEffect(() => {
        // Apply filters to attendance records
        let filtered = [...attendanceRecords];
        
        // Filter by employee ID
        if (filters.employeeId) {
            filtered = filtered.filter(record => 
                record.employeeId?.toLowerCase().includes(filters.employeeId.toLowerCase())
            );
        }
        
        // Filter by employee name
        if (filters.employeeName) {
            filtered = filtered.filter(record => 
                record.employeeName?.toLowerCase().includes(filters.employeeName.toLowerCase())
            );
        }
        
        // Filter by department
        if (filters.department) {
            filtered = filtered.filter(record => record.department === filters.department);
        }
        
        // Filter by status
        if (filters.status) {
            filtered = filtered.filter(record => record.status === filters.status);
        }
        
        // Filter by employment type
        if (filters.employmentType) {
            filtered = filtered.filter(record => record.employmentType === filters.employmentType);
        }
        
        // Filter by date range
        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            startDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(record => new Date(record.date) >= startDate);
        }
        
        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(record => new Date(record.date) <= endDate);
        }
        
        // Sort by date ascending (oldest first) and then by employee ID ascending
        const sortedFiltered = filtered.sort((a, b) => {
            // First compare dates
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateA < dateB) return -1;
            if (dateA > dateB) return 1;
            
            // If dates are equal, sort by employee ID
            const idA = a.employeeId || '';
            const idB = b.employeeId || '';
            return idA.localeCompare(idB);
        });
        
        setFilteredRecords(sortedFiltered);
        calculateSummary(sortedFiltered);
        generateSummaryReport(sortedFiltered);
        
        // Update recent records (last 5 entries) - newest first for display
        const recent = [...attendanceRecords]
            .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
            .slice(0, 5);
        setRecentRecords(recent);
        
    }, [attendanceRecords, filters]);

    // Effect to update delete preview when bulk delete form changes
    useEffect(() => {
        if (bulkDeleteDialog && bulkDeleteFormData.startDate && bulkDeleteFormData.endDate) {
            const timer = setTimeout(() => {
                fetchRecordsForBulkDelete();
            }, 500);
            
            return () => clearTimeout(timer);
        }
    }, [bulkDeleteFormData, bulkDeleteDialog]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/attendance?limit=1000');
            const data = await response.json();
            
            if (data.attendance) {
                // Sort attendance by date ascending (oldest first) and then by employee ID
                const sortedAttendance = data.attendance.sort((a, b) => {
                    // First compare dates
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    if (dateA < dateB) return -1;
                    if (dateA > dateB) return 1;
                    
                    // If dates are equal, sort by employee ID
                    const idA = a.employeeId || '';
                    const idB = b.employeeId || '';
                    return idA.localeCompare(idB);
                });
                setAttendanceRecords(sortedAttendance);
                
                // Set recent records (last 5 entries) - newest first for display
                const recent = [...sortedAttendance]
                    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
                    .slice(0, 5);
                setRecentRecords(recent);
            }
        } catch (error) {
            console.error('Error fetching attendance records:', error);
            showSnackbar('Error fetching attendance records', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        setLoadingEmployees(true);
        try {
            const response = await fetch('/api/employeemanagements?limit=1000');
            const data = await response.json();
            
            if (data.employees) {
                // Process employees - ensure we use the correct employeeId field
                const processedEmployees = data.employees.map(employee => {
                    // Always use employee.employeeId as the primary identifier
                    // This should match what's stored in the attendance records
                    let employeeId = employee.employeeId || '';
                    
                    // If no employeeId field exists, use _id as fallback
                    if (!employeeId && employee._id) {
                        employeeId = employee._id.toString();
                    }
                    
                    // Build full name
                    let fullName = '';
                    if (employee.fullName) {
                        fullName = employee.fullName;
                    } else if (employee.firstName && employee.lastName) {
                        fullName = `${employee.firstName} ${employee.lastName}`;
                    } else if (employee.firstName) {
                        fullName = employee.firstName;
                    }
                    
                    // Get department name
                    let departmentName = '';
                    if (employee.departmentName) {
                        departmentName = employee.departmentName;
                    } else if (employee.departmentId && employee.departmentId.name) {
                        departmentName = employee.departmentId.name;
                    } else if (employee.department) {
                        departmentName = employee.department;
                    }
                    
                    // Map 'Permanent' to 'Full-Time' to match backend enum
                    const employmentType = employee.employmentType || 'Full-Time';
                    const mappedEmploymentType = employmentType === 'Permanent' ? 'Full-Time' : employmentType;
                    
                    return {
                        ...employee,
                        _id: employee._id || employee.id,
                        employeeId: employeeId, // Use the string employeeId
                        firstName: employee.firstName || '',
                        lastName: employee.lastName || '',
                        fullName: fullName.trim(),
                        departmentName: departmentName,
                        position: employee.position || '',
                        employmentType: mappedEmploymentType
                    };
                }).filter(employee => employee.employeeId); // Filter out employees without an ID
                
                setEmployees(processedEmployees);
                
                // Extract unique departments
                const uniqueDepartments = [...new Set(processedEmployees
                    .filter(emp => emp.departmentName)
                    .map(emp => emp.departmentName))];
                setDepartments(uniqueDepartments.sort());
                
                // Extract unique employment types (after mapping)
                const uniqueEmploymentTypes = [...new Set(processedEmployees
                    .filter(emp => emp.employmentType)
                    .map(emp => emp.employmentType))];
                setEmploymentTypes(uniqueEmploymentTypes.sort());
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            showSnackbar('Error fetching employees', 'error');
        } finally {
            setLoadingEmployees(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await fetch('/api/departments?status=Active');
            const data = await response.json();
            if (data.data) {
                const deptNames = data.data.map(dept => dept.name || dept.departmentName);
                setDepartments(prev => [...new Set([...prev, ...deptNames])].sort());
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    // NEW: Fetch attendance records for bulk delete preview
    const fetchRecordsForBulkDelete = async () => {
        if (!validateBulkDeleteForm()) {
            setRecordsToDelete([]);
            setEstimatedCount(0);
            return;
        }

        setLoadingDeletePreview(true);
        try {
            const params = new URLSearchParams();
            params.append('startDate', formatDateForAPI(bulkDeleteFormData.startDate));
            params.append('endDate', formatDateForAPI(bulkDeleteFormData.endDate));
            
            if (bulkDeleteFormData.department) {
                params.append('department', bulkDeleteFormData.department);
            }
            
            if (bulkDeleteFormData.employmentType) {
                params.append('employmentType', bulkDeleteFormData.employmentType);
            }
            
            if (bulkDeleteFormData.status) {
                params.append('status', bulkDeleteFormData.status);
            }
            
            if (bulkDeleteFormData.employeeIds && bulkDeleteFormData.employeeIds.length > 0) {
                bulkDeleteFormData.employeeIds.forEach(id => {
                    params.append('employeeIds', id);
                });
            }

            // Fetch records with IDs
            const url = `/api/attendance/records-for-delete?${params.toString()}`;
            const response = await fetch(url);
            
            if (response.ok) {
                const result = await response.json();
                setRecordsToDelete(result.records || []);
                setEstimatedCount(result.count || 0);
            } else {
                setRecordsToDelete([]);
                setEstimatedCount(0);
            }
        } catch (error) {
            console.error('Error fetching records for delete:', error);
            setRecordsToDelete([]);
            setEstimatedCount(0);
        } finally {
            setLoadingDeletePreview(false);
        }
    };

    const calculateSummary = (records) => {
        const summaryData = {
            totalEmployees: employees.length,
            totalPresent: 0,
            totalAbsent: 0,
            totalLate: 0,
            totalHalfDay: 0,
            totalOnLeave: 0,
            totalAnnualLeave: 0,
            totalSickLeave: 0,
            attendanceRate: 0,
            fullTimeStats: { present: 0, total: 0, rate: 0 },
            partTimeStats: { present: 0, total: 0, rate: 0 },
            contractorStats: { present: 0, total: 0, rate: 0 }
        };

        if (records.length === 0) {
            setSummary(summaryData);
            return;
        }

        // Count by employment type
        records.forEach(record => {
            const empType = record.employmentType || 'Full-Time';
            
            switch (record.status) {
                case 'Present':
                    summaryData.totalPresent++;
                    if (empType === 'Full-Time') summaryData.fullTimeStats.present++;
                    else if (empType === 'Part-Time') summaryData.partTimeStats.present++;
                    else if (empType === 'Contractor') summaryData.contractorStats.present++;
                    break;
                case 'Absent':
                    summaryData.totalAbsent++;
                    break;
                case 'Late':
                    summaryData.totalLate++;
                    if (empType === 'Full-Time') summaryData.fullTimeStats.present++;
                    else if (empType === 'Part-Time') summaryData.partTimeStats.present++;
                    else if (empType === 'Contractor') summaryData.contractorStats.present++;
                    break;
                case 'Half-day':
                    summaryData.totalHalfDay++;
                    if (empType === 'Full-Time') summaryData.fullTimeStats.present += 0.5;
                    else if (empType === 'Part-Time') summaryData.partTimeStats.present += 0.5;
                    else if (empType === 'Contractor') summaryData.contractorStats.present += 0.5;
                    break;
                case 'Annual Leave':
                    summaryData.totalAnnualLeave++;
                    summaryData.totalOnLeave++;
                    break;
                case 'Sick Leave':
                    summaryData.totalSickLeave++;
                    summaryData.totalOnLeave++;
                    break;
                case 'Other Leave':
                    summaryData.totalOnLeave++;
                    break;
            }
            
            // Count totals by employment type
            if (empType === 'Full-Time') summaryData.fullTimeStats.total++;
            else if (empType === 'Part-Time') summaryData.partTimeStats.total++;
            else if (empType === 'Contractor') summaryData.contractorStats.total++;
        });

        // Calculate attendance rate based on total records
        const totalPresentEquivalent = summaryData.totalPresent + (summaryData.totalHalfDay * 0.5);
        const totalRecords = records.length;
        summaryData.attendanceRate = totalRecords > 0 
            ? Math.round((totalPresentEquivalent / totalRecords) * 100) 
            : 0;

        // Calculate rates by employment type (based on total records of that type)
        summaryData.fullTimeStats.rate = summaryData.fullTimeStats.total > 0 
            ? Math.round((summaryData.fullTimeStats.present / summaryData.fullTimeStats.total) * 100)
            : 0;
        summaryData.partTimeStats.rate = summaryData.partTimeStats.total > 0 
            ? Math.round((summaryData.partTimeStats.present / summaryData.partTimeStats.total) * 100)
            : 0;
        summaryData.contractorStats.rate = summaryData.contractorStats.total > 0 
            ? Math.round((summaryData.contractorStats.present / summaryData.contractorStats.total) * 100)
            : 0;

        setSummary(summaryData);
    };

    const generateSummaryReport = (records) => {
        // Group by employee (including all days including absent)
        const employeeSummary = {};
        
        records.forEach(record => {
            if (!employeeSummary[record.employeeId]) {
                const employee = employees.find(emp => 
                    emp.employeeId === record.employeeId
                );
                employeeSummary[record.employeeId] = {
                    employeeId: record.employeeId,
                    employeeName: record.employeeName,
                    department: record.department,
                    employmentType: employee?.employmentType || 'Full-Time',
                    totalDays: 0,
                    presentDays: 0,
                    lateDays: 0,
                    halfDays: 0,
                    leaveDays: 0,
                    absentDays: 0
                };
            }
            
            const summary = employeeSummary[record.employeeId];
            summary.totalDays++;
            
            switch(record.status) {
                case 'Present':
                    summary.presentDays++;
                    break;
                case 'Late':
                    summary.lateDays++;
                    break;
                case 'Half-day':
                    summary.halfDays++;
                    break;
                case 'Annual Leave':
                case 'Sick Leave':
                case 'Other Leave':
                    summary.leaveDays++;
                    break;
                case 'Absent':
                    summary.absentDays++;
                    break;
            }
        });
        
        // Convert to array and sort by employee ID
        const report = Object.values(employeeSummary).sort((a, b) => 
            a.employeeId.localeCompare(b.employeeId)
        );
        
        setSummaryReport(report);
    };

    // Check if date is in the future (beyond current date)
    const isFutureDate = (date) => {
        if (!date) return false;
        const inputDate = new Date(date);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        return inputDate > today;
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.date) {
            newErrors.date = 'Date is required';
        } else if (isFutureDate(formData.date)) {
            newErrors.date = 'Cannot select future dates beyond today';
        }
        
        if (!formData.employeeId) newErrors.employeeId = 'Employee is required';
        if (!formData.status) newErrors.status = 'Status is required';
        if (formData.status === 'Annual Leave' || formData.status === 'Sick Leave' || formData.status === 'Other Leave') {
            if (!formData.leaveType || formData.leaveType === 'None') {
                newErrors.leaveType = 'Leave type is required for leave status';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateBulkForm = () => {
        const newErrors = {};

        if (!bulkFormData.date) {
            newErrors.date = 'Date is required';
        } else if (isFutureDate(bulkFormData.date)) {
            newErrors.date = 'Cannot select future dates beyond today';
        }
        
        if (!bulkFormData.status) newErrors.status = 'Status is required';
        if (selectedEmployees.length === 0) newErrors.employees = 'Select at least one employee';
        if (bulkFormData.status === 'Annual Leave' || bulkFormData.status === 'Sick Leave' || bulkFormData.status === 'Other Leave') {
            if (!bulkFormData.leaveType || bulkFormData.leaveType === 'None') {
                newErrors.leaveType = 'Leave type is required for leave status';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateBulkRangeForm = () => {
        const newErrors = {};

        if (!bulkRangeFormData.startDate) {
            newErrors.startDate = 'Start date is required';
        } else if (isFutureDate(bulkRangeFormData.startDate)) {
            newErrors.startDate = 'Cannot select future dates beyond today';
        }
        
        if (!bulkRangeFormData.endDate) {
            newErrors.endDate = 'End date is required';
        } else if (isFutureDate(bulkRangeFormData.endDate)) {
            newErrors.endDate = 'Cannot select future dates beyond today';
        }
        
        if (bulkRangeFormData.startDate && bulkRangeFormData.endDate) {
            const start = new Date(bulkRangeFormData.startDate);
            const end = new Date(bulkRangeFormData.endDate);
            if (end < start) newErrors.dateRange = 'End date must be after start date';
            // Limit to 30 days for bulk operations
            const diffDays = getDateRangeDays(bulkRangeFormData.startDate, bulkRangeFormData.endDate);
            if (diffDays > 30) newErrors.dateRange = 'Date range cannot exceed 30 days';
        }
        if (!bulkRangeFormData.status) newErrors.status = 'Status is required';
        if (selectedEmployees.length === 0) newErrors.employees = 'Select at least one employee';
        if (bulkRangeFormData.status === 'Annual Leave' || bulkRangeFormData.status === 'Sick Leave' || bulkRangeFormData.status === 'Other Leave') {
            if (!bulkRangeFormData.leaveType || bulkRangeFormData.leaveType === 'None') {
                newErrors.leaveType = 'Leave type is required for leave status';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Validate bulk delete form
    const validateBulkDeleteForm = () => {
        const newErrors = {};

        if (!bulkDeleteFormData.startDate) {
            newErrors.startDate = 'Start date is required';
        } else if (isFutureDate(bulkDeleteFormData.startDate)) {
            newErrors.startDate = 'Cannot select future dates beyond today';
        }
        
        if (!bulkDeleteFormData.endDate) {
            newErrors.endDate = 'End date is required';
        } else if (isFutureDate(bulkDeleteFormData.endDate)) {
            newErrors.endDate = 'Cannot select future dates beyond today';
        }
        
        if (bulkDeleteFormData.startDate && bulkDeleteFormData.endDate) {
            const start = new Date(bulkDeleteFormData.startDate);
            const end = new Date(bulkDeleteFormData.endDate);
            if (end < start) newErrors.dateRange = 'End date must be after start date';
            // Limit to 90 days for bulk delete operations
            const diffDays = getDateRangeDays(bulkDeleteFormData.startDate, bulkDeleteFormData.endDate);
            if (diffDays > 90) newErrors.dateRange = 'Date range cannot exceed 90 days for bulk delete';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const url = editMode 
                ? `/api/attendance/${currentRecordId}`
                : '/api/attendance';
            
            const method = editMode ? 'PUT' : 'POST';

            // Calculate total hours (deduct 1 hour for lunch)
            let totalHours = 0;
            let overtime = 0;
            if (formData.checkIn && formData.checkOut && 
                (formData.status === 'Present' || formData.status === 'Late' || formData.status === 'Half-day')) {
                const checkIn = new Date(formData.checkIn);
                const checkOut = new Date(formData.checkOut);
                let rawHours = (checkOut - checkIn) / (1000 * 60 * 60);
                
                // Deduct 1 hour for lunch
                totalHours = Math.max(0, rawHours - 1);
                
                // Calculate overtime (assuming 8-hour work day after lunch deduction)
                const workDayHours = 8;
                overtime = totalHours > workDayHours ? totalHours - workDayHours : 0;
                
                // For half-day, adjust total hours (4 hours max including lunch)
                if (formData.status === 'Half-day') {
                    totalHours = Math.min(totalHours, 4);
                    overtime = 0;
                }
            }

            // Map 'Permanent' to 'Full-Time' to match backend enum
            const employmentType = formData.employmentType || 'Full-Time';
            const mappedEmploymentType = employmentType === 'Permanent' ? 'Full-Time' : employmentType;

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    employeeId: formData.employeeId,
                    employeeName: formData.employeeName,
                    department: formData.department,
                    employmentType: mappedEmploymentType,
                    date: formatDateForAPI(formData.date),
                    checkIn: (formData.status === 'Present' || formData.status === 'Late' || formData.status === 'Half-day') 
                        ? formatDateTimeForAPI(formData.checkIn) : null,
                    checkOut: (formData.status === 'Present' || formData.status === 'Late' || formData.status === 'Half-day') 
                        ? formatDateTimeForAPI(formData.checkOut) : null,
                    status: formData.status,
                    leaveType: (formData.status === 'Annual Leave' || formData.status === 'Sick Leave' || formData.status === 'Other Leave') 
                        ? formData.leaveType : 'None',
                    totalHours: totalHours.toFixed(2),
                    overtime: overtime.toFixed(2),
                    notes: formData.notes
                }),
            });

            if (response.ok) {
                const result = await response.json();
                showSnackbar(
                    editMode 
                        ? 'Attendance record updated successfully!' 
                        : 'Attendance record saved successfully!', 
                    'success'
                );
                handleCloseDialog();
                fetchAttendance();
                
                // Add to recent records if it's a new record
                if (!editMode && result.attendance) {
                    setRecentRecords(prev => [result.attendance, ...prev.slice(0, 4)]);
                }
            } else {
                const errorData = await response.json();
                showSnackbar(errorData.message || 'Error saving attendance record', 'error');
            }
        } catch (error) {
            console.error('Error saving attendance record:', error);
            showSnackbar('Error saving attendance record', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBulkSubmit = async () => {
        if (!validateBulkForm()) return;

        setSubmitting(true);
        try {
            // Filter to only include valid employee IDs
            const validEmployeeIds = selectedEmployees.filter(id => {
                const employee = employees.find(emp => emp.employeeId === id);
                return employee && employee.employeeId;
            });

            if (validEmployeeIds.length === 0) {
                showSnackbar('No valid employee IDs found. Please check selected employees.', 'error');
                setSubmitting(false);
                return;
            }

            const bulkData = {
                date: formatDateForAPI(bulkFormData.date),
                status: bulkFormData.status,
                checkIn: (bulkFormData.status === 'Present' || bulkFormData.status === 'Late' || bulkFormData.status === 'Half-day') 
                    ? formatDateTimeForAPI(bulkFormData.checkIn) : null,
                checkOut: (bulkFormData.status === 'Present' || bulkFormData.status === 'Late' || bulkFormData.status === 'Half-day') 
                    ? formatDateTimeForAPI(bulkFormData.checkOut) : null,
                leaveType: (bulkFormData.status === 'Annual Leave' || bulkFormData.status === 'Sick Leave' || bulkFormData.status === 'Other Leave') 
                    ? bulkFormData.leaveType : 'None',
                notes: bulkFormData.notes,
                employeeIds: validEmployeeIds
            };

            console.log('Sending bulk data:', bulkData);

            const response = await fetch('/api/attendance/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bulkData),
            });

            if (response.ok) {
                const result = await response.json();
                showSnackbar(
                    `Attendance marked for ${result.summary.successCount} employee(s) successfully! ${result.summary.errorCount > 0 ? `${result.summary.errorCount} failed.` : ''}`,
                    result.summary.errorCount > 0 ? 'warning' : 'success'
                );
                handleCloseBulkDialog();
                fetchAttendance();
            } else {
                const errorData = await response.json();
                showSnackbar(errorData.message || 'Error saving bulk attendance', 'error');
            }
        } catch (error) {
            console.error('Error saving bulk attendance:', error);
            showSnackbar('Error saving bulk attendance', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBulkRangeSubmit = async () => {
        console.log('Starting bulk range submit...');
        console.log('Selected employees:', selectedEmployees);
        console.log('Bulk range form data:', bulkRangeFormData);
        
        if (!validateBulkRangeForm()) {
            console.log('Validation failed');
            return;
        }

        setSubmitting(true);
        try {
            // Filter to only include valid employee IDs
            const validEmployeeIds = selectedEmployees.filter(id => {
                const employee = employees.find(emp => emp.employeeId === id);
                return employee && employee.employeeId;
            });

            if (validEmployeeIds.length === 0) {
                showSnackbar('No valid employee IDs found. Please check selected employees.', 'error');
                setSubmitting(false);
                return;
            }

            const bulkRangeData = {
                startDate: formatDateForAPI(bulkRangeFormData.startDate),
                endDate: formatDateForAPI(bulkRangeFormData.endDate),
                status: bulkRangeFormData.status,
                checkIn: (bulkRangeFormData.status === 'Present' || bulkRangeFormData.status === 'Late' || bulkRangeFormData.status === 'Half-day') 
                    ? formatDateTimeForAPI(bulkRangeFormData.checkIn) : null,
                checkOut: (bulkRangeFormData.status === 'Present' || bulkRangeFormData.status === 'Late' || bulkRangeFormData.status === 'Half-day') 
                    ? formatDateTimeForAPI(bulkRangeFormData.checkOut) : null,
                leaveType: (bulkRangeFormData.status === 'Annual Leave' || bulkRangeFormData.status === 'Sick Leave' || bulkRangeFormData.status === 'Other Leave') 
                    ? bulkRangeFormData.leaveType : 'None',
                notes: bulkRangeFormData.notes,
                employeeIds: validEmployeeIds
            };

            console.log('Sending to API:', bulkRangeData);
            
            const response = await fetch('/api/attendance/bulk-range', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bulkRangeData),
            });

            console.log('Response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('API response:', result);
                showSnackbar(
                    `Attendance marked for ${result.summary.totalProcessed} employee-days successfully! ${result.summary.errorCount > 0 ? `${result.summary.errorCount} failed.` : ''}`,
                    result.summary.errorCount > 0 ? 'warning' : 'success'
                );
                handleCloseBulkRangeDialog();
                fetchAttendance();
            } else {
                const errorData = await response.json();
                console.error('API error:', errorData);
                showSnackbar(errorData.message || 'Error saving bulk attendance range', 'error');
            }
        } catch (error) {
            console.error('Error saving bulk attendance range:', error);
            showSnackbar('Error saving bulk attendance range', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Bulk delete by date range function (ID-based)
    const handleBulkDeleteByDateRange = async () => {
        if (!validateBulkDeleteForm()) return;

        setSubmitting(true);
        try {
            // First fetch records to get their IDs
            const records = recordsToDelete;
            
            if (records.length === 0) {
                showSnackbar('No records found matching the criteria', 'warning');
                setSubmitting(false);
                return;
            }

            // Confirm deletion with record count
            const confirmMessage = `Are you sure you want to delete ${records.length} attendance records? This action cannot be undone.`;
            if (!window.confirm(confirmMessage)) {
                setSubmitting(false);
                return;
            }

            // Extract IDs from records
            const recordIds = records.map(record => record._id);

            // Delete using IDs
            const response = await fetch('/api/attendance/bulk-delete-by-id', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ recordIds }),
            });

            if (response.ok) {
                const result = await response.json();
                showSnackbar(
                    `Successfully deleted ${result.deletedCount} attendance records`,
                    'success'
                );
                handleCloseBulkDeleteDialog();
                fetchAttendance();
                
                // Clear state
                setRecordsToDelete([]);
                setEstimatedCount(0);
            } else {
                const errorData = await response.json();
                showSnackbar(errorData.message || 'Error deleting attendance records', 'error');
            }
        } catch (error) {
            console.error('Error deleting attendance records by date range:', error);
            showSnackbar('Error deleting attendance records', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (record) => {
        setFormData({
            date: new Date(record.date),
            employeeId: record.employeeId,
            employeeName: record.employeeName,
            department: record.department,
            employmentType: record.employmentType,
            status: record.status,
            checkIn: record.checkIn ? new Date(record.checkIn) : getDefaultCheckIn(),
            checkOut: record.checkOut ? new Date(record.checkOut) : getDefaultCheckOut(),
            notes: record.notes || '',
            leaveType: record.leaveType || 'None'
        });
        setEditMode(true);
        setCurrentRecordId(record._id);
        setOpenDialog(true);
        setErrors({});
    };

    const handleDelete = (record) => {
        setRecordToDelete(record);
        setDeleteDialog(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await fetch(`/api/attendance/${recordToDelete._id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                showSnackbar('Attendance record deleted successfully!', 'success');
                fetchAttendance();
                // Remove from recent records if present
                setRecentRecords(prev => prev.filter(r => r._id !== recordToDelete._id));
            } else {
                const errorData = await response.json();
                showSnackbar(errorData.message || 'Error deleting attendance record', 'error');
            }
        } catch (error) {
            console.error('Error deleting attendance record:', error);
            showSnackbar('Error deleting attendance record', 'error');
        } finally {
            setDeleteDialog(false);
            setRecordToDelete(null);
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

        // Auto-fill employee details when employee is selected
        if (field === 'employeeId' && value) {
            const selectedEmployee = employees.find(emp => emp.employeeId === value);
            
            if (selectedEmployee) {
                setFormData(prev => ({
                    ...prev,
                    employeeId: selectedEmployee.employeeId,
                    employeeName: selectedEmployee.fullName || 
                                `${selectedEmployee.firstName || ''} ${selectedEmployee.lastName || ''}`.trim(),
                    department: selectedEmployee.departmentName || '',
                    employmentType: selectedEmployee.employmentType || 'Full-Time'
                }));
            }
        }
    };

    const handleBulkInputChange = (field, value) => {
        setBulkFormData(prev => ({
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

    const handleBulkRangeInputChange = (field, value) => {
        setBulkRangeFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
        
        // Clear date range error if fixing dates
        if (errors.dateRange && (field === 'startDate' || field === 'endDate')) {
            setErrors(prev => ({
                ...prev,
                dateRange: ''
            }));
        }
    };

    // Handle bulk delete form changes
    const handleBulkDeleteFormChange = (field, value) => {
        setBulkDeleteFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
        
        // Clear date range error if fixing dates
        if (errors.dateRange && (field === 'startDate' || field === 'endDate')) {
            setErrors(prev => ({
                ...prev,
                dateRange: ''
            }));
        }
    };

    const handleEmployeeSelection = (employeeIdentifier, checked) => {
        if (checked) {
            setSelectedEmployees(prev => [...prev, employeeIdentifier]);
        } else {
            setSelectedEmployees(prev => prev.filter(id => id !== employeeIdentifier));
        }
    };

    // Handle bulk delete employee selection
    const handleBulkDeleteEmployeeSelection = (employeeIdentifier, checked) => {
        setBulkDeleteFormData(prev => {
            const currentIds = prev.employeeIds || [];
            if (checked) {
                return {
                    ...prev,
                    employeeIds: [...currentIds, employeeIdentifier]
                };
            } else {
                return {
                    ...prev,
                    employeeIds: currentIds.filter(id => id !== employeeIdentifier)
                };
            }
        });
    };

    const selectAllEmployees = () => {
        const allIdentifiers = employees.map(emp => emp.employeeId).filter(id => id);
        setSelectedEmployees(allIdentifiers);
    };

    const clearAllEmployees = () => {
        setSelectedEmployees([]);
    };

    // Select/Clear all employees for bulk delete
    const selectAllEmployeesForBulkDelete = () => {
        const allIdentifiers = employees.map(emp => emp.employeeId).filter(id => id);
        setBulkDeleteFormData(prev => ({
            ...prev,
            employeeIds: allIdentifiers
        }));
    };

    const clearAllEmployeesForBulkDelete = () => {
        setBulkDeleteFormData(prev => ({
            ...prev,
            employeeIds: []
        }));
    };

    const handleOpenDialog = () => {
        setOpenDialog(true);
        setEditMode(false);
        setCurrentRecordId(null);
        setFormData({
            date: getCurrentDate(),
            employeeId: '',
            employeeName: '',
            department: '',
            employmentType: '',
            status: 'Present',
            checkIn: getDefaultCheckIn(),
            checkOut: getDefaultCheckOut(),
            notes: '',
            leaveType: 'None'
        });
        setErrors({});
    };

    const handleOpenBulkDialog = () => {
        setBulkDialog(true);
        setBulkFormData({
            date: getCurrentDate(),
            status: 'Present',
            checkIn: getDefaultCheckIn(),
            checkOut: getDefaultCheckOut(),
            notes: '',
            leaveType: 'None'
        });
        setSelectedEmployees([]);
        setEmployeeSearch('');
        setErrors({});
    };

    const handleOpenBulkRangeDialog = () => {
        setBulkRangeDialog(true);
        setBulkRangeFormData({
            startDate: getCurrentDate(),
            endDate: getCurrentDate(),
            status: 'Present',
            checkIn: getDefaultCheckIn(),
            checkOut: getDefaultCheckOut(),
            notes: '',
            leaveType: 'None'
        });
        setSelectedEmployees([]);
        setEmployeeSearch('');
        setErrors({});
    };

    // Open bulk delete dialog with date range selection
    const handleOpenBulkDeleteDialog = async () => {
        setBulkDeleteDialog(true);
        setBulkDeleteFormData({
            startDate: getCurrentDate(),
            endDate: getCurrentDate(),
            employeeIds: [],
            department: '',
            employmentType: '',
            status: ''
        });
        setEmployeeSearch('');
        setErrors({});
        setRecordsToDelete([]);
        setEstimatedCount(0);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditMode(false);
        setCurrentRecordId(null);
    };

    const handleCloseBulkDialog = () => {
        setBulkDialog(false);
        setSelectedEmployees([]);
    };

    const handleCloseBulkRangeDialog = () => {
        setBulkRangeDialog(false);
        setSelectedEmployees([]);
    };

    const handleCloseBulkDeleteDialog = () => {
        setBulkDeleteDialog(false);
        setBulkDeleteFormData({
            startDate: getCurrentDate(),
            endDate: getCurrentDate(),
            employeeIds: [],
            department: '',
            employmentType: '',
            status: ''
        });
        setRecordsToDelete([]);
        setEstimatedCount(0);
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleRefresh = () => {
        fetchAttendance();
        fetchEmployees();
        showSnackbar('Data refreshed successfully', 'success');
    };

    const handleResetFilters = () => {
        setFilters({
            employeeId: '',
            employeeName: '',
            department: '',
            status: '',
            employmentType: '',
            startDate: null,
            endDate: null
        });
        showSnackbar('Filters reset successfully', 'info');
    };

    const handleExport = async () => {
        try {
            // Create URLSearchParams only with non-empty filter values
            const params = new URLSearchParams();
            
            // Only add parameters that have values
            if (filters.employeeId) params.append('employeeId', filters.employeeId);
            if (filters.employeeName) params.append('employeeName', filters.employeeName);
            if (filters.department) params.append('department', filters.department);
            if (filters.status) params.append('status', filters.status);
            if (filters.employmentType) params.append('employmentType', filters.employmentType);
            if (filters.startDate) params.append('startDate', formatDateForAPI(filters.startDate));
            if (filters.endDate) params.append('endDate', formatDateForAPI(filters.endDate));

            // Build the URL
            let url = '/api/attendance/export';
            const queryString = params.toString();
            if (queryString) {
                url += `?${queryString}`;
            }

            const response = await fetch(url);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `attendance-${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                window.URL.revokeObjectURL(url);

                showSnackbar('Data exported successfully', 'success');
            } else {
                showSnackbar('Error exporting data', 'error');
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            showSnackbar('Error exporting data', 'error');
        }
    };

    const getDateRangeDays = (startDate, endDate) => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    const handlePrintSummaryReport = () => {
        const printWindow = window.open('', '_blank');
        
        // Calculate summary for report
        let totalEmployees = summaryReport.length;
        let totalDays = summaryReport.reduce((sum, emp) => sum + emp.totalDays, 0);
        let totalPresent = summaryReport.reduce((sum, emp) => sum + emp.presentDays, 0);
        let totalLate = summaryReport.reduce((sum, emp) => sum + emp.lateDays, 0);
        let totalHalfDays = summaryReport.reduce((sum, emp) => sum + emp.halfDays, 0);
        let totalLeave = summaryReport.reduce((sum, emp) => sum + emp.leaveDays, 0);
        let totalAbsent = summaryReport.reduce((sum, emp) => sum + emp.absentDays, 0);
        
        // Calculate overall attendance rate (excluding absent from total days for rate calculation)
        let totalWorkingDays = totalDays - totalAbsent;
        let overallAttendanceRate = totalWorkingDays > 0 
            ? Math.round((totalPresent / totalWorkingDays) * 100) 
            : 0;

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Attendance Summary Report</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 20px; 
                        font-size: 12px; 
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 20px; 
                        border-bottom: 2px solid #333; 
                        padding-bottom: 10px; 
                    }
                    .report-title { 
                        font-size: 18px; 
                        font-weight: bold; 
                        margin-bottom: 5px; 
                    }
                    .report-subtitle { 
                        font-size: 14px; 
                        color: #666; 
                        margin-bottom: 10px; 
                    }
                    .print-info { 
                        display: flex; 
                        justify-content: space-between; 
                        margin-bottom: 15px; 
                        font-size: 11px; 
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-bottom: 15px; 
                        font-size: 12px; 
                    }
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 6px; 
                        text-align: left; 
                    }
                    th { 
                        background-color: #f5f5f5; 
                        font-weight: bold; 
                    }
                    .summary-section { 
                        margin-top: 20px; 
                        padding: 15px; 
                        background-color: #f9f9f9; 
                        border-radius: 4px; 
                        border: 1px solid #ddd; 
                    }
                    .summary-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 15px;
                        margin-top: 15px;
                    }
                    .summary-item {
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        background-color: white;
                    }
                    .positive { color: green; font-weight: bold; }
                    .warning { color: orange; font-weight: bold; }
                    .negative { color: red; font-weight: bold; }
                    .total-row { 
                        background-color: #f0f0f0; 
                        font-weight: bold; 
                    }
                    @media print {
                        body { 
                            margin: 0.5in; 
                            font-size: 12px; 
                        }
                        .header { 
                            margin-bottom: 15px; 
                        }
                        table { 
                            font-size: 11px; 
                        }
                        th, td { 
                            padding: 4px; 
                        }
                    }
                    .page-break {
                        page-break-before: always;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="report-title">Employee Attendance Summary Report</div>
                    <div class="report-subtitle">Report Date: ${formatDisplayDate(new Date().toString())}</div>
                </div>
                
                <div class="print-info">
                    <div><strong>Printed on:</strong> ${formatDisplayDate(new Date().toString())} ${new Date().toLocaleTimeString()}</div>
                    <div><strong>Total Employees:</strong> ${totalEmployees}</div>
                    <div><strong>Report Period:</strong> ${filters.startDate ? formatDisplayDate(filters.startDate) : 'All Dates'} - ${filters.endDate ? formatDisplayDate(filters.endDate) : 'All Dates'}</div>
                </div>

                <div class="summary-section">
                    <strong>Overall Summary:</strong>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <strong>Total Employees:</strong> ${totalEmployees}<br>
                            <strong>Total Days Tracked:</strong> ${totalDays}<br>
                            <strong>Overall Attendance Rate:</strong> <span class="${overallAttendanceRate >= 90 ? 'positive' : overallAttendanceRate >= 80 ? 'warning' : 'negative'}">${overallAttendanceRate}%</span>
                        </div>
                        <div class="summary-item">
                            <strong>Present:</strong> ${totalPresent}<br>
                            <strong>Late:</strong> ${totalLate}<br>
                            <strong>Half Days:</strong> ${totalHalfDays}
                        </div>
                        <div class="summary-item">
                            <strong>On Leave:</strong> ${totalLeave}<br>
                            <strong>Absent:</strong> ${totalAbsent}<br>
                            <strong>Working Days (excl. Absent):</strong> ${totalWorkingDays}
                        </div>
                    </div>
                </div>

                <div class="summary-section">
                    <strong>Attendance by Employment Type:</strong>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <strong>Full-Time:</strong> ${summary.fullTimeStats.present}/${summary.fullTimeStats.total}<br>
                            <strong>Rate:</strong> <span class="${summary.fullTimeStats.rate >= 90 ? 'positive' : summary.fullTimeStats.rate >= 80 ? 'warning' : 'negative'}">${summary.fullTimeStats.rate}%</span>
                        </div>
                        <div class="summary-item">
                            <strong>Part-Time:</strong> ${summary.partTimeStats.present}/${summary.partTimeStats.total}<br>
                            <strong>Rate:</strong> <span class="${summary.partTimeStats.rate >= 90 ? 'positive' : summary.partTimeStats.rate >= 80 ? 'warning' : 'negative'}">${summary.partTimeStats.rate}%</span>
                        </div>
                        <div class="summary-item">
                            <strong>Contractors:</strong> ${summary.contractorStats.present}/${summary.contractorStats.total}<br>
                            <strong>Rate:</strong> <span class="${summary.contractorStats.rate >= 90 ? 'positive' : summary.contractorStats.rate >= 80 ? 'warning' : 'negative'}">${summary.contractorStats.rate}%</span>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 20px;">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee ID</th>
                                <th>Employee Name</th>
                                <th>Department</th>
                                <th>Employment Type</th>
                                <th>Total Days</th>
                                <th>Present</th>
                                <th>Late</th>
                                <th>Half Days</th>
                                <th>Leave Days</th>
                                <th>Absent Days</th>
                                <th>Attendance Rate*</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${summaryReport.map(employee => {
                                // Calculate attendance rate excluding absent days
                                const workingDays = employee.totalDays - employee.absentDays;
                                const attendanceRate = workingDays > 0 
                                    ? Math.round((employee.presentDays / workingDays) * 100)
                                    : 0;
                                return `
                                    <tr>
                                        <td>${employee.employeeId}</td>
                                        <td>${employee.employeeName}</td>
                                        <td>${employee.department}</td>
                                        <td>${employee.employmentType}</td>
                                        <td>${employee.totalDays}</td>
                                        <td>${employee.presentDays}</td>
                                        <td>${employee.lateDays}</td>
                                        <td>${employee.halfDays}</td>
                                        <td>${employee.leaveDays}</td>
                                        <td>${employee.absentDays}</td>
                                        <td class="${attendanceRate >= 90 ? 'positive' : attendanceRate >= 80 ? 'warning' : 'negative'}">
                                            ${attendanceRate}%
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                            <tr class="total-row">
                                <td colspan="4"><strong>Totals:</strong></td>
                                <td><strong>${totalDays}</strong></td>
                                <td><strong>${totalPresent}</strong></td>
                                <td><strong>${totalLate}</strong></td>
                                <td><strong>${totalHalfDays}</strong></td>
                                <td><strong>${totalLeave}</strong></td>
                                <td><strong>${totalAbsent}</strong></td>
                                <td><strong class="${overallAttendanceRate >= 90 ? 'positive' : overallAttendanceRate >= 80 ? 'warning' : 'negative'}">
                                    ${overallAttendanceRate}%
                                </strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="summary-section" style="margin-top: 20px;">
                    <strong>Notes:</strong>
                    <ul style="margin-top: 10px;">
                        <li>*Attendance Rate = (Present Days / (Total Days - Absent Days)) × 100</li>
                        <li>Half days count as 0.5 for attendance rate calculation</li>
                        <li>Late days are included in present days count</li>
                        <li>Leave days include annual, sick, and other leave types</li>
                        <li>Attendance rate excludes absent days from total days</li>
                        <li>Total days include all tracked days (Present, Late, Half-day, Leave, Absent)</li>
                    </ul>
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

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const tableHtml = tableRef.current?.innerHTML || '';
        
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Attendance Report</title>
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
                    .summary-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 10px;
                        margin-top: 10px;
                    }
                    .summary-item {
                        padding: 8px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        background-color: white;
                    }
                    .positive { color: green; font-weight: bold; }
                    .negative { color: red; font-weight: bold; }
                    .warning { color: orange; font-weight: bold; }
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
                        .header, .summary, .print-info {
                            font-family: "Times New Roman", Times, serif;
                            line-height: 1.0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="report-title">Attendance Management Report</div>
                    <div class="report-title">${formatDisplayDate(new Date().toString())}</div>
                </div>
                
                <div class="print-info">
                    <div><strong>Printed on:</strong> ${formatDisplayDate(new Date().toString())} ${new Date().toLocaleTimeString()}</div>
                    <div><strong>Total Records:</strong> ${filteredRecords.length}</div>
                </div>

                <div>
                    ${tableHtml}
                </div>

                <div class="summary">
                    <strong>Attendance Summary:</strong>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <strong>Total Employees:</strong> ${summary.totalEmployees}<br>
                            <strong>Total Records:</strong> ${filteredRecords.length}
                        </div>
                        <div class="summary-item">
                            <strong>Present:</strong> <span class="positive">${summary.totalPresent}</span><br>
                            <strong>Absent:</strong> <span class="negative">${summary.totalAbsent}</span><br>
                            <strong>Late:</strong> <span class="warning">${summary.totalLate}</span>
                        </div>
                        <div class="summary-item">
                            <strong>Half Day:</strong> ${summary.totalHalfDay}<br>
                            <strong>On Leave:</strong> ${summary.totalOnLeave}<br>
                            <strong>Attendance Rate:</strong> <span class="${summary.attendanceRate >= 90 ? 'positive' : summary.attendanceRate >= 80 ? 'warning' : 'negative'}">${summary.attendanceRate}%</span>
                        </div>
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

    // Format time to HH:MM AM/PM
    const formatDisplayTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

    // Format datetime for API (ISO string)
    const formatDateTimeForAPI = (date) => {
        if (!date) return '';
        return new Date(date).toISOString();
    };

    // Custom DatePicker component that opens calendar when any part is clicked
    const CustomDatePicker = ({ label, value, onChange, error, required = false, disabled = false, maxDate = getCurrentDate(), ...props }) => {
        const [open, setOpen] = useState(false);
        
        return (
            <DatePicker
                label={label}
                value={value || null}
                onChange={onChange}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                maxDate={maxDate}
                disableFuture
                renderInput={(params) => (
                    <TextField
                        {...params}
                        fullWidth
                        size="small"
                        error={!!error}
                        helperText={error}
                        required={required}
                        disabled={disabled}
                        onClick={() => !disabled && setOpen(true)}
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <IconButton
                                    size="small"
                                    onClick={() => !disabled && setOpen(true)}
                                    disabled={disabled}
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

    // Custom TimePicker component
    const CustomTimePicker = ({ label, value, onChange, disabled = false, ...props }) => {
        const [open, setOpen] = useState(false);
        
        return (
            <TimePicker
                label={label}
                value={value || null}
                onChange={onChange}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        fullWidth
                        size="small"
                        disabled={disabled}
                        onClick={() => !disabled && setOpen(true)}
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <IconButton
                                    size="small"
                                    onClick={() => !disabled && setOpen(true)}
                                    disabled={disabled}
                                    sx={{ padding: '4px' }}
                                >
                                    <AccessTimeIcon fontSize="small" />
                                </IconButton>
                            )
                        }}
                    />
                )}
                {...props}
            />
        );
    };

    // Get status chip color
    const getStatusColor = (status) => {
        switch (status) {
            case 'Present': return 'success';
            case 'Absent': return 'error';
            case 'Late': return 'warning';
            case 'Half-day': return 'info';
            case 'Annual Leave': return 'primary';
            case 'Sick Leave': return 'secondary';
            case 'Other Leave': return 'default';
            default: return 'default';
        }
    };

    // Get status icon
    const getStatusIcon = (status) => {
        switch (status) {
            case 'Present': return <PresentIcon fontSize="small" />;
            case 'Absent': return <AbsentIcon fontSize="small" />;
            case 'Late': return <LateIcon fontSize="small" />;
            case 'Half-day': return <HalfDayIcon fontSize="small" />;
            case 'Annual Leave':
            case 'Sick Leave':
            case 'Other Leave': return <LeaveIcon fontSize="small" />;
            default: return null;
        }
    };

    // Filter employees based on search
    const filteredEmployees = employees.filter(employee => {
        if (!employeeSearch) return true;
        const searchLower = employeeSearch.toLowerCase();
        const identifier = employee.employeeId || '';
        return (
            identifier.toLowerCase().includes(searchLower) ||
            (employee.firstName && employee.firstName.toLowerCase().includes(searchLower)) ||
            (employee.lastName && employee.lastName.toLowerCase().includes(searchLower)) ||
            (employee.fullName && employee.fullName.toLowerCase().includes(searchLower)) ||
            (employee.departmentName && employee.departmentName.toLowerCase().includes(searchLower))
        );
    });

    // Check if any filters are active
    const hasActiveFilters = () => {
        return (
            filters.employeeId !== '' ||
            filters.employeeName !== '' ||
            filters.department !== '' ||
            filters.status !== '' ||
            filters.employmentType !== '' ||
            filters.startDate !== null ||
            filters.endDate !== null
        );
    };

    // Tab change handler
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Simplified date display for table cells
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

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 2 }}>
                {/* Header with Action Buttons - Updated to match PettyCash style */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            Attendance Management
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Track employee attendance and leave records
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
                        <Tooltip title="Bulk Delete by Date Range">
                            <IconButton
                                color="error"
                                onClick={handleOpenBulkDeleteDialog}
                                size="small"
                            >
                                <DeleteSweepIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Mark Attendance for Date Range">
                            <IconButton
                                color="secondary"
                                onClick={handleOpenBulkRangeDialog}
                                size="small"
                            >
                                <DateRangeIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Mark Bulk Attendance">
                            <IconButton
                                color="primary"
                                onClick={handleOpenBulkDialog}
                                size="small"
                            >
                                <GroupAddIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenDialog}
                            size="small"
                            sx={{ ml: 1 }}
                        >
                            Add Record
                        </Button>
                    </Box>
                </Box>

                {/* Tabs - Made more compact */}
                <Paper sx={{ mb: 2 }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        indicatorColor="primary"
                        textColor="primary"
                        variant="fullWidth"
                        sx={{ minHeight: '36px' }}
                    >
                        <Tab 
                            label="Attendance Records" 
                            icon={<PeopleIcon fontSize="small" />}
                            iconPosition="start"
                            sx={{ minHeight: '36px', py: 0.5 }}
                        />
                        <Tab 
                            label="Summary Report" 
                            icon={<SummaryIcon fontSize="small" />}
                            iconPosition="start"
                            sx={{ minHeight: '36px', py: 0.5 }}
                        />
                        <Tab 
                            label="Recent Entries" 
                            icon={<HistoryIcon fontSize="small" />}
                            iconPosition="start"
                            sx={{ minHeight: '36px', py: 0.5 }}
                        />
                    </Tabs>
                </Paper>

                {/* Loading Indicator */}
                {loading && (
                    <LinearProgress sx={{ mb: 2 }} />
                )}

                {activeTab === 0 ? (
                    <>
                        {/* Summary Cards - Updated to match PettyCash style */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ minHeight: '80px' }}>
                                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <PresentIcon color="success" sx={{ mr: 1, fontSize: '1rem' }} />
                                            <Typography variant="body2" color="textSecondary">
                                                Present
                                            </Typography>
                                        </Box>
                                        <Typography variant="h6" color="success">
                                            {summary.totalPresent}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {summary.totalPresent > 0 ? `${Math.round((summary.totalPresent / filteredRecords.length) * 100)}% of records` : 'No records'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ minHeight: '80px' }}>
                                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <AbsentIcon color="error" sx={{ mr: 1, fontSize: '1rem' }} />
                                            <Typography variant="body2" color="textSecondary">
                                                Absent
                                            </Typography>
                                        </Box>
                                        <Typography variant="h6" color="error">
                                            {summary.totalAbsent}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {summary.totalAbsent > 0 ? `${Math.round((summary.totalAbsent / filteredRecords.length) * 100)}% of records` : 'No records'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ minHeight: '80px' }}>
                                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <LeaveIcon color="primary" sx={{ mr: 1, fontSize: '1rem' }} />
                                            <Typography variant="body2" color="textSecondary">
                                                On Leave
                                            </Typography>
                                        </Box>
                                        <Typography variant="h6" color="primary">
                                            {summary.totalOnLeave}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            Annual: {summary.totalAnnualLeave}, Sick: {summary.totalSickLeave}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ minHeight: '80px' }}>
                                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <BalanceIcon 
                                                color={summary.attendanceRate >= 90 ? 'success' : summary.attendanceRate >= 80 ? 'warning' : 'error'} 
                                                sx={{ mr: 1, fontSize: '1rem' }} 
                                            />
                                            <Typography variant="body2" color="textSecondary">
                                                Attendance Rate
                                            </Typography>
                                        </Box>
                                        <Typography 
                                            variant="h6" 
                                            color={summary.attendanceRate >= 90 ? 'success' : summary.attendanceRate >= 80 ? 'warning' : 'error'}
                                        >
                                            {summary.attendanceRate}%
                                        </Typography>
                                        {summary.attendanceRate < 80 && (
                                            <Alert severity="warning" sx={{ mt: 0.5, p: 0.5, fontSize: '0.7rem' }}>
                                                Low attendance rate!
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Filters - Updated to match PettyCash style */}
                        {showFilters && (
                            <Paper sx={{ p: 1.5, mb: 2 }}>
                                <Grid container spacing={1} alignItems="center">
                                    <Grid item xs={12} sm={6} md={2}>
                                        <TextField
                                            fullWidth
                                            label="Employee ID"
                                            value={filters.employeeId}
                                            onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                                            placeholder="Search ID..."
                                            size="small"
                                            InputProps={{
                                                endAdornment: filters.employeeId && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleFilterChange('employeeId', '')}
                                                        sx={{ mr: -1 }}
                                                    >
                                                        <ClearIcon fontSize="small" />
                                                    </IconButton>
                                                )
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
                                        <TextField
                                            fullWidth
                                            label="Employee Name"
                                            value={filters.employeeName}
                                            onChange={(e) => handleFilterChange('employeeName', e.target.value)}
                                            placeholder="Search name..."
                                            size="small"
                                            InputProps={{
                                                endAdornment: filters.employeeName && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleFilterChange('employeeName', '')}
                                                        sx={{ mr: -1 }}
                                                    >
                                                        <ClearIcon fontSize="small" />
                                                    </IconButton>
                                                )
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Department"
                                            value={filters.department}
                                            onChange={(e) => handleFilterChange('department', e.target.value)}
                                            size="small"
                                            InputProps={{
                                                endAdornment: filters.department && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleFilterChange('department', '')}
                                                        sx={{ mr: -1 }}
                                                    >
                                                        <ClearIcon fontSize="small" />
                                                    </IconButton>
                                                )
                                            }}
                                        >
                                            <MenuItem value="">All Departments</MenuItem>
                                            {departments.map((dept, index) => (
                                                <MenuItem key={index} value={dept}>
                                                    {dept}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
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
                                                <MenuItem key={status.value} value={status.value}>
                                                    {status.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Employment Type"
                                            value={filters.employmentType}
                                            onChange={(e) => handleFilterChange('employmentType', e.target.value)}
                                            size="small"
                                            InputProps={{
                                                endAdornment: filters.employmentType && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleFilterChange('employmentType', '')}
                                                        sx={{ mr: -1 }}
                                                    >
                                                        <ClearIcon fontSize="small" />
                                                    </IconButton>
                                                )
                                            }}
                                        >
                                            <MenuItem value="">All Types</MenuItem>
                                            {employmentTypes.map((type, index) => (
                                                <MenuItem key={index} value={type}>
                                                    {type}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={1}>
                                        <CustomDatePicker
                                            label="Start Date"
                                            value={filters.startDate}
                                            onChange={(date) => handleFilterChange('startDate', date)}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={1}>
                                        <CustomDatePicker
                                            label="End Date"
                                            value={filters.endDate}
                                            onChange={(date) => handleFilterChange('endDate', date)}
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

                        {/* Active Filters Indicator - Updated to match PettyCash style */}
                        {hasActiveFilters() && !showFilters && (
                            <Paper sx={{ p: 1, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FilterIcon color="primary" fontSize="small" />
                                    <Typography variant="body2" color="textSecondary">
                                        Active Filters:
                                    </Typography>
                                    {filters.employeeId && (
                                        <Chip
                                            label={`ID: ${filters.employeeId}`}
                                            size="small"
                                            onDelete={() => handleFilterChange('employeeId', '')}
                                        />
                                    )}
                                    {filters.employeeName && (
                                        <Chip
                                            label={`Name: ${filters.employeeName}`}
                                            size="small"
                                            onDelete={() => handleFilterChange('employeeName', '')}
                                        />
                                    )}
                                    {filters.department && (
                                        <Chip
                                            label={`Dept: ${filters.department}`}
                                            size="small"
                                            onDelete={() => handleFilterChange('department', '')}
                                        />
                                    )}
                                    {filters.status && (
                                        <Chip
                                            label={`Status: ${filters.status}`}
                                            size="small"
                                            onDelete={() => handleFilterChange('status', '')}
                                        />
                                    )}
                                    {filters.employmentType && (
                                        <Chip
                                            label={`Type: ${filters.employmentType}`}
                                            size="small"
                                            onDelete={() => handleFilterChange('employmentType', '')}
                                        />
                                    )}
                                    {filters.startDate && (
                                        <Chip
                                            label={`From: ${formatDisplayDate(filters.startDate)}`}
                                            size="small"
                                            onDelete={() => handleFilterChange('startDate', null)}
                                        />
                                    )}
                                    {filters.endDate && (
                                        <Chip
                                            label={`To: ${formatDisplayDate(filters.endDate)}`}
                                            size="small"
                                            onDelete={() => handleFilterChange('endDate', null)}
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

                        {/* Attendance Table - Updated styling */}
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
                                                minWidth: '100px',
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
                                            }}>Employee ID</TableCell>
                                            <TableCell sx={{ 
                                                padding: '6px 8px', 
                                                fontWeight: 'bold',
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.8125rem',
                                                backgroundColor: '#f5f5f5',
                                                position: 'sticky',
                                                top: 0,
                                                zIndex: 1
                                            }}>Employee Name</TableCell>
                                            <TableCell sx={{ 
                                                padding: '6px 8px', 
                                                fontWeight: 'bold',
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.8125rem',
                                                backgroundColor: '#f5f5f5',
                                                position: 'sticky',
                                                top: 0,
                                                zIndex: 1
                                            }}>Department</TableCell>
                                            <TableCell sx={{ 
                                                padding: '6px 8px', 
                                                fontWeight: 'bold',
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.8125rem',
                                                backgroundColor: '#f5f5f5',
                                                position: 'sticky',
                                                top: 0,
                                                zIndex: 1
                                            }}>Emp. Type</TableCell>
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
                                            }}>Work Hours</TableCell>
                                            <TableCell sx={{ 
                                                padding: '6px 8px', 
                                                fontWeight: 'bold',
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.8125rem',
                                                backgroundColor: '#f5f5f5',
                                                position: 'sticky',
                                                top: 0,
                                                zIndex: 1
                                            }}>Overtime</TableCell>
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
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                                                    <LinearProgress sx={{ width: '100%' }} />
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredRecords.length > 0 ? (
                                            filteredRecords.map((record) => (
                                                <TableRow 
                                                    key={record._id} 
                                                    hover
                                                    sx={{ 
                                                        height: '36px',
                                                        cursor: 'pointer',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                                        }
                                                    }}
                                                    onClick={() => handleEdit(record)}
                                                >
                                                    <TableCell sx={{ 
                                                        padding: '4px 8px',
                                                        whiteSpace: 'nowrap',
                                                        minWidth: '100px'
                                                    }}>
                                                        <DateDisplayCell date={record.date} />
                                                    </TableCell>
                                                    <TableCell sx={{ 
                                                        padding: '4px 8px',
                                                        whiteSpace: 'nowrap',
                                                        fontSize: '0.8125rem'
                                                    }}>{record.employeeId}</TableCell>
                                                    <TableCell sx={{ 
                                                        padding: '4px 8px',
                                                        whiteSpace: 'nowrap',
                                                        fontSize: '0.8125rem'
                                                    }}>{record.employeeName}</TableCell>
                                                    <TableCell sx={{ 
                                                        padding: '4px 8px',
                                                        whiteSpace: 'nowrap',
                                                        fontSize: '0.8125rem'
                                                    }}>{record.department}</TableCell>
                                                    <TableCell sx={{ 
                                                        padding: '4px 8px',
                                                        whiteSpace: 'nowrap',
                                                        fontSize: '0.8125rem'
                                                    }}>{record.employmentType || 'Full-Time'}</TableCell>
                                                    <TableCell sx={{ 
                                                        padding: '4px 8px',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        <Chip 
                                                            label={record.status} 
                                                            color={getStatusColor(record.status)}
                                                            size="small" 
                                                            icon={getStatusIcon(record.status)}
                                                            sx={{ 
                                                                height: '20px', 
                                                                fontSize: '0.75rem',
                                                                '& .MuiChip-label': {
                                                                    px: 0.75,
                                                                    py: 0.25
                                                                }
                                                            }}
                                                        />
                                                        {record.leaveType && record.leaveType !== 'None' && (
                                                            <Typography variant="caption" color="textSecondary" sx={{ ml: 0.5 }}>
                                                                ({record.leaveType})
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell sx={{ 
                                                        padding: '4px 8px',
                                                        whiteSpace: 'nowrap',
                                                        fontSize: '0.8125rem'
                                                    }}>
                                                        {record.totalHours ? `${record.totalHours}h` : 'N/A'}
                                                    </TableCell>
                                                    <TableCell sx={{ 
                                                        padding: '4px 8px',
                                                        whiteSpace: 'nowrap',
                                                        fontSize: '0.8125rem'
                                                    }}>
                                                        {record.overtime > 0 ? `${record.overtime}h` : '-'}
                                                    </TableCell>
                                                    <TableCell sx={{ 
                                                        padding: '4px 8px',
                                                        whiteSpace: 'nowrap'
                                                    }} onClick={(e) => e.stopPropagation()}>
                                                        <Box sx={{ display: 'flex', gap: 0.25 }}>
                                                            <Tooltip title="Edit">
                                                                <IconButton 
                                                                    size="small" 
                                                                    color="primary"
                                                                    onClick={() => handleEdit(record)}
                                                                    sx={{ padding: '4px' }}
                                                                >
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Delete">
                                                                <IconButton 
                                                                    size="small" 
                                                                    color="error"
                                                                    onClick={() => handleDelete(record)}
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
                                                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                                                    <Typography color="textSecondary">
                                                        No attendance records found
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Scroll indicator */}
                            {filteredRecords.length > 10 && (
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
                                        Scroll to see more records
                                    </Typography>
                                    <KeyboardArrowDownIcon fontSize="small" color="action" />
                                </Box>
                            )}
                        </Box>

                        {/* Record Count and Status */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="body2" color="textSecondary">
                                Showing {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
                                {hasActiveFilters() && ' (filtered)'}
                            </Typography>
                            
                            <Typography variant="body2" color="textSecondary">
                                Total: {attendanceRecords.length} records
                            </Typography>
                        </Box>
                    </>
                ) : activeTab === 1 ? (
                    /* Summary Report Tab - Simplified */
                    <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6">
                                Attendance Summary Report
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<PrintIcon />}
                                onClick={handlePrintSummaryReport}
                                size="small"
                            >
                                Print Report
                            </Button>
                        </Box>

                        {/* Overall Summary - Simplified */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={4}>
                                <Card sx={{ minHeight: '80px' }}>
                                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <BalanceIcon 
                                                color={summary.attendanceRate >= 90 ? 'success' : summary.attendanceRate >= 80 ? 'warning' : 'error'} 
                                                sx={{ mr: 1, fontSize: '1rem' }} 
                                            />
                                            <Typography variant="body2" color="textSecondary">
                                                Overall Attendance Rate
                                            </Typography>
                                        </Box>
                                        <Typography 
                                            variant="h6" 
                                            color={summary.attendanceRate >= 90 ? 'success' : summary.attendanceRate >= 80 ? 'warning' : 'error'}
                                        >
                                            {summary.attendanceRate}%
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            Based on {filteredRecords.length} total records
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <Card sx={{ minHeight: '80px' }}>
                                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                            By Employment Type
                                        </Typography>
                                        <Grid container spacing={1}>
                                            <Grid item xs={4}>
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="h6" color="primary">
                                                        {summary.fullTimeStats.rate}%
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Full-Time
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                                        {summary.fullTimeStats.present}/{summary.fullTimeStats.total}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="h6" color="secondary">
                                                        {summary.partTimeStats.rate}%
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Part-Time
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                                        {summary.partTimeStats.present}/{summary.partTimeStats.total}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="h6" color="success">
                                                        {summary.contractorStats.rate}%
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Contractors
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                                        {summary.contractorStats.present}/{summary.contractorStats.total}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Employee Summary Table */}
                        <Typography variant="subtitle1" gutterBottom>
                            Employee Attendance Summary
                        </Typography>
                        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Employee</TableCell>
                                        <TableCell>Department</TableCell>
                                        <TableCell>Emp. Type</TableCell>
                                        <TableCell align="right">Total Days</TableCell>
                                        <TableCell align="right">Present</TableCell>
                                        <TableCell align="right">Late</TableCell>
                                        <TableCell align="right">Half Days</TableCell>
                                        <TableCell align="right">Leave Days</TableCell>
                                        <TableCell align="right">Absent Days</TableCell>
                                        <TableCell align="right">Attendance Rate*</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {summaryReport.length > 0 ? (
                                        summaryReport.map((employee, index) => {
                                            // Calculate attendance rate excluding absent days
                                            const workingDays = employee.totalDays - employee.absentDays;
                                            const attendanceRate = workingDays > 0 
                                                ? Math.round((employee.presentDays / workingDays) * 100)
                                                : 0;
                                            return (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                                                            {employee.employeeName}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            ID: {employee.employeeId}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: '0.8125rem' }}>{employee.department}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.8125rem' }}>{employee.employmentType}</TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '0.8125rem' }}>{employee.totalDays}</TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '0.8125rem' }}>{employee.presentDays}</TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '0.8125rem' }}>{employee.lateDays}</TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '0.8125rem' }}>{employee.halfDays}</TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '0.8125rem' }}>{employee.leaveDays}</TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '0.8125rem' }}>{employee.absentDays}</TableCell>
                                                    <TableCell align="right">
                                                        <Chip 
                                                            label={`${attendanceRate}%`}
                                                            size="small"
                                                            color={attendanceRate >= 90 ? 'success' : attendanceRate >= 80 ? 'warning' : 'error'}
                                                            variant="outlined"
                                                            sx={{ fontSize: '0.75rem' }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                                                <Typography color="textSecondary">
                                                    No attendance data available
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Report Notes */}
                        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Report Notes:
                            </Typography>
                            <ul style={{ margin: 0, paddingLeft: 20 }}>
                                <li>
                                    <Typography variant="body2">
                                        *Attendance Rate = (Present Days / (Total Days - Absent Days)) × 100
                                    </Typography>
                                </li>
                                <li>
                                    <Typography variant="body2">
                                        Half days count as 0.5 for attendance rate calculation
                                    </Typography>
                                </li>
                                <li>
                                    <Typography variant="body2">
                                        Late days are included in present days count
                                    </Typography>
                                </li>
                                <li>
                                    <Typography variant="body2">
                                        Leave days include annual, sick, and other leave types
                                    </Typography>
                                </li>
                            </ul>
                        </Box>
                    </Paper>
                ) : (
                    /* Recent Entries Tab - Simplified */
                    <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6">
                                Recent Attendance Entries
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Showing latest 5 records
                            </Typography>
                        </Box>

                        {recentRecords.length > 0 ? (
                            <List sx={{ py: 0 }}>
                                {recentRecords.map((record, index) => (
                                    <React.Fragment key={record._id}>
                                        <ListItem 
                                            alignItems="flex-start"
                                            sx={{
                                                backgroundColor: index % 2 === 0 ? 'action.hover' : 'transparent',
                                                borderRadius: 1,
                                                mb: 1,
                                                py: 1
                                            }}
                                        >
                                            <ListItemAvatar sx={{ minWidth: 40 }}>
                                                <Avatar sx={{ 
                                                    bgcolor: getStatusColor(record.status),
                                                    width: 32,
                                                    height: 32 
                                                }}>
                                                    {getStatusIcon(record.status)}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography variant="subtitle2">
                                                            {record.employeeName} ({record.employeeId})
                                                        </Typography>
                                                        <Chip 
                                                            label={record.status}
                                                            color={getStatusColor(record.status)}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ height: '20px', fontSize: '0.75rem' }}
                                                        />
                                                    </Box>
                                                }
                                                secondary={
                                                    <React.Fragment>
                                                        <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                                                            <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.8125rem' }}>
                                                                <strong>Date:</strong> {formatDisplayDate(record.date)}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.8125rem' }}>
                                                                <strong>Department:</strong> {record.department}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.8125rem' }}>
                                                                <strong>Type:</strong> {record.employmentType}
                                                            </Typography>
                                                        </Box>
                                                    </React.Fragment>
                                                }
                                            />
                                            <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                                                <Tooltip title="Edit">
                                                    <IconButton 
                                                        size="small" 
                                                        color="primary"
                                                        onClick={() => handleEdit(record)}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton 
                                                        size="small" 
                                                        color="error"
                                                        onClick={() => handleDelete(record)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </ListItem>
                                        {index < recentRecords.length - 1 && <Divider variant="inset" component="li" />}
                                    </React.Fragment>
                                ))}
                            </List>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body1" color="textSecondary" gutterBottom>
                                    No recent attendance entries found
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={handleOpenDialog}
                                    sx={{ mt: 2 }}
                                    size="small"
                                >
                                    Add First Attendance Record
                                </Button>
                            </Box>
                        )}
                    </Paper>
                )}

                {/* Add/Edit Attendance Dialog - Styled like PettyCash */}
                <Dialog 
                    open={openDialog} 
                    onClose={handleCloseDialog}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        {editMode ? 'Edit Attendance Record' : 'Add New Attendance Record'}
                        {!editMode && (
                            <Alert severity="info" sx={{ mt: 1, fontSize: '0.75rem', py: 0.5 }}>
                                <Typography variant="body2">
                                    Note: Future dates beyond today cannot be selected for attendance entry.
                                </Typography>
                            </Alert>
                        )}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <Grid item xs={12} md={6}>
                                <CustomDatePicker
                                    label="Attendance Date"
                                    value={formData.date}
                                    onChange={(date) => handleInputChange('date', date)}
                                    error={!!errors.date}
                                    required
                                    maxDate={getCurrentDate()}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth error={!!errors.employeeId} required size="small">
                                    <InputLabel>Employee</InputLabel>
                                    <Select
                                        value={formData.employeeId}
                                        label="Employee"
                                        onChange={(e) => handleInputChange('employeeId', e.target.value)}
                                        disabled={editMode}
                                        renderValue={(selected) => {
                                            const employee = employees.find(emp => emp.employeeId === selected);
                                            return employee ? 
                                                `${employee.employeeId} - ${employee.fullName}` : 
                                                selected;
                                        }}
                                    >
                                        <MenuItem value="">Select Employee</MenuItem>
                                        {employees.map(employee => (
                                            <MenuItem key={employee.employeeId} value={employee.employeeId}>
                                                {employee.employeeId} - {employee.fullName}
                                                {employee.departmentName && ` (${employee.departmentName})`}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.employeeId && (
                                        <Typography variant="caption" color="error">
                                            {errors.employeeId}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Employee Name"
                                    value={formData.employeeName}
                                    disabled
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Department"
                                    value={formData.department}
                                    disabled
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Employment Type"
                                    value={formData.employmentType}
                                    disabled
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth error={!!errors.status} required size="small">
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={formData.status}
                                        label="Status"
                                        onChange={(e) => handleInputChange('status', e.target.value)}
                                    >
                                        {statusOptions.map(status => (
                                            <MenuItem key={status.value} value={status.value}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {status.icon}
                                                    {status.label}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.status && (
                                        <Typography variant="caption" color="error">
                                            {errors.status}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>
                            {(formData.status === 'Annual Leave' || formData.status === 'Sick Leave' || formData.status === 'Other Leave') && (
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth error={!!errors.leaveType} required size="small">
                                        <InputLabel>Leave Type</InputLabel>
                                        <Select
                                            value={formData.leaveType}
                                            label="Leave Type"
                                            onChange={(e) => handleInputChange('leaveType', e.target.value)}
                                        >
                                            {leaveTypes.map(type => (
                                                <MenuItem key={type} value={type}>
                                                    {type}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.leaveType && (
                                            <Typography variant="caption" color="error">
                                                {errors.leaveType}
                                            </Typography>
                                        )}
                                </FormControl>
                                </Grid>
                            )}
                            {(formData.status === 'Present' || formData.status === 'Late' || formData.status === 'Half-day') && (
                                <>
                                    <Grid item xs={12} md={6}>
                                        <CustomTimePicker
                                            label="Check In Time"
                                            value={formData.checkIn}
                                            onChange={(time) => handleInputChange('checkIn', time)}
                                            disabled={formData.status === 'Half-day'}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <CustomTimePicker
                                            label="Check Out Time"
                                            value={formData.checkOut}
                                            onChange={(time) => handleInputChange('checkOut', time)}
                                            disabled={formData.status === 'Half-day'}
                                        />
                                    </Grid>
                                </>
                            )}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Notes"
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
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
                            disabled={submitting || isFutureDate(formData.date)}
                            size="small"
                        >
                            {submitting ? 'Saving...' : (editMode ? 'Update Record' : 'Save Record')}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Bulk Attendance Dialog - Styled like PettyCash */}
                <Dialog 
                    open={bulkDialog} 
                    onClose={handleCloseBulkDialog}
                    maxWidth="lg"
                    fullWidth
                >
                    <DialogTitle>
                        Mark Attendance for Multiple Employees
                        <Alert severity="info" sx={{ mt: 1, fontSize: '0.75rem', py: 0.5 }}>
                            <Typography variant="body2">
                                Note: Future dates beyond today cannot be selected for attendance entry.
                            </Typography>
                        </Alert>
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <Grid item xs={12} md={6}>
                                <CustomDatePicker
                                    label="Attendance Date"
                                    value={bulkFormData.date}
                                    onChange={(date) => handleBulkInputChange('date', date)}
                                    error={!!errors.date}
                                    required
                                    maxDate={getCurrentDate()}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth error={!!errors.status} required size="small">
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={bulkFormData.status}
                                        label="Status"
                                        onChange={(e) => handleBulkInputChange('status', e.target.value)}
                                    >
                                        {statusOptions.map(status => (
                                            <MenuItem key={status.value} value={status.value}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {status.icon}
                                                    {status.label}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.status && (
                                        <Typography variant="caption" color="error">
                                            {errors.status}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>
                            {(bulkFormData.status === 'Annual Leave' || bulkFormData.status === 'Sick Leave' || bulkFormData.status === 'Other Leave') && (
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth error={!!errors.leaveType} required size="small">
                                        <InputLabel>Leave Type</InputLabel>
                                        <Select
                                            value={bulkFormData.leaveType}
                                            label="Leave Type"
                                            onChange={(e) => handleBulkInputChange('leaveType', e.target.value)}
                                        >
                                            {leaveTypes.map(type => (
                                                <MenuItem key={type} value={type}>
                                                    {type}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.leaveType && (
                                            <Typography variant="caption" color="error">
                                                {errors.leaveType}
                                            </Typography>
                                        )}
                                    </FormControl>
                                </Grid>
                            )}
                            {(bulkFormData.status === 'Present' || bulkFormData.status === 'Late' || bulkFormData.status === 'Half-day') && (
                                <>
                                    <Grid item xs={12} md={3}>
                                        <CustomTimePicker
                                            label="Check In Time"
                                            value={bulkFormData.checkIn}
                                            onChange={(time) => handleBulkInputChange('checkIn', time)}
                                            disabled={bulkFormData.status === 'Half-day'}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <CustomTimePicker
                                            label="Check Out Time"
                                            value={bulkFormData.checkOut}
                                            onChange={(time) => handleBulkInputChange('checkOut', time)}
                                            disabled={bulkFormData.status === 'Half-day'}
                                        />
                                    </Grid>
                                </>
                            )}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Notes (Optional)"
                                    value={bulkFormData.notes}
                                    onChange={(e) => handleBulkInputChange('notes', e.target.value)}
                                    multiline
                                    rows={2}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Paper sx={{ p: 2, maxHeight: '300px', overflow: 'auto' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="subtitle2">
                                            Select Employees ({selectedEmployees.length} selected)
                                        </Typography>
                                        <Box>
                                        <TextField
                                                size="small"
                                                placeholder="Search employees..."
                                                value={employeeSearch}
                                                onChange={(e) => setEmployeeSearch(e.target.value)}
                                                sx={{ width: 200, mr: 1 }}
                                                InputProps={{
                                                    startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                                                }}
                                            />
                                            <Button size="small" onClick={selectAllEmployees}>
                                                Select All
                                            </Button>
                                            <Button size="small" onClick={clearAllEmployees} sx={{ ml: 1 }}>
                                                Clear All
                                            </Button>
                                        </Box>
                                    </Box>
                                    {errors.employees && (
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {errors.employees}
                                        </Alert>
                                    )}
                                    {loadingEmployees ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                            <LinearProgress sx={{ width: '100%' }} />
                                        </Box>
                                    ) : filteredEmployees.length === 0 ? (
                                        <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 3 }}>
                                            No employees found
                                        </Typography>
                                    ) : (
                                        <Grid container spacing={1}>
                                            {filteredEmployees.map(employee => {
                                                const identifier = employee.employeeId;
                                                const isSelected = selectedEmployees.includes(identifier);
                                                
                                                return (
                                                    <Grid item xs={12} sm={6} md={4} key={employee._id}>
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onChange={(e) => handleEmployeeSelection(identifier, e.target.checked)}
                                                                    size="small"
                                                                />
                                                            }
                                                            label={
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                                                                        {employee.firstName?.charAt(0) || 'E'}
                                                                    </Avatar>
                                                                    <Box>
                                                                        <Typography variant="body2">
                                                                            {identifier}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="textSecondary">
                                                                            {employee.firstName} {employee.lastName}
                                                                            {employee.departmentName && ` • ${employee.departmentName}`}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                            }
                                                        />
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    )}
                                </Paper>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseBulkDialog} size="small">
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleBulkSubmit} 
                            variant="contained"
                            disabled={submitting || selectedEmployees.length === 0 || isFutureDate(bulkFormData.date)}
                            size="small"
                        >
                            {submitting ? 'Saving...' : `Mark Attendance for ${selectedEmployees.length} Employee(s)`}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Bulk Attendance Range Dialog */}
                <Dialog 
                    open={bulkRangeDialog} 
                    onClose={handleCloseBulkRangeDialog}
                    maxWidth="lg"
                    fullWidth
                >
                    <DialogTitle>
                        Mark Attendance for Multiple Employees (Date Range)
                        <Alert severity="info" sx={{ mt: 1, fontSize: '0.75rem', py: 0.5 }}>
                            <Typography variant="body2">
                                Note: Future dates beyond today cannot be selected for attendance entry.
                            </Typography>
                        </Alert>
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <Grid item xs={12} md={6}>
                                <CustomDatePicker
                                    label="Start Date"
                                    value={bulkRangeFormData.startDate}
                                    onChange={(date) => handleBulkRangeInputChange('startDate', date)}
                                    error={!!errors.startDate}
                                    required
                                    maxDate={getCurrentDate()}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomDatePicker
                                    label="End Date"
                                    value={bulkRangeFormData.endDate}
                                    onChange={(date) => handleBulkRangeInputChange('endDate', date)}
                                    error={!!errors.endDate}
                                    required
                                    maxDate={getCurrentDate()}
                                />
                            </Grid>
                            {errors.dateRange && (
                                <Grid item xs={12}>
                                    <Alert severity="error" sx={{ mt: 1 }}>
                                        {errors.dateRange}
                                    </Alert>
                                </Grid>
                            )}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth error={!!errors.status} required size="small">
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={bulkRangeFormData.status}
                                        label="Status"
                                        onChange={(e) => handleBulkRangeInputChange('status', e.target.value)}
                                    >
                                        {statusOptions.map(status => (
                                            <MenuItem key={status.value} value={status.value}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {status.icon}
                                                    {status.label}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.status && (
                                        <Typography variant="caption" color="error">
                                            {errors.status}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>
                            {(bulkRangeFormData.status === 'Annual Leave' || bulkRangeFormData.status === 'Sick Leave' || bulkRangeFormData.status === 'Other Leave') && (
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth error={!!errors.leaveType} required size="small">
                                        <InputLabel>Leave Type</InputLabel>
                                        <Select
                                            value={bulkRangeFormData.leaveType}
                                            label="Leave Type"
                                            onChange={(e) => handleBulkRangeInputChange('leaveType', e.target.value)}
                                        >
                                            {leaveTypes.map(type => (
                                                <MenuItem key={type} value={type}>
                                                    {type}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.leaveType && (
                                            <Typography variant="caption" color="error">
                                                {errors.leaveType}
                                            </Typography>
                                        )}
                                    </FormControl>
                                </Grid>
                            )}
                            {(bulkRangeFormData.status === 'Present' || bulkRangeFormData.status === 'Late' || bulkRangeFormData.status === 'Half-day') && (
                                <>
                                    <Grid item xs={12} md={3}>
                                        <CustomTimePicker
                                            label="Check In Time"
                                            value={bulkRangeFormData.checkIn}
                                            onChange={(time) => handleBulkRangeInputChange('checkIn', time)}
                                            disabled={bulkRangeFormData.status === 'Half-day'}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <CustomTimePicker
                                            label="Check Out Time"
                                            value={bulkRangeFormData.checkOut}
                                            onChange={(time) => handleBulkRangeInputChange('checkOut', time)}
                                            disabled={bulkRangeFormData.status === 'Half-day'}
                                        />
                                    </Grid>
                                </>
                            )}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Notes (Optional)"
                                    value={bulkRangeFormData.notes}
                                    onChange={(e) => handleBulkRangeInputChange('notes', e.target.value)}
                                    multiline
                                    rows={2}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Paper sx={{ p: 2, maxHeight: '300px', overflow: 'auto' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="subtitle2">
                                            Select Employees ({selectedEmployees.length} selected)
                                        </Typography>
                                        <Box>
                                            <TextField
                                                size="small"
                                                placeholder="Search employees..."
                                                value={employeeSearch}
                                                onChange={(e) => setEmployeeSearch(e.target.value)}
                                                sx={{ width: 200, mr: 1 }}
                                                InputProps={{
                                                    startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                                                }}
                                            />
                                            <Button size="small" onClick={selectAllEmployees}>
                                                Select All
                                            </Button>
                                            <Button size="small" onClick={clearAllEmployees} sx={{ ml: 1 }}>
                                                Clear All
                                            </Button>
                                        </Box>
                                    </Box>
                                    {errors.employees && (
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {errors.employees}
                                        </Alert>
                                    )}
                                    {loadingEmployees ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                            <LinearProgress sx={{ width: '100%' }} />
                                        </Box>
                                    ) : filteredEmployees.length === 0 ? (
                                        <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 3 }}>
                                            No employees found
                                        </Typography>
                                    ) : (
                                        <Grid container spacing={1}>
                                            {filteredEmployees.map(employee => {
                                                const identifier = employee.employeeId;
                                                const isSelected = selectedEmployees.includes(identifier);
                                                
                                                return (
                                                    <Grid item xs={12} sm={6} md={4} key={employee._id}>
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onChange={(e) => handleEmployeeSelection(identifier, e.target.checked)}
                                                                    size="small"
                                                                />
                                                            }
                                                            label={
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                                                                        {employee.firstName?.charAt(0) || 'E'}
                                                                    </Avatar>
                                                                    <Box>
                                                                        <Typography variant="body2">
                                                                            {identifier}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="textSecondary">
                                                                            {employee.firstName} {employee.lastName}
                                                                            {employee.departmentName && ` • ${employee.departmentName}`}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                            }
                                                        />
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    )}
                                </Paper>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseBulkRangeDialog} size="small">
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleBulkRangeSubmit} 
                            variant="contained"
                            color="secondary"
                            disabled={submitting || selectedEmployees.length === 0 || isFutureDate(bulkRangeFormData.startDate) || isFutureDate(bulkRangeFormData.endDate)}
                            size="small"
                        >
                            {submitting ? 'Processing...' : `Mark for ${selectedEmployees.length} Employee(s)`}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Bulk Delete Dialog */}
                <Dialog 
                    open={bulkDeleteDialog} 
                    onClose={handleCloseBulkDeleteDialog}
                    maxWidth="lg"
                    fullWidth
                >
                    <DialogTitle>
                        Bulk Delete Attendance Records by Date Range
                        <Alert severity="warning" sx={{ mt: 1, fontSize: '0.75rem', py: 0.5 }}>
                            <Typography variant="body2">
                                <strong>Warning:</strong> This action will permanently delete attendance records. This cannot be undone.
                            </Typography>
                        </Alert>
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <Grid item xs={12} md={6}>
                                <CustomDatePicker
                                    label="Start Date"
                                    value={bulkDeleteFormData.startDate}
                                    onChange={(date) => handleBulkDeleteFormChange('startDate', date)}
                                    error={!!errors.startDate}
                                    required
                                    maxDate={getCurrentDate()}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomDatePicker
                                    label="End Date"
                                    value={bulkDeleteFormData.endDate}
                                    onChange={(date) => handleBulkDeleteFormChange('endDate', date)}
                                    error={!!errors.endDate}
                                    required
                                    maxDate={getCurrentDate()}
                                />
                            </Grid>
                            {errors.dateRange && (
                                <Grid item xs={12}>
                                    <Alert severity="error" sx={{ mt: 1 }}>
                                        {errors.dateRange}
                                    </Alert>
                                </Grid>
                            )}
                            
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Department"
                                    value={bulkDeleteFormData.department}
                                    onChange={(e) => handleBulkDeleteFormChange('department', e.target.value)}
                                    size="small"
                                >
                                    <MenuItem value="">All Departments</MenuItem>
                                    {departments.map((dept, index) => (
                                        <MenuItem key={index} value={dept}>
                                            {dept}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Employment Type"
                                    value={bulkDeleteFormData.employmentType}
                                    onChange={(e) => handleBulkDeleteFormChange('employmentType', e.target.value)}
                                    size="small"
                                >
                                    <MenuItem value="">All Types</MenuItem>
                                    {employmentTypes.map((type, index) => (
                                        <MenuItem key={index} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Status"
                                    value={bulkDeleteFormData.status}
                                    onChange={(e) => handleBulkDeleteFormChange('status', e.target.value)}
                                    size="small"
                                >
                                    <MenuItem value="">All Status</MenuItem>
                                    {statusOptions.map(status => (
                                        <MenuItem key={status.value} value={status.value}>
                                            {status.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseBulkDeleteDialog} size="small">
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleBulkDeleteByDateRange} 
                            variant="contained"
                            color="error"
                            disabled={submitting || !bulkDeleteFormData.startDate || !bulkDeleteFormData.endDate}
                            size="small"
                        >
                            {submitting ? 'Deleting...' : `Delete Records`}
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
                            Are you sure you want to delete this attendance record?
                        </Typography>
                        {recordToDelete && (
                            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                                <Typography variant="body2">
                                    <strong>Date:</strong> {formatDisplayDate(recordToDelete.date)}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Employee:</strong> {recordToDelete.employeeName} ({recordToDelete.employeeId})
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Status:</strong> {recordToDelete.status}
                                </Typography>
                                {recordToDelete.leaveType && recordToDelete.leaveType !== 'None' && (
                                    <Typography variant="body2">
                                        <strong>Leave Type:</strong> {recordToDelete.leaveType}
                                    </Typography>
                                )}
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

export default AttendanceManagement;