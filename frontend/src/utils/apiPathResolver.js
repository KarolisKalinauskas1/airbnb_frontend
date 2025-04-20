/**
 * API Path Resolver
 * 
 * Utilities to help with API path resolution, especially when dealing with multiple
 * backend environments or configurations.
 */

import axios from '@/axios';

/**
 * Try multiple API paths to ensure compatibility
 * 
 * @param {string} endpoint - The endpoint to call (without leading slash)
 * @param {Object} options - Axios request options
 * @returns {Promise<any>} Response data
 */
export async function resolvedApiRequest(endpoint, options = {}) {
  // Ensure endpoint has no leading slash
  const path = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Add special bypass parameter in development mode
  const isDev = process.env.NODE_ENV !== 'production';
  const devParams = isDev ? { bypassAuth: 'true' } : {};
  
  // Try with API prefix first
  try {
    console.log(`Trying endpoint with API prefix: /api/${path}`);
    const response = await axios({
      url: `/api/${path}`,
      ...options,
      params: {
        ...options.params,
        ...devParams
      }
    });
    return response.data;
  } catch (apiError) {
    console.log(`API prefix failed (${apiError.message}), trying without prefix`);
    
    // Try without API prefix
    try {
      console.log(`Trying endpoint without prefix: /${path}`);
      const response = await axios({
        url: `/${path}`,
        ...options,
        // Add unique parameter to avoid request deduplication
        params: {
          ...(options.params || {}),
          ...devParams,
          _t: Date.now()
        }
      });
      return response.data;
    } catch (directError) {
      console.error('Both API paths failed:', directError);
      throw directError;
    }
  }
}

export default {
  resolvedApiRequest
};
