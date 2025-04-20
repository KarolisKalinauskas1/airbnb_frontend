/**
 * Request Tracker Utility
 * Helps track and manage ongoing HTTP requests
 */

// Store for pending requests
const pendingRequests = new Map();
let requestCounter = 0;

/**
 * Track a new request with an abort controller
 * @param {string} key - Unique key for the request
 * @param {AbortController} controller - Controller to abort request if needed
 */
export function trackRequest(key, controller) {
  pendingRequests.set(key, {
    controller,
    timestamp: Date.now(),
    id: ++requestCounter
  });
}

/**
 * Remove a request from tracking
 * @param {string} key - Request key to remove
 */
export function untrackRequest(key) {
  pendingRequests.delete(key);
}

/**
 * Abort and remove a specific request
 * @param {string} key - Request key to abort
 */
export function abortRequest(key) {
  if (pendingRequests.has(key)) {
    try {
      pendingRequests.get(key).controller.abort();
    } catch (error) {
      console.error(`Error aborting request ${key}:`, error);
    }
    pendingRequests.delete(key);
  }
}

/**
 * Reset all tracked requests
 * Aborts all pending requests and clears tracking
 */
export function resetAllRequests() {
  const count = pendingRequests.size;
  
  pendingRequests.forEach((data, key) => {
    try {
      data.controller.abort();
    } catch (error) {
      console.error(`Error aborting request ${key}:`, error);
    }
  });
  
  pendingRequests.clear();
  return count;
}

/**
 * Get stats about pending requests
 */
export function getRequestStats() {
  return {
    pending: pendingRequests.size,
    details: Array.from(pendingRequests.entries()).map(([key, data]) => ({
      key,
      age: Date.now() - data.timestamp,
      id: data.id
    }))
  };
}

export default {
  trackRequest,
  untrackRequest,
  abortRequest,
  resetAllRequests,
  getRequestStats
};
