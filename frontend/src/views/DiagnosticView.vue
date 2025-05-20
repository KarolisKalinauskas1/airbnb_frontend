<template>
  <div class="container mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">System Diagnostics</h1>
    <div class="bg-white shadow-md rounded p-4 mb-4">
      <h2 class="text-lg font-semibold mb-2">API Connection</h2>
      <div v-if="apiStatus.loading">
        Checking API connection...
      </div>
      <div v-else>
        <div :class="apiStatus.connected ? 'text-green-600' : 'text-red-600'">
          API {{ apiStatus.connected ? 'is connected' : 'is not connected' }}
        </div>
        <div v-if="apiStatus.error" class="text-red-600 mt-2">
          Error: {{ apiStatus.error }}
        </div>
      </div>
      <button 
        @click="checkApiConnection" 
        class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
      >
        Test Connection
      </button>
    </div>
    
    <button 
      @click="runAllTests" 
      class="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
    >
      Run All Tests
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import axios from '@/axios';

const authStore = useAuthStore();

// API connection status
const apiStatus = ref({
  loading: false,
  connected: false,
  error: null
});

// Test API connection
async function checkApiConnection() {
  apiStatus.value.loading = true;
  apiStatus.value.error = null;
  try {
    const response = await axios.get('/', { timeout: 5000 });
    apiStatus.value.connected = true;
  } catch (error) {
    apiStatus.value.connected = false;
    apiStatus.value.error = error.message;
    console.error('API connection error:', error);
  } finally {
    apiStatus.value.loading = false;
  }
}

// Run all tests
async function runAllTests() {
  await Promise.all([
    checkApiConnection()
  ]);
}

// Initialize
onMounted(() => {
  checkApiConnection();
});
</script>
