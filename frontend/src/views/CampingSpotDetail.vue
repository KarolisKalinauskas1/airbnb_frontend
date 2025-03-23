<template>
    <div v-if="loading">Loading...</div>
    <div v-else-if="!spot">Spot not found.</div>
    <div v-else class="p-6">
      <h1 class="text-3xl font-bold mb-4">{{ spot.title }}</h1>
  
      <!-- Images -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <img
          v-for="(image, index) in spot.images"
          :key="index"
          :src="image.image_url"
          class="w-full h-48 object-cover rounded"
        />
      </div>
  
      <!-- Info -->
      <p class="text-lg text-gray-700">{{ spot.description }}</p>
      <p class="mt-2 text-sm text-gray-500">
        📍 {{ spot.locations.city }}, {{ spot.locations.country.name }}
      </p>
      <p class="mt-2 text-xl font-bold">€{{ spot.price_per_night }} / night</p>
  
      <!-- Amenities -->
      <div class="mt-6">
        <h3 class="font-semibold mb-2">🛠 Amenities</h3>
        <ul class="list-disc pl-5">
          <li v-for="(a, i) in spot.amenities" :key="i">{{ a }}</li>
        </ul>
      </div>
  
      <!-- Reviews -->
      <div class="mt-6">
        <h3 class="font-semibold mb-2">⭐ Reviews</h3>
        <div v-if="spot.reviews.length === 0">No reviews yet.</div>
        <div v-else>
          <div
            v-for="(review, i) in spot.reviews"
            :key="i"
            class="border-b border-gray-200 py-2"
          >
            <p class="text-sm italic text-gray-600">"{{ review.comment }}"</p>
            <p class="text-sm text-gray-500">
              Rating: {{ review.rating }} ⭐ by {{ review.reviewer }} on
              {{ new Date(review.date).toLocaleDateString() }}
            </p>
          </div>
        </div>
      </div>
  
      <!-- Availability -->
      <div class="mt-6">
        <h3 class="font-semibold mb-2">📅 Unavailable Dates</h3>
        <div v-if="spot.unavailableDates.length === 0">Fully available!</div>
        <ul class="list-disc pl-5">
          <li
            v-for="(d, i) in spot.unavailableDates"
            :key="i"
          >
            {{ new Date(d.start_date).toLocaleDateString() }} →
            {{ new Date(d.end_date).toLocaleDateString() }}
          </li>
        </ul>
      </div>
    </div>
  </template>
  



<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const spot = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await fetch(`/camping-spots/${route.params.id}`)
    spot.value = await res.json()
  } catch (err) {
    console.error('Failed to load spot:', err)
  } finally {
    loading.value = false
  }
})
</script>