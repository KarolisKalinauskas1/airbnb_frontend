/**
 * Loop Prevention Utility
 * 
 * This utility monitors function calls to prevent infinite loops
 * by tracking how often a function is called in a given time period.
 */

// Track function calls with timestamps
const functionCallRegistry = {};

/**
 * Default settings for function call monitoring
 */
const DEFAULT_SETTINGS = {
  timeWindow: 5000,           // 5 seconds
  maxCallsBeforeWarning: 3,   // Warn after 3 calls
  maxCallsBeforeBlocking: 5,  // Block after 5 calls
};

/**
 * Monitors function calls and detects potential infinite loops
 * @param {string} functionId - Unique identifier for the function
 * @param {object} options - Configuration options
 * @returns {boolean} - true if the call should proceed, false if it should be blocked
 */
export function monitorFunctionCall(functionId, options = {}) {
  try {
    const settings = { ...DEFAULT_SETTINGS, ...options };
    const now = Date.now();
    
    // Initialize tracking for this function
    if (!functionCallRegistry[functionId]) {
      functionCallRegistry[functionId] = [];
    }
    
    // Clean up old calls outside the time window
    functionCallRegistry[functionId] = functionCallRegistry[functionId].filter(
      timestamp => (now - timestamp) < settings.timeWindow
    );
    
    // Count recent calls in the time window
    const recentCallCount = functionCallRegistry[functionId].length;
    
    // Add the current call
    functionCallRegistry[functionId].push(now);
    
    // Check if we should warn or block
    if (recentCallCount >= settings.maxCallsBeforeWarning) {
      console.warn(`Potential infinite loop detected: '${functionId}' called ${recentCallCount + 1} times in ${settings.timeWindow}ms`);
      
      if (recentCallCount >= settings.maxCallsBeforeBlocking) {
        console.error(`Loop prevention activated: Blocking '${functionId}' after ${recentCallCount + 1} calls in ${settings.timeWindow}ms`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in monitorFunctionCall:', error);
    return true; // Allow the call if there's an error in monitoring
  }
}

/**
 * Reset the call counter for a specific function or all functions
 * @param {string} functionId - Function identifier to reset, or null to reset all
 */
export function resetFunctionCallCounter(functionId = null) {
  try {
    if (functionId === null) {
      Object.keys(functionCallRegistry).forEach(key => {
        delete functionCallRegistry[key];
      });
    } else if (functionCallRegistry[functionId]) {
      delete functionCallRegistry[functionId];
    }
  } catch (error) {
    console.error('Error in resetFunctionCallCounter:', error);
  }
}

// Export a safe version that never throws
export const safeMonitorFunctionCall = (functionId, options = {}) => {
  try {
    return monitorFunctionCall(functionId, options);
  } catch (error) {
    console.warn('Error in safeMonitorFunctionCall:', error);
    return true; // Always allow on error
  }
};
