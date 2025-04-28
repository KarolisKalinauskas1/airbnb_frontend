/**
 * Authentication Troubleshooter
 * 
 * Provides tools to diagnose and fix common authentication issues
 */
import { supabase } from '@/lib/supabase';
import axios from '@/axios';

export const authTroubleshooter = {
  /**
   * Run a comprehensive auth diagnostic
   * @returns {Promise<Object>} Diagnostic results
   */
  async diagnose() {
    console.log('=== AUTH DIAGNOSTICS ===');
    const results = {
      token: {},
      session: {},
      apiTest: {},
      localStorage: {},
      timestamp: new Date().toISOString()
    };
    
    try {
      // Check localStorage
      const localToken = localStorage.getItem('token');
      const localUserData = localStorage.getItem('userData');
      results.localStorage = {
        hasToken: !!localToken,
        hasUserData: !!localUserData,
        userDataTimestamp: localStorage.getItem('last_user_fetch_time')
      };
      
      if (localToken) {
        results.token.localTokenPrefix = localToken.substring(0, 10) + '...';
      }
      
      // Check Supabase session
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      
      results.session = {
        exists: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
        isExpired: session?.expires_at ? (session.expires_at * 1000 < Date.now()) : null
      };
      
      if (session?.access_token) {
        results.token.sessionTokenPrefix = session.access_token.substring(0, 10) + '...';
        
        // Check if tokens match
        results.token.localMatchesSession = localToken === session.access_token;
      }
      
      // Test token with API
      try {
        const apiResponse = await axios.get('/api/auth/debug-token', {
          headers: {
            Authorization: `Bearer ${localToken || session?.access_token || ''}`
          }
        });
        
        results.apiTest = {
          success: true,
          data: apiResponse.data
        };
      } catch (apiError) {
        results.apiTest = {
          success: false,
          status: apiError.response?.status,
          error: apiError.response?.data?.error || apiError.message
        };
      }
    } catch (error) {
      console.error('Auth diagnosis error:', error);
      results.error = error.message;
    }
    
    console.log('Auth diagnosis results:', results);
    return results;
  },
  
  /**
   * Fix common authentication issues
   * @returns {Promise<boolean>} Success status
   */
  async fix() {
    console.log('Attempting to fix authentication issues...');
    
    try {
      // Step 1: Check if token in localStorage matches session token
      const localToken = localStorage.getItem('token');
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session) {
        console.log('No active session - attempting to refresh');
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error || !data?.session) {
          console.log('Failed to refresh session, clearing local data');
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          return false;
        }
        
        // Session refreshed successfully
        localStorage.setItem('token', data.session.access_token);
        console.log('Session refreshed successfully');
      } else if (localToken !== sessionData.session.access_token) {
        // Local token doesn't match session - update it
        console.log('Token mismatch - updating local token');
        localStorage.setItem('token', sessionData.session.access_token);
      }
      
      // Step 2: Fetch fresh user data
      try {
        const response = await axios.get('/api/users/full-info', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data) {
          console.log('Got fresh user data, updating localStorage');
          localStorage.setItem('userData', JSON.stringify(response.data));
          localStorage.setItem('last_user_fetch_time', Date.now().toString());
          return true;
        }
      } catch (userError) {
        console.error('Failed to fetch user info:', userError.message);
      }
      
      return false;
    } catch (error) {
      console.error('Auth fix error:', error.message);
      return false;
    }
  }
};

export default authTroubleshooter;
