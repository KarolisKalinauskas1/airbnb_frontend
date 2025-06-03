import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { getTokenFromStorage } from '@/utils/persistentAuth';
import router from '@/router';

// Get the base URL from environment or use empty string for development (to use Vite proxy)
const isDev = process.env.NODE_ENV !== 'production';
const baseURL = isDev ? '' : import.meta.env.VITE_API_URL || 'https://airbnbbackend-production-5ffb.up.railway.app';

if (isDev) {
  console.log('[DEBUG] Using Vite proxy in development mode');
} else {
  console.log(`[DEBUG] Using direct API URL: ${baseURL}`);
}

// Unified list of public routes (no authentication required)
const publicRoutes = [
  'api/amenities',
  'api/countries',
  'api/camping-spots/amenities',
  'api/camping-spots/countries',
  'camping-spots/amenities',
  'camping-spots/countries',
  'amenities',
  'countries',
  'auth/login',
  'auth/register',
  'auth/reset-password',
  'camping-spots',
  'api/camping-spots',
  'health',
  'status'
];

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const path = config.url?.replace(/^\/+|\/+$/g, '') || ''; // Normalize and handle undefined
    
    // Set withCredentials for all requests
    config.withCredentials = true;
    
    // Log the request for debugging
    if (isDev) {
      console.log(`[API] ${config.method?.toUpperCase()} ${path}`, {
        isPublic: publicRoutes.some(route => path.startsWith(route)),
        hasAuth: !!config.headers['Authorization']
      });
    }
    
    // Define protected paths that should never be public
    const protectedPaths = [
      'api/users',
      'api/bookings',
      'api/dashboard',
      'api/reviews/create',
      'api/camping-spots/create'
    ];

    // Check if this is a public route
    const isPublicRoute = 
      publicRoutes.some(publicRoute => path === publicRoute || path.startsWith(publicRoute + '/')) ||
      (config.method?.toLowerCase() === 'get' && (
        path.match(/^api\/camping-spots\/\d+$/) ||
        path.match(/^api\/camper\/\d+$/) ||
        path.includes('/api/amenities') ||
        path.includes('/api/countries')
      ));

    // Never treat protected paths as public
    const isProtectedPath = protectedPaths.some(protectedPath => path.startsWith(protectedPath));
    const shouldBePublic = isPublicRoute && !isProtectedPath;

    // Add public route header for truly public routes
    if (shouldBePublic) {
      config.headers['X-Public-Route'] = 'true';
    }

    // Try to get valid token for non-public routes
    if (!shouldBePublic) {
      const token = getTokenFromStorage();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      } else {
        // No token available for protected route
        console.warn(`No auth token available for protected route: ${path}`);
      }
    }

    return config;
  },
  (error) => {
    console.error('[Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Handle successful responses
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Don't handle if no config or already retried
    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Check if this was a public route request
    const isPublicRequest = originalRequest.headers?.['X-Public-Route'] === 'true';

    // Handle 401s for non-public routes
    if (error.response?.status === 401 && !isPublicRequest) {
      originalRequest._retry = true;
      const authStore = useAuthStore();

      try {
        // Attempt to refresh token
        const refreshed = await authStore.refreshToken();
        if (refreshed) {
          originalRequest.headers.Authorization = `Bearer ${await authStore.getAuthToken()}`;
          return apiClient(originalRequest);
        }
        
        // If refresh failed and this wasn't a public route, redirect to auth
        await authStore.clearSession();
        router.push({
          path: '/auth',
          query: { redirect: router.currentRoute.value.fullPath }
        });
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;