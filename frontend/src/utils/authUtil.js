/**
 * Authentication utilities for troubleshooting and fixing auth problems
 */
import { supabase } from '@/lib/supabase';
import axios from '@/axios';
import { useAuthStore } from '@/stores/auth';

/**
 * Check token status and validity
 * @returns {Promise<Object>} Information about the current token
 */
export async function checkTokenStatus() {
  try {
    // Get the token
    const token = localStorage.getItem('token');
    if (!token) {
      return { valid: false, reason: 'No token found in localStorage' };
    }

    // Check with diagnostic API
    try {
      const response = await axios.get('/api/diagnostic/auth-check', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      return { 
        error: 'Diagnostic API error', 
        details: error.message,
        status: error.response?.status
      };
    }
  } catch (error) {
    return { error: 'Internal error checking token status', details: error.message };
  }
}

/**
 * Force token refresh and update in localStorage
 * @returns {Promise<boolean>} True if refresh was successful
 */
export async function forceTokenRefresh() {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
    
    if (data.session) {
      // Update token in localStorage
      localStorage.setItem('token', data.session.access_token);
      console.log('Token refreshed successfully');
      
      // Also update the auth store if it exists
      try {
        const authStore = useAuthStore();
        if (authStore) {
          authStore.token = data.session.access_token;
        }
      } catch (storeError) {
        console.warn('Could not update auth store:', storeError);
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error in forceTokenRefresh:', error);
    return false;
  }
}
