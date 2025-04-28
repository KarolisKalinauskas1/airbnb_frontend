<template>
  <div v-if="showBanner" class="offline-mode-banner">
    <div class="content">
      <div class="icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <div class="message">
        <strong>Offline Mode Active</strong> 
        <span>You're using cached data. Some features may be limited.</span>
      </div>
      <div class="actions">
        <button @click="checkConnectivity" class="check-button" :disabled="checking">
          <i :class="checking ? 'fas fa-spinner fa-spin' : 'fas fa-sync'"></i>
          {{ checking ? 'Checking...' : 'Check Connection' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { checkConnection } from '@/utils/networkHelper';
import { checkBackendHealth, getHealthState } from '@/utils/healthCheck';

export default {
  name: 'OfflineModeBanner',
  props: {
    // Whether to automatically hide the banner when online
    autoHide: {
      type: Boolean,
      default: true
    }
  },
  setup(props, { emit }) {
    const showBanner = ref(false);
    const checking = ref(false);
    let checkTimer = null;
    
    // Check if we need to display the banner
    const updateBannerVisibility = async () => {
      const healthState = getHealthState();
      showBanner.value = !healthState.api.isHealthy;
    };
    
    // Check connectivity and update banner accordingly
    const checkConnectivity = async () => {
      if (checking.value) return;
      
      checking.value = true;
      try {
        // Try checking the connection
        const isConnected = await checkConnection();
        
        if (isConnected) {
          // If connected, also check backend health
          const isHealthy = await checkBackendHealth(true);
          showBanner.value = !isHealthy;
          
          if (isHealthy) {
            // If healthy, emit an event to notify parent components
            emit('online');
          }
        } else {
          showBanner.value = true;
        }
      } catch (error) {
        console.error('Connection check failed:', error);
        showBanner.value = true;
      } finally {
        checking.value = false;
      }
    };
    
    // Handle online/offline events
    const handleOnline = () => {
      if (props.autoHide) {
        checkConnectivity();
      }
    };
    
    const handleOffline = () => {
      showBanner.value = true;
    };
    
    onMounted(() => {
      // Check initial status
      updateBannerVisibility();
      
      // Set up event listeners
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Set up periodic checks
      checkTimer = setInterval(updateBannerVisibility, 60000);
    });
    
    onUnmounted(() => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (checkTimer) {
        clearInterval(checkTimer);
      }
    });
    
    return {
      showBanner,
      checking,
      checkConnectivity
    };
  }
};
</script>

<style scoped>
.offline-mode-banner {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
  border-radius: 4px;
  margin-bottom: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.content {
  display: flex;
  align-items: center;
  padding: 12px 15px;
}

.icon {
  font-size: 20px;
  margin-right: 15px;
}

.message {
  flex: 1;
}

.message strong {
  display: block;
  margin-bottom: 2px;
}

.actions {
  margin-left: 15px;
}

.check-button {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  color: #495057;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 14px;
  cursor: pointer;
}

.check-button:hover:not(:disabled) {
  background-color: #e9ecef;
}

.check-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
