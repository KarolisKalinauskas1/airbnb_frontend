import { createClient } from '@supabase/supabase-js'

// Use environment variables for configuration to avoid hardcoding sensitive values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// Prefer VITE_SUPABASE_ANON_KEY for client-side auth, fall back to VITE_SUPABASE_KEY if needed
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Anon Key exists:', !!supabaseAnonKey)

// Validate required configuration and log for debugging
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please check your environment variables.')
  console.log('VITE_SUPABASE_URL:', supabaseUrl)
  console.log('Supabase Auth Key:', supabaseAnonKey ? 'Set (value hidden)' : 'Not set')
  throw new Error('Missing Supabase environment variables')
}

// Create a single supabase client for the entire app with secure defaults
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Keep session data in localStorage
    autoRefreshToken: true, // Automatically refresh tokens
    detectSessionInUrl: true, // Enable detection of OAuth redirects
    storageKey: 'supabase.auth.token', // Explicit key for localStorage
    storage: window.localStorage, // Use localStorage for storing session data
    // Increase debug level to help diagnose issues
    debug: import.meta.env.DEV
  }
})

// Test connection function to verify Supabase is accessible
export async function testSupabaseConnection() {
  try {
    console.log("Testing connection to Supabase at URL:", supabaseUrl)
    
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

// Add a dedicated function to check session status
export async function checkSessionStatus() {
  try {
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      return { 
        valid: false, 
        error: error.message 
      }
    }
    
    if (!data.session) {
      return { 
        valid: false, 
        reason: 'No active session' 
      }
    }
    
    // Check if token is expired or about to expire
    const expiresAt = new Date(data.session.expires_at * 1000)
    const now = new Date()
    const expiresInMinutes = (expiresAt - now) / (1000 * 60)
    
    return {
      valid: expiresInMinutes > 0,
      expiresInMinutes,
      needsRefresh: expiresInMinutes < 5,
      session: data.session
    }
  } catch (err) {
    return {
      valid: false,
      error: err.message
    }
  }
}

export default supabase
