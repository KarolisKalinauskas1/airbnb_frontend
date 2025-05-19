<template>
  <div class="app-container">
    <NavBar />
    <Suspense>
      <template #default>
        <div v-if="authError" class="error-container">
          <div class="error-message">
            <h2>Authentication Error</h2>
            <p>{{ authError }}</p>
            <button @click="retryAuth" class="retry-button">
              Retry
            </button>
          </div>
        </div>
        <router-view v-else />
      </template>
      <template #fallback>
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p v-if="loadingMessage" class="loading-message">{{ loadingMessage }}</p>
        </div>      </template>
    </Suspense>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, provide, readonly, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import NavBar from '@/components/common/NavBar.vue'

const isInitializing = ref(true)
const authError = ref(null)
const loadingMessage = ref('Loading...')
const authStore = useAuthStore()
const router = useRouter()
const AUTH_INIT_TIMEOUT = 15000 // 15 seconds timeout

// Provide readonly version of isInitializing to prevent accidental mutations
provide('isInitializing', readonly(isInitializing))

// Initialize auth with timeout and retry logic
let initTimeout
let retryCount = 0
const MAX_RETRIES = 3

const initAuth = async () => {
  if (retryCount >= MAX_RETRIES) {
    authError.value = 'Unable to initialize authentication after multiple attempts. Please refresh the page.'
    isInitializing.value = false
    return
  }

  try {
    // Clear any existing timeout
    if (initTimeout) clearTimeout(initTimeout)

    // Set new timeout
    initTimeout = setTimeout(() => {
      if (isInitializing.value) {
        authError.value = 'Authentication initialization timed out. Please check your connection.'
        isInitializing.value = false
      }
    }, AUTH_INIT_TIMEOUT)

    // Try to restore session from localStorage first
    const storedUser = localStorage.getItem('supabase.auth.user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        authStore.user = userData
        loadingMessage.value = 'Restoring your session...'
      } catch (error) {
        console.error('Failed to parse stored user data:', error)
        localStorage.removeItem('supabase.auth.user')
      }
    }    // Initialize auth
    loadingMessage.value = 'Checking authentication...'
    if (!authStore.isInitialized && !authStore.isInitializing) {
      console.log('App: Auth not initialized, initializing...')
      await authStore.initAuth()
    } else {
      console.log('App: Auth already initialized or initializing, skipping')
    }
    
    // Clear timeout on success
    clearTimeout(initTimeout)
    isInitializing.value = false
    authError.value = null
    
  } catch (error) {
    console.error('Auth initialization error:', error)
    retryCount++
    
    if (retryCount < MAX_RETRIES) {
      loadingMessage.value = `Retrying authentication (attempt ${retryCount + 1}/${MAX_RETRIES})...`
      // Exponential backoff for retries
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
      await initAuth()
    } else {
      authError.value = 'Authentication failed. Please try again later.'
      isInitializing.value = false
    }
  }
}

// Watch for auth store errors
watch(() => authStore.error, (newError) => {
  if (newError) {
    authError.value = newError
  }
})

const retryAuth = async () => {
  isInitializing.value = true
  authError.value = null
  retryCount = 0
  await initAuth()
}

onMounted(async () => {
  // Check for direct OAuth callback first
  const queryParams = new URLSearchParams(window.location.search);
  const isOAuthCallback = queryParams.get('source') === 'oauth';
  
  if (isOAuthCallback) {
    console.log('Detected direct OAuth callback, handling authentication...');
    // We'll let the router handle this, but we still need to init auth
    await initAuth({ priority: true });
  } else {
    // Normal initialization
    initAuth();
  }
})

onUnmounted(() => {
  if (initTimeout) clearTimeout(initTimeout)
  authStore.cleanup()
})
</script>

<style>
/* Move common styles to global CSS */
:root {
  --loading-spinner-size: 40px;
  --loading-spinner-border: 4px;
  --loading-spinner-color: #3498db;
  --error-color: #e74c3c;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.loading-spinner {
  width: var(--loading-spinner-size);
  height: var(--loading-spinner-size);
  border: var(--loading-spinner-border) solid #f3f3f3;
  border-top: var(--loading-spinner-border) solid var(--loading-spinner-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  will-change: transform;
}

.loading-message {
  margin-top: 1rem;
  color: #666;
  font-size: 0.9rem;
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  padding: 2rem;
}

.error-message {
  text-align: center;
  color: var(--error-color);
  max-width: 400px;
}

.error-message h2 {
  margin-bottom: 1rem;
}

.retry-button {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background-color: var(--error-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background-color: #c0392b;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
