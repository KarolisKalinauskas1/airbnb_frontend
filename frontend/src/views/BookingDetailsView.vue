<template>
  <div class="min-h-screen bg-gray-50 py-12">
    <div class="max-w-3xl mx-auto px-4">
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div v-if="loading" class="text-center py-8">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
        </div>
        
        <div v-else-if="booking">
          <h1 class="text-2xl font-semibold mb-6">Booking Details</h1>
          
          <!-- Booking Info -->
          <div class="space-y-6">
            <div class="border-b pb-6">
              <h2 class="text-lg font-medium mb-4">Camping Spot</h2>
              <div class="flex gap-4">
                <img 
                  v-if="booking.camping_spot?.images?.[0]"
                  :src="booking.camping_spot.images[0].image_url"
                  :alt="booking.camping_spot.title"
                  class="w-24 h-24 object-cover rounded-lg"
                />
                <div>
                  <h3 class="font-medium">{{ booking.camping_spot?.title }}</h3>
                  <p class="text-gray-600">{{ booking.camping_spot?.location?.city }}, {{ booking.camping_spot?.location?.country?.name }}</p>
                </div>
              </div>
            </div>

            <!-- Stay Details -->
            <div class="border-b pb-6">
              <h2 class="text-lg font-medium mb-4">Stay Details</h2>
              <div class="space-y-2">
                <p><span class="text-gray-600">Check-in:</span> {{ formatDate(booking.start_date) }}</p>
                <p><span class="text-gray-600">Check-out:</span> {{ formatDate(booking.end_date) }}</p>
                <p><span class="text-gray-600">Guests:</span> {{ booking.number_of_guests }}</p>
                <p><span class="text-gray-600">Total Cost:</span> €{{ booking.cost }}</p>
                <p><span class="text-gray-600">Contact:</span> {{ booking.phone_number }}</p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-4">
              <button
                v-if="canCancel"
                @click="confirmCancel"
                class="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50"
              >
                Cancel Booking
              </button>
              <router-link
                to="/account"
                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Back to Account
              </router-link>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8">
          <p class="text-gray-600">Booking not found</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/axios'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const booking = ref(null)
const loading = ref(true)

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const canCancel = computed(() => {
  if (!booking.value?.start_date) return false
  const today = new Date()
  const startDate = new Date(booking.value.start_date)
  const daysDiff = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24))
  return daysDiff > 2 // Can cancel if more than 2 days before check-in
})

const confirmCancel = async () => {
  if (confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
    try {
      await axios.post(`/api/bookings/${route.params.id}/cancel`)
      await authStore.fetchFullUserInfo(true) // Force refresh
      toast.success('Booking cancelled successfully')
      router.push('/account')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel booking')
    }
  }
}

onMounted(async () => {
  try {
    const { data } = await axios.get(`/api/bookings/${route.params.id}`)
    booking.value = data
  } catch (error) {
    toast.error('Failed to load booking details')
  } finally {
    loading.value = false
  }
})
</script>
