/**
 * Supabase utility functions for connection testing and other common operations
 */
import { supabase } from '@/lib/supabase'

/**
 * Test the connection to Supabase
 * 
 * @returns {Promise<Object>} An object with connected boolean and status message
 */
export async function testSupabaseConnection() {
  try {
    console.log("Testing connection to Supabase...")
    
    // Use a simple test that just checks if we can communicate with Supabase
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Supabase connection test error:', error.message)
      return { 
        connected: false, 
        message: `Connection error: ${error.message}`
      }
    }
    
    // Successfully communicated with Supabase
    return { 
      connected: true, 
      message: 'Connection successful'
    }
  } catch (err) {
    console.error('Supabase connection test exception:', err)
    return { 
      connected: false, 
      message: `Connection failed: ${err.message}`,
      error: err
    }
  }
}

/**
 * Get Supabase configuration information
 * 
 * @returns {Object} Configuration information
 */
export function getSupabaseConfig() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL || 'Not configured',
    hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  }
}
