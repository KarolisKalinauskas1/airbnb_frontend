<template>
  <div class="api-status" :class="{ 'api-status--offline': !apiAvailable }">
    <div class="status-indicator">
      <span class="status-dot" :class="statusClass"></span>
      <span class="status-text">{{ statusText }}</span>
    </div>
    
    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Checking...
    </div>
    
    <div v-if="!apiAvailable" class="error-details">
      <p>{{ errorMessage }}</p>
      <button @click="checkConnection" class="retry-button" :disabled="loading">
        <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-sync'"></i>
        {{ loading ? 'Checking...' : 'Retry' }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import axios from '@/axios';

export default {
  name: 'ApiStatus',
  setup() {
    const apiAvailable = ref(true);
    const loading = ref(false);
    const errorMessage = ref('');
    const lastError = ref(null);
    const checkInterval = ref(null);
    let abortController = null;
    
    // Computed properties for visual status
    const statusClass = computed(() => {
      if (loading.value) return 'status-dot--loading';
      return apiAvailable.value ? 'status-dot--online' : 'status-dot--offline';
    });
    
    const statusText = computed(() => {
      if (loading.value) return 'Checking...';
      return apiAvailable.value ? 'Online' : 'Offline';
    });
    
    // Check the API connection status with proper timeout handling
    const checkConnection = async () => {
      if (loading.value) return;
      
      // Cancel any previous request
      if (abortController) {
        abortController.abort();
      }
      
      loading.value = true;
      errorMessage.value = '';
      abortController = new AbortController();
      
      try {
        // First check if the browser thinks we're online
        if (!navigator.onLine) {
          apiAvailable.value = false;
          errorMessage.value = 'Your device appears to be offline. Please check your internet connection.';
          return;
        }
        
        // Create timeout manually to ensure it works
        const timeoutId = setTimeout(() => {
          abortController.abort('Request timed out');
        }, 5000);
        
        // Try a simple API check with lower timeout
        const response = await axios.get('/api/ping', { 
          signal: abortController.signal,
          timeout: 5000 
        });
        
        clearTimeout(timeoutId);
        
        if (response.status >= 200 && response.status < 300) {
          apiAvailable.value = true;
          lastError.value = null;
        } else {
          throw new Error(`API returned status ${response.status}`);
        }
      } catch (error) {
        // Don't log aborted requests as errors
        if (error.name === 'AbortError' || error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
          console.warn('API connection check was aborted');
        } else {
          console.error('Root endpoint check failed:', error.message);
        }
        
        apiAvailable.value = false;
        lastError.value = error;
        
        // Set appropriate error message based on error type
        if (!navigator.onLine) {
          errorMessage.value = 'Your device is offline. Please check your internet connection.';
        } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          errorMessage.value = 'The server is not responding. Please try again later.';
        } else if (error.response) {
          errorMessage.value = `Server error: ${error.response.status} ${error.response.statusText}`;
        } else {
          errorMessage.value = 'Cannot connect to the server. Please check your connection.';
        }
      } finally {
        loading.value = false;
        abortController = null;
      }
    };
    
    // Start periodic checks when component is mounted
    onMounted(() => {
      // Initial check
      checkConnection();
      
      // Set up periodic checks (every 60 seconds)
      checkInterval.value = setInterval(checkConnection, 60000);
      
      // Listen for online/offline events
      window.addEventListener('online', checkConnection);
      window.addEventListener('offline', () => {
        apiAvailable.value = false;
        errorMessage.value = 'Your device is offline. Please check your internet connection.';
      });
    });
    
    // Clean up when component is unmounted
    onUnmounted(() => {
      if (checkInterval.value) {
        clearInterval(checkInterval.value);
      }
      
      if (abortController) {
        abortController.abort();
      }
      
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', () => {});
    });
    
    return {
      apiAvailable,
      loading,
      errorMessage,
      statusClass,
      statusText,
      checkConnection
    };
  }
};
</script>

<style scoped>
.api-status {
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.status-indicator {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-dot--online {
  background-color: #4caf50;
}

.status-dot--offline {
  background-color: #f44336;
}

.status-dot--loading {
  background-color: #ffc107;
}

.error-details {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}

.retry-button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 14px;
  cursor: pointer;
  margin-top: 10px;
}

.retry-button:hover:not(:disabled) {
  background-color: #0069d9;
}

.retry-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.loading {
  color: #6c757d;
  font-size: 14px;
}
</style>
