<template>
  <div class="map-container">
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
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  spotTitle: {
    type: String,
    default: 'Camping Spot'
  }
})

const emit = defineEmits(['map-error'])

const mapContainer = ref(null)
const map = ref(null)
const marker = ref(null)
const error = ref(false)
const errorMessage = ref('Location information is not available.')
let mapScript = null
let markerElement = null

// Function to initialize the map
const initMap = () => {
  if (!props.latitude || !props.longitude || isNaN(props.latitude) || isNaN(props.longitude)) {
    error.value = true
    errorMessage.value = 'Invalid location coordinates provided.'
    emit('map-error')
    return
  }
  
  try {
    // Fix: Use GEOAPIFY instead of GEOPIFY to match your .env file
    const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY
    
    if (!apiKey) {
      error.value = true
      errorMessage.value = 'Map API key is missing'
      emit('map-error')
      console.error('Missing VITE_GEOAPIFY_API_KEY in environment variables')
      return
    }
    
    // Create a map instance
    const mapOptions = {
      container: mapContainer.value,
      style: 'https://maps.geoapify.com/v1/styles/osm-carto/style.json?apiKey=' + apiKey,
      center: [props.longitude, props.latitude], // Geoapify uses [lng, lat] format
      zoom: 13
    }
    
    // Initialize map
    map.value = new maplibregl.Map(mapOptions)
    
    // Add navigation controls
    map.value.addControl(new maplibregl.NavigationControl())
    
    // Wait for map to load before adding marker
    map.value.on('load', () => {
      // Create marker element
      const el = document.createElement('div')
      el.className = 'location-marker'
      markerElement = el
      
      // Create marker
      marker.value = new maplibregl.Marker(el)
        .setLngLat([props.longitude, props.latitude])
        .addTo(map.value)
      
      // Create popup with spot title
      const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(`<div class="marker-popup"><strong>${props.spotTitle}</strong></div>`)
      
      // Add popup to marker
      marker.value.setPopup(popup)
      
      // Open the popup by default
      popup.addTo(map.value)
    })
    
  } catch (err) {
    console.error('Map initialization error:', err)
    error.value = true
    errorMessage.value = 'Failed to load the map. Please try again later.'
    emit('map-error')
  }
}

// Load MapLibre GL JS (open-source fork that works with Geoapify)
const loadMapLibrary = () => {
  return new Promise((resolve, reject) => {
    if (window.maplibregl) {
      resolve()
      return
    }
    
    // Load CSS
    const mapStyles = document.createElement('link')
    mapStyles.rel = 'stylesheet'
    mapStyles.href = 'https://unpkg.com/maplibre-gl@2.4.0/dist/maplibre-gl.css'
    document.head.appendChild(mapStyles)
    
    // Load JS
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/maplibre-gl@2.4.0/dist/maplibre-gl.js'
    script.defer = true
    script.async = true
    
    script.onload = () => {
      resolve()
    }
    
    script.onerror = () => {
      error.value = true
      errorMessage.value = 'Failed to load map library'
      reject(new Error('Failed to load MapLibre GL JS'))
    }
    
    document.head.appendChild(script)
    mapScript = script
  })
}

// Watch for changes to coordinates
watch([() => props.latitude, () => props.longitude], ([newLat, newLng]) => {
  if (map.value && marker.value && !isNaN(newLat) && !isNaN(newLng)) {
    // Update marker position and map center
    map.value.setCenter([newLng, newLat])
    marker.value.setLngLat([newLng, newLat])
    error.value = false
  } else if ((!newLat || !newLng || isNaN(newLat) || isNaN(newLng)) && !error.value) {
    error.value = true
    errorMessage.value = 'Invalid location coordinates provided.'
    emit('map-error')
  }
})

// Load map on component mount
onMounted(async () => {
  try {
    await loadMapLibrary()
    initMap()
  } catch (err) {
    console.error('Failed to load map library:', err)
    error.value = true
    errorMessage.value = 'Failed to load map. Please check your internet connection.'
    emit('map-error')
  }
})
</script>

<style scoped>
.map-container {
  position: relative;
  min-height: 300px;
  width: 100%;
  height: 100%;
}

.location-marker {
  background-color: #e11d48;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(225, 29, 72, 0.3);
}

:deep(.marker-popup) {
  padding: 5px 8px;
  max-width: 200px;
  word-wrap: break-word;
}
</style>
