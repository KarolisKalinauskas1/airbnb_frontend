<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
    <div class="max-w-md w-full bg-white p-8 rounded-xl shadow-md text-center">
      <div class="flex justify-center">
        <div v-if="loading" class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        <div v-else-if="success" class="text-green-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div v-else class="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>
      <h2 class="mt-6 text-center text-2xl font-extrabold text-gray-900">
        {{ pageTitle }}
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        {{ statusMessage }}
      </p>
      <div class="mt-6">
        <button 
          @click="navigateToHome" 
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Continue to Camping App
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';
import axios from '@/axios';

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const success = ref(false);
const pageTitle = ref('Processing your login...');
const statusMessage = ref('Please wait while we set up your account.');

// Simple function to go home - no need to check anything else
const navigateToHome = () => {
  router.push('/');
};

// Function to wait for Supabase session with timeout
const waitForSupabaseSession = async (maxAttempts = 10, delayMs = 500) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Checking for Supabase session, attempt ${attempt + 1}/${maxAttempts}`);
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session error:', error);
      throw error;
    }
    
    if (session) {
      console.log('✅ Session found:', session);
      return session;
    }
    
    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  throw new Error('No session found after maximum attempts');
};

onMounted(async () => {
  try {
    console.log('=== Social Auth Success - Starting ===');
    console.log('Current URL:', window.location.href);
    console.log('URL params:', window.location.search);
    console.log('URL fragment:', window.location.hash);
    
    // Check if we have OAuth tokens in the URL fragment
    const fragment = window.location.hash;
    const hasOAuthTokens = fragment.includes('access_token') || fragment.includes('id_token');
    
    if (hasOAuthTokens) {
      console.log('✅ OAuth tokens detected in URL fragment');
      statusMessage.value = 'Processing OAuth tokens...';
      
      // Wait for Supabase to process the OAuth tokens
      const session = await waitForSupabaseSession();
      
      if (session && session.user) {
        await processOAuthSuccess(session);
      } else {
        throw new Error('Session found but no user data');
      }
    } else {
      // Try to get existing session
      console.log('No OAuth tokens in URL, checking for existing session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error retrieving Supabase session:', error);
        throw error;
      }
      
      if (session && session.user) {
        console.log('✅ Existing session found');
        await processOAuthSuccess(session);
      } else {
        throw new Error('No session found. Please try logging in again.');
      }
    }
  } catch (error) {
    console.error('❌ Social auth error:', error);
    success.value = false;
    pageTitle.value = 'Authentication Failed';
    statusMessage.value = `We encountered an issue while signing you in: ${error.message}. Please try again.`;
    
    // If we're logged in with Supabase but our backend sync failed,
    // we should sign out of Supabase to prevent a state mismatch
    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.error('Failed to sign out of Supabase after error:', signOutError);
    }
  } finally {
    loading.value = false;
  }
});

const processOAuthSuccess = async (session) => {
  const { user } = session;
  
  console.log('📋 Processing user data:', user);
  
  // Validate user email
  if (!user || !user.email) {
    console.error('Missing user email in session data:', user);
    
    // Try to find email in other locations
    const email = user?.identities?.[0]?.identity_data?.email || 
                  user?.app_metadata?.email ||
                  user?.user_metadata?.email;
    
    if (email) {
      console.log('✅ Found email in alternative location:', email);
      user.email = email;
    } else {
      throw new Error('Could not find email in user data. Authentication failed.');
    }
  }
  
  // Now sync this with our backend for our own JWT and user record
  try {
    console.log('🔄 Syncing with backend...');
    statusMessage.value = 'Syncing with our servers...';
    
    const backendPayload = {
      supabase_id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || 
                user.user_metadata?.name || 
                user.identities?.[0]?.identity_data?.full_name || 
                user.identities?.[0]?.identity_data?.name,
      avatar_url: user.user_metadata?.avatar_url || user.identities?.[0]?.identity_data?.avatar_url
    };
    
    console.log('Backend payload:', backendPayload);
    
    const backendResponse = await axios.post('/api/auth/oauth/google/supabase-callback', backendPayload);
    
    console.log('✅ Backend response:', backendResponse.data);
    
    const backendData = backendResponse.data;
    
    // Store our own JWT for API access
    localStorage.setItem('token', backendData.token);
    localStorage.setItem('user_id', backendData.user.user_id);
    localStorage.setItem('user_email', user.email);
    
    console.log('✅ Tokens stored in localStorage');
    
    // Initialize auth store with the new token
    await authStore.initAuth({ forceRefresh: true });
    
    console.log('✅ Auth store initialized');
    
    // Success - show success message and redirect
    success.value = true;
    pageTitle.value = 'Login Successful!';
    statusMessage.value = 'You have been successfully logged in with Google. Redirecting...';
    
    // Redirect to home page after a short delay
    setTimeout(() => {
      console.log('🏠 Redirecting to home page...');
      router.push('/');
    }, 1500); // 1.5 second delay to show success message
    
  } catch (backendError) {
    console.error('❌ Backend synchronization error:', backendError);
    console.error('Backend error response:', backendError.response?.data);
    throw new Error(`Backend sync failed: ${backendError.response?.data?.error || backendError.message}`);
  }
};
</script>