import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://fifth-alter-direction-stores.trycloudflare.com/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const AuthService = {
  // Register/Connect wallet
  register: async (walletAddress: string) => {
    try {
      const response = await api.post('/auth/register', { walletAddress });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      return {
        success: true,
        data: response.data,
        isNewUser: response.data.isNewUser
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
        isNewUser: false
      };
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Profile fetch error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch profile'
      };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
  }
};

export const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error
    return error.response.data.message || 'An error occurred';
  } else if (error.request) {
    // Request made but no response
    return 'No response from server';
  } else {
    // Error setting up request
    return 'Error making request';
  }
};

export default api;