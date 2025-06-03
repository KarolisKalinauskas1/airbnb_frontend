/**
 * Network diagnostic utilities for the application
 */
import axios from '@/axios';

/**
 * Check if the browser reports being online
 * @returns {boolean} - True if the browser thinks it's online
 */
export const isBrowserOnline = () => navigator.onLine;

/**
 * Check if a website is reachable via DNS and its service is available
 * @param {string} url - URL to check
 * @returns {Promise<Object>} - Results of the check including reachability and error info
 */
export async function checkDns(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    // Extract the hostname and create URL object
    const urlObj = new URL(url);

    // Handle Supabase endpoints specifically
    if (urlObj.hostname.includes('supabase.co')) {
      try {
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const healthUrl = `${url}/auth/v1/health`;
        const response = await fetch(healthUrl, {
          method: 'GET',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        // For Supabase, consider 401/403 as successful DNS resolution
        if (response.ok || response.status === 401 || response.status === 403) {
          return { reachable: true };
        }

        return {
          reachable: false,
          error: `Supabase health check failed: ${response.status} ${response.statusText}`,
          isSupabaseError: true,
          statusCode: response.status
        };
      } catch (error) {
        const isDnsError = error.message.includes('ERR_NAME_NOT_RESOLVED') ||
                          error.message.includes('net::ERR_NAME_NOT_RESOLVED') ||
                          error.message.includes('NS_ERROR_UNKNOWN_HOST');
        
        return {
          reachable: false,
          isDnsError,
          isSupabaseError: true,
          error: isDnsError 
            ? 'Cannot resolve Supabase hostname. Please check your network connection and DNS settings.'
            : `Failed to connect to Supabase: ${error.message}`
        };
      }
    }

    // For backend/API URLs, check the health endpoint
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      try {
        const healthUrl = `${url}/health`; // Use the health endpoint
        const response = await fetch(healthUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        });
        clearTimeout(timeoutId);
        
        // If health check responds, server is running
        if (response.ok) {
          return { 
            reachable: true,
            healthStatus: await response.json()
          };
        }
        
        return {
          reachable: false,
          error: `Backend health check failed: ${response.status} ${response.statusText}`,
          isLocalError: true,
          statusCode: response.status
        };
      } catch (error) {
        // Check if we can at least connect to the server
        try {
          const rootResponse = await fetch(url, {
            method: 'GET',
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          // If we can reach the server at all, consider it reachable
          return { 
            reachable: true,
            warning: 'Health endpoint not available, but server is responding'
          };
        } catch (rootError) {
          return {
            reachable: false,
            error: `Backend connection failed: ${error.message}`,
            isLocalError: true
          };
        }
      }
    }

    // For other URLs, use a basic check
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'no-cors',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return { reachable: true };
    } catch (error) {
      const isDnsError = error.message.includes('ERR_NAME_NOT_RESOLVED') ||
                        error.message.includes('net::ERR_NAME_NOT_RESOLVED') ||
                        error.message.includes('NS_ERROR_UNKNOWN_HOST');
      
      return {
        reachable: false,
        isDnsError,
        error: isDnsError 
          ? 'DNS resolution failed. Check your network connection and DNS settings.'
          : error.message
      };
    }
  } catch (error) {
    console.error(`Network check error for ${url}:`, error);
    return {
      reachable: false,
      error: `Unexpected error during network check: ${error.message}`
    };
  }
}

/**
 * Perform a comprehensive network diagnostic
 * @returns {Promise<Object>} - Diagnostic results
 */
export async function diagnoseNetworkIssues() {
  const results = {
    browserOnline: navigator.onLine,
    googleReachable: false,
    supabaseReachable: false,
    backendReachable: false,
    backendHealth: null,
    recommendedAction: null,
    error: null,
  };

  // If browser reports offline, no need to check further
  if (!results.browserOnline) {
    results.recommendedAction = 'CHECK_INTERNET_CONNECTION';
    return results;
  }

  // Try to reach Google (general internet connectivity check)
  try {
    const googleCheck = await checkDns('https://www.google.com');
    results.googleReachable = googleCheck.reachable;
  } catch (error) {
    results.googleReachable = false;
  }

  // Try to reach Supabase
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseCheck = await checkDns(supabaseUrl);
    results.supabaseReachable = supabaseCheck.reachable;
    results.supabaseError = supabaseCheck.error;

    if (!results.supabaseReachable) {
      if (supabaseCheck.isDnsError) {
        results.error = 'DNS_RESOLUTION_FAILED';
        results.recommendedAction = 'CHECK_DNS_SETTINGS';
      } else if (supabaseCheck.isSupabaseError) {
        if (supabaseCheck.statusCode === 401 || supabaseCheck.statusCode === 403) {
          results.supabaseReachable = true;
        } else {
          results.error = 'SUPABASE_CONNECTION_ERROR';
          results.recommendedAction = 'CHECK_SUPABASE_CONFIG';
        }
      }
    }
  } catch (error) {
    results.supabaseReachable = false;
    results.error = 'SUPABASE_CHECK_FAILED';
    results.recommendedAction = 'RETRY_OR_CONTACT_SUPPORT';
  }

  // Try to reach the backend
  try {
    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const backendCheck = await checkDns(apiUrl);
    
    results.backendReachable = backendCheck.reachable;
    if (backendCheck.healthStatus) {
      results.backendHealth = backendCheck.healthStatus;
    }
    
    if (!results.backendReachable) {
      if (backendCheck.warning) {
        // Server is responding but health endpoint isn't available
        results.backendReachable = true;
        results.backendHealth = { status: 'warning', message: backendCheck.warning };
      } else if (backendCheck.isLocalError) {
        results.error = 'BACKEND_ERROR';
        results.recommendedAction = 'CHECK_BACKEND_SERVER';
        if (backendCheck.statusCode === 404) {
          results.error = 'BACKEND_HEALTH_NOT_FOUND';
          results.recommendedAction = 'CHECK_BACKEND_ROUTES';
        }
      } else {
        results.error = 'BACKEND_UNREACHABLE';
        results.recommendedAction = 'CHECK_API_STATUS';
      }
    }
  } catch (error) {
    results.backendReachable = false;
    if (!results.error) {
      results.error = 'BACKEND_CHECK_FAILED';
      results.recommendedAction = 'CHECK_API_STATUS';
    }
  }

  return results;
}

/**
 * Get a user-friendly message for network issues
 * @param {Object} results - Diagnostic results
 * @returns {string} - User-friendly message
 */
export function getNetworkErrorMessage(results) {
  if (!results.browserOnline) {
    return "Your device appears to be offline. Please check your internet connection.";
  }

  if (!results.googleReachable) {
    return "Unable to connect to the internet. Please check your network connection.";
  }

  if (!results.supabaseReachable) {
    switch (results.error) {
      case 'DNS_RESOLUTION_FAILED':
        return "Unable to reach the authentication server. This could be caused by network restrictions or DNS problems.";
      case 'SUPABASE_SERVICE_NOT_FOUND':
        return "The authentication service appears to be misconfigured. Please contact support.";
      case 'SUPABASE_SERVICE_UNAVAILABLE':
        return "The authentication service is currently unavailable. Please try again later.";
      case 'SUPABASE_CONNECTION_ERROR':
        return "Unable to connect to the authentication service. This might be due to network restrictions.";
      default:
        return "Unable to connect to the authentication service. Please try again later.";
    }
  }

  if (!results.backendReachable) {
    switch (results.error) {
      case 'BACKEND_HEALTH_NOT_FOUND':
        return "The application server is running but some features may be unavailable.";
      case 'BACKEND_ERROR':
        return "The application server is experiencing issues. Please try again later.";
      case 'BACKEND_UNREACHABLE':
        return "Unable to connect to the application server. Please try again later.";
      default:
        return "Unable to connect to the application server. Please check your network connection.";
    }
  }

  if (results.backendHealth?.status === 'warning') {
    return results.backendHealth.message || "The server is running with limited functionality.";
  }

  return "A connection issue was detected. Please check your network connection and try again.";
}
