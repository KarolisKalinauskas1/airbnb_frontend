<template>
  <div class="relative">
    <input
      v-model="searchQuery"
      @input="debounceSearch"
      @blur="handleBlur"
      type="text"
      placeholder="Search location..."
      class="w-full px-4 py-3 border rounded-lg text-lg"
    />
    
    <button 
      @click="toggleMap"
      class="absolute right-3 top-1/2 -translate-y-1/2 p-3 hover:bg-gray-100 rounded-full cursor-pointer transition-all duration-200 hover:scale-110"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    </button>

    <!-- Search Results -->
    <div v-show="showResults && filteredResults.length > 0" 
         class="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
      <div
        v-for="result in filteredResults"
        :key="result.place_id || result.properties?.place_id"
        @mousedown="selectLocation(result)"
        class="px-4 py-2 hover:bg-gray-100 cursor-pointer"
      >
        {{ formatAddress(result) }}
      </div>
    </div>

    <!-- Map Dialog -->
    <div v-if="showMap" 
         class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
         @click.self="showMap = false">
      <div class="bg-white rounded-lg w-full max-w-4xl p-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Available Camping Spots</h3>
          <button @click="showMap = false" class="text-gray-500 hover:text-gray-700 cursor-pointer">&times;</button>
        </div>
        <div ref="mapContainer" class="h-[60vh] rounded-lg overflow-hidden"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { fromLonLat } from 'ol/proj'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { Style, Circle, Fill, Stroke } from 'ol/style'
import Overlay from 'ol/Overlay'
import { useToast } from 'vue-toastification'

const toast = useToast()
const router = useRouter()
const emit = defineEmits(['location-selected'])
const props = defineProps({
  spots: {
    type: Array,
    default: () => []
  }
})

const searchQuery = ref('')
const results = ref([])
const showResults = ref(false)
const showMap = ref(false)
const mapContainer = ref(null)
const map = ref(null)
const vectorLayer = ref(null)
const popup = ref(null)
const selectedLocation = ref(null)
let debounceTimeout = null

// Hard-coded API key as fallback (same as in your .env file)
const FALLBACK_API_KEY = '7b85096d4dbd41cebfcc742670a5a2b6'

// Filter out duplicates by unique addresses
const filteredResults = computed(() => {
  if (!results.value || !Array.isArray(results.value)) {
    return [];
  }
  
  const uniqueAddresses = {};
  const uniqueResults = [];
  
  results.value.forEach(result => {
    const address = formatAddress(result);
    if (address && !uniqueAddresses[address]) {
      uniqueAddresses[address] = true;
      uniqueResults.push(result);
    }
  });
  
  return uniqueResults;
});

const centerMapOnLocation = (location) => {
  if (!map.value || !location) return
  
  const coords = [location.lng, location.lat]
  map.value.getView().animate({
    center: fromLonLat(coords),
    zoom: 12,
    duration: 500
  })
}

const toggleMap = () => {
  if (!selectedLocation.value) {
    toast.warning("Please search and select a location first")
    return
  }
  
  showMap.value = !showMap.value
  if (showMap.value) {
    setTimeout(() => {
      initializeMap()
      centerMapOnLocation(selectedLocation.value)
      addSpotPins()
    }, 100)
  }
}

const initializeMap = () => {
  if (map.value) {
    map.value.setTarget(mapContainer.value)
    return
  }

  try {
    // Create vector source and layer for markers
    const vectorSource = new VectorSource()
    vectorLayer.value = new VectorLayer({
      source: vectorSource,
      style: new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({ color: '#ef4444' }),
          stroke: new Stroke({ color: '#ffffff', width: 2 })
        })
      })
    })

    // Create popup overlay
    const popupElement = document.createElement('div')
    popupElement.className = 'ol-popup bg-white p-3 rounded-lg shadow-lg'
    popup.value = new Overlay({
      element: popupElement,
      positioning: 'bottom-center',
      offset: [0, -10],
      stopEvent: false
    })

    // Initialize map
    map.value = new Map({
      target: mapContainer.value,
      layers: [
        new TileLayer({ source: new OSM() }),
        vectorLayer.value
      ],
      view: new View({
        center: fromLonLat([4.3517, 50.8503]), // Brussels
        zoom: 7
      }),
      overlays: [popup.value]
    })

    // Add click handler for pins
    map.value.on('click', handleMapClick)
  } catch (error) {
    console.error('Error initializing map:', error)
    toast.error('Failed to initialize map. Please try again.')
  }
}

const handleMapClick = (event) => {
  try {
    if (!map.value) return
    
    const feature = map.value.forEachFeatureAtPixel(event.pixel, feature => feature)
    
    if (feature) {
      const spotData = feature.get('spotData')
      const coordinate = feature.getGeometry().getCoordinates()
      
      // Updated popup content with image and better styling
      const popupContent = `
        <div class="max-w-xs bg-white rounded-lg overflow-hidden shadow-lg">
          ${spotData.images?.length > 0 
            ? `<img src="${spotData.images[0].image_url}" 
                    alt="${spotData.title}" 
                    class="w-full h-32 object-cover">`
            : '<div class="w-full h-32 bg-gray-200 flex items-center justify-center"><span class="text-gray-400">No image</span></div>'
          }
          <div class="p-3">
            <h4 class="font-semibold text-gray-800">${spotData.title}</h4>
            <p class="text-sm text-gray-600 mt-1">€${spotData.price_per_night}/night</p>
            <button onclick="window.location.href='/camper/${spotData.id}'" 
                    class="mt-2 w-full px-3 py-1.5 bg-red-500 text-white text-sm rounded hover:bg-red-600 cursor-pointer transition-colors">
              View Details
            </button>
          </div>
        </div>
      `
      popup.value.getElement().innerHTML = popupContent
      popup.value.setPosition(coordinate)
    } else {
      popup.value.setPosition(undefined)
    }
  } catch (error) {
    console.error('Error handling map click:', error)
  }
}

const addSpotPins = () => {
  try {
    if (!vectorLayer.value) return
    
    console.log("Adding pins for spots:", props.spots)
    
    if (!props.spots || props.spots.length === 0) {
      if (vectorLayer.value && vectorLayer.value.getSource) {
        vectorLayer.value.getSource().clear()
      }
      return
    }
    
    const features = props.spots
      .filter(spot => spot.location?.latitute && spot.location?.longtitute)
      .map(spot => {
        const coords = [
          parseFloat(spot.location.longtitute),
          parseFloat(spot.location.latitute)
        ]
        
        const feature = new Feature({
          geometry: new Point(fromLonLat(coords))
        })
        
        feature.set('spotData', {
          id: spot.camping_spot_id,
          title: spot.title,
          price_per_night: spot.price_per_night,
          images: spot.images
        })
        
        return feature
      })

    if (vectorLayer.value && vectorLayer.value.getSource) {
      vectorLayer.value.getSource().clear()
      vectorLayer.value.getSource().addFeatures(features)
    }
  } catch (error) {
    console.error('Error adding spot pins:', error)
  }
}

const handleBlur = () => {
  setTimeout(() => {
    showResults.value = false
  }, 200)
}

// Helper function to get a property safely
const getProp = (obj, path) => {
  if (!obj) return undefined;
  const pathParts = Array.isArray(path) ? path : path.split('.');
  let current = obj;
  
  for (const part of pathParts) {
    if (current[part] === undefined) return undefined;
    current = current[part];
  }
  
  return current;
}

const formatAddress = (result) => {
  if (!result) return '';
  
  // Handle both response formats (geoapify changed their API)
  // New format has direct properties, old format has them under properties
  const props = result.properties || result;
  
  // Look for various address parts in different possible locations
  const parts = [
    getProp(props, 'street'),
    getProp(props, 'housenumber'),
    getProp(props, 'city') || getProp(props, 'name'),
    getProp(props, 'state'),
    getProp(props, 'country')
  ];
  
  return parts.filter(Boolean).join(', ');
}

const debounceSearch = () => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(searchLocations, 300)
}

const getApiKey = () => {
  // Try multiple ways to get the API key to ensure it's available
  const apiKey = 
    import.meta.env.VITE_GEOAPIFY_API_KEY || 
    window.process?.env?.VITE_GEOAPIFY_API_KEY ||
    FALLBACK_API_KEY

  return apiKey
}

const searchLocations = async () => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    results.value = []
    return
  }

  try {
    showResults.value = true
    const apiKey = getApiKey()
    
    // Check if API key is available
    if (!apiKey) {
      console.error('Geoapify API key is missing. Please check your environment variables.')
      toast.error('API configuration error. Please contact support.')
      return
    }
    
    // Use the correct API endpoint according to documentation
    const response = await axios.get('https://api.geoapify.com/v1/geocode/autocomplete', {
      params: {
        text: searchQuery.value,
        limit: 5,
        apiKey: apiKey,
        format: 'json'
      }
    })
    
    // Handle the response according to the expected structure
    if (response.data) {
      // The API might return different formats based on the format parameter
      if (response.data.features) {
        // GeoJSON format
        results.value = response.data.features;
      } else if (response.data.results) {
        // Regular JSON format with 'results' property
        results.value = response.data.results;
      } else {
        console.warn('Unexpected API response format:', response.data);
        results.value = [];
      }
    } else {
      results.value = [];
    }
  } catch (error) {
    console.error('Failed to fetch locations:', error)
    
    // More detailed error message
    if (error.response) {
      if (error.response.status === 401) {
        console.error('API key is invalid or unauthorized')
        toast.error('Location service authentication failed')
      } else {
        toast.error(`Error: ${error.response.status} - ${error.response.statusText}`)
      }
    } else {
      toast.error('Failed to connect to location service')
    }
    
    results.value = []
  }
}

const selectLocation = (result) => {
  try {
    if (!result) {
      console.error('Invalid location result');
      toast.error('Invalid location data received');
      return;
    }
    
    let coords;
    
    // Handle both response formats
    if (result.geometry && result.geometry.coordinates) {
      // GeoJSON format
      coords = result.geometry.coordinates;
    } else if (result.lon !== undefined && result.lat !== undefined) {
      // Regular JSON format
      coords = [result.lon, result.lat];
    } else {
      console.error('Cannot find coordinates in result:', result);
      toast.error('Location coordinates not found');
      return;
    }
    
    selectedLocation.value = {
      lat: typeof coords[1] === 'number' ? coords[1] : parseFloat(coords[1]),
      lng: typeof coords[0] === 'number' ? coords[0] : parseFloat(coords[0]),
      display_name: formatAddress(result)
    }
    
    searchQuery.value = formatAddress(result)
    showResults.value = false

    // Add marker to map
    if (map.value && vectorLayer.value && vectorLayer.value.getSource) {
      const markerFeature = new Feature({
        geometry: new Point(fromLonLat([selectedLocation.value.lng, selectedLocation.value.lat]))
      })
      
      vectorLayer.value.getSource().clear()
      vectorLayer.value.getSource().addFeature(markerFeature)
      centerMapOnLocation(selectedLocation.value)
    }
    
    emit('location-selected', selectedLocation.value)
  } catch (error) {
    console.error('Error selecting location:', error)
    toast.error('Error selecting location. Please try again.')
  }
}

watch(() => props.spots, (newSpots) => {
  if (showMap.value && selectedLocation.value) {
    addSpotPins()
  }
}, { deep: true })

onMounted(() => {
  // Debug - check API key availability through different methods
  const apiKey = getApiKey()
  console.log('API Key available:', !!apiKey)
  if (apiKey) {
    console.log('API Key first 4 chars:', apiKey.substring(0, 4))
  } else {
    console.warn('No API key available')
  }
})

onUnmounted(() => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  if (map.value) {
    try {
      map.value.setTarget(undefined)
    } catch (error) {
      console.error('Error unmounting map:', error)
    }
  }
})
</script>

<style scoped>
/* Add cursor pointer to all buttons */
button {
  cursor: pointer;
}

.marker {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #ef4444;
  border: 2px solid white;
  cursor: pointer;
}

.ol-popup {
  min-width: 250px;
  filter: drop-shadow(0 0 6px rgba(0,0,0,0.1));
}
</style>
