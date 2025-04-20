<template>
  <div>
    <!-- Auth loop warning banner -->
    <div v-if="authLoopDetected" class="bg-red-50 border-b border-red-300 text-red-700 py-2 px-4 fixed top-0 left-0 right-0 z-50">
      <div class="flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Authentication loop detected! Restarting application...</span>
      </div>
    </div>

    <!-- Backend down banner -->
    <div v-if="backendDown" class="bg-red-50 border-b border-red-300 text-red-700 py-2 px-4 fixed top-0 left-0 right-0 z-50">
      <div class="flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Server connection issues detected. Some features may be limited.</span>
      </div>
    </div>

    <!-- Stack overflow error banner -->
    <div v-if="stackOverflowDetected" class="bg-red-50 border-b border-red-300 text-red-700 py-2 px-4 fixed top-0 left-0 right-0 z-50">
      <div class="flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Infinite recursion detected. Try refreshing the page.</span>
        <button @click="handleStackOverflow" class="ml-4 underline text-blue-600 hover:text-blue-800">Reset</button>
      </div>
    </div>

    <!-- Add API health check banner -->
    <ApiHealthCheck />
    
    <NavComponent />
    <main class="flex-grow relative">
      <router-view v-slot="{ Component, route }">
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
        <template v-else>
          <!-- Fallback when component fails to load -->
          <div class="min-h-screen flex items-center justify-center py-12">
            <div class="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
              <div class="w-16 h-16 bg-red-100 mx-auto rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 class="mt-6 text-2xl font-semibold text-center text-gray-900">Page Failed to Load</h2>
              <p class="mt-2 text-center text-gray-600">We couldn't load this page. Try refreshing or going back.</p>
              <div class="mt-6 flex justify-center">
                <button @click="refreshPage" class="bg-red-500 text-white px-4 py-2 rounded-lg">
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </template>
      </router-view>
    </main>

    <!-- Global loading indicator -->
    <div v-if="loading" class="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
      <div class="w-10 h-10 border-2 border-gray-200 rounded-full animate-spin" style="border-top-color: #EF4444;"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, onErrorCaptured, provide } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import NavComponent from '@/components/NavComponent.vue'
import ApiHealthCheck from '@/components/ApiHealthCheck.vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import ErrorView from '@/views/ErrorView.vue'
import axios from '@/axios'
import { resetAllRequests } from '@/utils/requestTracker'

// Add auth loop detection
const authLoopDetected = ref(false)
const stackOverflowDetected = ref(false)
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

// Handle stack overflow
function handleStackOverflow() {
  // Clear all localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();
  // Force page reload
  window.location.href = '/';
}

// Refresh page handler
function refreshPage() {
  window.location.reload();
}

// Simple fallback implementations
function safeMonitorCall() {
  return true; // Always allow
}

// Using the existing resetAllRequests function here instead of redeclaring it
function safeResetCounter() {
  try {
    if (typeof axios.resetRequestStats === 'function') {
      const count = axios.resetRequestStats();
      if (count > 0) {
        console.log(`Safely aborted ${count} pending requests`);
      }
      return count;
    } else {
      console.warn('resetRequestStats function not available on axios instance');
      return 0;
    }
  } catch (error) {
    console.error('Error in safeResetCounter:', error);
    return 0;
  }
}

const authStore = useAuthStore()
const { loading: authLoading } = storeToRefs(authStore)
const backendDown = ref(false)
const router = useRouter()
const previousPath = ref('/')

// Missing reactive property - add this
const loading = ref(false)

// Enhanced error tracking for debugging
const routeError = ref(null);

// Add global error handler to catch and log errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  if (event.error && event.error.message && event.error.message.includes('Failed to fetch dynamically imported module')) {
    routeError.value = 'Failed to load page module. This might be due to a network issue or a problem with the page.';
    console.error('Module loading error details:', event);
  }
  if (event.error && event.error.toString().includes('Maximum call stack size exceeded')) {
    stackOverflowDetected.value = true;
    console.error('Infinite recursion detected:', event.error);
  }
});

// Watch for route changes to reset error state
watch(() => router.currentRoute.value.path, () => {
  routeError.value = null;
}, { immediate: true });

// Reset request tracking when route changes to avoid issues with cached requests
watch(() => router.currentRoute.value.path, (newPath, oldPath) => {
  console.log('Route changed:', oldPath, '->', newPath)
  
  // Only reset for major route changes (not query param changes)
  if (oldPath !== newPath) {
    console.log('Major route change detected, resetting request state')
    
    try {
      // Use our safe function directly
      safeResetCounter();
    } catch (error) {
      console.error('Error resetting request state:', error);
    }
  }
  
  previousPath.value = newPath
}, { immediate: true })

// Add a more reliable backend status check
const checkBackendStatus = async () => {
  // Always allow the check
  try {
    // Try multiple endpoints to determine backend status
    const endpoints = [
      '/health',
      '/api/health',
      '/api/camping-spots'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint, { 
          timeout: 5000,
          headers: {
            'Accept': 'application/json'
          },
          bypassDedupe: true // Always make this request
        });
        
        if (response.status >= 200 && response.status < 300) {
          console.log(`Backend connectivity check passed using ${endpoint}`);
          backendDown.value = false;
          return;
        }
      } catch (endpointError) {
        console.warn(`Backend check failed for ${endpoint}:`, endpointError.message);
      }
    }
    
    // If all checks fail, mark backend as down
    console.error('Backend seems to be down - all endpoints failed');
    backendDown.value = true;
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
}, { immediate: false });

// Capture errors from descendant components
onErrorCaptured((err, instance, info) => {
  console.error('Global error captured:', err);
  console.error('Error info:', info);
  
  // Set the route error for display
  routeError.value = err.message || 'An unknown error occurred';
  
  if (err && err.message && err.message.includes('Maximum call stack size exceeded')) {
    stackOverflowDetected.value = true;
  }
  
  // Return false to prevent the error from propagating further
  return false;
});

// Make the error handler available to all components
provide('handleError', (error) => {
  console.error('Error handled via provide/inject:', error);
  routeError.value = error.message || 'An error occurred';
});

// Make loading reactive available to all components
provide('globalLoading', loading);

// Clear error when route changes
router.beforeEach(() => {
  routeError.value = null;
  return true;
});
</script>

<style>
/* Base styles that aren't dependent on Tailwind @apply */
body {
  font-family: Circular, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Fix date input styling */
input[type="date"] {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
}

/* Fix for global loading indicator */
.global-loading {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 50;
}

.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 0.25rem solid #f3f4f6;
  border-top-color: #ef4444;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Any custom animations or styles that can't be done with Tailwind utilities */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

/* Global styles for cursor pointers on interactive elements */
button, 
[type="button"],
[type="submit"],
[type="reset"],
[type="pointer"],
a,
select,
input[type="date"],
input[type="checkbox"],
input[type="radio"] {
  cursor: pointer;
}
</style>
