// import { useAuth } from "../contexts/AuthContext";

// const Dashboard = () => {
//   const { user, logout } = useAuth();

//   return (
//     <div>
//       <h2>Welcome, {user?.username}!</h2>
//       <p>Your role: <strong>{user?.role}</strong></p>

//       <p>This is the dashboard accessible to all authenticated users.</p>

//       <button onClick={logout}>Logout</button>
//     </div>
//   );
// };

// export default Dashboard;



// // // Dashboard.jsx - Updated with complete Overtime Management module integration
// // import React, { useState, useEffect } from 'react';
// // import {
// //   Box,
// //   Drawer,
// //   AppBar,
// //   Toolbar,
// //   Typography,
// //   Divider,
// //   List,
// //   ListItem,
// //   ListItemButton,
// //   ListItemIcon,
// //   ListItemText,
// //   Container,
// //   Grid,
// //   Paper,
// //   Card,
// //   CardContent,
// //   IconButton,
// //   useTheme,
// //   useMediaQuery,
// //   Table,
// //   TableBody,
// //   TableCell,
// //   TableHead,
// //   TableRow,
// //   TableContainer,
// //   TablePagination,
// //   Chip,
// //   LinearProgress,
// //   alpha,
// //   Button,
// //   Dialog,
// //   DialogTitle,
// //   DialogContent,
// //   DialogActions,
// //   TextField,
// //   InputAdornment,
// //   Snackbar,
// //   Alert,
// //   CircularProgress,
// //   MenuItem
// // } from '@mui/material';
// // import {
// //   Dashboard as DashboardIcon,
// //   People as PeopleIcon,
// //   Business as BusinessIcon,
// //   Assessment as AssessmentIcon,
// //   Menu as MenuIcon,
// //   TrendingUp,
// //   Group,
// //   Factory,
// //   LocalShipping,
// //   Security,
// //   Schedule,
// //   Work,
// //   Payment,
// //   Receipt,
// //   ShoppingCart,
// //   Support,
// //   Analytics,
// //   CheckCircle,
// //   Warning,
// //   Error,
// //   Add,
// //   Edit,
// //   Delete,
// //   Person,
// //   Email,
// //   Phone,
// //   CalendarToday,
// //   AttachMoney,
// //   AutoAwesome,
// //   Refresh,
// //   Science,
// //   Engineering,
// //   Calculate,
// //   Store,
// //   Computer,
// //   Assignment,
// //   BarChart,
// //   Description,
// //   ArrowBack,
// //   FileDownload,
// //   FileUpload,
// //   Build,
// //   Inventory,
// //   Category,
// //   PlaylistAddCheck,
// //   ProductionQuantityLimits,
// //   SwapHoriz,
// //   PointOfSale,
// //   MoneyOff,
// //   ShowChart,
// //   Biotech,
// //   AssignmentOutlined,
// //   Inventory2,
// //   AccountBalanceWallet,
// //   Timeline,
// //   AccountBalance,
// //   PlaylistPlay,
// //   AccessTime // Overtime Management icon
// // } from '@mui/icons-material';
// // import axios from 'axios';

// // // Import modules
// // import AttendanceManagement from './HR/AttendanceManagement';
// // import MaterialManagement from './SupplyChain/MaterialManagement';
// // import ProductManagement from './SupplyChain/ProductManagement';
// // import ProductionManagement from './Production/ProductionManagement';
// // import ProductionSchedule from './Production/ProductionSchedule';
// // import MaterialRI from './SupplyChain/MaterialRI';
// // import ProductRI from './SupplyChain/ProductRI';
// // import InventoryControl from './SupplyChain/Inventory';
// // import InventoryPlan from './SupplyChain/InventoryPlan';
// // import Pricing from './Finance/Pricing';
// // import Reports from './Reports/Reports';
// // import Sales from './Sales/DailySalesForm';
// // import SalesPlan from './Sales/SalesPlan';
// // import ExpenseManagement from './Finance/ExpenseManagement';
// // import PayrollManagement from './Finance/PayrollManagement'; 
// // import PettyCashManagement from './Finance/PettyCashManagement';
// // import ProductFormulation from './Production/ProductFormulation';
// // import ProductionPlan from './Production/ProductionPlan'; 
// // import LineManagement from './Production/LineManagement';
// // import LaborCost from './Production/LaborCost';
// // import ActivityManagement from './Production/ActivityManagement';
// // import EmployeeManagement from './HR/EmployeeManagement';

// // // Overtime Management Components
// // import HROvertimeChecking from './HR/HROvertimeChecking';
// // // Import DepartmentOvertimeRecording only once
// // import DepartmentOvertimeRecording from './Production/DepartmentOvertimeRecording';
// // import FinanceOvertimeApproval from './Finance/FinanceOvertimeApproval';

// // const drawerWidth = 240;

// // const Dashboard = () => {
// //   const theme = useTheme();
// //   const isMobile = useMediaQuery(theme.breakpoints.down('md'));
// //   const [mobileOpen, setMobileOpen] = useState(false);
// //   const [activeModule, setActiveModule] = useState('dashboard');
// //   const [selectedDepartment, setSelectedDepartment] = useState(null);
// //   const [page, setPage] = useState(0);
// //   const [rowsPerPage, setRowsPerPage] = useState(10);
// //   const [employees, setEmployees] = useState([]);
// //   const [materials, setMaterials] = useState([]);
// //   const [loading, setLoading] = useState(false);
  
// //   // State for company data
// //   const [companyData, setCompanyData] = useState(null);
// //   const [loadingCompany, setLoadingCompany] = useState(true);
  
// //   // State for Employee Form Dialog
// //   const [openEmployeeDialog, setOpenEmployeeDialog] = useState(false);
// //   const [selectedEmployee, setSelectedEmployee] = useState(null);
// //   const [employeeFormData, setEmployeeFormData] = useState({
// //     employeeId: '',
// //     firstName: '',
// //     lastName: '',
// //     email: '',
// //     phone: '',
// //     department: '',
// //     position: '',
// //     hireDate: '',
// //     salary: '',
// //     status: 'active',
// //   });

// //   // Snackbar state
// //   const [snackbar, setSnackbar] = useState({
// //     open: false,
// //     message: '',
// //     severity: 'success'
// //   });

// //   // Departments for the form
// //   const formDepartments = [
// //     'HR',
// //     'Finance',
// //     'Production',
// //     'Quality Control',
// //     'Sales',
// //     'Supply Chain',
// //     'Technical',
// //     'Maintenance',
// //     'Technique'
// //   ];

// //   const statusOptions = [
// //     'active',
// //     'inactive',
// //     'terminated'
// //   ];

// //   const menuItems = [
// //     { text: 'Dashboard', icon: <DashboardIcon />, id: 'dashboard' },
// //     { text: 'Departments', icon: <BusinessIcon />, id: 'departments' },
// //     { text: 'Reports', icon: <AssessmentIcon />, id: 'reports' },
// //   ];

// //   // Department icons mapping
// //   const departmentIcons = {
// //     'Human Resources': <PeopleIcon />,
// //     'Production': <Factory />,
// //     'Quality Assurance': <Science />,
// //     'Supply Chain': <LocalShipping />,
// //     'Finance': <Calculate />,
// //     'Sales & Marketing': <Store />,
// //     'IT Support': <Computer />,
// //     'Technique': <Build />
// //   };

// //   // Department modules configuration - UPDATED with all Overtime Management modules
// //   const departmentModules = {
// //     'Human Resources': [
// //       { name: 'Employee Management', icon: <PeopleIcon />, id: 'employee-management' },
// //       { name: 'Attendance Management', icon: <Schedule />, id: 'attendance-management' },
// //       { name: 'HR Overtime Checking', icon: <AccessTime />, id: 'hr-overtime-checking' },
// //       { name: 'Leave Management', icon: <Work />, id: 'leave-management' },
// //       { name: 'Performance Management', icon: <Analytics />, id: 'performance-management' }
// //     ],
// //     'Production': [
// //       { name: 'Production Schedule', icon: <Schedule />, id: 'production-schedule' },
// //       { name: 'Production Plan', icon: <AssignmentOutlined />, id: 'production-plan' },
// //       { name: 'Production Management', icon: <ProductionQuantityLimits />, id: 'production-management' },
// //       { name: 'Material TransationP', icon: <SwapHoriz />, id: 'material-transactionp' },
// //       { name: 'Labor Cost', icon: <AccountBalance />, id: 'labor-cost' },
// //       { name: 'Product Formulation', icon: <Biotech />, id: 'product-formulation' },
// //       { name: 'Line Management', icon: <Timeline />, id: 'line-management' },
// //       { name: 'Activity Management', icon: <PlaylistPlay />, id: 'activity-management' },
// //       { name: 'Work Order Management', icon: <Work />, id: 'work-order-management' },
// //       { name: 'Department Overtime Recording', icon: <AccessTime />, id: 'production-department-overtime-recording' }
// //     ],
// //     'Quality Assurance': [
// //       { name: 'Quality Audits', icon: <AssessmentIcon />, id: 'quality-audits' },
// //       { name: 'Defect Tracking', icon: <Warning />, id: 'defect-tracking' },
// //       { name: 'Compliance Management', icon: <Security />, id: 'compliance-management' },
// //       { name: 'Testing Protocols', icon: <Science />, id: 'testing-protocols' }
// //     ],
// //     'Supply Chain': [
// //       { name: 'Material Transaction', icon: <SwapHoriz />, id: 'materialRI' },
// //       { name: 'Product Transaction', icon: <ShoppingCart />, id: 'productRI' },
// //       { name: 'Inventory Control', icon: <Assignment />, id: 'inventory-control' },
// //       { name: 'Material Management', icon: <Inventory />, id: 'material-management' },
// //       { name: 'Product Management', icon: <Category />, id: 'product-management' },
// //       { name: 'Inventory Plan', icon: <Inventory2 />, id: 'inventory-plan' },
// //       { name: 'Department Overtime Recording', icon: <AccessTime />, id: 'supplychain-department-overtime-recording' }
// //     ],
// //     'Finance': [
// //       { name: 'Expense Management', icon: <MoneyOff />, id: 'expense-management' },
// //       { name: 'Accounts Receivable', icon: <Receipt />, id: 'accounts-receivable' },
// //       { name: 'Petty Cash', icon: <AccountBalanceWallet />, id: 'petty-cash' },
// //       { name: 'Payroll Management', icon: <Payment />, id: 'payroll-management' },
// //       { name: 'Finance Overtime Approval', icon: <AccessTime />, id: 'finance-overtime-approval' },
// //       { name: 'Pricing', icon: <AttachMoney />, id: 'pricing' }
// //     ],
// //     'Sales & Marketing': [
// //       { name: 'Sales Plan', icon: <ShowChart />, id: 'sales-plan' },
// //       { name: 'Daily Sales', icon: <PointOfSale />, id: 'daily-sales' },
// //       { name: 'Customer Management', icon: <PeopleIcon />, id: 'customer-management' },
// //       { name: 'Sales Pipeline', icon: <TrendingUp />, id: 'sales-pipeline' },
// //       { name: 'Lead Management', icon: <Group />, id: 'lead-management' }
// //     ],
// //     'IT Support': [
// //       { name: 'Help Desk', icon: <Support />, id: 'help-desk' },
// //       { name: 'System Administration', icon: <Security />, id: 'system-administration' },
// //       { name: 'Network Management', icon: <Computer />, id: 'network-management' },
// //       { name: 'Software Management', icon: <Engineering />, id: 'software-management' }
// //     ],
// //     'Technique': [
// //       { name: 'Technical Planning', icon: <Assignment />, id: 'technical-planning' },
// //       { name: 'Process Optimization', icon: <Analytics />, id: 'process-optimization' },
// //       { name: 'Equipment Setup', icon: <Build />, id: 'equipment-setup' },
// //       { name: 'Technical Support', icon: <Support />, id: 'technical-support' }
// //     ]
// //   };

// //   // Enhanced departments data with comprehensive KPIs
// //   const departments = [
// //     { 
// //       id: 1, 
// //       name: 'Human Resources', 
// //       manager: 'Mesay', 
// //       employees: 24, 
// //       status: 'Active',
// //       kpis: [
// //         { name: 'Employee Satisfaction', value: '92%', target: '90%', trend: '+2%', status: 'exceeding' },
// //         { name: 'Turnover Rate', value: '4.2%', target: '5%', trend: '-0.8%', status: 'exceeding' },
// //         { name: 'Time to Hire', value: '18 days', target: '21 days', trend: '-3 days', status: 'exceeding' },
// //         { name: 'Training Completion', value: '88%', target: '85%', trend: '+3%', status: 'exceeding' }
// //       ]
// //     },
// //     { 
// //       id: 2, 
// //       name: 'Production', 
// //       manager: 'Mike Chen', 
// //       employees: 156, 
// //       status: 'Active',
// //       kpis: [
// //         { name: 'Production Efficiency', value: '94%', target: '92%', trend: '+2%', status: 'exceeding' },
// //         { name: 'Quality Rate', value: '98.7%', target: '98%', trend: '+0.7%', status: 'exceeding' },
// //         { name: 'On-time Delivery', value: '96%', target: '95%', trend: '+1%', status: 'exceeding' },
// //         { name: 'Machine Utilization', value: '85%', target: '88%', trend: '-3%', status: 'needs_improvement' }
// //       ]
// //     },
// //     { 
// //       id: 3, 
// //       name: 'Quality Assurance', 
// //       manager: 'Sarah Williams', 
// //       employees: 18, 
// //       status: 'Active',
// //       kpis: [
// //         { name: 'Defect Rate', value: '1.2%', target: '1.5%', trend: '-0.3%', status: 'exceeding' },
// //         { name: 'Audit Score', value: '98%', target: '95%', trend: '+3%', status: 'exceeding' },
// //         { name: 'Compliance', value: '100%', target: '100%', trend: '0%', status: 'meeting' },
// //         { name: 'First Pass Yield', value: '96.5%', target: '95%', trend: '+1.5%', status: 'exceeding' }
// //       ]
// //     },
// //     { 
// //       id: 4, 
// //       name: 'Supply Chain', 
// //       manager: 'David Brown', 
// //       employees: 32, 
// //       status: 'Active',
// //       kpis: [
// //         { name: 'Inventory Turnover', value: '8.2', target: '8.0', trend: '+0.2', status: 'exceeding' },
// //         { name: 'Supplier On-time', value: '95%', target: '94%', trend: '+1%', status: 'exceeding' },
// //         { name: 'Logistics Cost', value: '12.5%', target: '12%', trend: '+0.5%', status: 'needs_improvement' },
// //         { name: 'Order Accuracy', value: '99.2%', target: '99%', trend: '+0.2%', status: 'exceeding' }
// //       ]
// //     },
// //     { 
// //       id: 5, 
// //       name: 'Finance', 
// //       manager: 'Emily Davis', 
// //       employees: 12, 
// //       status: 'Active',
// //       kpis: [
// //         { name: 'Revenue Growth', value: '15.2%', target: '12%', trend: '+3.2%', status: 'exceeding' },
// //         { name: 'Profit Margin', value: '22.8%', target: '20%', trend: '+2.8%', status: 'exceeding' },
// //         { name: 'Budget Adherence', value: '97%', target: '95%', trend: '+2%', status: 'exceeding' },
// //         { name: 'Days Sales Outstanding', value: '38 days', target: '35 days', trend: '+3 days', status: 'needs_improvement' }
// //       ]
// //     },
// //     { 
// //       id: 6, 
// //       name: 'Sales & Marketing', 
// //       manager: 'Robert Wilson', 
// //       employees: 28, 
// //       status: 'Active',
// //       kpis: [
// //         { name: 'Sales Growth', value: '18.5%', target: '15%', trend: '+3.5%', status: 'exceeding' },
// //         { name: 'Conversion Rate', value: '12.3%', target: '11%', trend: '+1.3%', status: 'exceeding' },
// //         { name: 'Customer Acquisition', value: '245/mo', target: '220/mo', trend: '+25/mo', status: 'exceeding' },
// //         { name: 'Customer Retention', value: '88%', target: '85%', trend: '+3%', status: 'exceeding' }
// //       ]
// //     },
// //     { 
// //       id: 7, 
// //       name: 'IT Support', 
// //       manager: 'Kevin Martinez', 
// //       employees: 8, 
// //       status: 'Active',
// //       kpis: [
// //         { name: 'System Uptime', value: '99.9%', target: '99.5%', trend: '+0.4%', status: 'exceeding' },
// //         { name: 'Ticket Resolution', value: '94%', target: '92%', trend: '+2%', status: 'exceeding' },
// //         { name: 'User Satisfaction', value: '96%', target: '90%', trend: '+6%', status: 'exceeding' },
// //         { name: 'Mean Time to Repair', value: '2.8 hours', target: '3 hours', trend: '-0.2 hours', status: 'exceeding' }
// //       ]
// //     },
// //     { 
// //       id: 8, 
// //       name: 'Technique',
// //       manager: 'Alex Johnson', 
// //       employees: 15, 
// //       status: 'Active',
// //       kpis: [
// //         { name: 'Process Efficiency', value: '91%', target: '90%', trend: '+1%', status: 'exceeding' },
// //         { name: 'Equipment Uptime', value: '96.5%', target: '95%', trend: '+1.5%', status: 'exceeding' },
// //         { name: 'Technical Issues', value: '3/mo', target: '5/mo', trend: '-2/mo', status: 'exceeding' },
// //         { name: 'Project Completion', value: '88%', target: '85%', trend: '+3%', status: 'exceeding' }
// //       ]
// //     }
// //   ];

// //   // Fetch company data from database
// //   const fetchCompanyData = async () => {
// //     try {
// //       setLoadingCompany(true);
// //       const response = await fetch('http://localhost:5000/api/companyManagements', {
// //         method: 'GET',
// //         headers: {
// //           'Content-Type': 'application/json',
// //         },
// //       });
      
// //       if (response.ok) {
// //         const data = await response.json();
        
// //         // Handle different response formats
// //         let companies = [];
        
// //         if (Array.isArray(data)) {
// //           companies = data;
// //         } else if (data.data && Array.isArray(data.data)) {
// //           companies = data.data;
// //         } else if (data.companies && Array.isArray(data.companies)) {
// //           companies = data.companies;
// //         }
        
// //         // Find active company or use the first one
// //         const activeCompany = companies.find(company => company.status === 'Active') || companies[0];
        
// //         if (activeCompany) {
// //           setCompanyData(activeCompany);
// //         } else {
// //           setCompanyData(null);
// //         }
// //       } else {
// //         setCompanyData(null);
// //       }
// //     } catch (error) {
// //       console.error('Error fetching company data:', error);
// //       setCompanyData(null);
// //     } finally {
// //       setLoadingCompany(false);
// //     }
// //   };

// //   // Get company name with fallback
// //   const getCompanyName = () => {
// //     if (loadingCompany) return 'Loading...';
// //     if (companyData && companyData.companyName) return companyData.companyName;
// //     return 'Mesay Foods PLC';
// //   };

// //   // Fetch employees from database
// //   const fetchEmployees = async () => {
// //     setLoading(true);
// //     try {
// //       const response = await axios.get('http://localhost:5000/api/employeemanagements?limit=1000');
// //       const data = response.data;
      
// //       // Handle different response structures
// //       let employeesArray = [];
      
// //       if (Array.isArray(data.employees)) {
// //         employeesArray = data.employees;
// //       } else if (Array.isArray(data.data)) {
// //         employeesArray = data.data;
// //       } else if (Array.isArray(data)) {
// //         employeesArray = data;
// //       }
      
// //       setEmployees(employeesArray || []);
// //     } catch (error) {
// //       console.error('Error fetching employees:', error);
// //       setSnackbar({
// //         open: true,
// //         message: 'Error fetching employees',
// //         severity: 'error'
// //       });
// //       setEmployees([]);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // Fetch materials for dashboard stats
// //   const fetchMaterials = async () => {
// //     try {
// //       const response = await axios.get('http://localhost:5000/api/materials?limit=1000');
// //       const materialsData = response.data.data || response.data || [];
// //       setMaterials(materialsData);
      
// //       // Update Supply Chain KPIs with real data
// //       updateSupplyChainKPIs(materialsData);
// //     } catch (error) {
// //       console.error('Error fetching materials:', error);
// //     }
// //   };

// //   // Update Supply Chain KPIs with real material data
// //   const updateSupplyChainKPIs = (materialsData) => {
// //     if (!materialsData.length) return;

// //     const activeMaterials = materialsData.filter(m => m.Status === 'Active');
// //     const totalValue = materialsData.reduce((sum, material) => 
// //       sum + ((material.UnitPrice || 0) * (material.ReorderQuantity || 0)), 0
// //     );
// //     const materialTypes = [...new Set(materialsData.map(m => m.Material))];
    
// //     // Find Supply Chain department and update KPIs
// //     const supplyChainDept = departments.find(dept => dept.name === 'Supply Chain');
// //     if (supplyChainDept) {
// //       supplyChainDept.kpis = [
// //         { 
// //           name: 'Total Materials', 
// //           value: materialsData.length.toString(), 
// //           target: '100+', 
// //           trend: `+${materialsData.length}`, 
// //           status: 'exceeding' 
// //         },
// //         { 
// //           name: 'Active Materials', 
// //           value: activeMaterials.length.toString(), 
// //           target: '90%', 
// //           trend: `${Math.round((activeMaterials.length / materialsData.length) * 100)}%`, 
// //           status: 'exceeding' 
// //         },
// //         { 
// //           name: 'Inventory Value', 
// //           value: `ETB ${totalValue.toLocaleString()}`, 
// //           target: 'ETB 1M', 
// //           trend: `+${Math.round(totalValue / 1000)}K`, 
// //           status: 'exceeding' 
// //         },
// //         { 
// //           name: 'Material Types', 
// //           value: materialTypes.length.toString(), 
// //           target: '25+', 
// //           trend: `+${materialTypes.length}`, 
// //           status: 'exceeding' 
// //         }
// //       ];
// //     }
// //   };

// //   useEffect(() => {
// //     // Fetch company data when component mounts
// //     fetchCompanyData();
    
// //     if (activeModule === 'employee-management') {
// //       fetchEmployees();
// //     }
// //     if (activeModule === 'dashboard') {
// //       fetchMaterials();
// //     }
// //   }, [activeModule]);

// //   const handleDrawerToggle = () => {
// //     setMobileOpen(!mobileOpen);
// //   };

// //   const handleModuleClick = (moduleId) => {
// //     setActiveModule(moduleId);
// //     if (moduleId === 'departments') {
// //       setSelectedDepartment(null);
// //     }
// //   };

// //   const handleDepartmentSelect = (department) => {
// //     setSelectedDepartment(department);
// //     setActiveModule(`department-${department.id}`);
// //   };

// //   // Back navigation handler
// //   const handleBackNavigation = () => {
// //     if (activeModule.startsWith('department-') || activeModule === 'departments') {
// //       setActiveModule('dashboard');
// //       setSelectedDepartment(null);
// //     } else if (selectedDepartment) {
// //       setActiveModule(`department-${selectedDepartment.id}`);
// //     } else {
// //       setActiveModule('departments');
// //     }
// //   };

// //   const getStatusIcon = (status) => {
// //     switch (status) {
// //       case 'exceeding':
// //         return <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />;
// //       case 'meeting':
// //         return <CheckCircle sx={{ color: 'info.main', fontSize: 16 }} />;
// //       case 'needs_improvement':
// //         return <Warning sx={{ color: 'warning.main', fontSize: 16 }} />;
// //       default:
// //         return <Error sx={{ color: 'error.main', fontSize: 16 }} />;
// //     }
// //   };

// //   const getStatusColor = (status) => {
// //     switch (status) {
// //       case 'exceeding':
// //         return 'success';
// //       case 'meeting':
// //         return 'info';
// //       case 'needs_improvement':
// //         return 'warning';
// //       default:
// //         return 'error';
// //     }
// //   };

// //   const getEmployeeStatusColor = (status) => {
// //     switch (status) {
// //       case 'active': return 'success';
// //       case 'inactive': return 'default';
// //       case 'terminated': return 'error';
// //       default: return 'default';
// //     }
// //   };

// //   const handleCloseSnackbar = () => {
// //     setSnackbar({ ...snackbar, open: false });
// //   };

// //   // Overtime Management render functions
// //   const renderHROvertimeChecking = () => {
// //     return (
// //       <Box>
// //         <HROvertimeChecking onBack={() => handleModuleClick('departments')} />
// //       </Box>
// //     );
// //   };

// //   // Render Department Overtime Recording with department-specific props
// //   const renderProductionDepartmentOvertimeRecording = () => {
// //     return (
// //       <Box>
// //         <DepartmentOvertimeRecording 
// //           onBack={() => handleModuleClick('departments')} 
// //           department="Production"
// //         />
// //       </Box>
// //     );
// //   };

// //   const renderSupplyChainDepartmentOvertimeRecording = () => {
// //     return (
// //       <Box>
// //         <DepartmentOvertimeRecording 
// //           onBack={() => handleModuleClick('departments')} 
// //           department="Supply Chain"
// //         />
// //       </Box>
// //     );
// //   };

// //   // Add other department overtime recording functions as needed
// //   const renderHRDepartmentOvertimeRecording = () => {
// //     return (
// //       <Box>
// //         <DepartmentOvertimeRecording 
// //           onBack={() => handleModuleClick('departments')} 
// //           department="Human Resources"
// //         />
// //       </Box>
// //     );
// //   };

// //   const renderFinanceDepartmentOvertimeRecording = () => {
// //     return (
// //       <Box>
// //         <DepartmentOvertimeRecording 
// //           onBack={() => handleModuleClick('departments')} 
// //           department="Finance"
// //         />
// //       </Box>
// //     );
// //   };

// //   const renderFinanceOvertimeApproval = () => {
// //     return (
// //       <Box>
// //         <FinanceOvertimeApproval onBack={() => handleModuleClick('departments')} />
// //       </Box>
// //     );
// //   };

// //   // Render functions for other modules
// //   const renderEmployeeManagement = () => {
// //     return (
// //       <Box>
// //         <EmployeeManagement onBack={() => handleModuleClick('departments')} />
// //       </Box>
// //     );
// //   };

// //   const renderActivityManagement = () => {
// //     return (
// //       <Box>
// //         <ActivityManagement onBack={() => handleModuleClick('departments')} />
// //       </Box>
// //     );
// //   };

// //   const renderLaborCost = () => {
// //     return (
// //       <Box>
// //         <LaborCost onBack={() => handleModuleClick('departments')} />
// //       </Box>
// //     );
// //   };

// //   const renderLineManagement = () => {
// //     return (
// //       <Box>
// //         <LineManagement onBack={() => handleModuleClick('departments')} />
// //       </Box>
// //     );
// //   };

// //   const renderSales = () => {
// //     return (
// //       <Box>
// //         <Sales onBack={() => handleModuleClick('departments')} />
// //       </Box>
// //     );
// //   };

// //   const renderSalesPlan = () => {
// //     return (
// //       <Box>
// //         <SalesPlan onBack={() => handleModuleClick('departments')} />
// //       </Box>
// //     );
// //   };

// //   const renderExpenseManagement = () => {
// //     return (
// //       <Box>
// //         <ExpenseManagement onBack={() => handleModuleClick('departments')} />
// //       </Box>
// //     );
// //   };

// //   const renderProductFormulation = () => {
// //     return (
// //       <Box>
// //         <ProductFormulation onBack={() => handleModuleClick('departments')} />
// //       </Box>
// //     );
// //   };

// //   const renderProductionPlan = () => {
// //     return (
// //       <Box>
// //         <ProductionPlan onBack={() => handleModuleClick('departments')} />
// //       </Box>
// //     );
// //   };

// //   const renderInventoryPlan = () => {
// //     return (
// //       <Box>
// //         <InventoryPlan onBack={() => handleModuleClick('departments')} />
// //       </Box>
// //     );
// //   };

// //   const renderPettyCashManagement = () => {
// //     return (
// //       <Box>
// //         <PettyCashManagement onBack={() => handleModuleClick('departments')} />
// //       </Box>
// //     );
// //   };

// //   const renderPayrollManagement = () => {
// //     return (
// //       <Box>
// //         <PayrollManagement onBack={() => handleModuleClick('departments')} />
// //       </Box>
// //     );
// //   };

// //   const renderAttendanceManagement = () => {
// //     return (
// //       <Box>
// //         <AttendanceManagement />
// //       </Box>
// //     );
// //   };

// //   const renderProductionManagement = () => {
// //     return (
// //       <Box>
// //         <ProductionManagement />
// //       </Box>
// //     );
// //   };

// //   const renderMaterialManagement = () => {
// //     return (
// //       <Box>
// //         <MaterialManagement onBack={() => handleModuleClick('departments')} />
// //       </Box>
// //     );
// //   };

// //   const renderProductManagement = () => {
// //     return (
// //       <Box>
// //         <ProductManagement />
// //       </Box>
// //     );
// //   };

// //   const renderMaterialRI = () => {
// //     return (
// //       <Box>
// //         <MaterialRI onBack={() => handleModuleClick('departments')} />
// //       </Box>
// //     );
// //   };

// //   const renderProductRI = () => {
// //     return (
// //       <Box>
// //         <ProductRI onBack={() => handleModuleClick('departments')} />
// //       </Box>
// //     );
// //   };

// //   const renderInventoryControl = () => {
// //     return (
// //       <Box>
// //         <InventoryControl onBack={() => handleModuleClick('departments')} />
// //       </Box>
// //     );
// //   };

// //   const renderPricing = () => {
// //     return (
// //       <Box>
// //         <Pricing onBack={() => handleModuleClick('departments')} />
// //       </Box>
// //     );
// //   };

// //   const renderProductionSchedule = () => {
// //     return (
// //       <Box>
// //         <ProductionSchedule />
// //       </Box>
// //     );
// //   };

// //   const renderReports = () => {
// //     return (
// //       <Box>
// //         <Reports onBack={() => handleModuleClick('dashboard')} />
// //       </Box>
// //     );
// //   };

// //   const renderDashboard = () => {
// //     const totalMaterials = materials.length;
// //     const activeMaterials = materials.filter(m => m.Status === 'Active').length;
// //     const totalValue = materials.reduce((sum, material) => 
// //       sum + ((material.UnitPrice || 0) * (material.ReorderQuantity || 0)), 0
// //     );
// //     const materialTypes = [...new Set(materials.map(m => m.Material))];

// //     return (
// //       <Box>
// //         {/* Department KPIs */}
// //         <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
// //           Department KPIs
// //         </Typography>
        
// //         {/* Centered cards with reduced spacing */}
// //         <Grid container spacing={2} justifyContent="center">
// //           {departments.map((dept) => (
// //             <Grid item xs={12} sm={6} md={4} lg={3} key={dept.id}>
// //               <Card 
// //                 sx={{ 
// //                   height: '100%',
// //                   transition: 'all 0.3s ease',
// //                   border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
// //                   '&:hover': {
// //                     transform: 'translateY(-2px)',
// //                     boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
// //                   }
// //                 }}
// //               >
// //                 <CardContent sx={{ p: 2, textAlign: 'center' }}>
// //                   <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
// //                     <Box sx={{ color: 'primary.main', mr: 1.5, fontSize: '1.5rem' }}>
// //                       {departmentIcons[dept.name] || <BusinessIcon />}
// //                     </Box>
// //                     <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
// //                       {dept.name}
// //                     </Typography>
// //                   </Box>
                  
// //                   <Box sx={{ mb: 1.5 }}>
// //                     <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.8rem' }}>
// //                       Manager: {dept.manager}
// //                     </Typography>
// //                     <Chip 
// //                       label={`${dept.employees} Employees`} 
// //                       size="small" 
// //                       variant="outlined"
// //                       sx={{ fontSize: '0.7rem' }}
// //                     />
// //                   </Box>

// //                   <Divider sx={{ my: 1.5 }} />
                  
// //                   <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
// //                     {dept.kpis.slice(0, 2).map((kpi, index) => (
// //                       <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
// //                         <Typography variant="body2" sx={{ flex: 1, fontSize: '0.75rem' }}>
// //                           {kpi.name}
// //                         </Typography>
// //                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
// //                           <Typography variant="body2" fontWeight="bold" color={`${getStatusColor(kpi.status)}.main`} sx={{ fontSize: '0.75rem' }}>
// //                             {kpi.value}
// //                           </Typography>
// //                           {getStatusIcon(kpi.status)}
// //                         </Box>
// //                       </Box>
// //                     ))}
// //                   </Box>
// //                 </CardContent>
// //               </Card>
// //             </Grid>
// //           ))}
// //         </Grid>
// //       </Box>
// //     );
// //   };

// //   const renderDepartments = () => (
// //     <Box>
// //       <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
// //         Departments
// //       </Typography>
      
// //       <Grid container spacing={2} justifyContent="center">
// //         {departments.map((dept) => (
// //           <Grid item xs={12} sm={6} md={4} lg={3} key={dept.id}>
// //             <Card 
// //               sx={{ 
// //                 cursor: 'pointer',
// //                 transition: 'all 0.3s ease',
// //                 height: '100%',
// //                 minHeight: 100,
// //                 display: 'flex',
// //                 flexDirection: 'column',
// //                 justifyContent: 'center',
// //                 border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
// //                 textAlign: 'center',
// //                 '&:hover': {
// //                   transform: 'translateY(-2px)',
// //                   boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
// //                   border: `1px solid ${theme.palette.primary.main}`,
// //                 }
// //               }}
// //               onClick={() => handleDepartmentSelect(dept)}
// //             >
// //               <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
// //                 <Box
// //                   sx={{
// //                     color: 'primary.main',
// //                     mb: 1,
// //                     display: 'flex',
// //                     justifyContent: 'center',
// //                     '& .MuiSvgIcon-root': {
// //                       fontSize: 28,
// //                     }
// //                   }}
// //                 >
// //                   {departmentIcons[dept.name] || <BusinessIcon />}
// //                 </Box>
// //                 <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', fontSize: '0.9rem', mb: 0.5 }}>
// //                   {dept.name}
// //                 </Typography>
// //                 <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
// //                   {dept.manager}
// //                 </Typography>
// //                 <Chip 
// //                   label={`${dept.employees} Employees`} 
// //                   size="small" 
// //                   variant="outlined"
// //                   sx={{ fontSize: '0.65rem' }}
// //                 />
// //               </CardContent>
// //             </Card>
// //           </Grid>
// //         ))}
// //       </Grid>
// //     </Box>
// //   );

// //   const renderDepartmentPage = (department) => {
// //     const modules = departmentModules[department.name] || [];

// //     return (
// //       <Box>
// //         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
// //           <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
// //             {department.name} Department
// //           </Typography>
// //         </Box>

// //         {/* Department KPIs - Centered */}
// //         <Box sx={{ mb: 4 }}>
// //           <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
// //             Key Performance Indicators
// //           </Typography>
// //           <Grid container spacing={1.5} sx={{ mb: 2 }} justifyContent="center">
// //             {department.kpis.map((kpi, index) => (
// //               <Grid item xs={12} sm={6} md={3} lg={2.4} key={index}>
// //                 <Card 
// //                   sx={{ 
// //                     height: '100%',
// //                     transition: 'all 0.3s ease',
// //                     border: `2px solid ${alpha(theme.palette[getStatusColor(kpi.status)].main, 0.2)}`,
// //                     background: `linear-gradient(135deg, ${alpha(theme.palette[getStatusColor(kpi.status)].main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.1)} 100%)`,
// //                     textAlign: 'center'
// //                   }}
// //                 >
// //                   <CardContent sx={{ p: 1.5 }}>
// //                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
// //                       <Typography variant="body2" sx={{ fontWeight: 'bold', flex: 1, fontSize: '0.8rem' }}>
// //                         {kpi.name}
// //                       </Typography>
// //                       {getStatusIcon(kpi.status)}
// //                     </Box>
                    
// //                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
// //                       <Typography variant="h6" sx={{ fontWeight: 'bold', color: `${getStatusColor(kpi.status)}.main`, fontSize: '1rem' }}>
// //                         {kpi.value}
// //                       </Typography>
// //                       <Chip 
// //                         label={kpi.trend} 
// //                         size="small"
// //                         color={kpi.trend.startsWith('+') ? 'success' : 'error'}
// //                         sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}
// //                       />
// //                     </Box>
                    
// //                     <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
// //                       Target: {kpi.target}
// //                     </Typography>
// //                   </CardContent>
// //                 </Card>
// //               </Grid>
// //             ))}
// //           </Grid>
// //         </Box>

// //         {/* Department Modules - Centered */}
// //         <Box>
// //           <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
// //             Department Modules
// //           </Typography>
// //           <Grid container spacing={1.5} justifyContent="center">
// //             {modules.map((module, index) => (
// //               <Grid item xs={12} sm={6} md={4} key={index}>
// //                 <Card 
// //                   sx={{ 
// //                     height: '100%',
// //                     cursor: 'pointer',
// //                     transition: 'all 0.3s ease',
// //                     border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
// //                     textAlign: 'center',
// //                     '&:hover': {
// //                       transform: 'translateY(-2px)',
// //                       boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
// //                       border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
// //                     }
// //                   }}
// //                   onClick={() => handleModuleClick(module.id)}
// //                 >
// //                   <CardContent sx={{ textAlign: 'center', p: 1.5 }}>
// //                     <Box
// //                       sx={{
// //                         color: 'primary.main',
// //                         mb: 1,
// //                         display: 'flex',
// //                         justifyContent: 'center',
// //                         '& .MuiSvgIcon-root': {
// //                           fontSize: 28,
// //                         }
// //                       }}
// //                     >
// //                       {module.icon}
// //                     </Box>
// //                     <Typography 
// //                       variant="body1" 
// //                       gutterBottom
// //                       sx={{ 
// //                         fontWeight: 'bold',
// //                         fontSize: '0.85rem'
// //                       }}
// //                     >
// //                       {module.name}
// //                     </Typography>
// //                   </CardContent>
// //                 </Card>
// //               </Grid>
// //             ))}
// //           </Grid>
// //         </Box>
// //       </Box>
// //     );
// //   };

// //   const drawer = (
// //     <Box>
// //       <Toolbar>
// //         <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
// //           {getCompanyName()}
// //         </Typography>
// //       </Toolbar>
// //       <Divider />
// //       <List>
// //         {menuItems.map((item) => (
// //           <ListItem key={item.id} disablePadding>
// //             <ListItemButton
// //               selected={activeModule === item.id}
// //               onClick={() => handleModuleClick(item.id)}
// //               sx={{
// //                 '&.Mui-selected': {
// //                   backgroundColor: alpha(theme.palette.primary.main, 0.1),
// //                   borderRight: `3px solid ${theme.palette.primary.main}`,
// //                 },
// //               }}
// //             >
// //               <ListItemIcon sx={{ color: activeModule === item.id ? 'primary.main' : 'inherit' }}>
// //                 {item.icon}
// //               </ListItemIcon>
// //               <ListItemText 
// //                 primary={item.text} 
// //                 primaryTypographyProps={{
// //                   fontWeight: activeModule === item.id ? 'bold' : 'normal'
// //                 }}
// //               />
// //             </ListItemButton>
// //           </ListItem>
// //         ))}
// //       </List>
// //     </Box>
// //   );

// //   return (
// //     <Box sx={{ display: 'flex' }}>
// //       <AppBar
// //         position="fixed"
// //         sx={{
// //           width: { md: `calc(100% - ${drawerWidth}px)` },
// //           ml: { md: `${drawerWidth}px` },
// //           background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
// //         }}
// //       >
// //         <Toolbar>
// //           <IconButton
// //             color="inherit"
// //             aria-label="open drawer"
// //             edge="start"
// //             onClick={handleDrawerToggle}
// //             sx={{ mr: 2, display: { md: 'none' } }}
// //           >
// //             <MenuIcon />
// //           </IconButton>
          
// //           {/* Back Button and Title */}
// //           <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
// //             {/* Back Button - Show when not on dashboard */}
// //             {activeModule !== 'dashboard' && (
// //               <IconButton
// //                 color="inherit"
// //                 onClick={handleBackNavigation}
// //                 sx={{ mr: 2 }}
// //                 size="large"
// //               >
// //                 <ArrowBack />
// //               </IconButton>
// //             )}
            
// //             <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
// //               {activeModule === 'dashboard' && 'Operation Dashboard'}
// //               {activeModule === 'departments' && 'Department Management'}
// //               {activeModule === 'employee-management' && 'Employee Management'}
// //               {activeModule === 'hr-overtime-checking' && 'HR Overtime Checking'}
// //               {activeModule === 'production-department-overtime-recording' && 'Production Department Overtime Recording'}
// //               {activeModule === 'supplychain-department-overtime-recording' && 'Supply Chain Department Overtime Recording'}
// //               {activeModule === 'finance-department-overtime-recording' && 'Finance Department Overtime Recording'}
// //               {activeModule === 'hr-department-overtime-recording' && 'HR Department Overtime Recording'}
// //               {activeModule === 'finance-overtime-approval' && 'Finance Overtime Approval'}
// //               {activeModule === 'reports' && 'Production & Inventory Reports'}
// //               {activeModule === 'attendance-management' && 'Attendance Management'}
// //               {activeModule === 'material-management' && 'Material Management'}
// //               {activeModule === 'product-management' && 'Product Management'}
// //               {activeModule === 'production-management' && 'Production Management'}
// //               {activeModule === 'production-schedule' && 'Production Schedule'}
// //               {activeModule === 'production-plan' && 'Production Plan Management'}
// //               {activeModule === 'inventory-plan' && 'Inventory Plan Management'}
// //               {activeModule === 'materialRI' && 'Material Transaction'}
// //               {activeModule === 'productRI' && 'Product Transaction'}
// //               {activeModule === 'inventory-control' && 'Inventory Control'}
// //               {activeModule === 'pricing' && 'Product Pricing Management'}
// //               {activeModule === 'daily-sales' && 'Sales Management'}
// //               {activeModule === 'sales-plan' && 'Sales Plan Management'}
// //               {activeModule === 'expense-management' && 'Expense Management'}
// //               {activeModule === 'product-formulation' && 'Product Formulation'}
// //               {activeModule === 'petty-cash' && 'Petty Cash Management'}
// //               {activeModule === 'payroll-management' && 'Payroll Management'}
// //               {activeModule === 'line-management' && 'Line Management'}
// //               {activeModule === 'labor-cost' && 'Labor Cost Management'}
// //               {activeModule === 'activity-management' && 'Activity Management'}
// //               {activeModule.startsWith('department-') && `${selectedDepartment?.name} Department`}
// //             </Typography>
// //           </Box>
// //         </Toolbar>
// //       </AppBar>
      
// //       <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
// //         <Drawer
// //           variant="temporary"
// //           open={mobileOpen}
// //           onClose={handleDrawerToggle}
// //           ModalProps={{ keepMounted: true }}
// //           sx={{
// //             display: { xs: 'block', md: 'none' },
// //             '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
// //           }}
// //         >
// //           {drawer}
// //         </Drawer>
// //         <Drawer
// //           variant="permanent"
// //           sx={{
// //             display: { xs: 'none', md: 'block' },
// //             '& .MuiDrawer-paper': { 
// //               boxSizing: 'border-box', 
// //               width: drawerWidth,
// //             },
// //           }}
// //           open
// //         >
// //           {drawer}
// //         </Drawer>
// //       </Box>

// //       <Box
// //         component="main"
// //         sx={{ 
// //           flexGrow: 1, 
// //           p: 3, 
// //           width: { md: `calc(100% - ${drawerWidth}px)` },
// //           minHeight: '100vh'
// //         }}
// //       >
// //         <Toolbar />
// //         <Container maxWidth="xl" sx={{ mt: 2 }}>
// //           {activeModule === 'dashboard' && renderDashboard()}
// //           {activeModule === 'departments' && renderDepartments()}
// //           {activeModule === 'employee-management' && renderEmployeeManagement()}
// //           {activeModule === 'hr-overtime-checking' && renderHROvertimeChecking()}
// //           {activeModule === 'production-department-overtime-recording' && renderProductionDepartmentOvertimeRecording()}
// //           {activeModule === 'supplychain-department-overtime-recording' && renderSupplyChainDepartmentOvertimeRecording()}
// //           {activeModule === 'finance-department-overtime-recording' && renderFinanceDepartmentOvertimeRecording()}
// //           {activeModule === 'hr-department-overtime-recording' && renderHRDepartmentOvertimeRecording()}
// //           {activeModule === 'finance-overtime-approval' && renderFinanceOvertimeApproval()}
// //           {activeModule === 'reports' && renderReports()}
// //           {activeModule === 'attendance-management' && renderAttendanceManagement()}
// //           {activeModule === 'material-management' && renderMaterialManagement()}
// //           {activeModule === 'product-management' && renderProductManagement()}
// //           {activeModule === 'production-management' && renderProductionManagement()}
// //           {activeModule === 'production-schedule' && renderProductionSchedule()}
// //           {activeModule === 'production-plan' && renderProductionPlan()}
// //           {activeModule === 'inventory-plan' && renderInventoryPlan()}
// //           {activeModule === 'materialRI' && renderMaterialRI()}
// //           {activeModule === 'productRI' && renderProductRI()}
// //           {activeModule === 'inventory-control' && renderInventoryControl()}
// //           {activeModule === 'pricing' && renderPricing()}
// //           {activeModule === 'daily-sales' && renderSales()}
// //           {activeModule === 'sales-plan' && renderSalesPlan()}
// //           {activeModule === 'expense-management' && renderExpenseManagement()}
// //           {activeModule === 'product-formulation' && renderProductFormulation()}
// //           {activeModule === 'petty-cash' && renderPettyCashManagement()}
// //           {activeModule === 'payroll-management' && renderPayrollManagement()}
// //           {activeModule === 'line-management' && renderLineManagement()}
// //           {activeModule === 'labor-cost' && renderLaborCost()}
// //           {activeModule === 'activity-management' && renderActivityManagement()}
// //           {activeModule.startsWith('department-') && selectedDepartment && renderDepartmentPage(selectedDepartment)}
// //         </Container>
// //       </Box>

// //       <Snackbar
// //         open={snackbar.open}
// //         autoHideDuration={6000}
// //         onClose={handleCloseSnackbar}
// //       >
// //         <Alert 
// //           onClose={handleCloseSnackbar} 
// //           severity={snackbar.severity}
// //           sx={{ width: '100%' }}
// //         >
// //           {snackbar.message}
// //         </Alert>
// //       </Snackbar>
// //     </Box>
// //   );
// // };

// // export default Dashboard;