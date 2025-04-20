<template>
  <div v-if="showBanner" class="bg-yellow-50 border-b border-yellow-200 p-2">
    <div class="flex items-center justify-center text-sm">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>API connection issue detected. Some features may be limited.</span>
      <button 
        @click="retry" 
        class="ml-4 underline text-blue-600 hover:text-blue-800"
        :disabled="retrying"
      >
        {{ retrying ? 'Retrying...' : 'Retry' }}
      </button>
      <button @click="dismiss" class="ml-4 text-gray-500 hover:text-gray-700">
        ✕
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from '@/axios';
import { shouldAllowRequest } from '@/utils/requestThrottler';

const showBanner = ref(false);
const retrying = ref(false);
const checkCount = ref(0);
const maxChecks = 5; // Max number of checks to avoid excessive requests
const lastCheckTime = ref(0);
const minCheckInterval = 30000; // Minimum 30 seconds between checks

// Function to check API health
const checkHealth = async (force = false) => {
  // Avoid excessive checks
  const now = Date.now();
  if (!force && checkCount.value >= maxChecks) return;
  if (!force && now - lastCheckTime.value < minCheckInterval) return;
  
  // Use the request throttler to prevent rapid requests
  const endpoint = checkCount.value % 2 === 0 ? '/health' : '/api/health';
  if (!force && !shouldAllowRequest(endpoint, { minInterval: 5000 })) {
    console.log('Health check throttled to prevent rate limiting');
    return;
  }
  
  checkCount.value++;
  lastCheckTime.value = now;
  
  try {
    await axios.get(endpoint, { 
      timeout: 3000,
      // Remove Cache-Control header since it's causing CORS issues
      headers: { } 
    });
    showBanner.value = false;
  } catch (error) {
    console.warn('API health check failed:', error.message);
    showBanner.value = true;
  }
};

// Function to retry connection with exponential backoff
const retry = async () => {
  if (retrying.value) return;
  
  retrying.value = true;
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      // Try alternating endpoints
      const endpoint = attempts % 2 === 0 ? '/api/health' : '/health';
      await axios.get(endpoint, { 
        timeout: 3000,
        // Remove Cache-Control header
        headers: { } 
      });
      showBanner.value = false;
      retrying.value = false;
      return;
    } catch (error) {
      console.warn(`API retry attempt ${attempts + 1} failed:`, error.message);
      attempts++;
      
      // Wait with exponential backoff before next attempt
      if (attempts < maxAttempts) {
        const delay = Math.pow(2, attempts) * 1000; // 2s, 4s, 8s...
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  retrying.value = false;
};

// Function to dismiss banner
const dismiss = () => {
  showBanner.value = false;
  // Remember user dismissed it for this session
  sessionStorage.setItem('apiHealthBannerDismissed', 'true');
};

onMounted(() => {
  // Check if user previously dismissed the banner
  if (sessionStorage.getItem('apiHealthBannerDismissed') === 'true') {
    return;
  }
  
  // Check API health on component mount, after a short delay
  setTimeout(() => {
    checkHealth(true);
  }, 3000);
  
  // Set up interval to check periodically, but not too often
  const interval = setInterval(() => {
    checkHealth();
  }, 60000); // Check once per minute at most
  
  // Clean up on component unmount
  return () => {
    clearInterval(interval);
  };
});
</script>
