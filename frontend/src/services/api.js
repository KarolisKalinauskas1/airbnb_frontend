import axios from '@/axios';
import { useAuthStore } from '@/stores/auth';

/**
 * API Service for consistent data fetching across the application
 * Handles API endpoint fallbacks and error recovery
 */
class ApiService {
  /**
   * Make an API request with automatic auth handling and fallback paths
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      data = null,
      params = {},
      withAuth = false,
      tryBothPaths = true
    } = options;
    
    // Prepare headers
    let headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    // Add auth header if needed
    if (withAuth) {
      const authStore = useAuthStore();
      const token = await authStore.getAuthToken();
      
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }
      
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Try with /api prefix first
    try {
      const apiPath = endpoint.startsWith('/api/') ? endpoint : `/api${endpoint}`;
      
      const response = await axios({
        url: apiPath,
        method,
        data,
        params,
        headers
      });
      
      return response.data;
    } catch (apiError) {
      // If we don't want to try both paths or it's not a network error, throw
      if (!tryBothPaths) {
        throw apiError;
      }
      
      console.warn(`API request to ${endpoint} failed with prefix, trying without...`, apiError.message);
      
      // Try without /api prefix as fallback
      try {
        const simplePath = endpoint.startsWith('/api/') 
          ? endpoint.substring(4) 
          : endpoint;
        
        const response = await axios({
          url: simplePath,
          method,
          data,
          params,
          headers
        });
        
        return response.data;
      } catch (nonApiError) {
        console.error('All API paths failed:', { apiError, nonApiError });
        throw apiError; // Throw the original error
      }
    }
  }
  
  /**
   * GET request wrapper
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'GET'
    });
  }
  
  /**
   * POST request wrapper
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      data
    });
  }
  
  /**
   * PUT request wrapper
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      data
    });
  }
  
  /**
   * DELETE request wrapper
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'DELETE'
    });
  }
}

export default new ApiService();
