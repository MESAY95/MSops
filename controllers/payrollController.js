// import PayrollManagement from '../models/PayrollManagement.js';
// import EmployeeManagement from '../models/EmployeeManagement.js';

// // Get all payrolls
// export const getAllPayrolls = async (req, res) => {
//     try {
//         const { 
//             month, year, department, employeeId, 
//             paymentStatus, isBulkGenerated, costSharing, 
//             ethiopianCompliant, page = 1, limit = 100 
//         } = req.query;

//         const query = {};

//         if (month) query.payrollMonth = parseInt(month);
//         if (year) query.payrollYear = parseInt(year);
//         if (department) query.department = department;
//         if (employeeId) query.employeeId = { $regex: employeeId, $options: 'i' };
//         if (paymentStatus) query.paymentStatus = paymentStatus;
//         if (isBulkGenerated) query.isBulkGenerated = isBulkGenerated === 'true';
        
//         // New filters
//         if (costSharing === 'Yes') query.costSharingEnabled = true;
//         if (costSharing === 'No') query.costSharingEnabled = false;
//         if (ethiopianCompliant === 'Compliant') query.ethiopianTaxCompliant = true;
//         if (ethiopianCompliant === 'Non-Compliant') query.ethiopianTaxCompliant = false;

//         const skip = (page - 1) * limit;

//         const payrolls = await PayrollManagement.find(query)
//             .sort({ payrollYear: -1, payrollMonth: -1, employeeName: 1 })
//             .skip(skip)
//             .limit(parseInt(limit));

//         const total = await PayrollManagement.countDocuments(query);

//         // Calculate totals
//         const totals = await PayrollManagement.aggregate([
//             { $match: query },
//             {
//                 $group: {
//                     _id: null,
//                     totalGrossSalary: { $sum: '$grossSalary' },
//                     totalDeductions: { $sum: '$totalDeductions' },
//                     totalNetSalary: { $sum: '$netSalary' },
//                     totalPayable: { $sum: '$netSalary' },
//                     totalIncomeTax: { $sum: '$incomeTaxAmount' },
//                     totalEmployeePension: { $sum: '$employeePensionAmount' },
//                     totalEmployerPension: { $sum: '$employerPensionAmount' },
//                     totalCostSharing: { $sum: '$costSharingAmount' },
//                     totalSalaryAdvance: { $sum: '$salaryAdvanceAmount' },
//                     totalOvertimeAmount: { $sum: '$totalOvertimeAmount' },
//                     totalCostSharingEnabled: { 
//                         $sum: { 
//                             $cond: [{ $eq: ['$costSharingEnabled', true] }, 1, 0] 
//                         } 
//                     },
//                     totalEthiopianCompliant: { 
//                         $sum: { 
//                             $cond: [{ $eq: ['$ethiopianTaxCompliant', true] }, 1, 0] 
//                         } 
//                     }
//                 }
//             }
//         ]);

//         res.json({
//             success: true,
//             payrolls,
//             totals: totals[0] || {
//                 totalGrossSalary: 0,
//                 totalDeductions: 0,
//                 totalNetSalary: 0,
//                 totalPayable: 0,
//                 totalIncomeTax: 0,
//                 totalEmployeePension: 0,
//                 totalEmployerPension: 0,
//                 totalCostSharing: 0,
//                 totalSalaryAdvance: 0,
//                 totalOvertimeAmount: 0,
//                 totalCostSharingEnabled: 0,
//                 totalEthiopianCompliant: 0
//             },
//             pagination: {
//                 total,
//                 page: parseInt(page),
//                 pages: Math.ceil(total / limit),
//                 limit: parseInt(limit)
//             }
//         });
//     } catch (error) {
//         console.error('Error fetching payrolls:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching payrolls',
//             error: error.message
//         });
//     }
// };

// // Create new payroll with Ethiopian compliance
// export const createPayroll = async (req, res) => {
//     try {
//         const payrollData = req.body;

//         // Validate required fields
//         const requiredFields = ['employeeId', 'employeeName', 'department', 'monthlyBasicSalary', 'preparedBy'];
//         const missingFields = requiredFields.filter(field => !payrollData[field]);
        
//         if (missingFields.length > 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: `Missing required fields: ${missingFields.join(', ')}`
//             });
//         }

//         // Check for duplicate payroll in same period
//         const existingPayroll = await PayrollManagement.findOne({
//             employeeId: payrollData.employeeId,
//             payrollStartDate: { $lte: new Date(payrollData.payrollEndDate) },
//             payrollEndDate: { $gte: new Date(payrollData.payrollStartDate) }
//         });

//         if (existingPayroll) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Payroll already exists for overlapping period'
//             });
//         }

//         // Ensure Ethiopian compliance
//         if (payrollData.incomeTaxEnabled !== false) {
//             payrollData.incomeTaxEnabled = true;
//             payrollData.taxCalculationMethod = 'EthiopianProgressive';
//         }

//         if (payrollData.pensionEnabled !== false) {
//             payrollData.pensionEnabled = true;
//             payrollData.employeePensionRate = 7; // Ethiopian law
//             payrollData.employerPensionRate = 11; // Ethiopian law
//         }

//         // Set cost sharing default if not provided
//         if (payrollData.costSharingEnabled === undefined) {
//             payrollData.costSharingEnabled = false;
//             payrollData.costSharingAmount = 0;
//         }

//         // Set other deduction defaults
//         if (payrollData.salaryAdvanceEnabled === undefined) {
//             payrollData.salaryAdvanceEnabled = false;
//             payrollData.salaryAdvanceAmount = 0;
//         }

//         if (payrollData.otherDeductionsEnabled === undefined) {
//             payrollData.otherDeductionsEnabled = false;
//             payrollData.otherDeductionsAmount = 0;
//         }

//         // Set currency and compliance tracking
//         payrollData.currency = 'ETB';
//         payrollData.ethiopianTaxCompliant = true;

//         const payroll = new PayrollManagement(payrollData);
//         await payroll.save();

//         res.status(201).json({
//             success: true,
//             message: 'Payroll created successfully with Ethiopian compliance',
//             payroll
//         });
//     } catch (error) {
//         console.error('Error creating payroll:', error);
//         res.status(400).json({
//             success: false,
//             message: 'Error creating payroll',
//             error: error.message,
//             errors: error.errors || []
//         });
//     }
// };

// // Update payroll
// export const updatePayroll = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const updateData = req.body;

//         const payroll = await PayrollManagement.findById(id);
//         if (!payroll) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Payroll not found'
//             });
//         }

//         // Ensure Ethiopian compliance on update
//         if (updateData.incomeTaxEnabled !== false) {
//             updateData.incomeTaxEnabled = true;
//             updateData.taxCalculationMethod = 'EthiopianProgressive';
//         }

//         if (updateData.pensionEnabled !== false) {
//             updateData.employeePensionRate = 7;
//             updateData.employerPensionRate = 11;
//         }

//         // Recalculate compliance
//         updateData.ethiopianTaxCompliant = true;

//         Object.assign(payroll, updateData);
//         await payroll.save();

//         res.json({
//             success: true,
//             message: 'Payroll updated successfully',
//             payroll
//         });
//     } catch (error) {
//         console.error('Error updating payroll:', error);
//         res.status(400).json({
//             success: false,
//             message: 'Error updating payroll',
//             error: error.message
//         });
//     }
// };

// // Delete payroll
// export const deletePayroll = async (req, res) => {
//     try {
//         const { id } = req.params;

//         const payroll = await PayrollManagement.findByIdAndDelete(id);
//         if (!payroll) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Payroll not found'
//             });
//         }

//         res.json({
//             success: true,
//             message: 'Payroll deleted successfully'
//         });
//     } catch (error) {
//         console.error('Error deleting payroll:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error deleting payroll',
//             error: error.message
//         });
//     }
// };

// // Check Ethiopian compliance
// export const checkCompliance = async (req, res) => {
//     try {
//         const { id } = req.params;

//         const payroll = await PayrollManagement.findById(id);
//         if (!payroll) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Payroll not found'
//             });
//         }

//         const compliance = payroll.validateEthiopianTaxCompliance();

//         res.json({
//             success: true,
//             compliance
//         });
//     } catch (error) {
//         console.error('Error checking compliance:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error checking compliance',
//             error: error.message
//         });
//     }
// };

// // Fix Ethiopian compliance issues
// export const fixCompliance = async (req, res) => {
//     try {
//         const { id } = req.params;

//         const result = await PayrollManagement.fixEthiopianCompliance(id);

//         res.json(result);
//     } catch (error) {
//         console.error('Error fixing compliance:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fixing compliance',
//             error: error.message
//         });
//     }
// };

// // Calculate Ethiopian tax
// export const calculateEthiopianTax = async (req, res) => {
//     try {
//         const { grossSalary } = req.body;

//         if (!grossSalary || grossSalary < 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Valid gross salary is required'
//             });
//         }

//         const tax = PayrollManagement.calculateEthiopianIncomeTax(grossSalary);
//         const bracket = PayrollManagement.getEthiopianTaxBracket(grossSalary);

//         res.json({
//             success: true,
//             data: {
//                 grossSalary,
//                 incomeTax: tax,
//                 taxBracket: bracket,
//                 netSalary: grossSalary - tax
//             }
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// // Generate bulk payroll with Ethiopian compliance
// export const generateBulkPayroll = async (req, res) => {
//     try {
//         const { month, year, preparedBy = 'System' } = req.body;

//         if (!month || !year) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Month and year are required'
//             });
//         }

//         // Get active employees
//         const employees = await EmployeeManagement.find({
//             employmentStatus: 'Active'
//         });

//         const payrolls = [];
//         const errors = [];

//         for (const employee of employees) {
//             try {
//                 // Check if payroll already exists
//                 const existingPayroll = await PayrollManagement.findOne({
//                     employeeId: employee.employeeId,
//                     payrollMonth: parseInt(month),
//                     payrollYear: parseInt(year)
//                 });

//                 if (existingPayroll) {
//                     errors.push({
//                         employeeId: employee.employeeId,
//                         message: 'Payroll already exists for this period'
//                     });
//                     continue;
//                 }

//                 // Calculate payroll data
//                 const firstDay = new Date(parseInt(year), parseInt(month) - 1, 1);
//                 const lastDay = new Date(parseInt(year), parseInt(month), 0);

//                 const payrollData = await PayrollManagement.calculatePayrollFromAttendance(
//                     employee,
//                     { presentDays: 22 }, // Default attendance
//                     firstDay,
//                     lastDay
//                 );

//                 // Set Ethiopian compliance
//                 payrollData.incomeTaxEnabled = true;
//                 payrollData.pensionEnabled = true;
//                 payrollData.costSharingEnabled = employee.costSharingEnabled || false;
//                 payrollData.costSharingAmount = employee.costSharingAmount || 0;
//                 payrollData.preparedBy = preparedBy;
//                 payrollData.isBulkGenerated = true;
//                 payrollData.ethiopianTaxCompliant = true;
//                 payrollData.taxCalculationMethod = 'EthiopianProgressive';

//                 const payroll = new PayrollManagement(payrollData);
//                 await payroll.save();
//                 payrolls.push(payroll);

//             } catch (error) {
//                 errors.push({
//                     employeeId: employee.employeeId,
//                     message: error.message
//                 });
//             }
//         }

//         res.json({
//             success: true,
//             message: `Generated ${payrolls.length} payrolls with Ethiopian compliance`,
//             count: payrolls.length,
//             errors,
//             payrolls: payrolls.map(p => p.getPayrollSummary())
//         });
//     } catch (error) {
//         console.error('Error generating bulk payroll:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error generating bulk payroll',
//             error: error.message
//         });
//     }
// };

// // Get payroll summary
// export const getPayrollSummary = async (req, res) => {
//     try {
//         const { month, year } = req.query;

//         const matchStage = {};
//         if (month) matchStage.payrollMonth = parseInt(month);
//         if (year) matchStage.payrollYear = parseInt(year);

//         const summary = await PayrollManagement.aggregate([
//             { $match: matchStage },
//             {
//                 $group: {
//                     _id: null,
//                     totalEmployees: { $sum: 1 },
//                     totalGrossSalary: { $sum: '$grossSalary' },
//                     totalDeductions: { $sum: '$totalDeductions' },
//                     totalNetSalary: { $sum: '$netSalary' },
//                     totalIncomeTax: { $sum: '$incomeTaxAmount' },
//                     totalEmployeePension: { $sum: '$employeePensionAmount' },
//                     totalEmployerPension: { $sum: '$employerPensionAmount' },
//                     totalCostSharing: { $sum: '$costSharingAmount' },
//                     totalSalaryAdvance: { $sum: '$salaryAdvanceAmount' },
//                     totalOvertimeAmount: { $sum: '$totalOvertimeAmount' },
//                     avgAttendanceDays: { $avg: '$attendanceDays' },
//                     compliantCount: {
//                         $sum: { $cond: [{ $eq: ['$ethiopianTaxCompliant', true] }, 1, 0] }
//                     },
//                     costSharingCount: {
//                         $sum: { $cond: [{ $eq: ['$costSharingEnabled', true] }, 1, 0] }
//                     }
//                 }
//             }
//         ]);

//         res.json({
//             success: true,
//             summary: summary[0] || {
//                 totalEmployees: 0,
//                 totalGrossSalary: 0,
//                 totalDeductions: 0,
//                 totalNetSalary: 0,
//                 totalIncomeTax: 0,
//                 totalEmployeePension: 0,
//                 totalEmployerPension: 0,
//                 totalCostSharing: 0,
//                 totalSalaryAdvance: 0,
//                 totalOvertimeAmount: 0,
//                 avgAttendanceDays: 0,
//                 compliantCount: 0,
//                 costSharingCount: 0
//             }
//         });
//     } catch (error) {
//         console.error('Error getting payroll summary:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error getting payroll summary',
//             error: error.message
//         });
//     }
// };