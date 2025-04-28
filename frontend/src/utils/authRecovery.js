/**
 * Auth Recovery Utilities
 * 
 * For recovering sessions from various storage mechanisms
 */
import { supabase } from '@/lib/supabase';

/**
 * Attempt to recover session from any available token source
 * @returns {Promise<boolean>} Whether recovery was successful
 */
export async function recoverSession() {
  // Try to get token from all possible storage locations
  const token = getTokenFromAnySource();
  
  if (!token) {
    return false;
  }
  
  try {
    // Attempt to set the session in Supabase
    const { data, error } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: ''
    });
    
    if (error) {
      console.warn('Session recovery failed:', error.message);
      return false;
    }
    
    return !!data.session;
  } catch (e) {
    console.error('Error during session recovery:', e);
    return false;
  }
}

/**
 * Try to get a token from any available source
 * @returns {string|null} The token if found, null otherwise
 */
function getTokenFromAnySource() {
  // Try localStorage
  try {
    // Check all possible token storage keys
    const localStorageKeys = ['token', 'sb-token', 'supabase.auth.token'];
    for (const key of localStorageKeys) {
      const token = localStorage.getItem(key);
      if (token) {
        if (isTokenString(token)) {
          return extractTokenFromValue(token);
        }
      }
    }
  } catch (e) {
    console.warn('Error accessing localStorage:', e);
  }
  
  // Try sessionStorage
  try {
    const sessionStorageKeys = ['token', 'sb-token', 'supabase.auth.token'];
    for (const key of sessionStorageKeys) {
      const token = sessionStorage.getItem(key);
      if (token) {
        if (isTokenString(token)) {
          return extractTokenFromValue(token);
        }
      }
    }
  } catch (e) {
    console.warn('Error accessing sessionStorage:', e);
  }
  
  // Try cookies
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (['auth_token', 'sb-token'].includes(key) && value) {
        return value;
      }
    }
  } catch (e) {
    console.warn('Error accessing cookies:', e);
  }
  
  return null;
}

/**
 * Check if a value looks like a token
 */
function isTokenString(value) {
  // Basic check - tokens are typically long strings
  if (typeof value !== 'string') return false;
  
  // JWT typically have at least 2 dots and are longer than 20 chars
  return value.length > 20 && value.split('.').length >= 2;
}

/**
 * Extract token from a potentially complex value (like a stringified object)
 */
function extractTokenFromValue(value) {
  // If it's a simple string token, return it
  if (isTokenString(value)) {
    return value;
  }
  
  // Try to parse JSON
  try {
    const parsed = JSON.parse(value);
    
    // Handle common storage formats
    if (parsed.access_token) {
      return parsed.access_token;
    } else if (parsed.token) {
      return parsed.token;
    } else if (parsed.currentSession?.access_token) {
      return parsed.currentSession.access_token;
    }
  } catch (e) {
    // Not JSON - just return the original value if it looks like a token
    if (isTokenString(value)) {
      return value;
    }
  }
  
  return null;
}

/**
 * Ensure token is stored in all storage mechanisms
 */
export function ensureTokenInAllStorage(token) {
  if (!token) return;
  
  try {
    localStorage.setItem('token', token);
    sessionStorage.setItem('token', token);
    document.cookie = `auth_token=${token}; path=/; max-age=2592000; SameSite=Strict`;
  } catch (e) {
    console.warn('Failed to store token in all locations:', e);
  }
}

export default {
  recoverSession,
  ensureTokenInAllStorage
};
