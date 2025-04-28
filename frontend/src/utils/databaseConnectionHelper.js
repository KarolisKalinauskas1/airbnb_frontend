/**
 * Database connection helper utility
 * Monitors and diagnoses database connection issues
 */

import axios from '@/axios';

// Connection states
export const DB_CONNECTION_STATE = {
  UNKNOWN: 'unknown',
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  DISCONNECTED: 'disconnected',
  NETWORK_ERROR: 'network_error',
  AUTH_ERROR: 'auth_error',
  SERVER_ERROR: 'server_error'
};

// Default options
const DEFAULT_OPTIONS = {
  checkInterval: 30000,
  endpoints: ['/api/status', '/health', '/api/health'],
  timeout: 5000,
};

/**
 * Create a database connection monitor
 * @param {Object} options Monitor options
 * @returns {Object} Monitor control functions and state
 */
export function createDatabaseMonitor(options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let interval = null;
  
  const state = {
    status: DB_CONNECTION_STATE.UNKNOWN,
    lastChecked: null,
    checking: false,
    error: null,
    reconnectAttempts: 0,
    isOffline: !navigator.onLine,
    details: {}
  };
  
  // Check database connection
  const checkConnection = async () => {
    if (state.checking) return state;
    
    state.checking = true;
    
    // If device is offline, update state accordingly
    if (!navigator.onLine) {
      state.status = DB_CONNECTION_STATE.NETWORK_ERROR;
      state.isOffline = true;
      state.checking = false;
      state.lastChecked = new Date();
      return state;
    }
    
    state.isOffline = false;
    
    try {
      // Try each endpoint until one works
      for (const endpoint of config.endpoints) {
        try {
          const response = await axios.get(endpoint, { timeout: config.timeout });
          
          // Check for database status in response
          if (response.data && typeof response.data === 'object') {
            state.details = response.data;
            
            // Look for database status indicators
            if (response.data.database === false || response.data.databaseConnected === false) {
              state.status = DB_CONNECTION_STATE.DISCONNECTED;
              state.error = 'Database server is unreachable';
              state.lastChecked = new Date();
              state.checking = false;
              return state;
            }
          }
          
          // If we got here, assume connected
          state.status = DB_CONNECTION_STATE.CONNECTED;
          state.error = null;
          state.reconnectAttempts = 0;
          state.lastChecked = new Date();
          state.checking = false;
          return state;
        } catch (err) {
          // Try next endpoint
        }
      }
      
      // If we get here, all endpoints failed
      throw new Error('All connection endpoints failed');
    } catch (error) {
      state.reconnectAttempts++;
      state.error = error.message;
      state.lastChecked = new Date();
      
      // Categorize error
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          state.status = DB_CONNECTION_STATE.AUTH_ERROR;
        } else if (error.response.status >= 500) {
          state.status = DB_CONNECTION_STATE.SERVER_ERROR;
        } else {
          state.status = DB_CONNECTION_STATE.DISCONNECTED;
        }
      } else if (error.request) {
        state.status = DB_CONNECTION_STATE.NETWORK_ERROR;
      } else {
        state.status = DB_CONNECTION_STATE.DISCONNECTED;
      }
      
      return state;
    } finally {
      state.checking = false;
    }
  };
  
  // Start monitoring
  const start = () => {
    // Handle online/offline events
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', () => {
      state.status = DB_CONNECTION_STATE.NETWORK_ERROR;
      state.isOffline = true;
      state.lastChecked = new Date();
    });
    
    // Initial check
    checkConnection();
    
    // Set up interval check
    if (interval) clearInterval(interval);
    interval = setInterval(checkConnection, config.checkInterval);
    
    return { state, stop };
  };
  
  // Stop monitoring
  const stop = () => {
    window.removeEventListener('online', checkConnection);
    window.removeEventListener('offline', () => {});
    
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  };
  
  return {
    state,
    checkConnection,
    start,
    stop
  };
}

/**
 * Check if database is connected
 * @param {number} timeout Request timeout in ms
 * @returns {Promise<boolean>} True if database is connected
 */
export async function isDatabaseConnected(timeout = 5000) {
  try {
    // Try standard endpoints
    for (const endpoint of ['/api/status', '/health', '/api/health']) {
      try {
        const response = await axios.get(endpoint, { timeout });
        
        // Check if response contains database status info
        if (response.data && typeof response.data === 'object') {
          if (response.data.database === false || 
              response.data.databaseConnected === false) {
            return false;
          } else if (response.data.database === true || 
                    response.data.databaseConnected === true) {
            return true;
          }
        }
        
        // If we get any successful response, assume connected
        return true;
      } catch (err) {
        // Try next endpoint
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

export default {
  createDatabaseMonitor,
  isDatabaseConnected,
  DB_CONNECTION_STATE
};
