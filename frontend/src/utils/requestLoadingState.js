/**
 * Request Loading State Utility
 * 
 * This utility helps prevent duplicate API requests by tracking loading states
 * of different requests identified by a unique key.
 */

// Store loading states with timestamps
const loadingStates = new Map();

/**
 * Check if a request is currently loading
 * @param {string} requestId - Unique identifier for the request
 * @param {number} cooldownPeriod - Optional cooldown period in ms to prevent rapid consecutive requests
 * @returns {boolean} - True if request is loading or in cooldown period
 */
export function isLoading(requestId, cooldownPeriod = 0) {
  if (!requestId) return false;
  
  const state = loadingStates.get(requestId);
  if (!state) return false;
  
  // If cooldown period is specified, check if request was completed recently
  if (cooldownPeriod > 0 && state.completed) {
    const timeSinceCompletion = Date.now() - state.completed;
    if (timeSinceCompletion < cooldownPeriod) {
      return true; // Still in cooldown period
    }
  }
  
  return state.loading;
}

/**
 * Set loading state for a request
 * @param {string} requestId - Unique identifier for the request
 * @param {boolean} loading - Whether the request is loading
 */
export function setLoading(requestId, loading) {
  if (!requestId) return;
  
  if (loading) {
    loadingStates.set(requestId, { 
      loading: true, 
      started: Date.now(),
      completed: null
    });
  } else {
    const current = loadingStates.get(requestId) || {};
    loadingStates.set(requestId, { 
      loading: false, 
      started: current.started || null,
      completed: Date.now()
    });
  }
}

/**
 * Clear loading state for a request
 * @param {string} requestId - Unique identifier for the request
 */
export function clearLoadingState(requestId) {
  if (!requestId) return;
  loadingStates.delete(requestId);
}

/**
 * Get all current loading states (for debugging)
 */
export function getLoadingStates() {
  return Array.from(loadingStates.entries()).map(([key, state]) => ({
    key,
    ...state,
    duration: state.loading ? Date.now() - state.started : 
              (state.completed && state.started ? state.completed - state.started : null)
  }));
}

/**
 * Reset all loading states
 */
export function resetAllLoadingStates() {
  const count = loadingStates.size;
  loadingStates.clear();
  return count;
}

export default {
  isLoading,
  setLoading,
  clearLoadingState,
  getLoadingStates,
  resetAllLoadingStates
};
