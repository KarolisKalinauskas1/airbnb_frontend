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
.date-range-container {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.date-range-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
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

input[type="date"] {
  appearance: none;
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
