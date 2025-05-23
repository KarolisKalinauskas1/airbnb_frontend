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
    
    // Check if this is a public route (using header or URL patterns)
    const isPublicRoute = 
      // Check for X-Public-Route header
      (config.headers && config.headers['X-Public-Route'] === 'true') ||
      // Then check URL patterns for GET requests
      (config.method.toLowerCase() === 'get' && (
        config.url.includes('/api/camping-spots') || 
        config.url.includes('/api/campingspots') || // Alternative API endpoint format
        config.url.includes('/api/locations') || 
        config.url.includes('/api/countries') || 
        config.url.includes('/api/amenities') ||
        config.url.includes('/api/bookings/success') || // Add success route to public routes
        config.url.includes('/api/auth/oauth') || // Add OAuth routes to public routes
        config.url.includes('/api/reviews/stats') || // Add review stats to public routes
        config.url.includes('/api/camper') || // Add camper routes (for browsing) to public routes
        config.url.includes('/reviews/stats/') || // Alternative reviews stats path
        config.url.includes('/camping-spots/') || // Alternative camping spots path
        // Add specific detail page endpoints to ensure they're treated as public
        config.url.match(/\/api\/camping-spots\/\d+$/) || // Match specific camping spot by ID
        config.url.match(/\/api\/camper\/\d+$/) || // Match specific camper by ID 
        config.url.match(/\/api\/camping-spots\/\d+\/availability/) || // Match availability endpoint
        config.url.match(/\/camping-spots\/\d+\/availability/) // Match alternative availability endpoint
      ));

    // Debug logging for request analysis
    console.log(`[DEBUG] ${config.method.toUpperCase()} ${config.url}`, { 
      isPublicRoute,
      hasAuth: !!config.headers.Authorization,
      url: config.url
    });

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
        if (!isPublicRoute) {
          console.warn(`[DEBUG] Redirect skipped for public route: ${config.url}`);
          window.location.href = '/auth';
        }
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
    // Determine if this was a request to a public route, checking both URL patterns
    // and the X-Public-Route header which could be set by components
    const isPublicRequest = 
      // Check for X-Public-Route header first
      (error.config?.headers && error.config.headers['X-Public-Route'] === 'true') ||
      // Then check URL patterns for GET requests
      (error.config && error.config.method.toLowerCase() === 'get' && (
        error.config.url.includes('/api/camping-spots') || 
        error.config.url.includes('/api/campingspots') ||
        error.config.url.includes('/api/locations') || 
        error.config.url.includes('/api/countries') || 
        error.config.url.includes('/api/amenities') ||
        error.config.url.includes('/api/bookings/success') ||
        error.config.url.includes('/api/auth/oauth') ||
        error.config.url.includes('/api/reviews/stats') ||
        error.config.url.includes('/api/camper') ||
        error.config.url.includes('/reviews/stats/') ||
        error.config.url.includes('/camping-spots/') ||
        error.config.url.match(/\/api\/camping-spots\/\d+$/) ||
        error.config.url.match(/\/api\/camper\/\d+$/) ||
        error.config.url.match(/\/api\/camping-spots\/\d+\/availability/) ||
        error.config.url.match(/\/camping-spots\/\d+\/availability/)
      ));
    
    // Enhanced logging for response errors
    console.error(`[DEBUG] Response Error: ${error.config?.method} ${error.config?.url}`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      isPublicRequest,
      responseData: error.response?.data,
      url: error.config?.url,
      message: error.message
    });
    
    // Handle authentication errors - but only redirect for non-public routes
    if (error.response?.status === 401 && !isPublicRequest) {
      console.warn('[DEBUG] Auth redirect triggered for 401 on non-public route:', error.config?.url);
      const authStore = useAuthStore();
      await authStore.clearSession();
      window.location.href = '/auth';
    } else if (error.response?.status === 401 && isPublicRequest) {
      console.warn('[DEBUG] Avoiding auth redirect for public route with 401:', error.config?.url);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;