/**
 * Mock API handlers for local development and testing
 * This helps when the backend is unavailable
 */

import { getMockResponse } from './mockResponses';

// Mock response for ping endpoint
export function handleMockPing(request) {
  return {
    status: 200,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: 'local-mock',
      message: 'Mock API is functioning'
    }
  };
}

// Mock response for health endpoint
export function handleMockHealth(request) {
  return {
    status: 200,
    data: {
      status: 'healthy',
      version: '1.0.0',
      uptime: 0,
      timestamp: new Date().toISOString(),
      services: {
        database: true,
        auth: true
      }
    }
  };
}

// Setup function to install mock interceptors
export function setupMockInterceptors(apiClient) {
  // Only intercept in development
  if (process.env.NODE_ENV !== 'development') return;

  apiClient.interceptors.request.use(async (config) => {
    // Only mock specific endpoints
    if (config.url.includes('/ping') || config.url.includes('/health')) {
      const mockResponse = getMockResponse(config.url);
      if (mockResponse) {
        // Return mock response immediately without delay
        return Promise.reject({
          config,
          response: {
            status: 200,
            data: mockResponse
          }
        });
      }
    }
    return config;
  });
}

export default {
  setupMockInterceptors,
  handleMockPing,
  handleMockHealth
};
