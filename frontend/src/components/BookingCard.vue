<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 overflow-hidden" 
       :class="{ 'border-amber-200 bg-amber-50': booking.status_id === 3 }">
    <!-- Booking Card Header -->
    <div class="flex items-center justify-between px-5 py-3 border-b">
      <div class="flex items-center">
        <span :class="statusBadgeClass" class="px-2 py-1 rounded-full text-xs font-medium">
          {{ statusLabel }}
        </span>
        <span class="ml-2 text-sm text-gray-500">Booking #{{ booking.booking_id }}</span>
      </div>
      <div>
        <button v-if="!expanded" @click="expanded = true" class="text-sm text-blue-500 hover:text-blue-700">View details</button>
        <button v-else @click="expanded = false" class="text-sm text-blue-500 hover:text-blue-700">Hide details</button>
      </div>
    </div>

    <!-- Main Booking Info -->
    <div class="px-5 py-4 flex flex-col md:flex-row">
      <!-- Camping Spot Image -->
      <div class="w-full md:w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 mb-4 md:mb-0 md:mr-4">
        <img v-if="spotImage" :src="spotImage" alt="Camping spot" class="w-full h-full object-cover">
        <div v-else class="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
      </div>

      <!-- Booking Details -->
      <div class="flex-grow">
        <h3 class="font-medium text-lg line-clamp-1">
          {{ spotTitle }}
        </h3>

        <div class="mt-2 flex flex-wrap text-sm text-gray-600 gap-4">
          <!-- Date range -->
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{{ formatDateRange(booking.start_date, booking.end_date) }}</span>
          </div>

          <!-- Guests -->
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{{ booking.number_of_guests }} {{ booking.number_of_guests === 1 ? 'guest' : 'guests' }}</span>
          </div>

          <!-- Cost -->
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>€{{ formatPrice(booking.cost) }}</span>
          </div>
        </div>

        <!-- Expanded Details -->
        <div v-if="expanded" class="mt-4 pt-4 border-t">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 class="font-medium text-gray-700 mb-2">Booking Details</h4>
              <ul class="space-y-2">
                <li class="flex items-start">
                  <span class="font-medium mr-1">Check in:</span>
                  <span>{{ formatDate(booking.start_date) }}</span>
                </li>
                <li class="flex items-start">
                  <span class="font-medium mr-1">Check out:</span>
                  <span>{{ formatDate(booking.end_date) }}</span>
                </li>
                <li class="flex items-start">
                  <span class="font-medium mr-1">Status:</span>
                  <span>{{ statusLabel }}</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 class="font-medium text-gray-700 mb-2">Location</h4>
              <p>{{ locationText }}</p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="mt-6 flex flex-wrap gap-3 justify-end">
            <button 
              @click="viewDetails"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              View Full Details
            </button>

            <button 
              v-if="canCancel" 
              @click="confirmCancel"
              class="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
            >
              Cancel Booking
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cancel Confirmation Modal -->
    <div v-if="showCancelModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
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
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Keep Booking
          </button>
          <button 
            @click="handleCancel"
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Cancel Booking
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useToast } from 'vue-toastification';
import axios from '@/axios';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const props = defineProps({
  booking: {
    type: Object,
    required: true
  },
  refreshOnAction: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['booking-changed']);

const expanded = ref(false);
const showCancelModal = ref(false);

// Handle different booking data formats
const spotTitle = computed(() => {
  if (props.booking.camping_spot?.title) {
    return props.booking.camping_spot.title;
  }
  if (props.booking.campingSpot?.title) {
    return props.booking.campingSpot.title;
  }
  if (props.booking.spot?.title) {
    return props.booking.spot.title;
  }
  return 'Camping Spot';
});

const spotImage = computed(() => {
  if (props.booking.camping_spot?.images?.length) {
    return props.booking.camping_spot.images[0].image_url;
  }
  if (props.booking.campingSpot?.images?.length) {
    return props.booking.campingSpot.images[0].image_url;
  }
  if (props.booking.spot?.images?.length) {
    return props.booking.spot.images[0].image_url;
  }
  return null;
});

const locationText = computed(() => {
  if (props.booking.camping_spot?.location) {
    const loc = props.booking.camping_spot.location;
    return `${loc.address_line1 || ''}, ${loc.city}, ${loc.country?.name || ''}`;
  }
  if (props.booking.campingSpot?.location) {
    const loc = props.booking.campingSpot.location;
    return `${loc.address_line1 || ''}, ${loc.city}, ${loc.country?.name || ''}`;
  }
  return 'Location details not available';
});

const statusLabel = computed(() => {
  const statusId = props.booking.status_id || 1;
  const statusMap = {
    1: 'Pending',
    2: 'Confirmed',
    3: 'Cancelled',
    4: 'Completed',
    5: 'Unavailable'
  };
  return statusMap[statusId] || 'Unknown';
});

const statusBadgeClass = computed(() => {
  const statusId = props.booking.status_id || 1;
  const classMap = {
    1: 'bg-yellow-100 text-yellow-800', // Pending
    2: 'bg-green-100 text-green-800',   // Confirmed
    3: 'bg-red-100 text-red-800',       // Cancelled
    4: 'bg-blue-100 text-blue-800',     // Completed
    5: 'bg-gray-100 text-gray-800'      // Unavailable
  };
  return classMap[statusId] || 'bg-gray-100 text-gray-800';
});

const canCancel = computed(() => {
  if (props.booking.status_id !== 2) return false;
  
  const today = new Date();
  const startDate = new Date(props.booking.start_date);
  const daysDiff = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
  return daysDiff > 2; // Can cancel confirmed bookings if more than 2 days before check-in
});

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  return `${formatDate(startDate)} - ${formatDate(endDate)} · ${days} night${days !== 1 ? 's' : ''}`;
};

const formatPrice = (price) => {
  if (!price) return '0.00';
  return parseFloat(price).toFixed(2);
};

const viewDetails = () => {
  router.push(`/booking/${props.booking.booking_id}`);
};

const confirmCancel = () => {
  showCancelModal.value = true;
};

// Add a method to force reload booking details after actions
const refreshBookingDetails = async () => {
  if (props.refreshOnAction) {
    emit('booking-changed', props.booking.booking_id)
  }
};

const handleCancel = async () => {
  try {
    await axios.post(`/api/bookings/${props.booking.booking_id}/cancel`);
    await authStore.fetchFullUserInfo(true); // Force refresh
    toast.success('Booking cancelled successfully');
    await refreshBookingDetails();
    
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('booking-changed'));
  } catch (error) {
    toast.error(error.response?.data?.error || 'Failed to cancel booking');
  } finally {
    showCancelModal.value = false;
  }
};
</script>

<style scoped>
.bg-white {
  transition: all 0.2s ease;
}
</style>
