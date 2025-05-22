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
  
  // Cleanup endpoint path
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const response = await axios({
    url: path,
    method: options.method || 'GET',
    data: options.data,
    params: options.params,
    headers,
    timeout: 5000 // 5 second timeout
  });
  
  return response.data;
}

export default {
  apiRequest
};
