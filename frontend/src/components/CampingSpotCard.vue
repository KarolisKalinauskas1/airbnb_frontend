<template>
  <router-link :to="`/camper/${spot.camping_spot_id}`" class="block">
    <div class="spot-card">
      <div class="image-container">
        <img
          v-if="spot.images?.[0]"
          :src="spot.images[0].image_url"
          :alt="spot.title"
          class="spot-image"
        />
        <div v-else class="placeholder-image">
          <span>No image available</span>
        </div>
        
        <!-- Price Badge -->
        <div class="price-badge">
          €{{ spot.price_per_night }} <span class="text-sm">/night</span>
        </div>
      </div>

      <div class="content">
        <h3 class="title">{{ spot.title }}</h3>
        <p class="location">{{ spot.location?.city }}, {{ spot.location?.country?.name }}</p>
        <div class="flex items-center gap-2 mt-2">
          <span class="amenity-tag" v-for="amenity in spot.camping_spot_amenities?.slice(0, 3)" :key="amenity.amenity_id">
            {{ amenity.amenity.name }}
          </span>
        </div>
      </div>
    </div>
  </router-link>
</template>

<style scoped>
.spot-card {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.spot-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.image-container {
  position: relative;
  aspect-ratio: 4/3;
  overflow: hidden;
}

.spot-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}

.spot-card:hover .spot-image {
  transform: scale(1.05);
}

.price-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.95);
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-weight: 600;
  color: #FF385C;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.content {
  padding: 1.5rem;
}

.title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #222222;
  margin-bottom: 0.25rem;
}

.location {
  color: #717171;
  font-size: 0.875rem;
}

.amenity-tag {
  background: #F7F7F7;
  color: #374151;
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
}
</style>

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
