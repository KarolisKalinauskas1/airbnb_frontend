<template>
  <div class="price-suggestion-container bg-white p-4 rounded-lg border border-gray-200">
    <h3 class="text-lg font-semibold mb-4">Price Recommendations</h3>
    
    <div v-if="loading" class="text-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent mx-auto"></div>
      <p class="text-gray-500 mt-2">Analyzing market data...</p>
    </div>
    
    <div v-else-if="error" class="bg-red-50 text-red-800 p-3 rounded-md">
      {{ error }}
    </div>
    
    <div v-else>
      <!-- Current Price Display -->
      <div class="mb-6">
        <div class="flex items-baseline justify-between">
          <span class="text-gray-700">Current price:</span>
          <span class="font-semibold text-lg">€{{ currentPrice }}</span>
        </div>
      </div>
      
      <!-- Suggested Price with Details -->
      <div class="mb-6 border-t pt-4">
        <div class="flex justify-between items-baseline mb-2">
          <span class="text-gray-700">Suggested price:</span>
          <div>
            <span 
              class="font-bold text-lg"
              :class="priceComparison.class"
            >
              €{{ suggestedPrice }}
            </span>
            <span 
              class="ml-2 text-sm" 
              :class="priceComparison.class"
            >
              {{ priceComparison.text }}
            </span>
          </div>
        </div>
        
        <!-- Reasoning for suggestion -->
        <div class="bg-gray-50 p-3 rounded-md my-2">
          <p class="text-gray-700 text-sm">
            <strong>Why this price:</strong>
          </p>
          <ul class="mt-1 text-sm space-y-1">
            <li v-for="(reason, index) in priceReasons" :key="index" class="flex items-start">
              <span class="mr-2">•</span>
              <span>{{ reason }}</span>
            </li>
          </ul>
        </div>

        <div class="text-sm text-gray-500 mt-2">
          This recommended price applies to your base price and helps you stay competitive in your area.
        </div>
      </div>
      
      <div class="flex justify-between items-center" v-if="showUpdateButton">
        <div class="w-24">
          <input 
            type="number" 
            v-model.number="newPrice"
            min="1" 
            step="0.5"
            class="w-full border border-gray-300 rounded px-3 py-2 text-right"
            placeholder="Price"
          />
        </div>
        <button 
          @click="updatePrice"
          class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          Update Price
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from '@/axios'
import { useToast } from 'vue-toastification'

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
const suggestedPrice = ref(0)
const marketDetails = ref(null)
const newPrice = ref(props.currentPrice)
const toast = useToast()

// Generate reasons for price suggestion
const priceReasons = computed(() => {
  if (!marketDetails.value) return [];
  
  const reasons = [];
  const currentPriceNum = Number(props.currentPrice);
  const suggestedPriceNum = Number(suggestedPrice.value);
  
  if (marketDetails.value.similar_spots_avg_price) {
    reasons.push(`Similar spots in your area charge an average of €${marketDetails.value.similar_spots_avg_price} per night.`);
  }
  
  if (marketDetails.value.demand_factor > 1.1) {
    reasons.push('High demand in this area suggests a premium price point.');
  } else if (marketDetails.value.demand_factor < 0.9) {
    reasons.push('Lower demand in this area suggests a more competitive price.');
  }
  
  if (marketDetails.value.seasonality_factor > 1.1) {
    reasons.push('Current season is peak time for this location.');
  } else if (marketDetails.value.seasonality_factor < 0.9) {
    reasons.push('Current season is off-peak for this location.');
  }
  
  if (marketDetails.value.occupancy_rate < 40 && currentPriceNum > suggestedPriceNum) {
    reasons.push('Lower occupancy rate suggests a price reduction might increase bookings.');
  }
  
  if (reasons.length === 0) {
    reasons.push('Based on overall market conditions and booking patterns in your area.');
  }
  
  return reasons;
});

// Compute comparison text and class
const priceComparison = computed(() => {
  const current = Number(props.currentPrice);
  const suggested = Number(suggestedPrice.value);
  
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

const fetchSuggestion = async () => {
  loading.value = true
  error.value = null
  
  try {
    const { data } = await axios.get(`/camping-spots/${props.campingSpotId}/price-suggestion`)
    suggestedPrice.value = data.suggested_price
    marketDetails.value = data.market_details
    // Set the new price field to the suggested price initially
    newPrice.value = suggestedPrice.value
  } catch (err) {
    console.error('Failed to fetch price suggestion:', err)
    error.value = 'Could not get price suggestions at this time.'
  } finally {
    loading.value = false
  }
}

const updatePrice = async () => {
  if (!newPrice.value || isNaN(Number(newPrice.value)) || Number(newPrice.value) <= 0) {
    toast.error('Please enter a valid price');
    return;
  }
  
  try {
    // Log for debugging
    console.log(`Emitting price update: ${Number(newPrice.value)}`);
    
    // Emit the event with the numeric price value
    emit('update-price', Number(newPrice.value));
    
    // Show success feedback
    toast.success('Price update request sent');
  } catch (err) {
    console.error('Error in price update component:', err);
    toast.error('Failed to process price update request');
  }
};

watch(() => props.campingSpotId, () => {
  if (props.campingSpotId) {
    fetchSuggestion()
  }
})

watch(() => props.currentPrice, () => {
  newPrice.value = props.currentPrice
})

onMounted(() => {
  if (props.campingSpotId) {
    fetchSuggestion()
  }
})
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
  -moz-appearance: textfield;
}
</style>
