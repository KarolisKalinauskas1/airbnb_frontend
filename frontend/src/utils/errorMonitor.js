/**
 * Simple error monitoring utility to track and log errors
 */

// Store recent errors
const recentErrors = [];
const MAX_ERRORS = 10;

/**
 * Log an error with context
 * @param {Error} error - The error object
 * @param {string} context - Where the error occurred
 * @param {Object} metadata - Additional information
 */
export function logError(error, context, metadata = {}) {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    context,
    metadata,
    timestamp: new Date().toISOString()
  };
  
  // Add to recent errors, maintaining max size
  recentErrors.unshift(errorInfo);
  if (recentErrors.length > MAX_ERRORS) {
    recentErrors.pop();
  }
  
  // Log to console
  console.error(`[${context}] ${error.message}`, metadata);
  
  // In a real app, you might send this to a monitoring service
}

/**
 * Get recent errors
 * @returns {Array} Recent errors
 */
export function getRecentErrors() {
  return [...recentErrors];
}

/**
 * Clear recent errors
 */
export function clearErrors() {
  recentErrors.length = 0;
}

/**
 * Create a monitored version of a function that logs errors
 * @param {Function} fn - Function to monitor
 * @param {string} context - Context name for errors
 * @returns {Function} Monitored function
 */
export function monitorFunction(fn, context) {
  return async function(...args) {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, context, { args });
      throw error;
    }
  };
}

export default {
  logError,
  getRecentErrors,
  clearErrors,
  monitorFunction
};
