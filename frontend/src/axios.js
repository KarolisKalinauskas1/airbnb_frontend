import axios from 'axios';
import { shouldAllowRequest, resetThrottling } from './utils/requestThrottler';
import { useToast } from 'vue-toastification';

// Create axios instance
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Add request interceptor to handle throttling
instance.interceptors.request.use(
  config => {
    // Skip throttling if explicitly requested
    if (config.bypassThrottle) {
      return config;
    }
    
    // Generate a request ID from the URL and method
    const requestId = `${config.method}:${config.url}`;
    
    // Check if this request should be throttled
    if (!shouldAllowRequest(requestId)) {
      // Return a rejected promise to cancel the request
      return Promise.reject({
        config,
        response: {
          status: 429,
          data: { error: 'Request throttled by client to prevent rate limiting' }
        }
      });
    }
    
    // Add timestamp to URL params to prevent caching issues
    if (config.params) {
      config.params._t = Date.now();
    } else {
      config.params = { _t: Date.now() };
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
instance.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Add toast for common errors
    const toast = useToast();
    
    if (error.response) {
      // Server responded with an error status
      if (error.response.status === 429) {
        // Rate limiting error
        const retryAfter = error.response.data?.retryAfter || 30;
        console.log(`Rate limited. Retry after ${retryAfter} seconds.`);
        if (toast) {
          toast.warning(`Rate limited. Please try again in ${Math.ceil(retryAfter)} seconds.`);
        }
      } 
      else if (error.response.status === 503) {
        // Database connection error
        if (error.response.data?.code === 'P1001' ||
            error.response.data?.code === 'DB_CONNECTION_ERROR' ||
            (error.response.data?.error && error.response.data.error.includes('database'))) {
          console.error('Database connection error:', error.response.data);
          if (toast) {
            toast.error('Database server is currently unavailable. Please try again later.');
          }
        }
      }
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      if (toast) {
        toast.error('Request timed out. Please check your connection and try again.');
      }
    } else if (error.message && error.message.includes('throttled')) {
      // Client throttling - don't show toast for these as they're handled internally
      console.warn('API Error 429:', error.response?.data);
    }
    
    return Promise.reject(error);
  }
);

export default instance;