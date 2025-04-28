<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">API Test Tool</h1>
    
    <div class="bg-white shadow-md rounded p-4 mb-4">
      <h2 class="text-lg font-semibold mb-2">Test /users/full-info Endpoint</h2>
      <p class="mb-4 text-sm text-gray-600">This will test the API endpoint that's returning HTML instead of JSON.</p>
      
      <div class="flex space-x-4">
        <button 
          @click="testFullInfoEndpoint" 
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          :disabled="loading"
        >
          {{ loading ? 'Testing...' : 'Test Endpoint' }}
        </button>
        
        <button 
          @click="testWithDifferentHeaders" 
          class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          :disabled="loading"
        >
          Test with Different Headers
        </button>
      </div>
      
      <div v-if="result" class="mt-4 bg-gray-100 p-4 rounded">
        <h3 class="font-medium">Test Results:</h3>
        <pre class="mt-2 bg-gray-800 text-white p-2 rounded overflow-x-auto">{{ JSON.stringify(result, null, 2) }}</pre>
      </div>
      
      <div v-if="headerResults" class="mt-4">
        <h3 class="font-medium mb-2">Header Test Results:</h3>
        <div v-for="(result, header) in headerResults" :key="header" class="mb-4 bg-gray-100 p-2 rounded">
          <h4 class="font-medium">Accept: {{ header }}</h4>
          <pre class="mt-1 bg-gray-800 text-white p-2 rounded overflow-x-auto">{{ JSON.stringify(result, null, 2) }}</pre>
        </div>
      </div>
    </div>
    
    <div class="bg-white shadow-md rounded p-4">
      <h2 class="text-lg font-semibold mb-2">Manual API Request</h2>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Endpoint
        </label>
        <input 
          v-model="customEndpoint" 
          class="w-full p-2 border border-gray-300 rounded"
          placeholder="/api/users/full-info"
        />
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Headers (JSON)
        </label>
        <textarea 
          v-model="customHeaders" 
          class="w-full p-2 border border-gray-300 rounded"
          rows="3"
        ></textarea>
      </div>
      
      <button 
        @click="makeCustomRequest" 
        class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
        :disabled="loading"
      >
        {{ loading ? 'Sending...' : 'Send Request' }}
      </button>
      
      <div v-if="customResult" class="mt-4 bg-gray-100 p-4 rounded">
        <h3 class="font-medium">Response:</h3>
        <pre class="mt-2 bg-gray-800 text-white p-2 rounded overflow-x-auto">{{ JSON.stringify(customResult, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { apiDiagnostic } from '@/utils/apiDiagnostic';
import axios from '@/axios';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const loading = ref(false);
const result = ref(null);
const headerResults = ref(null);
const customEndpoint = ref('/users/full-info');
const customHeaders = ref('{\n  "Accept": "application/json"\n}');
const customResult = ref(null);

const testFullInfoEndpoint = async () => {
  loading.value = true;
  try {
    result.value = await apiDiagnostic.testFullInfoEndpoint();
  } catch (error) {
    result.value = {
      error: error.message,
      details: error.response?.data || {}
    };
  } finally {
    loading.value = false;
  }
};

const testWithDifferentHeaders = async () => {
  loading.value = true;
  try {
    headerResults.value = await apiDiagnostic.testWithDifferentAcceptHeaders();
  } catch (error) {
    headerResults.value = {
      error: error.message
    };
  } finally {
    loading.value = false;
  }
};

const makeCustomRequest = async () => {
  loading.value = true;
  try {
    let headers = {};
    try {
      headers = JSON.parse(customHeaders.value);
    } catch (e) {
      console.error('Invalid JSON in headers:', e);
    }
    
    // Ensure we have auth token if needed
    if (customEndpoint.value.includes('/full-info') || customEndpoint.value.includes('/dashboard')) {
      headers['Authorization'] = `Bearer ${authStore.token}`;
    }
    
    const response = await axios.get(customEndpoint.value, { headers });
    customResult.value = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      dataType: typeof response.data
    };
  } catch (error) {
    customResult.value = {
      error: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      dataType: typeof error.response?.data
    };
  } finally {
    loading.value = false;
  }
};
</script>
