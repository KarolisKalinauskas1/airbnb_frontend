<template>
  <div class="network-status" :class="{ 'network-status--offline': !networkAvailable }">
    <transition name="fade">
      <div v-if="!networkAvailable" class="offline-notification">
        <div class="icon">
          <i class="fas fa-wifi-slash"></i>
        </div>
        <div class="message">
          <strong>You are offline.</strong> 
          Some features may be limited.
          <button @click="retry" class="retry-button">
            <i class="fas fa-sync"></i> Retry
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { checkBackendHealth, checkNetworkConnectivity } from '@/utils/healthCheck';

export default {
  name: 'NetworkStatusIndicator',
  setup() {
    const CHECK_INTERVAL = 60000; // Check every 60 seconds
    const networkAvailable = ref(navigator.onLine);
    const checkInterval = ref(null);
    const lastCheck = ref(Date.now());
    const checkInProgress = ref(false);

    // Single health check function
    const checkHealth = async () => {
      if (checkInProgress.value) return;
      
      try {
        checkInProgress.value = true;
        const response = await fetch('/api/health', {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' },
          signal: AbortSignal.timeout(3000)
        });
        networkAvailable.value = response.ok;
      } catch (error) {
        networkAvailable.value = false;
      } finally {
        checkInProgress.value = false;
        lastCheck.value = Date.now();
      }
    };

    // Set up event listeners for online/offline status
    onMounted(() => {
      window.addEventListener('online', checkHealth);
      window.addEventListener('offline', () => networkAvailable.value = false);
      
      // Initial check
      checkHealth();
      
      // Set up interval
      checkInterval.value = setInterval(checkHealth, CHECK_INTERVAL);
    });

    onUnmounted(() => {
      window.removeEventListener('online', checkHealth);
      window.removeEventListener('offline', () => networkAvailable.value = false);
      if (checkInterval.value) {
        clearInterval(checkInterval.value);
      }
    });

    // Retry connection
    const retry = async () => {
      if (checkInProgress.value) return;
      
      // Check network connectivity first
      const isOnline = checkNetworkConnectivity();
      if (!isOnline) {
        networkAvailable.value = false;
        return;
      }
      
      // Then check backend health
      await checkHealth();
    };

    return {
      networkAvailable,
      retry
    };
  }
};
</script>

<style scoped>
.network-status {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
}

.offline-notification {
  display: flex;
  align-items: center;
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px 15px;
  border-bottom: 1px solid #f5c6cb;
}

.icon {
  margin-right: 10px;
  font-size: 18px;
}

.message {
  flex: 1;
  font-size: 14px;
}

.retry-button {
  background-color: transparent;
  border: 1px solid #721c24;
  color: #721c24;
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 12px;
  cursor: pointer;
  margin-left: 10px;
}

.retry-button:hover {
  background-color: #721c24;
  color: white;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
