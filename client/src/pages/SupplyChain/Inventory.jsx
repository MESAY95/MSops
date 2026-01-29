import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  Divider,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Tooltip,
  IconButton,
  LinearProgress,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Inventory2 as InventoryIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  LocalShipping as ShippingIcon,
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  GetApp as DownloadIcon,
  Print as PrintIcon,
  Help as HelpIcon,
  Close as CloseIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import axios from 'axios';
import dayjs from 'dayjs';

// Constants for better maintainability
const CONSTANTS = {
  DEBOUNCE_DELAY: 500,
  PAGE_SIZES: [5, 10, 25, 50],
  DEFAULT_PAGE_SIZE: 10,
  NOTIFICATION_DURATION: 5000
};

// CORRECTED API ENDPOINTS - using relative paths and correct endpoints
const API_ENDPOINTS = {
  MATERIALS: '/api/materials',
  MATERIAL_RI: '/api/material-ri',
  PRODUCTS: '/api/products',
  PRODUCT_RI: '/api/product-ri',
  DASHBOARD: '/api/dashboard'
};

// Enhanced utility functions for data handling
const safeArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.materials && Array.isArray(data.materials)) return data.materials;
  if (data.products && Array.isArray(data.products)) return data.products;
  if (data.transactions && Array.isArray(data.transactions)) return data.transactions;
  if (data.reorderStatus && Array.isArray(data.reorderStatus)) return data.reorderStatus;
  if (data.records && Array.isArray(data.records)) return data.records;
  if (data.items && Array.isArray(data.items)) return data.items;
  return [];
};

const getNestedValue = (obj, path, defaultValue = 'N/A') => {
  if (!obj || typeof obj !== 'object') return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined) return defaultValue;
    result = result[key];
  }
  
  return result !== undefined && result !== null ? result : defaultValue;
};

// Enhanced debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Notification System Component
const NotificationSystem = ({ notifications, onClose }) => (
  <Box sx={{ 
    position: 'fixed', 
    top: 80, 
    right: 20, 
    zIndex: 9999, 
    minWidth: 300,
    maxWidth: 400
  }}>
    {notifications.success && (
      <Alert 
        severity="success" 
        onClose={() => onClose('success')}
        sx={{ mb: 1 }}
      >
        {notifications.success}
      </Alert>
    )}
    
    {notifications.error && (
      <Alert 
        severity="error" 
        onClose={() => onClose('error')}
        sx={{ mb: 1 }}
      >
        {notifications.error}
      </Alert>
    )}
    
    {notifications.info && (
      <Alert 
        severity="info" 
        onClose={() => onClose('info')}
        sx={{ mb: 1 }}
      >
        {notifications.info}
      </Alert>
    )}
  </Box>
);

// Print Dialog Component
const PrintDialog = ({ open, onClose, title, content, onPrint }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="between" alignItems="center">
          <Typography variant="h6">Print Preview - {title}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box id="print-content" sx={{ p: 2 }}>
          {content}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={onPrint} 
          variant="contained" 
          startIcon={<PrintIcon />}
        >
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Formula Dialog Component (Renamed from ReorderFormulasDialog)
const FormulaDialog = ({ open, onClose }) => {
  const formulas = [
    {
      title: "Danger Stock Level",
      formula: "Danger Stock Level = max(Minimum Consumption × Minimum Lead Time, Minimum Consumption × 0.5)",
      description: "The absolute minimum stock level before facing stockouts. When stock reaches this level, immediate action is required."
    },
    {
      title: "Reorder Point",
      formula: "Reorder Point = max(Maximum Consumption × Maximum Lead Time, Reorder Quantity)",
      description: "The stock level at which a new order should be placed. Considers both consumption patterns and lead times."
    },
    {
      title: "Maximum Stock Level",
      formula: "Maximum Stock Level = Reorder Point × 1.5",
      description: "The ideal maximum inventory level to avoid overstocking while maintaining safety stock."
    },
    {
      title: "Reorder Quantity",
      formula: "Reorder Quantity = Maximum Stock Level - Current Stock",
      description: "The quantity to reorder to bring inventory back to optimal levels."
    },
    {
      title: "Current Stock Calculation",
      formula: "Current Stock = ∑(Receive Transactions) - ∑(Issue Transactions)",
      description: "Stock is calculated from all material transactions. Receives increase stock, issues decrease stock."
    },
    {
      title: "Inventory Value Calculation",
      formula: "Inventory Value = Current Stock × Unit Price",
      description: "Total value of inventory items calculated by multiplying current stock by unit price."
    }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <InfoIcon color="primary" />
          <Typography variant="h6">Formula & Calculations</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" paragraph>
          The following formulas are used to calculate reorder status and stock levels:
        </Typography>
        
        <List>
          {formulas.map((item, index) => (
            <ListItem key={index} alignItems="flex-start" sx={{ borderBottom: index < formulas.length - 1 ? 1 : 0, borderColor: 'divider', py: 2 }}>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" fontWeight="bold" color="primary">
                    {item.title}
                  </Typography>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" fontFamily="monospace" sx={{ backgroundColor: 'grey.100', p: 1, borderRadius: 1 }}>
                      {item.formula}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {item.description}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>

        <Box sx={{ mt: 2, p: 2, backgroundColor: 'info.light', borderRadius: 1 }}>
          <Typography variant="body2" color="info.contrastText">
            <strong>Note:</strong> All calculations are based on transaction data from the Material Requisition and Issue (RI) system.
            Stock levels are updated in real-time as transactions are recorded.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const Inventory = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  // State management
  const [materials, setMaterials] = useState([]);
  const [materialTransactions, setMaterialTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [productTransactions, setProductTransactions] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  
  const [loading, setLoading] = useState({
    materials: false,
    products: false,
    materialTransactions: false,
    productTransactions: false,
    dashboard: false
  });
  
  const [notifications, setNotifications] = useState({
    success: null,
    error: null,
    info: null
  });

  // Enhanced filtering and pagination
  const [filters, setFilters] = useState({
    page: 1,
    limit: CONSTANTS.DEFAULT_PAGE_SIZE,
    search: '',
    status: '',
    material: '',
    inventoryStatus: 'all'
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: CONSTANTS.DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1
  });

  const [showFilters, setShowFilters] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printContent, setPrintContent] = useState(null);
  const [printTitle, setPrintTitle] = useState('');
  const [formulasDialogOpen, setFormulasDialogOpen] = useState(false);

  // Use debounced search
  const debouncedSearch = useDebounce(filters.search, CONSTANTS.DEBOUNCE_DELAY);

  // Enhanced notification handler
  const showNotification = useCallback((type, message, autoHide = true) => {
    setNotifications(prev => ({ ...prev, [type]: message }));
    
    if (autoHide) {
      setTimeout(() => {
        setNotifications(prev => ({ ...prev, [type]: null }));
      }, CONSTANTS.NOTIFICATION_DURATION);
    }
  }, []);

  const closeNotification = useCallback((type) => {
    setNotifications(prev => ({ ...prev, [type]: null }));
  }, []);

  // Enhanced API call function with axios
  const apiCall = useCallback(async (url, options = {}) => {
    try {
      const response = await axios({
        url,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error(`API Error for ${url}:`, error);
      
      let errorMessage = 'Operation failed';
      
      if (error.response?.data) {
        const serverError = error.response.data;
        
        if (serverError.message) {
          errorMessage = serverError.message;
        }
        
        if (serverError.errors && Array.isArray(serverError.errors)) {
          errorMessage = serverError.errors.join(', ');
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check if the backend is running.';
      } else {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }, []);

  // CORRECTED: Fetch materials with proper endpoint
  const fetchMaterials = useCallback(async () => {
    setLoading(prev => ({ ...prev, materials: true }));
    try {
      const data = await apiCall(API_ENDPOINTS.MATERIALS);
      const materialsData = safeArray(data.materials || data);
      
      // Transform materials data for consistency - INCLUDING INACTIVE
      const transformedMaterials = materialsData.map(material => ({
        _id: material._id,
        Material: material.Material || 'Unnamed Material',
        MaterialCode: material.MaterialCode || 'N/A',
        Unit: material.Unit || 'pcs',
        UnitPrice: material.UnitPrice || 0,
        PackSize: material.PackSize || 1,
        ReorderQuantity: material.ReorderQuantity || 0,
        MinimumConsumption: material.MinimumConsumption || 0,
        MaximumConsumption: material.MaximumConsumption || 0,
        MinimumLeadTime: material.MinimumLeadTime || 0,
        MaximumLeadTime: material.MaximumLeadTime || 0,
        Status: material.Status || 'Active'
      }));
      
      setMaterials(transformedMaterials);
      
      // Update pagination if available
      if (data.currentPage) {
        setPagination({
          page: data.currentPage,
          pageSize: data.limit || CONSTANTS.DEFAULT_PAGE_SIZE,
          total: data.total || transformedMaterials.length,
          totalPages: data.totalPages || 1
        });
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      showNotification('error', `Failed to load materials: ${error.message}`);
      setMaterials([]);
    } finally {
      setLoading(prev => ({ ...prev, materials: false }));
    }
  }, [apiCall, showNotification]);

  // FIXED: Fetch material transactions with improved code extraction
  const fetchMaterialTransactions = useCallback(async () => {
    setLoading(prev => ({ ...prev, materialTransactions: true }));
    try {
      const data = await apiCall(API_ENDPOINTS.MATERIAL_RI);
      const transactions = safeArray(data.transactions || data);
      
      // Transform transactions data with better code extraction
      const transformedTransactions = transactions.map(transaction => {
        // Try multiple possible locations for MaterialCode
        const materialCode = 
          transaction.MaterialCode || 
          transaction.materialData?.MaterialCode || 
          (typeof transaction.Material === 'object' ? transaction.Material.MaterialCode : null) ||
          'N/A';
        
        // Extract material name
        const materialName = 
          (typeof transaction.Material === 'object' ? transaction.Material.Material : transaction.Material) || 
          transaction.materialData?.Material || 
          'Unknown Material';
        
        return {
          _id: transaction._id,
          Material: materialName,
          MaterialCode: materialCode,
          Activity: transaction.Activity,
          Quantity: transaction.Quantity || 0,
          Date: transaction.Date,
          Batch: transaction.Batch,
          DocumentNumber: transaction.DocumentNumber,
          Note: transaction.Note,
          Stock: transaction.Stock,
          Unit: transaction.Unit,
          materialData: transaction.materialData || {
            Material: materialName,
            MaterialCode: materialCode
          }
        };
      });
      
      setMaterialTransactions(transformedTransactions);
      
      // Update pagination if available
      if (data.currentPage) {
        setPagination({
          page: data.currentPage,
          pageSize: data.limit || CONSTANTS.DEFAULT_PAGE_SIZE,
          total: data.total || transformedTransactions.length,
          totalPages: data.totalPages || 1
        });
      }
    } catch (error) {
      console.error('Error fetching material transactions:', error);
      showNotification('error', `Failed to load material transactions: ${error.message}`);
      setMaterialTransactions([]);
    } finally {
      setLoading(prev => ({ ...prev, materialTransactions: false }));
    }
  }, [apiCall, showNotification]);

  // CORRECTED: Fetch products with proper endpoint and enhanced transformation - INCLUDING INACTIVE
  const fetchProducts = useCallback(async () => {
    setLoading(prev => ({ ...prev, products: true }));
    try {
      const data = await apiCall(API_ENDPOINTS.PRODUCTS);
      const productsData = safeArray(data.products || data);
      
      const transformedProducts = productsData.map(product => ({
        _id: product._id,
        Product: product.Product || 'Unnamed Product',
        ProductCode: product.ProductCode || 'N/A',
        Unit: product.Unit || 'pcs',
        ProductPrice: product.ProductPrice || product.UnitPrice || 0,
        UnitPrice: product.UnitPrice || product.ProductPrice || 0,
        PackSize: product.PackSize || 1,
        ReorderQuantity: product.ReorderQuantity || 0,
        MinimumStock: product.MinimumStock || 0,
        MaximumStock: product.MaximumStock || 0,
        MinimumLeadTime: product.MinimumLeadTime || 0,
        MaximumLeadTime: product.MaximumLeadTime || 0,
        Status: product.Status || 'Active'
      }));
      
      setProducts(transformedProducts);
      
      if (data.currentPage) {
        setPagination({
          page: data.currentPage,
          pageSize: data.limit || CONSTANTS.DEFAULT_PAGE_SIZE,
          total: data.total || transformedProducts.length,
          totalPages: data.totalPages || 1
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      showNotification('error', `Failed to load products: ${error.message}`);
      setProducts([]);
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  }, [apiCall, showNotification]);

  // FIXED: Fetch product transactions with improved code extraction
  const fetchProductTransactions = useCallback(async () => {
    setLoading(prev => ({ ...prev, productTransactions: true }));
    try {
      const data = await apiCall(API_ENDPOINTS.PRODUCT_RI);
      const transactions = safeArray(data.transactions || data);
      
      const transformedTransactions = transactions.map(transaction => {
        // Try multiple possible locations for ProductCode
        const productCode = 
          transaction.ProductCode || 
          transaction.productData?.ProductCode || 
          (typeof transaction.Product === 'object' ? transaction.Product.ProductCode : null) ||
          'N/A';
        
        // Extract product name - FIXED: Better name extraction
        const productName = 
          (typeof transaction.Product === 'object' ? transaction.Product.Product : transaction.Product) || 
          transaction.productData?.Product || 
          transaction.ProductName ||
          'Unknown Product';
        
        return {
          _id: transaction._id,
          Product: productName,
          ProductCode: productCode,
          Activity: transaction.Activity,
          Quantity: transaction.Quantity || 0,
          Date: transaction.Date,
          Batch: transaction.Batch,
          DocumentNumber: transaction.DocumentNumber,
          Note: transaction.Note,
          Stock: transaction.Stock,
          Unit: transaction.Unit,
          ExpireDate: transaction.ExpireDate,
          productData: transaction.productData || {
            Product: productName,
            ProductCode: productCode
          }
        };
      });
      
      setProductTransactions(transformedTransactions);
      
      if (data.currentPage) {
        setPagination({
          page: data.currentPage,
          pageSize: data.limit || CONSTANTS.DEFAULT_PAGE_SIZE,
          total: data.total || transformedTransactions.length,
          totalPages: data.totalPages || 1
        });
      }
    } catch (error) {
      console.error('Error fetching product transactions:', error);
      showNotification('error', `Failed to load product transactions: ${error.message}`);
      setProductTransactions([]);
    } finally {
      setLoading(prev => ({ ...prev, productTransactions: false }));
    }
  }, [apiCall, showNotification]);

  // CORRECTED: Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(prev => ({ ...prev, dashboard: true }));
    try {
      const data = await apiCall(API_ENDPOINTS.DASHBOARD);
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showNotification('error', `Failed to load dashboard data: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  }, [apiCall, showNotification]);

  // UPDATED: Calculate current stock for materials from materialris transactions - INCLUDING INACTIVE
  const calculateMaterialStock = useCallback((materialCode) => {
    if (!materialCode || !materialTransactions.length) return 0;
    
    const materialTrans = materialTransactions.filter(
      transaction => transaction.MaterialCode === materialCode
    );
    
    let stock = 0;
    materialTrans.forEach(transaction => {
      const quantity = Number(transaction.Quantity) || 0;
      
      // Determine if transaction increases or decreases stock based on activity type
      if (transaction.Activity === 'Receive' || 
          transaction.Activity === 'Return' ||
          transaction.Activity.includes('Receive')) {
        stock += quantity;
      } else if (transaction.Activity === 'Issue' || 
                 transaction.Activity === 'Waste' ||
                 transaction.Activity.includes('Issue')) {
        stock -= quantity;
      }
      // For other activity types, maintain current stock
    });
    
    return Math.max(0, stock); // Stock should not be negative
  }, [materialTransactions]);

  // UPDATED: Calculate material status based on stock levels from transactions - INCLUDING INACTIVE
  const calculateMaterialStatus = useCallback((material, currentStock) => {
    if (currentStock <= 0) return 'Out of Stock';
    
    const minConsumption = material.MinimumConsumption || 0;
    const maxConsumption = material.MaximumConsumption || 0;
    
    if (currentStock <= minConsumption) return 'Low Stock';
    if (currentStock > maxConsumption * 1.5) return 'Over Stock';
    
    return 'Normal';
  }, []);

  // FIXED: Calculate product stock from productris transactions - IMPROVED MATCHING LOGIC
  const calculateProductStock = useCallback((productCode, productName) => {
    if (!productTransactions.length) return 0;
    
    let productTrans = [];
    
    // Use product name for matching
    if (productName) {
      const searchName = productName.toLowerCase();
      productTrans = productTransactions.filter(transaction => {
        const transactionName = transaction.Product?.toLowerCase() || '';
        return transactionName.includes(searchName) || searchName.includes(transactionName);
      });
    }
    
    let stock = 0;
    productTrans.forEach(transaction => {
      const quantity = Number(transaction.Quantity) || 0;
      const activity = transaction.Activity?.toLowerCase() || '';
      
      // Enhanced activity detection with case-insensitive matching
      if (activity.includes('receive') || 
          activity.includes('+') ||
          transaction.Quantity > 0) {
        stock += quantity;
      } else if (activity.includes('issue') || 
                 activity.includes('sample') ||
                 activity.includes('gift') ||
                 activity.includes('promotion') ||
                 activity.includes('waste') ||
                 activity.includes('-') ||
                 transaction.Quantity < 0) {
        stock -= Math.abs(quantity);
      }
    });
    
    return Math.max(0, stock); // Stock should not be negative
  }, [productTransactions]);

  // UPDATED: Calculate product status based on stock levels from transactions - INCLUDING INACTIVE
  const calculateProductStatus = useCallback((product, currentStock) => {
    if (currentStock <= 0) return 'Out of Stock';
    
    const minStock = product.MinimumStock || 0;
    
    if (currentStock <= minStock) return 'Low Stock';
    
    return 'Normal';
  }, []);

  // UPDATED: Calculate expired products
  const calculateExpiredProducts = useCallback(() => {
    const today = new Date();
    return products.filter(product => {
      if (!product.ExpireDate) return false;
      const expireDate = new Date(product.ExpireDate);
      return expireDate < today;
    });
  }, [products]);

  // UPDATED: Calculate material reorder status directly from transactions - INCLUDING INACTIVE
  const calculateMaterialReorderStatus = useCallback(() => {
    if (!materials.length || !materialTransactions.length) return [];

    return materials.map(material => {
      const currentStock = calculateMaterialStock(material.MaterialCode);
      const minConsumption = material.MinimumConsumption || 0;
      const maxConsumption = material.MaximumConsumption || 0;
      const minLeadTime = material.MinimumLeadTime || 0;
      const maxLeadTime = material.MaximumLeadTime || 0;
      
      // Calculate reorder parameters based on consumption and lead time
      const dangerStockLevel = Math.max(
        minConsumption * minLeadTime,
        minConsumption * 0.5
      );
      
      const reorderPoint = Math.max(
        maxConsumption * maxLeadTime,
        material.ReorderQuantity || 0
      );
      
      const maximumStockLevel = reorderPoint * 1.5;
      
      let status = 'Active';
      if (currentStock <= 0) {
        status = 'Out of Stock';
      } else if (currentStock <= dangerStockLevel) {
        status = 'Danger Level';
      } else if (currentStock <= reorderPoint) {
        status = 'Low Stock';
      }
      
      const reorderQuantity = Math.max(
        maximumStockLevel - currentStock,
        reorderPoint
      );

      return {
        _id: material._id,
        Material: {
          _id: material._id,
          Material: material.Material,
          MaterialCode: material.MaterialCode,
          Unit: material.Unit,
          Status: material.Status // Include status in reorder data
        },
        AvailableStock: currentStock,
        MinimumStockLevel: minConsumption,
        MaximumStockLevel: maximumStockLevel,
        DangerStockLevel: dangerStockLevel,
        ReorderPoint: reorderPoint,
        ReorderQuantity: reorderQuantity,
        Status: status,
        InventoryStatus: material.Status, // Track inventory status separately
        Unit: material.Unit
      };
    });
  }, [materials, materialTransactions, calculateMaterialStock]);

  // UPDATED: Calculate low stock alerts directly from transactions - INCLUDING INACTIVE
  const calculateLowStockAlerts = useCallback(() => {
    const reorderStatus = calculateMaterialReorderStatus();
    return reorderStatus.filter(item => 
      (item.Status === 'Low Stock' || 
       item.Status === 'Out of Stock' || 
       item.Status === 'Danger Level') &&
      item.InventoryStatus === 'Active' // Only show alerts for active items
    );
  }, [calculateMaterialReorderStatus]);

  // UPDATED: Filter materials by Active/Inactive status
  const filteredMaterials = useMemo(() => {
    let filtered = safeArray(materials);
    
    // Apply inventory status filter
    if (filters.inventoryStatus !== 'all') {
      filtered = filtered.filter(material => 
        material.Status === filters.inventoryStatus
      );
    }
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(material => 
        material.Material?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [materials, filters.inventoryStatus, filters.search]);

  // UPDATED: Filter products by Active/Inactive status
  const filteredProducts = useMemo(() => {
    let filtered = safeArray(products);
    
    // Apply inventory status filter
    if (filters.inventoryStatus !== 'all') {
      filtered = filtered.filter(product => 
        product.Status === filters.inventoryStatus
      );
    }
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(product => 
        product.Product?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [products, filters.inventoryStatus, filters.search]);

  // UPDATED: Group materials by status for separate display
  const groupedMaterials = useMemo(() => {
    const active = filteredMaterials.filter(material => material.Status === 'Active');
    const inactive = filteredMaterials.filter(material => material.Status === 'Inactive');
    return { active, inactive };
  }, [filteredMaterials]);

  // UPDATED: Group products by status for separate display
  const groupedProducts = useMemo(() => {
    const active = filteredProducts.filter(product => product.Status === 'Active');
    const inactive = filteredProducts.filter(product => product.Status === 'Inactive');
    return { active, inactive };
  }, [filteredProducts]);

  // Calculate expired products
  const expiredProducts = useMemo(() => calculateExpiredProducts(), [calculateExpiredProducts]);

  // Calculate statistics with safe array handling - INCLUDING INACTIVE
  const safeMaterials = safeArray(materials);
  const safeProducts = safeArray(products);

  // UPDATED: Calculate reorder status and low stock alerts from transactions - INCLUDING INACTIVE
  const reorderStatus = useMemo(() => calculateMaterialReorderStatus(), [calculateMaterialReorderStatus]);
  const lowStockAlerts = useMemo(() => calculateLowStockAlerts(), [calculateLowStockAlerts]);

  // UPDATED: Calculate material statistics from transactions - INCLUDING INACTIVE
  const materialStats = useMemo(() => {
    let total = safeMaterials.length;
    let outOfStock = 0;
    let lowStock = 0;
    let totalValue = 0;
    let activeCount = 0;
    let inactiveCount = 0;
    let activeValue = 0;
    let inactiveValue = 0;

    safeMaterials.forEach(material => {
      const currentStock = calculateMaterialStock(material.MaterialCode);
      const status = calculateMaterialStatus(material, currentStock);
      const inventoryValue = currentStock * (material.UnitPrice || 0);
      
      if (status === 'Out of Stock') outOfStock++;
      if (status === 'Low Stock') lowStock++;
      
      totalValue += inventoryValue;
      
      if (material.Status === 'Active') {
        activeCount++;
        activeValue += inventoryValue;
      }
      if (material.Status === 'Inactive') {
        inactiveCount++;
        inactiveValue += inventoryValue;
      }
    });

    return { 
      total, 
      outOfStock, 
      lowStock, 
      totalValue, 
      activeCount, 
      inactiveCount,
      activeValue,
      inactiveValue
    };
  }, [safeMaterials, calculateMaterialStock, calculateMaterialStatus]);

  // UPDATED: Calculate product statistics from transactions including inventory value - FIXED STOCK CALCULATION
  const productStats = useMemo(() => {
    let total = safeProducts.length;
    let outOfStock = 0;
    let lowStock = 0;
    let activeCount = 0;
    let inactiveCount = 0;
    let totalValue = 0;
    let activeValue = 0;
    let inactiveValue = 0;

    safeProducts.forEach(product => {
      const currentStock = calculateProductStock(product.ProductCode, product.Product);
      const status = calculateProductStatus(product, currentStock);
      const inventoryValue = currentStock * (product.ProductPrice || 0);
      
      if (status === 'Out of Stock') outOfStock++;
      if (status === 'Low Stock') lowStock++;
      
      totalValue += inventoryValue;
      
      if (product.Status === 'Active') {
        activeCount++;
        activeValue += inventoryValue;
      }
      if (product.Status === 'Inactive') {
        inactiveCount++;
        inactiveValue += inventoryValue;
      }
    });

    return { 
      total, 
      outOfStock, 
      lowStock, 
      activeCount, 
      inactiveCount, 
      totalValue,
      activeValue,
      inactiveValue
    };
  }, [safeProducts, calculateProductStock, calculateProductStatus]);

  const lowStockStats = useMemo(() => ({
    total: lowStockAlerts.length,
    lowStock: lowStockAlerts.filter(item => item.Status === 'Low Stock').length,
    outOfStock: lowStockAlerts.filter(item => item.Status === 'Out of Stock').length,
    dangerLevel: lowStockAlerts.filter(item => item.Status === 'Danger Level').length
  }), [lowStockAlerts]);

  const transactionStats = useMemo(() => ({
    material: safeArray(materialTransactions).length,
    product: safeArray(productTransactions).length,
    total: safeArray(materialTransactions).length + safeArray(productTransactions).length
  }), [materialTransactions, productTransactions]);

  // Use dashboard data if available, otherwise use calculated stats - INCLUDING INACTIVE
  const displayStats = useMemo(() => ({
    materials: dashboardData?.statistics?.totalMaterials || materialStats.total,
    products: dashboardData?.statistics?.totalProducts || productStats.total,
    lowStock: dashboardData?.statistics?.lowStockItems || lowStockStats.total,
    inventoryValue: dashboardData?.statistics?.totalInventoryValue || 
                   (materialStats.totalValue + productStats.totalValue),
    materialValue: materialStats.totalValue,
    productValue: productStats.totalValue,
    materialActiveValue: materialStats.activeValue,
    materialInactiveValue: materialStats.inactiveValue,
    productActiveValue: productStats.activeValue,
    productInactiveValue: productStats.inactiveValue,
    expiredProducts: expiredProducts.length
  }), [dashboardData, materialStats, productStats, lowStockStats, expiredProducts]);

  // PRINT FUNCTIONS - MOVED AFTER groupedMaterials and groupedProducts are defined
  const handlePrint = useCallback(() => {
    const printContent = document.getElementById('print-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    const printDocument = printWindow.document;
    
    printDocument.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${printTitle}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px;
              color: #333;
            }
            .print-header { 
              text-align: center; 
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .print-title { 
              font-size: 24px; 
              font-weight: bold;
              margin-bottom: 5px;
            }
            .print-subtitle { 
              font-size: 14px; 
              color: #666;
              margin-bottom: 10px;
            }
            .print-date { 
              font-size: 12px; 
              color: #999;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left;
              font-size: 12px;
            }
            th { 
              background-color: #f5f5f5; 
              font-weight: bold;
            }
            .status-chip { 
              display: inline-block; 
              padding: 2px 8px; 
              border-radius: 12px; 
              font-size: 10px; 
              font-weight: bold;
              text-align: center;
            }
            .status-normal { background-color: #4caf50; color: white; }
            .status-low { background-color: #ff9800; color: white; }
            .status-out { background-color: #f44336; color: white; }
            .status-over { background-color: #2196f3; color: white; }
            .status-inactive { background-color: #9e9e9e; color: white; }
            .summary-section { 
              margin: 10px 0; 
              padding: 10px; 
              background-color: #f9f9f9; 
              border-radius: 4px;
            }
            .value-highlight { 
              font-weight: bold; 
              color: #1976d2; 
            }
            .inactive-section { 
              background-color: #f5f5f5; 
              border-left: 4px solid #9e9e9e;
              padding: 10px;
              margin: 10px 0;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printDocument.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    }, 250);
    
    setPrintDialogOpen(false);
  }, [printTitle]);

  const prepareMaterialsPrintContent = () => {
    const { active, inactive } = groupedMaterials;
    const currentDate = new Date().toLocaleDateString();
    
    return `
      <div class="print-header">
        <div class="print-title">Materials Inventory Report</div>
        <div class="print-subtitle">Inventory Management System</div>
        <div class="print-date">Generated on: ${currentDate}</div>
      </div>
      
      <div class="summary-section">
        <strong>Summary:</strong> ${active.length} Active Materials, ${inactive.length} Inactive Materials
        <br><strong>Total Material Value:</strong> <span class="value-highlight">ETB ${materialStats.totalValue.toLocaleString()}</span>
        <br><strong>Active Materials Value:</strong> ETB ${materialStats.activeValue.toLocaleString()}
        <br><strong>Inactive Materials Value:</strong> ETB ${materialStats.inactiveValue.toLocaleString()}
      </div>

      ${active.length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h3>Active Materials (${active.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Material Name</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Current Stock</th>
                <th>Inventory Value</th>
                <th>Stock Status</th>
              </tr>
            </thead>
            <tbody>
              ${active.map(material => {
                const currentStock = calculateMaterialStock(material.MaterialCode);
                const stockStatus = calculateMaterialStatus(material, currentStock);
                const inventoryValue = currentStock * (material.UnitPrice || 0);
                const statusClass = stockStatus.toLowerCase().includes('out') ? 'status-out' :
                                 stockStatus.toLowerCase().includes('low') ? 'status-low' :
                                 stockStatus.toLowerCase().includes('over') ? 'status-over' : 'status-normal';
                
                return `
                  <tr>
                    <td>${material.Material}</td>
                    <td>${material.Unit}</td>
                    <td>ETB ${material.UnitPrice?.toFixed(2) || '0.00'}</td>
                    <td>${currentStock.toLocaleString()}</td>
                    <td class="value-highlight">ETB ${inventoryValue.toFixed(2)}</td>
                    <td><span class="status-chip ${statusClass}">${stockStatus}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${inactive.length > 0 ? `
        <div class="inactive-section">
          <h3>Inactive Materials (${inactive.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Material Name</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Current Stock</th>
                <th>Inventory Value</th>
                <th>Stock Status</th>
              </tr>
            </thead>
            <tbody>
              ${inactive.map(material => {
                const currentStock = calculateMaterialStock(material.MaterialCode);
                const stockStatus = calculateMaterialStatus(material, currentStock);
                const inventoryValue = currentStock * (material.UnitPrice || 0);
                const statusClass = stockStatus.toLowerCase().includes('out') ? 'status-out' :
                                 stockStatus.toLowerCase().includes('low') ? 'status-low' :
                                 stockStatus.toLowerCase().includes('over') ? 'status-over' : 'status-normal';
                
                return `
                  <tr>
                    <td>${material.Material}</td>
                    <td>${material.Unit}</td>
                    <td>ETB ${material.UnitPrice?.toFixed(2) || '0.00'}</td>
                    <td>${currentStock.toLocaleString()}</td>
                    <td class="value-highlight">ETB ${inventoryValue.toFixed(2)}</td>
                    <td><span class="status-chip ${statusClass}">${stockStatus}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
    `;
  };

  const prepareProductsPrintContent = () => {
    const { active, inactive } = groupedProducts;
    const currentDate = new Date().toLocaleDateString();
    
    return `
      <div class="print-header">
        <div class="print-title">Products Inventory Report</div>
        <div class="print-subtitle">Inventory Management System</div>
        <div class="print-date">Generated on: ${currentDate}</div>
      </div>
      
      <div class="summary-section">
        <strong>Summary:</strong> ${active.length} Active Products, ${inactive.length} Inactive Products
        <br><strong>Total Product Value:</strong> <span class="value-highlight">ETB ${productStats.totalValue.toLocaleString()}</span>
        <br><strong>Active Products Value:</strong> ETB ${productStats.activeValue.toLocaleString()}
        <br><strong>Inactive Products Value:</strong> ETB ${productStats.inactiveValue.toLocaleString()}
      </div>

      ${active.length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h3>Active Products (${active.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Available Quantity</th>
                <th>Inventory Value</th>
                <th>Stock Status</th>
              </tr>
            </thead>
            <tbody>
              ${active.map(product => {
                const currentStock = calculateProductStock(product.ProductCode, product.Product);
                const stockStatus = calculateProductStatus(product, currentStock);
                const inventoryValue = currentStock * (product.ProductPrice || 0);
                const statusClass = stockStatus.toLowerCase().includes('out') ? 'status-out' :
                                 stockStatus.toLowerCase().includes('low') ? 'status-low' : 'status-normal';
                
                return `
                  <tr>
                    <td>${product.Product}</td>
                    <td>${product.Unit}</td>
                    <td>ETB ${product.ProductPrice?.toFixed(2) || '0.00'}</td>
                    <td>${currentStock.toLocaleString()}</td>
                    <td class="value-highlight">ETB ${inventoryValue.toFixed(2)}</td>
                    <td><span class="status-chip ${statusClass}">${stockStatus}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${inactive.length > 0 ? `
        <div class="inactive-section">
          <h3>Inactive Products (${inactive.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Available Quantity</th>
                <th>Inventory Value</th>
                <th>Stock Status</th>
              </tr>
            </thead>
            <tbody>
              ${inactive.map(product => {
                const currentStock = calculateProductStock(product.ProductCode, product.Product);
                const stockStatus = calculateProductStatus(product, currentStock);
                const inventoryValue = currentStock * (product.ProductPrice || 0);
                const statusClass = stockStatus.toLowerCase().includes('out') ? 'status-out' :
                                 stockStatus.toLowerCase().includes('low') ? 'status-low' : 'status-normal';
                
                return `
                  <tr>
                    <td>${product.Product}</td>
                    <td>${product.Unit}</td>
                    <td>ETB ${product.ProductPrice?.toFixed(2) || '0.00'}</td>
                    <td>${currentStock.toLocaleString()}</td>
                    <td class="value-highlight">ETB ${inventoryValue.toFixed(2)}</td>
                    <td><span class="status-chip ${statusClass}">${stockStatus}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
    `;
  };

  const prepareExpiredProductsPrintContent = () => {
    const currentDate = new Date().toLocaleDateString();
    
    return `
      <div class="print-header">
        <div class="print-title">Expired Products Report</div>
        <div class="print-subtitle">Inventory Management System</div>
        <div class="print-date">Generated on: ${currentDate}</div>
      </div>
      
      <div class="summary-section">
        <strong>Summary:</strong> ${expiredProducts.length} Expired Products
      </div>

      ${expiredProducts.length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h3>Expired Products (${expiredProducts.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Expire Date</th>
                <th>Available Quantity</th>
                <th>Inventory Value</th>
              </tr>
            </thead>
            <tbody>
              ${expiredProducts.map(product => {
                const currentStock = calculateProductStock(product.ProductCode, product.Product);
                const inventoryValue = currentStock * (product.ProductPrice || 0);
                
                return `
                  <tr>
                    <td>${product.Product}</td>
                    <td>${product.Unit}</td>
                    <td>ETB ${product.ProductPrice?.toFixed(2) || '0.00'}</td>
                    <td>${product.ExpireDate ? dayjs(product.ExpireDate).format('DD/MM/YYYY') : 'N/A'}</td>
                    <td>${currentStock.toLocaleString()}</td>
                    <td class="value-highlight">ETB ${inventoryValue.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : '<p>No expired products found.</p>'}
    `;
  };

  const prepareReorderStatusPrintContent = () => {
    const currentDate = new Date().toLocaleDateString();
    const activeReorderStatus = reorderStatus.filter(item => item.InventoryStatus === 'Active');
    const inactiveReorderStatus = reorderStatus.filter(item => item.InventoryStatus === 'Inactive');
    
    return `
      <div class="print-header">
        <div class="print-title">Material Reorder Status Report</div>
        <div class="print-subtitle">Inventory Management System</div>
        <div class="print-date">Generated on: ${currentDate}</div>
      </div>
      
      <div class="summary-section">
        <strong>Summary:</strong> ${reorderStatus.length} Materials Analyzed
        <br><strong>Active Materials:</strong> ${activeReorderStatus.length}
        <br><strong>Inactive Materials:</strong> ${inactiveReorderStatus.length}
      </div>

      ${activeReorderStatus.length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h3>Active Materials Reorder Status (${activeReorderStatus.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Current Stock</th>
                <th>Min Stock Level</th>
                <th>Max Stock Level</th>
                <th>Danger Level</th>
                <th>Reorder Point</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${activeReorderStatus.map(item => {
                const statusClass = item.Status.toLowerCase().includes('out') ? 'status-out' :
                                 item.Status.toLowerCase().includes('danger') ? 'status-out' :
                                 item.Status.toLowerCase().includes('low') ? 'status-low' : 'status-normal';
                
                return `
                  <tr>
                    <td>${item.Material.Material}</td>
                    <td>${item.AvailableStock.toLocaleString()}</td>
                    <td>${item.MinimumStockLevel.toLocaleString()}</td>
                    <td>${item.MaximumStockLevel.toLocaleString()}</td>
                    <td>${item.DangerStockLevel.toLocaleString()}</td>
                    <td>${item.ReorderPoint.toLocaleString()}</td>
                    <td><span class="status-chip ${statusClass}">${item.Status}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${inactiveReorderStatus.length > 0 ? `
        <div class="inactive-section">
          <h3>Inactive Materials Reorder Status (${inactiveReorderStatus.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Current Stock</th>
                <th>Min Stock Level</th>
                <th>Max Stock Level</th>
                <th>Danger Level</th>
                <th>Reorder Point</th>
                <th>Status</th>
                <th>Inventory Status</th>
              </tr>
            </thead>
            <tbody>
              ${inactiveReorderStatus.map(item => {
                const statusClass = item.Status.toLowerCase().includes('out') ? 'status-out' :
                                 item.Status.toLowerCase().includes('danger') ? 'status-out' :
                                 item.Status.toLowerCase().includes('low') ? 'status-low' : 'status-normal';
                
                return `
                  <tr>
                    <td>${item.Material.Material}</td>
                    <td>${item.AvailableStock.toLocaleString()}</td>
                    <td>${item.MinimumStockLevel.toLocaleString()}</td>
                    <td>${item.MaximumStockLevel.toLocaleString()}</td>
                    <td>${item.DangerStockLevel.toLocaleString()}</td>
                    <td>${item.ReorderPoint.toLocaleString()}</td>
                    <td><span class="status-chip ${statusClass}">${item.Status}</span></td>
                    <td><span class="status-chip status-inactive">Inactive</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
    `;
  };

  const prepareLowStockAlertsPrintContent = () => {
    const currentDate = new Date().toLocaleDateString();
    
    return `
      <div class="print-header">
        <div class="print-title">Low Stock Alerts Report</div>
        <div class="print-subtitle">Inventory Management System</div>
        <div class="print-date">Generated on: ${currentDate}</div>
      </div>
      
      <div class="summary-section">
        <strong>Critical Alerts Summary:</strong> 
        ${lowStockStats.total} Total Alerts - 
        ${lowStockStats.lowStock} Low Stock - 
        ${lowStockStats.outOfStock} Out of Stock - 
        ${lowStockStats.dangerLevel} Danger Level
        <br><strong>Note:</strong> Alerts are shown for active materials only.
      </div>

      <table>
        <thead>
          <tr>
            <th>Material</th>
            <th>Current Stock</th>
            <th>Min Stock</th>
            <th>Max Stock</th>
            <th>Status</th>
            <th>Action Required</th>
          </tr>
        </thead>
        <tbody>
          ${lowStockAlerts.map(item => {
            const statusClass = item.Status.toLowerCase().includes('out') ? 'status-out' :
                             item.Status.toLowerCase().includes('danger') ? 'status-out' : 'status-low';
            const actionRequired = item.Status === 'Out of Stock' || item.Status === 'Danger Level' ? 
                                 'URGENT REORDER' : 'Reorder Suggested';
            
            return `
              <tr>
                <td>${item.Material.Material}</td>
                <td>${item.AvailableStock.toLocaleString()}</td>
                <td>${item.MinimumStockLevel.toLocaleString()}</td>
                <td>${item.MaximumStockLevel.toLocaleString()}</td>
                <td><span class="status-chip ${statusClass}">${item.Status}</span></td>
                <td><strong>${actionRequired}</strong></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  };

  const prepareTransactionsPrintContent = () => {
    const currentDate = new Date().toLocaleDateString();
    const recentMaterialTransactions = safeArray(materialTransactions).slice(0, 20);
    const recentProductTransactions = safeArray(productTransactions).slice(0, 20);
    
    return `
      <div class="print-header">
        <div class="print-title">Recent Transactions Report</div>
        <div class="print-subtitle">Inventory Management System</div>
        <div class="print-date">Generated on: ${currentDate}</div>
      </div>
      
      <div class="summary-section">
        <strong>Transaction Summary:</strong> 
        ${recentMaterialTransactions.length} Material Transactions - 
        ${recentProductTransactions.length} Product Transactions
      </div>

      <div style="margin-bottom: 30px;">
        <h3>Material Transactions (Last ${recentMaterialTransactions.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Material</th>
              <th>Activity</th>
              <th>Quantity</th>
              <th>Date</th>
              <th>Batch</th>
            </tr>
          </thead>
          <tbody>
            ${recentMaterialTransactions.map(transaction => `
              <tr>
                <td>${transaction.materialData?.Material || transaction.Material}</td>
                <td>${transaction.Activity}</td>
                <td>${transaction.Quantity}</td>
                <td>${transaction.Date ? dayjs(transaction.Date).format('DD/MM/YYYY') : 'N/A'}</td>
                <td>${transaction.Batch || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div>
        <h3>Product Transactions (Last ${recentProductTransactions.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Activity</th>
              <th>Quantity</th>
              <th>Date</th>
              <th>Batch</th>
            </tr>
          </thead>
          <tbody>
            ${recentProductTransactions.map(transaction => `
              <tr>
                <td>${transaction.productData?.Product || transaction.Product}</td>
                <td>${transaction.Activity}</td>
                <td>${transaction.Quantity}</td>
                <td>${transaction.Date ? dayjs(transaction.Date).format('DD/MM/YYYY') : 'N/A'}</td>
                <td>${transaction.Batch || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const handlePrintClick = useCallback(() => {
    let content = '';
    let title = '';

    switch (activeTab) {
      case 0: // Materials
        content = prepareMaterialsPrintContent();
        title = 'Materials Inventory';
        break;
      case 1: // Products
        content = prepareProductsPrintContent();
        title = 'Products Inventory';
        break;
      case 2: // Expired Products
        content = prepareExpiredProductsPrintContent();
        title = 'Expired Products';
        break;
      case 3: // Reorder Status
        content = prepareReorderStatusPrintContent();
        title = 'Reorder Status';
        break;
      case 4: // Low Stock Alerts
        content = prepareLowStockAlertsPrintContent();
        title = 'Low Stock Alerts';
        break;
      case 5: // Transactions
        content = prepareTransactionsPrintContent();
        title = 'Recent Transactions';
        break;
      default:
        return;
    }

    setPrintTitle(title);
    setPrintContent(content);
    setPrintDialogOpen(true);
  }, [
    activeTab, 
    groupedMaterials, 
    groupedProducts, 
    reorderStatus, 
    lowStockAlerts, 
    materialTransactions, 
    productTransactions,
    calculateMaterialStock,
    calculateMaterialStatus,
    calculateProductStock,
    calculateProductStatus
  ]);

  // Enhanced status chip component
  const StatusChip = ({ status }) => {
    const getChipProps = () => {
      const statusStr = String(status || '').toLowerCase();
      switch (statusStr) {
        case 'normal':
        case 'active':
        case 'adequate':
          return { label: 'Normal', color: 'success' };
        case 'out_of_stock':
        case 'out of stock':
        case 'out-of-stock':
        case 'out':
          return { label: 'Out of Stock', color: 'error' };
        case 'low_stock':
        case 'low stock':
        case 'low-stock':
        case 'danger level':
        case 'low':
          return { label: 'Low Stock', color: 'warning' };
        case 'over_stock':
        case 'over stock':
        case 'over-stock':
        case 'over':
          return { label: 'Over Stock', color: 'info' };
        case 'inactive':
          return { label: 'Inactive', color: 'default' };
        default:
          return { label: status || 'Unknown', color: 'default' };
      }
    };

    const chipProps = getChipProps();
    return <Chip {...chipProps} size="small" />;
  };

  // NEW: Inventory Status Chip for Active/Inactive
  const InventoryStatusChip = ({ status }) => {
    const getChipProps = () => {
      switch (status) {
        case 'Active':
          return { label: 'Active', color: 'success' };
        case 'Inactive':
          return { label: 'Inactive', color: 'default' };
        default:
          return { label: status || 'Unknown', color: 'default' };
      }
    };

    const chipProps = getChipProps();
    return <Chip {...chipProps} size="small" variant="outlined" />;
  };

  // Enhanced filter handlers
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page on filter change
    }));
  }, []);

  const handlePageChange = useCallback((event, value) => {
    setFilters(prev => ({ ...prev, page: value }));
  }, []);

  const handleStatusFilterChange = useCallback((event) => {
    const newStatus = event.target.value;
    handleFilterChange('status', newStatus);
  }, [handleFilterChange]);

  // NEW: Handle inventory status filter change
  const handleInventoryStatusFilterChange = useCallback((event) => {
    const newInventoryStatus = event.target.value;
    handleFilterChange('inventoryStatus', newInventoryStatus);
  }, [handleFilterChange]);

  const resetFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: CONSTANTS.DEFAULT_PAGE_SIZE,
      search: '',
      status: '',
      material: '',
      inventoryStatus: 'all'
    });
    showNotification('info', 'Filters reset');
  }, [showNotification]);

  const handleRefresh = useCallback(() => {
    switch (activeTab) {
      case 0:
        Promise.all([fetchMaterials(), fetchMaterialTransactions()]);
        break;
      case 1:
        Promise.all([fetchProducts(), fetchProductTransactions()]);
        break;
      case 2:
        fetchProducts();
        break;
      case 3:
        // Reorder status is calculated from existing data
        showNotification('info', 'Reorder status recalculated');
        break;
      case 4:
        // Low stock alerts are calculated from existing data
        showNotification('info', 'Low stock alerts recalculated');
        break;
      case 5:
        Promise.all([fetchMaterialTransactions(), fetchProductTransactions()]);
        break;
      default:
        break;
    }
  }, [
    activeTab, 
    fetchMaterials, 
    fetchProducts,
    fetchMaterialTransactions, 
    fetchProductTransactions, 
    showNotification
  ]);

  // Tab change handler
  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
    setFilters(prev => ({ ...prev, page: 1, search: '', status: '', inventoryStatus: 'all' }));
  }, []);

  // Load data on component mount and tab change
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    switch (activeTab) {
      case 0: // Materials
        Promise.all([fetchMaterials(), fetchMaterialTransactions()]);
        break;
      case 1: // Products
        Promise.all([fetchProducts(), fetchProductTransactions()]);
        break;
      case 2: // Expired Products
        fetchProducts();
        break;
      case 3: // Reorder Status - calculated from existing data
      case 4: // Low Stock Alerts - calculated from existing data
        // These are calculated from the already fetched materials and transactions
        break;
      case 5: // Transactions
        Promise.all([fetchMaterialTransactions(), fetchProductTransactions()]);
        break;
      default:
        break;
    }
  }, [
    activeTab,
    fetchMaterials,
    fetchProducts,
    fetchMaterialTransactions,
    fetchProductTransactions
  ]);

  // UPDATED: Render materials table with NEW COLUMN ORDER and Active/Inactive sections
  const renderMaterialsTable = () => {
    const { active, inactive } = groupedMaterials;

    return (
      <Box>
        {/* Active Materials Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label="Active" color="success" size="small" />
            Active Materials ({active.length})
          </Typography>
          
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Material Name</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Unit</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Unit Price</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Current Stock</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Inventory Value</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Stock Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {active.map((material) => {
                  const currentStock = calculateMaterialStock(material.MaterialCode);
                  const stockStatus = calculateMaterialStatus(material, currentStock);
                  const inventoryValue = currentStock * (material.UnitPrice || 0);
                  
                  return (
                    <TableRow key={material._id} sx={{ height: '40px' }}>
                      <TableCell sx={{ padding: '8px' }}>
                        <Typography variant="body2" fontWeight="medium" fontSize="0.75rem">
                          {material.Material}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>{material.Unit}</TableCell>
                      <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>ETB {material.UnitPrice?.toFixed(2)}</TableCell>
                      <TableCell sx={{ padding: '8px' }}>
                        <Typography 
                          fontWeight="bold" 
                          fontSize="0.75rem"
                          color={
                            stockStatus === 'Out of Stock' ? 'error' : 
                            stockStatus === 'Low Stock' ? 'warning' : 'success'
                          }
                        >
                          {currentStock.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ padding: '8px' }}>
                        <Typography fontWeight="bold" color="primary" fontSize="0.75rem">
                          ETB {inventoryValue.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ padding: '8px' }}>
                        <StatusChip status={stockStatus} />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {active.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ padding: '8px' }}>
                      <Typography color="text.secondary" fontSize="0.75rem">No active materials found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Inactive Materials Section */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label="Inactive" color="default" size="small" />
            Inactive Materials ({inactive.length})
          </Typography>
          
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Material Name</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Unit</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Unit Price</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Current Stock</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Inventory Value</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Stock Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inactive.map((material) => {
                  const currentStock = calculateMaterialStock(material.MaterialCode);
                  const stockStatus = calculateMaterialStatus(material, currentStock);
                  const inventoryValue = currentStock * (material.UnitPrice || 0);
                  
                  return (
                    <TableRow key={material._id} sx={{ height: '40px' }}>
                      <TableCell sx={{ padding: '8px' }}>
                        <Typography variant="body2" fontWeight="medium" fontSize="0.75rem">
                          {material.Material}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>{material.Unit}</TableCell>
                      <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>ETB {material.UnitPrice?.toFixed(2)}</TableCell>
                      <TableCell sx={{ padding: '8px' }}>
                        <Typography 
                          fontWeight="bold" 
                          fontSize="0.75rem"
                          color={
                            stockStatus === 'Out of Stock' ? 'error' : 
                            stockStatus === 'Low Stock' ? 'warning' : 'success'
                          }
                        >
                          {currentStock.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ padding: '8px' }}>
                        <Typography fontWeight="bold" color="primary" fontSize="0.75rem">
                          ETB {inventoryValue.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ padding: '8px' }}>
                        <StatusChip status={stockStatus} />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {inactive.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ padding: '8px' }}>
                      <Typography color="text.secondary" fontSize="0.75rem">No inactive materials found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    );
  };

  // UPDATED: Render products table with NEW COLUMN ORDER and Active/Inactive sections - FIXED STOCK CALCULATION
  const renderProductsTable = () => {
    const { active, inactive } = groupedProducts;

    return (
      <Box>
        {/* Active Products Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label="Active" color="success" size="small" />
            Active Products ({active.length})
          </Typography>
          
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Product Name</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Unit</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Unit Price</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Available Quantity</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Inventory Value</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Stock Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {active.map((product) => {
                  const currentStock = calculateProductStock(product.ProductCode, product.Product);
                  const stockStatus = calculateProductStatus(product, currentStock);
                  const inventoryValue = currentStock * (product.ProductPrice || 0);
                  
                  return (
                    <TableRow key={product._id} sx={{ height: '40px' }}>
                      <TableCell sx={{ padding: '8px' }}>
                        <Typography variant="body2" fontWeight="medium" fontSize="0.75rem">
                          {product.Product}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>{product.Unit}</TableCell>
                      <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>ETB {product.ProductPrice?.toFixed(2)}</TableCell>
                      <TableCell sx={{ padding: '8px' }}>
                        <Typography 
                          fontWeight="bold" 
                          fontSize="0.75rem"
                          color={stockStatus === 'Out of Stock' ? 'error' : 'success'}
                        >
                          {currentStock.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ padding: '8px' }}>
                        <Typography fontWeight="bold" color="primary" fontSize="0.75rem">
                          ETB {inventoryValue.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ padding: '8px' }}>
                        <StatusChip status={stockStatus} />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {active.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ padding: '8px' }}>
                      <Typography color="text.secondary" fontSize="0.75rem">No active products found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Inactive Products Section */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label="Inactive" color="default" size="small" />
            Inactive Products ({inactive.length})
          </Typography>
          
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Product Name</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Unit</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Unit Price</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Available Quantity</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Inventory Value</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Stock Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inactive.map((product) => {
                  const currentStock = calculateProductStock(product.ProductCode, product.Product);
                  const stockStatus = calculateProductStatus(product, currentStock);
                  const inventoryValue = currentStock * (product.ProductPrice || 0);
                  
                  return (
                    <TableRow key={product._id} sx={{ height: '40px' }}>
                      <TableCell sx={{ padding: '8px' }}>
                        <Typography variant="body2" fontWeight="medium" fontSize="0.75rem">
                          {product.Product}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>{product.Unit}</TableCell>
                      <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>ETB {product.ProductPrice?.toFixed(2)}</TableCell>
                      <TableCell sx={{ padding: '8px' }}>
                        <Typography 
                          fontWeight="bold" 
                          fontSize="0.75rem"
                          color={stockStatus === 'Out of Stock' ? 'error' : 'success'}
                        >
                          {currentStock.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ padding: '8px' }}>
                        <Typography fontWeight="bold" color="primary" fontSize="0.75rem">
                          ETB {inventoryValue.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ padding: '8px' }}>
                        <StatusChip status={stockStatus} />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {inactive.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ padding: '8px' }}>
                      <Typography color="text.secondary" fontSize="0.75rem">No inactive products found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    );
  };

  // NEW: Render expired products table
  const renderExpiredProductsTable = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label="Expired" color="error" size="small" />
          Expired Products ({expiredProducts.length})
        </Typography>
        
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Product Name</TableCell>
                <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Unit</TableCell>
                <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Unit Price</TableCell>
                <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Expire Date</TableCell>
                <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Available Quantity</TableCell>
                <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Inventory Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expiredProducts.map((product) => {
                const currentStock = calculateProductStock(product.ProductCode, product.Product);
                const inventoryValue = currentStock * (product.ProductPrice || 0);
                
                return (
                  <TableRow key={product._id} sx={{ height: '40px', backgroundColor: 'error.light' }}>
                    <TableCell sx={{ padding: '8px' }}>
                      <Typography variant="body2" fontWeight="medium" fontSize="0.75rem">
                        {product.Product}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>{product.Unit}</TableCell>
                    <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>ETB {product.ProductPrice?.toFixed(2)}</TableCell>
                    <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>
                      {product.ExpireDate ? dayjs(product.ExpireDate).format('DD/MM/YYYY') : 'N/A'}
                    </TableCell>
                    <TableCell sx={{ padding: '8px' }}>
                      <Typography fontWeight="bold" fontSize="0.75rem" color="error">
                        {currentStock.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ padding: '8px' }}>
                      <Typography fontWeight="bold" color="primary" fontSize="0.75rem">
                        ETB {inventoryValue.toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              {expiredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ padding: '8px' }}>
                    <Typography color="text.secondary" fontSize="0.75rem">No expired products found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  // UPDATED: Render reorder status table - INCLUDING INACTIVE
  const renderReorderStatusTable = () => {
    const activeReorderStatus = reorderStatus.filter(item => item.InventoryStatus === 'Active');
    const inactiveReorderStatus = reorderStatus.filter(item => item.InventoryStatus === 'Inactive');

    return (
      <Box>
        {/* Active Materials Reorder Status */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label="Active" color="success" size="small" />
            Active Materials Reorder Status ({activeReorderStatus.length})
          </Typography>
          
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Material</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Current Stock</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Min Stock Level</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Max Stock Level</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Danger Level</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Reorder Point</TableCell>
                  <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeReorderStatus.map((item) => (
                  <TableRow key={item._id} sx={{ height: '40px' }}>
                    <TableCell sx={{ padding: '8px' }}>
                      <Typography variant="body2" fontWeight="medium" fontSize="0.75rem">
                        {item.Material.Material}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>{item.AvailableStock.toLocaleString()}</TableCell>
                    <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>{item.MinimumStockLevel.toLocaleString()}</TableCell>
                    <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>{item.MaximumStockLevel.toLocaleString()}</TableCell>
                    <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>{item.DangerStockLevel.toLocaleString()}</TableCell>
                    <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>{item.ReorderPoint.toLocaleString()}</TableCell>
                    <TableCell sx={{ padding: '8px' }}>
                      <StatusChip status={item.Status} />
                    </TableCell>
                  </TableRow>
                ))}
                {activeReorderStatus.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ padding: '8px' }}>
                      <Typography color="text.secondary" fontSize="0.75rem">No active materials reorder status found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Inactive Materials Reorder Status */}
        {inactiveReorderStatus.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="Inactive" color="default" size="small" />
              Inactive Materials Reorder Status ({inactiveReorderStatus.length})
            </Typography>
            
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Material</TableCell>
                    <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Current Stock</TableCell>
                    <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Min Stock Level</TableCell>
                    <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Max Stock Level</TableCell>
                    <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Danger Level</TableCell>
                    <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Reorder Point</TableCell>
                    <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Inventory Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inactiveReorderStatus.map((item) => (
                    <TableRow key={item._id} sx={{ height: '40px' }}>
                      <TableCell sx={{ padding: '8px' }}>
                        <Typography variant="body2" fontWeight="medium" fontSize="0.75rem">
                          {item.Material.Material}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>{item.AvailableStock.toLocaleString()}</TableCell>
                      <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>{item.MinimumStockLevel.toLocaleString()}</TableCell>
                      <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>{item.MaximumStockLevel.toLocaleString()}</TableCell>
                      <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>{item.DangerStockLevel.toLocaleString()}</TableCell>
                      <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>{item.ReorderPoint.toLocaleString()}</TableCell>
                      <TableCell sx={{ padding: '8px' }}>
                        <StatusChip status={item.Status} />
                      </TableCell>
                      <TableCell sx={{ padding: '8px' }}>
                        <InventoryStatusChip status={item.InventoryStatus} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Enhanced Notification System */}
      <NotificationSystem 
        notifications={notifications} 
        onClose={closeNotification}
      />

      {/* Print Dialog */}
      <PrintDialog
        open={printDialogOpen}
        onClose={() => setPrintDialogOpen(false)}
        title={printTitle}
        content={<div dangerouslySetInnerHTML={{ __html: printContent }} />}
        onPrint={handlePrint}
      />

      {/* Formula Dialog (Renamed from ReorderFormulasDialog) */}
      <FormulaDialog
        open={formulasDialogOpen}
        onClose={() => setFormulasDialogOpen(false)}
      />

      {/* Header with Clickable Formulas Info */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InventoryIcon fontSize="medium" />
              Inventory Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Comprehensive inventory tracking with real-time transaction data
            </Typography>
          </Box>
          <Button
            startIcon={<InfoIcon />}
            onClick={() => setFormulasDialogOpen(true)}
            variant="outlined"
            color="primary"
            size="small"
            sx={{ fontSize: '0.75rem' }}
          >
            Formula
          </Button>
        </Box>
      </Box>

      {/* Summary Cards - Reduced Size */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ minHeight: 100 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="caption" fontSize="0.7rem">
                    Total Materials
                  </Typography>
                  <Typography variant="h6">{displayStats.materials}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    <Chip label={`${materialStats.activeCount} Active`} color="success" size="small" sx={{ height: 20, fontSize: '0.6rem' }} />
                    <Chip label={`${materialStats.inactiveCount} Inactive`} color="default" size="small" sx={{ height: 20, fontSize: '0.6rem' }} />
                  </Box>
                </Box>
                <StorageIcon color="primary" sx={{ fontSize: 30 }} />
              </Box>
              {loading.materials && <LinearProgress sx={{ mt: 1 }} />}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card sx={{ minHeight: 100 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="caption" fontSize="0.7rem">
                    Total Products
                  </Typography>
                  <Typography variant="h6">{displayStats.products}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    <Chip label={`${productStats.activeCount} Active`} color="success" size="small" sx={{ height: 20, fontSize: '0.6rem' }} />
                    <Chip label={`${productStats.inactiveCount} Inactive`} color="default" size="small" sx={{ height: 20, fontSize: '0.6rem' }} />
                  </Box>
                </Box>
                <InventoryIcon color="secondary" sx={{ fontSize: 30 }} />
              </Box>
              {loading.products && <LinearProgress sx={{ mt: 1 }} />}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card sx={{ minHeight: 100 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="caption" fontSize="0.7rem">
                    Total Inventory Value
                  </Typography>
                  <Typography variant="h6">ETB {(displayStats.inventoryValue || 0).toLocaleString()}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`ETB ${(displayStats.materialValue || 0).toLocaleString()} Materials`} 
                      color="info" 
                      size="small" 
                      sx={{ height: 20, fontSize: '0.6rem' }}
                    />
                    <Chip 
                      label={`ETB ${(displayStats.productValue || 0).toLocaleString()} Products`} 
                      color="success" 
                      size="small" 
                      sx={{ height: 20, fontSize: '0.6rem' }}
                    />
                  </Box>
                </Box>
                <TrendingUpIcon color="info" sx={{ fontSize: 30 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card sx={{ minHeight: 100 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="caption" fontSize="0.7rem">
                    Critical Alerts
                  </Typography>
                  <Typography variant="h6">{displayStats.lowStock}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    <Chip label={`${lowStockStats.lowStock} Low`} color="warning" size="small" sx={{ height: 20, fontSize: '0.6rem' }} />
                    <Chip label={`${lowStockStats.outOfStock} Out`} color="error" size="small" sx={{ height: 20, fontSize: '0.6rem' }} />
                  </Box>
                </Box>
                <ShippingIcon color="error" sx={{ fontSize: 30 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* NEW: Expired Products Card */}
        <Grid item xs={6} sm={3}>
          <Card sx={{ minHeight: 100, backgroundColor: 'error.light' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="white" gutterBottom variant="caption" fontSize="0.7rem">
                    Expired Products
                  </Typography>
                  <Typography variant="h6" color="white">{displayStats.expiredProducts}</Typography>
                  <Typography variant="caption" color="white" sx={{ mt: 0.5, display: 'block' }}>
                    Requires immediate attention
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 30, color: 'white' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs with Enhanced Controls */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ minHeight: 'auto' }}>
            <Tab label="Materials" sx={{ minHeight: 'auto', padding: '8px 16px', fontSize: '0.8rem' }} />
            <Tab label="Products" sx={{ minHeight: 'auto', padding: '8px 16px', fontSize: '0.8rem' }} />
            <Tab label="Expired Products" sx={{ minHeight: 'auto', padding: '8px 16px', fontSize: '0.8rem' }} />
            <Tab label="Reorder Status" sx={{ minHeight: 'auto', padding: '8px 16px', fontSize: '0.8rem' }} />
            <Tab label="Low Stock Alerts" sx={{ minHeight: 'auto', padding: '8px 16px', fontSize: '0.8rem' }} />
            <Tab label="Transactions" sx={{ minHeight: 'auto', padding: '8px 16px', fontSize: '0.8rem' }} />
          </Tabs>
          
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {/* Print Button */}
            <Tooltip title="Print Report">
              <IconButton
                onClick={handlePrintClick}
                size="small"
                disabled={
                  (activeTab === 0 && materials.length === 0) ||
                  (activeTab === 1 && products.length === 0) ||
                  (activeTab === 2 && expiredProducts.length === 0) ||
                  (activeTab === 3 && reorderStatus.length === 0) ||
                  (activeTab === 4 && lowStockAlerts.length === 0) ||
                  (activeTab === 5 && materialTransactions.length === 0 && productTransactions.length === 0)
                }
              >
                <PrintIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Enhanced Filter Toggle - Icon Only */}
            <Tooltip title="Toggle Filters">
              <IconButton
                onClick={() => setShowFilters(!showFilters)}
                size="small"
                color={showFilters ? "primary" : "default"}
              >
                <FilterListIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Enhanced Action Buttons - Icon Only */}
            <Tooltip title="Refresh">
              <IconButton 
                onClick={handleRefresh} 
                disabled={Object.values(loading).some(Boolean)}
                size="small"
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Enhanced Filters Section */}
        <Collapse in={showFilters}>
          <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiInputBase-root': { height: '40px' } }}
                />
              </Grid>
              
              {/* NEW: Inventory Status Filter for Materials and Products tabs */}
              {(activeTab === 0 || activeTab === 1) && (
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth size="small" sx={{ '& .MuiInputBase-root': { height: '40px' } }}>
                    <InputLabel>Inventory Status</InputLabel>
                    <Select
                      value={filters.inventoryStatus}
                      label="Inventory Status"
                      onChange={handleInventoryStatusFilterChange}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="Active">Active Only</MenuItem>
                      <MenuItem value="Inactive">Inactive Only</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              {(activeTab === 3 || activeTab === 4) && ( // Reorder Status and Low Stock Alerts filters
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth size="small" sx={{ '& .MuiInputBase-root': { height: '40px' } }}>
                    <InputLabel>Status Filter</InputLabel>
                    <Select
                      value={filters.status}
                      label="Status Filter"
                      onChange={handleStatusFilterChange}
                    >
                      <MenuItem value="">All Status</MenuItem>
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Low Stock">Low Stock</MenuItem>
                      <MenuItem value="Out of Stock">Out of Stock</MenuItem>
                      <MenuItem value="Danger Level">Danger Level</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Button
                    variant="outlined"
                    onClick={resetFilters}
                    size="small"
                    sx={{ height: '40px' }}
                  >
                    Reset
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Collapse>

        {/* Tab Content */}
        <Box sx={{ p: 2 }}>
          {/* Materials Tab - UPDATED with NEW COLUMN ORDER and Active/Inactive sections */}
          {activeTab === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Materials Inventory</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  <Chip 
                    label={`${materialStats.activeCount} Active`} 
                    color="success" 
                    size="small" 
                    variant="outlined" 
                    sx={{ height: '24px', fontSize: '0.7rem' }}
                  />
                  <Chip 
                    label={`${materialStats.inactiveCount} Inactive`} 
                    color="default" 
                    size="small" 
                    variant="outlined" 
                    sx={{ height: '24px', fontSize: '0.7rem' }}
                  />
                  <Chip 
                    label={`ETB ${materialStats.totalValue.toLocaleString()} Total Value`} 
                    color="primary" 
                    size="small" 
                    variant="outlined" 
                    sx={{ height: '24px', fontSize: '0.7rem' }}
                  />
                </Box>
              </Box>

              {(loading.materials || loading.materialTransactions) ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                renderMaterialsTable()
              )}
            </Box>
          )}

          {/* Products Tab - UPDATED with NEW COLUMN ORDER and Active/Inactive sections - FIXED STOCK CALCULATION */}
          {activeTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Product Inventory</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  <Chip 
                    label={`${productStats.activeCount} Active`} 
                    color="success" 
                    size="small" 
                    variant="outlined" 
                    sx={{ height: '24px', fontSize: '0.7rem' }}
                  />
                  <Chip 
                    label={`${productStats.inactiveCount} Inactive`} 
                    color="default" 
                    size="small" 
                    variant="outlined" 
                    sx={{ height: '24px', fontSize: '0.7rem' }}
                  />
                  <Chip 
                    label={`ETB ${productStats.totalValue.toLocaleString()} Total Value`} 
                    color="primary" 
                    size="small" 
                    variant="outlined" 
                    sx={{ height: '24px', fontSize: '0.7rem' }}
                  />
                </Box>
              </Box>

              {(loading.products || loading.productTransactions) ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                renderProductsTable()
              )}
            </Box>
          )}

          {/* NEW: Expired Products Tab */}
          {activeTab === 2 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">Expired Products</Typography>
                  <Chip 
                    label={`${expiredProducts.length} Items`} 
                    color="error" 
                    size="small" 
                    sx={{ height: '24px', fontSize: '0.7rem' }}
                  />
                </Box>
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={() => fetchProducts()}
                  disabled={loading.products}
                  variant="outlined"
                  size="small"
                >
                  {loading.products ? <CircularProgress size={16} /> : 'Refresh'}
                </Button>
              </Box>

              {loading.products ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                renderExpiredProductsTable()
              )}
            </Box>
          )}

          {/* Reorder Status Tab - UPDATED to include inactive */}
          {activeTab === 3 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">Material Reorder Status</Typography>
                  <Tooltip title="View Formula">
                    <IconButton 
                      size="small" 
                      onClick={() => setFormulasDialogOpen(true)}
                      color="primary"
                    >
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                    Calculated from MaterialRI transaction data
                  </Typography>
                </Box>
              </Box>

              {(loading.materials || loading.materialTransactions) ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                renderReorderStatusTable()
              )}
            </Box>
          )}

          {/* Low Stock Alerts Tab - Only active items */}
          {activeTab === 4 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">Low Stock Alerts</Typography>
                  <Tooltip title="View Formula">
                    <IconButton 
                      size="small" 
                      onClick={() => setFormulasDialogOpen(true)}
                      color="primary"
                    >
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                    Calculated from MaterialRI transaction data (Active items only)
                  </Typography>
                </Box>
              </Box>

              {(loading.materials || loading.materialTransactions) ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Material</TableCell>
                        <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Current Stock</TableCell>
                        <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Min Stock</TableCell>
                        <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Max Stock</TableCell>
                        <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Status</TableCell>
                        <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Action Required</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lowStockAlerts.map((item) => (
                        <TableRow key={item._id} sx={{ 
                          height: '40px',
                          backgroundColor: item.Status === 'Out of Stock' ? 'error.light' : 
                                          item.Status === 'Danger Level' ? 'error.light' : 'warning.light'
                        }}>
                          <TableCell sx={{ padding: '8px' }}>
                            <Typography variant="body2" fontWeight="medium" fontSize="0.75rem">
                              {item.Material.Material}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>{item.AvailableStock.toLocaleString()}</TableCell>
                          <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>{item.MinimumStockLevel.toLocaleString()}</TableCell>
                          <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>{item.MaximumStockLevel.toLocaleString()}</TableCell>
                          <TableCell sx={{ padding: '8px' }}>
                            <StatusChip status={item.Status} />
                          </TableCell>
                          <TableCell sx={{ padding: '8px' }}>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color={
                                item.Status === 'Out of Stock' || item.Status === 'Danger Level' ? 'error' : 'warning'
                              }
                              sx={{ fontSize: '0.7rem', height: '24px' }}
                            >
                              {item.Status === 'Out of Stock' || item.Status === 'Danger Level' ? 'Urgent Reorder' : 'Reorder'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {lowStockAlerts.length === 0 && !loading.materials && (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ padding: '8px' }}>
                            <Typography color="text.secondary" fontSize="0.75rem">No low stock materials found</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Transactions Tab - FIXED: Added Material/Product Code columns */}
          {activeTab === 5 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Recent Transactions</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom fontSize="1rem">Material Transactions</Typography>
                  {loading.materialTransactions ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Material</TableCell>
                            <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Activity</TableCell>
                            <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Quantity</TableCell>
                            <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Date</TableCell>
                            <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Batch</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {safeArray(materialTransactions).slice(0, 10).map((transaction) => (
                            <TableRow key={transaction._id} sx={{ height: '40px' }}>
                              <TableCell sx={{ padding: '8px' }}>
                                <Typography variant="body2" fontSize="0.75rem">
                                  {transaction.materialData?.Material || transaction.Material}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ padding: '8px' }}>
                                <Chip 
                                  label={transaction.Activity} 
                                  size="small"
                                  sx={{ height: '20px', fontSize: '0.6rem' }}
                                  color={
                                    transaction.Activity.includes('Receive') ? 'success' : 
                                    transaction.Activity.includes('Issue') ? 'error' : 'default'
                                  }
                                />
                              </TableCell>
                              <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>{transaction.Quantity}</TableCell>
                              <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>
                                {transaction.Date ? dayjs(transaction.Date).format('DD/MM/YYYY') : 'N/A'}
                              </TableCell>
                              <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>{transaction.Batch || 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                          {safeArray(materialTransactions).length === 0 && !loading.materialTransactions && (
                            <TableRow>
                              <TableCell colSpan={5} align="center" sx={{ padding: '8px' }}>
                                <Typography color="text.secondary" fontSize="0.75rem">No material transactions found</Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom fontSize="1rem">Product Transactions</Typography>
                  {loading.productTransactions ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Product</TableCell>
                            <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Activity</TableCell>
                            <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Quantity</TableCell>
                            <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Date</TableCell>
                            <TableCell sx={{ padding: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Batch</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {safeArray(productTransactions).slice(0, 10).map((transaction) => (
                            <TableRow key={transaction._id} sx={{ height: '40px' }}>
                              <TableCell sx={{ padding: '8px' }}>
                                <Typography variant="body2" fontSize="0.75rem">
                                  {transaction.productData?.Product || transaction.Product}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ padding: '8px' }}>
                                <Chip 
                                  label={transaction.Activity} 
                                  size="small"
                                  sx={{ height: '20px', fontSize: '0.6rem' }}
                                  color={
                                    transaction.Activity.includes('Receive') ? 'success' : 
                                    transaction.Activity.includes('Issue') ? 'error' : 'default'
                                  }
                                />
                              </TableCell>
                              <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>{transaction.Quantity}</TableCell>
                              <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>
                                {transaction.Date ? dayjs(transaction.Date).format('DD/MM/YYYY') : 'N/A'}
                              </TableCell>
                              <TableCell sx={{ padding: '8px', fontSize: '0.75rem' }}>{transaction.Batch || 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                          {safeArray(productTransactions).length === 0 && !loading.productTransactions && (
                            <TableRow>
                              <TableCell colSpan={5} align="center" sx={{ padding: '8px' }}>
                                <Typography color="text.secondary" fontSize="0.75rem">No product transactions found</Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Inventory;