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
const markerCluster = ref(null);
let mapScript = null;

// Format location for display
const formatLocation = (location) => {
  if (!location) return 'Unknown location';
  
  const parts = [];
  if (location.city) parts.push(location.city);
  if (location.country?.name) parts.push(location.country.name);
  
  return parts.join(', ');
};

// Initialize the map using Geoapify
const initMap = () => {
  try {
    // Fix: Use GEOAPIFY instead of GEOPIFY to match your .env file
    const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
    
    if (!apiKey) {
      error.value = true;
      errorMessage.value = 'Geoapify API key is missing';
      console.error('Missing VITE_GEOAPIFY_API_KEY in environment variables');
      return;
    }

    // Create a map instance
    const mapOptions = {
      container: mapContainer.value,
      style: 'https://maps.geoapify.com/v1/styles/osm-carto/style.json?apiKey=' + apiKey,
      center: [props.center.lng, props.center.lat], // Geoapify uses [lng, lat] format
      zoom: props.zoom
    };
    
    // Initialize map
    map.value = new maplibregl.Map(mapOptions);
    
    // Add navigation controls
    map.value.addControl(new maplibregl.NavigationControl());
    
    // Add markers when map is loaded
    map.value.on('load', () => {
      addMarkers();
    });
    
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
  
  if (!props.spots || !props.spots.length) return;
  
  const newMarkers = [];
  const bounds = new maplibregl.LngLatBounds();
  let hasValidCoordinates = false;
  
  props.spots.forEach((spot) => {
    const location = spot.location;
    
    if (!location || !location.latitute || !location.longtitute) return;
    
    const lat = parseFloat(location.latitute);
    const lng = parseFloat(location.longtitute);
    
    if (isNaN(lat) || isNaN(lng)) return;
    
    hasValidCoordinates = true;
    
    // Create marker element
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.backgroundColor = '#e11d48';
    el.style.width = '30px';
    el.style.height = '30px';
    el.style.borderRadius = '50%';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.color = 'white';
    el.style.fontWeight = 'bold';
    el.style.fontSize = '11px';
    el.innerHTML = `€${Math.round(spot.price_per_night)}`;
    
    // Create marker
    const marker = new maplibregl.Marker(el)
      .setLngLat([lng, lat]) // Geoapify uses [lng, lat]
      .addTo(map.value);
    
    // Add click event
    marker.getElement().addEventListener('click', () => {
      selectedSpot.value = spot;
    });
    
    newMarkers.push(marker);
    bounds.extend([lng, lat]);
  });
  
  markers.value = newMarkers;
  
  // If we have any valid coordinates, fit the map to those bounds
  if (hasValidCoordinates && markers.value.length > 0) {
    map.value.fitBounds(bounds, { 
      padding: 50,
      maxZoom: 15 // Don't zoom in too far
    });
  }
};

// Clear all markers from the map
const clearMarkers = () => {
  markers.value.forEach(marker => {
    marker.remove();
  });
  
  markers.value = [];
};

// Load MapLibre GL JS (open-source fork that works with Geoapify)
const loadMapLibrary = () => {
  return new Promise((resolve, reject) => {
    if (window.maplibregl) {
      resolve();
      return;
    }
    
    // Load CSS
    const mapStyles = document.createElement('link');
    mapStyles.rel = 'stylesheet';
    mapStyles.href = 'https://unpkg.com/maplibre-gl@2.4.0/dist/maplibre-gl.css';
    document.head.appendChild(mapStyles);
    
    // Load JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/maplibre-gl@2.4.0/dist/maplibre-gl.js';
    script.defer = true;
    script.async = true;
    
    script.onload = () => {
      resolve();
    };
    
    script.onerror = () => {
      error.value = true;
      errorMessage.value = 'Failed to load map library';
      reject(new Error('Failed to load MapLibre GL JS'));
    };
    
    document.head.appendChild(script);
    mapScript = script;
  });
};

// Watch for changes in spots to update markers
watch(() => props.spots, (newSpots) => {
  if (map.value && newSpots) {
    addMarkers();
  }
}, { deep: true });

// Watch for changes in center or zoom to update map
watch([() => props.center, () => props.zoom], ([newCenter, newZoom]) => {
  if (!map.value) return;
  
  if (newCenter) {
    map.value.setCenter([newCenter.lng, newCenter.lat]); // Geoapify uses [lng, lat]
  }
  
  if (newZoom) {
    map.value.setZoom(newZoom);
  }
});

// Initialize map on component mount
onMounted(async () => {
  try {
    await loadMapLibrary();
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

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.custom-marker {
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.custom-marker:hover {
  transform: scale(1.1);
}
</style>
