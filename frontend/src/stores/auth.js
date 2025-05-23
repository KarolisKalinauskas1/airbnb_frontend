import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import axios from '@/axios'
export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const session = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const initialized = ref(false)
  const publicUser = ref(null)
  const lastFetch = ref(0)
  const fetchPromise = ref(null)
  const initPromise = ref(null)
  const AUTH_TIMEOUT = 30000 // 30 seconds timeout for auth operations
  const CACHE_TIME = 5 * 60 * 1000 // 5 minutes cache
  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const isLoggedIn = computed(() => !!user.value)  // Alias for isAuthenticated for code consistency
  const currentUser = computed(() => user.value)
  const isOwner = computed(() => {
    return (
      user.value?.user_metadata?.isowner === true || 
      user.value?.user_metadata?.isowner === 1 ||
      publicUser.value?.isowner === 1 ||
      publicUser.value?.isowner === '1' ||
      publicUser.value?.isowner === true
    )
  })
  // Helper function to handle timeouts
  const withTimeout = (promise, ms, errorMessage) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(errorMessage)), ms)
      )
    ])
  }
  // Actions
  async function initAuth(options = {}) {
    // Return existing promise if initialization is in progress
    if (initPromise.value && !options.forceRefresh) return initPromise.value
    // Return early if already initialized and not forcing refresh
    if (initialized.value && !options.forceRefresh) return Promise.resolve()
    initPromise.value = (async () => {
      try {
        loading.value = true
        error.value = null
        // Try to restore session from localStorage first
        const storedUser = localStorage.getItem('supabase.auth.user')
        if (storedUser) {
          try {
            user.value = JSON.parse(storedUser)
          } catch (e) {
            localStorage.removeItem('supabase.auth.user')
          }
        }
        // Get current session from Supabase with timeout
        const { data: { session: currentSession }, error: sessionError } = 
          await withTimeout(supabase.auth.getSession(), AUTH_TIMEOUT, 'Session timeout')
        if (sessionError) throw sessionError
        if (currentSession) {
          await setSession(currentSession)
        }
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              await setSession(newSession)
            } else if (event === 'SIGNED_OUT') {
              clearSession()
            }
          }
        )
        initialized.value = true
        return true
      } catch (err) {
        console.error('Auth initialization error:', err)
        error.value = err.message
        // Don't clear session on timeout, only on actual auth errors
        if (!err.message.includes('timed out')) {
          clearSession()
        }
        return false
      } finally {
        loading.value = false
        initPromise.value = null
      }
    })()
    return initPromise.value
  }
  async function fetchPublicUser(authUserId, force = false) {
    const now = Date.now()
    // Return cached data if available and not forced
    if (!force && publicUser.value && (now - lastFetch.value) < CACHE_TIME) {
      return publicUser.value
    }
    // If there's already a fetch in progress, return its promise
    if (fetchPromise.value) {
      return fetchPromise.value
    }

    try {
      const token = await getAuthToken()
      if (!token) {
        console.warn('No valid auth token available')
        publicUser.value = null
        return null
      }

      const promise = withTimeout(
        axios.get('/api/users/full-info', {  // Use the correct endpoint
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }), 
        AUTH_TIMEOUT, 
        'Public user fetch timed out'
      )
      
      fetchPromise.value = promise

      const response = await promise
      if (response.data) {
        publicUser.value = response.data
        lastFetch.value = now
        return response.data
      }
      throw new Error('No data in response')
    } catch (error) {
      console.error('Error fetching public user:', error)
      if (error.response?.status === 401) {
        // Try to refresh the session on auth errors
        try {
          const { data: { session } } = await supabase.auth.refreshSession()
          if (session) {
            // Retry the fetch with new token
            return fetchPublicUser(authUserId, true)
          }
        } catch (refreshError) {
          console.error('Session refresh failed:', refreshError)
        }
      }
      // Only clear on non-timeout errors
      if (!error.message.includes('timed out')) {
        publicUser.value = null
      }
      return null
    } finally {
      fetchPromise.value = null
    }
  }
  async function setSession(newSession) {
    if (!newSession) {
      clearSession()
      return
    }
    try {
      session.value = newSession
      if (newSession.user) {
        user.value = newSession.user
        localStorage.setItem('supabase.auth.user', JSON.stringify(newSession.user))
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: newSession.access_token,
          refresh_token: newSession.refresh_token,
          expires_at: newSession.expires_at
        }))
        const now = Date.now()
        if (!publicUser.value || (now - lastFetch.value) >= CACHE_TIME) {
          await withTimeout(fetchPublicUser(newSession.user.id), AUTH_TIMEOUT, 'Public user fetch timed out')
        }
      }
    } catch (error) {
      console.error('Error setting session:', error)
      // Only clear on actual errors, not timeouts
      if (!error.message.includes('timed out')) {
        clearSession()
      }
    }
  }
  function clearSession() {
    session.value = null
    user.value = null
    publicUser.value = null
    lastFetch.value = 0
    localStorage.removeItem('supabase.auth.user')
    localStorage.removeItem('supabase.auth.token')
  }
  async function getSupabaseSession() {
    try {
      const { data: { session }, error } = 
        await withTimeout(supabase.auth.getSession(), AUTH_TIMEOUT, 'Session timeout')
      if (error) throw error
      return session
    } catch (error) {
      console.error('Error getting Supabase session:', error)
      return null
    }
  }
  async function fetchFullUserInfo(forceRefresh = false) {
    try {
      if (!forceRefresh) {
        const storedUser = localStorage.getItem('supabase.auth.user')
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          user.value = userData
          return userData
        }
      }
      const { data: { session: currentSession }, error: sessionError } = 
        await withTimeout(supabase.auth.getSession(), AUTH_TIMEOUT, 'Session timeout')
      if (sessionError) throw sessionError
      if (!currentSession) {
        throw new Error('No active session')
      }
      const { data: { user: supabaseUser }, error: userError } = 
        await withTimeout(supabase.auth.getUser(), AUTH_TIMEOUT, 'User info fetch timed out')
      if (userError) throw userError
      if (supabaseUser) {
        user.value = supabaseUser
        localStorage.setItem('supabase.auth.user', JSON.stringify(supabaseUser))
        return supabaseUser
      }
      throw new Error('No user data available')
    } catch (error) {
      console.error('Error fetching user info:', error)
      error.value = error.message
      // Only clear on actual errors, not timeouts
      if (!error.message.includes('timed out')) {
        clearSession()
      }
      throw error
    }
  }
  
  // Helper function to get the current auth token
  async function getAuthToken() {
    try {
      // First check if we have a valid session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Error getting session:', sessionError)
        return null
      }
      
      if (currentSession?.access_token) {
        return currentSession.access_token
      }
      
      // If no session, try to refresh
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('Error refreshing session:', refreshError)
        return null
      }
      
      return refreshedSession?.access_token || null
    } catch (error) {
      console.error('Error in getAuthToken:', error)
      return null
    }
  }

  async function refreshToken() {
    try {
      // First try to refresh Supabase session
      const { data: { session: newSession }, error: refreshError } = 
        await withTimeout(supabase.auth.refreshSession(), AUTH_TIMEOUT, 'Supabase session refresh timed out');
      if (refreshError) {
        console.error('Supabase session refresh failed:', refreshError);
        throw refreshError;
      }
      if (newSession) {
        // Store the new session
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: newSession.access_token,
          refresh_token: newSession.refresh_token,
          expires_at: newSession.expires_at
        }));
        await setSession(newSession);
        return true;
      }
      // If Supabase refresh fails, try our custom token refresh
      const response = await withTimeout(
        axios.post('/auth/refresh-token'),
        AUTH_TIMEOUT,
        'Custom token refresh timed out'
      );
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear auth state on any error
      clearSession();
      return false;
    }
  }
  function cleanup() {
    clearSession()
    initialized.value = false
    initPromise.value = null
    fetchPromise.value = null
  }
  return {
    // State
    user,
    session,
    loading,
    error,
    initialized,
    publicUser,
    // Getters
    isAuthenticated,
    isLoggedIn,
    currentUser,
    isOwner,
    // Actions
    initAuth,
    fetchPublicUser,
    getAuthToken,  // Export the new method
    cleanup,
    refreshToken
  }
})