<template>
  <div class="container mx-auto py-8 px-4">
    <h1 class="text-2xl font-bold mb-8">Network Diagnostics</h1>
    
    <div class="bg-white shadow-md rounded-lg overflow-hidden">
      <div class="border-b p-4">
        <h2 class="text-lg font-semibold">API Status Dashboard</h2>
      </div>
      
      <NetworkDebugger />
      
      <div class="p-4 bg-gray-50 border-t">
        <h3 class="text-md font-semibold mb-3">Advanced Actions</h3>
        
        <div class="space-y-4">
          <div>
            <button @click="clearAllStorageData" class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
              Clear All Storage Data
            </button>
            <span class="ml-2 text-sm text-gray-500">Use with caution - this will log you out</span>
          </div>
          
          <div>
            <button @click="checkSession" class="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">
              Check Auth Session
            </button>
            <span class="ml-2 text-sm text-gray-500">Verify authentication status</span>
          </div>
          
          <div>
            <button @click="restartApp" class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
              Restart Application
            </button>
            <span class="ml-2 text-sm text-gray-500">Hard refresh the application</span>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="sessionInfo" class="mt-6 bg-white shadow-md rounded-lg overflow-hidden">
      <div class="border-b p-4">
        <h2 class="text-lg font-semibold">Authentication Session Info</h2>
      </div>
      
      <div class="p-4">
        <pre class="bg-gray-100 p-4 rounded overflow-x-auto text-sm">{{ sessionInfo }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import NetworkDebugger from '@/components/NetworkDebugger.vue';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';

const sessionInfo = ref(null);
const authStore = useAuthStore();

const clearAllStorageData = () => {
  const confirmClear = confirm('Are you sure you want to clear all storage data? This will log you out.');
  if (!confirmClear) return;
  
  localStorage.clear();
  sessionStorage.clear();
  
  alert('All storage data has been cleared. The page will now reload.');
  setTimeout(() => {
    window.location.href = '/auth';
  }, 500);
};

const checkSession = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    
    const sessionData = {
      hasSession: !!data.session,
      expires: data.session ? new Date(data.session.expires_at * 1000).toLocaleString() : null,
      user: data.session ? {
        id: data.session.user.id,
        email: data.session.user.email,
        metadata: data.session.user.user_metadata
      } : null,
      token: data.session ? data.session.access_token.substring(0, 15) + '...' : null,
      localStorage: {
        token: localStorage.getItem('token') ? 'Present' : 'Missing',
        userData: localStorage.getItem('userData') ? 'Present' : 'Missing',
        lastFetchTime: localStorage.getItem('last_user_fetch_time')
      },
      authStore: {
        isLoggedIn: authStore.isLoggedIn,
        token: authStore.token ? 'Present' : 'Missing',
        fullUser: authStore.fullUser ? 'Loaded' : 'Not loaded',
        isSeller: authStore.isSeller
      }
    };
    
    sessionInfo.value = JSON.stringify(sessionData, null, 2);
  } catch (error) {
    console.error('Error checking session:', error);
    sessionInfo.value = JSON.stringify({ error: error.message }, null, 2);
  }
};

const restartApp = () => {
  const confirmRestart = confirm('Are you sure you want to restart the application?');
  if (!confirmRestart) return;
  
  // Force a hard refresh
  window.location.href = window.location.origin;
};
</script>
