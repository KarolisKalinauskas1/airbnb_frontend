/**
 * Supabase utility functions for connection testing and other common operations
 */
import { supabase } from '@/lib/supabase'
import { diagnoseNetworkIssues } from './networkDiagnostic'
/**
 * Test the connection to Supabase with enhanced error handling
 * 
 * @returns {Promise<Object>} An object with connected boolean, status message, and error details
 */
export async function testSupabaseConnection() {
  try {
    // First check if the browser reports being offline
    if (!navigator.onLine) {
      return {
        connected: false,
        message: 'Device is offline',
        error: new Error('Device is offline'),
        errorType: 'OFFLINE'
      }
    }
    
    // Get the Supabase URL for testing
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qbhrwpgejrhbfesbomuo.supabase.co'
    
    // Run network diagnostics first
    const diagnosticResults = await diagnoseNetworkIssues()
    
    if (!diagnosticResults.supabaseReachable) {
      return {
        connected: false,
        message: diagnosticResults.supabaseError || 'Unable to reach Supabase service',
        error: new Error(diagnosticResults.error || 'SUPABASE_UNREACHABLE'),
        errorType: diagnosticResults.error || 'CONNECTION_ERROR',
        diagnostics: diagnosticResults
      }
    }

    // If network is available, try to authenticate
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError) {
      // Check for specific error types
      if (authError.message?.includes('Failed to fetch')) {
        return {
          connected: false,
          message: 'Network error while connecting to Supabase',
          error: authError,
          errorType: 'NETWORK_ERROR'
        }
      }

      if (authError.status === 404) {
        return {
          connected: false,
          message: 'Auth endpoint not found - check your project configuration',
          error: authError,
          errorType: 'AUTH_NOT_FOUND'
        }
      }

      return {
        connected: false,
        message: `Auth error: ${authError.message}`,
        error: authError,
        errorType: 'AUTH_ERROR'
      }
    }

    // Successfully verified auth endpoint
    return {
      connected: true,
      message: 'Successfully connected to Supabase'
    }
  } catch (err) {
    console.error('Supabase connection test error:', err)
    return {
      connected: false,
      message: `Connection error: ${err.message}`,
      error: err,
      errorType: err.errorType || 'UNKNOWN_ERROR'
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
