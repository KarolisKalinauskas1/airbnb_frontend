import axios from '@/axios';
import { useAuthStore } from '@/stores/auth';
import { isValidTokenFormat } from '@/utils/tokenValidation';
import { navigateToAuth } from '@/utils/routerNavigation';

/**
 * Configure Axios interceptors for better error handling
 */
export function configureAxiosInterceptors() {
  // Request interceptor
  axios.interceptors.request.use(
    async (config) => {
      // Set sensible timeouts based on request type
      if (!config.timeout) {
        config.timeout = config.url?.includes('/auth/') ? 5000 : 10000;
      }

      // Check if this is a public route
      const isPublicRoute = 
        (config.headers && config.headers['X-Public-Route'] === 'true') ||
        (config.method?.toLowerCase() === 'get' && (
          config.url?.includes('/api/camping-spots') || 
          config.url?.includes('/api/amenities') || 
          config.url?.includes('/api/countries') ||
          config.url?.match(/\/api\/camping-spots\/\d+$/) ||
          config.url?.match(/\/api\/camper\/\d+$/) ||
          config.url?.includes('/api/reviews/stats') ||
          config.url?.includes('/api/health') ||
          config.url?.includes('/api/status')
        ));

      if (isPublicRoute) {
        config.headers['X-Public-Route'] = 'true';
      } else {
        try {
          const authStore = useAuthStore();
          const token = await authStore.getAuthToken();

          if (token && isValidTokenFormat(token)) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
      }

      return config;
    },
    error => Promise.reject(error)
  );

  // Response interceptor
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Don't retry if no config, already retried, or auth-related endpoints
      if (!originalRequest || 
          originalRequest._retry || 
          originalRequest?.url?.includes('/auth/')) {
        return Promise.reject(error);
      }

      // Check if this was a public route
      const isPublicRoute = 
        originalRequest.headers?.['X-Public-Route'] === 'true' ||
        originalRequest.url?.match(/\/api\/(camping-spots|camper)\/\d+$/) ||
        (originalRequest.method?.toLowerCase() === 'get' && (
          originalRequest.url?.includes('/api/amenities') ||
          originalRequest.url?.includes('/api/countries')
        ));

      // Handle 401 errors for non-public routes
      if (error.response?.status === 401 && !isPublicRoute) {
        try {
          originalRequest._retry = true;
          const authStore = useAuthStore();
          const success = await authStore.refreshToken();

          if (success) {
            const token = await authStore.getAuthToken();
            if (token && isValidTokenFormat(token)) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axios(originalRequest);
            }
          }
          
          // Token refresh failed, clear session and redirect to login
          await authStore.clearSession();
          navigateToAuth('axios-refresh-failed', window.location.pathname);
        } catch (refreshError) {
          console.error('Error during token refresh:', refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
}

export default configureAxiosInterceptors;
