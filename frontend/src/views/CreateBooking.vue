<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-5xl mx-auto px-4">
      <!-- Back Button -->
      <button 
        @click="goBack" 
        class="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <span class="text-xl">←</span> Back
      </button>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
      
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Booking Form Section -->
        <div class="lg:col-span-2 space-y-8">
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h1 class="text-2xl font-semibold mb-6">Complete your booking</h1>

            <!-- Trip Details -->
            <div class="mb-8">
              <h2 class="text-lg font-medium mb-4">Trip Details</h2>
              
              <!-- Date Range -->
              <div class="flex justify-between items-center border-b pb-4 mb-4">
                <div>
                  <h3 class="font-medium">Dates</h3>
                  <p class="text-gray-600">{{ formatDateRange(dates.startDate, dates.endDate) }}</p>
                </div>
                <button 
                  @click="editingDates = !editingDates" 
                  class="text-red-600 underline cursor-pointer"
                >
                  {{ editingDates ? 'Close' : 'Edit' }}
                </button>
              </div>
              
              <div v-if="editingDates" class="my-4">
                <DateRangeSelector
                  v-model:startDate="dates.startDate"
                  v-model:endDate="dates.endDate"
                  @dateChange="handleDateChange"
                />
                
                <!-- Warning if selected dates are now blocked -->
                <div v-if="datesAreBlocked" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <p class="font-medium">These dates are unavailable for booking.</p>
                  <p>Please select different dates.</p>
                </div>
              </div>
              
              <!-- Guests -->
              <div class="flex justify-between items-center">
                <div>
                  <h3 class="font-medium">Guests</h3>
                  <div v-if="!editingGuests" class="text-gray-600">
                    {{ guestCount }} {{ guestCount === 1 ? 'guest' : 'guests' }}
                  </div>
                </div>
                <button 
                  type="button"
                  @click="editingGuests = !editingGuests"
                  class="text-red-600 underline cursor-pointer"
                >
                  {{ editingGuests ? 'Close' : 'Edit' }}
                </button>
              </div>
              <div v-if="editingGuests" class="flex items-center gap-4 mt-4">
                <button 
                  type="button"
                  @click="decrementGuests"
                  class="w-10 h-10 rounded-full border-2 border-red-500 flex items-center justify-center hover:bg-red-50 transition-colors text-red-500"
                  :disabled="guestCount <= 1"
                >-</button>
                <span class="text-xl font-medium">{{ guestCount }}</span>
                <button 
                  type="button"
                  @click="incrementGuests"
                  class="w-10 h-10 rounded-full border-2 border-red-500 flex items-center justify-center hover:bg-red-50 transition-colors text-red-500"
                  :disabled="spot && guestCount >= spot.max_guests"
                >+</button>
              </div>
            </div>

            <!-- Cancellation Policy -->
            <div class="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 class="font-medium mb-2">Cancellation Policy</h3>
              <p class="text-sm text-gray-600">Free cancellation for 48 hours. Cancel before checkin to receive a partial refund. Review the full policy.</p>
            </div>
          </div>
        </div>

        <!-- Order Summary Section -->
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-lg font-medium border-b pb-4 mb-4">Booking Summary</h2>
            
            <!-- Spot Preview -->
            <div class="flex gap-4 mb-6">
              <div class="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                <img 
                  v-if="spot?.images?.length" 
                  :src="spot.images[0].image_url" 
                  alt="Camping spot"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                  No image
                </div>
              </div>
              <div>
                <h3 class="font-medium">{{ spot?.title }}</h3>
                <p class="text-sm text-gray-600">{{ formatLocation(spot?.location) }}</p>
                <div class="mt-1 text-sm">
                  <span class="text-yellow-500">★</span>
                  <span>4.9 (52 reviews)</span>
                </div>
              </div>
            </div>
            
            <!-- Price Breakdown -->
            <div class="space-y-3 mb-6">
              <div class="flex justify-between">
                <p>€{{ spot?.price_per_night }} × {{ nights }} nights</p>
                <p>€{{ totalPrice }}</p>
              </div>
              <div class="flex justify-between">
                <p>Service fee</p>
                <p>€{{ serviceFee }}</p>
              </div>
              <div class="flex justify-between font-bold border-t pt-3 mt-3">
                <p>Total</p>
                <p>€{{ grandTotal }}</p>
              </div>
            </div>
            
            <!-- Error Message -->
            <div v-if="bookingError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-red-700 text-sm">{{ bookingError }}</p>
            </div>
            
            <!-- Checkout Button -->
            <button 
              @click="processBooking"
              :disabled="loading || datesAreBlocked"
              class="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
              :class="{'opacity-50 cursor-not-allowed': loading || datesAreBlocked}"
            >
              {{ loading ? 'Processing...' : 'Confirm and Pay' }}
            </button>
            
            <p class="mt-4 text-xs text-gray-500 text-center">
              By confirming, you agree to the <a href="#" class="text-red-600">Terms of Service</a> and <a href="#" class="text-red-600">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from '@/axios'
import DateRangeSelector from '@/components/DateRangeSelector.vue'
import { useToast } from 'vue-toastification'

const toast = useToast()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const spot = ref(null)
const guestCount = ref(1)
const editingDates = ref(false)
const editingGuests = ref(false)
const loading = ref(true)
const bookingError = ref(null)
const blockedDates = ref([])

const dates = ref({
  startDate: '',
  endDate: ''
})

// Calculate nights between dates
const nights = computed(() => {
  if (!dates.value.startDate || !dates.value.endDate) return 0
  
  const start = new Date(dates.value.startDate)
  const end = new Date(dates.value.endDate)
  
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
})

// Calculate price based on nights and base price
const totalPrice = computed(() => {
  if (!spot.value) return 0
  return (spot.value.price_per_night * nights.value).toFixed(2)
})

// Calculate service fee as 10% of total price
const serviceFee = computed(() => {
  return (parseFloat(totalPrice.value) * 0.10).toFixed(2)
})

const grandTotal = computed(() => {
  return (parseFloat(totalPrice.value) + parseFloat(serviceFee.value)).toFixed(2)
})

// Check if selected dates overlap with any blocked dates
const datesAreBlocked = computed(() => {
  if (!dates.value.startDate || !dates.value.endDate || blockedDates.value.length === 0) return false
  
  const start = new Date(dates.value.startDate)
  const end = new Date(dates.value.endDate)
  
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  
  return blockedDates.value.some(block => {
    const blockStart = new Date(block.start_date)
    const blockEnd = new Date(block.end_date)
    
    blockStart.setHours(0, 0, 0, 0)
    blockEnd.setHours(0, 0, 0, 0)
    
    // Check if the ranges overlap
    return (
      (start <= blockEnd && end >= blockStart) ||
      (start >= blockStart && end <= blockEnd)
    )
  })
})

const formatLocation = (location) => {
  if (!location) return ''
  return `${location.city}, ${location.country.name}`
}

const decrementGuests = () => {
  if (guestCount.value > 1) guestCount.value--
}

const incrementGuests = () => {
  if (spot.value && guestCount.value < spot.value.max_guests) guestCount.value++
}

const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return ''
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  return `${start.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} - ${end.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}`
}

const handleDateChange = () => {
  router.replace({ 
    query: { 
      ...route.query,
      startDate: dates.value.startDate,
      endDate: dates.value.endDate
    }
  })
}

const validateForm = () => {
  if (!dates.value.startDate || !dates.value.endDate) {
    toast.error('Please select check-in and check-out dates');
    return false;
  }

  if (!guestCount.value || guestCount.value < 1) {
    toast.error('Please select number of guests');
    return false;
  }

  if (datesAreBlocked.value) {
    toast.error('The selected dates are unavailable');
    return false;
  }

  return true;
}

const goBack = () => {
  router.push({
    path: `/camping-spots/${route.params.id}`,
    query: {
      startDate: dates.value.startDate,
      endDate: dates.value.endDate,
      guests: guestCount.value
    }
  });
}

const processBooking = async () => {
  if (!validateForm()) return;

  if (datesAreBlocked.value) {
    bookingError.value = 'The selected dates are unavailable for booking';
    toast.error('The selected dates are unavailable for booking');
    return;
  }
  
  loading.value = true;
  bookingError.value = null;

  try {
    const { data } = await axios.post('/bookings/create-checkout-session', {
      camping_spot_id: route.params.id,
      user_id: authStore.fullUser.user_id,
      start_date: dates.value.startDate,
      end_date: dates.value.endDate,
      number_of_guests: guestCount.value,
      base_price: spot.value.price_per_night
    });
    
    toast.success('Redirecting to payment...');
    
    // Set a small timeout to allow the toast to display
    setTimeout(() => {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    }, 500);
  } catch (error) {
    console.error('Booking Error:', error);
    bookingError.value = error.response?.data?.error || 'Failed to process booking';
    toast.error(bookingError.value);
  } finally {
    // Don't reset loading state here since we're redirecting
    // Only reset if there was an error
    if (bookingError.value) {
      loading.value = false;
    }
  }
};

// Fetch availability for date validation
const fetchAvailability = async () => {
  try {
    const { data } = await axios.get(`/camping-spots/${route.params.id}/availability`, {
      params: {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0]
      }
    });
    
    blockedDates.value = data.bookings || [];
  } catch (error) {
    console.error('Failed to fetch availability:', error);
  }
};

onMounted(async () => {
  try {
    // Set dates from query parameters
    if (route.query.startDate) dates.value.startDate = route.query.startDate;
    if (route.query.endDate) dates.value.endDate = route.query.endDate;
    
    // Set guest count from query parameters if available
    if (route.query.guests) {
      guestCount.value = parseInt(route.query.guests) || 1;
    }
    
    const { data } = await axios.get(`/camping-spots/${route.params.id}`, {
      params: {
        startDate: dates.value.startDate,
        endDate: dates.value.endDate
      }
    });
    spot.value = data;
    
    // Fetch availability data to check for blocked dates
    await fetchAvailability();
    
    // Make sure guest count is within spot limits
    if (spot.value) {
      guestCount.value = Math.min(Math.max(1, guestCount.value), spot.value.max_guests);
    }
  } catch (error) {
    console.error('Failed to load spot:', error);
    bookingError.value = 'Failed to load camping spot details';
    toast.error('Failed to load camping spot details');
  } finally {
    loading.value = false;
  }
});

// Watch for date changes to check availability
watch([() => dates.value.startDate, () => dates.value.endDate], () => {
  if (dates.value.startDate && dates.value.endDate) {
    // Check if dates are blocked
    if (datesAreBlocked.value) {
      toast.warning('These dates are not available for booking.');
    }
  }
});
</script>

<style scoped>
.rounded-lg {
  border-radius: 0.5rem;
}

.shadow-md {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
