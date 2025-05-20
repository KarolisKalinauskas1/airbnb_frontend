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
onMounted(async () => {
  try {
    // Get the session from Supabase which should have been updated after OAuth redirect
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error retrieving Supabase session:', error);
      throw error;
    }
    const session = data?.session;
    if (!session) {
      console.error('No session found after Supabase OAuth flow');
      throw new Error('No session found. Authentication failed.');
    }
    // Use the user data from Supabase session
    const { user } = session;    // Log the user structure to debug
    console.log("User data:", user);
    // Make sure we have the user email
    if (!user || !user.email) {
      console.error('Missing user email in session data:', user);
      // Check if we can find the email elsewhere in the user object
      const email = user?.identities?.[0]?.identity_data?.email || 
                    user?.app_metadata?.email ||
                    user?.user_metadata?.email;
      if (email) {
        // We found an email, so we can proceed
        user.email = email;
      } else {
        throw new Error('Could not find email in user data. Authentication failed.');
      }
    }
    // Now sync this with our backend for our own JWT and user record
    try {
      const backendResponse = await axios.post('/api/auth/oauth/google/supabase-callback', {
        supabase_id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 
                  user.user_metadata?.name || 
                  user.identities?.[0]?.identity_data?.full_name || 
                  user.identities?.[0]?.identity_data?.name,
        avatar_url: user.user_metadata?.avatar_url || user.identities?.[0]?.identity_data?.avatar_url
      });
      const backendData = backendResponse.data;
      // Store our own JWT for API access
      localStorage.setItem('token', backendData.token);
      localStorage.setItem('user_id', backendData.user.user_id);
      localStorage.setItem('user_email', user.email);
      // Initialize auth store with the new token
      await authStore.initAuth({ forceRefresh: true });
      // Automatically redirect to home page after a short delay
      success.value = true;
      pageTitle.value = 'Login Successful!';
      statusMessage.value = 'You have been successfully logged in with Google. Redirecting...';
      // Redirect to home page after a short delay
      setTimeout(() => {
        router.push('/');
      }, 1500); // 1.5 second delay to show success message
    } catch (backendError) {
      console.error('Backend synchronization error:', backendError);
      throw new Error(`Backend sync failed: ${backendError.message}`);
    }
  } catch (error) {
    console.error('Social auth error:', error);
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
</script>