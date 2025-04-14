/**
 * Utility to detect and break potential infinite loops
 */

// Track calls to specific functions with timestamps
const functionCalls = {};

// Configuration
const config = {
  // Maximum calls to a function within the timeWindow before warning
  maxCallsBeforeWarning: 5,
  // Time window in milliseconds to track calls (default: 5 seconds)
  timeWindow: 5000,
  // Maximum calls before actually blocking execution 
  maxCallsBeforeBlocking: 10,
  // Is blocking enabled (as opposed to just warning)
  blockingEnabled: true,
  // Log detailed information about calls
  verboseLogging: false
};

/**
 * Monitors function calls and detects potential infinite loops
 * @param {string} functionId - Unique identifier for the function
 * @param {object} options - Optional configuration that overrides defaults
 * @returns {boolean} - Returns false if execution should be blocked
 */
export const monitorFunctionCall = (functionId, options = {}) => {
  const now = Date.now();
  const mergedOptions = { ...config, ...options };
  
  // Initialize tracking for this function if it doesn't exist
  if (!functionCalls[functionId]) {
    functionCalls[functionId] = [];
  }
  
  // Remove calls outside the time window
  functionCalls[functionId] = functionCalls[functionId].filter(
    timestamp => (now - timestamp) < mergedOptions.timeWindow
  );
  
  // Add current call
  functionCalls[functionId].push(now);
  
  // Get count of recent calls
  const recentCallsCount = functionCalls[functionId].length;
  
  // Log if verbose
  if (mergedOptions.verboseLogging) {
    console.log(`Function ${functionId} called ${recentCallsCount} times in the last ${mergedOptions.timeWindow}ms`);
  }
  
  // Check if we need to warn
  if (recentCallsCount >= mergedOptions.maxCallsBeforeWarning) {
    console.warn(`Potential infinite loop detected: Function ${functionId} called ${recentCallsCount} times in ${mergedOptions.timeWindow}ms`);
  }
  
  // Check if we need to block
  if (mergedOptions.blockingEnabled && recentCallsCount >= mergedOptions.maxCallsBeforeBlocking) {
    console.error(`Infinite loop prevented: Blocking execution of ${functionId} after ${recentCallsCount} calls in ${mergedOptions.timeWindow}ms`);
    return false;
  }
  
  return true;
};

/**
 * Reset tracking for a specific function or all functions
 * @param {string} functionId - Optional function ID to reset, or null for all
 */
export const resetTracking = (functionId = null) => {
  if (functionId) {
    delete functionCalls[functionId];
  } else {
    Object.keys(functionCalls).forEach(key => {
      delete functionCalls[key];
    });
  }
};

/**
 * Get current call stats for debugging
 */
export const getCallStats = () => {
  const now = Date.now();
  const stats = {};
  
  Object.keys(functionCalls).forEach(functionId => {
    // Count only calls within the time window
    const recentCalls = functionCalls[functionId].filter(
      timestamp => (now - timestamp) < config.timeWindow
    );
    
    stats[functionId] = {
      recentCalls: recentCalls.length,
      oldestCall: recentCalls.length > 0 ? now - Math.min(...recentCalls) : null,
      newestCall: recentCalls.length > 0 ? now - Math.max(...recentCalls) : null
    };
  });
  
  return stats;
};

export default {
  monitorFunctionCall,
  resetTracking,
  getCallStats
};
