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
    CircularProgress,
    Badge,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Collapse,
    TablePagination,
    RadioGroup,
    FormControlLabel,
    Radio
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
    KeyboardArrowDown as KeyboardArrowDownIcon,
    Person as PersonIcon,
    AttachMoney as MoneyIcon,
    Calculate as CalculateIcon,
    Receipt as ReceiptIcon,
    CheckCircle as CheckCircleIcon,
    People as PeopleIcon,
    PlaylistAddCheck as PlaylistAddCheckIcon,
    DeleteSweep as DeleteSweepIcon,
    Visibility as VisibilityIcon,
    Download as DownloadIcon,
    AccountBalanceWallet as WalletIcon,
    Savings as SavingsIcon,
    AccountTree as AccountTreeIcon,
    LocalAtm as LocalAtmIcon,
    Payments as PaymentsIcon,
    TrendingUp as TrendingUpIcon,
    Schedule as ScheduleIcon,
    MoneyOff as MoneyOffIcon,
    DoneAll as DoneAllIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    CheckBox as CheckBoxIcon,
    CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
    SelectAll as SelectAllIcon,
    Deselect as DeselectIcon,
    AccessTime as TimeIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    KeyboardArrowRight as KeyboardArrowRightIcon
} from '@mui/icons-material';

// Calculate working days between two dates (excluding weekends)
const calculateWorkingDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;
    
    // Ensure start date is before end date
    if (start > end) return 0;
    
    const current = new Date(start);
    while (current <= end) {
        const day = current.getDay();
        // Sunday = 0, Saturday = 6
        if (day !== 0 && day !== 6) {
            workingDays++;
        }
        current.setDate(current.getDate() + 1);
    }
    
    return workingDays;
};

const PayrollManagement = () => {
    const [payrolls, setPayrolls] = useState([]);
    const [filteredPayrolls, setFilteredPayrolls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totals, setTotals] = useState({
        totalGrossSalary: 0,
        totalDeductions: 0,
        totalNetSalary: 0,
        totalPayable: 0,
        totalIncomeTax: 0,
        totalEmployeePension: 0,
        totalEmployerPension: 0,
        totalCostSharing: 0,
        totalSalaryAdvance: 0,
        totalOvertimeAmount: 0
    });
    const [filters, setFilters] = useState({
        employeeId: '',
        employeeName: '',
        department: '',
        month: '',
        year: '',
        paymentStatus: '',
        isBulkGenerated: ''
    });
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentPayrollId, setCurrentPayrollId] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [payrollToDelete, setPayrollToDelete] = useState(null);
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
    const [employees, setEmployees] = useState([]);
    const [employeesLoading, setEmployeesLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [eligibilityData, setEligibilityData] = useState(null);
    const [eligibilityDialog, setEligibilityDialog] = useState(false);
    const [selectedTab, setSelectedTab] = useState(0);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
    const [bulkStatusDialog, setBulkStatusDialog] = useState(false);
    const [bulkPaymentStatus, setBulkPaymentStatus] = useState('Paid');
    const [bulkPaymentDate, setBulkPaymentDate] = useState(new Date());
    const [activeFiltersCount, setActiveFiltersCount] = useState(0);
    const [attendanceData, setAttendanceData] = useState(null);
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [detailedAttendance, setDetailedAttendance] = useState([]);
    const [payrollStartDate, setPayrollStartDate] = useState(new Date());
    const [payrollEndDate, setPayrollEndDate] = useState(new Date());
    const [banks, setBanks] = useState([]);
    
    // Overtime data states
    const [overtimeData, setOvertimeData] = useState([]);
    const [overtimeLoading, setOvertimeLoading] = useState(false);
    const [overtimeSummary, setOvertimeSummary] = useState({
        totalHours: 0,
        totalAmount: 0,
        regularHours: 0,
        regularAmount: 0,
        weekendHours: 0,
        weekendAmount: 0,
        holidayHours: 0,
        holidayAmount: 0,
        emergencyHours: 0,
        emergencyAmount: 0,
        nightHours: 0,
        nightAmount: 0
    });
    const [expandedOvertimeRows, setExpandedOvertimeRows] = useState([]);
    const [overtimePage, setOvertimePage] = useState(0);
    const [overtimeRowsPerPage, setOvertimeRowsPerPage] = useState(5);

    const tableRef = useRef();

    // Ethiopian Income Tax Brackets (Updated 2024 rates in ETB - per month)
    const INCOME_TAX_BRACKETS = [
        { min: 0, max: 600, rate: 0, deduction: 0, label: '0 - 600 ETB: 0%' },
        { min: 601, max: 1650, rate: 10, deduction: 60, label: '601 - 1,650 ETB: 10% minus 60' },
        { min: 1651, max: 3200, rate: 15, deduction: 142.5, label: '1,651 - 3,200 ETB: 15% minus 142.5' },
        { min: 3201, max: 5250, rate: 20, deduction: 302.5, label: '3,201 - 5,250 ETB: 20% minus 302.5' },
        { min: 5251, max: 7800, rate: 25, deduction: 565, label: '5,251 - 7,800 ETB: 25% minus 565' },
        { min: 7801, max: 10900, rate: 30, deduction: 955, label: '7,801 - 10,900 ETB: 30% minus 955' },
        { min: 10901, max: Infinity, rate: 35, deduction: 1500, label: 'Above 10,900 ETB: 35% minus 1500' }
    ];

    // Ethiopian Banks List
    const ETHIOPIAN_BANKS = [
        'CBE', 'COOP', 'BOA', 'NIB', 'Dashen', 'Abysinia', 'Seket', 'AIB', 
        'Zemen', 'Ahadu', 'Geda', 'Oromia', 'Global', 'Heberet', 'Abay', 'Addis', 
        'Berehan', 'Buna', 'DGB', 'Enat', 'Sinqee', 'Tsedey', 'Wegagen', 
        'ZamZam', 'Anbesa', 'Other'
    ];

    // Overtime type multipliers
    const OVERTIME_MULTIPLIERS = {
        'Regular': 1.5,
        'Weekend': 2.0,
        'Holiday': 2.5,
        'Emergency': 1.75,
        'Night': 1.75
    };

    // Overtime type colors
    const OVERTIME_TYPE_COLORS = {
        'Regular': 'primary',
        'Weekend': 'secondary',
        'Holiday': 'error',
        'Emergency': 'warning',
        'Night': 'info'
    };

    // Form state - Initialize with current working days
    const [formData, setFormData] = useState(() => {
        const currentDate = new Date();
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const workingDays = calculateWorkingDays(firstDay, lastDay);
        
        return {
            employeeId: '',
            employeeName: '',
            department: '',
            designation: '',
            payrollStartDate: firstDay,
            payrollEndDate: lastDay,
            payrollMonth: currentDate.getMonth() + 1,
            payrollYear: currentDate.getFullYear(),
            
            // Basic Salary
            monthlyBasicSalary: 0, // Annual salary / 12
            basicSalary: 0, // Actual salary based on attendance date range
            
            // Attendance
            attendanceDays: 0,
            presentDays: 0,
            absentDays: 0,
            leaveDays: 0,
            totalWorkingDays: workingDays,
            
            // Allowances
            housingAllowance: 0,
            transportAllowance: 0,
            mealAllowance: 0,
            medicalAllowance: 0,
            otherAllowances: 0,
            totalAllowances: 0,
            
            // Overtime - Detailed breakdown
            overtime125Hours: 0,
            overtime125Rate: 0,
            overtime125Amount: 0,
            
            overtime150Hours: 0,
            overtime150Rate: 0,
            overtime150Amount: 0,
            
            overtime175Hours: 0,
            overtime175Rate: 0,
            overtime175Amount: 0,
            
            overtime200Hours: 0,
            overtime200Rate: 0,
            overtime200Amount: 0,
            
            overtime250Hours: 0,
            overtime250Rate: 0,
            overtime250Amount: 0,
            
            totalOvertimeHours: 0,
            totalOvertimeAmount: 0,
            
            // Auto-calculated overtime fields from database
            autoOvertimeHours: 0,
            autoOvertimeAmount: 0,
            overtimeRecords: [],
            
            // Gross Salary
            grossSalary: 0,
            
            // Deductions
            incomeTaxEnabled: true,
            incomeTaxRate: 0,
            incomeTaxAmount: 0,
            
            pensionEnabled: true,
            employeePensionRate: 7,
            employeePensionAmount: 0,
            employerPensionRate: 11,
            employerPensionAmount: 0,
            
            // COST SHARING - NEW FIELD WITH YES/NO OPTION
            costSharingEnabled: false, // Default: No
            costSharingAmount: 0,
            
            salaryAdvance: 0,
            otherDeductions: 0,
            totalDeductions: 0,
            
            // Net Salary
            netSalary: 0,
            
            // Payment Details - Bank Information
            paymentStatus: 'Pending',
            paymentDate: new Date(),
            bankName: '',
            bank: '', // Main bank field from employee record
            accountNumber: '',
            
            // Approval
            preparedBy: '',
            approvedBy: '',
            remarks: '',
            
            // Tracking
            isBulkGenerated: false,
            
            // Attendance tracking
            attendanceSource: 'Manual',
            attendanceSyncStatus: 'Pending',
            
            // Employee status tracking
            employeeStatus: 'Active',
            employmentDate: null,
            terminationDate: null
        };
    });

    const [errors, setErrors] = useState({});

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
    const departments = ['HR', 'Finance', 'IT', 'Sales', 'Marketing', 'Operations', 'Admin'];
    const paymentStatuses = ['Pending', 'Paid', 'Processing', 'On Hold'];
    const bulkGenerationTypes = ['All Eligible Employees', 'Selected Employees Only'];
    const tabs = ['Payroll List', 'Bulk Operations', 'Reports'];
    const employmentStatuses = ['Active', 'Inactive', 'Terminated', 'On Leave'];
    const yesNoOptions = ['No', 'Yes']; // For cost sharing

    // Calculate daily rate based on monthly salary and date range
    const calculateDailyRate = (monthlySalary, startDate, endDate) => {
        const workingDays = calculateWorkingDays(startDate, endDate);
        return monthlySalary / 30; // Standard Ethiopian calculation: monthly salary ÷ 30 days
    };

    // Calculate hourly rate
    const calculateHourlyRate = (monthlySalary) => {
        return monthlySalary / 160; // 160 working hours per month (standard)
    };

    // Calculate actual salary based on attendance in date range
    const calculateActualSalary = (monthlySalary, presentDays, startDate, endDate) => {
        const dailyRate = calculateDailyRate(monthlySalary, startDate, endDate);
        return dailyRate * presentDays;
    };

    // UPDATED: Enhanced Ethiopian Income Tax Calculation (Monthly) - INCLUDES ALLOWANCES
    const calculateIncomeTax = (grossSalary) => {
        if (grossSalary <= 0) return 0;
        
        let tax = 0;
        
        for (const bracket of INCOME_TAX_BRACKETS) {
            if (grossSalary > bracket.min) {
                const taxableInBracket = Math.min(grossSalary, bracket.max) - bracket.min;
                tax = (taxableInBracket * bracket.rate) / 100;
                
                // Apply deduction for progressive tax calculation
                if (grossSalary <= bracket.max) {
                    tax = tax - bracket.deduction;
                    break;
                }
            }
        }
        
        // Ensure tax is not negative
        return Math.max(0, tax);
    };

    // Get applicable tax rate and bracket info
    const getApplicableTaxInfo = (grossSalary) => {
        for (const bracket of INCOME_TAX_BRACKETS) {
            if (grossSalary >= bracket.min && grossSalary <= bracket.max) {
                return {
                    rate: bracket.rate,
                    deduction: bracket.deduction,
                    label: bracket.label
                };
            } else if (grossSalary > bracket.max && bracket.max === Infinity) {
                return {
                    rate: bracket.rate,
                    deduction: bracket.deduction,
                    label: bracket.label
                };
            }
        }
        return { rate: 0, deduction: 0, label: 'Not applicable' };
    };

    // Fetch overtime data for selected employee and date range
    const fetchOvertimeData = async (employeeId, startDate, endDate) => {
        if (!employeeId || !startDate || !endDate) {
            setOvertimeData([]);
            setOvertimeSummary({
                totalHours: 0,
                totalAmount: 0,
                regularHours: 0,
                regularAmount: 0,
                weekendHours: 0,
                weekendAmount: 0,
                holidayHours: 0,
                holidayAmount: 0,
                emergencyHours: 0,
                emergencyAmount: 0,
                nightHours: 0,
                nightAmount: 0
            });
            return;
        }

        setOvertimeLoading(true);
        try {
            const formattedStartDate = formatDateForAPI(startDate);
            const formattedEndDate = formatDateForAPI(endDate);
            
            console.log('Fetching overtime data:', {
                employeeId,
                startDate: formattedStartDate,
                endDate: formattedEndDate
            });

            // Fetch approved overtime records for the employee in the date range
            const response = await fetch(
                `/api/overtimemanagements/employee/${employeeId}?` +
                `startDate=${formattedStartDate}&` +
                `endDate=${formattedEndDate}&` +
                `status=Approved,Paid`
            );
            
            if (response.ok) {
                const data = await response.json();
                console.log('Overtime data received:', data);
                
                let overtimeRecords = [];
                if (data.success && data.overtimeRecords) {
                    overtimeRecords = data.overtimeRecords;
                } else if (Array.isArray(data)) {
                    overtimeRecords = data;
                } else if (data.data && Array.isArray(data.data)) {
                    overtimeRecords = data.data;
                } else if (data.records && Array.isArray(data.records)) {
                    overtimeRecords = data.records;
                } else if (data.result && Array.isArray(data.result)) {
                    overtimeRecords = data.result;
                } else if (data.items && Array.isArray(data.items)) {
                    overtimeRecords = data.items;
                }
                
                // Filter only approved/paid records
                const approvedRecords = overtimeRecords.filter(record => 
                    record.status === 'Approved' || record.status === 'Paid'
                );
                
                setOvertimeData(approvedRecords);
                
                // Calculate overtime summary
                calculateOvertimeSummary(approvedRecords);
                
                // Update form data with auto-calculated overtime
                updateFormWithOvertime(approvedRecords);
                
            } else {
                console.warn('No overtime data found or error:', response.status);
                setOvertimeData([]);
                setOvertimeSummary({
                    totalHours: 0,
                    totalAmount: 0,
                    regularHours: 0,
                    regularAmount: 0,
                    weekendHours: 0,
                    weekendAmount: 0,
                    holidayHours: 0,
                    holidayAmount: 0,
                    emergencyHours: 0,
                    emergencyAmount: 0,
                    nightHours: 0,
                    nightAmount: 0
                });
            }
        } catch (error) {
            console.error('Error fetching overtime data:', error);
            setOvertimeData([]);
            showSnackbar('Error fetching overtime data', 'error');
        } finally {
            setOvertimeLoading(false);
        }
    };

    // Calculate overtime summary from records
    const calculateOvertimeSummary = (records) => {
        const summary = {
            totalHours: 0,
            totalAmount: 0,
            regularHours: 0,
            regularAmount: 0,
            weekendHours: 0,
            weekendAmount: 0,
            holidayHours: 0,
            holidayAmount: 0,
            emergencyHours: 0,
            emergencyAmount: 0,
            nightHours: 0,
            nightAmount: 0
        };

        records.forEach(record => {
            const hours = record.timeDetails?.hoursWorked || record.hoursWorked || 0;
            const amount = record.financials?.calculatedAmount || record.calculatedAmount || 0;
            const type = record.overtimeType || 'Regular';
            
            summary.totalHours += hours;
            summary.totalAmount += amount;
            
            switch(type) {
                case 'Regular':
                    summary.regularHours += hours;
                    summary.regularAmount += amount;
                    break;
                case 'Weekend':
                    summary.weekendHours += hours;
                    summary.weekendAmount += amount;
                    break;
                case 'Holiday':
                    summary.holidayHours += hours;
                    summary.holidayAmount += amount;
                    break;
                case 'Emergency':
                    summary.emergencyHours += hours;
                    summary.emergencyAmount += amount;
                    break;
                case 'Night':
                    summary.nightHours += hours;
                    summary.nightAmount += amount;
                    break;
                default:
                    summary.regularHours += hours;
                    summary.regularAmount += amount;
            }
        });

        setOvertimeSummary(summary);
        return summary;
    };

    // Update form data with auto-calculated overtime
    const updateFormWithOvertime = (records) => {
        if (records.length === 0) {
            setFormData(prev => ({
                ...prev,
                autoOvertimeHours: 0,
                autoOvertimeAmount: 0,
                overtimeRecords: []
            }));
            return;
        }

        const summary = calculateOvertimeSummary(records);
        
        // Map overtime types to the form fields
        const typeMapping = {
            'Regular': '150',
            'Weekend': '200',
            'Holiday': '250',
            'Emergency': '175',
            'Night': '175'
        };

        // Initialize type-specific hours
        const typeHours = {
            '125': 0,
            '150': 0,
            '175': 0,
            '200': 0,
            '250': 0
        };

        // Distribute hours based on overtime type
        records.forEach(record => {
            const hours = record.timeDetails?.hoursWorked || record.hoursWorked || 0;
            const type = record.overtimeType || 'Regular';
            const mappedType = typeMapping[type] || '150';
            
            if (typeHours[mappedType] !== undefined) {
                typeHours[mappedType] += hours;
            }
        });

        setFormData(prev => ({
            ...prev,
            autoOvertimeHours: summary.totalHours,
            autoOvertimeAmount: summary.totalAmount,
            overtimeRecords: records,
            
            // Update manual overtime fields with auto-calculated values
            overtime125Hours: typeHours['125'] || 0,
            overtime150Hours: typeHours['150'] || 0,
            overtime175Hours: typeHours['175'] || 0,
            overtime200Hours: typeHours['200'] || 0,
            overtime250Hours: typeHours['250'] || 0,
            
            // Calculate amounts based on rates
            overtime125Amount: (typeHours['125'] || 0) * (prev.overtime125Rate || 0),
            overtime150Amount: (typeHours['150'] || 0) * (prev.overtime150Rate || 0),
            overtime175Amount: (typeHours['175'] || 0) * (prev.overtime175Rate || 0),
            overtime200Amount: (typeHours['200'] || 0) * (prev.overtime200Rate || 0),
            overtime250Amount: (typeHours['250'] || 0) * (prev.overtime250Rate || 0),
            
            totalOvertimeHours: summary.totalHours,
            totalOvertimeAmount: summary.totalAmount
        }));
    };

    // Toggle overtime row expansion
    const handleOvertimeRowExpand = (recordId) => {
        setExpandedOvertimeRows(prev => 
            prev.includes(recordId) 
                ? prev.filter(id => id !== recordId)
                : [...prev, recordId]
        );
    };

    // Format overtime record for display
    const formatOvertimeRecord = (record) => {
        const date = new Date(record.overtimeDate);
        const start = new Date(record.timeDetails?.startTime || record.startTime);
        const end = new Date(record.timeDetails?.endTime || record.endTime);
        
        return {
            id: record._id,
            date: formatDisplayDate(date),
            day: date.toLocaleDateString('en-US', { weekday: 'long' }),
            startTime: formatTime(start),
            endTime: formatTime(end),
            hours: (record.timeDetails?.hoursWorked || record.hoursWorked || 0).toFixed(2),
            type: record.overtimeType || 'Regular',
            rate: OVERTIME_MULTIPLIERS[record.overtimeType] || 1.5,
            amount: formatCurrency(record.financials?.calculatedAmount || record.calculatedAmount || 0),
            status: record.status,
            reason: record.reason || 'No reason provided',
            remarks: record.remarks?.departmentRemarks || record.remarks || '',
            approvedBy: record.approvedBy || record.approvalDetails?.approvedBy || 'N/A',
            approvedDate: record.approvalDetails?.approvalDate ? formatDisplayDate(new Date(record.approvalDetails.approvalDate)) : 'N/A'
        };
    };

    // Format time
    const formatTime = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    useEffect(() => {
        fetchPayrolls();
        fetchCompanyManagement();
        fetchEmployees();
        fetchBanks();
    }, []);

    useEffect(() => {
        let filtered = [...payrolls];
        
        if (filters.employeeId) {
            filtered = filtered.filter(p => 
                p.employeeId.toLowerCase().includes(filters.employeeId.toLowerCase())
            );
        }
        
        if (filters.employeeName) {
            filtered = filtered.filter(p => 
                p.employeeName.toLowerCase().includes(filters.employeeName.toLowerCase())
            );
        }
        
        if (filters.department) {
            filtered = filtered.filter(p => p.department === filters.department);
        }
        
        if (filters.month) {
            filtered = filtered.filter(p => p.payrollMonth === parseInt(filters.month));
        }
        
        if (filters.year) {
            filtered = filtered.filter(p => p.payrollYear === parseInt(filters.year));
        }
        
        if (filters.paymentStatus) {
            filtered = filtered.filter(p => p.paymentStatus === filters.paymentStatus);
        }
        
        if (filters.isBulkGenerated !== '') {
            filtered = filtered.filter(p => p.isBulkGenerated === (filters.isBulkGenerated === 'true'));
        }
        
        // Sort by employee name
        const sortedFiltered = filtered.sort((a, b) => 
            a.employeeName.localeCompare(b.employeeName)
        );
        
        setFilteredPayrolls(sortedFiltered);
        calculateTotals(sortedFiltered);
        
        // Calculate active filters count
        const activeCount = Object.values(filters).filter(value => 
            value !== '' && value !== null
        ).length;
        setActiveFiltersCount(activeCount);
    }, [payrolls, filters]);

    const fetchPayrolls = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/payrolls?limit=1000');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            setPayrolls(data.payrolls || []);
            
            if (data.companyManagement) {
                setCompanyManagement(data.companyManagement);
            }
            
            if (data.totals) {
                setTotals(data.totals);
            }
        } catch (error) {
            console.error('Error fetching payrolls:', error);
            showSnackbar('Error fetching payrolls', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        setEmployeesLoading(true);
        try {
            const response = await fetch('/api/employeemanagements?status=Active&limit=1000');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Handle different response structures
            let employeesArray = [];
            
            if (Array.isArray(data)) {
                employeesArray = data;
            } else if (data.employees && Array.isArray(data.employees)) {
                employeesArray = data.employees;
            } else if (data.data && Array.isArray(data.data)) {
                employeesArray = data.data;
            } else if (data.records && Array.isArray(data.records)) {
                employeesArray = data.records;
            } else if (data.result && Array.isArray(data.result)) {
                employeesArray = data.result;
            } else if (data.items && Array.isArray(data.items)) {
                employeesArray = data.items;
            }
            
            setEmployees(employeesArray);
            
            if (employeesArray.length === 0) {
                console.warn('No employees found');
            }
            
        } catch (error) {
            console.error('Error fetching employees:', error);
            setEmployees([]);
            showSnackbar('Failed to load employees', 'error');
        } finally {
            setEmployeesLoading(false);
        }
    };

    const fetchBanks = async () => {
        try {
            const response = await fetch('/api/banks');
            if (response.ok) {
                const data = await response.json();
                setBanks(data.banks || []);
            }
        } catch (error) {
            console.error('Error fetching banks:', error);
            setBanks([]);
        }
    };

    // Fetch attendance data for selected employee and date range
    const fetchAttendanceData = async (employeeId, startDate, endDate) => {
        if (!employeeId || !startDate || !endDate) return;
        
        setAttendanceLoading(true);
        try {
            const formattedStartDate = formatDateForAPI(startDate);
            const formattedEndDate = formatDateForAPI(endDate);
            
            const response = await fetch(
                `/api/payrolls/attendance/${employeeId}?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
            );
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success && data.statistics) {
                    const stats = data.statistics;
                    const attendanceDays = stats.presentDays || 0;
                    const presentDays = stats.presentDays || 0;
                    const absentDays = stats.absentDays || 0;
                    const leaveDays = stats.leaveDays || 0;
                    const totalWorkingDays = calculateWorkingDays(startDate, endDate);
                    
                    setAttendanceData(stats);
                    setDetailedAttendance(data.attendance || []);
                    
                    // Update attendance days in form data
                    setFormData(prev => ({
                        ...prev,
                        attendanceDays: attendanceDays,
                        presentDays: presentDays,
                        absentDays: absentDays,
                        leaveDays: leaveDays,
                        totalWorkingDays: totalWorkingDays
                    }));
                    
                    // Recalculate basic salary based on attendance and date range
                    recalculateBasicSalary(attendanceDays, startDate, endDate);
                    
                    // Check for overtime in attendance records
                    calculateOvertimeFromAttendance(data.attendance || []);
                }
            } else {
                // If no attendance found, use default values
                setAttendanceData(null);
                setDetailedAttendance([]);
                
                // Calculate default working days
                const defaultWorkingDays = calculateWorkingDays(startDate, endDate);
                
                setFormData(prev => ({
                    ...prev,
                    attendanceDays: 0,
                    presentDays: 0,
                    absentDays: 0,
                    leaveDays: 0,
                    totalWorkingDays: defaultWorkingDays
                }));
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
            setAttendanceData(null);
            setDetailedAttendance([]);
            
            showSnackbar('Error fetching attendance data', 'error');
        } finally {
            setAttendanceLoading(false);
        }
    };

    // Calculate overtime from attendance records
    const calculateOvertimeFromAttendance = (attendanceRecords) => {
        if (!attendanceRecords || attendanceRecords.length === 0) return;
        
        let overtime125Hours = 0;
        let overtime150Hours = 0;
        let overtime175Hours = 0;
        let overtime200Hours = 0;
        let overtime250Hours = 0;
        
        // Calculate total overtime from attendance records
        attendanceRecords.forEach(record => {
            const overtime = record.overtime || 0;
            const overtimeType = record.overtimeType || '150';
            
            switch(overtimeType) {
                case '125':
                    overtime125Hours += overtime;
                    break;
                case '150':
                    overtime150Hours += overtime;
                    break;
                case '175':
                    overtime175Hours += overtime;
                    break;
                case '200':
                    overtime200Hours += overtime;
                    break;
                case '250':
                    overtime250Hours += overtime;
                    break;
                default:
                    overtime150Hours += overtime;
            }
        });
        
        // Update form data with overtime hours
        setFormData(prev => ({
            ...prev,
            overtime125Hours,
            overtime150Hours,
            overtime175Hours,
            overtime200Hours,
            overtime250Hours
        }));
    };

    // Recalculate basic salary based on attendance and date range
    const recalculateBasicSalary = (presentDays, startDate, endDate) => {
        const monthlyBasicSalary = formData.monthlyBasicSalary || 0;
        const dailyRate = calculateDailyRate(monthlyBasicSalary, startDate, endDate);
        const actualBasicSalary = dailyRate * presentDays;
        
        setFormData(prev => ({
            ...prev,
            basicSalary: actualBasicSalary,
            attendanceDays: presentDays
        }));
    };

    const calculateTotals = (payrollList) => {
        const totals = payrollList.reduce((acc, payroll) => {
            acc.totalGrossSalary += payroll.grossSalary || 0;
            acc.totalDeductions += payroll.totalDeductions || 0;
            acc.totalNetSalary += payroll.netSalary || 0;
            acc.totalPayable += (payroll.netSalary || 0);
            acc.totalIncomeTax += payroll.incomeTaxAmount || 0;
            acc.totalEmployeePension += payroll.employeePensionAmount || 0;
            acc.totalEmployerPension += payroll.employerPensionAmount || 0;
            acc.totalCostSharing += payroll.costSharingAmount || payroll.costSharing || 0;
            acc.totalSalaryAdvance += payroll.salaryAdvance || 0;
            acc.totalOvertimeAmount += payroll.totalOvertimeAmount || 0;
            return acc;
        }, { 
            totalGrossSalary: 0, 
            totalDeductions: 0, 
            totalNetSalary: 0,
            totalPayable: 0,
            totalIncomeTax: 0,
            totalEmployeePension: 0,
            totalEmployerPension: 0,
            totalCostSharing: 0,
            totalSalaryAdvance: 0,
            totalOvertimeAmount: 0
        });
        
        setTotals(totals);
    };

    const fetchCompanyManagement = async () => {
        try {
            const response = await fetch('/api/payrolls/company/info');
            if (response.ok) {
                const data = await response.json();
                setCompanyManagement(data.companyManagement || {});
            }
        } catch (error) {
            console.error('Error fetching company info:', error);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.employeeId) newErrors.employeeId = 'Employee ID is required';
        if (!formData.employeeName) newErrors.employeeName = 'Employee name is required';
        if (!formData.department) newErrors.department = 'Department is required';
        if (!formData.monthlyBasicSalary || formData.monthlyBasicSalary < 0) 
            newErrors.monthlyBasicSalary = 'Valid monthly basic salary is required';
        if (!formData.preparedBy) newErrors.preparedBy = 'Prepared by is required';
        if (!formData.payrollStartDate) newErrors.payrollStartDate = 'Start date is required';
        if (!formData.payrollEndDate) newErrors.payrollEndDate = 'End date is required';
        
        // Validate date range
        if (formData.payrollStartDate > formData.payrollEndDate) {
            newErrors.payrollEndDate = 'End date must be after start date';
        }
        
        // Validate attendance days
        if (formData.attendanceDays < 0) 
            newErrors.attendanceDays = 'Attendance days cannot be negative';
        if (formData.attendanceDays > formData.totalWorkingDays) 
            newErrors.attendanceDays = 'Attendance days cannot exceed total working days';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const calculatePayroll = () => {
        // Use actual basic salary (already calculated based on attendance and date range)
        const basic = parseFloat(formData.basicSalary) || 0;
        
        // Calculate allowances
        const housing = parseFloat(formData.housingAllowance) || 0;
        const transport = parseFloat(formData.transportAllowance) || 0;
        const meal = parseFloat(formData.mealAllowance) || 0;
        const medical = parseFloat(formData.medicalAllowance) || 0;
        const otherAllowances = parseFloat(formData.otherAllowances) || 0;
        const totalAllowances = housing + transport + meal + medical + otherAllowances;
        
        // Calculate overtime amounts - use auto-calculated if available, otherwise manual
        let overtime125Amount = (parseFloat(formData.overtime125Hours) || 0) * (parseFloat(formData.overtime125Rate) || 0);
        let overtime150Amount = (parseFloat(formData.overtime150Hours) || 0) * (parseFloat(formData.overtime150Rate) || 0);
        let overtime175Amount = (parseFloat(formData.overtime175Hours) || 0) * (parseFloat(formData.overtime175Rate) || 0);
        let overtime200Amount = (parseFloat(formData.overtime200Hours) || 0) * (parseFloat(formData.overtime200Rate) || 0);
        let overtime250Amount = (parseFloat(formData.overtime250Hours) || 0) * (parseFloat(formData.overtime250Rate) || 0);
        
        // If auto-calculated overtime is available, use it
        const autoOvertimeAmount = parseFloat(formData.autoOvertimeAmount) || 0;
        if (autoOvertimeAmount > 0) {
            // Distribute auto-calculated amount proportionally
            const totalManualAmount = overtime125Amount + overtime150Amount + 
                                    overtime175Amount + overtime200Amount + overtime250Amount;
            
            if (totalManualAmount === 0) {
                // If no manual amounts, distribute auto amount based on type distribution
                const typeDistribution = {
                    '125': formData.overtime125Hours / formData.totalOvertimeHours || 0,
                    '150': formData.overtime150Hours / formData.totalOvertimeHours || 0,
                    '175': formData.overtime175Hours / formData.totalOvertimeHours || 0,
                    '200': formData.overtime200Hours / formData.totalOvertimeHours || 0,
                    '250': formData.overtime250Hours / formData.totalOvertimeHours || 0
                };
                
                overtime125Amount = autoOvertimeAmount * typeDistribution['125'];
                overtime150Amount = autoOvertimeAmount * typeDistribution['150'];
                overtime175Amount = autoOvertimeAmount * typeDistribution['175'];
                overtime200Amount = autoOvertimeAmount * typeDistribution['200'];
                overtime250Amount = autoOvertimeAmount * typeDistribution['250'];
            }
        }
        
        const totalOvertimeHours = (parseFloat(formData.overtime125Hours) || 0) + 
                                 (parseFloat(formData.overtime150Hours) || 0) + 
                                 (parseFloat(formData.overtime175Hours) || 0) + 
                                 (parseFloat(formData.overtime200Hours) || 0) + 
                                 (parseFloat(formData.overtime250Hours) || 0);
        
        const totalOvertimeAmount = overtime125Amount + overtime150Amount + 
                                  overtime175Amount + overtime200Amount + overtime250Amount;
        
        // Calculate gross salary
        const grossSalary = basic + totalAllowances + totalOvertimeAmount;
        
        // UPDATED: Calculate Income Tax on Gross Salary (basic + allowances + overtime)
        // According to Ethiopian tax law, all allowances and overtime are taxable
        let incomeTaxAmount = 0;
        let incomeTaxRate = 0;
        let taxInfo = { rate: 0, label: 'Not applicable' };
        
        if (formData.incomeTaxEnabled) {
            // Taxable income = Basic Salary + Allowances + Overtime
            const taxableIncome = grossSalary;
            incomeTaxAmount = calculateIncomeTax(taxableIncome);
            taxInfo = getApplicableTaxInfo(taxableIncome);
            incomeTaxRate = taxInfo.rate;
        }
        
        // Calculate Employee Pension (based on actual basic salary only - not on allowances or overtime)
        let employeePensionAmount = 0;
        let employerPensionAmount = 0;
        if (formData.pensionEnabled) {
            employeePensionAmount = (basic * (formData.employeePensionRate || 7)) / 100;
            employerPensionAmount = (basic * (formData.employerPensionRate || 11)) / 100;
        }
        
        // Other deductions
        const costSharingAmount = formData.costSharingEnabled ? (parseFloat(formData.costSharingAmount) || 0) : 0;
        const salaryAdvance = parseFloat(formData.salaryAdvance) || 0;
        const otherDeductions = parseFloat(formData.otherDeductions) || 0;
        
        const totalDeductions = incomeTaxAmount + employeePensionAmount + 
                              costSharingAmount + salaryAdvance + otherDeductions;
        const netSalary = grossSalary - totalDeductions;
        
        setFormData(prev => ({
            ...prev,
            totalAllowances,
            overtime125Amount,
            overtime150Amount,
            overtime175Amount,
            overtime200Amount,
            overtime250Amount,
            totalOvertimeHours,
            totalOvertimeAmount,
            grossSalary,
            incomeTaxAmount,
            incomeTaxRate: taxInfo.rate,
            employeePensionAmount,
            employerPensionAmount,
            costSharingAmount: costSharingAmount,
            totalDeductions,
            netSalary
        }));
    };

    useEffect(() => {
        calculatePayroll();
    }, [
        formData.basicSalary,
        formData.housingAllowance,
        formData.transportAllowance,
        formData.mealAllowance,
        formData.medicalAllowance,
        formData.otherAllowances,
        formData.overtime125Hours,
        formData.overtime125Rate,
        formData.overtime150Hours,
        formData.overtime150Rate,
        formData.overtime175Hours,
        formData.overtime175Rate,
        formData.overtime200Hours,
        formData.overtime200Rate,
        formData.overtime250Hours,
        formData.overtime250Rate,
        formData.autoOvertimeAmount,
        formData.incomeTaxEnabled,
        formData.pensionEnabled,
        formData.costSharingEnabled,
        formData.costSharingAmount,
        formData.salaryAdvance,
        formData.otherDeductions
    ]);

    // Recalculate when attendance days or date range changes
    useEffect(() => {
        if (formData.monthlyBasicSalary > 0 && formData.attendanceDays > 0 && 
            formData.payrollStartDate && formData.payrollEndDate) {
            recalculateBasicSalary(
                formData.attendanceDays, 
                formData.payrollStartDate, 
                formData.payrollEndDate
            );
        }
    }, [formData.attendanceDays, formData.payrollStartDate, formData.payrollEndDate, formData.monthlyBasicSalary]);

    // Calculate payroll month and year from start date
    useEffect(() => {
        if (formData.payrollStartDate) {
            const date = new Date(formData.payrollStartDate);
            setFormData(prev => ({
                ...prev,
                payrollMonth: date.getMonth() + 1,
                payrollYear: date.getFullYear()
            }));
        }
    }, [formData.payrollStartDate]);

    // Fetch overtime when employee or date range changes
    useEffect(() => {
        if (formData.employeeId && formData.payrollStartDate && formData.payrollEndDate) {
            fetchOvertimeData(formData.employeeId, formData.payrollStartDate, formData.payrollEndDate);
        }
    }, [formData.employeeId, formData.payrollStartDate, formData.payrollEndDate]);

    const handleSubmit = async () => {
        if (!validateForm()) return;

        // Check if attendance data exists
        if (formData.attendanceDays === 0) {
            showSnackbar('Cannot create payroll: No attendance records found for selected period', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const url = editMode 
                ? `/api/payrolls/${currentPayrollId}`
                : '/api/payrolls';
            
            const method = editMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    payrollStartDate: formatDateForAPI(formData.payrollStartDate),
                    payrollEndDate: formatDateForAPI(formData.payrollEndDate),
                    paymentDate: formatDateForAPI(formData.paymentDate),
                    // Make sure to send monthlyBasicSalary for proper calculation
                    monthlyBasicSalary: formData.monthlyBasicSalary,
                    basicSalary: formData.basicSalary,
                    // Bank information - use both bank and bankName for compatibility
                    bank: formData.bank || formData.bankName,
                    bankName: formData.bank || formData.bankName,
                    // Set attendance source
                    attendanceSource: attendanceData ? 'AttendanceModule' : 'Manual',
                    attendanceSyncStatus: attendanceData ? 'Synced' : 'Pending',
                    lastAttendanceSync: attendanceData ? new Date() : null,
                    // Include overtime data
                    autoOvertimeHours: formData.autoOvertimeHours,
                    autoOvertimeAmount: formData.autoOvertimeAmount,
                    overtimeRecords: formData.overtimeRecords,
                    // Include overtime summary
                    overtimeSummary: overtimeSummary,
                    // Include cost sharing information
                    costSharingEnabled: formData.costSharingEnabled,
                    costSharingAmount: formData.costSharingAmount,
                    // Tax calculation note
                    taxCalculationNote: 'Income tax calculated on gross salary (basic + allowances + overtime)'
                }),
            });

            const data = await response.json();

            if (response.ok) {
                showSnackbar(
                    editMode 
                        ? 'Payroll updated successfully!' 
                        : 'Payroll recorded successfully!', 
                    'success'
                );
                handleCloseDialog();
                fetchPayrolls();
            } else {
                showSnackbar(data.message || 'Error saving payroll', 'error');
            }
        } catch (error) {
            console.error('Error saving payroll:', error);
            showSnackbar('Error saving payroll', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (payroll) => {
        const payrollData = {
            ...payroll,
            monthlyBasicSalary: payroll.monthlyBasicSalary || payroll.basicSalary,
            payrollStartDate: new Date(payroll.payrollStartDate || payroll.paymentDate || new Date()),
            payrollEndDate: new Date(payroll.payrollEndDate || payroll.paymentDate || new Date()),
            paymentDate: new Date(payroll.paymentDate || new Date()),
            // Ensure bank information is properly set
            bank: payroll.bank || payroll.bankName,
            bankName: payroll.bank || payroll.bankName,
            // Include overtime data if available
            autoOvertimeHours: payroll.autoOvertimeHours || 0,
            autoOvertimeAmount: payroll.autoOvertimeAmount || 0,
            overtimeRecords: payroll.overtimeRecords || [],
            // Handle cost sharing (backward compatibility)
            costSharingEnabled: payroll.costSharingEnabled !== undefined ? payroll.costSharingEnabled : (payroll.costSharingAmount > 0),
            costSharingAmount: payroll.costSharingAmount || payroll.costSharing || 0
        };
        
        setFormData(payrollData);
        setEditMode(true);
        setCurrentPayrollId(payroll._id);
        setOpenDialog(true);
        setErrors({});
        
        // Fetch attendance data for the payroll period
        fetchAttendanceData(
            payroll.employeeId, 
            payrollData.payrollStartDate, 
            payrollData.payrollEndDate
        );
        
        // Fetch overtime data for the payroll period
        fetchOvertimeData(
            payroll.employeeId, 
            payrollData.payrollStartDate, 
            payrollData.payrollEndDate
        );
    };

    const handleDelete = (payroll) => {
        setPayrollToDelete(payroll);
        setDeleteDialog(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await fetch(`/api/payrolls/${payrollToDelete._id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                showSnackbar('Payroll deleted successfully!', 'success');
                fetchPayrolls();
            } else {
                const errorData = await response.json();
                showSnackbar(errorData.message || 'Error deleting payroll', 'error');
            }
        } catch (error) {
            console.error('Error deleting payroll:', error);
            showSnackbar('Error deleting payroll', 'error');
        } finally {
            setDeleteDialog(false);
            setPayrollToDelete(null);
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
        
        // When monthly basic salary changes, recalculate actual basic salary
        if (field === 'monthlyBasicSalary' && value > 0 && formData.payrollStartDate && formData.payrollEndDate) {
            recalculateBasicSalary(formData.attendanceDays, formData.payrollStartDate, formData.payrollEndDate);
            
            // Also update overtime rates
            const hourlyRate = calculateHourlyRate(value);
            setFormData(prev => ({
                ...prev,
                overtime125Rate: hourlyRate * 1.25,
                overtime150Rate: hourlyRate * 1.5,
                overtime175Rate: hourlyRate * 1.75,
                overtime200Rate: hourlyRate * 2.0,
                overtime250Rate: hourlyRate * 2.5
            }));
        }
        
        // When date range changes, fetch attendance data and recalculate salary
        if ((field === 'payrollStartDate' || field === 'payrollEndDate') && formData.employeeId) {
            const startDate = field === 'payrollStartDate' ? value : formData.payrollStartDate;
            const endDate = field === 'payrollEndDate' ? value : formData.payrollEndDate;
            
            if (startDate && endDate && startDate <= endDate) {
                // Update total working days
                const workingDays = calculateWorkingDays(startDate, endDate);
                setFormData(prev => ({
                    ...prev,
                    totalWorkingDays: workingDays
                }));
                
                // Fetch attendance data
                fetchAttendanceData(formData.employeeId, startDate, endDate);
                
                // Fetch overtime data
                fetchOvertimeData(formData.employeeId, startDate, endDate);
                
                // Recalculate basic salary
                if (formData.monthlyBasicSalary > 0 && formData.attendanceDays > 0) {
                    recalculateBasicSalary(formData.attendanceDays, startDate, endDate);
                }
            }
        }
        
        // When bankName changes, also update bank field
        if (field === 'bankName') {
            setFormData(prev => ({
                ...prev,
                bank: value
            }));
        }
        
        // When cost sharing is disabled, reset cost sharing amount
        if (field === 'costSharingEnabled' && value === 'No') {
            setFormData(prev => ({
                ...prev,
                costSharingAmount: 0
            }));
        }
    };

    const handleEmployeeSelect = (employeeId) => {
        const employee = employees.find(emp => emp.employeeId === employeeId);
        if (employee) {
            // Calculate hourly rate for overtime
            const monthlyBasicSalary = employee.basicSalary || 0;
            const dailyRate = calculateDailyRate(monthlyBasicSalary, formData.payrollStartDate, formData.payrollEndDate);
            const hourlyRate = calculateHourlyRate(monthlyBasicSalary);
            
            // Get bank from employee data - use the 'bank' field from EmployeeManagement schema
            const bankName = employee.bank || employee.bankName || '';
            
            setFormData(prev => ({
                ...prev,
                employeeId: employee.employeeId,
                employeeName: employee.fullName || `${employee.firstName} ${employee.lastName}`,
                department: employee.departmentName || employee.department || '',
                designation: employee.position || employee.designation || '',
                monthlyBasicSalary: employee.basicSalary || 0,
                housingAllowance: employee.housingAllowance || 0,
                transportAllowance: employee.transportAllowance || 0,
                mealAllowance: employee.mealAllowance || 0,
                medicalAllowance: employee.medicalAllowance || 0,
                otherAllowances: employee.otherAllowances || 0,
                bankName: bankName,
                bank: bankName, // Set both bank and bankName fields
                accountNumber: employee.accountNumber || '',
                costSharingEnabled: employee.costSharingEnabled || false,
                costSharingAmount: employee.costSharingAmount || employee.costSharing || 0,
                salaryAdvance: employee.salaryAdvance || 0,
                otherDeductions: employee.otherDeductions || 0,
                // Set overtime rates
                overtime125Rate: hourlyRate * 1.25,
                overtime150Rate: hourlyRate * 1.5,
                overtime175Rate: hourlyRate * 1.75,
                overtime200Rate: hourlyRate * 2.0,
                overtime250Rate: hourlyRate * 2.5,
                // Employee status
                employeeStatus: employee.employmentStatus || 'Active',
                employmentDate: employee.employmentDate,
                terminationDate: employee.terminationDate
            }));
            
            // Fetch attendance data for selected date range
            fetchAttendanceData(
                employee.employeeId, 
                formData.payrollStartDate, 
                formData.payrollEndDate
            );
            
            // Fetch overtime data for selected date range
            fetchOvertimeData(
                employee.employeeId, 
                formData.payrollStartDate, 
                formData.payrollEndDate
            );
        }
    };

    const handleOpenDialog = () => {
        setOpenDialog(true);
        setEditMode(false);
        setCurrentPayrollId(null);
        setAttendanceData(null);
        setDetailedAttendance([]);
        setOvertimeData([]);
        setOvertimeSummary({
            totalHours: 0,
            totalAmount: 0,
            regularHours: 0,
            regularAmount: 0,
            weekendHours: 0,
            weekendAmount: 0,
            holidayHours: 0,
            holidayAmount: 0,
            emergencyHours: 0,
            emergencyAmount: 0,
            nightHours: 0,
            nightAmount: 0
        });
        setExpandedOvertimeRows([]);
        
        // Reset form with current date range (current month)
        const currentDate = new Date();
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const workingDays = calculateWorkingDays(firstDay, lastDay);
        
        setFormData({
            employeeId: '',
            employeeName: '',
            department: '',
            designation: '',
            payrollStartDate: firstDay,
            payrollEndDate: lastDay,
            payrollMonth: currentDate.getMonth() + 1,
            payrollYear: currentDate.getFullYear(),
            
            // Basic Salary
            monthlyBasicSalary: 0,
            basicSalary: 0,
            
            // Attendance
            attendanceDays: 0,
            presentDays: 0,
            absentDays: 0,
            leaveDays: 0,
            totalWorkingDays: workingDays,
            
            // Allowances
            housingAllowance: 0,
            transportAllowance: 0,
            mealAllowance: 0,
            medicalAllowance: 0,
            otherAllowances: 0,
            totalAllowances: 0,
            
            // Overtime
            overtime125Hours: 0,
            overtime125Rate: 0,
            overtime125Amount: 0,
            
            overtime150Hours: 0,
            overtime150Rate: 0,
            overtime150Amount: 0,
            
            overtime175Hours: 0,
            overtime175Rate: 0,
            overtime175Amount: 0,
            
            overtime200Hours: 0,
            overtime200Rate: 0,
            overtime200Amount: 0,
            
            overtime250Hours: 0,
            overtime250Rate: 0,
            overtime250Amount: 0,
            
            totalOvertimeHours: 0,
            totalOvertimeAmount: 0,
            
            // Auto-calculated overtime
            autoOvertimeHours: 0,
            autoOvertimeAmount: 0,
            overtimeRecords: [],
            
            // Gross Salary
            grossSalary: 0,
            
            // Deductions
            incomeTaxEnabled: true,
            incomeTaxRate: 0,
            incomeTaxAmount: 0,
            
            pensionEnabled: true,
            employeePensionRate: 7,
            employeePensionAmount: 0,
            employerPensionRate: 11,
            employerPensionAmount: 0,
            
            // Cost Sharing - NEW with default "No"
            costSharingEnabled: false,
            costSharingAmount: 0,
            
            salaryAdvance: 0,
            otherDeductions: 0,
            totalDeductions: 0,
            
            // Net Salary
            netSalary: 0,
            
            // Payment Details - Bank Information
            paymentStatus: 'Pending',
            paymentDate: new Date(),
            bankName: '',
            bank: '', // Main bank field
            accountNumber: '',
            
            // Approval
            preparedBy: '',
            approvedBy: '',
            remarks: '',
            
            // Tracking
            isBulkGenerated: false,
            
            // Attendance tracking
            attendanceSource: 'Manual',
            attendanceSyncStatus: 'Pending',
            
            // Employee status
            employeeStatus: 'Active',
            employmentDate: null,
            terminationDate: null
        });
        setErrors({});
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditMode(false);
        setCurrentPayrollId(null);
        setAttendanceData(null);
        setDetailedAttendance([]);
        setOvertimeData([]);
        setOvertimeSummary({
            totalHours: 0,
            totalAmount: 0,
            regularHours: 0,
            regularAmount: 0,
            weekendHours: 0,
            weekendAmount: 0,
            holidayHours: 0,
            holidayAmount: 0,
            emergencyHours: 0,
            emergencyAmount: 0,
            nightHours: 0,
            nightAmount: 0
        });
        setExpandedOvertimeRows([]);
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
        fetchPayrolls();
        fetchEmployees();
        showSnackbar('Data refreshed successfully', 'success');
    };

    const handleResetFilters = () => {
        setFilters({
            employeeId: '',
            employeeName: '',
            department: '',
            month: '',
            year: '',
            paymentStatus: '',
            isBulkGenerated: ''
        });
        showSnackbar('Filters reset successfully', 'info');
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams({
                ...(filters.employeeId && { employeeId: filters.employeeId }),
                ...(filters.employeeName && { employeeName: filters.employeeName }),
                ...(filters.department && { department: filters.department }),
                ...(filters.month && { month: filters.month }),
                ...(filters.year && { year: filters.year }),
                ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
                ...(filters.isBulkGenerated && { isBulkGenerated: filters.isBulkGenerated })
            });

            const response = await fetch(`/api/payrolls/export/data?${params}`);
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
            link.download = `payroll-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);

            showSnackbar('Data exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            showSnackbar('Error exporting data', 'error');
        }
    };

    const handleCheckEligibility = async () => {
        if (!selectedMonth || !selectedYear) {
            showSnackbar('Please select month and year', 'error');
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch(`/api/payrolls/check-eligibility?month=${selectedMonth}&year=${selectedYear}`);
            const data = await response.json();

            if (response.ok) {
                setEligibilityData(data);
                setEligibilityDialog(true);
                showSnackbar(`Eligibility check completed. ${data.eligibleCount} employees eligible.`, 'success');
            } else {
                showSnackbar(data.message || 'Error checking eligibility', 'error');
            }
        } catch (error) {
            console.error('Error checking eligibility:', error);
            showSnackbar('Error checking eligibility', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleBulkGeneratePayroll = async () => {
        if (!selectedMonth || !selectedYear) {
            showSnackbar('Please select month and year', 'error');
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch('/api/payrolls/generate-bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    month: selectedMonth,
                    year: selectedYear,
                    preparedBy: 'System',
                    includeInactive: false
                }),
            });

            const data = await response.json();

            if (response.ok) {
                showSnackbar(`Generated ${data.count} payroll entries for ${months[selectedMonth-1]} ${selectedYear}`, 'success');
                fetchPayrolls();
                
                if (data.skippedEmployees && data.skippedEmployees.length > 0) {
                    showSnackbar(`${data.skippedEmployees.length} employees were skipped`, 'warning');
                }
                
                if (data.errors && data.errors.length > 0) {
                    showSnackbar(`${data.errors.length} errors occurred during generation`, 'error');
                }
            } else {
                showSnackbar(data.message || 'Error generating bulk payroll', 'error');
            }
        } catch (error) {
            console.error('Error generating bulk payroll:', error);
            showSnackbar('Error generating bulk payroll', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleGenerateSelected = async () => {
        if (!selectedMonth || !selectedYear || selectedEmployees.length === 0) {
            showSnackbar('Please select month, year, and at least one employee', 'error');
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch('/api/payrolls/generate-selected', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    month: selectedMonth,
                    year: selectedYear,
                    employeeIds: selectedEmployees,
                    preparedBy: 'System'
                }),
            });

            const data = await response.json();

            if (response.ok) {
                showSnackbar(`Generated ${data.count} payroll entries`, 'success');
                fetchPayrolls();
                setSelectedEmployees([]);
                
                if (data.errors && data.errors.length > 0) {
                    showSnackbar(`${data.errors.length} errors occurred`, 'warning');
                }
            } else {
                showSnackbar(data.message || 'Error generating selected payrolls', 'error');
            }
        } catch (error) {
            console.error('Error generating selected payrolls:', error);
            showSnackbar('Error generating selected payrolls', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleDeleteBulkPayrolls = async () => {
        if (!selectedMonth || !selectedYear) {
            showSnackbar('Please select month and year', 'error');
            return;
        }

        setBulkDeleteDialog(false);
        setProcessing(true);
        try {
            const response = await fetch(`/api/payrolls/bulk/${selectedMonth}/${selectedYear}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                showSnackbar(`Deleted ${data.deletedCount} bulk payroll entries`, 'success');
                fetchPayrolls();
            } else {
                showSnackbar(data.message || 'Error deleting bulk payrolls', 'error');
            }
        } catch (error) {
            console.error('Error deleting bulk payrolls:', error);
            showSnackbar('Error deleting bulk payrolls', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleBulkUpdateStatus = async () => {
        if (selectedEmployees.length === 0) {
            showSnackbar('Please select at least one payroll record', 'error');
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch('/api/payrolls/bulk-update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    payrollIds: selectedEmployees,
                    paymentStatus: bulkPaymentStatus,
                    paymentDate: formatDateForAPI(bulkPaymentDate)
                }),
            });

            const data = await response.json();

            if (response.ok) {
                showSnackbar(`Updated ${data.modifiedCount} payroll records', 'success`);
                fetchPayrolls();
                setSelectedEmployees([]);
                setBulkStatusDialog(false);
            } else {
                showSnackbar(data.message || 'Error updating payment status', 'error');
            }
        } catch (error) {
            console.error('Error updating payment status:', error);
            showSnackbar('Error updating payment status', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleSelectAllEmployees = () => {
        if (eligibilityData && eligibilityData.report) {
            const eligibleIds = eligibilityData.report
                .filter(emp => emp.isEligible && !emp.hasExistingPayroll)
                .map(emp => emp.employeeId);
            setSelectedEmployees(eligibleIds);
        }
    };

    const handleDeselectAllEmployees = () => {
        setSelectedEmployees([]);
    };

    const handleEmployeeSelection = (employeeId) => {
        setSelectedEmployees(prev => {
            if (prev.includes(employeeId)) {
                return prev.filter(id => id !== employeeId);
            } else {
                return [...prev, employeeId];
            }
        });
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        
        const tableHtml = `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12px; font-family: 'Times New Roman', Times, serif; line-height: 1.0;">
                <thead>
                    <tr>
                        <th style="border: 1px solid #ddd; padding: 4px; text-align: left; background-color: #f5f5f5; font-weight: bold;">Emp ID</th>
                        <th style="border: 1px solid #ddd; padding: 4px; text-align: left; background-color: #f5f5f5; font-weight: bold;">Employee Name</th>
                        <th style="border: 1px solid #ddd; padding: 4px; text-align: left; background-color: #f5f5f5; font-weight: bold;">Department</th>
                        <th style="border: 1px solid #ddd; padding: 4px; text-align: left; background-color: #f5f5f5; font-weight: bold;">Month</th>
                        <th style="border: 1px solid #ddd; padding: 4px; text-align: left; background-color: #f5f5f5; font-weight: bold;">Basic Salary</th>
                        <th style="border: 1px solid #ddd; padding: 4px; text-align: left; background-color: #f5f5f5; font-weight: bold;">Allowances</th>
                        <th style="border: 1px solid #ddd; padding: 4px; text-align: left; background-color: #f5f5f5; font-weight: bold;">Overtime</th>
                        <th style="border: 1px solid #ddd; padding: 4px; text-align: left; background-color: #f5f5f5; font-weight: bold;">Gross Salary</th>
                        <th style="border: 1px solid #ddd; padding: 4px; text-align: left; background-color: #f5f5f5; font-weight: bold;">Deductions</th>
                        <th style="border: 1px solid #ddd; padding: 4px; text-align: left; background-color: #f5f5f5; font-weight: bold;">Net Salary</th>
                        <th style="border: 1px solid #ddd; padding: 4px; text-align: left; background-color: #f5f5f5; font-weight: bold;">Status</th>
                        <th style="border: 1px solid #ddd; padding: 4px; text-align: left; background-color: #f5f5f5; font-weight: bold;">Bank</th>
                        <th style="border: 1px solid #ddd; padding: 4px; text-align: left; background-color: #f5f5f5; font-weight: bold;">Cost Sharing</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredPayrolls.map(payroll => `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 4px;">${payroll.employeeId || ''}</td>
                            <td style="border: 1px solid #ddd; padding: 4px;">${payroll.employeeName || ''}</td>
                            <td style="border: 1px solid #ddd; padding: 4px;">${payroll.department || ''}</td>
                            <td style="border: 1px solid #ddd; padding: 4px;">${months[payroll.payrollMonth-1]} ${payroll.payrollYear}</td>
                            <td style="border: 1px solid #ddd; padding: 4px; text-align: right;">${formatCurrency(payroll.basicSalary)}</td>
                            <td style="border: 1px solid #ddd; padding: 4px; text-align: right;">${formatCurrency(payroll.totalAllowances)}</td>
                            <td style="border: 1px solid #ddd; padding: 4px; text-align: right;">${formatCurrency(payroll.totalOvertimeAmount)}</td>
                            <td style="border: 1px solid #ddd; padding: 4px; text-align: right;">${formatCurrency(payroll.grossSalary)}</td>
                            <td style="border: 1px solid #ddd; padding: 4px; text-align: right;">${formatCurrency(payroll.totalDeductions)}</td>
                            <td style="border: 1px solid #ddd; padding: 4px; text-align: right;">${formatCurrency(payroll.netSalary)}</td>
                            <td style="border: 1px solid #ddd; padding: 4px;">${payroll.paymentStatus || ''}</td>
                            <td style="border: 1px solid #ddd; padding: 4px;">${payroll.bank || payroll.bankName || ''}</td>
                            <td style="border: 1px solid #ddd; padding: 4px;">${payroll.costSharingEnabled ? 'Yes' : 'No'} ${payroll.costSharingAmount > 0 ? `(${formatCurrency(payroll.costSharingAmount)})` : ''}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payroll Report</title>
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
                    <div class="report-title">Payroll Report - Detailed</div>
                    <div class="report-title">Currency: ETB</div>
                </div>
                
                <div class="print-info">
                    <div><strong>Printed on:</strong> ${formatDisplayDate(new Date().toString())} ${new Date().toLocaleTimeString()}</div>
                    <div><strong>Report Period:</strong> ${months[selectedMonth-1]} ${selectedYear}</div>
                    <div><strong>Total Records:</strong> ${filteredPayrolls.length}</div>
                </div>

                <div class="table-container">
                    ${tableHtml}
                </div>

                <div class="summary">
                    <strong>Payroll Summary (ETB):</strong><br/>
                    <strong>Total Basic Salary:</strong> ${formatCurrency(totals?.totalGrossSalary - totals?.totalAllowances - totals?.totalOvertimeAmount || 0)}<br/>
                    <strong>Total Allowances:</strong> ${formatCurrency(totals?.totalAllowances || 0)}<br/>
                    <strong>Total Overtime:</strong> ${formatCurrency(totals?.totalOvertimeAmount || 0)}<br/>
                    <strong>Total Gross Salary:</strong> ${formatCurrency(totals?.totalGrossSalary || 0)}<br/>
                    <strong>Total Deductions:</strong> ${formatCurrency(totals?.totalDeductions || 0)}<br/>
                    <strong>Total Net Salary:</strong> ${formatCurrency(totals?.totalNetSalary || 0)}<br/>
                    <strong>Total Payable:</strong> ${formatCurrency(totals?.totalPayable || 0)}<br/>
                    <strong>Total Cost Sharing:</strong> ${formatCurrency(totals?.totalCostSharing || 0)}<br/>
                    <strong>Tax Calculation Note:</strong> Income tax calculated on gross salary (basic + allowances + overtime)
                </div>

                <div class="footer">
                    <div class="signature">
                        <strong>Prepared by:</strong> ________________<br/>
                        HR Department
                    </div>
                    <div class="signature">
                        <strong>Checked by:</strong> ________________<br/>
                        Finance Department
                    </div>
                    <div class="signature">
                        <strong>Approved by:</strong> ________________<br/>
                        Management
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
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
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
            currency: 'ETB'
        }).format(amount);
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Paid': return 'success';
            case 'Pending': return 'warning';
            case 'Processing': return 'info';
            case 'On Hold': return 'error';
            default: return 'default';
        }
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

    const hasActiveFilters = () => {
        return activeFiltersCount > 0;
    };

    // Get tax bracket information for display
    const getTaxBracketInfo = (grossSalary) => {
        for (const bracket of INCOME_TAX_BRACKETS) {
            if (grossSalary >= bracket.min && grossSalary <= bracket.max) {
                return bracket.label;
            } else if (grossSalary > bracket.max && bracket.max === Infinity) {
                return bracket.label;
            }
        }
        return 'Not applicable';
    };

    const handleCloseEligibilityDialog = () => {
        setEligibilityDialog(false);
        setEligibilityData(null);
        setSelectedEmployees([]);
    };

    // Add employee status check
    const checkEmployeeEmploymentStatus = (employee, month, year) => {
        if (!employee || !employee.employmentDate) return false;
        
        const selectedDate = new Date(year, month - 1, 1);
        const employmentDate = new Date(employee.employmentDate);
        
        // Employee must be employed before or during the selected month
        if (employmentDate > selectedDate) {
            return false;
        }
        
        // Check if employee was terminated before the selected month
        if (employee.terminationDate) {
            const terminationDate = new Date(employee.terminationDate);
            const firstDayOfMonth = new Date(year, month - 1, 1);
            if (terminationDate < firstDayOfMonth) {
                return false;
            }
        }
        
        return true;
    };

    // Overtime summary card component
    const OvertimeSummaryCard = ({ title, hours, amount, type, color }) => (
        <Card sx={{ height: '100%', borderLeft: `4px solid ${color}` }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <TimeIcon sx={{ mr: 1, fontSize: '1rem', color }} />
                    <Typography variant="body2" color="textSecondary">
                        {title}
                    </Typography>
                </Box>
                <Typography variant="h6" color="text.primary">
                    {hours.toFixed(2)} hrs
                </Typography>
                <Typography variant="body2" color="success.main" fontWeight="bold">
                    {formatCurrency(amount)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                    Type: {type}
                </Typography>
            </CardContent>
        </Card>
    );

    // Overtime record row component
    const OvertimeRecordRow = ({ record, index }) => {
        const formatted = formatOvertimeRecord(record);
        const isExpanded = expandedOvertimeRows.includes(record._id);
        
        return (
            <React.Fragment key={record._id}>
                <TableRow hover>
                    <TableCell sx={{ width: 50 }}>
                        <IconButton
                            size="small"
                            onClick={() => handleOvertimeRowExpand(record._id)}
                        >
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </TableCell>
                    <TableCell>{formatted.date}</TableCell>
                    <TableCell>
                        <Typography variant="body2">
                            {formatted.startTime} - {formatted.endTime}
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
                            color={OVERTIME_TYPE_COLORS[formatted.type] || 'default'}
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
                        />
                    </TableCell>
                </TableRow>
                
                {/* Expanded details row */}
                <TableRow>
                    <TableCell colSpan={7} sx={{ py: 0, borderTop: 0 }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, my: 1 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                            Details
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Day:</strong> {formatted.day}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Rate:</strong> {formatted.rate}x
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Reason:</strong> {formatted.reason}
                                        </Typography>
                                        {formatted.remarks && (
                                            <Typography variant="body2">
                                                <strong>Remarks:</strong> {formatted.remarks}
                                            </Typography>
                                        )}
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                            Approval Information
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Approved By:</strong> {formatted.approvedBy}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Approval Date:</strong> {formatted.approvedDate}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Collapse>
                    </TableCell>
                </TableRow>
            </React.Fragment>
        );
    };

    const renderPayrollList = () => (
        <>
            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ minHeight: '100px' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <MoneyIcon color="primary" sx={{ mr: 1, fontSize: '1rem' }} />
                                <Typography variant="body2" color="textSecondary">
                                    Total Gross Salary
                                </Typography>
                            </Box>
                            <Typography variant="h6" color="primary">
                                {formatCurrency(totals?.totalGrossSalary || 0)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Basic: {formatCurrency(totals?.totalGrossSalary - totals?.totalAllowances - totals?.totalOvertimeAmount || 0)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ minHeight: '100px' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <MoneyOffIcon color="error" sx={{ mr: 1, fontSize: '1rem' }} />
                                <Typography variant="body2" color="textSecondary">
                                    Total Deductions
                                </Typography>
                            </Box>
                            <Typography variant="h6" color="error">
                                {formatCurrency(totals?.totalDeductions || 0)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Tax: {formatCurrency(totals?.totalIncomeTax || 0)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ minHeight: '100px' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <PaymentsIcon color="success" sx={{ mr: 1, fontSize: '1rem' }} />
                                <Typography variant="body2" color="textSecondary">
                                    Total Net Salary
                                </Typography>
                            </Box>
                            <Typography variant="h6" color="success">
                                {formatCurrency(totals?.totalNetSalary || 0)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Payable: {formatCurrency(totals?.totalPayable || 0)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ minHeight: '100px' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <ScheduleIcon color="info" sx={{ mr: 1, fontSize: '1rem' }} />
                                <Typography variant="body2" color="textSecondary">
                                    Total Overtime
                                </Typography>
                            </Box>
                            <Typography variant="h6" color="info">
                                {formatCurrency(totals?.totalOvertimeAmount || 0)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Multiple rates applied
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ minHeight: '100px' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <SavingsIcon color="warning" sx={{ mr: 1, fontSize: '1rem' }} />
                                <Typography variant="body2" color="textSecondary">
                                    Employee Pension
                                </Typography>
                            </Box>
                            <Typography variant="h6" color="warning">
                                {formatCurrency(totals?.totalEmployeePension || 0)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                7% of basic salary
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ minHeight: '100px' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <AccountTreeIcon color="secondary" sx={{ mr: 1, fontSize: '1rem' }} />
                                <Typography variant="body2" color="textSecondary">
                                    Employer Pension
                                </Typography>
                            </Box>
                            <Typography variant="h6" color="secondary">
                                {formatCurrency(totals?.totalEmployerPension || 0)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                11% of basic salary
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ minHeight: '100px' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <BalanceIcon color="info" sx={{ mr: 1, fontSize: '1rem' }} />
                                <Typography variant="body2" color="textSecondary">
                                    Total Cost Sharing
                                </Typography>
                            </Box>
                            <Typography variant="h6" color="info">
                                {formatCurrency(totals?.totalCostSharing || 0)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Employee contributions
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ minHeight: '100px' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <InfoIcon color="info" sx={{ mr: 1, fontSize: '1rem' }} />
                                <Typography variant="body2" color="textSecondary">
                                    Tax Calculation
                                </Typography>
                            </Box>
                            <Typography variant="h6" color="info">
                                {formatCurrency(totals?.totalIncomeTax || 0)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                On gross salary
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Payroll Table */}
            <Box sx={{ position: 'relative', mb: 2 }}>
                <TableContainer 
                    component={Paper} 
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
                                <TableCell sx={{ padding: '6px 8px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Emp ID</TableCell>
                                <TableCell sx={{ padding: '6px 8px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Employee Name</TableCell>
                                <TableCell sx={{ padding: '6px 8px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Department</TableCell>
                                <TableCell sx={{ padding: '6px 8px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Period</TableCell>
                                <TableCell sx={{ padding: '6px 8px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Basic Salary</TableCell>
                                <TableCell sx={{ padding: '6px 8px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Allowances</TableCell>
                                <TableCell sx={{ padding: '6px 8px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Overtime</TableCell>
                                <TableCell sx={{ padding: '6px 8px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Gross Salary</TableCell>
                                <TableCell sx={{ padding: '6px 8px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Deductions</TableCell>
                                <TableCell sx={{ padding: '6px 8px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Net Salary</TableCell>
                                <TableCell sx={{ padding: '6px 8px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Bank</TableCell>
                                <TableCell sx={{ padding: '6px 8px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Cost Sharing</TableCell>
                                <TableCell sx={{ padding: '6px 8px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Status</TableCell>
                                <TableCell sx={{ padding: '6px 8px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredPayrolls.length > 0 ? (
                                filteredPayrolls.map((payroll) => (
                                    <TableRow key={payroll._id} hover>
                                        <TableCell sx={{ padding: '4px 8px' }}>{payroll.employeeId}</TableCell>
                                        <TableCell sx={{ padding: '4px 8px' }}>{payroll.employeeName}</TableCell>
                                        <TableCell sx={{ padding: '4px 8px' }}>{payroll.department}</TableCell>
                                        <TableCell sx={{ padding: '4px 8px' }}>
                                            {payroll.payrollStartDate ? formatDisplayDate(payroll.payrollStartDate) : `${months[payroll.payrollMonth-1]} ${payroll.payrollYear}`}
                                            {payroll.payrollEndDate && ` - ${formatDisplayDate(payroll.payrollEndDate)}`}
                                        </TableCell>
                                        <TableCell sx={{ padding: '4px 8px' }}>
                                            <Typography color="primary">
                                                {formatCurrency(payroll.basicSalary)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ padding: '4px 8px' }}>
                                            <Typography color="info">
                                                {formatCurrency(payroll.totalAllowances)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ padding: '4px 8px' }}>
                                            <Typography color="warning">
                                                {formatCurrency(payroll.totalOvertimeAmount)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ padding: '4px 8px' }}>
                                            <Typography color="primary" fontWeight="bold">
                                                {formatCurrency(payroll.grossSalary)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ padding: '4px 8px' }}>
                                            <Typography color="error">
                                                {formatCurrency(payroll.totalDeductions)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ padding: '4px 8px' }}>
                                            <Typography color="success" fontWeight="bold">
                                                {formatCurrency(payroll.netSalary)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ padding: '4px 8px' }}>
                                            <Typography variant="body2">
                                                {payroll.bank || payroll.bankName || 'N/A'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ padding: '4px 8px' }}>
                                            <Chip 
                                                label={payroll.costSharingEnabled ? 'Yes' : 'No'} 
                                                size="small" 
                                                variant="outlined"
                                                color={payroll.costSharingEnabled ? "warning" : "default"}
                                            />
                                            {payroll.costSharingAmount > 0 && (
                                                <Typography variant="caption" color="warning.main" display="block">
                                                    {formatCurrency(payroll.costSharingAmount)}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ padding: '4px 8px' }}>
                                            <Chip 
                                                label={payroll.paymentStatus} 
                                                color={getStatusColor(payroll.paymentStatus)}
                                                size="small" 
                                            />
                                            {payroll.isBulkGenerated && (
                                                <Chip 
                                                    label="Bulk" 
                                                    size="small" 
                                                    variant="outlined"
                                                    sx={{ ml: 0.5, height: 20 }}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ padding: '4px 8px' }}>
                                            <Box sx={{ display: 'flex', gap: 0.25 }}>
                                                <Tooltip title="Edit">
                                                    <IconButton 
                                                        size="small" 
                                                        color="primary"
                                                        onClick={() => handleEdit(payroll)}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton 
                                                        size="small" 
                                                        color="error"
                                                        onClick={() => handleDelete(payroll)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="View Details">
                                                    <IconButton 
                                                        size="small" 
                                                        color="info"
                                                    >
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={14} align="center" sx={{ py: 3 }}>
                                        <Typography color="textSecondary">
                                            No payroll records found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {filteredPayrolls.length > 10 && (
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

            {/* Payroll Count */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                    Showing {filteredPayrolls.length} payroll record{filteredPayrolls.length !== 1 ? 's' : ''}
                    {hasActiveFilters() && ' (filtered)'}
                </Typography>
                
                <Typography variant="body2" color="textSecondary">
                    Total: {payrolls.length} records
                </Typography>
            </Box>
        </>
    );

    const renderBulkOperations = () => (
        <Box>
            {/* Bulk Generation Controls */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Bulk Payroll Generation
                </Typography>
                
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Month</InputLabel>
                            <Select
                                value={selectedMonth}
                                label="Month"
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            >
                                {months.map((month, index) => (
                                    <MenuItem key={index} value={index + 1}>
                                        {month}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Year</InputLabel>
                            <Select
                                value={selectedYear}
                                label="Year"
                                onChange={(e) => setSelectedYear(e.target.value)}
                            >
                                {years.map(year => (
                                    <MenuItem key={year} value={year}>
                                        {year}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                startIcon={<CheckCircleIcon />}
                                onClick={handleCheckEligibility}
                                disabled={processing}
                                size="small"
                            >
                                Check Eligibility
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<CalculateIcon />}
                                onClick={handleBulkGeneratePayroll}
                                disabled={processing || !selectedMonth || !selectedYear}
                                size="small"
                                color="primary"
                            >
                                {processing ? 'Generating...' : 'Generate All'}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<DeleteSweepIcon />}
                                onClick={() => setBulkDeleteDialog(true)}
                                disabled={processing}
                                size="small"
                                color="error"
                            >
                                Delete Bulk
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
                
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                    Note: Payroll will be generated for employees who were employed in the selected month and have attendance records.
                    Income tax will be calculated on gross salary (basic + allowances + overtime).
                </Typography>
            </Paper>

            {/* Selected Employees Section */}
            {eligibilityData && (
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            <PlaylistAddCheckIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Eligible Employees for {months[selectedMonth-1]} {selectedYear}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Select All">
                                <IconButton size="small" onClick={handleSelectAllEmployees}>
                                    <SelectAllIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Deselect All">
                                <IconButton size="small" onClick={handleDeselectAllEmployees}>
                                    <DeselectIcon />
                                </IconButton>
                            </Tooltip>
                            <Button
                                variant="contained"
                                startIcon={<DoneAllIcon />}
                                onClick={handleGenerateSelected}
                                disabled={processing || selectedEmployees.length === 0}
                                size="small"
                            >
                                Generate Selected ({selectedEmployees.length})
                            </Button>
                        </Box>
                    </Box>

                    <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {eligibilityData.report
                            .filter(emp => emp.isEligible && !emp.hasExistingPayroll)
                            .map((emp, index) => (
                                <ListItem
                                    key={index}
                                    button
                                    selected={selectedEmployees.includes(emp.employeeId)}
                                    onClick={() => handleEmployeeSelection(emp.employeeId)}
                                >
                                    <ListItemIcon>
                                        {selectedEmployees.includes(emp.employeeId) ? (
                                            <CheckBoxIcon color="primary" />
                                        ) : (
                                            <CheckBoxOutlineBlankIcon />
                                        )}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                                                    {emp.employeeId}
                                                </Typography>
                                                <Typography variant="body2">
                                                    {emp.employeeName}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="caption" color="textSecondary">
                                                    {emp.department} • Basic: {formatCurrency(emp.basicSalary)} • Bank: {emp.bank || emp.bankName || 'N/A'} • Cost Sharing: {emp.costSharingEnabled ? 'Yes' : 'No'}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                                    <Chip 
                                                        size="small" 
                                                        label={`${emp.attendanceData?.presentDays || 0} days present`}
                                                        color="success"
                                                        variant="outlined"
                                                    />
                                                    <Chip 
                                                        size="small" 
                                                        label={`${emp.overtimeData?.totalOvertimeHours || 0} OT hours`}
                                                        color="warning"
                                                        variant="outlined"
                                                    />
                                                </Box>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                    </List>

                    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                                    <Typography variant="h6">{eligibilityData.totalEmployees}</Typography>
                                    <Typography variant="body2" color="textSecondary">Total Employees</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e8' }}>
                                    <Typography variant="h6" color="success.main">{eligibilityData.eligibleCount}</Typography>
                                    <Typography variant="body2" color="textSecondary">Eligible</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#ffebee' }}>
                                    <Typography variant="h6" color="error.main">{eligibilityData.ineligibleCount}</Typography>
                                    <Typography variant="body2" color="textSecondary">Not Eligible</Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            )}

            {/* Bulk Status Update */}
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    <LocalAtmIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Bulk Payment Status Update
                </Typography>
                
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Payment Status</InputLabel>
                            <Select
                                value={bulkPaymentStatus}
                                label="Payment Status"
                                onChange={(e) => setBulkPaymentStatus(e.target.value)}
                            >
                                {paymentStatuses.map(status => (
                                    <MenuItem key={status} value={status}>
                                        {status}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <CustomDatePicker
                            label="Payment Date"
                            value={bulkPaymentDate}
                            onChange={(date) => setBulkPaymentDate(date)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Button
                            variant="contained"
                            startIcon={<DoneAllIcon />}
                            onClick={() => setBulkStatusDialog(true)}
                            disabled={selectedEmployees.length === 0}
                            fullWidth
                            size="small"
                        >
                            Update Selected ({selectedEmployees.length})
                        </Button>
                    </Grid>
                </Grid>
                
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                    Select payroll records from the list above to update their payment status in bulk.
                </Typography>
            </Paper>
        </Box>
    );

    const renderReports = () => (
        <Box>
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Payroll Analytics & Reports
                </Typography>
                
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <BalanceIcon color="primary" sx={{ mr: 1 }} />
                                    <Typography variant="subtitle2">Department Summary</Typography>
                                </Box>
                                <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                                    View payroll distribution by department
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    onClick={() => {
                                        // Implement department summary
                                        showSnackbar('Department summary feature coming soon', 'info');
                                    }}
                                >
                                    View Report
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={4}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <WalletIcon color="secondary" sx={{ mr: 1 }} />
                                    <Typography variant="subtitle2">Deduction Analysis</Typography>
                                </Box>
                                <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                                    Analyze tax, pension, and other deductions
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    onClick={() => {
                                        // Implement deduction analysis
                                        showSnackbar('Deduction analysis feature coming soon', 'info');
                                    }}
                                >
                                    View Analysis
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={4}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <DownloadIcon color="success" sx={{ mr: 1 }} />
                                    <Typography variant="subtitle2">Export Reports</Typography>
                                </Box>
                                <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                                    Export payroll data in various formats
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    onClick={handleExport}
                                >
                                    Export Data
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Paper>

            {/* Quick Stats */}
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Quick Statistics
                </Typography>
                
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h4" color="primary">
                                {payrolls.length}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Total Payrolls
                            </Typography>
                        </Paper>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h4" color="success.main">
                                {payrolls.filter(p => p.paymentStatus === 'Paid').length}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Paid
                            </Typography>
                        </Paper>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h4" color="warning.main">
                                {payrolls.filter(p => p.paymentStatus === 'Pending').length}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Pending
                            </Typography>
                        </Paper>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h4" color="info.main">
                                {payrolls.filter(p => p.costSharingEnabled).length}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Cost Sharing
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 2 }}>
                {/* Header with Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            Payroll Management
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
                            <Badge badgeContent={activeFiltersCount} color="primary">
                                <IconButton 
                                    onClick={() => setShowFilters(!showFilters)} 
                                    size="small"
                                    color={showFilters ? "primary" : "default"}
                                >
                                    <FilterIcon fontSize="small" />
                                </IconButton>
                            </Badge>
                        </Tooltip>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenDialog}
                            size="small"
                            sx={{ ml: 1 }}
                        >
                            Add Payroll
                        </Button>
                    </Box>
                </Box>

                {/* Tabs */}
                <Paper sx={{ mb: 2 }}>
                    <Tabs
                        value={selectedTab}
                        onChange={(e, newValue) => setSelectedTab(newValue)}
                        variant="fullWidth"
                    >
                        <Tab 
                            icon={<ReceiptIcon />} 
                            label="Payroll List" 
                            iconPosition="start"
                        />
                        <Tab 
                            icon={<PeopleIcon />} 
                            label="Bulk Operations" 
                            iconPosition="start"
                        />
                        <Tab 
                            icon={<TrendingUpIcon />} 
                            label="Reports" 
                            iconPosition="start"
                        />
                    </Tabs>
                </Paper>

                {/* Filters */}
                {showFilters && (
                    <Paper sx={{ p: 1.5, mb: 2 }}>
                        <Grid container spacing={1} alignItems="center">
                            <Grid item xs={12} sm={6} md={4} lg={2}>
                                <TextField
                                    fullWidth
                                    label="Employee ID"
                                    value={filters.employeeId}
                                    onChange={(e) => handleFilterChange('employeeId', e.target.value)}
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
                            <Grid item xs={12} sm={6} md={4} lg={2}>
                                <TextField
                                    fullWidth
                                    label="Employee Name"
                                    value={filters.employeeName}
                                    onChange={(e) => handleFilterChange('employeeName', e.target.value)}
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
                            <Grid item xs={12} sm={6} md={4} lg={2}>
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
                                        <MenuItem key={dept} value={dept}>
                                            {dept}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4} lg={2}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Month"
                                    value={filters.month}
                                    onChange={(e) => handleFilterChange('month', e.target.value)}
                                    size="small"
                                >
                                    <MenuItem value="">All Months</MenuItem>
                                    {months.map((month, index) => (
                                        <MenuItem key={index} value={index + 1}>
                                            {month}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4} lg={2}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Year"
                                    value={filters.year}
                                    onChange={(e) => handleFilterChange('year', e.target.value)}
                                    size="small"
                                >
                                    <MenuItem value="">All Years</MenuItem>
                                    {years.map(year => (
                                        <MenuItem key={year} value={year}>
                                            {year}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4} lg={2}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Payment Status"
                                    value={filters.paymentStatus}
                                    onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                                    size="small"
                                >
                                    <MenuItem value="">All Status</MenuItem>
                                    {paymentStatuses.map(status => (
                                        <MenuItem key={status} value={status}>
                                            {status}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4} lg={2}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Generation Type"
                                    value={filters.isBulkGenerated}
                                    onChange={(e) => handleFilterChange('isBulkGenerated', e.target.value)}
                                    size="small"
                                >
                                    <MenuItem value="">All Types</MenuItem>
                                    <MenuItem value="true">Bulk Generated</MenuItem>
                                    <MenuItem value="false">Manual Entry</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                    <Box>
                                        {hasActiveFilters() && (
                                            <Chip
                                                label={`${activeFiltersCount} Active Filter${activeFiltersCount !== 1 ? 's' : ''}`}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
                            {filters.month && (
                                <Chip
                                    label={`Month: ${months[parseInt(filters.month)-1]}`}
                                    size="small"
                                    onDelete={() => handleFilterChange('month', '')}
                                />
                            )}
                            {filters.year && (
                                <Chip
                                    label={`Year: ${filters.year}`}
                                    size="small"
                                    onDelete={() => handleFilterChange('year', '')}
                                />
                            )}
                            {filters.paymentStatus && (
                                <Chip
                                    label={`Status: ${filters.paymentStatus}`}
                                    size="small"
                                    onDelete={() => handleFilterChange('paymentStatus', '')}
                                />
                            )}
                            {filters.isBulkGenerated !== '' && (
                                <Chip
                                    label={`Type: ${filters.isBulkGenerated === 'true' ? 'Bulk' : 'Manual'}`}
                                    size="small"
                                    onDelete={() => handleFilterChange('isBulkGenerated', '')}
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

                {/* Main Content based on selected tab */}
                {selectedTab === 0 && renderPayrollList()}
                {selectedTab === 1 && renderBulkOperations()}
                {selectedTab === 2 && renderReports()}

                {/* Eligibility Dialog */}
                <Dialog open={eligibilityDialog} onClose={handleCloseEligibilityDialog} maxWidth="lg" fullWidth>
                    <DialogTitle>
                        Payroll Eligibility Report - {months[selectedMonth-1]} {selectedYear}
                    </DialogTitle>
                    <DialogContent>
                        {eligibilityData && (
                            <Box>
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid item xs={12} sm={4}>
                                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                                            <Typography variant="h6">{eligibilityData.totalEmployees}</Typography>
                                            <Typography variant="body2" color="textSecondary">Total Employees</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e8' }}>
                                            <Typography variant="h6" color="success.main">{eligibilityData.eligibleCount}</Typography>
                                            <Typography variant="body2" color="textSecondary">Eligible</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#ffebee' }}>
                                            <Typography variant="h6" color="error.main">{eligibilityData.ineligibleCount}</Typography>
                                            <Typography variant="body2" color="textSecondary">Not Eligible</Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>

                                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Eligible Employees ({eligibilityData.eligibleCount})</Typography>
                                <TableContainer component={Paper} sx={{ maxHeight: 300, mb: 3 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Select</TableCell>
                                                <TableCell>Employee ID</TableCell>
                                                <TableCell>Name</TableCell>
                                                <TableCell>Department</TableCell>
                                                <TableCell>Basic Salary</TableCell>
                                                <TableCell>Bank</TableCell>
                                                <TableCell>Cost Sharing</TableCell>
                                                <TableCell>Present Days</TableCell>
                                                <TableCell>Overtime Hours</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {eligibilityData.report
                                                .filter(emp => emp.isEligible && !emp.hasExistingPayroll)
                                                .map((emp, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedEmployees.includes(emp.employeeId)}
                                                                onChange={() => handleEmployeeSelection(emp.employeeId)}
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                        <TableCell>{emp.employeeId}</TableCell>
                                                        <TableCell>{emp.employeeName}</TableCell>
                                                        <TableCell>{emp.department || 'N/A'}</TableCell>
                                                        <TableCell>{formatCurrency(emp.basicSalary)}</TableCell>
                                                        <TableCell>{emp.bank || emp.bankName || 'Not set'}</TableCell>
                                                        <TableCell>{emp.costSharingEnabled ? 'Yes' : 'No'}</TableCell>
                                                        <TableCell>{emp.attendanceData?.presentDays || 0}</TableCell>
                                                        <TableCell>{emp.overtimeData?.totalOvertimeHours || 0}</TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Ineligible Employees ({eligibilityData.ineligibleCount})</Typography>
                                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Employee ID</TableCell>
                                                <TableCell>Name</TableCell>
                                                <TableCell>Department</TableCell>
                                                <TableCell>Reasons</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {eligibilityData.report
                                                .filter(emp => !emp.isEligible)
                                                .map((emp, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{emp.employeeId}</TableCell>
                                                        <TableCell>{emp.employeeName}</TableCell>
                                                        <TableCell>{emp.department || 'N/A'}</TableCell>
                                                        <TableCell>
                                                            {emp.reasons.map((reason, i) => (
                                                                <Typography key={i} variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                                                    • {reason}
                                                                </Typography>
                                                            ))}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseEligibilityDialog} size="small">
                            Close
                        </Button>
                        <Button 
                            onClick={handleGenerateSelected} 
                            variant="contained"
                            disabled={processing || selectedEmployees.length === 0}
                            size="small"
                        >
                            Generate Selected ({selectedEmployees.length})
                        </Button>
                        <Button 
                            onClick={handleBulkGeneratePayroll} 
                            variant="contained"
                            disabled={processing}
                            size="small"
                            color="primary"
                        >
                            Generate All Eligible
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Add/Edit Payroll Dialog */}
                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth scroll="paper">
                    <DialogTitle>
                        {editMode ? 'Edit Payroll' : 'Add New Payroll'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            {/* Employee Selection */}
                            <Grid item xs={12} sm={6} md={6}>
                                <FormControl fullWidth error={!!errors.employeeId} required size="small">
                                    <InputLabel>Select Employee</InputLabel>
                                    <Select
                                        value={formData.employeeId}
                                        label="Select Employee"
                                        onChange={(e) => handleEmployeeSelect(e.target.value)}
                                        disabled={employeesLoading}
                                    >
                                        {employeesLoading ? (
                                            <MenuItem disabled value="">
                                                Loading employees...
                                            </MenuItem>
                                        ) : Array.isArray(employees) && employees.length > 0 ? (
                                            employees.map(emp => (
                                                <MenuItem key={emp._id} value={emp.employeeId}>
                                                    {emp.employeeId} - {emp.fullName || `${emp.firstName} ${emp.lastName}`} ({emp.departmentName || emp.department})
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem disabled value="">
                                                No employees available
                                            </MenuItem>
                                        )}
                                    </Select>
                                    {errors.employeeId && (
                                        <Typography variant="caption" color="error">
                                            {errors.employeeId}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    fullWidth
                                    label="Employee ID"
                                    value={formData.employeeId}
                                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                                    error={!!errors.employeeId}
                                    required
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    fullWidth
                                    label="Employee Name"
                                    value={formData.employeeName}
                                    onChange={(e) => handleInputChange('employeeName', e.target.value)}
                                    error={!!errors.employeeName}
                                    required
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                                <TextField
                                    fullWidth
                                    label="Department"
                                    value={formData.department}
                                    onChange={(e) => handleInputChange('department', e.target.value)}
                                    error={!!errors.department}
                                    required
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                                <TextField
                                    fullWidth
                                    label="Designation"
                                    value={formData.designation}
                                    onChange={(e) => handleInputChange('designation', e.target.value)}
                                    size="small"
                                />
                            </Grid>
                            
                            {/* Payroll Period (Date Range) */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="primary" sx={{ mt: 1, mb: 1 }}>
                                    Payroll Period (Date Range)
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                                <CustomDatePicker
                                    label="Start Date"
                                    value={formData.payrollStartDate}
                                    onChange={(date) => handleInputChange('payrollStartDate', date)}
                                    error={!!errors.payrollStartDate}
                                    required
                                />
                                {errors.payrollStartDate && (
                                    <Typography variant="caption" color="error">
                                        {errors.payrollStartDate}
                                    </Typography>
                                )}
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                                <CustomDatePicker
                                    label="End Date"
                                    value={formData.payrollEndDate}
                                    onChange={(date) => handleInputChange('payrollEndDate', date)}
                                    error={!!errors.payrollEndDate}
                                    required
                                />
                                {errors.payrollEndDate && (
                                    <Typography variant="caption" color="error">
                                        {errors.payrollEndDate}
                                    </Typography>
                                )}
                            </Grid>
                            
                            {/* Employee Status */}
                            <Grid item xs={12} sm={6} md={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Employee Status"
                                    value={formData.employeeStatus}
                                    onChange={(e) => handleInputChange('employeeStatus', e.target.value)}
                                    size="small"
                                >
                                    {employmentStatuses.map(status => (
                                        <MenuItem key={status} value={status}>
                                            {status}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            
                            {/* Attendance Information */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="info" sx={{ mt: 1, mb: 1 }}>
                                    Attendance Information for {formatDisplayDate(formData.payrollStartDate)} to {formatDisplayDate(formData.payrollEndDate)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                                <TextField
                                    fullWidth
                                    label="Present Days"
                                    type="number"
                                    value={formData.attendanceDays}
                                    onChange={(e) => handleInputChange('attendanceDays', e.target.value)}
                                    error={!!errors.attendanceDays}
                                    required
                                    size="small"
                                    InputProps={{
                                        endAdornment: attendanceLoading ? (
                                            <CircularProgress size={20} />
                                        ) : attendanceData ? (
                                            <Tooltip title="Attendance data loaded from system">
                                                <CheckCircleIcon color="success" fontSize="small" />
                                            </Tooltip>
                                        ) : (
                                            <Tooltip title="No attendance data found">
                                                <WarningIcon color="warning" fontSize="small" />
                                            </Tooltip>
                                        )
                                    }}
                                    helperText={`Total working days: ${formData.totalWorkingDays} (Based on date range)`}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                                <Button
                                    variant="outlined"
                                    startIcon={<RefreshIcon />}
                                    onClick={() => fetchAttendanceData(formData.employeeId, formData.payrollStartDate, formData.payrollEndDate)}
                                    disabled={!formData.employeeId || attendanceLoading}
                                    fullWidth
                                    size="small"
                                >
                                    {attendanceLoading ? 'Loading...' : 'Refresh Attendance'}
                                </Button>
                            </Grid>
                            
                            {/* Overtime Information Section */}
                            {formData.employeeId && (
                                <>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" color="warning" sx={{ mt: 1, mb: 1 }}>
                                            <TimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                            Overtime Information for {formatDisplayDate(formData.payrollStartDate)} to {formatDisplayDate(formData.payrollEndDate)}
                                        </Typography>
                                    </Grid>
                                    
                                    {/* Overtime Summary Cards */}
                                    {overtimeData.length > 0 && (
                                        <Grid item xs={12}>
                                            <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Overtime Summary (Auto-calculated)
                                                </Typography>
                                                <Grid container spacing={1}>
                                                    <Grid item xs={12} sm={6} md={4}>
                                                        <OvertimeSummaryCard
                                                            title="Regular Overtime"
                                                            hours={overtimeSummary.regularHours}
                                                            amount={overtimeSummary.regularAmount}
                                                            type="1.5x"
                                                            color="#1976d2"
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={6} md={4}>
                                                        <OvertimeSummaryCard
                                                            title="Weekend Overtime"
                                                            hours={overtimeSummary.weekendHours}
                                                            amount={overtimeSummary.weekendAmount}
                                                            type="2.0x"
                                                            color="#9c27b0"
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={6} md={4}>
                                                        <OvertimeSummaryCard
                                                            title="Holiday Overtime"
                                                            hours={overtimeSummary.holidayHours}
                                                            amount={overtimeSummary.holidayAmount}
                                                            type="2.5x"
                                                            color="#f44336"
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={6} md={6}>
                                                        <OvertimeSummaryCard
                                                            title="Emergency/Night"
                                                            hours={overtimeSummary.emergencyHours + overtimeSummary.nightHours}
                                                            amount={overtimeSummary.emergencyAmount + overtimeSummary.nightAmount}
                                                            type="1.75x"
                                                            color="#ff9800"
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={6} md={6}>
                                                        <Card sx={{ height: '100%', borderLeft: '4px solid #4caf50' }}>
                                                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                                    <TimeIcon sx={{ mr: 1, fontSize: '1rem', color: '#4caf50' }} />
                                                                    <Typography variant="body2" color="textSecondary">
                                                                        Total Overtime
                                                                    </Typography>
                                                                </Box>
                                                                <Typography variant="h6" color="text.primary">
                                                                    {overtimeSummary.totalHours.toFixed(2)} hrs
                                                                </Typography>
                                                                <Typography variant="body2" color="success.main" fontWeight="bold">
                                                                    {formatCurrency(overtimeSummary.totalAmount)}
                                                                </Typography>
                                                                <Typography variant="caption" color="textSecondary">
                                                                    {overtimeData.length} approved records
                                                                </Typography>
                                                            </CardContent>
                                                        </Card>
                                                    </Grid>
                                                </Grid>
                                            </Paper>
                                        </Grid>
                                    )}
                                    
                                    {/* Overtime Records Table */}
                                    {overtimeData.length > 0 && (
                                        <Grid item xs={12}>
                                            <Paper sx={{ p: 2, mb: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography variant="subtitle2">
                                                        Approved Overtime Records
                                                    </Typography>
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<RefreshIcon />}
                                                        onClick={() => fetchOvertimeData(formData.employeeId, formData.payrollStartDate, formData.payrollEndDate)}
                                                        disabled={overtimeLoading}
                                                        size="small"
                                                    >
                                                        {overtimeLoading ? 'Refreshing...' : 'Refresh Overtime'}
                                                    </Button>
                                                </Box>
                                                
                                                <TableContainer sx={{ maxHeight: 300 }}>
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell sx={{ width: 50 }}></TableCell>
                                                                <TableCell><strong>Date</strong></TableCell>
                                                                <TableCell><strong>Time Range</strong></TableCell>
                                                                <TableCell><strong>Hours</strong></TableCell>
                                                                <TableCell><strong>Type</strong></TableCell>
                                                                <TableCell><strong>Amount</strong></TableCell>
                                                                <TableCell><strong>Status</strong></TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {overtimeLoading ? (
                                                                <TableRow>
                                                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                                                        <CircularProgress size={24} />
                                                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                                                            Loading overtime records...
                                                                        </Typography>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ) : overtimeData.length > 0 ? (
                                                                overtimeData
                                                                    .slice(
                                                                        overtimePage * overtimeRowsPerPage,
                                                                        overtimePage * overtimeRowsPerPage + overtimeRowsPerPage
                                                                    )
                                                                    .map((record, index) => (
                                                                        <OvertimeRecordRow key={record._id} record={record} index={index} />
                                                                    ))
                                                            ) : (
                                                                <TableRow>
                                                                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                                                        <Typography variant="body2" color="textSecondary">
                                                                            No approved overtime records found for this period
                                                                        </Typography>
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                                
                                                {overtimeData.length > overtimeRowsPerPage && (
                                                    <TablePagination
                                                        component="div"
                                                        count={overtimeData.length}
                                                        page={overtimePage}
                                                        onPageChange={(event, newPage) => setOvertimePage(newPage)}
                                                        rowsPerPage={overtimeRowsPerPage}
                                                        onRowsPerPageChange={(event) => {
                                                            setOvertimeRowsPerPage(parseInt(event.target.value, 10));
                                                            setOvertimePage(0);
                                                        }}
                                                        rowsPerPageOptions={[5, 10, 25]}
                                                        labelRowsPerPage="Records per page:"
                                                    />
                                                )}
                                            </Paper>
                                        </Grid>
                                    )}
                                    
                                    {overtimeData.length === 0 && !overtimeLoading && (
                                        <Grid item xs={12}>
                                            <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
                                                    <TimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="textSecondary">
                                                        No approved overtime records found for the selected period
                                                    </Typography>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    )}
                                </>
                            )}
                            
                            {/* Basic Salary Section */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="primary" sx={{ mt: 1, mb: 1 }}>
                                    Salary Calculation
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                                <TextField
                                    fullWidth
                                    label="Monthly Basic Salary"
                                    type="number"
                                    value={formData.monthlyBasicSalary}
                                    onChange={(e) => handleInputChange('monthlyBasicSalary', e.target.value)}
                                    error={!!errors.monthlyBasicSalary}
                                    required
                                    size="small"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                    helperText="Monthly salary (for 30 days)"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                                <TextField
                                    fullWidth
                                    label="Actual Basic Salary (Calculated)"
                                    type="number"
                                    value={formData.basicSalary}
                                    InputProps={{
                                        readOnly: true,
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                    size="small"
                                    helperText={`Based on ${formData.attendanceDays} attendance days in selected period`}
                                />
                            </Grid>
                            
                            {/* Auto-calculated Overtime Summary */}
                            {formData.autoOvertimeAmount > 0 && (
                                <Grid item xs={12}>
                                    <Paper sx={{ p: 2, bgcolor: '#fff8e1', borderRadius: 1, mb: 2 }}>
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="warning.main">
                                                    <TimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                                    Auto-calculated Overtime from Approved Records:
                                                </Typography>
                                                <Typography variant="h6" color="warning.main" sx={{ mt: 1 }}>
                                                    {formatCurrency(formData.autoOvertimeAmount)} ({formData.autoOvertimeHours.toFixed(2)} hours)
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="caption" color="textSecondary">
                                                    This amount is automatically included in the overtime calculation below.
                                                    You can adjust manual entries if needed.
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                </Grid>
                            )}
                            
                            {/* Allowances Section */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="info" sx={{ mt: 1, mb: 1 }}>
                                    Allowances (Taxable)
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="Housing Allowance"
                                    type="number"
                                    value={formData.housingAllowance}
                                    onChange={(e) => handleInputChange('housingAllowance', e.target.value)}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                    helperText="Taxable income"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="Transport Allowance"
                                    type="number"
                                    value={formData.transportAllowance}
                                    onChange={(e) => handleInputChange('transportAllowance', e.target.value)}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                    helperText="Taxable income"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="Meal Allowance"
                                    type="number"
                                    value={formData.mealAllowance}
                                    onChange={(e) => handleInputChange('mealAllowance', e.target.value)}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                    helperText="Taxable income"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                                <TextField
                                    fullWidth
                                    label="Medical Allowance"
                                    type="number"
                                    value={formData.medicalAllowance}
                                    onChange={(e) => handleInputChange('medicalAllowance', e.target.value)}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                    helperText="Taxable income"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                                <TextField
                                    fullWidth
                                    label="Other Allowances"
                                    type="number"
                                    value={formData.otherAllowances}
                                    onChange={(e) => handleInputChange('otherAllowances', e.target.value)}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                    helperText="Taxable income"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Total Allowances"
                                    type="number"
                                    value={formData.totalAllowances}
                                    InputProps={{
                                        readOnly: true,
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                    size="small"
                                    helperText="Included in income tax calculation"
                                />
                            </Grid>
                            
                            {/* Overtime Section */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="warning" sx={{ mt: 1, mb: 1 }}>
                                    Overtime Details {formData.autoOvertimeAmount > 0 && '(Auto-calculated values shown)'}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="1.25x Hours"
                                    type="number"
                                    value={formData.overtime125Hours}
                                    onChange={(e) => handleInputChange('overtime125Hours', e.target.value)}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="1.25x Rate"
                                    type="number"
                                    value={formData.overtime125Rate}
                                    onChange={(e) => handleInputChange('overtime125Rate', e.target.value)}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="1.25x Amount"
                                    type="number"
                                    value={formData.overtime125Amount}
                                    InputProps={{
                                        readOnly: true,
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="1.5x Hours"
                                    type="number"
                                    value={formData.overtime150Hours}
                                    onChange={(e) => handleInputChange('overtime150Hours', e.target.value)}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="1.5x Rate"
                                    type="number"
                                    value={formData.overtime150Rate}
                                    onChange={(e) => handleInputChange('overtime150Rate', e.target.value)}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="1.5x Amount"
                                    type="number"
                                    value={formData.overtime150Amount}
                                    InputProps={{
                                        readOnly: true,
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="1.75x Hours"
                                    type="number"
                                    value={formData.overtime175Hours}
                                    onChange={(e) => handleInputChange('overtime175Hours', e.target.value)}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="1.75x Rate"
                                    type="number"
                                    value={formData.overtime175Rate}
                                    onChange={(e) => handleInputChange('overtime175Rate', e.target.value)}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="1.75x Amount"
                                    type="number"
                                    value={formData.overtime175Amount}
                                    InputProps={{
                                        readOnly: true,
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="2.0x Hours"
                                    type="number"
                                    value={formData.overtime200Hours}
                                    onChange={(e) => handleInputChange('overtime200Hours', e.target.value)}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="2.0x Rate"
                                    type="number"
                                    value={formData.overtime200Rate}
                                    onChange={(e) => handleInputChange('overtime200Rate', e.target.value)}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="2.0x Amount"
                                    type="number"
                                    value={formData.overtime200Amount}
                                    InputProps={{
                                        readOnly: true,
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="2.5x Hours"
                                    type="number"
                                    value={formData.overtime250Hours}
                                    onChange={(e) => handleInputChange('overtime250Hours', e.target.value)}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="2.5x Rate"
                                    type="number"
                                    value={formData.overtime250Rate}
                                    onChange={(e) => handleInputChange('overtime250Rate', e.target.value)}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="2.5x Amount"
                                    type="number"
                                    value={formData.overtime250Amount}
                                    InputProps={{
                                        readOnly: true,
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                                <TextField
                                    fullWidth
                                    label="Total Overtime Hours"
                                    type="number"
                                    value={formData.totalOvertimeHours}
                                    InputProps={{ readOnly: true }}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                                <TextField
                                    fullWidth
                                    label="Total Overtime Amount"
                                    type="number"
                                    value={formData.totalOvertimeAmount}
                                    InputProps={{
                                        readOnly: true,
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                    size="small"
                                    helperText="Included in income tax calculation"
                                />
                            </Grid>
                            
                            {/* Gross Salary */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
                                    Gross Salary
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Gross Salary"
                                    type="number"
                                    value={formData.grossSalary}
                                    InputProps={{
                                        readOnly: true,
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                    size="small"
                                    helperText="Basic + Allowances + Overtime (All taxable)"
                                />
                            </Grid>
                            
                            {/* Deductions Section */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="error" sx={{ mt: 1, mb: 1 }}>
                                    Deductions
                                </Typography>
                            </Grid>
                            
                            {/* Income Tax */}
                            <Grid item xs={12} sm={4} md={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Income Tax</InputLabel>
                                    <Select
                                        value={formData.incomeTaxEnabled ? 'yes' : 'no'}
                                        label="Income Tax"
                                        onChange={(e) => handleInputChange('incomeTaxEnabled', e.target.value === 'yes')}
                                    >
                                        <MenuItem value="yes">Yes (Apply Ethiopian Tax Law)</MenuItem>
                                        <MenuItem value="no">No</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={4} md={4}>
                                <TextField
                                    fullWidth
                                    label="Tax Rate (%)"
                                    value={formData.incomeTaxRate}
                                    InputProps={{ readOnly: true }}
                                    size="small"
                                    helperText={getTaxBracketInfo(formData.grossSalary)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4} md={4}>
                                <TextField
                                    fullWidth
                                    label="Income Tax Amount"
                                    type="number"
                                    value={formData.incomeTaxAmount}
                                    InputProps={{
                                        readOnly: true,
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                    size="small"
                                    helperText="Calculated on gross salary"
                                />
                            </Grid>

                            {/* Pension */}
                            <Grid item xs={12} sm={4} md={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Pension</InputLabel>
                                    <Select
                                        value={formData.pensionEnabled ? 'yes' : 'no'}
                                        label="Pension"
                                        onChange={(e) => handleInputChange('pensionEnabled', e.target.value === 'yes')}
                                    >
                                        <MenuItem value="yes">Yes</MenuItem>
                                        <MenuItem value="no">No</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={4} md={4}>
                                <TextField
                                    fullWidth
                                    label="Emp. Pension (7%)"
                                    type="number"
                                    value={formData.employeePensionAmount}
                                    InputProps={{
                                        readOnly: true,
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                    size="small"
                                    helperText="Calculated on basic salary only"
                                />
                            </Grid>
                            <Grid item xs={12} sm={4} md={4}>
                                <TextField
                                    fullWidth
                                    label="Emplr. Pension (11%)"
                                    type="number"
                                    value={formData.employerPensionAmount}
                                    InputProps={{
                                        readOnly: true,
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                    size="small"
                                    helperText="For tracking only"
                                />
                            </Grid>

                            {/* COST SHARING - NEW SECTION */}
                            <Grid item xs={12} sm={4} md={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Cost Sharing</InputLabel>
                                    <Select
                                        value={formData.costSharingEnabled ? 'Yes' : 'No'}
                                        label="Cost Sharing"
                                        onChange={(e) => handleInputChange('costSharingEnabled', e.target.value === 'Yes')}
                                    >
                                        <MenuItem value="No">No</MenuItem>
                                        <MenuItem value="Yes">Yes</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={4} md={4}>
                                <TextField
                                    fullWidth
                                    label="Cost Sharing Amount"
                                    type="number"
                                    value={formData.costSharingAmount}
                                    onChange={(e) => handleInputChange('costSharingAmount', e.target.value)}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>,
                                        readOnly: !formData.costSharingEnabled
                                    }}
                                    disabled={!formData.costSharingEnabled}
                                    helperText={formData.costSharingEnabled ? "Enter amount" : "Enable cost sharing first"}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4} md={4}>
                                <TextField
                                    fullWidth
                                    label="Salary Advance"
                                    type="number"
                                    value={formData.salaryAdvance}
                                    onChange={(e) => handleInputChange('salaryAdvance', e.target.value)}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                />
                            </Grid>
                            
                            <Grid item xs={12} sm={6} md={6}>
                                <TextField
                                    fullWidth
                                    label="Other Deductions"
                                    type="number"
                                    value={formData.otherDeductions}
                                    onChange={(e) => handleInputChange('otherDeductions', e.target.value)}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                />
                            </Grid>
                            
                            {/* Total Deductions */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Total Deductions"
                                    type="number"
                                    value={formData.totalDeductions}
                                    InputProps={{
                                        readOnly: true,
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                    size="small"
                                />
                            </Grid>
                            
                            {/* Net Salary */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Net Salary"
                                    type="number"
                                    value={formData.netSalary}
                                    InputProps={{
                                        readOnly: true,
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                    size="small"
                                />
                            </Grid>
                            
                            {/* Payment Details - Bank Information */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="primary" sx={{ mt: 1, mb: 1 }}>
                                    Bank Information (Retrieved from Employee Record)
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Bank"
                                    value={formData.bankName}
                                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                                    size="small"
                                    disabled={!formData.employeeId} // Read-only if employee is selected
                                    InputProps={{
                                        readOnly: formData.employeeId ? true : false
                                    }}
                                    helperText={formData.employeeId ? "Bank information retrieved from employee record" : "Select an employee first"}
                                >
                                    <MenuItem value="">Select Bank</MenuItem>
                                    {ETHIOPIAN_BANKS.map(bank => (
                                        <MenuItem key={bank} value={bank}>
                                            {bank}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                                <TextField
                                    fullWidth
                                    label="Account Number"
                                    value={formData.accountNumber}
                                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                                    size="small"
                                    disabled={!formData.employeeId} // Read-only if employee is selected
                                    InputProps={{
                                        readOnly: formData.employeeId ? true : false
                                    }}
                                    helperText={formData.employeeId ? "Account number from employee record" : ""}
                                />
                            </Grid>
                            
                            {/* Payment Status and Date */}
                            <Grid item xs={12} sm={6} md={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Payment Status"
                                    value={formData.paymentStatus}
                                    onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                                    size="small"
                                >
                                    {paymentStatuses.map(status => (
                                        <MenuItem key={status} value={status}>
                                            {status}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                                <CustomDatePicker
                                    label="Payment Date"
                                    value={formData.paymentDate}
                                    onChange={(date) => handleInputChange('paymentDate', date)}
                                />
                            </Grid>
                            
                            {/* Approval Information */}
                            <Grid item xs={12} sm={6} md={6}>
                                <TextField
                                    fullWidth
                                    label="Prepared By"
                                    value={formData.preparedBy}
                                    onChange={(e) => handleInputChange('preparedBy', e.target.value)}
                                    error={!!errors.preparedBy}
                                    required
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                                <TextField
                                    fullWidth
                                    label="Approved By"
                                    value={formData.approvedBy}
                                    onChange={(e) => handleInputChange('approvedBy', e.target.value)}
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
                            disabled={submitting || formData.attendanceDays === 0}
                            size="small"
                        >
                            {submitting ? 'Saving...' : (editMode ? 'Update Payroll' : 'Save Payroll')}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
                    <DialogTitle>
                        Confirm Delete
                    </DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete this payroll record?
                        </Typography>
                        {payrollToDelete && (
                            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                                <Typography variant="body2">
                                    <strong>Employee:</strong> {payrollToDelete.employeeName}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Period:</strong> {payrollToDelete.payrollStartDate ? formatDisplayDate(payrollToDelete.payrollStartDate) : `${months[payrollToDelete.payrollMonth-1]} ${payrollToDelete.payrollYear}`}
                                    {payrollToDelete.payrollEndDate && ` - ${formatDisplayDate(payrollToDelete.payrollEndDate)}`}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Net Salary:</strong> {formatCurrency(payrollToDelete.netSalary)}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Bank:</strong> {payrollToDelete.bank || payrollToDelete.bankName || 'N/A'}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Cost Sharing:</strong> {payrollToDelete.costSharingEnabled ? 'Yes' : 'No'} {payrollToDelete.costSharingAmount > 0 ? `(${formatCurrency(payrollToDelete.costSharingAmount)})` : ''}
                                </Typography>
                                {payrollToDelete.isBulkGenerated && (
                                    <Typography variant="body2" color="warning.main">
                                        <strong>Note:</strong> This record was bulk-generated
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

                {/* Bulk Delete Confirmation Dialog */}
                <Dialog open={bulkDeleteDialog} onClose={() => setBulkDeleteDialog(false)}>
                    <DialogTitle>
                        Delete Bulk Generated Payrolls
                    </DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete ALL bulk-generated payrolls for {months[selectedMonth-1]} {selectedYear}?
                        </Typography>
                        <Box sx={{ mt: 2, p: 2, backgroundColor: '#fff3e0', borderRadius: 1 }}>
                            <Typography variant="body2" color="warning.main">
                                <WarningIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                                This action cannot be undone. All bulk-generated payrolls for the selected period will be permanently deleted.
                            </Typography>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setBulkDeleteDialog(false)} size="small">
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleDeleteBulkPayrolls} 
                            variant="contained" 
                            color="error"
                            size="small"
                        >
                            Delete All Bulk Payrolls
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Bulk Status Update Dialog */}
                <Dialog open={bulkStatusDialog} onClose={() => setBulkStatusDialog(false)}>
                    <DialogTitle>
                        Update Payment Status for Selected Payrolls
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            You are about to update payment status for {selectedEmployees.length} payroll record(s).
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Payment Status</InputLabel>
                                    <Select
                                        value={bulkPaymentStatus}
                                        label="Payment Status"
                                        onChange={(e) => setBulkPaymentStatus(e.target.value)}
                                    >
                                        {paymentStatuses.map(status => (
                                            <MenuItem key={status} value={status}>
                                                {status}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <CustomDatePicker
                                    label="Payment Date"
                                    value={bulkPaymentDate}
                                    onChange={(date) => setBulkPaymentDate(date)}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setBulkStatusDialog(false)} size="small">
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleBulkUpdateStatus} 
                            variant="contained"
                            disabled={processing}
                            size="small"
                        >
                            Update Status
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Snackbar */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                >
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
};

export default PayrollManagement;