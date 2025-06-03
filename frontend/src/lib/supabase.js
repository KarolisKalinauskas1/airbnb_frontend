import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create Supabase client with minimal configuration to prevent loops
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false // Prevent auto-detection of auth in URL
  }
})

// Test connection function to verify Supabase is accessible
export async function testSupabaseConnection() {
  try {
    // Use a simpler connection test that doesn't rely on a specific table
    const { data, error } = await supabase.auth.getSession()
    // Just check if we can communicate with Supabase at all
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
    console.error('Supabase connection test error:', err)
    return { 
      connected: false, 
      message: `Connection failed: ${err.message}`,
      error: err
    }
  }
}

// Helper function to check session status
export async function checkSessionStatus() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.warn('Session check error:', error)
      return { valid: false, error }
    }
    return { valid: !!session, session }
  } catch (err) {
    console.error('Session check failed:', err)
    return { valid: false, error: err }
  }
}

export default supabase
