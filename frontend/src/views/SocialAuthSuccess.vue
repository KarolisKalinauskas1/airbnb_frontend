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
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loading = ref(true);
const success = ref(false);
const pageTitle = ref('Processing your login...');
const statusMessage = ref('Please wait while we set up your account.');

const navigateToHome = () => {
  router.push('/');
};

onMounted(async () => {
  try {
    // Get token and data from URL
    const token = route.query.token;
    const userId = route.query.userId;
    const email = route.query.email;
    
    if (!token || !userId || !email) {
      throw new Error('Missing authentication data');
    }
    
    console.log('Social login successful, initializing session...');
    
    // Store token in localStorage
    localStorage.setItem('token', token);
    
    // Store basic user info temporarily
    localStorage.setItem('user_id', userId);
    localStorage.setItem('user_email', email);
    
    // Initialize auth store with the new token
    await authStore.initAuth({ forceRefresh: true });
    
    if (authStore.isLoggedIn) {
      success.value = true;
      pageTitle.value = 'Login Successful!';
      statusMessage.value = 'You have been successfully logged in with Google.';
    } else {
      throw new Error('Failed to initialize session');
    }
  } catch (error) {
    console.error('Social auth error:', error);
    success.value = false;
    pageTitle.value = 'Authentication Failed';
    statusMessage.value = 'We encountered an issue while signing you in. Please try again.';
  } finally {
    loading.value = false;
  }
});
</script>
