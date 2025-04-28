<template>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">API Connection Debugger</h2>
    
    <div class="flex gap-2 mb-4">
      <button @click="runDiagnostics" 
              class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              :disabled="isRunning">
        Run Diagnostics
      </button>
      <button @click="clearCache" 
              class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
        Clear API Cache
      </button>
      <button @click="refreshPage" 
              class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
        Refresh Page
      </button>
    </div>
    
    <div v-if="isRunning" class="mb-4 text-gray-600">
      Running diagnostics...
    </div>
    
    <div v-if="results" class="space-y-4">
      <div class="p-3 border rounded">
        <h3 class="font-semibold">Internet Connection</h3>
        <div :class="results.internetConnected ? 'text-green-600' : 'text-red-600'">
          {{ results.internetConnected ? 'Connected' : 'Disconnected' }}
        </div>
      </div>
      
      <div class="p-3 border rounded">
        <h3 class="font-semibold">Local Storage Data</h3>
        <div v-if="results.localStorage.userDataExists" class="space-y-1">
          <div>User data found: {{ results.localStorage.userDataValid ? 'Valid' : 'Invalid' }}</div>
          <div v-if="results.localStorage.userEmail">Email: {{ results.localStorage.userEmail }}</div>
          <div>Is Owner: {{ results.localStorage.isOwner === 1 ? 'Yes' : 'No' }}</div>
          <div v-if="results.localStorage.dataAgeMinutes !== undefined">
            Data age: {{ results.localStorage.dataAgeMinutes }} minutes
            <span v-if="results.localStorage.dataAgeMinutes > 60" class="text-red-500">
              (Stale data, should refresh)
            </span>
          </div>
        </div>
        <div v-else class="text-red-600">No user data in localStorage</div>
      </div>
      
      <div class="p-3 border rounded">
        <h3 class="font-semibold">API Endpoint Tests</h3>
        <div v-for="(result, endpoint) in results.endpointTests" :key="endpoint" class="py-1">
          <div class="flex items-center">
            <span class="w-4 h-4 inline-block mr-2 rounded-full" 
                  :class="result.success ? 'bg-green-500' : 'bg-red-500'"></span>
            <span class="font-mono">{{ endpoint }}</span> - 
            <span :class="result.success ? 'text-green-600' : 'text-red-600'">
              {{ result.success ? 'Success' : 'Failed' }}
            </span>
            <span class="ml-2 text-sm text-gray-500">
              {{ result.responseTime }}
            </span>
          </div>
          <div v-if="!result.success" class="text-sm text-red-500 ml-6">
            {{ result.error }}
          </div>
          <div v-else class="text-sm text-gray-600 ml-6">
            Status: {{ result.status }} {{ result.statusText }}
          </div>
        </div>
      </div>
      
      <div class="p-3 border rounded">
        <h3 class="font-semibold">Diagnosis</h3>
        <ul class="list-disc pl-5">
          <li v-if="!results.internetConnected">
            No internet connection. Connect to the internet first.
          </li>
          <li v-else-if="!anyEndpointSuccess">
            API server appears to be down. Contact system administrator.
          </li>
          <li v-else-if="healthEndpointSuccess && !apiUsersEndpointSuccess">
            Server is up but API user endpoints are failing. Possible authentication or route issues.
          </li>
          <li v-else-if="rootEndpointSuccess && !anyApiEndpointSuccess">
            Server is up but all API endpoints are failing. Check API configuration or server logs.
          </li>
          <li v-if="results.localStorage.dataAgeMinutes > 60">
            Using stale data from cache. Try clearing cache and refreshing the page.
          </li>
          <li v-if="!results.localStorage.userDataExists">
            No cached user data found. This could cause authentication issues.
          </li>
        </ul>
        
        <div class="mt-3">
          <h4 class="font-semibold">Recommended Actions:</h4>
          <ul class="list-disc pl-5">
            <li v-if="!anyEndpointSuccess">
              Check if the backend server is running.
            </li>
            <li v-else-if="!apiUsersEndpointSuccess">
              Try logging out and logging back in.
            </li>
            <li v-if="results.localStorage.dataAgeMinutes > 60 || !apiUsersEndpointSuccess">
              Clear the API cache and refresh the page.
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { runApiDiagnostics, clearApiCache } from '@/utils/apiDiagnostics';

const isRunning = ref(false);
const results = ref(null);

const anyEndpointSuccess = computed(() => {
  if (!results.value?.endpointTests) return false;
  return Object.values(results.value.endpointTests).some(test => test.success);
});

const anyApiEndpointSuccess = computed(() => {
  if (!results.value?.endpointTests) return false;
  return Object.entries(results.value.endpointTests)
    .filter(([endpoint]) => endpoint.includes('/api/'))
    .some(([_, test]) => test.success);
});

const healthEndpointSuccess = computed(() => {
  if (!results.value?.endpointTests) return false;
  return results.value.endpointTests['/health']?.success || 
         results.value.endpointTests['/api/health']?.success;
});

const rootEndpointSuccess = computed(() => {
  if (!results.value?.endpointTests) return false;
  return results.value.endpointTests['/']?.success;
});

const apiUsersEndpointSuccess = computed(() => {
  if (!results.value?.endpointTests) return false;
  return results.value.endpointTests['/api/users/full-info']?.success || 
         results.value.endpointTests['/users/full-info']?.success;
});

const runDiagnostics = async () => {
  isRunning.value = true;
  try {
    results.value = await runApiDiagnostics();
  } catch (error) {
    console.error('Error running diagnostics:', error);
  } finally {
    isRunning.value = false;
  }
};

const clearCache = () => {
  clearApiCache();
  alert('API cache has been cleared. You may need to refresh the page.');
};

const refreshPage = () => {
  window.location.reload();
};
</script>
