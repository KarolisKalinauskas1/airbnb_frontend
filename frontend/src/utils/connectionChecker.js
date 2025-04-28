/**
 * Utilities to check the application's connection to backend services
 */
import axios from '@/axios';

// Track connection status
const connectionStatus = {
  backend: null, // null = unknown, true = connected, false = disconnected
  lastCheck: 0
};

/**
 * Check if the backend API is reachable
 * @param {boolean} force Force a new check even if we have a recent result
 * @returns {Promise<boolean>} True if backend is reachable
 */
export async function checkBackendConnection(force = false) {
  // Use cached result if we checked recently (within last 30 seconds)
  if (!force && connectionStatus.lastCheck > Date.now() - 30000) {
    return connectionStatus.backend;
  }
  
  try {
    // Try the fastest endpoint - health check
    const response = await axios.get('/health', { 
      timeout: 3000,
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    connectionStatus.backend = true;
    connectionStatus.lastCheck = Date.now();
    return true;
  } catch (error) {
    console.warn('Backend connection check failed:', error.message);
    
    // Try one more endpoint as fallback
    try {
      const response = await axios.get('/', { timeout: 3000 });
      connectionStatus.backend = true;
      connectionStatus.lastCheck = Date.now();
      return true;
    } catch (fallbackError) {
      connectionStatus.backend = false;
      connectionStatus.lastCheck = Date.now();
      return false;
    }
  }
}

/**
 * Check if the system is ready to authenticate users
 * First checks if backend is available,
 * then checks if authentication systems are working
 */
export async function checkAuthSystemAvailability() {
  // First check if backend is available
  const backendAvailable = await checkBackendConnection();
  if (!backendAvailable) {
    return {
      available: false,
      message: 'Backend server is currently unavailable'
    };
  }
  
  // Then check auth service
  try {
    const response = await axios.get('/api/auth/status', { timeout: 3000 });
    return {
      available: true,
      message: 'Authentication system is available'
    };
  } catch (error) {
    // If we get a 500 error from auth status, Supabase might be down
    if (error.response?.status === 500) {
      return {
        available: false,
        message: 'Authentication service temporarily unavailable',
        serverError: true
      };
    }
    
    // Other errors
    return {
      available: true, // Still mark as available, might just be a 401 unauthorized
      message: 'Backend available but auth check incomplete'
    };
  }
}

export default {
  checkBackendConnection,
  checkAuthSystemAvailability
};
