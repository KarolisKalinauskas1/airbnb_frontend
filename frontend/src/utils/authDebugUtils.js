import { supabase } from '@/lib/supabase';
import axios from '@/axios';
import { useAuthStore } from '@/stores/auth';

/**
 * Get JWT token from various possible storage locations
 * @returns {string|null} The token if found, null otherwise
 */
export function findStoredToken() {
  // Places to check for tokens
  const locations = [
    // Local storage
    { type: 'localStorage', key: 'token' },
    { type: 'localStorage', key: 'supabase.auth.token' },
    // Session storage
    { type: 'sessionStorage', key: 'token' },
    { type: 'sessionStorage', key: 'supabase.auth.token' },
  ];
  
  const tokens = {};
  
  // Check each location
  for (const loc of locations) {
    try {
      let value = null;
      
      if (loc.type === 'localStorage') {
        value = localStorage.getItem(loc.key);
      } else if (loc.type === 'sessionStorage') {
        value = sessionStorage.getItem(loc.key);
      }
      
      if (value) {
        try {
          // Handle stringified JSON objects
          const parsed = JSON.parse(value);
          if (parsed.access_token) {
            tokens[`${loc.type}.${loc.key}`] = parsed.access_token;
          } else {
            tokens[`${loc.type}.${loc.key}`] = value;
          }
        } catch (e) {
          // Not JSON, store as is
          tokens[`${loc.type}.${loc.key}`] = value;
        }
      }
    } catch (e) {
      console.error(`Error checking ${loc.type}.${loc.key}:`, e);
    }
  }
  
  return tokens;
}

/**
 * Log detailed session diagnostic info
 */
export async function logSessionDiagnostics() {
  console.log('============= AUTH DIAGNOSTICS =============');
  
  // Check Supabase session
  console.log('Checking Supabase session...');
  const { data: { session } } = await supabase.auth.getSession();
  
  console.log('Supabase session exists:', !!session);
  if (session) {
    console.log('Session user ID:', session.user?.id);
    console.log('Session expires at:', new Date(session.expires_at * 1000).toLocaleString());
    console.log('Session expired:', new Date(session.expires_at * 1000) < new Date() ? 'Yes' : 'No');
  }
  
  // Check Pinia store
  const authStore = useAuthStore();
  console.log('\nChecking auth store state:');
  console.log('isLoggedIn:', authStore.isLoggedIn);
  console.log('isInitialized:', authStore.isInitialized);
  console.log('token exists:', !!authStore.token);
  console.log('user exists:', !!authStore.user);
  console.log('fullUser exists:', !!authStore.fullUser);
  
  if (authStore.fullUser) {
    console.log('User ID:', authStore.fullUser.user_id);
    console.log('Is owner:', authStore.fullUser.isowner === 1 ? 'Yes' : 'No');
  }
  
  // Check stored tokens
  console.log('\nChecking stored tokens:');
  const tokens = findStoredToken();
  console.log(tokens);
  
  // Check localStorage for user data
  console.log('\nChecking localStorage for user data:');
  const userData = localStorage.getItem('userData');
  console.log('userData exists:', !!userData);
  
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      console.log('User ID from localStorage:', parsed.user_id);
    } catch (e) {
      console.log('Error parsing userData:', e.message);
    }
  }
  
  console.log('\nChecking localStorage timestamp:');
  const lastFetch = localStorage.getItem('last_user_fetch_time');
  if (lastFetch) {
    const fetchTime = new Date(parseInt(lastFetch));
    console.log('Last user data fetch:', fetchTime.toLocaleString());
    const ageInMinutes = (Date.now() - parseInt(lastFetch)) / (1000 * 60);
    console.log('Data age (minutes):', ageInMinutes.toFixed(1));
  } else {
    console.log('No fetch timestamp found');
  }
  
  console.log('============= END DIAGNOSTICS =============');
}

/**
 * Try to fix common authentication issues
 * @returns {Promise<boolean>} True if fixed successfully
 */
export async function fixAuthState() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('No active session found');
      return false;
    }

    try {
      const response = await axios.get('/api/users/full-info', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.data) {
        localStorage.setItem('userData', JSON.stringify(response.data));
        localStorage.setItem('last_user_fetch_time', Date.now().toString());
        return true;
      }
    } catch (error) {
      console.error('Error in fixAuthState:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
      }
      return false;
    }
  } catch (error) {
    console.error('Error in fixAuthState:', error);
    return false;
  }
}

/**
 * Check token validity
 * @param {string} token - The JWT token to check
 * @returns {object} Information about the token
 */
export function analyzeToken(token) {
  if (!token) return { valid: false, reason: 'No token provided' };
  
  try {
    // Decode token without verification
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, reason: 'Invalid JWT format' };
    
    // Decode payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    const expiresAt = new Date(payload.exp * 1000);
    const now = new Date();
    const isExpired = expiresAt < now;
    const expiresInMinutes = (expiresAt - now) / (1000 * 60);
    
    return {
      valid: !isExpired,
      reason: isExpired ? 'Token expired' : 'Token valid',
      expiresAt,
      expiresInMinutes: expiresInMinutes.toFixed(1),
      subject: payload.sub,
      email: payload.email
    };
    
  } catch (error) {
    return { valid: false, reason: `Invalid token: ${error.message}` };
  }
}

export default {
  findStoredToken,
  logSessionDiagnostics,
  fixAuthState,
  analyzeToken
};
