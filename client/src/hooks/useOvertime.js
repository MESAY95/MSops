import { useState, useCallback, useMemo } from 'react';
import { format, parseISO, isValid } from 'date-fns';

export const useOvertimeAPI = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchRecords = useCallback(async (filters = {}) => {
        setLoading(true);
        setError(null);
        
        try {
            const queryParams = new URLSearchParams({
                ...filters,
                limit: filters.limit || 50,
                page: filters.page || 1
            }).toString();

            const response = await fetch(`/api/overtimemanagements?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateStatus = useCallback(async (recordId, status, remarks = '') => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/overtimemanagements/${recordId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status, remarks })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const batchUpdate = useCallback(async (recordIds, action, remarks = '') => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/overtimemanagements/batch/approve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ recordIds, action, remarks })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        fetchRecords,
        updateStatus,
        batchUpdate
    };
};

export const useOvertimeFilters = (initialFilters = {}) => {
    const [filters, setFilters] = useState(initialFilters);

    const updateFilter = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters(initialFilters);
    }, [initialFilters]);

    const hasActiveFilters = useMemo(() => {
        return Object.keys(filters).some(key => {
            const value = filters[key];
            if (value === null || value === undefined || value === '') return false;
            if (Array.isArray(value) && value.length === 0) return false;
            return true;
        });
    }, [filters]);

    return {
        filters,
        updateFilter,
        resetFilters,
        hasActiveFilters
    };
};

export const formatOvertimeData = (record) => {
    return {
        id: record._id,
        date: record.overtimeDate ? format(parseISO(record.overtimeDate), 'MMM dd, yyyy') : '',
        timeRange: record.startTime && record.endTime 
            ? `${format(parseISO(record.startTime), 'hh:mm a')} - ${format(parseISO(record.endTime), 'hh:mm a')}`
            : '',
        hours: record.hoursWorked?.toFixed(2) || '0.00',
        amount: new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: record.currency || 'ETB',
            minimumFractionDigits: 2
        }).format(record.calculatedAmount || 0),
        status: record.status || 'Pending',
        type: record.overtimeType || 'Regular',
        employee: {
            name: record.employeeName || '',
            id: record.employeeId || '',
            department: record.department || ''
        },
        reason: record.reason || '',
        remarks: record.remarks || '',
        attachments: record.attachmentName ? [{
            name: record.attachmentName,
            url: record.attachment?.url || '',
            id: record._id
        }] : []
    };
};