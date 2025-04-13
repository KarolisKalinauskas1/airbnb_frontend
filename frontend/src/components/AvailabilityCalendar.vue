<template>
  <div class="availability-calendar">
    <!-- Date selection error handling wrapper -->
    <div v-if="dateSelectionError" class="p-4 mb-4 bg-red-100 border border-red-300 rounded-lg">
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <span class="font-medium text-red-700">{{ dateSelectionError }}</span>
      </div>
      <button 
        @click="resetDateSelection"
        class="mt-2 text-sm text-red-600 hover:text-red-800 underline cursor-pointer"
      >
        Reset date selection
      </button>
    </div>

    <!-- Calendar Header with Block Dates Button for Owners -->
    <div v-if="isOwner" class="mb-4 flex justify-between items-center">
      <h3 class="font-medium text-lg">{{ calendarTitle }}</h3>
      <button 
        @click="toggleBlockingMode" 
        class="px-4 py-2 text-sm rounded-md transition-colors"
        :class="[blockingMode ? 'bg-red-600 text-white' : 'border border-red-600 text-red-600']"
      >
        {{ blockingMode ? 'Cancel' : 'Block Dates' }}
      </button>
    </div>

    <!-- Date Range Selector for Blocking Dates (Only shown in blocking mode) -->
    <div v-if="blockingMode && isOwner" class="mb-6 bg-white p-4 rounded-lg shadow-sm border border-red-200 bg-red-50">
      <h3 class="font-medium mb-3">Block Date Range</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm mb-1">Start Date</label>
          <input 
            type="date" 
            v-model="startDateInput"
            :min="today"
            class="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label class="block text-sm mb-1">End Date</label>
          <input 
            type="date" 
            v-model="endDateInput"
            :min="minEndDate"
            class="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
      </div>
      
      <div class="flex justify-between items-center">
        <div class="text-sm text-gray-600">
          {{ dateSelectionText }}
        </div>
        <button 
          v-if="isValidDateRange"
          @click="blockDates" 
          class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          Block These Dates
        </button>
      </div>
    </div>

    <!-- Bookings Display -->
    <div class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div class="p-4 border-b">
        <h3 class="text-lg font-medium">Availability Calendar</h3>
        <p class="text-sm text-gray-500 mt-1">
          {{ isOwner ? 'Manage available dates for your camping spot' : 'Check available dates for booking' }}
        </p>
      </div>
      
      <div class="p-4">
        <div v-if="loading" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
        
        <div v-else-if="error" class="p-4 text-center text-red-500">
          {{ error }}
        </div>
        
        <div v-else>
          <div v-if="bookings.length === 0" class="text-center py-8 text-gray-500">
            No bookings or blocked dates in the selected period.
          </div>
          
          <!-- Date Blocks List - Only show details to owner -->
          <div v-else-if="isOwner" class="space-y-3 mb-6">
            <div class="text-sm font-medium mb-2">Bookings and Blocked Dates:</div>
            <div v-for="(booking, index) in bookings" :key="index" 
                 class="p-3 rounded-lg flex justify-between items-center"
                 :class="booking.status_id === 5 ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'">
              <div>
                <div class="font-medium">{{ formatDateRange(booking.start_date, booking.end_date) }}</div>
                <div class="text-sm" :class="booking.status_id === 5 ? 'text-red-600' : 'text-blue-600'">
                  {{ booking.status_id === 5 ? 'Blocked by owner' : 'Booked by guest' }}
                </div>
              </div>
              
              <div v-if="booking.status_id === 5 && isOwner" class="flex items-center">
                <button 
                  @click="unblockDates(booking.booking_id)"
                  class="text-red-500 hover:text-red-700 p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Simplified Date Blocks List for non-owners -->
          <div v-else-if="!isOwner && bookings.length > 0" class="space-y-3 mb-6">
            <div class="text-sm font-medium mb-2">Unavailable Dates:</div>
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p class="text-center">This camping spot is not available on the following dates:</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <span v-for="(booking, index) in bookings" :key="index" 
                     class="px-3 py-1 rounded-full text-xs font-medium"
                     :class="booking.status_id === 5 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'">
                  {{ formatDateRange(booking.start_date, booking.end_date) }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Monthly Calendar View -->
          <div class="border rounded-lg overflow-hidden mt-4">
            <div class="grid grid-cols-7 gap-px bg-gray-200">
              <div v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" 
                   :key="day" 
                   class="bg-gray-50 text-center py-2 text-sm font-medium">
                {{ day }}
              </div>
            </div>
            
            <div v-for="month in displayMonths" :key="month.name" class="mb-6">
              <div class="bg-gray-50 py-2 px-4 font-medium border-t">
                {{ month.name }}
              </div>
              <div class="grid grid-cols-7 gap-px bg-gray-200">
                <!-- Empty cells for days before the first day of the month -->
                <div v-for="n in month.firstDay" :key="`empty-start-${n}`" class="bg-white py-4"></div>
                
                <!-- Days of the month -->
                <div v-for="day in month.days" :key="`day-${day.date}`" 
                     class="bg-white p-2 min-h-[60px] text-center relative"
                     :class="getDayClasses(day)">
                  <span class="text-sm">{{ day.dayOfMonth }}</span>
                  
                  <div v-if="day.hasBooking" class="absolute inset-0 opacity-40 pointer-events-none"
                       :class="day.isBlocked ? 'bg-red-100' : 'bg-blue-100'">
                  </div>
                  
                  <div v-if="day.isToday" class="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></div>
                </div>
                
                <!-- Empty cells for days after the last day of the month -->
                <div v-for="n in month.lastEmptyCells" :key="`empty-end-${n}`" class="bg-white py-4"></div>
              </div>
            </div>
          </div>
          
          <!-- Color legends -->
          <div class="mt-4 flex flex-wrap gap-4">
            <div class="flex items-center">
              <span class="w-4 h-4 inline-block bg-red-100 border border-red-500 rounded-sm mr-2"></span>
              <span class="text-sm">{{ isOwner ? 'Blocked by Owner' : 'Unavailable' }}</span>
            </div>
            <div class="flex items-center">
              <span class="w-4 h-4 inline-block bg-blue-100 border border-blue-500 rounded-sm mr-2"></span>
              <span class="text-sm">{{ isOwner ? 'Booked by Guest' : 'Booked' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import axios from '@/axios';
import { useToast } from 'vue-toastification';

const props = defineProps({
  campingSpotId: {
    type: [Number, String],
    required: true
  },
  basePrice: {
    type: [Number, String],
    default: 0
  },
  isOwner: {
    type: Boolean,
    default: false
  },
  ownerId: {
    type: [Number, String],
    default: null
  }
});

const emit = defineEmits(['date-selected', 'blocked-dates-loaded']);

// Component state
const toast = useToast();
const bookings = ref([]);
const loading = ref(false);
const error = ref(null);
const dateSelectionError = ref(null);
const blockingMode = ref(false);
const startDateInput = ref('');
const endDateInput = ref('');

// Calendar title based on current month/year
const calendarTitle = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

// Calculate today's date in YYYY-MM-DD format
const today = computed(() => {
  const date = new Date();
  return formatDateForInput(date);
});

// Calculate minimum end date (day after start date)
const minEndDate = computed(() => {
  if (!startDateInput.value) return today.value;
  
  const date = new Date(startDateInput.value);
  date.setDate(date.getDate() + 1);
  return formatDateForInput(date);
});

// Check if we have a valid date range selected
const isValidDateRange = computed(() => {
  if (!startDateInput.value || !endDateInput.value) return false;
  
  const start = new Date(startDateInput.value);
  const end = new Date(endDateInput.value);
  
  return start < end;
});

// Text to display about the selected date range
const dateSelectionText = computed(() => {
  if (!startDateInput.value) return 'Select a start date';
  if (!endDateInput.value) return 'Now select an end date';
  
  const start = new Date(startDateInput.value);
  const end = new Date(endDateInput.value);
  
  if (start >= end) return 'End date must be after start date';
  
  const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return `Selected: ${formatDate(start)} to ${formatDate(end)} (${days} days)`;
});

// Generate 3 months of calendar data starting from current month
const displayMonths = computed(() => {
  const months = [];
  const today = new Date();
  
  for (let i = 0; i < 3; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(date.getFullYear(), date.getMonth(), d);
      const dateStr = formatDateForInput(dayDate);
      
      // Check if this day has a booking or is blocked - FIX: use proper date comparison
      const dayBooking = bookings.value.find(booking => {
        const bookingStart = new Date(booking.start_date);
        const bookingEnd = new Date(booking.end_date);
        
        // Set times to start of day for accurate date comparison
        bookingStart.setHours(0, 0, 0, 0);
        bookingEnd.setHours(0, 0, 0, 0);
        dayDate.setHours(0, 0, 0, 0);
        
        // Include both start and end dates in the comparison (inclusive range)
        return dayDate >= bookingStart && dayDate <= bookingEnd;
      });
      
      days.push({
        date: dateStr,
        dayOfMonth: d,
        hasBooking: !!dayBooking,
        isBlocked: dayBooking?.status_id === 5,
        isToday: isToday(dayDate),
        isPast: dayDate < new Date(today.setHours(0, 0, 0, 0))
      });
    }
    
    // Calculate empty cells needed at the end to complete the grid
    const totalCells = Math.ceil((daysInMonth + firstDayOfMonth) / 7) * 7;
    const lastEmptyCells = totalCells - daysInMonth - firstDayOfMonth;
    
    months.push({
      name: monthName,
      days,
      firstDay: firstDayOfMonth,
      lastEmptyCells
    });
  }
  
  return months;
});

// Helper functions
function formatDateForInput(date) {
  return date.toISOString().split('T')[0];
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

function formatDateRange(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function isToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() && 
         date.getMonth() === today.getMonth() && 
         date.getFullYear() === today.getFullYear();
}

function getDayClasses(day) {
  const classes = [];
  
  if (day.isPast) classes.push('text-gray-400');
  if (day.hasBooking) {
    if (day.isBlocked) {
      classes.push('text-red-800');
    } else {
      classes.push('text-blue-800');
    }
  }
  
  return classes.join(' ');
}

function toggleBlockingMode() {
  blockingMode.value = !blockingMode.value;
  resetDateSelection();
}

function resetDateSelection() {
  dateSelectionError.value = null;
  startDateInput.value = '';
  endDateInput.value = '';
}

// Direct block dates - simplifying the flow
async function blockDates() {
  if (!isValidDateRange.value) {
    dateSelectionError.value = 'Please select a valid date range';
    return;
  }
  
  try {
    // Notify the parent component about the dates
    emit('date-selected', {
      startDate: startDateInput.value,
      endDate: endDateInput.value
    });
    
    // Post directly to the API
    await axios.post(`/camping-spots/${props.campingSpotId}/availability`, {
      startDate: startDateInput.value,
      endDate: endDateInput.value,
      owner_id: props.ownerId
    });
    
    // Success feedback
    toast.success('Dates blocked successfully');
    
    // Reset and refresh
    resetDateSelection();
    blockingMode.value = false;
    await loadBookings();
    
  } catch (error) {
    console.error('Error blocking dates:', error);
    toast.error(error.response?.data?.error || 'Failed to block dates');
    
    if (error.response?.status === 400) {
      dateSelectionError.value = error.response.data.error;
    } else {
      dateSelectionError.value = 'An error occurred while blocking dates';
    }
  }
}

// Improve the loadBookings function to ensure it correctly emits blocked dates
async function loadBookings() {
  if (!props.campingSpotId) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // Show 3 months of data
    
    const response = await axios.get(`/camping-spots/${props.campingSpotId}/availability`, {
      params: {
        startDate: formatDateForInput(startDate),
        endDate: formatDateForInput(endDate)
      }
    });
    
    bookings.value = response.data.bookings || [];

    // Emit an event with blocked dates info that parent components can use
    // Format the data properly to ensure it works with parent components
    const blockedDates = bookings.value.map(booking => ({
      start: booking.start_date,
      end: booking.end_date,
      status: booking.status_id,
      booking_id: booking.booking_id
    }));
    
    emit('blocked-dates-loaded', blockedDates);
    console.log("Emitting blocked dates:", blockedDates);
  } catch (err) {
    console.error('Failed to load availability:', err);
    error.value = 'Failed to load availability data';
  } finally {
    loading.value = false;
  }
}

// Unblock dates (for owner)
async function unblockDates(bookingId) {
  if (!props.isOwner || !props.campingSpotId) return;
  
  try {
    await axios.delete(`/camping-spots/${props.campingSpotId}/availability/${bookingId}`);
    toast.success('Date range unblocked successfully');
    await loadBookings();
  } catch (err) {
    console.error('Failed to unblock dates:', err);
    toast.error('Failed to unblock dates. Please try again.');
  }
}

// Watch for changes to camping spot ID
watch(() => props.campingSpotId, () => {
  if (props.campingSpotId) {
    loadBookings();
  }
}, { immediate: true });

onMounted(() => {
  loadBookings();
});
</script>

<style scoped>
.availability-calendar {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Animation for UI elements */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.bg-red-50 {
  animation: fadeIn 0.3s ease-out;
}
</style>
