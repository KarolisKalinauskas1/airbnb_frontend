<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Only show the camping spots content -->
    <div>
      <div>
        <!-- Search bar positioned below the navigation bar (which is fixed by default) -->
        <div class="sticky top-0 left-0 right-0 bg-white shadow-md z-40 border-b border-gray-200">
          <div class="container mx-auto px-4 py-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Date Range Selection with absolute positioning inside the container -->
              <div class="relative date-range-container">
                <label class="block text-sm font-medium text-gray-700 mb-1">Dates</label>
                <input 
                  type="text" 
                  v-model="dateRangeText"
                  @click="toggleDatePicker" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 cursor-pointer"
                  placeholder="Add dates"
                  readonly
                />
                <!-- Date picker dropdown positioned absolutely within its parent -->
                <transition name="slide-fade">
                  <div v-if="showDatePicker" class="date-picker-dropdown absolute left-0 right-0 mt-1 z-[10000]">
                    <div class="bg-white p-4 rounded-lg shadow-xl border border-gray-200" @click.stop>
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                          <input 
                            type="date" 
                            v-model="dates.startDate"
                            :min="tomorrow"
                            @change="updateDateRange"
                            class="w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                          <input 
                            type="date" 
                            v-model="dates.endDate"
                            :min="minEndDate"
                            @change="updateDateRange"
                            class="w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                      </div>
                      <div class="mt-3 flex justify-end space-x-2">
                        <button 
                          @click="closeDatePicker" 
                          class="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button 
                          @click="applyDateSelection" 
                          class="px-3 py-1.5 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                </transition>
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
        
        <!-- Move the owner warning banner ABOVE the filters, not as a sticky element -->
        <div v-if="isOwner" class="bg-yellow-50 border border-yellow-200 rounded-lg mb-4 py-2 px-4 shadow-sm">
          <div class="container mx-auto text-center">
            <p class="text-yellow-800">
              <span class="font-medium">Owner account:</span> You're viewing other owners' camping spots. Your own spots won't appear here.
              <button @click="router.push('/dashboard/spots')" class="ml-2 underline">Manage Your Spots</button>
            </p>
          </div>
        </div>
      
        <!-- Main content with proper spacing to account for the warning -->
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
                    <div v-for="amenity in availableAmenities" :key="amenity.amenity_id" class="flex items-center">
                      <input
                        type="checkbox"
                        :id="`amenity-${amenity.amenity_id}`"
                        :value="amenity.amenity_id"
                        v-model="filters.amenities"
                        class="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <label :for="`amenity-${amenity.amenity_id}`" class="ml-2 text-sm text-gray-700">
                        {{ amenity.name }}
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
                <div class="h-[600px] w-full rounded-lg">
                  <OpenStreetMapView
                    :spots="filteredSpots" 
                    :selected-location="selectedLocation"
                    :search-radius="parseInt(filters.radius)"
                    @spot-clicked="viewSpot"
                  />
                </div>
                <div class="mt-3 text-center text-sm text-gray-500">
                  <p>Map powered by OpenStreetMap contributors</p>
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
                <div v-if="!loading && filteredSpots.length === 0" class="no-spots-message">
                  <div class="alert alert-info p-5 text-center">
                    <h3 class="text-lg font-semibold mb-2">No camping spots found</h3>
                    <p v-if="fetchError">
                      {{ fetchError }}
                    </p>
                    <p v-else>
                      Sorry, there are no camping spots matching your current filters.
                      Try changing your search criteria to see more results.
                    </p>
                    <button @click="resetFilters" class="btn btn-primary mt-4">
                      Reset Filters
                    </button>
                  </div>
                </div>
                
                <!-- Results grid -->
                <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div 
                    v-for="spot in filteredSpots" 
                    :key="spot.camping_spot_id" 
                    class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
                    :class="{'opacity-70': isOwner && spot.owner_id === authStore.fullUser?.user_id}"
                    @click="viewSpot(spot)"
                  >
                    <CampingSpotCard 
                      :spot="spot"
                      :startDate="dates.startDate"
                      :endDate="dates.endDate"
                    />
                    
                    <!-- Add an indicator if this is the owner's own spot -->
                    <div v-if="isOwner && spot.owner_id === authStore.fullUser?.user_id" 
                         class="bg-yellow-50 border-t border-yellow-100 p-2 text-center text-yellow-800 text-sm">
                      This is your spot. Manage it from your dashboard.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient } from '../services/connectionConfig';
import { useToast } from 'vue-toastification';
import CampingSpotCard from '@/components/CampingSpotCard.vue';
import OpenStreetMapView from '@/components/OpenStreetMapView.vue';
import { debounce } from 'lodash';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

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
const fetchError = ref(null);
const networkErrorCount = ref(0);
const MAX_RETRY_ATTEMPTS = 3;

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
const isOwner = computed(() => {
  return authStore.fullUser?.isowner === 1;
});

const filteredSpots = computed(() => {
  if (!campingSpots.value.length) return [];
  
  return campingSpots.value.filter(spot => {
    // Price filter
    if (filters.value.minPrice && spot.price_per_night < filters.value.minPrice) return false;
    if (filters.value.maxPrice && spot.price_per_night > filters.value.maxPrice) return false;
    
    // Guests filter
    if (filters.value.guests && spot.max_guests < filters.value.guests) return false;
    
    // Amenities filter
    if (filters.value.amenities && filters.value.amenities.length > 0) {
      const spotAmenityIds = spot.camping_spot_amenities?.map(a => a.amenity_id) || [];
      const hasAllAmenities = filters.value.amenities.every(amenityId => 
        spotAmenityIds.includes(parseInt(amenityId))
      );
      if (!hasAllAmenities) return false;
    }
    
    // Location filter
    if (selectedLocation.value) {
      const distance = calculateDistance(
        selectedLocation.value.lat,
        selectedLocation.value.lon,
        spot.location.latitute,
        spot.location.longtitute
      );
      if (distance > filters.value.radius) return false;
    }
    
    return true;
  });
});

// Methods
const fetchCampingSpots = async () => {
  loading.value = true;
  fetchError.value = null;
  
  // Set a reasonable default for filteredSpots in case of errors
  campingSpots.value = [];
  
  // Prepare query parameters for the API call
  const searchParams = new URLSearchParams();
  
  if (dates.startDate) searchParams.append('startDate', dates.startDate);
  if (dates.endDate) searchParams.append('endDate', dates.endDate);
  if (filters.value.minPrice !== undefined) searchParams.append('minPrice', filters.value.minPrice);
  if (filters.value.maxPrice !== undefined) searchParams.append('maxPrice', filters.value.maxPrice);
  if (filters.value.guests) searchParams.append('guests', filters.value.guests);
  if (filters.value.amenities.length > 0) searchParams.append('amenities', filters.value.amenities.join(','));
  if (filters.value.radius) searchParams.append('radius', filters.value.radius);
  if (selectedLocation.value) {
    searchParams.append('latitude', selectedLocation.value.lat);
    searchParams.append('longitude', selectedLocation.value.lon);
  }
  
  // Add timestamp to prevent caching
  searchParams.append('_t', Date.now());
  
  // Prepare multiple endpoint options for resilience
  const endpoints = [
    `${import.meta.env.VITE_API_URL}/api/camping-spots?${searchParams.toString()}`
  ];
  
  let successfulFetch = false;
  
  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS && !successfulFetch; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1} with endpoint: ${endpoints[0]}`);
      const response = await apiClient.get(endpoints[0], {
        timeout: 10000 + (attempt * 2000) // Increase timeout with each retry
      });
      
      console.log(`Got ${response.data.length} camping spots`);
      campingSpots.value = response.data;
      
      // Reset error counters on success
      networkErrorCount.value = 0;
      fetchError.value = null;
      successfulFetch = true;
      
    } catch (error) {
      console.log(`Attempt ${attempt + 1} failed: ${error.message}`);
      
      // On the last attempt, set the error message
      if (attempt === MAX_RETRY_ATTEMPTS - 1) {
        networkErrorCount.value++;
        
        if (networkErrorCount.value >= 3) {
          fetchError.value = "We're having trouble connecting to our servers. Please check your internet connection or try again later.";
        } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
          fetchError.value = "Network error: Please check your internet connection.";
        } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          fetchError.value = "The request took too long to complete. Please try again.";
        } else if (error.response?.status === 500) {
          fetchError.value = "Server error: We're working to fix this issue.";
        } else {
          fetchError.value = "Something went wrong when loading camping spots.";
        }
      }
      
      // Wait a bit before the next attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  loading.value = false;
};

const retryConnection = () => {
  fetchCampingSpots();
};

const applyFilters = () => {
  fetchCampingSpots();
};

const updateDateRange = () => {
  // Validate date selection
  if (dates.endDate && dates.startDate && new Date(dates.endDate) < new Date(dates.startDate)) {
    const startDate = new Date(dates.startDate);
    const nextDay = new Date(startDate);
    nextDay.setDate(startDate.getDate() + 1);
    dates.endDate = nextDay.toISOString().split('T')[0];
  }
  
  if (dates.startDate && dates.endDate) {
    updateDateRangeText();
    
    // Save to session storage
    sessionStorage.setItem('campersDates', JSON.stringify({
      startDate: dates.startDate,
      endDate: dates.endDate,
      timestamp: new Date().getTime()
    }));
  }
};

const toggleDatePicker = () => {
  showDatePicker.value = !showDatePicker.value;
  
  // No need for complicated positioning since we're now using absolute positioning
  // relative to the parent container
  if (showDatePicker.value) {
    document.addEventListener('click', handleClickOutside);
  }
};

const closeDatePicker = () => {
  showDatePicker.value = false;
  document.removeEventListener('click', handleClickOutside);
};

const handleClickOutside = (event) => {
  // If clicking outside the date picker area, close it
  const datepickerElements = document.querySelectorAll('.date-range-container, .date-range-container *');
  const dateInput = document.querySelector('input[v-model="dateRangeText"]');
  
  let clickedOnRelated = false;
  if (dateInput && dateInput.contains(event.target)) {
    clickedOnRelated = true;
  }
  
  datepickerElements.forEach(el => {
    if (el.contains(event.target)) {
      clickedOnRelated = true;
    }
  });
  
  if (!clickedOnRelated) {
    closeDatePicker();
  }
};

const applyDateSelection = () => {
  if (dates.startDate && dates.endDate) {
    updateDateRange();
    closeDatePicker();
    fetchCampingSpots();
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

const handleLocationSearch = debounce(async () => {
  if (!locationSearchText.value || locationSearchText.value.length < 3) {
    locationResults.value = [];
    return;
  }

  try {
    loading.value = true;
    const response = await apiClient.get('/api/geocoding/search', {
      params: {
        q: locationSearchText.value
      }
    });
    locationResults.value = response.data;
  } catch (error) {
    console.error('Location search failed:', error);
    toast.error('Failed to search locations');
  } finally {
    loading.value = false;
  }
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

const checkOwnerAccess = () => {
  if (isOwner.value) {
    toast.error('As an owner, you cannot book camping spots. Please log in with a renter account to book spots.');
    return false;
  }
  return true;
};

const viewSpot = (spotOrId) => {
  // Handle both spot objects and spot IDs (from map clicks)
  let spotId;
  let spot;
  
  if (typeof spotOrId === 'object' && spotOrId !== null) {
    // Case: Regular spot object from list view
    spot = spotOrId;
    spotId = spot.camping_spot_id;
  } else {
    // Case: Spot ID from map view
    spotId = spotOrId;
    // Find the spot in our data if possible
    spot = campingSpots.value.find(s => s.camping_spot_id === spotId);
  }
  
  // If we found the full spot object and user is trying to view their own spot
  if (spot && authStore.isLoggedIn && authStore.fullUser && spot.owner_id === authStore.fullUser.user_id) {
    toast.info("This is your own camping spot. You can manage it from your dashboard.");
    router.push('/dashboard/spots');
    return;
  }
  
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

// Helper function for distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

const fetchAmenities = async () => {
  try {
    const response = await apiClient.get('/api/camping-spots/amenities');
    availableAmenities.value = response.data;
    // Create a map of amenity IDs to names for quick lookup
    amenityNames.value = response.data.reduce((acc, amenity) => {
      acc[amenity.amenity_id] = amenity.name;
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching amenities:', error);
    toast.error('Failed to load amenities');
  }
};

// Add event listener for booking changes
onMounted(() => {
  // Listen for booking changes
  window.addEventListener('booking-changed', handleBookingChange);
  
  // Initial fetch
  fetchCampingSpots();
});

onUnmounted(() => {
  // Clean up event listener
  window.removeEventListener('booking-changed', handleBookingChange);
  document.removeEventListener('click', handleClickOutside);
  handleLocationSearch.cancel();
});

// Handle booking changes
const handleBookingChange = () => {
  console.log('Booking changed, refreshing camping spots...');
  fetchCampingSpots();
};
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

/* Add animations for the date picker dropdown */
.slide-fade-enter-active {
  transition: all 0.15s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.15s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(2px);
  opacity: 0;
}

/* Add this class to make the date picker container identifiable for event handling */
.date-range-container {
  position: relative;
}

/* Enhanced Date Picker Styling with fixed positioning */
.date-picker-dropdown {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 320px;
  top: 100%; /* Position right below the parent */
}

/* Fix input styling */
input[type="date"] {
  box-sizing: border-box;
  line-height: normal;
  height: auto;
  width: 100%;
  padding: 0.375rem 0.75rem;
}

/* Improved date picker inputs layout */
.date-picker-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

/* Styling for no spots message */
.no-spots-message {
  margin: 2rem auto;
  max-width: 600px;
}
</style>