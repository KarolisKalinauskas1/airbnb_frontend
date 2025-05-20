import axios from '@/axios';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
/**
 * Health check state
 */
const state = {
  api: {
    isHealthy: true,
    lastCheck: 0,
    checkInProgress: false,
    consecutiveFailures: 0
  },
  network: {
    isOnline: navigator.onLine,
    lastCheck: 0
  },
  auth: {
    isValid: true,
    lastCheck: 0,
    sessionInfo: null
  },
  settings: {
    checkInterval: 300000, // 5 minutes
    timeout: 5000,
    maxConsecutiveFailures: 2,
    endpoints: ['/health', '/api/health', '/api/ping']
  }
};
/**
 * Check backend API health with improved error handling
 * @param {boolean} force Force check regardless of timing
 * @returns {Promise<boolean>} True if healthy
 */
export async function checkBackendHealth(force = false) {
  const now = Date.now();
  // Prevent concurrent checks or too frequent checks
  if (!force) {
    if (state.api.checkInProgress) {
      return state.api.isHealthy;
    }
    if (now - state.api.lastCheck < state.settings.checkInterval) {
      return state.api.isHealthy;
    }
  }
  state.api.checkInProgress = true;
  state.api.lastCheck = now;
  // If we're offline according to browser API, don't bother trying API
  if (!navigator.onLine) {
    state.api.isHealthy = false;
    state.api.checkInProgress = false;
    return false;
  }
  try {
    // Try each endpoint in sequence until one works
    for (const endpoint of state.settings.endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), state.settings.timeout);
        const response = await axios.get(endpoint, {
          timeout: state.settings.timeout,
          signal: controller.signal,
          headers: {}
        });
        clearTimeout(timeoutId);
        if (response.status >= 200 && response.status < 300) {
          state.api.isHealthy = true;
          state.api.consecutiveFailures = 0;
          state.api.checkInProgress = false;
          return true;
        }
      } catch (err) {
        console.warn(`Health check to ${endpoint} failed: ${err.message}`);
        // Continue to the next endpoint
      }
    }
    // If we get here, all endpoints failed
    state.api.consecutiveFailures++;
    if (state.api.consecutiveFailures >= state.settings.maxConsecutiveFailures) {
      state.api.isHealthy = false;
    }
    return state.api.isHealthy;
  } catch (error) {
    console.error('Health check failed:', error);
    state.api.consecutiveFailures++;
    if (state.api.consecutiveFailures >= state.settings.maxConsecutiveFailures) {
      state.api.isHealthy = false;
    }
    return state.api.isHealthy;
  } finally {
    state.api.checkInProgress = false;
  }
}
/**
 * Check network connectivity (online/offline status) with better reliability
 * @returns {boolean} True if online
 */
export function checkNetworkConnectivity() {
  state.network.isOnline = navigator.onLine;
  state.network.lastCheck = Date.now();
  // If the browser says we're offline, trust it
  if (!state.network.isOnline) {
    return false;
  }
  // If we have recent API health check data, use it to confirm online status
  const apiCheckAge = Date.now() - state.api.lastCheck;
  if (apiCheckAge < 60000) { // Less than 1 minute old
    return state.api.isHealthy;
  }
  return state.network.isOnline;
}
/**
 * Check authentication state
 * @param {boolean} force Force check regardless of timing
 * @returns {Promise<object>} Auth state info
 */
export async function checkAuthState(force = false) {
  const now = Date.now();
  // Don't check too frequently unless forced
  if (!force && now - state.auth.lastCheck < state.settings.checkInterval) {
    return {
      isValid: state.auth.isValid,
      sessionInfo: state.auth.sessionInfo
    };
  }
  try {
    // First check if Supabase has a session
    const { data: { session } } = await supabase.auth.getSession();
    // Get auth store to check local state
    const authStore = useAuthStore();
    const isLoggedIn = authStore.isLoggedIn;
    const hasToken = !!authStore.token;
    const hasUserData = !!authStore.fullUser;
    // Check token expiration
    let tokenExpired = false;
    if (session) {
      const expiresAt = new Date(session.expires_at * 1000);
      tokenExpired = expiresAt < new Date();
    }
    // Log detailed session info for debugging
    // Update state
    state.auth.isValid = !!session && !tokenExpired;
    state.auth.lastCheck = now;
    state.auth.sessionInfo = { 
      hasSession: !!session,
      isLoggedIn,
      hasToken,
      hasUserData,
      tokenExpired
    };
    return {
      isValid: state.auth.isValid,
      lastChecked: new Date(state.auth.lastCheck),
      sessionInfo: state.auth.sessionInfo
    };
  } catch (error) {
    console.error('Auth check error:', error);
    state.auth.lastCheck = now;
    return {
      isValid: false,
      error: error.message
    };
  }
}
/**
 * Get current health state
 */
export function getHealthState() {
  return {
    api: {
      isHealthy: state.api.isHealthy,
      lastCheckedAt: new Date(state.api.lastCheck),
      consecutiveFailures: state.api.consecutiveFailures
    },
    network: {
      isOnline: state.network.isOnline,
      lastCheckedAt: new Date(state.network.lastCheck)
    },
    auth: {
      isValid: state.auth.isValid,
      lastCheckedAt: new Date(state.auth.lastCheck),
      sessionInfo: state.auth.sessionInfo
    }
  };
}
/**
 * Configure health check settings
 */
export function configureHealthCheck(options = {}) {
  if (options.checkInterval) state.settings.checkInterval = options.checkInterval;
  if (options.timeout) state.settings.timeout = options.timeout;
  if (options.endpoints) state.settings.endpoints = options.endpoints;
  if (options.maxConsecutiveFailures) state.settings.maxConsecutiveFailures = options.maxConsecutiveFailures;
}
/**
 * Force the API health status to a specific value (useful for testing)
 * @param {boolean} isHealthy Whether the API should be considered healthy
 */
export function forceApiHealthStatus(isHealthy) {
  state.api.isHealthy = isHealthy;
  state.api.lastCheck = Date.now();
}
// Set up network status event listeners
window.addEventListener('online', () => {
  state.network.isOnline = true;
  state.network.lastCheck = Date.now();
});
window.addEventListener('offline', () => {
  state.network.isOnline = false;
  state.network.lastCheck = Date.now();
  // When we go offline, also mark API as unhealthy
  state.api.isHealthy = false;
});
export default {
  checkBackendHealth,
  checkNetworkConnectivity,
  checkAuthState,
  getHealthState,
  configureHealthCheck,
  forceApiHealthStatus
};
