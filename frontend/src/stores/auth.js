import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import axios from '@/axios'
import { useDatesStore } from './dates'

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

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const fullUser = ref(null)
  const loading = ref(true)
  const isInitialized = ref(false)
  const lastFetchTime = ref(0)
  const isFetching = ref(false)

  function clearState() {
    user.value = null
    fullUser.value = null
    localStorage.removeItem('userData')
  }

  // Sync user with backend
  const syncUserWithBackend = async (supabaseUser) => {
    try {
      await axios.post('/api/users/sync', {
        email: supabaseUser.email,
        full_name: supabaseUser.user_metadata?.full_name || 'User',
        auth_user_id: supabaseUser.id
      })
    } catch (err) {
      console.error('Failed to sync user with backend:', err)
    }
  }

  // Unified fetchFullUserInfo function that combines both implementations
  const fetchFullUserInfo = async (forceRefresh = false) => {
    // Simple throttling - store last fetch time in localStorage
    const now = Date.now();
    const lastFetchTime = localStorage.getItem('last_user_fetch_time');
    const throttleTime = 2000; // 2 seconds minimum between fetches
    
    if (!forceRefresh && lastFetchTime && (now - parseInt(lastFetchTime) < throttleTime)) {
      console.log('Throttled user info fetch');
      return fullUser.value;
    }

    // If already fetching or if last fetch was less than 5 seconds ago and not forced
    if (
      isFetching.value || 
      (!forceRefresh && now - lastFetchTime.value < 5000)
    ) {
      return fullUser.value;
    }
    
    isFetching.value = true;

    // If we already have the data and don't need a refresh, return cached data
    if (!forceRefresh && fullUser.value && isInitialized.value) {
      return fullUser.value
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No session available when trying to fetch user info')
        return null
      }

      loading.value = true
      const token = session.access_token
      let response
      
      try {
        // First attempt with standard API path
        response = await axios.get('/api/users/full-info', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      } catch (initialError) {
        console.warn('Initial fetch attempt failed:', initialError)
        
        // Try alternative path without '/api' prefix
        if (initialError.response?.status === 404) {
          try {
            response = await axios.get('/users/full-info', {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
          } catch (secondError) {
            console.error('Both fetch attempts failed')
            throw secondError
          }
        } else {
          // If not a 404, rethrow the original error
          throw initialError
        }
      }
      
      if (response?.data) {
        // Make sure the isowner property is a number
        const userData = response.data
        userData.isowner = typeof userData.isowner === 'boolean' ? 
          (userData.isowner ? 1 : 0) : 
          Number(userData.isowner)
        
        // Update state and localStorage
        fullUser.value = userData
        isInitialized.value = true
        localStorage.setItem('userData', JSON.stringify(userData))
        
        lastFetchTime.value = now;
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
      return fullUser.value
    }
    
    loading.value = true
    console.log('Initializing auth store...')
    
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
        
        // Always sync the user with backend on init
        await syncUserWithBackend(session.user)
        
        // If we don't have user data from localStorage or need refresh, fetch it
        if (!fullUser.value || forceRefresh) {
          console.log('Fetching full user info...')
          await fetchFullUserInfo(true)
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
    clearState
  }
})
