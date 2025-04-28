/**
 * Mock responses for when the backend is unavailable
 */
const mockResponses = {
  '/api/ping': {
    status: 'ok',
    message: 'API is available'
  },
  '/api/health': {
    status: 'healthy',
    services: {
      database: 'up',
      cache: 'up',
      storage: 'up'
    }
  }
};

/**
 * Get a mock response for a given URL
 * @param {string} url - The URL to get a mock response for
 * @returns {object|null} - The mock response or null if no mock exists
 */
export function getMockResponse(url) {
  // Strip query params
  const baseUrl = url.split('?')[0];
  return mockResponses[baseUrl];
}

export default {
  mockResponses,
  getMockResponse
};
