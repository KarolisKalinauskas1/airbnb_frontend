<template>
  <div class="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
    <h3 class="text-lg font-medium mb-4 border-b pb-2">Price details</h3>
    
    <!-- Price Breakdown -->
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <span>
          €{{ basePrice }} × {{ nights }} night{{ nights > 1 ? 's' : '' }}
        </span>
        <span>€{{ subtotal }}</span>
      </div>
      
      <div class="flex justify-between items-center">
        <span>Service fee</span>
        <span>€{{ serviceFee }}</span>
      </div>
      
      <div class="flex justify-between items-center pt-4 mt-2 border-t border-gray-100 font-bold text-lg">
        <span>Total</span>
        <span>€{{ total }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  basePrice: {
    type: [Number, String],
    required: true
  },
  nights: {
    type: [Number, String],
    required: true
  },
  serviceFeePercent: {
    type: [Number, String],
    default: 10
  }
});

const subtotal = computed(() => {
  const base = parseFloat(props.basePrice);
  const nights = parseInt(props.nights);
  return (base * nights).toFixed(2);
});

const serviceFee = computed(() => {
  const rawSubtotal = parseFloat(subtotal.value);
  const feePercent = parseFloat(props.serviceFeePercent) / 100;
  return (rawSubtotal * feePercent).toFixed(2);
});

const total = computed(() => {
  return (parseFloat(subtotal.value) + parseFloat(serviceFee.value)).toFixed(2);
});
</script>

<style scoped>
.bg-white {
  transition: all 0.3s ease;
}

.bg-white:hover {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
}
</style>
