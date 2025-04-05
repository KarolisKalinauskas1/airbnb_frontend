<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-3xl mx-auto px-4">
      <h1 class="text-2xl font-semibold mb-6">Complete your booking</h1>
      
      <div v-if="loading" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
      </div>
      
      <div v-else class="bg-white rounded-lg shadow p-6">
        <!-- Booking details will go here -->
        <p>Implementation pending...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from '@/axios'

const route = useRoute()
const loading = ref(true)
const spot = ref(null)

onMounted(async () => {
  try {
    const { data } = await axios.get(`/camping-spots/${route.params.id}`, {
      params: {
        startDate: route.query.startDate,
        endDate: route.query.endDate
      }
    })
    spot.value = data
  } catch (error) {
    console.error('Failed to load spot:', error)
  } finally {
    loading.value = false
  }
})
</script>
