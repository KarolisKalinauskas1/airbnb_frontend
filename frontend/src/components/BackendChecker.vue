<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import axios from '@/axios';
import { useToast } from 'vue-toastification';

const toast = useToast();
const isBackendAvailable = ref(true);
const isChecking = ref(false);
const checkInterval = ref(null);
const CHECK_INTERVAL_MS = 30000; // 30 seconds
const reconnectTimeout = ref(null);

const checkBackend = async () => {
  if (isChecking.value) return;
  
  isChecking.value = true;
  try {
    await axios.get('/health', { 
      timeout: 2000,
      skipBackendCheck: true,
      validateStatus: () => true
    });
    
    if (!isBackendAvailable.value) {
      isBackendAvailable.value = true;
      toast.success('Connection to server restored');
    }
  } catch (error) {
    if (isBackendAvailable.value) {
      isBackendAvailable.value = false;
      toast.warning('Server connection lost. Using offline mode.', {
        timeout: 10000
      });
    }
  } finally {
    isChecking.value = false;
  }
};

// Try to reconnect if backend is unavailable
const tryReconnect = async () => {
  if (!isBackendAvailable.value) {
    await checkBackend();
    
    // Schedule next check if still unavailable
    if (!isBackendAvailable.value) {
      reconnectTimeout.value = setTimeout(tryReconnect, 5000);
    }
  }
};

// Initial check when component mounts
onMounted(async () => {
  await checkBackend();
  checkInterval.value = setInterval(checkBackend, CHECK_INTERVAL_MS);
  
  // If backend is unavailable, try reconnecting
  if (!isBackendAvailable.value) {
    tryReconnect();
  }
});

// Clean up on component unmount
onUnmounted(() => {
  if (checkInterval.value) {
    clearInterval(checkInterval.value);
  }
  
  if (reconnectTimeout.value) {
    clearTimeout(reconnectTimeout.value);
  }
});
</script>

<template>
  <div v-if="!isBackendAvailable" class="backend-offline-indicator">
    <div class="offline-content">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="offline-icon" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="M7 11.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5z"/>
      </svg>
      <span>Offline Mode - Limited Functionality Available</span>
    </div>
  </div>
</template>

<style scoped>
.backend-offline-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #fef3c7;
  color: #92400e;
  padding: 4px 8px;
  text-align: center;
  font-size: 0.875rem;
  z-index: 1000;
  border-bottom: 1px solid #f59e0b;
}

.offline-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.offline-icon {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}
</style>
