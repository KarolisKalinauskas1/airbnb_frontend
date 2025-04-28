import axios from '@/axios';

/**
 * Helper function to diagnose and fix CORS issues
 */
export const debugCorsIssue = async () => {
  try {
    console.log('Testing CORS configuration...');
    
    // Make a simple request without credentials first
    const simpleResponse = await axios.get('/api/health', {
      withCredentials: false
    });
    
    console.log('Simple request succeeded:', simpleResponse.data);
    
    // Now try with credentials
    const credentialResponse = await axios.get('/api/health', {
      withCredentials: true
    });
    
    console.log('Credential request succeeded:', credentialResponse.data);
    
    return {
      success: true,
      message: 'CORS configuration appears to be working correctly',
      simpleResponse: simpleResponse.data,
      credentialResponse: credentialResponse.data
    };
  } catch (error) {
    console.error('CORS test failed:', error);
    
    return {
      success: false,
      message: 'CORS configuration test failed',
      error: error.message,
      isCredentialIssue: error.message.includes('credentials')
    };
  }
};

/**
 * Makes a request that's resilient to CORS issues by trying different approaches
 * @param {string} url - The URL to request
 * @param {object} options - Request options
 * @returns {Promise<any>} - The response data
 */
export const corsResiliantRequest = async (url, options = {}) => {
  try {
    // First attempt: with credentials
    return await axios.request({
      url,
      ...options,
      withCredentials: true
    });
  } catch (firstError) {
    console.warn('First request attempt failed, trying without credentials:', firstError.message);
    
    try {
      // Second attempt: without credentials
      return await axios.request({
        url,
        ...options,
        withCredentials: false
      });
    } catch (secondError) {
      console.error('All request attempts failed:', secondError);
      throw secondError;
    }
  }
};

// Also export with the correct spelling to support both versions
export const corsResilientRequest = corsResiliantRequest;
