import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/axios'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const fullUser = ref(null)
  const loading = ref(false)
  const isInitialized = ref(false)

  const clearState = () => {
    user.value = null
    fullUser.value = null
    isInitialized.value = false
    localStorage.removeItem('userData')
  }

  const syncUserWithBackend = async (userData) => {
    try {
      const isSeller = userData.user_metadata?.is_seller || false
      await axios.post('/api/users/sync', {
        email: userData.email,
        full_name: userData.user_metadata?.full_name || userData.email,
        is_seller: isSeller,
        license: userData.user_metadata?.license || 'none',
        auth_user_id: userData.id
      })
    } catch (err) {
      console.error('Failed to sync user with backend:', err)
    }
  }

  const fetchFullUserInfo = async (forceRefresh = false) => {
    // If we already have the data and don't need a refresh, return cached data
    if (!forceRefresh && fullUser.value && isInitialized.value) {
      return fullUser.value
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return null

      loading.value = true
      const { data } = await axios.get('/api/users/full-info')
      
      if (data) {
        data.isowner = typeof data.isowner === 'boolean' ? 
          (data.isowner ? 1 : 0) : 
          Number(data.isowner)
        fullUser.value = data
        isInitialized.value = true
        localStorage.setItem('userData', JSON.stringify(data))
      }
      return data
    } catch (error) {
      console.error('Failed to fetch full user info:', error)
      return null
    } finally {
      loading.value = false
    }
  }

  const initAuth = async () => {
    // If already initialized and have data, return early
    if (isInitialized.value && fullUser.value) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        user.value = session.user
        await syncUserWithBackend(session.user)

        // Try to get user data from storage first
        const storedData = localStorage.getItem('userData')
        if (storedData) {
          const parsed = JSON.parse(storedData)
          parsed.isowner = Number(parsed.isowner)
          fullUser.value = parsed
          isInitialized.value = true
        }
        // Fetch fresh data only if we don't have stored data
        if (!storedData) {
          await fetchFullUserInfo()
        }
      } else {
        clearState()
      }
    } catch (error) {
      console.error('Init auth error:', error)
      clearState()
    }
  }

  const handleLogin = async (credentials) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword(credentials)
      if (error) throw error
      
      user.value = data.user
      await syncUserWithBackend(data.user)
      
      // Fetch user info immediately after successful login
      const userData = await fetchFullUserInfo()
      
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
      await supabase.auth.signOut()
      clearState()
    } catch (error) {
      console.error('Logout error:', error)
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
    clearState
  }
})
