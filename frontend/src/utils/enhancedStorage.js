/**
 * Enhanced Storage Utility
 * 
 * Provides more reliable storage across browser sessions
 */

// Storage keys
const TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'userData';
const SESSION_TIMESTAMP_KEY = 'session_timestamp';

/**
 * Save token with multiple redundant methods to ensure persistence
 * @param {string} token - JWT token to save
 */
export function saveAuthToken(token) {
  if (!token) return;
  
  try {
    // 1. localStorage (persists across sessions)
    localStorage.setItem(TOKEN_KEY, token);
    
    // 2. sessionStorage (cleared when tab is closed)
    sessionStorage.setItem(TOKEN_KEY, token);
    
    // 3. Cookie storage (works across subdomains, harder to clear accidentally)
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=604800; SameSite=Strict`;
    
    // 4. Update timestamp
    localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
    
    console.log('Token saved in multiple storage locations');
  } catch (error) {
    console.warn('Failed to save token to storage:', error);
  }
}

/**
 * Get auth token from any available storage
 * @returns {string|null} Auth token if found, null otherwise
 */
export function getAuthToken() {
  try {
    // Try localStorage first
    const localToken = localStorage.getItem(TOKEN_KEY);
    if (localToken) return localToken;
    
    // Try sessionStorage next
    const sessionToken = sessionStorage.getItem(TOKEN_KEY);
    if (sessionToken) return sessionToken;
    
    // Finally try cookies
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === TOKEN_KEY && value) {
        return value;
      }
    }
  } catch (error) {
    console.warn('Error retrieving auth token:', error);
  }
  
  return null;
}

/**
 * Save user data with timestamp
 * @param {Object} userData - User data object
 */
export function saveUserData(userData) {
  if (!userData) return;
  
  try {
    // Store data as string
    const dataString = JSON.stringify(userData);
    localStorage.setItem(USER_DATA_KEY, dataString);
    sessionStorage.setItem(USER_DATA_KEY, dataString);
    localStorage.setItem('last_user_fetch_time', Date.now().toString());
  } catch (error) {
    console.warn('Failed to save user data:', error);
  }
}

/**
 * Get user data from storage
 * @returns {Object|null} User data if found
 */
export function getUserData() {
  try {
    // Try localStorage first
    const localData = localStorage.getItem(USER_DATA_KEY);
    if (localData) {
      return JSON.parse(localData);
    }
    
    // Try sessionStorage
    const sessionData = sessionStorage.getItem(USER_DATA_KEY);
    if (sessionData) {
      return JSON.parse(sessionData);
    }
  } catch (error) {
    console.warn('Error retrieving user data:', error);
  }
  
  return null;
}

/**
 * Clear all authentication data from storage
 */
export function clearAuthData() {
  try {
    // Clear localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem('last_user_fetch_time');
    localStorage.removeItem(SESSION_TIMESTAMP_KEY);
    
    // Clear sessionStorage
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_DATA_KEY);
    
    // Clear cookie
    document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
  } catch (error) {
    console.warn('Error clearing auth data:', error);
  }
}

/**
 * Check if we have an active session based on stored data
 * @returns {boolean} True if active session exists
 */
export function hasActiveSession() {
  return !!getAuthToken() && !!getUserData();
}

export default {
  saveAuthToken,
  getAuthToken,
  saveUserData,
  getUserData,
  clearAuthData,
  hasActiveSession
};
