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
          <p class="mt-2 text-gray-600">Your booking has been confirmed. You can view your booking details in your account.</p>
          <div class="mt-6 space-y-3">
            <div v-if="loading" class="text-center py-8">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            </div>
            <div v-else>
              <router-link 
                v-if="bookingId"
                :to="{ name: 'booking-details', params: { id: bookingId }}" 
                class="block w-full px-4 py-2 text-center bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                View Booking Details
              </router-link>
              <router-link 
                v-else
                to="/account" 
                class="block w-full px-4 py-2 text-center bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Go to Account
              </router-link>
              <router-link 
                to="/" 
                class="block w-full px-4 py-2 text-center text-gray-700 hover:text-gray-900"
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

const route = useRoute()
const toast = useToast()
const bookingId = ref(null)
const loading = ref(true)

onMounted(async () => {
  const sessionId = route.query.session_id
  if (!sessionId) {
    loading.value = false
    return
  }

  try {
    const { data } = await axios.get(`/api/bookings/session/${sessionId}`)
    if (data.success && data.bookingId) {
      bookingId.value = data.bookingId
    }
  } catch (error) {
    console.error('Failed to verify booking:', error)
    toast.error('Failed to verify booking status')
  } finally {
    loading.value = false
  }
})
</script>
