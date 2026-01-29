// import User from '../models/User.js';
// import jwt from 'jsonwebtoken';

// const generateToken = (user) => {
//   return jwt.sign(
//     {
//       id: user._id,
//       email: user.email,
//       role: user.role,
//       name: user.name
//     },
//     process.env.JWT_SECRET,
//     { expiresIn: '7d' }
//   );
// };

// export const checkAdminExists = async (req, res) => {
//   try {
//     const adminExists = await User.findOne({ role: 'admin' });
//     res.json({ adminExists: !!adminExists });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// export const register = async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;

//     // Check if admin exists for first-time registration
//     const adminExists = await User.findOne({ role: 'admin' });
    
//     // If admin exists, check if current user is admin
//     if (adminExists && req.user?.role !== 'admin') {
//       return res.status(403).json({
//         success: false,
//         message: 'Only admin can register new users'
//       });
//     }

//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: 'User already exists'
//       });
//     }

//     // Create user
//     const user = await User.create({
//       name,
//       email,
//       password,
//       role: adminExists ? role : 'admin' // First user is always admin
//     });

//     // Generate token
//     const token = generateToken(user);

//     // Set cookie
//     res.cookie('token', token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
//     });

//     // Update last login
//     user.lastLogin = new Date();
//     await user.save();

//     res.status(201).json({
//       success: true,
//       message: 'User registered successfully',
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Registration failed',
//       error: error.message
//     });
//   }
// };

// export const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Find user
//     const user = await User.findOne({ email }).select('+password');
    
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid credentials'
//       });
//     }

//     // Check if user is active
//     if (!user.isActive) {
//       return res.status(401).json({
//         success: false,
//         message: 'Account is deactivated'
//       });
//     }

//     // Check password
//     const isPasswordValid = await user.comparePassword(password);
//     if (!isPasswordValid) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid credentials'
//       });
//     }

//     // Generate token
//     const token = generateToken(user);

//     // Set cookie
//     res.cookie('token', token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 7 * 24 * 60 * 60 * 1000
//     });

//     // Update last login
//     user.lastLogin = new Date();
//     await user.save();

//     res.json({
//       success: true,
//       message: 'Login successful',
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Login failed',
//       error: error.message
//     });
//   }
// };

// export const logout = (req, res) => {
//   res.clearCookie('token');
//   res.json({ success: true, message: 'Logged out successfully' });
// };

// export const getCurrentUser = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select('-password');
//     res.json({ success: true, user });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// };