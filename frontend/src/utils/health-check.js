/**
 * Utility to check the health of backend API endpoints
 * This can be imported and used in any component that needs to verify endpoints
 */

/**
 * Check if a specific API endpoint is accessible
 * @param {string} endpoint - The endpoint to check (e.g., '/health')
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Response data or error information
 */
export async function checkApiEndpoint(endpoint, options = {}) {
  const {
    baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000',
    timeout = 3000,
    method = 'GET',
    headers = { 'Accept': 'application/json' }
  } = options;
  
  // Use fetch API for direct access
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const url = `${baseUrl}${endpoint}`;
    console.log(`Health check: Testing ${url}`);
    
    const response = await fetch(url, {
      method,
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    return {
      success: response.ok,
      status: response.status,
      contentType,
      data,
      headers: Object.fromEntries([...response.headers.entries()])
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    return {
      success: false,
      error: error.name === 'AbortError' ? 'Request timeout' : error.message,
      endpoint
    };
  }
}

/**
 * Check multiple API endpoints at once
 * @param {Array<string>} endpoints - List of endpoints to check
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Results for each endpoint
 */
export async function checkMultipleEndpoints(endpoints, options = {}) {
  const results = {};
  
  for (const endpoint of endpoints) {
    results[endpoint] = await checkApiEndpoint(endpoint, options);
  }
  
  return results;
}

/**
 * Run a comprehensive health check on all critical API endpoints
 * @returns {Promise<Object>} - Health check results
 */
export async function runHealthCheck() {
  const criticalEndpoints = [
    '/health',
    '/api/health',
    '/camping-spots',
    '/api/camping-spots',
    '/'
  ];
  
  return await checkMultipleEndpoints(criticalEndpoints);
}
