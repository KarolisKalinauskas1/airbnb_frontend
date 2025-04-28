/**
 * Service to manage backend connection configuration
 */
import { ref } from 'vue';
import axios from 'axios';

// Reactive state for connection status
const backendAvailable = ref(false);
const lastConnectionAttempt = ref(null);
const connectionError = ref(null);

// Get the backend URL from environment variables or use default values with fallbacks
const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  
  // Default for development
  return 'http://localhost:3000';
};

// Backend connection settings
const connectionConfig = {
  baseUrl: getBackendUrl(),
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
  connectionCheckEndpoints: ['/health', '/api/health', '/'],
  
  // Function to check if backend is available
  async checkAvailability() {
    lastConnectionAttempt.value = new Date();
    connectionError.value = null;
    
    try {
      // Try each health endpoint
      for (const endpoint of this.connectionCheckEndpoints) {
        try {
          const response = await axios.get(`${this.baseUrl}${endpoint}`, { 
            timeout: this.timeout,
            params: { _t: Date.now() } // Cache busting
          });
          
          if (response.status === 200) {
            console.log(`Backend connection established via ${endpoint}`);
            backendAvailable.value = true;
            return true;
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} check failed:`, err.message);
          // Continue trying other endpoints
        }
      }
      
      // If we get here, all endpoints failed
      backendAvailable.value = false;
      connectionError.value = 'All connection attempts failed';
      return false;
    } catch (error) {
      console.error('Backend availability check failed:', error);
      backendAvailable.value = false;
      connectionError.value = error.message;
      return false;
    }
  }
};

// Create axios instance with our configuration
const createApiClient = () => {
  const instance = axios.create({
    baseURL: connectionConfig.baseUrl,
    timeout: connectionConfig.timeout,
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  // Add request interceptor for auth tokens
  instance.interceptors.request.use(
    config => {
      // Add token if available
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    error => Promise.reject(error)
  );
  
  // Add response interceptor for error handling
  instance.interceptors.response.use(
    response => response,
    error => {
      // Check if error is from backend not being available
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        backendAvailable.value = false;
        connectionError.value = error.message;
      }
      return Promise.reject(error);
    }
  );
  
  return instance;
};

// Create and export the API client
const apiClient = createApiClient();

export { 
  connectionConfig, 
  apiClient, 
  backendAvailable, 
  lastConnectionAttempt, 
  connectionError 
};
