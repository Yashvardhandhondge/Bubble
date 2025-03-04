import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.coinchart.fun/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token and log outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('Outgoing request to:', config.url);
  return config;
});

// Response interceptor to handle errors and log incoming responses
api.interceptors.response.use(
  (response) => {
    console.log('Incoming response from:', response.config.url);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Prevent redirect loop by checking if not already on the login page
      if (window.location.pathname !== '/') {
        localStorage.removeItem('token');
        window.location.href = '/';
      }
    }
    console.error('Error response from:', error.config?.url, error);
    return Promise.reject(error);
  }
);

export const AuthService = {
  // Register/Connect wallet
  register: async (walletAddress: string) => {
    try {
      const response = await api.post('/auth/register', { walletAddress });
      console.log('Register response received:', response.data);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        // Delay subsequent calls to ensure token is registered
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.warn('No token found in response:', response.data);
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
    return error.response.data.message || 'An error occurred';
  } else if (error.request) {
    return 'No response from server';
  } else {
    return 'Error making request';
  }
};

export default api;