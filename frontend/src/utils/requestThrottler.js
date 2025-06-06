/** 
 * Request Throttler
 * Utility to prevent rapid-fire API requests that trigger rate limiting
 */

// Track request timestamps
const requestTimestamps = {};

// Configurable options
const DEFAULT_OPTIONS = {
  minInterval: 200, // Reduced from 300ms to 200ms
  maxRequests: 10,  // Increased from 5 to 10
  windowSize: 10000,  // Increased window size to 10 seconds
  whitelistedPaths: [
    '/api/camping-spots',   
    '/camping-spots',
    '/api/users/session',
    '/api/users/full-info', // Whitelist the problematic endpoint
    '/users/full-info',     // Also whitelist non-API version
    '/api/health',
    '/health'
  ]
};

/** 
 * Checks if a request should be allowed based on its frequency
 * @param {string} requestId - Identifier for the request (usually URL)
 * @param {Object} options - Optional configuration to override defaults
 * @returns {boolean} - Whether the request should be allowed
 */
export function shouldAllowRequest(requestId, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const now = Date.now();
  
  // Always allow whitelisted paths without throttling
  if (config.whitelistedPaths.some(path => requestId.includes(path))) {
    return true;
  }
  
  // Get or initialize timestamps for this request
  if (!requestTimestamps[requestId]) {
    requestTimestamps[requestId] = [];
  }
  
  // Clean up old timestamps
  requestTimestamps[requestId] = requestTimestamps[requestId]
    .filter(timestamp => now - timestamp < config.windowSize);
    
  // Check if we've made too many requests recently
  if (requestTimestamps[requestId].length >= config.maxRequests) {
    console.warn(`Request to ${requestId} throttled (too many in window). Max ${config.maxRequests} per ${config.windowSize}ms.`);
    return false;
  }
  
  // Check if the last request was too recent
  const lastRequest = requestTimestamps[requestId][requestTimestamps[requestId].length - 1];
  if (lastRequest && now - lastRequest < config.minInterval) {
    console.warn(`Request to ${requestId} throttled (too frequent). Wait ${config.minInterval}ms between requests.`);
    return false;
  }
  // Track this request
  requestTimestamps[requestId].push(now);
  return true;
}
/** 
 * Resets throttling for a specific request
 * @param {string} requestId - Identifier for the request
 */
export function resetThrottling(requestId) {
  delete requestTimestamps[requestId];
}
/** 
 * Reset all throttling
 */
export function resetAllThrottling() {
  Object.keys(requestTimestamps).forEach(key => delete requestTimestamps[key]);
}