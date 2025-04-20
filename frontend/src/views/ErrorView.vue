<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div class="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
      <div class="text-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h1 class="text-2xl font-bold text-gray-800 mt-4">{{ title }}</h1>
        <p class="text-gray-600 mt-2">{{ message }}</p>
      </div>
      
      <div class="mt-6 space-y-4">
        <button 
          @click="reload" 
          class="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition duration-200"
        >
          Reload Page
        </button>
        
        <button 
          @click="goHome" 
          class="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition duration-200"
        >
          Return to Home
        </button>
      </div>
      
      <div v-if="showDetails && errorDetails" class="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 class="font-medium text-gray-700 mb-2">Technical Details</h3>
        <pre class="text-xs overflow-auto p-2 bg-gray-100 rounded">{{ errorDetails }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps({
  title: {
    type: String,
    default: 'Something went wrong'
  },
  message: {
    type: String,
    default: 'We encountered a problem loading this page. Please try again.'
  },
  errorDetails: {
    type: String,
    default: null
  },
  showDetails: {
    type: Boolean,
    default: process.env.NODE_ENV === 'development'
  }
});

const router = useRouter();
const route = useRoute();

const reload = () => {
  window.location.reload();
};

const goHome = () => {
  router.push('/');
};

onMounted(() => {
  // Log error for debugging
  if (props.errorDetails) {
    console.error('Error details:', props.errorDetails);
  }
});
</script>
