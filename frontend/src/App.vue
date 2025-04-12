<template>
  <div>
    <NavComponent />
    <div v-if="loading" class="global-loading">
      <div class="loading-spinner"></div>
    </div>
    <RouterView v-else />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import NavComponent from '@/components/NavComponent.vue'

const authStore = useAuthStore()
const { loading } = storeToRefs(authStore)

// Immediately initialize auth on app mount
onMounted(async () => {
  try {
    console.log('App mounted, initializing auth...')
    await authStore.initAuth()
  } catch (error) {
    console.error('Failed to initialize auth:', error)
  }
})
</script>

<style>
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
</style>
