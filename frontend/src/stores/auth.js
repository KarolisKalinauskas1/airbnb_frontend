import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from '@/axios';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabase';

// Check if we have valid Supabase configuration
const hasSupabaseConfig = 
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes('your-project');

if (!hasSupabaseConfig) {
  console.error('Missing or invalid Supabase configuration!');
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null);
  const user = ref(null);
  const fullUser = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const isInitialized = ref(false);
  const initializationAttempts = ref(0);
  const router = useRouter();
  const backendAvailable = ref(true); // Track if backend is available

  // Computed properties
  const isLoggedIn = computed(() => {
    return !!token.value;
  });

  const isAuthenticated = computed(() => {
    return isLoggedIn.value;
  });

  const isSeller = computed(() => fullUser.value?.isowner === 1);
  const userName = computed(() => fullUser.value?.full_name || user.value?.user_metadata?.full_name || 'User');

  // Clear error message
  const clearError = () => {
    error.value = null;
  };

  // Initialize auth state from persistence
  const initAuth = async () => {
    // Check if already initialized or too many attempts
    if (initializationAttempts.value > 3) {
      console.warn('Too many initialization attempts, aborting');
      return false;
    }
    
    try {
      initializationAttempts.value++;
      console.log(`Initializing auth store (attempt ${initializationAttempts.value})`);
      
      // Check if already initialized
      if (isInitialized.value) {
        console.log('Auth store already initialized, skipping.');
        return true;
      }
      
      loading.value = true;
      
      // Get session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Store the session token
        token.value = session.access_token;
        localStorage.setItem('token', session.access_token);
        
        // Set the user
        user.value = session.user;
        
        // Try to get full user data
        try {
          await fetchFullUserInfo(false);
        } catch (err) {
          console.warn('Failed to fetch full user info during init:', err.message);
          
          // If we failed to fetch, try loading from localStorage
          const storedUserData = localStorage.getItem('userData');
          if (storedUserData) {
            try {
              fullUser.value = JSON.parse(storedUserData);
              console.log('Loaded user data from localStorage');
            } catch (parseErr) {
              console.error('Failed to parse stored user data:', parseErr);
            }
          }
        }
      } else {
        // Check if we have localStorage data without session
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          console.warn('Found user data in localStorage but no active session. Clearing stale data.');
          localStorage.removeItem('userData');
        }
      }
      
      isInitialized.value = true;
      console.log('Auth store initialization complete');
      return true;
    } catch (err) {
      console.error('Auth store initialization error:', err);
      return false;
    } finally {
      loading.value = false;
    }
  };

  // Login function
  const login = async (email, password) => {
    clearError();
    loading.value = true;
    
    try {
      // Use Supabase directly for authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        throw authError;
      }

      if (!authData || !authData.session) {
        throw new Error('Authentication failed - no session returned');
      }

      // Store the token
      token.value = authData.session.access_token;
      localStorage.setItem('token', authData.session.access_token);
      
      // Set the user
      user.value = authData.user;

      // Fetch full user details from our backend
      try {
        await fetchFullUserInfo(true);
      } catch (fetchError) {
        console.warn('Unable to fetch full user data from backend. Using basic user data.');
        // Create minimal user data
        fullUser.value = {
          full_name: authData.user.user_metadata?.full_name || email.split('@')[0],
          email: email,
          isowner: authData.user.user_metadata?.isowner || 0
        };
        localStorage.setItem('userData', JSON.stringify(fullUser.value));
      }

      return { success: true, user: fullUser.value };
    } catch (err) {
      console.error('Login error:', err);
      error.value = err.message || 'Login failed. Please check your credentials.';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Handle successful login
  const handleLoginSuccess = (data) => {
    // Create a token
    token.value = data.access_token || data.token;
    localStorage.setItem('token', token.value);
    
    // Fetch full user info
    fetchFullUserInfo();
  };

  // Registration function
  const register = async (userData) => {
    clearError();
    loading.value = true;
    
    try {
      // Register directly with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            isowner: userData.is_seller ? 1 : 0
          }
        }
      });

      if (authError) {
        throw authError;
      }

      // Try to sync the user with our database
      try {
        await axios.post('/api/users', {
          email: userData.email,
          full_name: userData.full_name,
          isowner: userData.is_seller ? 1 : 0,
          license: userData.license,
          auth_user_id: authData.user.id
        });
      } catch (syncError) {
        console.warn('Could not sync user with backend database. Will try later.', syncError);
      }

      // Store the token
      if (authData.session) {
        token.value = authData.session.access_token;
        localStorage.setItem('token', authData.session.access_token);
        
        // Set the user
        user.value = authData.user;

        // Create minimal user data if backend is unavailable
        fullUser.value = {
          full_name: userData.full_name,
          email: userData.email,
          isowner: userData.is_seller ? 1 : 0
        };
        localStorage.setItem('userData', JSON.stringify(fullUser.value));

        // Try to fetch full user details (don't throw if fails)
        try {
          await fetchFullUserInfo(false);
        } catch (fetchError) {
          console.warn('Could not fetch user details from backend', fetchError);
        }
      }

      return { success: true, user: authData.user };
    } catch (err) {
      console.error('Registration error:', err);
      error.value = err.response?.data?.error || err.message || 'Registration failed. Please try again.';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Sign out from Supabase
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error('Error during sign out:', signOutError);
      }
      
      // Clear local state
      token.value = null;
      user.value = null;
      fullUser.value = null;
      
      // Clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      localStorage.removeItem('last_user_fetch_time');
      
      console.log('Logout completed, all state and storage cleared');
      
      // Redirect to home page (root path)
      if (router) router.push('/');
      
      return true;
    } catch (err) {
      console.error('Logout error:', err);
      error.value = err.message;
      return false;
    }
  };

  // Fetch detailed user information
  const fetchFullUserInfo = async (throwError = true) => {
    if (!token.value) {
      if (throwError) {
        throw new Error('No authentication token available');
      }
      return null;
    }
    
    try {
      // First try the API endpoint with the standard prefix
      try {
        const response = await axios.get('/api/users/full-info', {
          headers: {
            Authorization: `Bearer ${token.value}`
          }
        });
        
        fullUser.value = response.data;
        localStorage.setItem('userData', JSON.stringify(response.data));
        localStorage.setItem('last_user_fetch_time', Date.now().toString());
        backendAvailable.value = true; // Backend is working
        
        return response.data;
      } catch (apiPrefixError) {
        // If that fails, try without the prefix
        console.log('API prefix route failed, trying without prefix', apiPrefixError);
        
        try {
          const response = await axios.get('/users/full-info', {
            headers: {
              Authorization: `Bearer ${token.value}`
            }
          });
          
          fullUser.value = response.data;
          localStorage.setItem('userData', JSON.stringify(response.data));
          localStorage.setItem('last_user_fetch_time', Date.now().toString());
          backendAvailable.value = true; // Backend is working
          
          return response.data;
        } catch (error) {
          // If both fail, backend might be down
          backendAvailable.value = false;
          throw error;
        }
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err);
      
      // Try to load from localStorage as a last resort
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          fullUser.value = userData;
          console.log('Loaded user data from localStorage as fallback');
          return userData;
        } catch (e) {
          console.error('Failed to parse stored user data:', e);
        }
      }
      
      if (throwError) {
        throw err;
      }
      return null;
    }
  };

  // Add the getAuthToken function
  const getAuthToken = async () => {
    // Check if token exists in store
    if (token.value) {
      return token.value;
    }

    // Try to get from localStorage as fallback
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      token.value = storedToken;
      return storedToken;
    }

    // Try to get fresh token from Supabase
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        token.value = data.session.access_token;
        localStorage.setItem('token', data.session.access_token);
        return data.session.access_token;
      }
    } catch (err) {
      console.error('Error getting auth token:', err);
    }

    return null;
  };

  // Return the store with all the methods and properties
  return {
    token,
    user,
    fullUser,
    loading,
    error,
    backendAvailable,
    initializationAttempts,
    isInitialized,
    isAuthenticated,
    isLoggedIn,
    isSeller,
    userName,
    login,
    logout,
    register,
    initAuth,
    fetchFullUserInfo,
    handleLoginSuccess,
    clearError,
    getAuthToken
  };
});
