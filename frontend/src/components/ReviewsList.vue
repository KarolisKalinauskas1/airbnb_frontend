<template>
  <div class="reviews-container space-y-6">
    <h2 class="text-2xl font-semibold">Reviews</h2>
    
    <div v-if="loading" class="py-8 flex justify-center">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
    </div>
    
    <div v-else-if="error" class="py-6 text-center">
      <p class="text-red-500 mb-2">{{ error }}</p>
      <button @click="loadReviews" class="text-red-600 underline">Try again</button>
    </div>
    
    <div v-else-if="!reviews || reviews.length === 0" class="py-6 text-center text-gray-500">
      <p>No reviews yet for this camping spot.</p>
    </div>
    
    <div v-else class="space-y-6">
      <div v-for="review in reviews" :key="review.review_id" class="border-b border-gray-200 pb-6 last:border-0">
        <div class="flex justify-between items-start">
          <div class="flex items-center">
            <div class="flex-shrink-0 mr-3">
              <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                {{ getInitials(review.user?.full_name || 'Anonymous') }}
              </div>
            </div>
            <div>
              <h3 class="font-medium">{{ review.user?.full_name || 'Anonymous' }}</h3>
              <p class="text-sm text-gray-500">{{ formatDate(review.created_at) }}</p>
            </div>
          </div>
          <div class="flex items-center">
            <span class="text-yellow-400 mr-1">★</span>
            <span>{{ review.rating }}</span>
          </div>
        </div>
        <div v-if="review.comment" class="mt-3 text-gray-700">
          {{ review.comment }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from '@/axios';

const props = defineProps({
  campingSpotId: {
    type: [Number, String],
    required: true
  }
});

const reviews = ref([]);
const loading = ref(true);
const error = ref(null);

const loadReviews = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await axios.get(`/api/reviews/spot/${props.campingSpotId}`);
    reviews.value = response.data;
    console.log('Reviews loaded:', reviews.value);
  } catch (err) {
    console.error('Error loading reviews:', err);
    error.value = 'Failed to load reviews. Please try again.';
    
    // Try fallback path without /api prefix
    try {
      const fallbackResponse = await axios.get(`/reviews/spot/${props.campingSpotId}`);
      if (fallbackResponse && fallbackResponse.data) {
        reviews.value = fallbackResponse.data;
        error.value = null;
        console.log('Reviews loaded via fallback:', reviews.value);
      }
    } catch (fallbackErr) {
      console.error('Fallback review request also failed:', fallbackErr);
    }
  } finally {
    loading.value = false;
  }
};

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

onMounted(() => {
  loadReviews();
});
</script>

<style scoped>
.reviews-container {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}
</style>
