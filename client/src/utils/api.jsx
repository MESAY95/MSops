import axios from 'axios';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    
    console.error('API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle 401 Unauthorized (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Extract error message
    const errorMessage = error.response?.data?.message || 
                       error.response?.data?.error || 
                       error.message || 
                       'An error occurred';
    
    // Reject with formatted error
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

// API Service Class with auth methods
class ApiService {
  // Auth methods
  static auth = {
    login: async (email, password) => {
      try {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    registerAdmin: async (userData) => {
      try {
        const response = await api.post('/auth/register-admin', userData);
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    registerUser: async (userData) => {
      try {
        const response = await api.post('/auth/register', userData);
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    checkAdminExists: async () => {
      try {
        const response = await api.get('/auth/check-admin');
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    checkEmail: async (email) => {
      try {
        const response = await api.get('/auth/check-email', { params: { email } });
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    verifyToken: async () => {
      try {
        const response = await api.get('/auth/verify-token');
        return response.data;
      } catch (error) {
        throw error;
      }
    }
  };

  // User management methods
  static users = {
    getAll: async (params = {}) => {
      try {
        const response = await api.get('/auth/users', { params });
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    getById: async (id) => {
      try {
        const response = await api.get(`/auth/users/${id}`);
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    update: async (id, userData) => {
      try {
        const response = await api.put(`/auth/users/${id}`, userData);
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    resetPassword: async (id, newPassword) => {
      try {
        const response = await api.post(`/auth/reset-password/${id}`, { newPassword });
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    toggleActive: async (id) => {
      try {
        const response = await api.put(`/auth/users/${id}/toggle-active`);
        return response.data;
      } catch (error) {
        throw error;
      }
    }
  };

  // Test API connection
  static test = {
    health: async () => {
      try {
        const response = await api.get('/health');
        return response.data;
      } catch (error) {
        throw new Error('API health check failed');
      }
    },

    connection: async () => {
      try {
        const response = await api.get('/test');
        return response.data;
      } catch (error) {
        throw new Error('API test failed');
      }
    }
  };
}

export default ApiService;
export { api };