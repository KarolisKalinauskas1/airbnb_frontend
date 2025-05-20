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
    <!-- Calendar Header with Block Dates Button for Owners ONLY when in owner view -->
    <div v-if="isOwner && !viewOnly" class="mb-4 flex justify-between items-center">
      <h3 class="font-medium text-lg">{{ calendarTitle }}</h3>
      <button 
        @click="toggleBlockingMode" 
        class="px-4 py-2 text-sm rounded-md transition-colors"
        :class="[blockingMode ? 'bg-red-600 text-white' : 'border border-red-600 text-red-600']"
      >
        {{ blockingMode ? 'Cancel' : 'Block Dates' }}
      </button>
    </div>
    <!-- Date Range Selector for Blocking Dates (Only shown in blocking mode AND is owner) -->
    <div v-if="blockingMode && isOwner && !viewOnly" class="mb-6 bg-white p-4 rounded-lg shadow-sm border border-red-200 bg-red-50">
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
          <!-- Simplified Date Blocks List for non-owners - REMOVED list display -->
          <div v-else-if="!isOwner && bookings.length > 0" class="space-y-3 mb-6">
            <div class="text-sm font-medium mb-2">Unavailable Dates:</div>
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p class="text-center">Some dates are unavailable. Please check the calendar below.</p>
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
                <div v-for="(day, index) in month.days" :key="`day-${day.date}-${index}`" 
                     :class="getDayClasses(day)"
                     class="py-3 border-t">
                  <span>{{ day.dayOfMonth }}</span>
                  <!-- Color indicator dot -->
                  <span v-if="day.hasBooking" 
                       class="block w-4 h-1 mx-auto mt-1 rounded-full"
                       :class="{
                         'bg-red-500': day.isBlocked,
                         'bg-blue-500': day.isBooked
                       }">
                  </span>
                </div>
                <!-- Empty cells at the end -->
                <div v-for="n in month.lastEmptyCells" :key="`empty-end-${n}`" class="bg-white py-4"></div>
              </div>
            </div>
            <!-- Legend with clear labels -->
            <div class="p-3 border-t flex flex-wrap gap-4">
              <div class="flex items-center">
                <div class="w-4 h-4 bg-red-50 border border-red-300 rounded mr-1.5"></div>
                <span class="text-sm">Unavailable</span>
              </div>
              <div class="flex items-center">
                <div class="w-4 h-4 bg-blue-50 border border-blue-300 rounded mr-1.5"></div>
                <span class="text-sm">Booked</span>
              </div>
              <div class="flex items-center">
                <div class="w-4 h-4 bg-white border border-gray-300 rounded mr-1.5"></div>
                <span class="text-sm">Available</span>
              </div>
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
  },
  viewOnly: {
    type: Boolean,
    default: false
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
const blockedDates = ref([]);
const isLoading = ref(false);
const startOfCalendar = ref(new Date());
const endOfCalendar = ref(new Date(new Date().setMonth(new Date().getMonth() + 3)));
// Calendar title based on current month/year
const calendarTitle = computed(() => {
  const now = new Date();
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
});
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
    const days = getCalendarDays(date.getFullYear(), date.getMonth());
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
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}
function isToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() && 
         date.getMonth() === today.getMonth() && 
         date.getFullYear() === today.getFullYear();
}
// Update getCalendarDays to correctly mark days and include past dates
function getCalendarDays(year, month) {
  const days = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Add days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(year, month, d);
    const dateStr = formatDateForInput(dayDate);
    dayDate.setHours(0, 0, 0, 0);
    // Check if the date is in the past
    const isPast = dayDate < today;
    // Find ALL bookings for this day
    const dayBookings = bookings.value.filter(booking => {
      if (!booking.start_date || !booking.end_date) return false;
      const bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);
      // Set times to start of day for accurate date comparison
      bookingStart.setHours(0, 0, 0, 0);
      bookingEnd.setHours(0, 0, 0, 0);
      // Check if the day falls within the booking range (inclusive)
      return dayDate >= bookingStart && dayDate <= bookingEnd;
    });
    // Determine day status based on bookings
    const isBlocked = dayBookings.some(booking => booking.status_id === 5);
    const isBooked = dayBookings.some(booking => booking.status_id === 2 || booking.status_id === 4);
    days.push({
      date: dateStr,
      dayOfMonth: d,
      hasBooking: dayBookings.length > 0,
      isBlocked: isBlocked,
      isBooked: isBooked,
      isToday: isToday(dayDate),
      isPast: isPast
    });
  }
  return days;
}
function getDayClasses(day) {
  const classes = [];
  // Base styling
  classes.push('text-center', 'relative');
  // Skip empty cells
  if (!day.dayOfMonth) {
    classes.push('bg-white');
    return classes.join(' ');
  }
  // Today styling
  if (day.isToday) {
    classes.push('font-bold border-2 border-blue-500');
  }
  // Past days - show them but with muted styling
  if (day.isPast) {
    classes.push('text-gray-400 bg-gray-50');
  } else {
    // Booking status styling for non-past days
    if (day.isBlocked) {
      // Owner blocked dates
      classes.push('bg-red-50 text-red-900');
    } else if (day.isBooked) {
      // Customer booked dates
      classes.push('bg-blue-50 text-blue-900');
    } else {
      // Available dates
      classes.push('bg-white hover:bg-gray-50');
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
    await axios.post(`/api/camping-spots/${props.campingSpotId}/availability`, {
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
// Unblock dates (for owner)
async function unblockDates(bookingId) {
  if (!props.isOwner || !props.campingSpotId) return;
  try {
    await axios.delete(`/api/camping-spots/${props.campingSpotId}/availability/${bookingId}`);
    toast.success('Date range unblocked successfully');
    await loadBookings();
  } catch (err) {
    console.error('Failed to unblock dates:', err);
    toast.error('Failed to unblock dates. Please try again.');
  }
}
// Improved loadBookings function that handles API fallback
const loadBookings = async () => {
  if (!props.campingSpotId) return;
  isLoading.value = true;
  loading.value = true;
  error.value = null;
  try {
    // Get current month and 3 months ahead for proper date range
    const today = new Date();
    startOfCalendar.value = new Date(today.getFullYear(), today.getMonth(), 1);
    endOfCalendar.value = new Date(today.getFullYear(), today.getMonth() + 3, 0);
    // Format dates as strings for API
    const startDateStr = startOfCalendar.value.toISOString().slice(0, 10);
    const endDateStr = endOfCalendar.value.toISOString().slice(0, 10);
    // Try API endpoint
    const response = await axios.get(`/api/camping-spots/${props.campingSpotId}/availability`, {
      params: { 
        startDate: startDateStr,
        endDate: endDateStr
      },
      headers: {
        'Accept': 'application/json'
      }
    });
    processBookingResponse(response.data);
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    error.value = 'Failed to load availability data.';
  } finally {
    isLoading.value = false;
    loading.value = false;
  }
};
// Process booking response data
const processBookingResponse = (data) => {
  if (data.bookings && Array.isArray(data.bookings)) {
    // Get today's date for filtering out past bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Process bookings properly and filter out cancelled bookings (status_id 3)
    // Also filter out bookings that ended in the past
    bookings.value = data.bookings
      .filter(booking => {
        // Filter out cancelled bookings
        if (booking.status_id === 3) return false;
        // Filter out past bookings (end date is before today)
        const endDate = new Date(booking.end_date);
        endDate.setHours(0, 0, 0, 0);
        return endDate >= today;
      })
      .map(booking => ({
        ...booking,
        // Ensure status_id is properly set
        status_id: booking.status_id || (booking.isUnavailable ? 5 : 2),        // Add explicit flags for clarity
        isBlocked: booking.status_id === 5,
        isBooked: booking.status_id === 2 || booking.status_id === 4
      }));
    console.log('Processed bookings:', bookings.value);
  } else {
    console.warn('No bookings data found in response');
    bookings.value = [];
  }
  // Emit the blocked dates for parent components
  emit('blocked-dates-loaded', bookings.value);
};
// Fix the watches to reference loadBookings after it's declared
onMounted(() => {
  loadBookings();
});
// Move this watch AFTER loadBookings is defined
watch(() => props.campingSpotId, () => {
  if (props.campingSpotId) {
    loadBookings();
  }
}, { immediate: true });
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
  background-color: #fee2e2;
}
.bg-blue-50 {
  background-color: #dbeafe;
}
.text-red-900 {
  color: #7f1d1d;
}
.text-blue-900 {
  color: #1e3a8a;
}
/* Legend colors */
.legend-blocked {
  background-color: rgba(254, 226, 226, 0.6);
  border: 1px solid #ef4444;
}
.legend-booked {
  background-color: rgba(219, 234, 254, 0.6);
  border: 1px solid #3b82f6;
}
/* Add a legend section */
.calendar-legend {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #4b5563;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.legend-color {
  width: 1rem;
  height: 1rem;
  border-radius: 0.25rem;
}
</style>
