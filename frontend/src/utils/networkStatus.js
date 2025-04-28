import axios from '@/axios';
import { reactive } from 'vue';

// Network status state
const networkState = reactive({
  online: navigator.onLine,
  apiAvailable: false,
  checkingApi: false,
  lastApiCheck: 0,
  retryCount: 0
});

// Health check endpoints
const HEALTH_ENDPOINTS = [
  '/api/health',
  '/health',
  '/api/ping',
  '/ping'
];

/**
 * Check if the API is available
 * @param {boolean} force Force check regardless of cache 
 * @returns {Promise<boolean>} API availability
 */
export async function checkApiAvailability(force = false) {
  const now = Date.now();
  
  // Return cached value if checked recently (within last minute)
  if (!force && now - networkState.lastApiCheck < 60000) {
    return networkState.apiAvailable;
  }
  
  if (networkState.checkingApi) {
    return networkState.apiAvailable;
  }
  
  networkState.checkingApi = true;
  
  // Try multiple health endpoints
  for (const endpoint of HEALTH_ENDPOINTS) {
    try {
      const response = await axios.get(endpoint, { 
        timeout: 3000,
        validateStatus: status => status >= 200 && status < 500 // Accept any 2xx/3xx/4xx
      });
      
      // Check if response is a mock or real
      if (response.data?.isMock) {
        // Continue to next endpoint if this was a mock
        continue;
      }
      
      if (response.status >= 200 && response.status < 300) {
        networkState.apiAvailable = true;
        networkState.lastApiCheck = now;
        networkState.retryCount = 0;
        networkState.checkingApi = false;
        return true;
      }
    } catch (error) {
      // Try next endpoint
    }
  }
  
  // All endpoints failed
  console.error('All API health check paths failed');
  networkState.apiAvailable = false;
  networkState.lastApiCheck = now;
  networkState.retryCount++;
  networkState.checkingApi = false;
  return false;
}

/**
 * Get current network state
 * @returns {Object} Current network state
 */
export function getNetworkState() {
  return { ...networkState };
}

/**
 * Initialize network monitoring
 */
export function start() {
  // Update online status when it changes
  window.addEventListener('online', () => {
    networkState.online = true;
    // Check API when we come back online
    checkApiAvailability(true);
  });
  
  window.addEventListener('offline', () => {
    networkState.online = false;
    networkState.apiAvailable = false;
  });
  
  // Initial check
  checkApiAvailability();
}

/**
 * Start network monitoring and return the state
 * @param {number} checkInterval How often to check in ms
 * @returns {Object} Network state and control functions
 */
export function startNetworkMonitoring(checkInterval = 60000) {
  start();
  
  // Create interval for periodic checking
  let intervalId = null;
  
  if (checkInterval > 0) {
    intervalId = setInterval(() => {
      checkApiAvailability();
    }, checkInterval);
  }
  
  // Return the network state and control functions
  return {
    state: networkState,
    checkNow: () => checkApiAvailability(true),
    stopMonitoring: () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    }
  };
}

export default {
  checkApiAvailability,
  getNetworkState,
  startNetworkMonitoring
};
