import { useState, useEffect, useCallback } from 'react';

// Global cache for all components
const globalEmployeeCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useEmployeeService = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch employees by department with caching
    const fetchEmployeesByDepartment = useCallback(async (department, forceRefresh = false) => {
        const cacheKey = `employees_${department}`;
        const cached = globalEmployeeCache.get(cacheKey);

        // Return cached data if available and not expired
        if (cached && !forceRefresh && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            return cached.data;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/employeemanagements?departmentName=${encodeURIComponent(department)}&employmentStatus=Active&limit=1000`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch employees: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            let employees = [];
            if (data.employees && Array.isArray(data.employees)) {
                employees = data.employees;
            } else if (Array.isArray(data)) {
                employees = data;
            }

            // Ensure required fields
            const processedEmployees = employees.map(emp => ({
                _id: emp._id,
                employeeId: emp.employeeId,
                fullName: emp.fullName || `${emp.firstName} ${emp.middleName ? emp.middleName + ' ' : ''}${emp.lastName}`.trim(),
                firstName: emp.firstName,
                lastName: emp.lastName,
                position: emp.position,
                basicSalary: emp.basicSalary || emp.baseSalary || 0,
                department: emp.departmentName || emp.department || department,
                email: emp.email,
                phone: emp.phone,
                employmentStatus: emp.employmentStatus || 'Active',
                employmentType: emp.employmentType,
                profileImage: emp.profileImage
            }));

            // Cache the results
            globalEmployeeCache.set(cacheKey, {
                timestamp: Date.now(),
                data: processedEmployees
            });

            return processedEmployees;
        } catch (err) {
            console.error('Error fetching employees:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Get employee by ID
    const getEmployeeById = useCallback(async (employeeId) => {
        // First check all caches
        for (const [key, cached] of globalEmployeeCache.entries()) {
            const employee = cached.data.find(emp => emp.employeeId === employeeId);
            if (employee) return employee;
        }

        // If not found in cache, fetch from API
        try {
            const response = await fetch(`/api/employeemanagements?employeeId=${employeeId}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch employee: ${response.statusText}`);
            }
            
            const data = await response.json();
            const employees = data.employees || data.data || [];
            
            if (employees.length > 0) {
                return employees[0];
            }
            
            return null;
        } catch (err) {
            console.error('Error fetching employee:', err);
            throw err;
        }
    }, []);

    // Clear cache for specific department
    const clearDepartmentCache = (department) => {
        const keysToDelete = [];
        for (const [key] of globalEmployeeCache.entries()) {
            if (key.includes(department) || key === 'all') {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => globalEmployeeCache.delete(key));
    };

    // Clear all cache
    const clearAllCache = () => {
        globalEmployeeCache.clear();
    };

    return {
        fetchEmployeesByDepartment,
        getEmployeeById,
        clearDepartmentCache,
        clearAllCache,
        loading,
        error
    };
};