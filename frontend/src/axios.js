import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

// Create axios instance with optimized configuration
const isProd = import.meta.env.PROD;
const baseURL = isProd 
  ? 'https://airbnbbackend-production-5ffb.up.railway.app'
  : 'http://localhost:3000';

// Log the base URL and environment for debugging
console.log(`[DEBUG] Axios configured with baseURL: ${baseURL} (${isProd ? 'production' : 'development'})`);

const apiClient = axios.create({
  baseURL: baseURL,
  timeout: 30000, // 30 second timeout
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Access-Control-Allow-Origin': 'https://airbnb-frontend-i8p5.vercel.app',
    'Origin': 'https://airbnb-frontend-i8p5.vercel.app'
  },
  // Enhanced retry configuration
  retry: 3,
  retryDelay: (retryCount) => {
    return Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff with 10s max
  },
  validateStatus: function (status) {
    return (status >= 200 && status < 300) || status === 304; // Consider 304 Not Modified as success
  }
});

// Request interceptor for authentication and request configuration
apiClient.interceptors.request.use(
  async (config) => {
    // Don't log sensitive data
    const safeData = { ...config.data };
    if (safeData.password) safeData.password = '[REDACTED]';
      // Check if this is a public route
    const isPublicRoute = 
      (config.headers && config.headers['X-Public-Route'] === 'true') ||
      (config.method.toLowerCase() === 'get' && (
        // Basic routes
        config.url.includes('/api/camping-spots') || 
        config.url.includes('/camping-spots') ||
        config.url.includes('/api/locations') || 
        config.url.includes('/locations') ||
        config.url.includes('/api/amenities') ||
        config.url.includes('/amenities') ||
        config.url.includes('/api/reviews/stats') ||
        config.url.includes('/reviews/stats') ||
        config.url.includes('/api/countries') ||
        config.url.includes('/countries') ||
        // Specific detail page endpoints
        config.url.match(/\/api\/camping-spots\/\d+$/) || // Match specific camping spot by ID
        config.url.match(/\/api\/camper\/\d+$/) || // Match specific camper by ID 
        config.url.match(/\/api\/camping-spots\/\d+\/availability/) || // Match availability endpoint
        config.url.match(/\/camping-spots\/\d+\/availability/) // Match alternative availability endpoint
      ));

    // Enhanced debug logging for request analysis
    console.log(`[Axios Interceptor] ${config.method.toUpperCase()} ${config.url}`, { 
      timestamp: new Date().toISOString(),
      isPublicRoute,
      hasAuth: !!config.headers.Authorization,
      url: config.url,
      baseURL: config.baseURL,
      headers: {
        contentType: config.headers['Content-Type'],
        accept: config.headers['Accept']
      }
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

// Add response interceptor with combined retry and error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config } = error;
    
    // Skip retry for specific error types
    if (!config || !config.retry || error.code === 'ERR_CANCELED' || error.response?.status === 404) {
      return Promise.reject(error);
    }

    // Initialize retry count
    config.retryCount = config.retryCount || 0;

    // Check if we should retry the request
    if (config.retryCount >= (config.retry || 3)) {
      return Promise.reject(error);
    }

    // Increment retry count
    config.retryCount += 1;

    // Log retry attempt
    console.log(`[Axios Retry] Attempt ${config.retryCount} of ${config.retry} for ${config.url}`);

    // Handle CORS errors by trying alternative routes
    if (error.response?.status === 403 || error.code === 'ERR_NETWORK') {
      if (config.url.startsWith('/api/')) {
        config.url = config.url.replace('/api/', '/');
        
        // Add CORS headers
        config.headers = {
          ...config.headers,
          'Access-Control-Allow-Origin': 'https://airbnb-frontend-i8p5.vercel.app',
          'Origin': 'https://airbnb-frontend-i8p5.vercel.app'
        };
      }
    }

    // Create a delay with exponential backoff
    const backoff = new Promise(resolve => {
      setTimeout(resolve, Math.min(1000 * Math.pow(2, config.retryCount), 10000));
    });

    // Wait for the backoff delay then retry request
    await backoff;
    return apiClient(config);
  }
);

// Error type checking utilities
const errorChecks = {
  isNetwork: (error) => (
    error.code === 'ERR_NETWORK' || 
    error.code === 'ECONNABORTED' ||
    error.response?.status === 403
  ),

  isAuth: (error) => (
    error.response?.status === 401 || 
    error.response?.status === 403
  ),

  isDatabase: (error) => (
    error.response?.status === 503 || 
    error.response?.data?.code === 'P1001' ||
    error.response?.data?.code === 'DB_CONNECTION_ERROR' ||
    (error.response?.data?.error && error.response.data.error.includes('database'))
  )
};

// Export configured client and utilities
export { errorChecks };
export default apiClient;