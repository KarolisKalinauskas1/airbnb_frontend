<template>
  <div class="min-h-screen bg-gray-50 py-12">
    <div class="max-w-xl mx-auto px-4">
      <div class="text-center">
        <div class="bg-white rounded-lg shadow-lg p-8">
          <div class="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center">
            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 class="mt-6 text-2xl font-semibold text-gray-900">Booking Failed</h2>
          <p class="mt-2 text-gray-600">Something went wrong with your booking. Please try again.</p>
          <div class="mt-6 space-y-3">
            <button 
              @click="$router.go(-1)" 
              class="block w-full px-4 py-2 text-center bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Try Again
            </button>
            <router-link 
              to="/" 
              class="block w-full px-4 py-2 text-center text-gray-700 hover:text-gray-900"
            >
              Return to Home
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
