<template>
  <div class="location-search w-full">
    <div class="relative">
      <input
        type="text"
        v-model="searchQuery"
        @input="onSearchInput"
        @focus="isDropdownOpen = true"
        @blur="onBlur"
        placeholder="Search for a location..."
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 focus:outline-none transition-colors"
      />
      <button 
        v-if="searchQuery"
        @click.prevent="clearSearch" 
        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        &times;
      </button>
    </div>
    
    <div v-show="isDropdownOpen && searchResults.length > 0" class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg max-h-60 overflow-y-auto">
      <div 
        v-for="result in searchResults" 
        :key="result.place_id || result.id"
        @mousedown="selectLocation(result)"
        class="p-2 hover:bg-gray-100 cursor-pointer"
      >
        <p class="font-medium">{{ result.display_name || result.city }}</p>
        <p v-if="result.address" class="text-xs text-gray-600">{{ formatAddress(result.address) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue';
import axios from '@/axios';
import debounce from 'lodash/debounce';

const props = defineProps({
  spots: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['location-selected']);

const searchQuery = ref('');
const searchResults = ref([]);
const isDropdownOpen = ref(false);
const selectedResult = ref(null);

// Reset component state and clear search
const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
  selectedResult.value = null;
};

// Reset method exposed to parent components
const reset = () => {
  clearSearch();
};

// Expose reset method
defineExpose({ reset });

// Debounced search function
const searchLocation = debounce(async (query) => {
  if (!query || query.length < 2) {
    searchResults.value = [];
    return;
  }
  
  try {
    // First search for cities in our existing spots
    const citiesFromSpots = searchInSpots(query);
    
    // Then use Nominatim API for external geo search
    const { data } = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      { headers: { 'Accept-Language': 'en' } }
    );
    
    // Combine both result sets, with city results first
    searchResults.value = [...citiesFromSpots, ...data].slice(0, 7);
  } catch (error) {
    console.error('Location search error:', error);
    // Fallback to just local results
    searchResults.value = searchInSpots(query);
  }
}, 300);

// Search camping spot locations from our own data
const searchInSpots = (query) => {
  if (!props.spots || props.spots.length === 0) return [];
  
  const lowercaseQuery = query.toLowerCase();
  const matchingCities = new Map();
  
  props.spots.forEach(spot => {
    if (spot.location) {
      const city = spot.location.city;
      const country = spot.location.country?.name;
      
      // Only process if we have a city name
      if (city && city.toLowerCase().includes(lowercaseQuery)) {
        const key = `${city}-${country || ''}`;
        
        // If this city is not already in our results
        if (!matchingCities.has(key)) {
          matchingCities.set(key, {
            id: `spot-${spot.camping_spot_id}`,
            display_name: country ? `${city}, ${country}` : city,
            city: city,
            country: country,
            lat: spot.location.latitute,
            lng: spot.location.longtitute
          });
        }
      }
    }
  });
  
  return Array.from(matchingCities.values());
};

// Handler for input changes
const onSearchInput = () => {
  if (searchQuery.value) {
    searchLocation(searchQuery.value);
  } else {
    searchResults.value = [];
  }
};

// Handler for selecting a location
const selectLocation = (result) => {
  selectedResult.value = result;
  searchQuery.value = result.display_name || result.city;
  
  // Format location data to emit
  const locationData = {
    display_name: result.display_name || result.city,
    lat: result.lat || result.latitude,
    lng: result.lon || result.longitude || result.lng
  };
  
  // Emit the selected location to the parent component
  emit('location-selected', locationData);
  
  // Close dropdown
  isDropdownOpen.value = false;
};

// Handler for blur event
const onBlur = () => {
  // Use timeout to allow for click events to complete
  setTimeout(() => {
    isDropdownOpen.value = false;
  }, 200);
};

// Format address parts for display
const formatAddress = (address) => {
  const parts = [];
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.country) parts.push(address.country);
  return parts.join(', ');
};

// Watch for changes in spots prop to update search results
watch(() => props.spots, () => {
  if (searchQuery.value) {
    searchLocation(searchQuery.value);
  }
});
</script>
