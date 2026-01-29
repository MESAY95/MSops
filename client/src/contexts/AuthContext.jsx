// // contexts/AuthContext.jsx
// import React, { createContext, useState, useContext, useEffect } from 'react';
// import axios from 'axios';
// import { toast } from 'react-hot-toast';

// const AuthContext = createContext({});

// export const useAuth = () => useContext(AuthContext);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [adminExists, setAdminExists] = useState(null);

//   // Check if user is logged in on mount
//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     const storedUser = localStorage.getItem('user');
    
//     if (token && storedUser) {
//       setUser(JSON.parse(storedUser));
//       // Set authorization header for all requests
//       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//     }
    
//     setLoading(false);
//   }, []);

//   // Check if admin exists
//   const checkAdminExists = async () => {
//     try {
//       const response = await axios.get('/api/auth/check-admin-exists');
//       setAdminExists(response.data.exists);
//     } catch (error) {
//       console.error('Error checking admin:', error);
//       setAdminExists(false);
//     }
//   };

//   // Login function
//   const login = async (username, password) => {
//     try {
//       const response = await axios.post('/api/auth/login', {
//         username,
//         password
//       });

//       if (response.data.success) {
//         const { token, user } = response.data;
        
//         // Store token and user in localStorage
//         localStorage.setItem('token', token);
//         localStorage.setItem('user', JSON.stringify(user));
        
//         // Set authorization header
//         axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
//         // Update state
//         setUser(user);
        
//         toast.success('Login successful!');
//         return { success: true, data: response.data };
//       }
      
//       return { success: false, message: response.data.message };
      
//     } catch (error) {
//       const message = error.response?.data?.message || 'Login failed';
//       toast.error(message);
//       return { success: false, message };
//     }
//   };

//   // Logout function
//   const logout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     delete axios.defaults.headers.common['Authorization'];
//     setUser(null);
//     toast.success('Logged out successfully');
//   };

//   // Update user profile
//   const updateProfile = async (userData) => {
//     try {
//       const response = await axios.put('/api/auth/profile', userData);
//       if (response.data.success) {
//         setUser(response.data.user);
//         localStorage.setItem('user', JSON.stringify(response.data.user));
//         toast.success('Profile updated successfully');
//       }
//     } catch (error) {
//       toast.error(error.response?.data?.message || 'Failed to update profile');
//     }
//   };

//   return (
//     <AuthContext.Provider value={{
//       user,
//       login,
//       logout,
//       updateProfile,
//       loading,
//       adminExists,
//       checkAdminExists
//     }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };