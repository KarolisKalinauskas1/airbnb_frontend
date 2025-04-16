/**
 * Request Manager
 * 
 * Utility to manage API requests and prevent duplicates and race conditions
 */

// Tracking for active requests
const activeRequests = new Map();
const requestHistory = {};

// Default configuration
const DEFAULT_CONFIG = {
  // How long to wait before allowing the same request again
  cooldownPeriod: 5000,
  // Max number of times the same endpoint can be called in the cooldown period
  maxFrequency: 2,
  // Cache successful responses
  cacheResponses: true,
  // Cache TTL in milliseconds (5 minutes)
  cacheTTL: 5 * 60 * 1000
};

// Response cache
const responseCache = new Map();

/**
 * Tracks and manages requests to prevent duplicates and excessive calls
 * @param {string} requestKey - Unique identifier for the request
 * @param {function} requestFn - Async function that makes the actual request
 * @param {object} options - Configuration options
 * @returns {Promise} - Result of the request
 */
export async function managedRequest(requestKey, requestFn, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };
  const now = Date.now();
  
  // Check if this request is still in flight
  if (activeRequests.has(requestKey)) {
    console.log(`Request already in progress: ${requestKey}`);
    return activeRequests.get(requestKey);
  }
  
  // Check response cache
  if (config.cacheResponses && responseCache.has(requestKey)) {
    const cachedData = responseCache.get(requestKey);
    if (now - cachedData.timestamp < config.cacheTTL) {
      console.log(`Using cached response for: ${requestKey}`);
      return Promise.resolve(cachedData.data);
    } else {
      // Cache expired, remove it
      responseCache.delete(requestKey);
    }
  }
  
  // Check frequency
  if (!requestHistory[requestKey]) {
    requestHistory[requestKey] = [];
  }
  
  // Clean up old history entries
  requestHistory[requestKey] = requestHistory[requestKey].filter(
    timestamp => now - timestamp < config.cooldownPeriod
  );
  
  // Check if we've made too many requests recently
  if (requestHistory[requestKey].length >= config.maxFrequency) {
    console.warn(`Too many requests for ${requestKey} - cooling down`);
    
    // If we're supposed to return cached data during cooldown
    if (config.cacheResponses && responseCache.has(requestKey)) {
      return Promise.resolve(responseCache.get(requestKey).data);
    }
    
    // Calculate when we can make this request again
    const oldestRequest = Math.min(...requestHistory[requestKey]);
    const cooldownRemaining = config.cooldownPeriod - (now - oldestRequest);
    
    return Promise.reject({
      cooldown: true,
      message: `Request rate limited. Try again in ${Math.ceil(cooldownRemaining / 1000)} seconds`,
      retryAfter: cooldownRemaining
    });
  }
  
  // Track this request
  requestHistory[requestKey].push(now);
  
  // Create the managed request promise
  const requestPromise = (async () => {
    try {
      const result = await requestFn();
      
      // Cache successful response
      if (config.cacheResponses) {
        responseCache.set(requestKey, {
          timestamp: Date.now(),
          data: result
        });
      }
      
      return result;
    } finally {
      // Clean up this request when done
      activeRequests.delete(requestKey);
    }
  })();
  
  // Store the promise to allow other code to wait for it
  activeRequests.set(requestKey, requestPromise);
  
  return requestPromise;
}

/**
 * Clears all request history and caches
 */
export function clearRequestCache() {
  activeRequests.clear();
  Object.keys(requestHistory).forEach(key => {
    delete requestHistory[key];
  });
  responseCache.clear();
}

/**
 * Clears cache for a specific request
 * @param {string} requestKey - Key of the request to clear
 */
export function clearRequestCacheFor(requestKey) {
  responseCache.delete(requestKey);
  delete requestHistory[requestKey];
}

/**
 * Checks if a request is currently in progress
 * @param {string} requestKey - Key of the request to check
 * @returns {boolean} - True if request is in progress
 */
export function isRequestInProgress(requestKey) {
  return activeRequests.has(requestKey);
}
