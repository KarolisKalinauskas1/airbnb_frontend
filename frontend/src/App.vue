<template>
  <div>
    <!-- Auth loop warning banner -->
    <div v-if="authLoopDetected" class="auth-loop-banner">
      <div class="alert-content">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Authentication loop detected! Restarting application...</span>
      </div>
    </div>

    <!-- Backend down banner -->
    <div v-if="backendDown" class="backend-down-banner">
      <div class="alert-content">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Server connection issues detected. Some features may be limited.</span>
      </div>
    </div>

    <!-- Add API health check banner -->
    <ApiHealthCheck />
    
    <NavComponent />
    <main>
      <router-view v-slot="{ Component }">
        <template v-if="Component">
          <suspense>
            <component :is="Component" />
            <template #fallback>
              <div class="flex justify-center items-center h-64">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              </div>
            </template>
          </suspense>
        </template>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import NavComponent from '@/components/NavComponent.vue'
import ApiHealthCheck from '@/components/ApiHealthCheck.vue'
import axios from '@/axios'

// Add auth loop detection
const authLoopDetected = ref(false)
const lastAuthAttempts = ref([])
const MAX_AUTH_HISTORY = 10

function isOffline() {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

function isAuthLoop() {
  const now = Date.now();
  const recentAttempts = lastAuthAttempts.value.filter(
    time => now - time < 10000 // Look at attempts in last 10 seconds
  );
  
  // If we have 5+ auth attempts in 10 seconds, that's a loop
  return recentAttempts.length >= 5;
}

function trackAuthAttempt() {
  lastAuthAttempts.value.push(Date.now());
  if (lastAuthAttempts.value.length > MAX_AUTH_HISTORY) {
    lastAuthAttempts.value.shift(); // Remove oldest
  }
  
  // Check if we're in a loop
  if (isAuthLoop()) {
    authLoopDetected.value = true;
    console.error('Auth loop detected! Breaking cycle.');
    // Force reset auth state to break the loop
    localStorage.removeItem('userData');
    
    // Reset states
    setTimeout(() => {
      authLoopDetected.value = false;
      lastAuthAttempts.value = [];
      // Force page reload to recover
      window.location.href = '/';
    }, 3000);
  }
}

// Simple fallback implementations
function safeMonitorCall() {
  return true; // Always allow
}

function safeResetCounter() {
  // Does nothing
}

const authStore = useAuthStore()
const { loading } = storeToRefs(authStore)
const backendDown = ref(false)
const router = useRouter()
const previousPath = ref('/')

// Reset request tracking when route changes to avoid issues with cached requests
watch(() => router.currentRoute.value.path, (newPath, oldPath) => {
  console.log('Route changed:', oldPath, '->', newPath)
  
  // Only reset for major route changes (not query param changes)
  if (oldPath !== newPath) {
    console.log('Major route change detected, resetting request state')
    axios.resetRequestStats()
    safeResetCounter()
  }
  
  previousPath.value = newPath
}, { immediate: true })

// Check if backend is available
const checkBackendStatus = async () => {
  // Always allow the check
  try {
    await axios.get('/health', { 
      timeout: 5000,
      headers: {
        'Accept': 'application/json'
      },
      bypassDedupe: true // Always make this request
    })
    backendDown.value = false
  } catch (error) {
    console.error('Backend connectivity issue:', error)
    backendDown.value = true
  }
}

// Periodically check API status
onMounted(async () => {
  // Check on mount
  checkBackendStatus()
  
  // Then check every 30 seconds
  const interval = setInterval(checkBackendStatus, 30000)
  
  // Clean up on unmount
  onUnmounted(() => {
    clearInterval(interval)
  })
})

// Listen for auth store initialization
watch(() => authStore.initializationAttempts, (newCount) => {
  if (newCount > 0) {
    trackAuthAttempt();
  }
});
</script>

<style>
.auth-loop-banner {
  background-color: #FEF2F2;
  border-bottom: 1px solid #F87171;
  color: #B91C1C;
  padding: 0.5rem 1rem;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 60;
}

.backend-down-banner {
  background-color: #FEF2F2;
  border-bottom: 1px solid #F87171;
  color: #B91C1C;
  padding: 0.5rem 1rem;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
}

.alert-content {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
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
