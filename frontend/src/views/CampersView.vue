<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Date Selection Modal -->
    <div v-if="showDatePrompt" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h2 class="text-xl font-semibold mb-4">Select Your Dates</h2>
        <DateRangeSelector
          v-model:startDate="dates.startDate"
          v-model:endDate="dates.endDate"
          @dateChange="handleDateChange"
        />
        <div class="mt-4 text-center">
          <p class="text-sm text-gray-600 mb-4">Pick your travel dates to see available spots</p>
          <button 
            @click="showDatePrompt = false"
            class="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"
            :disabled="!dates.startDate || !dates.endDate"
          >
            Continue
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex flex-col">
      <!-- Search Header -->
      <div class="bg-white border-b sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <div class="flex flex-wrap items-center gap-4">
            <DateRangeSelector
              v-model:startDate="dates.startDate"
              v-model:endDate="dates.endDate"
              @dateChange="handleDateChange"
              class="flex-grow md:flex-grow-0"
            />
            <div class="w-full md:w-auto flex-grow">
              <LocationSearchInput
                @location-selected="handleLocationSelect"
                :spots="spots"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="max-w-7xl mx-auto px-4 py-8 flex gap-8">
        <!-- Filters Sidebar -->
        <div class="w-80 flex-shrink-0 hidden md:block">
          <FiltersPanel 
            @filter="handleFilters"
            :isSticky="true"
            :dates="dates"
          />
        </div>

        <!-- Mobile Filters Button -->
        <button 
          @click="showMobileFilters = true"
          class="md:hidden fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg z-40"
        >
          Filters
        </button>

        <!-- Spots Grid -->
        <div class="flex-1">
          <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
          <div v-else-if="spots.length === 0" class="text-center py-12">
            <p class="text-lg text-gray-600">No camping spots available for the selected dates</p>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CampingSpotCard
              v-for="spot in spots"
              :key="spot.camping_spot_id"
              :spot="spot"
              :startDate="dates.startDate"
              :endDate="dates.endDate"
              :isOwner="isOwner(spot)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Filters Modal -->
    <div 
      v-if="showMobileFilters" 
      class="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
      @click="showMobileFilters = false"
    >
      <div 
        class="bg-white h-full w-full max-w-xs p-4 ml-auto"
        @click.stop
      >
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold">Filters</h2>
          <button @click="showMobileFilters = false">&times;</button>
        </div>
        <FiltersPanel @filter="handleFilters" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DateRangeSelector from '@/components/DateRangeSelector.vue'
import FiltersPanel from '@/components/FiltersPanel.vue'
import CampingSpotCard from '@/components/CampingSpotCard.vue'
import LocationSearchInput from '@/components/LocationSearchInput.vue'
import { useAuthStore } from '@/stores/auth'
import axios from '@/axios'
import { useDatesStore } from '@/stores/dates'
import { useToast } from 'vue-toastification'

const authStore = useAuthStore()
const spots = ref([])
const loading = ref(false)
const showDatePrompt = ref(true)
const showMobileFilters = ref(false)
const location = ref('')
const coordinates = ref(null)
const error = ref(null)
const guests = ref(1)
const filters = ref({
  minPrice: null,
  maxPrice: null,
  amenities: [],
  radius: 50
})

const dates = reactive({
  startDate: '',
  endDate: ''
})

const currentFilters = ref({})

const route = useRoute()
const router = useRouter()
const datesStore = useDatesStore()
const toast = useToast()

const loadSavedState = () => {
  const savedState = localStorage.getItem('campers-state')
  if (savedState) {
    try {
      const state = JSON.parse(savedState)
      if (state.startDate) dates.startDate = state.startDate
      if (state.endDate) dates.endDate = state.endDate
    } catch (e) {
      console.error('Failed to parse saved state:', e)
    }
  }
  
  if (!dates.startDate || !dates.endDate) {
    // Set default dates
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    dates.startDate = today.toISOString().split('T')[0]
    dates.endDate = tomorrow.toISOString().split('T')[0]
  }
}

// Save state when navigating away
const saveState = () => {
  localStorage.setItem('campersViewState', JSON.stringify({
    startDate: dates.startDate,
    endDate: dates.endDate,
    location: location.value,
    coordinates: coordinates.value,
    filters: currentFilters.value
  }))
}

onMounted(() => {
  // Priority: URL params > Store > LocalStorage > Defaults
  if (route.query.startDate && route.query.endDate) {
    dates.startDate = route.query.startDate
    dates.endDate = route.query.endDate
    datesStore.setDates(dates.startDate, dates.endDate)
    showDatePrompt.value = false
  } else if (datesStore.startDate && datesStore.endDate) {
    dates.startDate = datesStore.startDate
    dates.endDate = datesStore.endDate
    showDatePrompt.value = false
  } else {
    loadSavedState()
  }
  
  if (dates.startDate && dates.endDate) {
    fetchSpots()
  }
})

// Clean up when component is unmounted
onUnmounted(() => {
  saveState()
})

const handleDateChange = async (newDates) => {
  if (newDates.startDate && newDates.endDate) {
    // Validate that end date is after start date
    const start = new Date(newDates.startDate);
    const end = new Date(newDates.endDate);
    
    if (end <= start) {
      toast.error('Checkout date must be after check-in date');
      return;
    }
    
    dates.startDate = newDates.startDate;
    dates.endDate = newDates.endDate;
    datesStore.setDates(dates.startDate, dates.endDate);
    showDatePrompt.value = false;
    
    // Update URL without navigation
    router.replace({ 
      query: { 
        ...route.query,
        startDate: dates.startDate,
        endDate: dates.endDate 
      }
    });
    
    await fetchSpots();
  }
}

const handleLocationSelect = (loc) => {
  location.value = loc.display_name
  coordinates.value = {
    lat: loc.lat,
    lng: loc.lng,
    radius: 50 // 50km radius
  }
  fetchSpots()
}

const isOwner = (spot) => {
  return authStore.fullUser && spot.owner_id === authStore.fullUser.user_id
}

const fetchSpots = async () => {
  loading.value = true
  spots.value = []
  error.value = null

  // Make sure dates are defined before attempting to fetch spots
  if (!dates.startDate || !dates.endDate) {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    dates.startDate = today.toISOString().slice(0, 10)
    dates.endDate = tomorrow.toISOString().slice(0, 10)
  }

  try {
    // Prepare the params for the API call
    const params = {
      startDate: dates.startDate,
      endDate: dates.endDate
    }
    
    // Add location filters if available
    if (coordinates.value) {
      params.lat = coordinates.value.lat
      params.lng = coordinates.value.lng
      params.radius = coordinates.value.radius || 50
    }
    
    // Add price and amenities filters
    if (filters.value) {
      if (filters.value.minPrice) params.minPrice = filters.value.minPrice
      if (filters.value.maxPrice) params.maxPrice = filters.value.maxPrice
      if (filters.value.amenities?.length) params.amenities = filters.value.amenities.join(',')
    }

    // First try the API endpoint
    let data
    try {
      const response = await axios.get('/api/camping-spots', { 
        params,
        headers: { 'Accept': 'application/json' }
      })
      data = response.data
      console.log('Fetched from /api/camping-spots successfully')
    } catch (apiError) {
      console.warn('API endpoint failed, trying without /api prefix:', apiError.message)
      const response = await axios.get('/camping-spots', { 
        params, 
        headers: { 'Accept': 'application/json' }
      })
      data = response.data
      console.log('Fetched from /camping-spots successfully')
    }

    // Validate that data is an array
    if (!data) {
      throw new Error('No data received from server')
    }
    
    if (!Array.isArray(data)) {
      console.error('Expected array but received:', data)
      toast.error('Received invalid data format from server')
      spots.value = []
      return
    }

    // Set spots data
    spots.value = authStore.fullUser 
      ? data.filter(spot => spot.owner_id !== authStore.fullUser.user_id)
      : data
    
    console.log('Fetched spots:', spots.value.length)
  } catch (error) {
    console.error('Failed to fetch spots:', error)
    error.value = 'Failed to load camping spots. Please try again later'
    toast.error('Failed to load camping spots: ' + (error.message || 'Unknown error'))
  } finally {
    loading.value = false
  }
}

const handleFilters = (newFilters) => {
  // Make sure the newFilters object is properly structured
  if (!newFilters) newFilters = { minPrice: null, maxPrice: null, amenities: [], radius: 50 };
  if (!newFilters.amenities) newFilters.amenities = [];
  
  currentFilters.value = newFilters;
  filters.value = newFilters;
  fetchSpots();
}
</script>