<template>
  <div class="bg-white p-4 rounded-lg shadow-sm">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Check In</label>
        <input
          type="date"
          :value="localStartDate"
          :min="today"
          class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-lg px-4 py-2 transition-all duration-200 hover:border-red-300"
          @input="handleStartDateChange($event)"
        >
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Check Out</label>
        <input
          type="date"
          :value="localEndDate"
          :min="minEndDate"
          class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-lg px-4 py-2 transition-all duration-200 hover:border-red-300"
          @input="handleEndDateChange($event)"
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  startDate: String,
  endDate: String
})

const emit = defineEmits(['update:startDate', 'update:endDate', 'dateChange'])

const localStartDate = ref(props.startDate || '')
const localEndDate = ref(props.endDate || '')

const today = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
})

const minEndDate = computed(() => {
  if (!localStartDate.value) return today.value
  const nextDay = new Date(localStartDate.value)
  nextDay.setDate(nextDay.getDate() + 1)
  return nextDay.toISOString().split('T')[0]
})

const handleStartDateChange = (event) => {
  localStartDate.value = event.target.value
  if (localEndDate.value && new Date(localEndDate.value) <= new Date(localStartDate.value)) {
    const nextDay = new Date(localStartDate.value)
    nextDay.setDate(nextDay.getDate() + 1)
    localEndDate.value = nextDay.toISOString().split('T')[0]
  }
  emitDates()
}

const handleEndDateChange = (event) => {
  localEndDate.value = event.target.value
  emitDates()
}

const emitDates = () => {
  emit('update:startDate', localStartDate.value)
  emit('update:endDate', localEndDate.value)
  emit('dateChange', {
    startDate: localStartDate.value,
    endDate: localEndDate.value
  })
}
</script>

<style scoped>
input[type="date"] {
  -webkit-appearance: none;
  position: relative;
  padding-right: 30px !important;
  min-width: 140px;
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
  pointer-events: none; /* Allow clicks to pass through to the actual calendar picker */
}

input[type="date"]::-webkit-datetime-edit {
  display: block;
  padding: 0;
}

input[type="date"]::-webkit-datetime-edit-fields-wrapper {
  padding: 0;
}
</style>
