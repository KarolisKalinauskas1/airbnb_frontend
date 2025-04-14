<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12">
    <div class="max-w-xl mx-auto px-4">
      <div class="text-center">
        <div class="bg-white rounded-xl shadow-lg p-8">
          <!-- Loading State -->
          <div v-if="loading" class="py-10">
            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto"></div>
            <p class="mt-6 text-gray-600">Processing your booking...</p>
          </div>
          
          <!-- Error State -->
          <div v-else-if="error" class="py-10">
            <div class="w-20 h-20 bg-red-100 rounded-full mx-auto flex items-center justify-center">
              <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 class="mt-8 text-2xl font-semibold text-gray-900">Something went wrong</h2>
            <p class="mt-3 text-red-600">{{ error }}</p>
            
            <div class="mt-10 space-y-4">
              <router-link 
                to="/" 
                class="block w-full px-6 py-3 text-center border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Return to Home
              </router-link>
              <button 
                @click="retryProcessing" 
                class="block w-full px-6 py-3 text-center text-red-600 hover:text-red-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
          
          <!-- Success State -->
          <div v-else class="py-6">
            <div class="success-animation">
              <div class="checkmark-circle">
                <div class="background"></div>
                <div class="checkmark draw"></div>
              </div>
            </div>
            
            <h2 class="mt-6 text-2xl font-semibold text-gray-900">Booking Confirmed!</h2>
            <p class="mt-3 text-gray-600">Thank you for your booking. Your payment has been processed successfully.</p>
            
            <div class="mt-8 border-t border-b border-gray-100 py-6">
              <div class="flex flex-col items-center">
                <span class="text-sm text-gray-500">Booking Reference</span>
                <span class="text-xl font-bold text-gray-900">{{ bookingId }}</span>
              </div>
            </div>
            
            <div class="mt-8 space-y-4">
              <router-link 
                v-if="bookingId"
                :to="{ name: 'booking-details', params: { id: bookingId }}" 
                class="block w-full px-6 py-3 text-center bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-lg hover:from-rose-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg"
              >
                View Booking Details
              </router-link>
              
              <router-link 
                to="/account" 
                class="block w-full px-6 py-3 text-center border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go to Account
              </router-link>
              
              <router-link 
                to="/" 
                class="block w-full px-6 py-3 text-center text-gray-600 hover:text-gray-800 transition-colors"
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
import { useRoute, useRouter } from 'vue-router'
import axios from '@/axios'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const bookingId = ref(null)
const loading = ref(true)
const error = ref(null)
const requestInProgress = ref(false)

// Process booking only once per session
const processBookingSession = async () => {
  try {
    // Don't run if a request is already in progress
    if (requestInProgress.value) {
      console.log('Request already in progress, skipping duplicate call')
      return false
    }
    
    requestInProgress.value = true
    const sessionId = route.query.session_id
    
    if (!sessionId) {
      loading.value = false
      error.value = 'No session information found'
      return false
    }
    
    // Check if we already processed this specific session
    const processedKey = `booking_processed_${sessionId}`
    if (sessionStorage.getItem(processedKey)) {
      console.log('Session already processed, using cached booking ID')
      bookingId.value = sessionStorage.getItem('booking_id')
      loading.value = false
      return true
    }
    
    console.log('Processing payment session:', sessionId)
    
    // Call the backend only once per session
    const { data } = await axios.get(`/api/bookings/success`, {
      params: { session_id: sessionId }
    })
    
    if (data && data.booking_id) {
      bookingId.value = data.booking_id
      
      // Store in session storage to prevent duplicate processing
      sessionStorage.setItem(processedKey, 'true')
      sessionStorage.setItem('booking_id', data.booking_id)
      
      // Update user info to include the new booking
      await authStore.fetchFullUserInfo(true)
      
      // Only show success message once
      if (!sessionStorage.getItem('success_toast_shown')) {
        toast.success('Booking confirmed successfully!')
        sessionStorage.setItem('success_toast_shown', 'true')
      }
      
      return true
    }
    
    throw new Error(data.error || 'Invalid response from server')
  } catch (err) {
    console.error('Failed to process booking session:', err)
    error.value = err.response?.data?.error || 'Failed to verify booking status. Please contact support.'
    return false
  } finally {
    loading.value = false
    requestInProgress.value = false
  }
}

onMounted(async () => {
  const sessionId = route.query.session_id
  
  // Completely prevent duplicate processing
  if (sessionId) {
    const processedKey = `booking_processed_${sessionId}`
    if (sessionStorage.getItem(processedKey)) {
      console.log('Using cached booking info')
      bookingId.value = sessionStorage.getItem('booking_id')
      loading.value = false
      return
    }
  }
  
  await processBookingSession()
})
</script>

<style scoped>
/* Checkmark animation */
.success-animation {
  margin: 0 auto;
  width: 80px;
  height: 80px;
}

.checkmark-circle {
  width: 80px;
  height: 80px;
  position: relative;
  display: inline-block;
  vertical-align: top;
  margin-left: auto;
  margin-right: auto;
}

.checkmark-circle .background {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f0fdf4;
  position: absolute;
}

.checkmark-circle .checkmark {
  border-radius: 5px;
}

.checkmark-circle .checkmark.draw:after {
  animation-delay: 0.3s;
  animation-duration: 0.8s;
  animation-timing-function: ease;
  animation-name: checkmark;
  transform: scaleX(-1) rotate(135deg);
  animation-fill-mode: forwards;
}

.checkmark-circle .checkmark:after {
  opacity: 0;
  height: 40px;
  width: 18px;
  transform-origin: left top;
  border-right: 7px solid #22c55e;
  border-top: 7px solid #22c55e;
  border-radius: 2px;
  content: '';
  left: 20px;
  top: 40px;
  position: absolute;
}

@keyframes checkmark {
  0% {
    height: 0;
    width: 0;
    opacity: 1;
  }
  20% {
    height: 0;
    width: 18px;
    opacity: 1;
  }
  40% {
    height: 40px;
    width: 18px;
    opacity: 1;
  }
  100% {
    height: 40px;
    width: 18px;
    opacity: 1;
  }
}
</style>
