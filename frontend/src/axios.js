import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

// Create axios instance with optimized configuration
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Log the base URL for debugging
console.log(`[DEBUG] Axios configured with baseURL: ${baseURL}`);

// Check if the baseURL already includes /api to avoid duplication
const apiPrefix = baseURL.includes('/api') ? '' : '/api';

const apiClient = axios.create({
  baseURL: baseURL + apiPrefix,
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
    if (safeData.password) safeData.password = '[REDACTED]';    
    
    // Check if this is a public route (GET requests only)
    const isPublicRoute = config.method.toLowerCase() === 'get' && (
      config.url.includes('/api/camping-spots') || 
      config.url.includes('/api/campingspots') || // Alternative API endpoint format
      config.url.includes('/api/locations') || 
      config.url.includes('/api/countries') || 
      config.url.includes('/api/amenities') ||
      config.url.includes('/api/bookings/success') || // Add success route to public routes
      config.url.includes('/api/auth/oauth') || // Add OAuth routes to public routes
      config.url.includes('/api/reviews/stats') || // Add review stats to public routes
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
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
        // Only redirect to auth for non-public routes
        window.location.href = '/auth';
        return Promise.reject(error);
      }
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      await authStore.clearSession();
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default apiClient;