<template>
  <div class="p-4 bg-gray-100 rounded-lg mb-4 text-sm">
    <h4 class="font-bold mb-2">Date Selection Debug</h4>
    <div class="grid grid-cols-2 gap-2">
      <div>
        <p><span class="font-semibold">Start Date:</span> {{ startDate || 'None' }}</p>
        <p><span class="font-semibold">End Date:</span> {{ endDate || 'None' }}</p>
      </div>
      <div>
        <p><span class="font-semibold">Dates Received:</span> {{ datesReceived }}</p>
        <p><span class="font-semibold">Last Update:</span> {{ lastUpdate }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue'

const props = defineProps({
  startDate: String,
  endDate: String
})

const emit = defineEmits(['clear'])

const datesReceived = ref(0)
const lastUpdate = ref(new Date().toLocaleTimeString())

watch([() => props.startDate, () => props.endDate], () => {
  if (props.startDate || props.endDate) {
    datesReceived.value++
    lastUpdate.value = new Date().toLocaleTimeString()
  }
})
</script>
