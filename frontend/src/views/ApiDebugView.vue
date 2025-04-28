<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">API Debug Tools</h1>
    
    <div class="bg-white shadow rounded-lg overflow-hidden mb-8">
      <div class="p-4 border-b">
        <h2 class="text-xl font-semibold">API Endpoint Tests</h2>
      </div>
      
      <div class="p-4">
        <button 
          @click="runTests" 
          class="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          :disabled="isLoading">
          {{ isLoading ? 'Running Tests...' : 'Test API Endpoints' }}
        </button>
        
        <div v-if="isLoading" class="mb-4">
          <div class="animate-pulse text-gray-600">Testing endpoints, please wait...</div>
        </div>
        
        <div v-if="testResults" class="mb-6">
          <div class="mb-2 text-sm text-gray-600">
            Tests run at: {{ new Date(testResults.testedAt).toLocaleString() }}
          </div>
          
          <div class="mb-4">
            <h3 class="font-semibold mb-2">Recommended Paths:</h3>
            <div class="bg-gray-50 p-3 rounded">
              <div v-for="(path, category) in testResults.recommendedPaths" :key="category" class="mb-1">
                <span class="font-medium">{{ category }}: </span>
                <span v-if="path" class="font-mono text-green-600">{{ path }}</span>
                <span v-else class="text-red-600">No working path found</span>
              </div>
            </div>
          </div>
          
          <h3 class="font-semibold mb-2">Detailed Results:</h3>
          <div v-for="(categoryData, category) in testResults.endpoints" :key="category" class="mb-4">
            <h4 class="font-medium mb-2">{{ category }}</h4>
            <table class="min-w-full border-collapse">
              <thead>
                <tr class="bg-gray-100 text-left">
                  <th class="py-2 px-3">Endpoint</th>
                  <th class="py-2 px-3">Status</th>
                  <th class="py-2 px-3">JSON</th>
                  <th class="py-2 px-3">HTML</th>
                  <th class="py-2 px-3">Working</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(result, path) in categoryData" :key="path" class="border-t">
                  <td class="py-2 px-3 font-mono text-sm">{{ path }}</td>
                  <td class="py-2 px-3">
                    <span :class="result.status >= 200 && result.status < 300 ? 'text-green-600' : 'text-red-600'">
                      {{ result.status || 'N/A' }}
                    </span>
                  </td>
                  <td class="py-2 px-3">
                    <span v-if="result.isJson" class="text-green-600">✓</span>
                    <span v-else class="text-red-600">✕</span>
                  </td>
                  <td class="py-2 px-3">
                    <span v-if="result.isHtml" class="text-red-600">✓</span>
                    <span v-else class="text-green-600">✕</span>
                  </td>
                  <td class="py-2 px-3">
                    <span v-if="result.isWorking" class="text-green-600">✓</span>
                    <span v-else class="text-red-600">✕</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    
    <div class="bg-white shadow rounded-lg overflow-hidden mb-8">
      <div class="p-4 border-b">
        <h2 class="text-xl font-semibold">Auth Status</h2>
      </div>
      
      <div class="p-4">
        <button 
          @click="checkAuth" 
          class="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          :disabled="authLoading">
          {{ authLoading ? 'Checking...' : 'Check Auth Status' }}
        </button>
        
        <div v-if="authData" class="bg-gray-50 p-3 rounded">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 class="font-semibold mb-2">Session Status</h3>
              <div class="mb-1">
                <span class="font-medium">Logged In: </span>
                <span :class="authData.isLoggedIn ? 'text-green-600' : 'text-red-600'">
                  {{ authData.isLoggedIn ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="mb-1">
                <span class="font-medium">Token: </span>
                <span :class="authData.hasToken ? 'text-green-600' : 'text-red-600'">
                  {{ authData.hasToken ? 'Valid' : 'Missing' }}
                </span>
              </div>
              <div class="mb-1">
                <span class="font-medium">User Data: </span>
                <span :class="authData.hasUserData ? 'text-green-600' : 'text-red-600'">
                  {{ authData.hasUserData ? 'Available' : 'Missing' }}
                </span>
              </div>
            </div>
            <div>
              <h3 class="font-semibold mb-2">Cached User Data</h3>
              <div class="mb-1">
                <span class="font-medium">Email: </span>
                <span>{{ authData.userData?.email || 'N/A' }}</span>
              </div>
              <div class="mb-1">
                <span class="font-medium">Full Name: </span>
                <span>{{ authData.userData?.full_name || 'N/A' }}</span>
              </div>
              <div class="mb-1">
                <span class="font-medium">Is Owner: </span>
                <span>{{ authData.userData?.isowner === 1 ? 'Yes' : 'No' }}</span>
              </div>
              <div class="mb-1">
                <span class="font-medium">Last Updated: </span>
                <span>{{ authData.lastUpdated || 'Never' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="bg-white shadow rounded-lg overflow-hidden">
      <div class="p-4 border-b">
        <h2 class="text-xl font-semibold">Actions</h2>
      </div>
      
      <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          @click="clearUserData" 
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
          Clear User Cache
        </button>
        
        <button 
          @click="clearEndpointTests" 
          class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
          Clear Endpoint Tests
        </button>
        
        <button 
          @click="refreshPage" 
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Refresh Page
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { testApiEndpoints, clearEndpointTests } from '@/utils/endpointFix';
import { useAuthStore } from '@/stores/auth';
import { useToast } from 'vue-toastification';

const toast = useToast();
const authStore = useAuthStore();

const isLoading = ref(false);
const testResults = ref(null);
const authLoading = ref(false);
const authData = ref(null);

// Load previously saved test results
try {
  const savedResults = localStorage.getItem('apiEndpointTests');
  if (savedResults) {
    testResults.value = JSON.parse(savedResults);
  }
} catch (e) {
  console.error('Failed to load saved test results:', e);
}

const runTests = async () => {
  isLoading.value = true;
  try {
    testResults.value = await testApiEndpoints();
    toast.success('API tests completed');
  } catch (error) {
    console.error('Error running tests:', error);
    toast.error('Error running tests: ' + error.message);
  } finally {
    isLoading.value = false;
  }
};

const checkAuth = async () => {
  authLoading.value = true;
  try {
    // Get session from auth store
    const isLoggedIn = authStore.isLoggedIn;
    const hasToken = !!authStore.token;
    
    // Check cached user data
    const cachedUserData = localStorage.getItem('userData');
    let userData = null;
    let lastUpdated = null;
    
    if (cachedUserData) {
      try {
        userData = JSON.parse(cachedUserData);
        const lastFetched = localStorage.getItem('last_user_fetch_time');
        if (lastFetched) {
          lastUpdated = new Date(parseInt(lastFetched)).toLocaleString();
        }
      } catch (e) {
        console.error('Failed to parse cached user data:', e);
      }
    }
    
    authData.value = {
      isLoggedIn,
      hasToken,
      hasUserData: !!userData,
      userData,
      lastUpdated
    };
    
  } catch (error) {
    console.error('Error checking auth status:', error);
    toast.error('Error checking auth status: ' + error.message);
  } finally {
    authLoading.value = false;
  }
};

const clearUserData = () => {
  try {
    localStorage.removeItem('userData');
    localStorage.removeItem('last_user_fetch_time');
    toast.success('User cache cleared');
    authData.value = null;
  } catch (error) {
    console.error('Error clearing user data:', error);
    toast.error('Error clearing user data: ' + error.message);
  }
};

const clearTests = () => {
  try {
    clearEndpointTests();
    testResults.value = null;
    toast.success('Endpoint tests cleared');
  } catch (error) {
    console.error('Error clearing endpoint tests:', error);
    toast.error('Error clearing endpoint tests: ' + error.message);
  }
};

const refreshPage = () => {
  window.location.reload();
};
</script>
