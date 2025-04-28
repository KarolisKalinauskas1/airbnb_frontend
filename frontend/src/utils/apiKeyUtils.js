/**
 * Utility functions for API key management
 */

/**
 * Get the Geoapify API key with fallback options
 * @param {boolean} showWarnings - Whether to show console warnings for missing keys
 * @returns {string} - The API key or empty string if not available
 */
export function getGeoapifyApiKey(showWarnings = true) {
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
  
  // Check if the key exists and is not the placeholder
  if (!apiKey || apiKey === 'YOUR_ACTUAL_GEOAPIFY_API_KEY' || apiKey === 'your-geoapify-api-key-here') {
    if (showWarnings) {
      console.warn('Missing or invalid Geoapify API key. Maps will not work correctly.');
      console.warn('Please add a valid VITE_GEOAPIFY_API_KEY to your .env file.');
    }
    return '';
  }
  
  return apiKey;
}

/**
 * Check if an API key is valid (not empty or placeholder)
 * @param {string} key - The API key to check
 * @param {Array<string>} placeholders - Array of known placeholders to check against
 * @returns {boolean} - True if the key appears valid
 */
export function isValidApiKey(key, placeholders = ['YOUR_API_KEY', 'your-api-key-here']) {
  if (!key || typeof key !== 'string' || key.trim() === '') {
    return false;
  }
  
  // Check if the key matches any known placeholders
  return !placeholders.some(placeholder => 
    key.includes(placeholder) || key.toLowerCase().includes(placeholder.toLowerCase())
  );
}
