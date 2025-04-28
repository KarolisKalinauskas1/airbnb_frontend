<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Authentication Debug Tool</h1>
    
    <div class="mb-6 bg-gray-50 p-4 border rounded">
      <h2 class="text-lg font-semibold mb-2">Session Status</h2>
      <div v-if="loading" class="text-gray-500">Loading session information...</div>
      <div v-else>
        <div class="mb-2">
          <span class="font-medium">Auth State:</span>
          <span :class="sessionInfo.hasSession ? 'text-green-600' : 'text-red-600'">
            {{ sessionInfo.hasSession ? 'Session Active' : 'No Session' }}
          </span>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div class="bg-white p-3 border rounded">
            <h3 class="text-md font-semibold">Supabase Session</h3>
            <ul class="mt-2 space-y-1 text-sm">
              <li>Session Exists: {{ sessionInfo.hasSession ? 'Yes' : 'No' }}</li>
              <li v-if="sessionInfo.hasSession">
                Token Expires: {{ sessionInfo.expiresAt }}
                <span :class="sessionInfo.isExpired ? 'text-red-600 font-bold' : 'text-green-600'">
                  ({{ sessionInfo.isExpired ? 'EXPIRED' : 'Valid' }})
                </span>
              </li>
              <li v-if="sessionInfo.hasSession">User ID: {{ sessionInfo.userId }}</li>
              <li v-if="sessionInfo.hasSession">Email: {{ sessionInfo.email }}</li>
            </ul>
          </div>
          
          <div class="bg-white p-3 border rounded">
            <h3 class="text-md font-semibold">Application State</h3>
            <ul class="mt-2 space-y-1 text-sm">
              <li>App Logged In: {{ appState.isLoggedIn ? 'Yes' : 'No' }}</li>
              <li>Has Token: {{ appState.hasToken ? 'Yes' : 'No' }}</li>
              <li>Has User Data: {{ appState.hasUserData ? 'Yes' : 'No' }}</li>
              <li v-if="appState.hasUserData">User ID: {{ appState.userId }}</li>
              <li v-if="appState.hasUserData">Is Owner: {{ appState.isOwner ? 'Yes' : 'No' }}</li>
            </ul>
          </div>
        </div>
        
        <div class="mt-4 bg-white p-3 border rounded">
          <h3 class="text-md font-semibold">Stored Tokens</h3>
          <div class="mt-2 text-sm">
            <div v-if="Object.keys(tokens).length === 0" class="text-gray-500">No tokens found in storage</div>
            <div v-else>
              <div v-for="(token, location) in tokens" :key="location" class="mb-2">
                <div class="font-medium">{{ location }}:</div>
                <div class="text-xs bg-gray-50 p-2 overflow-auto max-h-20">
                  {{ token.substring(0, 20) }}...
                  <button @click="analyzeToken(token)" class="ml-2 text-blue-600 hover:underline">
                    Analyze
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="tokenAnalysis" class="mt-4 bg-white p-3 border rounded">
          <h3 class="text-md font-semibold">Token Analysis</h3>
          <div class="mt-2 text-sm">
            <div class="mb-1">
              <span class="font-medium">Valid:</span>
              <span :class="tokenAnalysis.valid ? 'text-green-600' : 'text-red-600'">
                {{ tokenAnalysis.valid ? 'Yes' : 'No' }}
              </span>
            </div>
            <div class="mb-1">
              <span class="font-medium">Status:</span> {{ tokenAnalysis.reason }}
            </div>
            <div v-if="tokenAnalysis.expiresAt" class="mb-1">
              <span class="font-medium">Expires:</span> {{ tokenAnalysis.expiresAt.toLocaleString() }}
              (in {{ tokenAnalysis.expiresInMinutes }} minutes)
            </div>
            <div v-if="tokenAnalysis.subject" class="mb-1">
              <span class="font-medium">Subject ID:</span> {{ tokenAnalysis.subject }}
            </div>
            <div v-if="tokenAnalysis.email" class="mb-1">
              <span class="font-medium">Email:</span> {{ tokenAnalysis.email }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="flex flex-wrap gap-2 mt-4">
      <button 
        @click="refreshState" 
        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        :disabled="loading"
      >
        Refresh State
      </button>
      
      <button 
        @click="fixAuth" 
        class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        :disabled="loading || fixing"
      >
        {{ fixing ? 'Fixing...' : 'Fix Auth Issues' }}
      </button>
      
      <button 
        @click="forceRefreshToken" 
        class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
        :disabled="loading || refreshing"
      >
        {{ refreshing ? 'Refreshing...' : 'Force Refresh Token' }}
      </button>
      
      <button 
        @click="logoutUser" 
        class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        :disabled="loading || !sessionInfo.hasSession"
      >
        Logout
      </button>
    </div>
    
    <div v-if="message" class="mt-4 p-3 border rounded" :class="messageClass">
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { findStoredToken, analyzeToken as analyzeJwt, fixAuthState } from '@/utils/authDebugUtils';

const authStore = useAuthStore();
const loading = ref(true);
const fixing = ref(false);
const refreshing = ref(false);
const message = ref('');
const messageClass = ref('');

const sessionInfo = ref({
  hasSession: false,
  isExpired: false,
  expiresAt: null,
  userId: null,
  email: null
});

const appState = ref({
  isLoggedIn: false,
  hasToken: false,
  hasUserData: false,
  userId: null,
  isOwner: false
});

const tokens = ref({});
const tokenAnalysis = ref(null);

// Function to check auth state
const refreshState = async () => {
  loading.value = true;
  message.value = '';
  
  try {
    // Check Supabase session
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    
    if (session) {
      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      
      sessionInfo.value = {
        hasSession: true,
        isExpired: expiresAt < now,
        expiresAt: expiresAt.toLocaleString(),
        userId: session.user?.id,
        email: session.user?.email
      };
    } else {
      sessionInfo.value = {
        hasSession: false,
        isExpired: false,
        expiresAt: null,
        userId: null,
        email: null
      };
    }
    
    // Check app state
    appState.value = {
      isLoggedIn: authStore.isLoggedIn,
      hasToken: !!authStore.token,
      hasUserData: !!authStore.fullUser,
      userId: authStore.fullUser?.user_id,
      isOwner: authStore.isOwner
    };
    
    // Look for tokens
    tokens.value = findStoredToken();
    
  } catch (error) {
    console.error('Error refreshing state:', error);
    message.value = `Error: ${error.message}`;
    messageClass.value = 'bg-red-100 text-red-700';
  } finally {
    loading.value = false;
  }
};

// Function to fix auth issues
const fixAuth = async () => {
  fixing.value = true;
  message.value = '';
  
  try {
    const result = await fixAuthState();
    if (result) {
      message.value = 'Auth state fixed successfully!';
      messageClass.value = 'bg-green-100 text-green-700';
    } else {
      message.value = 'No auth issues fixed or detected';
      messageClass.value = 'bg-gray-100 text-gray-700';
    }
    
    // Refresh state
    await refreshState();
    
  } catch (error) {
    console.error('Error fixing auth state:', error);
    message.value = `Error: ${error.message}`;
    messageClass.value = 'bg-red-100 text-red-700';
  } finally {
    fixing.value = false;
  }
};

// Function to force refresh token
const forceRefreshToken = async () => {
  refreshing.value = true;
  message.value = '';
  
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      message.value = `Error refreshing token: ${error.message}`;
      messageClass.value = 'bg-red-100 text-red-700';
    } else if (data.session) {
      message.value = 'Token refreshed successfully!';
      messageClass.value = 'bg-green-100 text-green-700';
      authStore.token = data.session.access_token;
    } else {
      message.value = 'No session returned from refresh';
      messageClass.value = 'bg-yellow-100 text-yellow-700';
    }
    
    // Refresh state
    await refreshState();
    
  } catch (error) {
    console.error('Error refreshing token:', error);
    message.value = `Error: ${error.message}`;
    messageClass.value = 'bg-red-100 text-red-700';
  } finally {
    refreshing.value = false;
  }
};

// Function to analyze a token
const analyzeToken = (token) => {
  tokenAnalysis.value = analyzeJwt(token);
};

// Function to logout
const logoutUser = async () => {
  try {
    await authStore.logout();
    message.value = 'Logged out successfully';
    messageClass.value = 'bg-blue-100 text-blue-700';
    await refreshState();
  } catch (error) {
    console.error('Logout error:', error);
    message.value = `Error logging out: ${error.message}`;
    messageClass.value = 'bg-red-100 text-red-700';
  }
};

onMounted(async () => {
  await refreshState();
});
</script>
