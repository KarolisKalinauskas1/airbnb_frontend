<template>
  <div>
    <!-- Search bar positioned below the navigation bar (which is fixed by default) -->
    <div class="sticky top-0 left-0 right-0 bg-white shadow-md z-40 border-b border-gray-200">
      <div class="container mx-auto px-4 py-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Date Range Selection -->
          <div class="relative">
            <label class="block text-sm font-medium text-gray-700 mb-1">Dates</label>
            <input 
              type="text" 
              v-model="dateRangeText"
              @click="showDatePicker = !showDatePicker" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 cursor-pointer"
              placeholder="Add dates"
              readonly
            />
            <!-- Simple date picker panel -->
            <div v-if="showDatePicker" class="absolute z-50 top-full left-0 mt-1 bg-white rounded-lg shadow-lg border p-4 w-full md:w-auto">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    v-model="dates.startDate"
                    :min="tomorrow"
                    @change="updateDateRange"
                    class="w-full px-2 py-1 border rounded"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input 
                    type="date" 
                    v-model="dates.endDate"
                    :min="minEndDate"
                    @change="updateDateRange"
                    class="w-full px-2 py-1 border rounded"
                  />
                </div>
              </div>
              <div class="mt-2 text-right">
                <button @click="showDatePicker = false" class="text-red-500 hover:text-red-700 text-sm">Done</button>
              </div>
            </div>
          </div>
          
          <!-- Location Search -->
          <div class="relative">
            <label class="block text-sm font-medium text-gray-700 mb-1">Where</label>
            <input 
              type="text" 
              v-model="locationSearchText" 
              @input="handleLocationSearch" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Search location"
            />
            <!-- Search results dropdown -->
            <div v-if="locationResults.length > 0" class="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border max-h-60 overflow-y-auto">
              <div 
                v-for="(result, index) in locationResults" 
                :key="index"
                @click="selectLocation(result)"
                class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
              >
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {{ result.display_name }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Location selected banner -->
    <div v-if="selectedLocation" class="sticky top-[72px] left-0 right-0 bg-blue-50 border-b border-blue-200 z-30 py-2">
      <div class="container mx-auto px-4 flex justify-between items-center">
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Showing results near: <strong>{{ selectedLocation.display_name }}</strong></span>
        </div>
        <button 
          @click="clearLocationFilter" 
          class="text-blue-500 hover:text-blue-700 text-sm"
        >
          Clear location
        </button>
      </div>
    </div>
  
    <!-- Main content with proper spacing to account for the sticky elements -->
    <div class="container mx-auto px-4 pt-4">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Available Camping Spots</h1>
        
        <!-- View Selector (Map/List) -->
        <div class="bg-white rounded-lg shadow-sm inline-flex">
          <button 
            @click="viewMode = 'list'"
            class="px-4 py-2 rounded-l-lg transition-colors"
            :class="viewMode === 'list' ? 'bg-red-600 text-white' : 'hover:bg-gray-100'"
          >
            <span class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              List
            </span>
          </button>
          <button 
            @click="viewMode = 'map'"
            class="px-4 py-2 rounded-r-lg transition-colors"
            :class="viewMode === 'map' ? 'bg-red-600 text-white' : 'hover:bg-gray-100'"
          >
            <span class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Map
            </span>
          </button>
        </div>
      </div>
      
      <!-- Main content layout with sidebar -->
      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Filters Sidebar -->
        <div class="lg:w-80 flex-shrink-0">
          <div class="bg-white p-4 rounded-lg shadow-sm sticky top-[88px]">
            <h2 class="text-lg font-semibold mb-4">Filters</h2>
            
            <!-- Price Range -->
            <div class="mb-6">
              <h3 class="text-sm font-medium mb-2">Price Range</h3>
              <div class="flex items-center">
                <input
                  type="number"
                  v-model="filters.minPrice"
                  class="w-24 px-2 py-1 border rounded-md"
                  placeholder="Min €"
                />
                <span class="mx-2">-</span>
                <input
                  type="number"
                  v-model="filters.maxPrice"
                  class="w-24 px-2 py-1 border rounded-md"
                  placeholder="Max €"
                />
              </div>
            </div>
            
            <!-- Number of guests -->
            <div class="mb-6">
              <h3 class="text-sm font-medium mb-2">Guests</h3>
              <input
                type="number"
                v-model="filters.guests"
                min="1"
                class="w-full px-2 py-1 border rounded-md"
                placeholder="Number of guests"
              />
            </div>
            
            <!-- Amenities -->
            <div class="mb-6">
              <h3 class="text-sm font-medium mb-2">Amenities</h3>
              <div class="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                <div v-for="amenityId in availableAmenities" :key="amenityId" class="flex items-center">
                  <input
                    type="checkbox"
                    :id="`amenity-${amenityId}`"
                    :value="amenityId"
                    v-model="filters.amenities"
                    class="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <label :for="`amenity-${amenityId}`" class="ml-2 text-sm text-gray-700">
                    {{ getAmenityName(amenityId) }}
                  </label>
                </div>
              </div>
            </div>
            
            <!-- Distance filter (only shown when location is selected) -->
            <div v-if="selectedLocation" class="mb-6">
              <h3 class="text-sm font-medium mb-2">Distance (km)</h3>
              <input
                type="range"
                v-model="filters.radius"
                min="5"
                max="100"
                step="5"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div class="flex justify-between text-xs text-gray-500">
                <span>5 km</span>
                <span>{{ filters.radius }} km</span>
                <span>100 km</span>
              </div>
            </div>
            
            <div class="flex space-x-2">
              <button 
                @click="applyFilters" 
                class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex-grow"
              >
                Apply Filters
              </button>
              <button 
                @click="resetFilters" 
                class="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
        
        <!-- Spots Content -->
        <div class="flex-grow min-w-0">
          <!-- Map View -->
          <div v-if="viewMode === 'map'" class="bg-white rounded-lg shadow-sm p-4">
            <div class="h-[600px] w-full bg-gray-100 rounded-lg flex items-center justify-center">
              <p class="text-gray-500">Map view will be implemented here</p>
            </div>
          </div>
          
          <!-- List View -->
          <div v-else>
            <!-- Loading state -->
            <div v-if="loading" class="flex justify-center py-20">
              <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
            </div>
            
            <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div class="text-red-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">{{ error }}</h3>
              <p v-if="isDbConnectionError" class="text-gray-600 mb-4">
                The database server is currently unavailable. Please try again later.
              </p>
              <button 
                @click="retryConnection" 
                class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
            
            <!-- No results -->
            <div v-else-if="filteredSpots.length === 0" class="bg-white p-6 rounded-lg shadow-sm text-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 class="text-lg font-semibold mb-2">No camping spots found</h3>
              <p class="text-gray-600 mb-4">Try adjusting your filters or search for a different location.</p>
              <button 
                @click="resetFilters" 
                class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reset Filters
              </button>
            </div>
            
            <!-- Results grid -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CampingSpotCard 
                v-for="spot in filteredSpots" 
                :key="spot.camping_spot_id" 
                :spot="spot"
                :startDate="dates.startDate"
                :endDate="dates.endDate"
                @click="viewSpot(spot.camping_spot_id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Overlay for date picker -->
    <div v-if="showDatePicker" class="fixed inset-0 bg-black bg-opacity-50 z-40" @click="showDatePicker = false"></div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from '@/axios';
import { useToast } from 'vue-toastification';
import CampingSpotCard from '@/components/CampingSpotCard.vue';
import { debounce } from 'lodash';

const router = useRouter();
const toast = useToast();

// State
const campingSpots = ref([]);
const loading = ref(true);
const error = ref(null);
const isDbConnectionError = ref(false);
const dates = reactive({
  startDate: '',
  endDate: ''
});
const selectedLocation = ref(null);
const filters = ref({
  minPrice: 0,
  maxPrice: 1000,
  guests: 1,
  amenities: [],
  radius: 50,
  lat: null,
  lng: null
});

// UI state
const viewMode = ref('list');
const availableAmenities = ref([]);
const amenityNames = ref({});
const showDatePicker = ref(false);
const dateRangeText = ref('');
const locationSearchText = ref('');
const locationResults = ref([]);

// Date validation properties
const tomorrow = computed(() => {
  const today = new Date();
  today.setDate(today.getDate() + 1);
  return today.toISOString().split('T')[0];
});

const minEndDate = computed(() => {
  if (!dates.startDate) return tomorrow.value;
  return dates.startDate;
});

// Computed properties
const filteredSpots = computed(() => {
  return campingSpots.value;
});

// Methods
const fetchCampingSpots = async () => {
  try {
    loading.value = true;
    error.value = null;
    isDbConnectionError.value = false;
    
    console.log("Fetching spots with filters:", filters.value);
    console.log("Selected location:", selectedLocation.value);
    
    // Set default dates if not set
    if (!dates.startDate || !dates.endDate) {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      
      const afterTomorrow = new Date();
      afterTomorrow.setDate(today.getDate() + 2);
      
      dates.startDate = tomorrow.toISOString().split('T')[0];
      dates.endDate = afterTomorrow.toISOString().split('T')[0];
      
      updateDateRangeText();
    }
    
    const defaultParams = {
      startDate: dates.startDate,
      endDate: dates.endDate,
      minPrice: filters.value.minPrice,
      maxPrice: filters.value.maxPrice,
      guests: filters.value.guests
    };
    
    // Add location and radius if available
    if (filters.value.lat && filters.value.lng) {
      defaultParams.lat = filters.value.lat;
      defaultParams.lng = filters.value.lng;
      defaultParams.radius = filters.value.radius || 50;
    }
    
    // Add amenities if selected
    if (filters.value.amenities?.length) {
      defaultParams.amenities = filters.value.amenities.join(',');
    }
    
    let response;
    let useApiEndpoint = true;
    let maxRetries = 2;
    let retryDelay = 1000; // 1 second initial delay
    
    // Retry logic with increasing delay
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const endpoint = useApiEndpoint ? '/api/camping-spots' : '/camping-spots';
        
        response = await axios.get(endpoint, {
          timeout: 8000, // Longer timeout to accommodate slower responses
          headers: { 'Accept': 'application/json' },
          params: {
            ...defaultParams,
            // Add cache buster to prevent caching issues
            _t: Date.now()
          }
        });
        
        break; // If successful, exit the retry loop
      } catch (requestError) {
        console.warn(`Attempt ${attempt + 1} failed:`, requestError.message);
        
        // Check for specific database error
        if (requestError.response?.status === 503 || 
            requestError.response?.data?.code === 'P1001' ||
            (requestError.response?.data?.error && 
             requestError.response?.data?.error.toLowerCase().includes('database'))) {
          isDbConnectionError.value = true;
          error.value = 'Database server is currently unavailable. Please try again later.';
          
          // Instead of throwing, continue with empty results
          campingSpots.value = [];
          loading.value = false;
          return;
        }
        
        // Check for rate limiting
        if (requestError.response?.status === 429) {
          const retryAfter = requestError.response.data?.retryAfter || 30;
          toast.warning(`Rate limited. Try again in ${Math.ceil(retryAfter)} seconds.`);
          
          // If this is the last retry and we're using API endpoint, try non-API endpoint
          if (attempt === maxRetries && useApiEndpoint) {
            useApiEndpoint = false;
            attempt = -1; // Reset attempt counter for the new endpoint
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before trying new endpoint
            continue;
          }
        }
        
        // If this is the last attempt and still failing, handle the error
        if (attempt === maxRetries) {
          campingSpots.value = [];
          error.value = 'Failed to load camping spots. Please try again later.';
          loading.value = false;
          return;
        }
        
        // Wait before next retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 2; // Double the delay for next retry
      }
    }
    
    // Process the response
    if (response && response.data) {
      // Verify the response format - it should be an array
      if (Array.isArray(response.data)) {
        campingSpots.value = response.data;
        console.log(`Fetched ${campingSpots.value.length} camping spots`);
        
        // Extract available amenities from the spots for filtering
        const allAmenities = new Set();
        const amenityNameMap = {};
        
        campingSpots.value.forEach(spot => {
          if (Array.isArray(spot.camping_spot_amenities)) {
            spot.camping_spot_amenities.forEach(item => {
              if (item.amenity_id) {
                allAmenities.add(item.amenity_id);
                if (item.amenity && item.amenity.name) {
                  amenityNameMap[item.amenity_id] = item.amenity.name;
                }
              }
            });
          }
        });
        
        availableAmenities.value = Array.from(allAmenities);
        amenityNames.value = amenityNameMap;
      } else {
        // If we got a response but not an array, it might be HTML or other invalid response
        console.error('Unexpected response format:', typeof response.data);
        error.value = 'Received unexpected data format from server';
        campingSpots.value = [];
      }
    }
  } catch (err) {
    console.error('Error fetching camping spots:', err);
    
    // Handle network errors 
    if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
      error.value = 'Cannot connect to the server. Please check your internet connection or try again later.';
    } 
    // Handle database connection errors
    else if (err.response?.status === 503 || 
             err.response?.data?.code === 'P1001' || 
             isDbConnectionError.value) {
      error.value = 'Database server is currently unavailable. Please try again later.';
    } 
    // Default error message
    else {
      error.value = 'Failed to load camping spots';
    }
    
    // Display error notification
    toast.error(error.value);
    campingSpots.value = [];
  } finally {
    loading.value = false;
  }
};

const retryConnection = () => {
  fetchCampingSpots();
};

const applyFilters = () => {
  fetchCampingSpots();
};

const updateDateRange = () => {
  // Validate date selections
  if (dates.endDate && dates.startDate && new Date(dates.endDate) < new Date(dates.startDate)) {
    const startDate = new Date(dates.startDate);
    const nextDay = new Date(startDate);
    nextDay.setDate(startDate.getDate() + 1);
    dates.endDate = nextDay.toISOString().split('T')[0];
  }
  
  if (dates.startDate && dates.endDate) {
    updateDateRangeText();
    showDatePicker = false; // Hide date picker after selection
    fetchCampingSpots();
    
    // Save to session storage
    sessionStorage.setItem('campersDates', JSON.stringify({
      startDate: dates.startDate,
      endDate: dates.endDate,
      timestamp: new Date().getTime()
    }));
  }
};

const updateDateRangeText = () => {
  if (dates.startDate && dates.endDate) {
    const start = new Date(dates.startDate);
    const end = new Date(dates.endDate);
    dateRangeText.value = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  } else {
    dateRangeText.value = 'Add dates';
  }
};

const handleLocationSearch = debounce(async (event) => {
  const query = locationSearchText.value.trim();
  if (query.length < 2) {
    locationResults.value = [];
    return;
  }
  
  // Simple location search from the campingSpots data
  const results = [];
  const addedLocations = new Set();
  
  for (const spot of campingSpots.value) {
    if (spot.location) {
      const city = spot.location.city?.toLowerCase();
      const country = spot.location.country?.name?.toLowerCase();
      const searchQuery = query.toLowerCase();
      
      if ((city && city.includes(searchQuery)) || 
          (country && country.includes(searchQuery))) {
        
        const key = `${spot.location.city}-${spot.location.country?.name}`;
        
        if (!addedLocations.has(key)) {
          addedLocations.add(key);
          results.push({
            display_name: `${spot.location.city}, ${spot.location.country?.name || ''}`,
            lat: spot.location.latitute,
            lon: spot.location.longtitute
          });
        }
      }
    }
  }
  
  locationResults.value = results;
}, 300);

const selectLocation = (location) => {
  selectedLocation.value = location;
  locationSearchText.value = location.display_name;
  locationResults.value = [];
  
  filters.value.lat = location.lat;
  filters.value.lng = location.lon;
  
  // Save to session storage
  sessionStorage.setItem('campersLocation', JSON.stringify(location));
  
  // Fetch with location filter
  fetchCampingSpots();
};

const clearLocationFilter = () => {
  selectedLocation.value = null;
  filters.value.lat = null;
  filters.value.lng = null;
  locationSearchText.value = '';
  
  // Clear location from session storage
  sessionStorage.removeItem('campersLocation');
  
  // Refetch without location filter
  fetchCampingSpots();
};

const resetFilters = () => {
  // Reset filters to default values
  filters.value = {
    minPrice: 0,
    maxPrice: 1000,
    guests: 1,
    amenities: [],
    radius: 50,
    lat: selectedLocation.value ? selectedLocation.value.lat : null,
    lng: selectedLocation.value ? selectedLocation.value.lon : null
  };
  
  // Refetch with reset filters
  fetchCampingSpots();
};

const viewSpot = (spotId) => {
  // Save current filters and dates to session storage before navigating
  sessionStorage.setItem('campersFilters', JSON.stringify(filters.value));
  sessionStorage.setItem('campersDates', JSON.stringify({
    startDate: dates.startDate,
    endDate: dates.endDate,
    timestamp: new Date().getTime()
  }));
  
  // Navigate with proper route parameters
  router.push({
    path: `/camper/${spotId}`,
    query: {
      start: dates.startDate,
      end: dates.endDate,
      g: filters.value.guests
    }
  }).catch(err => {
    // Handle navigation errors
    console.error('Navigation error:', err);
    
    // Try alternate navigation method if needed
    window.location.href = `/camper/${spotId}?start=${dates.startDate}&end=${dates.endDate}&g=${filters.value.guests}`;
  });
};

// Helper function to get amenity name from ID
const getAmenityName = (id) => {
  return amenityNames.value[id] || `Amenity ${id}`;
};

// Load saved filters and dates from session storage
onMounted(() => {
  // Try to load filters from session storage
  const savedFilters = sessionStorage.getItem('campersFilters');
  if (savedFilters) {
    try {
      filters.value = JSON.parse(savedFilters);
    } catch (e) {
      console.error("Failed to parse saved filters:", e);
    }
  }
  
  // Try to load dates from session storage
  const savedDates = sessionStorage.getItem('campersDates');
  if (savedDates) {
    try {
      const parsedDates = JSON.parse(savedDates);
      dates.startDate = parsedDates.startDate;
      dates.endDate = parsedDates.endDate;
      updateDateRangeText();
    } catch (e) {
      console.error("Failed to parse saved dates:", e);
    }
  } else {
    // Set default dates (tomorrow and day after tomorrow)
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const afterTomorrow = new Date();
    afterTomorrow.setDate(today.getDate() + 2);
      
    dates.startDate = tomorrow.toISOString().split('T')[0];
    dates.endDate = afterTomorrow.toISOString().split('T')[0];
    updateDateRangeText();
  }
  
  // Try to load location from session storage
  const savedLocation = sessionStorage.getItem('campersLocation');
  if (savedLocation) {
    try {
      selectedLocation.value = JSON.parse(savedLocation);
      locationSearchText.value = selectedLocation.value.display_name;
    } catch (e) {
      console.error("Failed to parse saved location:", e);
    }
  }
  
  // Initial fetch
  fetchCampingSpots();
});
</script>

<style scoped>
/* Custom scrollbar for amenities list */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #EF4444 #F3F4F6;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

custom-scrollbar::-webkit-scrollbar-track {
  background: #F3F4F6;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #EF4444;
  border-radius: 4px;
}

/* Improved styling for range inputs */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
}

input[type="range"]::-webkit-slider-runnable-track {
  height: 4px;
  background: #ddd;
  border-radius: 2px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 18px;
  width: 18px;
  border-radius: 50%;
  background: #EF4444;
  margin-top: -7px;
  cursor: pointer;
}

input[type="range"]:focus {
  outline: none;
}

input[type="range"]:focus::-webkit-slider-thumb {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}
</style>