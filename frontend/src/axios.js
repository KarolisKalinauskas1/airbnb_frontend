import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

// Create Axios instance
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 30000, // Increase timeout to 30 seconds for file uploads
  withCredentials: true // Include cookies in requests
});

// Fix the API path handling in the request interceptor
instance.interceptors.request.use(
  async (config) => {
    // Don't modify URLs for external requests
    if (!config.url.startsWith('http')) {
      // Make sure all API paths start with /
      if (!config.url.startsWith('/')) {
        config.url = `/${config.url}`;
      }
    }
    
    try {
      // Get the auth store (will only work in setup context)
      const authStore = useAuthStore();
      const token = await authStore.getAuthToken();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // If we can't get the auth store or token, just proceed without auth
      console.log('Not able to add auth token to request:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Keep track of failed requests to prevent loops
const failedRequestsCount = {};

// Reset counts every 5 minutes
setInterval(() => {
  for (const key in failedRequestsCount) {
    delete failedRequestsCount[key];
  }
}, 300000);

// Add response interceptor for better error handling
instance.interceptors.response.use(
  response => response,
  error => {
    console.error('Axios error intercepted:', error);
    
    // Track failed requests to detect potential loops
    const requestUrl = error.config?.url;
    if (requestUrl) {
      failedRequestsCount[requestUrl] = (failedRequestsCount[requestUrl] || 0) + 1;
      
      // If the same request fails more than 5 times in a row, log a warning
      if (failedRequestsCount[requestUrl] > 5) {
        console.warn(`Request to ${requestUrl} has failed ${failedRequestsCount[requestUrl]} times. Possible infinite loop detected.`);
      }
    }
    
    // Handle network errors and CORS issues
    if (error.code === 'ERR_NETWORK') {
      console.warn('Network error - backend server may be down');
    } else if (error.message && error.message.includes('CORS')) {
      console.error('CORS error detected:', error.message);
    }
    
    // Handle request timeout
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out');
    }
    
    // Log detailed error info for debugging
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    
    // Handle global error cases
    if (error.response?.status === 401) {
      console.warn('Authentication error - you may need to login again');
      // Don't trigger automatic redirects here to prevent loops
    }
    
    // Continue with the error
    return Promise.reject(error);
  }
);

export default instance;