<template>
  <div id="app">
    <div>
      <NavComponent />
    </div>
    <RouterView />
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
