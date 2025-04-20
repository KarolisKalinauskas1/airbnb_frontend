/**
 * Request Throttler
 * Utility to prevent rapid-fire API requests that trigger rate limiting
 */

// Track request timestamps
const requestTimestamps = {};

// Configurable options
const DEFAULT_OPTIONS = {
  minInterval: 300, // Reduced from 500ms to 300ms
  maxRequests: 5,    // Increased from 3 to 5
  windowSize: 5000,  // 5 seconds window
  whitelistedPaths: [
    '/api/camping-spots',  // Whitelist camping spots API
    '/camping-spots',      // Also whitelist non-API version
    '/api/users/session'   // Whitelist session checks
  ]
};

/**
 * Checks if a request should be allowed based on its frequency
 * @param {string} requestId - Identifier for the request (usually URL)
 * @returns {boolean} - Whether the request should be allowed
 */
export function shouldAllowRequest(requestId, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const now = Date.now();

  // Allow whitelisted paths without throttling
  if (config.whitelistedPaths.some(path => requestId.includes(path))) {
    return true;
  }
  
  // Special handling for user info requests - allow with longer interval
  if (requestId.includes('/api/users/full-info')) {
    const lastRequest = requestTimestamps[requestId] || 0;
    const elapsed = now - lastRequest;
    
    // Use a longer interval (1000ms) for user info requests
    if (lastRequest && elapsed < 1000) {
      console.warn(`Request to ${requestId} throttled (too frequent). Wait 1000ms between requests.`);
      return false;
    }
    
    requestTimestamps[requestId] = now;
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
