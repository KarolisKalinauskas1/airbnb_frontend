import { supabase } from '@/lib/supabase'
import axios from '@/axios'
import { useAuthStore } from '@/stores/auth'

export const authDebugger = {
  async checkAuthState() {
    console.log('=== AUTH STATE DEBUGGER ===')
    
    // Check Supabase session
    const { data: { session } } = await supabase.auth.getSession()
    console.log('Supabase session exists:', !!session)
    
    if (session) {
      console.log('User ID:', session.user.id)
      console.log('Email:', session.user.email)
      const expiresAt = new Date(session.expires_at * 1000);
      console.log('Token expires at:', expiresAt.toLocaleString())
      console.log('Token expired:', expiresAt < new Date() ? 'Yes' : 'No')
    }
    
    // Check localStorage for user data
    const userData = localStorage.getItem('userData')
    console.log('UserData in localStorage:', !!userData)
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        console.log('User ID from localStorage:', parsed.user_id)
        console.log('Is owner:', parsed.isowner === 1 ? 'Yes' : 'No')
        
        // Check for data timestamp
        const lastFetchTime = localStorage.getItem('last_user_fetch_time');
        if (lastFetchTime) {
          const fetchTime = new Date(parseInt(lastFetchTime));
          console.log('Last user data fetch:', fetchTime.toLocaleString());
          const ageInMinutes = (Date.now() - parseInt(lastFetchTime)) / (1000 * 60);
          console.log('Data age (minutes):', ageInMinutes.toFixed(1));
        }
      } catch (e) {
        console.error('Failed to parse userData:', e)
      }
    }
    
    console.log('=== AUTH TEST ENDPOINTS ===')
    
    // Test the API endpoints with different paths
    if (session) {
      try {
        // Test with /api prefix
        console.log('Testing /api/users/full-info...')
        const apiResponse = await axios.get('/api/users/full-info', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        })
        console.log('✅ /api/users/full-info works:', apiResponse.status)
      } catch (error) {
        console.error('❌ /api/users/full-info failed:', error.response?.status || error.message)
      }
    }
    
    console.log('=== END AUTH STATE ===')
    
    return {
      hasSession: !!session,
      hasLocalUserData: !!userData,
      isTokenExpired: session ? new Date(session.expires_at * 1000) < new Date() : null
    }
  },
  
  async fixAuthState() {
    console.log('Attempting to fix auth state...')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log('No active session found. User needs to log in.')
      return false
    }
    
    try {
      // Check if token is expired or about to expire
      const expiresAt = new Date(session.expires_at * 1000);
      const isExpired = expiresAt < new Date();
      const expiresInMinutes = (expiresAt - new Date()) / (1000 * 60);
      
      // If token is expired or will expire in next 5 minutes, refresh it
      if (isExpired || expiresInMinutes < 5) {
        console.log(`Token ${isExpired ? 'is expired' : 'expires soon'}, refreshing...`);
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Token refresh failed:', refreshError);
          return false;
        }
        
        if (refreshData.session) {
          console.log('Token refreshed successfully');
          session = refreshData.session;
        }
      }
      
      // Try to fetch user data
      const response = await axios.get('/api/users/full-info', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (response.data) {
        // Update localStorage
        localStorage.setItem('userData', JSON.stringify(response.data));
        localStorage.setItem('last_user_fetch_time', Date.now().toString());
        console.log('Auth state fixed successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error fixing auth state:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
      }
      return false;
    }
  },

  /**
   * Debug owner permissions specifically
   */
  async debugOwnerPermissions() {
    const session = await supabase.auth.getSession();
    
    if (!session.data.session) {
      console.log('❌ No active session found');
      return { hasSession: false };
    }
    
    const token = session.data.session.access_token;
    
    console.log('=== OWNER PERMISSION DEBUG ===');
    
    try {
      // First check the user's permissions from frontend store
      const authStore = useAuthStore();
      console.log('Auth store user data:', {
        fullUser: authStore.fullUser,
        isOwner: authStore.fullUser?.isowner,
        ownerType: typeof authStore.fullUser?.isowner
      });
      
      // Test dashboard permission endpoint
      console.log('Testing /api/dashboard/debug/permissions...');
      const response = await axios.get('/api/dashboard/debug/permissions', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('✅ Permission check response:', response.data);
      
      // Attempt to normalize the owner value
      if (authStore.fullUser && response.data.userData.isowner !== 1) {
        console.log('⚠️ Owner value mismatch, attempting to normalize...');
        
        // Convert isowner to a consistent number format
        const normalizedValue = 
          authStore.fullUser.isowner === true ||
          authStore.fullUser.isowner === 'true' ||
          authStore.fullUser.isowner === 'yes' ||
          authStore.fullUser.isowner === 'YES' ||
          authStore.fullUser.isowner === '1' ||
          authStore.fullUser.isowner === 1
            ? 1
            : 0;
            
        console.log(`Normalized isowner value: ${normalizedValue}`);
        
        // Update the authStore
        authStore.fullUser = {
          ...authStore.fullUser,
          isowner: normalizedValue
        };
        
        // Update localStorage too
        try {
          const userData = JSON.parse(localStorage.getItem('userData'));
          if (userData) {
            userData.isowner = normalizedValue;
            localStorage.setItem('userData', JSON.stringify(userData));
            console.log('✅ Updated localStorage userData');
          }
        } catch (e) {
          console.error('Failed to update localStorage:', e);
        }
      }
      
      return {
        success: true,
        permissions: response.data,
        fixed: authStore.fullUser?.isowner === 1
      };
    } catch (error) {
      console.error('❌ Permission check failed:', error.response?.status, error.response?.data);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }
};
