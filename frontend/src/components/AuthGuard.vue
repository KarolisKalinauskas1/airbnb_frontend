<template>
  <div v-if="loading" class="auth-loading">
    <div class="spinner"></div>
    <p>Checking authentication...</p>
  </div>
  <div v-else>
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ensureSessionSynchronized } from '@/utils/sessionUtils';

const props = defineProps({
  requireAuth: {
    type: Boolean,
    default: true
  },
  redirectTo: {
    type: String,
    default: '/auth'
  }
});

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(true);

onMounted(async () => {
  try {
    // Ensure session is synced
    await ensureSessionSynchronized();
    
    // Check authentication state
    if (props.requireAuth && !authStore.isLoggedIn) {
      // Need to be authenticated but not logged in
      router.push({
        path: props.redirectTo,
        query: { redirect: router.currentRoute.value.fullPath }
      });
    }
  } catch (error) {
    console.error('Auth guard error:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.auth-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: #e11d48;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
