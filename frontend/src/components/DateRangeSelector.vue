<template>
  <div class="date-range-container">
    <div class="grid grid-cols-2 gap-2">
      <div class="date-input-group">
        <label class="block text-sm font-medium mb-1">Check in</label>
        <input
          type="date"
          :value="localStartDate"
          :min="today"
          class="date-input"
          :class="{ 'border-red-500': validationError }"
          @input="handleStartDateChange($event)"
        >
      </div>
      <div class="date-input-group">
        <label class="block text-sm font-medium mb-1">Check out</label>
        <input
          type="date"
          :value="localEndDate"
          :min="minEndDate"
          class="date-input"
          :class="{ 'border-red-500': validationError }"
          @input="handleEndDateChange($event)"
        >
      </div>
    </div>
    
    <!-- Validation error message -->
    <div v-if="validationError" class="mt-2 text-sm text-red-600">
      {{ validationError }}
    </div>
    
    <!-- Loading indicator while checking availability -->
    <div v-if="checkingAvailability" class="mt-2 text-sm text-blue-600 flex items-center">
      <div class="mr-2 h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      Checking availability...
    </div>
    
    <!-- Display selected dates for clarity -->
    <div v-if="localStartDate && localEndDate && !validationError && !checkingAvailability" class="mt-2 text-sm text-gray-600">
      Selected: {{ formatDate(localStartDate) }} to {{ formatDate(localEndDate) }} 
      <span v-if="calculateNights > 0">({{ calculateNights }} nights)</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useRoute } from 'vue-router'
import axios from '@/axios'

const props = defineProps({
  startDate: String,
  endDate: String,
  campingSpotId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['update:startDate', 'update:endDate', 'dateChange'])

const toast = useToast()
const route = useRoute()
const localStartDate = ref(props.startDate || '')
const localEndDate = ref(props.endDate || '')
const validationError = ref('')
const checkingAvailability = ref(false)
const unavailableDates = ref([])

// Get today's date as YYYY-MM-DD string
const today = computed(() => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date.toISOString().split('T')[0]
})

// Compute the minimum allowed end date (always day after start date)
const minEndDate = computed(() => {
  if (!localStartDate.value) return today.value
  
  // Ensure next day is calculated correctly
  const nextDay = new Date(localStartDate.value)
  nextDay.setDate(nextDay.getDate() + 1)
  return nextDay.toISOString().split('T')[0]
})

const calculateNights = computed(() => {
  if (!localStartDate.value || !localEndDate.value) return 0
  
  const start = new Date(localStartDate.value)
  const end = new Date(localEndDate.value)
  
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  
  const diffTime = Math.abs(end - start)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

// Load unavailable dates if we have a camping spot ID
const loadUnavailableDates = async () => {
  // Only try to load if we have a camping spot ID
  if (!props.campingSpotId) {
    // If we're on a camping spot detail page, get the ID from the route
    const id = route.params.id
    if (!id) return
    
    try {
      const response = await axios.get(`/camping-spots/${id}/availability`, {
        params: {
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] // 90 days from now
        }
      })
      
      unavailableDates.value = response.data.bookings || []
    } catch (err) {
      console.error('Failed to load availability data:', err)
    }
  }
}

// Check if selected dates clash with unavailable dates
const checkDatesAvailability = async (start, end) => {
  // Skip if we don't have dates to check or camping spot ID
  if (!start || !end) return true
  
  const spotId = props.campingSpotId || route.params.id
  if (!spotId) return true
  
  // Start checking
  checkingAvailability.value = true
  validationError.value = ''
  
  try {
    // Convert to date objects
    const startDate = new Date(start)
    const endDate = new Date(end)
    
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(0, 0, 0, 0)
    
    const response = await axios.get(`/camping-spots/${spotId}/availability`, {
      params: {
        startDate: start,
        endDate: end
      }
    })
    
    const bookings = response.data.bookings || []
    
    // If we have bookings in this range, it means the dates are unavailable
    if (bookings.length > 0) {
      validationError.value = 'These dates are not available for booking'
      return false
    }
    
    return true
  } catch (err) {
    console.error('Failed to check availability:', err)
    validationError.value = 'Error checking availability'
    return false
  } finally {
    checkingAvailability.value = false
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const handleStartDateChange = async (event) => {
  const newStartDate = event.target.value;
  validationError.value = '';
  
  // Validate that the new start date isn't in the past
  const selectedDate = new Date(newStartDate);
  selectedDate.setHours(0, 0, 0, 0);
  
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  if (selectedDate < currentDate) {
    validationError.value = 'Cannot select dates in the past';
    // Reset to today if past date is selected
    localStartDate.value = today.value;
    event.target.value = localStartDate.value;
    return;
  }
  
  // Accept the new start date
  localStartDate.value = newStartDate;
  
  // If end date exists but is now before or same as start date, update it
  if (localEndDate.value) {
    const startDate = new Date(newStartDate);
    const endDate = new Date(localEndDate.value);
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    // If end date is same as or before start date, set it to the day after
    if (endDate <= startDate) {
      const newEndDate = new Date(startDate);
      newEndDate.setDate(startDate.getDate() + 1);
      localEndDate.value = newEndDate.toISOString().split('T')[0];
    }
    
    // Check availability when both dates are set
    await checkDatesAvailability(localStartDate.value, localEndDate.value);
  }
  
  emitDates();
}

const handleEndDateChange = async (event) => {
  const newEndDate = event.target.value;
  validationError.value = '';
  
  // Only allow end dates that are after the start date
  if (localStartDate.value) {
    const startDate = new Date(localStartDate.value);
    const endDate = new Date(newEndDate);
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    if (endDate <= startDate) {
      validationError.value = 'End date must be after start date';
      return;
    }
    
    localEndDate.value = newEndDate;
    
    // Check availability when both dates are set
    await checkDatesAvailability(localStartDate.value, localEndDate.value);
    emitDates();
  } else {
    // If no start date, set end date normally but remind to set start date
    localEndDate.value = newEndDate;
    validationError.value = 'Please select a start date first';
  }
}

const emitDates = () => {
  if (localStartDate.value && localEndDate.value) {
    if (!validationError.value) {
      emit('update:startDate', localStartDate.value)
      emit('update:endDate', localEndDate.value)
      emit('dateChange', {
        startDate: localStartDate.value,
        endDate: localEndDate.value
      })
    }
  }
}

// Watch for prop changes
watch(() => props.startDate, (newVal) => {
  if (newVal !== localStartDate.value) {
    localStartDate.value = newVal;
    
    // Check availability when both dates are set
    if (localEndDate.value) {
      checkDatesAvailability(localStartDate.value, localEndDate.value);
    }
    
    // Ensure end date is after start date
    if (localEndDate.value) {
      const startDate = new Date(newVal);
      const endDate = new Date(localEndDate.value);
      
      if (endDate <= startDate) {
        const nextDay = new Date(startDate);
        nextDay.setDate(startDate.getDate() + 1);
        localEndDate.value = nextDay.toISOString().split('T')[0];
      }
    }
  }
})

watch(() => props.endDate, (newVal) => {
  if (newVal !== localEndDate.value) {
    // Only accept end date if it's after start date
    if (localStartDate.value) {
      const startDate = new Date(localStartDate.value);
      const endDate = new Date(newVal);
      
      if (endDate > startDate) {
        localEndDate.value = newVal;
        
        // Check availability when both dates are set
        checkDatesAvailability(localStartDate.value, localEndDate.value);
      } else {
        // Set to day after start date
        const nextDay = new Date(startDate);
        nextDay.setDate(startDate.getDate() + 1);
        localEndDate.value = nextDay.toISOString().split('T')[0];
        
        // Emit the corrected date
        setTimeout(() => emitDates(), 0);
      }
    } else {
      localEndDate.value = newVal;
    }
  }
})

// Initialize the component
onMounted(async () => {
  loadUnavailableDates();
  
  // If only start date is set, set end date to next day
  if (localStartDate.value && !localEndDate.value) {
    const startDate = new Date(localStartDate.value);
    const nextDay = new Date(startDate);
    nextDay.setDate(startDate.getDate() + 1);
    localEndDate.value = nextDay.toISOString().split('T')[0];
  }
  
  // Check availability of initially set dates
  if (localStartDate.value && localEndDate.value) {
    await checkDatesAvailability(localStartDate.value, localEndDate.value);
    emitDates();
  }
})
</script>

<style scoped>
.date-range-container {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.date-input-group {
  position: relative;
}

.date-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #E5E7EB;
  border-radius: 0.75rem;
  font-size: 1rem;
  color: #374151;
  background: #F9FAFB;
  transition: all 0.2s;
  cursor: pointer;
}

.date-input:hover {
  border-color: #FF385C;
  background: #FFF8F6;
}

.date-input:focus {
  outline: none;
  border-color: #FF385C;
  box-shadow: 0 0 0 3px rgba(255, 56, 92, 0.1);
}

.date-input.border-red-500 {
  border-color: #EF4444;
  background-color: #FEF2F2;
}

input[type="date"] {
  appearance: none;
  -webkit-appearance: none;
  position: relative;
  padding-right: 30px !important;
  color: #374151;
}

input[type="date"]::-webkit-calendar-picker-indicator {
  background: transparent;
  bottom: 0;
  color: transparent;
  cursor: pointer;
  height: auto;
  left: auto;
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
}

input[type="date"]::before {
  content: '📅';
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* Make touch targets easier to hit on mobile */
@media (max-width: 640px) {
  .date-input {
    padding: 0.875rem 1rem;
    font-size: 1.05rem;
  }
}

/* Animation for validation error */
@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
}

.border-red-500 {
  animation: shake 0.4s ease-in-out;
}
</style>
