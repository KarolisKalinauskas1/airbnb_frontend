import axios from '@/axios';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';

/**
 * Utility to debug API and authentication issues
 */
export const apiDebugger = {
  /**
   * Test specific API endpoints
   * @param {string} endpoint - The endpoint to test
   * @returns {Promise<object>} - The test results
   */
  async testEndpoint(endpoint) {
    try {
      const authStore = useAuthStore();
      const token = await authStore.getAuthToken();
      
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(endpoint, { 
        headers,
        timeout: 5000,
        // Accept any 2xx response as success
        validateStatus: (status) => status >= 200 && status < 300
      });
      
      return { 
        success: true, 
        status: response.status,
        data: response.data,
        headers: response.headers
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        } : null
      };
    }
  },
  
  /**
   * Run a full diagnostic on common endpoints
   * @returns {Promise<object>} - The diagnostic results
   */
  async runFullDiagnostic() {
    const results = {};
    
    // Test key API endpoints
    results.apiHealth = await this.testEndpoint('/api/health');
    results.campersApi = await this.testEndpoint('/api/camping-spots');
    results.users = await this.testEndpoint('/api/users/full-info');
    
    // Check auth state
    const authStore = useAuthStore();
    results.authState = {
      isLoggedIn: authStore.isLoggedIn,
      tokenExists: !!authStore.token,
      fullUserLoaded: !!authStore.fullUser,
      isSeller: authStore.isSeller
    };
    
    return results;
  },

  /**
   * Fix common API issues
   */
  async attemptApiRepair() {
    const authStore = useAuthStore();
    
    // Attempt to refresh auth state
    await authStore.initAuth();
    
    // Clear stored caches that might be invalid
    localStorage.removeItem('last_user_fetch_time');
    
    // Get a fresh auth token
    const token = await authStore.getAuthToken();
    
    if (token) {
      // Try to get fresh user data
      try {
        await authStore.fetchFullUserInfo(true);
        return { success: true, message: "API repair attempt completed successfully" };
      } catch (error) {
        return { success: false, message: "API repair failed: " + error.message };
      }
    }
    
    return { success: false, message: "Could not get auth token" };
  },

  async testUserEndpoints() {
    try {
      console.log('Testing /api/users/full-info...')
      const apiResponse = await axios.get('/api/users/full-info', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      console.log('✅ /api/users/full-info works:', apiResponse.status)
      return true
    } catch (error) {
      console.error('❌ /api/users/full-info failed:', error.response?.status || error.message)
      return false
    }
  },

  async fixAuthState() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.log('No active session found')
        return false
      }

      const response = await axios.get('/api/users/full-info', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (response.data) {
        localStorage.setItem('userData', JSON.stringify(response.data))
        localStorage.setItem('last_user_fetch_time', Date.now().toString())
        return true
      }
      return false
    } catch (error) {
      console.error('Error in fixAuthState:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('userData')
      }
      return false
    }
  }
};
