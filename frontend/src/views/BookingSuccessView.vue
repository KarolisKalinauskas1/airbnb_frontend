<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12">
    <div class="max-w-xl mx-auto px-4">
      <div class="text-center">
        <div class="bg-white rounded-lg shadow-lg p-8">
          <div class="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
            <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="mt-6 text-2xl font-semibold text-gray-900">Booking Successful!</h2>
          <p class="mt-2 text-gray-600">Thank you for your booking. We have received your payment.</p>
          
          <div class="mt-8">
            <div v-if="loading" class="text-center py-8">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
              <p class="mt-4 text-gray-600">Processing your booking...</p>
            </div>
            <div v-else-if="error" class="text-center text-red-500 py-4 bg-red-50 rounded-lg mb-6">
              {{ error }}
            </div>
            <div v-else>
              <router-link 
                v-if="bookingId"
                :to="{ name: 'booking-details', params: { id: bookingId }}" 
                class="block w-full px-4 py-2 text-center bg-red-500 text-white rounded-md hover:bg-red-600 cursor-pointer"
              >
                View Booking Details
              </router-link>
              <router-link 
                v-else
                to="/account" 
                class="block w-full px-4 py-2 text-center bg-red-500 text-white rounded-md hover:bg-red-600 cursor-pointer"
              >
                Go to Account
              </router-link>
              <router-link 
                to="/" 
                class="block w-full px-4 py-2 mt-4 text-center text-gray-700 hover:text-gray-900 cursor-pointer"
              >
                Return to Home
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from '@/axios'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()
const bookingId = ref(null)
const loading = ref(true)
const error = ref(null)

// Use sessionStorage to prevent multiple verifications
const isProcessed = sessionStorage.getItem('booking_processed')

onMounted(async () => {
  // If already processed, just show the booking ID
  if (isProcessed) {
    bookingId.value = sessionStorage.getItem('booking_id')
    loading.value = false
    return
  }
  
  const sessionId = route.query.session_id
  if (!sessionId) {
    loading.value = false
    error.value = 'No session information found'
    return
  }

  try {
    // Simple one-time verification
    const { data } = await axios.get(`/api/bookings/session/${sessionId}`)
    
    if (data.success && data.bookingId) {
      bookingId.value = data.bookingId
      
      // Mark as processed in sessionStorage
      sessionStorage.setItem('booking_processed', 'true')
      sessionStorage.setItem('booking_id', data.bookingId)
      
      // Update user info only once
      await authStore.fetchFullUserInfo(true)
      
      toast.success('Booking confirmed successfully!')
    } else {
      throw new Error(data.error || 'Invalid response from server')
    }
  } catch (err) {
    console.error('Failed to verify booking:', err)
    error.value = 'Failed to verify booking status. Please contact support.'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
})
</script>
