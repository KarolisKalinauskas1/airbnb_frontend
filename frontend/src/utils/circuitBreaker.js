/**
 * Circuit breaker pattern implementation
 * Helps prevent cascading failures by limiting repeated calls
 */

// Track function calls with timestamps
const callRegistry = {};

const DEFAULT_SETTINGS = {
  timeWindow: 5000,           // 5 seconds
  maxCallsBeforeWarning: 3,   // Warn after 3 calls
  maxCallsBeforeBlocking: 5,  // Block after 5 calls
};

const circuitBreaker = {
  /**
   * Monitor function calls to prevent cascading failures
   * @param {string} functionId - Unique identifier for the function being monitored
   * @param {object} options - Configuration options
   * @returns {boolean} - true if the call should proceed, false if it should be blocked
   */
  monitor(functionId, options = {}) {
    const settings = { ...DEFAULT_SETTINGS, ...options };
    const now = Date.now();
    
    // Initialize tracking for this function
    if (!callRegistry[functionId]) {
      callRegistry[functionId] = [];
    }
    
    // Clean up old calls outside the time window
    callRegistry[functionId] = callRegistry[functionId].filter(
      timestamp => (now - timestamp) < settings.timeWindow
    );
    
    // Count recent calls in the time window
    const recentCallCount = callRegistry[functionId].length;
    
    // Add the current call
    callRegistry[functionId].push(now);
    
    // Check if we should warn or block
    if (recentCallCount >= settings.maxCallsBeforeWarning) {
      console.warn(`Circuit breaker warning: '${functionId}' called ${recentCallCount + 1} times in ${settings.timeWindow}ms`);
      
      if (recentCallCount >= settings.maxCallsBeforeBlocking) {
        console.error(`Circuit breaker tripped: Blocking '${functionId}' after ${recentCallCount + 1} calls in ${settings.timeWindow}ms`);
        return false;
      }
    }
    
    return true;
  },
  
  /**
   * Reset the circuit breaker for a specific function or all functions
   * @param {string} functionId - Function identifier to reset, or null to reset all
   */
  reset(functionId = null) {
    if (functionId === null) {
      Object.keys(callRegistry).forEach(key => {
        delete callRegistry[key];
      });
    } else if (callRegistry[functionId]) {
      delete callRegistry[functionId];
    }
  }
};

export default circuitBreaker;
