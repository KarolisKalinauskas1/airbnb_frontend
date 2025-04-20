import axios from '@/axios';

/**
 * Attempts multiple API request strategies to get data
 * @param {string} endpoint - The endpoint to fetch without leading slash
 * @param {Object} params - Query parameters
 * @param {Object} options - Additional options
 * @returns {Promise<any>} The API response data
 */
export async function fetchWithFallback(endpoint, params = {}, options = {}) {
  const strategies = [
    // Strategy 1: API prefix with explicit Accept header
    () => axios.get(`/api/${endpoint}`, { 
      params, 
      headers: { 'Accept': 'application/json' },
      ...options 
    }),
    
    // Strategy 2: No API prefix with explicit Accept header
    () => axios.get(`/${endpoint}`, { 
      params, 
      headers: { 'Accept': 'application/json' },
      ...options,
      bypassDedupe: true // Prevent duplicate request cancellation
    }),
    
    // Strategy 3: API prefix with extended timeout (for slow connections)
    () => axios.get(`/api/${endpoint}`, { 
      params, 
      headers: { 'Accept': 'application/json' },
      timeout: 10000, // 10 second timeout
      ...options,
      bypassDedupe: true
    })
  ];
  
  let lastError = null;
  
  for (const strategy of strategies) {
    try {
      const response = await strategy();
      return response.data;
    } catch (error) {
      console.warn(`API strategy failed: ${error.message}`);
      lastError = error;
    }
  }
  
  // All strategies failed
  throw lastError || new Error('Failed to fetch data from API');
}

/**
 * Process raw API response data into a consistent format
 * @param {any} data - The raw response data
 * @param {string} entityType - The type of entity expected (e.g., 'spot', 'booking')
 * @returns {Array} Processed array of entities
 */
export function processApiResponse(data, entityType = 'spot') {
  if (!data) return [];
  
  // If it's already an array, use it
  if (Array.isArray(data)) {
    return data;
  }
  
  // If it's wrapped in a data property
  if (data.data && Array.isArray(data.data)) {
    return data.data;
  }
  
  // If it's a single entity
  if (typeof data === 'object' && !Array.isArray(data) && data !== null) {
    // Check if it's a wrapped response with the entities in a named property
    if (data[`${entityType}s`] && Array.isArray(data[`${entityType}s`])) {
      return data[`${entityType}s`];
    }
    
    // It's a single entity, return as an array
    return [data];
  }
  
  console.warn('Unexpected API response format:', data);
  return [];
}
