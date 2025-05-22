<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-2xl mx-auto px-4">
      <button 
        @click="router.back()" 
        class="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <span class="text-xl">←</span> Back
      </button>

      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        <p class="mt-4 text-gray-600">Preparing your payment...</p>
      </div>

      <div v-else-if="!bookingDetails" class="text-center py-12 bg-white rounded-lg shadow-lg p-6">
        <p class="text-lg text-gray-600 mb-6">Payment information not found.</p>
        <button 
          @click="router.push('/campers')" 
          class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 cursor-pointer"
        >
          Return to Camping Spots
        </button>
      </div>

      <div v-else class="bg-white rounded-lg shadow-lg p-6">
        <h1 class="text-2xl font-semibold mb-6">Complete Payment</h1>
        
        <!-- Order Summary -->
        <div class="mb-8 border-b pb-6">
          <h2 class="text-lg font-medium mb-4">Order Summary</h2>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600">{{ bookingDetails.nights }} nights</span>
              <span>€{{ bookingDetails.base_price }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Service fee</span>
              <span>€{{ (bookingDetails.total - bookingDetails.base_price).toFixed(2) }}</span>
            </div>
            <div class="pt-4 border-t flex justify-between font-bold">
              <span>Total</span>
              <span>€{{ bookingDetails.total }}</span>
            </div>
          </div>
        </div>

        <!-- Payment Button -->
        <div>
          <p v-if="errorMessage" class="text-red-500 mb-4">{{ errorMessage }}</p>
          
          <button 
            @click="handleCheckout"
            :disabled="processing"
            class="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <span v-if="processing">Processing...</span>
            <span v-else>Proceed to Checkout</span>
          </button>
          
          <p class="mt-4 text-sm text-gray-500 text-center">
            You'll be redirected to Stripe's secure payment page.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/axios'
import { useToast } from 'vue-toastification'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(true)
const processing = ref(false)
const errorMessage = ref('')
const bookingDetails = ref(null)

onMounted(async () => {
  try {
    // Get booking details from query string
    const bookingDetailsParam = route.query.bookingDetails
    
    if (!bookingDetailsParam) {
      toast.error('No booking details found')
      loading.value = false
      return
    }
    
    // Parse the JSON string from query parameter
    bookingDetails.value = JSON.parse(bookingDetailsParam)
    
    if (!bookingDetails.value) {
      throw new Error('Invalid booking details')
    }
  } catch (error) {
    console.error('Initialization error:', error)
    errorMessage.value = error.message || 'Failed to initialize payment'
    toast.error('Failed to initialize payment')
  } finally {
    loading.value = false
  }
})

const handleCheckout = async () => {
  if (!bookingDetails.value) {
    errorMessage.value = 'Booking details not found'
    return
  }
  
  processing.value = true
  errorMessage.value = ''

  try {
    // Create a checkout session with better error handling
    const { data } = await axios.post('/api/checkout/create-session', {
      booking: bookingDetails.value
    })
    
    // Check if we got a valid URL back
    if (!data || !data.url) {
      throw new Error('Invalid response from payment service')
    }
    
    // Redirect to the Stripe Checkout page
    window.location.href = data.url
  } catch (error) {
    console.error('Checkout error:', error)
    const errorMsg = error.response?.data?.error || 'Failed to initialize checkout'
    errorMessage.value = errorMsg
    toast.error('Payment failed: ' + errorMsg)
  } finally {
    processing.value = false
  }
}
</script>
