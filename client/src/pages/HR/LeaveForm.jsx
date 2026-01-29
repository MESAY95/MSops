import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Typography
} from '@mui/material';
import {
  DatePicker,
  LocalizationProvider
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';

const LeaveForm = ({ leave, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    employee: '',
    leaveType: '',
    startDate: null,
    endDate: null,
    reason: '',
    status: 'pending',
    comments: ''
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [duration, setDuration] = useState(0);

  const leaveTypes = [
    { value: 'sick', label: 'Sick Leave' },
    { value: 'vacation', label: 'Vacation Leave' },
    { value: 'personal', label: 'Personal Leave' },
    { value: 'maternity', label: 'Maternity Leave' },
    { value: 'paternity', label: 'Paternity Leave' },
    { value: 'other', label: 'Other' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  // Fetch employees for dropdown
  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/employees');
      setEmployees(response.data.employees || response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees');
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Initialize form with leave data if editing
  useEffect(() => {
    if (leave) {
      setFormData({
        employee: leave.employee?._id || leave.employee || '',
        leaveType: leave.leaveType,
        startDate: new Date(leave.startDate),
        endDate: new Date(leave.endDate),
        reason: leave.reason,
        status: leave.status,
        comments: leave.comments || ''
      });
      calculateDuration(new Date(leave.startDate), new Date(leave.endDate));
    }
  }, [leave]);

  // Calculate duration when dates change
  const calculateDuration = (start, end) => {
    if (start && end) {
      setCalculating(true);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDuration(diffDays);
      setCalculating(false);
    } else {
      setDuration(0);
    }
  };

  const handleChange = (field) => (event) => {
    const value = event?.target?.value ?? event;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Recalculate duration if dates change
    if (field === 'startDate' || field === 'endDate') {
      const start = field === 'startDate' ? value : formData.startDate;
      const end = field === 'endDate' ? value : formData.endDate;
      calculateDuration(start, end);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.employee || !formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (formData.endDate < formData.startDate) {
      setError('End date cannot be before start date');
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString()
      };

      if (leave) {
        // Update existing leave
        await axios.put(`http://localhost:5000/api/leaves/${leave._id}`, submitData);
      } else {
        // Create new leave
        await axios.post('http://localhost:5000/api/leaves', submitData);
      }

      onSave();
    } catch (error) {
      console.error('Error saving leave:', error);
      setError(error.response?.data?.message || 'Failed to save leave request');
    } finally {
      setLoading(false);
    }
  };

  const getLeaveTypeColor = (type) => {
    const colors = {
      sick: 'error',
      vacation: 'success',
      personal: 'info',
      maternity: 'secondary',
      paternity: 'primary',
      other: 'warning'
    };
    return colors[type] || 'default';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Employee Selection */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Employee</InputLabel>
              <Select
                value={formData.employee}
                onChange={handleChange('employee')}
                label="Employee"
              >
                {employees.map((emp) => (
                  <MenuItem key={emp._id} value={emp._id}>
                    {emp.employeeId} - {emp.firstName} {emp.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Leave Type */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Leave Type</InputLabel>
              <Select
                value={formData.leaveType}
                onChange={handleChange('leaveType')}
                label="Leave Type"
              >
                {leaveTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Start Date */}
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Start Date"
              value={formData.startDate}
              onChange={handleChange('startDate')}
              renderInput={(params) => <TextField {...params} fullWidth required />}
            />
          </Grid>

          {/* End Date */}
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="End Date"
              value={formData.endDate}
              onChange={handleChange('endDate')}
              renderInput={(params) => <TextField {...params} fullWidth required />}
            />
          </Grid>

          {/* Duration Display */}
          <Grid item xs={12}>
            <Box sx={{ 
              p: 2, 
              bgcolor: 'background.default', 
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Typography variant="body1">
                Leave Duration:
              </Typography>
              {calculating ? (
                <CircularProgress size={20} />
              ) : (
                <Typography 
                  variant="h6" 
                  color="primary"
                  fontWeight="bold"
                >
                  {duration} day{duration !== 1 ? 's' : ''}
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Reason */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Reason"
              value={formData.reason}
              onChange={handleChange('reason')}
              required
              multiline
              rows={3}
            />
          </Grid>

          {/* Status (for editing/approval) */}
          {leave && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={handleChange('status')}
                  label="Status"
                >
                  {statusOptions.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Comments */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Comments"
              value={formData.comments}
              onChange={handleChange('comments')}
              multiline
              rows={2}
              placeholder="Additional comments or notes..."
            />
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            onClick={onCancel}
            variant="outlined"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              background: `linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)`,
            }}
          >
            {loading ? <CircularProgress size={24} /> : (leave ? 'Update Leave' : 'Submit Leave')}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default LeaveForm;