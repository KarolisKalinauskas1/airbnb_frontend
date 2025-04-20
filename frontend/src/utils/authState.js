/**
 * Auth State Utility
 * 
 * Provides functions to check and fix authentication state issues
 */
import { supabase } from '@/lib/supabase';
import axios from '@/axios';

/**
 * Check if session token is valid and not expired
 * @param {Object} session - Supabase session object 
 * @returns {boolean} - True if session is valid
 */
export function isSessionValid(session) {
  if (!session || !session.expires_at) return false;
  
  const expiresAt = new Date(session.expires_at * 1000);
  const now = new Date();
  return expiresAt > now;
}

/**
 * Check if token needs to be refreshed soon
 * @param {Object} session - Supabase session object
 * @returns {boolean} - True if token should be refreshed
 */
export function shouldRefreshToken(session) {
  if (!session || !session.expires_at) return false;
  
  const expiresAt = new Date(session.expires_at * 1000);
  const now = new Date();
  
  // If token expires in less than 5 minutes, refresh it
  const expiresInMinutes = (expiresAt - now) / (1000 * 60);
  return expiresInMinutes < 5;
}

/**
 * Refresh the authentication token
 * @returns {Promise<string|null>} The refreshed token or null
 */
export async function refreshToken() {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Token refresh error:', error.message);
      return null;
    }
    
    if (data.session) {
      localStorage.setItem('token', data.session.access_token);
      return data.session.access_token;
    }
    
    return null;
  } catch (err) {
    console.error('Token refresh exception:', err);
    return null;
  }
}

/**
 * Clean up auth state and fix inconsistencies
 */
export async function fixAuthState() {
  try {
    console.log('Fixing auth state...');
    
    // Get current session from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    // Check if we have a session
    if (!session) {
      console.log('No active session, cleaning up localStorage');
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      return false;
    }
    
    // Refresh token if needed
    if (shouldRefreshToken(session)) {
      console.log('Token needs refresh, refreshing...');
      const newToken = await refreshToken();
      if (!newToken) {
        console.log('Token refresh failed, cleaning up');
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        return false;
      }
    }
    
    // Try to fetch user data
    try {
      const response = await axios.get('/api/users/full-info', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      // Update localStorage
      localStorage.setItem('userData', JSON.stringify(response.data));
      localStorage.setItem('last_user_fetch_time', Date.now().toString());
      
      console.log('Auth state fixed successfully');
      return true;
    } catch (apiError) {
      console.log('Failed to fetch user data from API, trying alternate endpoint');
      
      try {
        const fallbackResponse = await axios.get('/users/full-info', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        
        // Update localStorage
        localStorage.setItem('userData', JSON.stringify(fallbackResponse.data));
        localStorage.setItem('last_user_fetch_time', Date.now().toString());
        
        console.log('Auth state fixed with fallback endpoint');
        return true;
      } catch (fallbackError) {
        console.error('All user data fetch attempts failed');
        return false;
      }
    }
  } catch (err) {
    console.error('Fix auth state error:', err);
    return false;
  }
}

export default {
  isSessionValid,
  shouldRefreshToken,
  refreshToken,
  fixAuthState
};
