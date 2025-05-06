<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-2xl mx-auto px-4">
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
        <p class="mt-4 text-gray-600">Processing your booking...</p>
      </div>
      
      <div v-else-if="error" class="bg-white rounded-lg shadow-lg p-6">
        <h1 class="text-2xl font-semibold mb-4 text-red-600">Booking Status Issue</h1>
        <p class="text-gray-700 mb-6">{{ error }}</p>
        <div class="flex flex-col space-y-4">
          <button 
            @click="retryProcessing" 
            class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Retry
          </button>
          <button 
            @click="router.push('/account')" 
            class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Go to Account
          </button>
        </div>
      </div>
      
      <div v-else-if="bookingId" class="bg-white rounded-lg shadow-lg p-6">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 class="text-2xl font-semibold">Booking Confirmed!</h1>
          <p class="text-gray-600 mt-1">Your booking has been successfully processed</p>
        </div>
        
        <div class="border-t border-b py-4 my-4">
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Booking ID:</span>
            <span class="font-semibold">{{ bookingId }}</span>
          </div>
        </div>
        
        <div class="flex flex-col space-y-4 mt-8">
          <button 
            @click="goToBookings" 
            class="w-full px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            View Your Bookings
          </button>
          <button 
            @click="router.push('/campers')" 
            class="w-full px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Continue Browsing
          </button>
        </div>
      </div>

      <div v-else class="bg-white rounded-lg shadow-lg p-6 text-center">
        <p class="text-lg text-gray-600 mb-6">No booking information found.</p>
        <button 
          @click="router.push('/campers')" 
          class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Return to Camping Spots
        </button>
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
import { corsResiliantRequest } from '@/utils/corsHelper'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const bookingId = ref(null)
const loading = ref(true)
const error = ref(null)
const requestInProgress = ref(false)

// Check for already processed session IDs
const isSessionAlreadyProcessed = (sessionId) => {
  try {
    const processedSessions = JSON.parse(localStorage.getItem('processedBookingSessions') || '[]')
    return processedSessions.includes(sessionId)
  } catch (err) {
    console.error('Error checking processed sessions:', err)
    return false
  }
}

// Mark a session ID as processed
const markSessionAsProcessed = (sessionId) => {
  try {
    const processedSessions = JSON.parse(localStorage.getItem('processedBookingSessions') || '[]')
    if (!processedSessions.includes(sessionId)) {
      processedSessions.push(sessionId)
      localStorage.setItem('processedBookingSessions', JSON.stringify(processedSessions))
    }
  } catch (err) {
    console.error('Error marking session as processed:', err)
  }
}

// Process booking only once per session
const processBookingSession = async () => {
  try {
    // Don't run if a request is already in progress
    if (requestInProgress.value) return
    
    requestInProgress.value = true
    const sessionId = route.query.session_id
    
    if (!sessionId) {
      throw new Error('No session ID provided')
    }
    
    // Check if the session ID has already been processed
    if (isSessionAlreadyProcessed(sessionId)) {
      console.log('Session ID already processed:', sessionId)
      loading.value = false
      return
    }
    
    console.log('Processing booking session with ID:', sessionId)
    
    // Use the API proxy with the correct endpoint
    const response = await axios.get('/api/bookings/success', {
      params: { session_id: sessionId }
    });
    
    console.log('Response data:', response.data)
    
    if (response.data && response.data.success && response.data.booking && response.data.booking.id) {
      bookingId.value = response.data.booking.id
      
      // Refresh user data to include the new booking
      await authStore.fetchFullUserInfo(true)
      
      toast.success('Booking confirmed successfully!')
      
      // Mark the session ID as processed
      markSessionAsProcessed(sessionId)
    } else {
      throw new Error('Invalid booking data received')
    }
  } catch (err) {
    console.error('Failed to process booking:', err)
    error.value = err.message || 'Failed to process your booking. Please try again or contact support.'
    toast.error(error.value)
  } finally {
    loading.value = false
    requestInProgress.value = false
  }
}

// Retry processing the booking
const retryProcessing = () => {
  loading.value = true
  error.value = null
  processBookingSession()
}

// Navigate to account bookings with highlighting for the new booking
const goToBookings = () => {
  router.push({
    path: '/account',
    query: { 
      tab: 'upcoming',
      id: bookingId.value
    }
  })
}

onMounted(() => {
  // If we have a session ID, process the booking
  if (route.query.session_id) {
    processBookingSession()
  } else {
    loading.value = false
  }
})
</script>
