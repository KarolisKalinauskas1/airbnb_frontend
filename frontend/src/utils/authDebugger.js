import { supabase } from '@/lib/supabase'
import axios from 'axios'

export const authDebugger = {
  async checkAuthState() {
    console.log('=== AUTH STATE DEBUGGER ===')
    
    // Check Supabase session
    const { data: { session } } = await supabase.auth.getSession()
    console.log('Supabase session exists:', !!session)
    
    if (session) {
      console.log('User ID:', session.user.id)
      console.log('Email:', session.user.email)
      console.log('Token expires at:', new Date(session.expires_at * 1000).toLocaleString())
    }
    
    // Check localStorage for user data
    const userData = localStorage.getItem('userData')
    console.log('UserData in localStorage:', !!userData)
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        console.log('User ID from localStorage:', parsed.user_id)
        console.log('Is owner:', parsed.isowner === 1 ? 'Yes' : 'No')
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
      
      try {
        // Test without /api prefix
        console.log('Testing /users/full-info...')
        const directResponse = await axios.get('/users/full-info', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        })
        console.log('✅ /users/full-info works:', directResponse.status)
      } catch (error) {
        console.error('❌ /users/full-info failed:', error.response?.status || error.message)
      }
    }
    
    console.log('=== END AUTH STATE ===')
    
    return {
      hasSession: !!session,
      hasLocalUserData: !!userData
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
      // Try to refresh the token
      const { error } = await supabase.auth.refreshSession()
      if (error) {
        console.error('Failed to refresh session:', error)
        return false
      }
      
      // Try both API paths
      let userData = null
      
      try {
        const response = await axios.get('/api/users/full-info', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        })
        userData = response.data
      } catch (error) {
        console.log('Failed with /api prefix, trying without...')
        try {
          const response = await axios.get('/users/full-info', {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          })
          userData = response.data
        } catch (innerError) {
          console.error('Both API paths failed:', innerError)
        }
      }
      
      if (userData) {
        localStorage.setItem('userData', JSON.stringify(userData))
        console.log('✅ Fixed: User data retrieved and stored')
        return true
      }
    } catch (error) {
      console.error('Failed to fix auth state:', error)
    }
    
    return false
  }
}
