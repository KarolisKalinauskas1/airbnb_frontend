<template>
  <div class="animate-pulse max-w-full">
    <!-- Revenue boxes -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
      <div v-for="i in 6" :key="`revenue-${i}`" class="bg-gray-100 rounded-xl p-6 h-32">
        <div class="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div class="h-8 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
    
    <!-- Popular spots & Performance -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
      <div class="bg-gray-100 rounded-xl p-6">
        <div class="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div v-for="i in 5" :key="`spot-${i}`" class="mb-4">
          <div class="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
      
      <div class="bg-gray-100 rounded-xl p-6">
        <div class="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div v-for="i in 5" :key="`perf-${i}`" class="mb-4">
          <div class="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div class="h-3 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    </div>
    
    <!-- Recent Bookings Table -->
    <div class="bg-gray-100 rounded-xl p-6">
      <div class="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
      <div class="overflow-x-auto">
        <div class="min-w-full">
          <div class="h-10 bg-gray-200 rounded w-full mb-4"></div>
          <div v-for="i in 5" :key="`booking-${i}`" class="h-16 bg-gray-200 rounded w-full mb-2"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// No props or state needed for this skeleton component
</script>

<style scoped>
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}
</style>
