import { supabase } from '@/lib/supabase';
import axios from '@/axios';
import { useAuthStore } from '@/stores/auth';

/**
 * Check if token is expired or about to expire
 * @param {string} token - JWT token to check
 * @returns {boolean} - Whether token needs refresh
 */
export function isTokenExpired(token) {
  if (!token) return true;
  
  try {
    // Parse the JWT to get expiration
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const { exp } = JSON.parse(jsonPayload);
    const expirationTime = exp * 1000; // Convert to milliseconds
    
    // Consider token as expired if it has less than 5 minutes remaining
    return Date.now() >= (expirationTime - 5 * 60 * 1000);
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
}

/**
 * Refresh the authentication token if needed
 * @returns {Promise<string|null>} - The new token or null if refresh failed
 */
export async function refreshTokenIfNeeded() {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Check if we need to refresh
    if (session && isTokenExpired(session.access_token)) {
      console.log('Token is expired or about to expire, refreshing...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Failed to refresh token:', error);
        return null;
      }
      
      if (data.session?.access_token) {
        console.log('Token refreshed successfully');
        return data.session.access_token;
      }
    } else if (session?.access_token) {
      // Token is still valid
      return session.access_token;
    }
    
    return null;
  } catch (error) {
    console.error('Error checking or refreshing token:', error);
    return null;
  }
}

/**
 * Ensure session is synchronized with backend
 * @returns {Promise<boolean>} - Whether session sync was successful
 */
export async function ensureSessionSynchronized() {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('No active session to synchronize');
      return false;
    }
    
    // Refresh token if needed
    const token = await refreshTokenIfNeeded() || session.access_token;
    
    // Sync session with backend
    const response = await axios.post('/api/auth/sync-session', 
      { session: { user: session.user, access_token: token } },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );
    
    if (response.data.authenticated) {
      console.log('Session synchronized successfully');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error synchronizing session:', error);
    
    // Try fallback endpoint if main endpoint fails
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return false;
      
      const fallbackResponse = await axios.post('/auth/sync-session', 
        { 
          supabaseUser: session.user,
          token: session.access_token
        },
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      if (fallbackResponse.data.authenticated) {
        console.log('Session synchronized successfully via fallback');
        return true;
      }
    } catch (fallbackError) {
      console.error('Fallback session sync also failed:', fallbackError);
    }
    
    return false;
  }
}

/**
 * Check authentication status with backend
 * @returns {Promise<boolean>} - Whether user is authenticated
 */
export async function checkAuthStatus() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return false;
    }
    
    const token = session.access_token;
    
    const response = await axios.get('/api/auth/status', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      withCredentials: true
    });
    
    return response.data.authenticated === true;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
}

export default {
  isTokenExpired,
  refreshTokenIfNeeded,
  ensureSessionSynchronized,
  checkAuthStatus
};
