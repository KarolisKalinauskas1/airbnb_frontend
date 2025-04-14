<template>
  <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden">
    <div class="flex flex-col md:flex-row">
      <!-- Image Section -->
      <div class="w-full md:w-32 h-32 overflow-hidden">
        <img 
          v-if="booking.camping_spot?.images?.[0]"
          :src="booking.camping_spot.images[0].image_url" 
          :alt="booking.camping_spot.title"
          class="w-full h-full object-cover"
        />
        <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
          No image
        </div>
      </div>
      
      <!-- Booking Info -->
      <div class="p-4 w-full flex-1">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-semibold text-lg mb-1">
              {{ booking.camping_spot?.title || 'Camping Spot' }}
              <span 
                :class="statusClass" 
                class="ml-2 px-2 py-0.5 text-xs rounded-full inline-block font-medium"
              >
                {{ statusLabel }}
              </span>
            </h3>
            <p class="text-gray-600">
              {{ formatDate(booking.start_date) }} - {{ formatDate(booking.end_date) }}
            </p>
            <p class="text-gray-600">{{ booking.number_of_guests }} {{ booking.number_of_guests === 1 ? 'guest' : 'guests' }}</p>
            <div class="mt-1">
              <p class="text-gray-700">
                <span class="font-medium">Base price:</span> €{{ basePrice }}
              </p>
              <p class="text-gray-700">
                <span class="font-medium">Service fee:</span> €{{ serviceFee }}
              </p>
              <p class="font-medium text-red-600">
                <span class="font-medium">Total paid:</span> €{{ totalPaid }}
              </p>
            </div>
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
      <h3 class="text-xl font-semibold mb-4 text-red-600">Cancel Booking</h3>
      <div class="mb-6">
        <p class="text-gray-700 mb-4">
          Are you sure you want to cancel this booking?
        </p>
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          <p class="font-bold mb-2">⚠️ Warning</p>
          <p>This action cannot be undone and your payment will <span class="font-bold">not</span> be refunded.</p>
        </div>
      </div>
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
          Yes, Cancel Booking
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
  },
  refreshOnAction: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['booking-changed'])

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const showCancelModal = ref(false)

const statusLabel = computed(() => {
  const statusMap = {
    1: 'Pending',
    2: 'Confirmed',
    3: 'Cancelled',
    4: 'Completed',
    5: 'Unavailable'
  }
  
  return statusMap[props.booking.status_id] || 'Unknown'
})

const statusClass = computed(() => {
  const classMap = {
    1: 'bg-yellow-100 text-yellow-800', // Pending
    2: 'bg-green-100 text-green-800',   // Confirmed
    3: 'bg-red-100 text-red-800',       // Cancelled
    4: 'bg-blue-100 text-blue-800',     // Completed
    5: 'bg-gray-100 text-gray-800'      // Unavailable
  }
  
  return classMap[props.booking.status_id] || 'bg-gray-100 text-gray-800'
})

// Get the actual total paid from transaction if available
const totalPaid = computed(() => {
  if (props.booking?.transaction?.[0]?.amount) {
    return parseFloat(props.booking.transaction[0].amount).toFixed(2);
  }
  return props.booking?.cost || '0.00';
})

// Calculate base price (price without service fee)
const basePrice = computed(() => {
  if (!props.booking?.cost) return '0.00';
  
  // If we have transaction data, use it to derive the base price
  if (props.booking?.transaction?.[0]?.amount) {
    const serviceFeeValue = parseFloat(serviceFee.value);
    const totalValue = parseFloat(props.booking.transaction[0].amount);
    return (totalValue - serviceFeeValue).toFixed(2);
  }
  
  // Fallback to booking cost without service fee calculation
  const total = parseFloat(props.booking.cost);
  return (total / 1.1).toFixed(2); // Estimate: Base price is total / 1.1 (removing 10% service fee)
})

// Calculate service fee
const serviceFee = computed(() => {
  if (!props.booking?.cost) return '0.00';
  
  // If we have transaction data, use it to determine service fee
  if (props.booking?.transaction?.[0]?.amount) {
    const totalPaid = parseFloat(props.booking.transaction[0].amount);
    const bookingCost = parseFloat(props.booking.cost);
    return (totalPaid - bookingCost).toFixed(2);
  }
  
  // Fallback to estimated service fee calculation
  const total = parseFloat(props.booking.cost);
  const base = parseFloat(basePrice.value);
  return (total - base).toFixed(2);
})

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

const canCancel = computed(() => {
  if (!props.booking?.start_date || props.booking.status_id !== 2) return false;
  const today = new Date();
  const startDate = new Date(props.booking.start_date);
  const daysDiff = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
  return daysDiff > 2; // Can cancel confirmed bookings if more than 2 days before check-in
})

const confirmCancel = () => {
  showCancelModal.value = true;
}

// Add a method to force reload booking details after actions
const refreshBookingDetails = async () => {
  if (props.refreshOnAction) {
    emit('booking-changed', props.booking.booking_id)
  }
}

const handleCancel = async () => {
  try {
    await axios.post(`/api/bookings/${props.booking.booking_id}/cancel`);
    await authStore.fetchFullUserInfo(true); // Force refresh
    toast.success('Booking cancelled successfully');
    await refreshBookingDetails();
  } catch (error) {
    toast.error(error.response?.data?.error || 'Failed to cancel booking');
  } finally {
    showCancelModal.value = false;
  }
}
</script>

<style scoped>
.bg-white {
  transition: all 0.2s ease;
}
</style>
