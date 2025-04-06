<template>
  <div id="app">
    <NavComponent v-if="initialized" />
    <Suspense>
      <template #default>
        <RouterView v-if="initialized" />
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
import { ref, onBeforeMount } from 'vue'
import { useAuthStore } from '@/stores/auth'
import NavComponent from '@/components/NavComponent.vue'

const initialized = ref(false)
const authStore = useAuthStore()

onBeforeMount(async () => {
  await authStore.initAuth()
  initialized.value = true
})
</script>
