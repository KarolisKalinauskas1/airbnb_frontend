/**
 * Utility functions for route/path checking
 */

/**
 * Check if the given URL path is an API route
 * @param {string} url - The URL path to check
 * @returns {boolean} - True if the URL is an API route
 */
export function isApiRoute(url) {
  // Strip query parameters if present
  const path = url.split('?')[0];
  
  // Define API path prefixes
  const apiPrefixes = ['/api/', '/users/', '/camping-spots/', '/bookings/', '/health'];
  
  // Check if the path starts with any of the API prefixes
  return apiPrefixes.some(prefix => path.startsWith(prefix));
}

/**
 * Get base endpoint without query parameters
 * @param {string} url - The URL to process
 * @returns {string} - The endpoint without query parameters
 */
export function getBaseEndpoint(url) {
  return url.split('?')[0];
}

export default {
  isApiRoute,
  getBaseEndpoint
};
