<template>
  <div class="api-diagnostics">
    <h2 class="text-xl font-bold mb-4">API Diagnostics</h2>

    <div class="mb-6 space-y-4">
      <div class="border rounded-lg p-4 bg-white shadow-sm">
        <h3 class="font-semibold mb-2">API Connection</h3>
        <div class="grid grid-cols-2 gap-2">
          <div class="text-gray-600">Status:</div>
          <div :class="connectionStatus.ok ? 'text-green-600' : 'text-red-600'">
            {{ connectionStatus.ok ? 'Connected' : 'Disconnected' }}
          </div>
          <div class="text-gray-600">Health Endpoint:</div>
          <div :class="connectionStatus.health ? 'text-green-600' : 'text-red-600'">
            {{ connectionStatus.health ? 'OK' : 'Failed' }}
          </div>
        </div>
        <button 
          @click="checkConnection" 
          class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          :disabled="loading">
          {{ loading ? 'Checking...' : 'Check Connection' }}
        </button>
      </div>

      <div class="border rounded-lg p-4 bg-white shadow-sm">
        <h3 class="font-semibold mb-2">Authentication</h3>
        <div class="grid grid-cols-2 gap-2">
          <div class="text-gray-600">Local Token:</div>
          <div :class="authStatus.hasToken ? 'text-green-600' : 'text-red-600'">
            {{ authStatus.hasToken ? 'Present' : 'Missing' }}
          </div>
          <div class="text-gray-600">Valid Format:</div>
          <div :class="authStatus.validFormat ? 'text-green-600' : 'text-red-600'">
            {{ authStatus.validFormat ? 'Yes' : 'No' }}
          </div>
          <div class="text-gray-600">Auth Endpoint:</div>
          <div :class="authStatus.authTest ? 'text-green-600' : 'text-red-600'">
            {{ authStatus.authTest ? 'Authenticated' : 'Failed' }}
          </div>
        </div>
        <button 
          @click="testAuth" 
          class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          :disabled="loading">
          {{ loading ? 'Testing...' : 'Test Authentication' }}
        </button>
      </div>

      <div class="border rounded-lg p-4 bg-white shadow-sm">
        <h3 class="font-semibold mb-2">User Data</h3>
        <div class="grid grid-cols-2 gap-2">
          <div class="text-gray-600">Direct Endpoint:</div>
          <div :class="userDataStatus.direct ? 'text-green-600' : 'text-red-600'">
            {{ userDataStatus.direct ? 'Working' : 'Failed' }}
          </div>
          <div class="text-gray-600">API Endpoint:</div>
          <div :class="userDataStatus.api ? 'text-green-600' : 'text-red-600'">
            {{ userDataStatus.api ? 'Working' : 'Failed' }}
          </div>
          <div class="text-gray-600">Cache:</div>
          <div :class="userDataStatus.cached ? 'text-green-600' : 'text-red-600'">
            {{ userDataStatus.cached ? 'Available' : 'Not Available' }}
          </div>
        </div>
        <button 
          @click="testUserData" 
          class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          :disabled="loading">
          {{ loading ? 'Testing...' : 'Test User Data' }}
        </button>
      </div>

      <div v-if="diagnosticResults" class="border rounded-lg p-4 bg-gray-50">
        <h3 class="font-semibold mb-2">Diagnostic Results</h3>
        <pre class="whitespace-pre-wrap text-sm bg-gray-100 p-2 rounded overflow-auto max-h-60">{{ formattedResults }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import axios from '@/axios';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const loading = ref(false);
const diagnosticResults = ref(null);

const connectionStatus = ref({
  ok: false,
  health: false,
  timestamp: null
});

const authStatus = ref({
  hasToken: false,
  validFormat: false,
  authTest: false,
  timestamp: null
});

const userDataStatus = ref({
  direct: false,
  api: false,
  cached: false,
  timestamp: null
});

const formattedResults = computed(() => {
  if (!diagnosticResults.value) return '';
  return JSON.stringify(diagnosticResults.value, null, 2);
});

async function checkConnection() {
  loading.value = true;
  try {
    // Reset status
    connectionStatus.value = {
      ok: false,
      health: false,
      timestamp: new Date().toISOString()
    };
    
    diagnosticResults.value = { message: 'Testing connection...' };
    
    // Try health endpoint - make sure to use the backend URL
    try {
      // Use specific backend URL to avoid calling the frontend server
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const health = await axios.get(`${baseUrl}/health`, { 
        timeout: 3000,
        skipBaseUrl: true // Add this option to avoid duplicating the base URL
      });
      connectionStatus.value.health = true;
      diagnosticResults.value.health = {
        success: true,
        status: health.status,
        data: health.data
      };
    } catch (healthError) {
      diagnosticResults.value.health = {
        success: false,
        error: healthError.message
      };
    }
    
    // Try root endpoint
    try {
      const root = await axios.get('/', { timeout: 3000 });
      connectionStatus.value.ok = true;
      diagnosticResults.value.root = {
        success: true,
        status: root.status,
        contentType: root.headers['content-type']
      };
    } catch (rootError) {
      diagnosticResults.value.root = {
        success: false,
        error: rootError.message
      };
    }
    
  } catch (error) {
    diagnosticResults.value = {
      success: false,
      error: error.message
    };
  } finally {
    loading.value = false;
  }
}

async function testAuth() {
  loading.value = true;
  try {
    // Reset status
    authStatus.value = {
      hasToken: false,
      validFormat: false,
      authTest: false,
      timestamp: new Date().toISOString()
    };
    
    diagnosticResults.value = { message: 'Testing authentication...' };
    
    // Check token presence
    const token = localStorage.getItem('token') || authStore.token;
    authStatus.value.hasToken = !!token;
    diagnosticResults.value.token = {
      present: !!token,
      prefix: token ? token.slice(0, 5) + '...' : null,
      length: token ? token.length : 0
    };
    
    // Check token format
    if (token) {
      authStatus.value.validFormat = token.split('.').length === 3;
      diagnosticResults.value.tokenFormat = {
        valid: authStatus.value.validFormat,
        parts: token.split('.').length
      };
    }
    
    // Test auth endpoint
    if (token) {
      try {
        // Use auth-debug endpoint if available, fall back to auth-test
        try {
          const authTest = await axios.get('/api/auth-debug/auth-test', {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000
          });
          
          authStatus.value.authTest = !!authTest.data.authenticated;
          diagnosticResults.value.authTest = {
            success: true,
            data: authTest.data
          };
        } catch (debugError) {
          // Fall back to regular auth-test
          const authTest = await axios.get('/api/users/auth-test', {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000
          });
          
          authStatus.value.authTest = !!authTest.data.status;
          diagnosticResults.value.authTest = {
            success: true,
            data: authTest.data
          };
        }
      } catch (authError) {
        diagnosticResults.value.authTest = {
          success: false,
          error: authError.message,
          response: authError.response?.data
        };
      }
    }
  } catch (error) {
    diagnosticResults.value = {
      success: false,
      error: error.message
    };
  } finally {
    loading.value = false;
  }
}

async function testUserData() {
  loading.value = true;
  try {
    // Reset status
    userDataStatus.value = {
      direct: false,
      api: false,
      cached: false,
      timestamp: new Date().toISOString()
    };
    
    diagnosticResults.value = { message: 'Testing user data endpoints...' };
    
    // Check cached data
    const cachedData = localStorage.getItem('userData');
    userDataStatus.value.cached = !!cachedData;
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        diagnosticResults.value.cachedData = {
          available: true,
          email: parsed.email,
          userId: parsed.user_id,
          isOwner: parsed.isowner
        };
      } catch (parseError) {
        diagnosticResults.value.cachedData = {
          available: true,
          valid: false,
          error: parseError.message
        };
      }
    } else {
      diagnosticResults.value.cachedData = {
        available: false
      };
    }
    
    // Get token
    const token = localStorage.getItem('token') || authStore.token;
    if (!token) {
      diagnosticResults.value.error = "No authentication token available";
      return;
    }
    
    // Test direct endpoint
    try {
      const directResponse = await axios.get('/users/full-info', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      
      userDataStatus.value.direct = true;
      diagnosticResults.value.directEndpoint = {
        success: true,
        status: directResponse.status,
        contentType: directResponse.headers['content-type'],
        email: directResponse.data?.email,
        fromCache: !!directResponse._fromCache
      };
    } catch (directError) {
      diagnosticResults.value.directEndpoint = {
        success: false,
        error: directError.message,
        response: directError.response?.data
      };
    }
    
    // Test API endpoint
    try {
      const apiResponse = await axios.get('/api/users/full-info', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      
      userDataStatus.value.api = true;
      diagnosticResults.value.apiEndpoint = {
        success: true,
        status: apiResponse.status,
        contentType: apiResponse.headers['content-type'],
        email: apiResponse.data?.email,
        fromCache: !!apiResponse._fromCache
      };
    } catch (apiError) {
      diagnosticResults.value.apiEndpoint = {
        success: false,
        error: apiError.message,
        response: apiError.response?.data
      };
    }
    
  } catch (error) {
    diagnosticResults.value = {
      success: false,
      error: error.message
    };
  } finally {
    loading.value = false;
  }
}

// Run initial checks on mount
checkConnection();
</script>
