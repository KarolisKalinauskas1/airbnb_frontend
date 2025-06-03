/**
 * Token validation utilities
 */

/**
 * Validate JWT token format
 * @param {string} token The token to validate
 * @returns {boolean} True if token format is valid
 */
export function isValidTokenFormat(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // JWT should have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  // Each part should be base64 encoded
  try {
    parts.forEach(part => {
      // Add padding if needed
      const padding = '='.repeat((4 - (part.length % 4)) % 4);
      const padded = (part + padding).replace(/-/g, '+').replace(/_/g, '/');
      Buffer.from(padded, 'base64');
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract token from different storage formats
 * @param {string|object} value The value to extract token from
 * @returns {string|null} The extracted token or null if invalid
 */
export function extractToken(value) {
  if (!value) {
    return null;
  }

  // If it's a string and looks like a token, return it
  if (typeof value === 'string') {
    if (value.startsWith('Bearer ')) {
      value = value.substring(7);
    }
    return isValidTokenFormat(value) ? value : null;
  }

  // Try to parse JSON
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  }

  // Handle common token storage formats
  if (parsed.access_token && isValidTokenFormat(parsed.access_token)) {
    return parsed.access_token;
  }
  if (parsed.token && isValidTokenFormat(parsed.token)) {
    return parsed.token;
  }
  if (parsed.currentSession?.access_token && isValidTokenFormat(parsed.currentSession.access_token)) {
    return parsed.currentSession.access_token;
  }

  return null;
}
