<template>
  <div id="app">
    <div>
      <NavComponent />
    </div>
    <Suspense>
      <template #default>
        <RouterView />
      </template>
      <template #fallback>
        <div class="flex justify-center items-center min-h-screen">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </template>
    </Suspense>
  </div>
</template>

<script setup>
import { onBeforeMount } from 'vue'
import { useAuthStore } from '@/stores/auth'
import NavComponent from '@/components/NavComponent.vue'

const { initAuth } = useAuthStore()

onBeforeMount(() => {
  // Just initialize from localStorage if available
  initAuth()
})
</script>
