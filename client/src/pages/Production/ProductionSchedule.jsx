// ProductionSchedule.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  CircularProgress,
  Tooltip,
  LinearProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { Edit, Delete, Add, CalendarToday, Timeline, Assessment, Refresh, Save, Calculate } from '@mui/icons-material';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const ProductionSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [lines, setLines] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [view, setView] = useState('table');
  const [activeTab, setActiveTab] = useState(0);
  const [mpsCalculation, setMpsCalculation] = useState(null);
  const [capacityAnalysis, setCapacityAnalysis] = useState(null);
  const [constraintCheck, setConstraintCheck] = useState(null);
  const [loading, setLoading] = useState(false);
  const [compatibleLines, setCompatibleLines] = useState([]);
  const [selectedProductCapacity, setSelectedProductCapacity] = useState(null);
  const [selectedLineForMPS, setSelectedLineForMPS] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [fetchLoading, setFetchLoading] = useState({
    products: false,
    schedules: false,
    lines: false,
    employees: false
  });

  // Annual Plan Form State
  const [annualPlanForm, setAnnualPlanForm] = useState({
    selectedProducts: [],
    year: new Date().getFullYear(),
    standardHoursPerUnit: 0.5,
    numberOfMachines: 10,
    shiftsPerDay: 2,
    hoursPerShift: 8,
    workingDaysPerWeek: 5,
    workingDaysPerYear: 260 // 52 weeks * 5 days
  });

  // Master Production Schedule Data (52 weeks)
  const [masterProductionSchedule, setMasterProductionSchedule] = useState([]);

  // Detailed Production Schedule Data (365 days)
  const [detailedProductionSchedule, setDetailedProductionSchedule] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    orderId: '',
    productName: '',
    productId: '',
    quantity: 0,
    lineCode: '',
    lineId: '',
    startDate: '',
    endDate: '',
    status: 'scheduled',
    priority: 'medium',
    assignedTo: '',
    assignedEmployeeId: '',
    plannedHours: 0,
    timeFrame: 'daily',
    yearRange: '2025-2026',
    notes: '',
    constraints: {
      materialAvailable: true,
      machineAvailable: true,
      laborAvailable: true
    }
  });

  const statusOptions = ['scheduled', 'in-progress', 'completed', 'delayed', 'cancelled'];
  const priorityOptions = ['low', 'medium', 'high', 'critical'];
  const timeFrameOptions = ['daily', 'weekly', 'monthly', 'quarterly', 'annual'];
  const yearRangeOptions = ['2024-2025', '2025-2026', '2026-2027', '2027-2028', '2028-2029', '2029-2030'];

  // Fetch data from APIs
  const fetchSchedules = async () => {
    setFetchLoading(prev => ({ ...prev, schedules: true }));
    try {
      const response = await axios.get('http://localhost:5000/api/production-schedules');
      let schedulesData = response.data;
      
      if (response.data && Array.isArray(response.data.data)) {
        schedulesData = response.data.data;
      } else if (response.data && Array.isArray(response.data.schedules)) {
        schedulesData = response.data.schedules;
      } else if (!Array.isArray(response.data)) {
        schedulesData = [];
      }
      
      setSchedules(schedulesData);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setSnackbar({ open: true, message: 'Error fetching schedules', severity: 'error' });
      setSchedules([]);
    } finally {
      setFetchLoading(prev => ({ ...prev, schedules: false }));
    }
  };

  const fetchProducts = async () => {
    setFetchLoading(prev => ({ ...prev, products: true }));
    try {
      const response = await axios.get('http://localhost:5000/api/products');
      let productsData = response.data;
      
      if (response.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
      } else if (response.data && Array.isArray(response.data.products)) {
        productsData = response.data.products;
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
      } else {
        productsData = [];
      }
      
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      setSnackbar({ open: true, message: 'Error fetching products', severity: 'error' });
      setProducts([]);
    } finally {
      setFetchLoading(prev => ({ ...prev, products: false }));
    }
  };

  const fetchEmployees = async () => {
    setFetchLoading(prev => ({ ...prev, employees: true }));
    try {
      const response = await axios.get('http://localhost:5000/api/employees');
      let employeesData = response.data;
      
      if (response.data && Array.isArray(response.data.data)) {
        employeesData = response.data.data;
      } else if (response.data && Array.isArray(response.data.employees)) {
        employeesData = response.data.employees;
      } else if (!Array.isArray(response.data)) {
        employeesData = [];
      }
      
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setSnackbar({ open: true, message: 'Error fetching employees', severity: 'error' });
      setEmployees([]);
    } finally {
      setFetchLoading(prev => ({ ...prev, employees: false }));
    }
  };

  const fetchLines = async () => {
    setFetchLoading(prev => ({ ...prev, lines: true }));
    try {
      const response = await axios.get('http://localhost:5000/api/lineManagements');
      let linesData = response.data;
      
      if (response.data && Array.isArray(response.data.data)) {
        linesData = response.data.data;
      } else if (response.data && Array.isArray(response.data.lines)) {
        linesData = response.data.lines;
      } else if (Array.isArray(response.data)) {
        linesData = response.data;
      } else {
        linesData = [];
      }
      
      setLines(linesData);
    } catch (error) {
      console.error('Error fetching lines:', error);
      setSnackbar({ open: true, message: 'Error fetching production lines', severity: 'error' });
      setLines([]);
    } finally {
      setFetchLoading(prev => ({ ...prev, lines: false }));
    }
  };

  const fetchCompatibleLines = async (productId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/production-schedules/products/${productId}/compatible-lines`);
      let linesData = response.data;
      
      if (response.data && Array.isArray(response.data.data)) {
        linesData = response.data.data;
      } else if (response.data && Array.isArray(response.data.lines)) {
        linesData = response.data.lines;
      } else if (!Array.isArray(response.data)) {
        linesData = [];
      }
      
      setCompatibleLines(linesData);
    } catch (error) {
      console.error('Error fetching compatible lines:', error);
      setCompatibleLines([]);
    }
  };

  const fetchProductLineCapacity = async (lineId, productId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/production-schedules/capacity/${lineId}/${productId}`);
      setSelectedProductCapacity(response.data);
    } catch (error) {
      console.error('Error fetching capacity:', error);
      setSelectedProductCapacity(null);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchProducts();
    fetchEmployees();
    fetchLines();
  }, []);

  useEffect(() => {
    if (formData.productId && formData.lineId) {
      fetchProductLineCapacity(formData.lineId, formData.productId);
    }
  }, [formData.productId, formData.lineId]);

  // Calculate capacity based on annual plan
  const calculateCapacity = () => {
    const {
      selectedProducts,
      standardHoursPerUnit,
      numberOfMachines,
      shiftsPerDay,
      hoursPerShift,
      workingDaysPerWeek
    } = annualPlanForm;

    const weeklyAvailableHours = numberOfMachines * shiftsPerDay * hoursPerShift * workingDaysPerWeek;
    const totalAnnualUnits = selectedProducts.reduce((sum, product) => sum + (product.annualQuantity || 0), 0);
    const weeklyRequiredHours = (totalAnnualUnits * standardHoursPerUnit) / 52;

    return {
      weeklyAvailableHours,
      weeklyRequiredHours,
      utilizationRate: (weeklyRequiredHours / weeklyAvailableHours) * 100,
      feasible: weeklyRequiredHours <= weeklyAvailableHours
    };
  };

  // Generate Master Production Schedule for 52 weeks
  const generateMasterProductionSchedule = () => {
    const { selectedProducts, year } = annualPlanForm;
    
    if (!selectedProducts || selectedProducts.length === 0) {
      setSnackbar({ open: true, message: 'No products selected for planning', severity: 'error' });
      return;
    }

    const weeks = 52;
    const mpsData = [];
    let totalRemaining = {};

    // Initialize remaining quantities
    selectedProducts.forEach(product => {
      totalRemaining[product._id] = product.annualQuantity;
    });

    for (let week = 1; week <= weeks; week++) {
      const weekStart = moment().year(year).week(week).startOf('week');
      const weekEnd = moment().year(year).week(week).endOf('week');
      
      const weekPlan = { 
        week: `Week ${week}`,
        dateRange: `${weekStart.format('MMM DD')} - ${weekEnd.format('MMM DD')}`,
        weekNumber: week
      };

      let weeklyTotal = 0;

      selectedProducts.forEach(product => {
        // Calculate weekly quantity (distribute remaining quantity evenly across remaining weeks)
        const weeksRemaining = weeks - week + 1;
        const weeklyQuantity = Math.min(
          Math.ceil(totalRemaining[product._id] / weeksRemaining),
          totalRemaining[product._id]
        );

        weekPlan[product._id] = weeklyQuantity;
        totalRemaining[product._id] -= weeklyQuantity;
        weeklyTotal += weeklyQuantity;
      });

      weekPlan.total = weeklyTotal;
      mpsData.push(weekPlan);
    }

    setMasterProductionSchedule(mpsData);
  };

  // Generate Detailed Schedule for 365 days
  const generateDetailedSchedule = async () => {
    const detailedSchedule = [];
    const { selectedProducts, year, workingDaysPerWeek } = annualPlanForm;

    let currentDate = moment().year(year).startOf('year');
    const endDate = moment().year(year).endOf('year');
    let dayCounter = 0;
    let weekCounter = 1;

    while (currentDate.isSameOrBefore(endDate)) {
      // Skip weekends (assuming Saturday and Sunday are weekends)
      const isWeekend = currentDate.day() === 0 || currentDate.day() === 6;
      
      if (!isWeekend) {
        dayCounter++;
        const weekNumber = Math.ceil(dayCounter / workingDaysPerWeek);
        
        // Find the corresponding week in MPS
        const currentWeek = masterProductionSchedule.find(w => w.weekNumber === weekNumber);
        
        if (currentWeek) {
          const dailyProduction = {};
          let dailyTotal = 0;

          selectedProducts.forEach(product => {
            // Distribute weekly quantity evenly across working days
            const dailyQuantity = Math.floor((currentWeek[product._id] || 0) / workingDaysPerWeek);
            dailyProduction[product._id] = dailyQuantity;
            dailyTotal += dailyQuantity;
          });

          // Get available production lines
          const availableLines = lines.filter(line => line.status === 'active');
          const assignedLine = availableLines[dayCounter % availableLines.length] || availableLines[0];

          detailedSchedule.push({
            id: `day-${currentDate.format('YYYY-MM-DD')}`,
            date: currentDate.format('YYYY-MM-DD'),
            week: `Week ${weekNumber}`,
            day: `Day ${dayCounter}`,
            production: dailyProduction,
            total: dailyTotal,
            status: 'scheduled',
            lineId: assignedLine?._id,
            lineCode: assignedLine?.lineCode || 'Main Line',
            plannedHours: dailyTotal * annualPlanForm.standardHoursPerUnit
          });
        }
      }

      currentDate = currentDate.add(1, 'day');
    }

    setDetailedProductionSchedule(detailedSchedule);
  };

  // Save detailed schedule to database
  const saveDetailedScheduleToDatabase = async () => {
    setLoading(true);
    try {
      // First, delete existing schedules for the year
      await axios.delete(`http://localhost:5000/api/production-schedules/year/${annualPlanForm.year}`);
      
      // Save new schedules in batches
      const batchSize = 50;
      for (let i = 0; i < detailedProductionSchedule.length; i += batchSize) {
        const batch = detailedProductionSchedule.slice(i, i + batchSize);
        const schedulesToSave = batch.map(daySchedule => ({
          orderId: `AUTO-${daySchedule.date}-${daySchedule.lineCode}`,
          productName: 'Mixed Production',
          productId: null, // Mixed production day
          quantity: daySchedule.total,
          lineCode: daySchedule.lineCode,
          lineId: daySchedule.lineId,
          startDate: `${daySchedule.date}T08:00:00`,
          endDate: `${daySchedule.date}T17:00:00`,
          status: 'scheduled',
          priority: 'medium',
          plannedHours: daySchedule.plannedHours,
          timeFrame: 'daily',
          yearRange: `${annualPlanForm.year}-${annualPlanForm.year + 1}`,
          notes: `Auto-generated daily production schedule`,
          constraints: {
            materialAvailable: true,
            machineAvailable: true,
            laborAvailable: true
          }
        }));

        await axios.post('http://localhost:5000/api/production-schedules/batch', schedulesToSave);
      }

      setSnackbar({ open: true, message: 'Production schedules saved to database successfully', severity: 'success' });
      fetchSchedules(); // Refresh the schedules list
    } catch (error) {
      console.error('Error saving schedules to database:', error);
      setSnackbar({ open: true, message: 'Error saving schedules to database', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Initialize capacity analysis and generate schedules when data changes
  useEffect(() => {
    if (annualPlanForm.selectedProducts.length > 0) {
      const capacity = calculateCapacity();
      setCapacityAnalysis({
        totalAvailableHours: capacity.weeklyAvailableHours,
        totalRequiredHours: capacity.weeklyRequiredHours,
        capacityUtilization: capacity.utilizationRate,
        feasible: capacity.feasible,
        message: capacity.feasible 
          ? 'Production plan is feasible with current capacity.'
          : `Your production plan requires ${capacity.weeklyRequiredHours.toFixed(1)} hours/week but you only have ${capacity.weeklyAvailableHours} hours/week available. Consider adding overtime, additional shifts, or revising your production targets.`
      });
    }
  }, [annualPlanForm]);

  const handleOpen = (schedule = null) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        ...schedule,
        startDate: moment(schedule.startDate).format('YYYY-MM-DDTHH:mm'),
        endDate: moment(schedule.endDate).format('YYYY-MM-DDTHH:mm'),
        productId: schedule.productId?._id || '',
        lineId: schedule.lineId?._id || '',
        assignedEmployeeId: schedule.assignedEmployeeId?._id || '',
        constraints: schedule.constraints || {
          materialAvailable: true,
          machineAvailable: true,
          laborAvailable: true
        }
      });
    } else {
      setEditingSchedule(null);
      setFormData({
        orderId: '',
        productName: '',
        productId: '',
        quantity: 0,
        lineCode: '',
        lineId: '',
        startDate: '',
        endDate: '',
        status: 'scheduled',
        priority: 'medium',
        assignedTo: '',
        assignedEmployeeId: '',
        plannedHours: 0,
        timeFrame: 'daily',
        yearRange: '2025-2026',
        notes: '',
        constraints: {
          materialAvailable: true,
          machineAvailable: true,
          laborAvailable: true
        }
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedProductCapacity(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'productId') {
      const selectedProduct = Array.isArray(products) ? products.find(p => p._id === value) : null;
      setFormData(prev => ({ 
        ...prev, 
        productId: value,
        productName: selectedProduct ? selectedProduct.name : ''
      }));
      fetchCompatibleLines(value);
    } else if (name.startsWith('constraints.')) {
      const constraintField = name.split('.')[1];
      setFormData({
        ...formData,
        constraints: {
          ...formData.constraints,
          [constraintField]: value === 'true' || value === true
        }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAnnualPlanChange = (e) => {
    const { name, value } = e.target;
    setAnnualPlanForm(prev => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value) : parseFloat(value) || 0
    }));
  };

  const handleProductSelection = (productId, annualQuantity) => {
    setAnnualPlanForm(prev => {
      const existingProductIndex = prev.selectedProducts.findIndex(p => p._id === productId);
      
      if (existingProductIndex >= 0) {
        // Update existing product
        const updatedProducts = [...prev.selectedProducts];
        updatedProducts[existingProductIndex] = {
          ...updatedProducts[existingProductIndex],
          annualQuantity: parseFloat(annualQuantity) || 0
        };
        return { ...prev, selectedProducts: updatedProducts };
      } else {
        // Add new product
        const product = products.find(p => p._id === productId);
        if (product) {
          return {
            ...prev,
            selectedProducts: [
              ...prev.selectedProducts,
              {
                ...product,
                annualQuantity: parseFloat(annualQuantity) || 0
              }
            ]
          };
        }
      }
      return prev;
    });
  };

  const handleLineChange = (e) => {
    const lineId = e.target.value;
    const selectedLine = Array.isArray(lines) ? lines.find(line => line._id === lineId) : null;
    setFormData({
      ...formData,
      lineId: lineId,
      lineCode: selectedLine ? selectedLine.lineCode : ''
    });
  };

  const calculatePlannedHours = () => {
    if (formData.productId && formData.quantity > 0) {
      const product = Array.isArray(products) ? products.find(p => p._id === formData.productId) : null;
      if (product) {
        const plannedHours = formData.quantity * (product.productionTime || 1);
        setFormData(prev => ({ ...prev, plannedHours }));
      }
    }
  };

  useEffect(() => {
    calculatePlannedHours();
  }, [formData.quantity, formData.productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingSchedule) {
        await axios.put(`http://localhost:5000/api/production-schedules/${editingSchedule._id}`, formData);
        setSnackbar({ open: true, message: 'Schedule updated successfully', severity: 'success' });
      } else {
        await axios.post('http://localhost:5000/api/production-schedules', formData);
        setSnackbar({ open: true, message: 'Schedule created successfully', severity: 'success' });
      }
      fetchSchedules();
      handleClose();
    } catch (error) {
      console.error('Error saving schedule:', error);
      const errorMessage = error.response?.data?.message || 'Error saving schedule';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await axios.delete(`http://localhost:5000/api/production-schedules/${id}`);
        setSnackbar({ open: true, message: 'Schedule deleted successfully', severity: 'success' });
        fetchSchedules();
      } catch (error) {
        console.error('Error deleting schedule:', error);
        setSnackbar({ open: true, message: 'Error deleting schedule', severity: 'error' });
      }
    }
  };

  const handleRefresh = () => {
    fetchSchedules();
    fetchProducts();
    fetchLines();
    setSnackbar({ open: true, message: 'Data refreshed successfully', severity: 'success' });
  };

  const handleStatusChange = async (scheduleId, newStatus) => {
    try {
      await axios.patch(`http://localhost:5000/api/production-schedules/${scheduleId}/status`, {
        status: newStatus
      });
      setSnackbar({ open: true, message: `Status updated to ${newStatus}`, severity: 'success' });
      fetchSchedules();
    } catch (error) {
      console.error('Error updating status:', error);
      setSnackbar({ open: true, message: 'Error updating status', severity: 'error' });
    }
  };

  const handleNextStep = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBackStep = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleGenerateMPS = () => {
    generateMasterProductionSchedule();
    setSnackbar({ open: true, message: 'Master Production Schedule generated for 52 weeks', severity: 'success' });
    handleNextStep();
  };

  const handleGenerateDetailedSchedule = async () => {
    await generateDetailedSchedule();
    setSnackbar({ open: true, message: 'Detailed Production Schedule generated for 365 days', severity: 'success' });
    handleNextStep();
  };

  const handleSaveSchedules = async () => {
    await saveDetailedScheduleToDatabase();
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // For calendar view
  const events = Array.isArray(schedules) ? schedules.map(schedule => ({
    id: schedule._id,
    title: `${schedule.orderId} - ${schedule.productName}`,
    start: new Date(schedule.startDate),
    end: new Date(schedule.endDate),
    resource: schedule
  })) : [];

  const eventStyleGetter = (event) => {
    let backgroundColor = '#3174ad';
    if (event.resource.status === 'completed') backgroundColor = '#28a745';
    if (event.resource.status === 'in-progress') backgroundColor = '#ffc107';
    if (event.resource.status === 'delayed') backgroundColor = '#dc3545';
    if (event.resource.status === 'cancelled') backgroundColor = '#6c757d';

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'delayed': return 'error';
      case 'cancelled': return 'default';
      default: return 'info';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'default';
    }
  };

  const renderAnnualPlanForm = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Annual Production Plan Input
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Select products and enter annual production targets to generate the production schedule for the entire year.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Year"
              name="year"
              type="number"
              value={annualPlanForm.year}
              onChange={handleAnnualPlanChange}
              required
            />
          </Grid>

          {/* Product Selection and Annual Targets */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Product Annual Targets
            </Typography>
            {fetchLoading.products ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>Loading products...</Typography>
              </Box>
            ) : !Array.isArray(products) || products.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No products available. Please add products first.
              </Typography>
            ) : (
              products.map(product => (
                <Box key={product._id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2">{product.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        SKU: {product.sku || 'N/A'} | Production Time: {product.productionTime || 1} hours/unit
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Annual Target (units)"
                        type="number"
                        value={annualPlanForm.selectedProducts.find(p => p._id === product._id)?.annualQuantity || ''}
                        onChange={(e) => handleProductSelection(product._id, e.target.value)}
                        placeholder="Enter annual quantity"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2">
                        Category: {product.category || 'General'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              ))
            )}
          </Grid>

          {/* Capacity Parameters */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Capacity Parameters
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Standard Hours per Unit"
              name="standardHoursPerUnit"
              type="number"
              step="0.1"
              value={annualPlanForm.standardHoursPerUnit}
              onChange={handleAnnualPlanChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Number of Machines"
              name="numberOfMachines"
              type="number"
              value={annualPlanForm.numberOfMachines}
              onChange={handleAnnualPlanChange}
              required
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Shifts per Day"
              name="shiftsPerDay"
              type="number"
              value={annualPlanForm.shiftsPerDay}
              onChange={handleAnnualPlanChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Hours per Shift"
              name="hoursPerShift"
              type="number"
              value={annualPlanForm.hoursPerShift}
              onChange={handleAnnualPlanChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Working Days per Week"
              name="workingDaysPerWeek"
              type="number"
              value={annualPlanForm.workingDaysPerWeek}
              onChange={handleAnnualPlanChange}
              required
            />
          </Grid>

          {/* Production Lines */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Available Production Lines
            </Typography>
            {fetchLoading.lines ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>Loading production lines...</Typography>
              </Box>
            ) : !Array.isArray(lines) || lines.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No production lines available. Please add production lines first.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {lines.filter(line => line.status === 'active').map(line => (
                  <Grid item xs={12} sm={6} md={4} key={line._id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2">{line.lineCode} - {line.lineName}</Typography>
                        <Typography variant="body2">
                          Status: <Chip label={line.status} color="success" size="small" />
                        </Typography>
                        {line.capacity && (
                          <>
                            <Typography variant="body2">
                              Daily Capacity: {line.capacity.dailyCapacity || 'N/A'} units
                            </Typography>
                            <Typography variant="body2">
                              Weekly Capacity: {line.capacity.weeklyCapacity || 'N/A'} units
                            </Typography>
                            <Typography variant="body2">
                              Monthly Capacity: {line.capacity.monthlyCapacity || 'N/A'} units
                            </Typography>
                          </>
                        )}
                        {line.operationalHours && (
                          <Typography variant="body2">
                            Shifts: {line.operationalHours.shiftsPerDay || 1} × {line.operationalHours.hoursPerShift || 8}h
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>

          {capacityAnalysis && annualPlanForm.selectedProducts.length > 0 && (
            <Grid item xs={12}>
              <Alert 
                severity={capacityAnalysis.feasible ? "success" : "warning"} 
                sx={{ mt: 2 }}
                action={
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={handleGenerateMPS}
                    disabled={!capacityAnalysis.feasible}
                  >
                    Generate MPS
                  </Button>
                }
              >
                {capacityAnalysis.message}
              </Alert>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderMasterProductionSchedule = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Master Production Schedule (MPS) - 52 Weeks
          </Typography>
          <Chip label={`Year ${annualPlanForm.year}`} color="primary" />
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          Weekly production plan for the entire year based on your annual targets.
        </Typography>

        {masterProductionSchedule.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No MPS data available. Please generate the schedule first.
          </Typography>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Week</strong></TableCell>
                  <TableCell><strong>Date Range</strong></TableCell>
                  {annualPlanForm.selectedProducts.map(product => (
                    <TableCell key={product._id} align="right">
                      <strong>{product.name}</strong>
                    </TableCell>
                  ))}
                  <TableCell align="right"><strong>Total</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {masterProductionSchedule.slice(0, 12).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell><strong>{row.week}</strong></TableCell>
                    <TableCell>{row.dateRange}</TableCell>
                    {annualPlanForm.selectedProducts.map(product => (
                      <TableCell key={product._id} align="right">
                        {row[product._id]?.toLocaleString() || '0'}
                      </TableCell>
                    ))}
                    <TableCell align="right"><strong>{row.total?.toLocaleString() || '0'}</strong></TableCell>
                  </TableRow>
                ))}
                {masterProductionSchedule.length > 12 && (
                  <TableRow>
                    <TableCell colSpan={2 + annualPlanForm.selectedProducts.length + 1} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Showing first 12 weeks of 52. Use scroll to view more.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell colSpan={2}><strong>Annual Total</strong></TableCell>
                  {annualPlanForm.selectedProducts.map(product => (
                    <TableCell key={product._id} align="right">
                      <strong>
                        {masterProductionSchedule.reduce((sum, row) => sum + (row[product._id] || 0), 0).toLocaleString()}
                      </strong>
                    </TableCell>
                  ))}
                  <TableCell align="right">
                    <strong>
                      {masterProductionSchedule.reduce((sum, row) => sum + (row.total || 0), 0).toLocaleString()}
                    </strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );

  const renderDetailedProductionSchedule = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Detailed Production Schedule - 365 Days
          </Typography>
          <Chip label="Daily Plan" color="secondary" />
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          Daily breakdown of the production schedule for the entire year.
        </Typography>

        {detailedProductionSchedule.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No detailed schedule available. Please generate the schedule first.
          </Typography>
        ) : (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                Total working days: {detailedProductionSchedule.length} | 
                Total production: {detailedProductionSchedule.reduce((sum, day) => sum + day.total, 0).toLocaleString()} units
              </Typography>
            </Box>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Week</strong></TableCell>
                    <TableCell><strong>Day</strong></TableCell>
                    {annualPlanForm.selectedProducts.map(product => (
                      <TableCell key={product._id} align="right">
                        <strong>{product.name}</strong>
                      </TableCell>
                    ))}
                    <TableCell align="right"><strong>Total</strong></TableCell>
                    <TableCell><strong>Line</strong></TableCell>
                    <TableCell align="right"><strong>Hours</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detailedProductionSchedule.slice(0, 20).map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.week}</TableCell>
                      <TableCell>{row.day}</TableCell>
                      {annualPlanForm.selectedProducts.map(product => (
                        <TableCell key={product._id} align="right">
                          {row.production[product._id] || 0}
                        </TableCell>
                      ))}
                      <TableCell align="right"><strong>{row.total}</strong></TableCell>
                      <TableCell>
                        <Chip label={row.lineCode} variant="outlined" size="small" />
                      </TableCell>
                      <TableCell align="right">{row.plannedHours.toFixed(1)}h</TableCell>
                    </TableRow>
                  ))}
                  {detailedProductionSchedule.length > 20 && (
                    <TableRow>
                      <TableCell colSpan={4 + annualPlanForm.selectedProducts.length + 2} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Showing first 20 days of {detailedProductionSchedule.length}. Use scroll to view more.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderScheduleTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Order ID</TableCell>
            <TableCell>Product Name</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell>Line Code</TableCell>
            <TableCell>Start Date</TableCell>
            <TableCell>End Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Progress</TableCell>
            <TableCell>Planned Hours</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {fetchLoading.schedules ? (
            <TableRow>
              <TableCell colSpan={11} align="center">
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>Loading schedules...</Typography>
              </TableCell>
            </TableRow>
          ) : !Array.isArray(schedules) || schedules.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} align="center">
                <Typography variant="body2">No schedules found</Typography>
              </TableCell>
            </TableRow>
          ) : (
            schedules.map((schedule) => (
              <TableRow key={schedule._id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {schedule.orderId}
                  </Typography>
                </TableCell>
                <TableCell>{schedule.productName}</TableCell>
                <TableCell>{schedule.quantity}</TableCell>
                <TableCell>
                  <Chip 
                    label={schedule.lineCode} 
                    variant="outlined" 
                    size="small"
                    color={schedule.lineId?.status === 'active' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title={moment(schedule.startDate).format('YYYY-MM-DD HH:mm')}>
                    <Typography variant="body2">
                      {moment(schedule.startDate).format('MMM DD, YYYY')}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title={moment(schedule.endDate).format('YYYY-MM-DD HH:mm')}>
                    <Typography variant="body2">
                      {moment(schedule.endDate).format('MMM DD, YYYY')}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={schedule.status} 
                    color={getStatusColor(schedule.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={schedule.priority} 
                    color={getPriorityColor(schedule.priority)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell sx={{ width: 100 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={schedule.completionRate || 0}
                        color={
                          schedule.completionRate >= 100 ? 'success' :
                          schedule.completionRate >= 70 ? 'warning' : 'primary'
                        }
                      />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="text.secondary">
                        {Math.round(schedule.completionRate || 0)}%
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {schedule.plannedHours}h
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpen(schedule)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDelete(schedule._id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderProductionPlanning = () => (
    <Box>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        <Step>
          <StepLabel>Annual Plan Input</StepLabel>
        </Step>
        <Step>
          <StepLabel>Master Production Schedule (52 Weeks)</StepLabel>
        </Step>
        <Step>
          <StepLabel>Detailed Production Schedule (365 Days)</StepLabel>
        </Step>
        <Step>
          <StepLabel>Save to Database</StepLabel>
        </Step>
      </Stepper>

      {activeStep === 0 && (
        <Box>
          {renderAnnualPlanForm()}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleGenerateMPS}
              disabled={!capacityAnalysis?.feasible || annualPlanForm.selectedProducts.length === 0}
              endIcon={<Calculate />}
            >
              Generate MPS (52 Weeks)
            </Button>
          </Box>
        </Box>
      )}

      {activeStep === 1 && (
        <Box>
          {renderMasterProductionSchedule()}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button onClick={handleBackStep}>
              Back
            </Button>
            <Button variant="contained" onClick={handleGenerateDetailedSchedule}>
              Generate Detailed Schedule (365 Days)
            </Button>
          </Box>
        </Box>
      )}

      {activeStep === 2 && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {renderMasterProductionSchedule()}
            </Grid>
            <Grid item xs={12}>
              {renderDetailedProductionSchedule()}
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button onClick={handleBackStep}>
              Back
            </Button>
            <Button variant="contained" onClick={handleNextStep}>
              Save to Database
            </Button>
          </Box>
        </Box>
      )}

      {activeStep === 3 && (
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Save Production Schedules to Database
              </Typography>
              <Typography variant="body2" paragraph>
                Ready to save {detailedProductionSchedule.length} daily production schedules to the database.
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Summary:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography><strong>Year:</strong> {annualPlanForm.year}</Typography>
                    <Typography><strong>Total Working Days:</strong> {detailedProductionSchedule.length}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography><strong>Total Production:</strong> {detailedProductionSchedule.reduce((sum, day) => sum + day.total, 0).toLocaleString()} units</Typography>
                    <Typography><strong>Total Planned Hours:</strong> {detailedProductionSchedule.reduce((sum, day) => sum + day.plannedHours, 0).toFixed(1)} hours</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                This will create {detailedProductionSchedule.length} production schedule records in the database.
                Existing schedules for {annualPlanForm.year} will be replaced.
              </Alert>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button onClick={handleBackStep}>
              Back
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                onClick={() => setActiveStep(0)}
              >
                Start Over
              </Button>
              <Button 
                variant="contained" 
                onClick={handleSaveSchedules}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              >
                {loading ? 'Saving...' : 'Save to Database'}
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Production Planning & Scheduling
      </Typography>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
        <Tab label="Production Planning" icon={<Timeline />} />
        <Tab label="Schedule Management" icon={<CalendarToday />} />
      </Tabs>

      {activeTab === 0 && renderProductionPlanning()}

      {activeTab === 1 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
                Add Schedule
              </Button>
              <Button variant="outlined" startIcon={<Refresh />} onClick={handleRefresh}>
                Refresh
              </Button>
            </Box>
            <Box>
              <Button variant={view === 'table' ? 'contained' : 'outlined'} onClick={() => setView('table')}>
                Table View
              </Button>
              <Button variant={view === 'calendar' ? 'contained' : 'outlined'} onClick={() => setView('calendar')} sx={{ ml: 1 }}>
                Calendar View
              </Button>
            </Box>
          </Box>

          {view === 'table' ? renderScheduleTable() : (
            <Card>
              <CardContent>
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 600 }}
                  eventPropGetter={eventStyleGetter}
                  onSelectEvent={(event) => handleOpen(event.resource)}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editingSchedule ? 'Edit Production Schedule' : 'Add Production Schedule'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Order ID"
                  name="orderId"
                  value={formData.orderId}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Year Range"
                  name="yearRange"
                  value={formData.yearRange}
                  onChange={handleChange}
                  required
                >
                  {yearRangeOptions.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Product"
                  name="productId"
                  value={formData.productId}
                  onChange={handleChange}
                  required
                  disabled={fetchLoading.products}
                >
                  {fetchLoading.products ? (
                    <MenuItem disabled>Loading products...</MenuItem>
                  ) : (
                    Array.isArray(products) && products.map(product => (
                      <MenuItem key={product._id} value={product._id}>
                        {product.name}
                      </MenuItem>
                    ))
                  )}
                  {!fetchLoading.products && (!Array.isArray(products) || products.length === 0) && (
                    <MenuItem disabled>No products available</MenuItem>
                  )}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Production Line"
                  name="lineId"
                  value={formData.lineId}
                  onChange={handleLineChange}
                  required
                  disabled={fetchLoading.lines}
                >
                  {fetchLoading.lines ? (
                    <MenuItem disabled>Loading lines...</MenuItem>
                  ) : Array.isArray(compatibleLines) && compatibleLines.length > 0 ? (
                    compatibleLines.map(line => (
                      <MenuItem key={line._id} value={line._id}>
                        {line.lineCode} - {line.lineName} 
                        {line.capacity?.dailyCapacity && ` (Cap: ${line.capacity.dailyCapacity}/day)`}
                      </MenuItem>
                    ))
                  ) : (
                    Array.isArray(lines) && lines
                      .filter(line => line.status === 'active')
                      .map(line => (
                      <MenuItem key={line._id} value={line._id}>
                        {line.lineCode} - {line.lineName}
                      </MenuItem>
                    ))
                  )}
                  {!fetchLoading.lines && (!Array.isArray(lines) || lines.length === 0) && (
                    <MenuItem disabled>No lines available</MenuItem>
                  )}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  name="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  name="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  {statusOptions.map(status => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                >
                  {priorityOptions.map(priority => (
                    <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Saving...' : (editingSchedule ? 'Update' : 'Add')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductionSchedule;