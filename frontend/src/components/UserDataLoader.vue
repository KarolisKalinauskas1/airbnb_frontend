<template>
  <slot :userData="userData" :loading="loading" :error="error"></slot>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

// Props
const props = defineProps({
  refreshTrigger: {
    type: Boolean,
    default: false
  }
});

// Data
const authStore = useAuthStore();
const userData = ref(null);
const loading = ref(true);
const error = ref(null);

// Load user data
async function loadUserData(forceRefresh = false) {
  loading.value = true;
  error.value = null;

  try {
    // First check if we already have user data
    if (authStore.fullUser && !forceRefresh) {
      userData.value = authStore.fullUser;
      loading.value = false;
      return;
    }
    
    // Fetch fresh user data
    await authStore.fetchFullUserInfo(true);
    userData.value = authStore.fullUser;
    
    if (!userData.value) {
      error.value = "Couldn't retrieve user data";
    }
  } catch (err) {
    console.error('Error loading user data:', err);
    error.value = err.message || 'Failed to load your profile';
  } finally {
    loading.value = false;
  }
}

// Watch for refresh trigger changes
watch(() => props.refreshTrigger, () => {
  loadUserData(true);
});

// Initial load
onMounted(() => {
  loadUserData();
});
</script>
