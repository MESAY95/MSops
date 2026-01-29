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
    Avatar
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
    Add as AddIcon, 
    Print as PrintIcon, 
    Refresh as RefreshIcon,
    GetApp as ExportIcon,
    People as PeopleIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    FilterList as FilterIcon,
    CalendarToday as CalendarIcon,
    Clear as ClearIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Work as WorkIcon,
    School as SchoolIcon,
    AccountBalance as BankIcon,
    AttachMoney as MoneyIcon,
    Person as PersonIcon,
    Business as BusinessIcon
} from '@mui/icons-material';

const EmployeeManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [filters, setFilters] = useState({
        employeeId: '',
        firstName: '',
        lastName: '',
        departmentName: '',
        role: '',
        employmentStatus: '',
        employmentType: '',
        educationalStatus: '',
        gender: '',
        minExperience: '',
        maxExperience: ''
    });
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentEmployeeId, setCurrentEmployeeId] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
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

    // Educational Status Options
    const educationalStatuses = [
        'BSc', 'MSc', 'PhD', 'Diploma', 'Certificate', 
        '12+', '10+', '8', '4', 'Labor', 'Other'
    ];

    // Gender Options
    const genders = ['Male', 'Female'];

    // Employment Type Options
    const employmentTypes = ['Permanent', 'Contract', 'Parttime', 'Intern', 'Extern', 'Other'];

    // Marital Status Options
    const maritalStatuses = ['Single', 'Married', 'Divorced', 'Other'];

    // Role Options
    const roles = ['admin', 'manager', 'employee'];

    // Employment Status Options
    const employmentStatuses = ['Active', 'Inactive', 'Terminated'];

    // Bank Options
    const banks = [
        'CBE', 'COOP', 'BOA', 'NIB', 'Dashen', 'Abysinia', 'Seket', 'AIB', 
        'Zemen', 'Ahadu', 'Geda', 'Oromia', 'Global', 'Heberet', 'Abay', 'Addis', 
        'Berehan', 'Buna', 'DGB', 'Enat', 'Sinqee', 'Tsedey', 'Wegagen', 
        'ZamZam', 'Anbesa', 'Other'
    ];

    // Form state
    const [formData, setFormData] = useState({
        employeeId: '',
        firstName: '',
        middleName: '',
        lastName: '',
        gender: '',
        employmentType: 'Permanent',
        employmentDate: new Date(),
        educationalStatus: '',
        qualification: '',
        experience: '',
        maritalStatus: '',
        tin: '',
        pensionNo: '',
        fanNo: '',
        departmentId: '',
        departmentName: '',
        role: '',
        position: '',
        email: '',
        phone: '',
        basicSalary: '',
        housingAllowance: '',
        transportAllowance: '',
        fuelAllowance: '',
        positionAllowance: '',
        hardshipAllowance: '',
        otherAllowances: '',
        bank: '',
        accountNumber: '',
        contractEndDate: null,
        resignationDate: null,
        employmentStatus: 'Active'
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
        fetchCompanyManagement();
    }, []);

    useEffect(() => {
        // Apply filters to employees
        let filtered = [...employees];
        
        // Filter by employee ID (case-insensitive search)
        if (filters.employeeId) {
            filtered = filtered.filter(e => 
                e.employeeId.toLowerCase().includes(filters.employeeId.toLowerCase())
            );
        }
        
        // Filter by first name (case-insensitive search)
        if (filters.firstName) {
            filtered = filtered.filter(e => 
                e.firstName.toLowerCase().includes(filters.firstName.toLowerCase())
            );
        }
        
        // Filter by last name (case-insensitive search)
        if (filters.lastName) {
            filtered = filtered.filter(e => 
                e.lastName.toLowerCase().includes(filters.lastName.toLowerCase())
            );
        }
        
        // Filter by department name
        if (filters.departmentName) {
            filtered = filtered.filter(e => e.departmentName === filters.departmentName);
        }
        
        // Filter by role
        if (filters.role) {
            filtered = filtered.filter(e => e.role === filters.role);
        }
        
        // Filter by employment status
        if (filters.employmentStatus) {
            filtered = filtered.filter(e => e.employmentStatus === filters.employmentStatus);
        }
        
        // Filter by employment type
        if (filters.employmentType) {
            filtered = filtered.filter(e => e.employmentType === filters.employmentType);
        }
        
        // Filter by educational status
        if (filters.educationalStatus) {
            filtered = filtered.filter(e => e.educationalStatus === filters.educationalStatus);
        }
        
        // Filter by gender
        if (filters.gender) {
            filtered = filtered.filter(e => e.gender === filters.gender);
        }
        
        // Filter by experience range
        if (filters.minExperience) {
            filtered = filtered.filter(e => e.experience >= parseFloat(filters.minExperience));
        }
        
        if (filters.maxExperience) {
            filtered = filtered.filter(e => e.experience <= parseFloat(filters.maxExperience));
        }
        
        // Sort by last name, then first name (alphabetical order)
        const sortedFiltered = filtered.sort((a, b) => {
            // First compare last names
            const lastNameCompare = (a.lastName || '').localeCompare(b.lastName || '');
            if (lastNameCompare !== 0) {
                return lastNameCompare;
            }
            // If last names are the same, compare first names
            return (a.firstName || '').localeCompare(b.firstName || '');
        });
        
        setFilteredEmployees(sortedFiltered);
        
    }, [employees, filters]);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/employeemanagements?limit=1000');
            const data = await response.json();
            
            setEmployees(data.employees || []);
            
            if (data.companyManagement) {
                setCompanyManagement(data.companyManagement);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            showSnackbar('Error fetching employees', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await fetch('/api/departmentmanagements?status=Active&limit=100');
            const data = await response.json();
            
            // Check different possible response structures
            let departmentsArray = [];
            
            if (Array.isArray(data.data)) {
                departmentsArray = data.data; // If data is in data.data array
            } else if (Array.isArray(data.departments)) {
                departmentsArray = data.departments; // If data is in data.departments array
            } else if (Array.isArray(data)) {
                departmentsArray = data; // If response is direct array
            } else if (data && data.data && Array.isArray(data.data)) {
                departmentsArray = data.data; // Handle paginated response
            }
            
            setDepartments(departmentsArray || []);
        } catch (error) {
            console.error('Error fetching departments:', error);
            showSnackbar('Error fetching departments', 'error');
        }
    };

    const fetchCompanyManagement = async () => {
        try {
            const response = await fetch('/api/employeemanagements/company/info');
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

    const calculateTotalSalary = (employee) => {
        const allowances = [
            employee.housingAllowance || 0,
            employee.transportAllowance || 0,
            employee.fuelAllowance || 0,
            employee.positionAllowance || 0,
            employee.hardshipAllowance || 0,
            employee.otherAllowances || 0
        ];
        
        const totalAllowances = allowances.reduce((sum, allowance) => sum + allowance, 0);
        return (employee.basicSalary || 0) + totalAllowances;
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.gender) newErrors.gender = 'Gender is required';
        if (!formData.employmentType) newErrors.employmentType = 'Employment type is required';
        if (!formData.employmentDate) newErrors.employmentDate = 'Employment date is required';
        if (!formData.educationalStatus) newErrors.educationalStatus = 'Educational status is required';
        if (!formData.experience || formData.experience < 0) newErrors.experience = 'Valid experience is required';
        if (!formData.maritalStatus) newErrors.maritalStatus = 'Marital status is required';
        if (!formData.departmentId) newErrors.departmentId = 'Department is required';
        if (!formData.role) newErrors.role = 'Role is required';
        if (!formData.position.trim()) newErrors.position = 'Position is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
        else if (!/^09\d{8}$/.test(formData.phone)) newErrors.phone = 'Phone must be 10 digits starting with 09';
        if (!formData.basicSalary || formData.basicSalary < 0) newErrors.basicSalary = 'Valid basic salary is required';
        if (formData.bank && !formData.accountNumber) newErrors.accountNumber = 'Account number is required when bank is selected';

        // Date validations
        if (formData.employmentDate && formData.employmentDate > new Date()) {
            newErrors.employmentDate = 'Employment date cannot be in the future';
        }
        if (formData.resignationDate && formData.resignationDate > new Date()) {
            newErrors.resignationDate = 'Resignation date cannot be in the future';
        }
        if (formData.contractEndDate && formData.contractEndDate < formData.employmentDate) {
            newErrors.contractEndDate = 'Contract end date must be after employment date';
        }
        if (formData.resignationDate && formData.employmentDate && formData.resignationDate <= formData.employmentDate) {
            newErrors.resignationDate = 'Resignation date must be after employment date';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const url = editMode 
                ? `/api/employeemanagements/${currentEmployeeId}`
                : '/api/employeemanagements';
            
            const method = editMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    employmentDate: formatDateForAPI(formData.employmentDate),
                    contractEndDate: formData.contractEndDate ? formatDateForAPI(formData.contractEndDate) : null,
                    resignationDate: formData.resignationDate ? formatDateForAPI(formData.resignationDate) : null,
                    // Convert string numbers to actual numbers
                    experience: parseFloat(formData.experience),
                    basicSalary: parseFloat(formData.basicSalary),
                    housingAllowance: parseFloat(formData.housingAllowance || 0),
                    transportAllowance: parseFloat(formData.transportAllowance || 0),
                    fuelAllowance: parseFloat(formData.fuelAllowance || 0),
                    positionAllowance: parseFloat(formData.positionAllowance || 0),
                    hardshipAllowance: parseFloat(formData.hardshipAllowance || 0),
                    otherAllowances: parseFloat(formData.otherAllowances || 0)
                }),
            });

            if (response.ok) {
                showSnackbar(
                    editMode 
                        ? 'Employee updated successfully!' 
                        : 'Employee added successfully!', 
                    'success'
                );
                handleCloseDialog();
                fetchEmployees();
            } else {
                const errorData = await response.json();
                showSnackbar(errorData.message || 'Error saving employee', 'error');
            }
        } catch (error) {
            console.error('Error saving employee:', error);
            showSnackbar('Error saving employee', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (employee) => {
        setFormData({
            employeeId: employee.employeeId,
            firstName: employee.firstName,
            middleName: employee.middleName || '',
            lastName: employee.lastName,
            gender: employee.gender || '',
            employmentType: employee.employmentType || 'Permanent',
            employmentDate: new Date(employee.employmentDate),
            educationalStatus: employee.educationalStatus,
            qualification: employee.qualification || '',
            experience: employee.experience,
            maritalStatus: employee.maritalStatus,
            tin: employee.tin || '',
            pensionNo: employee.pensionNo || '',
            fanNo: employee.fanNo || '',
            departmentId: employee.departmentId?._id || employee.departmentId || '',
            departmentName: employee.departmentName || '',
            role: employee.role,
            position: employee.position,
            email: employee.email,
            phone: employee.phone,
            basicSalary: employee.basicSalary,
            housingAllowance: employee.housingAllowance || '',
            transportAllowance: employee.transportAllowance || '',
            fuelAllowance: employee.fuelAllowance || '',
            positionAllowance: employee.positionAllowance || '',
            hardshipAllowance: employee.hardshipAllowance || '',
            otherAllowances: employee.otherAllowances || '',
            bank: employee.bank || '',
            accountNumber: employee.accountNumber || '',
            contractEndDate: employee.contractEndDate ? new Date(employee.contractEndDate) : null,
            resignationDate: employee.resignationDate ? new Date(employee.resignationDate) : null,
            employmentStatus: employee.employmentStatus
        });
        setEditMode(true);
        setCurrentEmployeeId(employee._id);
        setOpenDialog(true);
        setErrors({});
    };

    const handleDelete = (employee) => {
        setEmployeeToDelete(employee);
        setDeleteDialog(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await fetch(`/api/employeemanagements/${employeeToDelete._id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                showSnackbar('Employee deleted successfully!', 'success');
                fetchEmployees();
            } else {
                const errorData = await response.json();
                showSnackbar(errorData.message || 'Error deleting employee', 'error');
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
            showSnackbar('Error deleting employee', 'error');
        } finally {
            setDeleteDialog(false);
            setEmployeeToDelete(null);
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

        // Update department name when departmentId changes
        if (field === 'departmentId') {
            const selectedDepartment = departments.find(dept => dept._id === value);
            if (selectedDepartment) {
                setFormData(prev => ({
                    ...prev,
                    departmentName: selectedDepartment.name || selectedDepartment.departmentName
                }));
            }
        }
    };

    const handleOpenDialog = () => {
        setOpenDialog(true);
        setEditMode(false);
        setCurrentEmployeeId(null);
        setFormData({
            employeeId: '',
            firstName: '',
            middleName: '',
            lastName: '',
            gender: '',
            employmentType: 'Permanent',
            employmentDate: new Date(),
            educationalStatus: '',
            qualification: '',
            experience: '',
            maritalStatus: '',
            tin: '',
            pensionNo: '',
            fanNo: '',
            departmentId: '',
            departmentName: '',
            role: '',
            position: '',
            email: '',
            phone: '',
            basicSalary: '',
            housingAllowance: '',
            transportAllowance: '',
            fuelAllowance: '',
            positionAllowance: '',
            hardshipAllowance: '',
            otherAllowances: '',
            bank: '',
            accountNumber: '',
            contractEndDate: null,
            resignationDate: null,
            employmentStatus: 'Active'
        });
        setErrors({});
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditMode(false);
        setCurrentEmployeeId(null);
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
        fetchEmployees();
        fetchDepartments();
        showSnackbar('Data refreshed successfully', 'success');
    };

    // Reset all filters
    const handleResetFilters = () => {
        setFilters({
            employeeId: '',
            firstName: '',
            lastName: '',
            departmentName: '',
            role: '',
            employmentStatus: '',
            employmentType: '',
            educationalStatus: '',
            gender: '',
            minExperience: '',
            maxExperience: ''
        });
        showSnackbar('Filters reset successfully', 'info');
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams({
                ...(filters.employeeId && { employeeId: filters.employeeId }),
                ...(filters.firstName && { firstName: filters.firstName }),
                ...(filters.lastName && { lastName: filters.lastName }),
                ...(filters.departmentName && { departmentName: filters.departmentName }),
                ...(filters.role && { role: filters.role }),
                ...(filters.employmentStatus && { employmentStatus: filters.employmentStatus }),
                ...(filters.employmentType && { employmentType: filters.employmentType }),
                ...(filters.educationalStatus && { educationalStatus: filters.educationalStatus }),
                ...(filters.gender && { gender: filters.gender }),
                ...(filters.minExperience && { minExperience: filters.minExperience }),
                ...(filters.maxExperience && { maxExperience: filters.maxExperience })
            });

            const response = await fetch(`/api/employeemanagements/export/data?${params}`);
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
            link.download = `employees-${new Date().toISOString().split('T')[0]}.csv`;
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
                <title>Employee Directory Report</title>
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
                    .status-active { color: green; font-weight: bold; }
                    .status-inactive { color: orange; font-weight: bold; }
                    .status-terminated { color: red; font-weight: bold; }
                    .currency { text-align: right; }
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
                    <div class="report-title">Employee Directory Report</div>
                    <div class="report-title">Currency: ETB</div>
                </div>
                
                <div class="print-info">
                    <div><strong>Printed on:</strong> ${formatDisplayDate(new Date())} ${new Date().toLocaleTimeString()}</div>
                    <div><strong>Total Employees:</strong> ${filteredEmployees.length}</div>
                </div>

                <div class="table-container">
                    ${tableHtml}
                </div>

                <div class="summary">
                    <strong>Employee Summary:</strong><br/>
                    <strong>Total Active:</strong> ${filteredEmployees.filter(e => e.employmentStatus === 'Active').length}<br/>
                    <strong>Total Inactive:</strong> ${filteredEmployees.filter(e => e.employmentStatus === 'Inactive').length}<br/>
                    <strong>Total Terminated:</strong> ${filteredEmployees.filter(e => e.employmentStatus === 'Terminated').length}<br/>
                    <strong>Total Male:</strong> ${filteredEmployees.filter(e => e.gender === 'Male').length}<br/>
                    <strong>Total Female:</strong> ${filteredEmployees.filter(e => e.gender === 'Female').length}<br/>
                    <strong>Total Permanent:</strong> ${filteredEmployees.filter(e => e.employmentType === 'Permanent').length}<br/>
                    <strong>Total Contract:</strong> ${filteredEmployees.filter(e => e.employmentType === 'Contract').length}<br/>
                    <strong>Total Parttime:</strong> ${filteredEmployees.filter(e => e.employmentType === 'Parttime').length}<br/>
                    <strong>Total Intern:</strong> ${filteredEmployees.filter(e => e.employmentType === 'Intern').length}<br/>
                    <strong>Total Monthly Salary Cost:</strong> ${formatCurrency(filteredEmployees.reduce((sum, emp) => sum + calculateTotalSalary(emp), 0))}
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
            currency: 'ETB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // Custom DatePicker component with future date restriction
    const CustomDatePicker = ({ label, value, onChange, maxDate, ...props }) => {
        const [open, setOpen] = useState(false);
        
        return (
            <DatePicker
                label={label}
                value={value}
                onChange={onChange}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                maxDate={maxDate || new Date()}
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

    // Status chip component
    const StatusChip = ({ status }) => {
        const getStatusColor = () => {
            switch(status) {
                case 'Active': return 'success';
                case 'Inactive': return 'warning';
                case 'Terminated': return 'error';
                default: return 'default';
            }
        };

        return (
            <Chip 
                label={status} 
                color={getStatusColor()}
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
        );
    };

    // Role chip component
    const RoleChip = ({ role }) => {
        const getRoleColor = () => {
            switch(role) {
                case 'admin': return 'error';
                case 'manager': return 'warning';
                case 'employee': return 'primary';
                default: return 'default';
            }
        };

        return (
            <Chip 
                label={role.toUpperCase()} 
                color={getRoleColor()}
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
        );
    };

    // Gender chip component
    const GenderChip = ({ gender }) => {
        const getGenderColor = () => {
            switch(gender) {
                case 'Male': return 'primary';
                case 'Female': return 'secondary';
                default: return 'default';
            }
        };

        return (
            <Chip 
                label={gender} 
                color={getGenderColor()}
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
        );
    };

    // Employment Type chip component
    const EmploymentTypeChip = ({ type }) => {
        const getTypeColor = () => {
            switch(type) {
                case 'Permanent': return 'success';
                case 'Contract': return 'warning';
                case 'Parttime': return 'info';
                case 'Intern': return 'primary';
                case 'Extern': return 'secondary';
                case 'Other': return 'default';
                default: return 'default';
            }
        };

        return (
            <Chip 
                label={type} 
                color={getTypeColor()}
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
        );
    };

    // Check if any filters are active
    const hasActiveFilters = () => {
        return Object.values(filters).some(value => value !== '' && value !== null);
    };

    // Get initials for avatar
    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    // Get avatar color based on gender
    const getAvatarColor = (gender) => {
        switch(gender) {
            case 'Male': return '#1976d2';
            case 'Female': return '#9c27b0';
            default: return '#757575';
        }
    };

    // Format full name in sequence: First Name, Middle Name, Last Name
    const formatFullName = (firstName, middleName, lastName) => {
        const nameParts = [firstName];
        if (middleName && middleName.trim()) {
            nameParts.push(middleName.trim());
        }
        nameParts.push(lastName);
        return nameParts.join(' ');
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 2 }}>
                {/* Header with Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            Employee Management
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
                            Add Employee
                        </Button>
                    </Box>
                </Box>

                {/* Summary Cards */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={2}>
                        <Card sx={{ minHeight: '80px' }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <PeopleIcon color="primary" sx={{ mr: 1, fontSize: '1rem' }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Total Employees
                                    </Typography>
                                </Box>
                                <Typography variant="h6">
                                    {filteredEmployees.length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Card sx={{ minHeight: '80px' }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <WorkIcon color="success" sx={{ mr: 1, fontSize: '1rem' }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Active Employees
                                    </Typography>
                                </Box>
                                <Typography variant="h6" color="success">
                                    {filteredEmployees.filter(e => e.employmentStatus === 'Active').length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Card sx={{ minHeight: '80px' }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <PersonIcon color="primary" sx={{ mr: 1, fontSize: '1rem' }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Male Employees
                                    </Typography>
                                </Box>
                                <Typography variant="h6" color="primary">
                                    {filteredEmployees.filter(e => e.gender === 'Male').length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Card sx={{ minHeight: '80px' }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <PersonIcon color="secondary" sx={{ mr: 1, fontSize: '1rem' }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Female Employees
                                    </Typography>
                                </Box>
                                <Typography variant="h6" color="secondary">
                                    {filteredEmployees.filter(e => e.gender === 'Female').length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Card sx={{ minHeight: '80px' }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <BusinessIcon color="warning" sx={{ mr: 1, fontSize: '1rem' }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Permanent
                                    </Typography>
                                </Box>
                                <Typography variant="h6" color="warning">
                                    {filteredEmployees.filter(e => e.employmentType === 'Permanent').length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Card sx={{ minHeight: '80px' }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <BusinessIcon color="info" sx={{ mr: 1, fontSize: '1rem' }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Contract
                                    </Typography>
                                </Box>
                                <Typography variant="h6" color="info">
                                    {filteredEmployees.filter(e => e.employmentType === 'Contract').length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Filters - Collapsible */}
                {showFilters && (
                    <Paper sx={{ p: 1.5, mb: 2 }}>
                        <Grid container spacing={1} alignItems="center">
                            <Grid item xs={12} md={2}>
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
                            <Grid item xs={12} md={2}>
                                <TextField
                                    fullWidth
                                    label="First Name"
                                    value={filters.firstName}
                                    onChange={(e) => handleFilterChange('firstName', e.target.value)}
                                    placeholder="Search first name..."
                                    size="small"
                                    InputProps={{
                                        endAdornment: filters.firstName && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleFilterChange('firstName', '')}
                                                sx={{ mr: -1 }}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField
                                    fullWidth
                                    label="Last Name"
                                    value={filters.lastName}
                                    onChange={(e) => handleFilterChange('lastName', e.target.value)}
                                    placeholder="Search last name..."
                                    size="small"
                                    InputProps={{
                                        endAdornment: filters.lastName && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleFilterChange('lastName', '')}
                                                sx={{ mr: -1 }}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Gender"
                                    value={filters.gender}
                                    onChange={(e) => handleFilterChange('gender', e.target.value)}
                                    size="small"
                                    InputProps={{
                                        endAdornment: filters.gender && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleFilterChange('gender', '')}
                                                sx={{ mr: -1 }}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        )
                                    }}
                                >
                                    <MenuItem value="">All Genders</MenuItem>
                                    {genders.map(gender => (
                                        <MenuItem key={gender} value={gender}>
                                            {gender}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2}>
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
                                    {employmentTypes.map(type => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Department Name"
                                    value={filters.departmentName}
                                    onChange={(e) => handleFilterChange('departmentName', e.target.value)}
                                    size="small"
                                    InputProps={{
                                        endAdornment: filters.departmentName && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleFilterChange('departmentName', '')}
                                                sx={{ mr: -1 }}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        )
                                    }}
                                >
                                    <MenuItem value="">All Departments</MenuItem>
                                    {departments.map(dept => (
                                        <MenuItem key={dept._id} value={dept.name || dept.departmentName}>
                                            {dept.name || dept.departmentName}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Role"
                                    value={filters.role}
                                    onChange={(e) => handleFilterChange('role', e.target.value)}
                                    size="small"
                                    InputProps={{
                                        endAdornment: filters.role && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleFilterChange('role', '')}
                                                sx={{ mr: -1 }}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        )
                                    }}
                                >
                                    <MenuItem value="">All Roles</MenuItem>
                                    {roles.map(role => (
                                        <MenuItem key={role} value={role}>
                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Employment Status"
                                    value={filters.employmentStatus}
                                    onChange={(e) => handleFilterChange('employmentStatus', e.target.value)}
                                    size="small"
                                    InputProps={{
                                        endAdornment: filters.employmentStatus && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleFilterChange('employmentStatus', '')}
                                                sx={{ mr: -1 }}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        )
                                    }}
                                >
                                    <MenuItem value="">All Statuses</MenuItem>
                                    {employmentStatuses.map(status => (
                                        <MenuItem key={status} value={status}>
                                            {status}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Educational Status"
                                    value={filters.educationalStatus}
                                    onChange={(e) => handleFilterChange('educationalStatus', e.target.value)}
                                    size="small"
                                    InputProps={{
                                        endAdornment: filters.educationalStatus && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleFilterChange('educationalStatus', '')}
                                                sx={{ mr: -1 }}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        )
                                    }}
                                >
                                    <MenuItem value="">All Education</MenuItem>
                                    {educationalStatuses.map(education => (
                                        <MenuItem key={education} value={education}>
                                            {education}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField
                                    fullWidth
                                    label="Min Exp"
                                    value={filters.minExperience}
                                    onChange={(e) => handleFilterChange('minExperience', e.target.value)}
                                    placeholder="0"
                                    size="small"
                                    type="number"
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField
                                    fullWidth
                                    label="Max Exp"
                                    value={filters.maxExperience}
                                    onChange={(e) => handleFilterChange('maxExperience', e.target.value)}
                                    placeholder="50"
                                    size="small"
                                    type="number"
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
                            {filters.employeeId && (
                                <Chip
                                    label={`ID: ${filters.employeeId}`}
                                    size="small"
                                    onDelete={() => handleFilterChange('employeeId', '')}
                                />
                            )}
                            {filters.firstName && (
                                <Chip
                                    label={`First: ${filters.firstName}`}
                                    size="small"
                                    onDelete={() => handleFilterChange('firstName', '')}
                                />
                            )}
                            {filters.lastName && (
                                <Chip
                                    label={`Last: ${filters.lastName}`}
                                    size="small"
                                    onDelete={() => handleFilterChange('lastName', '')}
                                />
                            )}
                            {filters.gender && (
                                <Chip
                                    label={`Gender: ${filters.gender}`}
                                    size="small"
                                    onDelete={() => handleFilterChange('gender', '')}
                                />
                            )}
                            {filters.employmentType && (
                                <Chip
                                    label={`Type: ${filters.employmentType}`}
                                    size="small"
                                    onDelete={() => handleFilterChange('employmentType', '')}
                                />
                            )}
                            {filters.departmentName && (
                                <Chip
                                    label={`Dept: ${filters.departmentName}`}
                                    size="small"
                                    onDelete={() => handleFilterChange('departmentName', '')}
                                />
                            )}
                            {filters.role && (
                                <Chip
                                    label={`Role: ${filters.role}`}
                                    size="small"
                                    onDelete={() => handleFilterChange('role', '')}
                                />
                            )}
                            {filters.employmentStatus && (
                                <Chip
                                    label={`Status: ${filters.employmentStatus}`}
                                    size="small"
                                    onDelete={() => handleFilterChange('employmentStatus', '')}
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

                {/* Employees Table */}
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
                                    }}>Emp Type</TableCell>
                                    <TableCell sx={{ 
                                        padding: '6px 8px', 
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.8125rem',
                                        backgroundColor: '#f5f5f5',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1
                                    }}>Position</TableCell>
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
                                    }}>Education</TableCell>
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
                                {filteredEmployees.length > 0 ? (
                                    filteredEmployees.map((employee) => (
                                        <TableRow 
                                            key={employee._id} 
                                            hover
                                            sx={{ height: '36px' }}
                                        >
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Avatar 
                                                        sx={{ 
                                                            width: 30, 
                                                            height: 30, 
                                                            fontSize: '0.75rem',
                                                            bgcolor: getAvatarColor(employee.gender)
                                                        }}
                                                    >
                                                        {getInitials(employee.firstName, employee.lastName)}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {/* Display name in sequence: First Name, Middle Name, Last Name */}
                                                            {formatFullName(employee.firstName, employee.middleName, employee.lastName)}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <EmailIcon sx={{ fontSize: '0.75rem', color: 'text.secondary' }} />
                                                            <Typography variant="caption" color="textSecondary">
                                                                {employee.email}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.8125rem',
                                                fontWeight: 'bold'
                                            }}>{employee.employeeId}</TableCell>
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                <EmploymentTypeChip type={employee.employmentType} />
                                            </TableCell>
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.8125rem'
                                            }}>{employee.position}</TableCell>
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.8125rem'
                                            }}>{employee.departmentName}</TableCell>
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.8125rem'
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <SchoolIcon sx={{ fontSize: '0.75rem', color: 'text.secondary' }} />
                                                    <span>{employee.educationalStatus}</span>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                <StatusChip status={employee.employmentStatus} />
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
                                                            onClick={() => handleEdit(employee)}
                                                            sx={{ padding: '4px' }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                        <IconButton 
                                                            size="small" 
                                                            color="error"
                                                            onClick={() => handleDelete(employee)}
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
                                                No employees found
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Scroll indicator */}
                    {filteredEmployees.length > 10 && (
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
                                Scroll to see more employees
                            </Typography>
                            <KeyboardArrowDownIcon fontSize="small" color="action" />
                        </Box>
                    )}
                </Box>

                {/* Employee Count and Status */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                        Showing {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
                        {hasActiveFilters() && ' (filtered)'}
                    </Typography>
                    
                    {/* Total employee count */}
                    <Typography variant="body2" color="textSecondary">
                        Total: {employees.length} employees
                    </Typography>
                </Box>

                {/* Add/Edit Employee Dialog */}
                <Dialog 
                    open={openDialog} 
                    onClose={handleCloseDialog}
                    maxWidth="md"
                    fullWidth
                    scroll="paper"
                >
                    <DialogTitle>
                        {editMode ? 'Edit Employee' : 'Add New Employee'}
                    </DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            {/* Personal Information */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                                    Personal Information
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Employee ID"
                                    value={formData.employeeId}
                                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                                    error={!!errors.employeeId}
                                    helperText={errors.employeeId}
                                    required
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="First Name"
                                    value={formData.firstName}
                                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                                    error={!!errors.firstName}
                                    helperText={errors.firstName}
                                    required
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Middle Name"
                                    value={formData.middleName}
                                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Last Name"
                                    value={formData.lastName}
                                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                                    error={!!errors.lastName}
                                    helperText={errors.lastName}
                                    required
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth error={!!errors.gender} required size="small">
                                    <InputLabel>Gender</InputLabel>
                                    <Select
                                        value={formData.gender}
                                        label="Gender"
                                        onChange={(e) => handleInputChange('gender', e.target.value)}
                                    >
                                        {genders.map(gender => (
                                            <MenuItem key={gender} value={gender}>
                                                {gender}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.gender && (
                                        <Typography variant="caption" color="error">
                                            {errors.gender}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth error={!!errors.maritalStatus} required size="small">
                                    <InputLabel>Marital Status</InputLabel>
                                    <Select
                                        value={formData.maritalStatus}
                                        label="Marital Status"
                                        onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                                    >
                                        {maritalStatuses.map(status => (
                                            <MenuItem key={status} value={status}>
                                                {status}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.maritalStatus && (
                                        <Typography variant="caption" color="error">
                                            {errors.maritalStatus}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth error={!!errors.employmentType} required size="small">
                                    <InputLabel>Employment Type</InputLabel>
                                    <Select
                                        value={formData.employmentType}
                                        label="Employment Type"
                                        onChange={(e) => handleInputChange('employmentType', e.target.value)}
                                    >
                                        {employmentTypes.map(type => (
                                            <MenuItem key={type} value={type}>
                                                {type}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.employmentType && (
                                        <Typography variant="caption" color="error">
                                            {errors.employmentType}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomDatePicker
                                    label="Employment Date"
                                    value={formData.employmentDate}
                                    onChange={(date) => handleInputChange('employmentDate', date)}
                                    maxDate={new Date()}
                                />
                                {errors.employmentDate && (
                                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                                        {errors.employmentDate}
                                    </Typography>
                                )}
                            </Grid>
                            {formData.employmentType === 'Contract' && (
                                <Grid item xs={12} md={6}>
                                    <CustomDatePicker
                                        label="Contract End Date"
                                        value={formData.contractEndDate}
                                        onChange={(date) => handleInputChange('contractEndDate', date)}
                                        minDate={formData.employmentDate}
                                    />
                                    {errors.contractEndDate && (
                                        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                                            {errors.contractEndDate}
                                        </Typography>
                                    )}
                                </Grid>
                            )}
                            <Grid item xs={12} md={6}>
                                <CustomDatePicker
                                    label="Resignation Date"
                                    value={formData.resignationDate}
                                    onChange={(date) => handleInputChange('resignationDate', date)}
                                    maxDate={new Date()}
                                />
                                {errors.resignationDate && (
                                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                                        {errors.resignationDate}
                                    </Typography>
                                )}
                            </Grid>

                            {/* Contact Information */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, mt: 2 }}>
                                    Contact Information
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    error={!!errors.email}
                                    helperText={errors.email}
                                    required
                                    size="small"
                                    InputProps={{
                                        startAdornment: <EmailIcon sx={{ mr: 1, fontSize: '1rem', color: 'action.active' }} />
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Phone"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    error={!!errors.phone}
                                    helperText={errors.phone || "Format: 0911111111"}
                                    required
                                    size="small"
                                    InputProps={{
                                        startAdornment: <PhoneIcon sx={{ mr: 1, fontSize: '1rem', color: 'action.active' }} />
                                    }}
                                />
                            </Grid>

                            {/* Qualifications */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, mt: 2 }}>
                                    Qualifications
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth error={!!errors.educationalStatus} required size="small">
                                    <InputLabel>Educational Status</InputLabel>
                                    <Select
                                        value={formData.educationalStatus}
                                        label="Educational Status"
                                        onChange={(e) => handleInputChange('educationalStatus', e.target.value)}
                                    >
                                        {educationalStatuses.map(education => (
                                            <MenuItem key={education} value={education}>
                                                {education}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.educationalStatus && (
                                        <Typography variant="caption" color="error">
                                            {errors.educationalStatus}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Qualification"
                                    value={formData.qualification}
                                    onChange={(e) => handleInputChange('qualification', e.target.value)}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Experience (Years)"
                                    type="number"
                                    value={formData.experience}
                                    onChange={(e) => handleInputChange('experience', e.target.value)}
                                    error={!!errors.experience}
                                    helperText={errors.experience}
                                    required
                                    size="small"
                                    InputProps={{
                                        inputProps: { min: 0, max: 50, step: 0.5 }
                                    }}
                                />
                            </Grid>

                            {/* Employment Details */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, mt: 2 }}>
                                    Employment Details
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth error={!!errors.departmentId} required size="small">
                                    <InputLabel>Department Name</InputLabel>
                                    <Select
                                        value={formData.departmentId}
                                        label="Department Name"
                                        onChange={(e) => handleInputChange('departmentId', e.target.value)}
                                    >
                                        <MenuItem value="">Select Department</MenuItem>
                                        {departments.map(dept => (
                                            <MenuItem key={dept._id} value={dept._id}>
                                                {dept.name || dept.departmentName}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.departmentId && (
                                        <Typography variant="caption" color="error">
                                            {errors.departmentId}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth error={!!errors.role} required size="small">
                                    <InputLabel>Role</InputLabel>
                                    <Select
                                        value={formData.role}
                                        label="Role"
                                        onChange={(e) => handleInputChange('role', e.target.value)}
                                    >
                                        {roles.map(role => (
                                            <MenuItem key={role} value={role}>
                                                {role.charAt(0).toUpperCase() + role.slice(1)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.role && (
                                        <Typography variant="caption" color="error">
                                            {errors.role}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Position"
                                    value={formData.position}
                                    onChange={(e) => handleInputChange('position', e.target.value)}
                                    error={!!errors.position}
                                    helperText={errors.position}
                                    required
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth error={!!errors.employmentStatus} required size="small">
                                    <InputLabel>Employment Status</InputLabel>
                                    <Select
                                        value={formData.employmentStatus}
                                        label="Employment Status"
                                        onChange={(e) => handleInputChange('employmentStatus', e.target.value)}
                                    >
                                        {employmentStatuses.map(status => (
                                            <MenuItem key={status} value={status}>
                                                {status}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.employmentStatus && (
                                        <Typography variant="caption" color="error">
                                            {errors.employmentStatus}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>

                            {/* Salary Information */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, mt: 2 }}>
                                    Salary Information (ETB)
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Basic Salary"
                                    type="number"
                                    value={formData.basicSalary}
                                    onChange={(e) => handleInputChange('basicSalary', e.target.value)}
                                    error={!!errors.basicSalary}
                                    helperText={errors.basicSalary}
                                    required
                                    size="small"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
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
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
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
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Fuel Allowance"
                                    type="number"
                                    value={formData.fuelAllowance}
                                    onChange={(e) => handleInputChange('fuelAllowance', e.target.value)}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Position Allowance"
                                    type="number"
                                    value={formData.positionAllowance}
                                    onChange={(e) => handleInputChange('positionAllowance', e.target.value)}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Hardship Allowance"
                                    type="number"
                                    value={formData.hardshipAllowance}
                                    onChange={(e) => handleInputChange('hardshipAllowance', e.target.value)}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
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
                                />
                            </Grid>

                            {/* Bank Information */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, mt: 2 }}>
                                    Bank Information
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Bank</InputLabel>
                                    <Select
                                        value={formData.bank}
                                        label="Bank"
                                        onChange={(e) => handleInputChange('bank', e.target.value)}
                                    >
                                        <MenuItem value="">Select Bank</MenuItem>
                                        {banks.map(bank => (
                                            <MenuItem key={bank} value={bank}>
                                                {bank}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Account Number"
                                    value={formData.accountNumber}
                                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                                    error={!!errors.accountNumber}
                                    helperText={errors.accountNumber}
                                    size="small"
                                />
                            </Grid>

                            {/* Optional Information */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, mt: 2 }}>
                                    Optional Information
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="TIN"
                                    value={formData.tin}
                                    onChange={(e) => handleInputChange('tin', e.target.value)}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Pension No."
                                    value={formData.pensionNo}
                                    onChange={(e) => handleInputChange('pensionNo', e.target.value)}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="FAN No."
                                    value={formData.fanNo}
                                    onChange={(e) => handleInputChange('fanNo', e.target.value)}
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
                            {submitting ? 'Saving...' : (editMode ? 'Update Employee' : 'Add Employee')}
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
                            Are you sure you want to delete this employee?
                        </Typography>
                        {employeeToDelete && (
                            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                                <Typography variant="body2">
                                    <strong>Name:</strong> {formatFullName(employeeToDelete.firstName, employeeToDelete.middleName, employeeToDelete.lastName)}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Employee ID:</strong> {employeeToDelete.employeeId}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Gender:</strong> {employeeToDelete.gender}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Employment Type:</strong> {employeeToDelete.employmentType}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Position:</strong> {employeeToDelete.position}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Department Name:</strong> {employeeToDelete.departmentName}
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

export default EmployeeManagement;