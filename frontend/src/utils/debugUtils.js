/**
 * Map debugging utilities
 */

/**
 * Log debug information about the map state
 * @param {Object} map - The Leaflet map instance
 * @param {String} message - Optional message to include
 */
export function logMapDebug(map, message = 'Map debug info') {
  if (!map) {
    console.log('Map debug: Map instance is null or undefined');
    return;
  }
  
  try {
    const center = map.getCenter();
    const zoom = map.getZoom();
    const bounds = map.getBounds();
    const size = map.getSize();
    
    console.group(`${message} [${new Date().toLocaleTimeString()}]`);
    console.log('Center:', center);
    console.log('Zoom:', zoom);
    console.log('Bounds:', bounds);
    console.log('Size:', size);
    console.log('Dragging enabled:', map.dragging && map.dragging.enabled());
    console.groupEnd();
  } catch (error) {
    console.warn('Error logging map debug info:', error);
  }
}

/**
 * Validate map data to ensure it's properly structured
 * @param {Object} data - The map data to validate
 * @returns {Boolean} - Whether the data is valid
 */
export function validateMapData(data) {
  if (!data) {
    console.warn('Map data validation failed: data is null or undefined');
    return false;
  }
  
  // Check required properties
  const requiredProps = ['center', 'zoom', 'spots'];
  const missingProps = requiredProps.filter(prop => !data[prop]);
  
  if (missingProps.length > 0) {
    console.warn(`Map data validation failed: missing properties: ${missingProps.join(', ')}`);
    return false;
  }
  
  // Validate center coordinates
  if (!data.center.lat || !data.center.lng || 
      isNaN(data.center.lat) || isNaN(data.center.lng)) {
    console.warn('Map data validation failed: invalid center coordinates');
    return false;
  }
  
  // Validate zoom
  if (isNaN(data.zoom) || data.zoom < 0 || data.zoom > 20) {
    console.warn('Map data validation failed: invalid zoom level');
    return false;
  }
  
  return true;
}
