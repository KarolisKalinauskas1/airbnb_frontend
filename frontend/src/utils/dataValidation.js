/**
 * Utility functions for validating and cleaning data
 */

/**
 * Checks if a spot object contains all required data
 * @param {Object} spot - The camping spot object to validate
 * @returns {Boolean} - True if the spot has all required fields
 */
export function isValidSpot(spot) {
  return (
    spot &&
    typeof spot === 'object' &&
    spot.camping_spot_id &&
    spot.title &&
    spot.price_per_night
  );
}

/**
 * Filter an array of spots to only include valid spots
 * @param {Array|Object} data - Array of spot objects or response data
 * @returns {Array} - Filtered array of valid spots
 */
export function processApiResponseData(data) {
  // Handle null/undefined data
  if (!data) return [];
  
  // If it's an array, filter it
  if (Array.isArray(data)) {
    return data.filter(spot => isValidSpot(spot));
  }
  
  // If it's an object that might contain an array in a 'data' property
  if (typeof data === 'object') {
    if (Array.isArray(data.data)) {
      return data.data.filter(spot => isValidSpot(spot));
    }
    
    // If it's a single spot object
    if (isValidSpot(data)) {
      return [data];
    }
  }
  
  // Default fallback
  console.warn('Could not process API data:', data);
  return [];
}
