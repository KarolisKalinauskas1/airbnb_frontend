<template>
  <div class="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
    <div class="flex gap-4">
      <!-- Image -->
      <div class="w-32 h-24 flex-shrink-0">
        <img 
          v-if="booking.camping_spot?.images?.[0]"
          :src="booking.camping_spot.images[0].image_url"
          :alt="booking.camping_spot.title"
          class="w-full h-full object-cover rounded-lg"
        />
        <div v-else class="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
          <span class="text-gray-400">No image</span>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-grow">
        <div class="flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-medium text-lg">{{ booking.camping_spot?.title }}</h3>
              <span :class="statusClass">{{ getStatusText }}</span>
            </div>
            <p class="text-gray-600">
              {{ formatDate(booking.start_date) }} - {{ formatDate(booking.end_date) }}
            </p>
            <p class="text-gray-600">{{ booking.number_of_guests }} {{ booking.number_of_guests === 1 ? 'guest' : 'guests' }}</p>
            <p class="font-medium text-red-600 mt-1">€{{ booking.cost }}</p>
          </div>
          <button 
            v-if="canCancel"
            @click="confirmCancel"
            class="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Cancel booking
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Cancel Confirmation Modal -->
  <div v-if="showCancelModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-xl font-semibold mb-4">Cancel Booking</h3>
      <p class="text-gray-600 mb-6">
        Are you sure you want to cancel this booking? Please note that this action cannot be undone and the payment is non-refundable.
      </p>
      <div class="flex justify-end gap-4">
        <button 
          @click="showCancelModal = false"
          class="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Keep booking
        </button>
        <button 
          @click="handleCancel"
          class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Yes, cancel booking
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import axios from '@/axios'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  booking: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const toast = useToast()
const showCancelModal = ref(false)
const authStore = useAuthStore()

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const getStatusText = computed(() => {
  const statusMap = {
    2: 'Confirmed',
    3: 'Cancelled',
    4: 'Completed'
  }
  return statusMap[props.booking.status_id] || 'Unknown'
})

const statusClass = computed(() => {
  const baseClasses = 'text-xs px-2 py-1 rounded-full'
  const statusClasses = {
    2: 'bg-green-100 text-green-800',   // Confirmed
    3: 'bg-red-100 text-red-800',       // Cancelled
    4: 'bg-blue-100 text-blue-800'      // Completed
  }
  return `${baseClasses} ${statusClasses[props.booking.status_id] || 'bg-gray-100 text-gray-800'}`
})

const canCancel = computed(() => {
  if (!props.booking?.start_date || props.booking.status_id !== 2) return false
  const today = new Date()
  const startDate = new Date(props.booking.start_date)
  const daysDiff = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24))
  return daysDiff > 2 // Can cancel confirmed bookings if more than 2 days before check-in
})

const confirmCancel = () => {
  showCancelModal.value = true
}

const handleCancel = async () => {
  try {
    await axios.post(`/api/bookings/${props.booking.booking_id}/cancel`)
    await authStore.fetchFullUserInfo(true) // Force refresh
    toast.success('Booking cancelled successfully')
  } catch (error) {
    toast.error(error.response?.data?.error || 'Failed to cancel booking')
  } finally {
    showCancelModal.value = false
  }
}
</script>
