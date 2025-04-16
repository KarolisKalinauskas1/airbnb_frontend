import axios from 'axios';
import { getAuthToken } from '@/utils/tokenHandler';

// Keep track of recent requests to avoid duplicates
class RequestStats {
  constructor() {
    this.count = 0;
    this.timestamp = Date.now();
    this.failedRequestsCount = {};
  }
  
  resetCount() {
    this.count = 0;
    this.timestamp = Date.now();
    this.failedRequestsCount = {};
  }
}

const requestStats = new RequestStats();

// Add tracking for auth failures
const authFailures = {
  count: 0,
  lastFailure: 0,
  reset() {
    this.count = 0;
    this.lastFailure = 0;
  }
};

// Create axios instance with configuration
const instance = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? '' // Use relative URLs in production
    : 'http://localhost:3000', // Use specific host in development
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
    // Removed X-Requested-With header which was causing CORS issues
  },
  withCredentials: true
});

// Map to track pending requests
const pendingRequests = new Map();

// Request interceptor
instance.interceptors.request.use(
  async (config) => {
    // Generate unique key for this request
    const requestUrl = config.url;
    const method = config.method;
    const paramsKey = config.params ? JSON.stringify(config.params) : '';
    const requestKey = `${method}:${requestUrl}:${paramsKey}`;
    
    // Check if we already have an identical request in progress
    if (pendingRequests.has(requestKey) && !config.bypassDedupe) {
      console.log(`Canceling duplicate request: ${requestKey}`);
      const controller = new AbortController();
      config.signal = controller.signal;
      controller.abort();
      return config;
    }
    
    // Add this request to pending map
    pendingRequests.set(requestKey, Date.now());
    
    // Add a cleanup function
    const originalRequestComplete = config.requestComplete;
    config.requestComplete = () => {
      if (originalRequestComplete) {
        originalRequestComplete();
      }
      pendingRequests.delete(requestKey);
    };
    
    // Handle FormData correctly
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    try {
      // Get and add auth token if available
      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Unable to add auth token to request:', error);
      
      // Track auth failures to prevent loops
      const now = Date.now();
      if (now - authFailures.lastFailure < 5000) { // Within 5 seconds
        authFailures.count++;
        
        if (authFailures.count > 5) {
          console.error('Too many authentication failures detected. Possible loop.');
          throw new Error('Authentication loop detected. Please reload the page.');
        }
      } else {
        // Reset if it's been a while
        authFailures.count = 1;
      }
      authFailures.lastFailure = now;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
instance.interceptors.response.use(
  (response) => {
    // Clean up request tracking
    if (response.config.requestComplete) {
      response.config.requestComplete();
    }
    
    // Check if the content is HTML when we expected JSON
    const contentType = response.headers['content-type'] || '';
    
    if (contentType.includes('text/html') && 
        response.config.headers['Accept'] === 'application/json') {
      console.warn('Server returned HTML when JSON was expected');
      
      // Try to extract error info from HTML if possible
      let errorMessage = 'Server returned HTML when JSON was expected';
      if (typeof response.data === 'string') {
        const titleMatch = response.data.match(/<title>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          errorMessage += `: ${titleMatch[1]}`;
        }
      }
      
      // Create a more detailed error
      const error = new Error(errorMessage + '. This usually means the server is not properly configured or is returning an error page.');
      error.response = response;
      return Promise.reject(error);
    }
    
    // If data is string but should be JSON, try to parse it
    if (contentType.includes('application/json') && typeof response.data === 'string') {
      try {
        response.data = JSON.parse(response.data);
      } catch (e) {
        console.warn('Failed to parse JSON string response:', e);
      }
    }
    
    // Successful response, reset auth failure tracking
    authFailures.reset();
    
    return response;
  },
  (error) => {
    // Clean up request tracking
    if (error.config?.requestComplete) {
      error.config.requestComplete();
    }
    
    // Don't log abort errors
    if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
      // Get request URL
      const requestUrl = error.config?.url;
      
      if (requestUrl) {
        // Track failures by URL
        requestStats.failedRequestsCount[requestUrl] = 
          (requestStats.failedRequestsCount[requestUrl] || 0) + 1;
      
        // If this request fails too many times, log a warning
        if (requestStats.failedRequestsCount[requestUrl] > 5) {
          console.warn(`Request to ${requestUrl} has failed ${requestStats.failedRequestsCount[requestUrl]} times`);
        }
      }
      
      // Special handling for common error types
      if (error.code === 'ERR_NETWORK') {
        console.error('Network error - backend server may be down');
        // Try adding a more helpful message
        error.message = 'Network error - backend server may be down. Please check your connection or try again later.';
      } else if (error.response?.status === 401) {
        console.error('Authentication error:', error.response.data);
        error.message = 'Authentication required. Please log in again.';
        
        // Track auth failures
        const now = Date.now();
        if (now - authFailures.lastFailure < 5000) { // Within 5 seconds
          authFailures.count++;
          
          if (authFailures.count > 5) {
            console.error('Too many 401 errors detected. Possible auth loop.');
            // Redirect to home to break potential loop
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
          }
        } else {
          // Reset if it's been a while
          authFailures.count = 1;
        }
        authFailures.lastFailure = now;
      } else if (error.response?.status === 500) {
        console.error('Server error:', error.response.data);
        error.message = 'Server error. Please try again later.';
      } else {
        // Reset on non-auth errors
        authFailures.reset();
      }
      
      // Log detailed error info
      if (error.response) {
        console.error(`Error response (${error.response.status}):`, error.response.data);
      }
    }
    
    return Promise.reject(error);
  }
);

// Add response interceptor to handle HTML responses
instance.interceptors.response.use(
  (response) => {
    // Check if we got HTML when we expected JSON
    if (
      response.config.headers.Accept &&
      response.config.headers.Accept.includes('application/json') && 
      response.headers['content-type'] && 
      response.headers['content-type'].includes('text/html')
    ) {
      const htmlResponse = typeof response.data === 'string' && response.data.includes('<!DOCTYPE html');
      if (htmlResponse) {
        // Create a specific error for this case
        const error = new Error('Server returned HTML when JSON was expected: ' + 
          response.data.substring(0, 100) + '...');
        error.config = response.config;
        error.response = response;
        error.isHtmlError = true;
        throw error;
      }
    }
    
    // Process the response normally
    if (response.config.requestComplete) {
      response.config.requestComplete();
    }
    return response;
  },
  (error) => {
    if (error.config && error.config.requestComplete) {
      error.config.requestComplete();
    }
    return Promise.reject(error);
  }
);

// Method to reset request stats
instance.resetRequestStats = () => {
  requestStats.resetCount();
  pendingRequests.clear();
};

// Add method to reset auth failures
instance.resetAuthFailures = () => {
  authFailures.reset();
};

export default instance;