<template>
  <div class="bg-white p-4 rounded-lg shadow">
    <h3 class="text-lg font-medium mb-3">Price Suggestion</h3>
    <div v-if="loading" class="flex justify-center py-4">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
    </div>
    <div v-else-if="error" class="text-red-500 text-sm">{{ error }}</div>
    <div v-else class="space-y-4">
      <!-- Current Price -->
      <div class="flex justify-between items-center mb-2">
        <span class="text-gray-600">Current Price</span>
        <span class="font-semibold">€{{ formatPrice(currentPrice) }}</span>
      </div>
      <!-- Last Updated Info -->
      <div v-if="marketDetails?.last_updated" class="text-xs text-gray-500 mb-2">
        Last updated: {{ formatTimeSince(marketDetails.hours_since_update) }} ago
      </div>
      <!-- Suggested Price -->
      <div class="border p-3 rounded-lg" :class="{'bg-gray-50': !suggestion.shouldUpdate}">
        <div class="flex justify-between items-center mb-1">
          <span class="text-gray-600">Suggested Price</span>
          <span class="font-semibold" :class="{
            'text-green-600': suggestion.suggestedPrice > props.currentPrice,
            'text-amber-600': suggestion.suggestedPrice < props.currentPrice,
            'text-blue-600': suggestion.suggestedPrice == props.currentPrice
          }">
            €{{ formatPrice(suggestion.suggestedPrice) }} 
            <span class="text-xs">{{ priceComparison.text }}</span>
          </span>
        </div>
        <!-- Range -->
        <div class="text-xs text-gray-500 mb-2">
          Range: €{{ formatPrice(suggestion.minSuggestion) }} - €{{ formatPrice(suggestion.maxSuggestion) }}
        </div>
        <!-- Reason -->
        <div v-if="suggestion.reason" class="text-sm mt-2 p-2 bg-gray-50 rounded border-l-4" 
          :class="{
            'border-green-500': suggestion.suggestedPrice > props.currentPrice,
            'border-amber-500': suggestion.suggestedPrice < props.currentPrice,
            'border-blue-500': suggestion.suggestedPrice == props.currentPrice
          }">
          {{ suggestion.reason }}
        </div>
      </div>
      <!-- Manual Price Input or Price Factors (toggled) -->
      <div>
        <div class="flex justify-between items-center mb-2">
          <button 
            @click="showDetailedFactors = !showDetailedFactors" 
            class="text-sm text-blue-600 hover:text-blue-800">
            {{ showDetailedFactors ? 'Enter Custom Price' : 'Show Price Factors' }}
          </button>
        </div>
        <!-- Custom Price Input -->
        <div v-if="!showDetailedFactors" class="mt-2">
          <div class="flex space-x-2">
            <div class="relative flex-grow">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">€</span>
              <input 
                type="number" 
                v-model="newPrice" 
                min="1" 
                step="0.5"
                class="w-full pl-8 pr-2 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter custom price"
              >
            </div>
            <button 
              v-if="showUpdateButton && newPrice && Number(newPrice) !== Number(props.currentPrice)"
              @click="confirmPriceUpdate"
              class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors">
              Update
            </button>
          </div>
          <div class="mt-1 text-xs text-gray-500">
            Enter your custom price or use the suggested price
          </div>
        </div>
        <!-- Price Factors -->
        <div v-else class="border-t pt-3">
          <h4 class="text-sm font-medium mb-2">Price Factors:</h4>
          <ul class="text-xs space-y-1">
            <li class="flex justify-between">
              <span>Base Price:</span>
              <span>€{{ formatPrice(suggestion.factors.basePrice) }}</span>
            </li>
            <li class="flex justify-between">
              <span>Amenity Bonus:</span>
              <span>€{{ formatPrice(suggestion.factors.amenityBonus) }}</span>
            </li>
            <li class="flex justify-between">
              <span>Location Bonus:</span>
              <span>€{{ formatPrice(suggestion.factors.locationBonus) }}</span>
            </li>
            <li class="flex justify-between">
              <span>Demand Multiplier:</span>
              <span>x{{ suggestion.factors.demandMultiplier }}</span>
            </li>
            <li class="flex justify-between">
              <span>Occupancy Rate:</span>
              <span>{{ suggestion.factors.occupancyRate }}%</span>
            </li>
            <li class="flex justify-between">
              <span>Seasonal Pricing:</span>
              <span>{{ suggestion.factors.isSeasonalPricing ? 'Peak' : 'Off-peak' }}</span>
            </li>
            <li class="flex justify-between">
              <span>Similar Spots in City:</span>
              <span>{{ suggestion.factors.similarSpots }}</span>
            </li>
            <li class="flex justify-between">
              <span>Supply Factor:</span>
              <span>x{{ suggestion.factors.supplyFactor }}</span>
            </li>
          </ul>
        </div>
      </div>
      <!-- Update Button - Large, for suggested price update -->
      <button 
        v-if="showUpdateButton && suggestion.shouldUpdate && suggestion.suggestedPrice !== Number(props.currentPrice)"
        @click="useSuggestedPrice"
        class="w-full py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
        Update to Suggested Price
      </button>
    </div>
    <!-- Confirmation Modal -->
    <div v-if="showConfirmModal" class="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      <div class="bg-white p-5 rounded-lg shadow-lg max-w-md w-full">
        <h3 class="text-lg font-semibold mb-3">Confirm Price Update</h3>
        <div class="mb-4">
          <p>Are you sure you want to update the price from <span class="font-bold">€{{ formatPrice(currentPrice) }}</span> to <span class="font-bold">€{{ formatPrice(priceToUpdate) }}</span>?</p>
          <div class="mt-2 text-sm text-gray-600">
            This will affect any future bookings.
          </div>
        </div>
        <div class="flex justify-end space-x-3">
          <button 
            @click="showConfirmModal = false" 
            class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button 
            @click="confirmUpdate" 
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
            Confirm Update
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from '@/axios'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
const props = defineProps({
  campingSpotId: {
    type: [Number, String],
    required: true
  },
  currentPrice: {
    type: [Number, String],
    required: true
  },
  showUpdateButton: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['update-price'])
const loading = ref(false)
const error = ref(null)
const marketDetails = ref(null)
const newPrice = ref(props.currentPrice)
const toast = useToast()
// UI state management
const showDetailedFactors = ref(true)
const showConfirmModal = ref(false)
const priceToUpdate = ref(0)
const suggestion = ref({
  suggestedPrice: 0,
  minSuggestion: 0,
  maxSuggestion: 0,
  reason: "",
  shouldUpdate: false,
  factors: {
    season: 'standard',
    demand: 'normal',
    similarSpots: 0,
    marketAverage: 0
  }
});
// Compute comparison text and class
const priceComparison = computed(() => {
  const current = Number(props.currentPrice);
  const suggested = Number(suggestion.value.suggestedPrice);
  if (suggested > current) {
    const pct = Math.round(((suggested - current) / current) * 100);
    return {
      text: `(${pct}% higher)`,
      class: 'text-green-600'
    };
  } else if (suggested < current) {
    const pct = Math.round(((current - suggested) / current) * 100);
    return {
      text: `(${pct}% lower)`,
      class: 'text-amber-600'
    };
  }
  return {
    text: '(optimal)',
    class: 'text-blue-600'
  };
});
// Format time since update
const formatTimeSince = (hours) => {
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
};
// Helper to capitalize first letter
const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};
// Format price with correct decimal places
const formatPrice = (price) => {
  if (price === null || price === undefined) return '0';
  // Convert to number and format with 1 decimal place
  return Number(price).toFixed(1);
};
// Fetch price suggestion from API
const fetchSuggestion = async () => {
  if (!props.campingSpotId) return;
  loading.value = true;
  error.value = null;
  try {
    // Force refresh the auth token before making request
    const authStore = useAuthStore();
    const token = await authStore.getAuthToken(true);
    let response = null;
    // Try API endpoint first
    try {
      response = await axios.get(`/api/camping-spots/${props.campingSpotId}/price-suggestion`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (apiError) {
      console.warn('API endpoint for price suggestion failed:', apiError.message);
      // Try without API prefix as fallback
      response = await axios.get(`/camping-spots/${props.campingSpotId}/price-suggestion`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        bypassDedupe: true
      });
    }
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    const data = response.data;
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format');
    }
    // Update the suggestion data
    suggestion.value = {
      suggestedPrice: data.suggestedPrice,
      minSuggestion: data.priceRange.min,
      maxSuggestion: data.priceRange.max,
      reason: data.reason,
      shouldUpdate: data.shouldUpdate,
      factors: data.factors || {}
    };
  } catch (err) {
    console.error('Failed to fetch price suggestion:', err);
    // Don't show error to user after price update - it's confusing since the price update succeeded
    if (!err.message?.includes('401') && !err.message?.includes('Unauthorized')) {
      error.value = err.message || 'Failed to fetch price suggestion';
    }
  } finally {
    loading.value = false;
  }
};
// Use suggested price
const useSuggestedPrice = () => {
  priceToUpdate.value = suggestion.value.suggestedPrice;
  showConfirmModal.value = true;
};
// Confirm custom price update
const confirmPriceUpdate = () => {
  if (!newPrice.value || isNaN(Number(newPrice.value)) || Number(newPrice.value) <= 0) {
    toast.error('Please enter a valid price');
    return;
  }
  priceToUpdate.value = Number(newPrice.value);
  showConfirmModal.value = true;
};
// Update price function
const updatePrice = async () => {
  if (priceToUpdate.value <= 0) {
    toast.error('Price must be greater than zero');
    return;
  }
  showConfirmModal.value = false;
  const authStore = useAuthStore();
  // Attempt update with fresh token
  const doPatch = async (token) => {
    return axios.patch(
      `/api/camping-spots/${props.campingSpotId}/price`,
      { price: priceToUpdate.value },
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );
  };
  try {
    const token = await authStore.getAuthToken(true);
    const response = await doPatch(token);
    if (response.status === 200) {
      emit('update-price', priceToUpdate.value);
      toast.success('Price updated successfully');
      showDetailedFactors.value = true;
      setTimeout(fetchSuggestion, 2000);
      return;
    }
    throw new Error('Failed to update price');
  } catch (err) {
    console.error('Error updating price:', err, err.response?.data);
    if (err.response?.status === 401) {
      // Try token refresh and retry once
      try {
        const newToken = await authStore.refreshToken();
        const retry = await doPatch(newToken);
        if (retry.status === 200) {
          emit('update-price', priceToUpdate.value);
          toast.success('Price updated successfully');
          showDetailedFactors.value = true;
          setTimeout(fetchSuggestion, 2000);
          return;
        }
      } catch {
        toast.error('Authentication failed. Please reload the page.');
        return;
      }
    }
    toast.error('Failed to update price. Please try again.');
  }
};
// Execute price update after confirmation
const confirmUpdate = async () => {
  await updatePrice();
};
// Set up watchers
watch(() => props.campingSpotId, () => {
  if (props.campingSpotId) {
    fetchSuggestion();
  }
});
watch(() => props.currentPrice, () => {
  newPrice.value = props.currentPrice;
});
// Initialize on mount
onMounted(() => {
  if (props.campingSpotId) {
    fetchSuggestion();
  }
});
</script>
<style scoped>
.price-suggestion-container {
  transition: all 0.3s ease;
}
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  appearance: textfield;
  -moz-appearance: textfield;
}
</style>
