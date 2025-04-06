<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-6xl mx-auto px-4">
      <button 
        @click="router.back()" 
        class="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <span class="text-xl">←</span> Back
      </button>

      <h1 class="text-2xl font-semibold mb-6">Complete your booking</h1>
      
      <div v-if="loading" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
      </div>
      
      <div v-else-if="!spot" class="text-center py-8">
        <p class="text-gray-600">Spot not found</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: Booking Details -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Login Required Message -->
          <div v-if="!authStore.user" class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4">Login Required</h3>
            <p class="text-gray-600 mb-4">Please log in to complete your booking</p>
            <router-link 
              :to="{ 
                path: '/auth',
                query: { redirect: $route.fullPath }
              }"
              class="inline-block bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 cursor-pointer"
            >
              Login to Continue
            </router-link>
          </div>

          <!-- Booking Form -->
          <form v-else @submit.prevent="handleSubmit">
            <!-- Dates Section -->
            <div class="bg-white rounded-lg shadow p-6 mb-4">
              <div class="flex justify-between items-center mb-4">
                <div>
                  <h3 class="font-medium text-lg">Your trip dates</h3>
                  <div v-if="!editingDates" class="text-gray-600">
                    {{ formatDate(dates.startDate) }} - {{ formatDate(dates.endDate) }}
                    <span class="text-gray-500 text-sm">({{ numberOfNights }} nights)</span>
                  </div>
                </div>
                <button 
                  type="button"
                  @click="editingDates = !editingDates"
                  class="text-red-600 underline cursor-pointer"
                >
                  {{ editingDates ? 'Cancel' : 'Edit' }}
                </button>
              </div>
              <DateRangeSelector
                v-if="editingDates"
                v-model:startDate="dates.startDate"
                v-model:endDate="dates.endDate"
                @dateChange="handleDateChange"
                class="w-full"
              />
            </div>

            <!-- Guests Section -->
            <div class="bg-white rounded-lg shadow p-6 mb-4">
              <div class="flex justify-between items-center mb-4">
                <div>
                  <h3 class="font-medium text-lg">Guests</h3>
                  <div v-if="!editingGuests" class="text-gray-600">
                    {{ guests }} {{ guests === 1 ? 'guest' : 'guests' }}
                  </div>
                </div>
                <button 
                  type="button"
                  @click="editingGuests = !editingGuests"
                  class="text-red-600 underline cursor-pointer"
                >
                  {{ editingGuests ? 'Cancel' : 'Edit' }}
                </button>
              </div>
              <div v-if="editingGuests" class="flex items-center gap-4">
                <button 
                  type="button"
                  @click="decrementGuests"
                  class="w-10 h-10 rounded-full border-2 border-red-500 flex items-center justify-center hover:bg-red-50 transition-colors text-red-500"
                  :disabled="guests <= 1"
                >-</button>
                <span class="text-xl font-medium">{{ guests }}</span>
                <button 
                  type="button"
                  @click="incrementGuests"
                  class="w-10 h-10 rounded-full border-2 border-red-500 flex items-center justify-center hover:bg-red-50 transition-colors text-red-500"
                  :disabled="guests >= spot.max_guests"
                >+</button>
                <span class="text-sm text-gray-500">(Max: {{ spot.max_guests }} guests)</span>
              </div>
            </div>

            <!-- Phone Number Section -->
            <div class="bg-white rounded-lg shadow p-6 mb-4 border-2 border-red-100">
              <div class="mb-4">
                <h3 class="font-medium text-lg flex items-center gap-2">
                  Contact number <span class="text-red-500">*</span>
                  <span class="text-sm text-red-500 font-normal">(Required for booking)</span>
                </h3>
              </div>
              <input 
                v-model="phoneNumber"
                type="tel"
                required
                placeholder="Enter your phone number (e.g. +32412345678)"
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                :class="{'border-red-500': phoneNumberError}"
                @input="handlePhoneInput"
              >
              <p v-if="phoneNumberError" class="mt-1 text-sm text-red-500">
                {{ phoneNumberError }}
              </p>
            </div>

            <!-- Add cursor-pointer to all action buttons -->
            <div class="bg-white rounded-lg shadow p-6 mb-4">
              <h3 class="font-medium text-lg mb-4">Payment Details</h3>
            </div>

            <button 
              type="submit"
              class="w-full py-4 rounded-xl font-semibold shadow-md transition-all duration-200"
              :class="[
                !loading && phoneNumber && !phoneNumberError
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              ]"
              :disabled="loading || !phoneNumber || phoneNumberError"
            >
              Continue to Payment
            </button>
            <p v-if="bookingError" class="mt-2 text-red-500 text-sm">{{ bookingError }}</p>
          </form>
        </div>

        <!-- Right Column: Spot Overview -->
        <div class="lg:col-span-1">
          <div class="sticky top-8">
            <div class="bg-white rounded-lg shadow p-6">
              <!-- Spot Preview -->
              <div class="flex gap-4 pb-6 border-b">
                <img 
                  :src="spot.images[0]?.image_url" 
                  :alt="spot.title"
                  class="w-24 h-24 object-cover rounded-lg"
                >
                <div>
                  <h3 class="font-medium text-sm text-gray-500">{{ spot.title }}</h3>
                  <p class="text-sm text-gray-600">{{ formatLocation(spot.location) }}</p>
                  <div class="flex items-center gap-1 mt-1">
                    <span class="text-yellow-400">★</span>
                    <span class="text-sm">{{ averageRating }}</span>
                  </div>
                </div>
              </div>

              <!-- Price Breakdown Only -->
              <div class="py-6 space-y-4">
                <div class="flex justify-between">
                  <span class="text-gray-600">€{{ spot.price_per_night }} × {{ numberOfNights }} nights</span>
                  <span>€{{ totalPrice }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Service fee</span>
                  <span>€{{ serviceFee }}</span>
                </div>
                <div class="pt-4 border-t flex justify-between font-bold">
                  <span>Total</span>
                  <span>€{{ grandTotal }}</span>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from '@/axios'
import DateRangeSelector from '@/components/DateRangeSelector.vue'
import { useToast } from 'vue-toastification'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const loading = ref(true)
const spot = ref(null)
const guests = ref(1)
const phoneNumber = ref('')
const phoneNumberError = ref('')
const bookingError = ref(null);

const dates = ref({
  startDate: route.query.startDate || '',
  endDate: route.query.endDate || ''
})

const numberOfNights = computed(() => {
  if (!dates.value.startDate || !dates.value.endDate) return 0
  const start = new Date(dates.value.startDate)
  const end = new Date(dates.value.endDate)
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
})

const totalPrice = computed(() => {
  return (spot.value?.price_per_night * numberOfNights.value).toFixed(2)
})

const serviceFee = computed(() => {
  return (parseFloat(totalPrice.value) * 0.10).toFixed(2)
})

const grandTotal = computed(() => {
  return (parseFloat(totalPrice.value) + parseFloat(serviceFee.value)).toFixed(2)
})

const formatLocation = (location) => {
  if (!location) return ''
  return `${location.city}, ${location.country.name}`
}

const decrementGuests = () => {
  if (guests.value > 1) guests.value--
}

const incrementGuests = () => {
  if (guests.value < spot.value.max_guests) guests.value++
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

const handlePhoneInput = (e) => {
  phoneNumber.value = e.target.value
  validatePhoneNumber(phoneNumber.value)
}

const validatePhoneNumber = (number) => {
  phoneNumberError.value = '' // Clear previous error
  
  if (!number?.trim()) {
    phoneNumberError.value = 'Phone number is required'
    return false
  }

  // Remove any spaces and non-numeric characters except + sign
  const cleanNumber = number.replace(/[^\d+]/g, '')
  
  if (cleanNumber.length < 10) {
    phoneNumberError.value = 'Phone number must be at least 10 digits'
    return false
  }
  
  if (cleanNumber.length > 15) {
    phoneNumberError.value = 'Phone number cannot exceed 15 digits'
    return false
  }
  
  if (!/^(\+|\d)/.test(cleanNumber)) {
    phoneNumberError.value = 'Phone number must start with + or a number'
    return false
  }

  return true  // Only return true if all validations pass
}

const handleSubmit = async () => {
  if (!validatePhoneNumber(phoneNumber.value)) return;
  
  loading.value = true;
  try {
    console.log('Creating checkout session with data:', {
      camping_spot_id: spot.value.camping_spot_id,
      user_id: authStore.fullUser.user_id,
      start_date: dates.value.startDate,
      end_date: dates.value.endDate,
      number_of_guests: guests.value,
      phone_number: phoneNumber.value,
      total: grandTotal.value,
    });

    const { data } = await axios.post('/api/bookings/create-checkout-session', {
      camping_spot_id: spot.value.camping_spot_id,
      user_id: authStore.fullUser.user_id,
      start_date: dates.value.startDate,
      end_date: dates.value.endDate,
      number_of_guests: guests.value,
      phone_number: phoneNumber.value,
      total: grandTotal.value
    });

    console.log('Checkout session created:', data);

    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No checkout URL received');
    }
  } catch (error) {
    console.error('Checkout Error:', error.response?.data || error.message);
    toast.error(error.response?.data?.error || 'Failed to create checkout session');
    loading.value = false;
  }
};

onMounted(async () => {
  try {
    const { data } = await axios.get(`/camping-spots/${route.params.id}`, {
      params: {
        startDate: dates.value.startDate,
        endDate: dates.value.endDate
      }
    })
    spot.value = data

    // If user has a phone number, pre-fill it
    if (authStore.fullUser?.phone_number) {
      phoneNumber.value = authStore.fullUser.phone_number
    }
  } catch (error) {
    console.error('Failed to load spot:', error)
  } finally {
    loading.value = false
  }
})

// Add new refs for edit states
const editingDates = ref(false)
const editingGuests = ref(false)
const editingPhone = ref(false)

// Format date helper
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Add computed for average rating
const averageRating = computed(() => {
  if (!spot.value?.reviews?.length) return 'New'
  const avg = spot.value.reviews.reduce((sum, review) => sum + review.rating, 0) / spot.value.reviews.length
  return avg.toFixed(1)
})
</script>

<style scoped>
.sticky {
  position: sticky;
  top: 2rem;
}
</style>
