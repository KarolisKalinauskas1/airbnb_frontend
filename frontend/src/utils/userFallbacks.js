/**
 * Fallback functions for handling user data issues
 */
import { supabase } from '@/lib/supabase';

/**
 * Get basic user data directly from Supabase when backend API fails
 * @returns {Promise<Object|null>} User data or null if not available
 */
export async function getBasicUserDataFromSupabase() {
  try {
    // Get the current session from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn('No active Supabase session');
      return null;
    }
    
    const user = session.user;
    
    // Return basic user data extracted from Supabase user
    const isOwner = user.user_metadata?.isowner || 0;
    
    // Ensure isowner is a number
    const numIsOwner = typeof isOwner === 'string' 
      ? parseInt(isOwner) 
      : (isOwner === true ? 1 : isOwner === false ? 0 : isOwner);
    
    return {
      user_id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email.split('@')[0],
      isowner: numIsOwner,
      bookings: [] // No bookings in this fallback data
    };
  } catch (error) {
    console.error('Error getting user data from Supabase:', error);
    return null;
  }
}

/**
 * Check if cached user data is valid and not too old
 * @returns {Object|null} User data or null if not valid
 */
export function getValidCachedUserData() {
  try {
    const userData = localStorage.getItem('userData');
    const lastFetchTime = localStorage.getItem('last_user_fetch_time');
    
    if (!userData || !lastFetchTime) return null;
    
    // Check if data is less than 24 hours old
    const age = Date.now() - parseInt(lastFetchTime);
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
    
    if (age > MAX_AGE) {
      console.warn('Cached user data is too old:', Math.floor(age / (60 * 60 * 1000)) + ' hours');
      return null;
    }
    
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error reading cached user data:', error);
    return null;
  }
}
