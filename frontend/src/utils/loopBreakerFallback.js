/**
 * Fallback implementation of loop breaker utilities
 * Used when the main implementation cannot be loaded
 */

// Simple monitoring function that always returns true
export function monitorFunctionCall(functionId, options = {}) {
  console.log(`[Fallback] Monitoring function call: ${functionId}`);
  return true;
}

// Simple reset function that does nothing
export function resetFunctionCallCounter(functionId = null) {
  console.log(`[Fallback] Resetting function counter: ${functionId || 'all'}`);
}
