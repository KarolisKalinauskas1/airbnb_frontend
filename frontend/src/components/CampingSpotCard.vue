<template>
  <div class="relative bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
    <!-- Image -->
    <img
      v-if="spot.images?.[0]"
      :src="spot.images[0].image_url"
      :alt="spot.title"
      class="w-full h-48 object-cover"
    />
    <div v-else class="w-full h-48 bg-gray-200 flex items-center justify-center">
      <span class="text-gray-400">No image available</span>
    </div>

    <!-- Content -->
    <div class="p-4">
      <h3 class="text-lg font-semibold text-gray-900">{{ spot.title }}</h3>
      <p class="text-sm text-gray-600">{{ spot.location?.city }}, {{ spot.location?.country?.name }}</p>
      
      <!-- Pricing -->
      <div class="mt-2">
        <p class="text-lg font-bold text-gray-900">€{{ spot.price_per_night }} / night</p>
        <p v-if="numberOfDays" class="text-sm text-gray-600">
          Total for {{ numberOfDays }} nights: €{{ totalPrice }}
        </p>
      </div>

      <!-- Quick info -->
      <div class="mt-2 flex flex-wrap gap-2">
        <span class="text-xs bg-gray-100 px-2 py-1 rounded-full">
          Max guests: {{ spot.max_guests }}
        </span>
        <span 
          v-for="amenity in spot.camping_spot_amenities?.slice(0, 3)" 
          :key="amenity.amenity_id"
          class="text-xs bg-gray-100 px-2 py-1 rounded-full"
        >
          {{ amenity.amenity.name }}
        </span>
      </div>
    </div>

    <!-- Link overlay -->
    <router-link 
      :to="`/camper/${spot.camping_spot_id}`"
      class="absolute inset-0 z-10"
      aria-label="View details"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  spot: {
    type: Object,
    required: true
  },
  startDate: String,
  endDate: String
})

const numberOfDays = computed(() => {
  if (!props.startDate || !props.endDate) return null
  const start = new Date(props.startDate)
  const end = new Date(props.endDate)
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
})

const totalPrice = computed(() => {
  if (!numberOfDays.value) return null
  return (props.spot.price_per_night * numberOfDays.value).toFixed(2)
})
</script>
