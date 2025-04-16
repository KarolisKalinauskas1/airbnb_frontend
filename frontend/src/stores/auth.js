import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import axios from '@/axios'
import router from '@/router'

// Create a unique abort controller for user info fetches that persists between calls
let fetchAbortController = new AbortController()

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const fullUser = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const initializationDone = ref(false)
  const fetchInProgress = ref(false)
  
  // Add initialization tracking to prevent loops
  const initializationAttempts = ref(0)
  const MAX_INIT_ATTEMPTS = 3
  const lastInitTime = ref(0)
  const MIN_INIT_INTERVAL = 2000 // 2 seconds
  
  // Computed properties
  const isLoggedIn = computed(() => !!user.value)
  const isSeller = computed(() => !!fullUser.value?.isowner)
  const isInitialized = computed(() => initializationDone.value)

  // Track API connection failures
  const apiConnectionFailures = ref(0)
  const MAX_API_FAILURES = 3

  // Method to handle API connection failures
  const handleApiConnectionFailure = () => {
    apiConnectionFailures.value++
    console.warn(`API connection failure count: ${apiConnectionFailures.value}/${MAX_API_FAILURES}`)
    
    if (apiConnectionFailures.value >= MAX_API_FAILURES) {
      console.error('Maximum API connection failures reached. Setting offline mode.')
      error.value = 'Unable to connect to the server. Please check your internet connection.'
    }
  }

  // Reset API connection failures
  const resetApiConnectionFailures = () => {
    apiConnectionFailures.value = 0
  }

  // Auth methods
  const initAuth = async () => {
    // *** Added loop prevention logic ***
    const now = Date.now()
    
    // If already initialized, just return the current state
    if (initializationDone.value) {
      console.log('Auth already initialized')
      return { isLoggedIn: isLoggedIn.value, isSeller: isSeller.value }
    }
    
    // Prevent multiple rapid init calls
    if (now - lastInitTime.value < MIN_INIT_INTERVAL) {
      console.log('Rejecting auth init attempt: too soon after last attempt')
      return { isLoggedIn: isLoggedIn.value, isSeller: isSeller.value }
    }
    
    // Track initialization attempts to prevent infinite loops
    initializationAttempts.value++
    lastInitTime.value = now
    
    if (initializationAttempts.value > MAX_INIT_ATTEMPTS) {
      console.error('Too many auth initialization attempts - possible loop detected')
      initializationDone.value = true // Force initialization to complete
      return { isLoggedIn: isLoggedIn.value, isSeller: isSeller.value }
    }

    loading.value = true
    error.value = null

    try {
      console.log('Initializing auth state')
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        throw sessionError
      }
      
      if (session) {
        console.log('Active session found')
        user.value = session.user
        
        // Check localStorage first for cached user data to avoid unnecessary requests
        try {
          const cachedUserData = localStorage.getItem('userData')
          if (cachedUserData) {
            const parsedData = JSON.parse(cachedUserData)
            console.log('Using cached user data initially')
            fullUser.value = parsedData
            
            // Silently refresh in the background without blocking UI
            setTimeout(() => {
              fetchFullUserInfo(false).catch(err => {
                console.warn('Background refresh of user data failed:', err.message)
              })
            }, 1000)
          } else {
            // No cached data, must fetch but don't block initialization
            setTimeout(() => {
              fetchFullUserInfo(false).catch(err => {
                console.warn('Initial user data fetch failed:', err.message)
              })
            }, 100)
          }
        } catch (e) {
          console.error('Error processing cached user data:', e)
          // Don't block initialization with fetch
          setTimeout(() => {
            fetchFullUserInfo(false).catch(err => console.warn('User info fetch failed:', err))
          }, 100)
        }
      } else {
        console.log('No active session')
      }
      
      // Set up auth state change listener
      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event)
          
          if (event === 'SIGNED_IN' && session) {
            user.value = session.user
            // Don't await here to prevent blocking
            fetchFullUserInfo().catch(err => console.warn('Auth state change user fetch failed:', err))
          } else if (event === 'SIGNED_OUT') {
            user.value = null
            fullUser.value = null
            localStorage.removeItem('userData')
          }
        }
      )
      
      resetApiConnectionFailures()
      return {
        subscription,
        isLoggedIn: isLoggedIn.value,
        isSeller: isSeller.value
      }
    } catch (err) {
      console.error('Auth initialization error:', err)
      error.value = 'Failed to initialize authentication'
      handleApiConnectionFailure()
      return { isLoggedIn: false, isSeller: false }
    } finally {
      loading.value = false
      initializationDone.value = true
    }
  }

  const getAuthToken = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        return null
      }
      
      if (!session) {
        console.warn('No active session found')
        return null
      }
      
      return session.access_token
    } catch (err) {
      console.error('Error getting auth token:', err)
      return null
    }
  }

  const fetchFullUserInfo = async (forceRefresh = false) => {
    // Don't fetch if we're not logged in
    if (!user.value && !forceRefresh) {
      console.log('No user data, skipping full user info fetch')
      return null
    }

    // Prevent concurrent fetch operations
    if (fetchInProgress.value) {
      console.log('User info fetch already in progress, skipping duplicate request')
      return fullUser.value
    }

    // Cancel any existing fetches before starting a new one
    try {
      fetchAbortController.abort()
    } catch (e) {
      console.warn('Error aborting previous request:', e)
    }
    
    fetchAbortController = new AbortController()
    fetchInProgress.value = true
    
    try {
      // Get a fresh token using the token handler
      const token = await getAuthToken()
      if (!token) {
        console.error('No valid session available when trying to fetch user info')
        return null
      }

      loading.value = true
      let response = null

      // Try API paths first, then non-API paths
      const paths = [
        '/api/users/full-info',
        '/users/full-info'
      ]
      let lastError = null
      
      for (const path of paths) {
        try {
          console.log(`Attempting to fetch user info from ${path}`)
          const resp = await axios.get(path, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Accept': 'application/json'
            },
            withCredentials: true,
            signal: fetchAbortController.signal,
            timeout: 8000 // Increased timeout
          })
          
          // If we got here, the request succeeded
          if (resp.status === 200 && resp.data) {
            console.log(`Successfully fetched user info from ${path}`)
            response = resp
            break
          }
        } catch (error) {
          // Skip handling if this was an intentional cancellation
          if (error.name === 'CanceledError' || error.name === 'AbortError') {
            console.log(`Request to ${path} was canceled - this is expected during navigation`)
            lastError = error
            continue
          }
          
          console.warn(`Failed to fetch from ${path}:`, error.message)
          lastError = error
          
          // Special handling for network errors - no need to try other paths
          if (error.code === 'ERR_NETWORK') {
            console.error('Network error, server may be down')
            handleApiConnectionFailure()
            throw error
          }
          // Continue to try the next path
        }
      }
      
      // If we didn't get a response from any path, throw the last error
      if (!response) {
        console.error('All paths failed to fetch user info')
        throw lastError || new Error('Failed to fetch user info')
      }
      
      // Process the response
      if (response.data) {
        // Make sure isowner is a boolean for consistency
        const userData = response.data
        userData.isowner = userData.isowner === '1' || userData.isowner === 1 || userData.isowner === true
        
        fullUser.value = userData
        
        // Save the timestamp for when we last fetched the data
        try {
          localStorage.setItem('userData', JSON.stringify(userData))
          localStorage.setItem('last_user_fetch_time', Date.now().toString())
        } catch (e) {
          console.warn('Could not save user data to localStorage:', e)
        }
        
        resetApiConnectionFailures()
        return fullUser.value
      } else {
        throw new Error('Invalid response data')
      }
    } catch (err) {
      console.error('Full user info fetch error:', err)
      // Don't clear fullUser if we already have it - keep using the stale data
      return fullUser.value
    } finally {
      loading.value = false
      fetchInProgress.value = false
    }
  }

  const login = async (email, password) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError

      user.value = data.user
      await fetchFullUserInfo()
      return true
    } catch (err) {
      console.error('Login error:', err)
      error.value = err.message || 'Failed to log in'
      return false
    } finally {
      loading.value = false
    }
  }

  const register = async (email, password, fullName, isSeller = false, license = '') => {
    loading.value = true
    error.value = null

    try {
      // Register with Supabase
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password
      })

      if (authError) throw authError

      // Get the user ID from the newly created user
      const userId = data.user.id

      // Create user profile in our database
      const response = await axios.post('/api/users', {
        email,
        full_name: fullName,
        auth_user_id: userId,
        is_seller: isSeller,
        license
      })

      if (response.status !== 201) {
        throw new Error('Failed to create user profile')
      }

      user.value = data.user
      await fetchFullUserInfo()
      return true
    } catch (err) {
      console.error('Registration error:', err)
      error.value = err.message || 'Failed to register'
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    error.value = null

    try {
      const { error: logoutError } = await supabase.auth.signOut()
      if (logoutError) throw logoutError

      user.value = null
      fullUser.value = null
      
      // Redirect to home after logout
      if (router.currentRoute.value.meta.requiresAuth) {
        router.push('/')
      }
      
      return true
    } catch (err) {
      console.error('Logout error:', err)
      error.value = err.message || 'Failed to log out'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    user,
    fullUser,
    loading,
    error,
    
    // Computed
    isLoggedIn,
    isSeller,
    isInitialized,
    
    // Methods
    initAuth,
    login,
    register,
    logout,
    fetchFullUserInfo,
    getAuthToken
  }
})
