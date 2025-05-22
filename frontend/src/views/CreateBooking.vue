<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-5xl mx-auto px-4">
      <!-- Back Button -->
      <button 
        @click="goBack" 
        class="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors hover:shadow"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500"></div>
      </div>
      
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Booking Form Section -->
        <div class="lg:col-span-2 space-y-8">
          <div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
            <h1 class="text-2xl font-semibold mb-6 border-b pb-4">Complete your booking</h1>

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
                  class="text-red-500 underline cursor-pointer hover:text-red-700"
                >
                  {{ editingDates ? 'Close' : 'Edit' }}
                </button>
              </div>
              
              <div v-if="editingDates" class="my-4">
                <DateRangeSelector
                  v-model:startDate="dates.startDate"
                  v-model:endDate="dates.endDate"
                  @dateChange="handleDateChange"
                  class="w-full"
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
                  class="text-red-500 underline cursor-pointer hover:text-red-700"
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
              <h3 class="font-medium mb-2 flex items-center">
                <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Cancellation Policy
              </h3>
              <p class="text-sm text-gray-600">Free cancellation for 48 hours before check-in. After that, cancel before check-in to receive a partial refund. <button class="text-red-500 underline">Review the full policy</button></p>
            </div>
          </div>
          
          <!-- Ground Rules -->
          <div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
            <h2 class="text-lg font-medium mb-4">Ground rules</h2>
            <p class="text-gray-600 text-sm mb-5">We ask all guests to remember a few simple rules to be a great guest.</p>
            
            <ul class="space-y-3 text-sm">
              <li class="flex items-start">
                <svg class="w-5 h-5 mr-2 text-gray-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Follow the camping site rules</span>
              </li>
              <li class="flex items-start">
                <svg class="w-5 h-5 mr-2 text-gray-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Respect your host's camping area and amenities</span>
              </li>
              <li class="flex items-start">
                <svg class="w-5 h-5 mr-2 text-gray-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Leave the spot as you found it</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Order Summary Section -->
        <div class="lg:col-span-1 space-y-6">
          <div class="sticky top-6">
            <div class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100">
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
                  <div class="mt-1 text-sm flex items-center">
                    <span class="text-yellow-500">★</span>
                    <span>4.9 ({{ spot?.reviews?.length || '52' }} reviews)</span>
                  </div>
                </div>
              </div>
              
              <!-- Use the CheckoutSummary component -->
              <CheckoutSummary 
                :basePrice="spot?.price_per_night || 0" 
                :nights="nights"
                :serviceFeePercent="10"
              />
              
              <!-- Error Message -->
              <div v-if="bookingError" class="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-red-700 text-sm">{{ bookingError }}</p>
              </div>
              
              <!-- Checkout Button -->
              <button 
                @click="processBooking"
                :disabled="loading || datesAreBlocked"
                class="w-full mt-6 bg-gradient-to-r from-rose-500 to-red-600 text-white py-4 rounded-lg font-medium hover:from-rose-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                :class="{'opacity-50 cursor-not-allowed transform-none shadow-none': loading || datesAreBlocked}"
              >
                {{ loading ? 'Processing...' : 'Confirm and Pay' }}
              </button>
              
              <p class="mt-4 text-xs text-gray-500 text-center">
                By confirming, you agree to the <a href="#" class="text-red-600 hover:underline">Terms of Service</a> and <a href="#" class="text-red-600 hover:underline">Privacy Policy</a>.
              </p>
            </div>
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
import CheckoutSummary from '@/components/CheckoutSummary.vue'
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
  // Update URL with selected dates
  router.replace({ 
    query: { 
      ...route.query,
      startDate: dates.value.startDate,
      endDate: dates.value.endDate,
      guests: guestCount.value
    }
  });
  
  // Save to localStorage as backup
  localStorage.setItem('campingDates', JSON.stringify({
    startDate: dates.value.startDate,
    endDate: dates.value.endDate,
    lastUpdated: new Date().toISOString()
  }));
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
    const basePrice = spot.value.price_per_night * nights.value;
    const serviceFee = basePrice * 0.1; // 10% service fee
    const totalAmount = basePrice + serviceFee;
    
    // Use the endpoint the frontend is already using
    const { data } = await axios.post('/api/checkout/create-session', {
      camper_id: spot.value.camping_spot_id,
      user_id: authStore.fullUser.user_id,
      start_date: dates.value.startDate,
      end_date: dates.value.endDate,
      number_of_guests: guestCount.value,
      cost: basePrice.toFixed(2),       // Base cost without service fee
      service_fee: serviceFee.toFixed(2), // Add service fee explicitly
      total: totalAmount.toFixed(2),     // Total amount including service fee
      spot_name: spot.value.title
    });
    
    toast.success('Redirecting to payment...');
    
    // Set a small timeout to allow the toast to display
    setTimeout(() => {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    }, 500);
  } catch (error) {
    console.error('Booking Error:', error);
    loading.value = false;
    bookingError.value = error.response?.data?.error || 'Failed to process booking';
    toast.error(bookingError.value);
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

.rounded-xl {
  border-radius: 0.75rem;
}

.shadow-md {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.shadow-xl {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Improve buttons */
button {
  outline: none !important;
}

button:focus {
  outline: none !important;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}
</style>
