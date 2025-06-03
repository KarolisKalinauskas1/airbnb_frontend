/**
 * Router Navigation Utility
 * 
 * This utility provides a consistent way to handle navigation throughout the app,
 * especially for authentication redirects.
 */
import router from '@/router';
import { shouldBreakAuthLoop } from '@/utils/authLoopBreaker';

/**
 * Navigate to auth page with proper redirect
 * @param {string} source - Source of the redirect for tracking
 * @param {string} redirectPath - Path to redirect back to after auth
 * @param {Object} options - Additional options
 * @returns {boolean} - Returns false if navigation was blocked due to loop detection
 */
export function navigateToAuth(source = 'unknown', redirectPath = null, options = {}) {
  try {
    // Prevent navigation if we're already on the auth page
    if (window.location.pathname === '/auth') {
      console.log('Already on auth page, preventing potential loop');
      return false;
    }
    
    // Check for potential infinite loop
    if (shouldBreakAuthLoop(source)) {
      console.error(`Auth redirect loop detected from ${source}. Breaking the loop.`);
      
      // Use Vue Router to avoid possible browser history issues
      router.push({ 
        path: '/auth',
        query: { loop: 'broken' } 
      });
      
      return false;
    }
    
    // Get the path to redirect to after successful authentication
    const path = redirectPath || window.location.pathname;
    
    // Don't redirect back to auth page
    const cleanPath = path === '/auth' ? '/' : path;
    
    // Build query params
    const query = { redirect: cleanPath };
    if (options.loop) query.loop = options.loop;
    
    // Use Vue Router for navigation
    router.push({ 
      path: '/auth',
      query 
    });
    
    return true;
  } catch (error) {
    console.error('Navigation error:', error);
    
    // Don't use fallback to prevent potential redirect loops
    console.warn('Navigation fallback disabled to prevent redirect loops');
    return false;
  }
}

export default {
  navigateToAuth
};
