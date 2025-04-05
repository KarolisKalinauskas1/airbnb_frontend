<!-- pages/CampingSpots.vue -->
<template>
    <div class="p-6">
    <h2 class="text-2xl font-bold mb-4 pb-5">{{ spots.length }} Available Camping Spots </h2>
        
      <div v-if="loading">Loading...</div>
      <div v-else-if="spots.length === 0">No spots found for your filters.</div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CampingSpotCard
          v-for="spot in spots"
          :key="spot.camping_spot_id"
          :spot="spot"
        />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import CampingSpotCard from './CampingSpotCardComponent.vue'
  const API_BASE = import.meta.env.VITE_API_BASE_URL

  const spots = ref([])
  const loading = ref(true)
  
  // onMounted(async () => {
    
  //   try {
  //   const res = await fetch('/camping-spots?startDate=2025-07-01&endDate=2025-07-07')
  //   const data = await res.json()
  //   spots.value = data
  //   } catch (error) {
  //       console.error('Error fetching spots:', error)
  //   } finally {
  //   loading.value = false
  // }
  // })
  </script>
  