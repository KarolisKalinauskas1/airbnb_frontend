import axios from '@/axios';
import { useAuthStore } from '@/stores/auth';

/**
 * API Service for consistent data fetching across the application
 */
class ApiService {
  /**
   * Make an API request with automatic auth handling
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      data = null,
      params = {},
      withAuth = false
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
    
    const response = await axios({
      url: endpoint.startsWith('/') ? endpoint : `/${endpoint}`,
      method,
      data,
      params,
      headers
    });
    
    return response.data;
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
