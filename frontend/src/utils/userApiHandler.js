/**
 * Special API handler for user endpoints
 * Handles HTML responses and other issues specifically for user data
 */
import axios from 'axios';

/**
 * Fetches user data with multiple fallbacks
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} User data
 */
export async function fetchUserData(token) {
  if (!token) {
    throw new Error('No authentication token provided');
  }
  
  const baseHeaders = { 
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  // First try the direct endpoint
  try {
    const response = await axios.get('/users/full-info', {
      headers: baseHeaders,
      timeout: 8000,
      params: { _t: Date.now() } // Cache buster
    });
    
    // Check for HTML response
    if (typeof response.data === 'string' && 
        (response.data.includes('<!DOCTYPE html>') || 
         response.data.includes('<html'))) {
      throw new Error('Server returned HTML instead of JSON');
    }
    
    return response.data;
  } catch (directError) {
    console.warn('Direct endpoint failed:', directError.message);
    
    // Try the API prefixed endpoint
    try {
      const apiResponse = await axios.get('/api/users/full-info', {
        headers: baseHeaders,
        timeout: 8000,
        params: { _t: Date.now() } // Cache buster
      });
      
      // Check for HTML response
      if (typeof apiResponse.data === 'string' && 
          (apiResponse.data.includes('<!DOCTYPE html>') || 
           apiResponse.data.includes('<html'))) {
        throw new Error('Server returned HTML instead of JSON');
      }
      
      return apiResponse.data;
    } catch (apiError) {
      console.error('API endpoint also failed:', apiError.message);
      
      // Try cached data
      const cachedData = localStorage.getItem('userData');
      if (cachedData) {
        try {
          const userData = JSON.parse(cachedData);
          console.log('Using cached user data as fallback');
          return userData;
        } catch (parseError) {
          console.error('Failed to parse cached user data:', parseError);
        }
      }
      
      // All attempts failed
      throw new Error('Failed to fetch user data from all sources');
    }
  }
}
