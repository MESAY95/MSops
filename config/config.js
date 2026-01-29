/**
 * Application configuration
 */
const config = {
    // Server configuration
    server: {
        port: process.env.PORT || 5000,
        environment: process.env.NODE_ENV || 'development',
        baseUrl: process.env.BASE_URL || 'http://localhost:5000'
    },
    
    // Database configuration
    database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mesayoperations2',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        }
    },
    
    // Security configuration
    security: {
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000
    },
    
    // File upload configuration
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
        uploadPath: process.env.UPLOAD_PATH || './uploads',
        allowedMimeTypes: [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
    },
    
    // Email configuration (for future use)
    email: {
        service: process.env.EMAIL_SERVICE || 'gmail',
        username: process.env.EMAIL_USERNAME,
        password: process.env.EMAIL_PASSWORD,
        from: process.env.EMAIL_FROM || 'noreply@mesayoperations.com'
    },
    
    // Application settings
    app: {
        name: 'MESAY Operations Management System',
        version: '1.0.0',
        description: 'Comprehensive MERN stack operation management system',
        currency: 'ETB',
        timezone: 'Africa/Addis_Ababa',
        dateFormat: 'DD/MM/YYYY',
        datetimeFormat: 'DD/MM/YYYY HH:mm:ss'
    },
    
    // Departments configuration
    departments: {
        list: ['HR', 'Supply Chain', 'Production', 'Quality', 'Technique', 'Finance', 'Sales'],
        colors: {
            'HR': '#FF6B6B',
            'Supply Chain': '#4ECDC4', 
            'Production': '#45B7D1',
            'Quality': '#96CEB4',
            'Technique': '#FECA57',
            'Finance': '#FF9FF3',
            'Sales': '#54A0FF'
        }
    },
    
    // Leave types configuration
    leaveTypes: {
        sick: { maxDays: 30, requiresDocument: true },
        vacation: { maxDays: 21, requiresDocument: false },
        personal: { maxDays: 7, requiresDocument: false },
        maternity: { maxDays: 120, requiresDocument: true },
        paternity: { maxDays: 15, requiresDocument: true },
        other: { maxDays: 5, requiresDocument: false }
    }
};

/**
 * Validate required environment variables
 */
export const validateEnvironment = () => {
    const required = ['MONGODB_URI'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:', missing.join(', '));
        process.exit(1);
    }
};

/**
 * Get configuration for current environment
 */
export const getConfig = () => {
    return config;
};

/**
 * Check if running in production
 */
export const isProduction = () => {
    return config.server.environment === 'production';
};

/**
 * Check if running in development
 */
export const isDevelopment = () => {
    return config.server.environment === 'development';
};

export default config;