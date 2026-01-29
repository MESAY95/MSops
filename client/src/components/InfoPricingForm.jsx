import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,           // Layout container for spacing and flexbox
  Card,           // Card component for form container
  Grid,           // Responsive grid system for layout
  TextField,      // Material-UI text input field
  Button,         // Material-UI button component
  Typography,     // Material-UI typography for text
  MenuItem,       // Dropdown menu item
  FormControl,    // Form wrapper with validation styling
  InputLabel,     // Form field labels
  Select,         // Material-UI select dropdown
  Paper,          // Material-UI paper for summary preview
  FormHelperText, // Helper text for form validation messages
  Divider,        // Visual divider line
  InputAdornment   // Icons and elements inside input fields
} from '@mui/material';
import { 
  Save,           // Save icon for submit button
  AttachMoney,    // Money icon for value field
  Scale,          // Scale icon (unused but imported)
  Description,    // Description icon for text field
  Category        // Category icon (unused but imported)
} from '@mui/icons-material';

/**
 * Constants outside component to prevent recreation on every render
 * These are static reference data used throughout the form
 */
const CATEGORIES = [
  'Raw Material',     // Direct material costs
  'Packaging',        // Packaging and container costs
  'Labor',            // Workforce and labor expenses
  'Overhead',         // Indirect business expenses
  'Transport',        // Shipping and logistics costs
  'Utility',          // Utilities like electricity, water
  'Other'             // Miscellaneous costs
];

const UNITS = [
  'ETB',              // Ethiopian Birr currency
  'ETB/kg',           // Cost per kilogram
  'ETB/pcs',          // Cost per piece
  'ETB/liter',        // Cost per liter
  'ETB/hour',         // Cost per hour
  'kg',               // Kilograms (quantity)
  'pcs',              // Pieces (quantity)
  'liter',            // Liters (quantity)
  'hour',             // Hours (time)
  'month',            // Monthly cost
  'unit',             // Generic unit
  'batch'             // Batch production
];

/**
 * Initial form data structure with empty/default values
 * This prevents undefined errors and provides consistent state
 */
const INITIAL_FORM_DATA = {
  description: '',        // Pricing item description
  productType: '',        // Associated product ID
  materialId: '',         // Associated material ID
  value: '',              // Cost value (numeric)
  unit: '',               // Measurement unit
  remark: '',             // Additional notes
  category: ''            // Cost category
};

/**
 * InfoPricingForm Component
 * A comprehensive form for creating pricing information records
 * Includes product/material selection, validation, and API integration
 * 
 * Props:
 * - onSuccess: Callback function when form saves successfully
 * - onError: Callback function when errors occur
 */
const InfoPricingForm = ({ onSuccess, onError }) => {
  // Form state management
  const [loading, setLoading] = useState(false);           // Loading state for submit button
  const [products, setProducts] = useState([]);             // List of available products
  const [materials, setMaterials] = useState([]);           // List of available materials
  const [materialSearch, setMaterialSearch] = useState(''); // Search term for material filtering
  
  // Form data and validation state
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);  // Current form values
  const [errors, setErrors] = useState({});                     // Field validation errors
  const [touched, setTouched] = useState({});                   // Track which fields have been interacted with

  /**
   * Memoized form field validation function
   * Validates individual fields based on business rules
   * Uses useCallback to prevent unnecessary re-renders
   * 
   * @param {string} name - Field name to validate
   * @param {any} value - Field value to validate
   * @returns {boolean} - True if form is valid after validation
   */
  const validateField = useCallback((name, value) => {
    const newErrors = { ...errors };
    
    // Switch statement for field-specific validation rules
    switch (name) {
      case 'description':
        // Required field with character limit
        if (!value.trim()) newErrors.description = 'Description is required';
        else if (value.length > 500) newErrors.description = 'Description must be less than 500 characters';
        else delete newErrors.description;
        break;
        
      case 'productType':
        // Required product selection (cannot be null/undefined)
        if (value === undefined || value === null) newErrors.productType = 'Product selection is required';
        else delete newErrors.productType;
        break;
        
      case 'category':
        // Required category selection
        if (!value) newErrors.category = 'Category is required';
        else delete newErrors.category;
        break;
        
      case 'value':
        // Numeric validation with positive value requirement
        const numValue = parseFloat(value);
        if (!value || numValue <= 0) newErrors.value = 'Value must be greater than 0';
        else if (isNaN(numValue)) newErrors.value = 'Value must be a valid number';
        else delete newErrors.value;
        break;
        
      case 'unit':
        // Required unit with character limit
        if (!value.trim()) newErrors.unit = 'Unit is required';
        else if (value.length > 10) newErrors.unit = 'Unit must be less than 10 characters';
        else delete newErrors.unit;
        break;
        
      default:
        // Skip validation for non-critical fields like remarks
        break;
    }
    
    // Update errors state and return validation result
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [errors]);

  /**
   * Memoized data fetcher for products
   * Fetches active products from API for dropdown selection
   * Uses useCallback to prevent recreation on every render
   */
  const fetchProducts = useCallback(async () => {
    try {
      // API call with query parameters for active products and specific fields
      const response = await fetch('/api/products?active=true&fields=name,sku,category,_id');
      if (response.ok) {
        const data = await response.json();
        // Set products state, default to empty array if no data
        setProducts(data.data || []);
      }
    } catch (error) {
      // Error handling with console logging and user notification
      console.error('Error fetching products:', error);
      onError('Error loading products: ' + error.message);
    }
  }, [onError]);

  /**
   * Memoized data fetcher for materials with search functionality
   * Fetches materials based on search term and active status
   * Includes pricing and specifications for display in dropdown
   */
  const fetchMaterials = useCallback(async () => {
    try {
      // Dynamic API endpoint with search parameter
      const response = await fetch(`/api/materials?search=${materialSearch}&active=true&fields=name,sku,category,pricing,specifications,_id`);
      if (response.ok) {
        const data = await response.json();
        // Set materials state, default to empty array if no data
        setMaterials(data.data || []);
      }
    } catch (error) {
      // Error handling with console logging and user notification
      console.error('Error fetching materials:', error);
      onError('Error loading materials: ' + error.message);
    }
  }, [materialSearch, onError]);

  /**
   * Debounced material search effect
   * Waits 300ms after user stops typing before fetching materials
   * Prevents excessive API calls during typing
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMaterials();
    }, 300); // 300ms debounce delay

    // Cleanup function to clear timeout on unmount or dependency change
    return () => clearTimeout(timer);
  }, [materialSearch, fetchMaterials]);

  /**
   * Initial products fetch on component mount
   * Runs once when component mounts to populate product dropdown
   */
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /**
   * Optimized input change handler
   * Updates form data and validates field if it has been touched
   * Uses useCallback to prevent unnecessary re-renders
   * 
   * @param {string} field - Form field name
   * @param {any} value - New field value
   */
  const handleInputChange = useCallback((field, value) => {
    // Update form data immutably using spread operator
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Validate field only if user has interacted with it
    if (touched[field]) {
      validateField(field, value);
    }
  }, [touched, validateField]);

  /**
   * Field blur handler
   * Marks field as touched and triggers validation
   * Validation runs when user leaves the field (onBlur)
   * 
   * @param {string} field - Form field name
   */
  const handleBlur = useCallback((field) => {
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
    // Validate current field value
    validateField(field, formData[field]);
  }, [formData, validateField]);

  /**
   * Memoized form validity checker
   * Determines if entire form is valid for submission
   * Uses useMemo to prevent recalculation unless dependencies change
   */
  const isFormValid = useMemo(() => {
    return (
      // Check all required fields have values
      formData.description && 
      formData.productType !== undefined && 
      formData.productType !== null && 
      formData.category && 
      formData.value && 
      parseFloat(formData.value) > 0 && 
      formData.unit &&
      // Ensure no validation errors exist
      Object.keys(errors).length === 0
    );
  }, [formData, errors]);

  /**
   * Memoized function to get selected product display name
   * Formats product name and category for dropdown display
   * Handles 'None' selection and missing data gracefully
   */
  const getSelectedProductName = useCallback(() => {
    // Handle 'None' selection
    if (formData.productType === 'None') return 'None';
    // Find selected product in products array
    const product = products.find(p => p._id === formData.productType);
    // Return formatted display string or empty string
    return product ? `${product.name} (${(product.category || '').replace(/_/g, ' ')})` : '';
  }, [formData.productType, products]);

  /**
   * Memoized function to get selected material display name
   * Formats material name and SKU for dropdown display
   * Handles 'None' and empty selections
   */
  const getSelectedMaterialName = useCallback(() => {
    // Handle 'None' selection
    if (formData.materialId === 'None') return 'None';
    // Find selected material in materials array
    const material = materials.find(m => m._id === formData.materialId);
    // Return formatted display string or empty string
    return material ? `${material.name || 'Unnamed Material'} - ${material.sku || 'No SKU'}` : '';
  }, [formData.materialId, materials]);

  /**
   * Form submission handler
   * Validates all fields, prepares data, and submits to API
   * Handles success/error responses and form reset
   * 
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    
    // Mark all required fields as touched for validation
    const allTouched = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'remark') { // Skip remarks validation
        allTouched[key] = true;
      }
    });
    setTouched(allTouched);
    
    // Validate all required fields
    const isValid = Object.keys(formData)
      .filter(key => key !== 'remark') // Exclude remarks from validation
      .every(key => validateField(key, formData[key]));
    
    // Show error if validation fails
    if (!isValid) {
      onError('Please fix the validation errors before submitting.');
      return;
    }

    // Set loading state to disable form during submission
    setLoading(true);

    try {
      // Prepare submission data with data cleaning
      const submitData = {
        description: formData.description.trim(),                    // Trim whitespace
        productType: formData.productType === 'None' ? '' : formData.productType, // Convert 'None' to empty string
        materialId: formData.materialId === 'None' ? null : formData.materialId,  // Convert 'None' to null
        value: parseFloat(formData.value),                          // Convert to number
        unit: formData.unit.trim(),                                 // Trim whitespace
        remark: formData.remark.trim(),                             // Trim whitespace
        category: formData.category                                 // Category selection
      };

      // Remove empty/null/undefined fields from submission
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' || submitData[key] === null || submitData[key] === undefined) {
          delete submitData[key];
        }
      });

      // API POST request to create pricing record
      const response = await fetch('/api/info-pricings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Set JSON content type
        },
        body: JSON.stringify(submitData) // Stringify data for transmission
      });

      const result = await response.json(); // Parse response

      // Handle success response
      if (response.ok) {
        // Notify parent component of successful save
        onSuccess('Pricing information saved successfully!');
        // Reset form to initial state
        setFormData(INITIAL_FORM_DATA);
        setTouched({});
        setErrors({});
      } else {
        // Handle API validation errors
        if (result.errors && Array.isArray(result.errors)) {
          throw new Error(result.errors.join(', '));
        }
        // Handle generic API errors
        throw new Error(result.message || 'Failed to save pricing information');
      }
    } catch (error) {
      // Display error message to user via parent callback
      onError(error.message || 'Error saving pricing information');
    } finally {
      // Always reset loading state when operation completes
      setLoading(false);
    }
  };

  /**
   * Form reset handler
   * Clears all form fields and validation state
   * Uses useCallback to prevent recreation
   */
  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setTouched({});
    setErrors({});
  }, []);

  /**
   * Memoized product options for dropdown
   * Creates MenuItem components for each product
   * Includes product name, SKU, and category display
   * Uses useMemo to prevent recreation unless products change
   */
  const productOptions = useMemo(() => 
    products.map(product => (
      <MenuItem key={product._id} value={product._id}>
        <Box> {/* Container for multi-line display */}
          <Typography variant="body1">
            {product.name || 'Unnamed Product'} {/* Fallback for missing name */}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {/* Secondary information with fallbacks */}
            SKU: {product.sku || 'No SKU'} • {(product.category || '').replace(/_/g, ' ')}
          </Typography>
        </Box>
      </MenuItem>
    )), [products]
  );

  /**
   * Memoized material options for dropdown
   * Creates MenuItem components for each material
   * Includes material name, SKU, category, and pricing info
   * Uses useMemo to prevent recreation unless materials change
   */
  const materialOptions = useMemo(() => 
    materials.map(material => (
      <MenuItem key={material._id} value={material._id}>
        <Box> {/* Container for multi-line display */}
          <Typography variant="body1">
            {/* Primary material information */}
            {material.name || 'Unnamed Material'} - {material.sku || 'No SKU'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {/* Secondary pricing and specification info */}
            {material.category || 'No Category'} • 
            {material.pricing?.currentPrice || 'N/A'} 
            {material.pricing?.currency || ''}/
            {material.specifications?.unit || 'unit'}
          </Typography>
        </Box>
      </MenuItem>
    )), [materials]
  );

  /**
   * Memoized condition to show summary preview
   * Shows preview when key fields have values
   * Uses useMemo for performance optimization
   */
  const showSummaryPreview = useMemo(() => 
    formData.description || formData.productType || formData.materialId,
    [formData.description, formData.productType, formData.materialId]
  );

  // JSX Structure - Main component render
  return (
    <Box> {/* Main container with full width */}
      {/* Page Header */}
      <Typography variant="h5" gutterBottom color="primary">
        Pricing Information Record
      </Typography>
      
      {/* Page Description */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Record pricing information including product and material associations, costs, and categories.
      </Typography>
      
      {/* Main Form Container */}
      <Card sx={{ p: 3 }}> {/* Card with padding for form content */}
        <form onSubmit={handleSubmit}> {/* Form element with submit handler */}
          <Grid container spacing={3}> {/* Responsive grid layout */}
            
            {/* Description Field - Full Width */}
            <Grid item xs={12}>
              <TextField
                fullWidth                    // Take full available width
                label="Description *"        // Field label with required indicator
                value={formData.description} // Controlled input value
                onChange={(e) => handleInputChange('description', e.target.value)} // Input change handler
                onBlur={() => handleBlur('description')} // Blur validation trigger
                error={touched.description && !!errors.description} // Show error styling
                helperText={
                  // Conditional helper text: error or default message
                  touched.description ? 
                    errors.description || 
                    "Enter a detailed description of this pricing item" : 
                    "Enter a detailed description of this pricing item"
                }
                required                    // HTML5 required attribute
                InputProps={{                // Input adornments and props
                  startAdornment: (         // Icon before input
                    <InputAdornment position="start">
                      <Description color="action" />
                    </InputAdornment>
                  ),
                }}
                placeholder="e.g., Raw honey cost per kg, Packaging labor cost, etc."
              />
            </Grid>

            {/* Product Selection - Half Width on Medium Screens */}
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth 
                required 
                error={touched.productType && !!errors.productType}
              >
                <InputLabel>Concern Product *</InputLabel>
                <Select
                  value={formData.productType} // Controlled select value
                  label="Concern Product *"    // Label for accessibility
                  onChange={(e) => handleInputChange('productType', e.target.value)} // Change handler
                  onBlur={() => handleBlur('productType')} // Blur validation
                  renderValue={(selected) => { // Custom display for selected value
                    if (selected === 'None') return 'None';
                    const product = products.find(p => p._id === selected);
                    // Format display text for selected product
                    return product ? 
                      `${product.name} (${(product.category || '').replace(/_/g, ' ')})` : 
                      'Select Product';
                  }}
                >
                  {/* None option for general costs */}
                  <MenuItem value="None">
                    <em>None (General Cost)</em>
                  </MenuItem>
                  <Divider /> {/* Visual separator */}
                  {productOptions} {/* Render memoized product options */}
                </Select>
                {/* Error message display */}
                {touched.productType && errors.productType && (
                  <FormHelperText>{errors.productType}</FormHelperText>
                )}
                {/* Default helper text */}
                <FormHelperText>
                  Select the product this cost applies to, or "None" for general costs
                </FormHelperText>
              </FormControl>
            </Grid>

            {/* Category Selection - Half Width on Medium Screens */}
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth 
                required 
                error={touched.category && !!errors.category}
              >
                <InputLabel>Category *</InputLabel>
                <Select
                  value={formData.category} // Controlled select value
                  label="Category *"        // Label for accessibility
                  onChange={(e) => handleInputChange('category', e.target.value)} // Change handler
                  onBlur={() => handleBlur('category')} // Blur validation
                >
                  {/* Map through CATEGORIES constant */}
                  {CATEGORIES.map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
                {/* Error message display */}
                {touched.category && errors.category && (
                  <FormHelperText>{errors.category}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Material Selection - Full Width */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel shrink={!!formData.materialId}>
                  Concern Material
                </InputLabel>
                <Select
                  value={formData.materialId} // Controlled select value
                  label="Concern Material"    // Label for accessibility
                  onChange={(e) => handleInputChange('materialId', e.target.value)} // Change handler
                  displayEmpty                // Show placeholder when empty
                  renderValue={(selected) => { // Custom display for selected value
                    if (selected === 'None') return 'None';
                    if (!selected) return 'Select Material (Optional)';
                    const material = materials.find(m => m._id === selected);
                    // Format display text for selected material
                    return material ? 
                      `${material.name || 'Unnamed Material'} - ${material.sku || 'No SKU'}` : 
                      'Select Material';
                  }}
                >
                  {/* Empty option */}
                  <MenuItem value="">
                    <em>None (No Material)</em>
                  </MenuItem>
                  {/* Explicit None option */}
                  <MenuItem value="None">
                    <em>None (Explicit)</em>
                  </MenuItem>
                  <Divider /> {/* Visual separator */}
                  {materialOptions} {/* Render memoized material options */}
                </Select>
                {/* Helper text for optional field */}
                <FormHelperText>
                  Optional: Select the material this cost applies to
                </FormHelperText>
              </FormControl>
            </Grid>

            {/* Value Field - Half Width on Medium Screens */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Value *"              // Required field label
                type="number"               // HTML5 number input
                value={formData.value}      // Controlled input value
                onChange={(e) => handleInputChange('value', e.target.value)} // Change handler
                onBlur={() => handleBlur('value')} // Blur validation
                error={touched.value && !!errors.value} // Error styling
                helperText={touched.value && errors.value} // Error message
                required                    // HTML5 required attribute
                InputProps={{               // Input configuration
                  startAdornment: (        // Money icon
                    <InputAdornment position="start">
                      <AttachMoney color="action" />
                    </InputAdornment>
                  ),
                  inputProps: {           // Number input constraints
                    min: 0,               // Minimum value
                    step: 0.0001,         // Decimal precision
                    placeholder: "0.0000" // Display placeholder
                  }
                }}
              />
            </Grid>
            
            {/* Unit Selection - Half Width on Medium Screens */}
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth 
                required 
                error={touched.unit && !!errors.unit}
              >
                <InputLabel>Unit *</InputLabel>
                <Select
                  value={formData.unit}     // Controlled select value
                  label="Unit *"            // Label for accessibility
                  onChange={(e) => handleInputChange('unit', e.target.value)} // Change handler
                  onBlur={() => handleBlur('unit')} // Blur validation
                >
                  {/* Map through UNITS constant */}
                  {UNITS.map(unit => (
                    <MenuItem key={unit} value={unit}>
                      {unit}
                    </MenuItem>
                  ))}
                </Select>
                {/* Error message display */}
                {touched.unit && errors.unit && (
                  <FormHelperText>{errors.unit}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Remarks Field - Full Width */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"             // Optional field label
                multiline                  // Multi-line text input
                rows={3}                    // Initial row count
                value={formData.remark}     // Controlled input value
                onChange={(e) => handleInputChange('remark', e.target.value)} // Change handler
                placeholder="Additional notes, calculation methodology, or special instructions (optional)"
                helperText="Optional notes about this pricing information"
              />
            </Grid>

            {/* Summary Preview Section - Conditional Render */}
            {showSummaryPreview && (
              <Grid item xs={12}>
                <Paper sx={{ 
                  p: 2, 
                  backgroundColor: 'grey.50', // Light background
                  border: 1, 
                  borderColor: 'grey.300'     // Subtle border
                }}>
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    Summary Preview {/* Section header */}
                  </Typography>
                  <Grid container spacing={1}> {/* Compact grid for summary */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Description:</strong> {formData.description || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Product:</strong> {getSelectedProductName() || 'Not selected'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Material:</strong> {getSelectedMaterialName() || 'Not selected'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Category:</strong> {formData.category || 'Not selected'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Value:</strong> {formData.value ? `${formData.value} ${formData.unit}` : 'Not provided'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}
            
            {/* Action Buttons - Full Width */}
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'flex-end', // Right-align buttons
                pt: 2 // Top padding
              }}>
                {/* Reset/Clear Button */}
                <Button
                  type="button"           // Prevent form submission
                  variant="outlined"      // Outlined style
                  onClick={resetForm}     // Reset form handler
                  disabled={loading}      // Disabled during submission
                >
                  Clear Form
                </Button>
                
                {/* Submit Button */}
                <Button
                  type="submit"           // Triggers form submission
                  variant="contained"     // Filled style
                  startIcon={<Save />}    // Save icon
                  disabled={loading || !isFormValid} // Disabled if loading or invalid
                  size="large"            // Larger button size
                >
                  {/* Dynamic button text */}
                  {loading ? 'Saving...' : 'Save Pricing Information'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Card>
    </Box>
  );
};

/**
 * Export as React.memo for performance optimization
 * Prevents re-renders when props haven't changed
 * Memoization helps with form performance in larger applications
 */
export default React.memo(InfoPricingForm);