<template>
  <div class="location-picker border border-gray-300 rounded-md">
    <div class="p-2 h-full" @click="openLocationModal">
      <div class="text-xs text-gray-500">Where</div>
      <div class="text-sm">{{ displayLocation || 'Select location' }}</div>
    </div>

    <!-- Location picker modal -->
    <div v-if="isModalOpen" class="modal">
      <div class="modal-content">
        <button @click="closeLocationModal">Close</button>
        <!-- Modal content for location selection -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const modelValue = ref(null);
const isModalOpen = ref(false);

const openLocationModal = () => {
  isModalOpen.value = true;
};

const closeLocationModal = () => {
  isModalOpen.value = false;
};

// Computed property to display location in a user-friendly way
const displayLocation = computed(() => {
  if (!modelValue.value) return '';
  
  const parts = [];
  if (modelValue.value.city) parts.push(modelValue.value.city);
  if (modelValue.value.country) parts.push(modelValue.value.country);
  
  return parts.join(', ') || modelValue.value.formatted_address || '';
});
</script>

<style scoped>
.location-picker {
  height: 100%;
  min-height: 3rem;
  display: flex;
  flex-direction: column;
}

.location-picker > div {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 1rem;
  border-radius: 0.5rem;
}
</style>