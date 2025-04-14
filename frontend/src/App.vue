<template>
  <div>
    <!-- Backend connection alert -->
    <div v-if="backendDown" class="backend-down-banner">
      <div class="alert-content">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        Backend server not responding. Limited functionality available.
      </div>
    </div>
    
    <NavComponent />
    <div v-if="loading" class="global-loading">
      <div class="loading-spinner"></div>
    </div>
    <RouterView v-else />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import NavComponent from '@/components/NavComponent.vue'
import axios from '@/axios'
import { monitorFunctionCall } from '@/utils/loopBreaker'

const authStore = useAuthStore()
const { loading } = storeToRefs(authStore)
const backendDown = ref(false)

// Check if backend is available with loop detection
const checkBackendStatus = async () => {
  // Use the loop breaker utility to prevent infinite checks
  if (!monitorFunctionCall('checkBackendStatus', { 
    timeWindow: 60000, // 1 minute
    maxCallsBeforeWarning: 3,
    maxCallsBeforeBlocking: 5
  })) {
    console.warn('Too many backend status checks in short period, using cached status');
    return backendDown.value === false;
  }
  
  // Set a flag to avoid multiple checks in quick succession
  const lastChecked = localStorage.getItem('lastBackendCheck');
  const now = Date.now();
  
  // Only check once per minute unless forced
  if (lastChecked && (now - parseInt(lastChecked)) < 60000) {
    console.log('Backend was checked recently, using cached status');
    backendDown.value = localStorage.getItem('backendStatus') === 'down';
    return backendDown.value === false;
  }
  
  try {
    // Use only the health endpoint for checking
    const response = await axios.get('/api/health', { 
      timeout: 3000,
      // Don't follow redirects
      maxRedirects: 0,
      // Accept all status codes as successful for connection test
      validateStatus: status => status < 500
    });
    
    if (response.status === 200) {
      console.log('Backend server is responsive');
      backendDown.value = false;
      localStorage.setItem('backendStatus', 'up');
      localStorage.setItem('lastBackendCheck', now.toString());
      return true;
    }
    
    console.warn('Backend returned non-200 status:', response.status);
    backendDown.value = true;
    localStorage.setItem('backendStatus', 'down');
    localStorage.setItem('lastBackendCheck', now.toString());
    return false;
  } catch (error) {
    console.error('Backend connection error:', error.message);
    backendDown.value = true;
    localStorage.setItem('backendStatus', 'down');
    localStorage.setItem('lastBackendCheck', now.toString());
    return false;
  }
};

// Immediately initialize auth on app mount
onMounted(async () => {
  await checkBackendStatus();
  
  try {
    console.log('App mounted, initializing auth...');
    await authStore.initAuth();
  } catch (error) {
    console.error('Failed to initialize auth:', error);
    // Don't retry here - let the individual components handle retries
  }
});
</script>

<style>
.backend-down-banner {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #f8d7da;
  color: #721c24;
  padding: 8px 16px;
  text-align: center;
  z-index: 10000;
  font-size: 14px;
  border-bottom: 1px solid #f5c6cb;
}

.alert-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 9999;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #ff5a5f;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Global styles for cursor pointers on interactive elements */
button, 
[type="button"],
[type="submit"],
[type="reset"],
.cursor-pointer,
a,
select,
input[type="date"],
input[type="checkbox"],
input[type="radio"] {
  cursor: pointer !important;
}

/* Apply cursor-pointer to common interactive class names */
.btn,
.button,
.link,
.clickable,
.hover\:bg-red-50,
.hover\:bg-red-100,
.hover\:bg-gray-50,
.hover\:bg-gray-100 {
  cursor: pointer !important;
}
</style>
