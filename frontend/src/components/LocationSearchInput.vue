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
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    </button>

    <!-- Search Results -->
    <div v-show="showResults && results.length > 0" 
         class="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
      <div
        v-for="result in results"
        :key="result.properties.place_id"
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
import { ref, onMounted, onUnmounted, watch } from 'vue'
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
  
  if (!props.spots || props.spots.length === 0) {
    toast.info("No camping spots found in this area with current filters. Try removing some filters or choosing another location.")
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
  if (map.value) return

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
}

const handleMapClick = (event) => {
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
}

const addSpotPins = () => {
  if (!vectorLayer.value || !props.spots?.length) return
  
  console.log("Adding pins for spots:", props.spots)
  
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

  vectorLayer.value.getSource().clear()
  vectorLayer.value.getSource().addFeatures(features)
}

const handleBlur = () => {
  setTimeout(() => {
    showResults.value = false
  }, 200)
}

const formatAddress = (result) => {
  const props = result.properties
  return [
    props.street,
    props.housenumber,
    props.city,
    props.country
  ].filter(Boolean).join(', ')
}

const debounceSearch = () => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(searchLocations, 300)
}

const searchLocations = async () => {
  if (!searchQuery.value.trim()) {
    results.value = []
    showResults.value = false
    return
  }

  try {
    showResults.value = true
    const response = await axios.get('https://api.geoapify.com/v1/geocode/autocomplete', {
      params: {
        text: searchQuery.value,
        limit: 5,
        apiKey: import.meta.env.VITE_GEOAPIFY_API_KEY
      }
    })
    results.value = response.data.features
  } catch (error) {
    console.error('Failed to fetch locations:', error)
    toast.error('Failed to fetch locations')
    results.value = []
  }
}

const selectLocation = (result) => {
  const coords = result.geometry.coordinates
  const props = result.properties
  
  selectedLocation.value = {
    lat: coords[1],
    lng: coords[0],
    display_name: formatAddress(result)
  }
  
  searchQuery.value = formatAddress(result)
  showResults.value = false

  // Add marker to map
  if (map.value) {
    const markerFeature = new Feature({
      geometry: new Point(fromLonLat(coords))
    })
    
    vectorLayer.value.getSource().clear()
    vectorLayer.value.getSource().addFeature(markerFeature)
    centerMapOnLocation(selectedLocation.value)
  }

  // Emit selected location immediately
  emit('location-selected', selectedLocation.value)
}

watch(() => props.spots, (newSpots) => {
  if (showMap.value && selectedLocation.value) {
    addSpotPins()
    if (newSpots.length === 0) {
      toast.info("No camping spots found in this area with current filters. Try removing some filters or choosing another location.")
    }
  }
}, { deep: true })

onUnmounted(() => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  if (map.value) map.value.setTarget(undefined)
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
