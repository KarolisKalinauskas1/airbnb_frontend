<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <h2 class="text-2xl font-semibold text-gray-700 mb-6">Page Not Found</h2>
      <p class="text-gray-600 mb-8">The page you are looking for might have been removed or is temporarily unavailable.</p>
      <router-link 
        to="/" 
        class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Go back home
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

// Optional: Redirect to home after 5 seconds
setTimeout(() => {
  router.push('/');
}, 5000);
</script>

<style scoped>
/* Add any custom styles here if needed */
</style>