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

const authStore = useAuthStore()
const { loading } = storeToRefs(authStore)
const backendDown = ref(false)

// Check if backend is available
const checkBackendStatus = async () => {
  try {
    await axios.get('/', { timeout: 3000 })
    backendDown.value = false
  } catch (error) {
    backendDown.value = true
    console.warn('Backend server is not responding')
  }
}

// Immediately initialize auth on app mount
onMounted(async () => {
  await checkBackendStatus()
  
  try {
    console.log('App mounted, initializing auth...')
    await authStore.initAuth()
  } catch (error) {
    console.error('Failed to initialize auth:', error)
  }
})
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
