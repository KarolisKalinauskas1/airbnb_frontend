/**
 * Auth Loop Breaker Utility
 * 
 * This utility helps detect and prevent infinite redirect loops
 * between authentication pages and protected routes.
 * It tracks redirects in both short and long time windows to catch different types of loops.
 */

// Store counters in sessionStorage to persist across page loads
const AUTH_LOOP_DETECTION_KEY = 'auth_redirect_counter';
const AUTH_LOOP_TIMESTAMP_KEY = 'auth_redirect_timestamp';
const AUTH_LOOP_SOURCES_KEY = 'auth_redirect_sources';
const AUTH_LONG_WINDOW_KEY = 'auth_long_window_counter';
const AUTH_LONG_WINDOW_TIMESTAMP_KEY = 'auth_long_window_timestamp';

const MAX_REDIRECTS = 2; // Max redirects in short window (reduced from 3)
const MAX_LONG_WINDOW_REDIRECTS = 5; // Max redirects in long window (reduced from 10)
const WINDOW_SIZE = 5000; // 5 seconds for short window (reduced from 10 seconds)
const LONG_WINDOW_SIZE = 30000; // 30 seconds for long window (reduced from 1 minute)

/**
 * Check if we're in an auth redirect loop and should break it
 * @param {string} source - Source of the redirect (e.g. 'login', 'booking', etc.)
 * @returns {boolean} - true if we should break the loop, false otherwise
 */
export function shouldBreakAuthLoop(source = 'unknown') {
  try {
    const now = Date.now();
    
    // Short window check (rapid redirects in a few seconds)
    const lastTimestamp = parseInt(sessionStorage.getItem(AUTH_LOOP_TIMESTAMP_KEY) || '0');
    let counter = parseInt(sessionStorage.getItem(AUTH_LOOP_DETECTION_KEY) || '0');
    
    // Long window check (many redirects over a minute)
    const lastLongTimestamp = parseInt(sessionStorage.getItem(AUTH_LONG_WINDOW_TIMESTAMP_KEY) || '0');
    let longCounter = parseInt(sessionStorage.getItem(AUTH_LONG_WINDOW_KEY) || '0');
    
    // Track the sources of redirects
    const sourceList = JSON.parse(sessionStorage.getItem(AUTH_LOOP_SOURCES_KEY) || '[]');
    
    // Reset short window counter if outside time window
    if (now - lastTimestamp > WINDOW_SIZE) {
      counter = 0;
      // Reset sources if we reset counter
      sourceList.length = 0;
    }
    
    // Reset long window counter if outside time window
    if (now - lastLongTimestamp > LONG_WINDOW_SIZE) {
      longCounter = 0;
    }
    
    // Increment counters and update timestamps
    counter++;
    longCounter++;
    
    // Add source to the list
    if (!sourceList.includes(source)) {
      sourceList.push(source);
    }
    
    // Update storage
    sessionStorage.setItem(AUTH_LOOP_DETECTION_KEY, counter.toString());
    sessionStorage.setItem(AUTH_LOOP_TIMESTAMP_KEY, now.toString());
    sessionStorage.setItem(AUTH_LONG_WINDOW_KEY, longCounter.toString());
    sessionStorage.setItem(AUTH_LONG_WINDOW_TIMESTAMP_KEY, now.toString());
    sessionStorage.setItem(AUTH_LOOP_SOURCES_KEY, JSON.stringify(sourceList));
    
    // Check if we should break the loop
    const breakShortWindow = counter >= MAX_REDIRECTS;
    const breakLongWindow = longCounter >= MAX_LONG_WINDOW_REDIRECTS;
    
    // Log and return result
    if (breakShortWindow) {
      console.error(`Rapid auth loop detected: ${counter} redirects in ${WINDOW_SIZE}ms from sources: ${sourceList.join(', ')}`);
      return true;
    }
    
    if (breakLongWindow) {
      console.error(`Sustained auth loop detected: ${longCounter} redirects in ${LONG_WINDOW_SIZE}ms from sources: ${sourceList.join(', ')}`);
      return true;
    }
    
    if (counter > 1) {
      console.warn(`Auth redirect warning: ${counter} redirects in ${now - lastTimestamp}ms from ${source}`);
    }
    
    return false;
  } catch (error) {
    console.error('Error in auth loop detection:', error);
    return false; // Don't break on error
  }
}

/**
 * Reset the auth loop counter
 */
export function resetAuthLoopCounter() {
  try {
    // Reset all auth loop related storage
    sessionStorage.removeItem(AUTH_LOOP_DETECTION_KEY);
    sessionStorage.removeItem(AUTH_LOOP_TIMESTAMP_KEY);
    sessionStorage.removeItem(AUTH_LOOP_SOURCES_KEY);
    sessionStorage.removeItem(AUTH_LONG_WINDOW_KEY);
    sessionStorage.removeItem(AUTH_LONG_WINDOW_TIMESTAMP_KEY);
    
    console.log('Auth loop counters reset successfully');
  } catch (error) {
    console.error('Error resetting auth loop counter:', error);
  }
}

/**
 * Returns the current state of auth redirection
 */
export function getAuthRedirectState() {
  return {
    shortWindow: {
      count: parseInt(sessionStorage.getItem(AUTH_LOOP_DETECTION_KEY) || '0'),
      timestamp: parseInt(sessionStorage.getItem(AUTH_LOOP_TIMESTAMP_KEY) || '0'),
      timeSinceLastRedirect: Date.now() - parseInt(sessionStorage.getItem(AUTH_LOOP_TIMESTAMP_KEY) || '0')
    },
    longWindow: {
      count: parseInt(sessionStorage.getItem(AUTH_LONG_WINDOW_KEY) || '0'),
      timestamp: parseInt(sessionStorage.getItem(AUTH_LONG_WINDOW_TIMESTAMP_KEY) || '0'),
      timeSinceLastRedirect: Date.now() - parseInt(sessionStorage.getItem(AUTH_LONG_WINDOW_TIMESTAMP_KEY) || '0')
    },
    sources: JSON.parse(sessionStorage.getItem(AUTH_LOOP_SOURCES_KEY) || '[]')
  };
}

/**
 * Check if the current URL has a loop=broken parameter that indicates a loop was detected
 * and reset the counters if it does
 */
export function checkAndHandleLoopParam() {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('loop') === 'broken') {
      // Loop was broken, reset counters
      resetAuthLoopCounter();
      
      // Remove the parameter from the URL without reloading
      url.searchParams.delete('loop');
      window.history.replaceState({}, document.title, url.toString());
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking loop parameter:', error);
    return false;
  }
}

export default {
  shouldBreakAuthLoop,
  resetAuthLoopCounter,
  getAuthRedirectState,
  checkAndHandleLoopParam
};
