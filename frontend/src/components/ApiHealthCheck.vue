<template>
  <div v-if="showBanner" class="bg-yellow-50 border-b border-yellow-200 py-2 px-4">
    <div class="container mx-auto flex items-center justify-between">
      <span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block mr-1 -mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        API connection issue detected. Some features may be unavailable.
      </span>
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
import { ref, onMounted, onUnmounted } from 'vue';
import { checkBackendHealth, getHealthState } from '@/utils/healthCheck';

const showBanner = ref(false);
const retrying = ref(false);
let checkInterval = null;

// Function to check API health
const checkHealth = async (force = false) => {
  const isHealthy = await checkBackendHealth(force);
  
  // Only show banner for actual API issues (not network issues)
  if (!isHealthy && getHealthState().api.consecutiveFailures > 1) {
    showBanner.value = true;
  } else if (isHealthy) {
    showBanner.value = false;
  }
};

// Retry connection
const retry = async () => {
  retrying.value = true;
  try {
    await checkHealth(true);
  } finally {
    retrying.value = false;
  }
};

// Dismiss banner
const dismiss = () => {
  showBanner.value = false;
  
  // Only check again after a longer interval
  setTimeout(() => {
    if (!showBanner.value) {
      checkHealth(true);
    }
  }, 60000); // Check again after a minute
};

onMounted(async () => {
  // Check health on mount
  await checkHealth(true);
  
  // Set up interval to check periodically
  checkInterval = setInterval(() => checkHealth(), 60000); // Check every minute
});

onUnmounted(() => {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
});
</script>
