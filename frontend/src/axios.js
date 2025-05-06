import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

// Create axios instance with optimized configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 15000, // 15 second timeout
  withCredentials: true, // Enable credentials for cross-origin requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Debug logging for all requests
apiClient.interceptors.request.use(
  async (config) => {
    console.log('=== AXIOS REQUEST ===');
    console.log('URL:', config.baseURL + config.url);
    console.log('Method:', config.method);
    console.log('Headers:', config.headers);

    // Don't log sensitive data like passwords
    const safeData = { ...config.data };
    if (safeData.password) safeData.password = '[REDACTED]';

    console.log('Data:', safeData);

    // Check if this is a public route (GET requests only)
    const isPublicRoute = config.method.toLowerCase() === 'get' && (
      config.url.includes('/api/camping-spots') || 
      config.url.includes('/api/locations') || 
      config.url.includes('/api/countries') || 
      config.url.includes('/api/amenities') ||
      config.url.includes('/api/bookings/success') // Add success route to public routes
    );

    // Only add auth token for non-public routes
    if (!isPublicRoute) {
      const authStore = useAuthStore();
      try {
        const token = await authStore.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
        // Only redirect to login for non-public routes
        if (!isPublicRoute) {
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Debug logging for all responses
apiClient.interceptors.response.use(
  (response) => {
    console.log('=== AXIOS RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    return response;
  },
  async (error) => {
    console.error('=== AXIOS ERROR ===');
    if (error.response) {
      // The request was made and the server responded with an error status
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Request error (no response):', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Error setting up request:', error.message);
    }

    const originalRequest = error.config;
    
    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const authStore = useAuthStore();
        // Try to refresh the token
        const newToken = await authStore.getAuthToken(true); // force refresh
        
        if (newToken) {
          // Update the authorization header
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          // Retry the original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // If refresh fails, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Return the error
    return Promise.reject(error);
  }
);

export default apiClient;