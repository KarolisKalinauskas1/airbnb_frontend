import axios from 'axios';
import { useAuthStore } from './stores/auth';

// Create axios instance with baseURL
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000, // Add a timeout
  retries: 3,     // Add retries count
  retryDelay: 1000 // Delay between retries in milliseconds
});

// Add a request interceptor to automatically add auth token to protected routes
instance.interceptors.request.use(async function (config) {
  // List of endpoints that require authentication
  const protectedEndpoints = [
    '/camping-spots/owner',
    '/dashboard',
    '/users/profile',
    '/users/full-info',
    '/users/sync'
  ];
  
  // Check if the request is for a protected endpoint
  const isProtectedRequest = protectedEndpoints.some(endpoint => 
    config.url.includes(endpoint)
  );
  
  if (isProtectedRequest) {
    try {
      // Get the auth store
      const authStore = useAuthStore();
      const token = await authStore.getAuthToken();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('No auth token available for protected endpoint:', config.url);
      }
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }
  
  return config;
}, function (error) {
  return Promise.reject(error);
});

// Add response interceptor for retries on network errors
instance.interceptors.response.use(null, async function(error) {
  const config = error.config;
  
  // If we've reached max retries or it's not a network error, reject
  if (!config || !config.retries || error.code !== 'ERR_NETWORK') {
    return Promise.reject(error);
  }
  
  // Set retry count if it doesn't exist
  config._retryCount = config._retryCount || 0;
  
  // Check if we've maxed out retries
  if (config._retryCount >= config.retries) {
    // Check if it's potentially a server down issue
    if (error.code === 'ERR_NETWORK') {
      console.warn('Server connection failed after multiple retries. The backend server might be down.');
    }
    return Promise.reject(error);
  }
  
  // Increase retry count
  config._retryCount += 1;
  console.log(`Retry attempt ${config._retryCount} for ${config.url}`);
  
  // Create new promise to handle retry
  const delayRetry = new Promise(resolve => {
    setTimeout(() => {
      console.log(`Retrying request to ${config.url}`);
      resolve();
    }, config.retryDelay || 1000);
  });
  
  // Return the promise with retry
  return delayRetry.then(() => instance(config));
});

export default instance;