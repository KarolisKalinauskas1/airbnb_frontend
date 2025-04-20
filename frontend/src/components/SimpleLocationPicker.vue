<template>
  <div class="simple-location-picker">
    <div class="border border-gray-300 rounded-md px-3 py-2">
      <input 
        type="text" 
        v-model="locationText" 
        @change="handleLocationChange"
        placeholder="Enter a city or address"
        class="w-full outline-none focus:ring-red-500"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  selectedLocation: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:selectedLocation']);

// Create a reactive variable for the location text input
const locationText = ref('');

// Handle when user changes the location text
const handleLocationChange = () => {
  // Create a simple location object
  if (locationText.value.trim()) {
    emit('update:selectedLocation', {
      formatted_address: locationText.value,
      city: locationText.value.split(',')[0]?.trim() || locationText.value,
      lat: null, // In a real app you'd use geocoding here
      lng: null
    });
  } else {
    emit('update:selectedLocation', null);
  }
};

// Watch for changes in selectedLocation prop
watch(() => props.selectedLocation, (newValue) => {
  if (newValue) {
    locationText.value = newValue.formatted_address || newValue.city || '';
  } else {
    locationText.value = '';
  }
}, { immediate: true });
</script>

<style scoped>
.simple-location-picker {
  width: 100%;
}
</style>
