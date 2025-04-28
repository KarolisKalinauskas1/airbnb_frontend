import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { setupMockInterceptors } from '@/utils/mockApiHandler';

// Create axios instance with optimized configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Optimized request interceptor
apiClient.interceptors.request.use(
  async (config) => {
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
    return Promise.reject(error);
  }
);

// Optimized response interceptor with token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
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
    
    // Handle 404 errors gracefully
    if (error.response?.status === 404) {
      console.warn('API endpoint not found:', error.config.url);
      // Return empty data instead of throwing error
      return { data: [] };
    }
    
    return Promise.reject(error);
  }
);

// Setup mock interceptors for development
if (process.env.NODE_ENV === 'development') {
  setupMockInterceptors(apiClient);
}

export default apiClient;