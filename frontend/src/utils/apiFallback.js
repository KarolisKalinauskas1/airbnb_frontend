import axios from '@/axios';

/**
 * Try fetching from multiple API paths with fallback
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} - Response data
 */
export async function fetchWithFallback({ 
  paths = [], 
  method = 'get', 
  params = {}, 
  data = null, 
  headers = {} 
}) {
  if (paths.length === 0) {
    throw new Error('No API paths provided');
  }
  
  let lastError = null;
  
  // Add cache-busting parameter to prevent browser caching
  const cacheBuster = Date.now();
  if (params) {
    params._cb = cacheBuster;
  }
  
  // Try each path in sequence
  for (const [index, path] of paths.entries()) {
    try {
      console.log(`Trying API path ${index + 1}/${paths.length}: ${path}`);
      
      const config = {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          // Removed X-Requested-With header which can cause CORS issues
          ...headers
        },
        params,
        // Only bypass deduplication for fallback paths
        bypassDedupe: index > 0,
        timeout: 8000, // 8 second timeout
        validateStatus: function (status) {
          return status >= 200 && status < 300; // Only accept success status codes
        }
      };
      
      let response;
      if (method.toLowerCase() === 'get') {
        response = await axios.get(path, config);
      } else if (method.toLowerCase() === 'post') {
        response = await axios.post(path, data, config);
      } else if (method.toLowerCase() === 'put') {
        response = await axios.put(path, data, config);
      } else if (method.toLowerCase() === 'delete') {
        response = await axios.delete(path, config);
      } else if (method.toLowerCase() === 'patch') {
        response = await axios.patch(path, data, config);
      } else {
        throw new Error(`Unsupported method: ${method}`);
      }
      
      // If we get here, the request succeeded
      console.log(`Successfully fetched from ${path}`);
      
      return response.data;
    } catch (error) {
      // Skip handling if this was an intentional cancellation
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        console.log(`Request to ${path} was canceled`);
        lastError = error;
        continue;
      }
      
      console.warn(`Failed to fetch from ${path}:`, error.message);
      
      // Special handling for CORS errors
      if (error.message?.includes('CORS')) {
        console.error('CORS error detected. This is a server configuration issue.');
        // We'll throw this immediately as trying other paths won't help with CORS
        throw new Error('CORS policy error: The server is not properly configured to accept requests from this origin.');
      }
      
      lastError = error;
    }
  }
  
  // If we get here, all paths failed
  console.error('All API paths failed');
  throw lastError || new Error('Failed to fetch from any path');
}
