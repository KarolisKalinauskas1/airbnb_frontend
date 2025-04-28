import axios from '@/axios';

/**
 * API Diagnostics Utility
 * For troubleshooting API connection issues
 */

/**
 * Run a diagnostic test on API connections
 * @returns {Promise<Object>} Diagnostic results
 */
export async function runApiDiagnostics() {
  console.log('=== API DIAGNOSTICS ===');
  const results = {
    internetConnected: navigator.onLine,
    endpointTests: {},
    localStorage: {},
    timings: {}
  };

  // Check basic internet connectivity
  console.log('Internet connected:', navigator.onLine);

  // Test critical endpoints
  const endpoints = [
    '/health',
    '/api/health',
    '/',
    '/api/users/full-info'
  ];

  // Check localStorage
  try {
    const userData = localStorage.getItem('userData');
    results.localStorage.userDataExists = !!userData;

    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        results.localStorage.userDataValid = true;
        results.localStorage.userEmail = parsed.email;
        results.localStorage.isOwner = parsed.isowner;
        results.localStorage.lastFetch = localStorage.getItem('last_user_fetch_time');
        
        // Check how old the data is
        if (results.localStorage.lastFetch) {
          const ageMs = Date.now() - parseInt(results.localStorage.lastFetch);
          const ageMinutes = Math.round(ageMs / (1000 * 60));
          results.localStorage.dataAgeMinutes = ageMinutes;
        }
      } catch (e) {
        results.localStorage.userDataValid = false;
        results.localStorage.parseError = e.message;
      }
    }
  } catch (e) {
    results.localStorage.error = e.message;
  }

  // Test endpoints with timing
  for (const endpoint of endpoints) {
    const startTime = performance.now();
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      const response = await axios.get(endpoint, {
        timeout: 5000,
        validateStatus: () => true, // Accept any status code
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      results.endpointTests[endpoint] = {
        success: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.statusText,
        responseTime: responseTime + 'ms',
        dataType: typeof response.data
      };
      
      console.log(`${endpoint}: ${response.status} ${response.statusText} (${responseTime}ms)`);
    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      results.endpointTests[endpoint] = {
        success: false,
        error: error.message,
        code: error.code,
        responseTime: responseTime + 'ms'
      };
      
      console.log(`${endpoint}: ERROR - ${error.message} (${responseTime}ms)`);
    }
  }

  console.log('=== END DIAGNOSTICS ===');
  return results;
}

/**
 * Clear cached API data to force fresh requests
 */
export function clearApiCache() {
  const cacheKeys = [
    'userData',
    'dashboardData',
    'last_user_fetch_time'
  ];
  
  for (const key of cacheKeys) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
  
  console.log('API cache cleared');
  return { success: true, clearedKeys: cacheKeys };
}
