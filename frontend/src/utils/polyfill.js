/**
 * Polyfill utility to handle missing functions
 */

// Fallback implementation of monitorFunctionCall if the real one can't be imported
export function getMonitorFunctionCall() {
  try {
    // Try to import the real implementation
    const { monitorFunctionCall } = require('./loopBreaker');
    return monitorFunctionCall;
  } catch (error) {
    console.warn('Failed to import monitorFunctionCall, using polyfill');
    
    // Simple implementation that just logs and always returns true
    return function fallbackMonitor(functionId, options = {}) {
      console.log(`[Polyfill] Function call: ${functionId}`);
      return true; // Always allow
    };
  }
}

// Fallback implementation of resetFunctionCallCounter
export function getResetFunctionCallCounter() {
  try {
    // Try to import the real implementation
    const { resetFunctionCallCounter } = require('./loopBreaker');
    return resetFunctionCallCounter;
  } catch (error) {
    console.warn('Failed to import resetFunctionCallCounter, using polyfill');
    
    // Simple implementation that does nothing
    return function fallbackReset(functionId = null) {
      console.log(`[Polyfill] Reset call counter: ${functionId || 'all'}`);
    };
  }
}
