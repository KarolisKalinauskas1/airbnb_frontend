<template>
  <div class="filters-panel mb-4">
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
      <!-- Date range picker -->
      <div class="md:col-span-5 lg:col-span-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Dates</label>
        <div class="border border-gray-300 rounded-md overflow-hidden">
          <div class="grid grid-cols-2 gap-0">
            <div class="p-2 border-r border-gray-300">
              <div class="text-xs text-gray-500">Check in</div>
              <div class="text-sm">
                {{ formatDate(dates.startDate) || 'Select date' }}
              </div>
            </div>
            <div class="p-2">
              <div class="text-xs text-gray-500">Check out</div>
              <div class="text-sm">
                {{ formatDate(dates.endDate) || 'Select date' }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Location picker -->
      <div class="md:col-span-4 lg:col-span-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <div class="border border-gray-300 rounded-md p-2 min-h-[38px]">
          <div class="text-xs text-gray-500">Where</div>
          <div class="text-sm">
            {{ selectedLocation ? (selectedLocation.city || selectedLocation.formatted_address) : 'Select location' }}
          </div>
        </div>
      </div>
      
      <!-- Guests picker -->
      <div class="md:col-span-3 lg:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-1">Guests</label>
        <div class="relative">
          <select 
            v-model="guestCount" 
            class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
          >
            <option v-for="i in 10" :key="i" :value="i">{{ i }} {{ i === 1 ? 'guest' : 'guests' }}</option>
          </select>
        </div>
      </div>
      
      <!-- Price range -->
      <div class="md:col-span-6 lg:col-span-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
        <div class="flex items-center space-x-2">
          <input 
            v-model="priceRange.min" 
            type="number" 
            min="0" 
            step="10"
            class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500" 
            placeholder="Min" 
          />
          <span>-</span>
          <input 
            v-model="priceRange.max" 
            type="number" 
            min="0" 
            step="10"
            class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500" 
            placeholder="Max" 
          />
        </div>
      </div>
      
      <!-- Radius slider -->
      <div class="md:col-span-6 lg:col-span-4" v-if="showRadius">
        <label class="block text-sm font-medium text-gray-700 mb-1">Distance (km): {{ radius }}</label>
        <input 
          v-model="radius" 
          type="range" 
          min="5" 
          max="200"
          step="5"
          class="w-full" 
        />
      </div>
      
      <!-- Amenities -->
      <div class="md:col-span-12 lg:col-span-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
        <div class="border border-gray-300 rounded-md p-2 max-h-40 overflow-y-auto">
          <div v-if="isLoading" class="text-center py-2">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mx-auto"></div>
          </div>
          <div v-else-if="loadingError" class="text-center text-red-500 py-2">
            {{ loadingError }}
          </div>
          <div v-else class="grid grid-cols-2 gap-2">
            <div v-for="amenity in amenitiesData" :key="amenity.amenity_id" class="flex items-center">
              <input 
                :id="'amenity-' + amenity.amenity_id" 
                type="checkbox" 
                :value="amenity.amenity_id" 
                v-model="selectedAmenities"
                class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label :for="'amenity-' + amenity.amenity_id" class="ml-2 block text-sm text-gray-700 truncate">
                {{ amenity.name }}
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="flex justify-end mt-4">
      <button 
        @click="resetFilters" 
        class="px-4 py-2 text-gray-700 hover:text-gray-900 mr-2"
      >
        Reset Filters
      </button>
      <button 
        @click="applyFilters" 
        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Search
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, computed } from 'vue';
import axios from '@/axios';
import { useToast } from 'vue-toastification';
import { shouldAllowRequest } from '@/utils/requestThrottler';
import { useLoadingState } from '@/composables/useLoadingState';

const props = defineProps({
  filters: {
    type: Object,
    default: () => ({
      minPrice: 0,
      maxPrice: 1000,
      guests: 1,
      amenities: [],
      radius: 50,
      lat: null,
      lng: null
    })
  },
  availableAmenities: {
    type: Array,
    default: () => []
  },
  showRadius: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['filter']);

const toast = useToast();

// Create loading state for amenities fetch
const { isLoading, runWithLoading } = useLoadingState('fetch-amenities', {
  cooldownPeriod: 2000 // Prevent refetching for 2 seconds after completion
});

const loadingError = ref(null);

// Initialize local state from props
const localFilters = reactive({ ...props.filters });
const amenitiesData = ref([]);

// Define dates object for the date pickers
const dates = reactive({
  startDate: props.filters.startDate || '',
  endDate: props.filters.endDate || ''
});

// Create reactive variables for UI elements
const priceRange = reactive({
  min: props.filters.minPrice,
  max: props.filters.maxPrice
});

const guestCount = ref(props.filters.guests);
const selectedAmenities = ref(props.filters.amenities || []);
const radius = ref(props.filters.radius);
const selectedLocation = ref(null);

// Helper to format dates consistently
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    // Format as MMM DD, YYYY (e.g., Jan 01, 2023)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric'
    });
  } catch (err) {
    console.error('Date formatting error:', err);
    return dateStr;
  }
};

// Watch for changes to UI elements and update localFilters
watch(priceRange, (newValue) => {
  localFilters.minPrice = newValue.min;
  localFilters.maxPrice = newValue.max;
});

watch(guestCount, (newValue) => {
  localFilters.guests = newValue;
});

watch(selectedAmenities, (newValue) => {
  localFilters.amenities = newValue;
});

watch(radius, (newValue) => {
  localFilters.radius = newValue;
});

watch(selectedLocation, (newValue) => {
  if (newValue) {
    localFilters.lat = newValue.lat || null;
    localFilters.lng = newValue.lng || null;
  } else {
    localFilters.lat = null;
    localFilters.lng = null;
  }
});

// Improved fetchAmenities with better error handling
const fetchAmenities = async () => {
  if (isLoading.value) return;
  
  // Use request throttler to avoid rate limiting
  if (!shouldAllowRequest('/camping-spots/amenities')) {
    return;
  }
  
  try {
    // Use our new loading state utility
    await runWithLoading(async () => {
      loadingError.value = null;
      
      // First try the API endpoint
      let response;
      try {
        response = await axios.get('/camping-spots/amenities', { 
          timeout: 5000,
          headers: { 'Accept': 'application/json' } 
        });
      } catch (apiError) {
        console.warn('API endpoint failed:', apiError);
        throw apiError; // No need for fallback since we're already using the correct endpoint
      }
      
      // Process the response (existing code)
      if (response && response.data && Array.isArray(response.data)) {
        amenitiesData.value = response.data;
        console.log('Fetched amenities:', amenitiesData.value);
      } else {
        console.error('Invalid amenities data format:', response.data);
        throw new Error('Invalid data format received from server');
      }
    });
  } catch (error) {
    loadingError.value = error.message || 'Failed to load amenities';
    console.error('Error fetching amenities:', error);
    
    // Show error message
    toast.error('Failed to load amenities. Some filtering options may be unavailable.');
    
    // If props provides available amenities, use those instead
    if (props.availableAmenities && props.availableAmenities.length > 0) {
      amenitiesData.value = props.availableAmenities;
    }
  }
};

// Get amenity name by ID
const getAmenityName = (id) => {
  const amenity = amenitiesData.value.find(a => a.amenity_id === id);
  return amenity ? amenity.name : `Amenity ${id}`;
};

// Apply filters
const applyFilters = () => {
  // Update dates in localFilters from the dates object
  localFilters.startDate = dates.startDate;
  localFilters.endDate = dates.endDate;
  
  emit('filter', { ...localFilters });
};

// Reset filters to default values
const resetFilters = () => {
  localFilters.minPrice = 0;
  localFilters.maxPrice = 1000;
  localFilters.guests = 1;
  localFilters.amenities = [];
  localFilters.radius = 50;
  localFilters.lat = null;
  localFilters.lng = null;
  
  // Also reset the UI elements
  priceRange.min = 0;
  priceRange.max = 1000;
  guestCount.value = 1;
  selectedAmenities.value = [];
  radius.value = 50;
  selectedLocation.value = null;
  dates.startDate = '';
  dates.endDate = '';
  
  emit('filter', { ...localFilters });
};

// Expose reset method for parent components
defineExpose({
  reset: resetFilters
});

onMounted(() => {
  fetchAmenities();
});
</script>

<style scoped>
.filters-panel {
  width: 100%;
  max-width: 100%;
}

/* Add custom scrollbar styling */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #EF4444 #F3F4F6;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #F3F4F6;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #EF4444;
  border-radius: 4px;
  border: 2px solid #F3F4F6;
}
</style>
