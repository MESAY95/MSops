import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

// Pages
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import DepartmentManagement from './pages/DepartmentManagement';
import CompanyManagement from './pages/CompanyManagement';
import Reports from './pages/Reports/Reports';
import Layout from './components/Layout';

import EmployeeManagement from './pages/HR/EmployeeManagement';
import AttendanceManagement from './pages/HR/AttendanceManagement';
import LeaveManagement from './pages/HR/LeaveManagement';

import MaterialManagement from './pages/SupplyChain/MaterialManagement';
import ProductManagement from './pages/SupplyChain/ProductManagement';
import MaterialRI from './pages/SupplyChain/MaterialRI';
import ProductRI from './pages/SupplyChain/ProductRI';
import InventoryPlan from './pages/SupplyChain/InventoryPlan';
// import Inventory from './pages/SupplyChain/Inventory';

import ProductionManagement from './pages/Production/ProductionManagement';
import ProductionSchedule from './pages/Production/ProductionSchedule';
import ProductFormulation from './pages/Production/ProductFormulation';
import LineManagement from './pages/Production/LineManagement';
import ProductionPlan from './pages/Production/ProductionPlan';
import LaborCost from './pages/Production/LaborCost';
import ActivityManagement from './pages/Production/ActivityManagement';

import Pricing from './pages/Finance/Pricing';
import MaterialCostManagement from './pages/Finance/MaterialCostManagement';
import PettyCashManagement from './pages/Finance/PettyCashManagement';
import InfoPricingForm from '../src/components/InfoPricingForm';
import ExpenseManagement from './pages/Finance/ExpenseManagement';
import PayrollManagement from './pages/Finance/PayrollManagement'; // ✅ 修正
import DailySalesForm from './pages/Sales/DailySalesForm';
import SalesPlan from './pages/Sales/SalesPlan';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    secondary: {
      main: '#FF6F00',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Box component="main" sx={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/departmentmanagement" element={<DepartmentManagement />} />
            <Route path="/companyManagements" element={<CompanyManagement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/layout" element={<Layout />} />

            <Route path="/hr/employeemanagements" element={<EmployeeManagement />} />
            <Route path="/hr/attendances" element={<AttendanceManagement />} />
            <Route path="/hr/leaves" element={<LeaveManagement />} />

            <Route path="/supplychain/materials" element={<MaterialManagement />} />
            <Route path="/supplychain/products" element={<ProductManagement />} />
            <Route path="/supplychain/material-ri" element={<MaterialRI />} />
            <Route path="/supplychain/product-ri" element={<ProductRI />} />
            <Route path="/supplychain/inventoryplans" element={<InventoryPlan />} />
            {/* <Route path="/supplychain/inventorys" element={<Inventory />} /> */}

            <Route path="/production/production-managements" element={<ProductionManagement />} />
            <Route path="/production/productionSchedules" element={<ProductionSchedule />} />
            <Route path="/production/productformulation" element={<ProductFormulation />} />
            <Route path="/production/lineManagements" element={<LineManagement />} />
            <Route path="/productionplan" element={<ProductionPlan />} />
            <Route path="/production/labor-cost" element={<LaborCost />} />
            <Route path="/production/activityManagements" element={<ActivityManagement />} />

            <Route path="/finance/pricings" element={<Pricing />} />
            <Route path="/finance/materialcosts" element={<MaterialCostManagement />} />
            <Route path="/finance/pettycashmanagement" element={<PettyCashManagement />} />
            <Route path="/finance/payrollmanagement" element={<PayrollManagement />} />
            <Route path="/components/info-pricings" element={<InfoPricingForm />} />
            <Route path="/finance/expense-management" element={<ExpenseManagement />} />
            <Route path="/Sales/daily-sales" element={<DailySalesForm />} />
            <Route path="/Sales/sales-plans" element={<SalesPlan />} />
            {/* Add other routes */}
          </Routes>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;