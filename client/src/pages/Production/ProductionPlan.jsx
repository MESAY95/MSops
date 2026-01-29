// ProductionPlan.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  InputAdornment
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  ListAlt as ListAltIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  Print as PrintIcon,
  ImportExport as ImportExportIcon,
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon,
  Percent as PercentIcon,
  ContentCopy as CopyIcon,
  Science as ScienceIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Constants
const API_ENDPOINTS = {
  PRODUCTS: '/api/products?status=Active',
  MATERIALS: '/api/materials?status=Active', // UPDATED: Only fetch active materials
  SALES_PLANS: '/api/salesplans',
  PRODUCT_FORMULATIONS: '/api/productformulations',
  INVENTORY_PLANS: '/api/inventoryplans'
};

// Updated months: July to June (fiscal year order)
const MONTHS = [
  'July', 'August', 'September', 'October', 'November', 'December',
  'January', 'February', 'March', 'April', 'May', 'June'
];

// Fixed fiscal year list as requested
const FISCAL_YEARS = [
  '2023-2024',
  '2024-2025', 
  '2025-2026',
  '2026-2027',
  '2027-2028',
  '2028-2029',
  '2029-2030'
];

// Utility functions
const safeArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.salesPlans && Array.isArray(data.salesPlans)) return data.salesPlans;
  if (data.salesplans && Array.isArray(data.salesplans)) return data.salesplans;
  return [];
};

const getCurrentFiscalYear = () => {
  const currentYear = dayjs().year();
  const currentMonth = dayjs().month() + 1;
  
  if (currentMonth >= 7) {
    return `${currentYear}-${currentYear + 1}`;
  } else {
    return `${currentYear - 1}-${currentYear}`;
  }
};

// UPDATED: Get year for specific month in fiscal year
const getYearForMonth = (month, fiscalYear) => {
  if (!fiscalYear || typeof fiscalYear !== 'string') return dayjs().year();
  
  const years = fiscalYear.split('-');
  if (years.length !== 2) return dayjs().year();
  
  const startYear = parseInt(years[0], 10);
  const endYear = parseInt(years[1], 10);
  
  if (isNaN(startYear) || isNaN(endYear)) return dayjs().year();
  
  // July to December use start year (first year of fiscal year)
  if (['July', 'August', 'September', 'October', 'November', 'December'].includes(month)) {
    return startYear;
  }
  // January to June use end year (second year of fiscal year)
  else {
    return endYear;
  }
};

// NEW: Convert string fiscal year to numeric for InventoryPlan schema
const getNumericFiscalYear = (fiscalYearString) => {
  if (!fiscalYearString || typeof fiscalYearString !== 'string') return dayjs().year();
  
  const years = fiscalYearString.split('-');
  if (years.length !== 2) return dayjs().year();
  
  return parseInt(years[0], 10); // Return the starting year as number
};

// NEW: Calculate effective quantity including loss factor
const calculateEffectiveQuantity = (quantity, lossFactor) => {
  const qty = parseFloat(quantity) || 0;
  const loss = parseFloat(lossFactor) || 0;
  const lossMultiplier = 1 + (loss / 100);
  return qty * lossMultiplier;
};

// NEW: Format currency as Ethiopian Birr
const formatCurrency = (amount) => {
  return `ETB ${parseFloat(amount || 0).toLocaleString('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const ProductionPlan = ({ onBack }) => {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [salesPlans, setSalesPlans] = useState([]);
  const [productFormulations, setProductFormulations] = useState([]);
  const [inventoryPlans, setInventoryPlans] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Selections
  const [selectedFiscalYear, setSelectedFiscalYear] = useState(getCurrentFiscalYear());
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  
  // Factors
  const [productFactor, setProductFactor] = useState(0.1);
  const [materialFactor, setMaterialFactor] = useState(0.1);

  // Factor input states
  const [productFactorInput, setProductFactorInput] = useState('10');
  const [materialFactorInput, setMaterialFactorInput] = useState('10');
  
  // Plan Data
  const [productPlanData, setProductPlanData] = useState([]);
  const [annualProductionPlan, setAnnualProductionPlan] = useState([]);
  const [materialPlanData, setMaterialPlanData] = useState([]);
  const [annualMaterialRequirement, setAnnualMaterialRequirement] = useState([]);

  // Import/Export states
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');

  // Copy functionality states
  const [copySuccessProduct, setCopySuccessProduct] = useState(null);
  const [copySuccessMaterial, setCopySuccessMaterial] = useState(null);

  // Refs for printing
  const printRef = useRef();
  const tab0Ref = useRef();
  const tab1Ref = useRef();
  const tab2Ref = useRef();
  const tab3Ref = useRef();
  const tab4Ref = useRef();
  const tab5Ref = useRef();
  const productPlanTableRef = useRef();
  const materialPlanTableRef = useRef();
  const productSummaryRef = useRef();
  const materialSummaryRef = useRef();

  // Derived data calculations
  const selectedProductData = products.find(p => p._id === selectedProduct);
  const selectedProductName = selectedProductData?.Product || selectedProductData?.name || '';
  const selectedProductUnit = selectedProductData?.Unit || selectedProductData?.unit || '';
  
  const selectedMaterialData = materials.find(m => m._id === selectedMaterial);
  const selectedMaterialName = selectedMaterialData?.Material || selectedMaterialData?.name || '';
  const selectedMaterialUnit = selectedMaterialData?.Unit || selectedMaterialData?.unit || '';

  // NEW: Calculate Product Plan Summary
  const productPlanSummary = useMemo(() => {
    if (!productPlanData.length) return [];
    
    const summary = products.map(product => {
      const productName = product.Product || product.name;
      const productUnit = product.Unit || product.unit || 'pcs';
      
      const totalProduction = productPlanData.reduce((sum, row) => {
        // Only include if this is the selected product
        if (selectedProductName === productName) {
          return sum + row.productionPlan;
        }
        return sum;
      }, 0);

      return {
        product: productName,
        unit: productUnit,
        totalQuantity: totalProduction
      };
    });

    return summary.filter(item => item.totalQuantity > 0);
  }, [productPlanData, products, selectedProductName]);

  // UPDATED: Material Plan Summary calculation - now properly aggregates all materials
  const materialPlanSummary = useMemo(() => {
    if (!materialPlanData.length && !annualMaterialRequirement.length) return [];
    
    const summary = [];
    
    // Method 1: Use annualMaterialRequirement for comprehensive summary
    if (annualMaterialRequirement.length > 0) {
      const materialMap = new Map();
      
      annualMaterialRequirement.forEach(item => {
        const materialId = item.materialId;
        if (!materialMap.has(materialId)) {
          materialMap.set(materialId, {
            material: item.material,
            unit: item.materialUnit,
            totalQuantity: 0
          });
        }
        materialMap.get(materialId).totalQuantity += item.materialRequirement;
      });
      
      summary.push(...Array.from(materialMap.values()));
    } 
    // Method 2: Fallback to materialPlanData (for single product-material combination)
    else if (materialPlanData.length > 0) {
      materials.forEach(material => {
        const materialName = material.Material || material.name;
        const materialUnit = material.Unit || material.unit || 'unit';
        
        const totalMaterial = materialPlanData.reduce((sum, row) => {
          return sum + row.materialPlan;
        }, 0);

        if (totalMaterial > 0) {
          summary.push({
            material: materialName,
            unit: materialUnit,
            totalQuantity: totalMaterial
          });
        }
      });
    }
    
    console.log('📊 Material Plan Summary:', summary);
    return summary;
  }, [materialPlanData, annualMaterialRequirement, materials]);

  // UPDATED: Enhanced print function that prints the whole table container
  const handlePrintTableAsPDF = useCallback(async (tableRef, fileName, title) => {
    if (!tableRef.current) {
      setError('No table data available for printing');
      return;
    }

    try {
      setLoading(true);
      
      // Capture the entire table container as image
      const canvas = await html2canvas(tableRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: tableRef.current.scrollWidth,
        height: tableRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: tableRef.current.scrollWidth,
        windowHeight: tableRef.current.scrollHeight
      });

      // Convert to PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape'); // Use landscape for better table fit
      
      // Add title
      pdf.setFontSize(16);
      pdf.text(title, 15, 15);
      pdf.setFontSize(10);
      pdf.text(`Fiscal Year: ${selectedFiscalYear} | Generated on: ${new Date().toLocaleDateString()}`, 15, 22);

      // Calculate image dimensions to fit PDF
      const imgWidth = pdf.internal.pageSize.getWidth() - 30;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 15, 30, imgWidth, imgHeight);
      
      // Save PDF
      pdf.save(`${fileName}_${selectedFiscalYear}.pdf`);
      
      setSuccess(`PDF generated successfully: ${fileName}_${selectedFiscalYear}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedFiscalYear]);

  // Print functions for all tables
  const handlePrintProductPlan = useCallback(() => {
    handlePrintTableAsPDF(
      productPlanTableRef, 
      `Product_Plan_${selectedProductName}`,
      `Product Plan - ${selectedProductName} (${selectedFiscalYear})`
    );
  }, [handlePrintTableAsPDF, selectedProductName, selectedFiscalYear]);

  const handlePrintMaterialPlan = useCallback(() => {
    handlePrintTableAsPDF(
      materialPlanTableRef,
      `Material_Plan_${selectedProductName}_${selectedMaterialName}`,
      `Material Plan - ${selectedProductName} - ${selectedMaterialName} (${selectedFiscalYear})`
    );
  }, [handlePrintTableAsPDF, selectedProductName, selectedMaterialName, selectedFiscalYear]);

  const handlePrintAnnualProductionPlan = useCallback(() => {
    handlePrintTableAsPDF(
      tab1Ref,
      `Annual_Production_Plan`,
      `Annual Production Plan Summary (${selectedFiscalYear})`
    );
  }, [handlePrintTableAsPDF, selectedFiscalYear]);

  const handlePrintAnnualMaterialRequirement = useCallback(() => {
    handlePrintTableAsPDF(
      tab3Ref,
      `Annual_Material_Requirement`,
      `Annual Material Requirement Summary (${selectedFiscalYear})`
    );
  }, [handlePrintTableAsPDF, selectedFiscalYear]);

  const handlePrintProductSummary = useCallback(() => {
    handlePrintTableAsPDF(
      productSummaryRef,
      `Product_Plan_Summary`,
      `Product Plan Summary (${selectedFiscalYear})`
    );
  }, [handlePrintTableAsPDF, selectedFiscalYear]);

  const handlePrintMaterialSummary = useCallback(() => {
    handlePrintTableAsPDF(
      materialSummaryRef,
      `Material_Plan_Summary`,
      `Material Plan Summary (${selectedFiscalYear})`
    );
  }, [handlePrintTableAsPDF, selectedFiscalYear]);

  // Copy functionality for Product Plan Table
  const handleCopyProductPlan = useCallback(() => {
    if (!productPlanData.length) {
      setCopySuccessProduct('No data to copy');
      return;
    }

    const headers = ['Month', 'Year', 'Sales Plan', 'Opening Balance', 'Total Requirement', 'Closing Balance', 'Production Plan'];
    const csvData = productPlanData.map(row => [
      row.month,
      row.year,
      row.salesPlan,
      row.openingBalance,
      row.totalRequirement,
      row.closingBalance,
      row.productionPlan
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    navigator.clipboard.writeText(csvContent).then(() => {
      setCopySuccessProduct('Product plan data copied to clipboard!');
      setTimeout(() => setCopySuccessProduct(null), 3000);
    }).catch(() => {
      setCopySuccessProduct('Failed to copy data');
      setTimeout(() => setCopySuccessProduct(null), 3000);
    });
  }, [productPlanData]);

  // NEW: Copy functionality for Material Plan Table
  const handleCopyMaterialPlan = useCallback(() => {
    if (!materialPlanData.length) {
      setCopySuccessMaterial('No data to copy');
      return;
    }

    const headers = ['Month', 'Year', 'Material Requirement', 'Opening Balance', 'Total Requirement', 'Closing Balance', 'Material Plan'];
    const csvData = materialPlanData.map(row => [
      row.month,
      row.year,
      row.materialRequirement,
      row.openingBalance,
      row.totalRequirement,
      row.closingBalance,
      row.materialPlan
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    navigator.clipboard.writeText(csvContent).then(() => {
      setCopySuccessMaterial('Material plan data copied to clipboard!');
      setTimeout(() => setCopySuccessMaterial(null), 3000);
    }).catch(() => {
      setCopySuccessMaterial('Failed to copy data');
      setTimeout(() => setCopySuccessMaterial(null), 3000);
    });
  }, [materialPlanData]);

  // Factor handlers
  const handleProductFactorChange = (event) => {
    const value = event.target.value;
    setProductFactorInput(value);
    
    // Convert percentage to decimal
    const decimalValue = parseFloat(value) / 100;
    if (!isNaN(decimalValue) && decimalValue >= 0 && decimalValue <= 1) {
      setProductFactor(decimalValue);
    }
  };

  const handleProductFactorSliderChange = (event, newValue) => {
    setProductFactorInput(newValue.toString());
    setProductFactor(newValue / 100);
  };

  // NEW: Material factor handlers
  const handleMaterialFactorChange = (event) => {
    const value = event.target.value;
    setMaterialFactorInput(value);
    
    // Convert percentage to decimal
    const decimalValue = parseFloat(value) / 100;
    if (!isNaN(decimalValue) && decimalValue >= 0 && decimalValue <= 1) {
      setMaterialFactor(decimalValue);
    }
  };

  const handleMaterialFactorSliderChange = (event, newValue) => {
    setMaterialFactorInput(newValue.toString());
    setMaterialFactor(newValue / 100);
  };

  // UPDATED: Data fetching functions - only fetch active products and materials
  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.PRODUCTS);
      const productsData = safeArray(response.data);
      
      // ADDED: Additional filtering to ensure only active products
      const activeProducts = productsData.filter(product => 
        product.status === 'Active' || product.status === 'active' || !product.status
      );
      
      setProducts(activeProducts);
      if (activeProducts.length > 0 && !selectedProduct) {
        setSelectedProduct(activeProducts[0]._id);
      }
      
      console.log(`✅ Loaded ${activeProducts.length} active products`);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    }
  }, [selectedProduct]);

  // UPDATED: Fetch only active materials
  const fetchMaterials = useCallback(async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.MATERIALS);
      const materialsData = safeArray(response.data);
      
      // ADDED: Additional filtering to ensure only active materials
      const activeMaterials = materialsData.filter(material => 
        material.status === 'Active' || material.status === 'active' || !material.status
      );
      
      setMaterials(activeMaterials);
      if (activeMaterials.length > 0 && !selectedMaterial) {
        setSelectedMaterial(activeMaterials[0]._id);
      }
      
      console.log(`✅ Loaded ${activeMaterials.length} active materials`);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setError('Failed to load materials');
    }
  }, [selectedMaterial]);

  // UPDATED: Fetch sales plans with correct fiscal year parameter
  const fetchSalesPlans = useCallback(async () => {
    try {
      console.log('📋 Fetching sales plans for fiscal year:', selectedFiscalYear);
      
      const response = await axios.get(API_ENDPOINTS.SALES_PLANS, {
        params: { 
          fiscalYear: selectedFiscalYear
        }
      });
      
      const salesPlansData = safeArray(response.data);
      console.log('📦 Raw sales plans data received:', salesPlansData);
      
      setSalesPlans(salesPlansData);
      
      if (salesPlansData.length === 0) {
        console.warn('⚠️ No sales plans found for fiscal year:', selectedFiscalYear);
      } else {
        console.log(`✅ Found ${salesPlansData.length} sales plans`);
      }
    } catch (error) {
      console.error('❌ Error fetching sales plans:', error);
      console.error('Error details:', error.response?.data);
      setError(`Failed to load sales plans: ${error.message}`);
    }
  }, [selectedFiscalYear]);

  // UPDATED: Enhanced fetchProductFormulations with better logging and error handling
  const fetchProductFormulations = useCallback(async () => {
    try {
      console.log('📋 Fetching product formulations...');
      const response = await axios.get(API_ENDPOINTS.PRODUCT_FORMULATIONS);
      const formulations = safeArray(response.data);
      console.log('📦 Product formulations received:', formulations.length);
      
      // Log all available formulations for debugging
      if (formulations.length > 0) {
        console.log('📊 All available formulations:');
        formulations.forEach((f, index) => {
          console.log(`  ${index + 1}. Product: "${f.productName}" - Material: "${f.materialName}": ${f.quantity} ${f.materialUnit} (Loss: ${f.lossFactor}%, ${f.status})`);
        });
      } else {
        console.warn('⚠️ No product formulations found in database');
      }
      
      setProductFormulations(formulations);
    } catch (error) {
      console.error('❌ Error fetching formulations:', error);
      setError('Failed to load product formulations');
    }
  }, []);

  // UPDATED: Fetch inventory plans with numeric fiscal year parameter
  const fetchInventoryPlans = useCallback(async () => {
    try {
      const numericFiscalYear = getNumericFiscalYear(selectedFiscalYear);
      console.log('📋 Fetching inventory plans for numeric fiscal year:', numericFiscalYear);
      
      const response = await axios.get(API_ENDPOINTS.INVENTORY_PLANS, {
        params: { 
          fiscalYear: numericFiscalYear // ✅ Use numeric format for schema
        }
      });
      
      const inventoryData = safeArray(response.data);
      console.log('📦 Inventory plans received:', inventoryData.length);
      
      if (inventoryData.length > 0) {
        console.log('📊 Sample inventory plan:', {
          category: inventoryData[0].category,
          item: inventoryData[0].item,
          month: inventoryData[0].month,
          fiscalYear: inventoryData[0].fiscalYear,
          balanceType: inventoryData[0].balanceType,
          quantity: inventoryData[0].quantity
        });
      }
      
      setInventoryPlans(inventoryData);
    } catch (error) {
      console.error('Error fetching inventory plans:', error);
      setError('Failed to load inventory plans');
    }
  }, [selectedFiscalYear]);

  // UPDATED: Enhanced fetchAllData with better error handling
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log('🔄 Starting data fetch...');
    try {
      await Promise.all([
        fetchProducts(),
        fetchMaterials(),
        fetchSalesPlans(),
        fetchProductFormulations(),
        fetchInventoryPlans()
      ]);
      console.log('✅ All data loaded successfully');
      setSuccess('Production planning data loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setError('Failed to load production planning data');
    } finally {
      setLoading(false);
    }
  }, [fetchProducts, fetchMaterials, fetchSalesPlans, fetchProductFormulations, fetchInventoryPlans]);

  // UPDATED: Enhanced sales plan retrieval - correctly matches by product name with string comparison
  const getSalesPlanQuantity = useCallback((productId, month) => {
    if (!productId || !salesPlans.length) {
      console.log(`❌ No sales plans available for product: ${productId}, month: ${month}`);
      return 0;
    }

    // Get the product name from the selected product ID
    const selectedProductData = products.find(p => p._id === productId);
    if (!selectedProductData) {
      console.log(`❌ Product not found for ID: ${productId}`);
      return 0;
    }

    const productName = selectedProductData.Product || selectedProductData.name;
    
    console.log(`🔍 Searching sales plans for:`, {
      productName,
      month,
      fiscalYear: selectedFiscalYear,
      availableSalesPlans: salesPlans.length
    });

    // Find sales plan by product name (as stored in SalesPlan schema)
    const salesPlan = salesPlans.find(sp => {
      // Match by product name (string comparison)
      const productMatch = 
        sp.productName === productName ||
        sp.productName?.toLowerCase() === productName?.toLowerCase();
      
      // Month matching
      const monthMatch = 
        sp.month === month ||
        sp.month?.toLowerCase() === month?.toLowerCase();
      
      // Fiscal year matching with STRING comparison
      const yearMatch = 
        sp.fiscalYear === selectedFiscalYear;

      const isMatch = productMatch && monthMatch && yearMatch;
      
      if (isMatch) {
        console.log(`✅ EXACT MATCH FOUND:`, {
          storedProduct: sp.productName,
          searchedProduct: productName,
          storedMonth: sp.month,
          searchedMonth: month,
          storedFiscalYear: sp.fiscalYear,
          searchedFiscalYear: selectedFiscalYear,
          targetQuantity: sp.targetQuantity
        });
      }

      return isMatch;
    });

    const quantity = salesPlan ? (salesPlan.targetQuantity || 0) : 0;
    
    if (quantity > 0) {
      console.log(`🎯 Sales plan quantity for ${productName} - ${month}: ${quantity}`);
    } else {
      console.log(`⚠️ No sales plan found for ${productName} - ${month} in ${selectedFiscalYear}`);
    }
    
    return quantity;
  }, [salesPlans, selectedFiscalYear, products]);

  // UPDATED: Enhanced inventory balance with proper numeric fiscal year matching and InventoryPlan schema structure
  const getInventoryBalance = useCallback((itemId, itemType, month, balanceType) => {
    const selectedProductData = products.find(p => p._id === itemId);
    const selectedMaterialData = materials.find(m => m._id === itemId);
    
    let itemName = '';
    if (itemType === 'product' && selectedProductData) {
      itemName = selectedProductData.Product || selectedProductData.name;
    } else if (itemType === 'material' && selectedMaterialData) {
      itemName = selectedMaterialData.Material || selectedMaterialData.name;
    }
    
    if (!itemName) {
      console.log(`❌ Item name not found for ${itemType} with ID: ${itemId}`);
      return null;
    }

    const numericFiscalYear = getNumericFiscalYear(selectedFiscalYear);
    const category = itemType === 'product' ? 'Product' : 'Material';
    const balanceTypeText = balanceType === 'opening' ? 'Opening Balance' : 'Closing Balance';

    console.log(`🔍 Searching ${category} inventory plans for:`, {
      category,
      itemName,
      month,
      numericFiscalYear,
      balanceType: balanceTypeText,
      availableInventoryPlans: inventoryPlans.length
    });

    const inventoryPlan = inventoryPlans.find(ip => {
      const categoryMatch = ip.category === category;
      const itemMatch = ip.item === itemName;
      const monthMatch = ip.month === month;
      const yearMatch = ip.fiscalYear === numericFiscalYear;
      const balanceMatch = ip.balanceType === balanceTypeText;

      const isMatch = categoryMatch && itemMatch && monthMatch && yearMatch && balanceMatch;
      
      if (isMatch && itemType === 'material') {
        console.log(`✅ MATERIAL INVENTORY MATCH FOUND:`, {
          category: ip.category,
          item: ip.item,
          month: ip.month,
          fiscalYear: ip.fiscalYear,
          balanceType: ip.balanceType,
          quantity: ip.quantity
        });
      }

      return isMatch;
    });

    if (!inventoryPlan) {
      if (itemType === 'material') {
        console.log(`📦 No ${category} inventory plan found for:`, {
          category,
          itemName,
          month,
          numericFiscalYear,
          balanceType: balanceTypeText
        });
      }
      return null;
    }

    if (itemType === 'material') {
      console.log(`🎯 ${category} ${balanceType} for ${itemName} - ${month}: ${inventoryPlan.quantity}`);
    }
    
    return inventoryPlan.quantity || 0;
  }, [inventoryPlans, selectedFiscalYear, products, materials]);

  // NEW: Special function to get July opening balance directly from database
  const getJulyOpeningBalance = useCallback((productId) => {
    const julyOpening = getInventoryBalance(productId, 'product', 'July', 'opening');
    console.log(`📊 July Opening Balance for ${productId}:`, julyOpening);
    return julyOpening !== null ? julyOpening : 0;
  }, [getInventoryBalance]);

  // NEW: Special function to get June closing balance directly from database
  const getJuneClosingBalance = useCallback((productId) => {
    const juneClosing = getInventoryBalance(productId, 'product', 'June', 'closing');
    console.log(`📊 June Closing Balance for ${productId}:`, juneClosing);
    return juneClosing !== null ? juneClosing : 0;
  }, [getInventoryBalance]);

  // NEW: Special function to get July material opening balance directly from database
  const getJulyMaterialOpeningBalance = useCallback((materialId) => {
    const julyOpening = getInventoryBalance(materialId, 'material', 'July', 'opening');
    console.log(`📊 July Material Opening Balance for ${materialId}:`, julyOpening);
    return julyOpening !== null ? julyOpening : 0;
  }, [getInventoryBalance]);

  // NEW: Special function to get June material closing balance directly from database
  const getJuneMaterialClosingBalance = useCallback((materialId) => {
    const juneClosing = getInventoryBalance(materialId, 'material', 'June', 'closing');
    console.log(`📊 June Material Closing Balance for ${materialId}:`, juneClosing);
    return juneClosing !== null ? juneClosing : 0;
  }, [getInventoryBalance]);

  // UPDATED: Enhanced getFormulationQuantity function with loss factor support
  const getFormulationData = useCallback(() => {
    if (!selectedProduct || !selectedMaterial || !productFormulations.length) {
      return { baseQuantity: 0, lossFactor: 0, effectiveQuantity: 0 };
    }

    const productName = selectedProductData?.Product || selectedProductData?.name;
    const materialName = selectedMaterialData?.Material || selectedMaterialData?.name;

    if (!productName || !materialName) return { baseQuantity: 0, lossFactor: 0, effectiveQuantity: 0 };

    console.log('🔍 Searching formulation for:', {
      productName,
      materialName,
      totalFormulations: productFormulations.length
    });

    // Try exact match first
    let formulation = productFormulations.find(pf => 
      pf.productName === productName && 
      pf.materialName === materialName &&
      pf.status === 'Active'
    );

    // If exact match not found, try case-insensitive match
    if (!formulation) {
      formulation = productFormulations.find(pf => 
        pf.productName?.toLowerCase() === productName?.toLowerCase() && 
        pf.materialName?.toLowerCase() === materialName?.toLowerCase() &&
        pf.status === 'Active'
      );
    }

    // If still not found, try partial match
    if (!formulation) {
      formulation = productFormulations.find(pf => 
        pf.productName?.includes(productName) && 
        pf.materialName?.includes(materialName) &&
        pf.status === 'Active'
      );
    }

    if (formulation) {
      const effectiveQuantity = calculateEffectiveQuantity(formulation.quantity, formulation.lossFactor);
      console.log('✅ Formulation found:', {
        productName: formulation.productName,
        materialName: formulation.materialName,
        baseQuantity: formulation.quantity,
        lossFactor: formulation.lossFactor,
        effectiveQuantity: effectiveQuantity,
        unit: formulation.materialUnit
      });
      
      return {
        baseQuantity: formulation.quantity,
        lossFactor: formulation.lossFactor,
        effectiveQuantity: effectiveQuantity,
        materialUnit: formulation.materialUnit
      };
    } else {
      console.log('❌ No formulation found for:', {
        productName,
        materialName,
        availableFormulations: productFormulations.map(f => ({
          product: f.productName,
          material: f.materialName,
          status: f.status
        }))
      });
      
      return { baseQuantity: 0, lossFactor: 0, effectiveQuantity: 0 };
    }
  }, [selectedProduct, selectedMaterial, productFormulations, selectedProductData, selectedMaterialData]);

  // NEW: Debug function to check formulation matching
  const debugFormulationMatching = useCallback(() => {
    if (!selectedProduct || !selectedMaterial || !productFormulations.length) return;
    
    const productName = selectedProductData?.Product || selectedProductData?.name;
    const materialName = selectedMaterialData?.Material || selectedMaterialData?.name;
    
    console.log('🐛 DEBUG Formulation Matching:', {
      selectedProduct: productName,
      selectedMaterial: materialName,
      formulationsCount: productFormulations.length
    });
    
    productFormulations.forEach((pf, index) => {
      const productMatch = pf.productName === productName;
      const materialMatch = pf.materialName === materialName;
      const statusMatch = pf.status === 'Active';
      const caseInsensitiveProductMatch = pf.productName?.toLowerCase() === productName?.toLowerCase();
      const caseInsensitiveMaterialMatch = pf.materialName?.toLowerCase() === materialName?.toLowerCase();
      const effectiveQuantity = calculateEffectiveQuantity(pf.quantity, pf.lossFactor);
      
      console.log(`  Formulation ${index + 1}:`, {
        product: `"${pf.productName}"`,
        material: `"${pf.materialName}"`,
        baseQuantity: pf.quantity,
        lossFactor: pf.lossFactor,
        effectiveQuantity: effectiveQuantity,
        status: pf.status,
        exactMatch: productMatch && materialMatch && statusMatch,
        caseInsensitiveMatch: caseInsensitiveProductMatch && caseInsensitiveMaterialMatch && statusMatch,
        productExact: productMatch,
        materialExact: materialMatch,
        productCaseInsensitive: caseInsensitiveProductMatch,
        materialCaseInsensitive: caseInsensitiveMaterialMatch,
        status: statusMatch
      });
    });
  }, [selectedProduct, selectedMaterial, productFormulations, selectedProductData, selectedMaterialData]);

  // UPDATED: Enhanced product plan calculation with special handling for July opening and June closing
  const calculateProductPlan = useCallback(() => {
    if (!selectedProduct || !selectedFiscalYear) {
      console.log('Missing required data for product plan calculation');
      setProductPlanData([]);
      return;
    }

    const monthlyData = [];
    let previousClosingBalance = 0;

    MONTHS.forEach((month, index) => {
      // Get sales plan from database
      const salesPlan = getSalesPlanQuantity(selectedProduct, month);
      
      // Calculate next month for closing balance estimation
      const nextMonthIndex = (index + 1) % 12;
      const nextMonth = MONTHS[nextMonthIndex];
      const nextMonthSales = getSalesPlanQuantity(selectedProduct, nextMonth);
      
      // SPECIAL HANDLING: July opening balance from database
      let openingBalance;
      if (month === 'July') {
        openingBalance = getJulyOpeningBalance(selectedProduct);
        console.log(`🎯 Using database July opening balance: ${openingBalance}`);
      } else {
        const dbOpeningBalance = getInventoryBalance(selectedProduct, 'product', month, 'opening');
        openingBalance = dbOpeningBalance !== null ? dbOpeningBalance : previousClosingBalance;
      }
      
      // SPECIAL HANDLING: June closing balance from database
      let closingBalance;
      if (month === 'June') {
        closingBalance = getJuneClosingBalance(selectedProduct);
        console.log(`🎯 Using database June closing balance: ${closingBalance}`);
      } else {
        const dbClosingBalance = getInventoryBalance(selectedProduct, 'product', month, 'closing');
        closingBalance = dbClosingBalance !== null ? dbClosingBalance : (nextMonthSales * productFactor);
      }
      
      // Production planning formula
      const totalRequirement = salesPlan + closingBalance;
      const productionPlan = Math.max(0, totalRequirement - openingBalance);
      
      monthlyData.push({
        month,
        year: getYearForMonth(month, selectedFiscalYear), // Correct year based on month
        fiscalYear: selectedFiscalYear,
        salesPlan,
        openingBalance: Math.round(openingBalance),
        closingBalance: Math.round(closingBalance),
        totalRequirement: Math.round(totalRequirement),
        productionPlan: Math.round(productionPlan),
        dataSource: {
          opening: month === 'July' ? 'database' : (getInventoryBalance(selectedProduct, 'product', month, 'opening') !== null ? 'database' : 'calculated'),
          closing: month === 'June' ? 'database' : (getInventoryBalance(selectedProduct, 'product', month, 'closing') !== null ? 'database' : 'calculated')
        }
      });
      
      previousClosingBalance = closingBalance;
    });

    setProductPlanData(monthlyData);
  }, [selectedProduct, selectedFiscalYear, getSalesPlanQuantity, getInventoryBalance, getJulyOpeningBalance, getJuneClosingBalance, productFactor]);

  // UPDATED: Enhanced calculateMaterialPlan with loss factor support
  const calculateMaterialPlan = useCallback(() => {
    if (!selectedProduct || !selectedMaterial || !selectedFiscalYear) {
      console.log('Missing required data for material plan calculation');
      setMaterialPlanData([]);
      return;
    }

    // Run debug to see matching issues
    debugFormulationMatching();

    const formulationData = getFormulationData();
    const effectiveQuantity = formulationData.effectiveQuantity;
    
    console.log('🧮 Material Plan Calculation:', {
      selectedProduct: selectedProductData?.Product || selectedProductData?.name,
      selectedMaterial: selectedMaterialData?.Material || selectedMaterialData?.name,
      baseQuantity: formulationData.baseQuantity,
      lossFactor: formulationData.lossFactor,
      effectiveQuantity: effectiveQuantity,
      productPlanDataLength: productPlanData.length
    });

    if (effectiveQuantity === 0) {
      console.log('No formulation found for selected product and material');
      setMaterialPlanData([]);
      return;
    }

    const monthlyData = [];
    let previousClosingBalance = 0;

    MONTHS.forEach((month, index) => {
      // Find the corresponding production plan for this month
      const productPlanMonth = productPlanData.find(ppm => ppm.month === month);
      const productionPlan = productPlanMonth ? productPlanMonth.productionPlan : 0;
      
      // Calculate material requirement using EFFECTIVE quantity (including loss factor)
      const materialRequirement = productionPlan * effectiveQuantity;
      
      // Calculate next month material requirement for closing balance
      const nextMonthIndex = (index + 1) % 12;
      const nextMonth = MONTHS[nextMonthIndex];
      const nextMonthProductPlan = productPlanData.find(ppm => ppm.month === nextMonth);
      const nextMonthProductionPlan = nextMonthProductPlan ? nextMonthProductPlan.productionPlan : 0;
      const nextMonthMaterialRequirement = nextMonthProductionPlan * effectiveQuantity;
      
      // SPECIAL HANDLING: July material opening balance from database
      let openingBalance;
      if (month === 'July') {
        openingBalance = getJulyMaterialOpeningBalance(selectedMaterial);
        console.log(`🎯 Using database July material opening balance: ${openingBalance}`);
      } else {
        const dbOpeningBalance = getInventoryBalance(selectedMaterial, 'material', month, 'opening');
        openingBalance = dbOpeningBalance !== null ? dbOpeningBalance : previousClosingBalance;
      }
      
      // SPECIAL HANDLING: June material closing balance from database
      let closingBalance;
      if (month === 'June') {
        closingBalance = getJuneMaterialClosingBalance(selectedMaterial);
        console.log(`🎯 Using database June material closing balance: ${closingBalance}`);
      } else {
        const dbClosingBalance = getInventoryBalance(selectedMaterial, 'material', month, 'closing');
        closingBalance = dbClosingBalance !== null ? dbClosingBalance : (nextMonthMaterialRequirement * materialFactor);
      }
      
      // Material planning formula
      const totalRequirement = materialRequirement + closingBalance;
      const materialPlan = Math.max(0, totalRequirement - openingBalance);
      
      monthlyData.push({
        month,
        year: getYearForMonth(month, selectedFiscalYear),
        fiscalYear: selectedFiscalYear,
        materialRequirement: Math.round(materialRequirement),
        openingBalance: Math.round(openingBalance),
        closingBalance: Math.round(closingBalance),
        totalRequirement: Math.round(totalRequirement),
        materialPlan: Math.round(materialPlan),
        productionPlan: productionPlan,
        baseQuantity: formulationData.baseQuantity,
        lossFactor: formulationData.lossFactor,
        effectiveQuantity: effectiveQuantity,
        dataSource: {
          opening: month === 'July' ? 'database' : (getInventoryBalance(selectedMaterial, 'material', month, 'opening') !== null ? 'database' : 'calculated'),
          closing: month === 'June' ? 'database' : (getInventoryBalance(selectedMaterial, 'material', month, 'closing') !== null ? 'database' : 'calculated')
        }
      });
      
      previousClosingBalance = closingBalance;
    });

    setMaterialPlanData(monthlyData);
  }, [selectedProduct, selectedMaterial, selectedFiscalYear, productPlanData, getFormulationData, getInventoryBalance, getJulyMaterialOpeningBalance, getJuneMaterialClosingBalance, materialFactor, debugFormulationMatching, selectedProductData, selectedMaterialData]);

  const generateAnnualProductionPlan = useCallback(() => {
    if (!products.length || !salesPlans.length) {
      setAnnualProductionPlan([]);
      return;
    }

    const annualPlan = [];

    products.forEach(product => {
      let previousClosingBalance = 0;

      MONTHS.forEach((month, index) => {
        const salesPlan = getSalesPlanQuantity(product._id, month);
        
        const nextMonthIndex = (index + 1) % 12;
        const nextMonth = MONTHS[nextMonthIndex];
        const nextMonthSales = getSalesPlanQuantity(product._id, nextMonth);
        
        // SPECIAL HANDLING: July opening balance from database
        let openingBalance;
        if (month === 'July') {
          openingBalance = getJulyOpeningBalance(product._id);
        } else {
          const dbOpeningBalance = getInventoryBalance(product._id, 'product', month, 'opening');
          openingBalance = dbOpeningBalance !== null ? dbOpeningBalance : previousClosingBalance;
        }
        
        // SPECIAL HANDLING: June closing balance from database
        let closingBalance;
        if (month === 'June') {
          closingBalance = getJuneClosingBalance(product._id);
        } else {
          const dbClosingBalance = getInventoryBalance(product._id, 'product', month, 'closing');
          closingBalance = dbClosingBalance !== null ? dbClosingBalance : (nextMonthSales * productFactor);
        }
        
        const totalRequirement = salesPlan + closingBalance;
        const productionPlan = Math.max(0, totalRequirement - openingBalance);

        annualPlan.push({
          product: product.Product || product.name,
          productId: product._id,
          unit: product.Unit || product.unit || 'pcs',
          month,
          year: getYearForMonth(month, selectedFiscalYear), // Correct year based on month
          fiscalYear: selectedFiscalYear,
          salesPlan,
          openingBalance: Math.round(openingBalance),
          closingBalance: Math.round(closingBalance),
          totalRequirement: Math.round(totalRequirement),
          productionPlan: Math.round(productionPlan),
          dataSource: {
            opening: month === 'July' ? 'database' : (getInventoryBalance(product._id, 'product', month, 'opening') !== null ? 'database' : 'calculated'),
            closing: month === 'June' ? 'database' : (getInventoryBalance(product._id, 'product', month, 'closing') !== null ? 'database' : 'calculated')
          }
        });

        previousClosingBalance = closingBalance;
      });
    });

    setAnnualProductionPlan(annualPlan);
  }, [products, salesPlans, getSalesPlanQuantity, getInventoryBalance, getJulyOpeningBalance, getJuneClosingBalance, productFactor, selectedFiscalYear]);

  // UPDATED: Generate annual material requirement summary with loss factor support
  const generateAnnualMaterialRequirement = useCallback(() => {
    if (!products.length || !materials.length || !productFormulations.length) {
      setAnnualMaterialRequirement([]);
      return;
    }

    // Create a map of product formulations for quick lookup
    const formulationMap = {};
    productFormulations.forEach(pf => {
      if (pf.status === 'Active') {
        const key = `${pf.productName}-${pf.materialName}`;
        // Store effective quantity including loss factor
        formulationMap[key] = calculateEffectiveQuantity(pf.quantity, pf.lossFactor);
      }
    });

    // Calculate material requirements for each product and month
    const materialRequirements = [];

    annualProductionPlan.forEach(productPlan => {
      const product = products.find(p => 
        (p.Product || p.name) === productPlan.product
      );
      
      if (!product) return;

      materials.forEach(material => {
        const materialName = material.Material || material.name;
        const formulationKey = `${productPlan.product}-${materialName}`;
        const effectiveQuantity = formulationMap[formulationKey];

        if (effectiveQuantity && effectiveQuantity > 0) {
          const materialRequirement = productPlan.productionPlan * effectiveQuantity;

          materialRequirements.push({
            product: productPlan.product,
            material: materialName,
            materialId: material._id,
            materialUnit: material.Unit || material.unit || 'unit',
            month: productPlan.month,
            year: productPlan.year,
            fiscalYear: productPlan.fiscalYear,
            productionPlan: productPlan.productionPlan,
            effectiveQuantity: effectiveQuantity,
            materialRequirement: Math.round(materialRequirement)
          });
        }
      });
    });

    setAnnualMaterialRequirement(materialRequirements);
  }, [products, materials, productFormulations, annualProductionPlan]);

  // NEW: Transform annual production plan data into summary format with products as columns
  const annualProductionPlanSummary = useMemo(() => {
    if (!annualProductionPlan.length) return { productColumns: [], monthlySummary: [] };

    // Get unique products with their units
    const productColumns = [];
    const productMap = new Map();

    annualProductionPlan.forEach(item => {
      if (!productMap.has(item.productId)) {
        productMap.set(item.productId, {
          productId: item.productId,
          productName: item.product,
          unit: item.unit,
          data: new Map()
        });
      }
      
      const productData = productMap.get(item.productId);
      productData.data.set(item.month, item.productionPlan);
    });

    // Convert to array and create column structure
    productColumns.push(...Array.from(productMap.values()));

    // Create rows for each month
    const monthlySummary = MONTHS.map(month => {
      const row = { month };
      
      productColumns.forEach(product => {
        row[product.productId] = product.data.get(month) || 0;
      });
      
      return row;
    });

    return {
      productColumns,
      monthlySummary
    };
  }, [annualProductionPlan]);

  // UPDATED: Transform annual material requirement data into summary format WITHOUT Total column
  const annualMaterialRequirementSummary = useMemo(() => {
    if (!annualMaterialRequirement.length) return { materialColumns: [], monthlySummary: [] };

    // Get unique materials with their units
    const materialColumns = [];
    const materialMap = new Map();

    annualMaterialRequirement.forEach(item => {
      if (!materialMap.has(item.materialId)) {
        materialMap.set(item.materialId, {
          materialId: item.materialId,
          materialName: item.material,
          unit: item.materialUnit,
          data: new Map()
        });
      }
      
      const materialData = materialMap.get(item.materialId);
      const currentValue = materialData.data.get(item.month) || 0;
      materialData.data.set(item.month, currentValue + item.materialRequirement);
    });

    // Convert to array and create column structure
    materialColumns.push(...Array.from(materialMap.values()));

    // Create rows for each month WITHOUT total calculation
    const monthlySummary = MONTHS.map(month => {
      const row = { month };
      
      materialColumns.forEach(material => {
        row[material.materialId] = material.data.get(month) || 0;
      });
      
      return row;
    });

    return {
      materialColumns,
      monthlySummary
    };
  }, [annualMaterialRequirement]);

  // Effects for calculations
  useEffect(() => {
    calculateProductPlan();
  }, [calculateProductPlan]);

  useEffect(() => {
    calculateMaterialPlan();
  }, [calculateMaterialPlan]);

  useEffect(() => {
    generateAnnualProductionPlan();
  }, [generateAnnualProductionPlan]);

  useEffect(() => {
    generateAnnualMaterialRequirement();
  }, [generateAnnualMaterialRequirement]);

  // UPDATED: Enhanced effect to handle data refresh when selections change
  useEffect(() => {
    console.log('🔄 Selection change effect triggered:', {
      selectedFiscalYear,
      selectedProduct,
      selectedMaterial
    });
    
    if (selectedFiscalYear) {
      fetchSalesPlans();
      fetchInventoryPlans();
    }
  }, [selectedFiscalYear, selectedProduct, selectedMaterial, fetchSalesPlans, fetchInventoryPlans]);

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Event handlers
  const handleProductChange = (event) => {
    setSelectedProduct(event.target.value);
  };

  const handleMaterialChange = (event) => {
    setSelectedMaterial(event.target.value);
  };

  const handleRefresh = () => {
    fetchAllData();
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(null);
  };

  // Helper components
  const DataSourceIndicator = ({ source }) => (
    <Tooltip title={`Data from ${source}`}>
      <Chip 
        label={source === 'database' ? 'DB' : 'Calc'} 
        size="small" 
        color={source === 'database' ? 'success' : 'warning'}
        variant="outlined"
      />
    </Tooltip>
  );

  const YearChip = ({ year }) => (
    <Tooltip title={`Year: ${year}`}>
      <Chip 
        label={year} 
        size="small" 
        color="secondary"
        variant="outlined"
      />
    </Tooltip>
  );

  const FiscalYearChip = ({ fiscalYear }) => (
    <Tooltip title={`Fiscal Year: ${fiscalYear}`}>
      <Chip 
        label={fiscalYear} 
        size="small" 
        color="primary"
        variant="outlined"
      />
    </Tooltip>
  );

  const TabPanel = ({ children, value, index, ...other }) => (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );

  // NEW: Get appropriate placeholder text for import dialog based on active tab
  const getImportPlaceholder = () => {
    switch (activeTab) {
      case 0:
        return `Paste Plan Calculation data in JSON format...\n\nExample format:\n{\n  "productPlan": [...],\n  "fiscalYear": "${selectedFiscalYear}"\n}`;
      case 1:
        return `Paste Annual Production Plan data in JSON format...\n\nExample format:\n{\n  "annualProductionPlan": [...],\n  "fiscalYear": "${selectedFiscalYear}"\n}`;
      case 2:
        return `Paste Material Plan Calculation data in JSON format...\n\nExample format:\n{\n  "materialPlan": [...],\n  "fiscalYear": "${selectedFiscalYear}"\n}`;
      case 3:
        return `Paste Annual Material Requirement data in JSON format...\n\nExample format:\n{\n  "annualMaterialRequirement": [...],\n  "fiscalYear": "${selectedFiscalYear}"\n}`;
      case 4:
        return `Paste Product Plan Summary data in JSON format...\n\nExample format:\n{\n  "productPlanSummary": [...],\n  "fiscalYear": "${selectedFiscalYear}"\n}`;
      case 5:
        return `Paste Material Plan Summary data in JSON format...\n\nExample format:\n{\n  "materialPlanSummary": [...],\n  "fiscalYear": "${selectedFiscalYear}"\n}`;
      default:
        return 'Paste JSON data here...';
    }
  };

  // NEW: Get export data summary based on active tab
  const getExportDataSummary = () => {
    switch (activeTab) {
      case 0:
        return {
          title: 'Plan Calculation Data',
          records: [
            `Product Plan: ${productPlanData.length} months`
          ]
        };
      case 1:
        return {
          title: 'Annual Production Plan Data',
          records: [
            `Annual Production Plan: ${annualProductionPlan.length} records`,
            `Summary Columns: ${annualProductionPlanSummary.productColumns?.length || 0} products`
          ]
        };
      case 2:
        return {
          title: 'Material Plan Calculation Data',
          records: [
            `Material Plan: ${materialPlanData.length} months`,
            `Selected Product: ${selectedProductName}`,
            `Selected Material: ${selectedMaterialName}`
          ]
        };
      case 3:
        return {
          title: 'Annual Material Requirement Data',
          records: [
            `Annual Material Requirement: ${annualMaterialRequirement.length} records`,
            `Summary Columns: ${annualMaterialRequirementSummary.materialColumns?.length || 0} materials`
          ]
        };
      case 4:
        return {
          title: 'Product Plan Summary Data',
          records: [
            `Product Plan Summary: ${productPlanSummary.length} products`,
            `Total Production: ${productPlanSummary.reduce((sum, item) => sum + item.totalQuantity, 0).toLocaleString()}`
          ]
        };
      case 5:
        return {
          title: 'Material Plan Summary Data',
          records: [
            `Material Plan Summary: ${materialPlanSummary.length} materials`,
            `Total Material: ${materialPlanSummary.reduce((sum, item) => sum + item.totalQuantity, 0).toLocaleString()}`
          ]
        };
      default:
        return { title: 'Production Plan Data', records: [] };
    }
  };

  // Derived data
  const exportSummary = getExportDataSummary();
  const formulationData = getFormulationData();
  const effectiveQuantity = formulationData.effectiveQuantity;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 2, maxWidth: 1400, margin: '0 auto' }} ref={printRef}>
        
        {/* Header */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }} className="no-print">
          {onBack && (
            <IconButton onClick={onBack} sx={{ border: 1, borderColor: 'divider' }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Box flex={1}>
            {/* UPDATED: Reduced title font size */}
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalculateIcon />
              Production Planning System
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Comprehensive production and material planning
            </Typography>
          </Box>
          {/* UPDATED: Icon-only function buttons */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Refresh Data">
              <IconButton
                onClick={handleRefresh}
                disabled={loading}
                color="primary"
                sx={{ border: 1, borderColor: 'divider' }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Filter Data">
              <IconButton
                color="primary"
                sx={{ border: 1, borderColor: 'divider' }}
              >
                <FilterIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Import Active Table Data">
              <IconButton
                onClick={() => setImportDialogOpen(true)}
                color="primary"
                sx={{ border: 1, borderColor: 'divider' }}
              >
                <FileUploadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export Active Table Data">
              <IconButton
                onClick={() => setExportDialogOpen(true)}
                color="primary"
                sx={{ border: 1, borderColor: 'divider' }}
              >
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Notifications */}
        <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity="error">
            {error}
          </Alert>
        </Snackbar>

        <Snackbar open={!!success} autoHideDuration={3000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity="success">
            {success}
          </Alert>
        </Snackbar>

        {/* Controls */}
        {/* UPDATED: Reduced card size */}
        <Paper sx={{ p: 1, mb: 2 }} className="no-print">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Fiscal Year</InputLabel>
                <Select
                  value={selectedFiscalYear}
                  label="Fiscal Year"
                  onChange={(e) => setSelectedFiscalYear(e.target.value)}
                >
                  {FISCAL_YEARS.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={9}>
              <Grid container spacing={1}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" fontWeight="medium">
                    Products: {products.length}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" fontWeight="medium">
                    Materials: {materials.length}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" fontWeight="medium">
                    Sales Plans: {salesPlans.length}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" fontWeight="medium">
                    Inventory Plans: {inventoryPlans.length}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ mb: 2 }} className="no-print">
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} variant="scrollable" scrollButtons="auto">
            <Tab icon={<CalculateIcon />} label="Plan Calculation" iconPosition="start" />
            <Tab icon={<TrendingUpIcon />} label="Annual Production Plan" iconPosition="start" />
            <Tab icon={<ScienceIcon />} label="Material Plan Calculation" iconPosition="start" />
            <Tab icon={<ListAltIcon />} label="Annual Material Requirement" iconPosition="start" />
            <Tab icon={<BusinessIcon />} label="Product Plan Summary" iconPosition="start" />
            <Tab icon={<InventoryIcon />} label="Material Plan Summary" iconPosition="start" />
          </Tabs>
        </Paper>

        {/* Tab 1: Plan Calculation */}
        <TabPanel value={activeTab} index={0}>
          <div ref={tab0Ref}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {/* Product Plan */}
                <Grid item xs={12}>
                  {/* UPDATED: Reduced card size */}
                  <Paper sx={{ p: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.1rem' }}>
                        Product Plan Calculation
                        <FiscalYearChip fiscalYear={selectedFiscalYear} />
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }} className="no-print">
                        <Tooltip title="Copy Product Plan Data">
                          <IconButton
                            onClick={handleCopyProductPlan}
                            color="primary"
                            size="small"
                            sx={{ border: 1, borderColor: 'divider' }}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Print Product Plan as PDF">
                          <IconButton
                            onClick={handlePrintProductPlan}
                            color="primary"
                            size="small"
                            sx={{ border: 1, borderColor: 'divider' }}
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {copySuccessProduct && (
                      <Alert severity="success" sx={{ mb: 1 }} onClose={() => setCopySuccessProduct(null)}>
                        {copySuccessProduct}
                      </Alert>
                    )}

                    {products.length === 0 ? (
                      <Alert severity="warning">No active products available</Alert>
                    ) : (
                      <>
                        <Grid container spacing={1} sx={{ mb: 2 }}>
                          <Grid item xs={12} sm={8}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Product</InputLabel>
                              <Select value={selectedProduct} label="Product" onChange={handleProductChange}>
                                {products.map(product => (
                                  <MenuItem key={product._id} value={product._id}>
                                    {product.Product || product.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField 
                              label="Unit" 
                              value={selectedProductUnit} 
                              InputProps={{ readOnly: true }} 
                              fullWidth 
                              size="small"
                            />
                          </Grid>
                        </Grid>

                        {/* Inventory Factor Control for Products */}
                        {/* UPDATED: Reduced card size */}
                        <Box sx={{ mb: 2, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.875rem' }}>
                            <InventoryIcon fontSize="small" />
                            Product Inventory Factor
                          </Typography>
                          <Grid container spacing={1} alignItems="center">
                            <Grid item xs={12} sm={6}>
                              <Slider
                                value={parseFloat(productFactorInput)}
                                onChange={handleProductFactorSliderChange}
                                min={0}
                                max={50}
                                step={1}
                                valueLabelDisplay="auto"
                                valueLabelFormat={(value) => `${value}%`}
                                color="primary"
                                size="small"
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Inventory Factor"
                                value={productFactorInput}
                                onChange={handleProductFactorChange}
                                InputProps={{
                                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                }}
                                fullWidth
                                size="small"
                                type="number"
                                inputProps={{ min: 0, max: 100, step: 1 }}
                                helperText="Percentage of next month's sales for closing balance"
                              />
                            </Grid>
                          </Grid>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            Current: {productFactorInput}% - Used to calculate closing balance when no database value exists
                          </Typography>
                        </Box>

                        {salesPlans.length === 0 ? (
                          <Alert severity="warning">
                            No sales plans found for {selectedFiscalYear}. Please add sales plans to the database.
                          </Alert>
                        ) : productPlanData.length === 0 ? (
                          <Alert severity="info">
                            No product plan data available for {selectedProductName} in {selectedFiscalYear}.
                          </Alert>
                        ) : (
                          <div ref={productPlanTableRef}>
                            {/* UPDATED: Scrollable table with fixed height and reduced row height */}
                            <TableContainer sx={{ maxHeight: 320, overflow: 'auto' }}>
                              <Table 
                                size="small" 
                                className="print-table"
                                sx={{
                                  '& .MuiTableCell-root': {
                                    padding: '4px 8px',
                                    fontSize: '0.75rem',
                                    whiteSpace: 'nowrap',
                                    lineHeight: '1.2'
                                  }
                                }}
                              >
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', minWidth: 80 }}>Month</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: 70 }}>Year</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: 90 }}>Sales Plan</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: 110 }}>Opening Balance</TableCell>
                                    {/* EXCHANGED: Total Requirement now comes before Closing Balance */}
                                    <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: 110 }}>Total Requirement</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: 110 }}>Closing Balance</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: 100 }}>Production Plan</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {productPlanData.map((row, index) => (
                                    <TableRow key={index} sx={{ height: '32px' }}>
                                      <TableCell sx={{ minWidth: 80 }}>{row.month}</TableCell>
                                      <TableCell align="right" sx={{ minWidth: 70 }}>
                                        <YearChip year={row.year} />
                                      </TableCell>
                                      <TableCell align="right" sx={{ minWidth: 90 }}>
                                        <Typography 
                                          variant="body2" 
                                          color={row.salesPlan > 0 ? 'text.primary' : 'text.secondary'}
                                          fontWeight={row.salesPlan > 0 ? 'bold' : 'normal'}
                                          sx={{ fontSize: '0.75rem' }}
                                        >
                                          {row.salesPlan.toLocaleString()}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="right" sx={{ minWidth: 110 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                          {row.openingBalance.toLocaleString()}
                                          <DataSourceIndicator source={row.dataSource.opening} />
                                        </Box>
                                      </TableCell>
                                      {/* EXCHANGED: Total Requirement now comes before Closing Balance */}
                                      <TableCell align="right" sx={{ minWidth: 110 }}>{row.totalRequirement.toLocaleString()}</TableCell>
                                      <TableCell align="right" sx={{ minWidth: 110 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                          {row.closingBalance.toLocaleString()}
                                          <DataSourceIndicator source={row.dataSource.closing} />
                                        </Box>
                                      </TableCell>
                                      <TableCell align="right" sx={{ minWidth: 100 }}>
                                        {/* UPDATED: Remove green color from Production Plan value */}
                                        <Typography 
                                          variant="body2" 
                                          fontWeight="medium"
                                          sx={{ fontSize: '0.75rem' }}
                                        >
                                          {row.productionPlan.toLocaleString()}
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </div>
                        )}
                      </>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            )}
          </div>
        </TabPanel>

        {/* Tab 2: Annual Production Plan - UPDATED with Grand Total Row */}
        <TabPanel value={activeTab} index={1}>
          <div ref={tab1Ref}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : annualProductionPlan.length === 0 ? (
              <Alert severity="info">
                No annual production plan data available. Please ensure products and sales plans are loaded.
              </Alert>
            ) : (
              <Paper sx={{ p: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.1rem' }}>
                    Annual Production Plan Summary - {selectedFiscalYear}
                    <FiscalYearChip fiscalYear={selectedFiscalYear} />
                  </Typography>
                  {/* UPDATED: Icon-only print button */}
                  <Tooltip title="Print as PDF">
                    <IconButton
                      onClick={handlePrintAnnualProductionPlan}
                      color="primary"
                      sx={{ border: 1, borderColor: 'divider' }}
                      className="no-print"
                    >
                      <PrintIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                {/* UPDATED: Scrollable table with fixed height */}
                <TableContainer sx={{ maxHeight: 320, overflow: 'auto' }}>
                  <Table 
                    size="small" 
                    className="print-table summary-table"
                    stickyHeader
                    sx={{
                      '& .MuiTableCell-root': {
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap',
                        lineHeight: '1.2'
                      }
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell 
                          sx={{ 
                            position: 'sticky', 
                            left: 0, 
                            backgroundColor: 'background.paper',
                            zIndex: 3,
                            fontWeight: 'bold',
                            minWidth: 80,
                            fontSize: '0.75rem'
                          }}
                        >
                          Month
                        </TableCell>
                        {annualProductionPlanSummary.productColumns?.map(product => (
                          <TableCell 
                            key={product.productId}
                            align="right"
                            sx={{ 
                              fontWeight: 'bold',
                              minWidth: 100,
                              fontSize: '0.75rem'
                            }}
                          >
                            {product.productName} ({product.unit})
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {annualProductionPlanSummary.monthlySummary?.map((row, index) => (
                        <TableRow 
                          key={row.month}
                          sx={{ 
                            '&:last-child td, &:last-child th': { border: 0 },
                            '&:hover': { backgroundColor: 'action.hover' },
                            height: '32px'
                          }}
                        >
                          <TableCell 
                            component="th" 
                            scope="row"
                            sx={{ 
                              position: 'sticky', 
                              left: 0, 
                              backgroundColor: 'background.paper',
                              fontWeight: 'medium',
                              fontSize: '0.75rem',
                              minWidth: 80
                            }}
                          >
                            {row.month}
                          </TableCell>
                          {annualProductionPlanSummary.productColumns?.map(product => (
                            <TableCell 
                              key={product.productId} 
                              align="right"
                              sx={{ 
                                color: row[product.productId] > 0 ? 'text.primary' : 'text.secondary',
                                fontWeight: row[product.productId] > 0 ? 'medium' : 'normal',
                                fontSize: '0.75rem',
                                minWidth: 100
                              }}
                            >
                              {row[product.productId] > 0 ? row[product.productId].toLocaleString() : '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      
                      {/* Grand Total Row */}
                      {annualProductionPlanSummary.monthlySummary?.length > 0 && (
                        <TableRow sx={{ backgroundColor: 'primary.light', height: '32px' }}>
                          <TableCell 
                            sx={{ 
                              position: 'sticky', 
                              left: 0, 
                              backgroundColor: 'primary.light',
                              color: 'primary.contrastText',
                              fontWeight: 'bold',
                              fontSize: '0.75rem'
                            }}
                          >
                            GRAND TOTAL
                          </TableCell>
                          {annualProductionPlanSummary.productColumns?.map(product => {
                            const productTotal = annualProductionPlanSummary.monthlySummary?.reduce(
                              (sum, row) => sum + (row[product.productId] || 0), 0
                            ) || 0;
                            return (
                              <TableCell 
                                key={product.productId} 
                                align="right"
                                sx={{ 
                                  color: 'primary.contrastText',
                                  fontWeight: 'bold',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {productTotal > 0 ? productTotal.toLocaleString() : '-'}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Summary Statistics */}
                <Box sx={{ mt: 2, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.875rem' }}>
                    Summary Statistics
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        Total Products: <strong>{annualProductionPlanSummary.productColumns?.length || 0}</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        Total Production: <strong>
                          {annualProductionPlanSummary.monthlySummary?.reduce((sum, row) => 
                            sum + annualProductionPlanSummary.productColumns?.reduce((colSum, product) => 
                              colSum + (row[product.productId] || 0), 0
                            ), 0
                          ).toLocaleString()}
                        </strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        Avg per Product: <strong>
                          {annualProductionPlanSummary.productColumns?.length > 0 
                            ? Math.round(
                                annualProductionPlanSummary.monthlySummary?.reduce((sum, row) => 
                                  sum + annualProductionPlanSummary.productColumns?.reduce((colSum, product) => 
                                    colSum + (row[product.productId] || 0), 0
                                  ), 0
                                ) / annualProductionPlanSummary.productColumns.length
                              ).toLocaleString()
                            : 0
                          }
                        </strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        Fiscal Year: <strong>{selectedFiscalYear}</strong>
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            )}
          </div>
        </TabPanel>

        {/* UPDATED: Tab 3: Material Plan Calculation with Loss Factor Support */}
        <TabPanel value={activeTab} index={2}>
          <div ref={tab2Ref}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {/* Material Plan */}
                <Grid item xs={12}>
                  {/* UPDATED: Reduced card size */}
                  <Paper sx={{ p: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.1rem' }}>
                        Material Plan Calculation
                        <FiscalYearChip fiscalYear={selectedFiscalYear} />
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }} className="no-print">
                        <Tooltip title="Copy Material Plan Data">
                          <IconButton
                            onClick={handleCopyMaterialPlan}
                            color="primary"
                            size="small"
                            sx={{ border: 1, borderColor: 'divider' }}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Print Material Plan as PDF">
                          <IconButton
                            onClick={handlePrintMaterialPlan}
                            color="primary"
                            size="small"
                            sx={{ border: 1, borderColor: 'divider' }}
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {copySuccessMaterial && (
                      <Alert severity="success" sx={{ mb: 1 }} onClose={() => setCopySuccessMaterial(null)}>
                        {copySuccessMaterial}
                      </Alert>
                    )}

                    {products.length === 0 || materials.length === 0 ? (
                      <Alert severity="warning">
                        {products.length === 0 ? 'No active products available' : 'No active materials available'}
                      </Alert>
                    ) : (
                      <>
                        <Grid container spacing={1} sx={{ mb: 2 }}>
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Product</InputLabel>
                              <Select value={selectedProduct} label="Product" onChange={handleProductChange}>
                                {products.map(product => (
                                  <MenuItem key={product._id} value={product._id}>
                                    {product.Product || product.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Material</InputLabel>
                              <Select value={selectedMaterial} label="Material" onChange={handleMaterialChange}>
                                {materials.map(material => (
                                  <MenuItem key={material._id} value={material._id}>
                                    {material.Material || material.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>

                        {/* UPDATED: Formulation Information with Loss Factor */}
                        <Box sx={{ mb: 1, p: 1, backgroundColor: effectiveQuantity > 0 ? 'success.light' : 'warning.light', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.75rem' }}>
                            <ScienceIcon fontSize="small" />
                            {effectiveQuantity > 0 ? (
                              <>
                                Formulation: <strong>{formulationData.baseQuantity}</strong> {selectedMaterialUnit} of <strong>{selectedMaterialName}</strong> per unit of <strong>{selectedProductName}</strong>
                                {formulationData.lossFactor > 0 && (
                                  <span>
                                    {' '}+ <strong>{formulationData.lossFactor}%</strong> loss factor = <strong>{effectiveQuantity.toFixed(3)}</strong> {selectedMaterialUnit} effective
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                No active formulation found for <strong>{selectedProductName}</strong> and <strong>{selectedMaterialName}</strong>. 
                                Please add a product formulation.
                              </>
                            )}
                          </Typography>
                          
                          {/* Debug information - only show in development */}
                          {process.env.NODE_ENV === 'development' && (
                            <Button 
                              size="small" 
                              onClick={debugFormulationMatching}
                              sx={{ mt: 0.5 }}
                            >
                              Debug Formulation Matching
                            </Button>
                          )}
                        </Box>

                        {effectiveQuantity === 0 && selectedProduct && selectedMaterial && (
                          <Alert severity="warning" sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              No active formulation found for <strong>{selectedProductName}</strong> and <strong>{selectedMaterialName}</strong>.
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                              Available formulations in database:
                            </Typography>
                            <Box component="ul" sx={{ mt: 0.5, pl: 2 }}>
                              {productFormulations
                                .filter(pf => pf.status === 'Active')
                                .slice(0, 5) // Show first 5 to avoid clutter
                                .map((pf, index) => (
                                  <li key={index}>
                                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                      <strong>{pf.productName}</strong> - <strong>{pf.materialName}</strong>: {pf.quantity} {pf.materialUnit} 
                                      {pf.lossFactor > 0 && ` (+${pf.lossFactor}% loss)`}
                                    </Typography>
                                  </li>
                                ))
                              }
                            </Box>
                            {productFormulations.filter(pf => pf.status === 'Active').length > 5 && (
                              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                ... and {productFormulations.filter(pf => pf.status === 'Active').length - 5} more
                              </Typography>
                            )}
                          </Alert>
                        )}

                        {/* Inventory Factor Control for Materials */}
                        {/* UPDATED: Reduced card size */}
                        <Box sx={{ mb: 2, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.875rem' }}>
                            <InventoryIcon fontSize="small" />
                            Material Inventory Factor
                          </Typography>
                          <Grid container spacing={1} alignItems="center">
                            <Grid item xs={12} sm={6}>
                              <Slider
                                value={parseFloat(materialFactorInput)}
                                onChange={handleMaterialFactorSliderChange}
                                min={0}
                                max={50}
                                step={1}
                                valueLabelDisplay="auto"
                                valueLabelFormat={(value) => `${value}%`}
                                color="primary"
                                size="small"
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Inventory Factor"
                                value={materialFactorInput}
                                onChange={handleMaterialFactorChange}
                                InputProps={{
                                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                }}
                                fullWidth
                                size="small"
                                type="number"
                                inputProps={{ min: 0, max: 100, step: 1 }}
                                helperText="Percentage of next month's material requirement for closing balance"
                              />
                            </Grid>
                          </Grid>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            Current: {materialFactorInput}% - Used to calculate closing balance when no database value exists
                          </Typography>
                        </Box>

                        {productPlanData.length === 0 ? (
                          <Alert severity="warning">
                            No product plan data available. Please calculate the product plan first.
                          </Alert>
                        ) : materialPlanData.length === 0 ? (
                          <Alert severity="info">
                            No material plan data available for {selectedProductName} and {selectedMaterialName} in {selectedFiscalYear}.
                          </Alert>
                        ) : (
                          <div ref={materialPlanTableRef}>
                            {/* UPDATED: Scrollable table with fixed height and reduced row height */}
                            <TableContainer sx={{ maxHeight: 320, overflow: 'auto' }}>
                              <Table 
                                size="small" 
                                className="print-table"
                                sx={{
                                  '& .MuiTableCell-root': {
                                    padding: '4px 8px',
                                    fontSize: '0.75rem',
                                    whiteSpace: 'nowrap',
                                    lineHeight: '1.2'
                                  }
                                }}
                              >
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', minWidth: 80 }}>Month</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: 70 }}>Year</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: 120 }}>Material Requirement</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: 110 }}>Opening Balance</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: 110 }}>Total Requirement</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: 110 }}>Closing Balance</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: 100 }}>Material Plan</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {materialPlanData.map((row, index) => (
                                    <TableRow key={index} sx={{ height: '32px' }}>
                                      <TableCell sx={{ minWidth: 80 }}>{row.month}</TableCell>
                                      <TableCell align="right" sx={{ minWidth: 70 }}>
                                        <YearChip year={row.year} />
                                      </TableCell>
                                      <TableCell align="right" sx={{ minWidth: 120 }}>
                                        <Typography 
                                          variant="body2" 
                                          color={row.materialRequirement > 0 ? 'text.primary' : 'text.secondary'}
                                          fontWeight={row.materialRequirement > 0 ? 'bold' : 'normal'}
                                          sx={{ fontSize: '0.75rem' }}
                                        >
                                          {row.materialRequirement.toLocaleString()}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                          ({row.productionPlan.toLocaleString()} × {row.effectiveQuantity.toFixed(3)})
                                          {row.lossFactor > 0 && ` (includes ${row.lossFactor}% loss)`}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="right" sx={{ minWidth: 110 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                          {row.openingBalance.toLocaleString()}
                                          <DataSourceIndicator source={row.dataSource.opening} />
                                        </Box>
                                      </TableCell>
                                      <TableCell align="right" sx={{ minWidth: 110 }}>{row.totalRequirement.toLocaleString()}</TableCell>
                                      <TableCell align="right" sx={{ minWidth: 110 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                          {row.closingBalance.toLocaleString()}
                                          <DataSourceIndicator source={row.dataSource.closing} />
                                        </Box>
                                      </TableCell>
                                      <TableCell align="right" sx={{ minWidth: 100 }}>
                                        {/* UPDATED: Remove green color from Material Plan value */}
                                        <Typography 
                                          variant="body2" 
                                          fontWeight="medium"
                                          sx={{ fontSize: '0.75rem' }}
                                        >
                                          {row.materialPlan.toLocaleString()}
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </div>
                        )}
                      </>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            )}
          </div>
        </TabPanel>

        {/* UPDATED: Tab 4: Annual Material Requirement - WITHOUT Total Column */}
        <TabPanel value={activeTab} index={3}>
          <div ref={tab3Ref}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : annualMaterialRequirement.length === 0 ? (
              <Alert severity="info">
                No annual material requirement data available. Please ensure products, materials, and formulations are loaded.
              </Alert>
            ) : (
              <Paper sx={{ p: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.1rem' }}>
                    Annual Material Requirement Summary - {selectedFiscalYear}
                    <FiscalYearChip fiscalYear={selectedFiscalYear} />
                  </Typography>
                  {/* UPDATED: Icon-only print button */}
                  <Tooltip title="Print as PDF">
                    <IconButton
                      onClick={handlePrintAnnualMaterialRequirement}
                      color="primary"
                      sx={{ border: 1, borderColor: 'divider' }}
                      className="no-print"
                    >
                      <PrintIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                {/* UPDATED: Scrollable table with fixed height */}
                <TableContainer sx={{ maxHeight: 320, overflow: 'auto' }}>
                  <Table 
                    size="small" 
                    className="print-table summary-table"
                    stickyHeader
                    sx={{
                      '& .MuiTableCell-root': {
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap',
                        lineHeight: '1.2'
                      }
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell 
                          sx={{ 
                            position: 'sticky', 
                            left: 0, 
                            backgroundColor: 'background.paper',
                            zIndex: 3,
                            fontWeight: 'bold',
                            minWidth: 80,
                            fontSize: '0.75rem'
                          }}
                        >
                          Month
                        </TableCell>
                        {annualMaterialRequirementSummary.materialColumns?.map(material => (
                          <TableCell 
                            key={material.materialId}
                            align="right"
                            sx={{ 
                              fontWeight: 'bold',
                              minWidth: 100,
                              fontSize: '0.75rem'
                            }}
                          >
                            {material.materialName} ({material.unit})
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {annualMaterialRequirementSummary.monthlySummary?.map((row, index) => (
                        <TableRow 
                          key={row.month}
                          sx={{ 
                            '&:last-child td, &:last-child th': { border: 0 },
                            '&:hover': { backgroundColor: 'action.hover' },
                            height: '32px'
                          }}
                        >
                          <TableCell 
                            component="th" 
                            scope="row"
                            sx={{ 
                              position: 'sticky', 
                              left: 0, 
                              backgroundColor: 'background.paper',
                              fontWeight: 'medium',
                              fontSize: '0.75rem',
                              minWidth: 80
                            }}
                          >
                            {row.month}
                          </TableCell>
                          {annualMaterialRequirementSummary.materialColumns?.map(material => (
                            <TableCell 
                              key={material.materialId} 
                              align="right"
                              sx={{ 
                                color: row[material.materialId] > 0 ? 'text.primary' : 'text.secondary',
                                fontWeight: row[material.materialId] > 0 ? 'medium' : 'normal',
                                fontSize: '0.75rem',
                                minWidth: 100
                              }}
                            >
                              {row[material.materialId] > 0 ? row[material.materialId].toLocaleString() : '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      
                      {/* Grand Total Row */}
                      {annualMaterialRequirementSummary.monthlySummary?.length > 0 && (
                        <TableRow sx={{ backgroundColor: 'primary.light', height: '32px' }}>
                          <TableCell 
                            sx={{ 
                              position: 'sticky', 
                              left: 0, 
                              backgroundColor: 'primary.light',
                              color: 'primary.contrastText',
                              fontWeight: 'bold',
                              fontSize: '0.75rem'
                            }}
                          >
                            GRAND TOTAL
                          </TableCell>
                          {annualMaterialRequirementSummary.materialColumns?.map(material => {
                            const materialTotal = annualMaterialRequirementSummary.monthlySummary?.reduce(
                              (sum, row) => sum + (row[material.materialId] || 0), 0
                            ) || 0;
                            return (
                              <TableCell 
                                key={material.materialId} 
                                align="right"
                                sx={{ 
                                  color: 'primary.contrastText',
                                  fontWeight: 'bold',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {materialTotal > 0 ? materialTotal.toLocaleString() : '-'}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Summary Statistics */}
                <Box sx={{ mt: 2, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.875rem' }}>
                    Summary Statistics
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        Total Materials: <strong>{annualMaterialRequirementSummary.materialColumns?.length || 0}</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        Total Material Requirement: <strong>
                          {annualMaterialRequirementSummary.monthlySummary?.reduce((sum, row) => 
                            sum + annualMaterialRequirementSummary.materialColumns?.reduce((colSum, material) => 
                              colSum + (row[material.materialId] || 0), 0
                            ), 0
                          ).toLocaleString()}
                        </strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        Avg per Material: <strong>
                          {annualMaterialRequirementSummary.materialColumns?.length > 0 
                            ? Math.round(
                                annualMaterialRequirementSummary.monthlySummary?.reduce((sum, row) => 
                                  sum + annualMaterialRequirementSummary.materialColumns?.reduce((colSum, material) => 
                                    colSum + (row[material.materialId] || 0), 0
                                  ), 0
                                ) / annualMaterialRequirementSummary.materialColumns.length
                              ).toLocaleString()
                            : 0
                          }
                        </strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        Fiscal Year: <strong>{selectedFiscalYear}</strong>
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            )}
          </div>
        </TabPanel>

        {/* NEW: Tab 5: Product Plan Summary - WITHOUT Grand Total Row */}
        <TabPanel value={activeTab} index={4}>
          <div ref={tab4Ref}>
            <Paper sx={{ p: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                  Product Plan Summary - {selectedFiscalYear}
                </Typography>
                {/* UPDATED: Icon-only print button */}
                <Tooltip title="Print as PDF">
                  <IconButton
                    onClick={handlePrintProductSummary}
                    color="primary"
                    sx={{ border: 1, borderColor: 'divider' }}
                    className="no-print"
                  >
                    <PrintIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              
              {productPlanSummary.length === 0 ? (
                <Alert severity="info">
                  No product plan summary available. Please calculate product plans first.
                </Alert>
              ) : (
                <div ref={productSummaryRef}>
                  {/* UPDATED: Scrollable table with fixed height */}
                  <TableContainer sx={{ maxHeight: 320, overflow: 'auto' }}>
                    <Table 
                      className="print-table"
                      sx={{
                        '& .MuiTableCell-root': {
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                          lineHeight: '1.2'
                        }
                      }}
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Product</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', minWidth: 60 }}>Unit</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: 100 }}>Total Quantity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {productPlanSummary.map((item, index) => (
                          <TableRow key={index} sx={{ height: '32px' }}>
                            <TableCell sx={{ minWidth: 120 }}>{item.product}</TableCell>
                            <TableCell sx={{ minWidth: 60 }}>{item.unit}</TableCell>
                            <TableCell align="right" sx={{ minWidth: 100 }}>{item.totalQuantity.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </div>
              )}
            </Paper>
          </div>
        </TabPanel>

        {/* NEW: Tab 6: Material Plan Summary - WITHOUT Grand Total Row */}
        <TabPanel value={activeTab} index={5}>
          <div ref={tab5Ref}>
            <Paper sx={{ p: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                  Material Plan Summary - {selectedFiscalYear}
                </Typography>
                {/* UPDATED: Icon-only print button */}
                <Tooltip title="Print as PDF">
                  <IconButton
                    onClick={handlePrintMaterialSummary}
                    color="primary"
                    sx={{ border: 1, borderColor: 'divider' }}
                    className="no-print"
                  >
                    <PrintIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              
              {materialPlanSummary.length === 0 ? (
                <Alert severity="info">
                  No material plan summary available. Please calculate material plans first.
                </Alert>
              ) : (
                <div ref={materialSummaryRef}>
                  {/* UPDATED: Scrollable table with fixed height */}
                  <TableContainer sx={{ maxHeight: 320, overflow: 'auto' }}>
                    <Table 
                      className="print-table"
                      sx={{
                        '& .MuiTableCell-root': {
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                          lineHeight: '1.2'
                        }
                      }}
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Material</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', minWidth: 60 }}>Unit</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: 100 }}>Total Quantity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {materialPlanSummary.map((item, index) => (
                          <TableRow key={index} sx={{ height: '32px' }}>
                            <TableCell sx={{ minWidth: 120 }}>{item.material}</TableCell>
                            <TableCell sx={{ minWidth: 60 }}>{item.unit}</TableCell>
                            <TableCell align="right" sx={{ minWidth: 100 }}>{item.totalQuantity.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </div>
              )}
            </Paper>
          </div>
        </TabPanel>

        {/* Import Dialog */}
        <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="md" fullWidth className="no-print">
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FileUploadIcon />
              Import {exportSummary.title}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Paste your {exportSummary.title.toLowerCase()} in JSON format.
            </Typography>
            <TextField
              multiline
              rows={12}
              fullWidth
              variant="outlined"
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder={getImportPlaceholder()}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                // Import functionality would go here
                setImportDialogOpen(false);
                setSuccess('Import functionality would be implemented here');
              }} 
              variant="contained" 
              disabled={!importData.trim()}
            >
              Import Data
            </Button>
          </DialogActions>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth className="no-print">
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FileDownloadIcon />
              Export {exportSummary.title}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Export {exportSummary.title.toLowerCase()} for fiscal year: <strong>{selectedFiscalYear}</strong>
            </Typography>
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold">Data to be exported:</Typography>
              {exportSummary.records.map((record, index) => (
                <Typography key={index} variant="body2">• {record}</Typography>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                // Export functionality would go here
                setExportDialogOpen(false);
                setSuccess('Export functionality would be implemented here');
              }} 
              variant="contained" 
              color="primary"
            >
              Export as JSON
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ProductionPlan;