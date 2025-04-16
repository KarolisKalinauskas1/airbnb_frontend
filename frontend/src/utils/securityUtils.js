/**
 * Security Utilities for Airbnb for Camping Application
 * 
 * This file contains utilities to help with security best practices
 * in the frontend application.
 */

/**
 * Safely clear sensitive data from local storage
 * Should be called on logout or session timeout
 */
export function clearSensitiveData() {
  // Clear all known sensitive data keys
  const sensitiveKeys = [
    'userData',
    'pendingBookingDetails',
    'last_user_fetch_time'
  ];
  
  sensitiveKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  console.log('Cleared sensitive data from storage');
}

/**
 * Check if a token is about to expire and should be refreshed
 * @param {Object} session - Supabase session object
 * @returns {boolean} - True if token should be refreshed
 */
export function shouldRefreshToken(session) {
  if (!session || !session.expires_at) return false;
  
  const expiresAt = new Date(session.expires_at * 1000);
  const now = new Date();
  
  // If token expires in less than 5 minutes, refresh it
  const expiresInMinutes = (expiresAt - now) / (1000 * 60);
  return expiresInMinutes < 5;
}

/**
 * Sanitize error messages before displaying to users
 * to prevent leaking sensitive information
 * 
 * @param {Error|string} error - The original error
 * @returns {string} - Sanitized error message
 */
export function sanitizeErrorMessage(error) {
  const errorMsg = error?.message || error?.toString() || 'An unknown error occurred';
  
  // List of sensitive terms that should not be shown to users
  const sensitiveTerms = [
    'password',
    'token',
    'key',
    'secret',
    'credential',
    'supabase',
    'postgres',
    'database',
    'sql',
    'query',
    'syntax'
  ];
  
  // Check if the error message contains any sensitive terms
  const containsSensitiveInfo = sensitiveTerms.some(term => 
    errorMsg.toLowerCase().includes(term)
  );
  
  if (containsSensitiveInfo) {
    // Return a generic message instead
    return 'An error occurred. Please try again or contact support if the problem persists.';
  }
  
  return errorMsg;
}

/**
 * Set secure timeout to automatically log out users
 * after a period of inactivity
 * 
 * @param {Function} logoutFunction - Function to call for logout
 * @param {number} timeoutMinutes - Timeout in minutes
 * @returns {Object} - Timer control object
 */
export function setupInactivityTimeout(logoutFunction, timeoutMinutes = 30) {
  let timer;
  const timeoutMs = timeoutMinutes * 60 * 1000;
  
  // Function to reset the timer
  const resetTimer = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      console.log(`User inactive for ${timeoutMinutes} minutes, logging out`);
      logoutFunction();
    }, timeoutMs);
  };
  
  // Initial setup
  resetTimer();
  
  // Add event listeners to reset the timer on user activity
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
  events.forEach(event => {
    document.addEventListener(event, resetTimer, { passive: true });
  });
  
  // Return control object
  return {
    clearTimeout: () => {
      if (timer) clearTimeout(timer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    },
    resetTimeout: resetTimer
  };
}
