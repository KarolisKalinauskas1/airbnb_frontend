import axios from '@/axios';
import { checkBackendHealth, checkNetworkConnectivity } from './healthCheck';

// Global connection state
const connectionState = {
  backendAvailable: false,
  lastCheck: null,
  checkingStatus: false
};

/**
 * Check if the backend is available
 * @param {boolean} force - Force a new check even if one was done recently
 * @returns {Promise<boolean>} - Whether the backend is available
 */
export async function checkBackendAvailability(force = false) {
  // Throttle checks to avoid too many requests
  if (!force && connectionState.lastCheck && Date.now() - connectionState.lastCheck < 5000) {
    return connectionState.backendAvailable;
  }
  
  // Prevent multiple simultaneous checks
  if (connectionState.checkingStatus) {
    return connectionState.backendAvailable;
  }
  
  connectionState.checkingStatus = true;
  
  try {
    // Try the safer non-authenticated health check first
    const healthResult = await checkBackendHealth();
    
    if (healthResult.available) {
      connectionState.backendAvailable = true;
      connectionState.lastCheck = Date.now();
      connectionState.checkingStatus = false;
      return true;
    }
    
    // Fall back to basic connectivity check
    const networkAvailable = await checkNetworkConnectivity();
    
    connectionState.backendAvailable = networkAvailable;
    connectionState.lastCheck = Date.now();
    return networkAvailable;
  } catch (error) {
    console.error('Backend availability check failed:', error);
    connectionState.backendAvailable = false;
    return false;
  } finally {
    connectionState.checkingStatus = false;
  }
}

/**
 * Check if a specific endpoint is available
 * @param {string} endpoint - The endpoint to check
 * @returns {Promise<boolean>} - Whether the endpoint is available
 */
export async function checkEndpointAvailability(endpoint) {
  try {
    await axios.get(endpoint, { 
      params: { _t: Date.now() },
      timeout: 3000,
      withCredentials: false  // Important: Don't send credentials for health checks
    });
    return true;
  } catch (error) {
    console.warn(`Endpoint ${endpoint} check failed:`, error.message);
    return false;
  }
}

// Export default object with all functions
export default {
  checkBackendAvailability,
  checkEndpointAvailability,
  get isBackendAvailable() {
    return connectionState.backendAvailable;
  }
};
