// Dashboard.jsx - Updated with complete Overtime Management module integration
import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  Grid,
  Paper,
  Card,
  CardContent,
  IconButton,
  useTheme,
  useMediaQuery,
  Chip,
  alpha,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  Menu as MenuIcon,
  TrendingUp,
  Group,
  Factory,
  LocalShipping,
  Security,
  Schedule,
  Work,
  Payment,
  Receipt,
  ShoppingCart,
  Support,
  Analytics,
  CheckCircle,
  Warning,
  Error,
  Add,
  Person,
  AttachMoney,
  Science,
  Engineering,
  Calculate,
  Store,
  Computer,
  Assignment,
  BarChart,
  ArrowBack,
  Build,
  Inventory,
  Category,
  ProductionQuantityLimits,
  SwapHoriz,
  PointOfSale,
  MoneyOff,
  ShowChart,
  Biotech,
  AssignmentOutlined,
  Inventory2,
  AccountBalanceWallet,
  Timeline,
  AccountBalance,
  PlaylistPlay,
  AccessTime // Overtime Management icon
} from '@mui/icons-material';

// Import all modules
import EmployeeManagement from './HR/EmployeeManagement';
import AttendanceManagement from './HR/AttendanceManagement';
import HROvertimeChecking from './HR/HROvertimeChecking';
import MaterialManagement from './SupplyChain/MaterialManagement';
import ProductManagement from './SupplyChain/ProductManagement';
import MaterialRI from './SupplyChain/MaterialRI';
import ProductRI from './SupplyChain/ProductRI';
import InventoryPlan from './SupplyChain/InventoryPlan';
import ProductionManagement from './Production/ProductionManagement';
import ProductionSchedule from './Production/ProductionSchedule';
import ProductionPlan from './Production/ProductionPlan';
import ProductFormulation from './Production/ProductFormulation';
import LineManagement from './Production/LineManagement';
import LaborCost from './Production/LaborCost';
import ActivityManagement from './Production/ActivityManagement';
import OvertimeManagement from './Production/DepartmentOvertimeRecording';
import Pricing from './Finance/Pricing';
import ExpenseManagement from './Finance/ExpenseManagement';
import PettyCashManagement from './Finance/PettyCashManagement';
import PayrollManagement from './Finance/PayrollManagement';
import FinanceOvertimeApproval from './Finance/FinanceOvertimeApproval';
import DailySalesForm from './Sales/DailySalesForm';
import SalesPlan from './Sales/SalesPlan';
import Reports from './Reports/Reports';

const drawerWidth = 240;

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, id: 'dashboard' },
    { text: 'Departments', icon: <BusinessIcon />, id: 'departments' },
    { text: 'Reports', icon: <AssessmentIcon />, id: 'reports' },
  ];

  // Department icons mapping
  const departmentIcons = {
    'Human Resources': <PeopleIcon />,
    'Production': <Factory />,
    'Quality Assurance': <Science />,
    'Supply Chain': <LocalShipping />,
    'Finance': <Calculate />,
    'Sales & Marketing': <Store />,
    'IT Support': <Computer />,
    'Technique': <Build />
  };

  // Department modules configuration - UPDATED with proper Overtime Management integration
  const departmentModules = {
    'Human Resources': [
      { name: 'Employee Management', icon: <PeopleIcon />, id: 'employee-management' },
      { name: 'Attendance Management', icon: <Schedule />, id: 'attendance-management' },
      { name: 'HR Overtime Checking', icon: <AccessTime />, id: 'hr-overtime-checking' },
      { name: 'Overtime Recording', icon: <AccessTime />, id: 'hr-overtime-recording' },
    ],
    'Production': [
      { name: 'Production Management', icon: <ProductionQuantityLimits />, id: 'production-management' },
      { name: 'Production Schedule', icon: <Schedule />, id: 'production-schedule' },
      { name: 'Production Plan', icon: <AssignmentOutlined />, id: 'production-plan' },
      { name: 'Product Formulation', icon: <Biotech />, id: 'product-formulation' },
      { name: 'Line Management', icon: <Timeline />, id: 'line-management' },
      { name: 'Labor Cost', icon: <AccountBalance />, id: 'labor-cost' },
      { name: 'Activity Management', icon: <PlaylistPlay />, id: 'activity-management' },
      { name: 'Overtime Management', icon: <AccessTime />, id: 'production-overtime-management' }
    ],
    'Quality Assurance': [
      { name: 'Quality Audits', icon: <AssessmentIcon />, id: 'quality-audits' },
      { name: 'Compliance Management', icon: <Security />, id: 'compliance-management' },
      { name: 'Overtime Recording', icon: <AccessTime />, id: 'quality-overtime-recording' },
    ],
    'Supply Chain': [
      { name: 'Material Management', icon: <Inventory />, id: 'material-management' },
      { name: 'Product Management', icon: <Category />, id: 'product-management' },
      { name: 'Material Transaction', icon: <SwapHoriz />, id: 'materialRI' },
      { name: 'Product Transaction', icon: <ShoppingCart />, id: 'productRI' },
      { name: 'Inventory Plan', icon: <Inventory2 />, id: 'inventory-plan' },
      { name: 'Overtime Management', icon: <AccessTime />, id: 'supplychain-overtime-management' }
    ],
    'Finance': [
      { name: 'Expense Management', icon: <MoneyOff />, id: 'expense-management' },
      { name: 'Pricing', icon: <AttachMoney />, id: 'pricing' },
      { name: 'Petty Cash', icon: <AccountBalanceWallet />, id: 'petty-cash' },
      { name: 'Payroll Management', icon: <Payment />, id: 'payroll-management' },
      { name: 'Finance Overtime Approval', icon: <AccessTime />, id: 'finance-overtime-approval' },
      { name: 'Overtime Recording', icon: <AccessTime />, id: 'finance-overtime-recording' }
    ],
    'Sales & Marketing': [
      { name: 'Daily Sales', icon: <PointOfSale />, id: 'daily-sales' },
      { name: 'Sales Plan', icon: <ShowChart />, id: 'sales-plan' },
      { name: 'Overtime Recording', icon: <AccessTime />, id: 'sales-overtime-recording' },
    ]
  };

  // Enhanced departments data with comprehensive KPIs
  const departments = [
    { 
      id: 1, 
      name: 'Human Resources', 
      manager: 'Mesay', 
      employees: 24, 
      status: 'Active',
      kpis: [
        { name: 'Employee Satisfaction', value: '92%', target: '90%', trend: '+2%', status: 'exceeding' },
        { name: 'Turnover Rate', value: '4.2%', target: '5%', trend: '-0.8%', status: 'exceeding' },
        { name: 'Time to Hire', value: '18 days', target: '21 days', trend: '-3 days', status: 'exceeding' },
        { name: 'Training Completion', value: '88%', target: '85%', trend: '+3%', status: 'exceeding' }
      ]
    },
    { 
      id: 2, 
      name: 'Production', 
      manager: 'Mike Chen', 
      employees: 156, 
      status: 'Active',
      kpis: [
        { name: 'Production Efficiency', value: '94%', target: '92%', trend: '+2%', status: 'exceeding' },
        { name: 'Quality Rate', value: '98.7%', target: '98%', trend: '+0.7%', status: 'exceeding' },
        { name: 'On-time Delivery', value: '96%', target: '95%', trend: '+1%', status: 'exceeding' },
        { name: 'Machine Utilization', value: '85%', target: '88%', trend: '-3%', status: 'needs_improvement' }
      ]
    },
    { 
      id: 3, 
      name: 'Quality Assurance', 
      manager: 'Sarah Williams', 
      employees: 18, 
      status: 'Active',
      kpis: [
        { name: 'Defect Rate', value: '1.2%', target: '1.5%', trend: '-0.3%', status: 'exceeding' },
        { name: 'Audit Score', value: '98%', target: '95%', trend: '+3%', status: 'exceeding' },
        { name: 'Compliance', value: '100%', target: '100%', trend: '0%', status: 'meeting' },
        { name: 'First Pass Yield', value: '96.5%', target: '95%', trend: '+1.5%', status: 'exceeding' }
      ]
    },
    { 
      id: 4, 
      name: 'Supply Chain', 
      manager: 'David Brown', 
      employees: 32, 
      status: 'Active',
      kpis: [
        { name: 'Inventory Turnover', value: '8.2', target: '8.0', trend: '+0.2', status: 'exceeding' },
        { name: 'Supplier On-time', value: '95%', target: '94%', trend: '+1%', status: 'exceeding' },
        { name: 'Logistics Cost', value: '12.5%', target: '12%', trend: '+0.5%', status: 'needs_improvement' },
        { name: 'Order Accuracy', value: '99.2%', target: '99%', trend: '+0.2%', status: 'exceeding' }
      ]
    },
    { 
      id: 5, 
      name: 'Finance', 
      manager: 'Emily Davis', 
      employees: 12, 
      status: 'Active',
      kpis: [
        { name: 'Revenue Growth', value: '15.2%', target: '12%', trend: '+3.2%', status: 'exceeding' },
        { name: 'Profit Margin', value: '22.8%', target: '20%', trend: '+2.8%', status: 'exceeding' },
        { name: 'Budget Adherence', value: '97%', target: '95%', trend: '+2%', status: 'exceeding' },
        { name: 'Days Sales Outstanding', value: '38 days', target: '35 days', trend: '+3 days', status: 'needs_improvement' }
      ]
    },
    { 
      id: 6, 
      name: 'Sales & Marketing', 
      manager: 'Robert Wilson', 
      employees: 28, 
      status: 'Active',
      kpis: [
        { name: 'Sales Growth', value: '18.5%', target: '15%', trend: '+3.5%', status: 'exceeding' },
        { name: 'Conversion Rate', value: '12.3%', target: '11%', trend: '+1.3%', status: 'exceeding' },
        { name: 'Customer Acquisition', value: '245/mo', target: '220/mo', trend: '+25/mo', status: 'exceeding' },
        { name: 'Customer Retention', value: '88%', target: '85%', trend: '+3%', status: 'exceeding' }
      ]
    }
  ];

  // Fetch company data from database
  const fetchCompanyData = async () => {
    try {
      setLoadingCompany(true);
      const response = await fetch('http://localhost:5000/api/companyManagements', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Handle different response formats
        let companies = [];
        
        if (Array.isArray(data)) {
          companies = data;
        } else if (data.data && Array.isArray(data.data)) {
          companies = data.data;
        } else if (data.companies && Array.isArray(data.companies)) {
          companies = data.companies;
        }
        
        // Find active company or use the first one
        const activeCompany = companies.find(company => company.status === 'Active') || companies[0];
        
        if (activeCompany) {
          setCompanyData(activeCompany);
        } else {
          setCompanyData(null);
        }
      } else {
        setCompanyData(null);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      setCompanyData(null);
    } finally {
      setLoadingCompany(false);
    }
  };

  // Get company name with fallback
  const getCompanyName = () => {
    if (loadingCompany) return 'Loading...';
    if (companyData && companyData.companyName) return companyData.companyName;
    return 'Mesay Foods PLC';
  };

  useEffect(() => {
    // Fetch company data when component mounts
    fetchCompanyData();
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleModuleClick = (moduleId) => {
    setActiveModule(moduleId);
    if (moduleId === 'departments') {
      setSelectedDepartment(null);
    }
  };

  const handleDepartmentSelect = (department) => {
    setSelectedDepartment(department);
    setActiveModule(`department-${department.id}`);
  };

  // Back navigation handler
  const handleBackNavigation = () => {
    if (activeModule.startsWith('department-') || activeModule === 'departments') {
      setActiveModule('dashboard');
      setSelectedDepartment(null);
    } else if (selectedDepartment) {
      setActiveModule(`department-${selectedDepartment.id}`);
    } else {
      setActiveModule('departments');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'exceeding':
        return <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />;
      case 'meeting':
        return <CheckCircle sx={{ color: 'info.main', fontSize: 16 }} />;
      case 'needs_improvement':
        return <Warning sx={{ color: 'warning.main', fontSize: 16 }} />;
      default:
        return <Error sx={{ color: 'error.main', fontSize: 16 }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'exceeding':
        return 'success';
      case 'meeting':
        return 'info';
      case 'needs_improvement':
        return 'warning';
      default:
        return 'error';
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Module render functions - UPDATED with proper Overtime Management calls
  const renderHROvertimeChecking = () => {
    return (
      <Box>
        <HROvertimeChecking onBack={() => handleModuleClick('departments')} />
      </Box>
    );
  };

  const renderHROvertimeRecording = () => {
    return (
      <Box>
        <OvertimeManagement 
          onBack={() => handleModuleClick('departments')} 
          department="Human Resources"
        />
      </Box>
    );
  };

  const renderProductionOvertimeManagement = () => {
    return (
      <Box>
        <OvertimeManagement 
          onBack={() => handleModuleClick('departments')} 
          department="Production"
        />
      </Box>
    );
  };

  const renderSupplyChainOvertimeManagement = () => {
    return (
      <Box>
        <OvertimeManagement 
          onBack={() => handleModuleClick('departments')} 
          department="Supply Chain"
        />
      </Box>
    );
  };

  const renderFinanceOvertimeRecording = () => {
    return (
      <Box>
        <OvertimeManagement 
          onBack={() => handleModuleClick('departments')} 
          department="Finance"
        />
      </Box>
    );
  };

  const renderSalesOvertimeRecording = () => {
    return (
      <Box>
        <OvertimeManagement 
          onBack={() => handleModuleClick('departments')} 
          department="Sales"
        />
      </Box>
    );
  };

  const renderQualityOvertimeRecording = () => {
    return (
      <Box>
        <OvertimeManagement 
          onBack={() => handleModuleClick('departments')} 
          department="Quality"
        />
      </Box>
    );
  };

  const renderFinanceOvertimeApproval = () => {
    return (
      <Box>
        <FinanceOvertimeApproval onBack={() => handleModuleClick('departments')} />
      </Box>
    );
  };

  // Render functions for other modules
  const renderEmployeeManagement = () => {
    return (
      <Box>
        <EmployeeManagement onBack={() => handleModuleClick('departments')} />
      </Box>
    );
  };

  const renderAttendanceManagement = () => {
    return (
      <Box>
        <AttendanceManagement onBack={() => handleModuleClick('departments')} />
      </Box>
    );
  };

  const renderActivityManagement = () => {
    return (
      <Box>
        <ActivityManagement onBack={() => handleModuleClick('departments')} />
      </Box>
    );
  };

  const renderLaborCost = () => {
    return (
      <Box>
        <LaborCost onBack={() => handleModuleClick('departments')} />
      </Box>
    );
  };

  const renderLineManagement = () => {
    return (
      <Box>
        <LineManagement onBack={() => handleModuleClick('departments')} />
      </Box>
    );
  };

  const renderSales = () => {
    return (
      <Box>
        <DailySalesForm onBack={() => handleModuleClick('departments')} />
      </Box>
    );
  };

  const renderSalesPlan = () => {
    return (
      <Box>
        <SalesPlan onBack={() => handleModuleClick('departments')} />
      </Box>
    );
  };

  const renderExpenseManagement = () => {
    return (
      <Box>
        <ExpenseManagement onBack={() => handleModuleClick('departments')} />
      </Box>
    );
  };

  const renderProductFormulation = () => {
    return (
      <Box>
        <ProductFormulation onBack={() => handleModuleClick('departments')} />
      </Box>
    );
  };

  const renderProductionPlan = () => {
    return (
      <Box>
        <ProductionPlan onBack={() => handleModuleClick('departments')} />
      </Box>
    );
  };

  const renderInventoryPlan = () => {
    return (
      <Box>
        <InventoryPlan onBack={() => handleModuleClick('departments')} />
      </Box>
    );
  };

  const renderPettyCashManagement = () => {
    return (
      <Box>
        <PettyCashManagement onBack={() => handleModuleClick('departments')} />
      </Box>
    );
  };

  const renderPayrollManagement = () => {
    return (
      <Box>
        <PayrollManagement onBack={() => handleModuleClick('departments')} />
      </Box>
    );
  };

  const renderProductionManagement = () => {
    return (
      <Box>
        <ProductionManagement onBack={() => handleModuleClick('departments')} />
      </Box>
    );
  };

  const renderMaterialManagement = () => {
    return (
      <Box>
        <MaterialManagement onBack={() => handleModuleClick('departments')} />
      </Box>
    );
  };

  const renderProductManagement = () => {
    return (
      <Box>
        <ProductManagement onBack={() => handleModuleClick('departments')} />
      </Box>
    );
  };

  const renderMaterialRI = () => {
    return (
      <Box>
        <MaterialRI onBack={() => handleModuleClick('departments')} />
      </Box>
    );
  };

  const renderProductRI = () => {
    return (
      <Box>
        <ProductRI onBack={() => handleModuleClick('departments')} />
      </Box>
    );
  };

  const renderPricing = () => {
    return (
      <Box>
        <Pricing onBack={() => handleModuleClick('departments')} />
      </Box>
    );
  };

  const renderProductionSchedule = () => {
    return (
      <Box>
        <ProductionSchedule onBack={() => handleModuleClick('departments')} />
      </Box>
    );
  };

  const renderReports = () => {
    return (
      <Box>
        <Reports onBack={() => handleModuleClick('dashboard')} />
      </Box>
    );
  };

  const renderDashboard = () => {
    return (
      <Box>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
          Department KPIs
        </Typography>
        
        <Grid container spacing={2} justifyContent="center">
          {departments.map((dept) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={dept.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'all 0.3s ease',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                  }
                }}
              >
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
                    <Box sx={{ color: 'primary.main', mr: 1.5, fontSize: '1.5rem' }}>
                      {departmentIcons[dept.name] || <BusinessIcon />}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                      {dept.name}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.8rem' }}>
                      Manager: {dept.manager}
                    </Typography>
                    <Chip 
                      label={`${dept.employees} Employees`} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>

                  <Divider sx={{ my: 1.5 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {dept.kpis.slice(0, 2).map((kpi, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ flex: 1, fontSize: '0.75rem' }}>
                          {kpi.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="body2" fontWeight="bold" color={`${getStatusColor(kpi.status)}.main`} sx={{ fontSize: '0.75rem' }}>
                            {kpi.value}
                          </Typography>
                          {getStatusIcon(kpi.status)}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  const renderDepartments = () => (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
        Departments
      </Typography>
      
      <Grid container spacing={2} justifyContent="center">
        {departments.map((dept) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={dept.id}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                height: '100%',
                minHeight: 100,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                textAlign: 'center',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                  border: `1px solid ${theme.palette.primary.main}`,
                }
              }}
              onClick={() => handleDepartmentSelect(dept)}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box
                  sx={{
                    color: 'primary.main',
                    mb: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    '& .MuiSvgIcon-root': {
                      fontSize: 28,
                    }
                  }}
                >
                  {departmentIcons[dept.name] || <BusinessIcon />}
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', fontSize: '0.9rem', mb: 0.5 }}>
                  {dept.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                  {dept.manager}
                </Typography>
                <Chip 
                  label={`${dept.employees} Employees`} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: '0.65rem' }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderDepartmentPage = (department) => {
    const modules = departmentModules[department.name] || [];

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {department.name} Department
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
            Key Performance Indicators
          </Typography>
          <Grid container spacing={1.5} sx={{ mb: 2 }} justifyContent="center">
            {department.kpis.map((kpi, index) => (
              <Grid item xs={12} sm={6} md={3} lg={2.4} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    transition: 'all 0.3s ease',
                    border: `2px solid ${alpha(theme.palette[getStatusColor(kpi.status)].main, 0.2)}`,
                    background: `linear-gradient(135deg, ${alpha(theme.palette[getStatusColor(kpi.status)].main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.1)} 100%)`,
                    textAlign: 'center'
                  }}
                >
                  <CardContent sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', flex: 1, fontSize: '0.8rem' }}>
                        {kpi.name}
                      </Typography>
                      {getStatusIcon(kpi.status)}
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: `${getStatusColor(kpi.status)}.main`, fontSize: '1rem' }}>
                        {kpi.value}
                      </Typography>
                      <Chip 
                        label={kpi.trend} 
                        size="small"
                        color={kpi.trend.startsWith('+') ? 'success' : 'error'}
                        sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}
                      />
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Target: {kpi.target}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
            Department Modules
          </Typography>
          <Grid container spacing={1.5} justifyContent="center">
            {modules.map((module, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    textAlign: 'center',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    }
                  }}
                  onClick={() => handleModuleClick(module.id)}
                >
                  <CardContent sx={{ textAlign: 'center', p: 1.5 }}>
                    <Box
                      sx={{
                        color: 'primary.main',
                        mb: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        '& .MuiSvgIcon-root': {
                          fontSize: 28,
                        }
                      }}
                    >
                      {module.icon}
                    </Box>
                    <Typography 
                      variant="body1" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 'bold',
                        fontSize: '0.85rem'
                      }}
                    >
                      {module.name}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    );
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          {getCompanyName()}
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={activeModule === item.id}
              onClick={() => handleModuleClick(item.id)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  borderRight: `3px solid ${theme.palette.primary.main}`,
                },
              }}
            >
              <ListItemIcon sx={{ color: activeModule === item.id ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontWeight: activeModule === item.id ? 'bold' : 'normal'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            {activeModule !== 'dashboard' && (
              <IconButton
                color="inherit"
                onClick={handleBackNavigation}
                sx={{ mr: 2 }}
                size="large"
              >
                <ArrowBack />
              </IconButton>
            )}
            
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
              {activeModule === 'dashboard' && 'Operation Dashboard'}
              {activeModule === 'departments' && 'Department Management'}
              {activeModule === 'employee-management' && 'Employee Management'}
              {activeModule === 'hr-overtime-checking' && 'HR Overtime Checking'}
              {activeModule === 'hr-overtime-recording' && 'HR Overtime Recording'}
              {activeModule === 'production-overtime-management' && 'Production Overtime Management'}
              {activeModule === 'supplychain-overtime-management' && 'Supply Chain Overtime Management'}
              {activeModule === 'finance-overtime-recording' && 'Finance Overtime Recording'}
              {activeModule === 'finance-overtime-approval' && 'Finance Overtime Approval'}
              {activeModule === 'sales-overtime-recording' && 'Sales Overtime Recording'}
              {activeModule === 'quality-overtime-recording' && 'Quality Overtime Recording'}
              {activeModule === 'reports' && 'Production & Inventory Reports'}
              {activeModule === 'attendance-management' && 'Attendance Management'}
              {activeModule === 'material-management' && 'Material Management'}
              {activeModule === 'product-management' && 'Product Management'}
              {activeModule === 'production-management' && 'Production Management'}
              {activeModule === 'production-schedule' && 'Production Schedule'}
              {activeModule === 'production-plan' && 'Production Plan Management'}
              {activeModule === 'inventory-plan' && 'Inventory Plan Management'}
              {activeModule === 'materialRI' && 'Material Transaction'}
              {activeModule === 'productRI' && 'Product Transaction'}
              {activeModule === 'pricing' && 'Product Pricing Management'}
              {activeModule === 'daily-sales' && 'Sales Management'}
              {activeModule === 'sales-plan' && 'Sales Plan Management'}
              {activeModule === 'expense-management' && 'Expense Management'}
              {activeModule === 'product-formulation' && 'Product Formulation'}
              {activeModule === 'petty-cash' && 'Petty Cash Management'}
              {activeModule === 'payroll-management' && 'Payroll Management'}
              {activeModule === 'line-management' && 'Line Management'}
              {activeModule === 'labor-cost' && 'Labor Cost Management'}
              {activeModule === 'activity-management' && 'Activity Management'}
              {activeModule.startsWith('department-') && `${selectedDepartment?.name} Department`}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" sx={{ mt: 2 }}>
          {activeModule === 'dashboard' && renderDashboard()}
          {activeModule === 'departments' && renderDepartments()}
          {activeModule === 'employee-management' && renderEmployeeManagement()}
          {activeModule === 'attendance-management' && renderAttendanceManagement()}
          {activeModule === 'hr-overtime-checking' && renderHROvertimeChecking()}
          {activeModule === 'hr-overtime-recording' && renderHROvertimeRecording()}
          {activeModule === 'production-overtime-management' && renderProductionOvertimeManagement()}
          {activeModule === 'supplychain-overtime-management' && renderSupplyChainOvertimeManagement()}
          {activeModule === 'finance-overtime-recording' && renderFinanceOvertimeRecording()}
          {activeModule === 'finance-overtime-approval' && renderFinanceOvertimeApproval()}
          {activeModule === 'sales-overtime-recording' && renderSalesOvertimeRecording()}
          {activeModule === 'quality-overtime-recording' && renderQualityOvertimeRecording()}
          {activeModule === 'reports' && renderReports()}
          {activeModule === 'material-management' && renderMaterialManagement()}
          {activeModule === 'product-management' && renderProductManagement()}
          {activeModule === 'production-management' && renderProductionManagement()}
          {activeModule === 'production-schedule' && renderProductionSchedule()}
          {activeModule === 'production-plan' && renderProductionPlan()}
          {activeModule === 'inventory-plan' && renderInventoryPlan()}
          {activeModule === 'materialRI' && renderMaterialRI()}
          {activeModule === 'productRI' && renderProductRI()}
          {activeModule === 'pricing' && renderPricing()}
          {activeModule === 'daily-sales' && renderSales()}
          {activeModule === 'sales-plan' && renderSalesPlan()}
          {activeModule === 'expense-management' && renderExpenseManagement()}
          {activeModule === 'product-formulation' && renderProductFormulation()}
          {activeModule === 'petty-cash' && renderPettyCashManagement()}
          {activeModule === 'payroll-management' && renderPayrollManagement()}
          {activeModule === 'line-management' && renderLineManagement()}
          {activeModule === 'labor-cost' && renderLaborCost()}
          {activeModule === 'activity-management' && renderActivityManagement()}
          {activeModule.startsWith('department-') && selectedDepartment && renderDepartmentPage(selectedDepartment)}
        </Container>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;