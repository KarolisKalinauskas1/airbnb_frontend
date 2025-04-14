import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from '@/axios'
import { createClient } from '@supabase/supabase-js'
import { useDatesStore } from './dates'

// Create Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Add a debounce utility function to the store
function debounce(fn, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    return new Promise((resolve) => {
      timeout = setTimeout(() => resolve(fn(...args)), delay);
    });
  };
}

// Add circuit breaker to prevent infinite loops
const authRequestTimestamps = [];
const MAX_AUTH_REQUESTS_PER_MINUTE = 10;
const REQUEST_WINDOW_MS = 60000; // 1 minute

// Add improved circuit breaker functionality to existing rate limit check
const checkAuthRateLimit = () => {
  const now = Date.now();
  // Filter out requests older than the window
  const recentRequests = authRequestTimestamps.filter(
    timestamp => now - timestamp < REQUEST_WINDOW_MS
  );
  
  // Replace the array with just the recent requests
  authRequestTimestamps.length = 0;
  authRequestTimestamps.push(...recentRequests);
  
  // Check if we've made too many requests
  if (authRequestTimestamps.length >= MAX_AUTH_REQUESTS_PER_MINUTE) {
    console.error('Auth request rate limit exceeded. Possible infinite loop detected.');
    return false;
  }
  
  // Add this request to our tracking
  authRequestTimestamps.push(now);
  return true;
};

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const fullUser = ref(null)
  const loading = ref(true)
  const isInitialized = ref(false)
  const lastFetchTime = ref(0)
  const isFetching = ref(false)

  const isLoggedIn = computed(() => !!user.value)
  const isSeller = computed(() => fullUser.value?.is_seller === true)

  function clearState() {
    user.value = null
    fullUser.value = null
    localStorage.removeItem('userData')
  }

  // Add this function to the auth store
  const handleApiConnectionFailure = () => {
    // If we haven't been able to connect to the API after multiple retries
    console.warn("Backend API connection issues detected. Continuing in offline mode.");
    
    // Flag for the UI to show offline mode indicator if needed
    const isOffline = ref(true);
    
    // We can still use localStorage data if available
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        parsed.isowner = Number(parsed.isowner);
        fullUser.value = parsed;
        console.log('Using cached user data in offline mode:', parsed);
      } catch (e) {
        console.error('Failed to parse user data from localStorage', e);
      }
    }
    
    return {
      isOffline,
      // Other functions/properties to include in the return
      user,
      fullUser,
      loading,
      isInitialized,
      handleLogin,
      handleLogout,
      checkAuth,
      initAuth,
      fetchFullUserInfo,
      debouncedFetchFullUserInfo,
      clearState,
      getAuthToken
    }
  }

  // Sync user with backend
  const syncUserWithBackend = async (supabaseUser) => {
    if (!supabaseUser || !supabaseUser.email) {
      console.warn('No valid Supabase user to sync with backend');
      return;
    }
  
    try {
      // Remove the duplicate /api prefix
      const response = await axios.post('/users/sync', {
        email: supabaseUser.email,
        full_name: supabaseUser.user_metadata?.full_name || 'User',
        auth_user_id: supabaseUser.id
      }, { 
        timeout: 8000,  // Add a reasonable timeout
        withCredentials: true // Make sure credentials are included
      });
      
      console.log('User synced with backend:', response.data);
      return response.data;
    } catch (err) {
      // Handle network errors and offline mode
      if (err.code === 'ERR_NETWORK') {
        console.warn('Backend API connection failed. Using offline mode.');
        return null;
      }
      console.error('Failed to sync user with backend:', err);
      throw err;
    }
  }

  // Unified fetchFullUserInfo function that combines both implementations
  const fetchFullUserInfo = async (forceRefresh = false) => {
    // If a fetch is already in progress, don't start another one
    if (isFetching.value) {
      console.log('User info fetch already in progress, skipping duplicate request');
      // Wait for the current fetch to complete and return its result
      await new Promise(resolve => {
        const checkFetching = () => {
          if (!isFetching.value) {
            resolve();
          } else {
            setTimeout(checkFetching, 100);
          }
        };
        checkFetching();
      });
      return fullUser.value;
    }
    
    // Rate limit check to prevent infinite loops
    if (!checkAuthRateLimit()) {
      console.error('Too many auth requests in short period. Possible infinite loop detected.');
      return fullUser.value;
    }

    // Check if we need to refresh
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime.value;
    const minFetchInterval = 10000; // 10 seconds
    
    if (!forceRefresh && 
        fullUser.value && 
        timeSinceLastFetch < minFetchInterval) {
      console.log(`Using cached user data (last fetch was ${timeSinceLastFetch}ms ago)`);
      return fullUser.value;
    }

    isFetching.value = true;

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No session available when trying to fetch user info')
        return null
      }

      loading.value = true
      const token = session.access_token
      let response
      
      // Try API paths first, then non-API paths
      const paths = [
        '/api/users/full-info',
        '/users/full-info'
      ];
      let lastError = null;
      
      for (const path of paths) {
        try {
          console.log(`Attempting to fetch user info from ${path}`);
          response = await axios.get(path, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Accept': 'application/json' // Explicitly request JSON response
            },
            withCredentials: true, // Make sure credentials are included
            // Add a timeout to prevent long waits
            timeout: 5000
          });
          
          // If we got here, the request succeeded
          if (response.status === 200 && response.data) {
            console.log(`Successfully fetched user info from ${path}`);
            break;
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${path}:`, error.message);
          lastError = error;
          
          // Special handling for network errors - no need to try other paths
          if (error.code === 'ERR_NETWORK') {
            console.error('Network error, server may be down');
            throw error;
          }
          // Continue to try the next path
        }
      }
      
      // If we didn't get a response from any path, throw the last error
      if (!response) {
        console.error('All paths failed to fetch user info');
        throw lastError || new Error('Failed to fetch user info');
      }
      
      // Process the response
      if (response?.data && typeof response.data === 'object') {
        // Make sure the isowner property is a number
        const userData = response.data
        userData.isowner = typeof userData.isowner === 'boolean' ? 
          (userData.isowner ? 1 : 0) : 
          Number(userData.isowner)
        
        // Update state and localStorage
        fullUser.value = userData
        isInitialized.value = true
        localStorage.setItem('userData', JSON.stringify(userData))
        
        // Update last fetch time
        localStorage.setItem('last_user_fetch_time', now.toString());
        return userData
      }
      return null
    } catch (err) {
      console.error('Failed to fetch full user info:', err)
      
      // Check if this is an authorization error
      if (err.response?.status === 401) {
        // Try refreshing the session
        const { data, error } = await supabase.auth.refreshSession()
        if (!error && data.session) {
          console.log('Session refreshed, retrying user info fetch')
          // Try one more time with the refreshed token
          try {
            const retryResponse = await axios.get('/api/users/full-info', {
              headers: {
                Authorization: `Bearer ${data.session.access_token}`,
              },
            })
            
            if (retryResponse.data) {
              retryResponse.data.isowner = Number(retryResponse.data.isowner)
              fullUser.value = retryResponse.data
              localStorage.setItem('userData', JSON.stringify(retryResponse.data))
              return retryResponse.data
            }
          } catch (retryErr) {
            console.error('Retry failed:', retryErr)
          }
        }
      }
      
      return null
    } finally {
      loading.value = false
      isFetching.value = false;
      lastFetchTime.value = Date.now();
    }
  }

  // Create a debounced version for frequent calls
  const debouncedFetchFullUserInfo = debounce(async function(force = false) {
    return fetchFullUserInfo(force);
  }, 1000)

  // Initialize auth - this should be called when the app starts
  const initAuth = async (forceRefresh = false) => {
    // Prevent multiple initialization attempts
    if (isInitialized.value && !forceRefresh) {
      console.log('Auth already initialized, skipping...');
      return fullUser.value;
    }
    
    // Rate limit check - add this to prevent infinite loops
    if (!checkAuthRateLimit()) {
      console.log('Too many auth requests, possible infinite loop. Using cached data.');
      loading.value = false;
      return fullUser.value;
    }
    
    // Set a flag to prevent concurrent initialization
    if (loading.value) {
      console.log('Auth initialization already in progress, waiting...');
      // Wait for the existing initialization to complete
      await new Promise(resolve => {
        const checkInitialized = () => {
          if (!loading.value) {
            resolve();
          } else {
            setTimeout(checkInitialized, 100);
          }
        };
        checkInitialized();
      });
      return fullUser.value;
    }
    
    loading.value = true;
    console.log('Initializing auth store...');
    
    try {
      // First try to restore from localStorage
      const storedData = localStorage.getItem('userData')
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData)
          parsed.isowner = Number(parsed.isowner)
          fullUser.value = parsed
          console.log('Restored user data from localStorage', parsed)
        } catch (e) {
          console.error('Failed to parse user data from localStorage', e)
          localStorage.removeItem('userData')
        }
      }
      
      // Then check if we have a session with Supabase
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        console.log('Active session found with user:', session.user.email)
        user.value = session.user
        
        // Only sync with backend if we don't have the user data already
        if (!fullUser.value || forceRefresh) {
          try {
            // Sync user with backend
            await syncUserWithBackend(session.user);
            
            // Fetch full user info
            console.log('Fetching full user info...');
            await fetchFullUserInfo(true);
          } catch (syncError) {
            console.error('Error syncing user:', syncError);
            // Don't fail completely - we still have basic user info
          }
        }
      } else {
        console.log('No active session found, clearing state')
        clearState()
      }
    } catch (error) {
      console.error('Init auth error:', error)
      clearState()
    } finally {
      loading.value = false
      isInitialized.value = true
    }
    
    return fullUser.value
  }

  // Setup an auth state change listener
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state change', event, session?.user?.email)
    
    if (event === 'SIGNED_IN') {
      // Update the user state immediately
      user.value = session?.user || null
      
      // Refresh user data
      fetchFullUserInfo(true).catch(err => {
        console.error('Error fetching user data after sign in:', err)
      })
    } else if (event === 'SIGNED_OUT') {
      clearState()
    }
  })

  const handleLogin = async (credentials) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword(credentials)
      if (error) throw error
      
      user.value = data.user
      await syncUserWithBackend(data.user)
      
      // Fetch user info immediately after successful login
      const userData = await fetchFullUserInfo(true) // Force refresh to get latest data
      
      return { 
        success: true, 
        isOwner: userData?.isowner === 1
      }
    } catch (error) {
      console.error('Login error:', error)
      clearState()
      return { success: false, error: error.message }
    }
  }

  const handleLogout = async () => {
    try {
      // Clear user data
      clearState()
      
      // Clear dates
      const datesStore = useDatesStore()
      datesStore.clearDates()
      
      // Perform logout
      await supabase.auth.signOut()
      
      // Return success - let the component handle navigation
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      return { success: false, error: error.message }
    }
  }

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        clearState()
        return false
      }
      user.value = session.user
      return true
    } catch (error) {
      clearState()
      return false
    }
  }

  const getAuthToken = async () => {
    try {
      const { data } = await supabase.auth.getSession()
      return data?.session?.access_token || null
    } catch (error) {
      console.error('Failed to get auth token:', error)
      return null
    }
  }

  // Add a helper method to ensure we have the full user info
  const ensureFullUserInfo = async () => {
    if (!fullUser.value && isAuthenticated.value) {
      try {
        await fetchFullUserInfo(true);
        return !!fullUser.value;
      } catch (error) {
        console.error('Failed to fetch full user info:', error);
        return false;
      }
    }
    return !!fullUser.value;
  }

  return {
    user,
    fullUser,
    loading,
    isInitialized,
    handleLogin,
    handleLogout,
    checkAuth,
    initAuth,
    fetchFullUserInfo,
    debouncedFetchFullUserInfo,
    clearState,
    getAuthToken,
    isLoggedIn,
    isSeller,
    ensureFullUserInfo
  }
})
