import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import axios from '@/axios'
import router from '@/router'
import { saveTokenToStorage, saveUserToStorage } from '@/utils/persistentAuth'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const session = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const initialized = ref(false)
  const isInitializing = ref(false)
  const lastFetch = ref(0)
  const publicUser = ref(null)
  const isLoggingOut = ref(false)

  // Constants
  const CACHE_TIME = 5 * 60 * 1000 // 5 minutes cache
  const MIN_OPERATION_INTERVAL = 500 // 500ms minimum between operations

  // Set session
  const setSession = async (newSession) => {
    try {
      if (!newSession) {
        await clearSession(true)
        return
      }

      // Update session state
      session.value = newSession
      user.value = newSession.user

      // Store session in localStorage for persistence
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: newSession.access_token,
        refresh_token: newSession.refresh_token,
        expires_at: newSession.expires_at
      }))
      localStorage.setItem('supabase.auth.user', JSON.stringify(newSession.user))
      
      // Save to persistent storage
      saveTokenToStorage(newSession.access_token)
      saveUserToStorage(newSession.user)

      // Fetch additional user data
      await fetchUserData(newSession.access_token)

      error.value = null
    } catch (err) {
      console.error('Error setting session:', err)
      error.value = 'Failed to set session'
    }
  }

  // Fetch user data from backend
  const fetchUserData = async (token) => {
    try {
      const response = await axios.get('/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      publicUser.value = response.data
      if (publicUser.value) {
        saveUserToStorage(publicUser.value)
      }
    } catch (err) {
      console.error('Error fetching user data:', err)
    }
  }

  // Update token
  const updateToken = async (newToken) => {
    try {
      if (!newToken) {
        console.warn('Attempted to update with null token')
        return
      }

      // If we have a session, update it
      if (session.value) {
        session.value.access_token = newToken
        // Save to storage
        saveTokenToStorage(newToken)
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          ...JSON.parse(localStorage.getItem('supabase.auth.token') || '{}'),
          access_token: newToken
        }))
      } else {
        // If no session, try to restore it using the new token
        await refreshSession(newToken)
      }
    } catch (err) {
      console.error('Error updating token:', err)
      error.value = 'Failed to update token'
    }
  }

  // Refresh token
  const refreshToken = async () => {
    try {
      // Get current refresh token from session
      const currentSession = session.value
      if (!currentSession?.refresh_token) {
        console.warn('No refresh token available')
        return false
      }

      // Try to refresh the session using Supabase
      const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) throw refreshError
      
      if (newSession) {
        await setSession(newSession)
        return true
      }

      return false
    } catch (err) {
      console.error('Error refreshing token:', err)
      error.value = 'Failed to refresh authentication token'
      return false
    }
  }

  // Refresh the session
  const refreshSession = async (token) => {
    try {
      const { data: { session: newSession }, error: refreshError } = await supabase.auth.getSession()
      if (refreshError) throw refreshError
      
      if (newSession) {
        await setSession(newSession)
        return true
      }
      return false
    } catch (err) {
      console.error('Error refreshing session:', err)
      return false
    }
  }

  // Clear session helper function
  const clearSession = async (force = false) => {
    if (isLoggingOut.value && !force) {
      console.log('Logout already in progress')
      return false
    }

    isLoggingOut.value = true
    try {
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear state
      user.value = null
      session.value = null
      publicUser.value = null
      error.value = null
      initialized.value = false
      
      // Clear all auth-related storage
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('supabase.auth.user')
      localStorage.removeItem('token')
      localStorage.removeItem('authenticationComplete')
      
      // Force router to home page
      router.push('/')
      
      isLoggingOut.value = false
      return true
    } catch (err) {
      console.error('Error during logout:', err)
      error.value = 'Failed to completely clear session'
      isLoggingOut.value = false
      
      // Force page refresh in case of error
      window.location.reload()
      throw err
    }
  }

  // Initialize auth state
  const initAuth = async ({ forceRefresh = false } = {}) => {
    if (isInitializing.value) {
      console.log('Auth initialization already in progress')
      return
    }
    isInitializing.value = true
    try {
      // Check if we have a recent cached session
      if (!forceRefresh && Date.now() - lastFetch.value < CACHE_TIME) {
        isInitializing.value = false
        return
      }

      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError

      if (currentSession) {
        await setSession(currentSession)
      } else {
        await clearSession(true)
      }

      lastFetch.value = Date.now()
      initialized.value = true
      error.value = null
    } catch (err) {
      console.error('Auth initialization error:', err)
      error.value = 'Failed to initialize authentication'
      await clearSession(true)
    } finally {
      isInitializing.value = false
    }
  }

  // Get current auth token
  const getAuthToken = async () => {
    try {
      console.log('[AUTH] Getting auth token, session state:', {
        hasSession: !!session.value,
        hasUser: !!user.value,
        hasPublicUser: !!publicUser.value
      });
      
      // First try to get from session
      if (session.value?.access_token) {
        return session.value.access_token;
      }
      
      // Then try to get from storage
      const storedToken = localStorage.getItem('supabase.auth.token');
      if (storedToken) {
        try {
          const { access_token } = JSON.parse(storedToken);
          if (access_token) {
            // Validate token format
            if (typeof access_token === 'string' && access_token.length > 0) {
              return access_token;
            }
          }
        } catch (parseError) {
          console.error('Error parsing stored token:', parseError);
        }
      }
      
      // If we got here, we need to refresh
      const refreshed = await refreshToken();
      if (refreshed && session.value?.access_token) {
        return session.value.access_token;
      }
      
      // If all else fails, clear session and return null
      await clearSession();
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Cleanup function
  const cleanup = () => {
    user.value = null
    session.value = null
    publicUser.value = null
    error.value = null
    initialized.value = false
    isInitializing.value = false
    lastFetch.value = 0
  }

  // Computed properties
  const isLoggedIn = computed(() => !!session.value && !!user.value)
  const isOwner = computed(() => publicUser.value?.isowner === 1)
  const isAuthenticated = computed(() => !!session.value?.access_token)
  const fullUser = computed(() => ({
    ...user.value,
    ...publicUser.value
  }))

  return {
    // State
    user,
    session,
    loading,
    error,
    initialized,
    isInitializing,
    publicUser,
    
    // Getters
    isLoggedIn,
    isOwner,
    fullUser,
    isAuthenticated,
    
    // Actions
    initAuth,
    setSession,
    clearSession,
    refreshToken,
    getAuthToken,
    updateToken, // Add the new function
    cleanup,
    
    // Helper getters
    token: computed(() => session.value?.access_token)
  }
})