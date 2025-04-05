<template>
    <div>
        <div v-if="booking.start_date && booking.end_date" class="mb-4 p-4 border rounded bg-white shadow space-y-1">
            <div class="mb-4 p-4 border rounded bg-white shadow space-y-1">
                <p><strong>From:</strong> {{ formatDate(booking.start_date) }}</p>
                <p><strong>To:</strong> {{ formatDate(booking.end_date) }}</p>
                <p><strong>Guests:</strong> {{ booking.number_of_guests }}</p>
                <p><strong>Cost:</strong> ${{ booking.cost }}</p>
            
                <div v-if="booking.camping_spot">
                    <p><strong>Camping Spot:</strong> {{ booking.camping_spot.title }}</p>
                </div>
            
                <div v-if="booking.review">
                    <p><strong>Rating:</strong> ⭐ {{ booking.review.rating }}</p>
                    <p><strong>Comment:</strong> "{{ booking.review.comment }}"</p>
                </div>
            </div>
        </div>
    </div>
</template>
  
  <script setup>
  const props = defineProps({
    booking: Object,
  })
  
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString()
  }
  </script>
  