/**
 * API request utility with enhanced headers for proper content negotiation
 */
import axios from '@/axios';

/**
 * Makes an API request with proper headers to ensure JSON responses
 * @param {string} endpoint - The endpoint to request (with or without /api/ prefix)
 * @param {Object} options - Request options
 * @returns {Promise<any>} The response data
 */
export async function apiRequest(endpoint, options = {}) {
  // Ensure we have proper headers for JSON
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Check if we should try both API and non-API endpoints
  const tryBothPrefixes = options.tryBothPrefixes !== false;
  
  // Cleanup endpoint path
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const apiPath = path.startsWith('/api/') ? path : `/api${path}`;
  const nonApiPath = path.startsWith('/api/') ? path.substring(4) : path;
  
  // Add cache busting
  const params = {
    '_t': Date.now(),
    ...options.params
  };
  
  // Try with /api prefix first
  try {
    const response = await axios({
      url: apiPath,
      method: options.method || 'GET',
      data: options.data,
      params,
      headers,
      timeout: 5000 // 5 second timeout
    });
    
    return response.data;
  } catch (apiError) {
    // If we don't want to try both paths or it's not a network error, throw
    if (!tryBothPrefixes) {
      throw apiError;
    }
    
    console.warn(`API request to ${endpoint} failed with prefix, trying without...`, apiError.message);
    
    // Try without /api prefix as fallback
    try {
      const response = await axios({
        url: nonApiPath,
        method: options.method || 'GET',
        data: options.data,
        params,
        headers,
        timeout: 5000 // 5 second timeout
      });
      
      return response.data;
    } catch (nonApiError) {
      console.error('All API paths failed:', { apiError, nonApiError });
      throw apiError; // Throw the original error
    }
  }
}

export default {
  apiRequest
};
