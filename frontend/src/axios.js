import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
// Create axios instance with optimized configuration
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Log the base URL for debugging
console.log(`[DEBUG] Axios configured with baseURL: ${baseURL}`);

const apiClient = axios.create({
  baseURL,
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
    // Don't log sensitive data like passwords
    const safeData = { ...config.data };
    if (safeData.password) safeData.password = '[REDACTED]';    // Check if this is a public route (GET requests only)
    const isPublicRoute = config.method.toLowerCase() === 'get' && (
      config.url.includes('/api/camping-spots') || 
      config.url.includes('/api/campingspots') || // Alternative API endpoint format
      config.url.includes('/api/locations') || 
      config.url.includes('/api/countries') || 
      config.url.includes('/api/amenities') ||
      config.url.includes('/api/bookings/success') || // Add success route to public routes
      config.url.includes('/api/auth/oauth') || // Add OAuth routes to public routes
      config.url.includes('/api/reviews/stats') || // Add review stats to public routes
      config.url.includes('/api/reviews/spot') || // Add reviews specific endpoint
      config.url.includes('/api/reviews/health') || // Add reviews health endpoint
      config.url.includes('/api/camper') // Add camper routes (for browsing) to public routes
    );
    // Only add auth token for non-public routes
    if (!isPublicRoute) {
      const authStore = useAuthStore();
      try {
        const token = await authStore.getAuthToken();
        if (token && typeof token === 'string') {
          config.headers.Authorization = `Bearer ${token}`;
          console.log(`Token added: ${token.substring(0, 5)}...`); // Log partial token for debugging
        } else {
          console.error('Invalid token format:', typeof token);
        }      } catch (error) {
        console.error('Error getting auth token:', error);
        // Only redirect to auth for non-public routes
        // For public routes, continue without a token
        if (!isPublicRoute) {
          window.location.href = '/auth';
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
        const authStore = useAuthStore();        // Try to refresh the token
        const newToken = await authStore.getAuthToken(true); // force refresh
        if (newToken && typeof newToken === 'string') {
          // Update the authorization header
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          console.log(`Refreshed token: ${newToken.substring(0, 5)}...`); // Log partial token for debugging
          // Retry the original request
          return apiClient(originalRequest);
        }      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
          // Check if this is a public route before redirecting
        const isPublicRoute = originalRequest.method.toLowerCase() === 'get' && (
          originalRequest.url.includes('/api/camping-spots') || 
          originalRequest.url.includes('/api/campingspots') || // Alternative API endpoint format
          originalRequest.url.includes('/api/locations') || 
          originalRequest.url.includes('/api/countries') || 
          originalRequest.url.includes('/api/amenities') ||
          originalRequest.url.includes('/api/bookings/success') ||
          originalRequest.url.includes('/api/auth/oauth') ||
          originalRequest.url.includes('/api/reviews/stats') ||
          originalRequest.url.includes('/api/camper')
        );
        
        // Only redirect for non-public routes that require authentication
        if (!isPublicRoute) {
          window.location.href = '/auth';
        }
        return Promise.reject(refreshError);
      }
    }
    // Return the error
    return Promise.reject(error);
  }
);
export default apiClient;