<template>
  <div class="min-h-screen bg-gray-50">
    <div v-if="loading" class="h-screen flex items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
    </div>
    <div v-else-if="!spot" class="h-screen flex items-center justify-center text-lg">
      Spot not found.
    </div>
    <div v-else class="max-w-7xl mx-auto px-4 py-8">
      <!-- Back Button -->
      <button 
        @click="goBackToCampers" 
        class="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <span class="text-xl">←</span> Back to Campers
      </button>

      <!-- Header Section -->
      <div class="mb-8 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 class="text-4xl font-semibold mb-2">{{ spot.title }}</h1>
          <div class="flex flex-wrap items-center gap-4 text-lg text-gray-600">
            <div class="flex items-center">
              <span class="text-yellow-400">★</span>
              <span>{{ averageRating }} ({{ spot.reviews?.length || 0 }} reviews)</span>
            </div>
            <span>•</span>
            <span>📍 {{ spot.location?.city }}, {{ spot.location?.country?.name }}</span>
          </div>
        </div>
        <button 
          @click="showMap = true"
          class="bg-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center gap-2 cursor-pointer hover:bg-gray-50"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
          </svg>
          View on Map
        </button>
      </div>

      <!-- Image Gallery Layout -->
      <div class="relative mb-10">
        <!-- Main Large Image -->
        <div class="w-full h-[500px] rounded-lg overflow-hidden mb-4">
          <img 
            :src="spot.images[currentImageIndex]?.image_url" 
            :alt="spot.title" 
            class="w-full h-full object-cover cursor-pointer"
            @click="showGallery = true"
          />
          <!-- Navigation Arrows -->
          <button 
            @click.prevent="previousImage" 
            class="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 text-gray-800 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform duration-200 hover:scale-110"
          >❮</button>
          <button 
            @click.prevent="nextImage" 
            class="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 text-gray-800 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform duration-200 hover:scale-110"
          >❯</button>
        </div>
        
        <!-- Thumbnail Strip -->
        <div class="flex gap-2 overflow-x-auto pb-2">
          <div v-for="(image, index) in spot.images.slice(0, 4)" 
               :key="index"
               class="w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden"
               :class="{ 'border-2 border-red-500': currentImageIndex === index }"
               @click="currentImageIndex = index">
            <img :src="image.image_url" 
                 class="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" />
          </div>
          <div v-if="spot.images.length > 4"
               class="w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden relative cursor-pointer"
               @click="showGallery = true">
            <img :src="spot.images[4].image_url" 
                 class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white">
              +{{ spot.images.length - 4 }} more
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content with Improved Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: Details -->
        <div class="lg:col-span-2 space-y-10">
          <!-- Key Features -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
            <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div>
                <p class="font-medium">Location</p>
                <p class="text-gray-600">{{ spot.location?.city }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div>
                <p class="font-medium text-lg">Max Guests</p>
                <p class="text-gray-600">{{ spot.max_guests }} people</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.519-4.674z" />
              </svg>
              <div>
                <p class="font-medium">Rating</p>
                <p class="text-gray-600">{{ averageRating }}</p>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="prose max-w-none space-y-6 border-t border-b py-10">
            <h2 class="text-2xl font-semibold">About this spot</h2>
            <p class="text-gray-700 text-lg leading-relaxed whitespace-pre-line">{{ spot.description }}</p>
          </div>

          <!-- Amenities with Better Spacing -->
          <div class="space-y-6 py-6">
            <h2 class="text-2xl font-semibold">What this place offers</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div v-for="amenity in spot.camping_spot_amenities" 
                   :key="amenity.amenity_id" 
                   class="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-lg">{{ amenity.amenity.name }}</span>
              </div>
            </div>
          </div>

          <!-- Availability Calendar Section -->
          <div class="border-t pt-10 mt-10">
            <h2 class="text-2xl font-semibold mb-6">Availability Calendar</h2>
            <div class="grid grid-cols-1 gap-8">
              <AvailabilityCalendar 
                :camping-spot-id="spot.camping_spot_id" 
                :base-price="spot.price_per_night"
                :is-owner="isOwner"
                :owner-id="spot.owner_id"
                @blocked-dates-loaded="handleBlockedDates"
              />
              <div v-if="isOwner" class="mt-4">
                <PriceSuggestionWidget
                  :camping-spot-id="spot.camping_spot_id"
                  :current-price="spot.price_per_night"
                  :show-update-button="isOwner"
                  @update-price="handlePriceUpdate"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Booking Card -->
        <div class="lg:col-span-1">
          <div class="sticky top-8">
            <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div class="flex items-baseline justify-between mb-6">
                <div>
                  <span class="text-2xl font-bold">€{{ spot.price_per_night }}</span>
                  <span class="text-gray-600">/night</span>
                </div>
              </div>
              
              <!-- Date Selection with Improved Styling -->
              <div class="space-y-4">
                <DateRangeSelector
                  v-model:startDate="dates.startDate"
                  v-model:endDate="dates.endDate"
                  :camping-spot-id="spot.camping_spot_id" 
                  @dateChange="calculateTotal"
                  class="date-range-selector w-full"
                />
                
                <div class="mt-4">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                  <select 
                    v-model="guests" 
                    class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    @change="calculateTotal">
                    <option v-for="n in spot.max_guests" :key="n" :value="n">{{ n }} {{ n === 1 ? 'guest' : 'guests' }}</option>
                  </select>
                </div>
                
                <div v-if="nights > 0" class="mt-6 space-y-4">
                  <div class="flex justify-between">
                    <p>€{{ spot.price_per_night }} x {{ nights }} nights</p>
                    <p>€{{ subtotal }}</p>
                  </div>
                  <div class="flex justify-between">
                    <p>Service fee (10%)</p>
                    <p>€{{ (subtotal * 0.1).toFixed(2) }}</p>
                  </div>
                  <div class="border-t border-gray-200 pt-4">
                    <div class="flex justify-between font-bold">
                      <p>Total</p>
                      <p>€{{ total.toFixed(2) }}</p>
                    </div>
                  </div>
                </div>
                
                <!-- Add a warning if dates overlap with blocked dates -->
                <div v-if="hasBlockedDates" class="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <p class="font-medium">These dates are unavailable for booking.</p>
                  <p>Please select different dates.</p>
                </div>

                <!-- Only show button when dates are available -->
                <button 
                  v-if="!hasBlockedDates && dates.startDate && dates.endDate"
                  @click="bookNow" 
                  :disabled="!canBook || loading"
                  class="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer mt-6"
                  :class="{ 'opacity-50 cursor-not-allowed': !canBook || loading }"
                >
                  <span v-if="loading">Processing...</span>
                  <span v-else>Reserve now</span>
                </button>

                <!-- Show a disabled state when there are no dates selected -->
                <button 
                  v-else-if="!hasBlockedDates && (!dates.startDate || !dates.endDate)" 
                  disabled
                  class="w-full bg-gray-300 text-gray-500 py-4 rounded-xl font-semibold cursor-not-allowed mt-6"
                >
                  Select dates to continue
                </button>
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Map Modal -->
    <div v-if="showMap" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div class="bg-white rounded-lg w-full max-w-4xl p-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Location</h3>
          <button @click="showMap = false" class="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        <div class="h-[60vh] rounded-lg overflow-hidden">
          <LocationMap 
            :latitude="Number(spot.location?.latitute)" 
            :longitude="Number(spot.location?.longtitute)"
            :spotTitle="spot.title"
          />
        </div>
      </div>
    </div>

    <!-- Image Gallery Modal -->
    <div v-if="showGallery" class="fixed inset-0 bg-black bg-opacity-90 z-[9999] transition-opacity duration-300">
      <button @click="showGallery = false" 
              class="absolute top-4 right-4 light-text text-4xl cursor-pointer hover:opacity-75 transition-colors"
      >&times;</button>
      <div class="h-full flex items-center justify-center">
        <button @click="previousImage" 
                class="absolute left-4 light-text text-4xl cursor-pointer hover:opacity-75 transition-colors p-4"
        >&lt;</button>
        <img :src="spot.images[currentImageIndex].image_url" 
             class="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" />
        <button @click="nextImage" 
                class="absolute right-4 light-text text-4xl cursor-pointer hover:opacity-75 transition-colors p-4"
        >&gt;</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDatesStore } from '@/stores/dates'
import { useAuthStore } from '@/stores/auth'
import axios from '@/axios'
import DateRangeSelector from '@/components/DateRangeSelector.vue'
import LocationMap from '@/components/LocationMap.vue'
import { useToast } from 'vue-toastification'
import AvailabilityCalendar from '@/components/AvailabilityCalendar.vue'
import PriceSuggestionWidget from '@/components/PriceSuggestionWidget.vue'

const toast = useToast()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const spot = ref(null)
const loading = ref(true)
const showMap = ref(false)
const showGallery = ref(false)
const currentImageIndex = ref(0)
const datesStore = useDatesStore()
const guests = ref(1)
const nights = ref(0)
const subtotal = ref(0)
const total = ref(0)
const dates = ref({
  startDate: '',
  endDate: ''
})

const averageRating = computed(() => {
  if (!spot.value?.reviews?.length) return 'No ratings'
  const avg = spot.value.reviews.reduce((acc, rev) => acc + rev.rating, 0) / spot.value.reviews.length
  return avg.toFixed(1)
})

const numberOfNights = computed(() => {
  if (!dates.value.startDate || !dates.value.endDate) return 0
  const start = new Date(dates.value.startDate)
  const end = new Date(dates.value.endDate)
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
})

// Add this to track blocked dates
const blockedDates = ref([]);
const hasBlockedDates = computed(() => {
  if (!blockedDates.value.length || !dates.value.startDate || !dates.value.endDate) return false;
  
  const start = new Date(dates.value.startDate);
  const end = new Date(dates.value.endDate);
  
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  return blockedDates.value.some(block => {
    const blockStart = new Date(block.start_date || block.start);
    const blockEnd = new Date(block.end_date || block.end);
    
    blockStart.setHours(0, 0, 0, 0);
    blockEnd.setHours(0, 0, 0, 0);
    
    // Check if ranges overlap
    return (
      (start <= blockEnd && end >= blockStart) || // Selected dates overlap with blocked period
      (start >= blockStart && end <= blockEnd)     // Selected dates are within blocked period
    );
  });
})

// Check if current user is the owner of this spot
const isOwner = computed(() => {
  return authStore.fullUser && spot.value?.owner_id === authStore.fullUser.user_id  
})

// Handle price update from PriceSuggestionWidget
const handlePriceUpdate = async (newPrice) => {
  try {
    if (!isOwner.value) return
    
    toast.info('Updating camping spot price...')
    
    await axios.patch(`/camping-spots/${spot.value.camping_spot_id}/price`, {
      price_per_night: newPrice
    })
    
    // Update the local spot data with new price
    spot.value.price_per_night = newPrice
    
    // Recalculate total price based on new price
    calculateTotal()
    
    toast.success('Price updated successfully!')
  } catch (error) {
    console.error('Failed to update price:', error)
    toast.error('Failed to update price. Please try again.')
  }
}

const goBackToCampers = () => {
  router.push({
    path: '/campers',
    query: {
      startDate: dates.value.startDate,
      endDate: dates.value.endDate 
    }
  });
}

const nextImage = () => {
  if (!spot.value?.images?.length) return
  currentImageIndex.value = (currentImageIndex.value + 1) % spot.value.images.length
}

const previousImage = () => {
  if (!spot.value?.images?.length) return
  currentImageIndex.value = currentImageIndex.value === 0
    ? spot.value.images.length - 1 
    : currentImageIndex.value - 1
}

// Improve date selection calculations
const calculateTotal = () => {
  if (!dates.value.startDate || !dates.value.endDate || !spot.value) return
  
  const start = new Date(dates.value.startDate)
  const end = new Date(dates.value.endDate)
  
  // Ensure valid dates with no time component
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    nights.value = 0
    subtotal.value = 0
    total.value = 0
    return
  }
  
  const diffTime = Math.abs(end - start)
  nights.value = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  subtotal.value = spot.value.price_per_night * nights.value
  
  // Calculate service fee (10% of subtotal)
  const serviceFee = subtotal.value * 0.1
  
  // Add service fee included
  total.value = subtotal.value + serviceFee
}

// Update the bookNow function to go directly to Stripe checkout
const bookNow = async () => {
  if (!canBook.value) {
    if (hasBlockedDates.value) {
      toast.error('Selected dates are not available for booking');
    } else if (!dates.value.startDate || !dates.value.endDate) {
      toast.error('Please select check-in and check-out dates');
    } else if (new Date(dates.value.startDate) >= new Date(dates.value.endDate)) {
      toast.error('Check-out date must be after check-in date');
    } else if (nights.value <= 0) {
      toast.error('Invalid date selection');
    }
    return;
  }
  
  if (!authStore.user) {
    router.push({
      path: '/auth',
      query: { 
        redirect: route.fullPath,
        startDate: dates.value.startDate,
        endDate: dates.value.endDate,
        guests: guests.value
      }
    });
    return;
  }
  
  loading.value = true;
  
  try {
    // Calculate base price and service fee
    const basePrice = spot.value.price_per_night * nights.value;
    const serviceFee = subtotal.value * 0.1;
    
    // Direct Stripe checkout creation
    const { data } = await axios.post('/api/bookings/create-checkout-session', {
      camping_spot_id: spot.value.camping_spot_id,
      user_id: authStore.fullUser.user_id,
      start_date: dates.value.startDate,
      end_date: dates.value.endDate,
      number_of_guests: guests.value,
      base_price: basePrice,
      service_fee: serviceFee.toFixed(2)
    });
    
    toast.success('Redirecting to payment...');
    
    // Redirect to Stripe checkout with a slight delay to show the toast
    setTimeout(() => {
      window.location.href = data.url;
    }, 500);
  } catch (error) {
    console.error('Booking Error:', error);
    if (error.response?.status === 400 && error.response?.data?.error) {
      toast.error(`Booking failed: ${error.response.data.error}`);
    } else {
      toast.error('Failed to process booking. Please try again later.');
    }
    loading.value = false;
  }
};

// Make sure canBook properly checks for all conditions
const canBook = computed(() => {
  return dates.value.startDate && 
         dates.value.endDate && 
         new Date(dates.value.startDate) < new Date(dates.value.endDate) &&
         nights.value > 0 &&
         !hasBlockedDates.value;
})

// Enhance the date change handler to check for blocked dates
const handleDateChange = async () => {
  calculateTotal();
  
  // Check if the dates are valid
  if (!dates.value.startDate || !dates.value.endDate) {
    return;
  }
  
  const start = new Date(dates.value.startDate);
  const end = new Date(dates.value.endDate);
  
  if (isNaN(start) || isNaN(end) || start >= end) {
    toast.warning('Please select a valid date range');
    return;
  }
  
  // Check if selected dates are blocked immediately
  if (hasBlockedDates.value) {
    toast.warning('The selected dates are unavailable for booking');
  }
  
  // Re-fetch availability from the server to ensure we have the latest data
  try {
    const { data } = await axios.get(`/camping-spots/${spot.value.camping_spot_id}/availability`, {
      params: {
        startDate: dates.value.startDate,
        endDate: dates.value.endDate
      }
    });
    
    handleBlockedDates(data.bookings || []);
    
    if (hasBlockedDates.value) {
      toast.warning('The selected dates are unavailable for booking');
    }
  } catch (error) {
    console.error('Failed to check availability:', error);
  }
}

const handleBlockedDates = (dates) => {
  blockedDates.value = dates.map(block => ({
    ...block,
    start_date: block.start_date || block.start,
    end_date: block.end_date || block.end
  }));
  
  // Re-check booking availability when blocked dates change
  calculateTotal();
};

onMounted(async () => {
  try {
    const id = route.params.id
    if (!id) throw new Error('No spot ID provided')

    // Priority: 1) Route query 2) Dates store 3) Default dates
    if (route.query.startDate && route.query.endDate) {
      dates.value = {
        startDate: route.query.startDate,
        endDate: route.query.endDate
      }
    } else if (datesStore.startDate && datesStore.endDate) {
      dates.value = {
        startDate: datesStore.startDate,
        endDate: datesStore.endDate
      }
    } else {
      dates.value = {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
      }
    }
    
    // Load the spot details
    const { data } = await axios.get(`/camping-spots/${id}`, {
      params: {
        startDate: dates.value.startDate,
        endDate: dates.value.endDate
      }
    });
    spot.value = data;
    
    // Fetch availability data
    try {
      const availabilityData = await axios.get(`/camping-spots/${id}/availability`, {
        params: {
          startDate: dates.value.startDate,
          endDate: dates.value.endDate
        }
      });
      
      handleBlockedDates(availabilityData.data.bookings || []);
    } catch (availError) {
      console.error('Failed to load availability:', availError);
    }
    
    // Ensure guest count is within the spot's limits
    if (spot.value && spot.value.max_guests) {
      guests.value = Math.min(Math.max(1, guests.value), spot.value.max_guests);
    }
    
    // Calculate totals after loading data
    calculateTotal();
    
  } catch (error) {
    console.error('API Error Details:', {
      response: error.response?.data,
      status: error.response?.status,
      message: error.message
    });
    
    if (error.response?.status === 404) {
      router.push('/404');
    } else {
      toast.error('Failed to load camping spot. Please try again later.');
    }
  } finally {
    loading.value = false;
  }
})
</script>

<style scoped>
.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Enhanced spacing utilities */
.space-y-12 > * + * {
  margin-top: 3rem;
}

.space-y-10 > * + * {
  margin-top: 2.5rem;
}

.space-y-8 > * + * {
  margin-top: 2rem;
}

.space-y-6 > * + * {
  margin-top: 1.5rem;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}

.space-y-2 > * + * {
  margin-top: 0.5rem;
}

/* Improved DateRangePicker styling */
.date-range-selector {
  padding: 10px 0;
  width: 100%;
}

:deep(.dp__main) {
  width: 100%;
}

/* Make DateRangePicker wider */
:deep(.dp__input) {
  padding: 10px 14px !important;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  line-height: 1.5;
  min-width: 320px;
}

/* Make DateRangePicker appear above all other elements */
:deep(.dp__input_wrap) {
  width: 100%;
}

:deep(.dp__overlay) {
  z-index: 9998 !important;
}

/* Make sure buttons are more clickable */
.light-text {
  color: white;
  font-size: 36px;
}

/* Navigation arrow styles */
.absolute {
  z-index: 10;
}

/* Transition for hover effects */
.transition-colors {
  transition: background-color 0.3s ease, border-color 0.15s ease;
}

.transition-opacity {
  transition: opacity 0.2s ease;
}
</style>