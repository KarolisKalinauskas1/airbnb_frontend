<template>
  <div v-if="showFixer" class="fixed bottom-4 right-4 z-50 bg-white p-4 rounded-lg shadow-md border border-gray-200">
    <div class="flex justify-between items-center mb-3">
      <h3 class="font-medium">Auth Troubleshooter</h3>
      <button @click="showFixer = false" class="text-gray-500 hover:text-gray-700">
        <span class="sr-only">Close</span>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    <div v-if="status === 'checking'" class="text-center p-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto mb-2"></div>
      <p class="text-gray-600">Checking auth state...</p>
    </div>
    <div v-else-if="status === 'error'" class="mb-3">
      <div class="bg-red-50 border border-red-200 rounded p-3 mb-3">
        <p class="text-red-700 text-sm">{{ errorMessage }}</p>
      </div>
      <button 
        @click="fixAuthState" 
        class="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
      >
        Fix Auth State
      </button>
    </div>
    <div v-else-if="status === 'success'" class="bg-green-50 border border-green-200 rounded p-3">
      <p class="text-green-700 text-sm">Authentication status normal</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { authDebugger } from '@/utils/authDebugger';

const authStore = useAuthStore();
const showFixer = ref(false);
const status = ref('checking');
const errorMessage = ref('');

// Check auth state on mount
onMounted(async () => {
  try {
    await checkAuthState();
    
    // Only show troubleshooter in development mode or with query param
    if (import.meta.env.MODE === 'development' || window.location.search.includes('debug=auth')) {
      showFixer.value = import.meta.env.MODE === 'development';
    }
  } catch (error) {
    console.error('Auth troubleshooter initialization error:', error);
  }
});

// Check auth state
async function checkAuthState() {
  status.value = 'checking';
  
  try {
    const result = await authDebugger.checkAuthState();
    
    if (result.hasIssues) {
      status.value = 'error';
      errorMessage.value = result.issueDetails || 'Auth state inconsistency detected';
      showFixer.value = true;
    } else {
      status.value = 'success';
    }
  } catch (error) {
    status.value = 'error';
    errorMessage.value = error.message || 'Failed to check auth state';
    showFixer.value = true;
  }
}

// Fix auth state
async function fixAuthState() {
  status.value = 'checking';
  
  try {
    const fixed = await authDebugger.fixAuthState();
    
    if (fixed) {
      status.value = 'success';
      // Refresh auth store state
      await authStore.initAuth({ forceRefresh: true });
    } else {
      status.value = 'error';
      errorMessage.value = 'Failed to fix auth state';
    }
  } catch (error) {
    status.value = 'error';
    errorMessage.value = error.message || 'Error while fixing auth state';
  }
}
</script>
