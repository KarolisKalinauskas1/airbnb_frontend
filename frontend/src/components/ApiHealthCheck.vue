<template>
  <div v-if="showBanner" 
       class="fixed top-0 left-0 right-0 bg-red-100 border-b border-red-200 text-red-800 z-50 px-4 py-3">
    <div class="container mx-auto flex items-center justify-between">
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <p>{{ message }}</p>
      </div>
      <button @click="tryReconnect" class="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
        Try Again
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import axios from '@/axios';

const showBanner = ref(false);
const message = ref('');
let interval = null;

// Check API health
const checkApiHealth = async () => {
  try {
    const response = await axios.get('/api/dashboard/health', { 
      timeout: 3000,
      bypassDedupe: true // Always make this request
    });
    
    if (response.status === 200) {
      showBanner.value = false;
    }
  } catch (error) {
    console.error('API health check failed:', error);
    showBanner.value = true;
    message.value = 'API server is not responding. Some features may be unavailable.';
  }
};

// Try to reconnect to the API
const tryReconnect = async () => {
  message.value = 'Attempting to reconnect...';
  await checkApiHealth();
};

onMounted(() => {
  // Check API health immediately
  checkApiHealth();
  
  // Set up periodic checks
  interval = setInterval(checkApiHealth, 30000); // Check every 30 seconds
});

onUnmounted(() => {
  if (interval) {
    clearInterval(interval);
  }
});
</script>
