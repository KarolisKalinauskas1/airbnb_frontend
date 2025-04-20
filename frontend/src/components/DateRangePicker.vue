<template>
  <div class="date-range-picker">
    <div class="flex items-stretch border border-gray-300 rounded-md overflow-hidden">
      <div class="flex-1 p-2" @click="openStartDatePicker">
        <div class="text-xs text-gray-500">Check in</div>
        <div class="text-sm">{{ formatDate(modelValue.startDate) || 'Select date' }}</div>
      </div>
      <div class="border-l border-gray-300"></div>
      <div class="flex-1 p-2" @click="openEndDatePicker">
        <div class="text-xs text-gray-500">Check out</div>
        <div class="text-sm">{{ formatDate(modelValue.endDate) || 'Select date' }}</div>
      </div>
    </div>

    <!-- Date picker modal -->
    <!-- ...existing code... -->
  </div>
</template>

<script setup>
// Helper to format dates consistently
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    // Format as MMM DD, YYYY (e.g., Jan 01, 2023)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric'
    });
  } catch (err) {
    console.error('Date formatting error:', err);
    return dateStr;
  }
};
</script>

<style scoped>
.date-range-picker {
  height: 100%;
}

.date-range-picker .flex {
  height: 100%;
  min-height: 3rem;
}
</style>