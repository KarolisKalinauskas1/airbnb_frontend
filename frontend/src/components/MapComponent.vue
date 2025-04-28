<template>
  <div ref="mapContainer" class="h-full w-full rounded-lg"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  spots: {
    type: Array,
    required: true
  },
  selectedLocation: {
    type: Object,
    default: null
  },
  searchRadius: {
    type: Number,
    default: 50
  }
});

const emit = defineEmits(['spot-selected']);

const mapContainer = ref(null);
let map = null;
let markers = [];
// Get API key directly - make sure it's a literal value not a variable reference
const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;

// Initialize map on component mount
onMounted(() => {
  console.log('Map component mounted, API key exists:', !!apiKey);
  initializeMap();
});

// Clean up on component unmount
onUnmounted(() => {
  if (map) {
    map.remove();
  }
});

// Watch for changes in spots data
watch(() => props.spots, (newSpots) => {
  updateMarkers();
}, { deep: true });

// Watch for changes in the selected location
watch(() => props.selectedLocation, (newLocation) => {
  if (newLocation && map) {
    centerMapOnLocation(newLocation.lat, newLocation.lon);
    
    // If a search radius is specified, display it
    if (props.searchRadius) {
      drawSearchRadiusCircle(newLocation.lat, newLocation.lon, props.searchRadius);
    }
  }
}, { deep: true });

// Initialize the map
const initializeMap = () => {
  if (!mapContainer.value) return;
  
  // Make sure the Leaflet script is loaded
  if (!window.L) {
    loadLeafletScripts().then(() => {
      createMap();
    });
  } else {
    createMap();
  }
};

// Load the required scripts for Leaflet
const loadLeafletScripts = () => {
  return new Promise((resolve) => {
    console.log('Loading Leaflet scripts...');
    
    // Load Leaflet CSS
    const leafletCss = document.createElement('link');
    leafletCss.rel = 'stylesheet';
    leafletCss.href = 'https://unpkg.com/leaflet@1.9.3/dist/leaflet.css';
    document.head.appendChild(leafletCss);
    
    // Load Leaflet JS
    const leafletScript = document.createElement('script');
    leafletScript.src = 'https://unpkg.com/leaflet@1.9.3/dist/leaflet.js';
    document.head.appendChild(leafletScript);
    
    leafletScript.onload = () => {
      console.log('Leaflet scripts loaded successfully');
      resolve();
    };
    
    leafletScript.onerror = (error) => {
      console.error('Failed to load Leaflet script:', error);
    };
  });
};

// Create the map
const createMap = () => {
  console.log('Creating map with API key available:', !!apiKey);
  
  // If map already exists, remove it before creating a new one
  if (map) {
    map.remove();
  }
  
  try {
    // Initialize the map at a default location (will be adjusted later)
    map = L.map(mapContainer.value, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([51.505, -0.09], 13);
    
    // FIXED: Use a string literal for the URL with the API key directly embedded
    // This is the key fix - we're not using template variables inside the URL
    const tileUrl = `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${apiKey}`;
    console.log('Using tile URL:', tileUrl.replace(apiKey, '****'));
    
    // Add the tile layer with the properly formed URL
    L.tileLayer(tileUrl, {
      attribution: 'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | © OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);
    
    console.log('Map initialized successfully');
    
    // Add markers for camping spots
    updateMarkers();
    
    // Handle view adjustments
    if (props.selectedLocation) {
      centerMapOnLocation(props.selectedLocation.lat, props.selectedLocation.lon);
      
      if (props.searchRadius) {
        drawSearchRadiusCircle(props.selectedLocation.lat, props.selectedLocation.lon, props.searchRadius);
      }
    } else if (props.spots && props.spots.length > 0) {
      // If no selected location but spots are available, fit map bounds to include all spots
      fitMapToMarkers();
    }
  } catch (error) {
    console.error('Error creating map:', error);
  }
};

// Update markers on the map
const updateMarkers = () => {
  if (!map) return;
  
  // Clear existing markers
  markers.forEach(marker => {
    map.removeLayer(marker);
  });
  markers = [];
  
  console.log(`Adding ${props.spots.length} markers to the map`);
  
  // Add new markers
  props.spots.forEach(spot => {
    if (spot.location && spot.location.latitute && spot.location.longtitute) {
      const lat = parseFloat(spot.location.latitute);
      const lng = parseFloat(spot.location.longtitute);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        // Create icon for the marker
        const markerIcon = L.divIcon({
          html: `<div class="custom-marker">€${spot.price_per_night}</div>`,
          className: 'custom-marker-container',
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        });
        
        const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(map);
        
        // Create popup content
        const popupContent = document.createElement('div');
        popupContent.className = 'spot-popup';
        
        // Add image if available
        if (spot.images && spot.images.length > 0) {
          const imgContainer = document.createElement('div');
          imgContainer.className = 'popup-img-container';
          const img = document.createElement('img');
          img.src = spot.images[0].image_url.split('#')[0];
          img.alt = spot.title;
          img.className = 'rounded-t-lg w-full h-24 object-cover';
          imgContainer.appendChild(img);
          popupContent.appendChild(imgContainer);
        }
        
        // Add spot details
        const details = document.createElement('div');
        details.className = 'p-2';
        
        const title = document.createElement('h3');
        title.textContent = spot.title;
        title.className = 'font-bold text-sm';
        details.appendChild(title);
        
        const price = document.createElement('p');
        price.textContent = `€${spot.price_per_night} per night`;
        price.className = 'text-sm';
        details.appendChild(price);
        
        const viewButton = document.createElement('button');
        viewButton.textContent = 'View Spot';
        viewButton.className = 'mt-2 px-3 py-1 bg-red-600 text-white rounded text-xs';
        viewButton.onclick = () => emit('spot-selected', spot.camping_spot_id);
        details.appendChild(viewButton);
        
        popupContent.appendChild(details);
        
        marker.bindPopup(popupContent);
        markers.push(marker);
      }
    }
  });
  
  // If markers were added and no selected location, fit map bounds to include all markers
  if (markers.length > 0 && !props.selectedLocation) {
    fitMapToMarkers();
  }
};

// Center the map on a specific location
const centerMapOnLocation = (lat, lng) => {
  if (map && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
    map.setView([parseFloat(lat), parseFloat(lng)], 11);
  }
};

// Fit the map bounds to include all markers
const fitMapToMarkers = () => {
  if (map && markers.length > 0) {
    try {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds(), { padding: [50, 50] });
    } catch (error) {
      console.error('Error fitting map to markers:', error);
    }
  }
};

// Draw a circle representing the search radius
let radiusCircle = null;
const drawSearchRadiusCircle = (lat, lng, radius) => {
  if (map) {
    // Remove existing circle if any
    if (radiusCircle) {
      map.removeLayer(radiusCircle);
    }
    
    // Create new circle
    radiusCircle = L.circle([parseFloat(lat), parseFloat(lng)], {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.1,
      radius: radius * 1000 // Convert km to meters
    }).addTo(map);
  }
};
</script>

<style>
.custom-marker-container {
  background: none;
  border: none;
}

.custom-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #EF4444;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 3px 6px rgba(0,0,0,0.3);
}

.spot-popup {
  width: 200px;
}

.popup-img-container {
  width: 100%;
  height: 100px;
  overflow: hidden;
}
</style>
