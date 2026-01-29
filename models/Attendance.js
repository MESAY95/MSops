import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        ref: 'EmployeeManagement'
    },
    employeeName: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    employmentType: {
        type: String,
        enum: ['Full-Time', 'Part-Time', 'Contractor', 'Temporary', 'Intern', 'Permanent'],
        default: 'Full-Time'
    },
    position: {
        type: String,
        default: ''
    },
    date: {
        type: Date,
        required: true
    },
    checkIn: {
        type: Date
    },
    checkOut: {
        type: Date
    },
    totalHours: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late', 'Half-day', 'Annual Leave', 'Sick Leave', 'Other Leave'],
        default: 'Present'
    },
    leaveType: {
        type: String,
        enum: ['None', 'Annual Leave', 'Sick Leave', 'Casual Leave', 'Emergency Leave', 'Other'],
        default: 'None'
    },
    notes: {
        type: String,
        default: ''
    },
    overtime: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: String,
        default: 'System'
    },
    updatedBy: {
        type: String,
        default: 'System'
    }
}, {
    timestamps: true
});

// Compound index to ensure one attendance record per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Indexes for better query performance - sorted by date ascending
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ employeeId: 1, date: 1 });
attendanceSchema.index({ department: 1, date: 1 });
attendanceSchema.index({ status: 1, date: 1 });
attendanceSchema.index({ employmentType: 1, date: 1 });

// Pre-save middleware to calculate total hours and overtime (deduct 1 hour for lunch)
attendanceSchema.pre('save', function(next) {
    // Validate that date is not in the future (beyond today)
    if (this.date) {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        if (this.date > today) {
            return next(new Error('Cannot create attendance records for future dates beyond today'));
        }
    }
    
    // Calculate total hours if check-in and check-out are provided
    if (this.checkIn && this.checkOut && 
        (this.status === 'Present' || this.status === 'Late' || this.status === 'Half-day')) {
        const diff = this.checkOut.getTime() - this.checkIn.getTime();
        let totalHours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
        
        // Deduct 1 hour for lunch
        totalHours = Math.max(0, totalHours - 1);
        
        this.totalHours = totalHours;
        
        // Calculate overtime based on employment type
        let standardHours = 8;
        if (this.employmentType === 'Part-Time') {
            standardHours = 6;
        } else if (this.employmentType === 'Contractor') {
            standardHours = this.totalHours;
        }
        
        this.overtime = this.totalHours > standardHours ? parseFloat((this.totalHours - standardHours).toFixed(2)) : 0;
        
        // For half-day, adjust total hours
        if (this.status === 'Half-day') {
            this.totalHours = Math.min(this.totalHours, 4);
            this.overtime = 0;
        }
    } else {
        // Reset hours for non-present statuses
        this.totalHours = 0;
        this.overtime = 0;
        this.checkIn = null;
        this.checkOut = null;
    }
    
    // Set leave type based on status
    if (this.status === 'Annual Leave') {
        this.leaveType = 'Annual Leave';
    } else if (this.status === 'Sick Leave') {
        this.leaveType = 'Sick Leave';
    } else if (this.status === 'Other Leave') {
        this.leaveType = this.leaveType || 'Other';
    } else if (this.status !== 'Annual Leave' && this.status !== 'Sick Leave' && this.status !== 'Other Leave') {
        this.leaveType = 'None';
    }
    
    next();
});

// Pre-update middleware
attendanceSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    
    // Check if date is being updated to a future date (beyond today)
    if (update.date) {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        if (update.date > today) {
            return next(new Error('Cannot update attendance record to a future date beyond today'));
        }
    }
    
    // If check-in or check-out is being updated, recalculate hours
    if (update.checkIn || update.checkOut || update.status || update.employmentType) {
        update.$set = update.$set || {};
        update.$set.updatedAt = new Date();
    }
    
    next();
});

// Virtual for formatted date
attendanceSchema.virtual('formattedDate').get(function() {
    if (!this.date) return '';
    const month = String(this.date.getMonth() + 1).padStart(2, '0');
    const day = String(this.date.getDate()).padStart(2, '0');
    const year = this.date.getFullYear();
    return `${month}/${day}/${year}`;
});

// Virtual for formatted check-in time
attendanceSchema.virtual('formattedCheckIn').get(function() {
    if (!this.checkIn) return '';
    return this.checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

// Virtual for formatted check-out time
attendanceSchema.virtual('formattedCheckOut').get(function() {
    if (!this.checkOut) return '';
    return this.checkOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

// Static method to create bulk attendance for date range
attendanceSchema.statics.createBulkRange = async function(data) {
    const {
        startDate,
        endDate,
        employeeIds,
        status,
        checkIn,
        checkOut,
        leaveType,
        notes,
        createdBy
    } = data;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const results = {
        success: [],
        errors: [],
        totalProcessed: 0,
        totalDays: 0
    };

    // Validate dates are not in the future (beyond today)
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (start > today) {
        throw new Error('Start date cannot be in the future beyond today');
    }
    
    if (end > today) {
        throw new Error('End date cannot be in the future beyond today');
    }

    // Generate all dates in the range
    const dates = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    results.totalDays = dates.length;

    // Process each employee
    for (const employeeId of employeeIds) {
        try {
            // Find employee by employeeId (string)
            const employee = await mongoose.model('EmployeeManagement').findOne({ 
                employeeId: employeeId 
            });
            
            if (!employee) {
                results.errors.push({
                    employeeId,
                    message: 'Employee not found'
                });
                continue;
            }

            // Process each date for this employee
            for (const date of dates) {
                try {
                    // Check if date is in the future
                    if (date > today) {
                        results.errors.push({
                            employeeId: employee.employeeId,
                            date: date.toISOString().split('T')[0],
                            message: 'Cannot create attendance for future dates beyond today'
                        });
                        continue;
                    }

                    // Create date object for query
                    const queryDate = new Date(date);
                    queryDate.setHours(0, 0, 0, 0);
                    
                    const nextDay = new Date(queryDate);
                    nextDay.setDate(nextDay.getDate() + 1);

                    // Check if attendance already exists
                    const existingAttendance = await this.findOne({
                        employeeId: employee.employeeId,
                        date: {
                            $gte: queryDate,
                            $lt: nextDay
                        }
                    });

                    if (existingAttendance) {
                        // Update existing record
                        existingAttendance.status = status;
                        existingAttendance.leaveType = leaveType || 'None';
                        existingAttendance.notes = notes || '';
                        existingAttendance.updatedBy = createdBy || 'System';
                        
                        if (status === 'Present' || status === 'Late' || status === 'Half-day') {
                            existingAttendance.checkIn = checkIn ? new Date(checkIn) : null;
                            existingAttendance.checkOut = checkOut ? new Date(checkOut) : null;
                        } else {
                            existingAttendance.checkIn = null;
                            existingAttendance.checkOut = null;
                        }
                        
                        await existingAttendance.save();
                        results.success.push({
                            employeeId: employee.employeeId,
                            employeeName: employee.fullName || `${employee.firstName} ${employee.lastName}`,
                            date: date.toISOString().split('T')[0],
                            action: 'updated',
                            attendanceId: existingAttendance._id
                        });
                    } else {
                        // Create new record
                        const attendanceData = {
                            employeeId: employee.employeeId,
                            employeeName: employee.fullName || `${employee.firstName} ${employee.lastName}`,
                            department: employee.departmentName || '',
                            employmentType: employee.employmentType || 'Full-Time',
                            position: employee.position || '',
                            date: date,
                            checkIn: (status === 'Present' || status === 'Late' || status === 'Half-day') 
                                ? (checkIn ? new Date(checkIn) : null) : null,
                            checkOut: (status === 'Present' || status === 'Late' || status === 'Half-day') 
                                ? (checkOut ? new Date(checkOut) : null) : null,
                            status,
                            leaveType: leaveType || 'None',
                            notes: notes || '',
                            createdBy: createdBy || 'System'
                        };

                        const attendance = new this(attendanceData);
                        await attendance.save();
                        
                        results.success.push({
                            employeeId: employee.employeeId,
                            employeeName: employee.fullName || `${employee.firstName} ${employee.lastName}`,
                            date: date.toISOString().split('T')[0],
                            action: 'created',
                            attendanceId: attendance._id
                        });
                    }
                    
                    results.totalProcessed++;
                } catch (error) {
                    console.error(`Error processing employee ${employee.employeeId} for date ${date}:`, error);
                    results.errors.push({
                        employeeId: employee.employeeId,
                        date: date.toISOString().split('T')[0],
                        message: error.message,
                        errorCode: error.code
                    });
                }
            }
        } catch (error) {
            console.error(`Error processing employee ${employeeId}:`, error);
            results.errors.push({
                employeeId,
                message: error.message
            });
        }
    }

    return results;
};

// NEW: Static method to delete records by IDs
attendanceSchema.statics.deleteByIds = async function(recordIds) {
    try {
        // Validate all IDs
        const validIds = recordIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        
        if (validIds.length === 0) {
            throw new Error('No valid record IDs provided');
        }

        // Delete records
        const result = await this.deleteMany({
            _id: { $in: validIds }
        });

        return {
            deletedCount: result.deletedCount,
            validIdsCount: validIds.length,
            invalidIdsCount: recordIds.length - validIds.length
        };
    } catch (error) {
        console.error('Error in deleteByIds:', error);
        throw error;
    }
};

// NEW: Static method to get records for deletion
attendanceSchema.statics.getRecordsForDeletion = async function(filters) {
    const {
        startDate,
        endDate,
        employeeIds,
        department,
        employmentType,
        status
    } = filters;

    // Build query
    const query = {};
    
    if (startDate && endDate) {
        query.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }
    
    if (employeeIds && employeeIds.length > 0) {
        query.employeeId = { $in: employeeIds };
    }
    
    if (department) {
        query.department = department;
    }
    
    if (employmentType) {
        query.employmentType = employmentType;
    }
    
    if (status) {
        query.status = status;
    }

    // Fetch records with minimal fields
    const records = await this.find(query)
        .select('_id employeeId employeeName department date status totalHours notes')
        .sort({ date: 1, employeeId: 1 })
        .lean();

    return records;
};

// Static method to get attendance summary
attendanceSchema.statics.getSummary = async function(startDate, endDate, department, employmentType) {
    const matchQuery = {};
    
    if (startDate && endDate) {
        matchQuery.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }
    
    if (department) {
        matchQuery.department = department;
    }
    
    if (employmentType) {
        matchQuery.employmentType = employmentType;
    }
    
    const summary = await this.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: null,
                totalRecords: { $sum: 1 },
                totalPresent: { 
                    $sum: { 
                        $cond: [
                            { $in: ['$status', ['Present', 'Late', 'Half-day']] },
                            1, 0
                        ]
                    }
                },
                totalAbsent: { 
                    $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] }
                },
                totalLate: { 
                    $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] }
                },
                totalHalfDay: { 
                    $sum: { $cond: [{ $eq: ['$status', 'Half-day'] }, 1, 0] }
                },
                totalAnnualLeave: { 
                    $sum: { $cond: [{ $eq: ['$status', 'Annual Leave'] }, 1, 0] }
                },
                totalSickLeave: { 
                    $sum: { $cond: [{ $eq: ['$status', 'Sick Leave'] }, 1, 0] }
                },
                totalOtherLeave: { 
                    $sum: { $cond: [{ $eq: ['$status', 'Other Leave'] }, 1, 0] }
                },
                avgHours: { $avg: '$totalHours' },
                totalOvertime: { $sum: '$overtime' }
            }
        }
    ]);
    
    const result = summary[0] || {
        totalRecords: 0,
        totalPresent: 0,
        totalAbsent: 0,
        totalLate: 0,
        totalHalfDay: 0,
        totalAnnualLeave: 0,
        totalSickLeave: 0,
        totalOtherLeave: 0,
        avgHours: 0,
        totalOvertime: 0
    };
    
    // Calculate attendance rate
    const totalPresentEquivalent = result.totalPresent + (result.totalHalfDay * 0.5);
    result.attendanceRate = result.totalRecords > 0 
        ? Math.round((totalPresentEquivalent / result.totalRecords) * 100) 
        : 0;
    
    result.totalOnLeave = result.totalAnnualLeave + result.totalSickLeave + result.totalOtherLeave;
    
    return result;
};

// Static method to get employee summary (all days including absent)
attendanceSchema.statics.getEmployeeSummary = async function(startDate, endDate) {
    const matchQuery = {};
    
    if (startDate && endDate) {
        matchQuery.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }
    
    const summary = await this.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: {
                    employeeId: '$employeeId',
                    employeeName: '$employeeName',
                    department: '$department',
                    employmentType: '$employmentType'
                },
                totalDays: { $sum: 1 },
                presentDays: { 
                    $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
                },
                lateDays: { 
                    $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] }
                },
                halfDays: { 
                    $sum: { $cond: [{ $eq: ['$status', 'Half-day'] }, 1, 0] }
                },
                leaveDays: { 
                    $sum: { 
                        $cond: [
                            { $in: ['$status', ['Annual Leave', 'Sick Leave', 'Other Leave']] },
                            1, 0
                        ]
                    }
                },
                absentDays: { 
                    $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] }
                },
                avgHours: { $avg: '$totalHours' },
                totalOvertime: { $sum: '$overtime' }
            }
        },
        {
            $project: {
                employeeId: '$_id.employeeId',
                employeeName: '$_id.employeeName',
                department: '$_id.department',
                employmentType: '$_id.employmentType',
                totalDays: 1,
                presentDays: 1,
                lateDays: 1,
                halfDays: 1,
                leaveDays: 1,
                absentDays: 1,
                avgHours: { $round: ['$avgHours', 2] },
                totalOvertime: { $round: ['$totalOvertime', 2] },
                attendanceRate: {
                    $cond: [
                        { $eq: [{ $subtract: ['$totalDays', '$absentDays'] }, 0] },
                        0,
                        { 
                            $multiply: [
                                { 
                                    $divide: [
                                        '$presentDays',
                                        { $subtract: ['$totalDays', '$absentDays'] }
                                    ]
                                },
                                100
                            ]
                        }
                    ]
                }
            }
        },
        { $sort: { employeeName: 1 } }
    ]);
    
    return summary;
};

// Static method to get employee attendance statistics
attendanceSchema.statics.getEmployeeAttendance = async function(employeeId, startDate, endDate) {
    const matchQuery = { employeeId: employeeId };
    
    if (startDate && endDate) {
        matchQuery.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }
    
    const attendance = await this.find(matchQuery).sort({ date: 1 });
    
    // Calculate statistics
    let totalDays = attendance.length;
    let presentDays = 0;
    let lateDays = 0;
    let halfDays = 0;
    let leaveDays = 0;
    let absentDays = 0;
    let totalHours = 0;
    let totalOvertime = 0;

    attendance.forEach(record => {
        switch(record.status) {
            case 'Present':
                presentDays++;
                break;
            case 'Late':
                lateDays++;
                presentDays++;
                break;
            case 'Half-day':
                halfDays++;
                presentDays += 0.5;
                break;
            case 'Annual Leave':
            case 'Sick Leave':
            case 'Other Leave':
                leaveDays++;
                break;
            case 'Absent':
                absentDays++;
                break;
        }
        
        if (record.totalHours) {
            totalHours += record.totalHours;
        }
        
        if (record.overtime) {
            totalOvertime += record.overtime;
        }
    });

    // Calculate attendance rate
    const workingDays = totalDays - absentDays;
    const attendanceRate = workingDays > 0 
        ? Math.round((presentDays / workingDays) * 100)
        : 0;

    // Calculate average hours per working day
    const avgHours = workingDays > 0 
        ? parseFloat((totalHours / workingDays).toFixed(2))
        : 0;

    return {
        statistics: {
            totalDays,
            presentDays: Math.round(presentDays),
            lateDays,
            halfDays,
            leaveDays,
            absentDays,
            workingDays: totalDays - absentDays,
            totalHours: parseFloat(totalHours.toFixed(2)),
            totalOvertime: parseFloat(totalOvertime.toFixed(2)),
            avgHours,
            attendanceRate
        },
        attendance
    };
};

export default mongoose.model('Attendance', attendanceSchema, 'attendances');