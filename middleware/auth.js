import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

export const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

export const departmentMiddleware = (req, res, next) => {
    const userDepartment = req.user?.department;
    const recordDepartment = req.body.department || req.query.department;

    if (!userDepartment) {
        return res.status(403).json({
            success: false,
            message: 'User department not specified'
        });
    }

    // Allow HR and Finance to access all departments
    if (req.user.role === 'hr_manager' || req.user.role === 'finance_manager' || req.user.role === 'admin') {
        return next();
    }

    // For department users, ensure they only access their own department
    if (recordDepartment && recordDepartment !== userDepartment) {
        return res.status(403).json({
            success: false,
            message: 'Access denied to other departments'
        });
    }

    next();
};