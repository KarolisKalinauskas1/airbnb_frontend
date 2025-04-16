import axios from '@/axios';

/**
 * Centralized API service that handles:
 * - Error handling
 * - Retry logic
 * - API/non-API endpoint fallbacks
 */
class ApiService {
  /**
   * Make an API request with fallback options
   * @param {Object} options - Request options
   * @param {string} options.endpoint - API endpoint (without /api prefix)
   * @param {string} options.method - HTTP method (GET, POST, etc.)
   * @param {Object} options.params - URL parameters
   * @param {Object} options.data - Request body data
   * @param {Object} options.headers - Additional headers
   * @param {boolean} options.withCredentials - Include credentials
   * @param {boolean} options.skipFallback - Skip fallback attempts
   * @param {number} options.retries - Number of retries (default: 1)
   * @returns {Promise<Object>} API response
   */
  async request({
    endpoint,
    method = 'GET',
    params = {},
    data = null,
    headers = {},
    withCredentials = true,
    skipFallback = false,
    retries = 1
  }) {
    // Ensure headers include Accept: application/json
    const requestHeaders = {
      'Accept': 'application/json',
      ...headers
    };
    
    // Common request config
    const config = {
      params,
      headers: requestHeaders,
      withCredentials
    };
    
    // Try API endpoint first
    try {
      console.log(`Trying API endpoint: /api${endpoint}`);
      const response = await axios({
        method,
        url: `/api${endpoint}`,
        data,
        ...config
      });
      
      return response.data;
    } catch (apiError) {
      console.warn(`API endpoint failed: /api${endpoint}`, apiError.message);
      
      // Skip fallback if specified or if it's not a connection issue
      if (skipFallback || 
          !(apiError.code === 'ERR_NETWORK' || 
            apiError.code === 'ECONNREFUSED' ||
            apiError.response?.status === 404)) {
        throw apiError;
      }
      
      // Try non-API endpoint as fallback
      try {
        console.log(`Trying non-API endpoint: ${endpoint}`);
        const fallbackResponse = await axios({
          method,
          url: endpoint,
          data,
          ...config,
          // Add a unique parameter to avoid request deduplication
          params: { ...params, _: Date.now() }
        });
        
        return fallbackResponse.data;
      } catch (fallbackError) {
        console.error(`Fallback endpoint failed: ${endpoint}`, fallbackError.message);
        
        // Retry if we have retries left
        if (retries > 0) {
          console.log(`Retrying request with ${retries} attempts remaining...`);
          return this.request({
            endpoint,
            method,
            params,
            data,
            headers,
            withCredentials,
            skipFallback,
            retries: retries - 1
          });
        }
        
        // If all attempts fail, throw the original error
        throw apiError;
      }
    }
  }
  
  /**
   * GET request with fallback
   */
  async get(endpoint, params = {}, options = {}) {
    return this.request({
      endpoint,
      method: 'GET',
      params,
      ...options
    });
  }
  
  /**
   * POST request with fallback
   */
  async post(endpoint, data = null, options = {}) {
    return this.request({
      endpoint,
      method: 'POST',
      data,
      ...options
    });
  }
  
  /**
   * PUT request with fallback
   */
  async put(endpoint, data = null, options = {}) {
    return this.request({
      endpoint,
      method: 'PUT',
      data,
      ...options
    });
  }
  
  /**
   * DELETE request with fallback
   */
  async delete(endpoint, options = {}) {
    return this.request({
      endpoint,
      method: 'DELETE',
      ...options
    });
  }
}

export default new ApiService();
