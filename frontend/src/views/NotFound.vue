<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-red-500">404</h1>
      <p class="mt-4 text-xl text-gray-600">Page not found</p>
      <router-link 
        to="/" 
        class="mt-8 inline-block px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
      >
        Go Home
      </router-link>
    </div>
  </div>
</template>
