<template>
  <div v-if="!authStore.isLoggedIn">
    <div class="bg-yellow-50 p-4 rounded-lg shadow text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-yellow-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <h2 class="text-xl font-bold mb-2">Authentication Required</h2>
      <p class="mb-4">Please log in to access this feature.</p>
      <button 
        @click="handleLogin" 
        class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
      >
        Log In
      </button>
    </div>
  </div>
  <div v-else-if="!authStore.isSeller">
    <div class="bg-yellow-50 p-4 rounded-lg shadow text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-yellow-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h2 class="text-xl font-bold mb-2">Owner Account Required</h2>
      <p class="mb-4">This feature is only available to owner accounts.</p>
      <button 
        @click="handleBack" 
        class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
      >
        Go Back
      </button>
    </div>
  </div>
  <slot v-else></slot>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const handleLogin = () => {
  router.push({
    path: '/auth',
    query: { redirect: router.currentRoute.value.fullPath }
  });
};

const handleBack = () => {
  router.push('/dashboard');
};
</script>
