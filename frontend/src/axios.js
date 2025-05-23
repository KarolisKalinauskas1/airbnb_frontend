import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

// Create axios instance with optimized configuration
const baseURL = '/'; // Use relative URL since we have Vite proxy
// Log the base URL for debugging
console.log(`[DEBUG] Axios configured with baseURL: ${baseURL}`);

const apiClient = axios.create({
  baseURL: baseURL,
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
      config.url.includes('/api/camper') || // Add camper routes (for browsing) to public routes
      // Add specific detail page endpoints to ensure they're treated as public
      config.url.match(/\/api\/camping-spots\/\d+$/) || // Match specific camping spot by ID
      config.url.match(/\/api\/camper\/\d+$/) // Match specific camper by ID
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
    // Determine if this was a request to a public route
    const isPublicRequest = error.config && error.config.method.toLowerCase() === 'get' && (
      error.config.url.includes('/api/camping-spots') || 
      error.config.url.includes('/api/campingspots') ||
      error.config.url.includes('/api/locations') || 
      error.config.url.includes('/api/countries') || 
      error.config.url.includes('/api/amenities') ||
      error.config.url.includes('/api/bookings/success') ||
      error.config.url.includes('/api/auth/oauth') ||
      error.config.url.includes('/api/reviews/stats') ||
      error.config.url.includes('/api/camper') ||
      error.config.url.match(/\/api\/camping-spots\/\d+$/) ||
      error.config.url.match(/\/api\/camper\/\d+$/)
    );
    
    // Handle authentication errors - but only redirect for non-public routes
    if (error.response?.status === 401 && !isPublicRequest) {
      const authStore = useAuthStore();
      await authStore.clearSession();
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default apiClient;