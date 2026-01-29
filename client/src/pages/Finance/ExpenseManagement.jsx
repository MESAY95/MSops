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
    InputAdornment,
    LinearProgress,
    Divider,
    Collapse
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
    Add as AddIcon,
    Print as PrintIcon,
    Refresh as RefreshIcon,
    GetApp as ExportIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    FilterList as FilterIcon,
    CalendarToday as CalendarIcon,
    Clear as ClearIcon,
    AttachMoney as AttachMoneyIcon,
    Receipt as ReceiptIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Payment as PaymentIcon,
    Visibility as VisibilityIcon,
    Search as SearchIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    TrendingUp as TrendingUpIcon,
    Link as LinkIcon,
    Save as SaveIcon,
    Calculate as CalculateIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Straighten as StraightenIcon,
    ConfirmationNumber as ConfirmationNumberIcon
} from '@mui/icons-material';

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

const ExpenseManagement = () => {
    // State Management
    const [expenses, setExpenses] = useState([]);
    const [filteredExpenses, setFilteredExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        category: '',
        status: '',
        department: '',
        search: '',
        startDate: null,
        endDate: null,
        minAmount: '',
        maxAmount: ''
    });
    
    const [totals, setTotals] = useState({
        totalAmount: 0,
        totalVAT: 0,
        pendingCount: 0,
        approvedCount: 0
    });
    
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentExpenseId, setCurrentExpenseId] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [submitting, setSubmitting] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [showCalculations, setShowCalculations] = useState(false);
    const tableRef = useRef();

    // Get current date
    const getCurrentDate = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    };

    // Form State with expenseCode field
    const [formData, setFormData] = useState({
        expenseCode: '', // Added expenseCode field
        description: '',
        category: '',
        quantity: 1,
        unit: 'pcs', // Default unit
        unitPrice: '',
        vatRate: 15, // Fixed 15% VAT
        vatAmount: 0,
        subtotal: 0,
        amount: 0,
        currency: 'ETB',
        date: getCurrentDate(),
        department: '',
        paidTo: '',
        paymentMethod: 'cash',
        referenceNumber: '',
        receiptUrl: '',
        remarks: ''
    });

    const [errors, setErrors] = useState({});

    // Data Constants
    const categories = ['Direct', 'Indirect', 'Investment', 'Other'];
    const statusOptions = [
        { value: 'pending', label: 'Pending', color: 'warning' },
        { value: 'approved', label: 'Approved', color: 'success' },
        { value: 'rejected', label: 'Rejected', color: 'error' },
        { value: 'paid', label: 'Paid', color: 'info' }
    ];
    
    const departments = ['Finance', 'HR', 'IT', 'Marketing', 'Operations', 'Sales', 'R&D', 'Production', 'Supply Chain', 'Quality Control'];
    const paymentMethods = [
        { value: 'cash', label: 'Cash' },
        { value: 'bank_transfer', label: 'Bank Transfer' },
        { value: 'check', label: 'Check' },
        { value: 'credit_card', label: 'Credit Card' },
        { value: 'mobile_payment', label: 'Mobile Payment' }
    ];

    // Unit options
    const unitOptions = [
        { value: 'pcs', label: 'Pieces (pcs)' },
        { value: 'kg', label: 'Kilogram (Kg)' },
        { value: 'gm', label: 'Gram (gm)' },
        { value: 'lt', label: 'Liter (Lt)' },
        { value: 'carton', label: 'Carton' },
        { value: 'no', label: 'Number (No.)' },
        { value: 'hr', label: 'Hour (hr)' },
        { value: 'm3', label: 'Cubic Meter (m³)' },
        { value: 'm2', label: 'Square Meter (m²)' },
        { value: 'meter', label: 'Meter' },
        { value: 'set', label: 'Set' },
        { value: 'pack', label: 'Pack' },
        { value: 'pad', label: 'Pad' },
        { value: 'bag', label: 'Bag' },
        { value: 'kw', label: 'Kilowatt (KW)' },
        { value: 'day', label: 'Day' },
        { value: 'month', label: 'Month' },
        { value: 'year', label: 'Year' },
        { value: 'trip', label: 'Trip' },
        { value: 'event', label: 'Event' },
        { value: 'lump_sum', label: 'Lump Sum' },
        { value: 'contract', label: 'Contract' },
        { value: 'md', label: 'MD (Man Day)' },
        { value: 'other', label: 'Other' }
    ];

    // Helper function to validate URL
    const isValidUrl = (url) => {
        if (!url || url.trim() === '') return true;
        try {
            new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    };

    // Calculate amounts based on quantity and unit price
    const calculateAmounts = (quantity, unitPrice, vatRate = 15) => {
        const qty = parseFloat(quantity) || 0;
        const price = parseFloat(unitPrice) || 0;
        const rate = parseFloat(vatRate) || 0;
        
        const subtotal = qty * price;
        const vatAmount = subtotal * (rate / 100);
        const total = subtotal + vatAmount;
        
        return {
            subtotal: parseFloat(subtotal.toFixed(2)),
            vatAmount: parseFloat(vatAmount.toFixed(2)),
            amount: parseFloat(total.toFixed(2))
        };
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    useEffect(() => {
        // Apply filters to expenses
        let filtered = [...expenses];
        
        // Filter by search text
        if (filters.search) {
            filtered = filtered.filter(expense => 
                expense.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
                expense.paidTo?.toLowerCase().includes(filters.search.toLowerCase()) ||
                (expense.expenseCode && expense.expenseCode.toLowerCase().includes(filters.search.toLowerCase())) // Added expenseCode search
            );
        }
        
        // Filter by category
        if (filters.category) {
            filtered = filtered.filter(expense => expense.category === filters.category);
        }
        
        // Filter by status
        if (filters.status) {
            filtered = filtered.filter(expense => expense.status === filters.status);
        }
        
        // Filter by department
        if (filters.department) {
            filtered = filtered.filter(expense => expense.department === filters.department);
        }
        
        // Filter by amount range
        if (filters.minAmount) {
            filtered = filtered.filter(expense => expense.amount >= parseFloat(filters.minAmount));
        }
        
        if (filters.maxAmount) {
            filtered = filtered.filter(expense => expense.amount <= parseFloat(filters.maxAmount));
        }
        
        // Filter by date range
        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            startDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(expense => new Date(expense.date) >= startDate);
        }
        
        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(expense => new Date(expense.date) <= endDate);
        }
        
        // Sort by date ascending (oldest first) to display current entries at bottom
        const sortedFiltered = filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        setFilteredExpenses(sortedFiltered);
        calculateTotals(sortedFiltered);
        
    }, [expenses, filters]);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/expenses?limit=1000`);
            const data = await response.json();
            
            if (data.success) {
                // Sort by date ascending (oldest first) to display current entries at bottom
                const sortedExpenses = (data.data || []).sort((a, b) => 
                    new Date(a.date) - new Date(b.date)
                );
                
                setExpenses(sortedExpenses);
            } else {
                throw new Error(data.message || 'Failed to fetch expenses');
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
            showSnackbar('Error fetching expenses', 'error');
            setExpenses([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotals = (expenseList) => {
        const totals = expenseList.reduce((acc, expense) => {
            acc.totalAmount += expense.amount || 0;
            acc.totalVAT += expense.vatAmount || 0;
            if (expense.status === 'pending') acc.pendingCount += 1;
            if (expense.status === 'approved') acc.approvedCount += 1;
            return acc;
        }, { totalAmount: 0, totalVAT: 0, pendingCount: 0, approvedCount: 0 });
        
        setTotals(totals);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.description?.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.trim().length < 3) {
            newErrors.description = 'Description must be at least 3 characters';
        }
        
        if (!formData.category) {
            newErrors.category = 'Category is required';
        } else if (!categories.includes(formData.category)) {
            newErrors.category = 'Invalid category';
        }
        
        if (!formData.quantity || formData.quantity <= 0) {
            newErrors.quantity = 'Quantity must be greater than 0';
        }
        
        if (!formData.unit) {
            newErrors.unit = 'Unit is required';
        }
        
        if (!formData.unitPrice || formData.unitPrice <= 0) {
            newErrors.unitPrice = 'Unit price must be greater than 0';
        }
        
        if (!formData.department) {
            newErrors.department = 'Department is required';
        } else if (!departments.includes(formData.department)) {
            newErrors.department = 'Invalid department';
        }
        
        if (!formData.paidTo?.trim()) {
            newErrors.paidTo = 'Paid To is required';
        }
        
        if (formData.paymentMethod !== 'cash' && !formData.referenceNumber?.trim()) {
            newErrors.referenceNumber = 'Reference number is required for this payment method';
        }
        
        // Validate URL if provided
        if (formData.receiptUrl && !isValidUrl(formData.receiptUrl)) {
            newErrors.receiptUrl = 'Please enter a valid URL';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const url = editMode 
                ? `${API_BASE_URL}/expenses/${currentExpenseId}`
                : `${API_BASE_URL}/expenses`;
            
            const method = editMode ? 'PUT' : 'POST';
            
            // Prepare data exactly as the backend expects
            const submitData = {
                expenseCode: formData.expenseCode?.trim() || null, // Added expenseCode
                description: formData.description.trim(),
                category: formData.category,
                quantity: parseFloat(formData.quantity),
                unit: formData.unit,
                unitPrice: parseFloat(formData.unitPrice),
                vatRate: 15, // Fixed 15% VAT
                vatAmount: formData.vatAmount,
                subtotal: formData.subtotal,
                amount: formData.amount,
                currency: formData.currency || 'ETB',
                date: formatDateForAPI(formData.date),
                department: formData.department,
                paidTo: formData.paidTo.trim(),
                paymentMethod: formData.paymentMethod,
                referenceNumber: formData.referenceNumber?.trim() || '',
                receiptUrl: formData.receiptUrl?.trim() || '',
                remarks: formData.remarks?.trim() || ''
            };

            console.log('Submitting expense data:', {
                url,
                method,
                data: submitData
            });
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData),
            });
            
            console.log('Response status:', response.status);
            
            const result = await response.json();
            console.log('Response data:', result);
            
            if (response.ok && result.success) {
                const message = editMode ? 'Expense updated successfully!' : 'Expense submitted successfully!';
                showSnackbar(message, 'success');
                handleCloseDialog();
                fetchExpenses();
            } else {
                let errorMsg = result.message || 'Error submitting expense';
                
                // Handle duplicate expense code error
                if (errorMsg.includes('Expense code already exists') || errorMsg.includes('Duplicate expense code')) {
                    errorMsg = 'This expense code already exists. Please use a different code or leave it empty to auto-generate.';
                }
                
                if (result.errors) {
                    if (Array.isArray(result.errors)) {
                        errorMsg = result.errors.map(err => 
                            typeof err === 'string' ? err : `${err.field || ''}: ${err.msg || err.message}`
                        ).join(', ');
                    } else if (typeof result.errors === 'object') {
                        errorMsg = Object.entries(result.errors).map(([key, value]) => `${key}: ${value}`).join(', ');
                    }
                }
                
                showSnackbar(errorMsg, 'error');
            }
        } catch (error) {
            console.error('Error submitting expense:', error);
            showSnackbar('Network error. Please check your connection.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (expense) => {
        setFormData({
            expenseCode: expense.expenseCode || '', // Added expenseCode
            description: expense.description || '',
            category: expense.category || '',
            quantity: expense.quantity || 1,
            unit: expense.unit || 'pcs',
            unitPrice: expense.unitPrice || '',
            vatRate: expense.vatRate || 15,
            vatAmount: expense.vatAmount || 0,
            subtotal: expense.subtotal || 0,
            amount: expense.amount || 0,
            currency: expense.currency || 'ETB',
            date: expense.date ? new Date(expense.date) : getCurrentDate(),
            department: expense.department || '',
            paidTo: expense.paidTo || '',
            paymentMethod: expense.paymentMethod || 'cash',
            referenceNumber: expense.referenceNumber || '',
            receiptUrl: expense.receiptUrl || '',
            remarks: expense.remarks || ''
        });
        setEditMode(true);
        setCurrentExpenseId(expense._id);
        setOpenDialog(true);
        setErrors({});
    };

    const handleDelete = (expense) => {
        setExpenseToDelete(expense);
        setDeleteDialog(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/expenses/${expenseToDelete._id}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showSnackbar('Expense deleted successfully', 'success');
                fetchExpenses();
            } else {
                throw new Error(result.message || 'Failed to delete expense');
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
            showSnackbar(error.message || 'Error deleting expense', 'error');
        } finally {
            setDeleteDialog(false);
            setExpenseToDelete(null);
        }
    };

    const handleUpdateStatus = async (expenseId, status) => {
        try {
            const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showSnackbar(`Expense ${status} successfully`, 'success');
                fetchExpenses();
            } else {
                throw new Error(result.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            showSnackbar(error.message || 'Error updating status', 'error');
        }
    };

    const handleInputChange = (field, value) => {
        const newFormData = { ...formData, [field]: value };
        
        // Calculate amounts when quantity or unit price changes
        if (field === 'quantity' || field === 'unitPrice') {
            const { subtotal, vatAmount, amount } = calculateAmounts(
                field === 'quantity' ? value : newFormData.quantity,
                field === 'unitPrice' ? value : newFormData.unitPrice,
                newFormData.vatRate
            );
            
            newFormData.subtotal = subtotal;
            newFormData.vatAmount = vatAmount;
            newFormData.amount = amount;
        }
        
        setFormData(newFormData);
        
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
        
        // Real-time URL validation for receiptUrl
        if (field === 'receiptUrl' && value.trim() !== '') {
            if (!isValidUrl(value)) {
                setErrors(prev => ({
                    ...prev,
                    receiptUrl: 'Please enter a valid URL'
                }));
            }
        }
    };

    const handleOpenDialog = () => {
        setOpenDialog(true);
        setEditMode(false);
        setCurrentExpenseId(null);
        setFormData({
            expenseCode: '', // Added expenseCode
            description: '',
            category: '',
            quantity: 1,
            unit: 'pcs',
            unitPrice: '',
            vatRate: 15,
            vatAmount: 0,
            subtotal: 0,
            amount: 0,
            currency: 'ETB',
            date: getCurrentDate(),
            department: '',
            paidTo: '',
            paymentMethod: 'cash',
            referenceNumber: '',
            receiptUrl: '',
            remarks: ''
        });
        setErrors({});
        setShowCalculations(false);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditMode(false);
        setCurrentExpenseId(null);
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
        fetchExpenses();
        showSnackbar('Data refreshed successfully', 'success');
    };

    // Reset all filters
    const handleResetFilters = () => {
        setFilters({
            category: '',
            status: '',
            department: '',
            search: '',
            startDate: null,
            endDate: null,
            minAmount: '',
            maxAmount: ''
        });
        showSnackbar('Filters reset successfully', 'info');
    };

    const handleExport = async (format = 'csv') => {
        try {
            const params = new URLSearchParams({
                format,
                ...Object.entries(filters).reduce((acc, [key, value]) => {
                    if (value) acc[key] = value;
                    return acc;
                }, {})
            });

            const response = await fetch(`${API_BASE_URL}/expenses/export/data?${params}`);
            
            if (format === 'csv') {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                showSnackbar('Export completed successfully', 'success');
            } else {
                const data = await response.json();
                const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `expenses_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                showSnackbar('Export completed successfully', 'success');
            }
        } catch (error) {
            console.error('Error exporting expenses:', error);
            showSnackbar('Error exporting expenses', 'error');
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const tableHtml = tableRef.current?.innerHTML || '';
        
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Expense Management Report</title>
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
                    <div class="report-title">Expense Management Report</div>
                    <div class="report-title">Currency: ETB, VAT: 15%</div>
                </div>
                
                <div class="print-info">
                    <div><strong>Printed on:</strong> ${formatDisplayDate(getCurrentDate().toString())} ${new Date().toLocaleTimeString()}</div>
                </div>

                <div class="table-container">
                    ${tableHtml}
                </div>

                <div class="summary">
                    <strong>Summary (ETB):</strong><br/>
                    <strong>Total Amount (with VAT):</strong> ${formatCurrency(totals?.totalAmount || 0)}<br/>
                    <strong>Total VAT (15%):</strong> ${formatCurrency(totals?.totalVAT || 0)}<br/>
                    <strong>Pending Expenses:</strong> ${totals?.pendingCount || 0}<br/>
                    <strong>Approved Expenses:</strong> ${totals?.approvedCount || 0}<br/>
                    <strong>Total Expenses:</strong> ${filteredExpenses.length}
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

    // Custom DatePicker component
    const CustomDatePicker = ({ label, value, onChange, ...props }) => {
        const [open, setOpen] = useState(false);
        
        return (
            <DatePicker
                label={label}
                value={value || getCurrentDate()}
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

    const getStatusChip = (status) => {
        const statusOption = statusOptions.find(opt => opt.value === status);
        return (
            <Chip
                label={statusOption?.label || status}
                color={statusOption?.color || 'default'}
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
        return (
            filters.category !== '' ||
            filters.status !== '' ||
            filters.department !== '' ||
            filters.search !== '' ||
            filters.startDate !== null ||
            filters.endDate !== null ||
            filters.minAmount !== '' ||
            filters.maxAmount !== ''
        );
    };

    const handleRowSelect = (expenseId) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(expenseId)) {
            newSelected.delete(expenseId);
        } else {
            newSelected.add(expenseId);
        }
        setSelectedRows(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedRows.size === filteredExpenses.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(filteredExpenses.map(exp => exp._id)));
        }
    };

    const handleBulkStatusUpdate = async (status) => {
        if (selectedRows.size === 0) {
            showSnackbar('Please select expenses to update', 'warning');
            return;
        }

        if (!window.confirm(`Are you sure you want to update ${selectedRows.size} expense(s) to ${status}?`)) return;

        try {
            const response = await fetch(`${API_BASE_URL}/expenses/bulk/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    expenseIds: Array.from(selectedRows),
                    status
                }),
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showSnackbar(`Updated ${result.data.modifiedCount} expense(s) to ${status}`, 'success');
                setSelectedRows(new Set());
                fetchExpenses();
            } else {
                throw new Error(result.message || 'Failed to update expenses');
            }
        } catch (error) {
            console.error('Error in bulk status update:', error);
            showSnackbar(error.message || 'Error updating expenses', 'error');
        }
    };

    // Get unit label from value
    const getUnitLabel = (unitValue) => {
        const unit = unitOptions.find(u => u.value === unitValue);
        return unit ? unit.label : unitValue;
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 2 }}>
                {/* Header with Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            Expense Management
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Track, manage, and analyze company expenses (VAT: 15%)
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Refresh">
                            <IconButton onClick={handleRefresh} size="small">
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Export CSV">
                            <IconButton onClick={() => handleExport('csv')} size="small">
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
                        {selectedRows.size > 0 && (
                            <Select
                                size="small"
                                value=""
                                displayEmpty
                                onChange={(e) => handleBulkStatusUpdate(e.target.value)}
                                sx={{ minWidth: 120, height: '32px' }}
                            >
                                <MenuItem value="" disabled>Bulk Actions</MenuItem>
                                <MenuItem value="approved">Approve Selected</MenuItem>
                                <MenuItem value="rejected">Reject Selected</MenuItem>
                                <MenuItem value="paid">Mark as Paid</MenuItem>
                            </Select>
                        )}
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenDialog}
                            size="small"
                            sx={{ ml: 1 }}
                        >
                            Add Expense
                        </Button>
                    </Box>
                </Box>

                {/* Summary Cards */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ minHeight: '80px' }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <AttachMoneyIcon color="primary" sx={{ mr: 1, fontSize: '1rem' }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Total Amount (ETB)
                                    </Typography>
                                </Box>
                                <Typography variant="h6" color="primary">
                                    {formatCurrency(totals?.totalAmount || 0)}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    (VAT: {formatCurrency(totals?.totalVAT || 0)})
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ minHeight: '80px' }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <ReceiptIcon color="warning" sx={{ mr: 1, fontSize: '1rem' }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Pending Approval
                                    </Typography>
                                </Box>
                                <Typography variant="h6" color="warning.main">
                                    {totals?.pendingCount || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ minHeight: '80px' }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: '1rem' }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Approved Expenses
                                    </Typography>
                                </Box>
                                <Typography variant="h6" color="success.main">
                                    {totals?.approvedCount || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ minHeight: '80px' }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <TrendingUpIcon color="info" sx={{ mr: 1, fontSize: '1rem' }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Total Expenses
                                    </Typography>
                                </Box>
                                <Typography variant="h6" color="info.main">
                                    {filteredExpenses.length}
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
                                    placeholder="Search expenses..."
                                    variant="outlined"
                                    size="small"
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
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
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={2.25}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={filters.category}
                                        label="Category"
                                        onChange={(e) => handleFilterChange('category', e.target.value)}
                                        endAdornment={filters.category && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleFilterChange('category', '')}
                                                sx={{ mr: -1 }}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    >
                                        <MenuItem value="">All Categories</MenuItem>
                                        {categories.map(category => (
                                            <MenuItem key={category} value={category}>
                                                {category}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={2.25}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={filters.status}
                                        label="Status"
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        endAdornment={filters.status && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleFilterChange('status', '')}
                                                sx={{ mr: -1 }}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    >
                                        <MenuItem value="">All Status</MenuItem>
                                        {statusOptions.map(option => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={2.25}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Department</InputLabel>
                                    <Select
                                        value={filters.department}
                                        label="Department"
                                        onChange={(e) => handleFilterChange('department', e.target.value)}
                                        endAdornment={filters.department && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleFilterChange('department', '')}
                                                sx={{ mr: -1 }}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    >
                                        <MenuItem value="">All Departments</MenuItem>
                                        {departments.map(dept => (
                                            <MenuItem key={dept} value={dept}>
                                                {dept}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={2.25}>
                                <CustomDatePicker
                                    label="Start Date"
                                    value={filters.startDate}
                                    onChange={(date) => handleFilterChange('startDate', date)}
                                />
                            </Grid>
                            <Grid item xs={12} md={2.25}>
                                <CustomDatePicker
                                    label="End Date"
                                    value={filters.endDate}
                                    onChange={(date) => handleFilterChange('endDate', date)}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Min Amount (ETB)"
                                    type="number"
                                    size="small"
                                    value={filters.minAmount}
                                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">ETB</InputAdornment>,
                                        endAdornment: filters.minAmount && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleFilterChange('minAmount', '')}
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
                                    fullWidth
                                    label="Max Amount (ETB)"
                                    type="number"
                                    size="small"
                                    value={filters.maxAmount}
                                    onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">ETB</InputAdornment>,
                                        endAdornment: filters.maxAmount && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleFilterChange('maxAmount', '')}
                                                sx={{ mr: -1 }}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        )
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
                            {filters.category && (
                                <Chip
                                    label={`Category: ${filters.category}`}
                                    size="small"
                                    onDelete={() => handleFilterChange('category', '')}
                                />
                            )}
                            {filters.status && (
                                <Chip
                                    label={`Status: ${statusOptions.find(s => s.value === filters.status)?.label || filters.status}`}
                                    size="small"
                                    onDelete={() => handleFilterChange('status', '')}
                                />
                            )}
                            {filters.department && (
                                <Chip
                                    label={`Department: ${filters.department}`}
                                    size="small"
                                    onDelete={() => handleFilterChange('department', '')}
                                />
                            )}
                            {filters.search && (
                                <Chip
                                    label={`Search: ${filters.search}`}
                                    size="small"
                                    onDelete={() => handleFilterChange('search', '')}
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

                {/* Expenses Table */}
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
                        {loading && <LinearProgress />}
                        <Table sx={{ minWidth: 650 }} size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ 
                                        padding: '6px 8px', 
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.8125rem',
                                        minWidth: '50px',
                                        width: '50px',
                                        backgroundColor: '#f5f5f5',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1
                                    }}>
                                        <Checkbox
                                            indeterminate={selectedRows.size > 0 && selectedRows.size < filteredExpenses.length}
                                            checked={filteredExpenses.length > 0 && selectedRows.size === filteredExpenses.length}
                                            onChange={handleSelectAll}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell sx={{ 
                                        padding: '6px 8px', 
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.8125rem',
                                        backgroundColor: '#f5f5f5',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1
                                    }}>Description</TableCell>
                                    <TableCell sx={{ 
                                        padding: '6px 8px', 
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.8125rem',
                                        backgroundColor: '#f5f5f5',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1
                                    }}>Qty</TableCell>
                                    <TableCell sx={{ 
                                        padding: '6px 8px', 
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.8125rem',
                                        backgroundColor: '#f5f5f5',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1
                                    }}>Unit</TableCell>
                                    <TableCell sx={{ 
                                        padding: '6px 8px', 
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.8125rem',
                                        backgroundColor: '#f5f5f5',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1
                                    }}>Unit Price</TableCell>
                                    <TableCell sx={{ 
                                        padding: '6px 8px', 
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.8125rem',
                                        backgroundColor: '#f5f5f5',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1
                                    }}>Subtotal</TableCell>
                                    <TableCell sx={{ 
                                        padding: '6px 8px', 
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.8125rem',
                                        backgroundColor: '#f5f5f5',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1
                                    }}>VAT (15%)</TableCell>
                                    <TableCell sx={{ 
                                        padding: '6px 8px', 
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.8125rem',
                                        backgroundColor: '#f5f5f5',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1
                                    }}>Total</TableCell>
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
                                {filteredExpenses.length > 0 ? (
                                    filteredExpenses.map((expense) => (
                                        <TableRow 
                                            key={expense._id} 
                                            hover
                                            sx={{ height: '36px' }}
                                        >
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap',
                                                minWidth: '50px',
                                                width: '50px'
                                            }}>
                                                <Checkbox
                                                    checked={selectedRows.has(expense._id)}
                                                    onChange={() => handleRowSelect(expense._id)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap',
                                                maxWidth: '200px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                fontSize: '0.8125rem'
                                            }} title={expense.description}>
                                                {expense.description}
                                                <Typography variant="caption" color="textSecondary" display="block">
                                                    {expense.department} • Paid to: {expense.paidTo}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.8125rem',
                                                textAlign: 'center'
                                            }}>
                                                {expense.quantity || 1}
                                            </TableCell>
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.8125rem'
                                            }}>
                                                <Chip
                                                    label={getUnitLabel(expense.unit)}
                                                    size="small"
                                                    variant="outlined"
                                                    color="secondary"
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
                                            }}>
                                                {formatCurrency(expense.unitPrice || 0)}
                                            </TableCell>
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.8125rem'
                                            }}>
                                                {formatCurrency(expense.subtotal || 0)}
                                            </TableCell>
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.8125rem',
                                                color: 'success.main'
                                            }}>
                                                {formatCurrency(expense.vatAmount || 0)}
                                            </TableCell>
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.8125rem'
                                            }}>
                                                <Typography 
                                                    fontWeight="bold"
                                                    variant="body2"
                                                    sx={{ fontSize: '0.8125rem' }}
                                                >
                                                    {formatCurrency(expense.amount || 0)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap',
                                                minWidth: '80px',
                                                width: '80px'
                                            }}>
                                                <DateDisplayCell date={expense.date} />
                                            </TableCell>
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {getStatusChip(expense.status)}
                                            </TableCell>
                                            <TableCell sx={{ 
                                                padding: '4px 8px',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                <Box sx={{ display: 'flex', gap: 0.25 }}>
                                                    <Tooltip title="View/Edit">
                                                        <IconButton 
                                                            size="small" 
                                                            color="primary"
                                                            onClick={() => handleEdit(expense)}
                                                            sx={{ padding: '4px' }}
                                                        >
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {expense.status === 'pending' && (
                                                        <>
                                                            <Tooltip title="Approve">
                                                                <IconButton 
                                                                    size="small" 
                                                                    color="success"
                                                                    onClick={() => handleUpdateStatus(expense._id, 'approved')}
                                                                    sx={{ padding: '4px' }}
                                                                >
                                                                    <CheckCircleIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Reject">
                                                                <IconButton 
                                                                    size="small" 
                                                                    color="error"
                                                                    onClick={() => handleUpdateStatus(expense._id, 'rejected')}
                                                                    sx={{ padding: '4px' }}
                                                                >
                                                                    <CancelIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                    {expense.status === 'approved' && (
                                                        <Tooltip title="Mark as Paid">
                                                            <IconButton 
                                                                size="small" 
                                                                color="info"
                                                                onClick={() => handleUpdateStatus(expense._id, 'paid')}
                                                                sx={{ padding: '4px' }}
                                                            >
                                                                <PaymentIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip title="Delete">
                                                        <IconButton 
                                                            size="small" 
                                                            color="error"
                                                            onClick={() => handleDelete(expense)}
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
                                        <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                                            <Typography color="textSecondary">
                                                {loading ? 'Loading expenses...' : 'No expenses found'}
                                            </Typography>
                                            {!loading && (
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<AddIcon />}
                                                    onClick={handleOpenDialog}
                                                    sx={{ mt: 1 }}
                                                >
                                                    Add First Expense
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Updated scroll indicator - at the top since entries are at bottom */}
                    {filteredExpenses.length > 10 && (
                        <Box sx={{ 
                            position: 'absolute', 
                            top: 8, 
                            right: 8, 
                            display: 'flex', 
                            gap: 0.5,
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            borderRadius: 1,
                            p: 0.5
                        }}>
                            <Typography variant="caption" color="textSecondary">
                                Scroll to see more expenses
                            </Typography>
                            <KeyboardArrowDownIcon fontSize="small" color="action" />
                        </Box>
                    )}
                </Box>

                {/* Expense Count and Status */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                        Showing {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
                        {hasActiveFilters() && ' (filtered)'}
                        {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
                    </Typography>
                    
                    {/* Total expense count */}
                    <Typography variant="body2" color="textSecondary">
                        Total: {expenses.length} expenses • Total VAT: {formatCurrency(totals.totalVAT)}
                    </Typography>
                </Box>

                {/* Add/Edit Expense Dialog */}
                <Dialog 
                    open={openDialog} 
                    onClose={handleCloseDialog}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        {editMode ? 'Edit Expense' : 'Record New Expense'}
                        <Typography variant="caption" color="textSecondary" display="block">
                            VAT: 15% (Automatically Calculated)
                        </Typography>
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            {/* Expense Code Field */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Expense Code"
                                    value={formData.expenseCode}
                                    onChange={(e) => handleInputChange('expenseCode', e.target.value)}
                                    helperText="Leave empty to auto-generate (format: EXP-YYMM-XXXX)"
                                    size="small"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <ConfirmationNumberIcon fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <CustomDatePicker
                                    label="Expense Date"
                                    value={formData.date}
                                    onChange={(date) => handleInputChange('date', date)}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth error={!!errors.category} required size="small">
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={formData.category}
                                        label="Category"
                                        onChange={(e) => handleInputChange('category', e.target.value)}
                                    >
                                        <MenuItem value="">Select Category</MenuItem>
                                        {categories.map(category => (
                                            <MenuItem key={category} value={category}>
                                                {category}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.category && (
                                        <Typography variant="caption" color="error">
                                            {errors.category}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    error={!!errors.description}
                                    helperText={errors.description || 'Enter a clear description of the expense'}
                                    required
                                    size="small"
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                            
                            {/* Quantity, Unit, and Unit Price */}
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Quantity"
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                                    error={!!errors.quantity}
                                    helperText={errors.quantity}
                                    required
                                    size="small"
                                    InputProps={{
                                        inputProps: { min: 1, step: 1 }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth error={!!errors.unit} required size="small">
                                    <InputLabel>Unit</InputLabel>
                                    <Select
                                        value={formData.unit}
                                        label="Unit"
                                        onChange={(e) => handleInputChange('unit', e.target.value)}
                                        startAdornment={
                                            <InputAdornment position="start">
                                                <StraightenIcon fontSize="small" />
                                            </InputAdornment>
                                        }
                                    >
                                        {unitOptions.map(unit => (
                                            <MenuItem key={unit.value} value={unit.value}>
                                                {unit.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.unit && (
                                        <Typography variant="caption" color="error">
                                            {errors.unit}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Unit Price (ETB)"
                                    type="number"
                                    value={formData.unitPrice}
                                    onChange={(e) => handleInputChange('unitPrice', e.target.value)}
                                    error={!!errors.unitPrice}
                                    helperText={errors.unitPrice}
                                    required
                                    size="small"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }} variant="body2">ETB</Typography>,
                                        inputProps: { min: 0, step: 0.01 }
                                    }}
                                />
                            </Grid>
                            
                            {/* Calculation Summary */}
                            <Grid item xs={12}>
                                <Box 
                                    sx={{ 
                                        p: 1, 
                                        border: '1px solid', 
                                        borderColor: 'divider', 
                                        borderRadius: 1,
                                        backgroundColor: 'grey.50'
                                    }}
                                >
                                    <Box 
                                        sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'space-between',
                                            cursor: 'pointer',
                                            mb: showCalculations ? 1 : 0
                                        }}
                                        onClick={() => setShowCalculations(!showCalculations)}
                                    >
                                        <Typography variant="subtitle2">
                                            <CalculateIcon sx={{ mr: 1, fontSize: '1rem', verticalAlign: 'middle' }} />
                                            Calculation Summary
                                        </Typography>
                                        {showCalculations ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </Box>
                                    
                                    <Collapse in={showCalculations}>
                                        <Grid container spacing={1}>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="textSecondary">
                                                    Quantity:
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" align="right">
                                                    {formData.quantity} {getUnitLabel(formData.unit)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="textSecondary">
                                                    Unit Price:
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" align="right">
                                                    {formatCurrency(formData.unitPrice || 0)} per {getUnitLabel(formData.unit)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="textSecondary">
                                                    Subtotal:
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" align="right">
                                                    {formatCurrency(formData.subtotal || 0)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="textSecondary">
                                                    VAT (15%):
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="success.main" align="right">
                                                    {formatCurrency(formData.vatAmount || 0)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Divider sx={{ my: 0.5 }} />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    Total Amount:
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="subtitle2" fontWeight="bold" align="right">
                                                    {formatCurrency(formData.amount || 0)}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Collapse>
                                </Box>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth error={!!errors.department} required size="small">
                                    <InputLabel>Department</InputLabel>
                                    <Select
                                        value={formData.department}
                                        label="Department"
                                        onChange={(e) => handleInputChange('department', e.target.value)}
                                    >
                                        <MenuItem value="">Select Department</MenuItem>
                                        {departments.map(dept => (
                                            <MenuItem key={dept} value={dept}>
                                                {dept}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.department && (
                                        <Typography variant="caption" color="error">
                                            {errors.department}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Paid To"
                                    value={formData.paidTo}
                                    onChange={(e) => handleInputChange('paidTo', e.target.value)}
                                    error={!!errors.paidTo}
                                    helperText={errors.paidTo || 'Enter the recipient of the payment'}
                                    required
                                    size="small"
                                />
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth error={!!errors.paymentMethod} required size="small">
                                    <InputLabel>Payment Method</InputLabel>
                                    <Select
                                        value={formData.paymentMethod}
                                        label="Payment Method"
                                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                                    >
                                        {paymentMethods.map(method => (
                                            <MenuItem key={method.value} value={method.value}>
                                                {method.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.paymentMethod && (
                                        <Typography variant="caption" color="error">
                                            {errors.paymentMethod}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Reference Number"
                                    value={formData.referenceNumber}
                                    onChange={(e) => handleInputChange('referenceNumber', e.target.value)}
                                    error={!!errors.referenceNumber}
                                    helperText={errors.referenceNumber || 'Enter reference number for bank transfer, check, or credit card'}
                                    required={formData.paymentMethod !== 'cash'}
                                    size="small"
                                />
                            </Grid>
                            
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Receipt URL"
                                    value={formData.receiptUrl}
                                    onChange={(e) => handleInputChange('receiptUrl', e.target.value)}
                                    error={!!errors.receiptUrl}
                                    helperText={errors.receiptUrl || "Enter a valid URL starting with http:// or https:// (optional)"}
                                    placeholder="https://example.com/receipt.pdf"
                                    size="small"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LinkIcon fontSize="small" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: formData.receiptUrl ? (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        try {
                                                            const url = formData.receiptUrl.startsWith('http') 
                                                                ? formData.receiptUrl 
                                                                : `https://${formData.receiptUrl}`;
                                                            window.open(url, '_blank');
                                                        } catch (error) {
                                                            showSnackbar('Invalid URL', 'error');
                                                        }
                                                    }}
                                                >
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        ) : null
                                    }}
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
                                    helperText="Additional notes or comments (optional)"
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
                            startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
                            size="small"
                        >
                            {submitting ? 'Processing...' : (editMode ? 'Update Expense' : 'Submit Expense')}
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
                            Are you sure you want to delete this expense?
                        </Typography>
                        {expenseToDelete && (
                            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                                <Typography variant="body2">
                                    <strong>Expense Code:</strong> {expenseToDelete.expenseCode || 'Auto-generated'}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Description:</strong> {expenseToDelete.description}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Quantity:</strong> {expenseToDelete.quantity} {getUnitLabel(expenseToDelete.unit)}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Amount:</strong> {formatCurrency(expenseToDelete.amount)} (VAT: {formatCurrency(expenseToDelete.vatAmount || 0)})
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Date:</strong> {formatDisplayDate(expenseToDelete.date)}
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
                        variant="filled"
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
};

export default ExpenseManagement;