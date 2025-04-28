import { supabase } from '@/lib/supabase'
import axios from '@/axios'

/**
 * Session Recovery Utility
 * 
 * This utility provides methods to recover from auth session issues.
 */

/**
 * Attempt to recover from a broken session state
 * @returns {Promise<boolean>} Success of recovery attempt
 */
export async function attemptSessionRecovery() {
  console.log('Attempting session recovery...')
  
  // Step 1: Check for token in localStorage
  const storedToken = localStorage.getItem('token')
  if (!storedToken) {
    console.log('No stored token found, cannot recover session')
    return false
  }
  
  try {
    // Step 2: Try to restore session with Supabase
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: storedToken
    })
    
    if (error) {
      console.error('Failed to restore session with Supabase:', error)
      
      // Step 3: As a last resort, try server-side session restoration
      try {
        const response = await axios.post('/api/auth/restore-session', { 
          token: storedToken 
        }, {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        })
        
        if (response.data && response.data.authenticated) {
          console.log('Server-side session restoration successful')
          return true
        }
      } catch (serverError) {
        console.error('Server-side session restoration failed:', serverError)
      }
      
      return false
    }
    
    if (data.session) {
      console.log('Session restored successfully')
      localStorage.setItem('token', data.session.access_token)
      return true
    }
    
    return false
  } catch (err) {
    console.error('Session recovery attempt failed:', err)
    return false
  }
}

/**
 * Clear all auth-related data for a fresh start
 */
export function clearAuthData() {
  // Clear token
  localStorage.removeItem('token')
  
  // Clear user data
  localStorage.removeItem('userData')
  localStorage.removeItem('last_user_fetch_time')
  
  // Clear other auth-related items
  localStorage.removeItem('pendingBookingDetails')
  
  console.log('Auth data cleared')
}

export default {
  attemptSessionRecovery,
  clearAuthData
}
