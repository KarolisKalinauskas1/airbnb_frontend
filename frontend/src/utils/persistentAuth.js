/**
 * Persistent Auth Utilities
 * Handles JWT token storage and retrieval
 */
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * Save token to storage
 * @param {string} token - The JWT token to save
 */
export function saveTokenToStorage(token) {
  try {
    if (!token || typeof token !== 'string' || token.length === 0) {
      console.warn('Attempting to save invalid token');
      return false;
    }
    localStorage.setItem('auth_token', token);
    return true;
  } catch (error) {
    console.error('Error saving token to storage:', error);
    return false;
  }
}

/**
 * Get token from storage
 * @returns {string|null} The stored token or null if not found
 */
export function getTokenFromStorage() {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      // Also check Supabase token as fallback
      const supabaseToken = localStorage.getItem('supabase.auth.token');
      if (supabaseToken) {
        try {
          const { access_token } = JSON.parse(supabaseToken);
          if (access_token && typeof access_token === 'string' && access_token.length > 0) {
            return access_token;
          }
        } catch (parseError) {
          console.warn('Error parsing Supabase token:', parseError);
        }
      }
      return null;
    }
    return token;
  } catch (error) {
    console.error('Error getting token from storage:', error);
    return null;
  }
}

/**
 * Save user to storage
 * @param {object} user - The user object to save
 */
export function saveUserToStorage(user) {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Get user from storage
 * @returns {object|null} The stored user object or null if not found
 */
export function getUserFromStorage() {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error('Failed to parse stored user data:', e);
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

/**
 * Clear all auth data from storage
 */
export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Helper to check if stored token is expired
export function isTokenExpired(token) {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expiry;
  } catch (e) {
    console.error('Failed to parse token:', e);
    return true;
  }
}

// Helper to check if we have valid auth data
export function hasValidAuthData() {
  const token = getTokenFromStorage();
  const user = getUserFromStorage();
  return token && user && !isTokenExpired(token);
}