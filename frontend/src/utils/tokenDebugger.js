/**
 * Token debugging utilities
 */
import { supabase } from '@/lib/supabase';
import axios from '@/axios';

/**
 * Decode and analyze JWT token
 * @param {string} token - JWT token to analyze
 * @returns {Object} Token information
 */
export function decodeToken(token) {
  if (!token) return { valid: false, error: 'No token provided' };
  
  try {
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Token is not in valid JWT format' };
    }
    
    // Decode the payload
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const payload = JSON.parse(jsonPayload);
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    const expired = payload.exp && payload.exp < now;
    const expiresInMinutes = payload.exp ? Math.round((payload.exp - now) / 60) : 'unknown';
    
    return {
      valid: !expired,
      expired,
      expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'unknown',
      expiresInMinutes,
      payload,
      userId: payload.sub,
      email: payload.email
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return { valid: false, error: `Failed to decode token: ${error.message}` };
  }
}

/**
 * Test token against different API endpoints
 * @param {string} token - JWT token to test
 * @returns {Promise<Object>} Test results
 */
export async function testToken(token) {
  if (!token) return { valid: false, error: 'No token provided' };
  
  const results = {
    decodeResult: decodeToken(token),
    apiTests: {}
  };
  
  // Test endpoints
  const endpoints = [
    '/api/users/basic-info',
    '/users/basic-info',
    '/api/users/full-info',
    '/users/full-info'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const startTime = performance.now();
      const response = await axios.get(`${endpoint}?_t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const endTime = performance.now();
      
      results.apiTests[endpoint] = {
        success: true,
        status: response.status,
        responseTime: Math.round(endTime - startTime),
        hasData: !!response.data
      };
    } catch (error) {
      results.apiTests[endpoint] = {
        success: false,
        status: error.response?.status,
        error: error.message,
        details: error.response?.data
      };
    }
  }
  
  // Test Supabase auth
  try {
    const { data, error } = await supabase.auth.getUser(token);
    results.supabaseTest = {
      success: !error && !!data?.user,
      error: error?.message,
      user: data?.user ? {
        id: data.user.id,
        email: data.user.email
      } : null
    };
  } catch (error) {
    results.supabaseTest = {
      success: false,
      error: error.message
    };
  }
  
  return results;
}

/**
 * Run a full authentication diagnostic
 */
export async function runAuthDiagnostic() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    browser: navigator.userAgent,
    localStorage: {},
    sessionData: null,
    tokenAnalysis: null
  };
  
  // Check localStorage
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('userData');
  const lastFetchTime = localStorage.getItem('last_user_fetch_time');
  
  diagnostics.localStorage = {
    hasToken: !!token,
    hasUserData: !!userData,
    hasLastFetchTime: !!lastFetchTime,
    lastFetchAge: lastFetchTime ? `${Math.round((Date.now() - parseInt(lastFetchTime)) / 1000 / 60)} minutes ago` : 'N/A'
  };
  
  // If we have userData, add some key info without exposing sensitive data
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      diagnostics.userDataSummary = {
        email: parsed.email ? '✓ Present' : '✗ Missing',
        isowner: parsed.isowner !== undefined ? parsed.isowner : 'Missing'
      };
    } catch (e) {
      diagnostics.userDataSummary = { parseError: e.message };
    }
  }
  
  // Check Supabase session
  try {
    const { data } = await supabase.auth.getSession();
    diagnostics.sessionData = {
      hasSession: !!data.session,
      isExpired: data.session ? new Date(data.session.expires_at * 1000) < new Date() : null,
      expiresAt: data.session ? new Date(data.session.expires_at * 1000).toISOString() : null
    };
  } catch (e) {
    diagnostics.sessionData = { error: e.message };
  }
  
  // Analyze token if available
  if (token) {
    diagnostics.tokenAnalysis = decodeToken(token);
    
    // If token is expired or invalid, try refreshing
    if (!diagnostics.tokenAnalysis.valid) {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        diagnostics.refreshAttempt = {
          success: !error && !!data.session,
          newToken: data.session ? '✓ Generated' : '✗ Failed',
          error: error?.message
        };
      } catch (e) {
        diagnostics.refreshAttempt = { error: e.message };
      }
    }
  }
  
  return diagnostics;
}
