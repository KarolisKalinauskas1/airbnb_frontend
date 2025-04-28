<template>
  <div class="simple-date-range-container">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
        <input 
          type="date" 
          class="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 date-input"
          :min="today" 
          :value="localStartDate"
          @change="handleStartDateChange($event)"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
        <input 
          type="date" 
          class="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 date-input"
          :min="minEndDate" 
          :value="localEndDate"
          @change="handleEndDateChange($event)"
        />
      </div>
    </div>
    
    <!-- Display selected dates for clarity -->
    <div v-if="localStartDate && localEndDate" class="mt-2 text-sm text-gray-600">
      Selected: {{ formatDate(localStartDate) }} to {{ formatDate(localEndDate) }} 
      <span v-if="calculateNights > 0">({{ calculateNights }} nights)</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  startDate: String,
  endDate: String,
})

const emit = defineEmits(['update:startDate', 'update:endDate', 'dateChange'])

const localStartDate = ref(props.startDate || '')
const localEndDate = ref(props.endDate || '')

// Calculate today's date for min attribute
const today = computed(() => {
  const date = new Date()
  return date.toISOString().split('T')[0]
})

// Calculate minimum end date based on start date
const minEndDate = computed(() => {
  if (!localStartDate.value) return today.value
  
  const startDate = new Date(localStartDate.value)
  const nextDay = new Date(startDate)
  nextDay.setDate(startDate.getDate() + 1)
  return nextDay.toISOString().split('T')[0]
})

// Calculate number of nights
const calculateNights = computed(() => {
  if (!localStartDate.value || !localEndDate.value) return 0
  
  const start = new Date(localStartDate.value)
  const end = new Date(localEndDate.value)
  
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  
  const diffTime = Math.abs(end - start)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

// Format date for display
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const handleStartDateChange = (event) => {
  const newStartDate = event.target.value;
  
  // Only update if the date changed
  if (newStartDate === localStartDate.value) return
  
  localStartDate.value = newStartDate
  emit('update:startDate', newStartDate)
  
  // If we have an end date, verify the range is valid
  if (localEndDate.value) {
    const startDate = new Date(newStartDate)
    const endDate = new Date(localEndDate.value)
    
    if (startDate >= endDate) {
      // If start date is greater than or equal to end date, update end date
      const newEndDate = new Date(startDate)
      newEndDate.setDate(startDate.getDate() + 1)
      localEndDate.value = newEndDate.toISOString().split('T')[0]
      emit('update:endDate', localEndDate.value)
    }
    
    // Emit date change event after validation
    emit('dateChange', { 
      startDate: localStartDate.value, 
      endDate: localEndDate.value 
    })
  }
}

const handleEndDateChange = (event) => {
  const newEndDate = event.target.value
  
  // Only update if the date changed
  if (newEndDate === localEndDate.value) return
  
  localEndDate.value = newEndDate
  emit('update:endDate', newEndDate)
  
  // If we have a start date, emit change event
  if (localStartDate.value) {
    emit('dateChange', { 
      startDate: localStartDate.value, 
      endDate: localEndDate.value 
    })
  }
}

// Watch for prop changes
watch(() => props.startDate, (newVal) => {
  if (newVal !== localStartDate.value) {
    localStartDate.value = newVal
  }
})

watch(() => props.endDate, (newVal) => {
  if (newVal !== localEndDate.value) {
    localEndDate.value = newVal
  }
})
</script>

<style scoped>
.simple-date-range-container {
  width: 100%;
}

.date-input {
  box-sizing: border-box;
  width: 100%;
  line-height: normal;
  height: auto;
}

.date-input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

input[type="date"] {
  box-sizing: border-box;
  padding: 0.375rem 0.75rem;
  width: 100%;
}
</style>
