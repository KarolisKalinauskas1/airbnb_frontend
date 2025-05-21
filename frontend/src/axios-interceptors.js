import axios from '@/axios';
import { useAuthStore } from '@/stores/auth';
import { getTokenFromStorage } from '@/utils/persistentAuth';

/**
 * Configure Axios interceptors for better error handling
 */
export function configureAxiosInterceptors() {
  // Request interceptor
  axios.interceptors.request.use(
    async (config) => {
      // Set sensible timeouts based on request type
      if (!config.timeout) {
        if (config.url.includes('/ping')) {
          config.timeout = 3000; // 3 seconds for ping
        } else if (config.url.includes('/auth/')) {
          config.timeout = 5000; // 5 seconds for auth endpoints        } else {
          config.timeout = 10000; // 10 seconds for everything else
        }
      }
      
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
        config.url.includes('/api/reviews/spot') || // Add review listing to public routes
        config.url.includes('/api/camper') // Add camper routes (for browsing) to public routes
      );

      // Only add auth token for non-public routes
      if (!isPublicRoute) {
        const authStore = useAuthStore();
        
        try {
          // Force refresh token for PUT requests
          const forceRefresh = config.method.toLowerCase() === 'put';
          const token = await authStore.getAuthToken(forceRefresh);
          
          if (token && typeof token === 'string') {
            config.headers.Authorization = `Bearer ${token}`;
            console.log(`Token: ${token.substring(0, 5)}...`); // Log partial token for debugging          } else {
            console.error('Interceptor: Invalid token format:', typeof token);
          }
        } catch (error) {
          console.error('Error getting auth token:', error);
          // Only redirect to auth for non-public routes
          if (!isPublicRoute) {
            window.location.href = '/auth';
            return Promise.reject(error);
          }
        }
      }

      // Add request identifier to help track duplicates
      config.requestId = Math.random().toString(36).substring(7);
      return config;
    }, 
    (error) => {
      return Promise.reject(error);
    }
  );
  
  // Response interceptor
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Don't retry if:
      // 1. No config (canceled requests)
      // 2. Already retried
      // 3. Auth-related endpoints
      if (!originalRequest || originalRequest._retry || originalRequest.url.includes('/auth/')) {
        return Promise.reject(error);
      }

      // Handle 401 errors
      if (error.response?.status === 401) {
        try {
          // Mark request as retried
          originalRequest._retry = true;
          
          // Try to refresh the token
          const authStore = useAuthStore();
          const success = await authStore.refreshToken();
          
          if (success) {
            // Get the new token
            const token = await authStore.getAuthToken();
            
            if (token && typeof token === 'string') {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              console.log(`Refreshed token: ${token.substring(0, 5)}...`); // Log partial token for debugging
              // Retry the original request
              return axios(originalRequest);
            } else {
              console.error('Interceptor: Invalid token format after refresh:', typeof token);
            }          }
          
          // If we get here, token refresh failed
          console.error('Token refresh failed, redirecting to auth');
          window.location.href = '/auth';
          return Promise.reject(error);
        } catch (refreshError) {
          console.error('Error during token refresh:', refreshError);
          window.location.href = '/auth';
          return Promise.reject(error);
        }
      }

      // Handle timeout errors better
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        error.isTimeout = true;
      }

      // Catch network errors when offline
      if (!navigator.onLine) {
        error.isOffline = true;
      }

      // Don't console.error canceled requests as they're often intentional
      if (error.code !== 'ERR_CANCELED' && error.name !== 'CanceledError') {
        console.error('Request error:', error.message, 'URL:', originalRequest?.url);
      }

      return Promise.reject(error);
    }
  );
}

export default configureAxiosInterceptors;
