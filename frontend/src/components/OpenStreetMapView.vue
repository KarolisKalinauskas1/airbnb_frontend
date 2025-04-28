<template>
  <div class="map-container h-full">
    <div ref="mapContainer" class="h-full w-full"></div>
    <div v-if="error" class="absolute inset-0 bg-gray-100 flex items-center justify-center">
      <div class="text-center p-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="text-lg font-medium">Map cannot be displayed</p>
        <p class="text-sm text-gray-600">{{ errorMessage }}</p>
      </div>
    </div>
    
    <!-- Spot Info Popup -->
    <div v-if="selectedSpot" class="absolute bottom-4 left-1/2 transform -translate-x-1/2 max-w-md w-full p-4 bg-white rounded-lg shadow-lg z-10">
      <div class="flex">
        <div class="w-1/3">
          <div class="h-24 w-full rounded overflow-hidden">
            <img 
              v-if="selectedSpot.images && selectedSpot.images.length > 0" 
              :src="selectedSpot.images[0].image_url" 
              alt="Spot image" 
              class="h-full w-full object-cover"
            >
            <div v-else class="h-full w-full bg-gray-200 flex items-center justify-center">
              <span class="text-gray-400">No image</span>
            </div>
          </div>
        </div>
        <div class="w-2/3 pl-4">
          <div class="flex justify-between items-start">
            <h3 class="font-medium text-gray-900 line-clamp-1">{{ selectedSpot.title }}</h3>
            <button @click="selectedSpot = null" class="text-gray-400 hover:text-gray-600">
              &times;
            </button>
          </div>
          <div class="text-sm text-gray-600">
            <p>{{ formatLocation(selectedSpot.location) }}</p>
            <p class="mt-1 font-medium">€{{ selectedSpot.price_per_night }} / night</p>
          </div>
          <button 
            @click="$emit('spot-clicked', selectedSpot.camping_spot_id)" 
            class="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { loadLeaflet } from '@/utils/mapUtils';

const props = defineProps({
  spots: {
    type: Array,
    required: true
  },
  center: {
    type: Object,
    default: () => ({ lat: 50.85, lng: 4.35 }) // Default: Brussels
  },
  zoom: {
    type: Number,
    default: 6
  }
});

const emit = defineEmits(['spot-clicked']);

const mapContainer = ref(null);
const map = ref(null);
const markers = ref([]);
const error = ref(false);
const errorMessage = ref('Error loading map');
const selectedSpot = ref(null);

// Format location for display
const formatLocation = (location) => {
  if (!location) return 'Unknown location';
  
  const parts = [];
  if (location.city) parts.push(location.city);
  if (location.country?.name) parts.push(location.country.name);
  
  return parts.join(', ');
};

// Use a donut marker for the map
const createMarkerElement = (spot) => {
  const el = document.createElement('div');
  
  if (spot.price_per_night) {
    // Create price marker
    el.className = 'price-marker';
    el.textContent = `€${Math.round(spot.price_per_night)}`;
  } else {
    // Create donut marker
    el.className = 'marker-donut';
    const inner = document.createElement('div');
    inner.className = 'marker-donut-inner';
    el.appendChild(inner);
  }
  
  return el;
};

// Initialize the map using Leaflet with OpenStreetMap
const initMap = () => {
  try {
    console.log('Initializing map with OpenStreetMap');
    
    // Create the map instance
    map.value = L.map(mapContainer.value).setView(
      [props.center.lat, props.center.lng], 
      props.zoom
    );
    
    // Add the OpenStreetMap tile layer (no API key needed)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map.value);
    
    // Add zoom control
    L.control.zoom({ position: 'topright' }).addTo(map.value);
    
    // Add markers
    addMarkers();
    
    console.log('Map initialized with OpenStreetMap tiles');
    
  } catch (err) {
    console.error('Error initializing map:', err);
    error.value = true;
    errorMessage.value = 'Failed to initialize map: ' + err.message;
  }
};

// Add markers for all spots
const addMarkers = () => {
  // Clear existing markers
  clearMarkers();
  
  if (!map.value || !props.spots || !props.spots.length) return;
  
  const newMarkers = [];
  const bounds = L.latLngBounds();
  let hasValidCoordinates = false;
  
  props.spots.forEach((spot) => {
    const location = spot.location;
    
    if (!location || !location.latitute || !location.longtitute) return;
    
    const lat = parseFloat(location.latitute);
    const lng = parseFloat(location.longtitute);
    
    if (isNaN(lat) || isNaN(lng)) return;
    
    hasValidCoordinates = true;
    
    // Create a more visible custom icon for the marker
    const markerHtml = createMarkerElement(spot).outerHTML;
    const icon = L.divIcon({
      className: 'custom-map-marker',
      html: markerHtml,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    
    // Create marker
    const marker = L.marker([lat, lng], { icon }).addTo(map.value);
    
    // Add click event
    marker.on('click', () => {
      selectedSpot.value = spot;
    });
    
    newMarkers.push(marker);
    bounds.extend([lat, lng]);
  });
  
  markers.value = newMarkers;
  
  // If we have any valid coordinates, fit the map to those bounds
  if (hasValidCoordinates && markers.value.length > 0) {
    map.value.fitBounds(bounds, { 
      padding: [50, 50],
      maxZoom: 15 // Don't zoom in too far
    });
  }
};

// Clear all markers from the map
const clearMarkers = () => {
  if (!map.value) return;
  
  markers.value.forEach(marker => {
    map.value.removeLayer(marker);
  });
  
  markers.value = [];
};

// Watch for changes in spots to update markers
watch(() => props.spots, (newSpots) => {
  if (map.value && newSpots) {
    addMarkers();
  }
}, { deep: true });

// Watch for changes in center or zoom to update map
watch([() => props.center, () => props.zoom], ([newCenter, newZoom], [oldCenter, oldZoom]) => {
  if (!map.value) return;
  
  // Only update if values actually changed
  if (newCenter && (!oldCenter || 
      newCenter.lat !== oldCenter.lat || 
      newCenter.lng !== oldCenter.lng)) {
    map.value.setView([newCenter.lat, newCenter.lng], map.value.getZoom());
  }
  
  if (newZoom && newZoom !== oldZoom) {
    map.value.setZoom(newZoom);
  }
}, { deep: true });

// Initialize map on component mount
onMounted(async () => {
  try {
    await loadLeaflet();
    initMap();
  } catch (err) {
    console.error('Failed to load map library:', err);
    error.value = true;
    errorMessage.value = 'Failed to load map. Please check your internet connection.';
  }
});

// Clean up on component unmount
onUnmounted(() => {
  // Clean up marker references
  clearMarkers();
  
  // Clean up map instance
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
});
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.marker-price-tag {
  background-color: #e11d48;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  border: 2px solid white;
}

/* Restore donut markers */
.marker-donut {
  width: 24px;
  height: 24px;
  background-color: rgba(225, 29, 72, 0.2);
  border: 2px solid #e11d48;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.marker-donut-inner {
  width: 10px;
  height: 10px;
  background-color: white;
  border-radius: 50%;
  border: 1px solid #e11d48;
}

.price-marker {
  background-color: #e11d48;
  color: white;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  font-size: 11px;
  border: 2px solid white;
}

/* Remove the default Leaflet shadow under the marker */
:deep(.leaflet-marker-shadow) {
  display: none;
}

/* Make the markers look nice */
:deep(.custom-map-marker) {
  background: none;
  border: none;
  contain: none;
}

/* Fix popup styles */
:deep(.leaflet-popup-content-wrapper) {
  border-radius: 8px;
  box-shadow: 0 3px 14px rgba(0,0,0,0.3);
}

:deep(.leaflet-popup-content) {
  margin: 8px 12px;
  line-height: 1.4;
}

/* Ensure map is positioned with very low z-index */
.leaflet-container {
  cursor: grab !important;
  z-index: 1 !important; 
}

/* Additional z-index fixes for map layers to be below other UI components */
.leaflet-map-pane {
  z-index: 2 !important;
}

.leaflet-tile-pane {
  z-index: 1 !important;
}

.leaflet-overlay-pane {
  z-index: 3 !important;
}

.leaflet-marker-pane {
  z-index: 4 !important;
}

.leaflet-popup-pane {
  z-index: 5 !important;
}

.leaflet-control {
  z-index: 6 !important;
}

/* Create global stack contexts */
main, body, #app {
  isolation: isolate;
}

.map-container {
  isolation: isolate;
  z-index: 1;
}
</style>
