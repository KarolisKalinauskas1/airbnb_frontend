/**
 * Map utility functions
 */

/**
 * Calculate the distance between two coordinates in kilometers
 * @param {Number} lat1 - Latitude of first point
 * @param {Number} lon1 - Longitude of first point
 * @param {Number} lat2 - Latitude of second point
 * @param {Number} lon2 - Longitude of second point
 * @returns {Number} - Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Convert degrees to radians
 * @param {Number} value - Value in degrees
 * @returns {Number} - Value in radians
 */
function toRad(value) {
  return value * Math.PI / 180;
}

/**
 * Get the center point of multiple coordinates
 * @param {Array} coordinates - Array of {lat, lng} objects
 * @returns {Object} - Center point {lat, lng}
 */
export function getCenter(coordinates) {
  if (!coordinates || coordinates.length === 0) {
    return { lat: 51.505, lng: -0.09 }; // Default center (London)
  }
  
  let sumLat = 0;
  let sumLng = 0;
  
  coordinates.forEach(coord => {
    sumLat += parseFloat(coord.lat);
    sumLng += parseFloat(coord.lng);
  });
  
  return {
    lat: sumLat / coordinates.length,
    lng: sumLng / coordinates.length
  };
}

/**
 * Check if the geolocation API is available in the browser
 * @returns {Boolean} - true if geolocation is available
 */
export function isGeolocationAvailable() {
  return 'geolocation' in navigator;
}

/**
 * Get the user's current location
 * @returns {Promise} - Promise that resolves to {lat, lng} object
 */
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!isGeolocationAvailable()) {
      reject(new Error('Geolocation is not available in your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      error => {
        reject(error);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}

/**
 * Get the Geoapify API key
 * @returns {string|null} The API key or null if invalid
 */
export function getGeoapifyApiKey() {
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
  
  // Check if the key exists and is not a placeholder
  if (!apiKey || 
      apiKey === 'your_real_api_key_here' || 
      apiKey === 'YOUR_ACTUAL_GEOAPIFY_API_KEY' || 
      apiKey === 'your-geoapify-api-key-here') {
    console.error('Missing or invalid VITE_GEOAPIFY_API_KEY in environment variables');
    return null;
  }
  
  return apiKey;
}

/**
 * Always use OpenStreetMap as fallback
 * This resolves any API key issues by using a free service
 */
export const USE_FALLBACK_MAP = true;

/**
 * Load Leaflet library for OpenStreetMap
 * @returns {Promise<void>} Resolves when loaded
 */
export function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve();
      return;
    }
    
    // Load CSS
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(cssLink);
    
    // Load JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    
    script.onload = () => {
      console.log('Leaflet loaded successfully');
      resolve();
    };
    
    script.onerror = (e) => {
      console.error('Failed to load Leaflet script:', e);
      reject(new Error('Failed to load Leaflet library'));
    };
    
    document.head.appendChild(script);
  });
}

/**
 * Create a map style URL for Geoapify
 * @param {string} style - The map style to use (default: osm-carto)
 * @returns {string|null} The complete style URL with API key or null if key invalid
 */
export function createMapStyleUrl(style = 'osm-carto') {
  const apiKey = getGeoapifyApiKey();
  if (!apiKey) return null;
  return `https://maps.geoapify.com/v1/styles/${style}/style.json?apiKey=${apiKey}`;
}

/**
 * Create a tile URL for Geoapify
 * @param {string} style - The map style to use (default: osm-bright)
 * @returns {string|null} The complete tile URL template or null if key invalid
 */
export function createTileUrl(style = 'osm-bright') {
  const apiKey = getGeoapifyApiKey();
  if (!apiKey) return null;
  return `https://maps.geoapify.com/v1/tile/${style}/{z}/{x}/{y}.png?apiKey=${apiKey}`;
}

/**
 * Load MapLibre GL library dynamically
 * @returns {Promise} Resolves when the library is loaded
 */
export function loadMapLibreGL() {
  return new Promise((resolve, reject) => {
    if (window.maplibregl) {
      console.log('MapLibre already loaded');
      resolve(window.maplibregl);
      return;
    }
    
    console.log('Loading MapLibre from CDN...');
    
    // Load CSS
    const mapStyles = document.createElement('link');
    mapStyles.rel = 'stylesheet';
    mapStyles.href = 'https://cdn.jsdelivr.net/npm/maplibre-gl@3.3.1/dist/maplibre-gl.css';
    document.head.appendChild(mapStyles);
    
    // Load JS
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/maplibre-gl@3.3.1/dist/maplibre-gl.js';
    script.defer = true;
    script.async = true;
    
    script.onload = () => {
      console.log('MapLibre loaded successfully');
      resolve(window.maplibregl);
    };
    
    script.onerror = (e) => {
      console.error('Failed to load MapLibre script:', e);
      reject(new Error('Failed to load MapLibre GL JS'));
    };
    
    document.head.appendChild(script);
  });
}

/**
 * Validates if the Geoapify API key is working by making a test request
 * @returns {Promise<boolean>} True if the API key is valid
 */
export async function validateGeoapifyApiKey() {
  const apiKey = getGeoapifyApiKey();
  if (!apiKey) return false;
  
  try {
    // Make a simple request to validate the key
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/reverse?lat=51.5&lon=0&apiKey=${apiKey}`
    );
    const data = await response.json();
    
    // Check if we got an unauthorized error
    if (data.statusCode === 401 || data.error === 'Unauthorized') {
      console.error('Geoapify API key is invalid:', data.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to validate Geoapify API key:', error);
    return false;
  }
}
