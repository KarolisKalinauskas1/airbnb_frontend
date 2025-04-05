<script setup>
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { computed, watch } from 'vue'

const router = useRouter()
const authStore = useAuthStore()
const { user, fullUser } = storeToRefs(authStore)

const isSeller = computed(() => {
  return fullUser.value?.isowner === 1
})

const navItems = computed(() => {
  if (!user.value) {
    return [
      { name: 'Home', path: '/' },
      { name: 'Campers', path: '/campers' },
      { name: 'Login', path: '/auth' }
    ]
  }
  
  if (isSeller.value) {
    return [
      { name: 'Campers', path: '/campers' },
      { name: 'Account', path: '/account' },
      { name: 'Dashboard', path: '/dashboard' }
    ]
  }
  
  return [
    { name: 'Home', path: '/' },
    { name: 'Campers', path: '/campers' },
    { name: 'Account', path: '/account' }
  ]
})

const handleLogout = async () => {
  await authStore.handleLogout()
  router.push('/auth')
}
</script>

<template>
  <nav class="flex justify-between items-center p-5">
    <div>
      <RouterLink to="/" class="cursor-pointer">
        <img src="../assets/logoForAirbnb.svg" alt="Logo" class="md:w-20 md:h-20 w-14 h-14">
      </RouterLink>
    </div>

    <div class="flex items-center justify-around space-x-4 w-86">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="[
          'cursor-pointer transition-colors duration-200',
          $route.path === item.path
            ? 'text-pink-500 font-bold pointer-events-none'
            : 'text-gray-200 hover:text-pink-400'
        ]"
      >
        {{ item.name }}
      </RouterLink>

      <button 
        v-if="user" 
        @click="handleLogout" 
        class="text-gray-200 hover:text-pink-400 cursor-pointer transition-colors duration-200"
      >
        Logout
      </button>
    </div>
  </nav>
</template>
