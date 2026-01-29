// // Centralized authentication configuration
// export const authConfig = {
//   // Password Policy
//   passwordRules: {
//     minLength: 8,
//     maxLength: 32,
//     requireNumber: true,
//     requireUppercase: true,
//     requireLowercase: true,
//     requireSpecialChar: true,
//     preventCommonPasswords: true,
//     passwordHistorySize: 5, // Remember last 5 passwords
//     maxAgeDays: 90, // Password expires after 90 days
//   },

//   // Security Settings
//   security: {
//     maxFailedAttempts: 5,
//     lockDurationMinutes: 15,
//     sessionTimeoutMinutes: 30,
//     autoLogoutMinutes: 5,
//     tokenRefreshThreshold: 15, // Refresh token 15 minutes before expiry
//     bcryptRounds: 12,
//   },

//   // JWT Configuration
//   jwt: {
//     secret: process.env.JWT_SECRET || 'your-secure-jwt-secret-change-in-production',
//     accessTokenExpiry: '24h',
//     refreshTokenExpiry: '7d',
//     issuer: 'mesay-operations',
//     audience: 'mesay-operations-client',
//   },

//   // Audit Configuration
//   audit: {
//     logFailedAttempts: true,
//     logSuccessfulLogins: true,
//     logPasswordChanges: true,
//     maxAuditLogs: 1000,
//   },
// };

// // Common password list for validation
// export const commonPasswords = [
//   'password', '123456', '12345678', '1234', 'qwerty', 'admin', 'welcome',
//   'monkey', 'letmein', 'dragon', 'baseball', 'sunshine', 'password1'
// ];

// // Password strength levels
// export const passwordStrength = {
//   WEAK: { minScore: 0, maxScore: 2, color: 'error', label: 'Weak' },
//   MEDIUM: { minScore: 3, maxScore: 4, color: 'warning', label: 'Medium' },
//   STRONG: { minScore: 5, maxScore: 6, color: 'success', label: 'Strong' },
// };