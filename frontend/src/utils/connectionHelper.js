import axios from '@/axios';

/**
 * Helper to detect if the backend is available
 */
export async function isBackendAvailable() {
  try {
    await axios.get('/health', {
      timeout: 2000,
      skipBackendCheck: true,
      validateStatus: () => true
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get cached data for a particular endpoint
 * @param {string} endpoint - The endpoint to get cached data for
 * @returns {Object|null} The cached data or null if not available
 */
export function getCachedData(endpoint) {
  // User data caching
  if (endpoint.includes('/users/full-info') || endpoint.includes('/users/basic-info')) {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (e) {
        return null;
      }
    }
  }
  
  // Camping spots caching
  if (endpoint.includes('/camping-spots')) {
    const spotsData = localStorage.getItem('campingSpots');
    if (spotsData) {
      try {
        const cached = JSON.parse(spotsData);
        const cacheAge = Date.now() - cached.timestamp;
        
        // Use cached data if less than 1 hour old
        if (cacheAge < 3600000) {
          return cached.data;
        }
      } catch (e) {
        return null;
      }
    }
  }
  
  return null;
}

/**
 * Save data to cache
 * @param {string} key - The cache key
 * @param {Object} data - The data to cache
 */
export function setCachedData(key, data) {
  try {
    const cacheData = {
      timestamp: Date.now(),
      data
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
    return true;
  } catch (e) {
    console.error('Failed to cache data:', e);
    return false;
  }
}
